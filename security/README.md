# Known-vulnerability list

This folder holds the list the **Security card → Known vulnerabilities** check uses on every router running Router Home 2.6.5 or newer.

| File | What it is |
|---|---|
| `advisories.json` | GL.iNet security notices turned into checks a router can run |
| `advisories.json.sig` | Its signature, made with the Router Home release key |

## How the check works

There's no AI on the router. It checks two kinds of structured data with plain rules.

1. **GL.iNet security notices (this list).** When GL.iNet posts a security notice, it gets turned into an entry here. Each entry says:
   - which models and firmware it affects
   - what to look for on the router: a running process, a file, a setting, a service, or an open port
   - which fix applies, chosen from a short fixed list (below)
2. **The National Vulnerability Database (NVD).** The router asks NVD for published vulnerabilities (CVEs) for its exact model and compares them with its firmware version.

3. **GL.iNet's own news feeds**, used to spot new notices. The router reads GL's public Security Updates feed and blog feed. Any security post from the last 90 days that this list doesn't cover yet shows on the Security card as "New notice, not checked yet" and sends one Discord alert, so you hear about it the day it's posted. Nothing on the router changes because of a feed post. Real checks only arrive when this signed list is updated.

4. **GL's firmware release notes** (Router Home 2.7.0+). When a new firmware for the router's model describes security fixes, it shows "Firmware update needed" with the CVE numbers, for every model, without waiting for this list.
5. **A daily tampering check** (2.7.0+) that needs no published notice. It looks for:
   - programs running from temporary folders, and program files stored there
   - extra admin accounts and code injection (`/etc/ld.so.preload`)
   - extra task schedulers and unknown programs in system folders
   - new SSH keys, accounts, scheduled tasks or open ports, compared with the router's normal state

   Serious signs mean "factory reset recommended". The rest can be marked "These are expected".

Once a day, each router downloads this list, asks NVD and reads GL's feeds. The checks on the router run again every 10 minutes.

**Keeping the list current:** when a router reports a new GL notice, the maintainer adds an entry here, the build signs the list, and the updated `security` folder is uploaded. Routers pick it up within a day, or straight away with **Check now**. No new Router Home version is needed.

Each entry ends up in one of these states:

| Result | Meaning |
|---|---|
| Not affected | Nothing found |
| Exposed | A risky setting or service is on |
| Suspicious file | A known malware file name exists, but nothing proves an infection |
| Signs of infection | A published sign of an actual attack was found (GL's own, or one documented by researchers who examined hacked routers) |
| Firmware update needed | This firmware version is listed as affected |
| New notice, not checked yet | GL posted a security notice that this list doesn't cover yet |

A new finding sends one Discord alert (alert type "Vulnerability").

## Why the signature matters

A router only uses a downloaded list if `advisories.json.sig` matches. The signature is checked with OpenWrt's `usign` and the Router Home public key, the same key that protects updates. Nobody can add fake checks or fixes by editing these files without the secret key, which never leaves the maintainer's PC.

A list with a bad signature is ignored, and so is a list older than the one the router already has. The router then keeps using its built-in copy, which ships with each Router Home version.

## Fixes

Fixes only come from this fixed list, and the page always asks first:

| Fix | What it does | Undo |
|---|---|---|
| `kill_remove` | Stops the matching processes and deletes the file. A copy of the file and a process list are kept as evidence in `/root/machome-backup/`. | Not needed (it removes malware) |
| `uci_set` | Changes one setting (for example turns off GoodCloud remote management) | Undo script restores the old value |
| `service_off` | Stops and disables a service | Undo script turns it back on |
| `chmod` | Tightens a file's permissions | Undo script restores them |
| `upgrade` | Nothing runs on the router; the page shows a button to the Upgrade page | — |

Firmware upgrades are never automatic.

## Signs of an actual attack (list version 5)

Most notices only say which firmware is affected. That tells you a router *could* be attacked, not that it *was*. So wherever someone has published the traces an attack leaves behind, they're added to that entry as "indicators". Only published, documented traces are used: a guessed one could wrongly tell someone they were hacked.

Each trace is marked as either a sign of infection, or "possible" (suspicious, not proof on its own). The kinds of traces a router can look for:

| Type | Looks for |
|---|---|
| `process` | A running program whose command line contains a text |
| `file` / `path` | A file or path that exists (`path` doesn't open it, which matters for pipes) |
| `contains` | A file containing one of a few texts, such as an attacker's server name in a startup script |
| `nat_rule` | A rule in the firewall's NAT table |
| `conn` | A connection (or connection attempt) to an attacker's address range |
| `uci`, `service`, `listen` | A setting value, an enabled service, an open port (used for "Exposed") |

`path`, `contains`, `nat_rule` and `conn` are new in list version 5 (Router Home 2.8.0 and the standalone checker). Older Router Home versions skip types they don't know, so they keep working with the new list.

**Before restarting a router you think was hacked:** many traces live only in memory and disappear on restart. Others (the backdoor files) survive restarts and even firmware upgrades with **Keep settings** on. The reliable cure is GL's latest firmware installed with **Keep settings off**.

## Limits

- It only knows what has been published. It can't discover unknown vulnerabilities.
- "No signs found" doesn't prove a router was never attacked.
- NVD can take days or weeks to list something new, and many GL.iNet models have no NVD entries at all.

## Current entries

| ID | Notice | Checks |
|---|---|---|
| GL-2026-11-20 | [GL.iNet Security Notice 2026-11-20](https://www.gl-inet.com/en-gb/blogs/blog/glinet-security-notice-2026-11-20): cloud remote management exploited to install malware | The process `crond -i /tmp/.log` (GL's sign of infection), the file `/tmp/.log`, whether GoodCloud remote management is on, and the firmware version. **From list version 5 (2026-11-24) also 15 traces published by independent researchers who examined affected routers** ([RemoteToHome-io/gl-security-incident-2026](https://github.com/RemoteToHome-io/gl-security-incident-2026), [admonstrator/glinet-csa-2026-01](https://github.com/admonstrator/glinet-csa-2026-01); not confirmed by GL.iNet): the hidden backdoor programs `monitord` and `ujaild`, the backdoor files `/usr/bin/monitord` and `/bin/ulogd`, the changed startup file `urandom_seed` and upgrade keep-list, the remote shell to the attackers' server (process and connections to 170.39.226.x), the attacker SSH key `gl-agent`, attacker servers in the remote-terminal settings, startup script or scheduled tasks, plus two "possible" traces (the `SDWAN_IP_MAPPING` firewall rule and the pipe `/tmp/f`). The automatic fix for "infected" was removed: stopping one process gave false comfort when the cure is fresh firmware with Keep settings off. Firmware fixed in fixed in **4.9.1** (Brume 3, GL-MT5000) and **4.10.2** (Flint 3, GL-BE9300) per GL's release notes, which also list kernel patches for CVE-2026-98432 and CVE-2026-99288. Other models: version not confirmed yet (list version 2, 2026-11-22). |
| GL-2026-11-24 | [GL.iNet Security Advisories, Nov 24 2026](https://www.gl-inet.com/en-gb/blogs/security-updates/security-advisories-vulnerabilities-and-cves-nov-24-2026): four vulnerabilities (NAS login bypass in `gl_nas_sys`, root access through the remote terminal `rtty`, AstroWarp command injection, EMQX on KVMs) | The firmware version: fixed in **4.9.2** for the Brume 3 (GL-MT5000) per GL's release notes ("Fixed vulnerability VDB-submit-1113491 and enhanced the security protection of NAS identity authentication"). GL's table of fixed versions for other models doesn't line up on their page, so other models aren't listed yet; the router's own release-notes check still shows "Firmware update needed" when their fix arrives. No service checks: GL gives no sign of infection, and a running NAS or remote-terminal service is only a risk before the fix, which the list format can't express yet (list version 4, 2026-11-24). |

## Entry format

For maintainers. Raise `version` by 1 with every change; routers ignore a list older than the one they have.

```json
{
  "id": "GL-2026-11-20",
  "title": "…", "published": "2026-11-20", "severity": "critical", "link": "https://…",
  "summary": "…",
  "models": ["*"],                        // or e.g. ["mt5000", "be9300"] (from /proc/gl-hw-info/model)
  "fw_min": "4.0.0",                      // optional: only from this firmware up
  "fixed_in": { "mt5000": "4.9.1" },      // optional: firmware that fixes it ("*" = every model)
  "firmware_note": "…",
  "indicators": [ { "type": "process", "match": "…", "label": "…" },
                  { "type": "file", "path": "/tmp/…", "strength": "possible", "label": "…" } ],
  "exposures":  [ { "type": "uci", "key": "config.section.option", "equals": "1", "label": "…" },
                  { "type": "service", "name": "…", "label": "…" },
                  { "type": "listen", "port": 1234, "label": "…" } ],
  "reset":  { "infected": true },         // optional: the notice says a factory reset is the remedy for this status
  "fixes":  { "infected": { "type": "kill_remove", "process": "…", "path": "/tmp/…", "label": "…" },
              "exposed":  { "type": "uci_set", "key": "…", "value": "0", "restart": "service", "label": "…" } },
  "advice": { "infected": "…", "exposed": "…", "ok": "…" }
}
```
