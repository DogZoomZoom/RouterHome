# Assembles the repo's "Source code" folder (owner, 2026-11-25: Discord mods asked for all source code).
#   powershell -ExecutionPolicy Bypass -File tools\make-source-folder.ps1 -Out "<folder>"
# build-share.ps1 runs it on every build, so the published source always matches the published .exe files.
# Router Home's router code needs no copy here: the repo's payload\ folder IS the source (Lua, JavaScript, shell).
# Master README: tools\source-folder-README.md. Every file is leak-checked before it's copied.
param([Parameter(Mandatory)][string]$Out)
$ErrorActionPreference = "Stop"
$R = Split-Path -Parent $PSScriptRoot
$map = [ordered]@{
  "GUI Installer\RouterHomeSetup.cs"            = "$R\tools\setup-exe\RouterHomeSetup.cs"
  "GUI Installer\build-setup-exe.ps1"           = "$R\tools\build-setup-exe.ps1"
  "GUI Installer\app.ico"                       = "$R\app\RouterHome\app.ico"
  "Vulnerability Checker\VulnChecker.cs"        = "$R\Vulnerability checker\src\VulnChecker.cs"
  "Vulnerability Checker\probe.lua"             = "$R\Vulnerability checker\src\probe.lua"
  "Vulnerability Checker\sample.json"           = "$R\Vulnerability checker\src\sample.json"
  "Vulnerability Checker\build.ps1"             = "$R\Vulnerability checker\build.ps1"
  "Router Home tools\rh_sign.py"                = "$R\tools\rh_sign.py"
  "Router Home tools\make_atlas.ps1"            = "$R\tools\make_atlas.ps1"
  "Router Home tools\make-source-folder.ps1"    = "$R\tools\make-source-folder.ps1"
}
# Home Hub: its own files, browsable (the patched webview2 library in third_party\ is in HomeHub-source.zip, in the Home Hub folder)
$hs = "$R\Home Hub\source"
Get-ChildItem $hs -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\\.git\\|\\third_party\\|\\dist\\' } | ForEach-Object {
  $map["Home Hub\" + $_.FullName.Substring($hs.Length + 1)] = $_.FullName }
# leak check: nothing private may go public
$bad = '192\.168\.4\.|frinkkyle|Kyle|DogZoom|(brume3|flint3|slate7pro)_ed25519|BEGIN [A-Z ]*PRIVATE KEY'
$problems = @()
foreach ($k in $map.Keys) {
  $src = $map[$k]; if (-not (Test-Path $src)) { throw "missing $src" }
  if ($src -match '\.(png|ico|woff2|syso|bin)$') { continue }
  $hits = Select-String -Path $src -Pattern $bad | Where-Object { $_.Line -notmatch '^\s*\$bad = ' }
  if ($hits) { $problems += $hits | ForEach-Object { "$k : line $($_.LineNumber): $($_.Line.Trim())" } }
}
if ($problems) { $problems | ForEach-Object { Write-Host "LEAK? $_" -ForegroundColor Red }; exit 1 }
if (Test-Path $Out) { Remove-Item -Recurse -Force $Out }
foreach ($k in $map.Keys) { $d = Join-Path $Out $k; New-Item -ItemType Directory -Force (Split-Path $d) | Out-Null; Copy-Item $map[$k] $d }
Copy-Item "$PSScriptRoot\source-folder-README.md" (Join-Path $Out "README.md")
"Source code folder -> $Out ($((Get-ChildItem $Out -Recurse -File -Force).Count) files, leak check passed)"
