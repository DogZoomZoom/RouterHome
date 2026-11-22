-- GL.inet Utilities Toolkit card (owner, 2026-11-22). Point-and-click versions of the kinds of tools in
-- phantasm22's GL.iNet Utilities Toolkit (https://github.com/phantasm22/GL-iNet_utils, GPL-3.0), written from
-- scratch for Router Home: no code from the original script is used. Loaded by the rpc file (dofile).
-- Read-only parts: hardware, crypto, interfaces, radios. Changes (zram, SSH keys, package lock) keep a backup.
local cjson = require "cjson"
local T = {}
local DIR = "/tmp/machome"
local JOB, JOBPID, JOBSTOP = DIR .. "/tk_job.json", DIR .. "/tk_job.pid", DIR .. "/tk_job.stop"

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p, "w"); if not f then return false end; f:write(s); f:close(); return true end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function trim(s) return ((s or ""):gsub("^%s+", ""):gsub("%s+$", "")) end
local function num(p) return tonumber(trim(readf(p) or "")) end
T.readf, T.writef, T.sh = readf, writef, sh

-- ---------------------------------------------------------------- hardware + crypto (read-only)
local CORES = { ["0x41:0xd03"] = "ARM Cortex-A53", ["0x41:0xd04"] = "ARM Cortex-A35", ["0x41:0xd05"] = "ARM Cortex-A55",
    ["0x41:0xd07"] = "ARM Cortex-A57", ["0x41:0xd08"] = "ARM Cortex-A72", ["0x41:0xd09"] = "ARM Cortex-A73",
    ["0x41:0xd0b"] = "ARM Cortex-A76", ["0x41:0xd46"] = "ARM Cortex-A510", ["0x51:0x801"] = "Qualcomm Kryo (Cortex-A53 class)",
    ["0x51:0x803"] = "Qualcomm Kryo 385 Silver", ["0x51:0x805"] = "Qualcomm Kryo 4xx Silver" }

local function crypto_best()
    -- best (highest priority) driver for each algorithm name in /proc/crypto
    local best, cur = {}, {}
    for line in ((readf("/proc/crypto") or "") .. "\n\n"):gmatch("([^\n]*)\n") do
        local k, v = line:match("^(%w+)%s*:%s*(.-)%s*$")
        if k then cur[k] = v
        elseif cur.name then
            local p = tonumber(cur.priority) or 0
            if not best[cur.name] or p > best[cur.name].p then best[cur.name] = { d = cur.driver or "?", p = p } end
            cur = {}
        end
    end
    return best
end

function T.info()
    local cpu = readf("/proc/cpuinfo") or ""
    local impl, part = cpu:match("CPU implementer%s*:%s*(%S+)"), cpu:match("CPU part%s*:%s*(%S+)")
    local feats = cpu:match("\nFeatures%s*:%s*([^\n]+)") or ""
    local ncore = 0; for _ in cpu:gmatch("\nprocessor%s*:") do ncore = ncore + 1 end; if cpu:match("^processor") then ncore = ncore + 1 end
    local cores = {}
    for i = 0, math.max(ncore, 1) - 1 do
        local b = "/sys/devices/system/cpu/cpu" .. i .. "/cpufreq/"
        cores[#cores + 1] = { cur = num(b .. "scaling_cur_freq") or cjson.null, max = num(b .. "cpuinfo_max_freq") or cjson.null,
            min = num(b .. "cpuinfo_min_freq") or cjson.null, gov = trim(readf(b .. "scaling_governor") or "") }
    end
    local mi = {}; for k, v in (readf("/proc/meminfo") or ""):gmatch("(%w+):%s+(%d+)") do mi[k] = tonumber(v) * 1024 end
    local temps = {}
    for z in sh("ls -d /sys/class/thermal/thermal_zone* "):gmatch("%S+") do
        local t = num(z .. "/temp"); if t then temps[#temps + 1] = { name = trim(readf(z .. "/type") or "?"), c = t / 1000 } end
    end
    local disks = {}
    for line in sh("df -k /overlay /tmp /rom"):gmatch("[^\n]+") do
        local size, used, avail, mnt = line:match("%s(%d+)%s+(%d+)%s+(%d+)%s+%d+%%%s+(%S+)$")
        if size then disks[#disks + 1] = { mnt = mnt, size = tonumber(size) * 1024, used = tonumber(used) * 1024, avail = tonumber(avail) * 1024 } end
    end
    -- interfaces worth showing (physical ports, bridge, Wi-Fi, tunnels); no MAC addresses
    local ifs = {}
    for n in sh("ls /sys/class/net"):gmatch("%S+") do
        if n:match("^eth%d+$") or n == "br-lan" or n:match("^wlan%d+$") or n:match("^wgclient%d+$") or n:match("^ovpnclient%d+$") or n:match("^tailscale") or n:match("^lan%d") or n:match("^wan$") then
            local b = "/sys/class/net/" .. n .. "/"
            ifs[#ifs + 1] = { name = n, state = trim(readf(b .. "operstate") or ""), speed = num(b .. "speed") or cjson.null,
                duplex = trim(readf(b .. "duplex") or ""), mtu = num(b .. "mtu") or cjson.null,
                rx = num(b .. "statistics/rx_bytes") or 0, tx = num(b .. "statistics/tx_bytes") or 0 }
        end
    end
    -- Wi-Fi radios (iwinfo); the network name (SSID) and MAC addresses are left out on purpose
    local radios = {}
    for blk in (sh("iwinfo") .. "\n"):gmatch("(%S+%s+ESSID.-)\n%s*\n") do
        local ifn = blk:match("^(%S+)")
        if ifn and not ifn:match("^mld") then
            local ch, freq = blk:match("Channel:%s*(%d+)%s*%(([%d%.]+) GHz%)")
            local r = { ifname = ifn, mode = blk:match("Mode:%s*(%S+)") or "?", channel = tonumber(ch) or cjson.null, ghz = tonumber(freq) or cjson.null,
                width = blk:match("HT Mode:%s*(%S+)") or "?", txpower = tonumber(blk:match("Tx%-Power:%s*(%d+)")) or cjson.null,
                hw = trim((blk:match("Hardware:%s*([^\n]+)") or ""):gsub("%[", " ["):gsub("%s+", " ")) }
            if r.mode ~= "Unknown" then radios[#radios + 1] = r end
        end
    end
    -- crypto audit
    local best = crypto_best()
    local has = function(f) return (" " .. feats .. " "):find(" " .. f .. " ", 1, true) ~= nil end
    local drv = function(n) return best[n] and best[n].d or nil end
    local cha = drv("chacha20")
    local eng = nil; for n, b in pairs(best) do if b.d:match("safexcel") then eng = "Inside Secure SafeXcel (EIP-97)" end; if b.d:match("^qce") or b.d:match("qcrypto") then eng = eng or "Qualcomm Crypto Engine (QCE)" end end
    local crypto = {
        aes_ce = has("aes"), pmull = has("pmull"), sha2 = has("sha2"), neon = has("asimd"),
        aes = drv("aes") or cjson.null, gcm = drv("gcm(aes)") or drv("gcm_base(ctr(aes),ghash)") or cjson.null,
        -- ChaCha20 counts as accelerated with NEON code or a hardware crypto engine (Brume: SafeXcel)
        chacha = cha or cjson.null, chacha_fast = cha ~= nil and (cha:match("neon") ~= nil or cha:match("safexcel") ~= nil or cha:match("qce") ~= nil),
        wg = sh("lsmod | grep -c '^wireguard '"):match("1") ~= nil, engine = eng or cjson.null,
        openssl = trim(sh("openssl version")):match("^(OpenSSL %S+)") or cjson.null,
    }
    local up = tonumber((readf("/proc/uptime") or ""):match("^([%d%.]+)")) or 0
    local rel = (readf("/etc/openwrt_release") or ""):match("DISTRIB_DESCRIPTION='([^']*)'")
    return { ok = true, board = trim(readf("/tmp/sysinfo/model") or ""), board_id = trim(readf("/tmp/sysinfo/board_name") or ""),
        core = CORES[(impl or "") .. ":" .. (part or "")] or ((impl and part) and ("CPU " .. impl .. "/" .. part) or "Unknown"), arch = cpu:match("model name%s*:%s*([^\n]+)") or cjson.null,
        features = feats, cores = cores, mem = { total = mi.MemTotal, free = mi.MemFree, avail = mi.MemAvailable, cached = mi.Cached, buffers = mi.Buffers,
        shmem = mi.Shmem, swap = mi.SwapTotal, swapfree = mi.SwapFree }, temps = temps, disks = disks, ifs = ifs, radios = radios,
        crypto = crypto, uptime = math.floor(up), kernel = trim(sh("uname -r")), firmware = trim(readf("/etc/glversion") or ""), openwrt = rel or cjson.null,
        mode = trim(sh("uci -q get glconfig.general.mode")) }
end

-- ---------------------------------------------------------------- background jobs (benchmarks, zram apply, opkg update)
local function job_alive()
    local pid = tonumber(trim(readf(JOBPID) or ""))
    return pid ~= nil and (readf("/proc/" .. pid .. "/cmdline") or ""):find("tk_job.lua", 1, true) ~= nil
end
function T.job_status()
    local ok, j = pcall(cjson.decode, readf(JOB) or "null")
    j = (ok and type(j) == "table") and j or { running = false }
    if j.running and not job_alive() then j.running = false; j.err = j.err or "stopped unexpectedly" end
    local okr, res = pcall(cjson.decode, readf(DIR .. "/tk_results.json") or "{}")
    return { ok = true, job = j, results = (okr and type(res) == "table") and res or {} }
end
local KINDS = { cpu = true, crypto = true, disk = true, mem = true, dns = true, zram = true, opkg = true }
function T.job_start(kind, opt)
    if not KINDS[kind] then return { ok = false, err = "unknown test" } end
    if job_alive() then return { ok = false, err = "another test is still running" } end
    local secs = tonumber(opt and opt.secs) or 60
    if kind == "cpu" and secs ~= 30 and secs ~= 60 and secs ~= 120 then secs = 60 end
    os.remove(JOBSTOP)
    writef(JOB, cjson.encode({ kind = kind, running = true, started = os.time(), pct = 0, step = "Starting…" }))
    os.execute("start-stop-daemon -S -b -m -p " .. JOBPID .. " -x /usr/bin/lua -- /usr/lib/machome/tk_job.lua " .. kind .. " " .. math.floor(secs) .. " >/dev/null 2>&1")
    os.execute("logger -t machome 'toolkit: " .. kind .. " started from the Home tab'")
    return { ok = true }
end
function T.job_stop() if not job_alive() then return { ok = false, err = "nothing is running" } end; writef(JOBSTOP, "1"); return { ok = true } end

-- ---------------------------------------------------------------- zram
function T.zram_get()
    local sw = readf("/proc/swaps") or ""
    local size, used = sw:match("/dev/zram0%s+%S+%s+(%d+)%s+(%d+)")
    local algos, cur = {}, nil
    for a in (readf("/sys/block/zram0/comp_algorithm") or ""):gmatch("%S+") do
        local s = a:match("^%[(.-)%]$"); if s then cur = s; a = s end; algos[#algos + 1] = a
    end
    local mt = tonumber((readf("/proc/meminfo") or ""):match("MemTotal:%s+(%d+)")) or 0
    local mm = {}; for v in (readf("/sys/block/zram0/mm_stat") or ""):gmatch("%d+") do mm[#mm + 1] = tonumber(v) end
    return { ok = true, on = size ~= nil, installed = readf("/etc/init.d/zram") ~= nil, size = size and tonumber(size) * 1024 or 0, used = used and tonumber(used) * 1024 or 0,
        algo = cur or cjson.null, algos = algos, ram = mt * 1024, orig = mm[1] or 0, compr = mm[2] or 0, mem = mm[3] or 0, peak = mm[5] or 0,
        set_size = tonumber(trim(sh("uci -q get system.@system[0].zram_size_mb"))) or cjson.null,
        set_algo = trim(sh("uci -q get system.@system[0].zram_comp_algo")), default_mb = math.floor(mt / 1024 / 2) }
end
-- size_mb: 0/nil = default (half the RAM). algo must be one the kernel offers. Applied by a background restart.
function T.zram_set(size_mb, algo)
    local z = T.zram_get()
    if not z.installed then return { ok = false, err = "zram isn't installed (GL's zram-swap package)" } end
    local ram_mb = math.floor(z.ram / 1048576)
    size_mb = tonumber(size_mb)
    if size_mb and size_mb ~= 0 and (size_mb < 32 or size_mb > ram_mb) then return { ok = false, err = "size must be between 32 MB and " .. ram_mb .. " MB" } end
    if algo and algo ~= "" then local okA = false; for _, a in ipairs(z.algos) do if a == algo then okA = true end end; if not okA then return { ok = false, err = "this router doesn't support " .. algo } end end
    -- restarting zram moves whatever is swapped out back into RAM first: only when that fits comfortably
    local avail = tonumber((readf("/proc/meminfo") or ""):match("MemAvailable:%s+(%d+)")) or 0
    if z.used > 0 and z.used > avail * 1024 * 0.6 then return { ok = false, err = "too much is swapped out right now to restart zram safely; try again later" } end
    os.execute("mkdir -p /root/machome-backup; [ -f /root/machome-backup/zram-before-toolkit.txt ] || echo \"size=" .. tostring(z.set_size) .. " algo=" .. z.set_algo .. "\" > /root/machome-backup/zram-before-toolkit.txt")
    if size_mb and size_mb > 0 then os.execute("uci set system.@system[0].zram_size_mb='" .. math.floor(size_mb) .. "'") else os.execute("uci -q delete system.@system[0].zram_size_mb") end
    if algo and algo ~= "" then os.execute("uci set system.@system[0].zram_comp_algo='" .. algo .. "'") end
    os.execute("uci commit system")
    return T.job_start("zram", {})
end
function T.zram_reset()
    os.execute("uci -q delete system.@system[0].zram_size_mb; uci -q delete system.@system[0].zram_comp_algo; uci commit system")
    return T.job_start("zram", {})
end

-- ---------------------------------------------------------------- package system check
function T.pkg_check()
    local st = readf("/usr/lib/opkg/status") or ""
    local n, seen, dup = 0, {}, {}
    for p in st:gmatch("Package:%s*(%S+)") do n = n + 1; if seen[p] then dup[#dup + 1] = p end; seen[p] = true end
    local lock = readf("/var/lock/opkg.lock") ~= nil
    local running = sh("ps w | grep -c '[o]pkg '"):match("^%s*(%d+)") ~= "0"
    local lists = trim(sh("ls /var/opkg-lists 2>/dev/null | wc -l"))
    local okList = os.execute("opkg list-installed >/dev/null 2>&1") == 0
    local problems = {}
    if n == 0 then problems[#problems + 1] = "the package database is empty or missing" end
    if #dup > 0 then problems[#problems + 1] = #dup .. " package(s) listed twice: " .. table.concat(dup, ", ", 1, math.min(#dup, 5)) end
    if lock and not running then problems[#problems + 1] = "a leftover lock from an install that didn't finish is blocking new installs" end
    if not okList then problems[#problems + 1] = "the package manager reports an error reading its database" end
    return { ok = true, packages = n, dups = dup, stale_lock = lock and not running, busy = running, lists = tonumber(lists) or 0, list_ok = okList, problems = problems }
end
function T.pkg_fix(what)
    if what == "lock" then
        local c = T.pkg_check(); if not c.stale_lock then return { ok = false, err = "there's no leftover lock to remove" } end
        os.remove("/var/lock/opkg.lock"); os.execute("logger -t machome 'toolkit: removed a stale opkg lock'"); return { ok = true }
    elseif what == "update" then return T.job_start("opkg", {}) end
    return { ok = false, err = "unknown fix" }
end

-- ---------------------------------------------------------------- SSH keys (dropbear authorized_keys)
local AK = "/etc/dropbear/authorized_keys"
local B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local function b64dec(s)
    s = s:gsub("[^%w%+/=]", ""); local out, bits, nb = {}, 0, 0
    for c in s:gmatch(".") do
        if c == "=" then break end
        bits = bits * 64 + (B64:find(c, 1, true) - 1); nb = nb + 6
        if nb >= 8 then nb = nb - 8; local v = math.floor(bits / 2 ^ nb); out[#out + 1] = string.char(v % 256); bits = bits % 2 ^ nb end
    end
    return table.concat(out)
end
local function b64enc(bin)
    local out = {}
    for i = 1, #bin, 3 do
        local a, b, c = bin:byte(i, i + 2); local n = a * 65536 + (b or 0) * 256 + (c or 0)
        local q = { math.floor(n / 262144) % 64, math.floor(n / 4096) % 64, math.floor(n / 64) % 64, n % 64 }
        out[#out + 1] = B64:sub(q[1] + 1, q[1] + 1) .. B64:sub(q[2] + 1, q[2] + 1) .. (b and B64:sub(q[3] + 1, q[3] + 1) or "=") .. (c and B64:sub(q[4] + 1, q[4] + 1) or "=")
    end
    return table.concat(out)
end
local function fingerprint(blob)   -- OpenSSH style "SHA256:..." like ssh-keygen -lf
    local tmp = DIR .. "/tk_fp.bin"; writef(tmp, b64dec(blob))
    local hex = sh("sha256sum " .. tmp):match("^(%x+)"); os.remove(tmp)
    if not hex then return "?" end
    local bin = hex:gsub("%x%x", function(h) return string.char(tonumber(h, 16)) end)
    return "SHA256:" .. b64enc(bin):gsub("=+$", "")
end
local function parse_key(line)
    for _, t in ipairs({ "ssh%-ed25519", "ssh%-rsa", "ecdsa%-sha2%-nistp256", "ecdsa%-sha2%-nistp384", "ecdsa%-sha2%-nistp521", "sk%-ssh%-ed25519@openssh%.com" }) do
        local opts, typ, blob, comment = line:match("^%s*(.-)%s*(" .. t .. ")%s+([%w%+/=]+)%s*(.-)%s*$")
        if typ then return { opts = opts, type = typ, blob = blob, comment = comment } end
    end
end
function T.ssh_list()
    local keys = {}
    for line in (readf(AK) or ""):gmatch("[^\n]+") do
        local k = parse_key(line)
        if k then keys[#keys + 1] = { type = k.type, comment = k.comment, fp = fingerprint(k.blob), restricted = k.opts ~= "", claude = k.comment:match("^claude%-") ~= nil } end
    end
    local pw = trim(sh("uci -q get dropbear.@dropbear[0].PasswordAuth")); if pw == "" then pw = trim(sh("uci -q show dropbear | sed -n \"s/.*PasswordAuth='\\(.*\\)'/\\1/p\" | head -1")) end
    return { ok = true, keys = keys, password_login = pw ~= "off" and pw ~= "0" }
end
local function ak_backup() os.execute("mkdir -p /root/machome-backup; cp -p " .. AK .. " /root/machome-backup/authorized_keys." .. os.date("%Y%m%d-%H%M%S") .. " 2>/dev/null") end
function T.ssh_add(line)
    line = trim(line or ""):gsub("[\r\n]", "")
    if #line > 2000 then return { ok = false, err = "that key is too long" } end
    local k = parse_key(line)
    if not k or k.opts ~= "" then return { ok = false, err = "that doesn't look like a public key (it should start with ssh-ed25519, ssh-rsa or ecdsa-sha2-…)" } end
    if #k.blob < 60 then return { ok = false, err = "that key is too short to be valid" } end
    if k.comment:match("[^%w%._@%-%s]") then return { ok = false, err = "the key's comment has unusual characters; remove them and try again" } end
    for _, e in ipairs(T.ssh_list().keys) do if e.fp == fingerprint(k.blob) then return { ok = false, err = "that key is already authorized" } end end
    ak_backup()
    local f = io.open(AK, "a"); if not f then return { ok = false, err = "can't write the key file" } end
    f:write(k.type .. " " .. k.blob .. (k.comment ~= "" and (" " .. k.comment) or "") .. "\n"); f:close()
    os.execute("chmod 600 " .. AK); os.execute("logger -t machome 'toolkit: SSH key added (" .. k.type .. ")'")
    return { ok = true }
end
function T.ssh_remove(fp)
    local lines, kept, removed, total = {}, 0, 0, 0
    for line in (readf(AK) or ""):gmatch("[^\n]+") do
        local k = parse_key(line)
        if k then total = total + 1; if fingerprint(k.blob) == fp then removed = removed + 1 else lines[#lines + 1] = line; kept = kept + 1 end
        else lines[#lines + 1] = line end
    end
    if removed == 0 then return { ok = false, err = "key not found" } end
    if kept == 0 then return { ok = false, err = "that's the only key left; removing it would lock SSH out (password login is off)" } end
    ak_backup()
    writef(AK .. ".new", table.concat(lines, "\n") .. "\n"); os.execute("chmod 600 " .. AK .. ".new; mv " .. AK .. ".new " .. AK)
    os.execute("logger -t machome 'toolkit: SSH key removed from the Home tab'")
    return { ok = true }
end

return T
