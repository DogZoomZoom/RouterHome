# Source code

All of the code behind everything in this repo, so anyone can read it, check it and build it themselves.

Nothing here is hidden or left out. The only file that isn't published is the **secret release-signing key**. It can't be public: it proves that updates really come from this project.

| Program | Where its code is | Language |
|---|---|---|
| **Router Home** (what's installed on the router) | The [`payload`](../payload) folder. It already *is* the source: the exact files that get installed, plain text, nothing compiled. | Lua, JavaScript, shell |
| **Router Home installers** (scripts) | [`installer.ps1`](../installer.ps1), [`Install Router Home.cmd`](../Install%20Router%20Home.cmd), [`Install Router Home (Mac).command`](../Install%20Router%20Home%20(Mac).command), plus `install-on-router.sh` and `options-on-router.sh` in [`payload`](../payload) | PowerShell, shell |
| **GUI Installer** (`Router-Home-Setup.exe`) | [`GUI Installer`](GUI%20Installer) in this folder | C# |
| **Vulnerability Checker** (`Vulnerability-Checker.exe`) | [`Vulnerability Checker`](Vulnerability%20Checker) in this folder | C#, plus the Lua script it runs on the router |
| **Release signing and build tools** | [`Router Home tools`](Router%20Home%20tools) in this folder | Python, PowerShell |

Every file in this folder is copied from the same build that produces the `.exe` files in this repo, so the code and the programs always match.

## How each program is built

### GUI Installer

[`RouterHomeSetup.cs`](GUI%20Installer/RouterHomeSetup.cs) is one C# file (WinForms, C# 5). [`build-setup-exe.ps1`](GUI%20Installer/build-setup-exe.ps1) compiles it with the C# compiler that's already part of Windows (`csc.exe`, .NET Framework 4.x), so no SDK is needed.

Router Home itself is **not** packed into the .exe. When you press Install:
1. It downloads the signed release package (`routerhome-update-<version>.tgz` and its `.sig`) from this repo's GitHub releases.
2. It sends them to the router over SSH with Windows' own `ssh.exe`, together with [`setup-on-router.sh`](GUI%20Installer/setup-on-router.sh) and the public key.
3. The router checks the signature with OpenWrt's `usign` and stops if it doesn't match.
4. If the signature matches, the router runs the package's own `install-on-router.sh`, the same as the script installers and the Home tab's update button.

Only three small text files are packed into the .exe: `setup-on-router.sh`, `options-on-router.sh` (from [`payload`](../payload)) and `release.pub`.

The password is handed to `ssh.exe` through its "askpass" feature (ssh starts the same .exe by its short path) and is never written to disk.

### Vulnerability Checker

- [`VulnChecker.cs`](Vulnerability%20Checker/VulnChecker.cs) is the window (C# 5, built the same way, by [`build.ps1`](Vulnerability%20Checker/build.ps1)).
- [`probe.lua`](Vulnerability%20Checker/probe.lua) is the script it sends to the router. It runs once from `/tmp/glvc`, then the same command deletes it.
- Also packed into the .exe:
  - the public key `release.pub` from [`payload`](../payload), used to verify the list's signature
  - the signed vulnerability list from [`security`](../security), used as a fallback when the router can't download it
- `sample.json` is example data for the README screenshots only.

### Router Home tools

- [`rh_sign.py`](Router%20Home%20tools/rh_sign.py) signs releases and the vulnerability list with Ed25519, in OpenWrt's `usign` format, so routers can check them with `usign -V`. The public key is `payload/.../usr/share/machome/release.pub`. The secret key is never published.
- [`make_atlas.ps1`](Router%20Home%20tools/make_atlas.ps1) makes `weather_atlas.bin`, the only non-text file in the payload: the letters and weather icons the Slate's touchscreen draws with, since the router has no font engine.
- [`make-source-folder.ps1`](Router%20Home%20tools/make-source-folder.ps1) builds this folder and checks that no private information is in it.

## Verifying a download

- **Router Home updates** are signed. A router refuses any update whose signature doesn't match the public key in `payload`.
- **Any .exe:** you can build it yourself from this folder. You can also upload the file to [VirusTotal](https://www.virustotal.com) to have it scanned by about 70 antivirus engines.

## License

MIT, see [LICENSE](../LICENSE). Made with the help of AI (Anthropic's Claude); provided "as is", without warranty or liability (see the main [README](../README.md#disclaimer)).
