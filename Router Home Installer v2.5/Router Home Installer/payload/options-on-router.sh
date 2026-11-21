# Optional security / service changes, applied ONLY for the keywords the owner said yes to in the installer.
# Reads /tmp/mh-options (one keyword per line): https wgkey ipsec kernel opkgsig inetd dpi cellular avahi bark vpntune (Brume 3 only)
# Every change is recorded in /root/machome-backup/undo-options-<timestamp>.sh
# Based on routers/flint3/scripts/harden_flint.sh + optimize_flint.sh (run on a Flint 3, 2026-11-07), with safer service handling:
#  - never calls "enabled"/"stop" on init scripts that aren't rc.common (they ignore the argument and START);
#  - boot state is read from /etc/rc.d links.
O=/tmp/mh-options; [ -s $O ] || exit 0
tr -d '\r' < $O > $O.lf && mv $O.lf $O     # written on Windows
TS=$(date +%Y%m%d-%H%M%S); B=/root/machome-backup; U=$B/undo-options-$TS.sh; mkdir -p $B /etc/machome
has() { grep -qx "$1" $O; }
rpcx() { curl -s -m 20 -H 'glinet: 1' -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"call\",\"params\":[\"\",\"$1\",\"$2\",$3]}" http://127.0.0.1/rpc; }
echo "# Undo optional changes made by the Router Home installer on $TS" > $U
echo ""; echo "== Optional changes you chose"

if has wgkey; then
  if [ -f /etc/config/wireguard ]; then
    echo "chmod $(stat -c %a /etc/config/wireguard 2>/dev/null || echo 664) /etc/config/wireguard" >> $U
    chmod 600 /etc/config/wireguard && echo "  [done] VPN key file is now readable by the router admin account only"
  else echo "  [skip] no /etc/config/wireguard on this router"; fi
fi

if has ipsec; then
  n=0
  for r in $(uci show firewall | grep "=rule" | cut -d. -f2 | cut -d= -f1); do
    nm=$(uci -q get firewall.$r.name)
    if [ "$nm" = "Allow-IPSec-ESP" ] || [ "$nm" = "Allow-ISAKMP" ]; then
      old=$(uci -q get firewall.$r.enabled); echo "uci set firewall.$r.enabled='${old:-1}'" >> $U
      uci set firewall.$r.enabled='0'; n=$((n+1))
    fi
  done
  if [ $n -gt 0 ]; then uci commit firewall; /etc/init.d/firewall reload >/dev/null 2>&1
    echo "uci commit firewall; /etc/init.d/firewall reload" >> $U; echo "  [done] closed $n unused IPsec firewall opening(s)"
  else echo "  [skip] no IPsec firewall rules found"; fi
fi

if has https; then
  before=$(rpcx local-access get_config '{}' | grep -o '"redirect_https":[a-z]*' | cut -d: -f2)
  if [ "$before" = "true" ]; then echo "  [skip] admin page is already HTTPS-only"
  else
    res=$(rpcx local-access set_config '{"redirect_https":true}')
    echo "$res" | grep -q '"error"' && echo "  [failed] router refused the HTTPS setting: $res" || {
      echo "curl -s -H 'glinet: 1' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"call\",\"params\":[\"\",\"local-access\",\"set_config\",{\"redirect_https\":false}]}' http://127.0.0.1/rpc >/dev/null" >> $U
      echo "  [done] admin page now always uses HTTPS (your browser may warn about the router's own certificate once)"; }
  fi
fi

if has kernel; then
  if [ -f /etc/sysctl.d/98-hardening.conf ]; then echo "  [skip] kernel hardening is already installed"
  else
    echo "rm -f /etc/sysctl.d/98-hardening.conf; sed -i '\\#^/etc/sysctl.d/98-hardening.conf\$#d' /etc/sysupgrade.conf" >> $U
    for k in kernel.kptr_restrict net.ipv6.conf.all.accept_redirects net.ipv6.conf.default.accept_redirects net.ipv4.conf.all.send_redirects net.ipv4.conf.default.send_redirects; do
      v=$(sysctl -n $k 2>/dev/null); [ -n "$v" ] && echo "sysctl -w $k=$v >/dev/null" >> $U
    done
    echo "# (kernel.unprivileged_bpf_disabled=1 is only cleared by a reboot)" >> $U
    cat > /etc/sysctl.d/98-hardening.conf <<'EOF'
# Security hardening (Router Home installer)
kernel.kptr_restrict=1
kernel.unprivileged_bpf_disabled=1
net.ipv6.conf.all.accept_redirects=0
net.ipv6.conf.default.accept_redirects=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
EOF
    sysctl -p /etc/sysctl.d/98-hardening.conf >/dev/null 2>&1
    grep -qxF /etc/sysctl.d/98-hardening.conf /etc/sysupgrade.conf || echo /etc/sysctl.d/98-hardening.conf >> /etc/sysupgrade.conf
    echo "  [done] kernel hardening on (kernel addresses hidden, unprivileged BPF off, ICMP redirects ignored/not sent)"
  fi
fi

if has opkgsig; then
  if grep -q '^option check_signature' /etc/opkg.conf 2>/dev/null; then echo "  [skip] package signature checking is already on"
  elif [ -z "$(ls /etc/opkg/keys/ 2>/dev/null)" ]; then echo "  [skip] no package signing keys on this router, so checking can't be turned on safely"
  else
    cp -p /etc/opkg.conf $B/opkg.conf.$TS
    echo "option check_signature 1" >> /etc/opkg.conf
    if opkg update >/tmp/mh-opkg.log 2>&1 && ! grep -qiE 'signature check failed|failed to verify' /tmp/mh-opkg.log; then
      echo "cp -p $B/opkg.conf.$TS /etc/opkg.conf" >> $U
      echo "  [done] package signature checking on ($(grep -c 'Signature check passed' /tmp/mh-opkg.log) package feed(s) verified)"
    else
      cp -p $B/opkg.conf.$TS /etc/opkg.conf; echo "  [skip] GL's package lists couldn't be verified, so it was left off"
    fi
    rm -f /tmp/mh-opkg.log
  fi
fi

if has inetd; then
  if [ -f /etc/inetd.conf ] && grep -qvE '^\s*(#|$)' /etc/inetd.conf; then
    cp -p /etc/inetd.conf $B/inetd.conf.$TS; echo "cp -p $B/inetd.conf.$TS /etc/inetd.conf" >> $U
    printf '# Intentionally empty (Router Home installer %s). The default file shares the whole filesystem over FTP as root.\n' "$TS" > /etc/inetd.conf
    echo "  [done] removed the unused FTP line from /etc/inetd.conf"
  else echo "  [skip] /etc/inetd.conf has no active lines"; fi
fi

# ---- services
links() { ls /etc/rc.d/ 2>/dev/null | grep -E "^[SK][0-9]+$1\$"; }
rccommon() { head -3 /etc/init.d/$1 2>/dev/null | grep -q rc.common; }
off() {   # $1 = init script name
  s=$1; [ -e /etc/init.d/$s ] || return 1
  L=$(links $s); [ -n "$L" ] || { echo "     $s: already off at boot"; return 0; }
  for l in $L; do echo "ln -sf ../init.d/$s /etc/rc.d/$l" >> $U; done
  if rccommon $s; then
    /etc/init.d/$s stop >/dev/null 2>&1; /etc/init.d/$s disable >/dev/null 2>&1
    echo "/etc/init.d/$s start >/dev/null 2>&1" >> $U
    grep -qx "$s" /etc/machome/optimized 2>/dev/null || echo "$s" >> /etc/machome/optimized
  else
    for l in $L; do rm -f /etc/rc.d/$l; done      # raw launcher: remove boot link only, never call it
  fi
  echo "     $s: off"
}
svc() {   # $1 label, rest = scripts
  lbl=$1; shift; any=0
  echo "  $lbl:"
  for s in "$@"; do off $s && any=1; done
  [ $any = 1 ] || echo "     [skip] not installed on this router"
}
if has dpi; then
  if uci -q get netifyd.@netifyd[0] >/dev/null; then echo "uci set netifyd.@netifyd[0].enabled='$(uci -q get netifyd.@netifyd[0].enabled)'; uci commit netifyd" >> $U; uci set netifyd.@netifyd[0].enabled='0'; uci commit netifyd; fi
  svc "App detection (DPI)" netifyd gl_dpi
fi
if has cellular; then svc "Cellular / SMS" gl_cellular_manager sms_manager smstools3 modem_signal; fi
if has avahi; then svc "Bonjour / mDNS (avahi)" avahi-daemon; fi
if has bark; then
  svc "Bark parental-control client" trl-client bark
  killall gl_bark trl-client 2>/dev/null; true
fi

# ---- VPN throughput tuning: Brume 3 (GL-MT5000) only. Same files/values as routers/brume3/scripts/vpn_tune_install.sh + vpn_rps_fix.sh
if has vpntune; then
  if ! grep -qi 'gl-mt5000' /tmp/sysinfo/board_name 2>/dev/null; then echo "  [skip] VPN speed tuning is only for the Brume 3 (GL-MT5000)"
  elif [ -f /etc/sysctl.d/99-vpn-tune.conf ]; then echo "  [skip] VPN speed tuning is already installed"
  else
    WAN=$(uci -q get network.wan.device); [ -n "$WAN" ] || WAN=$(uci -q get network.wan.ifname); [ -n "$WAN" ] || WAN=eth1
    echo "rm -f /etc/sysctl.d/99-vpn-tune.conf /etc/hotplug.d/net/99-vpn-rps /etc/hotplug.d/iface/99-zz-vpn-rps /usr/sbin/machome-vpn-rps" >> $U
    echo "sed -i -e '\\#^/etc/sysctl.d/99-vpn-tune.conf\$#d' -e '\\#^/etc/hotplug.d/net/99-vpn-rps\$#d' -e '\\#^/etc/hotplug.d/iface/99-zz-vpn-rps\$#d' -e '\\#^/usr/sbin/machome-vpn-rps\$#d' /etc/sysupgrade.conf" >> $U
    echo "sysctl -w net.core.netdev_max_backlog=$(sysctl -n net.core.netdev_max_backlog) >/dev/null; sysctl -w net.core.netdev_budget=$(sysctl -n net.core.netdev_budget) >/dev/null" >> $U
    for q in /sys/class/net/$WAN/queues/rx-*; do [ -f "$q/rps_cpus" ] && echo "echo $(cat $q/rps_cpus) > $q/rps_cpus" >> $U; done
    cat > /etc/sysctl.d/99-vpn-tune.conf <<'EOF'
# VPN throughput tuning (Router Home installer). Removes softnet backlog drops at gigabit WireGuard speeds.
net.core.netdev_max_backlog=5000
net.core.netdev_budget=600
EOF
    cat > /usr/sbin/machome-vpn-rps <<'EOF'
#!/bin/sh
# VPN throughput tuning (Router Home installer): keep WAN RX packet steering on CPUs 1-3 (mask e) and the softnet
# queue/budget values. GL's iface/99-wireguard-irq resets WAN RPS on every wg*/wan/lan ifup and /sbin/smp.sh on net
# "add", so this runs from both hotplug paths and once a minute from machome-sampler. Logs only when it changes something.
[ -f /etc/sysctl.d/99-vpn-tune.conf ] || exit 0
WAN=$(uci -q get network.wan.device); [ -n "$WAN" ] || WAN=$(uci -q get network.wan.ifname); [ -n "$WAN" ] || WAN=eth1
for q in /sys/class/net/$WAN/queues/rx-*; do
    [ -f "$q/rps_cpus" ] || continue
    cur=$(cat "$q/rps_cpus")
    if [ "$cur" != "e" ]; then
        echo e > "$q/rps_cpus"
        logger -t vpn-tune "restored $WAN $(basename "$q") RPS e (was $cur; via ${1:-manual}${ACTION:+ $ACTION}${INTERFACE:+ $INTERFACE})"
    fi
done
bl=$(sysctl -n net.core.netdev_max_backlog 2>/dev/null); bu=$(sysctl -n net.core.netdev_budget 2>/dev/null)
[ "${bl:-0}" -ge 5000 ] || { sysctl -w net.core.netdev_max_backlog=5000 >/dev/null; logger -t vpn-tune "restored netdev_max_backlog 5000 (was $bl)"; }
[ "${bu:-0}" -ge 600 ]  || { sysctl -w net.core.netdev_budget=600 >/dev/null;       logger -t vpn-tune "restored netdev_budget 600 (was $bu)"; }
exit 0
EOF
    cat > /etc/hotplug.d/net/99-vpn-rps <<'EOF'
#!/bin/sh
# VPN throughput tuning (Router Home installer): re-apply after /sbin/smp.sh resets RPS on net "add".
[ "$ACTION" = add ] && /usr/sbin/machome-vpn-rps net
EOF
    cat > /etc/hotplug.d/iface/99-zz-vpn-rps <<'EOF'
#!/bin/sh
# VPN throughput tuning (Router Home installer): re-apply after GL's 99-wireguard-irq / 99-ovpn-irq.
case "$ACTION" in ifup|ifdown) /usr/sbin/machome-vpn-rps iface ;; esac
EOF
    chmod 0755 /usr/sbin/machome-vpn-rps /etc/hotplug.d/net/99-vpn-rps /etc/hotplug.d/iface/99-zz-vpn-rps
    for f in /etc/sysctl.d/99-vpn-tune.conf /etc/hotplug.d/net/99-vpn-rps /etc/hotplug.d/iface/99-zz-vpn-rps /usr/sbin/machome-vpn-rps; do
      grep -qxF "$f" /etc/sysupgrade.conf || echo "$f" >> /etc/sysupgrade.conf
    done
    sysctl -p /etc/sysctl.d/99-vpn-tune.conf >/dev/null 2>&1; /usr/sbin/machome-vpn-rps installer
    echo "  [done] VPN speed tuning on (backlog $(sysctl -n net.core.netdev_max_backlog), budget $(sysctl -n net.core.netdev_budget), $WAN RPS $(cat /sys/class/net/$WAN/queues/rx-0/rps_cpus 2>/dev/null))"
  fi
fi

echo 'echo "Optional changes undone."' >> $U; chmod +x $U
rm -f $O
echo "  Undo all of these: sh $U   (or run the installer again and choose 3)"
