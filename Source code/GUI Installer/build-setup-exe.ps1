# Builds "Router-Home-Setup.exe", the point-and-click Windows installer (owner, 2026-11-24).
#   powershell -ExecutionPolicy Bypass -File tools\build-setup-exe.ps1 -Out "<path>\Router-Home-Setup.exe"
# 2026-11-25 (antivirus false positives on the version that carried both payloads): the .exe no longer contains Router
# Home itself. It downloads the signed release package from GitHub at install time, and the router checks the
# signature. Packed inside are only small text files: setup-on-router.sh (the install step), options-on-router.sh
# (the optional security choices) and release.pub (the public key the router checks the download with).
# The same .exe now works for every release, so it's only RECOMPILED WHEN ITS INPUTS CHANGE (stamp file next to the
# master copy in tools\setup-exe\dist\). The old compiler isn't deterministic: an unchanged program would otherwise
# get a new fingerprint on every build, and its VirusTotal report would stop matching.
# -Stable/-StableVersion/-Beta/-BetaVersion are accepted but ignored (older build-share calls).
# No custom icon (2026-11-25): with app.ico, Malwarebytes' machine-learning rule quarantined the .exe on launch
# ("MachineLearning/Anomalous"); the identical build without the icon ran untouched. Windows' default icon is used.
# Compiled with the C# compiler that ships with Windows (.NET Framework 4.x), so nothing needs installing.
param([Parameter(Mandatory)][string]$Out, [string]$Stable = "", [string]$StableVersion = "", [string]$Beta = "", [string]$BetaVersion = "", [switch]$Force)
$ErrorActionPreference = "Stop"
$R = Split-Path -Parent $PSScriptRoot
$S = "$PSScriptRoot\setup-exe"
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { $csc = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe" }
if (-not (Test-Path $csc)) { Write-Host "No C# compiler found (.NET Framework 4.x)." -ForegroundColor Red; exit 1 }
$inputs = [ordered]@{
  "RouterHomeSetup.cs"   = "$S\RouterHomeSetup.cs"
  "setup-on-router.sh"   = "$S\setup-on-router.sh"
  "options-on-router.sh" = "$PSScriptRoot\options-on-router.sh"
  "release.pub"          = "$R\routers\brume3\rootfs\usr\share\machome\release.pub"
  "app.manifest"         = "$S\app.manifest"
  "build-setup-exe.ps1"  = "$PSScriptRoot\build-setup-exe.ps1"
}
foreach ($k in $inputs.Keys) { if (-not (Test-Path $inputs[$k])) { Write-Host "missing $($inputs[$k])" -ForegroundColor Red; exit 1 } }
$stampText = ($inputs.Keys | ForEach-Object { $_ + " " + (Get-FileHash $inputs[$_] -Algorithm SHA256).Hash }) -join "`n"
$dist = "$S\dist"; $master = "$dist\Router-Home-Setup.exe"; $stamp = "$master.inputs"
New-Item -ItemType Directory -Force $dist | Out-Null
$same = (Test-Path $master) -and (Test-Path $stamp) -and ((Get-Content $stamp -Raw).Trim() -eq $stampText.Trim())
if ($same -and -not $Force) {
  $note = "unchanged, not recompiled"
} else {
  $res = @("/resource:`"$($inputs['setup-on-router.sh'])`",setup-on-router.sh", "/resource:`"$($inputs['options-on-router.sh'])`",options-on-router.sh", "/resource:`"$($inputs['release.pub'])`",release.pub")
  # (not $out: PowerShell names ignore case, so it would overwrite the -Out parameter)
  $cscLog = & $csc /nologo /target:winexe /optimize+ /platform:anycpu "/out:$master" "/win32manifest:$($inputs['app.manifest'])" `
    /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Core.dll /r:System.Web.Extensions.dll $res "$($inputs['RouterHomeSetup.cs'])" 2>&1
  if ($LASTEXITCODE -ne 0) { $cscLog | ForEach-Object { Write-Host $_ -ForegroundColor Red }; exit 1 }
  [IO.File]::WriteAllText($stamp, $stampText)
  $note = "compiled"
}
$outFull = [IO.Path]::GetFullPath($Out)
New-Item -ItemType Directory -Force (Split-Path $outFull) | Out-Null
Copy-Item $master $outFull -Force
"Router Home Setup ($note; downloads stable/beta from GitHub at install time) -> $Out ($([math]::Round((Get-Item $outFull).Length / 1KB)) KB, sha256 $((Get-FileHash $outFull).Hash.Substring(0,12).ToLower())...)"
