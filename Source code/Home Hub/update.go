package main

// Update check: once a day Home Hub asks GitHub for its latest release and
// announces a newer version once. It never downloads or installs anything.

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type releaseInfo struct {
	Version string // "1.2.0"
	URL     string // release page
	Notes   string
}

var versionRe = regexp.MustCompile(`\d+(\.\d+)*`)

// versionNewer reports whether a is newer than b ("1.10" > "1.9", a leading "v" or other text is ignored).
func versionNewer(a, b string) bool {
	pa, pb := versionRe.FindString(a), versionRe.FindString(b)
	if pa == "" {
		return false
	}
	x, y := strings.Split(pa, "."), strings.Split(pb, ".")
	for i := 0; i < len(x) || i < len(y); i++ {
		var u, v int
		if i < len(x) {
			u, _ = strconv.Atoi(x[i])
		}
		if i < len(y) {
			v, _ = strconv.Atoi(y[i])
		}
		if u != v {
			return u > v
		}
	}
	return false
}

var releaseAPI = func(repo string) string { return "https://api.github.com/repos/" + repo + "/releases/latest" }

func latestRelease(repo string) (*releaseInfo, error) {
	cl := &http.Client{Timeout: 20 * time.Second}
	req, _ := http.NewRequest("GET", releaseAPI(repo), nil)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "HomeHub/"+appVersion)
	resp, err := cl.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, errors.New("GitHub answered " + resp.Status)
	}
	var r struct {
		Tag        string `json:"tag_name"`
		URL        string `json:"html_url"`
		Body       string `json:"body"`
		Draft      bool   `json:"draft"`
		Prerelease bool   `json:"prerelease"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&r); err != nil {
		return nil, err
	}
	v := versionRe.FindString(r.Tag)
	if v == "" || r.Draft || r.Prerelease {
		return nil, errors.New("no usable release")
	}
	if !strings.HasPrefix(r.URL, "https://github.com/") {
		r.URL = "https://github.com/" + repo + "/releases/latest"
	}
	return &releaseInfo{Version: v, URL: r.URL, Notes: r.Body}, nil
}
