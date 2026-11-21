#!/bin/sh
# Router Home installer for GL.iNet routers (firmware 4.x) - macOS version.
# Run:  open Terminal, type "sh " (with a space), drag this file into the window, press Enter.
# Uses macOS's built-in ssh/scp/tar. The router password is typed into ssh's own prompt - this script never sees or stores it.

HERE=$(cd "$(dirname "$0")" && pwd)
PAYLOAD="$HERE/payload"

say()  { printf '%s\n' "$*"; }
cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }
red()  { printf '\033[31m%s\033[0m\n' "$*"; }
yel()  { printf '\033[33m%s\033[0m\n' "$*"; }
ask()  { printf '%s [%s]: ' "$1" "$2" >&2; read -r a; [ -n "$a" ] && printf '%s' "$a" || printf '%s' "$2"; }
yesno(){ while :; do printf '%s (y/n): ' "$1"; read -r a; case "$a" in y|Y|yes|YES) return 0;; n|N|no|NO) return 1;; esac; done; }
finish(){ say ""; printf 'Press Return to close.'; read -r _; exit "${1:-0}"; }

say ""
cyan "  ==============================================="
cyan "   Router Home - Home tab for GL.iNet routers"
cyan "  ==============================================="
say  "  Adds a 'Home' dashboard tab to your router's admin page."
say  "  Tested on: Flint 3 (GL-BE9300), Brume 3 (GL-MT5000), Slate 7 Pro (GL-BE10000), firmware 4.x."
say  "  It does NOT change your Wi-Fi, firewall, VPN or passwords, and it can be removed again."
say  ""

for t in ssh scp tar; do command -v $t >/dev/null 2>&1 || { red "  '$t' wasn't found (it's normally built into macOS)."; finish 1; }; done
[ -d "$PAYLOAD/rootfs-generic" ] && [ -d "$PAYLOAD/rootfs-mt5000" ] || { red "  The 'payload' folder is missing - extract the whole installer zip first."; finish 1; }

# older macOS scp has no -O (and already uses the classic protocol); newer needs -O for GL.iNet routers
SCPO=""; scp -O 2>&1 | grep -qi "illegal option\|unknown option" || SCPO="-O"

say "  1) Install or update the Home tab (then optional security/cleanup questions)"
say "  2) Remove the Home tab"
say "  3) Undo the optional security/cleanup changes made by this installer"
say "  4) Quit"
choice=$(ask "  Choose" "1")
[ "$choice" = "4" ] && exit 0

while :; do
  ip=$(ask "  Router IP address (the address you open the admin page with)" "192.168.8.1")
  echo "$ip" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$' && break
  yel "  That isn't an IP address like 192.168.8.1"
done
say "  Checking $ip ..."
if command -v nc >/dev/null 2>&1 && ! nc -z -G 3 "$ip" 22 >/dev/null 2>&1; then
  red "  Can't reach SSH on $ip (port 22)."
  say "  - Is this Mac connected to that router (Wi-Fi or cable)?"
  say "  - Is the IP right? It's the address of the router's admin page."
  say "  - SSH is on by default on GL.iNet routers; if it was turned off, turn it back on in the admin page."
  finish 1
fi
green "  Router found."
T="root@$ip"
SSHO="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"

hostkey_help() {
  say ""
  yel "  If you saw 'REMOTE HOST IDENTIFICATION HAS CHANGED', this Mac remembers a different device at $ip"
  yel "  (for example after a router reset or a new router)."
  if yesno "  Forget the old entry for $ip and try again?"; then ssh-keygen -R "$ip" >/dev/null 2>&1; return 0; fi
  return 1
}
remote() {  # $1 = command to run on the router
  ssh $SSHO "$T" "$1"; rc=$?
  if [ $rc -eq 255 ] && hostkey_help; then ssh $SSHO "$T" "$1"; rc=$?; fi
  return $rc
}

if [ "$choice" = "2" ]; then
  say ""; cyan "  You'll be asked for the router's admin password (it's not shown while you type)."
  remote "if [ -f /root/machome-backup/uninstall.sh ]; then sh /root/machome-backup/uninstall.sh; else echo 'The Home tab is not installed on this router.'; fi"
  rc=$?; [ $rc -eq 0 ] && green "  Done." || red "  Removal didn't finish (code $rc)."
  finish $rc
fi
if [ "$choice" = "3" ]; then
  say ""; cyan "  You'll be asked for the router's admin password (it's not shown while you type)."
  remote 'ls /root/machome-backup/undo-options-*.sh >/dev/null 2>&1 || echo No optional changes from this installer were found.; for u in $(ls -t /root/machome-backup/undo-options-*.sh 2>/dev/null); do echo Running $u; sh $u && mv $u $u.done; done'
  rc=$?; [ $rc -eq 0 ] && green "  Done." || red "  Undo didn't finish (code $rc)."
  finish $rc
fi

# ---- install
say ""
cyan "  The Home tab includes a speed test that uses Ookla's free Speedtest CLI."
say  "  Your router downloads it directly from Ookla. Using it means accepting Ookla's terms:"
say  "    https://www.speedtest.net/about/eula   and   https://www.speedtest.net/about/privacy"
OOKLA=0; yesno "  Do you accept Ookla's terms and want the speed test?" && OOKLA=1

OPTS=""
say ""
cyan "  ---------------------------------------------------------------"
cyan "  OPTIONAL: security and cleanup (each is asked separately)"
cyan "  ---------------------------------------------------------------"
say  "  Answer n to anything you're unsure about - the Home tab works either way."
say  "  Everything you say yes to can be undone later (run this again, choose 3)."
q() {  # key, title, explanation
  say ""; say "  > $2"; say "    $3"
  yesno "    Do this?" && OPTS="$OPTS $1"
}
if yesno "  Skip all of these and only install the Home tab?"; then say "  OK - Home tab only."
else
  q https    "Make the admin page always use HTTPS (encrypted)." \
             "Stops your login going over the network unencrypted. Your browser may show a one-time certificate warning for the router."
  q wgkey    "Lock down the VPN key file." \
             "Makes the file holding WireGuard VPN private keys readable only by the router's admin account. No downside."
  q ipsec    "Close the unused IPsec ports facing the internet." \
             "Two firewall openings (IPsec ESP and UDP 500) are on by default even with no IPsec VPN set up. Say n if you run an IPsec VPN server on this router."
  q kernel   "Harden a few kernel security settings." \
             "Hides kernel memory addresses, blocks an unprivileged feature (BPF) often used in exploits, and ignores/stops ICMP redirects. No visible effect on the network."
  q opkgsig  "Check signatures on add-on packages." \
             "Makes the router verify GL's digital signature before installing add-on packages. Skipped automatically if the router can't verify GL's package lists."
  q inetd    "Remove an unused FTP entry." \
             "Some GL firmware ships a dormant config line that would share the whole router over FTP if that service were ever started. It isn't running; this just removes the line. No downside."
  q dpi      "Turn off app detection (DPI)." \
             "Frees roughly 60 MB of memory. You lose per-app traffic statistics and app-based parental-control rules."
  q cellular "Turn off the cellular / SMS services." \
             "Only used with a USB 4G/5G modem or SIM. Say n if you ever plug a modem into the router."
  q avahi    "Turn off Bonjour / mDNS (avahi)." \
             "Used to announce the router's own file sharing to Macs. Say n if you share a USB drive from the router."
  q bark     "Turn off the Bark parental-control client." \
             "Only needed if you use the Bark parental-control service with this router."
  q vpntune  "BRUME 3 ONLY: VPN speed tuning (skipped automatically on other models)." \
             "Spreads internet/VPN packet handling over 3 CPU cores and enlarges the packet queue. On a Brume 3 this removed packet drops and raised combined multi-VPN speed about 20%. Mainly helps at very high (gigabit) speeds."
  say ""; [ -n "$OPTS" ] && green "  You chose:$OPTS" || say "  Nothing chosen - Home tab only."
fi
say ""
say "  Not offered here on purpose: 'SSH key-only login'. It would stop this installer (which uses"
say "  the password) from working again for updates or removal."

STAGE=$(mktemp -d /tmp/routerhome.XXXXXX) || { red "  Couldn't create a temp folder."; finish 1; }
trap 'rm -rf "$STAGE"' EXIT
# COPYFILE_DISABLE + ustar: no hidden ._ files or Mac-only headers in the archive
# one build per model; the router picks (Brume 3 = mt5000, everything else = generic)
for m in generic mt5000; do
  COPYFILE_DISABLE=1 tar --format ustar -czf "$STAGE/machome-rootfs-$m.tgz" -C "$PAYLOAD/rootfs-$m" . || { red "  Couldn't package the files."; finish 1; }
done
cp "$PAYLOAD/install-on-router.sh" "$STAGE/"
FILES="$STAGE/machome-rootfs-generic.tgz $STAGE/machome-rootfs-mt5000.tgz $STAGE/install-on-router.sh"
[ $OOKLA = 1 ] && { echo yes > "$STAGE/mh-accept-ookla"; FILES="$FILES $STAGE/mh-accept-ookla"; }
if [ -n "$OPTS" ]; then
  for o in $OPTS; do echo "$o"; done > "$STAGE/mh-options"
  cp "$PAYLOAD/options-on-router.sh" "$STAGE/"
  FILES="$FILES $STAGE/mh-options $STAGE/options-on-router.sh"
fi

say ""
cyan "  You'll be asked for the router's admin password TWICE (once to copy, once to install)."
cyan "  It's the same password you use for the router's admin page. Nothing is shown while you type."
say ""
say "  [1/2] Copying files to the router ..."
scp $SCPO $SSHO $FILES "$T:/tmp/"; rc=$?
if [ $rc -ne 0 ] && hostkey_help; then scp $SCPO $SSHO $FILES "$T:/tmp/"; rc=$?; fi
[ $rc -eq 0 ] || { red "  Copy failed (code $rc). Check the password and try again."; finish 1; }

say "  [2/2] Installing (takes about 30 seconds) ..."
ssh $SSHO "$T" "tr -d '\r' < /tmp/install-on-router.sh | sh; r=\$?; rm -f /tmp/install-on-router.sh; exit \$r"; rc=$?
say ""
if [ $rc -eq 0 ]; then
  green "  ============================================"
  green "   Installed!"
  green "  ============================================"
  say "  1. Open https://$ip in your browser and log in."
  say "  2. Reload the page once (Cmd+Shift+R). 'Home' is now the first item in the left menu."
  say "  3. Optional, all inside the Home tab: weather ZIP, Discord alerts, NAS backup (Control Center)."
  [ -n "$OPTS" ] && say "  The optional changes you chose are listed above; undo them anytime with option 3."
  say "  To remove the Home tab later, run this installer again and choose 2."
else
  red "  The install didn't finish (code $rc). Nothing harmful was left behind;"
  red "  any replaced files were backed up on the router in /root/machome-backup/."
fi
finish $rc
