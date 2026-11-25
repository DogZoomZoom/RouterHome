//go:build windows

package main

// GL.iNet router tabs. Each router has its own sign-in, background health
// monitor and tray status. A router whose IP address isn't fixed asks for the
// new address when it can't be reached.

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/go-webview2/pkg/webview2"
)

type device struct {
	a     *App
	t     *tabView
	rs    *RouterService
	creds CredStore

	reauthing   bool
	lastReauth  time.Time
	reauthCount int

	seenCert string          // last certificate the tab's browser saw
	asked    map[string]bool // extra certificates already offered this session

	// written from any goroutine via deviceUI, read on the UI thread
	mu    sync.Mutex
	state int
	tip   string
}

// name is safe to call from any goroutine.
func (d *device) name() string { return d.rs.name() }

// ipMay: the address can change, so offer to update it when unreachable (UI thread).
func (d *device) ipMay() bool { return d.t.cfg.IPMayChange }

func (d *device) status() (int, string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.state, d.tip
}

// deviceUI routes a RouterService's alerts to the shared tray icon.
type deviceUI struct{ d *device }

func (u deviceUI) Notify(title, body string, severe bool) {
	d := u.d
	if n := d.name(); !strings.Contains(title, n) {
		title = n + ": " + title
	}
	d.a.post(func() {
		if d.a.tabIndex(d.t) >= 0 {
			d.a.notify(d.t, "", title, body, severe)
		}
	})
}

func (u deviceUI) SetRouterState(state int, tip string) {
	d := u.d
	d.mu.Lock()
	changed := state != d.state || tip != d.tip
	d.state, d.tip = state, tip
	d.mu.Unlock()
	if changed {
		d.a.post(d.a.refreshTray)
	}
}

func (a *App) newDevice(t *tabView) *device {
	var creds CredStore = winCreds{}
	if n := tabCredName(t.cfg.ID); n != "" {
		creds = fixedCreds{n}
	}
	d := &device{a: a, t: t, creds: creds, state: -1, tip: t.cfg.Name + " · not signed in"}
	d.rs = NewRouterService(t.cfg.Name, LoadTabRouterSettings(t.cfg.ID), creds, deviceUI{d})
	return d
}

// devices returns the routers being watched (safe from any goroutine).
func (a *App) devices() []*device {
	a.devMu.Lock()
	defer a.devMu.Unlock()
	return append([]*device(nil), a.devs...)
}

// refreshTray recomputes the tray icon (worst state wins) and tooltip.
func (a *App) refreshTray() {
	state := -1
	var tips []string
	for _, d := range a.devices() {
		s, t := d.status()
		if s > state {
			state = s
		}
		if d.rs.Configured() {
			tips = append(tips, t)
		}
	}
	tip := strings.Join(tips, "\n")
	if tip == "" {
		tip = appName
	}
	// always update: the icon also depends on whether any router is watched
	a.trayState, a.trayTip = state, tip
	a.updateTray()
	pInvalidateRect.Call(a.hwnd, 0, 0)
}

// checkAll polls every router; manual checks end with one summary balloon.
func (a *App) checkAll(manual bool) {
	var wg sync.WaitGroup
	for _, d := range a.devices() {
		if !d.rs.Configured() {
			continue
		}
		wg.Add(1)
		go func(d *device) {
			defer wg.Done()
			defer guard("router check")
			d.rs.Poll(false)
		}(d)
	}
	wg.Wait()
	if !manual {
		return
	}
	a.post(func() {
		var lines []string
		worst := -1
		for _, d := range a.devices() {
			if !d.rs.Configured() {
				continue
			}
			s, t := d.status()
			if s > worst {
				worst = s
			}
			lines = append(lines, t)
		}
		if len(lines) == 0 {
			return
		}
		title := "All good"
		if worst > 0 {
			title = "Router check"
		}
		a.notify(nil, "", title, strings.Join(lines, "\n"), worst >= 2)
	})
}

// ---------------------------------------------------------------- router tabs

func (d *device) homeURL(sid string) string {
	return "https://" + d.rs.Settings().Host + "/?id=" + url.QueryEscape(sid) + "#/"
}

func (a *App) deviceOpen(d *device) {
	p := d.t.pane
	if !p.created {
		return
	}
	if !d.rs.Configured() {
		d.reauthing = false
		a.showSignIn(d, "", "")
		return
	}
	if p.signInVisible {
		p.eval("window.hub&&(hub.setBusy(true),hub.setStatus('Connecting…','info'))")
	}
	go func() {
		defer guard("background")
		res, msg := d.rs.EnsureSession()
		sid := d.rs.Sid()
		a.post(func() {
			d.reauthing = false
			if res == SessionOK && sid != "" {
				p.signInVisible = false
				p.nav(d.homeURL(sid))
				return
			}
			if res == SessionUnreachable && d.ipMay() {
				msg = "Couldn't reach your " + d.name() + " at " + d.rs.Settings().Host + ".\nIf its IP address changed, enter the new one below."
			}
			a.showSignIn(d, msg, "err")
		})
	}()
}

func randomNonce() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func jsStr(s string) string {
	b, _ := json.Marshal(s)
	return string(b)
}

func (a *App) showSignIn(d *device, message, kind string) {
	p := d.t.pane
	if !p.created {
		a.ensurePane(d.t)
		if !p.created {
			return
		}
	}
	s := d.rs.Settings()
	_, _, saved := d.creds.Load(s.Host)
	saved = saved && s.Host != ""
	p.nonce = randomNonce()
	cfg := map[string]interface{}{
		"nonce":       p.nonce,
		"device":      d.name(),
		"ipMay":       d.ipMay(),
		"showStartup": false,
		"host":        s.Host,
		"user":        s.Username,
		"alerts":      s.Notifications,
		"remember":    true,
		"savedLogin":  saved,
		"message":     message,
		"kind":        kind,
	}
	js, _ := json.Marshal(cfg)
	html := strings.Replace(signinHTML, "<script>\n(function", "<script>window.__cfg="+string(js)+";</script>\n<script>\n(function", 1)
	p.signInVisible = true
	p.navString(html)
}

func (a *App) signInStatus(d *device, msg, kind string, busy bool) {
	p := d.t.pane
	if !p.created || !p.signInVisible {
		return
	}
	b := "false"
	if busy {
		b = "true"
	}
	js := "window.hub&&(hub.setBusy(" + b + "),hub.setStatus(" + jsStr(msg) + "," + jsStr(kind) + ")"
	if !busy && kind == "err" {
		js += ",hub.focusPassword()"
	}
	p.eval(js + ")")
}

type signInForm struct {
	Type     string `json:"type"`
	Nonce    string `json:"nonce"`
	Host     string `json:"host"`
	User     string `json:"user"`
	Pass     string `json:"pass"`
	Remember bool   `json:"remember"`
	Alerts   bool   `json:"alerts"`
	Startup  bool   `json:"startup"`
}

func (a *App) onMessage(t *tabView, m string) {
	d := t.dev
	if d == nil {
		return
	}
	p := t.pane
	var f signInForm
	if !p.signInVisible || json.Unmarshal([]byte(m), &f) != nil || f.Nonce == "" || f.Nonce != p.nonce {
		return
	}
	switch f.Type {
	case "retry":
		a.deviceOpen(d)
	case "signin":
		a.signIn(d, f)
	}
}

func (a *App) signIn(d *device, f signInForm) {
	h, herr := NormalizeHost(f.Host)
	user := strings.TrimSpace(f.User)
	if herr != nil {
		a.signInStatus(d, herr.Error(), "err", false)
		return
	}
	if f.Pass == "" {
		// The saved password can be reused, e.g. when only the IP changed.
		if su, sp, ok := d.creds.Load(d.rs.Settings().Host); ok && (user == "" || strings.EqualFold(su, user)) {
			f.Pass = sp
			if user == "" {
				user = su
			}
		}
	}
	if h == "" || user == "" || f.Pass == "" {
		a.signInStatus(d, "Enter the "+d.name()+"'s address, username and password.", "err", false)
		return
	}
	a.signInStatus(d, "Connecting to "+h+"…", "info", true)
	go func() {
		defer guard("background")
		fp, err := ProbeCertificate(h)
		if err != nil {
			a.post(func() {
				a.signInStatus(d, "Couldn't reach "+h+" over HTTPS. Check the address and that this PC is on the same network as the "+d.name()+".", "err", false)
			})
			return
		}
		a.post(func() { a.trustAndLogin(d, h, user, fp, f) })
	}()
}

func (a *App) trustAndLogin(d *device, h, user, fp string, f signInForm) {
	s := d.rs.Settings()
	pinned := s.PinnedCertSha256
	sameHost := strings.EqualFold(s.Host, h)
	switch {
	case pinned == "" || (!sameHost && !d.ipMay() && !FingerprintIn(pinned, fp)):
		text := "First connection to your " + d.name() + " at " + h + "\n\nIt uses its own (self-signed) security certificate. Its fingerprint is:\n\n" +
			PrettyFingerprint(fp) + "\n\nTrust this router? Home Hub will remember it and warn you if it ever changes."
		if messageBox(a.hwnd, text, "Trust this "+d.name()+"?", MB_YESNO|MB_ICONQUESTION) != IDYES {
			a.signInStatus(d, "Not connected: certificate not trusted.", "err", false)
			return
		}
		pinned = fp
	case !FingerprintIn(pinned, fp):
		text := "The " + d.name() + "'s security certificate has CHANGED since you last connected.\n\n" +
			"This is expected after a factory reset or some firmware upgrades, but it can also mean something is intercepting your connection."
		if !sameHost {
			text = "The device at " + h + " has a different security certificate from the " + d.name() + " you trusted before.\n\n" +
				"That's expected after a factory reset or some firmware upgrades. It can also mean this IP address belongs to a different device, so double-check the address."
		}
		if messageBox(a.hwnd, text+"\n\nTrust the new certificate?", "Certificate changed", MB_YESNO|MB_ICONWARNING|MB_DEFBUTTON2) != IDYES {
			a.signInStatus(d, "Not connected: the certificate was not trusted.", "err", false)
			return
		}
		pinned = fp
	}
	a.signInStatus(d, "Signing in…", "info", true)
	go func() {
		defer guard("background")
		c := NewGlClient(h, pinned)
		err := c.Login(user, f.Pass)
		a.post(func() {
			if err != nil {
				c.Close()
				msg := "Couldn't connect: " + err.Error()
				var le *LoginError
				if errors.As(err, &le) {
					msg = le.Msg
				}
				a.signInStatus(d, msg, "err", false)
				return
			}
			old := d.rs.Settings()
			newDevice := old.PinnedCertSha256 != pinned && !FingerprintIn(old.PinnedCertSha256, fp)
			d.rs.UpdateSettings(func(s *RouterSettings) {
				s.Host, s.Username, s.PinnedCertSha256 = h, user, pinned
				s.Notifications = f.Alerts
			})
			if !strings.EqualFold(old.Host, h) {
				d.creds.Delete(old.Host)
			}
			if f.Remember {
				if err := d.creds.Save(h, user, f.Pass); err != nil {
					messageBox(a.hwnd, err.Error(), appName, MB_ICONWARNING)
				}
			} else {
				d.creds.Delete(h)
			}
			if newDevice {
				d.rs.ResetMonitor()
			}
			d.rs.AdoptSession(c, f.Pass)
			d.reauthCount = 0
			p := d.t.pane
			p.signInVisible = false
			p.nav(d.homeURL(c.Sid))
			go a.checkAll(false)
		})
	}()
}

func (a *App) tabSource(t *tabView) (*url.URL, string) {
	p := t.pane
	if !p.created || p.wv == nil {
		return nil, ""
	}
	src, _ := p.wv.GetSource()
	u, err := url.Parse(src)
	if err != nil {
		return nil, src
	}
	return u, src
}

// checkLoginPage signs back in automatically when the router logs the tab out.
func (a *App) checkLoginPage(d *device) {
	p := d.t.pane
	if !p.created || p.signInVisible || d.reauthing {
		return
	}
	_, src := a.tabSource(d.t)
	if !strings.Contains(src, "#/login") {
		return
	}
	if time.Since(d.lastReauth) > 5*time.Minute {
		d.reauthCount = 0
	}
	if d.reauthCount >= 3 {
		return
	}
	d.reauthing = true
	d.reauthCount++
	d.lastReauth = time.Now()
	d.rs.InvalidateSession()
	a.deviceOpen(d)
}

// goHomeTab opens the custom Home page instead of GL.iNet's default page.
func (a *App) goHomeTab(d *device) {
	p := d.t.pane
	if !p.created || p.signInVisible {
		return
	}
	u, src := a.tabSource(d.t)
	if u == nil || !hostMatches(u, d.rs.Settings().Host) {
		return
	}
	if !strings.Contains(src, "#/") || strings.HasSuffix(src, "#/") || strings.Contains(src, "#/internet") {
		p.eval(machomeJS)
	}
}

// loadFailed runs when a router tab's page didn't load.
func (a *App) loadFailed(d *device, status webview2.COREWEBVIEW2_WEB_ERROR_STATUS) {
	p := d.t.pane
	s := d.rs.Settings()
	if !p.created || p.signInVisible || s.Host == "" {
		return
	}
	logf("%s page failed to load (status %d)", d.t.cfg.ID, status)
	certErr := status >= webview2.COREWEBVIEW2_WEB_ERROR_STATUS_CERTIFICATE_COMMON_NAME_IS_INCORRECT &&
		status <= webview2.COREWEBVIEW2_WEB_ERROR_STATUS_CERTIFICATE_IS_INVALID
	if certErr && d.seenCert != "" && !FingerprintIn(s.PinnedCertSha256, d.seenCert) {
		if d.asked == nil {
			d.asked = map[string]bool{}
		}
		if !d.asked[d.seenCert] {
			d.asked[d.seenCert] = true
			seen := d.seenCert
			text := "Your " + d.name() + " at " + s.Host + " showed the browser a second certificate. Some routers keep two and pick one depending on the connection.\n\n" +
				"Its fingerprint is:\n\n" + PrettyFingerprint(seen) + "\n\nTrust this certificate for your " + d.name() + " too?"
			if messageBox(a.hwnd, text, "Second certificate", MB_YESNO|MB_ICONQUESTION) == IDYES {
				d.rs.UpdateSettings(func(s *RouterSettings) { s.PinnedCertSha256 += "," + seen })
				logf("%s: trusted additional certificate %s…", d.t.cfg.ID, seen[:16])
				a.deviceOpen(d)
				return
			}
		}
	}
	msg := "Couldn't load your " + d.name() + " at " + s.Host + "."
	if certErr {
		msg = "The device at " + s.Host + " didn't present a certificate you trusted for your " + d.name() + "."
	}
	if d.ipMay() {
		msg += "\nIf its IP address changed, enter the new one below."
	}
	a.showSignIn(d, msg, "err")
}

func (a *App) askNewIP(d *device) {
	a.showMain(d.t)
	if a.lk.locked {
		a.lk.pending = func() { a.askNewIP(d) }
		return
	}
	a.showSignIn(d, "Enter the "+d.name()+"'s new IP address. Your saved password is reused, so you can leave it blank.", "info")
}

func (a *App) signOut(d *device) {
	if messageBox(a.hwnd, "Sign out of the "+d.name()+" and remove its saved password from this PC?", appName, MB_YESNO|MB_ICONQUESTION) != IDYES {
		return
	}
	d.rs.ForgetLogin()
	d.rs.ResetMonitor()
	deviceUI{d}.SetRouterState(-1, d.name()+" · not signed in")
	if d.t.pane.created {
		a.showSignIn(d, "Signed out. Your saved "+d.name()+" password was removed from this PC.", "info")
	}
}
