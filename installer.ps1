# Router Home installer for GL.iNet routers (firmware 4.x). Started by "Install Router Home.cmd".
# Uses Windows' built-in OpenSSH. The router password is typed into ssh's own prompt - this script never sees or stores it.
$ErrorActionPreference = "Stop"
$Here    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Payload = Join-Path $Here "payload"
$Host.UI.RawUI.WindowTitle = "Router Home installer"

function Say($t, $c = "Gray") { Write-Host $t -ForegroundColor $c }
function Ask($q, $def) { $a = Read-Host "$q$(if ($def) { " [$def]" })"; if ([string]::IsNullOrWhiteSpace($a)) { $def } else { $a.Trim() } }
function YesNo($q) { while ($true) { $a = (Read-Host "$q (y/n)").Trim().ToLower(); if ($a -in "y","yes") { return $true }; if ($a -in "n","no") { return $false } } }
function Port22($ip) { try { $c = New-Object Net.Sockets.TcpClient; $ok = $c.ConnectAsync($ip, 22).Wait(3000) -and $c.Connected; $c.Close(); $ok } catch { $false } }
# Out-Host: show the program's output live and return ONLY its exit code. Without it PowerShell made the router's
# whole install log part of the return value, so a successful install (code 0) was reported as "didn't finish"
# (user report 2026-11-22, Slate 7 / BE3600).
function Run($exe, [string[]]$argv) { & $exe @argv | Out-Host; return $LASTEXITCODE }

Say ""
Say "  ===============================================" Cyan
Say "   Router Home - Home tab for GL.iNet routers" Cyan
Say "  ===============================================" Cyan
Say "  Adds a 'Home' dashboard tab to your router's admin page."
Say "  Tested on: Flint 3 (GL-BE9300), Brume 3 (GL-MT5000), Slate 7 Pro (GL-BE10000), firmware 4.x."
Say "  It does NOT change your Wi-Fi, firewall, VPN or passwords, and it can be removed again."
Say ""

foreach ($t in "ssh", "ssh-keygen", "tar") {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) {
    Say "  '$t' wasn't found. This needs Windows 10 (1809 or newer) or Windows 11 with the built-in OpenSSH Client." Red
    Say "  Settings > Apps > Optional features > Add 'OpenSSH Client', then run this again." Yellow
    exit 1
  }
}
if (-not (Test-Path (Join-Path $Payload "rootfs-generic")) -or -not (Test-Path (Join-Path $Payload "rootfs-mt5000"))) { Say "  The 'payload' folder is missing - re-extract the whole installer zip." Red; exit 1 }

Say "  1) Install or update the Home tab (then optional security/cleanup questions)"
Say "  2) Remove the Home tab"
Say "  3) Undo the optional security/cleanup changes made by this installer"
Say "  4) Quit"
# (2026-11-22, same as the Mac installer's PR #1 fixes: anything but 1-4 asks again; before, a typo went on to install)
do {
  $choice = Ask "  Choose" "1"
  if ($choice -notin "1", "2", "3", "4") { Say "  Please enter 1, 2, 3, or 4." Yellow }
} until ($choice -in "1", "2", "3", "4")
if ($choice -eq "4") { exit 0 }

# ---- router address (four numbers 0-255, no leading zeros)
do {
  $ip = Ask "  Router IP address (the address you open the admin page with)" "192.168.8.1"
  $okIp = $ip -match '^(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})$' -and (($ip.Split('.') | ForEach-Object { [int]$_ -le 255 }) -notcontains $false)
  if (-not $okIp) { Say "  That isn't a valid IPv4 address like 192.168.8.1" Yellow }
} until ($okIp)
Say "  Checking $ip ..."
if (-not (Port22 $ip)) {
  Say "  Can't reach SSH on $ip (port 22)." Red
  Say "  - Is this PC connected to that router (Wi-Fi or cable)?"
  Say "  - Is the IP right? It's the address of the router's admin page."
  Say "  - Is SSH turned on? The installer needs it (user tip, 2026-11-22). In the router's admin page:" Yellow
  Say "      Security > Access Control (or Admin Panel) > turn on 'Enable SSH' > Apply, then run this again." Yellow
  Say "    If the switch won't stay on, set a stronger admin password first: GL turns SSH off when the" Yellow
  Say "    admin password is weak." Yellow
  exit 1
}
Say "  Router found." Green
$target = "root@$ip"
$sshOpts = @("-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=10")

# Only offer to forget the router's old key when that's really the problem (not after a mistyped password)
function HostKeyMismatch {
  $eap = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  try { $o = & ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 $target exit 2>&1 | Out-String } catch { $o = "" }
  $ErrorActionPreference = $eap
  return ($o -match '(?i)identification has changed|host key verification failed')
}
function HostKeyHelp {
  if (-not (HostKeyMismatch)) { return $false }
  Say ""
  Say "  This PC remembers a different device at $ip (for example after a router reset or a new router)." Yellow
  if (YesNo "  Forget the old SSH key entry for $ip and try again?") { & ssh-keygen -R $ip | Out-Null; return $true }
  return $false
}

# ---- remove
if ($choice -eq "2") {
  Say ""
  Say "  You'll be asked for the router's admin password (it's not shown while you type)." Cyan
  $cmd = "if [ -f /root/machome-backup/uninstall.sh ]; then sh /root/machome-backup/uninstall.sh; else echo 'The Home tab is not installed on this router.'; fi"
  $rc = Run "ssh" ($sshOpts + @($target, $cmd))
  if ($rc -eq 255 -and (HostKeyHelp)) { $rc = Run "ssh" ($sshOpts + @($target, $cmd)) }
  if ($rc -eq 0) { Say "  Done." Green } else { Say "  Removal didn't finish (code $rc)." Red }
  exit $rc
}

# ---- undo optional changes (runs every undo-options script, newest first)
if ($choice -eq "3") {
  Say ""
  Say "  You'll be asked for the router's admin password (it's not shown while you type)." Cyan
  # (no double quotes inside: Windows PowerShell 5.1 strips them when passing arguments to ssh.exe)
  $cmd = 'ls /root/machome-backup/undo-options-*.sh >/dev/null 2>&1 || echo No optional changes from this installer were found.; for u in $(ls -t /root/machome-backup/undo-options-*.sh 2>/dev/null); do echo Running $u; sh $u && mv $u $u.done; done'
  $rc = Run "ssh" ($sshOpts + @($target, $cmd))
  if ($rc -eq 255 -and (HostKeyHelp)) { $rc = Run "ssh" ($sshOpts + @($target, $cmd)) }
  if ($rc -eq 0) { Say "  Done." Green } else { Say "  Undo didn't finish (code $rc)." Red }
  exit $rc
}

# ---- install: Ookla speed test licence
Say ""
Say "  The Home tab includes a speed test that uses Ookla's free Speedtest CLI." Cyan
Say "  Your router downloads it directly from Ookla. Using it means accepting Ookla's terms:"
Say "    https://www.speedtest.net/about/eula   and   https://www.speedtest.net/about/privacy"
$ookla = YesNo "  Do you accept Ookla's terms and want the speed test?"

# ---- optional security / cleanup: ask each one, nothing happens without a yes
$opts = @()
Say ""
Say "  ---------------------------------------------------------------" Cyan
Say "  OPTIONAL: security and cleanup (each is asked separately)" Cyan
Say "  ---------------------------------------------------------------" Cyan
Say "  Answer n to anything you're unsure about - the Home tab works either way."
Say "  Everything you say yes to can be undone later (run this again, choose 3)."
if (YesNo "  Skip all of these and only install the Home tab?") { Say "  OK - Home tab only." }
else {
  $Q = @(
    @("https",    "Make the admin page always use HTTPS (encrypted).",
                  "Stops your login going over the network unencrypted. Your browser may show a one-time certificate warning for the router."),
    @("wgkey",    "Lock down the VPN key file.",
                  "Makes the file holding WireGuard VPN private keys readable only by the router's admin account. No downside."),
    @("ipsec",    "Close the unused IPsec ports facing the internet.",
                  "Two firewall openings (IPsec ESP and UDP 500) are on by default even with no IPsec VPN set up. Say n if you run an IPsec VPN server on this router."),
    @("kernel",   "Harden a few kernel security settings.",
                  "Hides kernel memory addresses, blocks an unprivileged feature (BPF) often used in exploits, and ignores/stops ICMP redirects. No visible effect on the network."),
    @("opkgsig",  "Check signatures on add-on packages.",
                  "Makes the router verify GL's digital signature before installing add-on packages. Skipped automatically if the router can't verify GL's package lists."),
    @("inetd",    "Remove an unused FTP entry.",
                  "Some GL firmware ships a dormant config line that would share the whole router over FTP if that service were ever started. It isn't running; this just removes the line. No downside."),
    @("dpi",      "Turn off app detection (DPI).",
                  "Frees roughly 60 MB of memory. You lose per-app traffic statistics and app-based parental-control rules."),
    @("cellular", "Turn off the cellular / SMS services.",
                  "Only used with a USB 4G/5G modem or SIM. Say n if you ever plug a modem into the router."),
    @("avahi",    "Turn off Bonjour / mDNS (avahi).",
                  "Used to announce the router's own file sharing to Macs. Say n if you share a USB drive from the router."),
    @("bark",     "Turn off the Bark parental-control client.",
                  "Only needed if you use the Bark parental-control service with this router."),
    @("vpntune",  "BRUME 3 ONLY: VPN speed tuning (skipped automatically on other models).",
                  "Spreads internet/VPN packet handling over 3 CPU cores and enlarges the packet queue. On a Brume 3 this removed packet drops and raised combined multi-VPN speed about 20%. Mainly helps at very high (gigabit) speeds.")
  )
  foreach ($q in $Q) {
    Say ""
    Say ("  > " + $q[1]) White
    Say ("    " + $q[2])
    if (YesNo "    Do this?") { $opts += $q[0] }
  }
  Say ""
  if ($opts.Count) { Say ("  You chose: " + ($opts -join ", ")) Green } else { Say "  Nothing chosen - Home tab only." }
}
Say ""
Say "  Not offered here on purpose: 'SSH key-only login'. It would stop this installer (which uses" DarkGray
Say "  the password) from working again for updates or removal." DarkGray

# ---- build the bundle
$stage = Join-Path $env:TEMP ("routerhome-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory $stage | Out-Null
try {
  # one build per model; the router picks (Brume 3 = mt5000, everything else = generic)
  foreach ($m in "generic", "mt5000") {
    & tar -czf (Join-Path $stage "machome-rootfs-$m.tgz") -C (Join-Path $Payload "rootfs-$m") .
    if ($LASTEXITCODE -ne 0) { throw "couldn't package the files" }
  }
  Copy-Item (Join-Path $Payload "install-on-router.sh") $stage
  $names = @("machome-rootfs-generic.tgz", "machome-rootfs-mt5000.tgz", "install-on-router.sh")
  if ($ookla) { Set-Content (Join-Path $stage "mh-accept-ookla") "yes" -Encoding ascii; $names += "mh-accept-ookla" }
  if ($opts.Count) {
    [IO.File]::WriteAllText((Join-Path $stage "mh-options"), (($opts -join "`n") + "`n"))
    Copy-Item (Join-Path $Payload "options-on-router.sh") $stage
    $names += "mh-options", "options-on-router.sh"
  }
  # ONE connection copies and installs (2026-11-22, like the Mac installer): the files go as a tar stream into the
  # same ssh session, so the password is asked once. The pipe runs in cmd.exe: a PowerShell 5.1 pipe between two
  # programs would corrupt the binary stream. Only single quotes in the router command (PS 5.1 / cmd strip double).
  # Whatever happens, the helper files are removed from the router's /tmp afterwards.
  $remote = "tar -xf - -C /tmp && { tr -d '\r' < /tmp/install-on-router.sh | sh; }; r=`$?; rm -f /tmp/install-on-router.sh /tmp/options-on-router.sh /tmp/mh-options /tmp/mh-accept-ookla /tmp/machome-rootfs*.tgz; exit `$r"
  $send = Join-Path $stage "send.cmd"
  [IO.File]::WriteAllText($send, "@echo off`r`ncd /d `"%~dp0`"`r`ntar --format ustar -cf - $($names -join ' ') | ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 $target `"$remote`"`r`nexit /b %errorlevel%`r`n", [Text.Encoding]::ASCII)

  Say ""
  Say "  You'll be asked for the router's admin password ONCE." Cyan
  Say "  It's the same password you use for the router's admin page. Nothing is shown while you type." Cyan
  Say ""
  Say "  Copying files and installing on the router (takes about 30 seconds) ..."
  $rc = Run "cmd.exe" @("/d", "/c", $send)
  if ($rc -eq 255 -and (HostKeyHelp)) { $rc = Run "cmd.exe" @("/d", "/c", $send) }
  Say ""
  if ($rc -eq 0) {
    Say "  ============================================" Green
    Say "   Installed!" Green
    Say "  ============================================" Green
    Say "  1. Open https://$ip in your browser and log in."
    Say "  2. Press Ctrl+F5 once. 'Home' is now the first item in the left menu."
    Say "  3. Optional, all inside the Home tab: weather ZIP, Discord alerts, NAS backup (Control Center)."
    Say ""
    if ($opts.Count) { Say "  The optional changes you chose are listed above; undo them anytime with option 3." }
    Say "  To remove the Home tab later, run this installer again and choose 2."
  } else {
    Say "  The install didn't finish (code $rc). Nothing harmful was left behind;" Red
    Say "  any replaced files were backed up on the router in /root/machome-backup/." Red
  }
  exit $rc
}
finally { Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue }
