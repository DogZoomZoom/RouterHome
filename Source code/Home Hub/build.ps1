# Builds dist\HomeHub.exe. Needs Go 1.24+ (https://go.dev/dl/).
#   .\build.ps1                  test + build
#   .\build.ps1 -Version 1.2.0   stamp a version (also rebuilds the icons/version resource)
#   .\build.ps1 -SkipTests
param([string]$Version = "", [switch]$SkipTests)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $SkipTests) {
    go test ./...
    if ($LASTEXITCODE -ne 0) { throw "tests failed" }
    Push-Location tools\cbcheck
    go run . ..\.. ..\..\third_party\go-webview2\pkg\webview2 ..\..\third_party\go-webview2\pkg\edge
    $ok = $LASTEXITCODE; Pop-Location
    if ($ok -ne 0) { throw "callback check failed" }
}

if ($Version -ne "") {
    $env:HOMEHUB_VERSION = $Version
    $a = "..\..\assets"
    Push-Location tools\winres
    go run . ..\..\rsrc_windows_amd64.syso "1:$a\hub.png" "2:$a\tray_ok.png" "3:$a\tray_warn.png" "4:$a\tray_bad.png" "5:$a\tray_unknown.png" `
        "10:$a\smarthome.png" "11:$a\adblock.png" "12:$a\firewall.png" "13:$a\flint.png" "14:$a\weather.png" "15:$a\glrouter.png" "16:$a\web.png"
    $ok = $LASTEXITCODE; Pop-Location
    if ($ok -ne 0) { throw "resource build failed" }
    $ldv = "-X main.appVersion=$Version"
} else { $ldv = "" }

New-Item -ItemType Directory -Force dist | Out-Null
$env:GOOS = "windows"; $env:GOARCH = "amd64"; $env:CGO_ENABLED = "0"
go build -trimpath -ldflags "-H windowsgui -s -w $ldv" -o dist\HomeHub.exe .
if ($LASTEXITCODE -ne 0) { throw "build failed" }
$h = (Get-FileHash dist\HomeHub.exe -Algorithm SHA256).Hash.ToLower()
"$h  HomeHub.exe" | Set-Content dist\HomeHub.exe.sha256
Write-Host "Built dist\HomeHub.exe  (SHA-256 $h)"
