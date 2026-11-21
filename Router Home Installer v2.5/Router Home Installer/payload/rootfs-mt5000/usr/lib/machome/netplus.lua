-- netplus.lua (owner's picks, 2026-11-18): more Network Health data, more repairs, and forgetting removed VPNs.
-- Loaded by extras.lua like watch.lua; N.tick(now, X, ctx) runs every 10 s (each part throttles itself and runs in
-- pcall, so one failing part never stops the others or the sampler).
--   Network Health data (N.live() -> live.x.np):
--     1 IPv6 health              2 DNS at a glance (AdGuard + usual speed)     3 busiest device right now
--     4 live bufferbloat         6 likely cause of each internet outage (modem answered or not)
--   Repairs / alerts:
--     8 modem switched to router mode (double NAT) / back to bridge mode   9 SQM trial for lag under load (opt-in)
--    10 slow DNS: AdGuard vs its upstream                                   13 tunnel stuck "connecting" 10+ min
--    14 a service whose memory keeps growing
--   20 + 23 forget removed VPNs automatically (24 h grace; by provider or by server)
local cjson = require "cjson"
local N = {}
local DIR, EDIR = "/tmp/machome", "/etc/machome"
local X = nil

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local t = p .. ".tmp"; local f = io.open(t, "w"); if not f then return end; f:write(s); f:close(); os.rename(t, p) end
local function trim(s) return s and (s:gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jread(p, d) local s = readf(p); if not s or s == "" then return d end; local ok, v = pcall(cjson.decode, s); if ok and type(v) == "table" then return v end; return d end
local function exists(p) local f = io.open(p, "r"); if f then f:close(); return true end; return false end
local function fmtdur(s) s = math.floor(s); if s < 90 then return s .. " s" elseif s < 5400 then return math.floor(s / 60 + 0.5) .. " min" else return string.format("%.1f h", s / 3600) end end
local function r1(x) return math.floor(x * 10 + 0.5) / 10 end
local function median(t) if #t == 0 then return nil end; local c = {}; for i, v in ipairs(t) do c[i] = v end; table.sort(c); return c[math.ceil(#c / 2)] end
local function alert(kind, title, desc, color, fields) if X and X.alert then X.alert(kind, title, desc, color, fields) end end
local function cfg(k, d) local v = X and X.cfg and X.cfg[k]; if v == nil then return d end; return v end
local function log(m) os.execute("logger -t machome '" .. tostring(m):gsub("'", ""):sub(1, 200) .. "'") end
local function lrpc(obj, method, params)
    local f = DIR .. "/np_rpc.json"
    writef(f, cjson.encode({ jsonrpc = "2.0", id = 1, method = "call", params = { "", obj, method, params or {} } }))
    local out = sh("curl -s -m 20 -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @" .. f .. " http://127.0.0.1/rpc")
    local ok, v = pcall(cjson.decode, out)
    if ok and type(v) == "table" then return v.result end
end
local mode_t, mode_ap = 0, false
local function is_ap(now) if now - mode_t > 60 then mode_t = now; mode_ap = trim(sh("uci -q get glconfig.general.mode")) == "ap" end; return mode_ap end
local function wan_dev()
    local best, bm = nil, nil
    for line in sh("ip -4 route show default"):gmatch("[^\n]+") do
        local dev = line:match(" dev (%S+)"); local metric = tonumber(line:match(" metric (%d+)") or "0")
        if dev and (not bm or metric < bm) then best, bm = dev, metric end
    end
    return best or "eth1"
end
local function more() local ok, P = pcall(dofile, "/usr/lib/machome/more.lua"); if ok and type(P) == "table" then return P end end

-- small persistent state (flash; written only when something changes): modem mode, VPN "last seen", SQM trial
local KEEP = EDIR .. "/np_keep.json"
local keep = jread(KEEP, {})
local function keep_save() writef(KEEP, cjson.encode(keep)) end
local live = {}
local ipname = {}          -- LAN IP -> device name (filled by the busiest-device check; used by the blocking alert)

-- ================================================================ 1. IPv6 health (every 5 min)
local v6_t = 0
local function v6_tick(now)
    if now - v6_t < 300 then return end; v6_t = now
    local wan = wan_dev()
    local gw = tonumber(trim(sh("ip -6 addr show dev " .. wan .. " scope global | grep -c inet6"))) or 0
    local gl = tonumber(trim(sh("ip -6 addr show dev br-lan scope global | grep -c inet6"))) or 0
    local route = trim(sh("ip -6 route show default")) ~= ""
    local ra, d6 = trim(sh("uci -q get dhcp.lan.ra")), trim(sh("uci -q get dhcp.lan.dhcpv6"))
    local lan_on = gl > 0 or (ra ~= "" and ra ~= "disabled") or (d6 ~= "" and d6 ~= "disabled")
    local works = cjson.null
    if route then works = (tonumber(sh("ping -6 -c 2 -W 2 2606:4700:4700::1111 | sed -n 's/.* \\([0-9]*\\) packets received.*/\\1/p'")) or 0) > 0 end
    live.v6 = { wan = gw > 0, route = route, lan = lan_on, works = works, leak = (lan_on and route) or false, t = now }
end

-- ================================================================ 2 + 10. DNS at a glance + slow DNS alert
local dns_s, dns_h, dns_hour, dns_hs = {}, {}, nil, {}     -- last 60 answer times; per-hour medians (24)
local adg_t, probe_t = 0, 0
local pr_adg, pr_dir = {}, {}                              -- uncached lookups: through AdGuard / straight to Quad9
local dslow = { bad = 0, good = 0, on = false, sent = 0 }
local function lan_dns()
    for o in sh("uci -q get dhcp.lan.dhcp_option"):gmatch("%S+") do local ip = o:match("^6,([%d%.]+)") or o:match("^option:dns%-server,([%d%.]+)"); if ip then return ip end end
    return "127.0.0.1"
end
local function dig_ms(server, name)
    local o = sh("dig +time=3 +tries=1 @" .. server .. " " .. name .. " A")
    local st, q = o:match("status: (%u+)"), tonumber(o:match("Query time: (%d+) msec"))
    if st then return q or 0 end
end
local function dns_tick(now, ctx)
    local d = ctx.dns
    if type(d) == "table" and d.ok and tonumber(d.ms) then
        dns_s[#dns_s + 1] = tonumber(d.ms); while #dns_s > 60 do table.remove(dns_s, 1) end
        local h = now - now % 3600
        if dns_hour ~= h then
            if dns_hour and #dns_hs > 0 then dns_h[#dns_h + 1] = median(dns_hs); while #dns_h > 24 do table.remove(dns_h, 1) end end
            dns_hour, dns_hs = h, {}
        end
        dns_hs[#dns_hs + 1] = tonumber(d.ms)
    end
    -- AdGuard's own numbers (NAS AdGuard set up on this router): every 5 min
    if now - adg_t >= 300 then
        adg_t = now
        local P = more()
        local a = P and P.adg_status and P.adg_status() or nil
        if type(a) == "table" and a.ok then
            live.adg = { avg_ms = a.avg_ms, queries = a.queries, blocked = a.blocked,
                pct = (tonumber(a.queries) or 0) > 0 and r1(a.blocked * 100 / a.queries) or cjson.null, up = a.up or cjson.null, t = now }
        else live.adg = nil end
    end
    -- 10. every minute: a lookup nobody asked before (so nothing is cached), through AdGuard and straight to Quad9
    if now - probe_t >= 60 and not is_ap(now) and not (X and X.wan_since) then
        probe_t = now
        local name = "np" .. now .. "x" .. math.random(1000, 9999) .. ".example.com"
        local a, b = dig_ms(lan_dns(), name), dig_ms("9.9.9.9", "q" .. name)
        pr_adg[#pr_adg + 1] = a or 3000; while #pr_adg > 10 do table.remove(pr_adg, 1) end
        pr_dir[#pr_dir + 1] = b or 3000; while #pr_dir > 10 do table.remove(pr_dir, 1) end
        local ma, mb = median(pr_adg), median(pr_dir)
        if #pr_adg >= 5 then
            if ma > 250 then dslow.bad = dslow.bad + 1; dslow.good = 0 elseif ma < 120 then dslow.good = dslow.good + 1; dslow.bad = 0 end
            -- not while the whole line is lagging (the high-ping alert covers that) and at most once every 3 hours
            if not dslow.on and dslow.bad >= 10 and not (X and X.pinghigh) then
                dslow.on = true; dslow.since = now - 600
                if now - dslow.sent >= 3 * 3600 then
                    dslow.sent = now; dslow.told = true
                    local up = live.adg and type(live.adg.up) == "table" and live.adg.up[1]
                    local upn = up and up.name and tostring(up.name):gsub("^https?://", ""):gsub("/.*", "") or "its upstream"
                    if mb and mb > 250 then
                        alert("dns", "🐌 DNS provider is slow: " .. math.floor(mb) .. " ms", "New lookups take **" .. math.floor(ma) .. " ms** through your DNS (AdGuard), and Quad9 itself takes **" .. math.floor(mb) ..
                            " ms** when asked directly, so the slowness is at the DNS provider or on the way to it (your internet line is fine). Websites open more slowly the first time. Usually passes by itself.", "orange")
                    else
                        alert("dns", "🐌 Your DNS (AdGuard) is slow: " .. math.floor(ma) .. " ms", "New lookups take **" .. math.floor(ma) .. " ms** through AdGuard on your NAS, while Quad9 answers this router directly in **" ..
                            math.floor(mb or 0) .. " ms**. So it's AdGuard or its link to " .. upn .. ", not your internet. Check the NAS (busy, asleep, updating) or AdGuard's upstream settings.", "orange")
                    end
                else dslow.told = false end
            elseif dslow.on and dslow.good >= 10 then
                dslow.on = false
                if dslow.told then alert("dns", "🟢 DNS is fast again: " .. math.floor(ma) .. " ms", "New lookups were slow for " .. fmtdur(now - dslow.since) .. "; they're back to normal.", "green") end
            end
        end
        live.probe = { adg = ma and math.floor(ma) or cjson.null, direct = mb and math.floor(mb) or cjson.null, slow = dslow.on, t = now }
    end
    local all = {}; for _, v in ipairs(dns_h) do all[#all + 1] = v end
    live.dns = { now = #dns_s > 0 and r1(median(dns_s)) or cjson.null, usual = #all >= 3 and r1(median(all)) or cjson.null, server = type(d) == "table" and d.server or cjson.null }
end

-- ================================================================ 3 + 4. busiest device + live bufferbloat
local rx0, tx0, rt0 = nil, nil, nil
local wan_bps = { d = 0, u = 0 }
local busy, idle = {}, {}                       -- {t, ms}: busy 24 h (max 300), idle last hour
local top_t = 0
local function rates(now)
    local w = wan_dev()
    local rx = tonumber(trim(readf("/sys/class/net/" .. w .. "/statistics/rx_bytes") or "")) or 0
    local tx = tonumber(trim(readf("/sys/class/net/" .. w .. "/statistics/tx_bytes") or "")) or 0
    if rx0 and now > rt0 and rx >= rx0 and tx >= tx0 then wan_bps = { d = (rx - rx0) * 8 / (now - rt0), u = (tx - tx0) * 8 / (now - rt0) } end
    rx0, tx0, rt0 = rx, tx, now
end
local function bloat_tick(now, ctx)
    local best
    local wr = ctx.ping and ctx.ping.wan
    if wr and type(wr.each) == "table" then for _, e in ipairs(wr.each) do local ms = tonumber(e.ms); if ms and (not best or ms < best) then best = ms end end end
    if not best then return end
    local pd, pu = tonumber(cfg("plan_down", 2000)) or 2000, tonumber(cfg("plan_up", 2000)) or 2000
    local dm, um = wan_bps.d / 1e6, wan_bps.u / 1e6
    if dm >= math.max(200, pd * 0.3) or um >= math.max(100, pu * 0.3) then busy[#busy + 1] = { now, best } elseif dm < 20 and um < 10 then idle[#idle + 1] = { now, best } end
    while busy[1] and (now - busy[1][1] > 86400 or #busy > 300) do table.remove(busy, 1) end
    while idle[1] and now - idle[1][1] > 3600 do table.remove(idle, 1) end
    local bv, iv = {}, {}
    for _, x in ipairs(busy) do bv[#bv + 1] = x[2] end
    for _, x in ipairs(idle) do iv[#iv + 1] = x[2] end
    local bm, im = median(bv), median(iv)
    local add = (bm and im) and math.max(0, bm - im) or nil
    local gr = add and (add < 5 and "A+" or add < 30 and "A" or add < 60 and "B" or add < 200 and "C" or add < 400 and "D" or "F") or nil
    live.bloat = { idle = im and r1(im) or cjson.null, busy = bm and r1(bm) or cjson.null, add = add and r1(add) or cjson.null, grade = gr or cjson.null,
        n = #busy, last = busy[#busy] and busy[#busy][1] or cjson.null }
end
local function top_tick(now)
    if now - top_t < 20 then return end; top_t = now
    local r = lrpc("clients", "get_list", {})
    local list = type(r) == "table" and (r.clients or r.list) or nil
    if type(list) ~= "table" then return end
    local best, tot = nil, 0
    for _, c in ipairs(list) do
        if c.ip then ipname[c.ip] = (c.alias and c.alias ~= "") and c.alias or c.name end
        if c.online then
            local b = (tonumber(c.rx) or 0) + (tonumber(c.tx) or 0); tot = tot + b
            if not best or b > best.b then best = { b = b, c = c } end
        end
    end
    local wb = (wan_bps.d + wan_bps.u) / 8
    if best and best.b * 8 >= 2e6 then
        local c = best.c
        live.top = { name = (c.alias and c.alias ~= "") and c.alias or c.name or cjson.null, ip = c.ip or cjson.null,
            down = r1((tonumber(c.rx) or 0) * 8 / 1e6), up = r1((tonumber(c.tx) or 0) * 8 / 1e6),
            share = math.min(100, math.floor(best.b * 100 / math.max(wb, tot, 1) + 0.5)), wan_down = r1(wan_bps.d / 1e6), wan_up = r1(wan_bps.u / 1e6), t = now }
    else live.top = { quiet = true, wan_down = r1(wan_bps.d / 1e6), wan_up = r1(wan_bps.u / 1e6), t = now } end
end

-- ================================================================ 6. likely cause of an internet outage
-- While extras says the internet is down, count whether the modem (next hop) still answered.
local oc = { on = false, ok = 0, n = 0 }
local OUTF = EDIR .. "/np_outages.json"
local function outage_tick(now, ctx)
    local down = X and X.wan_since
    if down then
        if not oc.on then oc = { on = true, ok = 0, n = 0, s = down } end
        local g = ctx.gw
        oc.n = oc.n + 1
        if type(g) == "table" and g.ms ~= cjson.null and tonumber(g.ms) then oc.ok = oc.ok + 1 end
    elseif oc.on then
        local c = N.outage_cause()
        if c then
            local list = jread(OUTF, {}); list[#list + 1] = { s = oc.s, e = now, cause = c.key }
            while #list > 30 do table.remove(list, 1) end
            writef(OUTF, cjson.encode(list))
        end
        oc = { on = false, ok = 0, n = 0 }
    end
end
--- called by extras when it sends the outage alert: { key, text } or nil
function N.outage_cause()
    if not oc.on or oc.n < 3 then return nil end
    local f = oc.ok / oc.n
    if f >= 0.8 then return { key = "isp", text = "The modem kept answering the whole time, so the outage was on your ISP's side (line or network), not in your home." } end
    if f <= 0.2 then return { key = "home", text = "The modem didn't answer either, so it was the modem itself (restarting, no power) or the cable between it and this router." } end
    return { key = "mixed", text = "The modem answered on and off, so the modem or the line was unstable." }
end

-- ================================================================ 8. modem switched to router mode (double NAT) / back
local nat_t, nat_cnt = 0, 0
local function nat_tick(now)
    if now - nat_t < 60 or is_ap(now) then return end; nat_t = now
    local ip = sh("ip -4 -o addr show dev " .. wan_dev()):match("inet (%d+%.%d+%.%d+%.%d+)")
    if not ip then return end
    local a, b = ip:match("^(%d+)%.(%d+)"); a, b = tonumber(a), tonumber(b)
    local nat = (a == 10 or (a == 172 and b >= 16 and b <= 31) or (a == 192 and b == 168)) and "private" or "public"
    if not keep.nat then keep.nat = nat; keep_save(); return end
    if nat == keep.nat then nat_cnt = 0; return end
    nat_cnt = nat_cnt + 1
    if nat_cnt < 10 then return end            -- the same for 10 minutes before telling anyone
    nat_cnt = 0; keep.nat = nat; keep_save()
    if nat == "private" then
        alert("wan", "📡 Your modem switched to router mode (double NAT)",
            "This router now gets a private address (" .. ip:gsub("%d+$", "x") .. ") from the modem instead of a public one, so two routers are in a row. It usually happens after the modem resets or updates. Internet still works, but games, calls and port forwarding can have trouble.\n" ..
            "**Fix:** turn bridge mode back on (Xfinity: the Xfinity app → Gateway → Advanced settings → Bridge mode, or the gateway page at 10.0.0.1 → Gateway → At a Glance → Bridge Mode: Enable). This router reconnects by itself.", "orange")
    else
        alert("wan", "✅ Modem is back in bridge mode", "This router has a public internet address again (no double NAT).", "green")
    end
end

-- ================================================================ 9. SQM trial for lag under load (opt-in, router mode)
-- Uses the Ookla loaded-latency numbers from the speed tests: if the line adds 60+ ms when busy, turn on GL's SQM
-- (cake) at 85% of the measured speeds, then judge it with the next Internet speed test: keep it only if the added
-- latency dropped by 40%+ (or under 30 ms) without losing more than half the download speed; otherwise put the old
-- SQM settings back exactly. Never touches SQM the owner turned on themselves. One try a week.
local sqm_t = 0
local function wan_last()
    local l = jread(EDIR .. "/speedtest-last.json", {})
    local r = l.wan and type(l.wan.results) == "table" and l.wan.results[1]
    if type(r) ~= "table" or not tonumber(r.ping) or not tonumber(r.down) then return nil end
    local add = math.max(0, math.max(tonumber(r.dl_lat) or 0, tonumber(r.ul_lat) or 0) - tonumber(r.ping))
    return { t = tonumber(r.time) or tonumber(l.wan.finished) or 0, add = add, down = tonumber(r.down), up = tonumber(r.up) or 0 }
end
local function sqm_revert(why, color)
    local s = keep.sqm or {}
    if type(s.prev) == "table" then lrpc("sqm", "set_config", s.prev) end
    keep.sqm = { phase = "done", t = os.time() }; keep_save()
    log("sqm trial: reverted (" .. why .. ")")
    alert("health", "↩️ SQM switched back off", why .. " Your previous SQM settings are back.", color or "orange")
end
local function sqm_tick(now)
    if now - sqm_t < 300 or is_ap(now) then return end; sqm_t = now
    local s = keep.sqm or {}
    local on = cfg("sqm_auto", false) == true
    if (s.phase == "trial" or s.phase == "kept") and not on then return sqm_revert("You turned the SQM repair off.", "blue") end
    if not on then return end
    local w = wan_last()
    if s.phase == "trial" then
        if w and w.t > (s.start or 0) + 60 then
            local b = s.before or {}
            local better = w.add <= (b.add or 0) * 0.6 or w.add < 30
            local slow = (b.down or 0) > 0 and w.down < b.down * 0.5
            if better and not slow then
                keep.sqm = { phase = "kept", prev = s.prev, before = b, after = { add = w.add, down = w.down }, t = now }; keep_save()
                alert("health", "✅ SQM kept: lag under load " .. math.floor(b.add or 0) .. " → " .. math.floor(w.add) .. " ms",
                    "The speed test with SQM on: the line adds **" .. math.floor(w.add) .. " ms** when busy (was " .. math.floor(b.add or 0) .. " ms), download " .. math.floor(w.down) .. " Mbps (was " .. math.floor(b.down or 0) ..
                    "). SQM stays on. Turn the switch off in Settings → Auto-heal to undo it.", "green")
            else
                sqm_revert(slow and ("It cut the download speed too much (" .. math.floor(w.down) .. " vs " .. math.floor(b.down or 0) .. " Mbps).") or
                    ("It didn't help enough: the line still adds " .. math.floor(w.add) .. " ms when busy (was " .. math.floor(b.add or 0) .. " ms)."))
            end
        elseif now - (s.start or now) > 48 * 3600 then sqm_revert("No speed test ran within 2 days to check it.") end
        return
    end
    if s.phase == "kept" then return end
    if s.phase == "done" and now - (s.t or 0) < 7 * 86400 then return end
    if not w or now - w.t > 86400 or w.add < 60 then return end
    local cur = lrpc("sqm", "get_config", {})
    if type(cur) ~= "table" or cur.enable == true then return end     -- the owner's own SQM: hands off
    local dn, up = math.max(10, math.floor(w.down * 0.85)), math.max(5, math.floor(w.up * 0.85))
    local r = lrpc("sqm", "set_config", { enable = true, download = dn, upload = up, qdisc = cur.qdisc or "cake" })
    if r == nil then log("sqm trial: GL refused set_config"); return end
    keep.sqm = { phase = "trial", prev = cur, before = { add = w.add, down = w.down, up = w.up }, start = now }; keep_save()
    log("sqm trial: on at " .. dn .. "/" .. up .. " Mbps")
    alert("health", "🧪 Trying SQM to fix lag under load",
        "The last speed test showed your ping rising **" .. math.floor(w.add) .. " ms** while the line was busy (bufferbloat). SQM (traffic shaping) is now on at " .. dn .. " ↓ / " .. up ..
        " ↑ Mbps (85% of your measured speed). The next Internet speed test decides: it stays only if the lag drops a lot without losing more than half your speed; otherwise your old settings come back by themselves.", "blue")
end

-- ================================================================ 13. tunnel stuck "connecting" for 10+ minutes
local stk_t, stk = 0, {}
local function stuck_tick(now)
    if now - stk_t < 60 or is_ap(now) then return end; stk_t = now
    if cfg("stuck_fix", true) ~= true or (X and X.wan_since) then stk = {}; return end
    local st = lrpc("vpn-client", "get_status", {})
    if type(st) ~= "table" or type(st.status_list) ~= "table" then return end
    local seen = {}
    for _, v in ipairs(st.status_list) do
        local via = tostring(v.via or "")
        if v.enabled == true and (via:match("^wgclient%d+$") or via:match("^ovpnclient%d+$")) then
            seen[via] = true
            local s = stk[via] or { tries = {} }
            if v.status ~= 1 then
                s.since = s.since or now
                local recent = {}; for _, t in ipairs(s.tries) do if now - t < 6 * 3600 then recent[#recent + 1] = t end end; s.tries = recent
                if now - s.since >= 600 and (not s.restarted or now - s.restarted >= 600) then
                    if #s.tries < 3 then
                        s.tries[#s.tries + 1] = now; s.restarted = now; s.since = now
                        local pidf = "/var/run/ovpnclient-" .. via .. ".pid"
                        if via:match("^ovpn") and exists(pidf) then
                            local pid = trim(readf(pidf) or ""); if pid:match("^%d+$") then os.execute("kill " .. pid .. " >/dev/null 2>&1") end
                            os.execute("(sleep 3; ifup " .. via .. ") >/dev/null 2>&1 &")
                        else
                            os.execute("(ifdown " .. via .. "; sleep 3; ifup " .. via .. ") >/dev/null 2>&1 &")
                        end
                        log("stuck tunnel: restarted " .. via .. " (try " .. #s.tries .. ")")
                        alert("vpn", "🔧 Restarted " .. tostring(v.name or via) .. ": stuck connecting",
                            tostring(v.name or via) .. " was switched on but hadn't connected for 10 minutes, so its connection process was restarted (try " .. #s.tries .. " of 3 in 6 hours).", "orange")
                    elseif not s.gave then
                        s.gave = true
                        alert("vpn", "⛔ " .. tostring(v.name or via) .. " won't connect",
                            "Still not connected after 3 restarts. Its server may be down or its login/key may have changed: try another server for this tunnel (click it on the VPN card) or check GL's VPN page.", "red")
                    end
                end
            else
                if s.restarted and now - s.restarted < 1200 then alert("vpn", "✅ " .. tostring(v.name or via) .. " connected after the restart", "The tunnel is up again.", "green") end
                s = { tries = s.tries }
            end
            stk[via] = s
        end
    end
    for via in pairs(stk) do if not seen[via] then stk[via] = nil end end
end

-- ================================================================ 14. a service whose memory keeps growing
-- Hourly: memory (RSS) per process name. A known service that grew in 5 of the last 6 hours by 15 MB+ and 30%+,
-- while the router has under 35% memory free, gets restarted (once a day per service). Never the whole router.
local MEMSVC = { nginx = "nginx", tailscaled = "tailscale", dnsmasq = "dnsmasq", AdGuardHome = "adguardhome", odhcpd = "odhcpd" }
local mem_t, memh, mem_done = 0, {}, {}
local function mem_tick(now)
    if now - mem_t < 3600 then return end; mem_t = now
    local sum = {}
    for line in sh("for p in /proc/[0-9]*; do n=$(cat $p/comm 2>/dev/null); r=$(awk '/VmRSS/{print $2}' $p/status 2>/dev/null); [ -n \"$r\" ] && echo \"$n $r\"; done"):gmatch("[^\n]+") do
        local n, kb = line:match("^(%S+)%s+(%d+)$"); if n and MEMSVC[n] then sum[n] = (sum[n] or 0) + tonumber(kb) end
    end
    local mt = tonumber((readf("/proc/meminfo") or ""):match("MemTotal:%s+(%d+)")) or 1
    local ma = tonumber((readf("/proc/meminfo") or ""):match("MemAvailable:%s+(%d+)")) or mt
    local freepct = ma * 100 / mt
    for n, kb in pairs(sum) do
        local h = memh[n] or {}; h[#h + 1] = kb; while #h > 7 do table.remove(h, 1) end; memh[n] = h
        if #h >= 7 and cfg("mem_fix", true) == true and freepct < 35 and now - (mem_done[n] or 0) >= 86400 then
            local ups = 0; for i = 2, #h do if h[i] > h[i - 1] then ups = ups + 1 end end
            local grow = h[#h] - h[1]
            if ups >= 5 and grow >= 15 * 1024 and grow >= h[1] * 0.3 and exists("/etc/init.d/" .. MEMSVC[n]) then
                mem_done[n] = now; memh[n] = {}
                os.execute("/etc/init.d/" .. MEMSVC[n] .. " restart >/dev/null 2>&1 &")
                log("memory: restarted " .. MEMSVC[n] .. " (" .. math.floor(h[1] / 1024) .. " -> " .. math.floor(h[#h] / 1024) .. " MB)")
                alert("health", "🧠 Restarted " .. n .. ": its memory kept growing",
                    string.format("%s grew from %d MB to %d MB over 6 hours while the router had only %.0f%% memory free, so just that service was restarted (no router reboot). If it keeps happening, a firmware update usually fixes it.",
                        n, math.floor(h[1] / 1024), math.floor(h[#h] / 1024), freepct), "orange")
            end
        end
    end
end

-- ================================================================ 20 + 23. forget removed VPNs automatically
-- Hourly: which providers / servers are on a tunnel now. Anything not seen for 24 h is forgotten (speed history,
-- 7-day reliability, last speed results). keep_provider (default on): servers of a provider you still use stay.
local vf_t = 0
function N.vpn_current()
    local st = lrpc("vpn-client", "get_status", {})
    local pv = lrpc("machome", "get_vpn_providers", {})
    if type(st) ~= "table" or type(st.status_list) ~= "table" then return nil end
    local groups = (type(pv) == "table" and type(pv.groups) == "table") and pv.groups or {}
    local cur = { providers = {}, servers = {}, ifaces = {} }
    for _, v in ipairs(st.status_list) do
        if v.via then
            local prov = groups[tostring(v.group_id)] or v.name or v.via
            cur.providers[tostring(prov):lower()] = true
            if v.name then cur.providers[tostring(v.name):lower()] = true end     -- reliability keys without a provider use the tunnel name
            cur.servers[(tostring(prov) .. "|" .. tostring(v.peer_name or v.via)):lower()] = true
            cur.ifaces[v.via] = true
        end
    end
    return cur
end
local function vf_tick(now)
    if now - vf_t < 3600 then return end; vf_t = now
    local cur = N.vpn_current(); if not cur then return end
    if not next(cur.ifaces) then return end          -- GL lists no tunnel at all (hiccup / being set up): never forget then
    keep.seen = keep.seen or { prov = {}, srv = {} }
    for p in pairs(cur.providers) do keep.seen.prov[p] = now end
    for s in pairs(cur.servers) do keep.seen.srv[s] = now end
    if cfg("vpn_autoforget", true) == false then keep_save(); return end   -- owner turned the automatic part off
    local P = more(); if not (P and P.vpn_forget_plan) then keep_save(); return end
    local kp = cfg("vpn_keep_provider", true) ~= false
    -- grace: forget only what has been missing for 24 h (first time we see it missing counts as "now")
    local function gone_ok(kind, id)
        local t = keep.seen[kind][id]
        if not t then keep.seen[kind][id] = now; return false end
        return now - t >= 86400
    end
    local plan = P.vpn_forget_plan(cur, kp, gone_ok)
    keep_save()
    if plan.total > 0 then
        if #plan.rel > 0 and X and X.rel_forget then X.rel_forget(plan.rel) end
        P.vpn_forget_apply_files(plan)
        log("forgot removed VPNs: " .. plan.total .. " item(s)")
    end
end

-- ================================================================ 9 + 10. hourly internet stats (31 days), lag log, evenings
-- Every 10 s: the best ping of Cloudflare / Google / Quad9 straight over the WAN (not during a speed test). Each hour
-- becomes one row in /etc/machome/wan_hours.json {h, n, med, avg, spk (% over the ping limit), loss (% no answer)}.
local HOURS, PLOG = EDIR .. "/wan_hours.json", EDIR .. "/ping_log.json"
local hr = { h = nil, v = {}, n = 0, sum = 0, over = 0, lost = 0 }
local function hour_flush(now)
    if not hr.h or hr.n < 30 then return end
    local list = jread(HOURS, {})
    local m = median(hr.v)
    list[#list + 1] = { h = hr.h, n = hr.n, med = m and r1(m) or cjson.null, avg = (hr.n - hr.lost) > 0 and r1(hr.sum / (hr.n - hr.lost)) or cjson.null,
        spk = (hr.n - hr.lost) > 0 and r1(hr.over * 100 / (hr.n - hr.lost)) or 0, loss = r1(hr.lost * 100 / hr.n) }
    while #list > 31 * 24 do table.remove(list, 1) end
    writef(HOURS, cjson.encode(list))
end
local function hours_tick(now, ctx)
    if is_ap(now) then return end
    local h = now - now % 3600
    if hr.h ~= h then pcall(hour_flush, now); hr = { h = h, v = {}, n = 0, sum = 0, over = 0, lost = 0 } end
    if (jread(DIR .. "/speedtest.json", {}) or {}).running then return end
    local wr, best = ctx.ping and ctx.ping.wan, nil
    if not wr then return end
    if type(wr.each) == "table" then for _, e in ipairs(wr.each) do local ms = tonumber(e.ms); if ms and (not best or ms < best) then best = ms end end end
    hr.n = hr.n + 1
    if best then
        hr.sum = hr.sum + best; if #hr.v < 400 then hr.v[#hr.v + 1] = best end
        if best > (tonumber(cfg("ping_ms", 75)) or 75) then hr.over = hr.over + 1 end
    else hr.lost = hr.lost + 1 end
end
-- lag episodes for the ISP log: taken from the high-ping alert's state (X.pinghigh) when it starts / ends
local lag = nil
local function lag_tick(now)
    local ph = X and X.pinghigh
    if ph and not lag then lag = { s = ph.since or now, kind = ph.spiky and "spiky" or "high", worst = ph.ms or 0, pct = ph.pct }
    elseif ph and lag then lag.worst = math.max(lag.worst, ph.ms or 0); if ph.spiky then lag.kind = "spiky"; lag.pct = math.max(lag.pct or 0, ph.pct or 0) end
    elseif lag and not ph then
        local list = jread(PLOG, {}); lag.e = now; list[#list + 1] = lag
        while #list > 300 do table.remove(list, 1) end
        writef(PLOG, cjson.encode(list)); lag = nil
    end
end
-- 10. evenings: once a day at 11:05 PM, compare 7-11 PM with the rest of each of the last 7 days
local eve_day = nil
local function eve_check(now)
    local list = jread(HOURS, {})
    local days = {}
    for _, x in ipairs(list) do
        if now - x.h < 7 * 86400 and tonumber(x.med) then
            local t = os.date("*t", x.h); local d = os.date("%Y-%m-%d", x.h)
            days[d] = days[d] or { eve = {}, rest = {}, espk = {}, rspk = {} }
            if t.hour >= 19 and t.hour < 23 then table.insert(days[d].eve, x.med); table.insert(days[d].espk, x.spk or 0)
            elseif t.hour >= 6 and t.hour < 19 then table.insert(days[d].rest, x.med); table.insert(days[d].rspk, x.spk or 0) end
        end
    end
    local n, slow, em, rm, es = 0, 0, {}, {}, {}
    for _, d in pairs(days) do
        if #d.eve >= 3 and #d.rest >= 6 then
            n = n + 1
            local e, r, se, sr = median(d.eve), median(d.rest), median(d.espk), median(d.rspk)
            em[#em + 1] = e; rm[#rm + 1] = r; es[#es + 1] = se
            if (e >= r * 2 and e - r >= 20) or (se >= 15 and sr <= 5) then slow = slow + 1 end
        end
    end
    keep.evening = { t = now, days = n, slow = slow, eve = #em > 0 and r1(median(em)) or nil, rest = #rm > 0 and r1(median(rm)) or nil, espk = #es > 0 and r1(median(es)) or nil }
    keep_save()
    if n >= 4 and slow >= 4 and now - (keep.eve_sent or 0) >= 7 * 86400 then
        keep.eve_sent = now; keep_save()
        alert("isp", "🌆 Your internet slows down most evenings",
            "On **" .. slow .. " of the last " .. n .. " days** your internet was much worse between 7 and 11 PM: ping around **" .. math.floor(keep.evening.eve or 0) .. " ms** in the evening vs **" .. math.floor(keep.evening.rest or 0) ..
            " ms** during the day" .. ((keep.evening.espk or 0) > 0 and (", with lag spikes in " .. math.floor(keep.evening.espk) .. "% of evening checks") or "") ..
            ". That pattern usually means your ISP's local network is overloaded at busy times (not your router or Wi-Fi). Worth mentioning to your ISP; the Outage & lag log in the ISP report card has the details.", "orange")
    end
end
local function eve_tick(now)
    if is_ap(now) then return end
    local t = os.date("*t", now); local d = os.date("%Y-%m-%d", now)
    if t.hour == 23 and t.min >= 5 and eve_day ~= d then eve_day = d; pcall(eve_check, now) end
end

-- ================================================================ 16. the cable modem restarted (its uptime reset)
local mdm_t = 0
local function modem_tick(now)
    if now - mdm_t < 300 or is_ap(now) then return end; mdm_t = now
    local m = jread(DIR .. "/modem.json", nil)
    if type(m) ~= "table" or m.ok ~= true or not tonumber(m.up_s) or not tonumber(m.t) then return end
    local boot = tonumber(m.t) - tonumber(m.up_s)
    local old = tonumber(keep.modem_boot)
    if not old then
        keep.modem_boot = boot
        -- first run: log a restart from the last 2 days for the ISP log (no alert: it's old news)
        if now - boot < 2 * 86400 then keep.modem_boots = { { t = boot } } end
        keep_save(); return
    end
    if boot - old > 900 then
        keep.modem_boot = boot
        keep.modem_boots = type(keep.modem_boots) == "table" and keep.modem_boots or {}
        table.insert(keep.modem_boots, { t = boot, up = boot - old }); while #keep.modem_boots > 30 do table.remove(keep.modem_boots, 1) end
        keep_save()
        alert("wan", "🔁 Your cable modem restarted at " .. os.date("%I:%M %p", boot):gsub("^0", ""),
            "The modem's uptime started over at " .. os.date("%a %I:%M %p", boot) .. " (it had been up about " .. fmtdur(boot - old) .. "). If nobody restarted it (and auto-heal didn't), it rebooted by itself: a power blip, an ISP firmware update or a fault. Several of these in a week is worth reporting to your ISP.", "orange")
    elseif math.abs(boot - old) <= 900 and boot ~= old then keep.modem_boot = math.min(boot, old) end
end

-- ================================================================ 14. reconnect a tunnel when its VPN server is reachable again
-- Only for tunnels auto-heal already gave up on (3 restarts) or that have been down 30+ minutes. Pings the VPN server
-- straight over the internet; when it starts answering again (or hourly if the server never answers pings), the
-- tunnel is restarted once. At most 6 tries a day per tunnel.
local vr_t, vr = 0, {}
local function endpoint(via)
    if via:match("^wgclient") then return sh("wg show " .. via .. " endpoints"):match("%s(%d+%.%d+%.%d+%.%d+):%d+") end
    local st = readf("/tmp/ovpnclient/status_table") or ""
    local blk = st:match("config status '" .. via .. "'(.-)\n\n") or st:match("config status '" .. via .. "'(.*)$") or ""
    return blk:match("option endpoint '(%d+%.%d+%.%d+%.%d+)'")
end
local function restart_tun(via)
    local pidf = "/var/run/ovpnclient-" .. via .. ".pid"
    if via:match("^ovpn") and exists(pidf) then
        local pid = trim(readf(pidf) or ""); if pid:match("^%d+$") then os.execute("kill " .. pid .. " >/dev/null 2>&1") end
        os.execute("(sleep 3; ifup " .. via .. ") >/dev/null 2>&1 &")
    else os.execute("(ifdown " .. via .. "; sleep 3; ifup " .. via .. ") >/dev/null 2>&1 &") end
end
local function vret_tick(now)
    if now - vr_t < 60 or is_ap(now) then return end; vr_t = now
    if cfg("vpn_return", true) ~= true or cfg("autoheal", true) ~= true or (X and X.wan_since) or not (X and X.vpn_state) then vr = {}; return end
    local okv, down = pcall(X.vpn_state); if not okv or type(down) ~= "table" then return end
    for via in pairs(vr) do if not down[via] then if vr[via].tried and vr[via].tried > 0 then alert("vpn", "✅ " .. tostring(vr[via].name or via) .. " is connected again", "It came back after its VPN server became reachable again.", "green") end; vr[via] = nil end end
    for via, s in pairs(down) do
        if (s.gaveup or now - (s.since or now) >= 1800) and (via:match("^wgclient%d+$") or via:match("^ovpnclient%d+$")) then
            local r = vr[via] or { tries = {}, reach = nil, last = 0, name = s.label or via }
            local recent = {}; for _, t in ipairs(r.tries) do if now - t < 86400 then recent[#recent + 1] = t end end; r.tries = recent
            local ip = endpoint(via)
            local reach = ip and (tonumber(sh("ping -c 2 -W 2 " .. ip .. " | sed -n 's/.* \\([0-9]*\\) packets received.*/\\1/p'")) or 0) > 0 or false
            local cameback = reach and r.reach == false
            local hourly = (not reach) and r.everreach ~= true and now - r.last >= 3600
            if reach then r.everreach = true end
            if (cameback or hourly) and #r.tries < 6 then
                r.tries[#r.tries + 1] = now; r.last = now; r.tried = (r.tried or 0) + 1
                restart_tun(via)
                log("vpn return: restarting " .. via .. (cameback and " (its server answers again)" or " (hourly try; its server doesn't answer pings)"))
                if cameback then alert("vpn", "🔌 " .. tostring(r.name) .. ": its VPN server is back, reconnecting", "The server " .. ip .. " stopped answering while the tunnel was down and answers again now, so the tunnel was restarted.", "blue") end
            end
            r.reach = reach; vr[via] = r
        end
    end
end

-- ================================================================ 13. unusual blocking for one device (opt-in)
-- Every 10 min: AdGuard's newest blocked lookups (query log), counted per device per hour; 7 days kept per device in
-- /etc/machome/adb_hours.json. A finished hour with 5x the device's usual blocked count (and 300+) = one alert,
-- at most every 12 hours per device, with the domains it was trying to reach.
local ab_t, ab = 0, { h = nil, cnt = {}, dom = {} }
local ABH = EDIR .. "/adb_hours.json"
local function ab_flush(now)
    if not ab.h then return end
    local hist = jread(ABH, {})
    for ip, n in pairs(ab.cnt) do
        local list = type(hist[ip]) == "table" and hist[ip] or {}
        -- the device's usual: average blocked per hour over its earlier hours (needs a day of history)
        local sum, cnt = 0, 0; for _, x in ipairs(list) do sum = sum + (tonumber(x.n) or 0); cnt = cnt + 1 end
        local usual = cnt >= 24 and sum / cnt or nil
        if cfg("adg_watch", false) == true and n >= 300 and (usual and (n >= usual * 5 and n - usual >= 250) or (not usual and n >= 1000)) then
            keep.ab_sent = keep.ab_sent or {}
            if now - (keep.ab_sent[ip] or 0) >= 12 * 3600 then
                keep.ab_sent[ip] = now; keep_save()
                local doms = {}; for d, c in pairs(ab.dom[ip] or {}) do doms[#doms + 1] = { d, c } end
                table.sort(doms, function(a, b) return a[2] > b[2] end)
                local top = {}; for i = 1, math.min(3, #doms) do top[#top + 1] = doms[i][1] .. " (" .. doms[i][2] .. ")" end
                local who = ipname[ip] and ipname[ip] ~= "" and (ipname[ip] .. " (" .. ip .. ")") or ip
                alert("adspike", "📛 Unusual blocking: " .. who,
                    "AdGuard blocked **" .. n .. "** lookups from " .. who .. " in the hour from " .. os.date("%I:%M %p", ab.h) .. (usual and (" (it usually has about " .. math.floor(usual + 0.5) .. " an hour)") or " (it has no history yet)") ..
                    ". Mostly: " .. (#top > 0 and table.concat(top, ", ") or "?") .. ". Often a new app or ad-heavy game, but it can also be malware calling home. Check what that device is doing.", "orange")
            end
        end
        list[#list + 1] = { h = ab.h, n = n }
        while #list > 0 and now - list[1].h > 7 * 86400 do table.remove(list, 1) end
        hist[ip] = list
    end
    local nd = 0; for _ in pairs(hist) do nd = nd + 1 end
    if nd > 60 then for ip, l in pairs(hist) do if #l == 0 or now - l[#l].h > 3 * 86400 then hist[ip] = nil end end end
    writef(ABH, cjson.encode(hist))
end
local function ab_tick(now)
    if now - ab_t < 600 or is_ap(now) then return end; ab_t = now
    if cfg("adg_watch", false) ~= true then return end
    local P = more(); if not (P and P.adg_blocked) then return end
    local list = P.adg_blocked(1000); if type(list) ~= "table" then return end
    local h = now - now % 3600
    if ab.h and ab.h ~= h then pcall(ab_flush, now); ab = { h = h, cnt = {}, dom = {} } end
    ab.h = ab.h or h
    local last, newest = keep.ab_last or "", keep.ab_last or ""
    for _, e in ipairs(list) do
        local t = tostring(e.time or "")
        if last ~= "" and t > last then
            local ip = tostring(e.client or "")
            ab.cnt[ip] = (ab.cnt[ip] or 0) + 1
            ab.dom[ip] = ab.dom[ip] or {}; local d = tostring(e.name or "?"); ab.dom[ip][d] = (ab.dom[ip][d] or 0) + 1
        end
        if t > newest then newest = t end
    end
    if newest ~= keep.ab_last then keep.ab_last = newest; keep_save() end
end

-- ================================================================ 9. "Send to Discord" from the Outage & lag log (rpc isp_log_send)
local function islog_tick(now)
    local f = readf(DIR .. "/isp_log_send.json"); if not f then return end
    os.remove(DIR .. "/isp_log_send.json")
    local ok, q = pcall(cjson.decode, f); if not ok or type(q) ~= "table" or not q.text then return end
    if X and X.send then X.send(tostring(q.title or "📋 Internet log"), tostring(q.text):sub(1, 3900), "blue") end
end

-- ================================================================ tick / live
function N.tick(now, x, ctx)
    X = x; ctx = ctx or {}
    pcall(rates, now)
    pcall(outage_tick, now, ctx)
    pcall(dns_tick, now, ctx)
    pcall(bloat_tick, now, ctx)
    pcall(top_tick, now)
    pcall(v6_tick, now)
    pcall(nat_tick, now)
    pcall(sqm_tick, now)
    pcall(stuck_tick, now)
    pcall(mem_tick, now)
    pcall(vf_tick, now)
    -- 2026-11-18 evening: owner's picks 9, 10, 13, 14, 16
    pcall(hours_tick, now, ctx)
    pcall(lag_tick, now)
    pcall(eve_tick, now)
    pcall(modem_tick, now)
    pcall(vret_tick, now)
    pcall(ab_tick, now)
    pcall(islog_tick, now)
end
function N.live()
    local outs = jread(OUTF, {})
    local s = keep.sqm or {}
    return { v6 = live.v6 or cjson.null, dns = live.dns or cjson.null, adg = live.adg or cjson.null, probe = live.probe or cjson.null,
        top = live.top or cjson.null, bloat = live.bloat or cjson.null, last_cause = outs[#outs] or cjson.null,
        sqm = s.phase or cjson.null, evening = keep.evening or cjson.null,
        modem_boot = (type(keep.modem_boots) == "table" and keep.modem_boots[#keep.modem_boots]) or cjson.null }
end
return N
