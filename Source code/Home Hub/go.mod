module homehub

go 1.24

require (
	github.com/wailsapp/go-webview2 v0.0.0
	golang.org/x/sys v0.27.0
)

require github.com/jchv/go-winloader v0.0.0-20210711035445-715c2860da7e // indirect

// Patched copy of wailsapp/go-webview2 (see third_party/go-webview2/PATCHES.md).
replace github.com/wailsapp/go-webview2 => ./third_party/go-webview2

// golang.org/x/sys from its official GitHub mirror (same code); lets the
// project build where golang.org isn't reachable.
replace golang.org/x/sys => github.com/golang/sys v0.30.0
