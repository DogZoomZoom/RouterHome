# RouterHome
Router Home adds a Home tab to the GL.iNet admin panel: a clean dashboard showing your network's health at a glance, plus background monitoring that spots problems and fixes many of them automatically.


Features

- Dashboard: internet status, WAN ping graphs, speed tests, connected devices, top bandwidth users, Wi-Fi, system health and weather.
- VPN monitoring (WireGuard and OpenVPN): steady per-tunnel pings, DNS and web checks through each tunnel, ping-only blip detection, a 7-day reliability score, and a 5-hour deep monitor.
- Automatic VPN failover: if a tunnel goes down, its devices move to another healthy tunnel within about 30 seconds, never off the VPN, and move back when it recovers.
- Network Health: internet grade, router → modem → internet diagnosis, double-NAT and bridge-mode detection, jitter and lag spikes, a 24-hour history strip and outage cause guesses.
- Logs for support tickets: an ISP outage and lag log and a VPN outage log, ready to copy or send to Discord.
- Discord alerts: outages, high ping, VPN drops, new devices, firmware updates and more, with mute, digest and anti-spam controls.
- Auto-heal: restarts stuck tunnels and services that keep using more memory, reconnects when a VPN server comes back, and can restart the modem as a last resort.
- Security panel: checks SSH, the firewall, port forwards, UPnP and remote access.
- Phone view, DNS hub, scheduled NAS backups.

Install

Download the installer zip, run Install Router Home, and follow the prompts. Your settings are kept when you update. Every change comes with an undo script.

Requirements

- A GL.iNet router on firmware 4.x (tested on the Brume 3, Flint 3 and Slate 7 Pro).
- SSH access to the router.

Notes

- Speed tests use the official Ookla CLI, which isn't included; the installer downloads it.
- Read-only checks by default; nothing is changed without your OK.
