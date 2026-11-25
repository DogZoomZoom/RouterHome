package main

// GL.iNet 4.x JSON-RPC client with certificate pinning (ported from Router Home).

import (
	"bytes"
	"crypto/md5"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

type LoginError struct {
	Msg    string
	Locked bool
}

func (e *LoginError) Error() string { return e.Msg }

type CertChangedError struct{ Seen string }

func (e *CertChangedError) Error() string { return "certificate changed" }

var errCertNotPinned = errors.New("certificate not trusted")

// FingerprintIn reports whether fp is one of the comma-separated fingerprints
// in list (a router may present more than one certificate).
func FingerprintIn(list, fp string) bool {
	if fp == "" {
		return false
	}
	for _, f := range strings.Split(list, ",") {
		if strings.EqualFold(strings.TrimSpace(f), fp) {
			return true
		}
	}
	return false
}

func Fingerprint(der []byte) string {
	sum := sha256.Sum256(der)
	return strings.ToUpper(hex.EncodeToString(sum[:]))
}

// PrettyFingerprint formats AB12CD... as AB:12:CD:...
func PrettyFingerprint(hexs string) string {
	var parts []string
	for i := 0; i+2 <= len(hexs); i += 2 {
		parts = append(parts, hexs[i:i+2])
	}
	return strings.Join(parts, ":")
}

type GlClient struct {
	Host   string
	Pinned string
	Sid    string

	mu       sync.Mutex
	lastSeen string
	http     *http.Client
	id       int
}

func NewGlClient(host, pinned string) *GlClient {
	c := &GlClient{Host: strings.TrimSpace(host), Pinned: pinned}
	tr := &http.Transport{
		Proxy: nil,
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // verified below against the pinned fingerprint
			VerifyConnection: func(cs tls.ConnectionState) error {
				if len(cs.PeerCertificates) == 0 {
					return errCertNotPinned
				}
				fp := Fingerprint(cs.PeerCertificates[0].Raw)
				c.mu.Lock()
				c.lastSeen = fp
				c.mu.Unlock()
				if !FingerprintIn(c.Pinned, fp) {
					return errCertNotPinned
				}
				return nil
			},
		},
		TLSHandshakeTimeout: 10 * time.Second,
		IdleConnTimeout:     60 * time.Second,
	}
	c.http = &http.Client{Transport: tr, Timeout: 20 * time.Second}
	return c
}

func (c *GlClient) LastSeen() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.lastSeen
}

func (c *GlClient) Close() { c.http.CloseIdleConnections() }

func (c *GlClient) raw(method string, params interface{}) (json.RawMessage, error) {
	c.mu.Lock()
	c.id++
	id := c.id
	c.mu.Unlock()
	body, _ := json.Marshal(map[string]interface{}{"jsonrpc": "2.0", "id": id, "method": method, "params": params})
	resp, err := c.http.Post("https://"+c.Host+"/rpc", "application/json", bytes.NewReader(body))
	if err != nil {
		seen := c.LastSeen()
		if c.Pinned != "" && seen != "" && !FingerprintIn(c.Pinned, seen) {
			return nil, &CertChangedError{Seen: seen}
		}
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, err
	}
	var r struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Message string          `json:"message"`
			Data    json.RawMessage `json:"data"`
		} `json:"error"`
	}
	if err := json.Unmarshal(data, &r); err != nil {
		return nil, fmt.Errorf("unexpected reply from router: %v", err)
	}
	if r.Error != nil {
		msg := r.Error.Message
		if strings.Contains(strings.ToLower(msg), "over limit") {
			var d struct {
				Wait json.Number `json:"wait"`
			}
			_ = json.Unmarshal(r.Error.Data, &d)
			s := "Too many failed logins. The router is locked"
			if d.Wait.String() == "" {
				s += " for a few minutes"
			} else {
				s += " for " + d.Wait.String() + " seconds"
			}
			return nil, &LoginError{Msg: s + ".", Locked: true}
		}
		if msg == "Access denied" {
			return nil, &LoginError{Msg: "Access denied"}
		}
		if msg == "" {
			msg = "router error"
		}
		return nil, errors.New(msg)
	}
	return r.Result, nil
}

func jsonString(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	return strings.TrimSpace(string(raw))
}

func (c *GlClient) Login(user, password string) error {
	res, err := c.raw("challenge", map[string]string{"username": user})
	if err != nil {
		return err
	}
	var ch map[string]json.RawMessage
	if json.Unmarshal(res, &ch) != nil || ch == nil {
		return errors.New("The router didn't answer the login challenge.")
	}
	alg, salt, nonce := jsonString(ch["alg"]), jsonString(ch["salt"]), jsonString(ch["nonce"])
	cipher, err := Crypt(password, "$"+alg+"$"+salt+"$")
	if err != nil {
		return err
	}
	payload := user + ":" + cipher + ":" + nonce
	var hash string
	if alg == "1" {
		s := md5.Sum([]byte(payload))
		hash = hex.EncodeToString(s[:])
	} else {
		s := sha256.Sum256([]byte(payload))
		hash = hex.EncodeToString(s[:])
	}
	res, err = c.raw("login", map[string]string{"username": user, "hash": hash})
	if err != nil {
		var le *LoginError
		if errors.As(err, &le) && !le.Locked {
			return &LoginError{Msg: "Wrong username or password."}
		}
		return err
	}
	var lr struct {
		Sid string `json:"sid"`
	}
	_ = json.Unmarshal(res, &lr)
	if lr.Sid == "" {
		return errors.New("Login failed (no session returned).")
	}
	c.Sid = lr.Sid
	return nil
}

func (c *GlClient) Alive() bool {
	if c.Sid == "" {
		return false
	}
	_, err := c.raw("alive", map[string]string{"sid": c.Sid})
	return err == nil
}

func (c *GlClient) Call(obj, method string, params interface{}) (json.RawMessage, error) {
	if params == nil {
		params = map[string]interface{}{}
	}
	return c.raw("call", []interface{}{c.Sid, obj, method, params})
}

// ProbeCertificate connects without trusting anything and returns the router's
// certificate fingerprint.
func ProbeCertificate(host string) (string, error) {
	var fp string
	cl := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			Proxy: nil,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
				VerifyPeerCertificate: func(raw [][]byte, _ [][]*x509.Certificate) error {
					if len(raw) > 0 {
						fp = Fingerprint(raw[0])
					}
					return nil
				},
			},
		},
	}
	resp, err := cl.Get("https://" + strings.TrimSpace(host) + "/ping.svg")
	if resp != nil {
		resp.Body.Close()
	}
	if fp != "" {
		return fp, nil
	}
	if err == nil {
		err = errors.New("no certificate")
	}
	return "", err
}
