package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

type fakeUI struct {
	mu    sync.Mutex
	notes []string
	state int
	tip   string
}

func (f *fakeUI) Notify(t, b string, sev bool) {
	f.mu.Lock()
	f.notes = append(f.notes, t+" | "+b)
	f.mu.Unlock()
}
func (f *fakeUI) SetRouterState(s int, tip string) { f.state, f.tip = s, tip }

type memCreds struct{ user, pw string }

func (m *memCreds) Load(string) (string, string, bool) { return m.user, m.pw, m.pw != "" }
func (m *memCreds) Save(_, u, p string) error          { m.user, m.pw = u, p; return nil }
func (m *memCreds) Delete(string)                      { m.pw = "" }

type mockRouter struct {
	apMode     bool // VPN client API unavailable, as on an access point
	stats      string
	logins     int
	badLogins  int
	clientsRes string
	noRH       bool   // Router Home not installed
	sysStatus  string // system.get_status reply
	updStatus  string
}

func (m *mockRouter) handler(t *testing.T) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/ping.svg" {
			w.Write([]byte("<svg/>"))
			return
		}
		body, _ := io.ReadAll(r.Body)
		var req struct {
			Method string          `json:"method"`
			Params json.RawMessage `json:"params"`
		}
		json.Unmarshal(body, &req)
		reply := func(res string) { w.Write([]byte(`{"jsonrpc":"2.0","id":1,"result":` + res + `}`)) }
		switch req.Method {
		case "challenge":
			reply(`{"alg":5,"salt":"Xy12abcd","nonce":"N0NCE"}`)
		case "login":
			var p map[string]string
			json.Unmarshal(req.Params, &p)
			cipher, _ := Crypt("s3cret", "$5$Xy12abcd$")
			s := sha256.Sum256([]byte("root:" + cipher + ":N0NCE"))
			if p["hash"] != hex.EncodeToString(s[:]) {
				m.badLogins++
				w.Write([]byte(`{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"Access denied"}}`))
				return
			}
			m.logins++
			reply(`{"sid":"SID123"}`)
		case "alive":
			reply(`{}`)
		case "call":
			var p []json.RawMessage
			json.Unmarshal(req.Params, &p)
			key := jsonString(p[1]) + "." + jsonString(p[2])
			if m.noRH && strings.HasPrefix(key, "machome.") {
				w.Write([]byte(`{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"Access denied"}}`))
				return
			}
			switch key {
			case "system.get_status":
				reply(m.sysStatus)
			case "machome.upd_status":
				if m.updStatus == "" {
					reply(`{}`)
				} else {
					reply(m.updStatus)
				}
			case "machome.get_stats":
				reply(m.stats)
			case "machome.get_vpn_providers":
				reply(`{"groups":{"7":"Mullvad"}}`)
			case "vpn-client.get_status":
				if m.apMode {
					w.Write([]byte(`{"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"Method not found"}}`))
					return
				}
				reply(`{"status_list":[{"via":"wgclient1","group_id":7,"name":"Chicago"}]}`)
			case "clients.get_list":
				reply(m.clientsRes)
			default:
				reply(`{}`)
			}
		}
	}
}

func TestRouterFlow(t *testing.T) {
	if err := cryptSelfTest(); err != nil {
		t.Fatal(err)
	}
	m := &mockRouter{
		stats:      `{"live":{"time":10000,"dns":{"server":"1.1.1.1"},"sec":[{"id":"fw","label":"Firewall","ok":true}],"seen":{"aa:bb:cc:dd:ee:ff":100},"x":{"inc":{"wan_since":9000,"vpn":{"wgclient1":{"since":9500}}}}},"temps":[{"temp":60}]}`,
		clientsRes: `{"clients":[{"mac":"11:22:33:44:55:66","name":"Pixel-8"}]}`,
	}
	srv := httptest.NewTLSServer(m.handler(t))
	defer srv.Close()
	host := strings.TrimPrefix(srv.URL, "https://")

	fp, err := ProbeCertificate(host)
	if err != nil || len(fp) != 64 {
		t.Fatalf("probe: %v %q", err, fp)
	}
	t.Logf("fingerprint %s", PrettyFingerprint(fp)[:23])

	// Unpinned client must refuse.
	if err := NewGlClient(host, "").Login("root", "s3cret"); err == nil {
		t.Fatal("unpinned login should fail")
	}
	// Wrong pin => cert changed.
	err = NewGlClient(host, strings.Repeat("A", 64)).Login("root", "s3cret")
	if _, ok := err.(*CertChangedError); !ok {
		t.Fatalf("expected cert changed, got %T %v", err, err)
	}
	// Wrong password.
	err = NewGlClient(host, fp).Login("root", "nope")
	if le, ok := err.(*LoginError); !ok || le.Msg != "Wrong username or password." {
		t.Fatalf("expected wrong password, got %v", err)
	}

	ui := &fakeUI{}
	s := &RouterSettings{Host: host, Username: "root", PinnedCertSha256: fp, Notifications: true}
	creds := &memCreds{user: "root", pw: "s3cret"}
	rs := NewRouterService("Brume 3", s, creds, ui)

	rs.Poll(false)
	t.Logf("first poll: state=%d tip=%q notes=%v", ui.state, ui.tip, ui.notes)
	if ui.state != 2 || len(ui.notes) != 1 || !strings.Contains(ui.notes[0], "2 problems") {
		t.Fatalf("unexpected first poll result")
	}
	if !strings.Contains(ui.notes[0], "VPN Mullvad (Chicago) is down") {
		t.Fatalf("vpn naming wrong: %v", ui.notes)
	}

	// WAN recovers, a new device appears, router gets hot, firmware available.
	m.stats = `{"live":{"time":12000,"seen":{"aa:bb:cc:dd:ee:ff":100,"11:22:33:44:55:66":11990},"x":{"inc":{"vpn":{"wgclient1":{"since":9500}},"temp_limit":150},"fw":{"new":"4.8.2"}}},"temps":[{"temp":70}]}`
	ui.notes = nil
	rs.Poll(false)
	t.Logf("second poll: state=%d tip=%q", ui.state, ui.tip)
	for _, n := range ui.notes {
		t.Log("  ", n)
	}
	joined := strings.Join(ui.notes, "\n")
	for _, want := range []string{"Brume 3 is running hot: 158°F", "Resolved: Internet is down | Recovered after 50 min.", "New device joined your network | Pixel-8", "Firmware 4.8.2 is available"} {
		if !strings.Contains(joined, want) {
			t.Errorf("missing %q", want)
		}
	}
	if m.logins != 1 {
		t.Errorf("expected session reuse, got %d logins", m.logins)
	}

	// Firmware notice only once; all clear -> green.
	m.stats = `{"live":{"time":13000,"x":{"fw":{"new":"4.8.2"}}},"temps":[]}`
	ui.notes = nil
	rs.Poll(true)
	t.Logf("third poll: state=%d tip=%q notes=%v", ui.state, ui.tip, ui.notes)
	if ui.state != 0 || strings.Contains(strings.Join(ui.notes, ""), "Firmware") {
		t.Errorf("unexpected third poll")
	}

	// Bad saved password must not retry endlessly.
	creds.pw = "wrong"
	rs.ForgetLogin()
	creds.pw = "wrong"
	before := m.badLogins
	rs.Poll(false)
	rs.Poll(false)
	if m.badLogins-before != 1 {
		t.Errorf("expected exactly one bad login attempt, got %d", m.badLogins-before)
	}
	t.Logf("after bad password: tip=%q notes=%v", ui.tip, ui.notes[len(ui.notes)-1:])
}

func TestFlintAccessPoint(t *testing.T) {
	m := &mockRouter{apMode: true,
		stats: `{"live":{"time":5000},"x":{"inc":{"dns_since":4900}},"temps":[{"temp":55}]}`}
	srv := httptest.NewTLSServer(m.handler(t))
	defer srv.Close()
	host := strings.TrimPrefix(srv.URL, "https://")
	fp, _ := ProbeCertificate(host)

	ui := &fakeUI{}
	// trusted list: an old certificate plus the current one
	s := &RouterSettings{Host: host, Username: "root", PinnedCertSha256: strings.Repeat("B", 64) + "," + fp, Notifications: true}
	rs := NewRouterService("Flint 3", s, &memCreds{user: "root", pw: "s3cret"}, ui)
	rs.Poll(false)
	t.Logf("state=%d tip=%q notes=%v", ui.state, ui.tip, ui.notes)
	if ui.state != 2 || ui.tip != "Flint 3 · DNS is not responding" {
		t.Fatalf("access-point poll should still report problems, got state=%d tip=%q", ui.state, ui.tip)
	}
	m.stats = `{"live":{"time":5100},"x":{"inc":{}},"temps":[]}`
	ui.notes = nil
	rs.Poll(false)
	if ui.state != 0 || ui.tip != "Flint 3 · all good" || len(ui.notes) != 1 || !strings.HasPrefix(ui.notes[0], "Resolved: DNS") {
		t.Fatalf("expected all good + resolved note, got state=%d tip=%q notes=%v", ui.state, ui.tip, ui.notes)
	}
	// never signed in: grey, no alert
	ui2 := &fakeUI{}
	NewRouterService("Flint 3", &RouterSettings{Host: host, Username: "root", PinnedCertSha256: fp}, &memCreds{}, ui2).Poll(false)
	if ui2.state != -1 || len(ui2.notes) != 0 {
		t.Fatalf("unsigned router should be grey and quiet, got state=%d notes=%v", ui2.state, ui2.notes)
	}
	if !FingerprintIn("aa,"+fp, strings.ToLower(fp)) || FingerprintIn("", fp) || FingerprintIn(fp, "") {
		t.Fatal("FingerprintIn")
	}
}

func TestRouterHomeExtras(t *testing.T) {
	m := &mockRouter{updStatus: `{"ok":true,"current":"2.7.0"}`,
		stats: `{"live":{"time":20000,"x":{"inc":{"failover":{"wgclient1":"wgclient2"},"ping_high":{"since":19900,"ms":142,"limit":100}},
			"vuln":{"problems":1,"worst":"update","top":{"title":"GL-2026-11-20 cloud management","status":"update"}}}},"temps":[]}`}
	srv := httptest.NewTLSServer(m.handler(t))
	defer srv.Close()
	host := strings.TrimPrefix(srv.URL, "https://")
	fp, _ := ProbeCertificate(host)
	ui := &fakeUI{}
	rs := NewRouterService("Brume 3", &RouterSettings{Host: host, Username: "root", PinnedCertSha256: fp, Notifications: true}, &memCreds{user: "root", pw: "s3cret"}, ui)
	rs.Poll(false)
	joined := strings.Join(ui.notes, "\n")
	t.Logf("state=%d tip=%q notes=%v", ui.state, ui.tip, ui.notes)
	for _, want := range []string{"3 problems", "VPN failover: Mullvad (Chicago) → wgclient2", "High internet ping: 142 ms", "Firmware security update needed"} {
		if !strings.Contains(joined, want) {
			t.Errorf("missing %q", want)
		}
	}
	if ui.state != 1 {
		t.Errorf("only warnings: want orange, got %d", ui.state)
	}
	if st, v := rs.RouterHome(); st != 1 || v != "2.7.0" {
		t.Errorf("router home = %d %q", st, v)
	}
	m.stats = `{"live":{"time":20600,"x":{"inc":{},"vuln":{"problems":1,"worst":"infected","top":{"title":"Bad thing","reset":true}}}},"temps":[]}`
	ui.notes = nil
	rs.Poll(false)
	joined = strings.Join(ui.notes, "\n")
	t.Logf("notes=%v", ui.notes)
	if !strings.Contains(joined, "Signs of infection found | Bad thing Factory reset recommended") || !strings.Contains(joined, "Resolved: High internet ping: 142 ms | Recovered after 11 min.") || ui.state != 2 {
		t.Errorf("second poll wrong: state=%d", ui.state)
	}
}

func TestRouterWithoutRouterHome(t *testing.T) {
	m := &mockRouter{noRH: true, sysStatus: `{"network":[{"interface":"wan","up":true,"online":true},{"interface":"wwan","up":false,"online":false}]}`}
	srv := httptest.NewTLSServer(m.handler(t))
	defer srv.Close()
	host := strings.TrimPrefix(srv.URL, "https://")
	fp, _ := ProbeCertificate(host)
	ui := &fakeUI{}
	rs := NewRouterService("Beryl", &RouterSettings{Host: host, Username: "root", PinnedCertSha256: fp, Notifications: true}, &memCreds{user: "root", pw: "s3cret"}, ui)
	rs.Poll(false)
	if ui.state != 0 || ui.tip != "Beryl · online" || len(ui.notes) != 0 {
		t.Fatalf("basic poll: state=%d tip=%q notes=%v", ui.state, ui.tip, ui.notes)
	}
	if st, _ := rs.RouterHome(); st != 2 {
		t.Fatalf("router home state %d", st)
	}
	m.sysStatus = `{"network":[{"interface":"wan","up":true,"online":false}]}`
	rs.Poll(false)
	if ui.state != 2 || len(ui.notes) != 1 || !strings.HasPrefix(ui.notes[0], "Internet is down") {
		t.Fatalf("offline: state=%d notes=%v", ui.state, ui.notes)
	}
	m.sysStatus = `{"network":[{"interface":"wan","up":true,"online":true}]}`
	rs.Poll(false)
	if ui.state != 0 || len(ui.notes) != 2 || !strings.HasPrefix(ui.notes[1], "Resolved: Internet is down") {
		t.Fatalf("back online: state=%d notes=%v", ui.state, ui.notes)
	}
	if m.logins != 1 {
		t.Fatalf("basic mode should keep its session, logins=%d", m.logins)
	}
}
