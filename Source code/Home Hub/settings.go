package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// RouterSettings uses the exact file and field names of the Router Home
// Windows app, so a router that app already knows carries over (address,
// pinned certificate, preferences).
type RouterSettings struct {
	Host             string `json:"Host"`
	Username         string `json:"Username"`
	PinnedCertSha256 string `json:"PinnedCertSha256"`
	Notifications    bool   `json:"Notifications"`
	StartWithWindows bool   `json:"StartWithWindows"` // Router Home app only; Home Hub keeps its own
	CloseToTray      bool   `json:"CloseToTray"`
	WindowW          int    `json:"WindowW"`
	WindowH          int    `json:"WindowH"`

	path string // where Save writes; empty means the Router Home app's file
}

// Tab kinds.
const (
	KindHomeAssistant = "homeassistant"
	KindAdGuard       = "adguard"
	KindWeather       = "weather"
	KindGLiNet        = "glinet"
	KindWeb           = "web"
)

// Tab IDs with storage carried over from the earlier single-purpose apps.
const (
	idLegacyHA     = "ha"         // Home Assistant app's browser profile
	idLegacyAG     = "adguard"    // AdGuard Home app's browser profile
	idWeather      = "weather"    // the one weather tab
	idRouterHomeGL = "routerhome" // router shared with the Router Home Windows app
	idLegacyFlint  = "flint3"     // the earlier Flint 3 tab
)

// TabConfig is one tab, as saved in settings.json.
type TabConfig struct {
	ID          string `json:"id"`
	Kind        string `json:"kind"`
	Name        string `json:"name"`
	URL         string `json:"url,omitempty"`         // web page tabs: the address to open
	Icon        string `json:"icon,omitempty"`        // GL.iNet tabs: router | firewall | wifi
	IPMayChange bool   `json:"ipMayChange,omitempty"` // GL.iNet tabs: ask for a new address when unreachable
}

type HubSettings struct {
	Tabs      []TabConfig `json:"tabs,omitempty"`
	SetupDone bool        `json:"setupDone,omitempty"`
	LastTabID string      `json:"lastTabId,omitempty"`

	StartWithWindows bool     `json:"startWithWindows,omitempty"`
	KeepInTray       *bool    `json:"keepInTray,omitempty"` // nil = yes
	NoPin            bool     `json:"noPin,omitempty"`      // the owner chose not to use a PIN
	UpdateCheck      *bool    `json:"updateCheck,omitempty"`
	UpdateSeen       string   `json:"updateSeen,omitempty"` // newest release already announced
	UpdateCheckedAt  int64    `json:"updateCheckedAt,omitempty"`
	PendingDelete    []string `json:"pendingDelete,omitempty"` // browser profiles of removed tabs

	WindowW   int  `json:"windowW"`
	WindowH   int  `json:"windowH"`
	Maximized bool `json:"maximized"`
	Migrated  bool `json:"migrated"`

	Pin         PinState `json:"pin"`
	WipeOnStart bool     `json:"wipeOnStart,omitempty"` // finish a PIN reset

	// Settings from before tabs were configurable (read once, then dropped).
	HomeAssistantURL string `json:"homeAssistantUrl,omitempty"`
	AdGuardURL       string `json:"adGuardUrl,omitempty"`
	FlintHost        string `json:"flintHost,omitempty"`
	FlintCertSha256  string `json:"flintCertSha256,omitempty"`
	LastTab          int    `json:"lastTab,omitempty"`
	TabLayout        int    `json:"tabLayout,omitempty"`

	existed bool // settings.json exists
	fresh   bool // first time Home Hub runs on this PC
}

func roamingDir(name string) string {
	base := os.Getenv("APPDATA")
	if base == "" {
		base, _ = os.UserConfigDir()
	}
	return filepath.Join(base, name)
}

func localDir(name string) string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base, _ = os.UserCacheDir()
	}
	return filepath.Join(base, name)
}

func routerSettingsPath() string { return filepath.Join(roamingDir("RouterHome"), "settings.json") }
func hubSettingsPath() string    { return filepath.Join(roamingDir("HomeHub"), "settings.json") }

// LoadRouterSettings reads the Router Home Windows app's settings.
func LoadRouterSettings() *RouterSettings {
	s := &RouterSettings{Username: "root", Notifications: true, CloseToTray: true, WindowW: 1360, WindowH: 900}
	if data, err := os.ReadFile(routerSettingsPath()); err == nil {
		_ = json.Unmarshal(data, s)
	}
	if s.Username == "" {
		s.Username = "root"
	}
	return s
}

func (s *RouterSettings) Save() {
	p := s.path
	if p == "" {
		p = routerSettingsPath()
	}
	_ = os.MkdirAll(filepath.Dir(p), 0o755)
	data, _ := json.MarshalIndent(s, "", "  ")
	_ = os.WriteFile(p, data, 0o600)
}

func flintSettingsPath() string { return filepath.Join(roamingDir("HomeHub"), "flint3.json") }

func tabRouterPath(id string) string {
	if id == idLegacyFlint {
		return flintSettingsPath()
	}
	return filepath.Join(roamingDir("HomeHub"), "routers", id+".json")
}

// LoadTabRouterSettings reads the router settings for a GL.iNet tab.
func LoadTabRouterSettings(id string) *RouterSettings {
	if id == idRouterHomeGL {
		return LoadRouterSettings()
	}
	s := &RouterSettings{Username: "root", Notifications: true, path: tabRouterPath(id)}
	if data, err := os.ReadFile(s.path); err == nil {
		_ = json.Unmarshal(data, s)
		s.path = tabRouterPath(id)
	}
	if s.Username == "" {
		s.Username = "root"
	}
	return s
}

// tabDataDir is where a tab's browser profile (cookies, saved web logins) lives.
func tabDataDir(t TabConfig) string {
	switch t.ID {
	case idLegacyHA:
		return filepath.Join(roamingDir("HomeAssistantDesktop"), "WebView2")
	case idLegacyAG:
		return filepath.Join(roamingDir("AdGuardHomeDesktop"), "WebView2")
	case idWeather:
		return filepath.Join(localDir("HomeHub"), "Weather", "WebView2")
	case idRouterHomeGL:
		return filepath.Join(localDir("RouterHome"), "WebView2")
	case idLegacyFlint:
		return filepath.Join(localDir("HomeHub"), "Flint3", "WebView2")
	}
	return filepath.Join(localDir("HomeHub"), "Tabs", t.ID, "WebView2")
}

// tabCredName is the Windows Credential Manager entry for a GL.iNet tab's login
// (empty: the Router Home app's per-address entry).
func tabCredName(id string) string {
	switch id {
	case idRouterHomeGL:
		return ""
	case idLegacyFlint:
		return "Flint3 (Home Hub)"
	}
	return "HomeHub:" + id
}

// readURL pulls the "url" field from one of the earlier single-app settings files.
func readURL(app string) string {
	data, err := os.ReadFile(filepath.Join(roamingDir(app), "settings.json"))
	if err != nil {
		return ""
	}
	var v struct {
		URL string `json:"url"`
	}
	_ = json.Unmarshal(data, &v)
	return strings.TrimSpace(v.URL)
}

func LoadHubSettings() *HubSettings {
	s := &HubSettings{WindowW: 1400, WindowH: 900}
	if data, err := os.ReadFile(hubSettingsPath()); err == nil {
		_ = json.Unmarshal(data, s)
		s.existed = true
	}
	s.fresh = !s.existed
	if len(s.Tabs) == 0 && s.existed {
		s.migrateTabs()
	}
	s.Tabs = CleanTabs(s.Tabs)
	if s.WindowW < 600 {
		s.WindowW = 1400
	}
	if s.WindowH < 400 {
		s.WindowH = 900
	}
	return s
}

// migrateTabs turns the fixed tabs of earlier versions into a tab list. The
// owner is shown the setup screen once to review it.
func (s *HubSettings) migrateTabs() {
	ha := s.HomeAssistantURL
	if ha == "" {
		ha = readURL("HomeAssistantDesktop")
	}
	ag := s.AdGuardURL
	if ag == "" {
		ag = readURL("AdGuardHomeDesktop")
	}
	var tabs []TabConfig
	if ha != "" {
		tabs = append(tabs, TabConfig{ID: idLegacyHA, Kind: KindHomeAssistant, Name: "Home Assistant", URL: ha})
	}
	if ag != "" {
		tabs = append(tabs, TabConfig{ID: idLegacyAG, Kind: KindAdGuard, Name: "AdGuard Home", URL: ag})
	}
	tabs = append(tabs, TabConfig{ID: idWeather, Kind: KindWeather, Name: "Your Weather"})
	if rs := LoadRouterSettings(); rs.Host != "" {
		tabs = append(tabs, TabConfig{ID: idRouterHomeGL, Kind: KindGLiNet, Name: "Brume 3", Icon: "firewall"})
		if rs.StartWithWindows {
			s.StartWithWindows = true
		}
	}
	flint := LoadTabRouterSettings(idLegacyFlint)
	if flint.Host == "" && s.FlintHost != "" {
		flint.Host, flint.PinnedCertSha256 = s.FlintHost, s.FlintCertSha256
		flint.Save()
	}
	if flint.Host != "" {
		tabs = append(tabs, TabConfig{ID: idLegacyFlint, Kind: KindGLiNet, Name: "Flint 3", Icon: "wifi", IPMayChange: true})
	}
	// earlier versions remembered the tab by position: HA, AdGuard, Weather, Brume, Flint
	if s.TabLayout < 2 && s.LastTab >= 2 {
		s.LastTab++
	}
	if old := []string{idLegacyHA, idLegacyAG, idWeather, idRouterHomeGL, idLegacyFlint}; s.LastTab >= 0 && s.LastTab < len(old) {
		s.LastTabID = old[s.LastTab]
	}
	s.Tabs = tabs
	s.HomeAssistantURL, s.AdGuardURL, s.FlintHost, s.FlintCertSha256 = "", "", "", ""
	s.LastTab, s.TabLayout = 0, 0
}

// SuggestTabs proposes tabs for a first-time setup from apps already on this PC.
func SuggestTabs() []TabConfig {
	var tabs []TabConfig
	if u := readURL("HomeAssistantDesktop"); u != "" {
		tabs = append(tabs, TabConfig{ID: idLegacyHA, Kind: KindHomeAssistant, Name: "Home Assistant", URL: u})
	}
	if u := readURL("AdGuardHomeDesktop"); u != "" {
		tabs = append(tabs, TabConfig{ID: idLegacyAG, Kind: KindAdGuard, Name: "AdGuard Home", URL: u})
	}
	if rs := LoadRouterSettings(); rs.Host != "" {
		tabs = append(tabs, TabConfig{ID: idRouterHomeGL, Kind: KindGLiNet, Name: "Router", Icon: "router"})
	}
	return tabs
}

func (s *HubSettings) Save() {
	_ = os.MkdirAll(filepath.Dir(hubSettingsPath()), 0o755)
	data, _ := json.MarshalIndent(s, "", "  ")
	_ = os.WriteFile(hubSettingsPath(), data, 0o600)
	s.existed = true
}

func (s *HubSettings) keepInTray() bool   { return s.KeepInTray == nil || *s.KeepInTray }
func (s *HubSettings) updateChecks() bool { return s.UpdateCheck == nil || *s.UpdateCheck }

// ---------------------------------------------------------------- tab validation

const maxTabs = 12

func validKind(k string) bool {
	switch k {
	case KindHomeAssistant, KindAdGuard, KindWeather, KindGLiNet, KindWeb:
		return true
	}
	return false
}

func newTabID() string {
	b := make([]byte, 5)
	_, _ = rand.Read(b)
	return "t" + hex.EncodeToString(b)
}

var idOK = func(id string) bool {
	if id == "" || len(id) > 24 {
		return false
	}
	for _, c := range id {
		if !(c >= 'a' && c <= 'z' || c >= '0' && c <= '9') {
			return false
		}
	}
	return true
}

// CleanTabs drops broken entries and duplicates from a saved tab list.
func CleanTabs(in []TabConfig) []TabConfig {
	var out []TabConfig
	seen := map[string]bool{}
	weather := false
	for _, t := range in {
		if !validKind(t.Kind) || !idOK(t.ID) || seen[t.ID] {
			continue
		}
		if t.Kind == KindWeather {
			if weather {
				continue
			}
			weather = true
			t.ID = idWeather
		}
		if t.Name = strings.TrimSpace(t.Name); t.Name == "" {
			t.Name = DefaultTabName(t.Kind)
		}
		seen[t.ID] = true
		out = append(out, t)
		if len(out) == maxTabs {
			break
		}
	}
	return out
}

func DefaultTabName(kind string) string {
	switch kind {
	case KindHomeAssistant:
		return "Home Assistant"
	case KindAdGuard:
		return "AdGuard Home"
	case KindWeather:
		return "Your Weather"
	case KindGLiNet:
		return "Router"
	}
	return "Web page"
}

// NormalizeURL turns what someone typed ("192.168.1.10:8123", "nas.local")
// into a full http(s) address. defPort is added when no port is given.
func NormalizeURL(raw string, defPort int) (string, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return "", errors.New("Enter an address.")
	}
	if !strings.Contains(s, "://") {
		s = "http://" + s
	}
	u, err := url.Parse(s)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Hostname() == "" || strings.ContainsAny(u.Hostname(), " \"'<>\\") {
		return "", errors.New("That doesn't look like a web address. Try something like http://192.168.1.10:8123")
	}
	if u.Port() == "" && defPort > 0 && !strings.Contains(raw, "://") {
		u.Host = net.JoinHostPort(u.Hostname(), strconv.Itoa(defPort))
	}
	if u.Path == "" {
		u.Path = "/"
	}
	u.User = nil
	return u.String(), nil
}

// NormalizeHost cleans a router address ("https://192.168.8.1/" → "192.168.8.1").
func NormalizeHost(raw string) (string, error) {
	h := strings.TrimSpace(raw)
	for _, pre := range []string{"https://", "http://"} {
		if strings.HasPrefix(strings.ToLower(h), pre) {
			h = h[len(pre):]
		}
	}
	if i := strings.IndexAny(h, "/?#"); i >= 0 {
		h = h[:i]
	}
	if i := strings.LastIndex(h, "@"); i >= 0 {
		h = h[i+1:]
	}
	if h == "" {
		return "", errors.New("Enter the router's IP address.")
	}
	host := h
	if hh, _, err := net.SplitHostPort(h); err == nil {
		host = hh
	}
	if host == "" || strings.ContainsAny(host, " \"'<>\\") {
		return "", errors.New("That doesn't look like an IP address or name. Try something like 192.168.8.1")
	}
	return h, nil
}
