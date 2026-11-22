-- Router Home updates from GitHub (owner, 2026-11-22). Control Center → Router Home updates.
-- Checks https://github.com/xDarkHawkx/RouterHome releases. An update installs ONLY if its package is signed with
-- the Router Home release key (/usr/share/machome/release.pub, verified by OpenWrt's usign); the secret key never
-- leaves the owner's PC. Installing runs in the background (upd_job.lua) with a full backup and automatic rollback.
local cjson = require "cjson"
local U = {}
local REPO = "xDarkHawkx/RouterHome"
local DIR = "/tmp/machome"
local CHECK, JOB, PID = DIR .. "/upd_check.json", DIR .. "/upd_job.json", DIR .. "/upd_job.pid"
local B = "/root/machome-backup"

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p, "w"); if not f then return false end; f:write(s); f:close(); return true end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
U.readf, U.writef, U.sh = readf, writef, sh

function U.installed()
    return sh("zcat /www/views/gl-sdk4-ui-machome.common.js.gz | grep -o \"MH_VERSION = '[^']*'\" | head -1"):match("'([^']+)'") or "0"
end
-- "2.6" < "2.6.1" < "2.10"; a leading "v" is ignored
function U.newer(a, b)
    local function parts(s) local t = {}; for n in tostring(s):gsub("^[vV]", ""):gmatch("%d+") do t[#t + 1] = tonumber(n) end; return t end
    local x, y = parts(a), parts(b)
    for i = 1, math.max(#x, #y) do local u, v = x[i] or 0, y[i] or 0; if u ~= v then return u > v end end
    return false
end
local function pick_assets(rel)
    local pkg, sig
    for _, a in ipairs(type(rel.assets) == "table" and rel.assets or {}) do
        local n = tostring(a.name or "")
        if n:match("^routerhome%-update%-[%w%.%-]+%.tgz$") then pkg = { name = n, url = a.browser_download_url, size = a.size } end
        if n:match("^routerhome%-update%-[%w%.%-]+%.tgz%.sig$") then sig = { name = n, url = a.browser_download_url } end
    end
    if pkg and sig and sig.name ~= pkg.name .. ".sig" then sig = nil end
    return pkg, sig
end

function U.check()
    local cur = U.installed()
    local out = sh("curl -s -m 20 -w '\\n%{http_code}' -A RouterHome-updater -H 'Accept: application/vnd.github+json' https://api.github.com/repos/" .. REPO .. "/releases/latest")
    local body, code = out:match("^(.*)\n(%d%d%d)%s*$")
    local res = { ok = true, current = cur, checked = os.time(), repo = REPO }
    if code == "404" then res.none = true; res.msg = "No releases have been published on GitHub yet."
    elseif code ~= "200" then return { ok = false, current = cur, err = code and ("GitHub answered with error " .. code) or "couldn't reach GitHub (is the internet up?)" }
    else
        local ok, rel = pcall(cjson.decode, body or "")
        if not ok or type(rel) ~= "table" then return { ok = false, current = cur, err = "GitHub's answer couldn't be read" } end
        local pkg, sig = pick_assets(rel)
        -- the version number inside the tag, whatever surrounds it ("v2.6.3", "v.2.6.3", "Version 2.6.3" → "2.6.3").
        -- A tag typo ("v.2.6.3") once made a perfect install roll back because "2.6.3" ≠ ".2.6.3" (2026-11-22).
        res.latest = tostring(rel.tag_name or ""):match("%d+[%.%d]*%d") or tostring(rel.tag_name or ""):match("%d+") or ""
        res.name = rel.name or cjson.null
        res.notes = tostring(rel.body or ""):sub(1, 6000)
        res.published = rel.published_at or cjson.null
        res.url = rel.html_url or cjson.null
        res.newer = U.newer(res.latest, cur)
        res.installable = (pkg ~= nil and sig ~= nil)
        res.pkg = pkg or cjson.null; res.sig = sig or cjson.null
    end
    writef(CHECK, cjson.encode(res))
    return res
end

local function job_alive()
    local pid = tonumber((readf(PID) or ""):match("%d+"))
    return pid ~= nil and (readf("/proc/" .. pid .. "/cmdline") or ""):find("upd_job.lua", 1, true) ~= nil
end
function U.status()
    local ok, j = pcall(cjson.decode, readf(JOB) or "null"); j = (ok and type(j) == "table") and j or { running = false }
    if j.running and not job_alive() then j.running = false; j.err = j.err or "stopped unexpectedly" end
    j.ok = true; j.current = U.installed()
    j.rollback = (sh("ls -t " .. B .. "/pre-update-*.tgz 2>/dev/null | head -1"):match("pre%-update%-([%w%.%-]+)%.tgz")) or cjson.null
    return j
end
function U.install()
    if job_alive() then return { ok = false, err = "an update is already running" } end
    local ok, c = pcall(cjson.decode, readf(CHECK) or "null")
    if not ok or type(c) ~= "table" or not c.newer then return { ok = false, err = "check for updates first" } end
    if not c.installable then return { ok = false, err = "this release has no signed update package; download the installer from GitHub instead" } end
    if not readf("/usr/share/machome/release.pub") then return { ok = false, err = "the release key is missing on this router; reinstall with the installer once" } end
    writef(JOB, cjson.encode({ running = true, step = "Starting…", pct = 0, from = c.current, to = c.latest, started = os.time() }))
    os.execute("start-stop-daemon -S -b -m -p " .. PID .. " -x /usr/bin/lua -- /usr/lib/machome/upd_job.lua install >/dev/null 2>&1")
    os.execute("logger -t machome 'update: installing " .. tostring(c.latest):gsub("[^%w%.%-]", "") .. " from GitHub (started from the Home tab)'")
    return { ok = true }
end
function U.rollback()
    if job_alive() then return { ok = false, err = "an update is running" } end
    local f = sh("ls -t " .. B .. "/pre-update-*.tgz 2>/dev/null | head -1"):match("%S+")
    if not f then return { ok = false, err = "there's no earlier version saved" } end
    writef(JOB, cjson.encode({ running = true, step = "Restoring the previous version…", pct = 0, started = os.time() }))
    os.execute("start-stop-daemon -S -b -m -p " .. PID .. " -x /usr/bin/lua -- /usr/lib/machome/upd_job.lua rollback >/dev/null 2>&1")
    return { ok = true }
end
return U
