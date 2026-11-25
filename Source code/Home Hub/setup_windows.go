//go:build windows

package main

// Setup screen: choose the tabs and where each one is, then the PIN. Shown on
// first run, once after upgrading from the fixed-tab version (to review), and
// any time from "Edit tabs…".

import (
	"crypto/tls"
	"embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
	"unsafe"
)

//go:embed setup.html
var setupHTML string

//go:embed assets/smarthome.png assets/adblock.png assets/weather.png assets/web.png assets/glrouter.png assets/firewall.png assets/flint.png
var setupIcons embed.FS

func setupIconURIs() map[string]string {
	files := map[string]string{
		KindHomeAssistant: "smarthome.png", KindAdGuard: "adblock.png", KindWeather: "weather.png", KindWeb: "web.png",
		"router": "glrouter.png", "firewall": "firewall.png", "wifi": "flint.png",
	}
	out := map[string]string{}
	for k, f := range files {
		if b, err := setupIcons.ReadFile("assets/" + f); err == nil {
			out[k] = "data:image/png;base64," + base64.StdEncoding.EncodeToString(b)
		}
	}
	return out
}

type setupRow struct {
	ID      string `json:"id"`
	Kind    string `json:"kind"`
	Name    string `json:"name"`
	Address string `json:"address"`
	Icon    string `json:"icon"`
	IPMay   bool   `json:"ipMay"`
}

// editTabs opens the setup screen to change the tabs.
func (a *App) editTabs() {
	if !a.hub.SetupDone {
		a.showMain(nil)
		return
	}
	a.whenUnlocked(func() {
		a.showMain(nil)
		a.showSetup(false)
	})
}

func (a *App) currentRows() []setupRow {
	var rows []setupRow
	for _, t := range a.tabs {
		r := setupRow{ID: t.cfg.ID, Kind: t.cfg.Kind, Name: t.cfg.Name, Address: t.cfg.URL, Icon: t.cfg.Icon, IPMay: t.cfg.IPMayChange}
		if t.dev != nil {
			r.Address = t.dev.rs.Settings().Host
			if r.Icon == "" {
				r.Icon = "router"
			}
		}
		rows = append(rows, r)
	}
	if len(rows) == 0 && a.hub.fresh && !a.hub.SetupDone {
		for _, c := range SuggestTabs() {
			r := setupRow{ID: c.ID, Kind: c.Kind, Name: c.Name, Address: c.URL, Icon: c.Icon}
			if c.Kind == KindGLiNet {
				r.Address = LoadTabRouterSettings(c.ID).Host
			}
			rows = append(rows, r)
		}
	}
	return rows
}

func (a *App) showSetup(first bool) {
	a.lk.mode = "setup"
	a.lk.overlay = true
	a.layout()
	pSetWindowTextW.Call(a.hwnd, uintptr(unsafe.Pointer(u16(appName+" · Setup"))))
	if !a.ensureLockPane() {
		return
	}
	p := a.lk.pane
	p.nonce = randomNonce()
	rows := a.currentRows()
	cfg := map[string]interface{}{
		"nonce":   p.nonce,
		"first":   first,
		"tabs":    rows,
		"startup": startupOn() || (a.hub.fresh && !a.hub.SetupDone),
		"pinSet":  a.hub.Pin.IsSet(),
		"icons":   setupIconURIs(),
		"version": appVersion,
		// pre-filled from apps already on this PC: still start at "choose your tabs"
		"suggested": first && len(a.tabs) == 0 && len(rows) > 0,
	}
	js, _ := json.Marshal(cfg)
	html := strings.Replace(setupHTML, "<script>\n(function", "<script>window.__cfg="+string(js)+";</script>\n<script>\n(function", 1)
	p.navString(html)
	a.layout()
	p.focus()
}

func (a *App) hideOverlay() { a.hideLock() }

func (a *App) setupEval(js string) {
	if p := a.lk.pane; p.created && a.lk.overlay && a.lk.mode == "setup" {
		p.eval("window.hub&&(" + js + ")")
	}
}

func (a *App) onSetupMessage(m string) {
	var f struct {
		Type    string     `json:"type"`
		Tabs    []setupRow `json:"tabs"`
		Startup bool       `json:"startup"`
		UsePin  bool       `json:"usePin"`
		Key     string     `json:"key"`
		Kind    string     `json:"kind"`
		Address string     `json:"address"`
		Which   string     `json:"which"`
	}
	if json.Unmarshal([]byte(m), &f) != nil {
		return
	}
	switch f.Type {
	case "check":
		key, kind, addr := f.Key, f.Kind, f.Address
		go func() {
			defer guard("address check")
			ok, msg, k := checkAddress(kind, addr)
			a.post(func() {
				a.setupEval(fmt.Sprintf("hub.checkResult(%s,%v,%s,%s)", jsStr(key), ok, jsStr(msg), jsStr(k)))
			})
		}()
	case "link":
		if f.Which == "routerhome" {
			shellOpen(routerHomeURL)
		}
	case "validate":
		cfgs, hosts, err := a.validateRows(f.Tabs)
		if err != nil {
			a.setupEval(fmt.Sprintf("hub.invalid(%d,%s)", err.row, jsStr(err.msg)))
			return
		}
		out := make([]map[string]string, len(cfgs))
		for i, c := range cfgs {
			addr := c.URL
			if c.Kind == KindGLiNet {
				addr = hosts[i]
			}
			out[i] = map[string]string{"address": addr}
		}
		js, _ := json.Marshal(out)
		a.setupEval("hub.validated(" + string(js) + ")")
	case "save":
		cfgs, hosts, err := a.validateRows(f.Tabs)
		if err != nil {
			a.setupEval(fmt.Sprintf("hub.invalid(%d,%s)", err.row, jsStr(err.msg)))
			return
		}
		first := !a.hub.SetupDone
		a.applyTabs(cfgs, hosts)
		a.hub.SetupDone = true
		if first {
			applyStartup(f.Startup)
			a.hub.StartWithWindows = f.Startup
			if !a.hub.Pin.IsSet() {
				a.hub.NoPin = !f.UsePin
			}
		}
		a.hub.Save()
		logf("setup saved: %d tabs", len(a.tabs))
		a.finishSetup(first)
	case "cancel":
		if a.hub.SetupDone {
			a.hideOverlay()
			a.selectTab(a.cur)
		}
	}
}

// finishSetup moves on to the PIN (first run) and then opens the first tab.
func (a *App) finishSetup(first bool) {
	if a.cur == nil && len(a.tabs) > 0 {
		a.cur = a.tabs[0]
	}
	if first && !a.hub.Pin.IsSet() && !a.hub.NoPin {
		a.lk.locked = true
		a.lk.pendingTo = a.cur
		a.showLock("set", "", "")
		return
	}
	a.hideOverlay()
	a.lk.locked = false
	t := a.cur
	if a.lk.pendingTo != nil && a.tabIndex(a.lk.pendingTo) >= 0 {
		t = a.lk.pendingTo
	}
	a.lk.pendingTo = nil
	a.selectTab(t)
	if fn := a.lk.pending; fn != nil {
		a.lk.pending = nil
		fn()
	}
}

type rowError struct {
	row int
	msg string
}

// validateRows checks what was entered and turns it into tab settings. hosts
// holds each GL.iNet router's address (empty for other tabs).
func (a *App) validateRows(rows []setupRow) ([]TabConfig, []string, *rowError) {
	if len(rows) == 0 {
		return nil, nil, &rowError{-1, "Add at least one tab."}
	}
	if len(rows) > maxTabs {
		return nil, nil, &rowError{-1, fmt.Sprintf("Home Hub fits up to %d tabs.", maxTabs)}
	}
	var out []TabConfig
	var hosts []string
	used := map[string]bool{}
	weather := false
	for i, r := range rows {
		if !validKind(r.Kind) {
			return nil, nil, &rowError{i, "Unknown tab type."}
		}
		c := TabConfig{Kind: r.Kind, Name: strings.TrimSpace(r.Name)}
		if c.Name == "" {
			return nil, nil, &rowError{i, "Give this tab a name."}
		}
		if len([]rune(c.Name)) > 40 {
			c.Name = string([]rune(c.Name)[:40])
		}
		// keep the ID (and so the saved logins) of an existing tab of the same kind
		if old := a.tabByID(r.ID); old != nil && old.cfg.Kind == r.Kind && !used[r.ID] {
			c.ID = r.ID
		} else if r.ID != "" && idOK(r.ID) && !used[r.ID] && a.tabByID(r.ID) == nil && isLegacyID(r.ID, r.Kind) {
			c.ID = r.ID // a suggestion carried over from an earlier app
		} else {
			c.ID = newTabID()
		}
		used[c.ID] = true
		host := ""
		switch r.Kind {
		case KindWeather:
			if weather {
				return nil, nil, &rowError{i, "Only one weather tab is possible."}
			}
			weather = true
			c.ID = idWeather
		case KindGLiNet:
			h, err := NormalizeHost(r.Address)
			if err != nil {
				return nil, nil, &rowError{i, err.Error()}
			}
			host = h
			c.Icon = r.Icon
			if c.Icon != "firewall" && c.Icon != "wifi" {
				c.Icon = "router"
			}
			c.IPMayChange = r.IPMay
		default:
			port := 0
			if r.Kind == KindHomeAssistant {
				port = 8123
			}
			u, err := NormalizeURL(r.Address, port)
			if err != nil {
				return nil, nil, &rowError{i, err.Error()}
			}
			c.URL = u
		}
		out = append(out, c)
		hosts = append(hosts, host)
	}
	return out, hosts, nil
}

func isLegacyID(id, kind string) bool {
	switch id {
	case idLegacyHA:
		return kind == KindHomeAssistant
	case idLegacyAG:
		return kind == KindAdGuard
	case idRouterHomeGL, idLegacyFlint:
		return kind == KindGLiNet
	}
	return false
}

// applyTabs switches to a new tab list without restarting: kept tabs keep
// their browser and session, new ones start fresh, removed ones are closed.
func (a *App) applyTabs(cfgs []TabConfig, hosts []string) {
	old := map[string]*tabView{}
	for _, t := range a.tabs {
		old[t.cfg.ID] = t
	}
	var next []*tabView
	for i, c := range cfgs {
		t, ok := old[c.ID]
		if ok && t.cfg.Kind == c.Kind {
			delete(old, c.ID)
			urlChanged := t.cfg.URL != c.URL
			iconChanged := t.cfg.Icon != c.Icon
			t.cfg = c
			if iconChanged {
				if t.icon != 0 {
					pDestroyIcon.Call(t.icon)
				}
				t.icon = loadIcon(iconIDFor(c), int(a.sc(16)))
			}
			if urlChanged && t.pane.created && c.URL != "" {
				t.pane.nav(c.URL)
			}
		} else {
			t = a.newTabView(c)
		}
		if d := t.dev; d != nil {
			d.rs.SetName(c.Name)
			s := d.rs.Settings()
			if !strings.EqualFold(s.Host, hosts[i]) {
				logf("router %s: address changed", c.ID)
				d.rs.UpdateSettings(func(s *RouterSettings) { s.Host = hosts[i] })
				d.rs.InvalidateSession()
				d.rs.ResetMonitor()
				deviceUI{d}.SetRouterState(-1, c.Name+" · not signed in")
				if t.pane.created {
					a.deviceOpen(d)
				}
			}
		}
		next = append(next, t)
	}
	for _, t := range old {
		a.removeTab(t)
	}
	a.tabs = next
	a.hub.Tabs = cfgs
	if a.tabIndex(a.cur) < 0 {
		a.cur = nil
		if len(a.tabs) > 0 {
			a.cur = a.tabs[0]
		}
	}
	if a.cur != nil {
		a.hub.LastTabID = a.cur.cfg.ID
	}
	a.syncDevices()
	a.layout()
	a.refreshTray()
	go a.checkAll(false)
}

// removeTab closes a removed tab and forgets what Home Hub saved for it.
func (a *App) removeTab(t *tabView) {
	logf("removing tab %s (%s)", t.cfg.ID, t.cfg.Kind)
	a.closePane(t)
	if d := t.dev; d != nil {
		if t.cfg.ID == idRouterHomeGL {
			// shared with the Router Home app: leave its settings, just sign out here
			d.rs.InvalidateSession()
		} else {
			d.rs.ForgetLogin()
			_ = os.Remove(tabRouterPath(t.cfg.ID))
		}
	}
	if strings.Contains(strings.ToLower(t.pane.dataPath), `\homehub\tabs\`) {
		a.hub.PendingDelete = append(a.hub.PendingDelete, t.pane.dataPath)
	}
	if a.lk.pendingTo == t {
		a.lk.pendingTo = nil
	}
	if a.balloonTab == t {
		a.balloonTab = nil
	}
}

// checkAddress tells the setup screen whether an address answers.
// kind is "" (fine), "warn" or "norh" (a GL.iNet router without Router Home).
func checkAddress(kind, addr string) (bool, string, string) {
	if kind == KindGLiNet {
		h, err := NormalizeHost(addr)
		if err != nil {
			return false, err.Error(), ""
		}
		if _, err := ProbeCertificate(h); err != nil {
			return false, "No answer from " + h + " over HTTPS. Check the address, and that this PC is on the same network.", ""
		}
		body, status, err := fetch("https://"+h+"/", 128<<10)
		if err == nil && status < 500 && !looksGLiNet(body) {
			return true, "Something answered at " + h + ", but it doesn't look like a GL.iNet admin page. Double-check the address.", "warn"
		}
		if hasRouterHome(h) {
			return true, "GL.iNet router found, with Router Home installed.", ""
		}
		return true, "GL.iNet router found. Router Home isn't installed (optional).", "norh"
	}
	port := 0
	if kind == KindHomeAssistant {
		port = 8123
	}
	u, err := NormalizeURL(addr, port)
	if err != nil {
		return false, err.Error(), ""
	}
	body, status, err := fetch(u, 256<<10)
	if err != nil {
		return false, "No answer from " + u + ". Check the address and port.", ""
	}
	lb := strings.ToLower(body)
	switch kind {
	case KindHomeAssistant:
		if strings.Contains(lb, "home assistant") || strings.Contains(lb, "home-assistant") {
			return true, "Home Assistant found at " + u, ""
		}
		return true, fmt.Sprintf("Something answered (HTTP %d), but it doesn't look like Home Assistant. Its usual port is 8123.", status), "warn"
	case KindAdGuard:
		if strings.Contains(lb, "adguard") {
			return true, "AdGuard Home found at " + u, ""
		}
		return true, fmt.Sprintf("Something answered (HTTP %d), but it doesn't look like AdGuard Home. Check the port (often 80, 3000 or 8080).", status), "warn"
	}
	return true, fmt.Sprintf("Reachable (HTTP %d).", status), ""
}

func looksGLiNet(body string) bool {
	lb := strings.ToLower(body)
	return strings.Contains(lb, "gl-sdk4") || strings.Contains(lb, "gl.inet") || strings.Contains(lb, "glinet") || strings.Contains(lb, "gl-ui")
}

// hasRouterHome looks for Router Home's view file, which needs no sign-in.
func hasRouterHome(host string) bool {
	_, status, err := fetch("https://"+host+"/views/gl-sdk4-ui-machome.common.js.gz", 1024)
	return err == nil && status == 200
}

// fetch reads the start of a page. Only used to see whether something answers,
// so certificates aren't checked here (nothing is sent).
func fetch(u string, limit int64) (string, int, error) {
	cl := &http.Client{
		Timeout: 8 * time.Second,
		Transport: &http.Transport{
			Proxy:           nil,
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}
	resp, err := cl.Get(u)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(io.LimitReader(resp.Body, limit))
	return string(b), resp.StatusCode, nil
}

// ---------------------------------------------------------------- update check

func (a *App) updateLoop() {
	defer guard("update check")
	time.Sleep(20 * time.Second)
	for {
		a.checkForUpdate()
		time.Sleep(6 * time.Hour)
	}
}

func (a *App) checkForUpdate() {
	type st struct {
		on      bool
		checked int64
		seen    string
	}
	ch := make(chan st, 1)
	a.post(func() { ch <- st{a.hub.updateChecks(), a.hub.UpdateCheckedAt, a.hub.UpdateSeen} })
	s := <-ch
	if !s.on || time.Since(time.Unix(s.checked, 0)) < 20*time.Hour {
		return
	}
	rel, err := latestRelease(releaseRepo)
	a.post(func() {
		a.hub.UpdateCheckedAt = time.Now().Unix()
		if err != nil {
			logf("update check: %v", err)
			a.hub.Save()
			return
		}
		if versionNewer(rel.Version, appVersion) {
			a.update = rel
			if a.hub.UpdateSeen != rel.Version {
				a.hub.UpdateSeen = rel.Version
				a.notify(nil, rel.URL, "Home Hub "+rel.Version+" is available", "Click to open the download page. You're on "+appVersion+".", false)
			}
		}
		a.hub.Save()
	})
}
