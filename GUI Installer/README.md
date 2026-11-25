# Router Home Setup (Windows)

The easiest way to put Router Home on a GL.iNet router: **one file, a normal Windows window, no commands to type.**

**[Download Router-Home-Setup.exe](Router-Home-Setup.exe)** (on the next page, click the download button ⤓), then double-click it.

<img src="screenshots/1-main-window.png" width="420" alt="Router Home Setup window">

## How to use it

1. **Connect your PC to the router** (Wi-Fi or cable).
2. **Run `Router-Home-Setup.exe`.** The router's address is filled in for you.
3. **Type the router's admin password**, the one you use for its admin page.
4. **Choose a version:** **Stable** (recommended) or **Beta** to try new features early.
5. Press **Install**. It takes about 30 seconds.
6. Open the router's admin page and press **Ctrl+F5** once. **Home** is now the first item in the menu.

<img src="screenshots/4-installed.png" width="420" alt="Finished install">

## Good to know

- **Everything is inside the .exe.** No zip to extract, nothing else to download, nothing to install on your PC. It works on Windows 10 and 11.
- **SSH must be on in the router** (the installer uses it). If it can't connect, the installer tells you where to turn it on: *Security → Access Control → Enable SSH*.
- **"Windows protected your PC"?** This free installer isn't code-signed, so Windows asks once. Click **More info → Run anyway**.
- **Your password stays on your PC.** It goes straight to Windows' own SSH program for this one connection and is never saved.
- **Beta** installs the newest test version and switches the router's update channel to Beta, so the Home tab's update button offers newer betas. Install Stable again to go back.
- **Optional security and cleanup:** extra hardening you can tick one by one. Nothing here is needed, and everything can be undone later from the same window.
- **Remove** and **Undo the optional security changes** are in the same window.
- **SSH keys only?** If your router only accepts SSH keys, click **Use an SSH key instead** and pick your key file.

<p>
<img src="screenshots/2-beta-choice.png" width="330" alt="Stable or Beta">
<img src="screenshots/3-optional-settings.png" width="330" alt="Optional security and cleanup">
</p>

> [!WARNING]
> **Made with AI, use at your own risk.** Router Home and this installer were written with the help of AI (Anthropic's Claude). It's a free hobby project, not made or supported by GL.iNet, provided "as is" with **no liability for any problems** it may cause. See the [Disclaimer](../README.md#disclaimer).

Mac users and anyone who prefers scripts: see the [main README](../README.md#install).
Found a problem? [Report it](../README.md#found-a-bug-or-an-issue).
