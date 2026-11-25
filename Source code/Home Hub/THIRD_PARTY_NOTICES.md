# Third-party notices

## Code included in Home Hub

| Component | Where | License |
|---|---|---|
| [go-webview2](https://github.com/wailsapp/go-webview2) (modified, see [PATCHES.md](third_party/go-webview2/PATCHES.md)) | `third_party/go-webview2` | MIT, © 2020 John Chadwick, © Wails contributors |
| [go-winloader](https://github.com/jchv/go-winloader) | Go module | MIT, © John Chadwick |
| [golang.org/x/sys](https://github.com/golang/sys) | Go module | BSD-3-Clause, © The Go Authors |
| [Chart.js 4.4.7](https://www.chartjs.org) | `weather/chart.umd.js` | MIT, © Chart.js Contributors |
| [SunCalc 1.9.0](https://github.com/mourner/suncalc) | `weather/suncalc.js` | BSD-2-Clause, © Vladimir Agafonkin |
| [Lucide icons 0.468.0](https://lucide.dev) (the ones the weather page uses) | `weather/icons.js` | ISC, © Lucide Contributors (parts MIT, © Cole Bemis, Feather) |
| [Tailwind CSS 3](https://tailwindcss.com) (generated stylesheet) | `weather/tailwind.css` | MIT, © Tailwind Labs |
| [Inter](https://rsms.me/inter/) typeface | `weather/InterVariable.woff2` | SIL Open Font License 1.1, © The Inter Project Authors |

Full license texts for the weather page's files are in [`weather/licenses`](weather/licenses).

Build-time only (not in the app): [tc-hib/winres](https://github.com/tc-hib/winres) (0BSD) in `tools/winres`.

## Online services the Your Weather tab uses

Requests go straight from the tab to these services; Home Hub has no server of its own.

| Service | Used for | Terms |
|---|---|---|
| [National Weather Service API](https://www.weather.gov/documentation/services-web-api) | Forecasts and alerts (US) | Public domain (US government) |
| [Open-Meteo](https://open-meteo.com) | Hourly details and air quality | [CC BY 4.0](https://open-meteo.com/en/license), attribution in the page footer |
| [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org) | City search | [Usage policy](https://operations.osmfoundation.org/policies/nominatim/), data © OpenStreetMap contributors (ODbL) |
| [Ventusky](https://www.ventusky.com) | Radar map (embedded page) | Ventusky's terms |
| [ipapi.co](https://ipapi.co), [ipwho.is](https://ipwho.is) | Approximate location when Windows location isn't available | Their terms |

## Names

GL.iNet, Home Assistant and AdGuard are trademarks of their owners. Home Hub isn't affiliated with or endorsed
by them; the names only describe what Home Hub can open. The tab icons are Home Hub's own.
