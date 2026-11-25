#!/bin/sh
# Builds dist/HomeHub.exe from Linux or macOS. Needs Go 1.24+.
#   ./build.sh          test + build
#   ./build.sh 1.2.0    stamp a version (also rebuilds the icons/version resource)
set -eu
cd "$(dirname "$0")"
VERSION="${1:-}"

go test ./...
(cd tools/cbcheck && go run . ../.. ../../third_party/go-webview2/pkg/webview2 ../../third_party/go-webview2/pkg/edge)

LDV=""
if [ -n "$VERSION" ]; then
  a=../../assets
  (cd tools/winres && HOMEHUB_VERSION="$VERSION" go run . ../../rsrc_windows_amd64.syso \
    1:$a/hub.png 2:$a/tray_ok.png 3:$a/tray_warn.png 4:$a/tray_bad.png 5:$a/tray_unknown.png \
    10:$a/smarthome.png 11:$a/adblock.png 12:$a/firewall.png 13:$a/flint.png 14:$a/weather.png 15:$a/glrouter.png 16:$a/web.png)
  LDV="-X main.appVersion=$VERSION"
fi

mkdir -p dist
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w $LDV" -o dist/HomeHub.exe .
(cd dist && sha256sum HomeHub.exe > HomeHub.exe.sha256 2>/dev/null || shasum -a 256 HomeHub.exe > HomeHub.exe.sha256)
echo "Built dist/HomeHub.exe"; cat dist/HomeHub.exe.sha256
