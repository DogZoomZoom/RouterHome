//go:build windows

package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime/debug"
	"sync"
	"time"
)

var (
	logMu   sync.Mutex
	logFile *os.File
)

func logPath() string { return filepath.Join(localDir("HomeHub"), "homehub.log") }

func initLog() {
	_ = os.MkdirAll(localDir("HomeHub"), 0o755)
	p := logPath()
	_ = os.MkdirAll(filepath.Dir(p), 0o755)
	if st, err := os.Stat(p); err == nil && st.Size() > 2<<20 {
		_ = os.Remove(p)
	}
	f, err := os.OpenFile(p, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return
	}
	logFile = f
	log.SetOutput(f)
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
}

func logf(format string, args ...interface{}) {
	logMu.Lock()
	defer logMu.Unlock()
	if logFile != nil {
		fmt.Fprintf(logFile, "%s  %s\n", time.Now().Format("2006-01-02 15:04:05.000"), fmt.Sprintf(format, args...))
		_ = logFile.Sync()
	}
}

// guard reports a panic instead of letting the app vanish silently.
func guard(where string) {
	if r := recover(); r != nil {
		stack := string(debug.Stack())
		logf("PANIC in %s: %v\n%s", where, r, stack)
		messageBox(0, fmt.Sprintf("Home Hub hit an error (%s):\n\n%v\n\nDetails were saved to:\n%s", where, r, logPath()), appName, MB_ICONERROR|MB_SETFOREGROUND)
		os.Exit(3)
	}
}
