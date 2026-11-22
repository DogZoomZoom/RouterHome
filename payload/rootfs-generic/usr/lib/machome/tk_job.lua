-- GL.inet Utilities Toolkit card: background jobs (benchmarks, zram restart, package list refresh).
-- Written from scratch for Router Home (owner, 2026-11-22). Started by toolkit.lua job_start via start-stop-daemon.
--   lua tk_job.lua <cpu|crypto|disk|mem|dns|zram|opkg> [seconds]
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

-- ---------------------------------------------------------------- refresh package lists
elseif kind == "opkg" then
    progress(20, "Downloading package lists…")
    local out = sh("opkg update 2>&1")
    local failed = select(2, out:gsub("Failed to download", ""))
    finish({ lists = tonumber(sh("ls /var/opkg-lists 2>/dev/null | wc -l"):match("%d+")) or 0, failed = failed })
else
    finish(nil, "unknown test")
end
