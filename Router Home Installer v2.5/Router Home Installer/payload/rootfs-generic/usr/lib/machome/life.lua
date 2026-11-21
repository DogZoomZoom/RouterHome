-- machome "life" features, shared by every router. Loaded by extras.lua (L.tick every ~10 s) and by the RPC
-- module (L.rpc(args) via machome.life). Everything is pcall-wrapped by the callers.
--   * device schedules (pause internet in a time window, e.g. bedtime)   * who's home (presence from phones)
--   * monthly data usage with optional cap                               * Wake-on-LAN
--   * speed-test history for charts                                      * AdGuard (NAS) blocks per device
local cjson = require "cjson"
local L = {}
local DIR, EDIR = "/tmp/machome", "/etc/machome"
local CFG = EDIR .. "/life.json"            -- schedules, people, wake list, data-cap settings
local USE = EDIR .. "/data-usage.json"      -- monthly WAN byte totals (written every 15 min)
local SPAUSE = EDIR .. "/sched-paused.json" -- devices WE paused by schedule (so we only ever unpause our own)

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s, private)
    local t = p .. ".tmp"; local f = io.open(t, "w"); if not f then return end; f:write(s); f:close()
    if private then os.execute("chmod 600 " .. t) end; os.rename(t, p)
end
local function trim(s) return s and (s:gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jread(p, d) local s = readf(p); if not s or s == "" then return d end; local ok, v = pcall(cjson.decode, s); if ok and type(v) == "table" then return v end; return d end
local function enc(t) local ok, s = pcall(cjson.encode, t); return ok and s or "{}" end
local function lrpc(obj, method, params)
    local f = DIR .. "/lrpc_life.json"
    writef(f, enc({ jsonrpc = "2.0", id = 1, method = "call", params = { "", obj, method, params or {} } }))
    local out = sh("curl -s -m 25 -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @" .. f .. " http://127.0.0.1/rpc")
    local ok, v = pcall(cjson.decode, out); if ok and type(v) == "table" then return v.result end
end
local function MAC(m) m = tostring(m or ""):upper(); return m:match("^%x%x:%x%x:%x%x:%x%x:%x%x:%x%x$") and m or nil end
local function clean(s, n) s = trim(tostring(s or "")):gsub("[%c<>\"`$\\]", ""); return s:sub(1, n or 40) end
local function apmode() return trim(sh("uci -q get glconfig.general.mode")) == "ap" end

local function cfg() local c = jread(CFG, {}); c.schedules = c.schedules or {}; c.people = c.people or {}; c.wake = c.wake or {}; c.data = c.data or {}; return c end
local function save(c) writef(CFG, enc(c)) end
local function clients()
    local r = lrpc("clients", "get_list", {}) or {}
    local a = r.clients or r.list or {}; if type(a) ~= "table" then a = {} end
    local by = {}; for _, c in ipairs(a) do local m = MAC(c.mac); if m then by[m] = c end end
    return by
end
local function cname(c, m) return (c and (c.alias ~= "" and c.alias or c.name)) or m end

-- ============================================================== schedules
-- schedule = { name, days = "0123456" (0 = Sunday, the day the window STARTS), from = "22:00", to = "07:00", on = true }
local function mins(hm) local h, m = tostring(hm or ""):match("^(%d%d?):(%d%d)$"); h, m = tonumber(h), tonumber(m); if not h or h > 23 or m > 59 then return nil end; return h * 60 + m end
local function in_window(s, t)
    local a, b = mins(s.from), mins(s.to); if not a or not b or a == b then return false end
    local now = t.hour * 60 + t.min
    local today, yday = tostring(t.wday - 1), tostring((t.wday + 5) % 7)
    local days = tostring(s.days or "")
    if a < b then return days:find(today, 1, true) ~= nil and now >= a and now < b end
    -- overnight window: started today (now >= from) or started yesterday (now < to)
    return (days:find(today, 1, true) ~= nil and now >= a) or (days:find(yday, 1, true) ~= nil and now < b)
end
local function more() local ok, P = pcall(dofile, "/usr/lib/machome/more.lua"); return ok and P or nil end
local function sched_tick(now, X, cl)
    local c = cfg(); local paused = jread(SPAUSE, {}); local changed = false
    local t = os.date("*t", now); local P = nil
    for mac, s in pairs(c.schedules) do
        local want = s.on ~= false and in_window(s, t)
        if want and not paused[mac] then
            P = P or more(); if not P then return end
            local cc = cl[mac]; local ok = P.pause(mac, true, cc and cc.ip, lrpc)
            if ok then paused[mac] = now; changed = true
                X.alert("schedule", "🌙 " .. cname(cc, s.name or mac) .. " paused by schedule", "Internet paused until " .. tostring(s.to) .. " (schedule " .. tostring(s.from) .. "–" .. tostring(s.to) .. ").", "blue") end
        elseif not want and paused[mac] then
            P = P or more(); if not P then return end
            local cc = cl[mac]; local ok = P.pause(mac, false, cc and cc.ip, lrpc)
            if ok then paused[mac] = nil; changed = true
                X.alert("schedule", "☀️ " .. cname(cc, s.name or mac) .. " back online", "The scheduled pause ended at " .. tostring(s.to) .. ".", "green") end
        end
    end
    -- schedules deleted while a device was paused by them: give the device its internet back
    for mac in pairs(paused) do
        if not c.schedules[mac] then P = P or more(); local cc = cl[mac]; if P and P.pause(mac, false, cc and cc.ip, lrpc) then paused[mac] = nil; changed = true end end
    end
    if changed then writef(SPAUSE, enc(paused)) end
end

-- ============================================================== who's home
local pres = jread(DIR .. "/presence.json", {})   -- mac -> { home = bool, since = t, last = t }
local pres_ready = false
local function pres_tick(now, X, cl)
    local c = cfg(); local changed = false
    for mac, person in pairs(c.people) do
        local cc = cl[mac]; local on = cc and (cc.online == true or cc.online == 1)
        local p = pres[mac] or { home = on and true or false, since = now, last = on and now or 0 }
        if on then p.last = now end
        local home = on or (p.last > 0 and now - p.last < 600)        -- away only after 10 min unseen (phones nap)
        if home ~= p.home then
            p.home, p.since = home, now; changed = true
            if pres_ready then X.alert("presence", (home and "🏠 " or "👋 ") .. person .. (home and " is home" or " left"), home and ("Arrived at " .. os.date("%I:%M %p", now) .. ".") or ("Left around " .. os.date("%I:%M %p", p.last > 0 and p.last or now) .. "."), home and "green" or "blue") end
        end
        pres[mac] = p
    end
    for mac in pairs(pres) do if not c.people[mac] then pres[mac] = nil; changed = true end end
    pres_ready = true
    writef(DIR .. "/presence.json", enc(pres))
end

-- ============================================================== monthly data usage (WAN)
local function wan_dev()
    local d = sh("ip -4 route show default"):match("dev (%S+)")
    if d and not d:match("^wg") then return d end
    d = trim(sh("uci -q get network.wan.device")); if d == "" then d = trim(sh("uci -q get network.wan.ifname")) end
    return d ~= "" and d or "eth1"
end
local function cycle_start(now, day)
    day = math.max(1, math.min(28, tonumber(day) or 1)); local t = os.date("*t", now)
    local y, m = t.year, t.month; if t.day < day then m = m - 1; if m == 0 then m, y = 12, y - 1 end end
    return os.time({ year = y, month = m, day = day, hour = 0 }), string.format("%04d-%02d-%02d", y, m, day)
end
local use = jread(USE, {}); local use_t = os.time(); local data_alerted = jread(DIR .. "/data-alert.json", {})
local function data_tick(now, X)
    if apmode() then return end
    local c = cfg(); local _, cid = cycle_start(now, c.data.start_day)
    if use.cycle ~= cid then use = { cycle = cid, rx = 0, tx = 0, days = {}, last = use.last }; data_alerted = {} end
    local dev = wan_dev()
    local rx = tonumber(trim(readf("/sys/class/net/" .. dev .. "/statistics/rx_bytes") or "")) or 0
    local tx = tonumber(trim(readf("/sys/class/net/" .. dev .. "/statistics/tx_bytes") or "")) or 0
    local last = use.last
    if last and last.dev == dev then
        local drx, dtx = rx - (last.rx or 0), tx - (last.tx or 0)
        if drx < 0 then drx = rx end; if dtx < 0 then dtx = tx end        -- counter reset (reboot)
        local d = os.date("%m-%d", now); use.days[d] = use.days[d] or { 0, 0 }
        use.days[d][1] = use.days[d][1] + drx; use.days[d][2] = use.days[d][2] + dtx
        use.rx = (use.rx or 0) + drx; use.tx = (use.tx or 0) + dtx
    end
    use.last = { dev = dev, rx = rx, tx = tx }
    if now - use_t >= 900 then use_t = now; writef(USE, enc(use)) end
    -- cap alerts at 80 % and 100 %
    local cap = tonumber(c.data.cap_gb) or 0
    if not c.data.unlimited and cap > 0 then
        local used = ((use.rx or 0) + (use.tx or 0)) / 1e9
        for _, lvl in ipairs({ 100, 80 }) do
            if used >= cap * lvl / 100 and not data_alerted[tostring(lvl)] then
                data_alerted[tostring(lvl)] = true; writef(DIR .. "/data-alert.json", enc(data_alerted))
                X.alert("data", lvl == 100 and "📶 Data cap reached" or "📶 80% of your data cap used",
                    string.format("%.0f GB of %d GB used this billing month (since %s).", used, cap, use.cycle), lvl == 100 and "red" or "orange")
                break
            end
        end
    end
end

-- ============================================================== tick (called every ~10 s; work once a minute)
local t_min, t_adb = 0, 0
function L.tick(now, X)
    if now - t_min < 60 then return end
    t_min = now
    local cl = clients()
    pcall(sched_tick, now, X, cl)
    pcall(pres_tick, now, X, cl)
    pcall(data_tick, now, X)
    -- adblock_refresh is defined further down the file, so call it through the module table (set below)
    if now - t_adb >= 300 then t_adb = now; if L.adblock_refresh then pcall(L.adblock_refresh) end end
end

-- ============================================================== Wake-on-LAN
local function wake(mac)
    local hex = mac:gsub(":", "")
    local bytes = {}; for i = 1, 12, 2 do bytes[#bytes + 1] = string.char(tonumber(hex:sub(i, i + 1), 16)) end
    local pkt = string.rep(string.char(255), 6) .. string.rep(table.concat(bytes), 16)
    local brd = sh("ip -4 addr show br-lan"):match("brd (%d+%.%d+%.%d+%.%d+)") or "255.255.255.255"
    local okS, socket = pcall(require, "socket")
    local sent = false
    if okS and socket and socket.udp then
        local u = socket.udp()
        if u then u:setoption("broadcast", true); for _, port in ipairs({ 9, 7 }) do if u:sendto(pkt, brd, port) then sent = true end end; u:close() end
    end
    if trim(sh("command -v etherwake")) ~= "" then os.execute("etherwake -i br-lan " .. mac .. " >/dev/null 2>&1"); sent = true end
    return sent
end

-- ============================================================== AdGuard on the NAS: blocked queries per device
-- runs in the BACKGROUND (sampler) every 5 min; the RPC only reads the cached result (never block nginx)
local function adblock_refresh()
    local a = jread(EDIR .. "/nas-adguard.json", {})
    if (a.url or "") == "" then writef(DIR .. "/adblock.json", enc({ ok = false, t = os.time(), err = "AdGuard on the NAS isn't connected (Control Center > AdGuard on my NAS)." })); return end
    local k = DIR .. "/adb.k"
    writef(k, 'user = "' .. tostring(a.user or ""):gsub('\\', '\\\\'):gsub('"', '\\"') .. ":" .. tostring(a.pass or ""):gsub('\\', '\\\\'):gsub('"', '\\"') .. '"\n', true)
    local out = sh("curl -s -k -m 15 -K " .. k .. " '" .. tostring(a.url):gsub("'", "") .. "/control/querylog?limit=500&response_status=blocked'")
    os.remove(k)
    local ok, j = pcall(cjson.decode, out)
    if not ok or type(j) ~= "table" or type(j.data) ~= "table" then writef(DIR .. "/adblock.json", enc({ ok = false, t = os.time(), err = "Couldn't read AdGuard's query log (is it turned on in AdGuard > Settings > General?)." })); return end
    local cnt, total = {}, 0
    for _, e in ipairs(j.data) do local ip = tostring(e.client or ""); if ip ~= "" then cnt[ip] = (cnt[ip] or 0) + 1; total = total + 1 end end
    local list = {}
    for ip, n in pairs(cnt) do list[#list + 1] = { ip = ip, n = n } end      -- the browser maps IPs to device names
    table.sort(list, function(x, y) return x.n > y.n end)
    while #list > 10 do table.remove(list) end
    writef(DIR .. "/adblock.json", enc({ ok = true, t = os.time(), total = total, list = list, since = j.oldest and tostring(j.oldest) or cjson.null }))
end
L.adblock_refresh = adblock_refresh

-- ============================================================== RPC
function L.rpc(a)
    a = a or {}; local op = tostring(a.op or "get")
    local c = cfg()
    if op == "get" then
        local paused = jread(SPAUSE, {})
        local data = nil
        if not apmode() then
            local u = jread(USE, {}); local live = use.cycle and use or u
            data = { rx = live.rx or 0, tx = live.tx or 0, days = live.days or {}, cycle = live.cycle, cap_gb = tonumber(c.data.cap_gb) or 0,
                     unlimited = c.data.unlimited == true or not tonumber(c.data.cap_gb), start_day = tonumber(c.data.start_day) or 1 }
        end
        return { ok = true, ap = apmode(), schedules = c.schedules, sched_paused = paused, people = c.people,
                 presence = jread(DIR .. "/presence.json", {}), wake = c.wake, data = data or cjson.null, now = os.time() }
    elseif op == "set_schedule" then
        local mac = MAC(a.mac); if not mac then return { ok = false, err = "Invalid device" } end
        if a.on == false and a.del == true then c.schedules[mac] = nil
        else
            if not mins(a.from) or not mins(a.to) then return { ok = false, err = "Times must look like 22:00" } end
            local days = tostring(a.days or ""):gsub("[^0-6]", ""); if days == "" then return { ok = false, err = "Pick at least one day" } end
            c.schedules[mac] = { name = clean(a.name), days = days, from = a.from, to = a.to, on = a.on ~= false }
        end
        save(c); return { ok = true }
    elseif op == "set_person" then
        local mac = MAC(a.mac); if not mac then return { ok = false, err = "Invalid device" } end
        local p = clean(a.person, 24); c.people[mac] = p ~= "" and p or nil; save(c); return { ok = true }
    elseif op == "set_wake" then
        local mac = MAC(a.mac); if not mac then return { ok = false, err = "Invalid device" } end
        c.wake[mac] = a.on and (clean(a.name) ~= "" and clean(a.name) or mac) or nil; save(c); return { ok = true }
    elseif op == "wake" then
        local mac = MAC(a.mac); if not mac then return { ok = false, err = "Invalid device" } end
        return { ok = wake(mac), err = "Couldn't send the wake packet" }
    elseif op == "set_data" then
        c.data = { cap_gb = math.max(0, math.min(100000, math.floor(tonumber(a.cap_gb) or 0))), unlimited = a.unlimited == true,
                   start_day = math.max(1, math.min(28, math.floor(tonumber(a.start_day) or 1))) }
        save(c); return { ok = true }
    elseif op == "speedhist" then
        local h = jread(EDIR .. "/speedtest-history.json", {}); local out = {}
        for i = math.max(1, #h - 400), #h do local r = h[i]
            if type(r.down) == "number" then out[#out + 1] = { t = r.time, l = r.label, d = math.floor(r.down + 0.5), u = type(r.up) == "number" and math.floor(r.up + 0.5) or cjson.null } end end
        return { ok = true, list = out }
    elseif op == "adblock" then
        return jread(DIR .. "/adblock.json", { ok = false, err = "Collecting… (first results within 5 minutes)" })
    end
    return { ok = false, err = "unknown op" }
end
return L
