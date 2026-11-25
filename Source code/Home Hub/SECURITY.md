# Security

## What Home Hub keeps, and how

- **Router passwords:** Windows Credential Manager (generic credentials named `HomeHub:<tab>`), protected by
  Windows for your account. They're sent only to the router, inside its HTTPS login challenge, never in plain text.
- **Router certificates:** GL.iNet routers use self-signed certificates. On first sign-in Home Hub shows the
  fingerprint and asks you to trust it. After that, every connection (Home Hub's own and the tab's browser) must
  present a trusted certificate, and a change is reported instead of accepted.
- **PIN:** only a salted PBKDF2-SHA256 hash (200,000 rounds) is stored. After 5 wrong PINs each try is delayed
  (30 s, doubling to 15 min), and the delay survives restarts. "Forgot your PIN?" deletes every saved web session
  and router password before a new PIN can be set. The PIN keeps people out of Home Hub's window; it doesn't
  encrypt files, so it's not a defense against someone with full access to your Windows account.
- **Web logins** (Home Assistant, AdGuard Home, other pages) live in each tab's own WebView2 profile under
  `%LOCALAPPDATA%\HomeHub\Tabs`, like a browser profile.
- **Network:** Home Hub talks to the devices you add, and to `api.github.com` once a day for the update check.
  The weather tab calls the weather services listed in THIRD_PARTY_NOTICES.md.

## Reporting a problem

Please open a [GitHub issue](https://github.com/xDarkHawkx/HomeHub/issues) without exploit details and ask for a
private contact, or use GitHub's "Report a vulnerability" on the repository's Security tab if it's enabled.
