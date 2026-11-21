-- machome watch: trackers and repairs added 2026-11-14 (owner's list). Shared by every router; called from
-- extras.lua every sampler tick (~10 s) as W.tick(now, X); every entry point is pcall'ed there.
--   1  Tailscale key expiry warning (14 / 7 / 1 days)
--   2  "Alert me if it goes offline" for chosen devices (NAS pre-selected)   [main routers]
--   3  Cable modem signal (Xfinity gateway at 10.0.0.1; admin password entered in the Home tab) [main routers]
--   6  Wi-Fi week stats for the weekly Wi-Fi report (weak devices, kicked devices, drops, radar)  [Wi-Fi models]
--   8  Wi-Fi band self-heal: a band that is DOWN / not answering is restarted once (never just "no clients")
--  10  Bad VPN server: suggestion after repeated stalls; optional switch to the tunnel's next saved server
--  11  Monthly summary on Discord (1st of the month)
local cjson = require "cjson"
local W = {}
local DIR, EDIR = "/tmp/machome", "/etc/machome"
local UI = DIR .. "/watch.json"                 -- live state for the Home tab (rpc get_watch)
local ST = EDIR .. "/watch-state.json"          -- small, rarely written: warning marks, month, sent flags
local DEVW = EDIR .. "/devwatch.json"           -- watched devices { devices = { MAC = { name } }, seeded }
local WIFI = EDIR .. "/wifistats.json"          -- this week's Wi-Fi counters (written hourly)
local MON = EDIR .. "/monthly.json"             -- this month's counters (written at most every 10 min)
local MODEM = EDIR .. "/modem.json"             -- gateway login (mode 600, never returned to the page)

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s, private)
    local t = p .. ".tmp"; local f = io.open(t, "w"); if not f then return end; f:write(s); f:close()
    if private then os.execute("chmod 600 " .. t) end; os.rename(t, p)
end
local function trim(s) return s and (s:gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jread(p, d) local s = readf(p); if not s or s == "" then return d end; local ok, v = pcall(cjson.decode, s); if ok and type(v) == "table" then return v end; return d end
local function fmtdur(s) s = math.floor(s); if s < 90 then return s .. " s" elseif s < 5400 then return math.floor(s / 60 + 0.5) .. " min" else return string.format("%.1f h", s / 3600) end end
local function q(s) return "'" .. tostring(s):gsub("'", "'\\''") .. "'" end

local X = nil
local function cfg(k, d) local v = X and X.cfg and X.cfg[k]; if v == nil then return d end; return v end
local function alert(kind, title, desc, color, fields) if X and X.alert then X.alert(kind, title, desc, color, fields) end end
local st = jread(ST, {})
local function save() writef(ST, cjson.encode(st)) end
local ui = { t = 0 }
local mode_t, mode_ap = 0, false
local function is_ap(now) if now - mode_t > 60 then mode_t = now; mode_ap = trim(sh("uci -q get glconfig.general.mode")) == "ap" end; return mode_ap end
local function lrpc(obj, method, params)
    local f = DIR .. "/wrpc.json"
    writef(f, cjson.encode({ jsonrpc = "2.0", id = 1, method = "call", params = { "", obj, method, params or {} } }))
    local ok, v = pcall(cjson.decode, sh("curl -s -m 20 -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @" .. f .. " http://127.0.0.1/rpc"))
    if ok and type(v) == "table" then return v.result end
end

-- ================================================================ 11. monthly counters (fed by every alert)
local mon = jread(MON, {}); local mon_dirty, mon_saved = false, 0
local function mon_month(now) return os.date("%Y-%m", now) end
local function mon_reset(now) mon = { month = mon_month(now), c = {}, vpn = {}, dev = {} }; mon_dirty = true end
if not mon.month then mon_reset(os.time()) end
local function bump(t, k, n) t[k] = (t[k] or 0) + (n or 1); mon_dirty = true end
--- called by extras.lua alert() for every alert (also when Discord is off)
function W.count(kind, title)
    if not mon.c then return end
    local t = tostring(title or "")
    if kind == "vpn" and t:find(" is down") then bump(mon.vpn, (t:match("🔴 (.-) is down") or "VPN")) end
    if t:find("Auto%-heal") or t:find("Restarted") or t:find("Renewed") or t:find("restarting") or t:find("Switched") then bump(mon.c, "fixes") end
    if kind == "newdev" then bump(mon.c, "newdev") end
    if kind == "security" and (t:find("failed") or t:find("leak")) then bump(mon.c, "security") end
    if kind == "login" and t:find("[Ff]ailed") then bump(mon.c, "badlogin") end
    if kind == "upload" then bump(mon.c, "upload") end
    if kind == "devwatch" and t:find("offline") then bump(mon.dev, (t:match("📴 (.-) is offline") or "device")) end
end
local function monthly_text(now, from_month)
    local m = from_month or mon
    local y, mo = (m.month or mon_month(now)):match("(%d+)-(%d+)")
    local t0 = os.time { year = tonumber(y), month = tonumber(mo), day = 1, hour = 0 }
    local t1 = os.time { year = tonumber(y) + (tonumber(mo) == 12 and 1 or 0), month = tonumber(mo) == 12 and 1 or tonumber(mo) + 1, day = 1, hour = 0 }
    local tend = math.min(t1, now)
    local fields = {}
    -- internet: outages logged by more.lua
    local outs = jread(EDIR .. "/outages.json", {}); local n, secs = 0, 0
    for _, o in ipairs(outs) do local s = o.start or o.t or 0; if s >= t0 and s < t1 then n = n + 1; secs = secs + math.max(0, (o["end"] or o.stop or s) - s) end end
    local up = 100 * (1 - secs / math.max(1, tend - t0))
    fields[#fields + 1] = { name = "🌐 Internet", value = string.format("%.3f%% uptime · %d outage%s%s", up, n, n == 1 and "" or "s", n > 0 and (" (" .. fmtdur(secs) .. " total)") or ""), inline = false }
    -- VPN stalls per tunnel (down events) + nightly speeds
    local vl = {}; for k, v in pairs(m.vpn or {}) do vl[#vl + 1] = k .. ": " .. v end; table.sort(vl)
    local hist = jread(EDIR .. "/speedtest-history.json", {}); local sp = {}
    for _, h in ipairs(hist) do if (h.time or 0) >= t0 and (h.time or 0) < t1 and h.scheduled and type(h.down) == "number" then
        local k = h.label or "?"; sp[k] = sp[k] or { s = 0, n = 0 }; sp[k].s = sp[k].s + h.down; sp[k].n = sp[k].n + 1 end end
    local sl = {}; for k, v in pairs(sp) do sl[#sl + 1] = string.format("%s ↓ %.0f Mbps avg (%d tests)", k, v.s / v.n, v.n) end; table.sort(sl)
    fields[#fields + 1] = { name = "🛡 VPN", value = (#vl > 0 and ("Drops: " .. table.concat(vl, " · ")) or "No VPN drops") .. (#sl > 0 and ("\n" .. table.concat(sl, "\n")) or ""), inline = false }
    -- data used this month (life.lua keeps the counter for the billing month)
    local lr = lrpc("machome", "life", { op = "get" }); local d = type(lr) == "table" and lr.data
    if type(d) == "table" and (d.rx or d.tx) then fields[#fields + 1] = { name = "📊 Data used", value = string.format("%.0f GB (↓ %.0f / ↑ %.0f GB)", ((d.rx or 0) + (d.tx or 0)) / 1e9, (d.rx or 0) / 1e9, (d.tx or 0) / 1e9), inline = true } end
    local c = m.c or {}
    fields[#fields + 1] = { name = "📱 Devices", value = string.format("%d new device%s", c.newdev or 0, (c.newdev or 0) == 1 and "" or "s") .. ((c.upload or 0) > 0 and string.format(" · %d unusual upload%s", c.upload, c.upload == 1 and "" or "s") or ""), inline = true }
    local dl = {}; for k, v in pairs(m.dev or {}) do dl[#dl + 1] = k .. " offline " .. v .. "×" end
    if #dl > 0 then fields[#fields + 1] = { name = "📴 Watched devices", value = table.concat(dl, " · "), inline = false } end
    fields[#fields + 1] = { name = "🔒 Security", value = string.format("%d security alert%s · %d failed sign-in%s", c.security or 0, (c.security or 0) == 1 and "" or "s", c.badlogin or 0, (c.badlogin or 0) == 1 and "" or "s"), inline = true }
    fields[#fields + 1] = { name = "🔧 Auto-fixes", value = tostring(c.fixes or 0), inline = true }
    return os.date("%B %Y", t0), fields
end
function W.monthly_preview() local name, fields = monthly_text(os.time()); return { ok = true, month = name, fields = fields } end
local function monthly_tick(now)
    if mon_dirty and now - mon_saved >= 600 then mon_saved = now; mon_dirty = false; writef(MON, cjson.encode(mon)) end
    local cur = mon_month(now)
    if mon.month ~= cur then
        -- month rolled over: send last month's summary (once), then start fresh
        local hr = tonumber(cfg("weekly_hour", 9)) or 9
        if os.date("*t", now).hour >= hr and st.monthly_sent ~= mon.month then
            local name, fields = monthly_text(now, mon)
            alert("monthly", "🗓 Monthly router report: " .. name, "Here's how your network did last month.", "blue", fields)
            st.monthly_sent = mon.month; save()
            mon_reset(now); writef(MON, cjson.encode(mon)); mon_saved = now
        end
    end
end

-- ================================================================ 1. Tailscale key expiry
local ts_t = 0
local function ts_expiry(now)
    if now - ts_t < 3600 then return end; ts_t = now
    local ok, js = pcall(cjson.decode, sh("tailscale status --json"))
    if not ok or type(js) ~= "table" or type(js.Self) ~= "table" then ui.ts_expiry = nil; return end
    local ke = js.Self.KeyExpiry
    if type(ke) ~= "string" then ui.ts_expiry = cjson.null; return end      -- key expiry disabled in the admin console
    local y, mo, d, h, mi, se = ke:match("(%d+)-(%d+)-(%d+)T(%d+):(%d+):(%d+)")
    if not y then return end
    local t = os.time { year = tonumber(y), month = tonumber(mo), day = tonumber(d), hour = tonumber(h), min = tonumber(mi), sec = tonumber(se) }
    t = t + (os.time() - os.time(os.date("!*t")))                          -- the string is UTC
    ui.ts_expiry = t
    local days = math.floor((t - now) / 86400)
    st.ts_marks = st.ts_marks or {}
    if st.ts_marks.key ~= ke then st.ts_marks = { key = ke } end           -- renewed key: start over
    for _, lim in ipairs({ 1, 7, 14 }) do
        if days <= lim and not st.ts_marks["d" .. lim] then
            st.ts_marks["d" .. lim] = true; save()
            alert("health", days <= 1 and "🔑 Tailscale key expires tomorrow" or ("🔑 Tailscale key expires in " .. days .. " days"),
                "This router's Tailscale key expires on **" .. os.date("%a %b %d", t) .. "**. After that, reaching home through Tailscale stops working until it's renewed. " ..
                "Fix: in the Tailscale admin console → Machines → this router → **Disable key expiry** (or re-authenticate it).", days <= 7 and "orange" or "blue")
            break
        end
    end
end

-- ================================================================ 2. watched devices (offline / back online)
local dv_t, dv_state = 0, {}
local function devwatch_cfg() local c = jread(DEVW, {}); c.devices = type(c.devices) == "table" and c.devices or {}; return c end
function W.devwatch_get() return devwatch_cfg() end
function W.devwatch_set(mac, on, name)
    mac = tostring(mac or ""):upper()
    if not mac:match("^%x%x:%x%x:%x%x:%x%x:%x%x:%x%x$") then return false, "bad MAC" end
    local c = devwatch_cfg(); c.seeded = true
    if on then c.devices[mac] = { name = tostring(name or ""):gsub("[%c<>\"`$\\]", ""):sub(1, 40) } else c.devices[mac] = nil end
    os.execute("mkdir -p " .. EDIR); writef(DEVW, cjson.encode(c))
    os.execute("touch " .. DIR .. "/devwatch_reload")
    return true
end
local function neigh() local t = {}; for ip, mac, stt in sh("ip -4 neigh show dev br-lan"):gmatch("(%d+%.%d+%.%d+%.%d+) lladdr (%S+) (%u+)") do t[mac:upper()] = { ip = ip, state = stt } end; return t end

-- ---------------- auto-heal: wake the NAS (switch nas_wake, 2026-11-14) ----------------
-- Wake-on-LAN magic packet to the LAN broadcast (same method as the Home tab's Wake button in life.lua).
local function wol(mac)
    local hex = tostring(mac or ""):gsub(":", ""); if #hex ~= 12 or not hex:match("^%x+$") then return false end
    local b = {}; for i = 1, 12, 2 do b[#b + 1] = string.char(tonumber(hex:sub(i, i + 1), 16)) end
    local pkt = string.rep(string.char(255), 6) .. string.rep(table.concat(b), 16)
    local brd = sh("ip -4 addr show br-lan"):match("brd (%d+%.%d+%.%d+%.%d+)") or "255.255.255.255"
    local okS, socket = pcall(require, "socket"); local sent = false
    if okS and socket and socket.udp then
        local u = socket.udp()
        if u then u:setoption("broadcast", true); for _, port in ipairs({ 9, 7 }) do if u:sendto(pkt, brd, port) then sent = true end end; u:close() end
    end
    return sent
end
-- the NAS = the NAS-backup host and the DNS server handed to devices (AdGuard on the NAS)
local function nas_ips()
    local t = {}
    local c = jread(EDIR .. "/nasbackup.json", {})
    if type(c.host) == "string" and c.host:match("^%d+%.%d+%.%d+%.%d+$") then t[c.host] = true end
    local dns = trim(sh("uci -q get dhcp.lan.dhcp_option")):match("6,(%d+%.%d+%.%d+%.%d+)"); if dns then t[dns] = true end
    return t
end
-- the NAS's MAC is remembered while it's online (a sleeping NAS drops out of the neighbor table)
local function learn_mac(ip, mac)
    if not ip or not mac then return end
    st.ipmac = st.ipmac or {}
    if st.ipmac[ip] ~= mac then st.ipmac[ip] = mac; save() end
end
--- ping ip; if it doesn't answer and its MAC is known, send Wake-on-LAN. true = a wake signal was sent
function W.wake_if_down(ip)
    if type(ip) ~= "string" or not ip:match("^%d+%.%d+%.%d+%.%d+$") then return false end
    if os.execute("ping -c 2 -W 2 " .. ip .. " >/dev/null 2>&1") == 0 then return false end
    local mac; for m, e in pairs(neigh()) do if e.ip == ip then mac = m end end
    mac = mac or (st.ipmac or {})[ip]
    if not mac or not wol(mac) then return false end
    os.execute("logger -t machome 'nas-wake: sent Wake-on-LAN to " .. ip .. "'")
    return true
end
local function devwatch(now)
    if now - dv_t < 60 then return end; dv_t = now
    if is_ap(now) then ui.devwatch = nil; return end                       -- the main router watches; APs don't double up
    local c = devwatch_cfg()
    if not c.seeded then
        -- first run: pre-select the NAS = the DNS server handed to devices (AdGuard on the NAS)
        local dns = (trim(sh("uci -q get dhcp.lan.dhcp_option")):match("6,(%d+%.%d+%.%d+%.%d+)"))
        local nb = neigh(); local found = nil
        if dns then for mac, e in pairs(nb) do if e.ip == dns then found = mac end end end
        if found then c.devices[found] = { name = "NAS" } end
        c.seeded = true; os.execute("mkdir -p " .. EDIR); writef(DEVW, cjson.encode(c))
    end
    if not next(c.devices) then ui.devwatch = {}; return end
    local nb = neigh()
    local leases = readf("/tmp/dhcp.leases") or ""            -- fallback for the IP
    local jobs = {}
    for mac, d in pairs(c.devices) do
        local ip = nb[mac] and nb[mac].ip or leases:match("%d+ " .. mac:lower():gsub("%p", "%%%0") .. " (%d+%.%d+%.%d+%.%d+)")
        jobs[#jobs + 1] = { mac = mac, name = (d.name ~= "" and d.name) or mac, ip = ip }
    end
    -- one ping each, in parallel; a device that ignores ping still counts as online if it answered ARP just now
    local parts = {}
    for i, j in ipairs(jobs) do if j.ip then parts[#parts + 1] = string.format("(ping -c 1 -W 2 %s >/dev/null 2>&1 && echo 1 > %s/dw_%d || echo 0 > %s/dw_%d) &", j.ip, DIR, i, DIR, i) end end
    if #parts > 0 then os.execute(table.concat(parts, " ") .. " wait") end
    local nb2 = neigh(); local out = {}
    local nasset = nas_ips()
    for i, j in ipairs(jobs) do
        local online = false
        if j.ip then
            online = trim(readf(DIR .. "/dw_" .. i) or "") == "1"; os.remove(DIR .. "/dw_" .. i)
            if not online and nb2[j.mac] and nb2[j.mac].state == "REACHABLE" then online = true end
        end
        local is_nas = (j.ip and nasset[j.ip]) or j.name == "NAS"
        local s = dv_state[j.mac] or { bad = 0, down = false }
        if online then
            if is_nas then learn_mac(j.ip, j.mac) end
            if s.down then alert("devwatch", "✅ " .. j.name .. " is back online", j.name .. " was offline for " .. fmtdur(now - (s.since or now)) .. (s.woke and " (it was sent a wake-up signal)" or "") .. ".", "green") end
            s = { bad = 0, down = false, seen = now }
        else
            s.bad = s.bad + 1
            if not s.down and s.bad >= 3 then
                s.down = true; s.since = now - 120
                -- auto-heal: a sleeping NAS can be woken (only works if Wake-on-LAN is on in the NAS's own settings)
                s.woke = is_nas and cfg("nas_wake", true) == true and wol(j.mac) or false
                if s.woke then os.execute("logger -t machome 'nas-wake: " .. j.name .. " offline, sent Wake-on-LAN'") end
                alert("devwatch", "📴 " .. j.name .. " is offline", j.name .. " hasn't answered on the network for 3 minutes" .. (j.ip and (" (last address " .. j.ip .. ")") or "") ..
                    ". Check its power and cable." .. (is_nas and " While the NAS is down, AdGuard (DNS) and NAS backups don't work." or "") ..
                    (s.woke and " Auto-heal sent it a Wake-on-LAN wake-up signal; that only helps if Wake-on-LAN is turned on in the NAS's own settings." or ""), "orange")
            end
        end
        dv_state[j.mac] = s
        out[j.mac] = { name = j.name, online = online, since = s.since or cjson.null, seen = s.seen or cjson.null }
    end
    ui.devwatch = out
end

-- ================================================================ 3. cable modem signal (Xfinity gateway)
local MODEM_HOST = "10.0.0.1"
local md_t = 0
local function urlenc(s) return (tostring(s):gsub("[^%w%-_%.~]", function(c) return string.format("%%%02X", c:byte()) end)) end
local function nums(seg, label, stops)
    local i = seg:find(label, 1, true); if not i then return {} end
    local rest = seg:sub(i + #label); local cut = #rest
    for _, s in ipairs(stops) do local j = rest:find(s, 1, true); if j and j < cut then cut = j end end
    local t = {}; for n in rest:sub(1, cut):gmatch("(%-?%d+%.?%d*)") do t[#t + 1] = tonumber(n) end
    return t
end
--- logs in to the gateway and reads its connection page; returns a summary table or nil, error
function W.modem_fetch()
    local c = jread(MODEM, {}); if not c.pass or c.pass == "" then return nil, "no password saved" end
    local jar, form = DIR .. "/mdm.cookies", DIR .. "/mdm.form"
    writef(form, "username=" .. urlenc(c.user or "admin") .. "&password=" .. urlenc(c.pass), true)
    os.remove(jar)
    local code = trim(sh("curl -s -m 8 -c " .. jar .. " -b " .. jar .. " -o /dev/null -w '%{http_code}' --data-binary @" .. form .. " http://" .. MODEM_HOST .. "/check.jst"))
    os.remove(form)
    local html = ""
    for _, p in ipairs({ "network_setup.jst", "connection_status.jst" }) do
        html = sh("curl -s -m 8 -b " .. jar .. " http://" .. MODEM_HOST .. "/" .. p)
        if html:find("Power Level", 1, true) or html:find("SNR", 1, true) then break end
    end
    sh("curl -s -m 8 -b " .. jar .. " -o /dev/null http://" .. MODEM_HOST .. "/home_loggedout.jst"); os.remove(jar)
    local txt = html:gsub("<script.-</script>", " "):gsub("<[^>]+>", " "):gsub("&nbsp;", " "):gsub("%s+", " ")
    if not txt:find("Power Level", 1, true) then
        if txt:find("[Pp]assword") then return nil, "the gateway didn't accept the login (HTTP " .. code .. ")" end
        return nil, "signal table not found on the gateway page"
    end
    -- XB10 (network_setup.jst): the first "Downstream"/"Upstream" words are the start-up checklist ("Downstream Channel:
    -- Complete", "Upstream Ranging: Complete"), so anchor on the tables' own "Channel Bonding Value" headers instead
    -- (1st = downstream, 2nd = upstream), then "CM Error Codewords". Older pages without those headers: old anchors.
    local b1 = txt:find("Channel Bonding Value", 1, true)
    local b2 = b1 and txt:find("Channel Bonding Value", b1 + 10, true)
    local ds_i, us_i
    if b1 and b2 then ds_i, us_i = b1, b2
    else
        ds_i = txt:find("Downstream", 1, true) or 1
        us_i = txt:find("Upstream", ds_i + 10, true) or #txt
    end
    local cw_i = txt:find("CM Error Codewords", us_i, true) or txt:find("Codewords", us_i, true) or txt:find("Error", us_i, true) or #txt
    local ds, us, cw = txt:sub(ds_i, us_i), txt:sub(us_i, cw_i), txt:sub(cw_i)
    local STOPS = { "Lock Status", "Frequency", "SNR", "Power Level", "Modulation", "Channel ID", "Symbol Rate", "Channel Type", "Upstream", "Index" }
    local function range(t) local lo, hi; for _, v in ipairs(t) do lo = lo and math.min(lo, v) or v; hi = hi and math.max(hi, v) or v end; return lo, hi end
    local dsp, snr, usp = nums(ds, "Power Level", STOPS), nums(ds, "SNR", STOPS), nums(us, "Power Level", STOPS)
    local unc = nums(cw, "Uncorrectable Codewords", { "Correctable", "Unerrored" })
    local out = { ok = true, t = os.time() }
    out.ds_n = #dsp; out.ds_min, out.ds_max = range(dsp); out.snr_min, out.snr_max = range(snr); out.us_n = #usp; out.us_min, out.us_max = range(usp)
    local u = 0; for _, v in ipairs(unc) do u = u + v end; out.uncorr = #unc > 0 and u or nil
    local cor = nums(cw, "Correctable Codewords", { "Uncorrectable", "Unerrored" })
    local cs = 0; for _, v in ipairs(cor) do cs = cs + v end; out.corr = #cor > 0 and cs or nil
    -- channels not locked (a locked channel reads "Locked"), OFDM / OFDMA (DOCSIS 3.1) channel counts
    local function count(s, pat) local n = 0; for _ in s:gmatch(pat) do n = n + 1 end; return n end
    out.ds_unlock = count(ds, "Not Locked"); out.us_unlock = count(us, "Not Locked")
    out.ds_ofdm = count(ds, "OFDM "); out.us_ofdma = count(us, "OFDMA")
    -- gateway model (not personal: e.g. "XB10", "Technicolor CGM601TCOM")
    out.product = txt:match("Product Type:%s*([%w%-%.]+)"); out.vendor = txt:match("Vendor:%s*([%w%-%.]+)"); out.model = txt:match("Model:%s*([%w%-%.]+)")
    -- gateway uptime (XB10 network_setup.jst: "System Uptime: 2 days 9h: 11m: 21s") -> seconds at read time out.t
    local ut = txt:match("[Uu]ptime:%s*([%w%s:]-%d+%s*s)")
    if ut then
        local d, h, m, s = tonumber(ut:match("(%d+)%s*day")) or 0, tonumber(ut:match("(%d+)%s*h")) or 0, tonumber(ut:match("(%d+)%s*m")) or 0, tonumber(ut:match("(%d+)%s*s")) or 0
        out.up_s = ((d * 24 + h) * 60 + m) * 60 + s
    end
    if out.ds_n == 0 and out.us_n == 0 then return nil, "signal values not found on the gateway page" end
    return out
end
function W.modem_set(a)
    if a.clear then os.remove(MODEM); os.remove(DIR .. "/modem.json"); return true end
    if type(a.pass) ~= "string" or a.pass == "" or #a.pass > 128 then return false, "enter the gateway's admin password" end
    os.execute("mkdir -p " .. EDIR); writef(MODEM, cjson.encode({ user = "admin", pass = a.pass }), true)
    return true
end
--- health against the usual DOCSIS ranges; sets r.issues (also used by rpc modem_test, so "Read now" shows them too)
function W.modem_check(r)
    local issues = {}
    if r.ds_min and r.ds_min < -10 then issues[#issues + 1] = string.format("downstream power low (%.1f dBmV; normal -7 to +7)", r.ds_min) end
    if r.ds_max and r.ds_max > 10 then issues[#issues + 1] = string.format("downstream power high (%.1f dBmV; normal -7 to +7)", r.ds_max) end
    if r.snr_min and r.snr_min < 33 then issues[#issues + 1] = string.format("signal-to-noise low (%.1f dB; normal 33+)", r.snr_min) end
    if r.us_max and r.us_max > 51 then issues[#issues + 1] = string.format("upstream power high (%.1f dBmV; normal 35-51)", r.us_max) end
    local unl = (r.ds_unlock or 0) + (r.us_unlock or 0)
    if unl > 0 then issues[#issues + 1] = string.format("%d channel%s not locked", unl, unl == 1 and "" or "s") end
    local prev = jread(DIR .. "/modem.json", {})
    if r.uncorr and prev.uncorr and r.uncorr - prev.uncorr > 5000 then issues[#issues + 1] = string.format("%d uncorrectable errors in the last hour", r.uncorr - prev.uncorr) end
    r.issues = issues
    return issues
end
local function modem_tick(now)
    if now - md_t < 3600 or is_ap(now) then return end
    local c = jread(MODEM, nil); if not c or not c.pass then return end
    md_t = now
    local r, err = W.modem_fetch()
    if not r then writef(DIR .. "/modem.json", cjson.encode({ ok = false, err = err, t = now })); return end
    local issues = W.modem_check(r)
    writef(DIR .. "/modem.json", cjson.encode(r))
    local bad = #issues > 0
    if bad and (not st.modem_bad or now - (st.modem_alert_t or 0) > 12 * 3600) then
        st.modem_bad = true; st.modem_alert_t = now; save()
        alert("health", "📡 Cable signal problem", "Your cable modem reports: " .. table.concat(issues, "; ") .. ". This usually comes before slowdowns or drops. Check the coax connections; if it keeps happening, Xfinity can check the line.", "orange")
    elseif not bad and st.modem_bad then
        st.modem_bad = false; save()
        alert("health", "📡 Cable signal back to normal", "Your cable modem's signal levels are back in the normal range.", "green")
    end
end

-- ================================================================ auto-heal: last-resort cable modem restart (2026-11-14)
-- OPT-IN (switch modem_restart; the Home tab shows two warnings before it can be turned on). Main routers with the
-- gateway password saved. Internet down 10 minutes (renewing the WAN was already tried at 3 min) + cable to the
-- gateway connected: the Home tab shows "Restarting the cable modem at HH:MM [Cancel]"; at 15 minutes the router
-- presses the gateway's own Restart button (XB10: restore_reboot.jst -> actionHandler/ajaxSet_Reset_Restore.jst with
-- resetInfo ["btn1","Device","admin"] + the page's csrfp_token; in bridge mode that's the only button = restart, NOT
-- a factory reset). At most once a day, never during a speed test or firmware upgrade. Reports the result.
local MRS_WARN, MRS_GO = 600, 900
local mrs = nil                -- { since = outage start, at = planned time, state = pending|cancelled|restarting|failed, t = restarted at }
--- dry = true: log in and check the Restart button + token are there, then log out. Nothing is restarted.
function W.modem_restart(dry)
    local c = jread(MODEM, {}); if not c.pass or c.pass == "" then return nil, "no gateway password saved (Settings → Cable modem)" end
    local jar, form, body = DIR .. "/mrs.cookies", DIR .. "/mrs.form", DIR .. "/mrs.body"
    writef(form, "username=" .. urlenc(c.user or "admin") .. "&password=" .. urlenc(c.pass), true)
    os.remove(jar)
    local code = trim(sh("curl -s -m 8 -c " .. jar .. " -b " .. jar .. " -o /dev/null -w '%{http_code}' --data-binary @" .. form .. " http://" .. MODEM_HOST .. "/check.jst"))
    os.remove(form)
    if code == "000" or code == "" then os.remove(jar); return nil, "the gateway at " .. MODEM_HOST .. " didn't answer" end
    local page = sh("curl -s -m 8 -b " .. jar .. " http://" .. MODEM_HOST .. "/restore_reboot.jst")
    local token = page:match('var token = "([%w%-_]+)"')
    local has_btn = page:find("ajaxSet_Reset_Restore.jst", 1, true) and page:find('new Array("btn1", "Device")', 1, true)
    local res, err
    if not token or not has_btn then
        -- a rejected login gets the short login page back instead of the ~48 KB troubleshooting page
        err = (#page < 5000) and ("the gateway didn't accept the login (HTTP " .. code .. ")") or "the gateway's Restart button wasn't found on its page"
    elseif dry then
        res = { ok = true, dry = true, msg = "Logged in to the gateway and found its Restart button. Nothing was restarted." }
    else
        writef(body, "resetInfo=" .. urlenc('["btn1","Device","' .. (c.user or "admin") .. '"]') .. "&csrfp_token=" .. urlenc(token), true)
        local rc = trim(sh("curl -s -m 15 -b " .. jar .. " -o /dev/null -w '%{http_code}' -H 'X-Requested-With: XMLHttpRequest' --data-binary @" .. body .. " http://" .. MODEM_HOST .. "/actionHandler/ajaxSet_Reset_Restore.jst"))
        os.remove(body)
        -- 000 = the gateway dropped the connection because it's already going down
        if rc == "200" or rc == "000" then res = { ok = true } else err = "the gateway answered HTTP " .. rc end
    end
    if not res or dry then sh("curl -s -m 8 -b " .. jar .. " -o /dev/null http://" .. MODEM_HOST .. "/home_loggedout.jst") end
    os.remove(jar)
    return res, err
end
local function mrs_tick(now)
    if mrs and mrs.state == "restarting" then
        -- waiting for the internet to come back after the restart
        if not (X and X.wan_since) then
            alert("health", "✅ Internet is back after restarting the cable modem", "The modem was restarted at " .. os.date("%I:%M %p", mrs.t) .. " (the internet had been down " .. fmtdur(mrs.t - mrs.since) ..
                "). The internet came back " .. fmtdur(now - mrs.t) .. " later.", "green")
            mrs = nil; ui.mrs = nil
        else
            if now - mrs.t >= 1200 and not mrs.noted then
                mrs.noted = true
                alert("health", "⚠️ Internet still down after restarting the cable modem", "The modem was restarted 20 minutes ago and the internet is still down, so it's most likely an Xfinity outage. Check the Xfinity app (it works over mobile data) or call Xfinity.", "red")
            end
            ui.mrs = { state = "restarting", t = mrs.t, since = mrs.since }
        end
        return
    end
    local since = X and X.wan_since
    if cfg("modem_restart", false) ~= true or is_ap(now) or not since or not readf(MODEM) then mrs = nil; ui.mrs = nil; return end
    if mrs and mrs.since ~= since then mrs = nil end                         -- a new outage
    if now - since < MRS_WARN then ui.mrs = nil; return end
    if not mrs then
        if st.mrs_t and now - st.mrs_t < 86400 then ui.mrs = { state = "limit", last = st.mrs_t, since = since }; return end   -- once a day
        mrs = { since = since, at = since + MRS_GO, state = "pending" }
        os.execute("logger -t machome 'modem-restart: internet down " .. (now - since) .. " s; restart planned at " .. os.date("%H:%M", mrs.at) .. " unless cancelled in the Home tab'")
    end
    -- "Cancel restart" in the Home tab writes the start time of the outage it cancels
    if tonumber(trim(readf(DIR .. "/mrs_cancel") or "")) == since and mrs.state == "pending" then
        mrs.state = "cancelled"; os.execute("logger -t machome 'modem-restart: cancelled from the Home tab'")
    end
    if mrs.state ~= "pending" then ui.mrs = { state = mrs.state, since = since, err = mrs.err }; return end
    ui.mrs = { state = "pending", at = mrs.at, since = since }
    if now < mrs.at then return end
    -- final checks right before acting
    local stt = jread(DIR .. "/speedtest.json", {})
    if stt.running or trim(sh("pidof sysupgrade")) ~= "" then mrs.at = now + 300; return end
    local dev = trim(sh("ubus call network.interface.wan status | jsonfilter -e '@.l3_device'"))
    if not dev:match("^[%w%._-]+$") or trim(readf("/sys/class/net/" .. dev .. "/carrier") or "") ~= "1" then
        mrs.state, mrs.err = "failed", "the cable from the router to the modem isn't connected"; return   -- nothing a modem restart can fix
    end
    st.mrs_t = now; save()
    local r, err = W.modem_restart(false)
    if r then
        mrs.state, mrs.t = "restarting", now
        os.execute("logger -t machome 'modem-restart: pressed Restart on the cable gateway'")
        alert("health", "🔌 Restarted the cable modem", "The internet was down for " .. fmtdur(now - since) .. " and renewing the connection didn't help, so auto-heal pressed Restart on the Xfinity gateway (last resort, at most once a day). It takes about 5-10 minutes to come back.", "orange")
        ui.mrs = { state = "restarting", t = now, since = since }
    else
        mrs.state, mrs.err = "failed", err
        alert("health", "⚠️ Couldn't restart the cable modem", "The internet has been down for " .. fmtdur(now - since) .. ", but restarting the modem didn't work: " .. tostring(err) .. ". Restart it by hand (unplug its power for 30 seconds).", "red")
        ui.mrs = { state = "failed", since = since, err = err }
    end
end

-- ================================================================ 6 + 8. Wi-Fi: week stats + band self-heal
local function wifi_bands()
    -- Master (AP) interfaces from iwinfo, by band
    local t = {}
    for blk in (sh("iwinfo") .. "\n"):gmatch("(%S+%s+ESSID:.-)\n\n") do
        local ifc = blk:match("^(%S+)"); local md = blk:match("Mode:%s*(%a+)"); local g = tonumber(blk:match("%(([%d%.]+) GHz%)"))
        if ifc and md == "Master" and g then local b = g < 3 and "2g" or (g < 5.9 and "5g" or "6g"); t[b] = t[b] or {}; t[b][#t[b] + 1] = ifc end
    end
    return t
end
local radio_bad, radio_heal_t, radio_t = {}, {}, 0
local function radio_heal(now)
    if now - radio_t < 60 or cfg("wifi_heal", true) == false then return end; radio_t = now
    local radios = {}
    for r in sh("uci -q show wireless"):gmatch("wireless%.([%w_]+)=wifi%-device") do
        if trim(sh("uci -q get wireless." .. r .. ".disabled")) ~= "1" then radios[#radios + 1] = { name = r, band = trim(sh("uci -q get wireless." .. r .. ".band")) } end
    end
    if #radios == 0 then return end
    local live = wifi_bands()
    for _, r in ipairs(radios) do
        local ok = false
        for _, ifc in ipairs(live[r.band] or {}) do if trim(readf("/sys/class/net/" .. ifc .. "/operstate") or "") == "up" then ok = true end end
        if ok then
            if radio_bad[r.name] and radio_bad[r.name] < 0 then alert("health", "📶 " .. r.band:upper() .. " Wi-Fi is working again", "The " .. r.band:gsub("g", " GHz") .. " band is back up.", "green") end
            radio_bad[r.name] = 0
        elseif (radio_bad[r.name] or 0) < 0 then
            -- restarted but still down: after 10 minutes start counting again (next restart only after 6 h)
            if now - (radio_heal_t[r.name] or 0) >= 600 then radio_bad[r.name] = 0 end
        else
            radio_bad[r.name] = (radio_bad[r.name] or 0) + 1
            if radio_bad[r.name] >= 3 then
                local bname = r.band:gsub("g", " GHz")
                if now - (radio_heal_t[r.name] or 0) >= 6 * 3600 then
                    radio_heal_t[r.name] = now; radio_bad[r.name] = -1      -- -1 = healing; "working again" message when it comes back
                    os.execute("logger -t machome 'wifi-heal: restarting " .. r.name .. " (" .. bname .. ")'; (wifi down " .. r.name .. "; sleep 3; wifi up " .. r.name .. ") >/dev/null 2>&1 &")
                    alert("health", "📶 Restarted the " .. bname .. " Wi-Fi", "The " .. bname .. " band was down or not answering for 3 minutes, so it was restarted once. Devices on it reconnect within about a minute.", "orange")
                elseif radio_bad[r.name] == 3 then
                    alert("health", "📶 " .. bname .. " Wi-Fi is down", "The " .. bname .. " band is down again (already restarted in the last 6 hours, so not restarting again yet). Restart the router if it stays down.", "red")
                end
            end
        end
    end
end
local wifi = jread(WIFI, {}); local wifi_t, wifi_hr, wifi_last_log = 0, 0, wifi.last_log or 0
local MON3 = { Jan = 1, Feb = 2, Mar = 3, Apr = 4, May = 5, Jun = 6, Jul = 7, Aug = 8, Sep = 9, Oct = 10, Nov = 11, Dec = 12 }
local function logtime(l) local mo, d, h, mi, s, y = l:match("^%a+ (%a+) +(%d+) (%d+):(%d+):(%d+) (%d+)"); if not y then return nil end
    return os.time { year = tonumber(y), month = MON3[mo] or 1, day = tonumber(d), hour = tonumber(h), min = tonumber(mi), sec = tonumber(s) } end
local function wifi_stats(now)
    if now - wifi_t < 600 then return end; wifi_t = now
    local live = wifi_bands(); if not next(live) then return end
    wifi.since = wifi.since or now; wifi.c = wifi.c or {}; wifi.kick = wifi.kick or {}; wifi.weak = wifi.weak or {}
    -- new log lines since last time: connects, drops, kicked for poor signal, radar
    local newest = wifi_last_log
    for l in sh("logread"):gmatch("[^\n]+") do
        local t = logtime(l)
        if t and t > wifi_last_log then
            newest = math.max(newest, t)
            if l:find("AP%-STA%-CONNECTED") or l:find("pairwise key handshake completed") then wifi.c.conn = (wifi.c.conn or 0) + 1
            elseif l:find("AP%-STA%-DISCONNECTED") or l:find("disassociated") then wifi.c.disc = (wifi.c.disc or 0) + 1 end
            if l:find("kicked out") then local mac = l:match("(%x%x:%x%x:%x%x:%x%x:%x%x:%x%x)"); if mac then wifi.kick[mac:upper()] = (wifi.kick[mac:upper()] or 0) + 1 end end
            if l:find("DFS%-RADAR") or l:lower():find("radar detected") then wifi.c.radar = (wifi.c.radar or 0) + 1 end
        end
    end
    wifi_last_log = newest; wifi.last_log = newest
    -- hourly: weak-signal devices
    if now - wifi_hr >= 3600 then
        wifi_hr = now
        for b, ifs in pairs(live) do for _, ifc in ipairs(ifs) do
            for mac, sig in sh("iwinfo " .. ifc .. " assoclist"):gmatch("(%x%x:%x%x:%x%x:%x%x:%x%x:%x%x)%s+(%-%d+) dBm") do
                sig = tonumber(sig)
                if sig and sig < -72 then local w = wifi.weak[mac:upper()] or { n = 0, worst = 0, band = b }; w.n = w.n + 1; w.worst = math.min(w.worst, sig); w.band = b; wifi.weak[mac:upper()] = w end
            end
        end end
        writef(WIFI, cjson.encode(wifi))
    end
end
--- extra lines for the weekly Wi-Fi report (health.lua); resets the week
function W.wifi_week_lines()
    if not wifi.since then return {} end
    local names = {}
    local cl = lrpc("clients", "get_list", {})
    for _, c in ipairs(type(cl) == "table" and (cl.clients or cl.list) or {}) do
        if c.mac then
            local nm = (type(c.alias) == "string" and c.alias ~= "") and c.alias or ((type(c.name) == "string" and c.name ~= "") and c.name or nil)
            names[tostring(c.mac):upper()] = nm or (type(c.ip) == "string" and c.ip ~= "" and ("device at " .. c.ip)) or nil
        end
    end
    setmetatable(names, { __index = function(_, mac) return "unnamed device (" .. tostring(mac):sub(-8) .. ")" end })   -- last 3 bytes only
    local out = {}
    local c = wifi.c or {}
    out[#out + 1] = string.format("**This week:** %d connects · %d disconnects%s.", c.conn or 0, c.disc or 0, (c.radar or 0) > 0 and string.format(" · ⚠ %d radar event%s (forced channel changes on DFS)", c.radar, c.radar == 1 and "" or "s") or " · no radar events")
    local wk = {}; for mac, w in pairs(wifi.weak or {}) do if w.n >= 3 then wk[#wk + 1] = { n = names[mac] or mac, w = w } end end
    table.sort(wk, function(a, b) return a.w.worst < b.w.worst end)
    if #wk > 0 then local t = {}; for i = 1, math.min(6, #wk) do t[#t + 1] = string.format("%s (%d dBm, %s)", wk[i].n, wk[i].w.worst, wk[i].w.band:gsub("g", " GHz")) end
        out[#out + 1] = "**Weak signal (often under -72 dBm):** " .. table.concat(t, ", ") .. ". Moving them closer, or the router higher up, helps." end
    local kk = {}; for mac, n in pairs(wifi.kick or {}) do kk[#kk + 1] = { n = names[mac] or mac, k = n } end
    table.sort(kk, function(a, b) return a.k > b.k end)
    if #kk > 0 then local t = {}; for i = 1, math.min(6, #kk) do t[#t + 1] = kk[i].n .. " ×" .. kk[i].k end
        out[#out + 1] = "**Dropped for a poor connection (too many retries):** " .. table.concat(t, ", ") .. "." end
    wifi = { since = os.time(), last_log = wifi_last_log, c = {}, kick = {}, weak = {} }; writef(WIFI, cjson.encode(wifi))
    return out
end

-- ================================================================ 10. bad VPN server: suggestion / optional switch
local vdowns = {}                                  -- via -> { times }
--- called by extras.lua when a tunnel is turned off, removed, switched to another server, or "Clear all VPN alerts"
function W.vpn_forget(via) vdowns[via] = nil end
--- called by extras.lua when a tunnel goes down (once per outage)
function W.vpn_down(via, label, peer)
    local now = os.time()
    local t = vdowns[via] or {}; t[#t + 1] = now
    local keep = {}; for _, x in ipairs(t) do if now - x <= 7200 then keep[#keep + 1] = x end end
    vdowns[via] = keep
    if #keep < 4 then return end
    st.vsug = st.vsug or {}
    if now - (st.vsug[via] or 0) < 6 * 3600 then return end
    st.vsug[via] = now; save()
    local switched, nextname = false, nil
    if cfg("vpn_switch", false) == true then
        -- opt-in: rotate this tunnel's own server list (only servers the owner already added to it)
        local all = lrpc("vpn-client", "get_tunnel", {})
        for _, tn in ipairs(type(all) == "table" and all.tunnels or {}) do
            local v = type(tn.via) == "table" and tn.via or {}
            local cfgs = type(v.configs) == "table" and v.configs[1] or nil
            if v.via == via and cfgs and type(cfgs.id_list) == "table" and #cfgs.id_list >= 2 then
                local first = table.remove(cfgs.id_list, 1); cfgs.id_list[#cfgs.id_list + 1] = first
                local r = lrpc("vpn-client", "set_tunnel", tn)
                if r ~= nil then
                    switched = true
                    -- server name from the saved list (WireGuard peers and OpenVPN servers, names only)
                    local pv = lrpc("machome", "get_vpn_providers", {})
                    for _, s in ipairs(type(pv) == "table" and type(pv.servers) == "table" and pv.servers or {}) do
                        if tostring(s.peer_id) == tostring(cfgs.id_list[1]) and (s.kind or "wireguard") == (v.type or "wireguard") then nextname = s.name end
                    end
                    os.execute("logger -t machome 'vpn-switch: " .. via .. " rotated to server " .. tostring(cfgs.id_list[1]) .. "'")
                end
            end
        end
    end
    if switched then
        alert("vpn", "🔄 Switched " .. label .. " to another server", label .. " (" .. tostring(peer or "?") .. ") stalled " .. #keep .. " times in 2 hours, so it was moved to the next server on that tunnel" ..
            (nextname ~= "" and nextname and (": **" .. nextname .. "**") or "") .. ". (Auto-switch is on in Settings → Auto-heal.)", "orange")
    else
        alert("vpn", "💡 " .. label .. " keeps stalling", label .. " (" .. tostring(peer or "?") .. ") went down " .. #keep .. " times in the last 2 hours. Its server may be having trouble: try another server for this tunnel in GL's VPN page" ..
            (cfg("vpn_switch", false) == true and " (auto-switch is on, but this tunnel has only one server saved)." or ", or turn on auto-switch in Settings → Auto-heal."), "orange")
    end
end

-- ================================================================ tick
function W.tick(now, x)
    X = x
    local r = io.open(DIR .. "/devwatch_reload", "r"); if r then r:close(); os.remove(DIR .. "/devwatch_reload"); dv_t = 0 end
    local mn = io.open(DIR .. "/modem_now", "r"); if mn then mn:close(); os.remove(DIR .. "/modem_now"); md_t = 0 end   -- password just saved
    pcall(monthly_tick, now)
    pcall(ts_expiry, now)
    pcall(devwatch, now)
    pcall(modem_tick, now)
    pcall(mrs_tick, now)
    pcall(radio_heal, now)
    pcall(wifi_stats, now)
    if now - (ui.t or 0) >= 30 then ui.t = now; writef(UI, cjson.encode(ui)) end
end

return W
