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

Once a day, each router downloads this list, asks NVD and reads GL's feeds. The checks on the router run again every 10 minutes.

**Keeping the list current:** when a router reports a new GL notice, the maintainer adds an entry here, the build signs the list, and the updated `security` folder is uploaded. Routers pick it up within a day, or straight away with **Check now**. No new Router Home version is needed.

Each entry ends up in one of these states:

| Result | Meaning |
|---|---|
| Not affected | Nothing found |
| Exposed | A risky setting or service is on |
| Suspicious file | A known malware file name exists, but nothing proves an infection |
| Signs of infection | GL's sign of compromise was found |
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

## Limits

- It only knows what has been published. It can't discover unknown vulnerabilities.
- "No signs found" doesn't prove a router was never attacked.
- NVD can take days or weeks to list something new, and many GL.iNet models have no NVD entries at all.

## Current entries

| ID | Notice | Checks |
|---|---|---|
| GL-2026-11-20 | [GL.iNet Security Notice 2026-11-20](https://www.gl-inet.com/en-gb/blogs/blog/glinet-security-notice-2026-11-20): cloud remote management exploited to install malware | The process `crond -i /tmp/.log` (GL's sign of infection), the file `/tmp/.log`, whether GoodCloud remote management is on, and the firmware version: fixed in **4.9.1** (Brume 3, GL-MT5000) and **4.10.2** (Flint 3, GL-BE9300) per GL's release notes, which also list kernel patches for CVE-2026-98432 and CVE-2026-99288. Other models: version not confirmed yet (list version 2, 2026-11-22). |

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
  "fixes":  { "infected": { "type": "kill_remove", "process": "…", "path": "/tmp/…", "label": "…" },
              "exposed":  { "type": "uci_set", "key": "…", "value": "0", "restart": "service", "label": "…" } },
  "advice": { "infected": "…", "exposed": "…", "ok": "…" }
}
```
