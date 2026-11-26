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
-- ---------------------------------------------------------------- update channel (2.7.1)
-- Stable (default): only normal GitHub releases (/releases/latest never returns a pre-release).
-- Beta: GitHub releases marked "pre-release" too (tag like v2.8.0-beta.1), whichever is newest.
-- Saved in /etc/machome/update.json; survives firmware upgrades with the rest of /etc/machome.
local CHAN = "/etc/machome/update.json"
function U.channel()
    local ok, v = pcall(cjson.decode, readf(CHAN) or "{}")
    return (ok and type(v) == "table" and v.channel == "beta") and "beta" or "stable"
end
function U.set_channel(ch)
    if ch ~= "beta" and ch ~= "stable" then return { ok = false, err = "unknown channel" } end
    os.execute("mkdir -p /etc/machome")
    writef(CHAN, cjson.encode({ channel = ch, t = os.time() }))
    os.remove(CHECK)   -- the last check was for the other channel
    os.execute("logger -t machome 'updates: channel set to " .. ch .. "'")
    return { ok = true, channel = ch }
end
-- "2.8.0-beta.1" -> {2,8,0}, "beta", 1.  "v2.6.3" / "v.2.6.3" -> {2,6,3}, nil
local function vparse(s)
    s = tostring(s or "")
    local t = {}; for n in (s:match("%d+[%.%d]*") or ""):gmatch("%d+") do t[#t + 1] = tonumber(n) end
    local pre = s:match("%d[%-%.]?(%a+[%.%-]?%d*)%s*$")
    return t, pre and pre:lower():match("^%a+") or nil, pre and tonumber(pre:match("(%d+)$")) or 0
end
function U.is_beta(s) local _, p = vparse(s); return p ~= nil end
-- "2.6" < "2.6.1" < "2.10"; "2.8.0-beta.1" < "2.8.0-beta.2" < "2.8.0" (a stable release beats its betas)
function U.newer(a, b)
    local x, xp, xn = vparse(a)
    local y, yp, yn = vparse(b)
    for i = 1, math.max(#x, #y) do local u, v = x[i] or 0, y[i] or 0; if u ~= v then return u > v end end
    if xp == nil and yp == nil then return false end
    if xp == nil then return true end
    if yp == nil then return false end
    if xp ~= yp then return xp > yp end   -- alpha < beta < rc
    return xn > yn
end
-- the version inside a tag: "v2.8.0-beta.1" -> "2.8.0-beta.1", "v.2.6.3" / "Version 2.6.3" -> "2.6.3"
function U.tag_version(tag)
    tag = tostring(tag or "")
    return tag:match("%d+[%.%d]*%d%-%a+[%.%-]?%d*") or tag:match("%d+[%.%d]*%d") or tag:match("%d+") or ""
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
    local cur, ch = U.installed(), U.channel()
    -- Stable: /releases/latest (GitHub never returns a pre-release there). Beta: the newest of the last 20 releases,
    -- pre-releases included (a stable release newer than every beta wins, so testers end up on it).
    -- -L (2.7.1): the owner's GitHub account was renamed (xDarkHawkx → DogZoomZoom) and GitHub answers the old name
    -- with "301 Moved Permanently"; routers up to 2.7.0 didn't follow it, so their update check failed.
    local out = sh("curl -s -L -m 20 -w '\\n%{http_code}' -A RouterHome-updater -H 'Accept: application/vnd.github+json' https://api.github.com/repos/" .. REPO ..
        (ch == "beta" and "/releases?per_page=20" or "/releases/latest"))
    local body, code = out:match("^(.*)\n(%d%d%d)%s*$")
    local res = { ok = true, current = cur, checked = os.time(), repo = REPO, channel = ch, current_beta = U.is_beta(cur) }
    if code == "404" then res.none = true; res.msg = "No releases have been published on GitHub yet."
    elseif code ~= "200" then return { ok = false, current = cur, channel = ch, err = code and ("GitHub answered with error " .. code) or "couldn't reach GitHub (is the internet up?)" }
    else
        local ok, rel = pcall(cjson.decode, body or "")
        if not ok or type(rel) ~= "table" then return { ok = false, current = cur, channel = ch, err = "GitHub's answer couldn't be read" } end
        if ch == "beta" then
            local best
            for _, r in ipairs(rel) do
                if type(r) == "table" and r.draft ~= true and U.tag_version(r.tag_name) ~= "" and (not best or U.newer(U.tag_version(r.tag_name), U.tag_version(best.tag_name))) then best = r end
            end
            if not best then res.none = true; res.msg = "No releases have been published on GitHub yet."; writef(CHECK, cjson.encode(res)); return res end
            rel = best
        end
        local pkg, sig = pick_assets(rel)
        -- the version number inside the tag, whatever surrounds it ("v2.6.3", "v.2.6.3", "Version 2.6.3" → "2.6.3";
        -- "v2.8.0-beta.1" → "2.8.0-beta.1"). A tag typo ("v.2.6.3") once made a perfect install roll back (2026-11-22).
        res.latest = U.tag_version(rel.tag_name)
        res.prerelease = rel.prerelease == true or U.is_beta(res.latest)
        res.name = rel.name or cjson.null
        res.notes = tostring(rel.body or ""):sub(1, 6000)
        res.published = rel.published_at or cjson.null
        res.url = rel.html_url or cjson.null
        res.newer = U.newer(res.latest, cur)
        -- back to Stable from a beta: offer the newest stable release even though it's an older number
        if ch == "stable" and res.current_beta and not res.newer and res.latest ~= "" and res.latest ~= cur then res.newer = true; res.back = true end
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
    j.ok = true; j.current = U.installed(); j.channel = U.channel()
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
