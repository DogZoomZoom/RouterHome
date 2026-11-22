-- machome extras: Discord alerts, VPN reliability (7 d), device usage (24 h / 7 d),
-- nightly speed test, firmware watch + upgrade readiness / post-upgrade report.
-- Loaded by /usr/bin/machome-sampler; every entry point is called inside pcall.

local cjson = require "cjson"
local X = {}

local DIR, EDIR = "/tmp/machome", "/etc/machome"
local ALERTS = EDIR .. "/alerts.json"
local REL = EDIR .. "/reliability.json"
local STHIST = EDIR .. "/speedtest-history.json"
local USE_D = EDIR .. "/usage-daily.json"
local LASTVER = EDIR .. "/last_glversion"
local SCHED = EDIR .. "/sched_day"

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local t = p .. ".tmp"; local f = io.open(t, "w"); if not f then return end; f:write(s); f:close(); os.rename(t, p) end
local function trim(s) return s and (s:gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jread(p, def) local s = readf(p); if not s or s == "" then return def end; local ok, v = pcall(cjson.decode, s); if ok and type(v) == "table" then return v end; return def end
local function exists(p) local f = io.open(p, "r"); if f then f:close(); return true end; return false end
local function cf(c) return math.floor(c * 9 / 5 + 32 + 0.5) end
local function fmtdur(s) s = math.floor(s); if s < 90 then return s .. " s" elseif s < 5400 then return math.floor(s / 60 + 0.5) .. " min" else return string.format("%.1f h", s / 3600) end end
local function mbps(v) if not v or v == cjson.null then return "—" end; if v >= 1000 then return string.format("%.2f Gbps", v / 1000) end; return string.format("%.0f Mbps", v) end
-- VPN client tunnels: WireGuard (wgclientN) and OpenVPN (ovpnclientN). Since 2026-11-17 both get every check, alert,
-- failover and auto-heal. For OpenVPN, the sampler's "handshake" is the last time data came back from the server.
local function is_tun(n) return type(n) == "string" and (n:match("^wgclient%d+$") or n:match("^ovpnclient%d+$")) ~= nil end
local function hs_word(via) return tostring(via):match("^ovpn") and "data from the OpenVPN server" or "WireGuard handshake" end

-- local RPC through nginx (loopback + glinet header is allowed by oui-access)
local function lrpc(obj, method, params)
    local f = DIR .. "/lrpc.json"
    writef(f, cjson.encode({ jsonrpc = "2.0", id = 1, method = "call", params = { "", obj, method, params or {} } }))
    local out = sh("curl -s -m 25 -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @" .. f .. " http://127.0.0.1/rpc")
    local ok, v = pcall(cjson.decode, out)
    if ok and type(v) == "table" then return v.result end
end

-- ---------------------------------------------------------------- config
local DEF = { webhook = "", enabled = false, temp_f = 185, ping_ms = 75, speed_daily = true, speed_hour = 3,
    types = { vpn = true, dns = true, wan = true, newdev = true, security = true, temp = true, firmware = true, upgrade = true, speed = true,
              login = true, weekly = true, backup = true, health = true, config = true, isp = true, wifi = true, schedule = true, presence = true, data = true, upload = true, travel = true, devwatch = true, monthly = true, ping = true, adspike = true, rhupdate = true } }
local function load_cfg()
    local c = jread(ALERTS, {})
    local out = { webhook = c.webhook or "", enabled = c.enabled == true, temp_f = tonumber(c.temp_f) or DEF.temp_f, ping_ms = tonumber(c.ping_ms) or DEF.ping_ms,
        speed_daily = c.speed_daily ~= false, speed_hour = tonumber(c.speed_hour) or DEF.speed_hour, types = {},
        autoheal = c.autoheal ~= false, failover = c.failover ~= false, autoreboot = c.autoreboot ~= false, wifi_report = c.wifi_report ~= false,
        wan_heal = c.wan_heal ~= false, dns_heal = c.dns_heal ~= false, ts_heal = c.ts_heal ~= false, wifi_heal = c.wifi_heal ~= false, vpn_switch = c.vpn_switch == true, speed_retest = c.speed_retest ~= false, isp_slow_pct = tonumber(c.isp_slow_pct) or 70, weekly_day = tonumber(c.weekly_day) or 0, weekly_hour = tonumber(c.weekly_hour) or 9,
        plan_down = tonumber(c.plan_down) or 2000, plan_up = tonumber(c.plan_up) or 2000,
        -- auto-heal round 3 (2026-11-14): on by default ...
        nas_retry = c.nas_retry ~= false, nas_wake = c.nas_wake ~= false, leak_fix = c.leak_fix ~= false, ct_relief = c.ct_relief ~= false,
        storage_trim = c.storage_trim ~= false, ap_uplink = c.ap_uplink ~= false,
        -- ... and opt-in
        svc_autostop = c.svc_autostop == true, chan_auto = c.chan_auto == true, modem_restart = c.modem_restart == true,
        -- 2026-11-18: more repairs (netplus.lua), alert housekeeping, forgetting removed VPNs
        sqm_auto = c.sqm_auto == true, stuck_fix = c.stuck_fix ~= false, mem_fix = c.mem_fix ~= false,
        ev_keep_days = tonumber(c.ev_keep_days) or 14, digest_hour = tonumber(c.digest_hour) or 18, digest = {},
        mutes = type(c.mutes) == "table" and c.mutes or {}, vpn_keep_provider = c.vpn_keep_provider ~= false, vpn_autoforget = c.vpn_autoforget ~= false,
        adg_watch = c.adg_watch == true, vpn_return = c.vpn_return ~= false }
    for _, k in ipairs(type(c.digest_types) == "table" and c.digest_types or {}) do out.digest[tostring(k)] = true end
    for k, v in pairs(DEF.types) do out.types[k] = (type(c.types) == "table" and c.types[k] ~= nil) and (c.types[k] == true) or v end
    return out
end
X.cfg = load_cfg()

local HOST = trim(readf("/proc/sys/kernel/hostname") or "Router")

-- ---------------------------------------------------------------- discord
local queue, stats = {}, { sent = 0, failed = 0, last = nil, last_ok = nil }
local function post(embed)
    local c = X.cfg
    if not c.enabled or c.webhook == "" or not c.webhook:match("^https://[%w%.]*discord[%w]*%.com/api/webhooks/%d+/[%w_%-]+$") then return nil end
    writef(DIR .. "/wh.json", cjson.encode({ username = HOST .. " router", embeds = { embed } }))
    local code = trim(sh("curl -s -m 15 -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' --data-binary @" .. DIR .. "/wh.json '" .. c.webhook .. "'"))
    local ok = (code == "204" or code == "200")
    stats.last = os.time(); if ok then stats.sent = stats.sent + 1; stats.last_ok = os.time() else stats.failed = stats.failed + 1 end
    return ok
end
local COLORS = { red = 16726832, orange = 16752394, green = 3446617, blue = 689407, purple = 12540658, gray = 9342611 }
-- ---------------------------------------------------------------- event timeline ("Recent Events" card)
-- Every alert is recorded, even when Discord is off or that alert type is turned off. RAM file, saved to
-- /etc/machome/save every 6 h and at shutdown (init script). Last 300 events / 14 days.
local EVF, EVP = DIR .. "/events.json", EDIR .. "/save/events.json"
local events = jread(EVF, nil) or jread(EVP, {})
if type(events) ~= "table" or (next(events) and not events[1]) then events = {} end
local function ev_add(kind, title, desc, color)
    local now = os.time()
    local d = tostring(desc or ""):gsub("%*%*", ""):gsub("`", "")
    if #d > 400 then d = d:sub(1, 400) .. "…" end
    events[#events + 1] = { t = now, k = kind, ti = tostring(title or ""), d = d, c = color or "blue" }
    -- kept for ev_keep_days (owner's choice in Recent events, 2026-11-18; default 14 days), at most 300
    local keep_s = math.max(1, tonumber(X.cfg and X.cfg.ev_keep_days) or 14) * 86400
    while #events > 300 or (events[1] and now - events[1].t > keep_s) do table.remove(events, 1) end
    writef(EVF, cjson.encode(events))
end
-- daily digest (2026-11-18): alert types the owner picked arrive as ONE Discord message a day instead of right away
local DIGF = EDIR .. "/digest.json"
local function digest_add(kind, title, desc)
    local d = jread(DIGF, {}); d.items = type(d.items) == "table" and d.items or {}
    d.items[#d.items + 1] = { t = os.time(), k = kind, ti = tostring(title or ""), d = tostring(desc or ""):gsub("%*%*", ""):sub(1, 160) }
    while #d.items > 60 do table.remove(d.items, 1) end
    writef(DIGF, cjson.encode(d))
end
local function alert(kind, title, desc, color, fields)
    pcall(ev_add, kind, title, desc, color)
    if X.watch and X.watch.count then pcall(X.watch.count, kind, title) end   -- monthly summary counters
    if not X.cfg.types[kind] then return end
    -- muted for a while from the Home tab (2026-11-18): still recorded in Recent events, no Discord message
    local mu = tonumber(X.cfg.mutes and X.cfg.mutes[kind]); if mu and mu > os.time() then return end
    if X.cfg.digest and X.cfg.digest[kind] then pcall(digest_add, kind, title, desc); return end
    local e = { title = title, description = desc, color = COLORS[color] or COLORS.blue, fields = fields,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"), footer = { text = HOST .. " · Home tab" } }
    local r = post(e)
    if r == false then queue[#queue + 1] = e; while #queue > 20 do table.remove(queue, 1) end end
end
X.alert = alert
--- one Discord message the owner asked for from the Home tab (e.g. "Send to Discord" on the Outage & lag log):
--- no alert type, mute or digest applies; still listed in Recent events
function X.send(title, desc, color)
    pcall(ev_add, "isp", title, desc, color)
    return post({ title = title, description = desc, color = COLORS[color] or COLORS.blue, timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"), footer = { text = HOST .. " · Home tab" } })
end
-- the daily digest goes out once a day at digest_hour (default 6 PM); nothing is sent on a day without items
local function digest_tick(now)
    if tonumber(os.date("%H", now)) ~= (tonumber(X.cfg.digest_hour) or 18) then return end
    local d = jread(DIGF, {}); local today = os.date("%Y-%m-%d", now)
    if d.sent_day == today then return end
    local items = type(d.items) == "table" and d.items or {}
    if #items > 0 then
        local lines = {}
        for i, it in ipairs(items) do if i <= 40 then lines[#lines + 1] = "• " .. os.date("%a %I:%M %p", it.t) .. " · " .. tostring(it.ti) end end
        if #items > 40 then lines[#lines + 1] = "… and " .. (#items - 40) .. " more (Recent events on the Home tab)" end
        local r = post({ title = "📰 Daily digest: " .. #items .. " alert" .. (#items == 1 and "" or "s"), description = table.concat(lines, "\n"):sub(1, 3900),
            color = COLORS.blue, timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"), footer = { text = HOST .. " · Home tab · daily digest" } })
        if r == false then return end      -- Discord unreachable: try again next minute (still inside the hour)
    end
    d.items = {}; d.sent_day = today; writef(DIGF, cjson.encode(d))
end
-- router self-care + extra alerts (shared module; a failure here never stops the rest)
local okH, HEALTH = pcall(dofile, "/usr/lib/machome/health.lua")
if not okH or type(HEALTH) ~= "table" then HEALTH = nil; os.execute("logger -t machome 'health module not loaded'") end
-- schedules, who's home, data usage, AdGuard per device (shared module)
local okL, LIFE = pcall(dofile, "/usr/lib/machome/life.lua")
if not okL or type(LIFE) ~= "table" then LIFE = nil; os.execute("logger -t machome 'life module not loaded'") end
-- trackers + repairs added 2026-11-14 (Tailscale key expiry, watched devices, cable modem, Wi-Fi week stats + band
-- self-heal, bad-VPN-server suggestion / opt-in switch, monthly summary): shared module
local okW, WATCH = pcall(dofile, "/usr/lib/machome/watch.lua")
if not okW or type(WATCH) ~= "table" then WATCH = nil; os.execute("logger -t machome 'watch module not loaded'") end
X.watch = WATCH
-- travel routers: hotel sign-in page, network safety check, report cards, home check, data per network (shared module;
-- does nothing on routers that get internet over a cable and aren't a travel model)
local okT, TRAVEL = pcall(dofile, "/usr/lib/machome/travel.lua")
if not okT or type(TRAVEL) ~= "table" then TRAVEL = nil; os.execute("logger -t machome 'travel module not loaded'") end
-- 2026-11-18: more Network Health data, more repairs, forgetting removed VPNs (shared module)
local okN, NP = pcall(dofile, "/usr/lib/machome/netplus.lua")
if not okN or type(NP) ~= "table" then os.execute("logger -t machome 'netplus module not loaded: " .. tostring(NP):gsub("'", ""):sub(1, 120) .. "'"); NP = nil end
X.np = NP

-- ---------------------------------------------------------------- labels (tunnel -> name/provider/peer)
local labels, labels_t = {}, 0
local function refresh_labels(now)
    if now - labels_t < 60 and next(labels) then return end
    labels_t = now
    local st = lrpc("vpn-client", "get_status", {})
    local pv = lrpc("machome", "get_vpn_providers", {})
    local groups = (type(pv) == "table" and type(pv.groups) == "table") and pv.groups or {}
    if type(st) == "table" and type(st.status_list) == "table" then
        local nl = {}
        for _, v in ipairs(st.status_list) do
            if v.via then
                local prov = groups[tostring(v.group_id)]
                nl[v.via] = { name = v.name or v.via, provider = prov, peer = v.peer_name, enabled = v.enabled == true,
                    label = (v.name or v.via) .. (prov and (" (" .. prov .. ")") or "") }
            end
        end
        labels = nl
    end
end
local function L(via) return labels[via] or { name = via, label = via, enabled = true } end

-- ---------------------------------------------------------------- readiness / integrity
local KEEP = {
    { "/usr/lib/oui-httpd/rpc/machome", "Home tab backend" }, { "/www/views/gl-sdk4-ui-machome.common.js.gz", "Home tab page" },
    { "/usr/share/oui/menu.d/machome.json", "Home tab menu entry" }, { "/usr/bin/machome-sampler", "Monitoring sampler" },
    { "/usr/lib/machome/extras.lua", "Alerts & extras module" }, { "/etc/init.d/machome", "Sampler service" },
    { "/etc/rc.d/S99machome", "Sampler auto-start link" }, { "/usr/share/machome/speedtest", "Ookla Speedtest CLI" },
    { "/usr/bin/machome-speedtest", "Speed test runner" }, { "/etc/init.d/machome-st", "Speed test service" },
    { "/root/.config/ookla/speedtest-cli.json", "Ookla license acceptance" }, { "/usr/share/gl-download.d/machome", "Backup download permission" },
    { "/etc/sysctl.d/99-vpn-tune.conf", "VPN queue tuning" }, { "/etc/hotplug.d/net/99-vpn-rps", "VPN core spreading" },
    { "/etc/machome/alerts.json", "Alert settings" }, { "/etc/machome/seen", "Known-devices list" },
    { "/etc/dropbear/authorized_keys", "Your SSH key" }, { "/etc/config/dropbear", "SSH key-only setting" },
    { "/usr/lib/machome/more.lua", "NAS backup / AdGuard / ISP report module" }, { "/usr/lib/machome/weather.lua", "Weather module" },
    { "/etc/config/firewall", "Firewall hardening" }, { "/etc/config/oui-httpd", "HTTPS-only setting" }, { "/etc/config/wireguard", "VPN configs" }
}
-- netifyd is excluded: its uci "enabled=0" survives upgrades, so it stays off even if its boot link returns
local DISABLED = { "gl_dpi", "gl_cellular_manager", "sms_manager", "smstools3", "modem_signal", "avahi-daemon" }
local ready, ready_t = nil, 0
local function readiness(now, force)
    if not force and ready and now - ready_t < 3600 then return ready end
    ready_t = now
    local kept = {}
    for line in sh("sysupgrade -l"):gmatch("[^\n]+") do kept[line] = true end
    local lost, okc = {}, 0
    for _, k in ipairs(KEEP) do
        if exists(k[1]) or sh("ls -d " .. k[1]):match("%S") then
            if kept[k[1]] then okc = okc + 1 else lost[#lost + 1] = k[2] end
        end
    end
    local revert = {}
    local opt = {}
    for s in (readf(EDIR .. "/optimized") or ""):gmatch("[%w_%-]+") do if s ~= "netifyd" then opt[#opt + 1] = s end end
    for _, s in ipairs(opt) do
        if exists("/etc/init.d/" .. s) and os.execute("/etc/init.d/" .. s .. " enabled 2>/dev/null") ~= 0 then revert[#revert + 1] = s end
    end
    local notes = { "VPN key file permissions may loosen; the Security card will flag it" }
    if exists("/etc/init.d/zram") then notes[#notes + 1] = "Zram (GL's zram-swap package) is removed by the upgrade; Router Home reinstalls it by itself once the internet is back" end
    ready = { time = now, kept = okc, lost = lost, revert = revert, notes = notes }
    writef(DIR .. "/ready.json", cjson.encode(ready))
    return ready
end
X.readiness = readiness

local function integrity(sec)
    local broken, fine = {}, 0
    for _, k in ipairs(KEEP) do if exists(k[1]) then fine = fine + 1 else broken[#broken + 1] = k[2] .. " missing" end end
    for _, c in ipairs(sec or {}) do if not c.ok then broken[#broken + 1] = c.label .. ": " .. tostring(c.detail) end end
    return fine, broken
end

-- ---------------------------------------------------------------- reliability (hourly buckets, 7 days, keyed by provider/peer)
local rel = jread(REL, { buckets = {} })
rel.buckets = rel.buckets or {}
local cur = {}       -- key -> current-hour bucket
local cur_hour = nil
local function rel_key(via) local l = L(via); return (l.provider or l.name) .. "|" .. (l.peer or via) end
-- ping-only blip (2026-11-20, owner-approved): pings got no answer but the web check through the tunnel (quick_web,
-- below, same file) loaded a page in the last 25 s. Proven side by side: the owner's PC lost 0% through Nord while
-- the router's pings "stalled". Such a check is not downtime and not packet loss in the 7-day numbers.
local function web_ok_recent(via, now)
    local code, ts = (readf(DIR .. "/qprobe_" .. via) or ""):match("^(%d+)%s+(%d+)")
    ts = tonumber(ts)
    return ts ~= nil and now - ts <= 25 and (code or ""):match("^[23]%d%d$") ~= nil
end
local function rel_tick(now, p, wg)
    local hour = now - now % 3600
    if cur_hour and hour ~= cur_hour then
        for k, b in pairs(cur) do rel.buckets[k] = rel.buckets[k] or {}; table.insert(rel.buckets[k], b) end
        local cutoff = now - 7 * 86400
        for k, list in pairs(rel.buckets) do
            local keep = {}
            for _, b in ipairs(list) do if b.h >= cutoff then keep[#keep + 1] = b end end
            rel.buckets[k] = (#keep > 0) and keep or nil
        end
        writef(REL, cjson.encode(rel))
        cur = {}
    end
    cur_hour = hour
    for via, r in pairs(p) do
        if via ~= "wan" then
            local l = L(via)
            if l.enabled ~= false then
                local k = rel_key(via)
                local b = cur[k] or { h = hour, n = 0, loss = 0, lat = 0, latn = 0, down = 0, stale = 0, via = via, label = l.label, provider = l.provider, peer = l.peer }
                local loss = r.loss or 100
                if loss >= 100 and web_ok_recent(via, now) then loss = 0; b.po = (b.po or 0) + 1 end   -- blip
                b.n = b.n + 1; b.loss = b.loss + loss
                if r.ms and r.ms ~= cjson.null then b.lat = b.lat + r.ms; b.latn = b.latn + 1 end
                if loss >= 100 then b.down = b.down + 1 end
                local hs = wg[via]; if hs and now - hs > 180 then b.stale = b.stale + 1 end
                b.via = via; b.label = l.label
                cur[k] = b
            end
        end
    end
    writef(DIR .. "/rel_cur.json", cjson.encode(cur))
end
--- forget 7-day reliability entries (removed VPNs, 2026-11-18): keys like "Provider|server", from memory and the file
function X.rel_forget(keys)
    local n = 0
    for _, k in ipairs(keys or {}) do
        if rel.buckets[k] then rel.buckets[k] = nil; n = n + 1 end
        if cur[k] then cur[k] = nil; n = n + 1 end
    end
    if n > 0 then writef(REL, cjson.encode(rel)); writef(DIR .. "/rel_cur.json", cjson.encode(cur)) end
    return n
end

-- ---------------------------------------------------------------- device usage (24 h / 7 d)
local hourly = jread(DIR .. "/usage-hourly.json", {})   -- list of {t, d={mac={rx,tx}}}
local daily = jread(USE_D, {})
local names = {}
local usage_t = 0
local function snapshot()
    local r = lrpc("clients", "get_list", {})
    local list = type(r) == "table" and (r.clients or r.list) or nil
    if type(list) ~= "table" then return nil end
    local d = {}
    for _, c in ipairs(list) do
        if c.mac then
            local m = tostring(c.mac):upper()
            d[m] = { tonumber(c.total_rx) or 0, tonumber(c.total_tx) or 0 }
            names[m] = { name = (c.alias and c.alias ~= "") and c.alias or c.name, ip = c.ip, online = c.online }
        end
    end
    return d
end
local function delta(now_d, old)
    local out = {}
    if not old then return out end
    for m, v in pairs(now_d) do
        local o = old.d[m]
        local drx = o and (v[1] >= o[1] and v[1] - o[1] or v[1]) or 0
        local dtx = o and (v[2] >= o[2] and v[2] - o[2] or v[2]) or 0
        if drx + dtx > 0 then out[#out + 1] = { mac = m, name = names[m] and names[m].name or cjson.null, ip = names[m] and names[m].ip or cjson.null, rx = drx, tx = dtx } end
    end
    table.sort(out, function(a, b) return a.rx + a.tx > b.rx + b.tx end)
    while #out > 10 do table.remove(out) end
    return out
end
-- Unusual upload (Firewalla-style "abnormal upload"): a device that sent 1 GB+ in about the last hour AND 10x its
-- normal hourly upload (7-day average, at least 50 MB/h counted), or 3 GB+ when there's no history yet.
-- Catches a hacked camera / malware sending data out or a runaway backup. Once per device per 24 h.
local up_alerted = {}
-- Our own GL.iNet routers (an access point / repeater behind this one) are clients here too. Their speed test sends
-- ~1 GB in ONE short burst, which used to look like an unusual upload. For them, the biggest single 10-minute burst
-- in the window is left out; steady uploading over the hour still alerts. ticks = the last ~2 h of 10-min snapshots.
local ticks = {}
local function is_router(m)
    local n = names[m] or {}
    local s = tostring(n.name or ""):upper()
    return s:match("^GL%-") ~= nil or s:match("FLINT") ~= nil or s:match("SLATE") ~= nil or s:match("BRUME") ~= nil
end
local function burst(m, since)
    local big, prev = 0, nil
    for _, s in ipairs(ticks) do
        local v = s.d[m]
        if v and s.t >= since then
            if prev and v[2] >= prev then big = math.max(big, v[2] - prev) end
            prev = v[2]
        elseif v then prev = v[2] end
    end
    return big
end
local function gbmb(x) if x >= 1e9 then return string.format("%.1f GB", x / 1e9) end; return string.format("%.0f MB", x / 1e6) end
local function upload_check(now, d)
    -- snapshots are hourly, so the newest one at least 45 min old is 45-130 min old; rates are per hour
    local ref; for i = #hourly, 1, -1 do local a = now - hourly[i].t; if a >= 2700 and a <= 7800 then ref = hourly[i]; break end end
    if not ref then return end
    local mins = (now - ref.t) / 60
    local base = daily[1]
    for m, v in pairs(d) do
        local o = ref.d[m]
        if o and v[2] >= o[2] then
            local sent = v[2] - o[2]
            if is_router(m) then local b = burst(m, ref.t); if b >= 300e6 then sent = math.max(0, sent - b) end end
            local perh = sent / (mins / 60)
            if perh >= 1e9 and (not up_alerted[m] or now - up_alerted[m] >= 86400) then
                local b = nil
                if base and base.d[m] and now - base.t >= 86400 and v[2] >= base.d[m][2] then b = (v[2] - base.d[m][2]) / ((now - base.t) / 3600) end
                if (b and perh >= 10 * math.max(b, 50e6)) or (not b and perh >= 3e9) then
                    up_alerted[m] = now
                    local n = names[m] or {}; local who = tostring(n.name or n.ip or "A device")
                    alert("upload", "📤 Unusual upload from " .. who,
                        string.format("%s (%s) uploaded **%s** in the last %d minutes%s. That's far more than usual for it. It may be a cloud backup or a big upload, but it can also be a hacked device or malware sending data out. Check what it's doing, or pause it from the Clients card.",
                            who, tostring(n.ip or "?"), gbmb(sent), math.floor(mins + 0.5), b and (" (it normally sends about " .. gbmb(b) .. " an hour)") or ""), "orange")
                end
            end
        end
    end
end
local function usage_tick(now)
    if now - usage_t < 600 then return end
    usage_t = now
    local d = snapshot(); if not d then return end
    ticks[#ticks + 1] = { t = now, d = d }; while #ticks > 14 do table.remove(ticks, 1) end
    pcall(upload_check, now, d)
    local snap = { t = now, d = d }
    if #hourly == 0 or now - hourly[#hourly].t >= 3600 then hourly[#hourly + 1] = snap end
    while #hourly > 26 do table.remove(hourly, 1) end
    writef(DIR .. "/usage-hourly.json", cjson.encode(hourly))
    if #daily == 0 or now - daily[#daily].t >= 86400 then
        daily[#daily + 1] = snap; while #daily > 8 do table.remove(daily, 1) end
        writef(USE_D, cjson.encode(daily))
    end
    local function pick(list, age) local best = nil; for _, s in ipairs(list) do if now - s.t <= age + 1800 then if not best or s.t < best.t then best = s end end end; return best end
    local h24 = pick(hourly, 86400) or hourly[1]
    local d7 = pick(daily, 7 * 86400) or daily[1]
    if d7 and h24 and h24.t < d7.t then d7 = h24 end
    writef(DIR .. "/usage.json", cjson.encode({ time = now, since24 = h24 and h24.t or now, since7 = d7 and d7.t or now,
        d24 = delta(d, h24), d7 = delta(d, d7) }))
end

-- ---------------------------------------------------------------- alert state machines
local vstate, wanbad, wansince, dnsbad, dnsdown, tempcnt, tempfired = {}, 0, nil, 0, false, 0, false
--- tunnels that are down right now, for netplus "reconnect when the VPN server is back" (2026-11-18)
function X.vpn_state()
    local o = {}
    for via, s in pairs(vstate) do if s.down then o[via] = { since = s.since, heals = s.heals or 0, gaveup = s.gaveup or false, label = L(via).label } end end
    return o
end

-- "AdGuard (NAS)" when the DNS server is the AdGuard set up on the NAS card, otherwise "DNS server"
local function dns_name(server)
    local c = jread(EDIR .. "/nas-adguard.json", {})
    local h = tostring(c.url or c.host or ""):gsub("^%a+://", ""):match("^[^:/]+") or ""
    if h ~= "" and h == tostring(server) then return "AdGuard (NAS)" end
    return "DNS server"
end
local prev_sec = nil
local fw, fw_t = jread(DIR .. "/fw.json", {}), 0
local st_seen = (jread(DIR .. "/speedtest.json", {}) or {}).finished
local sched_pending = false
local retest_due, retest_run = nil, false        -- slow nightly result: one Internet re-test 10 min later (owner, 2026-11-14)
local booted = false

-- HTTPS probe through each WireGuard tunnel, once a minute, in the BACKGROUND (never blocks the sampler).
-- Catches tunnels that answer pings but can't carry real traffic (e.g. an MTU the VPN server doesn't support).
-- 2 failed probes in a row (~2 min) = the tunnel counts as down. Ignored while a speed test saturates the tunnels.
local probe_t, probe_fail = 0, {}
-- VPN Health card (2026-11-15): last web + domain-lookup result per tunnel, and drops in the last 24 h.
-- Display only: the DNS lookup does NOT feed alerts or failover.
local vh = { web = {}, dns = {} }
local VH_DROPS = DIR .. "/vh_drops.json"
local drops = jread(VH_DROPS, {})   -- via -> { {t=start, d=seconds or nil while down}, ... } (kept in /tmp: survives a service restart)
local function drops_save(now)
    for via, list in pairs(drops) do
        local keep = {}; for _, e in ipairs(list) do if now - e.t < 86400 then keep[#keep + 1] = e end end
        drops[via] = (#keep > 0) and keep or nil
    end
    writef(VH_DROPS, cjson.encode(drops))
end
-- VPN outage log (owner, 2026-11-20): every REAL outage (pings AND web failed, or no handshake/tunnel), 60 days,
-- for VPN provider support tickets (rpc vpn_log; VPN Health "Outage log"). One flash write per start/end only.
-- Entry: { t, ["end"], d, via, label, provider, peer, why, moved = label devices went to, heals, gaveup, src }
local VOUT = EDIR .. "/vpn_outages.json"
local vout = jread(VOUT, {}); if type(vout) ~= "table" then vout = {} end
-- an outage still open when the service (re)started or the VPN checks were reset: its end wasn't seen
local function vout_cut() for _, e in ipairs(vout) do if type(e) == "table" and not e["end"] and not e.cut then e.cut = true end end end
vout_cut()
local function vout_save(now)
    local keep, cut = {}, now - 60 * 86400
    for _, e in ipairs(vout) do if type(e) == "table" and (tonumber(e.t) or 0) >= cut then keep[#keep + 1] = e end end
    while #keep > 300 do table.remove(keep, 1) end
    vout = keep
    writef(VOUT, #vout > 0 and cjson.encode(vout) or "[]")
end
local function vout_last(via) for i = #vout, 1, -1 do if vout[i].via == via then return vout[i] end end end
local function vout_open(via, now, l, why)
    vout[#vout + 1] = { t = now - 20, via = via, label = l.label, provider = l.provider, peer = l.peer, why = why }
    pcall(vout_save, now)
end
local function vout_close(via, now, s, moved_to)
    local e = vout_last(via)
    if e and not e["end"] and not e.cut then
        e["end"] = now - 20; e.d = math.max(10, e["end"] - e.t); e.heals = s.heals or 0
        e.moved = moved_to and L(moved_to).label or nil; e.gaveup = s.gaveup or nil
        pcall(vout_save, now)
    end
end
local function vout_reopen(via, now)   -- down again before its devices moved back: same outage
    local e = vout_last(via); if e and e["end"] and not e.src then e["end"] = nil; e.d = nil; pcall(vout_save, now) end
end
local function web_probe(now)
    if now - probe_t < 60 then return end
    local last_t = probe_t
    probe_t = now
    local testing = (jread(DIR .. "/speedtest.json", {}) or {}).running
    for via, l in pairs(labels) do
        if l.enabled and is_tun(via) then
            local f = DIR .. "/probe_" .. via
            local r = readf(f)
            if r then
                if r:match("^[23]%d%d") then probe_fail[via] = 0
                elseif not testing then probe_fail[via] = (probe_fail[via] or 0) + 1 end
                vh.web[via] = { code = trim(r), t = last_t }
            end
            -- domain lookup THROUGH the tunnel: example.com asked from the tunnel's own address (Quad9, then Cloudflare)
            local fd = DIR .. "/probe_dns_" .. via
            local d = readf(fd)
            if d then
                local st, ms = d:match("^(%u+)%s*(%d*)")
                vh.dns[via] = { ok = st == "NOERROR", status = st or "TIMEOUT", ms = tonumber(ms), t = last_t }
            end
            os.execute("(s=$(ip -4 -o addr show dev " .. via .. " 2>/dev/null | awk '{print $4}' | cut -d/ -f1); r=TIMEOUT; " ..
                "if [ -n \"$s\" ]; then for d in 9.9.9.9 1.1.1.1; do o=$(dig -b \"$s\" @$d +time=3 +tries=1 example.com A 2>/dev/null); " ..
                "st=$(echo \"$o\" | sed -n 's/.*status: \\([A-Z]*\\).*/\\1/p'); q=$(echo \"$o\" | sed -n 's/.*Query time: \\([0-9]*\\) msec.*/\\1/p'); " ..
                "[ -n \"$st\" ] && r=\"$st $q\"; [ \"$st\" = NOERROR ] && break; done; else r=NOADDR; fi; echo \"$r\" > " .. fd .. ") >/dev/null 2>&1 &")
            -- two independent HTTPS targets: either one answering counts as OK
            os.execute("(c=$(curl --interface " .. via .. " -s -o /dev/null -m 10 -w '%{http_code}' https://1.1.1.1/cdn-cgi/trace); " ..
                "[ \"${c#[23]}\" != \"$c\" ] || c=$(curl --interface " .. via .. " -s -o /dev/null -m 10 -w '%{http_code}' https://www.google.com/generate_204); " ..
                "echo \"$c\" > " .. f .. ") >/dev/null 2>&1 &")
        end
    end
end

local fo = { map = nil, t = 0, moved = {} }   -- failover state (defined here: vpn_alerts reads it for the "gave up" message)
-- Ping failures are confirmed with a web page through the tunnel (owner, 2026-11-15). VPN servers sometimes drop
-- pings for ~30 s while traffic keeps flowing (Nord: DNS and HTTPS fine during the stall). When pings fail, a
-- background HTTPS check through the tunnel starts; its result is read on the next 10-second check.
-- Web OK = a ping-only blip: not counted as down (no alert, no failover), logged once, shown on VPN Health.
-- Web failing or no answer yet = a failed check as before, so real outages still fail over in ~30 s.
local qp_t = {}
local function quick_web(via, now)
    local f = DIR .. "/qprobe_" .. via
    local res = nil
    local d = readf(f)
    if d then
        local code, ts = d:match("^(%d+)%s+(%d+)")
        ts = tonumber(ts)
        if ts and now - ts <= 25 then res = (code or ""):match("^[23]%d%d$") ~= nil end
    end
    if not qp_t[via] or now - qp_t[via] >= 9 then
        qp_t[via] = now
        os.execute("(c=$(curl --interface " .. via .. " -s -o /dev/null -m 4 -w '%{http_code}' https://www.google.com/generate_204); " ..
            "[ \"${c#[23]}\" != \"$c\" ] || c=$(curl --interface " .. via .. " -s -o /dev/null -m 4 -w '%{http_code}' https://1.1.1.1/cdn-cgi/trace); " ..
            "echo \"${c:-000} " .. now .. "\" > " .. f .. ") >/dev/null 2>&1 &")
    end
    return res
end

local function vpn_alerts(now, p, wg)
    for via, l in pairs(labels) do
        if l.enabled then
            local r = p[via]; local hs = wg[via]
            local s = vstate[via] or { bad = 0, good = 0, down = false }
            -- no interface = GL is (re)connecting it (server change, just turned on). Give it 2 minutes before it
            -- counts as a failed check (owner, 2026-11-16: manual changes must not send alerts).
            if r then s.gone = nil else s.gone = s.gone or now end
            local connecting = (not r) and now - s.gone < 120
            local webbad = (probe_fail[via] or 0) >= 2
            local pingbad = (not r) or (r.loss or 100) >= 100
            if pingbad and r and is_tun(via) and not (hs and now - hs > 180) then
                if quick_web(via, now) == true then   -- pings fail but a web page loads: ping-only blip
                    pingbad = false
                    if not s.po then
                        s.po = true
                        os.execute("logger -t machome 'vpn check: " .. via .. " pings failing but web pages load through it (ping-only blip, not counted as down)'")
                        drops[via] = drops[via] or {}; table.insert(drops[via], { t = now - 10, po = true }); pcall(drops_save, now)
                    end
                end
            elseif not pingbad then s.po = nil end
            local bad = pingbad or (hs and now - hs > 180) or webbad
            if connecting then -- neither good nor bad while it reconnects
            elseif bad then s.bad = s.bad + 1; s.good = 0 else s.good = s.good + 1; s.bad = 0 end
            if not s.down and s.bad >= 3 then
                s.down = true
                drops[via] = drops[via] or {}; table.insert(drops[via], { t = now - 20 }); pcall(drops_save, now)   -- VPN Health card
                local why = (not r) and "not connecting (its tunnel didn't come up for 2 minutes)"
                    or ((r.loss or 100) >= 100) and "not replying to pings, and web pages don't load through it"
                    or (hs and now - hs > 180) and ("no " .. hs_word(via) .. " for " .. fmtdur(now - hs))
                    or "answering pings, but web pages don't load through it (HTTPS test failed twice)"
                if s.pend_up then
                    -- down again before its devices were moved back: same outage, no new message
                    s.since = s.pend_up.since; s.heals = s.pend_up.heals or 0; s.pend_up = nil
                    pcall(vout_reopen, via, now)
                else
                    pcall(vout_open, via, now, l, why)
                    -- one message per outage start (owner, 2026-11-13): sent by fo_tick together with where the devices
                    -- went, or by vpn_flush right after it when they weren't moved
                    s.since = now; s.heals = 0; s.heal_t = nil
                    s.pend_down = { why = why, label = l.label, peer = l.peer }
                    if X.watch and X.watch.vpn_down then pcall(X.watch.vpn_down, via, l.label, l.peer) end   -- bad-server check
                end
            elseif s.down and s.good >= 3 then
                s.down = false
                local dl = drops[via]; local e = nil
                if dl then for i = #dl, 1, -1 do if not dl[i].po then e = dl[i]; break end end end
                if e and not e.d then e.d = math.max(10, now - 20 - e.t); pcall(drops_save, now) end
                pcall(vout_close, via, now, s, fo.moved[via])
                local msg = "Back up after " .. fmtdur(now - (s.since or now)) .. ((s.heals or 0) > 0 and (" (auto-heal restarted it " .. s.heals .. "×).") or ".")
                if X.cfg.failover and fo.moved[via] then
                    s.pend_up = { since = s.since, heals = s.heals, msg = msg }   -- one message when its devices move back
                else
                    alert("vpn", "🟢 " .. l.label .. " recovered", msg, "green")
                end
            elseif s.down and X.cfg.autoheal and wanbad == 0 and is_tun(via) then
                -- auto-heal: disconnect + reconnect the tunnel after 2 min down (failover already moved its devices),
                -- then every 10 min, at most 3 times per outage; then one "gave up" message saying where traffic is
                local due = (s.heals or 0) == 0 and (now - s.since >= 120) or (s.heal_t and now - s.heal_t >= 600)
                if due and (s.heals or 0) < 3 then
                    s.heals = (s.heals or 0) + 1; s.heal_t = now
                    os.execute("logger -t machome 'auto-heal: restarting " .. via .. " (attempt " .. s.heals .. ")'; (ifdown " .. via .. "; sleep 2; ifup " .. via .. ") >/dev/null 2>&1 &")
                    alert("vpn", "🔧 Auto-heal: restarting " .. l.label, "Down for " .. fmtdur(now - s.since) .. ". Disconnecting and reconnecting it (attempt " .. s.heals .. " of 3).", "orange")
                elseif due and (s.heals or 0) >= 3 and not s.gaveup then
                    s.gaveup = true
                    local tgt = fo.moved[via]
                    alert("vpn", "⛔ Auto-heal couldn't fix " .. l.label,
                        "Still down after 3 restarts (" .. fmtdur(now - s.since) .. "). " ..
                        (tgt and ("Its devices stay on " .. L(tgt).label .. " (still on the VPN) until it recovers by itself.")
                             or "No other healthy tunnel is available, so its devices are blocked by the kill switch until it recovers.") ..
                        " Check the VPN provider or try another server for this tunnel.", "red")
                end
            end
            vstate[via] = s
        end
    end
end

-- ---------------------------------------------------------------- VPN failover between tunnels
-- GL routes each device by a firewall mark (Tunnel 1 = 0x1000 -> table 1001, ...). When a tunnel is down
-- (vpn_alerts: 3 failed checks, ~30 s), one extra ip rule sends that tunnel's mark to a HEALTHY tunnel's table.
-- Traffic never leaves the VPN: if no tunnel is healthy the rule is removed and GL's kill switch blocks as before.
-- Moves back once the tunnel has passed 6 checks in a row (~1 min). GL's own config is never edited.
local FO_PREF = 5990          -- before GL's mark rules (6000)
for p = FO_PREF, FO_PREF + 9 do os.execute("ip rule del pref " .. p .. " >/dev/null 2>&1") end   -- clean slate after a restart
local function fo_map(now)
    if fo.map and now - fo.t < 60 then return fo.map end
    local rules, tbl = {}, {}
    for idx, k, v in sh("uci -q show route_policy"):gmatch("route_policy%.@rule%[(%d+)%]%.(%w+)='([^']*)'") do
        local i = tonumber(idx) + 1; rules[i] = rules[i] or {}; rules[i][k] = v
    end
    for ifc, t in sh("uci -q show network"):gmatch("network%.([%w_]+)%.ip4table='(%d+)'") do if is_tun(ifc) then tbl[ifc] = t end end
    local m = {}
    for i = 1, #rules do
        local r = rules[i]
        if r and r.enabled ~= "0" and r.via and is_tun(r.via) and (r.mark or ""):match("^0x%x+$") and tbl[r.via] then
            m[#m + 1] = { via = r.via, mark = r.mark, tbl = tbl[r.via], pref = FO_PREF + #m }
        end
    end
    fo.map, fo.t = m, now
    return m
end
local function fo_healthy(via) local s = vstate[via]; return s ~= nil and not s.down and (s.good or 0) >= 1 end
local function fo_tick(now)
    local m = fo_map(now); if #m < 2 then return end
    local rules = nil
    for _, t in ipairs(m) do
        local s, cur, lab = vstate[t.via] or {}, fo.moved[t.via], L(t.via).label
        if cur and (not X.cfg.failover or (not s.down and (s.good or 0) >= 6)) then
            os.execute("ip rule del pref " .. t.pref .. " >/dev/null 2>&1; logger -t machome 'failover: " .. t.via .. " back on its own tunnel'")
            fo.moved[t.via] = nil
            -- one "back" message: recovered + devices moved back
            local pu = s.pend_up; s.pend_up = nil
            if pu then alert("vpn", "🟢 " .. lab .. " is back", pu.msg .. " Its devices are back on it.", "green")
            elseif X.cfg.failover then alert("vpn", "🔀 " .. lab .. " is healthy again", "Devices that use " .. lab .. " are back on it.", "green") end
        elseif X.cfg.failover and s.down and (not cur or not fo_healthy(cur)) then
            local tgt = nil
            for _, o in ipairs(m) do if o.via ~= t.via and fo_healthy(o.via) and not fo.moved[o.via] then tgt = o; break end end
            if tgt then
                os.execute(string.format("ip rule del pref %d >/dev/null 2>&1; ip rule add pref %d fwmark %s/0xf000 lookup %s; logger -t machome 'failover: %s -> %s'",
                    t.pref, t.pref, t.mark, tgt.tbl, t.via, tgt.via))
                fo.moved[t.via] = tgt.via
                -- one "down" message: why it's down + where its devices went
                local pd = s.pend_down; s.pend_down = nil
                alert("vpn", "🔴 " .. lab .. " is down: devices moved to " .. L(tgt.via).label,
                    (pd and (lab .. " is " .. pd.why .. ". ") or "") .. "Its devices now go through " .. L(tgt.via).label .. " (still on the VPN); open connections reconnect once. They move back automatically when " .. lab .. " has been healthy for a minute." ..
                    (pd and X.cfg.autoheal and " Auto-heal will restart it if it's still down in 2 minutes." or ""), pd and "red" or "orange",
                    pd and { { name = "Server", value = tostring(pd.peer or "?"), inline = true } } or nil)
            elseif cur then
                os.execute("ip rule del pref " .. t.pref .. " >/dev/null 2>&1; logger -t machome 'failover: no healthy tunnel for " .. t.via .. "'")
                fo.moved[t.via] = nil
                alert("vpn", "⛔ No healthy VPN tunnel for " .. lab, "Every other tunnel is down too, so its devices are blocked by the kill switch until a tunnel recovers.", "red")
            end
        elseif cur then
            -- keep our rule in place (GL rebuilds its rules when VPN settings change)
            rules = rules or ("\n" .. sh("ip rule show"))
            if not rules:find("\n" .. t.pref .. ":", 1, true) then
                local tgt; for _, o in ipairs(m) do if o.via == cur then tgt = o end end
                if tgt then os.execute(string.format("ip rule add pref %d fwmark %s/0xf000 lookup %s", t.pref, t.mark, tgt.tbl)) end
            end
        end
    end
end

-- ---------------------------------------------------------------- tunnel changes + "Clear all VPN alerts" (owner, 2026-11-16)
-- Tunnels turned off or removed in GL are forgotten silently (no alert, no banner); a tunnel switched to another
-- server/provider, or a new one, starts fresh. A change in which tunnels are up triggers an immediate re-read of
-- GL's tunnel list (instead of waiting up to 60 s), and failover rules are rebuilt for the new layout.
local function fo_reset(why)
    for p = FO_PREF, FO_PREF + 9 do os.execute("ip rule del pref " .. p .. " >/dev/null 2>&1") end
    fo.moved = {}; fo.map = nil
    os.execute("logger -t machome 'failover: reset (" .. why .. ")'")
end
local function pl_reset(key)   -- the sampler starts this tunnel's packet-loss history fresh on its next check
    local f = io.open(DIR .. "/pl_reset", "a"); if f then f:write(key, "\n"); f:close() end
end
local function forget(via)
    vstate[via] = nil; probe_fail[via] = nil; pl_reset(via)
    if X.watch and X.watch.vpn_forget then pcall(X.watch.vpn_forget, via) end
end
local known, vsig = {}, nil
local function vpn_topology(now, p)
    local up = {}; for k in pairs(p) do if is_tun(k) then up[#up + 1] = k end end
    table.sort(up); up = table.concat(up, ",")
    if vsig ~= nil and up ~= vsig then labels_t = 0 end   -- a tunnel went up/down: re-read GL's list now
    vsig = up
    refresh_labels(now)
    local changed = false
    -- "Clear all VPN alerts" from the VPN Health card (rpc vpn_clear)
    if exists(DIR .. "/vpn_reset") then
        os.remove(DIR .. "/vpn_reset")
        for via in pairs(vstate) do forget(via) end
        vstate = {}; drops = {}; pcall(drops_save, now); pl_reset("vpn"); vout_cut(); pcall(vout_save, now)
        fo_reset("Clear all VPN alerts")
        os.execute("logger -t machome 'vpn check: all VPN alerts cleared from the Home tab; tunnels are re-checked from scratch'")
        return
    end
    -- turned off or removed: forget silently
    for via, s in pairs(vstate) do
        local l = labels[via]
        if not l or not l.enabled then
            os.execute("logger -t machome 'vpn check: " .. via .. (l and " was turned off" or " was removed") .. "; its checks stopped (no alert)'")
            if fo.moved[via] or s.down then changed = true end
            forget(via)
        end
    end
    -- switched to another server/provider, or a new tunnel: start fresh
    for via, l in pairs(labels) do
        local id = tostring(l.provider or "") .. "|" .. tostring(l.peer or "")
        if known[via] and known[via] ~= id then
            os.execute("logger -t machome 'vpn check: " .. via .. " changed (" .. tostring(l.label):gsub("'", "") .. ", " .. tostring(l.peer or "?"):gsub("'", "") .. "); starting its checks fresh'")
            forget(via); drops[via] = nil; pcall(drops_save, now); changed = true
        end
        known[via] = id
    end
    for via in pairs(known) do if not labels[via] and known[via] ~= "removed" then known[via] = "removed"; changed = true end end
    if changed then fo_reset("VPN tunnels changed") end
end

-- ---------------------------------------------------------------- high WAN ping (owner, 2026-11-17: "over 75 ms", no spam when it flaps)
-- Sample: every 10 s, the BEST ping of Cloudflare / Google / Quad9 straight over the WAN (sampler ping.wan.each).
-- High, either way:
--   steady = over the last 5 minutes the MEDIAN is above the limit AND 80%+ of the checks were above it;
--   spiky  = over the last 15 minutes 25%+ of the checks were above the limit (added the same evening: the line was
--            ~70% normal at 14 ms and ~30% at ~245 ms, which the median rule alone called fine). A lone spike never counts.
-- OK    = for 10 minutes: the last-5-minute median under 80% of the limit AND fewer than 10% of those checks over it.
-- Spam guard: at most one "high" alert per hour. Going high again inside that hour is tracked silently and mentioned
-- in the next message; a long episode gets ONE reminder after 2 hours. "Back to normal" only for an announced episode.
-- Skipped: during a speed test + 60 s after (the test itself raises ping), during an internet outage, in access-point
-- mode (an AP's ping goes through the main router, which alerts for the whole house).
local pg = { s = {}, high = false, sent_t = 0, relapse = 0, st_until = 0, ap = false, ap_t = 0 }
X.pinghigh = nil
local function ping_tick(now, p)
    if now - pg.ap_t >= 60 then pg.ap_t = now; pg.ap = trim(sh("uci -q get glconfig.general.mode")) == "ap" end
    if pg.ap then pg.s = {}; pg.high = false; X.pinghigh = nil; return end
    local lim = tonumber(X.cfg.ping_ms) or 75
    if (jread(DIR .. "/speedtest.json", {}) or {}).running then pg.st_until = now + 60 end
    local wr, best, per = p.wan, nil, {}
    local NMS = { "Cloudflare", "Quad9", "Google" }   -- order of ping.wan.each
    if wr and type(wr.each) == "table" then
        for i, e in ipairs(wr.each) do local ms = tonumber(e.ms); if ms then per[#per + 1] = NMS[i] .. " " .. math.floor(ms + 0.5) .. " ms"; if not best or ms < best then best = ms end end end
    end
    if now < pg.st_until or wansince or not best then return end
    local s = pg.s
    s[#s + 1] = { now, best }; while s[1] and now - s[1][1] > 900 do table.remove(s, 1) end
    -- windows: last 5 min (median + steady share), last 10 min (all clear), last 15 min (spiky share)
    local v5, o5, n5, o10, n10, o15, hi15 = {}, 0, 0, 0, 0, 0, 0
    for _, x in ipairs(s) do
        local age, ms = now - x[1], x[2]
        if ms > lim then o15 = o15 + 1; if ms > hi15 then hi15 = ms end end
        if age < 600 then n10 = n10 + 1; if ms > lim then o10 = o10 + 1 end end
        if age < 300 then n5 = n5 + 1; v5[#v5 + 1] = ms; if ms > lim then o5 = o5 + 1 end end
    end
    if n5 < 20 then return end          -- ~4 minutes of checks first
    table.sort(v5)
    local m = v5[math.ceil(#v5 / 2)]
    local mr = math.floor(m + 0.5)
    local share15 = o15 / #s
    local steady = m > lim and o5 >= n5 * 0.8
    local spiky = #s >= 60 and share15 >= 0.25      -- needs ~10 of the 15 minutes
    if not pg.high then
        if steady or spiky then
            pg.high = true; pg.since = s[1][1]; pg.worst = m; pg.sum, pg.n = 0, 0; pg.ok_since = nil; pg.remind = false
            pg.kind = (m > lim) and "steady" or "spiky"   -- middle value over the limit = high ping, whichever rule tripped first
            if now - pg.sent_t >= 3600 then
                pg.announced = true; pg.sent_t = now
                local rel = pg.relapse; pg.relapse = 0
                local pct = math.floor(share15 * 100 + 0.5)
                alert("ping", pg.kind == "steady" and ("🐢 High internet ping: " .. mr .. " ms") or ("🐢 Internet ping is spiky: " .. pct .. "% of checks over " .. lim .. " ms"),
                    (pg.kind == "steady" and ("Your internet ping has been above **" .. lim .. " ms** for 5 minutes (middle value **" .. mr .. " ms**).")
                        or ("In the last 15 minutes, **" .. pct .. "%** of the ping checks were over **" .. lim .. " ms** (spikes up to " .. math.floor(hi15 + 0.5) .. " ms), while the rest were normal (middle value " .. mr .. " ms). You'd notice it as lag spikes in games and calls.")) ..
                    " Measured every 10 s as the best of Cloudflare, Google and Quad9, directly, not through the VPN." ..
                    (rel > 0 and (" It also went high " .. rel .. " more time" .. (rel == 1 and "" or "s") .. " in the last hour without a new alert.") or "") ..
                    "\nThis is usually your ISP or the modem. The Internet card's WAN ping graph shows how it's going. You'll get one message when it's been normal for 10 minutes (at most one high-ping alert per hour if it keeps bouncing).",
                    "orange", #per > 0 and { { name = "Right now", value = table.concat(per, " · "), inline = false } } or nil)
            else
                pg.announced = false; pg.relapse = pg.relapse + 1
                os.execute("logger -t machome 'high ping again (" .. pg.kind .. ", " .. mr .. " ms); no alert, one was sent less than an hour ago'")
            end
        end
    else
        pg.worst = math.max(pg.worst, m, hi15 > 0 and (pg.kind == "spiky" and hi15 or 0) or 0); pg.sum = pg.sum + m; pg.n = pg.n + 1
        if m < lim * 0.8 and o5 < n5 * 0.1 then pg.ok_since = pg.ok_since or now else pg.ok_since = nil end
        if pg.ok_since and now - pg.ok_since >= 600 then
            pg.high = false
            if pg.announced then
                local rel = pg.relapse; pg.relapse = 0
                alert("ping", "🟢 Internet ping back to normal: " .. mr .. " ms",
                    "Ping was " .. (pg.kind == "spiky" and "spiky" or "high") .. " for **" .. fmtdur(pg.ok_since - pg.since) .. "** (" .. os.date("%I:%M %p", pg.since) .. " – " .. os.date("%I:%M %p", pg.ok_since) .. "), worst **" ..
                    math.floor(pg.worst + 0.5) .. " ms**" .. (pg.n > 0 and (", average middle value " .. math.floor(pg.sum / pg.n + 0.5) .. " ms") or "") .. ". For the last 10 minutes it has stayed under " .. math.floor(lim * 0.8 + 0.5) .. " ms with almost no spikes." ..
                    (rel > 0 and (" (It also went high " .. rel .. " more time" .. (rel == 1 and "" or "s") .. " in between without a separate alert.)") or ""), "green")
            else
                os.execute("logger -t machome 'high ping episode over (not announced: inside the 1-hour alert limit)'")
            end
        elseif pg.announced and not pg.remind and now - pg.since >= 7200 then
            pg.remind = true
            alert("ping", "🐢 Internet ping still " .. (spiky and not steady and "spiky" or "high") .. ": " .. mr .. " ms",
                "Still over **" .. lim .. " ms** " .. (spiky and not steady and ("in " .. math.floor(share15 * 100 + 0.5) .. "% of checks ") or "") .. "after " .. fmtdur(now - pg.since) .. " (since " .. os.date("%I:%M %p", pg.since) .. "). Worst so far " .. math.floor(pg.worst + 0.5) .. " ms. No more reminders: the next message is when it's back to normal.",
                "orange", #per > 0 and { { name = "Right now", value = table.concat(per, " · "), inline = false } } or nil)
        end
    end
    X.pinghigh = pg.high and { since = pg.since, ms = mr, limit = lim, spiky = (pg.kind == "spiky") or nil, pct = math.floor(share15 * 100 + 0.5) } or nil
end

local function check_speed_done(now)
    local st = jread(DIR .. "/speedtest.json", nil)
    if not st or st.running or not st.finished or st.finished == st_seen then return end
    st_seen = st.finished
    if st.cancelled or type(st.results) ~= "table" or #st.results == 0 then sched_pending = false; return end
    local hist = jread(STHIST, {})
    local lines = {}
    for _, r in ipairs(st.results) do
        local lab = r.kind == "wan" and "Internet" or L(r.iface).label
        hist[#hist + 1] = { time = st.finished, iface = r.iface, kind = r.kind, label = lab, provider = r.kind == "vpn" and L(r.iface).provider or cjson.null,
            down = r.down or cjson.null, up = r.up or cjson.null, ping = r.ping or cjson.null, loss = r.loss or cjson.null, error = r.error or cjson.null, scheduled = sched_pending,
            dl_lat = r.dl_lat or cjson.null, ul_lat = r.ul_lat or cjson.null }
        lines[#lines + 1] = r.error and ("**" .. lab .. "**: " .. r.error)
            or string.format("**%s**: ↓ %s · ↑ %s · %s ms · loss %s", lab, mbps(r.down), mbps(r.up), r.ping and string.format("%.1f", r.ping) or "—",
                (r.loss and r.loss ~= cjson.null) and (tostring(r.loss) .. "%") or "n/a")
    end
    -- re-test: the nightly Internet entry stops counting and the re-test counts instead (still one per night for the ISP check)
    if retest_run then
        retest_run = false
        for i = #hist - #st.results, 1, -1 do local h = hist[i]; if h.kind == "wan" and h.scheduled then h.scheduled = false; h.retested = true; break end end
        for i = #hist - #st.results + 1, #hist do if hist[i].kind == "wan" then hist[i].scheduled = true; hist[i].retest = true end end
        local w = st.results[1] or {}
        alert("speed", "📊 Re-test after a slow nightly result", "The nightly test came in slow, so it was run again: **Internet ↓ " .. mbps(w.down) .. " · ↑ " .. mbps(w.up) .. "**. This result is the one that counts.", "blue")
    elseif sched_pending and X.cfg.speed_retest and (tonumber(X.cfg.plan_down) or 0) > 0 then
        for _, r in ipairs(st.results) do
            if r.kind == "wan" and type(r.down) == "number" and r.down < X.cfg.plan_down * (X.cfg.isp_slow_pct or 70) / 100 then retest_due = now + 600 end
        end
    end
    while #hist > 300 do table.remove(hist, 1) end
    writef(STHIST, cjson.encode(hist))
    if sched_pending then alert("speed", "📊 Nightly speed test", table.concat(lines, "\n") .. (retest_due and "\n_Internet came in slow, so it will be re-tested in 10 minutes._" or ""), "blue") end
    sched_pending = false
end

local function retest_tick(now)
    if not retest_due or now < retest_due then return end
    local lockpid = trim(readf(DIR .. "/speedtest.lock") or "")
    if lockpid ~= "" and readf("/proc/" .. lockpid .. "/cmdline") then retest_due = now + 120; return end
    retest_due = nil; retest_run = true
    writef(DIR .. "/speedtest.req", "wan"); os.remove(DIR .. "/speedtest.cancel")
    writef(DIR .. "/speedtest.json", cjson.encode({ running = true, mode = "wan", started = now, total = 0, index = 0, results = {}, scheduled = true }))
    os.execute("/etc/init.d/machome-st restart >/dev/null 2>&1")
end
local function schedule_speed(now)
    if not X.cfg.speed_daily then return end
    local t = os.date("*t", now)
    local today = os.date("%Y-%m-%d", now)
    if t.hour ~= X.cfg.speed_hour then return end
    if trim(readf(SCHED) or "") == today then return end
    local lockpid = trim(readf(DIR .. "/speedtest.lock") or "")
    if lockpid ~= "" and readf("/proc/" .. lockpid .. "/cmdline") then return end
    writef(SCHED, today)
    writef(DIR .. "/speedtest.req", "all")
    os.remove(DIR .. "/speedtest.cancel")
    writef(DIR .. "/speedtest.json", cjson.encode({ running = true, mode = "all", started = now, total = 0, index = 0, results = {}, scheduled = true }))
    sched_pending = true
    os.execute("/etc/init.d/machome-st restart >/dev/null 2>&1")
end

local function firmware_tick(now)
    if now - fw_t < 6 * 3600 then return end
    fw_t = now
    local r = lrpc("upgrade", "check_firmware_online", {})
    if type(r) ~= "table" then return end
    local curv = trim(readf("/etc/glversion") or "")
    local newv = (type(r.version_new) == "string" and r.version_new ~= "") and r.version_new or nil
    local prev = fw.new
    fw = { checked = now, current = curv, new = newv or cjson.null, notified = fw.notified }
    if newv and fw.notified ~= newv then
        local rd = readiness(now, true)
        local fields = {
            { name = "Survives the upgrade (Keep settings ✔)", value = rd.kept .. " of your custom files and settings", inline = false } }
        if #rd.lost > 0 then fields[#fields + 1] = { name = "⚠ Will be wiped", value = table.concat(rd.lost, "\n"), inline = false } end
        if #rd.revert > 0 then fields[#fields + 1] = { name = "↩ Will turn back on (re-disable after)", value = table.concat(rd.revert, ", "), inline = false } end
        fields[#fields + 1] = { name = "Before upgrading", value = "Leave **Keep settings** ticked and use **Back up settings** in the Control Center first.", inline = false }
        alert("firmware", "⬆ Firmware " .. newv .. " is available", "Current: " .. curv, "purple", fields)
        fw.notified = newv
    end
    writef(DIR .. "/fw.json", cjson.encode(fw))
end

local function boot_check(now, sec)
    local curv = trim(readf("/etc/glversion") or "")
    local last = trim(readf(LASTVER) or "")
    if last ~= "" and curv ~= "" and last ~= curv then
        local fine, broken = integrity(sec)
        local fields = {}
        if #broken > 0 then fields[1] = { name = "⚠ Needs attention", value = table.concat(broken, "\n"):sub(1, 1000), inline = false }
            fields[2] = { name = "Fix", value = "Ask Claude to reapply from the brume3-home folder, or re-run the install scripts.", inline = false } end
        local rd = readiness(now, true)
        if #rd.revert > 0 then fields[#fields + 1] = { name = "↩ Services turned back on by the upgrade", value = table.concat(rd.revert, ", "), inline = false } end
        alert("upgrade", (#broken > 0 or #rd.revert > 0) and "⚠ Firmware upgraded: some items need reapplying" or "✅ Firmware upgraded: everything survived",
            "Upgraded from " .. last .. " to " .. curv .. ". " .. fine .. " custom files intact.", (#broken > 0) and "orange" or "green", fields)
    end
    if curv ~= "" then writef(LASTVER, curv) end
    return last ~= "" and curv ~= "" and last ~= curv
end

-- ---------------------------------------------------------------- zram after a firmware upgrade (2026-11-22, owner)
-- A GL firmware upgrade removes the zram-swap package (its settings in /etc/config/system stay). Router Home
-- remembers that zram was installed (/etc/machome/zram_want) and, after an upgrade, reinstalls it from GL's package
-- server once the internet is up: in the background, up to 6 tries 10 minutes apart. It never installs zram on a
-- router that didn't have it, and if zram-swap is removed on purpose (no upgrade in between) the marker goes too.
local ZWANT, ZPEND, ZPID, ZLOG = EDIR .. "/zram_want", EDIR .. "/zram_reinstall", DIR .. "/zram_reinstall.pid", DIR .. "/zram_reinstall.log"
local zr_t = 0
local function zram_tick(now, online, upgraded)
    local inst = exists("/etc/init.d/zram")
    if upgraded and not inst and exists(ZWANT) and not exists(ZPEND) then
        writef(ZPEND, cjson.encode({ since = now, tries = 0 }))
        os.execute("logger -t machome 'zram: the firmware upgrade removed zram-swap; reinstalling it when the internet is up'")
    end
    local p = exists(ZPEND) and jread(ZPEND, nil) or nil
    local pid = trim(readf(ZPID) or "")
    local busy = pid:match("^%d+$") ~= nil and exists("/proc/" .. pid .. "/stat")
    if inst and not busy then
        if not exists(ZWANT) then writef(ZWANT, "zram-swap was installed on " .. os.date("%Y-%m-%d") .. "; Router Home reinstalls it after firmware upgrades\n") end
        if p then
            os.remove(ZPEND); os.remove(ZPID)
            local on = (readf("/proc/swaps") or ""):match("/dev/zram0") ~= nil
            alert("upgrade", "✅ Zram reinstalled after the firmware upgrade", "The upgrade removed GL's **zram-swap** package; Router Home put it back" .. (on and " and zram is on again." or ". It starts at the next restart."), "green")
        end
        return
    end
    if inst or busy then return end
    if not p then if exists(ZWANT) then os.remove(ZWANT) end; return end   -- removed on purpose: forget it
    if not online or now - zr_t < 600 or exists("/var/lock/opkg.lock") then return end
    zr_t = now
    p.tries = (tonumber(p.tries) or 0) + 1
    if p.tries > 6 then
        os.remove(ZPEND); os.remove(ZPID)
        local why = trim(sh("tail -2 " .. ZLOG)):gsub("[`*]", ""):sub(1, 300)
        alert("upgrade", "⚠ Zram couldn't be reinstalled", "The firmware upgrade removed GL's **zram-swap** package and 6 tries to put it back failed. Install it in **System → Plug-ins** (search for zram-swap)." .. (why ~= "" and ("\nLast message: " .. why) or ""), "orange")
        return
    end
    writef(ZPEND, cjson.encode(p))
    -- in the background: opkg can take a minute and the sampler must keep running
    os.execute("(opkg update; opkg install zram-swap && /etc/init.d/zram enable && /etc/init.d/zram start) >" .. ZLOG .. " 2>&1 </dev/null & echo $! > " .. ZPID)
    os.execute("logger -t machome 'zram: reinstalling zram-swap after the firmware upgrade (try " .. p.tries .. " of 6)'")
end

-- ---------------------------------------------------------------- Router Home updates: daily check (2026-11-22, owner)
-- Once a day the router asks GitHub for the newest Router Home release (updater.lua check) and sends ONE Discord
-- message per new version (alert type "rhupdate"). It never installs anything: that stays a click in
-- Control Center → Router Home updates. A failed check is retried after an hour.
local RHUPD = EDIR .. "/rhupd.json"
local rhu = nil
local function rhupd_tick(now)
    rhu = rhu or jread(RHUPD, {})
    if type(rhu) ~= "table" then rhu = {} end
    if now - (tonumber(rhu.checked) or 0) < 86400 then return end
    if (tonumber((readf("/proc/uptime") or ""):match("^(%d+)")) or 0) < 600 then return end   -- not right after a boot
    local okU, U = pcall(dofile, "/usr/lib/machome/updater.lua"); if not okU or type(U) ~= "table" then return end
    local okc, r = pcall(U.check)
    if not okc or type(r) ~= "table" or not r.ok then
        rhu.checked = now - 86400 + 3600
    else
        rhu.checked = now; rhu.latest = r.latest
        if r.newer and r.latest and r.latest ~= "" and rhu.notified ~= r.latest then
            local notes = tostring(r.notes or ""):gsub("\r", ""):sub(1, 900)
            alert("rhupdate", "⬆ Router Home " .. r.latest .. " is available",
                "This router runs " .. tostring(r.current) .. ". Install it from **Control Center → Router Home updates**; it backs up first and goes back by itself if anything fails." ..
                (r.installable and "" or "\nThis release has no signed update package, so use the installer from GitHub instead."), "purple",
                { { name = "What's new", value = notes ~= "" and notes or "(no notes)", inline = false } })
            rhu.notified = r.latest
        end
    end
    writef(RHUPD, cjson.encode(rhu))
end

-- ---------------------------------------------------------------- main entry points
local last_min = 0
-- ---------------------------------------------------------------- weather (fetch every 20 min, sleep-screen wallpaper on GL screen models)
local WX, wx_last, wx_key, wx_rad_t = nil, 0, nil, 0
local WXKEY = EDIR .. "/wx_screen_key"
local function weather_tick(now, online)
    if not WX then local ok, W = pcall(dofile, "/usr/lib/machome/weather.lua"); if not ok then return end; WX = W end
    local c = WX.load_cfg()
    if not c.lat then return end
    local force = exists(DIR .. "/wx_force")
    if force then os.remove(DIR .. "/wx_force") end
    local d = jread(WX.DATA, nil)
    if force and d then wx_last = now end   -- set_weather just fetched fresh data
    if online and (not d or d.zip ~= c.zip or now - wx_last >= 1200) then
        wx_last = now
        local nd = WX.fetch(c)
        if nd then d = nd; writef(WX.DATA, cjson.encode(nd)) end
    end
    if not exists("/etc/init.d/gl_screen") then return end
    wx_key = wx_key or trim(readf(WXKEY) or "")
    if c.screen == false then
        if wx_key ~= "" and wx_key ~= "off" then WX.restore_screen(); wx_key = "off"; writef(WXKEY, "off") end
        return
    end
    if not d then return end
    -- radar background: refreshed every 15 min by a background job (never blocks the sampler)
    if c.radar ~= false and WX.radar_job and online and (now - wx_rad_t >= 900 or exists(DIR .. "/wx_radar_now")) then
        wx_rad_t = now; os.remove(DIR .. "/wx_radar_now")
        os.execute("lua /usr/lib/machome/weather.lua radar </dev/null >/dev/null 2>&1 &")
    end
    local mode, stamp
    if WX.bg_mode then mode, stamp = WX.bg_mode(c) end
    -- "W2" = white text with shadow (2026-11-12): part of the key so the wallpaper is redrawn once in the new style
    local key = WX.screen_key(d, mode, stamp) .. "|W2"
    if key ~= wx_key then
        local pngb = WX.render(d, mode)
        if pngb and WX.upload(pngb) then wx_key = key; writef(WXKEY, key) end
    end
end

-- ---------------------------------------------------------------- admin logins (web sessions + SSH)
local sess_seen, ssh_mark = nil, nil
local function login_tick(now)
    -- web admin: GL creates /tmp/gl_token_<session> on each successful sign-in. Only names are compared, never contents.
    local cur_s, n = {}, 0
    for f in sh("ls /tmp 2>/dev/null | grep '^gl_token_'"):gmatch("[^\n]+") do cur_s[f] = true; n = n + 1 end
    if sess_seen then
        local new = 0
        for f in pairs(cur_s) do if not sess_seen[f] then new = new + 1 end end
        if new > 0 then alert("login", "🔑 Router admin sign-in", "Someone signed in to the router's admin page at **" .. os.date("%I:%M %p", now) .. "** (" .. n .. " active session" .. (n == 1 and "" or "s") .. ").\nIf this wasn't you, change the admin password.", "purple") end
    end
    sess_seen = cur_s
    -- SSH: dropbear log lines since the last check
    local lines = {}
    for l in sh("logread -e dropbear 2>/dev/null | tail -60"):gmatch("[^\n]+") do lines[#lines + 1] = l end
    local start = 1
    if ssh_mark then for i = #lines, 1, -1 do if lines[i] == ssh_mark then start = i + 1; break end end else start = #lines + 1 end
    ssh_mark = lines[#lines] or ssh_mark
    local ok_from, bad_from = {}, {}
    for i = start, #lines do
        local l = lines[i]
        local ip = l:match("from ([%d%.]+):%d+") or l:match("<([%d%.]+):%d+>")
        if l:find("auth succeeded", 1, true) and ip then ok_from[ip] = (ok_from[ip] or 0) + 1
        elseif (l:find("Bad password", 1, true) or l:find("Login attempt for nonexistent", 1, true) or l:find("Bad PAM", 1, true)) and ip then bad_from[ip] = (bad_from[ip] or 0) + 1 end
    end
    for ip, c in pairs(ok_from) do alert("login", "🔑 SSH sign-in", "SSH login to the router from **" .. ip .. "**" .. (c > 1 and (" (" .. c .. " sessions)") or "") .. ".", "purple") end
    for ip, c in pairs(bad_from) do alert("login", "⚠ Failed SSH sign-in", c .. " failed SSH login attempt" .. (c == 1 and "" or "s") .. " from **" .. ip .. "**.", "orange") end
end

-- ---------------------------------------------------------------- weekly summary
local WEEKLY = EDIR .. "/weekly_sent"
local function weekly_tick(now)
    local t = os.date("*t", now)
    if (t.wday - 1) ~= X.cfg.weekly_day or t.hour ~= X.cfg.weekly_hour then return end
    local wk = os.date("%Y-%m-%d", now)
    if trim(readf(WEEKLY) or "") == wk then return end
    writef(WEEKLY, wk)
    local since = now - 7 * 86400
    local fields = {}
    -- uptime + outages
    local up = tonumber((readf("/proc/uptime") or "0"):match("^(%d+)")) or 0
    local outs = jread(EDIR .. "/outages.json", {})
    local oc, od = 0, 0
    for _, o in ipairs(outs) do if o.e > since then oc = oc + 1; od = od + (o.e - math.max(o.s, since)) end end
    fields[#fields + 1] = { name = "🌐 Internet", value = (oc == 0 and "No outages" or (oc .. " outage" .. (oc == 1 and "" or "s") .. ", " .. fmtdur(od) .. " total")) ..
        string.format(" · %.2f%% up", (1 - od / (7 * 86400)) * 100) .. "\nRouter uptime: " .. fmtdur(up), inline = false }
    local dc, dd = 0, 0
    for _, o in ipairs(jread(EDIR .. "/dns-outages.json", {})) do if o.e > since then dc = dc + 1; dd = dd + (o.e - math.max(o.s, since)) end end
    fields[#fields + 1] = { name = "🛡 " .. dns_name(trim(sh("uci -q get dhcp.lan.dhcp_option | tr ' ' '\\n' | grep '^6,' | cut -d, -f2"))),
        value = dc == 0 and "No outages" or (dc .. " outage" .. (dc == 1 and "" or "s") .. ", " .. fmtdur(dd) .. " total"), inline = false }
    -- speed averages
    local agg, order = {}, {}
    for _, h in ipairs(jread(STHIST, {})) do
        if h.time >= since and type(h.down) == "number" then
            local a = agg[h.label]; if not a then a = { n = 0, d = 0, u = 0 }; agg[h.label] = a; order[#order + 1] = h.label end
            a.n = a.n + 1; a.d = a.d + h.down; a.u = a.u + (type(h.up) == "number" and h.up or 0)
        end
    end
    local sp = {}
    for _, lab in ipairs(order) do local a = agg[lab]; sp[#sp + 1] = string.format("**%s**: ↓ %s · ↑ %s (%d test%s)", lab, mbps(a.d / a.n), mbps(a.u / a.n), a.n, a.n == 1 and "" or "s") end
    if #sp > 0 then
        local w = agg["Internet"]
        fields[#fields + 1] = { name = "📊 Average speeds", value = table.concat(sp, "\n") .. (w and string.format("\nInternet averaged **%.0f%%** of your %s plan.", w.d / w.n / X.cfg.plan_down * 100, mbps(X.cfg.plan_down)) or ""), inline = false }
    end
    -- VPN reliability
    local rl = {}
    for _, list in pairs(rel.buckets or {}) do
        local n, dn, lab = 0, 0, nil
        for _, b in ipairs(list) do if b.h >= since then n = n + b.n; dn = dn + b.down; lab = b.label end end
        if n > 0 then rl[#rl + 1] = string.format("**%s**: %.2f%% up", lab or "?", (1 - dn / n) * 100) end
    end
    table.sort(rl)
    if #rl > 0 then fields[#fields + 1] = { name = "🛡 VPN reliability", value = table.concat(rl, "\n"), inline = false } end
    -- top devices (7 days)
    local u = jread(DIR .. "/usage.json", {})
    local td = {}
    for i, d in ipairs(u.d7 or {}) do if i > 3 then break end; td[#td + 1] = string.format("%d. %s: %.1f GB", i, tostring(d.name ~= cjson.null and d.name or "Unknown"), (d.rx + d.tx) / 1e9) end
    if #td > 0 then fields[#fields + 1] = { name = "📱 Top devices", value = table.concat(td, "\n"), inline = false } end
    -- backups
    local nb = jread(EDIR .. "/nasbackup-state.json", nil)
    if nb and nb.last then fields[#fields + 1] = { name = "💾 NAS backup", value = nb.last_ok and ("Last good backup " .. os.date("%a %b %d, %I:%M %p", nb.last_ok)) or "⚠ No successful backup yet", inline = false } end
    alert("weekly", "🗓 Weekly router report", "Here's how your network did over the last 7 days.", "blue", fields)
end

-- ---------------------------------------------------------------- scheduled NAS backup
local NASDAY = EDIR .. "/nas_last_day"
-- auto-heal (2026-11-14): a failed backup is retried after 1 h, then 6 h (switch nas_retry), and a NAS that doesn't
-- answer is sent a Wake-on-LAN signal first and given 3 minutes (switch nas_wake). Only failures that can clear up
-- by themselves are retried: not "NAS is full", wrong password, folder/permission or protocol problems.
-- NASRETRY = { n = retries done, at = when to run next, first = time of the first failure, wake = woke it before the scheduled run }
local NASRETRY = EDIR .. "/nas_retry.json"
local nas_pending, nas_pending_retry = nil, false
local function nas_start(now, retry)
    nas_pending, nas_pending_retry = now, retry
    os.execute("echo 1 > " .. DIR .. "/nas_running; (lua -e 'dofile(\"/usr/lib/machome/more.lua\").nas_run()' >/dev/null 2>&1; rm -f " .. DIR .. "/nas_running) &")
end
local function nas_transient(e)
    local el = e:lower()
    for _, w in ipairs({ "username", "password", "folder", "permission", "certificate", "tls", "encrypted", "doesn't offer", "ssh key", "not set up", "404" }) do
        if el:find(w, 1, true) then return false end
    end
    return true
end
-- NAS asleep? ping it; if it doesn't answer and we know its MAC, send Wake-on-LAN (watch.lua). true = signal sent
local function nas_wake_first(host)
    if not X.cfg.nas_wake or not WATCH or not WATCH.wake_if_down then return false end
    local ok, sent = pcall(WATCH.wake_if_down, host); return ok and sent == true
end
local function nas_tick(now)
    local P_ok, P = pcall(dofile, "/usr/lib/machome/more.lua"); if not P_ok then return end
    if nas_pending and not exists(DIR .. "/nas_running") then
        local st = jread(EDIR .. "/nasbackup-state.json", {})
        local R = jread(NASRETRY, {})
        if (st.last or 0) >= nas_pending and st.last_ok ~= st.last then
            -- the NAS's FTP server can't report free space, so "full" is recognised from the upload error itself
            local e = tostring(st.last_err or "Upload failed"); local el = e:lower()
            local full = e:find("552") or el:find("disk full") or el:find("no space") or el:find("quota") or el:find("insufficient")
            local tries = nas_pending_retry and (R.n or 0) or 0
            local nxt = nil
            if X.cfg.nas_retry and not full and nas_transient(e) and tries < 2 then
                nxt = now + (tries == 0 and 3600 or 6 * 3600)
                writef(NASRETRY, cjson.encode({ n = tries + 1, at = nxt, first = R.first or nas_pending }))
            else os.remove(NASRETRY) end
            local tail
            if full then tail = "\nThe backup folder on the NAS has run out of space. Free up space or delete old backups there."
            elseif nxt then tail = "\nAuto-heal will try again at " .. os.date("%I:%M %p", nxt) .. (tries > 0 and " (last try)." or ".")
            elseif tries >= 2 then tail = "\nTried 3 times without success. The next try is the regular scheduled backup. Check that the NAS is on and its settings in Control Center → NAS backup."
            else tail = "\nCheck the settings in Control Center → NAS backup." end
            alert("backup", full and "💾 NAS backup failed: the NAS is full" or (tries > 0 and "💾 NAS backup failed again" or "💾 NAS backup failed"), e .. tail, "orange")
        elseif (st.last or 0) >= nas_pending and st.last_ok == st.last and nas_pending_retry then
            if (R.n or 0) > 0 then
                alert("backup", "✅ NAS backup worked on the retry", "The backup that failed at " .. os.date("%I:%M %p", R.first or nas_pending) .. " went through on try " .. ((R.n or 0) + 1) .. (R.woke and " (after waking the NAS)" or "") .. ".", "green")
            end
            os.remove(NASRETRY)
        end
        nas_pending, nas_pending_retry = nil, false
    end
    local c = P.nas_cfg()
    if not c.enabled or (c.host or "") == "" then return end
    -- a retry (or the scheduled run that was waiting 3 minutes for the NAS to wake up) is due
    local R = jread(NASRETRY, nil)
    if R and not nas_pending and not exists(DIR .. "/nas_running") then
        if not R.at then os.remove(NASRETRY)                                  -- left over from a restart mid-run
        elseif not X.cfg.nas_retry and not R.wake then os.remove(NASRETRY)
        elseif now >= R.at then
            if not R.woke and nas_wake_first(c.host) then R.woke = true; R.at = now + 180; writef(NASRETRY, cjson.encode(R)); return end
            R.at = nil; R.wake = nil; writef(NASRETRY, cjson.encode(R))
            nas_start(now, true); return
        end
    end
    local t = os.date("*t", now)
    if t.hour ~= (c.hour or 4) then return end
    if (c.day or 0) ~= 7 and (t.wday - 1) ~= (c.day or 0) then return end
    local today = os.date("%Y-%m-%d", now)
    if trim(readf(NASDAY) or "") == today then return end
    writef(NASDAY, today)
    -- scheduled run: if the NAS is asleep, wake it and start 3 minutes later (counts as the first try, not a retry)
    if nas_wake_first(c.host) then writef(NASRETRY, cjson.encode({ n = 0, at = now + 180, wake = true, woke = true })); return end
    nas_start(now, false)
end

-- ---------------------------------------------------------------- keep RAM-only history across reboots (saved every 6 h + on shutdown by the init script)
local save_t = os.time()
local function save_tick(now)
    if now - save_t < 6 * 3600 then return end
    save_t = now
    os.execute("mkdir -p " .. EDIR .. "/save; cp -p " .. DIR .. "/hist " .. DIR .. "/usage-hourly.json " .. DIR .. "/rel_cur.json " .. DIR .. "/events.json " .. DIR .. "/dnswatch.json " .. EDIR .. "/save/ 2>/dev/null")
end

-- ---------------------------------------------------------------- manual fan speed + failsafe (every tick, ~10 s)
-- Manual mode stops GL's gl_fan controller and holds a fixed PWM. If the CPU reaches GL's warning
-- temperature, GL's controller is started again until the CPU is 8 °C cooler, then manual resumes.
local fan_pwm_path, fan_fs = nil, false
local function fan_tick(now)
    local c = jread(EDIR .. "/fan.json", nil)
    if not c or c.mode ~= "manual" then
        if exists(DIR .. "/fan_failsafe") then os.remove(DIR .. "/fan_failsafe") end
        fan_fs = false
        return
    end
    fan_pwm_path = fan_pwm_path or trim(sh("ls /sys/class/hwmon/*/pwm1 2>/dev/null | head -1"))
    if fan_pwm_path == "" then return end
    local sysfs = trim(sh("uci -q get glfan.globals.sysfs")); if sysfs == "" then sysfs = "/sys/class/thermal/thermal_zone0/temp" end
    local div = tonumber(trim(sh("uci -q get glfan.globals.div"))) or 1000
    local warn = tonumber(trim(sh("uci -q get glfan.globals.warn_temperature"))) or 75
    local t = (tonumber(trim(readf(sysfs) or "")) or 0) / div
    local running = trim(sh("pidof gl_fan")) ~= ""
    if t >= warn then
        if not fan_fs then
            fan_fs = true; writef(DIR .. "/fan_failsafe", tostring(now))
            os.execute("/etc/init.d/gl_fan start >/dev/null 2>&1")
            alert("temp", "🌀 Fan failsafe: back to automatic", string.format("CPU reached **%d°F** (warning level %d°F) with the fan on manual %d%%. GL's automatic control is back on until it cools to %d°F.",
                cf(t), cf(warn), tonumber(c.pct) or 0, cf(warn - 8)), "orange")
        end
        return
    end
    if fan_fs and t > warn - 8 then return end          -- still cooling down under automatic control
    if fan_fs then fan_fs = false; os.remove(DIR .. "/fan_failsafe") end
    if running then os.execute("/etc/init.d/gl_fan stop >/dev/null 2>&1") end
    local want = math.floor(math.max(0, math.min(100, tonumber(c.pct) or 50)) * 255 / 100 + 0.5)
    if tonumber(trim(readf(fan_pwm_path) or "")) ~= want then os.execute("echo " .. want .. " > " .. fan_pwm_path) end
end

function X.tick(ctx)
    local now, p, wg = ctx.now, ctx.ping or {}, ctx.wg or {}
    -- "Clear" in the Recent events window (rpc clear_events): drop events newer than the given time from memory too
    local clr = readf(DIR .. "/events_clear")
    if clr then
        os.remove(DIR .. "/events_clear")
        -- a plain number (since) or, since 2026-11-18, {since, kinds}: only those kinds
        local since, kinds = tonumber(trim(clr)), nil
        if not since then local okc, v = pcall(cjson.decode, clr); if okc and type(v) == "table" then since = tonumber(v.since); if type(v.kinds) == "table" and #v.kinds > 0 then kinds = {}; for _, k in ipairs(v.kinds) do kinds[tostring(k)] = true end end end end
        since = since or 0
        local keep = {}; for _, e in ipairs(events) do if (e.t or 0) < since or (kinds and not kinds[tostring(e.k)]) then keep[#keep + 1] = e end end
        events = keep; writef(EVF, #events > 0 and cjson.encode(events) or "[]")
    end
    -- "Clear all" on the Home tab's alert banner (rpc alerts_clear, 2026-11-18): the high-ping check starts over too
    -- (the VPN and packet-loss resets go through their own files)
    if exists(DIR .. "/ping_reset") then
        os.remove(DIR .. "/ping_reset")
        pg.s = {}; pg.high = false; pg.relapse = 0; X.pinghigh = nil
        os.execute("logger -t machome 'alerts: Clear all from the Home tab; checks start fresh'")
    end
    -- forget requests from the page (rpc vpn_forget_apply / rel_remove): reliability entries live in this process
    local fq = readf(DIR .. "/vpn_forget_req.json")
    if fq then
        os.remove(DIR .. "/vpn_forget_req.json")
        local okq, q = pcall(cjson.decode, fq)
        if okq and type(q) == "table" and type(q.rel) == "table" then
            local n = X.rel_forget(q.rel)
            os.execute("logger -t machome 'vpn forget: " .. n .. " reliability entr" .. (n == 1 and "y" or "ies") .. " removed (Home tab)'")
        end
    end
    if NP then pcall(NP.tick, now, X, ctx) end
    if HEALTH then pcall(HEALTH.tick, now, X) end
    if LIFE then pcall(LIFE.tick, now, X) end
    if WATCH then pcall(WATCH.tick, now, X) end
    if TRAVEL then pcall(TRAVEL.tick, now, X, p.wan) end
    pcall(fan_tick, now)
    local okt, et = pcall(vpn_topology, now, p)
    if not okt then refresh_labels(now); os.execute("logger -t machome 'vpn topology: " .. tostring(et):gsub("'", ""):sub(1, 150) .. "'") end
    rel_tick(now, p, wg)
    -- WAN outage (alert is sent once the connection is back)
    local wr = p.wan
    if wr and (wr.loss or 100) >= 100 then wanbad = wanbad + 1; if wanbad == 3 then wansince = now - 20 end
    else
        if wansince then
            local dur = now - wansince
            -- Access-point mode (e.g. the Flint behind the Brume): no outage alert. An AP's check goes out through the
            -- main router (and its VPN), so a VPN hiccup there looked like "internet down"; the main router reports real
            -- outages. In router mode the alert is sent as usual. The mode is read each time, so switching modes just works.
            if trim(sh("uci -q get glconfig.general.mode")) ~= "ap" then
                -- likely cause (2026-11-18): did the modem keep answering during the outage? (netplus)
                local cause = nil; if NP and NP.outage_cause then local okc, c = pcall(NP.outage_cause); if okc and c then cause = c.text end end
                alert("wan", "🌐 Internet outage", "Your internet connection was down for **" .. fmtdur(dur) .. "** (" .. os.date("%I:%M %p", wansince) .. " – " .. os.date("%I:%M %p", now) .. ")." .. (cause and ("\n" .. cause) or ""), "orange")
                local okm, P = pcall(dofile, "/usr/lib/machome/more.lua"); if okm then pcall(P.log_outage, wansince, now) end
            end
            wansince = nil
        end
        wanbad = 0
    end
    local online = not wansince
    X.online = online          -- shared with health.lua (e.g. Tailscale self-heal waits while the internet is down)
    X.wan_since = wansince     -- start of the current outage (watch.lua: last-resort modem restart)
    if online then
        -- flush queued alerts
        if #queue > 0 then local q = queue; queue = {}; for _, e in ipairs(q) do if post(e) == false then queue[#queue + 1] = e end end end
        pcall(web_probe, now)
        vpn_alerts(now, p, wg)
        pcall(fo_tick, now)
        -- "down" messages failover didn't send (failover off, no healthy tunnel, single tunnel): send them as before
        for _, s in pairs(vstate) do
            local pd = s.pend_down
            if pd then
                s.pend_down = nil
                alert("vpn", "🔴 " .. pd.label .. " is down", pd.label .. " is " .. pd.why .. "." .. (X.cfg.autoheal and " Auto-heal will restart it if it's still down in 2 minutes." or ""), "red",
                    { { name = "Server", value = tostring(pd.peer or "?"), inline = true } })
            end
        end
        local d = ctx.dns
        if d then
            if not d.ok then dnsbad = dnsbad + 1 else dnsbad = 0 end
            if dnsbad >= 3 and not dnsdown then
                dnsdown = now - 20   -- first of the 3 failed checks (10 s apart)
                local nm = dns_name(d.server)
                alert("dns", "🔴 " .. nm .. " isn't responding", "**" .. nm .. "** (" .. tostring(d.server) .. ") isn't answering DNS lookups. Devices may not be able to load websites until it's back.", "red")
            elseif d.ok and dnsdown then
                local nm = dns_name(d.server)
                alert("dns", "🟢 " .. nm .. " is back", nm .. " (" .. tostring(d.server) .. ") is answering again after being down **" .. fmtdur(now - dnsdown) .. "** (" .. os.date("%I:%M %p", dnsdown) .. " – " .. os.date("%I:%M %p", now) .. ").", "green")
                local okm, P = pcall(dofile, "/usr/lib/machome/more.lua"); if okm and P.log_dns_outage then pcall(P.log_dns_outage, dnsdown, now, tostring(d.server)) end
                dnsdown = false
            end
        end
    end
    pcall(ping_tick, now, p)
    -- temperature (5 minutes over the limit)
    if ctx.maxT then
        local f = cf(ctx.maxT)
        if f >= X.cfg.temp_f then tempcnt = tempcnt + 1; X.tempsince = X.tempsince or now else tempcnt = 0; X.tempsince = nil; if f < X.cfg.temp_f - 5 then tempfired = false end end
        if tempcnt >= 30 and not tempfired then tempfired = true; alert("temp", "🌡 Router is running hot", "Hottest sensor at **" .. f .. "°F** for 5+ minutes (limit " .. X.cfg.temp_f .. "°F).", "orange") end
    end
    if now - last_min >= 60 then
        last_min = now
        X.cfg = load_cfg()
        usage_tick(now)
        local upgraded = false
        if not booted then booted = true; local okb, u = pcall(boot_check, now, ctx.sec); upgraded = okb and u == true end
        pcall(zram_tick, now, online, upgraded)
        if online then pcall(rhupd_tick, now) end
        -- security transitions
        if ctx.sec and #ctx.sec > 0 then
            if prev_sec then
                local was = {}; for _, c in ipairs(prev_sec) do was[c.id] = c.ok end
                for _, c in ipairs(ctx.sec) do
                    if was[c.id] == true and c.ok == false then alert("security", "🛡 Security check failed: " .. c.label, tostring(c.detail), "orange")
                    elseif was[c.id] == false and c.ok == true then alert("security", "🛡 Security check passing again: " .. c.label, tostring(c.detail), "green") end
                end
            end
            prev_sec = ctx.sec
            X.secsince = X.secsince or {}
            for _, c in ipairs(ctx.sec) do if c.ok then X.secsince[c.id] = nil else X.secsince[c.id] = X.secsince[c.id] or now end end
        end
        -- new devices
        if ctx.newmacs and #ctx.newmacs > 0 then
            snapshot()
            for _, m in ipairs(ctx.newmacs) do
                local n = names[m] or {}
                alert("newdev", "📱 New device joined", "**" .. tostring(n.name or "Unknown device") .. "** connected for the first time.", "blue",
                    { { name = "IP", value = tostring(n.ip or "?"), inline = true }, { name = "MAC", value = m, inline = true } })
            end
        end
        if online then firmware_tick(now) end
        schedule_speed(now)
        pcall(retest_tick, now)
        readiness(now, false)
        pcall(login_tick, now)
        pcall(weekly_tick, now)
        pcall(nas_tick, now)
        pcall(save_tick, now)
        pcall(digest_tick, now)
        -- events older than the owner's "keep for" setting go even when nothing new is recorded
        local ks = math.max(1, tonumber(X.cfg.ev_keep_days) or 14) * 86400
        if events[1] and now - events[1].t > ks then
            while events[1] and now - events[1].t > ks do table.remove(events, 1) end
            writef(EVF, #events > 0 and cjson.encode(events) or "[]")
        end
    end
    if now - last_min < 2 or exists(DIR .. "/wx_force") then pcall(weather_tick, now, online) end
    check_speed_done(now)
end

function X.live()
    -- active incidents with start times, for the Home tab's alert banner
    local vpn = {}
    for via, s in pairs(vstate) do if s.down then vpn[via] = { since = s.since, label = L(via).label } end end
    local secs = {}
    for id, t in pairs(X.secsince or {}) do secs[id] = t end
    local inc = { wan_since = wansince or cjson.null, dns_since = dnsdown or cjson.null, temp_since = X.tempsince or cjson.null,
        vpn = next(vpn) and vpn or cjson.null, failover = next(fo.moved) and fo.moved or cjson.null, sec_since = next(secs) and secs or cjson.null, temp_limit = X.cfg.temp_f,
        ping_high = X.pinghigh or cjson.null }
    -- VPN Health card: per tunnel web check, domain lookup, drops in the last 24 h, checks failing right now
    local vhl = {}
    for via, l in pairs(labels) do
        if l.enabled and is_tun(via) then
            local s = vstate[via] or {}
            vhl[via] = { web = vh.web[via] or cjson.null, dns = vh.dns[via] or cjson.null, webfail = probe_fail[via] or 0,
                down = s.down or false, drops = drops[via] or {} }
        end
    end
    -- muted alert types (still muted) for the banner, and the netplus data for Network Health (2026-11-18)
    local mutes = {}; for k, u in pairs(X.cfg.mutes or {}) do if tonumber(u) and tonumber(u) > os.time() then mutes[k] = tonumber(u) end end
    local okn, np = false, nil; if NP and NP.live then okn, np = pcall(NP.live) end
    return { vh = next(vhl) and vhl or cjson.null, inc = inc, fw = fw, ready = ready, alerts = { enabled = X.cfg.enabled, configured = X.cfg.webhook ~= "", sent = stats.sent, failed = stats.failed,
        last = stats.last or cjson.null, last_ok = stats.last_ok or cjson.null, queued = #queue, mutes = next(mutes) and mutes or cjson.null },
        np = (okn and np) or cjson.null,
        sched = { enabled = X.cfg.speed_daily, hour = X.cfg.speed_hour, last_day = trim(readf(SCHED) or "") } }
end

return X
