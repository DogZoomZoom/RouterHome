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
  "GUI Installer\setup-on-router.sh"            = "$R\tools\setup-exe\setup-on-router.sh"
  "GUI Installer\build-setup-exe.ps1"           = "$R\tools\build-setup-exe.ps1"
  "GUI Installer\app.manifest"                  = "$R\tools\setup-exe\app.manifest"
  "Vulnerability Checker\VulnChecker.cs"        = "$R\Vulnerability checker\src\VulnChecker.cs"
  "Vulnerability Checker\probe.lua"             = "$R\Vulnerability checker\src\probe.lua"
  "Vulnerability Checker\sample.json"           = "$R\Vulnerability checker\src\sample.json"
  "Vulnerability Checker\build.ps1"             = "$R\Vulnerability checker\build.ps1"
  "Router Home tools\rh_sign.py"                = "$R\tools\rh_sign.py"
  "Router Home tools\make_atlas.ps1"            = "$R\tools\make_atlas.ps1"
  "Router Home tools\make-source-folder.ps1"    = "$R\tools\make-source-folder.ps1"
}
foreach ($k in @($map.Keys)) { if ($map[$k] -match '\\Home Hub\\') { $map.Remove($k) } }   # Home Hub left the repo (2026-11-25)
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
# update in place (2026-11-25: deleting the whole folder first failed when Windows held one file open, e.g. a
# thumbnail preview): copy every file only if it differs, then remove files that are no longer part of the folder
$keep = @{}
foreach ($k in $map.Keys) {
  $d = Join-Path $Out $k; $keep[[IO.Path]::GetFullPath($d).ToLower()] = $true
  New-Item -ItemType Directory -Force (Split-Path $d) | Out-Null
  if (-not (Test-Path $d) -or (Get-FileHash $d).Hash -ne (Get-FileHash $map[$k]).Hash) { Copy-Item $map[$k] $d -Force }
}
$keep[[IO.Path]::GetFullPath((Join-Path $Out "README.md")).ToLower()] = $true
Get-ChildItem $Out -Recurse -File -Force | Where-Object { -not $keep.ContainsKey($_.FullName.ToLower()) } | ForEach-Object {
  try { Remove-Item $_.FullName -Force -ErrorAction Stop } catch { Write-Host "couldn't remove old file $($_.FullName) (in use?)" -ForegroundColor Yellow } }
Get-ChildItem $Out -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending | Where-Object { -not (Get-ChildItem $_.FullName -Force) } | Remove-Item -Force
Copy-Item "$PSScriptRoot\source-folder-README.md" (Join-Path $Out "README.md")
"Source code folder -> $Out ($((Get-ChildItem $Out -Recurse -File -Force).Count) files, leak check passed)"
