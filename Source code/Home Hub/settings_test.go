package main

import (
	"os"
	"path/filepath"
	"testing"
)

func writeJSON(t *testing.T, path, body string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

func useTempProfile(t *testing.T) string {
	dir := t.TempDir()
	t.Setenv("APPDATA", filepath.Join(dir, "Roaming"))
	t.Setenv("LOCALAPPDATA", filepath.Join(dir, "Local"))
	return dir
}

func TestFreshInstallHasNoTabs(t *testing.T) {
	useTempProfile(t)
	s := LoadHubSettings()
	if len(s.Tabs) != 0 || s.SetupDone || s.existed {
		t.Fatalf("fresh install: %+v", s)
	}
}

func TestMigrateFixedTabs(t *testing.T) {
	useTempProfile(t)
	writeJSON(t, routerSettingsPath(), `{"Host":"10.0.0.1","Username":"root","StartWithWindows":true}`)
	writeJSON(t, hubSettingsPath(), `{"homeAssistantUrl":"http://10.0.0.5:8123","adGuardUrl":"http://10.0.0.5:8080/",
		"flintHost":"10.0.0.2","flintCertSha256":"ab","lastTab":3,"tabLayout":2,"pin":{"pinHash":"x"}}`)
	s := LoadHubSettings()
	want := []string{idLegacyHA, idLegacyAG, idWeather, idRouterHomeGL, idLegacyFlint}
	if len(s.Tabs) != len(want) {
		t.Fatalf("tabs: %+v", s.Tabs)
	}
	for i, id := range want {
		if s.Tabs[i].ID != id {
			t.Fatalf("tab %d = %s, want %s", i, s.Tabs[i].ID, id)
		}
	}
	if s.Tabs[0].URL != "http://10.0.0.5:8123" || !s.Tabs[4].IPMayChange || s.Tabs[3].Name != "Brume 3" {
		t.Fatalf("details: %+v", s.Tabs)
	}
	if s.LastTabID != idRouterHomeGL || !s.StartWithWindows || s.SetupDone {
		t.Fatalf("last tab %q startup %v setup %v", s.LastTabID, s.StartWithWindows, s.SetupDone)
	}
	if f := LoadTabRouterSettings(idLegacyFlint); f.Host != "10.0.0.2" || f.PinnedCertSha256 != "ab" {
		t.Fatalf("flint settings not carried over: %+v", f)
	}
	s.Save()
	again := LoadHubSettings()
	if len(again.Tabs) != 5 || again.HomeAssistantURL != "" || again.LastTabID != idRouterHomeGL {
		t.Fatalf("after save: %+v", again)
	}
}

func TestMigrateOldLayoutShift(t *testing.T) {
	useTempProfile(t)
	writeJSON(t, hubSettingsPath(), `{"homeAssistantUrl":"http://h:8123","lastTab":2}`)
	if s := LoadHubSettings(); s.LastTabID != idRouterHomeGL {
		t.Fatalf("pre-weather tab 2 should become the router, got %q", s.LastTabID)
	}
}

func TestCleanTabs(t *testing.T) {
	in := []TabConfig{
		{ID: "a1", Kind: KindWeb, Name: " NAS "},
		{ID: "a1", Kind: KindWeb, Name: "dup"},
		{ID: "Bad!", Kind: KindWeb},
		{ID: "w1", Kind: KindWeather},
		{ID: "w2", Kind: KindWeather},
		{ID: "x1", Kind: "nope"},
		{ID: "g1", Kind: KindGLiNet},
	}
	out := CleanTabs(in)
	if len(out) != 3 || out[0].Name != "NAS" || out[1].ID != idWeather || out[2].Name != "Router" {
		t.Fatalf("got %+v", out)
	}
}

func TestNormalizeURL(t *testing.T) {
	cases := []struct {
		in   string
		port int
		want string
		ok   bool
	}{
		{"192.168.1.10", 8123, "http://192.168.1.10:8123/", true},
		{"192.168.1.10:9000", 8123, "http://192.168.1.10:9000/", true},
		{"https://ha.local", 8123, "https://ha.local/", true},
		{"http://user:pw@nas.local/admin", 0, "http://nas.local/admin", true},
		{"", 0, "", false},
		{"ftp://x", 0, "", false},
		{"http://<script>", 0, "", false},
	}
	for _, c := range cases {
		got, err := NormalizeURL(c.in, c.port)
		if (err == nil) != c.ok || got != c.want {
			t.Errorf("NormalizeURL(%q) = %q, %v", c.in, got, err)
		}
	}
	for in, want := range map[string]string{"https://192.168.8.1/#/login": "192.168.8.1", " 10.0.0.1 ": "10.0.0.1", "router.lan:8443": "router.lan:8443"} {
		if got, err := NormalizeHost(in); err != nil || got != want {
			t.Errorf("NormalizeHost(%q) = %q, %v", in, got, err)
		}
	}
	if _, err := NormalizeHost("  "); err == nil {
		t.Error("blank host accepted")
	}
}
