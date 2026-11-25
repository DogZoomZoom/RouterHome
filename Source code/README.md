# Source code

All of the code behind everything in this repo, so anyone can read it, check it and build it themselves.

Nothing here is hidden or left out. The only file that isn't published is the **secret release-signing key**. It can't be public: it proves that updates really come from this project.

| Program | Where its code is | Language |
|---|---|---|
| **Router Home** (what's installed on the router) | The [`payload`](../payload) folder. It already *is* the source: the exact files that get installed, plain text, nothing compiled. | Lua, JavaScript, shell |
| **Router Home installers** (scripts) | [`installer.ps1`](../installer.ps1), [`Install Router Home.cmd`](../Install%20Router%20Home.cmd), [`Install Router Home (Mac).command`](../Install%20Router%20Home%20(Mac).command), plus `install-on-router.sh` and `options-on-router.sh` in [`payload`](../payload) | PowerShell, shell |
| **GUI Installer** (`Router-Home-Setup.exe`) | [`GUI Installer`](GUI%20Installer) in this folder | C# |
| **Vulnerability Checker** (`Vulnerability-Checker.exe`) | [`Vulnerability Checker`](Vulnerability%20Checker) in this folder | C#, plus the Lua script it runs on the router |
| **Home Hub** (`HomeHub.exe`) | [`Home Hub`](Home%20Hub) in this folder. The complete source, including the patched third-party browser library, is also `HomeHub-source.zip` in the [Home Hub folder](../Home%20Hub). | Go |
| **Release signing and build tools** | [`Router Home tools`](Router%20Home%20tools) in this folder | Python, PowerShell |

Every file in this folder is copied from the same build that produces the `.exe` files in this repo, so the code and the programs always match.

## How each program is built

### GUI Installer

[`RouterHomeSetup.cs`](GUI%20Installer/RouterHomeSetup.cs) is one C# file (WinForms, C# 5). [`build-setup-exe.ps1`](GUI%20Installer/build-setup-exe.ps1) compiles it with the C# compiler that's already part of Windows (`csc.exe`, .NET Framework 4.x), so no SDK is needed. The Router Home files it installs, the same ones as in [`payload`](../payload), are packed into the .exe as resources.

What it does on the router is the same as the script installers: it sends the files over SSH with Windows' own `ssh.exe` and runs `install-on-router.sh`. The password is handed to `ssh.exe` through its "askpass" feature and is never written to disk.

### Vulnerability Checker

- [`VulnChecker.cs`](Vulnerability%20Checker/VulnChecker.cs) is the window (C# 5, built the same way, by [`build.ps1`](Vulnerability%20Checker/build.ps1)).
- [`probe.lua`](Vulnerability%20Checker/probe.lua) is the script it sends to the router. It runs once from `/tmp/glvc`, then the same command deletes it.
- Also packed into the .exe:
  - the public key `release.pub` from [`payload`](../payload), used to verify the list's signature
  - the signed vulnerability list from [`security`](../security), used as a fallback when the router can't download it
- `sample.json` is example data for the README screenshots only.

### Home Hub

Go 1.24+, no cgo. Extract `HomeHub-source.zip` from the [Home Hub folder](../Home%20Hub) and run `.\build.ps1`, which runs the tests and then builds `dist\HomeHub.exe`. See the README inside the zip.

[`third_party/go-webview2`](../Home%20Hub) is a patched copy of [wailsapp/go-webview2](https://github.com/wailsapp/go-webview2). It's left out of this browsable copy because it's about 400 files, but it's complete in the zip, with the patches listed in its `PATCHES.md`.

### Router Home tools

- [`rh_sign.py`](Router%20Home%20tools/rh_sign.py) signs releases and the vulnerability list with Ed25519, in OpenWrt's `usign` format, so routers can check them with `usign -V`. The public key is `payload/.../usr/share/machome/release.pub`. The secret key is never published.
- [`make_atlas.ps1`](Router%20Home%20tools/make_atlas.ps1) makes `weather_atlas.bin`, the only non-text file in the payload: the letters and weather icons the Slate's touchscreen draws with, since the router has no font engine.
- [`make-source-folder.ps1`](Router%20Home%20tools/make-source-folder.ps1) builds this folder and checks that no private information is in it.

## Verifying a download

- **Router Home updates** are signed. A router refuses any update whose signature doesn't match the public key in `payload`.
- **Home Hub:** `HomeHub.exe.sha256` holds its SHA-256 checksum.
- **Any .exe:** you can build it yourself from this folder. You can also upload the file to [VirusTotal](https://www.virustotal.com) to have it scanned by about 70 antivirus engines.

## License

MIT, see [LICENSE](../LICENSE). Made with the help of AI (Anthropic's Claude); provided "as is", without warranty or liability (see the main [README](../README.md#disclaimer)).
