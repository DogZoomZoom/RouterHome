-- machome health: router self-care + extra alerts. Shared by every router; loaded by extras.lua and called
-- every sampler tick (~10 s) as H.tick(now, X). Everything is inside pcall in the caller.
--   * smart reboot on MAJOR, LASTING problems only (memory exhausted / connection table full / GL API stuck),
--     after a gentler fix, with guardrails (>=6 h uptime, max 1/24 h and 2/7 d, never during speed test,
--     NAS backup or firmware upgrade; "degraded" problems wait for 2-5 AM)
--   * restart hung GL web/API services       * clock (NTP) check
--   * capacity alerts (conntrack, flash, /tmp, memory)
--   * settings change log (hourly uci snapshot diff, secrets masked)
--   * slow-ISP alert (3 nightly WAN tests in a row under X % of plan)
--   * uplink cable speed / flapping          * weekly Wi-Fi channel report (routers with Wi-Fi)
local cjson = require "cjson"
local H = {}
local DIR, EDIR = "/tmp/machome", "/etc/machome"
local STATE = EDIR .. "/health.json"          -- reboot history, link baseline, report days (small, rarely written)
local SNAP = EDIR .. "/cfgsnap"               -- masked uci snapshot (mode 600)
local PENDING = EDIR .. "/reboot_pending.json"

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s, private)
    local t = p .. ".tmp"; local f = io.open(t, "w"); if not f then return end; f:write(s); f:close()
    if private then os.execute("chmod 600 " .. t) end; os.rename(t, p)
end
local function trim(s) return s and (s:gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jread(p, d) local s = readf(p); if not s or s == "" then return d end; local ok, v = pcall(cjson.decode, s); if ok and type(v) == "table" then return v end; return d end
local function exists(p) local f = io.open(p, "r"); if f then f:close(); return true end; return false end
local function num(p) return tonumber(trim(readf(p) or "")) end
local function fmtdur(s) s = math.floor(s); if s < 90 then return s .. " s" elseif s < 5400 then return math.floor(s / 60 + 0.5) .. " min" else return string.format("%.1f h", s / 3600) end end
local function uptime() return math.floor(tonumber((readf("/proc/uptime") or "0"):match("^([%d%.]+)")) or 0) end

local st = jread(STATE, {}); st.reboots = st.reboots or {}
local function save() writef(STATE, cjson.encode(st)) end
local X                                         -- extras module (alert + cfg), set on each tick
local function alert(kind, title, desc, color) if X and X.alert then X.alert(kind, title, desc, color) end end
local function cfg(k, d) local v = X and X.cfg and X.cfg[k]; if v == nil then return d end; return v end

-- ---------------------------------------------------------------- measurements
local function mem_pct()   -- % available
    local m = readf("/proc/meminfo") or ""
    local t, a = tonumber(m:match("MemTotal:%s+(%d+)")), tonumber(m:match("MemAvailable:%s+(%d+)"))
    if not t or not a or t == 0 then return nil end
    return a * 100 / t
end
local function ct_pct()
    local c, m = num("/proc/sys/net/netfilter/nf_conntrack_count"), num("/proc/sys/net/netfilter/nf_conntrack_max")
    if not c or not m or m == 0 then return nil, c, m end
    return c * 100 / m, c, m
end
local function df_pct(path) local l = sh("df -k " .. path .. " | awk 'NR==2{print $3, $2}'"); local u, t = l:match("(%d+)%s+(%d+)"); u, t = tonumber(u), tonumber(t); if not t or t == 0 then return nil end; return u * 100 / t end
local function api_ok()
    local out = sh("curl -s -m 8 -H 'glinet: 1' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"call\",\"params\":[\"\",\"system\",\"get_status\",{}]}' http://127.0.0.1/rpc")
    return out:find('"result"', 1, true) ~= nil
end
local function busy()   -- never reboot while one of these runs
    local s = jread(DIR .. "/speedtest.json", {})
    if s.running then return "a speed test is running" end
    if exists(DIR .. "/nas_running") then return "a NAS backup is running" end
    if trim(sh("pidof sysupgrade")) ~= "" or exists("/tmp/sysupgrade.tgz") or exists("/tmp/firmware.bin") then return "a firmware upgrade is in progress" end
    return nil
end

-- ---------------------------------------------------------------- after a reboot we made: report it
local function boot_report(now)
    local p = jread(PENDING, nil); if not p then return end
    local booted_at = now - uptime()
    if booted_at > (p.at or 0) then
        alert("health", "✅ Router is back after an automatic reboot", "Reason: " .. tostring(p.reason) .. ". Back " .. fmtdur(math.max(1, now - p.at)) .. " after it started rebooting.", "green")
        os.remove(PENDING)
    elseif now - (p.at or 0) > 600 then
        alert("health", "⚠️ Automatic reboot didn't happen", "The router decided to reboot (" .. tostring(p.reason) .. ") but is still running. Check it when you can.", "orange")
        os.remove(PENDING)
    end
end

-- ---------------------------------------------------------------- smart reboot
local cnt = { mem = 0, ct = 0, api = 0, api_after_fix = 0 }
local fixed = { mem = false, api = nil }
local waiting_note = nil
local function may_reboot(now, severity)
    if not cfg("autoreboot", true) then return false, "auto-reboot is turned off" end
    if uptime() < 6 * 3600 then return false, "the router started less than 6 hours ago" end
    local day, week = 0, 0
    for _, t in ipairs(st.reboots) do if now - t < 86400 then day = day + 1 end; if now - t < 7 * 86400 then week = week + 1 end end
    if day >= 1 then return false, "it already rebooted itself in the last 24 hours" end
    if week >= 2 then return false, "it already rebooted itself twice this week" end
    local b = busy(); if b then return false, b end
    if severity ~= "stuck" then local h = tonumber(os.date("%H", now)); if h < 2 or h >= 5 then return false, "waiting for the quiet window (2-5 AM)" end end
    return true
end
local function do_reboot(now, reason)
    st.reboots[#st.reboots + 1] = now; while #st.reboots > 10 do table.remove(st.reboots, 1) end; save()
    writef(PENDING, cjson.encode({ at = now, reason = reason }))
    alert("health", "🔁 Rebooting the router automatically", reason .. ". A gentler fix didn't help, so it's restarting now (about 1-2 minutes). You'll get a message when it's back.", "orange")
    os.execute("logger -t machome 'auto-reboot: " .. reason:gsub("'", "") .. "'; (sleep 5; sync; reboot) >/dev/null 2>&1 &")
end
local function restart_gl(why)
    os.execute("logger -t machome 'restarting GL web/API services: " .. why .. "'; /etc/init.d/rpcd restart >/dev/null 2>&1; /etc/init.d/nginx restart >/dev/null 2>&1")
end

-- ---------------------------------------------------------------- auto-heal: connection table relief (ct_relief, 2026-11-14)
-- A gentler step long before the smart reboot looks at a full table: at >= 90 % for 5 minutes, clear the connections
-- of ONE device holding >= 30 % of them (it simply reconnects); otherwise shorten idle timeouts until it's under 60 %.
local ctr = { t = 0, n90 = 0, short = nil }
local CTP = "/proc/sys/net/netfilter/"
local function lease_name(ip)
    for l in (readf("/tmp/dhcp.leases") or ""):gmatch("[^\n]+") do
        local a, nm = l:match("^%d+ %S+ (%S+) (%S+)"); if a == ip and nm ~= "*" then return nm end
    end
end
local function ct_relief(now, cc)
    ctr.t = now
    local top = trim(sh("conntrack -L 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i ~ /^src=/){print substr($i,5); break}}' | sort | uniq -c | sort -rn | head -1"))
    local n, ip = top:match("^(%d+)%s+(%d+%.%d+%.%d+%.%d+)$"); n = tonumber(n)
    local lan = trim(sh("uci -q get network.lan.ipaddr")):gsub("/.*", "")
    local private = ip and (ip:match("^192%.168%.") or ip:match("^10%.") or ip:match("^172%.")) and ip ~= lan
    if n and cc and n >= cc * 0.3 and private then
        os.execute("logger -t machome 'ct-relief: clearing " .. n .. " connections of " .. ip .. "'; conntrack -D -s " .. ip .. " >/dev/null 2>&1")
        alert("health", "📈 Cleared one device's connections", string.format("The router's connection table was over 90%% full for 5 minutes. **%s** (%s) alone had %d of the %d tracked connections, so those were cleared; the device simply reconnects. If it keeps happening, that device may have a stuck app, a torrent or malware.",
            lease_name(ip) or "A device", ip, n, cc), "orange")
    elseif not ctr.short then
        local est, udp = num(CTP .. "nf_conntrack_tcp_timeout_established"), num(CTP .. "nf_conntrack_udp_timeout_stream")
        if not est or est <= 1800 then return end
        ctr.short = { est = est, udp = udp }
        os.execute("echo 1800 > " .. CTP .. "nf_conntrack_tcp_timeout_established; " .. ((udp and udp > 60) and ("echo 60 > " .. CTP .. "nf_conntrack_udp_timeout_stream; ") or "") .. "logger -t machome 'ct-relief: shortened idle timeouts'")
        alert("health", "📈 Connection table nearly full: idle connections expire sooner", "The router's connection table was over 90% full for 5 minutes, spread across many devices. Idle connections now expire after 30 minutes instead of about 2 hours until it's back under 60%. Nothing was restarted.", "orange")
    end
end
local function ct_watch(now, cp, cc)
    if cp and cp >= 90 then ctr.n90 = ctr.n90 + 1 else ctr.n90 = 0 end
    if ctr.n90 >= 5 and cfg("ct_relief", true) and now - ctr.t >= 3600 then ct_relief(now, cc) end
    if ctr.short and cp and cp < 60 then              -- back to normal: restore the original timeouts (a reboot also does)
        os.execute("echo " .. ctr.short.est .. " > " .. CTP .. "nf_conntrack_tcp_timeout_established; " .. (ctr.short.udp and ("echo " .. ctr.short.udp .. " > " .. CTP .. "nf_conntrack_udp_timeout_stream; ") or "") .. "logger -t machome 'ct-relief: timeouts restored'")
        ctr.short = nil
    end
end

local function minute_checks(now)
    -- memory
    local mp = mem_pct()
    if mp and mp < 5 then cnt.mem = cnt.mem + 1 else cnt.mem = 0; fixed.mem = false end
    if cnt.mem == 5 and not fixed.mem then
        fixed.mem = true; restart_gl("memory under 5%")
        alert("health", "🧠 Router memory almost exhausted", string.format("Only %.0f%% of memory free for 5 minutes. Restarted the GL web/API services to free some. The router will reboot itself if it stays this low.", mp), "orange")
    end
    -- connection table
    local cp, cc, cm = ct_pct()
    if cp and cp >= 95 then cnt.ct = cnt.ct + 1 else cnt.ct = 0 end
    pcall(ct_watch, now, cp, cc)
    -- GL API (item 4: restart hung services)
    if api_ok() then
        if fixed.api then alert("health", "🟢 Router admin services recovered", "The GL web/API services are answering again.", "green") end
        cnt.api, cnt.api_after_fix, fixed.api = 0, 0, nil
    else
        cnt.api = cnt.api + 1
        if cnt.api == 3 and not fixed.api then
            fixed.api = now; restart_gl("GL API not answering for 3 min")
            alert("health", "🛠 Router admin services were stuck", "The GL web/API services stopped answering for 3 minutes, so they were restarted.", "orange")
        elseif fixed.api then cnt.api_after_fix = cnt.api_after_fix + 1 end
    end
    -- decide
    local reason, severity, kind = nil, nil, nil
    if fixed.api and cnt.api_after_fix >= 10 then reason, severity, kind = "The router's admin/API services stayed stuck for 10 minutes after being restarted", "stuck", "api"
    elseif cnt.mem >= 15 then reason, severity, kind = "Memory under 5% free for 15+ minutes", "degraded", "mem"
    elseif cnt.ct >= 15 then reason, severity, kind = string.format("Connection table over 95%% full (%s of %s) for 15+ minutes", tostring(cc), tostring(cm)), "degraded", "ct" end
    if reason then
        local ok, why = may_reboot(now, severity)
        if ok then do_reboot(now, reason); cnt.mem, cnt.ct, cnt.api_after_fix = 0, 0, 0
        elseif waiting_note ~= kind .. "|" .. why then   -- one message per problem/reason, not every minute
            waiting_note = kind .. "|" .. why
            alert("health", "⏸ Router needs a reboot, but not right now", reason .. ". Not rebooting because " .. why .. ".", "orange")
        end
    else waiting_note = nil end
end

-- ---------------------------------------------------------------- capacity alerts (item 16)
local cap = {}
local function cap_check(key, val, limit, title, text)
    if not val then return end
    if val >= limit and not cap[key] then cap[key] = true; alert("health", title, string.format(text, val), "orange")
    elseif cap[key] and val < limit - 10 then cap[key] = false; alert("health", "🟢 " .. title:gsub("^%S+%s+", "") .. ": back to normal", string.format("Now at %.0f%%.", val), "green") end
end
-- DHCP pool use (same rule as rpc get_stats.dhcp): nil when this router doesn't hand out addresses
local function dhcp_pct()
    local o = {}; for l in sh("for k in dhcp.lan.ignore dhcp.lan.start dhcp.lan.limit network.lan.ipaddr network.lan.netmask dhcp.@dnsmasq[0].leasefile glconfig.general.mode; do echo \"$(uci -q get $k)\"; done"):gmatch("([^\n]*)\n") do o[#o + 1] = l end
    if o[7] == "ap" or o[1] == "1" or not tonumber(o[2]) or not tonumber(o[3]) then return nil end
    local function n(ip) local a, b, c, d = tostring(ip or ""):match("^(%d+)%.(%d+)%.(%d+)%.(%d+)"); if not a then return nil end; return ((tonumber(a) * 256 + tonumber(b)) * 256 + tonumber(c)) * 256 + tonumber(d) end
    local ip, mask = n(o[4]), n(o[5]); local cidr = tostring(o[4] or ""):match("/(%d+)$")
    if not mask and cidr then mask = 4294967296 - 2 ^ (32 - tonumber(cidr)) end
    if not ip or not mask then return nil end
    local size = 4294967296 - mask; local net = ip - ip % size
    local first = net + tonumber(o[2]); local last = math.min(first + tonumber(o[3]) - 1, net + size - 2)
    if last < first then return nil end
    local used, seen, now = 0, {}, os.time()
    for l in (readf((o[6] ~= "" and o[6]) or "/tmp/dhcp.leases") or ""):gmatch("[^\n]+") do
        local exp, lip = l:match("^(%d+) %S+ (%d+%.%d+%.%d+%.%d+)"); local x = n(lip)
        if x and x >= first and x <= last and not seen[x] and (tonumber(exp) == 0 or tonumber(exp) > now) then seen[x] = true; used = used + 1 end
    end
    return used * 100 / (last - first + 1)
end

-- ---------------------------------------------------------------- auto-heal: free up storage (storage_trim, 2026-11-14)
-- Only files that are safe to lose: the package-list cache (re-downloaded by "opkg update"), our own leftovers
-- (unfinished backup archives, old temp/cookie files) and stray .ipk downloads. Never settings, history, the undo
-- backups in /root/machome-backup, or anything while a firmware upgrade / backup / speed test runs. Once per 6 h.
local trim_t = 0
local function free_kb(path) local l = sh("df -k " .. path .. " | awk 'NR==2{print $4}'"); return tonumber(trim(l)) or 0 end
local function storage_trim(now, which, pct)
    if not cfg("storage_trim", true) or now - trim_t < 6 * 3600 or busy() then return end
    trim_t = now
    local path = which == "tmp" and "/tmp" or "/overlay"
    local before = free_kb(path)
    os.execute("rm -rf /tmp/opkg-lists; rm -f /tmp/*.ipk /tmp/machome/*.tar.gz /tmp/machome/*.cookies /tmp/machome/*.form 2>/dev/null; " ..
        "find /tmp/machome /etc/machome -maxdepth 1 -name '*.tmp' -mmin +60 -exec rm -f {} \\; 2>/dev/null; logger -t machome 'storage-trim: " .. path .. " was " .. math.floor(pct) .. "%'")
    local freed = (free_kb(path) - before) / 1024
    alert("health", "🧹 Cleaned up router storage", string.format("%s was %.0f%% full, so auto-heal deleted files that are safe to lose (package lists, leftover temporary files)%s.",
        which == "tmp" and "The router's RAM disk (/tmp)" or "The router's storage", pct,
        freed >= 0.1 and string.format(" and freed %.1f MB", freed) or ", but there was nothing big to delete. Something else is filling it; check the router's storage in the admin page"), "orange")
end

local function capacity(now)
    cap_check("dhcp", (dhcp_pct()), 90, "📇 DHCP pool almost full", "%.0f%% of the router's DHCP addresses are in use. New devices may not get an address. Enlarge the pool or shorten the lease time (Network > LAN).")
    cap_check("ct", (ct_pct()), 80, "📈 Connection table filling up", "The router is tracking %.0f%% of the connections it can hold. Usually one device opening thousands of connections (torrent, malware, a stuck app).")
    local fp, tp = df_pct("/overlay"), df_pct("/tmp")
    cap_check("flash", fp, 85, "💾 Router storage almost full", "%.0f%% of the router's storage is used. Settings and logs may fail to save.")
    cap_check("tmp", tp, 80, "💾 Router RAM disk almost full", "/tmp is %.0f%% full. Live data and downloads may fail.")
    if tp and tp >= 80 then storage_trim(now, "tmp", tp) elseif fp and fp >= 85 then storage_trim(now, "overlay", fp) end
    local mp = mem_pct(); cap_check("mem", mp and (100 - mp), 90, "🧠 Router memory running low", "%.0f%% of memory is in use.")
end

-- ---------------------------------------------------------------- clock (item 5)
local clock_bad, clock_fixed = 0, false
local function clock(now)
    local year = tonumber(os.date("%Y", now)) or 0
    local tr = sh("chronyc tracking")
    local leap = tr:match("Leap status%s*:%s*([%w ]+)")
    local off = tonumber(tr:match("System time%s*:%s*([%d%.]+) seconds"))
    local bad = year < 2025 or (tr ~= "" and ((leap and not leap:match("Normal")) or (off and off > 30)))
    if bad then
        clock_bad = clock_bad + 1
        if clock_bad == 2 then
            os.execute("/etc/init.d/chronyd restart >/dev/null 2>&1 || /etc/init.d/sysntpd restart >/dev/null 2>&1")
            clock_fixed = true
            alert("health", "🕒 Router clock isn't syncing", "Time sync status: " .. trim(leap or "unknown") .. (off and string.format(", off by %.0f s", off) or "") .. ". Restarted the time service. A wrong clock breaks VPN connections and HTTPS.", "orange")
        end
    else
        if clock_fixed then alert("health", "🕒 Router clock is in sync again", "Time sync recovered.", "green") end
        clock_bad, clock_fixed = 0, false
    end
end

-- ---------------------------------------------------------------- settings change log (item 14)
local SECRET = { "key", "pass", "psk", "secret", "token", "private", "preshared", "webhook", "sae", "username" }
-- Lua patterns (no "|"): one entry per noisy thing
local NOISY = { "^luci%.", "^ubootenv%.", "^gl%-cloud%.[^=]*token", "^gl%-cloud%.[^=]*time", "^gl%-cloud%.[^=]*bind",
                "^upgrade%.[^=]*last", "^upgrade%.[^=]*check", "^[^=]*lasttime=", "^[^=]*timestamp=",
                "^gl_led%.global%.led_enable=" }   -- the owner's LED schedule (off 9 PM / on 7 AM) flips this on purpose
local function boolish(v) local s = v:gsub("'", ""); return s == "on" or s == "off" or s == "0" or s == "1" or s == "true" or s == "false" end
local function hash(s) local h = 5381; for i = 1, #s do h = (h * 33 + s:byte(i)) % 2147483647 end; return string.format("%x", h) end
local function snapshot()
    local t, n = {}, 0
    for line in sh("uci show"):gmatch("[^\n]+") do
        local k, v = line:match("^([^=]+)=(.*)$")
        if k then
            local skip = false
            for _, p in ipairs(NOISY) do if line:match(p) then skip = true; break end end
            if not skip then
                local opt = (k:match("%.([%w_]+)$") or ""):lower()
                if not boolish(v) then   -- on/off switches like PasswordAuth stay readable
                    for _, s in ipairs(SECRET) do if opt:find(s, 1, true) then v = "<hidden #" .. hash(v) .. ">"; break end end
                end
                t[k] = v; n = n + 1
            end
        end
    end
    return t, n
end
local function cfg_changes(now)
    local cur, n = snapshot(); if n < 20 then return end      -- uci not readable right now
    local old = jread(SNAP, nil)
    if not old then writef(SNAP, cjson.encode(cur), true); return end   -- first run: baseline only
    local lines = {}
    for k, v in pairs(cur) do
        if old[k] == nil then lines[#lines + 1] = "➕ `" .. k .. "` = " .. v
        elseif old[k] ~= v then lines[#lines + 1] = "✏️ `" .. k .. "`: " .. old[k] .. " → " .. v end
    end
    for k, v in pairs(old) do
        if cur[k] == nil then
            local noisy = false; for _, p in ipairs(NOISY) do if (k .. "=" .. v):match(p) then noisy = true; break end end
            if not noisy then lines[#lines + 1] = "➖ `" .. k .. "` (was " .. v .. ")" end   -- newly ignored keys vanish silently
        end
    end
    if #lines == 0 then return end
    table.sort(lines)
    local shown = {}; for i = 1, math.min(#lines, 15) do shown[i] = lines[i] end
    if #lines > 15 then shown[#shown + 1] = "…and " .. (#lines - 15) .. " more" end
    local d = table.concat(shown, "\n"); if #d > 3800 then d = d:sub(1, 3800) .. "…" end
    alert("config", "⚙️ Router settings changed (" .. #lines .. ")", d, "blue")
    writef(SNAP, cjson.encode(cur), true)
end

-- ---------------------------------------------------------------- slow ISP (item 15)
local function isp_check(now)
    -- an access point's own speed test goes through the main router (and maybe its VPN), so it can't measure the ISP
    if trim(sh("uci -q get glconfig.general.mode")) == "ap" then return end
    local plan = tonumber(cfg("plan_down", 0)) or 0; if plan <= 0 then return end
    local pct = tonumber(cfg("isp_slow_pct", 70)) or 70
    local hist = jread(EDIR .. "/speedtest-history.json", {})
    local wan = {}
    for i = #hist, 1, -1 do local h = hist[i]; if h.kind == "wan" and h.scheduled and type(h.down) == "number" then wan[#wan + 1] = h; if #wan == 3 then break end end end
    if #wan < 3 then return end
    local slow, sum = true, 0
    for _, h in ipairs(wan) do sum = sum + h.down; if h.down >= plan * pct / 100 then slow = false end end
    if slow and st.isp_alerted ~= wan[1].time then
        st.isp_alerted = wan[1].time; save()
        alert("isp", "🐢 Internet slower than your plan 3 nights in a row",
            string.format("Last 3 nightly tests averaged **%.0f Mbps** download, under %d%% of your %.0f Mbps plan (%.0f / %.0f / %.0f Mbps). The ISP report card (Speed Test card → ISP) has the history to send your provider.",
                sum / 3, pct, plan, wan[3].down, wan[2].down, wan[1].down), "orange")
    end
end

-- ---------------------------------------------------------------- uplink cable (item 10)
local link_bad, link_flap_t, link_flap_base = 0, nil, nil
local function uplink_port()
    local mode = trim(sh("uci -q get glconfig.general.mode"))
    if mode == "ap" then
        local gw = sh("ip -4 route show default"):match("via (%S+)")
        local mac = gw and sh("cat /proc/net/arp"):match("\n" .. gw:gsub("%.", "%%.") .. "%s+%S+%s+%S+%s+(%S+)")
        local port = mac and sh("bridge fdb show 2>/dev/null"):match(mac:lower() .. " dev (%S+)")
        return port, "the link to the main router"
    end
    local dev = sh("ip -4 route show default"):match("dev (%S+)")
    if dev and dev:match("^wg") then dev = nil end
    return dev, "the WAN cable to your modem"
end
local function link(now)
    local port, what = uplink_port(); if not port then return end
    local base = port:gsub("%.%d+$", "")
    local sp = num("/sys/class/net/" .. port .. "/speed") or num("/sys/class/net/" .. base .. "/speed")
    local cc = num("/sys/class/net/" .. base .. "/carrier_changes")
    if not sp or sp <= 0 then return end
    st.link = st.link or {}
    local L = st.link[base] or { best = 0 }
    if sp > L.best then L.best = sp; st.link[base] = L; save() end
    if sp < L.best then
        link_bad = link_bad + 1
        if link_bad == 2 then alert("health", "🔌 Cable speed dropped", string.format("%s (%s) is running at %d Mbps instead of %d Mbps. Usually a loose or damaged cable, or a bad port.", what, base, sp, L.best), "orange") end
    else
        if link_bad >= 2 then alert("health", "🔌 Cable speed back to normal", string.format("%s (%s) is at %d Mbps again.", what, base, sp), "green") end
        link_bad = 0
    end
    -- flapping: more than 6 carrier changes within 10 minutes
    if cc then
        if not link_flap_t or now - link_flap_t > 600 then link_flap_t, link_flap_base = now, cc
        elseif cc - link_flap_base > 6 then
            alert("health", "🔌 Cable link keeps dropping", string.format("%s (%s) went down/up %d times in 10 minutes. Check the cable and both ports.", what, base, cc - link_flap_base), "orange")
            link_flap_t, link_flap_base = now, cc
        end
    end
end

-- ---------------------------------------------------------------- weekly Wi-Fi channel report (item 12)
local function wifi_ifaces()
    local t = {}
    for blk in (sh("iwinfo") .. "\n"):gmatch("(%S+%s+ESSID:.-)\n\n") do
        local ifc = blk:match("^(%S+)"); local ch = tonumber(blk:match("Channel:%s*(%d+)")); local mode = blk:match("Mode:%s*(%a+)")
        local essid = blk:match('ESSID:%s*"([^"]*)"')
        local freq = tonumber(blk:match("%(([%d%.]+) GHz%)"))
        local width = tonumber((blk:match("HT Mode:%s*%a*(%d+)") or "20")) or 20
        local center = tonumber(blk:match("Center Channel 1:%s*(%d+)"))
        if ifc and ch and mode == "Master" and freq then t[#t + 1] = { ifc = ifc, ch = ch, essid = essid, ghz = freq, width = width, center = center or ch } end
    end
    return t
end
local function band(g) if g < 3 then return "2.4 GHz" elseif g < 5.9 then return "5 GHz" else return "6 GHz" end end
local CANDIDATES = { ["2.4 GHz"] = { 1, 6, 11 }, ["5 GHz"] = { 36, 52, 100, 149 } }

-- auto-heal (chan_auto, OPT-IN, 2026-11-14): apply the weekly report's quieter channel at 3 AM, then check 7 minutes
-- later that the band is up on the new channel and its devices came back; otherwise switch back. Only for bands set
-- to a FIXED channel (a band on Auto already picks its own) and only to channels without radar checks (DFS):
-- 2.4 GHz 1/6/11; 5 GHz 36 or 149 at up to 80 MHz wide (a 160 MHz block always includes DFS channels in the US).
local function radio_of(ifc)
    for l in sh("uci -q show wireless"):gmatch("[^\n]+") do
        local s2, v = l:match("^wireless%.([%w_]+)%.ifname='([^']+)'")
        if s2 and v == ifc then return trim(sh("uci -q get wireless." .. s2 .. ".device")) end
    end
end
local function assoc(ifc) return tonumber(trim(sh("iwinfo " .. ifc .. " assoclist 2>/dev/null | grep -c dBm"))) or 0 end
local function chan_apply(now, i, b, best)
    local radio = radio_of(i.ifc); if not radio or not radio:match("^[%w_]+$") then return nil, "couldn't find its radio" end
    local cur = trim(sh("uci -q get wireless." .. radio .. ".channel"))
    if not tonumber(cur) then return nil, "the band is on Auto, so the router already picks its own channel" end
    local ok = (b == "2.4 GHz" and (best == 1 or best == 6 or best == 11)) or (b == "5 GHz" and (i.width or 20) <= 80 and (best == 36 or best == 149))
    if not ok then return nil, "the quieter channel needs a radar check (DFS), which can take that band off the air for up to 10 minutes" end
    st.chan_pending = { radio = radio, ifc = i.ifc, band = b, old = cur, new = best, t = now, before = assoc(i.ifc) }; save()
    os.execute("uci set wireless." .. radio .. ".channel='" .. best .. "' && uci commit wireless && logger -t machome 'chan-auto: " .. radio .. " " .. cur .. " -> " .. best .. "'; (wifi down " .. radio .. "; sleep 3; wifi up " .. radio .. ") >/dev/null 2>&1 &")
    return true
end
local function chan_verify(now)
    local p = st.chan_pending; if not p or now - (p.t or 0) < 420 then return end
    st.chan_pending = nil; save()
    local live = tonumber((sh("iwinfo " .. p.ifc .. " info 2>/dev/null"):match("Channel:%s*(%d+)")))
    local up = trim(readf("/sys/class/net/" .. p.ifc .. "/operstate") or "") == "up"
    local after = assoc(p.ifc)
    local need = math.floor((p.before or 0) * 0.6)
    if up and live == tonumber(p.new) and after >= need then
        alert("wifi", "📶 Moved " .. p.band .. " Wi-Fi to channel " .. p.new, "The weekly Wi-Fi scan found channel " .. p.new .. " much quieter than " .. p.old .. ", so auto-heal switched to it. " .. after .. " device" .. (after == 1 and "" or "s") .. " reconnected (" .. (p.before or 0) .. " before).", "green")
    else
        os.execute("uci set wireless." .. p.radio .. ".channel='" .. p.old .. "' && uci commit wireless && logger -t machome 'chan-auto: reverting " .. p.radio .. " to " .. p.old .. "'; (wifi down " .. p.radio .. "; sleep 3; wifi up " .. p.radio .. ") >/dev/null 2>&1 &")
        alert("wifi", "📶 Switched " .. p.band .. " Wi-Fi back to channel " .. p.old, "Auto-heal tried channel " .. p.new .. ", but " .. (not up and "the band didn't come back up" or live ~= tonumber(p.new) and "the radio didn't settle on it" or
            (after .. " of " .. (p.before or 0) .. " devices reconnected")) .. ", so it went back to channel " .. p.old .. ".", "orange")
    end
end
local function wifi_report(now)
    local ifs = wifi_ifaces(); if #ifs == 0 then return end
    local mine = {}; for _, i in ipairs(ifs) do if i.essid then mine[i.essid] = true end end
    local out, seenband = {}, {}
    for _, i in ipairs(ifs) do
        local b = band(i.ghz)
        if not seenband[b] then
            seenband[b] = true
            local scan = sh("timeout 25 iwinfo " .. i.ifc .. " scan")
            local per, strongest, total = {}, {}, 0
            for cell in (scan .. "\nCell"):gmatch("Cell.-\n(.-)\n%s*\n") do
                local essid = cell:match('ESSID:%s*"([^"]*)"'); local ch = tonumber(cell:match("Channel:%s*(%d+)")); local sig = tonumber(cell:match("Signal:%s*(%-%d+)"))
                local cb = cell:match("Band:%s*([%d%.]+)")
                local sameband = (not cb) or (cb == b:match("^([%d%.]+)"))   -- channel numbers repeat across bands
                if ch and sameband and not (essid and mine[essid]) then
                    per[ch] = (per[ch] or 0) + 1; total = total + 1
                    if sig and (not strongest[ch] or sig > strongest[ch]) then strongest[ch] = sig end
                end
            end
            -- networks that overlap a channel: 2.4 GHz channels overlap +-4; 5/6 GHz overlap across our channel WIDTH
            -- (each 20 MHz = 4 channel numbers), measured from the centre channel
            local function near(c, width)
                local span = (b == "2.4 GHz") and 4 or math.max(2, math.floor((width or 20) / 20 * 4 / 2))
                local n = 0; for ch, k in pairs(per) do if math.abs(ch - c) < span or (b == "2.4 GHz" and math.abs(ch - c) <= span) then n = n + k end end; return n
            end
            local cur = near(i.center, i.width)
            local best, bestn = i.ch, cur
            -- candidates: 2.4 = 1/6/11; 5 GHz = the start of each block of our width (compared by the block's centre)
            local cands = {}
            if b == "2.4 GHz" then for _, c in ipairs(CANDIDATES[b]) do cands[#cands + 1] = { c, c } end
            elseif b == "5 GHz" then
                local blocks = (i.width >= 160) and { { 36, 50 }, { 100, 114 }, { 149, 163 } }
                            or (i.width >= 80) and { { 36, 42 }, { 52, 58 }, { 100, 106 }, { 116, 122 }, { 149, 155 } }
                            or { { 36, 36 }, { 52, 52 }, { 100, 100 }, { 149, 149 } }
                cands = blocks
            end
            for _, c in ipairs(cands) do local n = near(c[2], b == "2.4 GHz" and 20 or i.width); if n < bestn then best, bestn = c[1], n end end
            local line = string.format("**%s** on channel %d (%d MHz wide): %d neighbor network%s overlapping it%s (%d nearby in total).", b, i.ch, i.width, cur, cur == 1 and "" or "s",
                strongest[i.ch] and string.format(", strongest %d dBm", strongest[i.ch]) or "", total)
            if #cands > 0 and best ~= i.ch and bestn <= cur * 0.75 and cur - bestn >= 3 then   -- only worth a change if clearly quieter
                line = line .. string.format(" 👉 Channel **%d** looks quieter (%d overlapping).", best, bestn)
                if cfg("chan_auto", false) == true and not st.chan_pending then
                    local okc, applied, why = pcall(chan_apply, now, i, b, best)
                    if okc and applied then line = line .. " 🔧 Auto-heal is switching to it now and will switch back if devices don't reconnect."
                    else line = line .. " Not changed automatically: " .. tostring(okc and why or "error") .. ". Change it in the admin page → Wireless if you like." end
                else line = line .. " Change it in the admin page → Wireless." end
            elseif #cands > 0 then line = line .. " ✅ Current channel is a good choice." end
            out[#out + 1] = line
        end
    end
    -- this week's Wi-Fi health from watch.lua: connects/drops, radar events, weak-signal and kicked devices (2026-11-14)
    if X and X.watch and X.watch.wifi_week_lines then
        local okw, extra = pcall(X.watch.wifi_week_lines)
        if okw and type(extra) == "table" then for _, l in ipairs(extra) do out[#out + 1] = l end end
    end
    if #out > 0 then alert("wifi", "📶 Weekly Wi-Fi report", table.concat(out, "\n") .. "\n_(Neighbors = other networks this router can hear. Your own networks are excluded.)_", "blue") end
end

-- ---------------------------------------------------------------- self-heal round 2 (2026-11-11)
-- Each fix runs at most once per problem (with a cool-down), says what it did, and reports if it didn't help.
-- Switches (Settings > Auto-heal): ts_heal, wan_heal, dns_heal, ap_uplink, ct_relief, storage_trim, leak_fix,
-- svc_autostop (opt-in), chan_auto (opt-in). Alerts use the "health" type (leaks: "security", channels: "wifi").
local mode_c = { t = 0, v = "router" }
local function netmode(now)
    if now - mode_c.t >= 300 then mode_c.t = now; local m = trim(sh("uci -q get glconfig.general.mode")); mode_c.v = (m ~= "" and m) or "router" end
    return mode_c.v
end
local heal = { ts_bad = 0, wan_bad = 0, wan_note = false, dns_bad = 0, dns_note = false, flood = 0, flood_t = 0 }

-- 1. Tailscale switched on but not connected for 10 min -> restart it (at most once an hour). Signed out -> tell, don't restart.
local function ts_heal(now)
    if not cfg("ts_heal", true) or netmode(now) == "ap" then return end      -- GL refuses Tailscale in AP mode
    if not exists("/usr/sbin/tailscale") or trim(sh("uci -q get tailscale.settings.enabled")) ~= "1" then heal.ts_bad = 0; return end
    -- internet down (ISP outage): Tailscale can't connect anyway, so don't count, restart or message; it reconnects by itself
    if X and X.online == false then heal.ts_bad = 0; return end
    local state = sh("timeout 8 tailscale status --json"):match('"BackendState":%s*"(%a+)"') or "NoDaemon"
    if state == "Running" then
        if heal.ts_fixed then alert("health", "🟢 Tailscale reconnected", "Remote access through Tailscale works again.", "green") end
        heal.ts_bad, heal.ts_fixed, heal.ts_note = 0, nil, nil; return
    end
    if state == "NeedsLogin" or state == "NeedsMachineAuth" then
        if heal.ts_note ~= state then heal.ts_note = state
            alert("health", "🔑 Tailscale needs you to sign in again", "Tailscale on this router is signed out, so remote access won't work until you sign in again on its Tailscale page. A restart can't fix this.", "orange") end
        return
    end
    heal.ts_bad = heal.ts_bad + 1
    if heal.ts_bad >= 10 and (not heal.ts_fixed or now - heal.ts_fixed >= 3600) then
        local again = heal.ts_fixed ~= nil; heal.ts_fixed, heal.ts_bad = now, 0
        os.execute("logger -t machome 'self-heal: restarting tailscale (state " .. state .. ")'; /etc/init.d/tailscale restart >/dev/null 2>&1 &")
        alert("health", again and "⚠️ Tailscale still not connected" or "🔧 Restarted Tailscale",
            (again and "Still not connected an hour after the last restart, so it was restarted again. " or "") ..
            "Tailscale was switched on but not connected for 10 minutes (state: " .. state .. "), so it was restarted. Remote access may not work until it reconnects.", "orange")
    end
end

-- 2. Internet down for 3 min while the cable to the modem is connected -> renew the WAN connection once per outage.
local function wan_heal(now)
    if not cfg("wan_heal", true) or netmode(now) ~= "router" then return end
    local proto = trim(sh("uci -q get network.wan.proto")); if proto == "" or proto == "none" then return end
    local dev = trim(sh("ubus call network.interface.wan status | jsonfilter -e '@.l3_device'")); if dev == "" then dev = trim(sh("uci -q get network.wan.device")) end
    if not dev:match("^[%w%._-]+$") or num("/sys/class/net/" .. dev .. "/carrier") ~= 1 then heal.wan_bad = 0; return end   -- unplugged: the cable check's job
    if (jread(DIR .. "/speedtest.json", {}) or {}).running then return end
    local ok = os.execute("ping -c 2 -W 2 -I " .. dev .. " 1.1.1.1 >/dev/null 2>&1 || ping -c 2 -W 2 -I " .. dev .. " 9.9.9.9 >/dev/null 2>&1") == 0
    if ok then
        if heal.wan_fixed then alert("health", "🟢 Internet is back", "The connection to your ISP works again after the router renewed it.", "green") end
        heal.wan_bad, heal.wan_fixed, heal.wan_note = 0, nil, false; return
    end
    heal.wan_bad = heal.wan_bad + 1
    if heal.wan_bad == 3 and not heal.wan_fixed then
        heal.wan_fixed = now
        os.execute("logger -t machome 'self-heal: renewing WAN (no internet for 3 min, cable connected)'; ifup wan >/dev/null 2>&1 &")
        alert("health", "🔧 Renewed the internet connection", "The cable to the modem was connected but there was no internet for 3 minutes, so the router renewed its connection to your ISP (like unplugging and replugging the cable). This message is sent once the internet is back.", "orange")
    elseif heal.wan_fixed and not heal.wan_note and now - heal.wan_fixed >= 300 then
        heal.wan_note = true
        alert("health", "⚠️ Internet still down after renewing", "Renewing the connection didn't help, so the problem is most likely the modem or your ISP. Restarting the modem usually helps.", "red")
    end
end

-- 2b. Access points (ap_uplink, 2026-11-14): the cable to the main router is connected but the main router hasn't
--     answered for 3 minutes -> renew this AP's address (no interruption); still nothing 3 minutes later -> restart
--     the AP's network link once per outage (Wi-Fi devices drop for a few seconds). A main router that is simply
--     off or rebooting comes back by itself; this only runs once per outage either way.
local apu = { bad = 0, step = 0 }
local function ap_uplink(now)
    if not cfg("ap_uplink", true) or netmode(now) ~= "ap" then apu.bad, apu.step = 0, 0; return end
    local wired = false
    for p in sh("ls /sys/class/net/br-lan/brif 2>/dev/null"):gmatch("%S+") do
        if not p:match("^wlan") and not p:match("^ath") and num("/sys/class/net/" .. p .. "/carrier") == 1 then wired = true end
    end
    if not wired then apu.bad = 0; return end                 -- unplugged: nothing this router can fix
    local gw = sh("ip -4 route show default"):match("via (%d+%.%d+%.%d+%.%d+)")
    local ok = gw ~= nil and os.execute("ping -c 2 -W 2 " .. gw .. " >/dev/null 2>&1") == 0
    if ok then
        if apu.step > 0 then alert("health", "🟢 Access point reconnected to the main router", "This access point couldn't reach the main router for about " .. apu.bad .. " minutes. " ..
            (apu.step >= 2 and "Restarting its network link fixed it." or "Renewing its address fixed it."), "green") end
        apu.bad, apu.step = 0, 0; return
    end
    apu.bad = apu.bad + 1
    if apu.bad == 3 and apu.step == 0 then
        apu.step = 1
        os.execute("logger -t machome 'ap-uplink: main router not answering for 3 min, renewing LAN address'; ubus call network.interface.lan renew >/dev/null 2>&1")
    elseif apu.bad == 6 and apu.step == 1 then
        apu.step = 2
        os.execute("logger -t machome 'ap-uplink: still no main router, restarting the LAN link'; (ifup lan) >/dev/null 2>&1 &")
    elseif apu.bad == 15 and apu.step == 2 then
        apu.step = 3
        alert("health", "⚠️ Access point can't reach the main router", "The cable is connected but the main router hasn't answered for 15 minutes, even after renewing and restarting this access point's network link. Check the main router and the cable between them.", "red")
    end
end

-- 3. Services on the owner's turned-off list that are RUNNING again (alert only; nothing is stopped automatically)
local function svc_drift(now)
    local list = readf(EDIR .. "/optimized"); if not list then return end
    local ok, svc = pcall(cjson.decode, sh("ubus call service list")); if not ok or type(svc) ~= "table" then svc = {} end
    st.drift = st.drift or {}; local changed = false
    for name in list:gmatch("[%w%._%-]+") do
        local running = false
        for _, i in pairs((svc[name] or {}).instances or {}) do if i.running then running = true end end
        if not running and trim(sh("pidof " .. name)) ~= "" then running = true end
        if running and not st.drift[name] then
            st.drift[name] = now; changed = true
            -- auto-heal (svc_autostop, opt-in): stop + disable it again, at most once an hour per service; if it comes
            -- straight back, something keeps starting it, so leave it running and say so instead of fighting it
            st.autostop = st.autostop or {}
            local recent = st.autostop[name] and now - st.autostop[name] < 3600
            if cfg("svc_autostop", false) == true and not recent and name:match("^[%w_%-]+$") and exists("/etc/init.d/" .. name) then
                st.autostop[name] = now
                os.execute("/etc/init.d/" .. name .. " stop >/dev/null 2>&1; /etc/init.d/" .. name .. " disable >/dev/null 2>&1; logger -t machome 'svc-autostop: stopped and disabled " .. name .. " (on the turned-off list)'")
                st.drift[name] = nil
                alert("health", "🔧 Turned a service off again", "'" .. name .. "' was running again even though it's on this router's turned-off list (usually after a firmware update). Auto-heal stopped and disabled it again.", "orange")
            else
                alert("health", "⚠️ A service you turned off is running again", "'" .. name .. "' is running even though it's on this router's turned-off list. A firmware update or another GL feature probably started it." ..
                    (recent and " Auto-heal already turned it off within the last hour and something started it again, so it was left running. Check what uses it." or " Nothing was changed automatically."), "orange")
            end
        elseif not running and st.drift[name] then st.drift[name] = nil; changed = true end
    end
    if changed then save() end
end

-- 5. Log flood: 300+ lines a minute for 3 minutes (normal is well under 50). Alert at most every 6 h.
local function log_flood(now)
    local pfx = os.date("%a %b %e %H:%M:", now - 60)
    local n = tonumber(trim(sh("logread | grep -cF '" .. pfx .. "'"))) or 0
    if n >= 300 then heal.flood = heal.flood + 1 else heal.flood = 0 end
    if heal.flood >= 3 and now - heal.flood_t >= 6 * 3600 then
        heal.flood_t = now
        local top = trim(sh("logread | grep -F '" .. pfx .. "' | awk '{t=$7; if(t==\":\"||t==\"\") t=$8; print t}' | sed -E 's/\\[[0-9]+\\]//; s/:$//' | sort | uniq -c | sort -rn | head -1"))
        top = top:gsub("^%d+%s+", ""):sub(1, 40)
        alert("health", "📜 Router log is flooding", string.format("About %d log lines a minute for 3 minutes. Busiest source: %s. A service stuck in an error loop can hide real problems in the log.", n, top ~= "" and top or "unknown"), "orange")
    end
end

-- 7. The router's own DNS (dnsmasq) stops answering even for itself -> restart it (at most every 30 min).
--    The test asks for "localhost", which dnsmasq answers from /etc/hosts: it never depends on AdGuard or the internet.
local function dns_heal(now)
    if not cfg("dns_heal", true) or netmode(now) == "ap" or not exists("/etc/init.d/dnsmasq") then return end
    local ans = exists("/usr/bin/dig") and sh("dig @127.0.0.1 +time=2 +tries=1 +short localhost") or sh("timeout 5 nslookup localhost 127.0.0.1")
    local ok = trim(sh("pidof dnsmasq")) ~= "" and (ans:match("^127%.0%.0%.1") ~= nil or ans:find("Name:%s+localhost") ~= nil)
    if ok then
        if heal.dns_fixed then alert("health", "🟢 Router DNS is answering again", "The router's own DNS works again.", "green") end
        heal.dns_bad, heal.dns_fixed, heal.dns_note = 0, nil, false; return
    end
    heal.dns_bad = heal.dns_bad + 1
    if heal.dns_bad >= 3 and (not heal.dns_fixed or now - heal.dns_fixed >= 1800) then
        heal.dns_fixed, heal.dns_bad, heal.dns_note = now, 0, false
        os.execute("logger -t machome 'self-heal: restarting dnsmasq (not answering for 3 min)'; /etc/init.d/dnsmasq restart >/dev/null 2>&1 &")
        alert("health", "🔧 Restarted the router's DNS", "The router's own DNS (dnsmasq) stopped answering for 3 minutes, so it was restarted. AdGuard and its settings weren't touched.", "orange")
    elseif heal.dns_fixed and not heal.dns_note and now - heal.dns_fixed >= 600 then
        heal.dns_note = true
        alert("health", "⚠️ Router DNS still not answering", "Restarting it didn't help. Devices may not be able to open websites. A router restart usually fixes this.", "red")
    end
end

-- Hourly DNS provider watch: which company answers your devices' lookups (Quad9, Cloudflare, ... or your ISP).
-- History (48 checks) feeds the Leak test box. Alerts when lookups go to your ISP, or a provider NEVER seen before
-- appears. Known providers are remembered in health.json (AdGuard often alternates between several upstreams,
-- e.g. Quad9 + OpenDNS, so "not seen lately" would be noise). The first check only learns, silently.
-- d = the DNS-provider result written by the hourly leak test (dnswho.json)
local function dns_record(now, d)
    table.sort(d.names)
    local Hs = jread(DIR .. "/dnswatch.json", {}); if type(Hs) ~= "table" or (next(Hs) and not Hs[1]) then Hs = {} end
    local hadleak = Hs[#Hs] and Hs[#Hs].leak
    -- known providers (persisted); the very first check only learns, and seeds from any history already present
    local first, changed = type(st.dns_known) ~= "table", false
    if first then
        st.dns_known = {}; changed = true
        for _, x in ipairs(Hs) do for nm in tostring(x.n or ""):gmatch("[^,]+") do st.dns_known[trim(nm)] = true end end
    end
    Hs[#Hs + 1] = { t = now, n = table.concat(d.names, ", "), leak = d.ispleak }
    while #Hs > 48 do table.remove(Hs, 1) end
    writef(DIR .. "/dnswatch.json", cjson.encode(Hs))
    -- (an ISP answering is reported by leak_alert below, together with any other leak)
    local new = {}; for _, nm in ipairs(d.names) do if not st.dns_known[nm] and not nm:match("^Your ISP") then new[#new + 1] = nm end end
    if #new > 0 then
        for _, nm in ipairs(new) do st.dns_known[nm] = true end; changed = true
        if not first then alert("dns", "🔁 New DNS provider: " .. table.concat(new, ", "), "Your devices' lookups are now (also) answered by " .. table.concat(new, ", ") .. ", a provider not seen before. If you didn't change AdGuard's upstream DNS, check it.", "orange") end
    end
    if changed then save() end      -- health.json is on flash: only write when a provider is learned
end

-- Hourly automatic leak test (same test as the "Run leak test" button). Discord alert (type "security") when a
-- check starts failing, listing what failed; "clear again" when it passes. A tunnel that is simply down ("no answer
-- through the tunnel") is not a leak: the VPN alerts already cover it. Skipped in AP mode and while offline.
local function leak_alert(r)
    local fails = {}
    for _, c in ipairs(r.checks or {}) do
        if c.ok == false and not tostring(c.title):find("no answer through the tunnel", 1, true) then fails[#fails + 1] = c end
    end
    local keys = {}; for _, c in ipairs(fails) do keys[#keys + 1] = tostring(c.title) end; table.sort(keys)
    local key = table.concat(keys, "|")
    local now = os.time()
    local after_fix = heal.leak_after_fix; heal.leak_after_fix = nil
    local lines = {}; for _, c in ipairs(fails) do lines[#lines + 1] = "• **" .. tostring(c.title) .. "**: " .. tostring(c.detail) end
    local fixable = 0; for _, c in ipairs(fails) do if c.fix then fixable = fixable + 1 end end
    -- auto-heal (leak_fix, 2026-11-14): routing / kill-switch failures are fixed by re-applying GL's VPN routing
    -- (all tunnels reconnect for a few seconds), then tested again 2 minutes later. Once per 6 hours.
    if after_fix then
        if fixable == 0 then
            heal.leak_key = #fails > 0 and key or nil
            alert("security", "✅ Leak fixed", "Re-applying the VPN routing worked: the leak test " .. (#fails == 0 and "passes every check again." or "no longer finds routing problems. Still open (needs a settings change):\n" .. table.concat(lines, "\n")), "green")
        else
            heal.leak_key = key
            alert("security", "🚨 Leak NOT fixed by re-applying the VPN routing", "Still failing after auto-heal re-applied the VPN routing:\n" .. table.concat(lines, "\n") ..
                "\nRestarting the router usually fixes this; check GL's VPN settings if it doesn't.", "red")
        end
        return
    end
    if #fails > 0 and key ~= heal.leak_key then
        heal.leak_key = key
        local can = fixable > 0 and cfg("leak_fix", true) and now - (heal.leak_fix_t or 0) >= 6 * 3600
        if can then
            heal.leak_fix_t = now; heal.leak_retest = now + 120
            os.execute("logger -t machome 'leak-fix: re-applying VPN routing (vpn-client restart)'; /etc/init.d/vpn-client restart >/dev/null 2>&1 &")
        end
        alert("security", "🚨 Possible VPN / DNS leak", "The hourly leak test found " .. #fails .. " problem" .. (#fails > 1 and "s" or "") .. ":\n" .. table.concat(lines, "\n") ..
            (can and "\n🔧 Auto-heal is re-applying the VPN routing now (every tunnel reconnects for a few seconds) and will test again in 2 minutes."
                 or (fixable == 0 and "\nThis needs a settings change; the router can't fix it by itself." or "")) ..
            "\nDetails: Home tab > Speed Test & Leak Test.", "red")
    elseif #fails == 0 and heal.leak_key then
        heal.leak_key = nil
        alert("security", "✅ Leak test is clear again", "The hourly leak test passed every check.", "green")
    end
end
-- the re-test 2 minutes after a leak fix (runs the same background test, flagged so leak_alert reports the outcome)
local function leak_retest(now)
    if not heal.leak_retest or now < heal.leak_retest or heal.lt_pending then return end
    heal.leak_retest = nil; heal.leak_after_fix = true; heal.lt_pending = now
    os.execute("(lua -e 'local P=dofile(\"/usr/lib/machome/more.lua\"); P.leak_test()' >/dev/null 2>&1) &")
end
local function dns_watch(now)                       -- hourly: start the leak test in the background
    if netmode(now) == "ap" or (X and X.online == false) or heal.lt_pending then return end
    heal.lt_pending = now
    os.execute("(lua -e 'local P=dofile(\"/usr/lib/machome/more.lua\"); P.leak_test()' >/dev/null 2>&1) &")
end
local function leak_collect(now)                     -- every minute: pick up the result once it's written
    if not heal.lt_pending then return end
    local r = jread(DIR .. "/leaktest.json", nil)
    if r and tonumber(r.t) and r.t >= heal.lt_pending then
        heal.lt_pending = nil
        pcall(leak_alert, r)
        local d = jread(DIR .. "/dnswho.json", nil)
        if d and type(d.names) == "table" and tonumber(d.t) and d.t >= r.t then pcall(dns_record, now, d) end
    elseif now - heal.lt_pending > 300 then heal.lt_pending = nil end
end

-- 6. Unexpected restart: the init script writes /etc/machome/clean_shutdown when the Home tab service stops
--    (normal reboot, restart from the admin page, our own auto-reboot). Checked once per sampler start and always
--    removed, so a later power cut can't hide behind an old marker. Only alerts when the ROUTER just booted.
local function restart_check(now)
    if heal.boot_checked then return end; heal.boot_checked = true
    local mk = EDIR .. "/clean_shutdown"
    local clean = exists(mk); os.remove(mk)
    local up = uptime(); if up > 900 then return end            -- just the service restarting, not a boot
    if clean or exists(PENDING) then return end                  -- normal shutdown / our own auto-reboot (reported separately)
    alert("health", "⚡ Router restarted unexpectedly",
        "The router started up at " .. os.date("%I:%M %p", now - up) .. " without shutting down normally first. Usually a power cut or the power cable being unplugged, less often a crash. (If you just updated the firmware, you can ignore this.) If it keeps happening, check the power supply or add a small UPS.", "orange")
end

-- ---------------------------------------------------------------- Tailscale on an access point
-- GL's helper always runs "tailscale up --reset --accept-routes". If another tailnet device ever shares the
-- subnet this AP itself sits on, the AP would route its own LAN into the tailnet and cut off its Wi-Fi
-- clients. Cheap check every tick, only when tailscale0 exists and the router is in AP mode.
local ts_mode_t, ts_is_ap = 0, false
local function ts_ap_guard(now)
    if not exists("/sys/class/net/tailscale0") then return end
    if now - ts_mode_t >= 300 then ts_mode_t = now; ts_is_ap = trim(sh("uci -q get glconfig.general.mode")) == "ap" end
    if not ts_is_ap then return end
    local t52 = sh("ip -4 route show table 52"); if t52 == "" then return end
    for pfx in sh("ip -4 route show dev br-lan scope link"):gmatch("(%d+%.%d+%.%d+%.%d+/%d+)") do
        if t52:find(pfx, 1, true) then
            os.execute("tailscale set --accept-routes=false >/dev/null 2>&1; logger -t machome 'tailscale: stopped accepting shared routes (they would hide this access point own LAN " .. pfx .. ")'")
            return
        end
    end
end

-- ---------------------------------------------------------------- scheduler
local t_min, t_hour, t_clock, t_cap, t_drift, started = 0, 0, 0, 0, 0, os.time()
function H.tick(now, extras)
    X = extras
    pcall(ts_ap_guard, now)
    pcall(restart_check, now)
    if now - t_min >= 60 then
        t_min = now
        pcall(boot_report, now)
        pcall(minute_checks, now)
        pcall(link, now)
        pcall(wan_heal, now); pcall(dns_heal, now); pcall(ts_heal, now); pcall(log_flood, now); pcall(leak_collect, now)
        pcall(ap_uplink, now); pcall(leak_retest, now); pcall(chan_verify, now)       -- auto-heal round 3 (2026-11-14)
        if now - t_drift >= 600 and now - started >= 300 then t_drift = now; pcall(svc_drift, now) end
        if now - t_cap >= 300 then t_cap = now; pcall(capacity, now) end
        if now - t_clock >= 1800 or (now - started < 400 and now - t_clock >= 300) then t_clock = now; pcall(clock, now) end
        if now - t_hour >= 3600 then t_hour = now; pcall(cfg_changes, now); pcall(isp_check, now); pcall(dns_watch, now) end
        -- weekly Wi-Fi report: weekly-report day, 3 AM (once per week)
        local d = os.date("*t", now)
        if (d.wday - 1) == (tonumber(cfg("weekly_day", 0)) or 0) and d.hour == 3 and st.wifi_day ~= os.date("%Y-%m-%d", now) and cfg("wifi_report", true) then
            st.wifi_day = os.date("%Y-%m-%d", now); save(); pcall(wifi_report, now)
        end
    end
end
-- for testing from a shell: lua -e 'H=dofile("/usr/lib/machome/health.lua"); H._wifi_preview()'
function H._wifi_preview() X = { alert = function(k, t, d) print(t .. "\n" .. d) end, cfg = {} }; wifi_report(os.time()) end
function H._cfg_preview() local t, n = snapshot(); print(n .. " settings in snapshot") end
function H._snap() return snapshot() end
return H
