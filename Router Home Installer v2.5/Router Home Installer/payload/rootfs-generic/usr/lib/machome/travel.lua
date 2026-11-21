-- machome travel: features for travel routers (Slate etc.). Shared code, but it only does anything on a travel
-- model or when the internet comes in over Wi-Fi (repeater) or USB tethering. Read-only: it never changes settings.
--   * hotel sign-in page (captive portal) detection, with the sign-in link for the Home tab
--   * "Is this network safe?" check when a network is joined (and on demand)
--   * report card per network: signal, ping, loss, drops, speed, data used, grade
--   * home check over Tailscale (ping to the home router)
--   * data used per network per day, with an optional daily limit warning
--   (a travel line on the touchscreen was tried and removed 2026-11-12: too small to read; the screen is weather only)
-- Called from extras.lua every sampler tick (~10 s) as T.tick(now, X, wanping); every entry point is pcall'ed there.
local cjson = require "cjson"
local T = {}
local DIR, EDIR = "/tmp/machome", "/etc/machome"
local STATE = DIR .. "/travel.json"          -- live state for the Home tab
local SAFE = DIR .. "/travel_safety.json"    -- last safety check (background job)
local NETS = EDIR .. "/networks.json"         -- report cards (flash: written on network change + every 10 min, a few KB)
local CFGF = EDIR .. "/travel.json"           -- settings: limit_gb, home_ip, screen_line

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local t = p .. ".tmp"; local f = io.open(t, "w"); if not f then return end; f:write(s); f:close(); os.rename(t, p) end
local function trim(s) return s and (s:gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jread(p, d) local s = readf(p); if not s or s == "" then return d end; local ok, v = pcall(cjson.decode, s); if ok and type(v) == "table" then return v end; return d end
local function q(s) return "'" .. tostring(s):gsub("'", "'\\''") .. "'" end
local function gb(b) return string.format("%.1f GB", (b or 0) / 1e9) end
T._job = false               -- true inside the background safety job (separate temp file from the sampler)
local function lrpc(obj, method, params)
    local f = DIR .. (T._job and "/trpc_job.json" or "/trpc.json")
    writef(f, cjson.encode({ jsonrpc = "2.0", id = 1, method = "call", params = { "", obj, method, params or {} } }))
    local out = sh("curl -s -m 15 -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @" .. f .. " http://127.0.0.1/rpc")
    local ok, v = pcall(cjson.decode, out)
    if ok and type(v) == "table" then return v.result end
end

function T.cfg()
    local c = jread(CFGF, {})
    return { limit_gb = tonumber(c.limit_gb) or 0, home_ip = c.home_ip }
end
function T.set_cfg(a)
    local c = T.cfg()
    if a.limit_gb ~= nil then local v = tonumber(a.limit_gb); if not v or v < 0 or v > 1000 then return false, "limit must be 0-1000 GB" end; c.limit_gb = v end
    if a.home_ip ~= nil then
        local ip = tostring(a.home_ip)
        if ip ~= "" and not ip:match("^100%.%d+%.%d+%.%d+$") and not ip:match("^fd7a:") then return false, "pick a Tailscale address" end
        c.home_ip = ip ~= "" and ip or nil
    end
    os.execute("mkdir -p " .. EDIR); writef(CFGF, cjson.encode(c))
    return true
end

-- ---------------------------------------------------------------- which uplink is in use
local TRAVEL_MODEL = nil
local function travel_model()
    if TRAVEL_MODEL == nil then
        local m = (readf("/tmp/sysinfo/model") or "") .. " " .. (readf("/tmp/sysinfo/board_name") or "")
        TRAVEL_MODEL = m:lower():match("slate") ~= nil or m:lower():match("beryl") ~= nil or m:lower():match("mango") ~= nil or m:lower():match("opal") ~= nil
            or m:lower():match("be10000") ~= nil or m:lower():match("be3600") ~= nil or m:lower():match("mt3000") ~= nil or m:lower():match("axt1800") ~= nil
            or m:lower():match("puli") ~= nil or m:lower():match("xe300") ~= nil or m:lower():match("e750") ~= nil
    end
    return TRAVEL_MODEL
end
local function iface_dev(name)
    local s = sh("ubus call network.interface." .. name .. " status")
    local ok, v = pcall(cjson.decode, s)
    if ok and type(v) == "table" and v.up then return v.l3_device or v.device end
end
--- { kind = "wifi"|"tether"|"wired"|"cellular", dev, key, name, sec } or nil (no travel uplink)
local up_cache, up_cache_t, up_cache_dev = nil, 0, nil
local function uplink_raw(dev)
    local wdev = iface_dev("wwan")
    if wdev and wdev == dev then
        local r = lrpc("repeater", "get_status", {}) or {}
        local w = type(r.wpa_status) == "table" and r.wpa_status or {}
        local ssid = w.ssid or r.ssid
        if not ssid or ssid == "" then return { kind = "wifi", dev = dev, key = "wifi:?", name = "Wi-Fi" } end
        local km = tostring(w.key_mgmt or ""):upper()
        local sec = km:match("8021X") and "Enterprise" or km:match("EAP") and "Enterprise" or km:match("SAE") and "WPA3" or km:match("PSK") and "WPA2" or (km == "NONE" and "Open") or (km ~= "" and km or nil)
        return { kind = "wifi", dev = dev, key = "wifi:" .. ssid, name = ssid, sec = sec, bssid = w.bssid }
    end
    local tdev = iface_dev("tethering")
    if tdev and tdev == dev then return { kind = "tether", dev = dev, key = "tether", name = "Phone (USB tethering)", sec = "Cable" } end
    for _, i in ipairs({ "modem_1_1", "modem_0001", "modem_1_1_2" }) do
        local mdev = iface_dev(i); if mdev and mdev == dev then return { kind = "cellular", dev = dev, key = "cellular", name = "Cellular", sec = "Cellular" } end
    end
    if not travel_model() then return nil end                -- home routers on a cable: nothing to do
    local wan = iface_dev("wan")
    if wan and wan == dev then return { kind = "wired", dev = dev, key = "wired", name = "Wired (Ethernet)", sec = "Cable" } end
    return nil
end
-- the default route is checked every call (cheap); GL's repeater status only when it changed or once a minute
local function uplink()
    local dev = sh("ip -4 route show default | head -1"):match(" dev (%S+)")
    if not dev then up_cache, up_cache_dev = nil, nil; return nil end
    local now = os.time()
    if T._job or dev ~= up_cache_dev or now - up_cache_t >= 60 then
        up_cache = uplink_raw(dev); up_cache_dev = dev; up_cache_t = now
    end
    return up_cache
end
local function devbytes(dev)
    local l = (readf("/proc/net/dev") or ""):match("\n%s*" .. dev:gsub("%-", "%%-"):gsub("%.", "%%.") .. ":%s*([^\n]+)")
    if not l then return nil end
    local f = {}; for n in l:gmatch("%d+") do f[#f + 1] = tonumber(n) end
    return (f[1] or 0) + (f[9] or 0)
end

-- ---------------------------------------------------------------- hotel sign-in page (captive portal)
local function portal_check(dev)
    local f = DIR .. "/portal.html"
    local out = sh("curl -s -m 6 --interface " .. dev .. " -o " .. f .. " -w '%{http_code} %{redirect_url}' http://connectivitycheck.gstatic.com/generate_204")
    local code, red = out:match("^(%d+)%s*(%S*)")
    local body = readf(f) or ""; os.remove(f)
    if code == "204" then return "ok" end
    if not code or code == "000" then
        -- nothing came back at all: check a second site before calling it "no internet"
        local c2 = trim(sh("curl -s -m 6 --interface " .. dev .. " -o /dev/null -w '%{http_code}' http://captive.apple.com/hotspot-detect.html"))
        if c2 == "200" then return "ok" end
        return "offline"
    end
    local url = (red ~= "" and red) or body:match("[Uu][Rr][Ll]=['\"]?(https?://[^'\" >]+)") or body:match("location%.href%s*=%s*['\"](https?://[^'\"]+)")
        or body:match("window%.location%s*=%s*['\"](https?://[^'\"]+)") or body:match("href=['\"](https?://[^'\"]+)")
    if url and #url > 600 then url = url:sub(1, 600) end
    return "portal", url
end

-- ---------------------------------------------------------------- "is this network safe?" (background job, ~10 s)
function T.safety_job()
    T._job = true
    local up = uplink()
    local checks = {}
    local function add(ok, title, detail) checks[#checks + 1] = { ok = ok, title = title, detail = detail } end
    if not up then writef(SAFE, cjson.encode({ t = os.time(), none = true, checks = {} })); return end
    -- 1. Wi-Fi encryption of the network we joined
    if up.kind == "wifi" then
        if up.sec == "Open" then add(false, "Open Wi-Fi (no password)", "Anyone nearby can read traffic that isn't encrypted by the website or app itself. Use a VPN on networks like this.")
        elseif up.sec == "Enterprise" then add(true, "Encrypted Wi-Fi (business login)", "Each user has their own login, so other guests can't read your Wi-Fi traffic.")
        else add(true, "Encrypted Wi-Fi (" .. tostring(up.sec or "password") .. ")", "Other guests who know the password are on the same network, but they can't reach your devices behind this router.") end
    else add(true, "Connected by " .. (up.kind == "tether" and "your phone" or up.kind == "cellular" and "cellular" or "cable"), "Not a shared Wi-Fi network.") end
    -- 2. this router can't be reached from the network it's on (firewall: wan zone drops/rejects incoming)
    local fw = sh("uci -q show firewall | grep -E \"@zone\\[[0-9]+\\]\\.(name|input|network)=\"")
    local zin, znet, idx = nil, nil, nil
    for i, nm in fw:gmatch("@zone%[(%d+)%]%.name='?([%w_]+)'?") do if nm == "wan" then idx = i end end
    if idx then
        zin = fw:match("@zone%[" .. idx .. "%]%.input='?(%u+)'?")
        znet = fw:match("@zone%[" .. idx .. "%]%.network='?([^\n]+)") or ""
    end
    local inzone = up.kind ~= "wifi" or (znet or ""):match("wwan") ~= nil
    if not zin then
        -- firewall laid out differently (named sections): ask the kernel instead whether new incoming connections are refused
        local pol = sh("nft list chain inet fw4 input_wan 2>/dev/null | grep -cE 'reject|drop'")
        if tonumber(trim(pol)) and tonumber(trim(pol)) > 0 then add(true, "Your router is hidden from this network", "Other people on this network can't open the router's admin page or reach your devices.") end
    elseif zin == "REJECT" or zin == "DROP" then
        if inzone then add(true, "Your router is hidden from this network", "Other people on this network can't open the router's admin page or reach your devices.")
        else add(false, "Wi-Fi uplink isn't covered by the firewall", "The repeater interface isn't in the router's WAN firewall zone. Check Network > Firewall.") end
    else add(false, "Router accepts connections from this network", "The WAN firewall zone allows incoming connections (" .. tostring(zin) .. "). Other people on this network may reach the router.") end
    -- 3. VPN
    local vs = lrpc("vpn-client", "get_status", {}) or {}
    local on, names = 0, {}
    for _, v in ipairs(type(vs.status_list) == "table" and vs.status_list or {}) do if v.enabled and v.status == 1 then on = on + 1; names[#names + 1] = v.name or v.via end end
    if on > 0 then add(true, "VPN is on (" .. table.concat(names, ", ") .. ")", "Your traffic leaves through the VPN, so this network only sees encrypted VPN traffic.")
    else add(false, "VPN is off on this router", "This network's owner can see which sites your devices visit (the site names, not what's on them, for HTTPS sites). Turn on a VPN tunnel in GL's VPN page for public Wi-Fi.") end
    -- 4. who answers DNS lookups + where we appear to be (Cloudflare trace through the uplink)
    local okP, P = pcall(dofile, "/usr/lib/machome/more.lua")
    local dw = okP and P.dns_who and P.dns_who() or nil
    if dw and dw.names and #dw.names > 0 then
        local nm = table.concat(dw.names, ", ")
        if dw.ispleak then add(false, "DNS lookups answered by this network's provider", "Lookups are answered by " .. nm .. ", so this network's provider can see every site your devices look up.")
        else add(true, "DNS lookups answered by " .. nm, "A private DNS provider, not this network.") end
    end
    local tr = sh("curl -s -m 6 https://1.1.1.1/cdn-cgi/trace")
    local loc, colo = tr:match("loc=(%u%u)"), tr:match("colo=(%u+)")
    if loc then add(nil, "Websites see you in " .. loc .. (colo and (" (near " .. colo .. ")") or ""), on > 0 and "That's your VPN's location." or "That's this network's location.") end
    -- 5. VPN leak test details when tunnels are on (shared leak test; also feeds the Speed Test & Leak Test card)
    if on > 0 and okP and P.leak_test then
        local r = P.leak_test()
        local bad = 0; for _, c in ipairs(type(r) == "table" and r.checks or {}) do if c.ok == false then bad = bad + 1 end end
        add(bad == 0, bad == 0 and "VPN leak test passed" or (bad .. " possible VPN leak" .. (bad > 1 and "s" or "")), "Full results are in the Speed Test & Leak Test card.")
    end
    -- 6. Tailscale (way home)
    local ts = sh("tailscale status --json 2>/dev/null"):match('"BackendState":%s*"(%a+)"')
    if ts then add(ts == "Running" and true or nil, ts == "Running" and "Tailscale connected" or ("Tailscale: " .. ts), ts == "Running" and "You can reach your home network through Tailscale." or "Not connected to your tailnet right now.") end
    local bad = 0; for _, c in ipairs(checks) do if c.ok == false then bad = bad + 1 end end
    writef(SAFE, cjson.encode({ t = os.time(), key = up.key, name = up.name, checks = checks, bad = bad,
        verdict = bad == 0 and "safe" or (bad == 1 and "ok" or "risky") }))
end

-- ---------------------------------------------------------------- network report cards
local nets = nil
local nets_dirty, nets_saved = false, 0
local function nets_load() if not nets then nets = jread(NETS, {}); if type(nets) ~= "table" or nets[1] then nets = {} end end; return nets end
local function nets_save(now, force)
    if not nets or (not nets_dirty and not force) then return end
    if not force and now - nets_saved < 600 then return end
    -- keep the 40 most recently used
    local keys = {}; for k in pairs(nets) do keys[#keys + 1] = k end
    if #keys > 40 then table.sort(keys, function(a, b) return (nets[a].last or 0) > (nets[b].last or 0) end); for i = 41, #keys do nets[keys[i]] = nil end end
    os.execute("mkdir -p " .. EDIR); writef(NETS, cjson.encode(nets)); nets_dirty = false; nets_saved = now
end
function T.grade(n)
    local pts = 100
    local ping = (n.ping_n or 0) > 0 and n.ping_sum / n.ping_n or nil
    local loss = (n.loss_n or 0) > 0 and n.loss_sum / n.loss_n or 0
    if ping then pts = pts - (ping < 30 and 0 or ping < 60 and 10 or ping < 100 and 25 or ping < 200 and 40 or 60) end
    pts = pts - math.min(40, loss * 5)
    local hours = math.max(1, (n.secs or 0) / 3600)
    pts = pts - math.min(30, (n.drops or 0) / math.max(1, hours / 24) * 10)
    local sp = n.speed and n.speed.down
    if sp then pts = pts - (sp < 5 and 30 or sp < 25 and 15 or sp < 50 and 5 or 0) end
    local g = pts >= 85 and "A" or pts >= 70 and "B" or pts >= 55 and "C" or pts >= 40 and "D" or "F"
    local uses = {}
    if ping and ping < 100 and loss < 2 and (not sp or sp >= 5) then uses[#uses + 1] = "video calls" end
    if not sp or sp >= 10 then uses[#uses + 1] = sp and sp >= 25 and "4K streaming" or "HD streaming" end
    return g, uses, ping, loss
end

-- ---------------------------------------------------------------- tick
local cur = nil            -- { key, since, bytes0 }
local last_up_key, down_since, down_key = nil, nil, nil
local portal = { state = "unknown" }
local t_portal, t_home, t_min, t_safe_req = 0, 0, 0, 0
local home = nil
local pacc = { ms = 0, n = 0, loss = 0, ln = 0 }
local alerted = {}         -- daily data warnings
local was_portal, home_bad_since, home_alerted = false, nil, false
local last_speed_t = nil

local function home_tick(now, X)
    local c = T.cfg()
    local okj, js = pcall(cjson.decode, sh("tailscale status --json 2>/dev/null"))
    if not okj or type(js) ~= "table" then home = { running = false }; return end
    local backend = js.BackendState
    if backend ~= "Running" then home = { running = false, backend = backend }; return end
    local function ip4(n) for _, a in ipairs(type(n) == "table" and type(n.TailscaleIPs) == "table" and n.TailscaleIPs or {}) do if tostring(a):match("^100%.") then return a end end end
    -- peers for the settings list (name + Tailscale IPv4 + online), never keys
    local peers = {}
    for _, p in pairs(type(js.Peer) == "table" and js.Peer or {}) do
        local ip = ip4(p)
        -- the Tailscale machine name (first part of DNSName, e.g. "brume-3") is what the admin console shows;
        -- HostName is the device's own system name (e.g. "GL-MT5000")
        local nm = tostring(p.DNSName or ""):match("^([^%.]+)") or p.HostName
        if ip and nm then peers[#peers + 1] = { name = nm, host = p.HostName, ip = ip, online = p.Online == true } end
    end
    table.sort(peers, function(a, b) return a.name < b.name end)
    local self_ip = ip4(js.Self)
    local target = c.home_ip
    local function is(p, pat) return p.name:lower():match(pat) or tostring(p.host or ""):lower():match(pat) end
    if not target then for _, p in ipairs(peers) do if p.ip ~= self_ip and (is(p, "brume") or is(p, "mt5000")) then target = p.ip end end end
    if not target then for _, p in ipairs(peers) do if p.ip ~= self_ip and (is(p, "flint") or is(p, "router") or is(p, "^gl%-")) then target = p.ip end end end
    local out = { running = true, peers = {}, ip = target, auto = c.home_ip == nil }
    for _, p in ipairs(peers) do if p.ip ~= self_ip then out.peers[#out.peers + 1] = { name = p.name, ip = p.ip, online = p.online } end end
    for _, p in ipairs(peers) do if p.ip == target then out.name = p.name end end
    if target then
        local r = sh("tailscale ping -c 1 --timeout 4s " .. q(target))
        local ms = tonumber(r:match(" in ([%d%.]+)ms"))
        out.ok = ms ~= nil; out.ms = ms; out.t = now
        out.via = r:match("via DERP%((%w+)%)") and "relay" or (ms and "direct" or nil)
        if ms then out.last_ok = now; home_bad_since = nil
            if home_alerted then home_alerted = false; X.alert("travel", "🏠 Home is reachable again", "The home router (" .. tostring(out.name or target) .. ") answers through Tailscale again (" .. math.floor(ms + 0.5) .. " ms).", "green") end
        else
            home_bad_since = home_bad_since or now
            if not home_alerted and now - home_bad_since >= 900 and X.online ~= false then
                home_alerted = true
                X.alert("travel", "🏠 Can't reach home", "The home router (" .. tostring(out.name or target) .. ") hasn't answered through Tailscale for 15 minutes. Home internet or power may be down, or Tailscale there stopped.", "orange")
            end
        end
        out.bad_since = home_bad_since
        if home and home.last_ok and not out.last_ok then out.last_ok = home.last_ok end
    end
    home = out
end

function T.tick(now, X, wanping)
    local up = uplink()
    nets_load()
    local day = os.date("%Y-%m-%d", now)
    if not up then
        if cur and cur.key then down_since = down_since or now; down_key = cur.key end
        cur = nil
        if not travel_model() then return end
        writef(STATE, cjson.encode({ t = now, active = travel_model(), up = cjson.null, portal = portal, home = home or cjson.null, cfg = T.cfg() }))
        if now - t_home >= 300 then t_home = now; pcall(home_tick, now, X) end
        return
    end
    local n = nets[up.key]
    if not n then n = { name = up.name, kind = up.kind, first = now, sessions = 0, secs = 0, drops = 0, bytes = 0, days = {} }; nets[up.key] = n end
    if up.sec then n.sec = up.sec end
    -- joined (or came back)
    if not cur or cur.key ~= up.key then
        if down_key == up.key and down_since and now - down_since < 600 then n.drops = (n.drops or 0) + 1        -- dropped and came back
        else n.sessions = (n.sessions or 0) + 1 end
        cur = { key = up.key, since = now, b = devbytes(up.dev), dev = up.dev, tick = now }
        down_since, down_key = nil, nil
        portal = { state = "unknown" }; t_portal = 0
        if last_up_key ~= up.key then t_safe_req = now end             -- new network: safety check soon
        last_up_key = up.key; nets_dirty = true
        nets_save(now, true)
    end
    -- connected time + data used (device counters; reset when the interface is recreated)
    local b = devbytes(up.dev)
    if b and cur.b then
        local d = b >= cur.b and (b - cur.b) or b
        if d > 0 and d < 5e10 then
            n.bytes = (n.bytes or 0) + d; n.days = n.days or {}; n.days[day] = (n.days[day] or 0) + d; nets_dirty = true
        end
    end
    cur.b = b
    n.secs = (n.secs or 0) + math.max(0, math.min(60, now - (cur.tick or now))); cur.tick = now
    n.last = now; n.name = up.name
    -- trim day buckets to 7 days
    local keepd = {}; for k, v in pairs(n.days or {}) do if k >= os.date("%Y-%m-%d", now - 7 * 86400) then keepd[k] = v end end; n.days = keepd
    -- ping/loss from the sampler's own internet ping (every tick), folded per minute
    if type(wanping) == "table" then
        if type(wanping.ms) == "number" then pacc.ms = pacc.ms + wanping.ms; pacc.n = pacc.n + 1 end
        if type(wanping.loss) == "number" then pacc.loss = pacc.loss + wanping.loss; pacc.ln = pacc.ln + 1 end
    end
    if now - t_min >= 60 then
        t_min = now
        if pacc.n > 0 then n.ping_sum = (n.ping_sum or 0) + pacc.ms / pacc.n; n.ping_n = (n.ping_n or 0) + 1 end
        if pacc.ln > 0 and portal.state == "ok" then n.loss_sum = (n.loss_sum or 0) + pacc.loss / pacc.ln; n.loss_n = (n.loss_n or 0) + 1 end
        pacc = { ms = 0, n = 0, loss = 0, ln = 0 }
        -- signal (Wi-Fi only), from the same reader as the Wi-Fi Uplink card
        if up.kind == "wifi" then
            if not T._rpc then local okr, M = pcall(dofile, "/usr/lib/oui-httpd/rpc/machome"); T._rpc = okr and type(M) == "table" and M or false end
            local u = T._rpc and T._rpc.get_uplink and T._rpc.get_uplink() or nil
            if u and u.signal then n.sig_sum = (n.sig_sum or 0) + u.signal; n.sig_n = (n.sig_n or 0) + 1; cur.signal = u.signal end
        end
        -- speed: newest internet speed test run while on this network
        local hist = jread(EDIR .. "/speedtest-history.json", {})
        local lastw = nil; for _, e in ipairs(hist) do if e.kind == "wan" and type(e.down) == "number" then lastw = e end end
        if lastw and (lastw.time or 0) >= cur.since and lastw.time ~= last_speed_t then
            last_speed_t = lastw.time; n.speed = { down = lastw.down, up = type(lastw.up) == "number" and lastw.up or nil, t = lastw.time }; nets_dirty = true
        end
        -- daily data limit (per network)
        local c = T.cfg()
        if c.limit_gb > 0 then
            local used = (n.days[day] or 0) / 1e9
            for _, lvl in ipairs({ 100, 80 }) do
                local k = up.key .. "|" .. day .. "|" .. lvl
                if used >= c.limit_gb * lvl / 100 and not alerted[k] then
                    alerted[k] = true
                    X.alert("travel", lvl == 100 and "📶 Daily data limit reached" or "📶 80% of today's data limit used",
                        string.format("%s: %s used today (your limit is %s GB a day).", up.name, gb(n.days[day]), c.limit_gb), lvl == 100 and "orange" or "blue")
                    break
                end
            end
        end
        nets_save(now, false)
    end
    -- hotel sign-in page: every 60 s, every 20 s while one is up
    if now - t_portal >= (portal.state == "portal" and 20 or 60) then
        t_portal = now
        local stt, url = portal_check(up.dev)
        if stt == "portal" then
            if portal.state ~= "portal" then portal = { state = "portal", since = now, url = url }
                X.alert("travel", "🏨 This Wi-Fi needs you to sign in", up.name .. " shows a sign-in page before it lets the router online. Open the Home tab and press \"Open sign-in page\".", "orange")
                was_portal = true
            elseif url then portal.url = url end
        else
            if stt == "ok" and was_portal then was_portal = false; t_safe_req = now
                X.alert("travel", "✅ Signed in: internet works", up.name .. " lets the router online now.", "green") end
            portal = { state = stt, since = (portal.state == stt and portal.since) or now }
        end
        portal.t = now
    end
    -- safety check: when a network is joined (after any sign-in page), or when asked from the Home tab
    local req = io.open(DIR .. "/travel_check_now", "r"); if req then req:close(); os.remove(DIR .. "/travel_check_now"); t_safe_req = now end
    if t_safe_req > 0 and portal.state == "ok" and now - t_safe_req < 3600 then
        t_safe_req = 0
        os.execute("lua -e 'local T=dofile(\"/usr/lib/machome/travel.lua\"); T.safety_job()' </dev/null >/dev/null 2>&1 &")
    end
    if now - t_home >= 300 then t_home = now; pcall(home_tick, now, X) end
    writef(STATE, cjson.encode({ t = now, active = true, up = { kind = up.kind, key = up.key, name = up.name, sec = up.sec or cjson.null, since = cur.since, signal = cur.signal or cjson.null },
        portal = portal, home = home or cjson.null, today = n.days[day] or 0, cfg = T.cfg() }))
end

-- ---------------------------------------------------------------- for the Home tab (rpc get_travel)
function T.get()
    local s = jread(STATE, { active = travel_model() })
    s.safety = jread(SAFE, cjson.null)
    local N = jread(NETS, {})
    local list = {}
    local day = os.date("%Y-%m-%d")
    for k, n in pairs(type(N) == "table" and N or {}) do
        local g, uses, ping, loss = T.grade(n)
        list[#list + 1] = { key = k, name = n.name, kind = n.kind, sec = n.sec, first = n.first, last = n.last, sessions = n.sessions, drops = n.drops, secs = n.secs,
            signal = (n.sig_n or 0) > 0 and math.floor(n.sig_sum / n.sig_n + 0.5) or cjson.null, ping = ping and math.floor(ping + 0.5) or cjson.null,
            loss = (n.loss_n or 0) > 0 and math.floor(loss * 10 + 0.5) / 10 or cjson.null, speed = n.speed or cjson.null, bytes = n.bytes or 0,
            today = (n.days or {})[day] or 0, grade = g, uses = uses }
    end
    table.sort(list, function(a, b) return (a.last or 0) > (b.last or 0) end)
    s.nets = list
    s.cfg = T.cfg()
    return s
end
function T.forget(key)
    local N = jread(NETS, {}); if type(N) ~= "table" then return false end
    N[key] = nil; writef(NETS, cjson.encode(N))
    os.execute("touch " .. DIR .. "/travel_reload")
    return true
end

-- reload the report cards when "Forget" was used from the Home tab
local _tick = T.tick
T.tick = function(now, X, wp)
    local r = io.open(DIR .. "/travel_reload", "r"); if r then r:close(); os.remove(DIR .. "/travel_reload"); nets = nil end
    return _tick(now, X, wp)
end

return T
