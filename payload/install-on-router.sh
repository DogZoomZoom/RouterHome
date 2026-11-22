# Fresh install of the Home tab from a rootfs tarball. Run ON THE ROUTER as root.
#   PC:      tar -czf machome-rootfs.tgz -C routers/flint3/rootfs .
#            scp -O machome-rootfs.tgz tools/install-on-router.sh root@<ROUTER-IP>:/tmp/
#   router:  tr -d '\r' < /tmp/install-on-router.sh | sh
# Adapted from routers/flint3/deploy-history/flint_install.sh (the version actually run on the Flint, 2026-11-07).
# The Ookla CLI is NOT included (license): download it yourself to /usr/share/machome/speedtest (see docs/HOW-TO.md).
set -e
T=/tmp/machome-rootfs.tgz; B=/root/machome-backup; X=/tmp/machome-x
# the installer sends one build per model; pick the one for this router (Brume 3 = mt5000, everything else = generic)
if [ ! -f $T ]; then
  M=generic; grep -qi 'gl-mt5000' /tmp/sysinfo/board_name 2>/dev/null && M=mt5000
  [ -f /tmp/machome-rootfs-$M.tgz ] || M=generic
  if [ -f /tmp/machome-rootfs-$M.tgz ]; then mv /tmp/machome-rootfs-$M.tgz $T; echo "Router model: $(cat /tmp/sysinfo/model 2>/dev/null) - using the $M build"; fi
fi
rm -f /tmp/machome-rootfs-*.tgz
[ -f $T ] || { echo "missing $T"; exit 1; }
# only GL.iNet firmware 4.x has the plugin UI this needs
GLV=$(cat /etc/glversion 2>/dev/null || true)
case "$GLV" in 4.*) echo "GL.iNet firmware $GLV - OK";; *) echo "This doesn't look like GL.iNet firmware 4.x (found: '${GLV:-none}'). Nothing installed."; exit 1;; esac
[ -d /usr/share/oui/menu.d ] && [ -d /usr/lib/oui-httpd/rpc ] || { echo "GL plugin folders not found. Nothing installed."; exit 1; }
mkdir -p $B /etc/machome /tmp/machome
rm -rf $X; mkdir -p $X; tar xzf $T -C $X
# refuse to install code that doesn't even parse
for f in usr/lib/oui-httpd/rpc/machome usr/bin/machome-sampler usr/bin/machome-speedtest $(cd $X && ls usr/lib/machome/*.lua 2>/dev/null); do
  lua -e "assert(loadfile('$X/$f'))" || { echo "syntax error in $f - nothing installed"; exit 1; }
done
# back up anything we'd overwrite
TS=$(date +%Y%m%d-%H%M%S)
# (if-form, not "[ ] && { }": with set -e a missing LAST file made the loop return 1 and silently stop the install; fixed 2026-11-22)
( cd $X && find . -type f ) | sed 's#^\./##' | while read f; do if [ -f "/$f" ]; then mkdir -p "$B/pre-install-$TS/$(dirname $f)"; cp -p "/$f" "$B/pre-install-$TS/$f"; fi; done
# install: everything except the readable view, which is served gzipped
( cd $X && find . -type f ! -name 'gl-sdk4-ui-machome.common.js' ) | sed 's#^\./##' | while read f; do mkdir -p "/$(dirname $f)"; cp "$X/$f" "/$f"; done
gzip -9 -c $X/www/views/gl-sdk4-ui-machome.common.js > /www/views/gl-sdk4-ui-machome.common.js.gz
chmod 755 /usr/bin/machome-sampler /usr/bin/machome-speedtest /etc/init.d/machome /etc/init.d/machome-st
if [ -f /usr/sbin/machome-vpn-rps ]; then chmod 755 /usr/sbin/machome-vpn-rps; fi
# alerts off until a webhook is added in the UI; nightly speed test at 4 AM
[ -f /etc/machome/alerts.json ] || { echo '{"enabled":false,"speed_daily":true,"speed_hour":4}' > /etc/machome/alerts.json; chmod 600 /etc/machome/alerts.json; }
# survive firmware upgrades ("keep settings")
for f in /usr/share/oui/menu.d/machome.json /www/views/gl-sdk4-ui-machome.common.js.gz /usr/lib/oui-httpd/rpc/machome \
         /usr/bin/machome-sampler /usr/lib/machome/ /etc/init.d/machome /etc/rc.d/S99machome /etc/rc.d/K10machome \
         /usr/bin/machome-speedtest /etc/init.d/machome-st /usr/share/machome/ /root/.config/ookla/ \
         /usr/share/gl-download.d/machome /usr/share/gl-validator.d/machome.lua /etc/machome/; do
  grep -qxF "$f" /etc/sysupgrade.conf || echo "$f" >> /etc/sysupgrade.conf
done
cat > $B/uninstall.sh <<'EOF'
/etc/init.d/machome stop; /etc/init.d/machome disable; /etc/init.d/machome-st stop 2>/dev/null; killall speedtest 2>/dev/null
rm -rf /usr/share/oui/menu.d/machome.json /www/views/gl-sdk4-ui-machome.common.js.gz /usr/lib/oui-httpd/rpc/machome /usr/bin/machome-sampler \
  /usr/lib/machome /etc/init.d/machome /usr/bin/machome-speedtest /etc/init.d/machome-st /usr/share/machome /root/.config/ookla \
  /usr/share/gl-download.d/machome /usr/share/gl-validator.d/machome.lua /tmp/machome
sed -i -e '/machome/d' -e '\#/root/.config/ookla/#d' /etc/sysupgrade.conf
/etc/init.d/nginx restart; echo "Home tab removed (settings in /etc/machome kept)."
EOF
chmod +x $B/uninstall.sh
rm -rf $X $T
# optional: the router downloads the official Ookla CLI itself (only if the owner accepted Ookla's license in the installer)
if [ -f /tmp/mh-accept-ookla ] && [ ! -x /usr/share/machome/speedtest ]; then
  case "$(uname -m)" in aarch64) OA=aarch64;; armv7*) OA=armhf;; x86_64) OA=x86_64;; *) OA="";; esac
  if [ -n "$OA" ]; then
    echo "Downloading Ookla Speedtest CLI ($OA) from install.speedtest.net ..."
    mkdir -p /usr/share/machome /tmp/ookla-dl
    if curl -fsSL -m 120 -o /tmp/ookla-dl/st.tgz "https://install.speedtest.net/app/cli/ookla-speedtest-1.2.0-linux-$OA.tgz" && tar xzf /tmp/ookla-dl/st.tgz -C /tmp/ookla-dl speedtest; then
      mv /tmp/ookla-dl/speedtest /usr/share/machome/speedtest; chmod 755 /usr/share/machome/speedtest; echo "Speed test installed."
    else echo "Couldn't download the speed test (the rest of the Home tab still works)."; fi
    rm -rf /tmp/ookla-dl
  fi
fi
rm -f /tmp/mh-accept-ookla
# optional security / service changes the owner said yes to (installer asks each one; nothing runs without a yes)
if [ -s /tmp/mh-options ] && [ -f /tmp/options-on-router.sh ]; then tr -d '\r' < /tmp/options-on-router.sh | sh; fi
rm -f /tmp/options-on-router.sh /tmp/mh-options
/etc/init.d/machome enable
# reload, not restart, when nginx is running (2026-11-22): the Home tab's update button runs this installer from a
# process started by nginx, which still holds nginx's ports 80/443. A restart then can't bind them ("Address in use")
# and the admin page stays down; a reload keeps the same master and its ports. New rpc/view files only need a reload.
if pidof nginx >/dev/null 2>&1 && nginx -s reload 2>/dev/null; then echo "nginx reloaded"; else /etc/init.d/nginx restart; fi
/etc/init.d/machome restart
echo "installed; previous files in $B/pre-install-$TS; uninstall: $B/uninstall.sh"
sleep 20
echo "sampler running: $(ps w | grep -c '[m]achome-sampler')"
echo "speed test CLI: $([ -x /usr/share/machome/speedtest ] && echo present || echo 'missing - see HOW-TO')"
logread | grep machome | tail -3
