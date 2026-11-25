package main

// PIN lock: the PIN is stored only as a salted PBKDF2-SHA256 hash, and wrong
// guesses are slowed down (the delay survives restarts).

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"time"
)

const (
	pinMinLen = 4
	pinMaxLen = 8
	pinIter   = 200_000
	freeTries = 5 // wrong PINs allowed before delays start
	baseDelay = 30 * time.Second
	maxDelay  = 15 * time.Minute
)

type PinState struct {
	Salt      string `json:"pinSalt,omitempty"`
	Hash      string `json:"pinHash,omitempty"`
	Iter      int    `json:"pinIter,omitempty"`
	Failures  int    `json:"pinFailures,omitempty"`
	WaitUntil int64  `json:"pinWaitUntil,omitempty"` // unix seconds
}

func (p *PinState) IsSet() bool { return p.Hash != "" && p.Salt != "" && p.Iter > 0 }

func validPin(pin string) error {
	if len(pin) < pinMinLen || len(pin) > pinMaxLen {
		return errors.New("Use 4 to 8 digits.")
	}
	for _, c := range pin {
		if c < '0' || c > '9' {
			return errors.New("Use digits only.")
		}
	}
	return nil
}

func derivePin(pin string, salt []byte, iter int) []byte {
	k, _ := pbkdf2.Key(sha256.New, pin, salt, iter, 32)
	return k
}

// Set stores a new PIN and clears any failure history.
func (p *PinState) Set(pin string) error {
	if err := validPin(pin); err != nil {
		return err
	}
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return err
	}
	p.Salt = hex.EncodeToString(salt)
	p.Iter = pinIter
	p.Hash = hex.EncodeToString(derivePin(pin, salt, pinIter))
	p.Failures, p.WaitUntil = 0, 0
	return nil
}

// Wait returns how long until another guess is allowed (0 if now).
func (p *PinState) Wait(now time.Time) time.Duration {
	if p.WaitUntil == 0 {
		return 0
	}
	d := time.Unix(p.WaitUntil, 0).Sub(now)
	if d < 0 {
		return 0
	}
	return d
}

// Check verifies a PIN. It records failures and returns the delay before the
// next guess is allowed. ok is false while a delay is still running.
func (p *PinState) Check(pin string, now time.Time) (ok bool, wait time.Duration) {
	if w := p.Wait(now); w > 0 {
		return false, w
	}
	salt, err1 := hex.DecodeString(p.Salt)
	want, err2 := hex.DecodeString(p.Hash)
	if err1 != nil || err2 != nil || !p.IsSet() {
		return false, 0
	}
	if subtle.ConstantTimeCompare(derivePin(pin, salt, p.Iter), want) == 1 {
		p.Failures, p.WaitUntil = 0, 0
		return true, 0
	}
	p.Failures++
	if p.Failures >= freeTries {
		d := baseDelay << uint(p.Failures-freeTries)
		if d > maxDelay || d <= 0 {
			d = maxDelay
		}
		p.WaitUntil = now.Add(d).Unix()
		return false, d
	}
	return false, 0
}

// Clear removes the PIN entirely.
func (p *PinState) Clear() { *p = PinState{} }
