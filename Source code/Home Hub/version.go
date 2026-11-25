package main

// Set at build time with -ldflags "-X main.appVersion=1.2.3" (build.ps1 / the
// GitHub workflow do this from the release tag).
var appVersion = "1.0.0"

// GitHub repository that releases are published to (owner/name). Forks can
// point update checks at their own repo with -ldflags "-X main.releaseRepo=...".
var releaseRepo = "xDarkHawkx/HomeHub"

// Router Home: the Home tab add-on for GL.iNet routers that Home Hub works best with.
const routerHomeURL = "https://github.com/xDarkHawkx/RouterHome"
