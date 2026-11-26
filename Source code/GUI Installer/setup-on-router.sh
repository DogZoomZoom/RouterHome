# Router-Home-Setup.exe, install step: runs ON THE ROUTER from /tmp/rhsetup (2026-11-25).
# The .exe downloaded the signed release package (routerhome-update-<version>.tgz + .sig) from the Router Home GitHub
# release and sent it here with the Router Home public key. Nothing is installed unless the signature matches:
# the same check the Home tab's update button makes (upd_job.lua). Then the package's own install-on-router.sh runs.
D=/tmp/rhsetup
cd $D || exit 1
command -v usign >/dev/null 2>&1 || { echo "This router has no usign, so the download's signature can't be checked. Nothing installed."; exit 3; }
# release.pub = the current Router Home key; release-old.pub = the previous one, accepted only during the 2.8.0 key
# switch (2.8.0 itself is signed with it). Drop it once releases are signed with the new key.
if ! usign -V -q -m pkg.tgz -p release.pub -x pkg.tgz.sig && ! { [ -f release-old.pub ] && usign -V -q -m pkg.tgz -p release-old.pub -x pkg.tgz.sig; }; then
  echo "The download's signature does NOT match the Router Home release key. Nothing installed."; exit 4
fi
echo "Signature OK: this is an official Router Home release."
mkdir -p x && tar xzf pkg.tgz -C x || { echo "The download couldn't be unpacked. Nothing installed."; exit 5; }
M=generic; grep -qi 'gl-mt5000' /tmp/sysinfo/board_name 2>/dev/null && M=mt5000
[ -d x/rootfs-$M ] || M=generic
if [ ! -f x/install-on-router.sh ] || [ ! -d x/rootfs-$M ]; then echo "The download is incomplete. Nothing installed."; exit 5; fi
echo "Router model: $(cat /tmp/sysinfo/model 2>/dev/null) - using the $M build"
tar czf /tmp/machome-rootfs.tgz -C x/rootfs-$M .
[ -f mh-accept-ookla ] && cp mh-accept-ookla /tmp/
[ -s mh-options ] && cp mh-options options-on-router.sh /tmp/
tr -d '\r' < x/install-on-router.sh | sh || exit $?
# the update channel the Home tab's update button follows (2.7.1+)
CH=$(cat channel 2>/dev/null)
case "$CH" in beta|stable) mkdir -p /etc/machome && printf '{"channel":"%s"}' "$CH" > /etc/machome/update.json;; esac
exit 0
