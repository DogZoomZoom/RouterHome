//go:build windows

package main

// Weather tab: the Your Weather page and its libraries, served to the embedded browser from a
// private virtual host (https://weather.homehub) instead of a local server.

import (
	"embed"
	"os"
	"path/filepath"

	"github.com/wailsapp/go-webview2/pkg/webview2"
)

//go:embed weather/index.html weather/icon.png weather/tailwind.css weather/chart.umd.js weather/suncalc.js weather/icons.js weather/InterVariable.woff2
var weatherFiles embed.FS

const weatherHost = "weather.homehub"

func weatherSiteDir() string { return filepath.Join(localDir("HomeHub"), "Weather", "site") }

// openWeather writes the page to disk, maps it to https://weather.homehub and opens it.
func (a *App) openWeather(p *pane) {
	dir := weatherSiteDir()
	_ = os.MkdirAll(dir, 0o755)
	for _, name := range []string{"index.html", "icon.png", "tailwind.css", "chart.umd.js", "suncalc.js", "icons.js", "InterVariable.woff2"} {
		data, _ := weatherFiles.ReadFile("weather/" + name)
		if err := os.WriteFile(filepath.Join(dir, name), data, 0o644); err != nil {
			logf("weather: couldn't write %s: %v", name, err)
		}
	}
	wv3 := p.wv.GetICoreWebView2_3()
	if wv3 == nil {
		p.navString("<!doctype html><meta charset=utf-8><body style=\"font:15px Segoe UI,sans-serif;padding:40px\">" +
			"<h2>The Weather tab needs a newer Microsoft Edge WebView2 Runtime</h2><p>Update Microsoft Edge (or the WebView2 Runtime) and restart Home Hub.</p></body>")
		return
	}
	if err := wv3.SetVirtualHostNameToFolderMapping(weatherHost, dir, webview2.COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_ALLOW); err != nil {
		logf("weather: virtual host mapping failed: %v", err)
	}
	p.nav("https://" + weatherHost + "/index.html")
}
