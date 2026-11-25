//go:build windows

package main

// PIN lock screen. With a PIN set, Home Hub opens locked and locks again
// whenever it's closed to the tray. Router monitoring and tray alerts keep
// running while it's locked; the tabs stay hidden. The same full-window pane
// also shows the setup screen (setup_windows.go).

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unsafe"

	_ "embed"

	"github.com/wailsapp/go-webview2/pkg/edge"
	"github.com/wailsapp/go-webview2/pkg/webview2"
	"golang.org/x/sys/windows"
)

//go:embed lock.html
var lockHTML string

// lock state lives on App (UI thread only)
type lockState struct {
	pane      *pane
	overlay   bool     // lock pane covering the window
	locked    bool     // tabs unavailable until the PIN is entered
	mode      string   // "set", "unlock", "change" or "setup"
	pending   func()   // runs after a successful unlock
	pendingTo *tabView // tab to show after unlock (nil: current)
	mutex     windows.Handle
}

func (a *App) lockDataDir() string { return filepath.Join(localDir("HomeHub"), "Lock", "WebView2") }

func (a *App) createLockPaneWindow(parent, hinst uintptr) {
	h, _, _ := pCreateWindowExW.Call(0,
		uintptr(unsafe.Pointer(u16("HomeHubPane"))), 0,
		WS_CHILD|WS_CLIPSIBLINGS|WS_CLIPCHILDREN,
		0, 0, 100, 100, parent, 0, hinst, 0)
	a.lk.pane = &pane{hwnd: h, dataPath: a.lockDataDir()}
}

func (a *App) ensureLockPane() bool {
	p := a.lk.pane
	if p.created {
		return true
	}
	_ = os.MkdirAll(p.dataPath, 0o755)
	web := edge.NewChromium()
	web.DataPath = p.dataPath
	web.SetErrorCallback(func(err error) {
		logf("WebView2 error on lock screen: %v", err)
		messageBox(a.hwnd, "Couldn't start the lock screen:\n\n"+err.Error(), appName, MB_ICONERROR)
		a.removeTray()
		os.Exit(1)
	})
	web.MessageCallback = func(m string, _ *edge.ICoreWebView2, _ *edge.ICoreWebView2WebMessageReceivedEventArgs) {
		a.post(func() { a.onLockMessage(m) })
	}
	// swallow reload and app shortcuts, but keep copy / paste / undo for the text boxes
	web.AcceleratorKeyCallback = func(vk uint) bool {
		if vk == VK_F5 {
			return true
		}
		return keyDown(VK_CONTROL) && !strings.ContainsRune("CVXAZY", rune(vk))
	}
	pShowWindow.Call(p.hwnd, SW_SHOW)
	web.Embed(p.hwnd)
	p.web = web
	p.wv = (*webview2.ICoreWebView2)(web.RawWebView())
	if s, err := web.GetSettings(); err == nil && s != nil {
		_ = s.PutAreDevToolsEnabled(false)
		_ = s.PutIsStatusBarEnabled(false)
		_ = s.PutIsZoomControlEnabled(false)
		_ = s.PutAreDefaultContextMenusEnabled(true) // paste an address on the setup screen
	}
	bg := a.pal.paneRGB
	web.SetBackgroundColour(bg[0], bg[1], bg[2], 255)
	p.created = true
	logf("lock screen ready")
	return true
}

// showLock covers the window with the PIN screen.
func (a *App) showLock(mode, message, kind string) {
	a.lk.mode = mode
	a.lk.overlay = true
	if mode == "unlock" {
		a.lk.locked = true
	}
	a.layout()
	pSetWindowTextW.Call(a.hwnd, uintptr(unsafe.Pointer(u16(appName+" · Locked"))))
	if !a.ensureLockPane() {
		return
	}
	p := a.lk.pane
	p.nonce = randomNonce()
	wait := int(a.hub.Pin.Wait(time.Now()).Seconds() + 0.999)
	cfg := map[string]interface{}{"nonce": p.nonce, "mode": mode, "message": message, "kind": kind, "wait": wait}
	js, _ := json.Marshal(cfg)
	html := strings.Replace(lockHTML, "<script>\n(function", "<script>window.__cfg="+string(js)+";</script>\n<script>\n(function", 1)
	p.navString(html)
	a.layout()
	p.focus()
}

func (a *App) hideLock() {
	a.lk.overlay = false
	a.lk.locked = false
	if p := a.lk.pane; p.created {
		p.navString("<!doctype html><title>.</title>") // clear typed digits from memory
	}
	a.layout()
	a.setTitle()
}

// lockNow locks Home Hub if a PIN is set.
func (a *App) lockNow() {
	if !a.hub.Pin.IsSet() || a.lk.locked {
		return
	}
	logf("locked")
	a.lk.pendingTo = nil
	a.lk.pending = nil
	a.showLock("unlock", "", "")
}

// whenUnlocked runs fn now, or after the PIN is entered.
func (a *App) whenUnlocked(fn func()) {
	if !a.lk.locked {
		fn()
		return
	}
	a.lk.pending = fn
	a.showMain(nil)
}

func (a *App) unlocked() {
	logf("unlocked")
	a.hideLock()
	if !a.hub.SetupDone {
		a.showSetup(true) // review the tabs carried over from an earlier version
		return
	}
	tab, fn := a.lk.pendingTo, a.lk.pending
	a.lk.pendingTo, a.lk.pending = nil, nil
	if tab == nil || a.tabIndex(tab) < 0 {
		tab = a.cur
	}
	if tab == nil && len(a.tabs) > 0 {
		tab = a.tabs[0]
	}
	a.selectTab(tab)
	if fn != nil {
		fn()
	}
}

func (a *App) lockStatus(js string) {
	if p := a.lk.pane; p.created {
		p.eval("window.hub&&(" + js + ")")
	}
}

func (a *App) wrongPin(wait time.Duration) {
	a.hub.Save()
	if wait > 0 {
		a.lockStatus(fmt.Sprintf("hub.wrong(),hub.wait(%d,%s)", int(wait.Seconds()+0.999), jsStr("Too many wrong PINs.")))
		return
	}
	left := freeTries - a.hub.Pin.Failures
	msg := "Wrong PIN."
	if left <= 2 && left > 0 {
		msg = fmt.Sprintf("Wrong PIN. %d more %s before a short wait.", left, map[bool]string{true: "try", false: "tries"}[left == 1])
	}
	a.lockStatus("hub.wrong(),hub.setStatus(" + jsStr(msg) + ",'err')")
}

func (a *App) onLockMessage(m string) {
	p := a.lk.pane
	var f struct {
		Type    string `json:"type"`
		Nonce   string `json:"nonce"`
		Pin     string `json:"pin"`
		Current string `json:"current"`
	}
	if !a.lk.overlay || json.Unmarshal([]byte(m), &f) != nil || f.Nonce == "" || f.Nonce != p.nonce {
		return
	}
	if a.lk.mode == "setup" {
		a.onSetupMessage(m)
		return
	}
	switch {
	case f.Type == "set" && a.lk.mode == "set":
		if err := a.hub.Pin.Set(f.Pin); err != nil {
			a.lockStatus("hub.setStatus(" + jsStr(err.Error()) + ",'err')")
			return
		}
		a.hub.NoPin = false
		a.hub.Save()
		logf("PIN set")
		a.unlocked()
		a.notify(nil, "", "PIN set", "Home Hub will ask for it each time you open it. Change it from the tray menu.", false)

	case f.Type == "unlock" && a.lk.mode == "unlock":
		ok, wait := a.hub.Pin.Check(f.Pin, time.Now())
		if !ok {
			a.wrongPin(wait)
			return
		}
		a.hub.Save()
		a.unlocked()

	case f.Type == "change" && a.lk.mode == "change":
		ok, wait := a.hub.Pin.Check(f.Current, time.Now())
		if !ok {
			a.wrongPin(wait)
			return
		}
		if err := a.hub.Pin.Set(f.Pin); err != nil {
			a.lockStatus("hub.setStatus(" + jsStr(err.Error()) + ",'err')")
			return
		}
		a.hub.Save()
		logf("PIN changed")
		a.hideLock()
		a.selectTab(a.cur)
		a.notify(nil, "", "PIN changed", "Use your new PIN next time you open Home Hub.", false)

	case f.Type == "remove" && a.lk.mode == "change":
		ok, wait := a.hub.Pin.Check(f.Current, time.Now())
		if !ok {
			a.wrongPin(wait)
			return
		}
		a.hub.Pin.Clear()
		a.hub.NoPin = true
		a.hub.Save()
		logf("PIN turned off")
		a.hideLock()
		a.selectTab(a.cur)
		a.notify(nil, "", "PIN turned off", "Home Hub opens without a PIN now. You can set one again from the tray menu.", false)

	case f.Type == "nopin" && a.lk.mode == "set":
		a.hub.NoPin = true
		a.hub.Save()
		logf("owner chose not to use a PIN")
		a.unlocked()

	case f.Type == "cancel" && a.lk.mode == "change":
		a.hideLock()
		a.selectTab(a.cur)

	case f.Type == "forgot" && a.lk.mode == "unlock":
		a.forgotPin()
	}
}

func (a *App) changePin() {
	if a.lk.overlay && a.lk.mode == "setup" {
		a.showMain(nil)
		return
	}
	a.whenUnlocked(func() {
		a.showMain(nil)
		if a.hub.Pin.IsSet() {
			a.showLock("change", "", "")
		} else {
			a.showLock("set", "", "")
		}
	})
}

// ---------------------------------------------------------------- reset

// sessionDirs are the browser profiles holding saved web sessions.
func (a *App) sessionDirs() []string {
	dirs := []string{filepath.Join(localDir("HomeHub"), "Tabs")}
	for _, t := range a.tabs {
		dirs = append(dirs, t.pane.dataPath)
	}
	return dirs
}

func (a *App) forgotPin() {
	text := "To reset your PIN, Home Hub has to sign you out of everything it saved, so nobody can get in by resetting it:\n\n" +
		"•  every tab's web logins (you'll log in again, including any two-step verification)\n" +
		"•  your routers' saved passwords\n\n" +
		"Your tabs and the settings on your devices aren't changed. Home Hub will restart and ask you to set a new PIN.\n\n" +
		"Reset the PIN and sign out of everything?"
	if messageBox(a.hwnd, text, "Forgot your PIN?", MB_YESNO|MB_ICONWARNING|MB_DEFBUTTON2) != IDYES {
		return
	}
	logf("PIN reset requested: signing out of everything")
	for _, d := range a.devices() {
		d.rs.ForgetLogin()
	}
	a.hub.Pin.Clear()
	a.hub.WipeOnStart = true
	a.hub.Save()
	a.restart()
}

// restart relaunches Home Hub (the browser profiles can only be deleted once
// this process's browser engines have shut down).
func (a *App) restart() {
	if a.lk.mutex != 0 {
		windows.CloseHandle(a.lk.mutex)
		a.lk.mutex = 0
	}
	shellOpen(exePath())
	a.quitting = true
	a.removeTray()
	pDestroyWindow.Call(a.hwnd)
}

// wipeSessions deletes saved browser sessions after a PIN reset. It retries
// while the previous instance's browser processes finish exiting.
func (a *App) wipeSessions() error {
	if !a.hub.WipeOnStart {
		return nil
	}
	var last error
	for attempt := 0; attempt < 20; attempt++ {
		last = nil
		for _, d := range a.sessionDirs() {
			if err := os.RemoveAll(d); err != nil {
				last = err
			}
		}
		if last == nil {
			a.hub.WipeOnStart = false
			a.hub.Save()
			logf("saved sessions cleared after PIN reset")
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}
	logf("couldn't clear saved sessions: %v", last)
	return errors.New("Home Hub couldn't finish signing out of the web pages after the PIN reset (" + last.Error() + ").\n\n" +
		"Restart your PC, then open Home Hub again. The tabs stay closed until this is done.")
}
