//go:build windows

package main

import (
	_ "embed"
	"encoding/pem"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
	"unsafe"

	"github.com/wailsapp/go-webview2/pkg/edge"
	"github.com/wailsapp/go-webview2/pkg/webview2"
	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

//go:embed signin.html
var signinHTML string

const appName = "Home Hub"

// Icon resource IDs (see build.ps1 / tools/winres).
const (
	iconApp       = 1
	iconHA        = 10
	iconAdGuard   = 11
	iconFirewall  = 12
	iconWifi      = 13
	iconWeather   = 14
	iconRouter    = 15
	iconWeb       = 16
	maxShortcuts  = 9
	cmdTabBase    = 1200
	trayTabLimit  = maxTabs
	stripBtnCount = 3
)

func iconIDFor(c TabConfig) int {
	switch c.Kind {
	case KindHomeAssistant:
		return iconHA
	case KindAdGuard:
		return iconAdGuard
	case KindWeather:
		return iconWeather
	case KindGLiNet:
		switch c.Icon {
		case "firewall":
			return iconFirewall
		case "wifi":
			return iconWifi
		}
		return iconRouter
	}
	return iconWeb
}

func accentFor(c TabConfig) [3]uint8 {
	switch c.Kind {
	case KindHomeAssistant:
		return [3]uint8{245, 124, 0}
	case KindAdGuard:
		return [3]uint8{0, 150, 136}
	case KindWeather:
		return [3]uint8{14, 165, 233}
	case KindGLiNet:
		switch c.Icon {
		case "firewall":
			return [3]uint8{92, 146, 240}
		case "wifi":
			return [3]uint8{175, 82, 222}
		}
		return [3]uint8{30, 136, 229}
	}
	return [3]uint8{92, 107, 192}
}

// machomeJS switches GL.iNet's admin page to Router Home's Home tab when it's installed.
const machomeJS = "(function(){var n=0;var t=setInterval(function(){try{var el=document.getElementById('app');var vm=el&&el.__vue__;var r=vm&&vm.$router;\n" +
	"          if(r){var res=r.resolve({name:'machome'});if(res&&res.route&&res.route.matched&&res.route.matched.length){if(r.currentRoute.name!=='machome'&&r.currentRoute.name!=='login'){r.push({name:'machome'}).catch(function(){});}clearInterval(t);return;}}}catch(e){}\n" +
	"          if(++n>60)clearInterval(t);},250);})();"

// tabView is one tab in the strip, with its browser pane.
type tabView struct {
	cfg     TabConfig
	pane    *pane
	dev     *device // GL.iNet routers only
	icon    uintptr
	rect    RECT
	compact bool // shown as an icon only when the strip is full
}

type pane struct {
	t        *tabView // nil for the lock / setup screen
	hwnd     uintptr
	web      *edge.Chromium
	wv       *webview2.ICoreWebView2
	created  bool
	creating bool
	dataPath string
	title    string
	keep     []interface{} // COM handlers that must stay alive

	signInVisible bool
	nonce         string
}

type palette struct {
	bar, selected, hover, text, muted, border, paneBg uintptr
	paneRGB                                           [3]uint8
}

type App struct {
	hwnd  uintptr
	hinst uintptr
	hub   *HubSettings
	lk    lockState

	tabs []*tabView
	cur  *tabView

	devMu sync.Mutex
	devs  []*device // routers being watched (read by the monitor goroutine)

	dpi                            int
	fontTab, fontTabBold, fontIcon uintptr
	hover                          int // tab index, 100+button, or -1
	tracking                       bool
	btnRects                       [stripBtnCount]RECT
	dark                           bool
	pal                            palette

	trayAdded      bool
	trayState      int
	trayTip        string
	trayIcons      map[int]uintptr
	taskbarCreated uint32
	hinted         bool
	balloonTab     *tabView // balloon click opens this tab
	balloonURL     string   // ...or this page
	quitting       bool
	update         *releaseInfo

	qmu   sync.Mutex
	queue []func()
}

var app *App

// Safe wrappers: the library's own helpers terminate the process on any COM
// error, so pane operations go through the error-returning bindings instead.
func (p *pane) nav(u string) {
	if p.wv == nil {
		return
	}
	if err := p.wv.Navigate(u); err != nil {
		p.navString("<!doctype html><meta charset=utf-8><body style=\"font:15px Segoe UI,sans-serif;padding:40px;color:#555\">" +
			"<h2 style=\"font-weight:600;color:#222\">Can't open this address</h2><p>" + htmlEsc(u) + "</p>" +
			"<p>Right-click the tab and choose <b>Edit tabs</b> to fix it.</p></body>")
	}
}

func (p *pane) navString(html string) {
	if p.wv != nil {
		_ = p.wv.NavigateToString(html)
	}
}

func (p *pane) eval(js string) {
	if p.wv != nil {
		_ = p.wv.ExecuteScript(js, nil)
	}
}

func (p *pane) focus() {
	if p.web == nil {
		return
	}
	if c := p.web.GetController(); c != nil {
		_ = c.MoveFocus(edge.COREWEBVIEW2_MOVE_FOCUS_REASON_PROGRAMMATIC)
	}
}

func htmlEsc(s string) string {
	return strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", "\"", "&quot;").Replace(s)
}

// ---------------------------------------------------------------- entry

func runApp() {
	initLog()
	defer guard("startup")
	logf("---- Home Hub %s starting: %s %v", appVersion, exePath(), os.Args[1:])
	startInTray := false
	for _, a := range os.Args[1:] {
		if strings.EqualFold(a, "--tray") {
			startInTray = true
		}
	}

	mutexHandle, err := windows.CreateMutex(nil, false, u16(`Local\HomeHub.SingleInstance`))
	if err == windows.ERROR_ALREADY_EXISTS {
		w, _, _ := pFindWindowW.Call(uintptr(unsafe.Pointer(u16("HomeHubWindow"))), 0)
		logf("another instance is running (window=%x)", w)
		if w != 0 {
			pPostMessageW.Call(w, WM_APP_SHOW, 0, 0)
		} else {
			messageBox(0, "Home Hub is already running but its window isn't ready yet.\n\nIf this keeps happening, open Task Manager, end \"HomeHub.exe\", and start it again.", appName, MB_ICONINFORMATION|MB_SETFOREGROUND)
		}
		return
	}

	if err := cryptSelfTest(); err != nil {
		messageBox(0, "Internal check failed: "+err.Error(), appName, MB_ICONERROR)
		return
	}

	a := &App{
		hub:       LoadHubSettings(),
		trayState: -1,
		trayTip:   appName,
		trayIcons: map[int]uintptr{},
		hover:     -1,
	}
	app = a
	a.lk.mutex = mutexHandle
	// tabs stay closed until setup is done and the PIN (if any) is entered
	a.lk.locked = a.hub.Pin.IsSet() || !a.hub.SetupDone || !a.hub.NoPin
	logf("settings loaded: %d tabs, setup done %v, PIN %v", len(a.hub.Tabs), a.hub.SetupDone, a.hub.Pin.IsSet())
	a.migrate()
	a.cleanupRemovedTabs()
	a.warnOldApps()

	a.createWindow()
	logf("window created hwnd=%x dpi=%d", a.hwnd, a.dpi)
	if err := a.wipeSessions(); err != nil {
		messageBox(a.hwnd, err.Error(), appName, MB_ICONERROR)
	}
	a.addTray()
	a.refreshTray()

	go func() {
		defer guard("router monitor")
		time.Sleep(3 * time.Second)
		a.checkAll(false)
		t := time.NewTicker(30 * time.Second)
		for range t.C {
			a.checkAll(false)
		}
	}()
	go a.updateLoop()

	if !startInTray || !a.hub.SetupDone {
		a.showMain(nil)
	}
	logf("entering message loop")

	var msg MSG
	for {
		r, _, _ := pGetMessageW.Call(uintptr(unsafe.Pointer(&msg)), 0, 0, 0)
		if int32(r) <= 0 {
			break
		}
		pTranslateMessage.Call(uintptr(unsafe.Pointer(&msg)))
		pDispatchMessageW.Call(uintptr(unsafe.Pointer(&msg)))
	}
	a.removeTray()
	logf("exited normally")
}

// post runs fn on the UI thread.
func (a *App) post(fn func()) {
	a.qmu.Lock()
	a.queue = append(a.queue, fn)
	a.qmu.Unlock()
	pPostMessageW.Call(a.hwnd, WM_APP_RUN, 0, 0)
}

func (a *App) drain() {
	a.qmu.Lock()
	q := a.queue
	a.queue = nil
	a.qmu.Unlock()
	for _, fn := range q {
		fn()
	}
}

// ---------------------------------------------------------------- startup helpers

func exePath() string {
	p, err := os.Executable()
	if err != nil {
		return ""
	}
	return p
}

const runKey = `Software\Microsoft\Windows\CurrentVersion\Run`

func applyStartup(enabled bool) {
	k, err := registry.OpenKey(registry.CURRENT_USER, runKey, registry.SET_VALUE|registry.QUERY_VALUE)
	if err != nil {
		return
	}
	defer k.Close()
	if enabled {
		_ = k.SetStringValue("HomeHub", `"`+exePath()+`" --tray`)
	} else {
		_ = k.DeleteValue("HomeHub")
	}
}

func startupOn() bool {
	k, err := registry.OpenKey(registry.CURRENT_USER, runKey, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer k.Close()
	_, _, err = k.GetStringValue("HomeHub")
	return err == nil
}

// migrate replaces the Router Home app's "start with Windows" entry with Home
// Hub's (once), and keeps the startup entry pointing at this copy of Home Hub.
func (a *App) migrate() {
	if !a.hub.Migrated {
		if k, err := registry.OpenKey(registry.CURRENT_USER, runKey, registry.SET_VALUE|registry.QUERY_VALUE); err == nil {
			if _, _, err := k.GetStringValue("RouterHome"); err == nil {
				_ = k.DeleteValue("RouterHome")
				a.hub.StartWithWindows = true
			}
			k.Close()
		}
		if a.hub.StartWithWindows {
			applyStartup(true)
		}
		a.hub.Migrated = true
		a.hub.Save()
	}
	if startupOn() {
		applyStartup(true) // the exe may have moved
	}
}

// cleanupRemovedTabs deletes the browser profiles of tabs removed last time
// (they can't be deleted while their browser is still running).
func (a *App) cleanupRemovedTabs() {
	if len(a.hub.PendingDelete) == 0 {
		return
	}
	var left []string
	for _, d := range a.hub.PendingDelete {
		if !strings.Contains(strings.ToLower(d), `\homehub\tabs\`) {
			continue // only ever Home Hub's own per-tab folders
		}
		if err := os.RemoveAll(d); err != nil {
			left = append(left, d)
		}
	}
	a.hub.PendingDelete = left
	a.hub.Save()
}

func mutexExists(name string) bool {
	const SYNCHRONIZE = 0x00100000
	h, err := windows.OpenMutex(SYNCHRONIZE, false, u16(name))
	if err != nil {
		return false
	}
	windows.CloseHandle(h)
	return true
}

func (a *App) warnOldApps() {
	var running []string
	if mutexExists("RouterHome.SingleInstance") {
		running = append(running, "•  the Router Home app (right-click its tray icon and choose Exit)")
	}
	if mutexExists(`Local\HomeAssistantDesktopSingleton`) {
		running = append(running, "•  the separate Home Assistant app")
	}
	if mutexExists(`Local\AdGuardHomeDesktopSingleton`) {
		running = append(running, "•  the separate AdGuard Home app")
	}
	if len(running) == 0 {
		return
	}
	messageBox(0, "Home Hub replaces these apps, and they're still open:\n\n"+strings.Join(running, "\n")+
		"\n\nPlease close them, then click OK. They share the same saved logins, so having both open can stop a tab from loading.",
		appName, MB_ICONINFORMATION|MB_SETFOREGROUND)
}

// ---------------------------------------------------------------- window

func (a *App) createWindow() {
	hinst := moduleHandle()
	a.hinst = hinst
	cursor, _, _ := pLoadCursorW.Call(0, IDC_ARROW)

	a.dark = systemDark()
	a.pal = makePalette(a.dark)

	wc := WNDCLASSEXW{
		Style:         CS_DBLCLKS,
		LpfnWndProc:   newCallback(wndProc),
		HInstance:     hinst,
		HIcon:         loadIcon(iconApp, 32),
		HCursor:       cursor,
		LpszClassName: u16("HomeHubWindow"),
		HIconSm:       loadIcon(iconApp, 16),
	}
	wc.CbSize = uint32(unsafe.Sizeof(wc))
	pRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc)))

	pc := WNDCLASSEXW{
		LpfnWndProc:   pDefWindowProcW.Addr(),
		HInstance:     hinst,
		HCursor:       cursor,
		HbrBackground: a.pal.paneBg,
		LpszClassName: u16("HomeHubPane"),
	}
	pc.CbSize = uint32(unsafe.Sizeof(pc))
	pRegisterClassExW.Call(uintptr(unsafe.Pointer(&pc)))

	hwnd, _, _ := pCreateWindowExW.Call(0,
		uintptr(unsafe.Pointer(u16("HomeHubWindow"))),
		uintptr(unsafe.Pointer(u16(appName))),
		WS_OVERLAPPEDWINDOW|WS_CLIPCHILDREN,
		CW_USEDEFAULT, CW_USEDEFAULT, uintptr(a.hub.WindowW), uintptr(a.hub.WindowH),
		0, 0, hinst, 0)
	a.hwnd = hwnd
	a.dpi = dpiOf(hwnd)
	a.applyDarkTitle()
	a.loadFonts()

	for _, c := range a.hub.Tabs {
		a.tabs = append(a.tabs, a.newTabView(c))
	}
	a.syncDevices()
	a.cur = a.tabByID(a.hub.LastTabID)
	if a.cur == nil && len(a.tabs) > 0 {
		a.cur = a.tabs[0]
	}
	a.createLockPaneWindow(hwnd, hinst)
	a.taskbarCreated = registerMsg("TaskbarCreated")
	a.layout()
}

func (a *App) newTabView(c TabConfig) *tabView {
	ph, _, _ := pCreateWindowExW.Call(0,
		uintptr(unsafe.Pointer(u16("HomeHubPane"))), 0,
		WS_CHILD|WS_CLIPSIBLINGS|WS_CLIPCHILDREN,
		0, 0, 100, 100, a.hwnd, 0, a.hinst, 0)
	t := &tabView{cfg: c}
	t.pane = &pane{t: t, hwnd: ph, dataPath: tabDataDir(c)}
	if c.Kind == KindGLiNet {
		t.dev = a.newDevice(t)
	}
	t.icon = loadIcon(iconIDFor(c), int(a.sc(16)))
	return t
}

// syncDevices refreshes the list of routers the background monitor watches.
func (a *App) syncDevices() {
	var ds []*device
	for _, t := range a.tabs {
		if t.dev != nil {
			ds = append(ds, t.dev)
		}
	}
	a.devMu.Lock()
	a.devs = ds
	a.devMu.Unlock()
}

func (a *App) tabByID(id string) *tabView {
	for _, t := range a.tabs {
		if t.cfg.ID == id {
			return t
		}
	}
	return nil
}

func (a *App) tabIndex(t *tabView) int {
	for i, x := range a.tabs {
		if x == t {
			return i
		}
	}
	return -1
}

func registerMsg(name string) uint32 {
	r, _, _ := pRegisterWindowMessageW.Call(uintptr(unsafe.Pointer(u16(name))))
	return uint32(r)
}

func systemDark() bool {
	k, err := registry.OpenKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer k.Close()
	v, _, err := k.GetIntegerValue("AppsUseLightTheme")
	return err == nil && v == 0
}

func makePalette(dark bool) palette {
	var p palette
	if dark {
		p = palette{bar: rgb(30, 31, 35), selected: rgb(46, 48, 54), hover: rgb(41, 43, 48), text: rgb(236, 238, 242), muted: rgb(163, 169, 180), border: rgb(52, 54, 60), paneRGB: [3]uint8{24, 25, 28}}
	} else {
		p = palette{bar: rgb(237, 239, 243), selected: rgb(255, 255, 255), hover: rgb(225, 229, 235), text: rgb(31, 35, 41), muted: rgb(91, 100, 114), border: rgb(213, 217, 224), paneRGB: [3]uint8{255, 255, 255}}
	}
	b, _, _ := pCreateSolidBrush.Call(rgb(p.paneRGB[0], p.paneRGB[1], p.paneRGB[2]))
	p.paneBg = b
	return p
}

func (a *App) applyDarkTitle() {
	if pDwmSetWindowAttribute.Find() != nil {
		return
	}
	v := int32(0)
	if a.dark {
		v = 1
	}
	pDwmSetWindowAttribute.Call(a.hwnd, 20, uintptr(unsafe.Pointer(&v)), 4)
}

func (a *App) sc(v float64) int32 { return int32(v*float64(a.dpi)/96 + 0.5) }

func makeFont(height int32, weight int, face string) uintptr {
	f, _, _ := pCreateFontW.Call(uintptr(-height), 0, 0, 0, uintptr(weight), 0, 0, 0, 1, 0, 0, 5 /*CLEARTYPE*/, 0, uintptr(unsafe.Pointer(u16(face))))
	return f
}

func (a *App) loadFonts() {
	for _, f := range []uintptr{a.fontTab, a.fontTabBold, a.fontIcon} {
		if f != 0 {
			pDeleteObject.Call(f)
		}
	}
	a.fontTab = makeFont(a.sc(13.5), 400, "Segoe UI")
	a.fontTabBold = makeFont(a.sc(13.5), 600, "Segoe UI")
	a.fontIcon = makeFont(a.sc(15), 400, "Segoe MDL2 Assets")
}

func (a *App) reloadIcons() {
	for _, t := range a.tabs {
		if t.icon != 0 {
			pDestroyIcon.Call(t.icon)
		}
		t.icon = loadIcon(iconIDFor(t.cfg), int(a.sc(16)))
	}
}

func (a *App) stripHeight() int32 { return a.sc(42) }

func clientRect(h uintptr) RECT {
	var r RECT
	pGetClientRect.Call(h, uintptr(unsafe.Pointer(&r)))
	return r
}

func (a *App) layout() {
	rc := clientRect(a.hwnd)
	w, h := rc.Right, rc.Bottom
	sh := a.stripHeight()
	for _, t := range a.tabs {
		p := t.pane
		pMoveWindow.Call(p.hwnd, 0, uintptr(sh), uintptr(w), uintptr(max32(h-sh, 0)), 1)
		if p.created {
			p.web.Resize()
		}
		show := uintptr(SW_HIDE)
		if t == a.cur && !a.lk.overlay {
			show = SW_SHOW
		}
		pShowWindow.Call(p.hwnd, show)
	}
	if lp := a.lk.pane; lp != nil {
		pMoveWindow.Call(lp.hwnd, 0, 0, uintptr(w), uintptr(h), 1)
		if lp.created {
			lp.web.Resize()
		}
		show := uintptr(SW_HIDE)
		if a.lk.overlay {
			show = SW_SHOW
		}
		pShowWindow.Call(lp.hwnd, show)
	}
	a.computeRects(w)
	pInvalidateRect.Call(a.hwnd, 0, 0)
}

func max32(a, b int32) int32 {
	if a > b {
		return a
	}
	return b
}

func (a *App) textWidth(font uintptr, s string) int32 {
	dc, _, _ := pCreateCompatibleDC.Call(0)
	defer pDeleteDC.Call(dc)
	old, _, _ := pSelectObject.Call(dc, font)
	defer pSelectObject.Call(dc, old)
	w, _ := windows.UTF16FromString(s)
	var sz struct{ CX, CY int32 }
	if len(w) > 1 {
		pGetTextExtentPoint32W.Call(dc, uintptr(unsafe.Pointer(&w[0])), uintptr(len(w)-1), uintptr(unsafe.Pointer(&sz)))
	}
	return sz.CX
}

func (a *App) computeRects(w int32) {
	sh := a.stripHeight()
	bs := a.sc(30)
	right := w - a.sc(8)
	for i := stripBtnCount - 1; i >= 0; i-- {
		a.btnRects[i] = RECT{right - bs, (sh - bs) / 2, right, (sh-bs)/2 + bs}
		right -= bs + a.sc(2)
	}
	avail := a.btnRects[0].Left - a.sc(8)

	top, bottom := a.sc(6), sh-a.sc(6)
	widths := make([]int32, len(a.tabs))
	iconOnly := a.sc(12) + a.sc(16) + a.sc(12)
	total := int32(0)
	for i, t := range a.tabs {
		widths[i] = a.sc(12) + a.sc(16) + a.sc(8) + a.textWidth(a.fontTabBold, t.cfg.Name) + a.sc(14)
		if t.dev != nil {
			widths[i] += a.sc(14)
		}
		total += widths[i] + a.sc(4)
	}
	// When the tabs don't fit, show the others as icons only.
	compact := total+a.sc(8) > avail
	x := a.sc(8)
	for i, t := range a.tabs {
		tw := widths[i]
		t.compact = compact && t != a.cur
		if t.compact {
			tw = iconOnly
			if t.dev != nil {
				tw += a.sc(10)
			}
		}
		t.rect = RECT{x, top, x + tw, bottom}
		x += tw + a.sc(4)
	}
}

func inRect(r RECT, x, y int32) bool { return x >= r.Left && x < r.Right && y >= r.Top && y < r.Bottom }

func (a *App) hitTest(x, y int32) int {
	for i, t := range a.tabs {
		if inRect(t.rect, x, y) {
			return i
		}
	}
	for i, r := range a.btnRects {
		if inRect(r, x, y) {
			return 100 + i
		}
	}
	return -1
}

func fillRect(dc uintptr, r RECT, color uintptr) {
	b, _, _ := pCreateSolidBrush.Call(color)
	pFillRect.Call(dc, uintptr(unsafe.Pointer(&r)), b)
	pDeleteObject.Call(b)
}

func roundRect(dc uintptr, r RECT, radius int32, color uintptr) {
	b, _, _ := pCreateSolidBrush.Call(color)
	ob, _, _ := pSelectObject.Call(dc, b)
	np, _, _ := pGetStockObject.Call(NULL_PEN)
	op, _, _ := pSelectObject.Call(dc, np)
	pRoundRect.Call(dc, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right+1), uintptr(r.Bottom+1), uintptr(radius), uintptr(radius))
	pSelectObject.Call(dc, op)
	pSelectObject.Call(dc, ob)
	pDeleteObject.Call(b)
}

func ellipse(dc uintptr, r RECT, color uintptr) {
	b, _, _ := pCreateSolidBrush.Call(color)
	ob, _, _ := pSelectObject.Call(dc, b)
	np, _, _ := pGetStockObject.Call(NULL_PEN)
	op, _, _ := pSelectObject.Call(dc, np)
	pEllipse.Call(dc, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right+1), uintptr(r.Bottom+1))
	pSelectObject.Call(dc, op)
	pSelectObject.Call(dc, ob)
	pDeleteObject.Call(b)
}

func drawText(dc uintptr, s string, r RECT, flags uintptr) {
	w, _ := windows.UTF16FromString(s)
	if len(w) < 2 {
		return
	}
	pDrawTextW.Call(dc, uintptr(unsafe.Pointer(&w[0])), uintptr(len(w)-1), uintptr(unsafe.Pointer(&r)), flags)
}

func stateColor(state int) uintptr {
	switch state {
	case 0:
		return rgb(52, 199, 89)
	case 1:
		return rgb(255, 149, 0)
	case 2:
		return rgb(255, 59, 48)
	}
	return rgb(142, 142, 147)
}

func (a *App) paint() {
	var ps PAINTSTRUCT
	hdc, _, _ := pBeginPaint.Call(a.hwnd, uintptr(unsafe.Pointer(&ps)))
	defer pEndPaint.Call(a.hwnd, uintptr(unsafe.Pointer(&ps)))

	rc := clientRect(a.hwnd)
	w, sh := rc.Right, a.stripHeight()
	if w <= 0 || sh <= 0 {
		return
	}
	mem, _, _ := pCreateCompatibleDC.Call(hdc)
	bmp, _, _ := pCreateCompatibleBitmap.Call(hdc, uintptr(w), uintptr(sh))
	oldBmp, _, _ := pSelectObject.Call(mem, bmp)

	p := a.pal
	fillRect(mem, RECT{0, 0, w, sh}, p.bar)
	fillRect(mem, RECT{0, sh - 1, w, sh}, p.border)
	pSetBkMode.Call(mem, TRANSPARENT)

	if len(a.tabs) == 0 {
		of, _, _ := pSelectObject.Call(mem, a.fontTab)
		pSetTextColor.Call(mem, p.muted)
		drawText(mem, "No tabs yet. Click the gear to add some.", RECT{a.sc(16), 0, a.btnRects[0].Left, sh}, DT_LEFT|DT_VCENTER|DT_SINGLELINE|DT_NOPREFIX)
		pSelectObject.Call(mem, of)
	}
	for i, t := range a.tabs {
		r := t.rect
		if t == a.cur {
			roundRect(mem, r, a.sc(8), p.selected)
			ac := accentFor(t.cfg)
			fillRect(mem, RECT{r.Left + a.sc(12), r.Bottom - a.sc(3), r.Right - a.sc(12), r.Bottom - a.sc(1)}, rgb(ac[0], ac[1], ac[2]))
		} else if a.hover == i {
			roundRect(mem, r, a.sc(8), p.hover)
		}
		is := a.sc(16)
		ix := r.Left + a.sc(12)
		iy := r.Top + (r.Bottom-r.Top-is)/2
		if t.icon != 0 {
			pDrawIconEx.Call(mem, uintptr(ix), uintptr(iy), t.icon, uintptr(is), uintptr(is), 0, 0, 3)
		}
		if !t.compact {
			font := a.fontTab
			color := p.muted
			if t == a.cur {
				font, color = a.fontTabBold, p.text
			} else if a.hover == i {
				color = p.text
			}
			of, _, _ := pSelectObject.Call(mem, font)
			pSetTextColor.Call(mem, color)
			tr := RECT{ix + is + a.sc(8), r.Top, r.Right, r.Bottom}
			drawText(mem, t.cfg.Name, tr, DT_LEFT|DT_VCENTER|DT_SINGLELINE|DT_NOPREFIX)
			pSelectObject.Call(mem, of)
		}
		if t.dev != nil {
			st, _ := t.dev.status()
			ds := a.sc(8)
			dx := r.Right - a.sc(14) - ds + a.sc(2)
			if t.compact {
				dx = r.Right - a.sc(6) - ds
			}
			dy := r.Top + (r.Bottom-r.Top-ds)/2
			ellipse(mem, RECT{dx, dy, dx + ds, dy + ds}, stateColor(st))
		}
	}

	glyphs := [stripBtnCount]string{"", "", ""} // settings, refresh, open in browser
	for i, r := range a.btnRects {
		if a.hover == 100+i {
			roundRect(mem, r, a.sc(6), p.hover)
		}
		of, _, _ := pSelectObject.Call(mem, a.fontIcon)
		pSetTextColor.Call(mem, p.muted)
		drawText(mem, glyphs[i], r, DT_CENTER|DT_VCENTER|DT_SINGLELINE|DT_NOPREFIX)
		pSelectObject.Call(mem, of)
	}

	pBitBlt.Call(hdc, 0, 0, uintptr(w), uintptr(sh), mem, 0, 0, SRCCOPY)
	pSelectObject.Call(mem, oldBmp)
	pDeleteObject.Call(bmp)
	pDeleteDC.Call(mem)
}

func (a *App) setTitle() {
	title := appName
	if a.cur != nil {
		title += " · " + a.cur.cfg.Name
	}
	pSetWindowTextW.Call(a.hwnd, uintptr(unsafe.Pointer(u16(title))))
}

func (a *App) selectTab(t *tabView) {
	if t == nil || a.tabIndex(t) < 0 {
		return
	}
	if a.lk.locked {
		a.lk.pendingTo = t
		return
	}
	a.cur = t
	a.hub.LastTabID = t.cfg.ID
	for _, x := range a.tabs {
		if x.pane.created {
			if x == t {
				_ = x.pane.web.Show()
			} else {
				_ = x.pane.web.Hide()
			}
		}
	}
	a.layout()
	a.setTitle()
	a.ensurePane(t)
	if p := t.pane; p.created && t == a.cur {
		p.focus()
	}
}

// showMain brings the window up: setup first, then the PIN, then the tab.
func (a *App) showMain(t *tabView) {
	if pIsVisible(a.hwnd) {
		if r, _, _ := pIsIconic.Call(a.hwnd); r != 0 {
			pShowWindow.Call(a.hwnd, SW_RESTORE)
		}
	} else if a.hub.Maximized {
		pShowWindow.Call(a.hwnd, SW_MAXIMIZE)
	} else {
		pShowWindow.Call(a.hwnd, SW_SHOW)
	}
	pSetForegroundWindow.Call(a.hwnd)
	if a.lk.overlay && (a.lk.mode == "setup" || a.lk.mode == "change" || a.lk.mode == "set") {
		if t != nil {
			a.lk.pendingTo = t
		}
		a.lk.pane.focus()
		return
	}
	if t != nil && (a.lk.locked || !a.hub.SetupDone) {
		a.lk.pendingTo = t
	}
	if a.lk.locked && a.hub.Pin.IsSet() {
		if !a.lk.overlay || a.lk.mode != "unlock" {
			a.showLock("unlock", "", "")
		} else {
			a.lk.pane.focus()
		}
		return
	}
	if !a.hub.SetupDone {
		a.lk.locked = true
		a.showSetup(true)
		return
	}
	if a.lk.locked {
		if !a.hub.NoPin && !a.hub.Pin.IsSet() {
			a.showLock("set", "", "") // e.g. after "Forgot your PIN?"
			return
		}
		a.lk.locked = false
	}
	if t == nil {
		t = a.cur
	}
	a.selectTab(t)
}

func pIsVisible(h uintptr) bool {
	r, _, _ := pIsWindowVisible.Call(h)
	return r != 0
}

func (a *App) saveWindow() {
	var wp WINDOWPLACEMENT
	wp.Length = uint32(unsafe.Sizeof(wp))
	if r, _, _ := pGetWindowPlacement.Call(a.hwnd, uintptr(unsafe.Pointer(&wp))); r != 0 {
		w := wp.RcNormalPosition.Right - wp.RcNormalPosition.Left
		h := wp.RcNormalPosition.Bottom - wp.RcNormalPosition.Top
		if w >= 600 && h >= 400 {
			a.hub.WindowW, a.hub.WindowH = int(w), int(h)
		}
	}
	z, _, _ := pIsZoomed.Call(a.hwnd)
	a.hub.Maximized = z != 0
	a.hub.Save()
}

// watching reports whether any router has desktop alerts turned on.
func (a *App) watching() bool {
	for _, t := range a.tabs {
		if t.dev != nil && t.dev.rs.Configured() && t.dev.rs.Settings().Notifications {
			return true
		}
	}
	return false
}

func (a *App) close() {
	a.saveWindow()
	if !a.quitting && a.hub.keepInTray() && (a.watching() || startupOn()) {
		pShowWindow.Call(a.hwnd, SW_HIDE)
		if a.lk.overlay && a.lk.mode == "setup" {
			a.hideOverlay()
		}
		a.lockNow()
		if !a.hinted {
			a.hinted = true
			a.notify(nil, "", "Home Hub is still running", "It keeps watching your routers and will alert you here. Right-click the icon to exit.", false)
		}
		return
	}
	a.exit()
}

func (a *App) exit() {
	a.quitting = true
	if pIsVisible(a.hwnd) {
		a.saveWindow()
	} else {
		a.hub.Save()
	}
	a.removeTray()
	pDestroyWindow.Call(a.hwnd)
}

func (a *App) reload() {
	t := a.cur
	if t == nil || a.lk.overlay {
		return
	}
	p := t.pane
	if !p.created {
		return
	}
	if t.dev != nil && p.signInVisible {
		a.deviceOpen(t.dev)
		return
	}
	_ = p.wv.Reload()
}

func (a *App) openInBrowser(t *tabView) {
	if t == nil || t.cfg.Kind == KindWeather {
		return // served privately inside Home Hub; there's no address to open
	}
	if t.dev != nil {
		// Never hand the session id to the browser.
		if s := t.dev.rs.Settings(); s.Host != "" {
			shellOpen("https://" + s.Host + "/")
		}
		return
	}
	u := ""
	if p := t.pane; p.created && p.wv != nil {
		u, _ = p.wv.GetSource()
	}
	if !strings.HasPrefix(u, "http") {
		u = t.cfg.URL
	}
	if strings.HasPrefix(u, "http") {
		shellOpen(u)
	}
}

// handleShortcut returns true when vk was a Home Hub shortcut.
func (a *App) handleShortcut(vk uint) bool {
	ctrl := keyDown(VK_CONTROL)
	if a.lk.overlay {
		return vk == VK_F5 || (ctrl && vk != 'C' && vk != 'V' && vk != 'X' && vk != 'A' && vk != 'Z')
	}
	switch {
	case ctrl && vk == 'L':
		a.post(a.lockNow)
		return true
	case vk == VK_F5:
		a.post(a.reload)
		return true
	case ctrl && vk >= '1' && vk <= '9':
		i := int(vk - '1')
		a.post(func() {
			if i < len(a.tabs) {
				a.selectTab(a.tabs[i])
			}
		})
		return true
	case ctrl && vk == VK_TAB:
		back := keyDown(VK_SHIFT)
		a.post(func() {
			n := len(a.tabs)
			if n == 0 {
				return
			}
			i := a.tabIndex(a.cur)
			if back {
				i = (i - 1 + n) % n
			} else {
				i = (i + 1) % n
			}
			a.selectTab(a.tabs[i])
		})
		return true
	}
	return false
}

func wndProc(hwnd, msg, wParam, lParam uintptr) uintptr {
	defer guard("window")
	a := app
	if a == nil || (a.hwnd != 0 && hwnd != a.hwnd) {
		r, _, _ := pDefWindowProcW.Call(hwnd, msg, wParam, lParam)
		return r
	}
	switch uint32(msg) {
	case WM_APP_RUN:
		a.drain()
		return 0
	case WM_APP_SHOW:
		a.showMain(nil)
		return 0
	case WM_APP_TRAY:
		switch uint32(lParam & 0xffff) {
		case WM_LBUTTONUP, WM_LBUTTONDBLCLK:
			a.showMain(nil)
		case WM_RBUTTONUP, WM_CONTEXTMENU:
			a.trayMenu()
		case NIN_BALLOONUSERCLICK:
			if a.balloonURL != "" {
				shellOpen(a.balloonURL)
			} else {
				a.showMain(a.balloonTab)
			}
		}
		return 0
	case WM_SIZE:
		if a.hwnd != 0 {
			a.layout()
		}
		return 0
	case WM_MOVE:
		for _, t := range a.tabs {
			if t.pane.created {
				_ = t.pane.web.NotifyParentWindowPositionChanged()
			}
		}
	case WM_GETMINMAXINFO:
		mi := (*MINMAXINFO)(unsafe.Pointer(lParam))
		if a.dpi > 0 {
			mi.PtMinTrackSize = POINT{a.sc(800), a.sc(420)}
		}
		return 0
	case WM_ERASEBKGND:
		return 1
	case WM_PAINT:
		a.paint()
		return 0
	case WM_MOUSEMOVE:
		x, y := loword(lParam), hiword(lParam)
		h := a.hitTest(x, y)
		if h != a.hover {
			a.hover = h
			pInvalidateRect.Call(a.hwnd, 0, 0)
		}
		if !a.tracking {
			tme := TRACKMOUSEEVENT{DwFlags: TME_LEAVE, HwndTrack: a.hwnd}
			tme.CbSize = uint32(unsafe.Sizeof(tme))
			pTrackMouseEvent.Call(uintptr(unsafe.Pointer(&tme)))
			a.tracking = true
		}
		return 0
	case WM_MOUSELEAVE:
		a.tracking = false
		if a.hover != -1 {
			a.hover = -1
			pInvalidateRect.Call(a.hwnd, 0, 0)
		}
		return 0
	case WM_LBUTTONDOWN:
		switch h := a.hitTest(loword(lParam), hiword(lParam)); {
		case h >= 0 && h < len(a.tabs):
			a.selectTab(a.tabs[h])
		case h == 100:
			a.editTabs()
		case h == 101:
			a.reload()
		case h == 102:
			a.openInBrowser(a.cur)
		}
		return 0
	case WM_RBUTTONUP:
		if h := a.hitTest(loword(lParam), hiword(lParam)); h >= 0 && h < len(a.tabs) {
			a.tabMenu(a.tabs[h])
			return 0
		}
	case WM_SETCURSOR:
		if lParam&0xffff == 1 { // HTCLIENT
			var pt POINT
			pGetCursorPos.Call(uintptr(unsafe.Pointer(&pt)))
			pScreenToClient.Call(a.hwnd, uintptr(unsafe.Pointer(&pt)))
			if pt.Y < a.stripHeight() && a.hitTest(pt.X, pt.Y) >= 0 {
				c, _, _ := pLoadCursorW.Call(0, IDC_HAND)
				pSetCursor.Call(c)
				return 1
			}
		}
	case WM_KEYDOWN, WM_SYSKEYDOWN:
		if a.handleShortcut(uint(wParam)) {
			return 0
		}
	case WM_SETFOCUS:
		if a.lk.overlay && a.lk.pane != nil && a.lk.pane.created {
			a.lk.pane.focus()
			return 0
		}
		if a.cur != nil && a.cur.pane.created {
			a.cur.pane.focus()
		}
		return 0
	case WM_DPICHANGED:
		a.dpi = int(hiword(wParam))
		r := (*RECT)(unsafe.Pointer(lParam))
		pSetWindowPos.Call(a.hwnd, 0, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right-r.Left), uintptr(r.Bottom-r.Top), SWP_NOZORDER|SWP_NOACTIVATE)
		a.loadFonts()
		a.reloadIcons()
		a.layout()
		return 0
	case WM_SETTINGCHANGE:
		if lParam != 0 && windows.UTF16PtrToString((*uint16)(unsafe.Pointer(lParam))) == "ImmersiveColorScheme" {
			if d := systemDark(); d != a.dark {
				a.dark = d
				a.pal = makePalette(d)
				a.applyDarkTitle()
				pInvalidateRect.Call(a.hwnd, 0, 1)
			}
		}
	case WM_CLOSE:
		a.close()
		return 0
	case WM_DESTROY:
		pPostQuitMessage.Call(0)
		return 0
	default:
		if a.taskbarCreated != 0 && uint32(msg) == a.taskbarCreated {
			a.trayAdded = false
			a.addTray()
			return 0
		}
	}
	r, _, _ := pDefWindowProcW.Call(hwnd, msg, wParam, lParam)
	return r
}

// ---------------------------------------------------------------- tray

func trayIconID(state int) int {
	switch state {
	case 0:
		return 2
	case 1:
		return 3
	case 2:
		return 4
	}
	return 5
}

func (a *App) trayIcon() uintptr {
	id := trayIconID(a.trayState)
	if len(a.devs) == 0 {
		id = iconApp // nothing to watch: plain app icon
	}
	if h, ok := a.trayIcons[id]; ok {
		return h
	}
	sz, _, _ := pGetSystemMetrics.Call(SM_CXSMICON)
	if sz == 0 {
		sz = 16
	}
	h := loadIcon(id, int(sz))
	a.trayIcons[id] = h
	return h
}

func (a *App) nid() NOTIFYICONDATAW {
	var n NOTIFYICONDATAW
	n.CbSize = uint32(unsafe.Sizeof(n))
	n.HWnd = a.hwnd
	n.UID = 1
	return n
}

func (a *App) addTray() {
	n := a.nid()
	n.UFlags = NIF_MESSAGE | NIF_ICON | NIF_TIP
	n.UCallbackMessage = WM_APP_TRAY
	n.HIcon = a.trayIcon()
	copyU16(n.SzTip[:], a.trayTip)
	r, _, _ := pShellNotifyIconW.Call(NIM_ADD, uintptr(unsafe.Pointer(&n)))
	a.trayAdded = r != 0
}

func (a *App) updateTray() {
	if !a.trayAdded {
		a.addTray()
		return
	}
	n := a.nid()
	n.UFlags = NIF_ICON | NIF_TIP
	n.HIcon = a.trayIcon()
	copyU16(n.SzTip[:], a.trayTip)
	pShellNotifyIconW.Call(NIM_MODIFY, uintptr(unsafe.Pointer(&n)))
}

func (a *App) removeTray() {
	if !a.trayAdded {
		return
	}
	n := a.nid()
	pShellNotifyIconW.Call(NIM_DELETE, uintptr(unsafe.Pointer(&n)))
	a.trayAdded = false
}

// notify shows a tray balloon. Clicking it opens tab t, or the page at link.
func (a *App) notify(t *tabView, link, title, body string, severe bool) {
	a.balloonTab, a.balloonURL = t, link
	if !a.trayAdded {
		a.addTray()
	}
	n := a.nid()
	n.UFlags = NIF_INFO
	copyU16(n.SzInfoTitle[:], title)
	copyU16(n.SzInfo[:], body)
	n.DwInfoFlags = NIIF_INFO
	if severe {
		n.DwInfoFlags = NIIF_WARNING
	}
	pShellNotifyIconW.Call(NIM_MODIFY, uintptr(unsafe.Pointer(&n)))
}

const (
	cmdOpen = 1001 + iota
	cmdCheck
	cmdAlerts
	cmdStartup
	cmdEditTabs
	cmdLock
	cmdChangePin
	cmdUpdate
	cmdAbout
	cmdExit
)

func appendMenu(m uintptr, flags uintptr, id int, text string) {
	pAppendMenuW.Call(m, flags, uintptr(id), uintptr(unsafe.Pointer(u16(text))))
}

func menuEsc(s string) string { return strings.ReplaceAll(s, "&", "&&") }

func checked(on bool) uintptr {
	if on {
		return MF_STRING | MF_CHECKED
	}
	return MF_STRING
}

func (a *App) trayMenu() {
	m, _, _ := pCreatePopupMenu.Call()
	appendMenu(m, MF_STRING, cmdOpen, "Open Home Hub")
	pSetMenuDefaultItem.Call(m, cmdOpen, 0)
	for i, t := range a.tabs {
		if i >= trayTabLimit {
			break
		}
		appendMenu(m, MF_STRING, cmdTabBase+i, menuEsc(t.cfg.Name))
	}
	routers, configured, alertsOn := 0, 0, false
	for _, t := range a.tabs {
		if t.dev != nil {
			routers++
			if t.dev.rs.Configured() {
				configured++
				alertsOn = alertsOn || t.dev.rs.Settings().Notifications
			}
		}
	}
	appendMenu(m, MF_SEPARATOR, 0, "")
	if routers > 0 {
		flags := uintptr(MF_STRING)
		if configured == 0 {
			flags |= MF_GRAYED
		}
		appendMenu(m, flags, cmdCheck, "Check routers now")
		appendMenu(m, checked(alertsOn)|flags, cmdAlerts, "Router desktop alerts")
	}
	appendMenu(m, checked(startupOn()), cmdStartup, "Start with Windows")
	appendMenu(m, MF_STRING, cmdEditTabs, "Edit tabs…")
	appendMenu(m, MF_SEPARATOR, 0, "")
	lockFlags := uintptr(MF_STRING)
	if !a.hub.Pin.IsSet() || a.lk.locked {
		lockFlags |= MF_GRAYED
	}
	appendMenu(m, lockFlags, cmdLock, "Lock Home Hub\tCtrl+L")
	pinText := "Change PIN…"
	if !a.hub.Pin.IsSet() {
		pinText = "Set a PIN…"
	}
	appendMenu(m, MF_STRING, cmdChangePin, pinText)
	appendMenu(m, MF_SEPARATOR, 0, "")
	if a.update != nil {
		appendMenu(m, MF_STRING, cmdUpdate, "Get Home Hub "+a.update.Version+"…")
	}
	appendMenu(m, MF_STRING, cmdAbout, "About Home Hub "+appVersion)
	appendMenu(m, MF_STRING, cmdExit, "Exit")

	var pt POINT
	pGetCursorPos.Call(uintptr(unsafe.Pointer(&pt)))
	pSetForegroundWindow.Call(a.hwnd)
	cmd, _, _ := pTrackPopupMenu.Call(m, TPM_RETURNCMD|TPM_RIGHTBUTTON|TPM_BOTTOMALIGN, uintptr(pt.X), uintptr(pt.Y), 0, a.hwnd, 0)
	pPostMessageW.Call(a.hwnd, WM_NULL, 0, 0)
	pDestroyMenu.Call(m)

	switch c := int(cmd); {
	case c >= cmdTabBase && c < cmdTabBase+len(a.tabs):
		a.showMain(a.tabs[c-cmdTabBase])
	case c == cmdOpen:
		a.showMain(nil)
	case c == cmdCheck:
		go a.checkAll(true)
	case c == cmdAlerts:
		on := !alertsOn
		a.whenUnlocked(func() {
			for _, t := range a.tabs {
				if t.dev != nil {
					t.dev.rs.UpdateSettings(func(s *RouterSettings) { s.Notifications = on })
				}
			}
		})
	case c == cmdStartup:
		on := !startupOn()
		a.whenUnlocked(func() {
			applyStartup(on)
			a.hub.StartWithWindows = on
			a.hub.Save()
		})
	case c == cmdEditTabs:
		a.editTabs()
	case c == cmdLock:
		a.lockNow()
		if !pIsVisible(a.hwnd) {
			pShowWindow.Call(a.hwnd, SW_HIDE)
		}
	case c == cmdChangePin:
		a.changePin()
	case c == cmdUpdate:
		if a.update != nil {
			shellOpen(a.update.URL)
		}
	case c == cmdAbout:
		a.about()
	case c == cmdExit:
		a.exit()
	}
}

func (a *App) about() {
	text := "Home Hub " + appVersion + "\n\nYour home network's web pages in one window, with GL.iNet router alerts in the system tray.\n\n" +
		"Open the project page on GitHub (instructions, updates, source code)?"
	if messageBox(a.hwnd, text, "About Home Hub", MB_YESNO|MB_ICONINFORMATION) == IDYES {
		shellOpen("https://github.com/" + releaseRepo)
	}
}

// ---------------------------------------------------------------- tab menu

const (
	cmdTabIP = 1101 + iota
	cmdTabSignOut
	cmdTabAlerts
	cmdTabReload
	cmdTabBrowser
	cmdTabEdit
	cmdTabRouterHome
)

// tabMenu is the right-click menu on a tab.
func (a *App) tabMenu(t *tabView) {
	m, _, _ := pCreatePopupMenu.Call()
	appendMenu(m, MF_STRING, cmdTabReload, "Reload\tF5")
	if t.cfg.Kind != KindWeather {
		appendMenu(m, MF_STRING, cmdTabBrowser, "Open in your browser")
	}
	if d := t.dev; d != nil {
		s := d.rs.Settings()
		appendMenu(m, MF_SEPARATOR, 0, "")
		appendMenu(m, MF_STRING, cmdTabIP, "Change IP address…")
		appendMenu(m, checked(s.Notifications), cmdTabAlerts, "Desktop alerts")
		flags := uintptr(MF_STRING)
		if !d.rs.Configured() {
			flags |= MF_GRAYED
		}
		appendMenu(m, flags, cmdTabSignOut, "Sign out && forget login…")
		switch st, v := d.rs.RouterHome(); st {
		case 1:
			label := "Router Home is installed"
			if v != "" && v != "0" {
				label = "Router Home " + v + " is installed"
			}
			appendMenu(m, MF_STRING|MF_GRAYED, 0, label)
		case 2:
			appendMenu(m, MF_STRING, cmdTabRouterHome, "Get Router Home for this router…")
		}
	}
	appendMenu(m, MF_SEPARATOR, 0, "")
	appendMenu(m, MF_STRING, cmdTabEdit, "Edit tabs…")
	var pt POINT
	pGetCursorPos.Call(uintptr(unsafe.Pointer(&pt)))
	cmd, _, _ := pTrackPopupMenu.Call(m, TPM_RETURNCMD|TPM_RIGHTBUTTON, uintptr(pt.X), uintptr(pt.Y), 0, a.hwnd, 0)
	pDestroyMenu.Call(m)
	switch int(cmd) {
	case cmdTabReload:
		a.selectTab(t)
		a.reload()
	case cmdTabBrowser:
		a.openInBrowser(t)
	case cmdTabIP:
		a.askNewIP(t.dev)
	case cmdTabAlerts:
		t.dev.rs.UpdateSettings(func(s *RouterSettings) { s.Notifications = !s.Notifications })
	case cmdTabSignOut:
		a.signOut(t.dev)
	case cmdTabRouterHome:
		shellOpen(routerHomeURL)
	case cmdTabEdit:
		a.editTabs()
	}
}

// ---------------------------------------------------------------- web panes

type paneEvents struct {
	a *App
	t *tabView
}

func (e *paneEvents) QueryInterface(_, _ uintptr) uintptr { return 0 }
func (e *paneEvents) AddRef() uintptr                     { return 1 }
func (e *paneEvents) Release() uintptr                    { return 1 }

func hostMatches(u *url.URL, host string) bool {
	host = strings.TrimSpace(host)
	return host != "" && (strings.EqualFold(u.Host, host) || strings.EqualFold(u.Hostname(), host))
}

func (e *paneEvents) serviceHost() string {
	switch {
	case e.t.cfg.Kind == KindWeather:
		return weatherHost
	case e.t.dev != nil:
		return e.t.dev.rs.Settings().Host
	}
	return hostOf(e.t.cfg.URL)
}

func hostOf(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	return u.Host
}

func (e *paneEvents) NavigationStarting(_ *webview2.ICoreWebView2, args *webview2.ICoreWebView2NavigationStartingEventArgs) uintptr {
	if e.t.dev == nil {
		return 0
	}
	uri, _ := args.GetUri()
	u, err := url.Parse(uri)
	if err == nil && strings.HasPrefix(u.Scheme, "http") && !hostMatches(u, e.serviceHost()) {
		_ = args.PutCancel(true)
		shellOpen(uri)
	}
	return 0
}

func (e *paneEvents) NewWindowRequested(_ *webview2.ICoreWebView2, args *webview2.ICoreWebView2NewWindowRequestedEventArgs) uintptr {
	uri, _ := args.GetUri()
	u, err := url.Parse(uri)
	external := e.t.dev != nil || err != nil || !hostMatches(u, e.serviceHost())
	if external && err == nil && (u.Scheme == "http" || u.Scheme == "https" || u.Scheme == "mailto") {
		_ = args.PutHandled(true)
		shellOpen(uri)
	}
	return 0
}

func (e *paneEvents) SourceChanged(_ *webview2.ICoreWebView2, _ *webview2.ICoreWebView2SourceChangedEventArgs) uintptr {
	if d := e.t.dev; d != nil {
		e.a.post(func() { e.a.checkLoginPage(d) })
	}
	return 0
}

func (e *paneEvents) HistoryChanged(_ *webview2.ICoreWebView2, _ *webview2.IUnknown) uintptr {
	if d := e.t.dev; d != nil {
		e.a.post(func() { e.a.checkLoginPage(d) })
	}
	return 0
}

func (e *paneEvents) DocumentTitleChanged(_ *webview2.ICoreWebView2, _ *webview2.IUnknown) uintptr {
	p := e.t.pane
	if p.wv != nil {
		p.title, _ = p.wv.GetDocumentTitle()
	}
	return 0
}

func (e *paneEvents) ServerCertificateErrorDetected(_ *webview2.ICoreWebView2, args *webview2.ICoreWebView2ServerCertificateErrorDetectedEventArgs) uintptr {
	action := webview2.COREWEBVIEW2_SERVER_CERTIFICATE_ERROR_ACTION(webview2.COREWEBVIEW2_SERVER_CERTIFICATE_ERROR_ACTION_CANCEL)
	if cert, err := args.GetServerCertificate(); err == nil && cert != nil {
		if p, err := cert.ToPemEncoding(); err == nil {
			if block, _ := pem.Decode([]byte(p)); block != nil {
				fp := Fingerprint(block.Bytes)
				if d := e.t.dev; d != nil {
					d.seenCert = fp
					if FingerprintIn(d.rs.Settings().PinnedCertSha256, fp) {
						action = webview2.COREWEBVIEW2_SERVER_CERTIFICATE_ERROR_ACTION_ALWAYS_ALLOW
					}
				}
				logf("certificate check on %s: %s… allowed=%v", e.t.cfg.ID, fp[:16], action == webview2.COREWEBVIEW2_SERVER_CERTIFICATE_ERROR_ACTION_ALWAYS_ALLOW)
			}
		}
	}
	_ = args.PutAction(action)
	return 0
}

func (a *App) ensurePane(t *tabView) {
	p := t.pane
	if p.created || p.creating || a.lk.locked || a.hub.WipeOnStart {
		return
	}
	p.creating = true
	logf("creating WebView2 for tab %s (%s)", t.cfg.ID, t.cfg.Kind)
	_ = os.MkdirAll(p.dataPath, 0o755)

	web := edge.NewChromium()
	web.DataPath = p.dataPath
	web.SetErrorCallback(func(err error) {
		logf("WebView2 error on %s: %v", t.cfg.ID, err)
		messageBox(a.hwnd, "Couldn't start the Microsoft Edge WebView2 engine for the "+t.cfg.Name+" tab:\n\n"+err.Error()+
			"\n\nIf the Router Home app or one of the separate Home Assistant / AdGuard Home apps is still open, close it and start Home Hub again. "+
			"Otherwise, install the WebView2 Runtime from Microsoft and try again.", appName, MB_ICONERROR)
		a.removeTray()
		os.Exit(1)
	})
	web.MessageCallback = func(m string, _ *edge.ICoreWebView2, _ *edge.ICoreWebView2WebMessageReceivedEventArgs) {
		a.post(func() { a.onMessage(t, m) })
	}
	web.NavigationCompletedCallback = func(_ *edge.ICoreWebView2, args *edge.ICoreWebView2NavigationCompletedEventArgs) {
		d := t.dev
		if d == nil {
			return
		}
		if args != nil {
			na := (*webview2.ICoreWebView2NavigationCompletedEventArgs)(unsafe.Pointer(args))
			ok, err := na.GetIsSuccess()
			status, _ := na.GetWebErrorStatus()
			if err == nil && !ok && status != webview2.COREWEBVIEW2_WEB_ERROR_STATUS_OPERATION_CANCELED {
				a.post(func() { a.loadFailed(d, status) })
				return
			}
		}
		a.post(func() {
			a.goHomeTab(d)
			a.checkLoginPage(d)
		})
	}
	web.AcceleratorKeyCallback = func(vk uint) bool { return a.handleShortcut(vk) }

	web.Embed(p.hwnd)
	logf("WebView2 ready for %s", t.cfg.ID)
	p.web = web
	p.wv = (*webview2.ICoreWebView2)(web.RawWebView())

	if s, err := web.GetSettings(); err == nil && s != nil {
		_ = s.PutAreDevToolsEnabled(false)
		_ = s.PutIsStatusBarEnabled(false)
		_ = s.PutIsZoomControlEnabled(true)
		_ = s.PutAreDefaultContextMenusEnabled(true)
	}
	bg := a.pal.paneRGB
	web.SetBackgroundColour(bg[0], bg[1], bg[2], 255)

	ev := &paneEvents{a: a, t: t}
	if p.wv != nil {
		h1 := webview2.NewICoreWebView2NavigationStartingEventHandler(ev)
		h2 := webview2.NewICoreWebView2NewWindowRequestedEventHandler(ev)
		h3 := webview2.NewICoreWebView2SourceChangedEventHandler(ev)
		h4 := webview2.NewICoreWebView2HistoryChangedEventHandler(ev)
		h5 := webview2.NewICoreWebView2DocumentTitleChangedEventHandler(ev)
		p.keep = append(p.keep, ev, h1, h2, h3, h4, h5)
		_, _ = p.wv.AddNavigationStarting(h1)
		_, _ = p.wv.AddNewWindowRequested(h2)
		_, _ = p.wv.AddSourceChanged(h3)
		_, _ = p.wv.AddHistoryChanged(h4)
		_, _ = p.wv.AddDocumentTitleChanged(h5)
		if t.dev != nil {
			if wv14 := p.wv.GetICoreWebView2_14(); wv14 != nil {
				h6 := webview2.NewICoreWebView2ServerCertificateErrorDetectedEventHandler(ev)
				p.keep = append(p.keep, h6)
				_, _ = wv14.AddServerCertificateErrorDetected(h6)
			}
		}
	}

	p.created = true
	p.creating = false
	web.Resize()
	if t != a.cur {
		_ = web.Hide()
	} else {
		p.focus()
	}

	switch {
	case t.cfg.Kind == KindWeather:
		a.openWeather(p)
	case t.dev != nil:
		a.deviceOpen(t.dev)
	default:
		p.nav(t.cfg.URL)
	}
}

// closePane shuts a tab's browser down (the tab was removed).
func (a *App) closePane(t *tabView) {
	p := t.pane
	if p.created && p.web != nil {
		p.web.Close()
	}
	p.created, p.web, p.wv = false, nil, nil
	pDestroyWindow.Call(p.hwnd)
	if t.icon != 0 {
		pDestroyIcon.Call(t.icon)
		t.icon = 0
	}
}
