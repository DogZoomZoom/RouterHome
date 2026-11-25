# Changelog

## 1.0.0 (2026-11-22)

First public release.

- **Choose your tabs.** A setup screen on first run asks which tabs you want (Home Assistant, AdGuard Home,
  GL.iNet routers, Your Weather, any other web page) and where each one is, with a **Check** button for each
  address. Change them any time from the gear button or **Edit tabs…** in the tray menu; changes apply without
  a restart.
- **Any number of GL.iNet routers**, each with automatic sign-in, a pinned certificate, a status dot and desktop
  alerts. Its own icon (router, firewall or Wi-Fi), and an option for routers whose IP address changes.
- **Router Home support:**
  - Opens the Home tab.
  - Reads VPN failover, high ping and Known vulnerabilities (exposed, signs of infection, firmware security
    update needed).
  - Shows the installed Router Home version.
- **Fix:** Router Home's internet, DNS, VPN and temperature alerts were never shown, because they were read from
  the wrong place in its status data.
- **Routers without Router Home** are checked through GL.iNet's own status call (online / offline).
- **PIN is optional:** choose it during setup, set it later, or turn it off from Change PIN.
- **Your Weather:**
  - Its libraries and font are bundled, so it loads nothing from CDNs.
  - On first run it starts at your approximate location instead of a fixed one.
- **Update check:** once a day Home Hub looks for a newer release on GitHub and tells you (it never installs anything).
- **Upgrading from the earlier fixed-tab version:**
  - Your tabs, logins and PIN carry over.
  - The setup screen opens once so you can review them.
