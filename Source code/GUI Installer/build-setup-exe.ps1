# Builds "Router-Home-Setup.exe", the point-and-click Windows installer (owner, 2026-11-24), with the stable release
# and (optionally) a newer beta packed inside; the window lets the user choose.
#   powershell -ExecutionPolicy Bypass -File tools\build-setup-exe.ps1 -Stable "Router Home Installer\payload" -StableVersion 2.7.1 `
#              [-Beta "share\beta-build\payload" -BetaVersion 2.8.0-beta.2] -Out "Router Home Installer\GUI Installer\Router-Home-Setup.exe"
# build-share.ps1 calls it on every build (stable and -Beta) with the SANITIZED payloads. It lives in the repo's
# "GUI Installer" folder (repo files), not on the release page.
# Compiled with the C# compiler that ships with Windows (.NET Framework 4.x), so nothing needs installing.
param([Parameter(Mandatory)][string]$Stable, [Parameter(Mandatory)][string]$StableVersion, [string]$Beta = "", [string]$BetaVersion = "",
      [Parameter(Mandatory)][string]$Out)
$ErrorActionPreference = "Stop"
$R = Split-Path -Parent $PSScriptRoot
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { $csc = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe" }
if (-not (Test-Path $csc)) { Write-Host "No C# compiler found (.NET Framework 4.x)." -ForegroundColor Red; exit 1 }
$st = Join-Path $env:TEMP ("rh-setup-" + [guid]::NewGuid().ToString("N").Substring(0, 6)); New-Item -ItemType Directory $st | Out-Null
try {
  $res = @()
  # (the leading comma keeps each entry a 3-item array: plain @(@(...)) would flatten into one list)
  $sets = @(, @("stable", $Stable, $StableVersion)); if ($Beta) { $sets += , @("beta", $Beta, $BetaVersion) }
  foreach ($s in $sets) {
    $ch, $pl, $v = $s
    foreach ($need in "rootfs-generic", "rootfs-mt5000", "install-on-router.sh", "options-on-router.sh") {
      if (-not (Test-Path (Join-Path $pl $need))) { Write-Host "$ch payload is missing $need" -ForegroundColor Red; exit 1 } }
    $d = Join-Path $st $ch; New-Item -ItemType Directory $d | Out-Null
    # the same two per-model archives the script installers make at install time
    foreach ($m in "generic", "mt5000") {
      & tar.exe -czf (Join-Path $d "machome-rootfs-$m.tgz") -C (Join-Path $pl "rootfs-$m") .
      if ($LASTEXITCODE -ne 0) { throw "tar failed for $ch $m" }
    }
    Copy-Item (Join-Path $pl "install-on-router.sh"), (Join-Path $pl "options-on-router.sh") $d
    [IO.File]::WriteAllText((Join-Path $d "version.txt"), $v)
    $res += @("machome-rootfs-generic.tgz", "machome-rootfs-mt5000.tgz", "install-on-router.sh", "options-on-router.sh", "version.txt") | ForEach-Object { "/resource:`"$(Join-Path $d $_)`",$ch/$_" }
  }
  $outFull = [IO.Path]::GetFullPath($Out)
  New-Item -ItemType Directory -Force (Split-Path $outFull) | Out-Null
  # (not $out: PowerShell names ignore case, so it would overwrite the -Out parameter)
  $cscLog = & $csc /nologo /target:winexe /optimize+ /platform:anycpu "/out:$outFull" "/win32icon:$R\app\RouterHome\app.ico" `
    /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Core.dll $res "$PSScriptRoot\setup-exe\RouterHomeSetup.cs" 2>&1
  if ($LASTEXITCODE -ne 0) { $cscLog | ForEach-Object { Write-Host $_ -ForegroundColor Red }; exit 1 }
  "Router Home Setup (stable $StableVersion" + $(if ($Beta) { ", beta $BetaVersion" } else { "" }) + ") -> $Out ($([math]::Round((Get-Item $outFull).Length / 1KB)) KB)"
} finally { Remove-Item -Recurse -Force $st -ErrorAction SilentlyContinue }
