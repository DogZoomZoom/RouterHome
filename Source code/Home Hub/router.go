package main

// Router session management and background health monitoring
// (behaviour ported from Router Home's TrayApp).

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// RouterUI is implemented by the app; every method may be called from any goroutine.
type RouterUI interface {
	Notify(title, body string, severe bool)
	SetRouterState(state int, tip string) // 0 ok, 1 warning, 2 problem/offline, -1 unknown
}

type CredStore interface {
	Load(host string) (user, password string, ok bool)
	Save(host, user, password string) error
	Delete(host string)
}

type SessionResult int

const (
	SessionOK SessionResult = iota
	SessionLocked
	SessionNeedsSignIn
	SessionUnreachable
)

type alert struct {
	Title  string
	Body   string
	Severe bool
	Since  int64
}

type RouterService struct {
	nameV atomic.Value // string shown in alerts and tooltips, e.g. "Brume 3"

	mu       sync.Mutex
	pollMu   sync.Mutex
	settings *RouterSettings
	creds    CredStore
	ui       RouterUI

	client      *GlClient
	password    string
	lockedUntil time.Time
	loginBroken bool

	active        map[string]alert
	notifiedSoft  map[string]bool
	firstPoll     bool
	failCount     int
	lastSeenCheck int64
	providers     map[string]string
	providersAt   time.Time

	rhState   int // Router Home on this router: 0 not known yet, 1 installed, 2 not installed
	rhVersion string
	rhAt      time.Time
}

// RouterHome reports whether the router runs Router Home (the Home tab
// add-on) and which version: state 0 = not known yet, 1 = yes, 2 = no.
func (r *RouterService) RouterHome() (state int, version string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.rhState, r.rhVersion
}

func NewRouterService(name string, s *RouterSettings, creds CredStore, ui RouterUI) *RouterService {
	r := &RouterService{
		settings:     s,
		creds:        creds,
		ui:           ui,
		active:       map[string]alert{},
		notifiedSoft: map[string]bool{},
		firstPoll:    true,
		providers:    map[string]string{},
	}
	r.nameV.Store(name)
	return r
}

func (r *RouterService) name() string { s, _ := r.nameV.Load().(string); return s }

// SetName renames the router (the tab was renamed).
func (r *RouterService) SetName(n string) { r.nameV.Store(n) }

func (r *RouterService) Configured() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return strings.TrimSpace(r.settings.Host) != ""
}

func (r *RouterService) Settings() RouterSettings {
	r.mu.Lock()
	defer r.mu.Unlock()
	return *r.settings
}

// Sid returns the current session id (empty if none).
func (r *RouterService) Sid() string {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.client == nil {
		return ""
	}
	return r.client.Sid
}

func (r *RouterService) InvalidateSession() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.client != nil {
		r.client.Close()
	}
	r.client = nil
}

// EnsureSession makes sure there is a working session. It never shows UI;
// it reports what the caller should do instead.
func (r *RouterService) EnsureSession() (SessionResult, string) {
	r.mu.Lock()
	c := r.client
	r.mu.Unlock()
	if c != nil && c.Sid != "" && c.Alive() {
		return SessionOK, ""
	}

	r.mu.Lock()
	if time.Now().Before(r.lockedUntil) {
		r.mu.Unlock()
		return SessionLocked, "The " + r.name() + " is temporarily locked after too many failed logins. Try again in a few minutes."
	}
	host, user, pinned := r.settings.Host, r.settings.Username, r.settings.PinnedCertSha256
	pw := r.password
	broken := r.loginBroken
	r.mu.Unlock()

	if strings.TrimSpace(host) == "" {
		return SessionNeedsSignIn, ""
	}
	if pw == "" {
		if _, p, ok := r.creds.Load(host); ok {
			pw = p
		}
	}
	if pw == "" || broken {
		msg := ""
		if broken {
			msg = "Your saved password didn't work. Please sign in again."
		}
		return SessionNeedsSignIn, msg
	}

	nc := NewGlClient(host, pinned)
	err := nc.Login(user, pw)
	if err == nil {
		r.mu.Lock()
		if r.client != nil {
			r.client.Close()
		}
		r.client = nc
		r.password = pw
		r.loginBroken = false
		r.mu.Unlock()
		return SessionOK, ""
	}
	nc.Close()

	var le *LoginError
	var ce *CertChangedError
	switch {
	case errors.As(err, &le):
		r.mu.Lock()
		if le.Locked {
			r.lockedUntil = time.Now().Add(10 * time.Minute)
			r.mu.Unlock()
			return SessionLocked, le.Msg
		}
		r.loginBroken = true
		r.mu.Unlock()
		return SessionNeedsSignIn, "Your saved password didn't work. Please sign in again."
	case errors.As(err, &ce):
		return SessionNeedsSignIn, "The " + r.name() + "'s security certificate has changed. Please confirm and sign in again."
	}
	return SessionUnreachable, "Can't reach the " + r.name() + " at " + host + ". Make sure this PC is on your home network."
}

// AdoptSession installs a client produced by a successful interactive sign-in.
func (r *RouterService) AdoptSession(c *GlClient, password string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.client != nil && r.client != c {
		r.client.Close()
	}
	r.client = c
	r.password = password
	r.loginBroken = false
	r.lockedUntil = time.Time{}
}

func (r *RouterService) ForgetLogin() {
	r.mu.Lock()
	host := r.settings.Host
	r.password = ""
	r.mu.Unlock()
	r.creds.Delete(host)
	r.InvalidateSession()
}

func num(raw json.RawMessage) int64 {
	if len(raw) == 0 {
		return 0
	}
	var f float64
	if json.Unmarshal(raw, &f) == nil {
		return int64(f)
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		n, _ := strconv.ParseFloat(strings.TrimSpace(s), 64)
		return int64(n)
	}
	return 0
}

type jobj = map[string]json.RawMessage

func obj(raw json.RawMessage) jobj {
	var m jobj
	if len(raw) == 0 || json.Unmarshal(raw, &m) != nil {
		return nil
	}
	return m
}

func arr(raw json.RawMessage) []json.RawMessage {
	var a []json.RawMessage
	if len(raw) == 0 || json.Unmarshal(raw, &a) != nil {
		return nil
	}
	return a
}

func isScalar(raw json.RawMessage) bool {
	s := strings.TrimSpace(string(raw))
	return s != "" && s != "null" && s[0] != '{' && s[0] != '['
}

// Poll checks the router once and raises desktop alerts for changes.
func (r *RouterService) Poll(manual bool) {
	if !r.pollMu.TryLock() {
		return
	}
	defer r.pollMu.Unlock()
	if !r.Configured() {
		r.ui.SetRouterState(-1, r.name()+" · not signed in")
		return
	}

	res, _ := r.EnsureSession()
	if res == SessionNeedsSignIn {
		r.mu.Lock()
		broken := r.loginBroken
		r.mu.Unlock()
		if !broken {
			// Never signed in (no saved password): nothing is wrong yet.
			r.ui.SetRouterState(-1, r.name()+" · not signed in")
			return
		}
	}
	if res != SessionOK {
		r.mu.Lock()
		r.failCount++
		fc := r.failCount
		broken := r.loginBroken
		host := r.settings.Host
		alerts := r.settings.Notifications
		r.mu.Unlock()
		if fc == 3 && alerts && !broken {
			r.ui.Notify("Can't reach your "+r.name(), "Home Hub can't connect to "+host+".", true)
		}
		if broken && fc == 1 && alerts {
			r.ui.Notify(r.name()+" needs you to sign in", "The saved password didn't work. Open Home Hub's "+r.name()+" tab to sign in again.", true)
		}
		tip := r.name() + " · can't connect"
		if broken || res == SessionNeedsSignIn {
			tip = r.name() + " · sign in needed"
		}
		r.ui.SetRouterState(2, tip)
		return
	}
	r.mu.Lock()
	if r.failCount >= 3 {
		host := r.settings.Host
		r.mu.Unlock()
		r.ui.Notify(r.name()+" is reachable again", "Home Hub reconnected to "+host+".", false)
		r.mu.Lock()
	}
	r.failCount = 0
	c := r.client
	r.mu.Unlock()
	if c == nil {
		return
	}

	if err := r.pollOnce(c, manual); err != nil {
		r.InvalidateSession()
		r.ui.SetRouterState(1, r.name()+" · can't read status")
	}
}

func (r *RouterService) pollOnce(c *GlClient, manual bool) error {
	statsRaw, err := c.Call("machome", "get_stats", nil)
	if err != nil {
		// No Router Home on this router (or the session ended): fall back to
		// GL.iNet's own status call, which every 4.x firmware has.
		if berr := r.basicPoll(c, manual); berr == nil {
			return nil
		}
		return err
	}
	stats := obj(statsRaw)
	live := obj(stats["live"])
	x := obj(live["x"]) // Router Home keeps its extras inside the sampler's live data
	if x == nil {
		x = obj(stats["x"])
	}
	inc := obj(x["inc"])
	now := num(live["time"])
	if now == 0 {
		now = time.Now().Unix()
	}

	r.mu.Lock()
	r.rhState = 1
	needProviders := time.Since(r.providersAt) > 10*time.Minute
	needVersion := time.Since(r.rhAt) > 6*time.Hour
	r.mu.Unlock()
	if needVersion {
		v := ""
		if us, err := c.Call("machome", "upd_status", nil); err == nil { // Router Home 2.6+
			v = jsonString(obj(us)["current"])
		}
		r.mu.Lock()
		r.rhVersion, r.rhAt = v, time.Now()
		r.mu.Unlock()
	}
	if needProviders {
		pr, _ := c.Call("machome", "get_vpn_providers", nil) // optional
		m := map[string]string{}
		for k, v := range obj(obj(pr)["groups"]) {
			m[k] = jsonString(v)
		}
		r.mu.Lock()
		r.providers = m
		r.providersAt = time.Now()
		r.mu.Unlock()
	}

	vs, _ := c.Call("vpn-client", "get_status", nil) // optional (e.g. access-point mode)
	names := map[string]string{}
	r.mu.Lock()
	providers := r.providers
	r.mu.Unlock()
	for _, it := range arr(obj(vs)["status_list"]) {
		o := obj(it)
		via := jsonString(o["via"])
		if via == "" {
			continue
		}
		label := jsonString(o["name"])
		if p, ok := providers[jsonString(o["group_id"])]; ok && p != "" {
			if label != "" {
				label = p + " (" + label + ")"
			} else {
				label = p
			}
		}
		names[via] = label
	}
	tunnel := func(via, fallback string) string {
		if l := names[via]; l != "" {
			return l
		}
		if fallback != "" {
			return fallback
		}
		return via
	}

	cur := map[string]alert{}
	if isScalar(inc["wan_since"]) {
		cur["wan"] = alert{"Internet is down", "Your router can't reach the internet.", true, num(inc["wan_since"])}
	}
	if isScalar(inc["dns_since"]) {
		server := jsonString(obj(live["dns"])["server"])
		if server == "" {
			server = "Your DNS server"
		}
		cur["dns"] = alert{"DNS is not responding", server + " isn't answering. Websites won't load.", true, num(inc["dns_since"])}
	}
	for k, v := range obj(inc["vpn"]) {
		label := tunnel(k, jsonString(obj(v)["label"]))
		cur["vpn-"+k] = alert{"VPN " + label + " is down", "Devices on this tunnel may have no internet.", true, num(obj(v)["since"])}
	}
	for k, v := range obj(inc["failover"]) {
		from, to := tunnel(k, ""), tunnel(jsonString(v), "")
		cur["fo-"+k] = alert{"VPN failover: " + from + " → " + to, "Devices on " + from + " were moved to " + to + " until it recovers. They stay on the VPN.", false, 0}
	}
	if ph := obj(inc["ping_high"]); ph != nil {
		body := "Calls and games may lag."
		if l := num(ph["limit"]); l > 0 {
			body = fmt.Sprintf("Above your %d ms limit. Calls and games may lag.", l)
		}
		cur["ping"] = alert{fmt.Sprintf("High internet ping: %d ms", num(ph["ms"])), body, false, num(ph["since"])}
	}
	if v := obj(x["vuln"]); v != nil && num(v["problems"]) > 0 {
		worst := jsonString(v["worst"])
		if title, severe := vulnTitle(worst); title != "" {
			top := obj(v["top"])
			body := jsonString(top["title"])
			if body == "" {
				body = "See the Security card on the Home tab."
			}
			if b, _ := json.Marshal(true); string(top["reset"]) == string(b) {
				body += " Factory reset recommended: see the Security card."
			}
			cur["vuln-"+worst] = alert{title, body, severe, 0}
		}
	}

	maxC := 0.0
	for _, t := range arr(stats["temps"]) {
		var tv struct {
			Temp *float64 `json:"temp"`
		}
		if json.Unmarshal(t, &tv) == nil && tv.Temp != nil && *tv.Temp > maxC {
			maxC = *tv.Temp
		}
	}
	tempF := int64(maxC*9/5 + 32 + 0.5)
	limit := num(inc["temp_limit"])
	if limit == 0 {
		limit = 185
	}
	if maxC > 0 && tempF >= limit {
		title := fmt.Sprintf("%s is running hot: %d°F", r.name(), tempF)
		if tempF >= limit+10 {
			title = fmt.Sprintf("%s is overheating: %d°F", r.name(), tempF)
		}
		cur["temp"] = alert{title, fmt.Sprintf("Above your %d°F limit.", limit), tempF >= limit+10, num(inc["temp_since"])}
	}

	for _, s := range arr(live["sec"]) {
		o := obj(s)
		if o == nil {
			continue
		}
		var ok *bool
		_ = json.Unmarshal(o["ok"], &ok)
		if ok != nil && !*ok {
			cur["sec-"+jsonString(o["id"])] = alert{"Security: " + jsonString(o["label"]) + " failed", jsonString(o["detail"]), true, 0}
		}
	}

	first := r.applyAlerts(cur, now)
	notify := r.notifier()

	// New devices
	if seen := obj(live["seen"]); seen != nil {
		r.mu.Lock()
		last := r.lastSeenCheck
		r.mu.Unlock()
		var freshMacs []string
		for mac, ts := range seen {
			t := num(ts)
			if t > 0 && t > last && now-t < 86400 {
				freshMacs = append(freshMacs, strings.ToUpper(mac))
			}
		}
		if !first && len(freshMacs) > 0 {
			var devNames []string
			if cl, err := c.Call("clients", "get_list", nil); err == nil {
				want := map[string]bool{}
				for _, m := range freshMacs {
					want[m] = true
				}
				for _, it := range arr(obj(cl)["clients"]) {
					o := obj(it)
					if !want[strings.ToUpper(jsonString(o["mac"]))] {
						continue
					}
					n := jsonString(o["alias"])
					if n == "" {
						n = jsonString(o["name"])
					}
					if n == "" {
						n = "Unknown device"
					}
					devNames = append(devNames, n)
				}
			}
			title := "New device joined your network"
			if len(freshMacs) > 1 {
				title = strconv.Itoa(len(freshMacs)) + " new devices joined"
			}
			who := "Unknown device"
			if len(devNames) > 0 {
				who = strings.Join(devNames, ", ")
			}
			notify(title, who+". Make sure you recognise it.", false)
		}
		if now > 0 {
			r.mu.Lock()
			r.lastSeenCheck = now
			r.mu.Unlock()
		}
	}

	// Firmware
	if nv := obj(x["fw"])["new"]; isScalar(nv) {
		v := jsonString(nv)
		r.mu.Lock()
		isNew := v != "" && !r.notifiedSoft["fw-"+v]
		if isNew {
			r.notifiedSoft["fw-"+v] = true
		}
		r.mu.Unlock()
		if isNew {
			notify("Firmware "+v+" is available", "Open the "+r.name()+" tab and check the upgrade checklist before upgrading.", false)
		}
	}

	r.finishPoll(manual, "all good")
	return nil
}

// finishPoll sets the tray state from the active alerts.
func (r *RouterService) finishPoll(manual bool, okText string) {
	r.mu.Lock()
	state := 0
	var tip string
	if len(r.active) > 0 {
		state = 1
		for _, a := range r.active {
			if a.Severe {
				state = 2
			}
		}
		if len(r.active) == 1 {
			for _, a := range r.active {
				tip = r.name() + " · " + a.Title
				if strings.HasPrefix(a.Title, r.name()) {
					tip = a.Title
				}
			}
		} else {
			tip = r.name() + " · " + strconv.Itoa(len(r.active)) + " problems"
		}
	} else {
		tip = r.name() + " · " + okText
	}
	count := len(r.active)
	r.firstPoll = false
	r.mu.Unlock()

	r.ui.SetRouterState(state, tip)
	if manual && count == 0 {
		r.ui.Notify("All good", "No problems on your "+r.name()+" right now.", false)
	}
}

// vulnTitle words Router Home's "Known vulnerabilities" result (Security card).
func vulnTitle(worst string) (string, bool) {
	switch worst {
	case "infected":
		return "Signs of infection found", true
	case "exposed":
		return "Exposed to a known vulnerability", true
	case "suspicious":
		return "Suspicious file found", true
	case "update":
		return "Firmware security update needed", false
	case "unusual":
		return "Unusual activity found", false
	case "notice":
		return "New GL.iNet security notice", false
	}
	return "", false
}

func (r *RouterService) notifier() func(t, b string, sev bool) {
	r.mu.Lock()
	on := r.settings.Notifications
	r.mu.Unlock()
	return func(t, b string, sev bool) {
		if on {
			r.ui.Notify(t, b, sev)
		}
	}
}

// applyAlerts compares the current problems with the last poll's and raises
// desktop alerts for new and resolved ones. It returns true on the first poll.
func (r *RouterService) applyAlerts(cur map[string]alert, now int64) bool {
	r.mu.Lock()
	first := r.firstPoll
	var fresh []string
	for k, a := range cur {
		if old, ok := r.active[k]; ok {
			if a.Since == 0 {
				a.Since = old.Since
				cur[k] = a
			}
		} else {
			if a.Since == 0 {
				a.Since = now
				cur[k] = a
			}
			fresh = append(fresh, k)
		}
	}
	sort.Strings(fresh)
	var resolved []alert
	for k, a := range r.active {
		if _, ok := cur[k]; !ok {
			resolved = append(resolved, a)
			delete(r.active, k)
		}
	}
	for k, a := range cur {
		r.active[k] = a
	}
	r.mu.Unlock()

	notify := r.notifier()
	if first {
		if len(cur) == 1 {
			for _, a := range cur {
				notify(a.Title, a.Body, a.Severe)
			}
		} else if len(cur) > 1 {
			var titles []string
			sev := false
			for _, k := range fresh {
				titles = append(titles, cur[k].Title)
				sev = sev || cur[k].Severe
			}
			notify(strconv.Itoa(len(cur))+" problems on your "+r.name(), strings.Join(titles, " · "), sev)
		}
	} else {
		for _, k := range fresh {
			a := cur[k]
			notify(a.Title, a.Body, a.Severe)
		}
	}
	for _, a := range resolved {
		body := "It's back to normal."
		if a.Since > 0 && now > a.Since {
			d := now - a.Since
			if d > 30 {
				if d >= 3600 {
					body = fmt.Sprintf("Recovered after %.1f h.", float64(d)/3600)
				} else {
					m := d / 60
					if m < 1 {
						m = 1
					}
					body = fmt.Sprintf("Recovered after %d min.", m)
				}
			}
		}
		notify("Resolved: "+a.Title, body, false)
	}
	return first
}

// basicPoll checks a router without Router Home through GL.iNet's own
// system.get_status: reachability and whether it's online.
func (r *RouterService) basicPoll(c *GlClient, manual bool) error {
	res, err := c.Call("system", "get_status", nil)
	if err != nil {
		return err
	}
	r.mu.Lock()
	r.rhState, r.rhVersion = 2, ""
	r.mu.Unlock()
	anyUp, anyOnline := false, false
	nets := arr(obj(res)["network"])
	for _, n := range nets {
		o := obj(n)
		if string(o["up"]) == "true" {
			anyUp = true
		}
		if string(o["online"]) == "true" {
			anyOnline = true
		}
	}
	cur := map[string]alert{}
	if len(nets) > 0 && anyUp && !anyOnline {
		cur["wan"] = alert{"Internet is down", "Your router can't reach the internet.", true, 0}
	}
	r.applyAlerts(cur, time.Now().Unix())
	r.mu.Lock()
	r.firstPoll = false
	r.mu.Unlock()
	r.finishPoll(manual, "online")
	return nil
}

// UpdateSettings changes router settings under the lock and saves them.
func (r *RouterService) UpdateSettings(fn func(s *RouterSettings)) {
	r.mu.Lock()
	fn(r.settings)
	cp := *r.settings
	r.mu.Unlock()
	cp.Save()
}

// ResetMonitor forgets alert history (used when the router changes).
func (r *RouterService) ResetMonitor() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.active = map[string]alert{}
	r.notifiedSoft = map[string]bool{}
	r.firstPoll = true
	r.failCount = 0
	r.lastSeenCheck = 0
	r.providersAt = time.Time{}
	r.loginBroken = false
}
