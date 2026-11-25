# Home Hub (Windows)

**Your home network's web pages in one Windows app, with GL.iNet router alerts in the system tray.**

Home Hub puts Home Assistant, AdGuard Home, your GL.iNet routers, a weather dashboard and any other web page you use at home into tabs in one window. You stay signed in to each one, and Home Hub keeps watching your routers in the background, so a problem shows up on your desktop even when the window is closed.

It's built to work with [**Router Home**](../README.md), and it works with any GL.iNet 4.x router without it too.

**[Download HomeHub.exe](HomeHub.exe)** (on the next page, click the download button ⤓), then double-click it.

> [!WARNING]
> **Made with AI, use at your own risk.** Home Hub was written with the help of AI (Anthropic's Claude). It's a free hobby project, not made, endorsed or supported by GL.iNet, Home Assistant or AdGuard. It's provided "as is", and **no liability is accepted for any problems** it may cause. See the [Disclaimer](#disclaimer).

<img src="screenshots/setup-choose.png" width="560" alt="Choosing tabs on first run">

## Features

- **Your tabs, your way.** The first time it opens, Home Hub asks which tabs you want and where each one is. Choose from:

  | Tab | What it does |
  |---|---|
  | **Home Assistant** | Your dashboard in its own window. You sign in once, including two-step verification. |
  | **AdGuard Home** | The AdGuard Home admin page. |
  | **GL.iNet router** (add several) | The router's admin page with **automatic sign-in**. With Router Home installed, it opens straight to the Home tab. |
  | **Your Weather** | A forecast dashboard: radar, alerts, air quality, a week-ahead summary, animated weather scenes and dark mode. |
  | **Other web page** | Anything else on your network: NAS, Pi-hole, printer, cameras. |

  A **Check** button confirms each address answers (and tells you if a router has Router Home). Change, rename, reorder or remove tabs any time with the gear button or **Edit tabs…** in the tray menu.
- **Router alerts on your desktop.** Every 30 seconds Home Hub checks each GL.iNet router and shows a Windows notification when something goes wrong, then again when it's fixed. The tray icon turns green, orange or red, and each router tab has a status dot.
  - **With Router Home:** internet and DNS outages, VPN tunnels down, VPN failover, high ping, overheating, failed security checks, known vulnerabilities (exposed, signs of infection, firmware security updates), new devices joining, and new firmware.
  - **Without it:** you're told when the router is unreachable or offline.
- **Secure sign-in for routers.**
  - The router password is kept in **Windows Credential Manager**, encrypted for your Windows account.
  - The router's self-signed certificate is **pinned** by its SHA-256 fingerprint, and you're warned if it ever changes.
  - The session id never goes to your regular browser.
- **Optional PIN lock.** Home Hub can ask for a 4 to 8 digit PIN when it opens, and locks again when you close it to the tray. Router alerts keep working while it's locked. The PIN is stored only as a salted PBKDF2 hash, and wrong guesses are slowed down. "Forgot your PIN?" signs you out of everything before letting you set a new one.
- **Routers whose IP changes.** Tick "Its IP address can change", and Home Hub asks for the new address instead of failing.
- **Small things:**
  - **Ctrl+1…9** switches tabs, **Ctrl+Tab** cycles through them, **F5** reloads, **Ctrl+L** locks.
  - **Start with Windows** starts Home Hub quietly in the tray.
  - Light and dark mode follow Windows.

<img src="screenshots/edit-tabs-dark.png" width="480" alt="Editing tabs, dark mode">

## Install

1. Download **`HomeHub.exe`** from this folder.
2. Put it wherever you like (for example `Documents\Home Hub`) and double-click it. There's no installer, and nothing else to download.
3. Choose your tabs, enter their addresses, and pick whether to use a PIN.
4. Open each tab and sign in once.

**Requirements:**

- Windows 10 or 11 (64-bit).
- The Microsoft Edge **WebView2 Runtime**. Windows 11 already has it. On Windows 10 it usually comes with Microsoft Edge; if a tab can't start, [install it from Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/).

**"Windows protected your PC" or an antivirus warning?** Home Hub is a new, unsigned program that can add itself to "start with Windows" (only if you ask), uses Windows Credential Manager, and talks to devices on your network. Windows and a few antivirus engines flag new programs like that on reputation alone. Click **More info → Run anyway**. The full source code is in `HomeHub-source.zip` in this folder.

**Check your download (optional):** `HomeHub.exe.sha256` holds the file's SHA-256 checksum. In PowerShell, `Get-FileHash HomeHub.exe` should show the same value.

**New versions** appear in this folder. Home Hub's built-in update check looks for a separate Home Hub release page that doesn't exist, so it stays quiet; check back here, or watch the Router Home repo.

## Works best with Router Home

[Router Home](../README.md) adds a **Home** tab to GL.iNet's admin panel: a dashboard with VPN health, security checks, speed tests and auto-repair. When a router has it:

- the router tab opens on the Home tab instead of GL.iNet's default page
- Home Hub reads Router Home's live status (the same alerts as the Home tab's banner) instead of only checking that the router is online
- the tab's right-click menu shows which Router Home version the router runs

On a router without it, the tab's right-click menu has **Get Router Home for this router…**.

## Where things are stored

| What | Where |
|---|---|
| Settings (tabs, window size, PIN hash) | `%APPDATA%\HomeHub\settings.json` |
| Router settings (address, user, certificate fingerprint) | `%APPDATA%\HomeHub\routers\*.json` |
| Router passwords | Windows Credential Manager, `HomeHub:<tab>` |
| Each tab's browser profile (cookies, web logins) | `%LOCALAPPDATA%\HomeHub\Tabs\<tab>\` |
| Log (no passwords or router addresses) | `%LOCALAPPDATA%\HomeHub\homehub.log` |

Removing a tab forgets its saved router password and deletes its browser profile the next time Home Hub starts. To remove Home Hub completely:

1. Exit it from the tray, and turn off **Start with Windows** first if it's on.
2. Delete the `HomeHub` folders above.
3. Remove the `HomeHub:` entries in Credential Manager.

## Source code

`HomeHub-source.zip` has the complete source (Go, no cgo) with its own README, build scripts and tests. To build it you need [Go 1.24+](https://go.dev/dl/): extract the zip, then run `.\build.ps1` in PowerShell (it runs the tests, then builds `dist\HomeHub.exe`). Third-party code and services are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Found a bug?

[Report it](../README.md#found-a-bug-or-an-issue) the same way as for Router Home. Include:

- your Windows version
- the Home Hub version (tray menu → About)
- what happened
- the relevant lines from `%LOCALAPPDATA%\HomeHub\homehub.log`

For a GL.iNet router, also include its model, firmware and Router Home version.

## Disclaimer

- **AI-assisted:** most of Home Hub's code and documents were written with the help of AI (Anthropic's Claude) and tested on the author's own network. AI-written code can contain mistakes that testing didn't catch.
- **No warranty, no liability:** Home Hub is provided **"as is"**, without warranty of any kind. By using it you accept all risk. The author is not liable for any problem it may cause, including lost data, saved passwords, downtime or any other damage.
- **Not official:** Home Hub isn't made, endorsed or supported by GL.iNet, Home Assistant or AdGuard; their names are used only to say what Home Hub works with.

## License

MIT, the same as Router Home (the license file is also inside `HomeHub-source.zip`).
