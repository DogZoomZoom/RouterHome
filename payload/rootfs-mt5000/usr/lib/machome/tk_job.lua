-- GL.inet Utilities Toolkit card: background jobs (benchmarks, zram restart, package list refresh).
-- Written from scratch for Router Home (owner, 2026-11-22). Started by toolkit.lua job_start via start-stop-daemon.
--   lua tk_job.lua <cpu|crypto|disk|mem|dns|zram|opkg|mtu|mtuapply> [seconds]   (mtuapply reads tk_mtu_req.json)
-- Status for the page: /tmp/machome/tk_job.json. Stop early: /tmp/machome/tk_job.stop.
local cjson = require "cjson"
local socket = require "socket"
local DIR = "/tmp/machome"
local JOB, STOP = DIR .. "/tk_job.json", DIR .. "/tk_job.stop"
local kind, secs = arg[1], tonumber(arg[2]) or 60
local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p, "w"); if f then f:write(s); f:close() end end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function now() return socket.gettime() end
local st = { kind = kind, running = true, started = os.time(), pct = 0, step = "Starting…" }
local function save() writef(JOB .. ".tmp", cjson.encode(st)); os.rename(JOB .. ".tmp", JOB) end
local function progress(p, step) st.pct = math.floor(p); st.step = step; save() end
local function stopped() return readf(STOP) ~= nil end
local function finish(result, err)
    st.running = false; st.pct = 100; st.finished = os.time(); st.result = result; st.err = err; st.step = err and "Failed" or "Done"
    save(); os.remove(STOP)
    -- keep the latest result of each test for the Benchmarks tab (RAM only; gone after a reboot)
    if result and kind ~= "zram" and kind ~= "opkg" then
        local ok, all = pcall(cjson.decode, readf(DIR .. "/tk_results.json") or "{}"); if not ok or type(all) ~= "table" then all = {} end
        all[kind] = { t = os.time(), r = result }; writef(DIR .. "/tk_results.json", cjson.encode(all))
    end
    os.execute("logger -t machome 'toolkit: " .. kind .. " " .. (err and "failed" or "finished") .. "'")
end
local function maxtemp()
    local m = nil
    for z in sh("ls -d /sys/class/thermal/thermal_zone*"):gmatch("%S+") do
        local t = tonumber((readf(z .. "/temp") or ""):match("%-?%d+")); if t and (not m or t > m) then m = t end
    end
    return m and m / 1000 or nil
end
local function freqs()
    local s, n, lo = 0, 0, nil
    for i = 0, 15 do
        local f = tonumber((readf("/sys/devices/system/cpu/cpu" .. i .. "/cpufreq/scaling_cur_freq") or ""):match("%d+"))
        if f then s = s + f; n = n + 1; if not lo or f < lo then lo = f end end
    end
    return n > 0 and s / n / 1000 or nil, lo and lo / 1000 or nil
end
local function timed(cmd) local t0 = now(); os.execute(cmd .. " >/dev/null 2>&1"); return now() - t0 end
save()

-- ---------------------------------------------------------------- CPU thermal stress
if kind == "cpu" then
    local ncore = tonumber(sh("grep -c ^processor /proc/cpuinfo"):match("%d+")) or 1
    local LIMIT = 95   -- °C (203 °F): stop early above this
    -- one busy loop per core; each ends by itself after the test time (+10 s) even if this script dies
    for _ = 1, ncore do os.execute("(timeout " .. (secs + 10) .. " sh -c 'while :; do :; done') >/dev/null 2>&1 &") end
    local t0, series, start = now(), {}, maxtemp()
    local peak, lowf, avgf, n, sumf, why = start or 0, nil, nil, 0, 0, nil
    while now() - t0 < secs do
        socket.sleep(2)
        local t = maxtemp(); local fa, fl = freqs()
        if t then series[#series + 1] = math.floor(t * 10 + 0.5) / 10; if t > peak then peak = t end end
        if fa then sumf = sumf + fa; n = n + 1 end; if fl and (not lowf or fl < lowf) then lowf = fl end
        progress((now() - t0) * 100 / secs, string.format("Stressing %d cores · %.0f °F", ncore, (t or 0) * 9 / 5 + 32))
        if t and t >= LIMIT then why = "stopped early: the router reached 203 °F"; break end
        if stopped() then why = "stopped early from the Home tab"; break end
    end
    -- stop the load loops (the timeout wrappers and the shells inside them)
    os.execute("ps w | grep '[w]hile :; do :; done' | awk '{print $1}' | xargs kill 2>/dev/null")
    socket.sleep(5)
    local maxf = tonumber((readf("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq") or ""):match("%d+"))
    finish({ cores = ncore, secs = math.floor(now() - t0), start_c = start, peak_c = peak, end_c = maxtemp(), series = series,
        avg_mhz = n > 0 and math.floor(sumf / n) or cjson.null, low_mhz = lowf and math.floor(lowf) or cjson.null, max_mhz = maxf and math.floor(maxf / 1000) or cjson.null,
        throttled = (lowf and maxf and lowf < maxf / 1000 * 0.9 and sh("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"):match("performance")) and true or false, note = why or cjson.null })

-- ---------------------------------------------------------------- VPN & crypto (OpenSSL, one core)
elseif kind == "crypto" then
    local tests = { { "chacha20-poly1305", "ChaCha20-Poly1305", "the cipher WireGuard uses" }, { "aes-128-gcm", "AES-128-GCM", "common OpenVPN / HTTPS cipher" },
        { "aes-256-gcm", "AES-256-GCM", "OpenVPN default on many providers" } }
    local res = {}
    for i, t in ipairs(tests) do
        if stopped() then break end
        progress((i - 1) * 100 / (#tests + 1), "Testing " .. t[2] .. "…")
        -- OpenSSL 1.1 prints "chacha20-poly1305 …", 3.0 "ChaCha20-Poly1305 …": match without case; the last
        -- column is the 16 KB block result in thousands of bytes per second ("123456.78k")
        local out = "\n" .. sh("openssl speed -seconds 2 -evp " .. t[1]):lower()
        local line = out:match("\n" .. t[1]:gsub("%-", "%%-") .. "%s[^\n]*")
        local last = nil; if line then for v in line:gmatch("([%d%.]+)k") do last = tonumber(v) end end
        res[#res + 1] = { name = t[2], what = t[3], mbs = last and math.floor(last * 1000 / 1048576 * 10 + 0.5) / 10 or cjson.null }
    end
    progress(80, "Testing RSA-2048 handshakes…")
    local sign, verify = sh("openssl speed -seconds 2 rsa2048"):match("rsa%s+2048 bits%s+[%d%.]+s%s+[%d%.]+s%s+([%d%.]+)%s+([%d%.]+)")
    finish({ ciphers = res, rsa_sign = tonumber(sign) or cjson.null, rsa_verify = tonumber(verify) or cjson.null,
        openssl = (sh("openssl version"):match("^(OpenSSL %S+)")) or cjson.null, note = stopped() and "stopped early" or cjson.null })

-- ---------------------------------------------------------------- disk (flash) speed
elseif kind == "disk" then
    local free = tonumber(sh("df -m /overlay | awk 'NR==2 {print $4}'"):match("%d+")) or 0
    if free < 300 then finish(nil, "not enough free storage for the test (needs 300 MB)") return end
    -- random data (so the flash file system can't compress it away), written to the flash and read back
    local SRC, DST, MB = DIR .. "/tk_rand.bin", "/overlay/.mh_tk_disk.bin", 64
    progress(5, "Preparing " .. MB .. " MB of test data…")
    os.execute("dd if=/dev/urandom of=" .. SRC .. " bs=1M count=" .. MB .. " >/dev/null 2>&1")
    progress(35, "Writing to flash storage…")
    local tw = timed("dd if=" .. SRC .. " of=" .. DST .. " bs=1M conv=fsync")
    os.remove(SRC); os.execute("sync; echo 3 > /proc/sys/vm/drop_caches")
    progress(70, "Reading it back…")
    local tr = timed("dd if=" .. DST .. " of=/dev/null bs=1M")
    os.remove(DST)
    finish({ mb = MB, write_mbs = math.floor(MB / tw * 10 + 0.5) / 10, read_mbs = math.floor(MB / tr * 10 + 0.5) / 10,
        fs = (sh("mount | grep ' /overlay ' | awk '{print $5}'"):match("%S+")) or cjson.null })

-- ---------------------------------------------------------------- memory speed
elseif kind == "mem" then
    progress(10, "Copying 2 GB through memory…")
    local t1 = timed("dd if=/dev/zero of=/dev/null bs=1M count=2048")
    progress(50, "Writing 256 MB to the RAM disk…")
    local free = tonumber(sh("df -m /tmp | awk 'NR==2 {print $4}'"):match("%d+")) or 0
    local MB = free > 600 and 256 or 128
    local t2 = timed("dd if=/dev/zero of=" .. DIR .. "/tk_mem.bin bs=1M count=" .. MB)
    progress(75, "Reading it back…")
    local t3 = timed("dd if=" .. DIR .. "/tk_mem.bin of=/dev/null bs=1M")
    os.remove(DIR .. "/tk_mem.bin")
    finish({ copy_mbs = math.floor(2048 / t1), write_mbs = math.floor(MB / t2), read_mbs = math.floor(MB / t3), mb = MB })

-- ---------------------------------------------------------------- DNS latency (from the router)
elseif kind == "dns" then
    local servers, seen = {}, {}
    local function add(ip, label) if ip and ip:match("^%d+%.%d+%.%d+%.%d+$") and not seen[ip] then seen[ip] = true; servers[#servers + 1] = { ip = ip, label = label } end end
    for o in sh("uci -q get dhcp.lan.dhcp_option"):gmatch("%S+") do add((o:match("^6,([^,]+)") or o:match("^option:dns%-server,([^,]+)")), "Your devices' DNS") end
    for s in sh("uci -q get dhcp.@dnsmasq[0].server"):gmatch("%S+") do add(s:match("^([%d%.]+)"), "Router's upstream") end
    add("1.1.1.1", "Cloudflare"); add("9.9.9.9", "Quad9"); add("8.8.8.8", "Google")
    local domains = { "google.com", "cloudflare.com", "amazon.com", "wikipedia.org", "github.com", "apple.com", "microsoft.com", "netflix.com", "reddit.com", "youtube.com" }
    local total, done, res = #servers * #domains, 0, {}
    for _, s in ipairs(servers) do
        local times, fails = {}, 0
        for _, d in ipairs(domains) do
            if stopped() then break end
            local q = tonumber(sh("dig +tries=1 +time=2 +noall +stats @" .. s.ip .. " " .. d .. " A"):match("Query time: (%d+) msec"))
            if q then times[#times + 1] = q else fails = fails + 1 end
            done = done + 1; progress(done * 100 / total, "Asking " .. s.label .. "…")
        end
        table.sort(times)
        local sum = 0; for _, v in ipairs(times) do sum = sum + v end
        res[#res + 1] = { ip = s.ip, label = s.label, median = times[1] and times[math.ceil(#times / 2)] or cjson.null,
            avg = #times > 0 and math.floor(sum / #times + 0.5) or cjson.null, best = times[1] or cjson.null, worst = times[#times] or cjson.null, fails = fails, n = #domains }
    end
    finish({ servers = res, domains = #domains, note = stopped() and "stopped early" or cjson.null })

-- ---------------------------------------------------------------- zram restart (after the settings were saved)
elseif kind == "zram" then
    progress(30, "Restarting zram with the new settings…")
    os.execute("/etc/init.d/zram restart >/dev/null 2>&1")
    socket.sleep(1)
    local size, used = (readf("/proc/swaps") or ""):match("/dev/zram0%s+%S+%s+(%d+)%s+(%d+)")
    local algo = (readf("/sys/block/zram0/comp_algorithm") or ""):match("%[([%w%-]+)%]")
    if size then finish({ size = tonumber(size) * 1024, algo = algo or cjson.null }) else finish(nil, "zram didn't come back after the restart; check System → Plug-ins (zram-swap)") end

-- ---------------------------------------------------------------- MTU check (phase 2, 2026-11-22)
-- BusyBox ping has no "don't fragment" switch, but Linux sets DF on pings that fit the outgoing interface, so the
-- largest ping that gets an answer = the path's size. Two ways the path can be smaller: a router on the way says
-- "too big" (the kernel then remembers the size: "ip route get" shows "mtu N"), or it silently drops big packets
-- (no answer: found by halving). Nothing is changed while measuring.
elseif kind == "mtu" or kind == "mtuapply" then
    local function pingok(args, size)
        local out = sh("ping -c 2 -W 1 -s " .. math.floor(size) .. " " .. args)
        return (tonumber(out:match("(%d+) packets received")) or 0) > 0
    end
    local function learned(ip) return tonumber(sh("ip route get " .. ip):match("mtu (%d+)")) end
    local function path_mtu(ip)
        local r = sh("ip route get " .. ip)
        local dev = r:match("dev (%S+)"); if not dev or not dev:match("^[%w%.%-_@]+$") then return nil end
        local ifm = tonumber((readf("/sys/class/net/" .. dev .. "/mtu") or ""):match("%d+")) or 1500
        if not pingok(ip, 56) then return nil, "doesn't answer pings" end
        local lo, hi = 1172, ifm - 28                      -- payload sizes: 1200 … interface size
        if hi <= lo then return ifm end
        if pingok(ip, hi) then local l = learned(ip); return (l and l < ifm) and l or ifm end
        local l = learned(ip); if l and l < ifm then return l end
        if not pingok(ip, lo) then return nil, "only small packets get through" end
        while hi - lo > 1 do                               -- lo answers, hi doesn't
            local m = math.floor((lo + hi) / 2)
            if pingok(ip, m) then lo = m else hi = m end
            l = learned(ip); if l and l < ifm then return l end
        end
        return lo + 28
    end
    T = dofile("/usr/lib/machome/toolkit.lua")

    if kind == "mtu" then
        progress(5, "Measuring the internet path…")
        local wan, tgts = nil, {}
        for i, ip in ipairs({ "1.1.1.1", "9.9.9.9" }) do
            if stopped() then break end
            local v, why = path_mtu(ip)
            tgts[#tgts + 1] = { name = i == 1 and "Cloudflare" or "Quad9", mtu = v or cjson.null, note = why or cjson.null }
            if v and (not wan or v < wan) then wan = v end
            progress(5 + i * 20, "Measuring the internet path…")
        end
        local tun = {}
        local list = T.wg_tunnels()
        for i, t in ipairs(list) do
            if stopped() then break end
            progress(45 + i * 50 / (#list + 1), "Checking " .. (t.name ~= "" and t.name or t.ifc) .. "…")
            -- the path to this VPN server (when it answers pings), else the general internet path
            local p, measured = nil, false
            if t.ep and t.ep:match("^%d+%.%d+%.%d+%.%d+$") then p = path_mtu(t.ep); measured = p ~= nil end
            p = p or wan
            local over = t.v6 and 80 or 60               -- WireGuard adds 60 bytes (IPv4 server) or 80 (IPv6)
            local best = p and math.max(1280, math.min(1500, p - over)) or nil
            local cur = tonumber(t.mtu)
            local works = cur and pingok("-I " .. t.ifc .. " 1.1.1.1", cur - 28) or false
            tun[#tun + 1] = { ifc = t.ifc, name = t.name, cur = t.mtu, best = best or cjson.null, path = p or cjson.null, measured = measured, v6 = t.v6, works = works,
                status = (not best or not cur) and "unknown" or (cur > best and "high") or (cur == best and "best") or (cur >= best - 20 and "fine") or "low" }
        end
        finish({ wan = wan or cjson.null, targets = tgts, tunnels = tun, ap = sh("uci -q get glconfig.general.mode"):match("ap") ~= nil,
            note = stopped() and "stopped early" or cjson.null })
        return
    end

    -- mtuapply: change one tunnel's size, test it for about a minute, and go back by itself if it misbehaves
    local okq, q = pcall(cjson.decode, readf(DIR .. "/tk_mtu_req.json") or ""); os.remove(DIR .. "/tk_mtu_req.json")
    if not okq or type(q) ~= "table" or not tostring(q.ifc):match("^wgclient%d+$") or not tostring(q.peer):match("^[%w_]+$") or not tonumber(q.mtu) then finish(nil, "the request was incomplete") return end
    local ifc, peer, new = q.ifc, q.peer, math.floor(tonumber(q.mtu))
    local nm = (type(q.name) == "string" and q.name ~= "") and q.name or ifc
    local oldlive = tonumber((readf("/sys/class/net/" .. ifc .. "/mtu") or ""):match("%d+"))
    local oldset = sh("uci -q get wireguard." .. peer .. ".mtu"):match("%d+") or ""
    if not oldlive then finish(nil, "the tunnel isn't running") return end
    local function setm(live, set)
        os.execute("ip link set dev " .. ifc .. " mtu " .. math.floor(live))
        if set == "" then os.execute("uci -q delete wireguard." .. peer .. ".mtu") else os.execute("uci set wireguard." .. peer .. ".mtu='" .. set .. "'") end
        os.execute("uci commit wireguard")
    end
    local function web()
        return sh("curl -s -m 8 -o /dev/null -w '%{http_code}' --interface " .. ifc .. " https://www.google.com/generate_204") == "204"
            or sh("curl -s -m 8 -o /dev/null -w '%{http_code}' --interface " .. ifc .. " https://cp.cloudflare.com/generate_204") == "204"
    end
    progress(8, "Checking " .. nm .. " before the change…")
    if not web() then finish(nil, nm .. " isn't loading websites right now, so the change couldn't be tested; nothing was changed") return end
    -- undo script for the owner (the job also undoes by itself if the test fails)
    os.execute("mkdir -p /root/machome-backup")
    writef("/root/machome-backup/undo-mtu-" .. peer .. ".sh", "# undo: " .. nm .. " (" .. ifc .. ") size change from the Home tab toolkit, " .. os.date("%Y-%m-%d %H:%M") .. "\n" ..
        "ip link set dev " .. ifc .. " mtu " .. oldlive .. " 2>/dev/null\n" ..
        (oldset == "" and ("uci -q delete wireguard." .. peer .. ".mtu\n") or ("uci set wireguard." .. peer .. ".mtu='" .. oldset .. "'\n")) ..
        "uci commit wireguard\nlogger -t machome 'undo-mtu: " .. peer .. " back to " .. (oldset ~= "" and oldset or oldlive) .. "'\n")
    setm(new, tostring(new))
    os.execute("logger -t machome 'toolkit: " .. ifc .. " (" .. peer .. ") MTU " .. oldlive .. " -> " .. new .. ", testing'")
    local fails, why = 0, nil
    for i = 1, 6 do
        socket.sleep(8)
        local okw = web()
        local okp = pingok("-I " .. ifc .. " 1.1.1.1", new - 28) or pingok("-I " .. ifc .. " 9.9.9.9", new - 28)
        if not okw then fails = fails + 1; why = "websites stopped loading" elseif not okp then fails = fails + 1; why = "full-size packets didn't get through" end
        progress(15 + i * 14, string.format("Testing %d on %s (%d of 6)…", new, nm, i))
        if fails >= 2 then break end
    end
    if fails >= 2 then
        setm(oldlive, oldset)
        os.execute("logger -t machome 'toolkit: " .. ifc .. " MTU " .. new .. " failed the test (" .. why .. "), back to " .. oldlive .. "'")
        finish({ ifc = ifc, name = nm, mtu = new, old = oldlive, undone = true, why = why })
    else
        os.execute("logger -t machome 'toolkit: " .. ifc .. " MTU " .. new .. " passed the test and was kept'")
        finish({ ifc = ifc, name = nm, mtu = new, old = oldlive, undone = false, undo = "/root/machome-backup/undo-mtu-" .. peer .. ".sh" })
    end

-- ---------------------------------------------------------------- refresh package lists
elseif kind == "opkg" then
    progress(20, "Downloading package lists…")
    local out = sh("opkg update 2>&1")
    local failed = select(2, out:gsub("Failed to download", ""))
    finish({ lists = tonumber(sh("ls /var/opkg-lists 2>/dev/null | wc -l"):match("%d+")) or 0, failed = failed })
else
    finish(nil, "unknown test")
end
