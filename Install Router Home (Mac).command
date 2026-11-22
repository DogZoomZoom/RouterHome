#!/bin/sh
# Router Home installer for GL.iNet routers (firmware 4.x) - macOS version.
# Run:  open Terminal, type "sh " (with a space), drag this file into the window, press Enter.
# Uses macOS's built-in ssh/tar. The router password is typed into ssh's own prompt - this script never sees or stores it.

umask 077

HERE=$(cd "$(dirname "$0")" && pwd) || exit 1
PAYLOAD="$HERE/payload"
STAGE=""

cleanup() {
  [ -n "$STAGE" ] && [ -d "$STAGE" ] && rm -rf "$STAGE"
}
trap cleanup EXIT
trap 'cleanup; exit 130' INT HUP TERM

say()  { printf '%s\n' "$*"; }
cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }
red()  { printf '\033[31m%s\033[0m\n' "$*"; }
yel()  { printf '\033[33m%s\033[0m\n' "$*"; }
ask()  {
  printf '%s [%s]: ' "$1" "$2" >&2
  read -r a || exit 1
  [ -n "$a" ] && printf '%s' "$a" || printf '%s' "$2"
}
yesno(){
  while :; do
    printf '%s (y/n): ' "$1"
    read -r a || exit 1
    case "$a" in
      y|Y|yes|YES) return 0 ;;
      n|N|no|NO)   return 1 ;;
    esac
  done
}
finish(){
  say ""
  printf 'Press Return to close.'
  read -r _ || true
  exit "${1:-0}"
}
valid_ip() {
  case "$1" in
    *[!0-9.]*|.*|*.|*..*|"") return 1 ;;
  esac
  old_ifs=$IFS; IFS=.
  # shellcheck disable=SC2086
  set -- $1
  IFS=$old_ifs
  [ $# -eq 4 ] || return 1
  for oct in "$1" "$2" "$3" "$4"; do
    case "$oct" in
      ""|0[0-9]*) return 1 ;;
    esac
    [ "$oct" -ge 0 ] 2>/dev/null && [ "$oct" -le 255 ] 2>/dev/null || return 1
  done
  return 0
}

say ""
cyan "  ==============================================="
cyan "   Router Home - Home tab for GL.iNet routers"
cyan "  ==============================================="
say  "  Adds a 'Home' dashboard tab to your router's admin page."
say  "  Tested on: Flint 3 (GL-BE9300), Brume 3 (GL-MT5000), Slate 7 Pro (GL-BE10000), firmware 4.x."
say  "  It does NOT change your Wi-Fi, firewall, VPN or passwords, and it can be removed again."
say  ""

for t in ssh ssh-keygen tar; do
  command -v "$t" >/dev/null 2>&1 || { red "  '$t' wasn't found (it's normally built into macOS)."; finish 1; }
done
[ -d "$PAYLOAD/rootfs-generic" ] && [ -d "$PAYLOAD/rootfs-mt5000" ] || {
  red "  The 'payload' folder is missing - extract the whole installer zip first."
  finish 1
}

say "  1) Install or update the Home tab (then optional security/cleanup questions)"
say "  2) Remove the Home tab"
say "  3) Undo the optional security/cleanup changes made by this installer"
say "  4) Quit"
while :; do
  choice=$(ask "  Choose" "1")
  case "$choice" in
    1|2|3) break ;;
    4) exit 0 ;;
    *) yel "  Please enter 1, 2, 3, or 4." ;;
  esac
done

while :; do
  ip=$(ask "  Router IP address (the address you open the admin page with)" "192.168.8.1")
  valid_ip "$ip" && break
  yel "  That isn't a valid IPv4 address like 192.168.8.1"
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

hostkey_mismatch() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 "$T" exit 2>&1 | \
    grep -qi "identification has changed\|host key verification failed"
}
hostkey_help() {
  hostkey_mismatch || return 1
  say ""
  yel "  This Mac remembers a different device at $ip (for example after a router reset or a new router)."
  if yesno "  Forget the old SSH key entry for $ip and try again?"; then
    ssh-keygen -R "$ip" >/dev/null 2>&1
    return 0
  fi
  return 1
}
remote() {  # $1 = command to run on the router
  ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$T" "$1"; rc=$?
  if [ $rc -eq 255 ] && hostkey_help; then
    ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$T" "$1"; rc=$?
  fi
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
  remote 'set -- /root/machome-backup/undo-options-*.sh
if [ ! -e "$1" ]; then
  echo "No optional changes from this installer were found."
  exit 0
fi
rc=0
for u in $(ls -t /root/machome-backup/undo-options-*.sh 2>/dev/null); do
  echo "Running $u"
  if sh "$u"; then
    mv "$u" "$u.done"
  else
    rc=$?
  fi
done
exit $rc'
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

STAGE=$(mktemp -d "${TMPDIR:-/tmp}/routerhome.XXXXXX") || { red "  Couldn't create a temp folder."; finish 1; }
# COPYFILE_DISABLE + ustar: no hidden ._ files or Mac-only headers in the archive
# one build per model; the router picks (Brume 3 = mt5000, everything else = generic)
COPYFILE_DISABLE=1 tar --format ustar -czf "$STAGE/machome-rootfs-generic.tgz" -C "$PAYLOAD/rootfs-generic" . &
pid_gen=$!
COPYFILE_DISABLE=1 tar --format ustar -czf "$STAGE/machome-rootfs-mt5000.tgz" -C "$PAYLOAD/rootfs-mt5000" . &
pid_mt=$!
if ! wait "$pid_gen" || ! wait "$pid_mt"; then
  red "  Couldn't package the files."
  finish 1
fi

cp "$PAYLOAD/install-on-router.sh" "$STAGE/" || { red "  Couldn't stage installer script."; finish 1; }
set -- machome-rootfs-generic.tgz machome-rootfs-mt5000.tgz install-on-router.sh
if [ "$OOKLA" -eq 1 ]; then
  printf 'yes\n' > "$STAGE/mh-accept-ookla"
  set -- "$@" mh-accept-ookla
fi
if [ -n "$OPTS" ]; then
  for o in $OPTS; do printf '%s\n' "$o"; done > "$STAGE/mh-options"
  cp "$PAYLOAD/options-on-router.sh" "$STAGE/" || { red "  Couldn't stage options script."; finish 1; }
  set -- "$@" mh-options options-on-router.sh
fi

say ""
cyan "  You'll be asked for the router's admin password ONCE."
cyan "  It's the same password you use for the router's admin page. Nothing is shown while you type."
say ""
say "  Copying files and installing on the router (takes about 30 seconds) ..."

run_install() {
  (cd "$STAGE" && COPYFILE_DISABLE=1 tar --format ustar -cf - "$@") | \
    ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$T" \
    "tar -xf - -C /tmp && { tr -d '\r' < /tmp/install-on-router.sh | sh; }; r=\$?; rm -f /tmp/install-on-router.sh /tmp/options-on-router.sh /tmp/mh-options /tmp/mh-accept-ookla /tmp/machome-rootfs*.tgz; exit \$r"
}

run_install "$@"; rc=$?
if [ $rc -eq 255 ] && hostkey_help; then
  run_install "$@"; rc=$?
fi

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
