package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestVersionNewer(t *testing.T) {
	for _, c := range []struct {
		a, b string
		want bool
	}{{"v1.1.0", "1.0.0", true}, {"1.0", "1.0.0", false}, {"1.10", "1.9", true}, {"1.9", "1.10", false}, {"Version 2", "1.9.9", true}, {"", "1", false}} {
		if got := versionNewer(c.a, c.b); got != c.want {
			t.Errorf("versionNewer(%q,%q)=%v", c.a, c.b, got)
		}
	}
}

func TestLatestRelease(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"tag_name":"v1.2.0","html_url":"https://github.com/o/r/releases/tag/v1.2.0","body":"notes"}`))
	}))
	defer srv.Close()
	old := releaseAPI
	releaseAPI = func(string) string { return srv.URL }
	defer func() { releaseAPI = old }()
	r, err := latestRelease("o/r")
	if err != nil || r.Version != "1.2.0" || r.URL != "https://github.com/o/r/releases/tag/v1.2.0" {
		t.Fatalf("%+v %v", r, err)
	}
}
