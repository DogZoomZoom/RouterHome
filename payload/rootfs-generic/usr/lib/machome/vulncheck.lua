-- Known-vulnerability checker for the Security card (owner, 2026-11-22; Router Home 2.6.5). No AI: two kinds of
-- structured data, checked with plain rules.
--  1. GL.iNet notices as a SIGNED list (advisories.json in the Router Home GitHub repo, signed with the release key,
--     verified with usign against /usr/share/machome/release.pub; a copy ships with Router Home). Each entry says
--     which models/firmware it concerns, what to look for on the router (a process, a file, a setting, a service,
--     a listening port) and which fix applies, chosen from a short fixed list (fixes below).
--  2. The US National Vulnerability Database (NVD): published CVEs for this exact model, matched by firmware version.
-- Runs in the background:  lua vulncheck.lua run    (download both, then check)  - once a day + "Check now"
--                          lua vulncheck.lua local  (check with what's already downloaded) - every 10 minutes
-- Results: /tmp/machome/vuln.json (read by rpc vuln_status and extras.lua for the Security card and Discord).
local cjson = require "cjson"
local V = {}
local DIR, EDIR = "/tmp/machome", "/etc/machome"
local OUT, PID = DIR .. "/vuln.json", DIR .. "/vuln_job.pid"
local PUB = "/usr/share/machome/release.pub"
local ADV_BUILTIN, ADV_DL = "/usr/share/machome/advisories.json", EDIR .. "/advisories.json"
local NVD_CACHE = EDIR .. "/vuln_nvd.json"
local ADV_URL = "https://raw.githubusercontent.com/xDarkHawkx/RouterHome/main/security/advisories.json"
local NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0?virtualMatchString=cpe:2.3:o:gl-inet:"
local B = "/root/machome-backup"

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p .. ".tmp", "w"); if not f then return false end; f:write(s); f:close(); return os.rename(p .. ".tmp", p) end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function trim(s) return ((s or ""):gsub("^%s+", ""):gsub("%s+$", "")) end
local function jread(p) local s = readf(p); if not s or s == "" then return nil end; local ok, v = pcall(cjson.decode, s); return (ok and type(v) == "table") and v or nil end
local function q(s) return "'" .. tostring(s):gsub("'", "'\\''") .. "'" end
local function log(m) os.execute("logger -t machome " .. q("vulncheck: " .. m)) end

function V.model() return trim(readf("/proc/gl-hw-info/model") or ""):lower() end   -- "mt5000", "be9300", "be10000"
function V.firmware() return trim(readf("/etc/glversion") or "") end
-- "4.9.0" < "4.9.1" < "4.10.0"
local function parts(v) local t = {}; for n in tostring(v or ""):gmatch("%d+") do t[#t + 1] = tonumber(n) end; return t end
local function cmp(a, b)
    local x, y = parts(a), parts(b)
    for i = 1, math.max(#x, #y) do local u, w = x[i] or 0, y[i] or 0; if u ~= w then return u < w and -1 or 1 end end
    return 0
end
V.cmp = cmp

-- ---------------------------------------------------------------- the advisory list (signed)
-- 2.8.0 key rotation: the new key, or (only during the switch) the previous one. Remove the fallback next release.
local PUB_OLD = "/usr/share/machome/release-old.pub"
local function verify(file, sig)
    if os.execute("usign -V -q -m " .. q(file) .. " -p " .. PUB .. " -x " .. q(sig) .. " >/dev/null 2>&1") == 0 then return true end
    return readf(PUB_OLD) ~= nil and os.execute("usign -V -q -m " .. q(file) .. " -p " .. PUB_OLD .. " -x " .. q(sig) .. " >/dev/null 2>&1") == 0
end
function V.load_adv()
    -- the downloaded list (signature checked when it was downloaded AND again now) if it's at least as new as the built-in one
    local bi = jread(ADV_BUILTIN)
    local dl = (readf(ADV_DL .. ".sig") and verify(ADV_DL, ADV_DL .. ".sig")) and jread(ADV_DL) or nil
    if dl and (not bi or (tonumber(dl.version) or 0) >= (tonumber(bi.version) or 0)) then return dl, "github" end
    return bi, "built-in"
end
function V.fetch_adv()
    local tmp = DIR .. "/adv_dl"
    -- -L (2.7.1): follow GitHub's redirect if the account or repo is renamed again (the list is signed either way)
    local c1 = sh("curl -s -L -m 25 -A RouterHome-vulncheck -o " .. tmp .. ".json -w '%{http_code}' " .. ADV_URL)
    local c2 = sh("curl -s -L -m 25 -A RouterHome-vulncheck -o " .. tmp .. ".json.sig -w '%{http_code}' " .. ADV_URL .. ".sig")
    local err
    if c1 == "404" then err = "no list on GitHub yet (the built-in one is used)"
    elseif c1 ~= "200" or c2 ~= "200" then err = "couldn't download the list from GitHub (" .. (c1 ~= "" and c1 or "no answer") .. ")"
    elseif not verify(tmp .. ".json", tmp .. ".json.sig") then err = "the downloaded list's signature is invalid, so it was ignored"; log("advisory list from GitHub has a BAD signature - ignored")
    else
        local new, cur = jread(tmp .. ".json"), jread(ADV_DL) or jread(ADV_BUILTIN) or {}
        if not new or type(new.advisories) ~= "table" then err = "the downloaded list couldn't be read"
        elseif (tonumber(new.version) or 0) < (tonumber(cur.version) or 0) then err = "GitHub had an older list than this router (ignored)"
        else os.execute("mv " .. tmp .. ".json " .. ADV_DL .. " && mv " .. tmp .. ".json.sig " .. ADV_DL .. ".sig") end
    end
    os.remove(tmp .. ".json"); os.remove(tmp .. ".json.sig")
    return err
end

-- ---------------------------------------------------------------- NVD (published CVEs for this model)
-- NVD names GL products two ways ("gl-mt3000_firmware" and "mt3000_firmware"), so both are asked.
local function cvss(m)
    for _, k in ipairs({ "cvssMetricV40", "cvssMetricV31", "cvssMetricV30" }) do
        local x = type(m) == "table" and m[k] and m[k][1]
        if x and x.cvssData then return tostring(x.cvssData.baseSeverity or ""):lower(), tonumber(x.cvssData.baseScore) end
    end
    local x = type(m) == "table" and m.cvssMetricV2 and m.cvssMetricV2[1]
    if x then return tostring(x.baseSeverity or ""):lower(), x.cvssData and tonumber(x.cvssData.baseScore) end
    return "unknown", nil
end
local function affected_by(cm, prods, fw)
    -- one cpeMatch: is THIS model on THIS firmware inside it?
    if cm.vulnerable == false then return false end
    local f = {}; for p in tostring(cm.criteria or ""):gmatch("[^:]+") do f[#f + 1] = p end
    if not prods[f[5] or ""] then return false end
    local ver = f[6] or "*"
    if ver ~= "*" and ver ~= "-" then return cmp(fw, ver) == 0, nil end
    local fix = cm.versionEndExcluding
    if cm.versionStartIncluding and cmp(fw, cm.versionStartIncluding) < 0 then return false end
    if cm.versionStartExcluding and cmp(fw, cm.versionStartExcluding) <= 0 then return false end
    if cm.versionEndExcluding and cmp(fw, cm.versionEndExcluding) >= 0 then return false end
    if cm.versionEndIncluding and cmp(fw, cm.versionEndIncluding) > 0 then return false end
    return true, fix
end
function V.fetch_nvd(model, fw)
    if model == "" then return { err = "unknown model" } end
    local prods = { ["gl-" .. model .. "_firmware"] = true, [model .. "_firmware"] = true }
    local found, seen, asked, errs = {}, {}, 0, {}
    for p in pairs(prods) do
        if asked > 0 then os.execute("sleep 7") end   -- NVD allows 5 requests / 30 s without a key
        asked = asked + 1
        local out = sh("curl -s -m 60 -A RouterHome-vulncheck -w '\\n%{http_code}' " .. q(NVD_URL .. p))
        local body, code = out:match("^(.*)\n(%d%d%d)%s*$")
        if code ~= "200" then errs[#errs + 1] = "NVD answered " .. (code or "nothing")
        else
            local ok, j = pcall(cjson.decode, body or "")
            if not ok or type(j) ~= "table" then errs[#errs + 1] = "NVD's answer couldn't be read"
            else
                for _, v in ipairs(type(j.vulnerabilities) == "table" and j.vulnerabilities or {}) do
                    local c = v.cve or {}
                    if c.id and not seen[c.id] then
                        seen[c.id] = true
                        local hit, fixv = false, nil
                        for _, cfg in ipairs(type(c.configurations) == "table" and c.configurations or {}) do
                            for _, nd in ipairs(type(cfg.nodes) == "table" and cfg.nodes or {}) do
                                for _, cm in ipairs(type(nd.cpeMatch) == "table" and nd.cpeMatch or {}) do
                                    local a, fx = affected_by(cm, prods, fw); if a then hit = true; fixv = fixv or fx end
                                end
                            end
                        end
                        local desc = ""; for _, d in ipairs(type(c.descriptions) == "table" and c.descriptions or {}) do if d.lang == "en" then desc = tostring(d.value or "") end end
                        local sev, score = cvss(c.metrics)
                        found[#found + 1] = { id = c.id, affected = hit, fixed_in = fixv or cjson.null, severity = sev, score = score or cjson.null,
                            summary = desc:sub(1, 400), published = tostring(c.published or ""):sub(1, 10), link = "https://nvd.nist.gov/vuln/detail/" .. c.id }
                    end
                end
            end
        end
    end
    local r = { t = os.time(), model = model, fw = fw, list = found, err = (#errs == asked) and errs[1] or cjson.null }
    if #errs < asked then writef(NVD_CACHE, cjson.encode(r)) end
    return r
end

-- ---------------------------------------------------------------- GL.iNet's own news feeds: new notices not in the list yet
-- GL publishes Atom feeds (public, meant for feed readers): "Security Updates" (CVE advisories) and the main blog
-- (where notices like 2026-11-20 appear). Security posts from the last 90 days that no entry in the signed list
-- covers show up as "new notice, not checked yet" (+ one Discord alert via extras.lua). Nothing is run from them.
local FEED_CACHE = EDIR .. "/gl_notices.json"
local FEEDS = { { url = "https://www.gl-inet.com/blogs/security-updates.atom", all = true }, { url = "https://www.gl-inet.com/blogs/blog.atom", all = false } }
local function unent(s) return (tostring(s or ""):gsub("&amp;", "&"):gsub("&lt;", "<"):gsub("&gt;", ">"):gsub("&quot;", '"'):gsub("&#39;", "'"):gsub("&#x27;", "'")) end
function V.linkkey(u)   -- "https://www.gl-inet.com/en-gb/blogs/blog/x?country=GB" -> "/blogs/blog/x"
    local p = tostring(u or ""):gsub("^https?://[^/]+", ""):gsub("[?#].*$", ""):gsub("/$", "")
    return (p:gsub("^/%a%a%-%a%a/", "/"):gsub("^/%a%a/", "/"))
end
function V.fetch_feeds()
    local list, seen, errs = {}, {}, {}
    for _, f in ipairs(FEEDS) do
        local out = sh("curl -s -m 30 -A RouterHome-vulncheck -w '\\n%{http_code}' " .. q(f.url))
        local body, code = out:match("^(.*)\n(%d%d%d)%s*$")
        if code ~= "200" or not (body or ""):find("<feed", 1, true) then errs[#errs + 1] = "GL's feed answered " .. (code or "nothing")
        else
            for e in body:gmatch("<entry>(.-)</entry>") do
                local title = unent(e:match("<title[^>]*>(.-)</title>"))
                local link = e:match('<link[^>]-rel="alternate"[^>]-href="([^"]+)"') or e:match('<link[^>]-href="([^"]+)"')
                local pub = (e:match("<published>(.-)</published>") or e:match("<updated>(.-)</updated>") or ""):sub(1, 10)
                local tl = title:lower()
                local sec = f.all or tl:find("security", 1, true) or tl:find("vulnerab", 1, true) or tl:find("cve", 1, true) or tl:find("advisor", 1, true) or tl:find("exploit", 1, true) or tl:find("malware", 1, true)
                if link and title ~= "" and sec and not seen[V.linkkey(link)] then
                    seen[V.linkkey(link)] = true; list[#list + 1] = { title = title:sub(1, 200), link = unent(link), published = pub }
                end
            end
        end
    end
    local r = { t = os.time(), list = list, err = (#errs == #FEEDS) and errs[1] or cjson.null }
    if #errs < #FEEDS then writef(FEED_CACHE, cjson.encode(r)) end
    return r
end

-- ---------------------------------------------------------------- 1. security firmware, straight from GL's release notes (2.7.0)
-- GL's update server sends the release notes with every new firmware. If they talk about a security fix, a
-- vulnerability, a CVE, malware or unauthorized access, this router gets "Security firmware available" for ANY model,
-- without waiting for the signed list. Plain keyword rules, no AI. Cache: /etc/machome/fw_security.json.
local FWSEC = EDIR .. "/fw_security.json"
local function lrpc(obj, method, params)
    local f = DIR .. "/vc_rpc.json"
    writef(f, cjson.encode({ jsonrpc = "2.0", id = 1, method = "call", params = { "", obj, method, params or cjson.empty_object or {} } }))
    local out = sh("curl -s -m 40 -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @" .. f .. " http://127.0.0.1/rpc")
    os.remove(f)
    local ok, v = pcall(cjson.decode, out); return ok and type(v) == "table" and v.result or nil
end
V.lrpc = lrpc
function V.fetch_fw_security(fw)
    local r = lrpc("upgrade", "check_firmware_online", {})
    if type(r) ~= "table" then return { err = "GL's update server didn't answer" } end
    local new = type(r.version_new) == "string" and r.version_new ~= "" and r.version_new or nil
    local res = { t = os.time(), current = fw, new = new or cjson.null, security = false, critical = false, cves = {}, notes = "" }
    if new then
        local note = tostring(r.release_note or "")
        local l = note:lower()
        res.security = l:find("security", 1, true) ~= nil or l:find("vulnerab", 1, true) ~= nil or l:find("cve%-%d") ~= nil
            or l:find("exploit", 1, true) ~= nil or l:find("malware", 1, true) ~= nil or l:find("unauthori", 1, true) ~= nil
        res.critical = l:find("malware", 1, true) ~= nil or l:find("unauthori", 1, true) ~= nil or l:find("remote code", 1, true) ~= nil
            or l:find("actively exploited", 1, true) ~= nil or (l:find("upgrad", 1, true) ~= nil and l:find("immediately", 1, true) ~= nil)
        local seen = {}; for c in note:gmatch("CVE%-%d+%-%d+") do if not seen[c] then seen[c] = true; res.cves[#res.cves + 1] = c end end
        res.notes = note:gsub("\r", ""):gsub("#+%s*", ""):gsub("%*%*", ""):gsub("\n%s*%*%s*", "\n• "):gsub("\n\n+", "\n"):gsub("^%s+", ""):sub(1, 700)
        res.compiled = r.new_compile_time or cjson.null
    end
    writef(FWSEC, cjson.encode(res))
    return res
end

-- ---------------------------------------------------------------- 2. daily "signs of tampering" sweep (2.7.0)
-- General checks that need no published notice, compared with what's normal on THIS router (baseline taken at the
-- first sweep: /etc/machome/sweep_base.json). Only alerts; nothing is removed automatically (it could break the
-- router). "Severe" signs (a program running from a temp folder, a hidden preload, an extra admin account) mean a
-- factory reset is the safe answer; the rest is "unusual, have a look" with a button to mark it as expected.
local SWBASE, SWOUT = EDIR .. "/sweep_base.json", DIR .. "/sweep.json"
local function sweep_state()
    local st = {}
    st.keys = {}; for b in (readf("/etc/dropbear/authorized_keys") or ""):gmatch("ssh%-[%w%-]+%s+([%w%+/=]+)") do st.keys[#st.keys + 1] = b:sub(-24) end
    st.users = {}; st.root2 = {}
    for line in (readf("/etc/passwd") or ""):gmatch("[^\n]+") do
        local name, uid = line:match("^([^:]+):[^:]*:(%d+):"); if name then st.users[#st.users + 1] = name; if uid == "0" and name ~= "root" then st.root2[#st.root2 + 1] = name end end
    end
    st.cron = {}; for l in (readf("/etc/crontabs/root") or ""):gmatch("[^\n]+") do if l:match("%S") and not l:match("^%s*#") then st.cron[#st.cron + 1] = l end end
    st.ports = {}
    for _, f in ipairs({ "/proc/net/tcp", "/proc/net/tcp6" }) do
        for line in (readf(f) or ""):gmatch("[^\n]+") do
            local la, stt = line:match("^%s*%d+:%s+(%S+)%s+%S+%s+(%x%x)")
            if la and stt == "0A" then
                local ip, port = la:match("^(%x+):(%x+)$")
                if ip and (ip:match("^0+$")) then st.ports[#st.ports + 1] = tostring(tonumber(port, 16)) end   -- open to every network
            end
        end
    end
    table.sort(st.keys); table.sort(st.users); table.sort(st.cron)
    local u = {}; for _, p in ipairs(st.ports) do u[p] = true end; st.ports = {}; for p in pairs(u) do st.ports[#st.ports + 1] = p end; table.sort(st.ports)
    return st
end
local function setdiff(now, was) local w, out = {}, {}; for _, x in ipairs(was or {}) do w[x] = true end; for _, x in ipairs(now or {}) do if not w[x] then out[#out + 1] = x end end; return out end
function V.sweep()
    local found = {}    -- { cat, label, severe }
    local function add(cat, label, severe) found[#found + 1] = { cat = cat, label = label, severe = severe == true } end
    -- programs running from temp folders, or from a file that was deleted after starting (classic malware tricks)
    for pid in sh("ls /proc"):gmatch("%d+") do
        local exe = trim(sh("readlink /proc/" .. pid .. "/exe"))
        if exe:match("^/tmp/") or exe:match("^/var/tmp/") or exe:match("^/dev/shm/") or exe:find("(deleted)", 1, true) then
            local cmd = (readf("/proc/" .. pid .. "/cmdline") or ""):gsub("%z", " "):sub(1, 80)
            add("proc", "A program is running from " .. (exe:find("deleted", 1, true) and "a deleted file" or "a temporary folder") .. ": " .. exe .. " (" .. trim(cmd) .. ")", true)
        end
    end
    -- real programs (ELF executables) stored in temp folders; GL keeps only lock and marker files there
    for f in sh("find /tmp /var/tmp /dev/shm -xdev -maxdepth 4 -type f -size +1k 2>/dev/null | head -400"):gmatch("[^\n]+") do
        local h = io.open(f, "rb"); local m = h and h:read(4); if h then h:close() end
        if m == "\127ELF" then add("tmpelf", "A program file is stored in a temporary folder: " .. f, false) end
    end
    if readf("/etc/ld.so.preload") then add("preload", "/etc/ld.so.preload exists (a way to inject code into every program)", true) end
    local crond = tonumber(trim(sh("ps w | grep -c '[c]rond'"))) or 0
    if crond > 1 then add("crond", crond .. " copies of the task scheduler (crond) are running (normally 1)", false) end
    -- unknown programs added to the system folders (not from any installed package, not Router Home)
    local own = {}; for f in sh("cat /usr/lib/opkg/info/*.list 2>/dev/null"):gmatch("[^\n]+") do own[f] = true end
    for f in sh("cd /overlay/upper 2>/dev/null && find bin sbin usr/bin usr/sbin usr/libexec -type f 2>/dev/null"):gmatch("[^\n]+") do
        local p = "/" .. f; if not own[p] and not p:match("/machome%-[%w%-]+$") then add("sysbin", "A program not from any installed package is in a system folder: " .. p, false) end
    end
    -- compared with this router's normal state
    local now, base = sweep_state(), jread(SWBASE)
    if #now.root2 > 0 then add("root2", "Extra admin (root-level) account: " .. table.concat(now.root2, ", "), true) end
    if not base then base = now; base.ports_prev = now.ports; writef(SWBASE, cjson.encode(base))   -- first sweep = this router's normal
    else
        for _, k in ipairs(setdiff(now.keys, base.keys)) do add("keys", "A new SSH key can sign in (…" .. k:sub(-10) .. "). If you added it, mark it as expected.", false) end
        for _, u in ipairs(setdiff(now.users, base.users)) do add("users", "A new user account appeared: " .. u, false) end
        for _, c in ipairs(setdiff(now.cron, base.cron)) do add("cron", "A new scheduled task: " .. c:sub(1, 100), false) end
        -- a new port open to every network, seen in two daily sweeps in a row (programs restart on new ports now and then)
        local newp = setdiff(now.ports, base.ports); local prev = {}; for _, p in ipairs(base.ports_prev or {}) do prev[p] = true end
        for _, p in ipairs(newp) do if prev[p] then add("ports", "A new port is open to every network: " .. p .. " (seen two days in a row)", false) end end
        base.ports_prev = now.ports; writef(SWBASE, cjson.encode(base))
    end
    -- findings the owner marked as expected (non-severe only) stay quiet
    local ok = {}; for _, l in ipairs(type(base.ok) == "table" and base.ok or {}) do ok[l] = true end
    local kept = {}; for _, f in ipairs(found) do if f.severe or not ok[f.label] then kept[#kept + 1] = f end end
    found = kept
    local res = { t = os.time(), found = found }
    writef(SWOUT, cjson.encode(res))
    return res
end
--- "These are expected": the current state becomes this router's normal (keys, users, tasks, ports)
function V.accept()
    local r = jread(SWOUT) or {}; local keep, okl = {}, {}
    for _, f in ipairs(type(r.found) == "table" and r.found or {}) do if f.severe then keep[#keep + 1] = f else okl[#okl + 1] = f.label end end
    local old = jread(SWBASE) or {}
    for _, l in ipairs(type(old.ok) == "table" and old.ok or {}) do okl[#okl + 1] = l end
    local now = sweep_state(); now.ports_prev = now.ports; now.ok = okl
    writef(SWBASE, cjson.encode(now))
    r.found = keep; writef(SWOUT, cjson.encode(r))
    log("tampering sweep: current keys/accounts/tasks/ports marked as expected from the Home tab")
    return V.run("local")
end

-- ---------------------------------------------------------------- checks on the router
local SAFE_PATH = function(p) p = tostring(p or ""); return p:match("^/[%w%._%-/]+$") ~= nil and not p:find("..", 1, true) end
local procs_cache = nil
local function processes()
    if procs_cache then return procs_cache end
    local list = {}
    for pid in sh("ls /proc"):gmatch("%d+") do
        local cl = readf("/proc/" .. pid .. "/cmdline")
        if cl and cl ~= "" then list[#list + 1] = { pid = tonumber(pid), cmd = (cl:gsub("%z", " ")) } end
    end
    procs_cache = list; return list
end
local function listening(port)
    local hex = string.format(":%04X", tonumber(port) or 0)
    for _, f in ipairs({ "/proc/net/tcp", "/proc/net/tcp6" }) do
        for line in (readf(f) or ""):gmatch("[^\n]+") do
            local la, st = line:match("^%s*%d+:%s+(%S+)%s+%S+%s+(%x%x)")
            if la and st == "0A" and la:sub(-5):upper() == hex then return true end
        end
    end
    return false
end
-- one condition from the list: true = found on this router, nil = couldn't check
function V.test(c)
    if type(c) ~= "table" then return nil end
    -- 2.8.0 (list v6): "running" = a program is running (like process), "setting" = a setting has a value (like uci).
    -- New names on purpose: older versions skip unknown types, so exposures that use "until_fixed" (which they
    -- don't understand) can't give them false alarms on already-fixed firmware.
    if c.type == "running" or c.type == "setting" then
        local d = {}; for k, v in pairs(c) do d[k] = v end
        d.type = c.type == "running" and "process" or "uci"
        return V.test(d)
    end
    if c.type == "process" then
        local m = tostring(c.match or ""); if #m < 3 then return nil end
        for _, p in ipairs(processes()) do if p.cmd:find(m, 1, true) and p.pid ~= tonumber(trim(readf("/proc/self/stat") or ""):match("^%d+")) then return true end end
        return false
    elseif c.type == "file" then if not SAFE_PATH(c.path) then return nil end; return readf(c.path) ~= nil or sh("ls -d " .. q(c.path)):match("%S") ~= nil
    elseif c.type == "uci" then
        local k = tostring(c.key or ""); if not k:match("^[%w_%-]+%.[%w_@%[%]%-]+%.[%w_]+$") then return nil end
        return trim(sh("uci -q get " .. q(k))) == tostring(c.equals or "")
    elseif c.type == "service" then
        local s = tostring(c.name or ""); if not s:match("^[%w_%-]+$") then return nil end
        if not readf("/etc/init.d/" .. s) then return false end
        return os.execute("/etc/init.d/" .. s .. " enabled >/dev/null 2>&1") == 0
    elseif c.type == "listen" then return listening(c.port)
    -- list v5 (2026-11-24): signs of an actual attack published by researchers. Older versions skip these types.
    elseif c.type == "path" then   -- exists, without opening it (a named pipe would block on open)
        if not SAFE_PATH(c.path) then return nil end
        return sh("ls -d " .. q(c.path)):match("%S") ~= nil
    elseif c.type == "contains" then   -- a regular file contains one of the strings
        if not SAFE_PATH(c.path) then return nil end
        if not sh("[ -f " .. q(c.path) .. " ] && echo y"):match("y") then return false end
        local s = readf(c.path) or ""
        for _, m in ipairs(type(c.any) == "table" and c.any or { c.match }) do
            m = tostring(m or ""); if #m >= 3 and s:find(m, 1, true) then return true end
        end
        return false
    elseif c.type == "nat_rule" then   -- a rule in the firewall's NAT table
        local ch, m = tostring(c.chain or ""), tostring(c.match or "")
        if not ch:match("^[%w_]+$") or #m < 3 or sh("command -v iptables") == "" then return nil end
        return sh("iptables -t nat -S " .. ch):find(m, 1, true) ~= nil
    elseif c.type == "conn" then   -- a TCP connection (any state, also unanswered attempts) to an address starting with ip_prefix
        local pre = tostring(c.ip_prefix or ""); if not pre:match("^%d+%.[%d%.]+$") then return nil end
        for line in (readf("/proc/net/tcp") or ""):gmatch("[^\n]+") do
            local h = line:match("^%s*%d+:%s+%x+:%x+%s+(%x%x%x%x%x%x%x%x):%x+")
            if h then
                local ip = tonumber(h:sub(7, 8), 16) .. "." .. tonumber(h:sub(5, 6), 16) .. "." .. tonumber(h:sub(3, 4), 16) .. "." .. tonumber(h:sub(1, 2), 16)
                if ip:sub(1, #pre) == pre then return true end
            end
        end
        return false
    end
    return nil
end
local function applies(a, model, fw)
    local ok = false
    for _, m in ipairs(type(a.models) == "table" and a.models or { "*" }) do if m == "*" or tostring(m):lower() == model then ok = true end end
    if not ok then return false end
    if a.fw_min and cmp(fw, a.fw_min) < 0 then return false end
    return true
end
local RANK = { infected = 4, exposed = 3, update = 2, suspicious = 2, unusual = 2, notice = 1.5, ok = 1, na = 0 }
V.RANK = RANK
function V.check_adv(a, model, fw)
    local r = { id = a.id, kind = "gl", title = a.title, severity = a.severity or "unknown", link = a.link or cjson.null, published = a.published or cjson.null,
        summary = a.summary or "", firmware_note = a.firmware_note or cjson.null, found = {}, status = "na" }
    if not applies(a, model, fw) then return r end
    r.status = "ok"
    for _, c in ipairs(type(a.indicators) == "table" and a.indicators or {}) do
        local hit = V.test(c)
        if hit then r.found[#r.found + 1] = c.label or c.type; local st = c.strength == "possible" and "suspicious" or "infected"; if RANK[st] > RANK[r.status] then r.status = st end end
    end
    if RANK[r.status] < RANK.exposed then
        -- until_fixed (2.8.0): the exposure only counts while this firmware is older than GL's fix for this model
        -- (or when no fixed version is known for it yet)
        local fx0 = type(a.fixed_in) == "table" and (a.fixed_in[model] or a.fixed_in["*"]) or nil
        for _, c in ipairs(type(a.exposures) == "table" and a.exposures or {}) do
            local fixed = c.until_fixed and fx0 and cmp(fw, fx0) >= 0
            if not fixed and V.test(c) then r.found[#r.found + 1] = c.label or c.type; r.status = "exposed" end
        end
    end
    -- firmware: fixed in a known version for this model (or "*")
    local fx = type(a.fixed_in) == "table" and (a.fixed_in[model] or a.fixed_in["*"]) or nil
    r.fixed_in = fx or cjson.null
    if fx and cmp(fw, fx) < 0 and RANK[r.status] < RANK.update then r.status = "update" end
    local f = type(a.fixes) == "table" and a.fixes[r.status] or nil
    r.fix = (type(f) == "table" and f.type ~= "upgrade") and { label = f.label or "Fix it" } or cjson.null
    r.upgrade = (r.status == "update") or (type(f) == "table" and f.type == "upgrade") or false
    local adv = type(a.advice) == "table" and (a.advice[r.status] or a.advice.any) or nil
    r.advice = adv or cjson.null
    -- the notice says a factory reset is the remedy for this status (2.7.0): shown in red + in the Discord alert
    r.reset = type(a.reset) == "table" and a.reset[r.status] == true or false
    return r
end

function V.run(mode)
    local model, fw = V.model(), V.firmware()
    local res = { t = os.time(), mode = mode, model = model, fw = fw, items = {}, problems = 0, worst = "ok" }
    local adv_err, nvd, feeds, fws, sw = nil, nil, nil, nil, nil
    if mode == "run" then
        adv_err = V.fetch_adv()
        nvd = V.fetch_nvd(model, fw)
        feeds = V.fetch_feeds()
        local okf, f1 = pcall(V.fetch_fw_security, fw); fws = okf and f1 or nil
        local oks, s1 = pcall(V.sweep); sw = oks and s1 or nil
        res.fetch_ok = (adv_err == nil or adv_err:match("^no list")) and nvd.err == cjson.null and feeds.err == cjson.null
    end
    local adv, src = V.load_adv()
    res.adv = { source = src, version = adv and adv.version or cjson.null, updated = adv and adv.updated or cjson.null,
        n = adv and type(adv.advisories) == "table" and #adv.advisories or 0, err = adv_err or cjson.null }
    for _, a in ipairs(adv and type(adv.advisories) == "table" and adv.advisories or {}) do
        local ok, r = pcall(V.check_adv, a, model, fw)
        if ok and r.status ~= "na" then res.items[#res.items + 1] = r end
    end
    nvd = nvd and nvd.err == cjson.null and nvd or jread(NVD_CACHE) or nvd or {}
    if nvd.model and nvd.model ~= model then nvd = {} end
    res.nvd = { t = nvd.t or cjson.null, n = type(nvd.list) == "table" and #nvd.list or 0, err = nvd.err or cjson.null, fw = nvd.fw or cjson.null }
    for _, c in ipairs(type(nvd.list) == "table" and nvd.list or {}) do
        -- re-match against the CURRENT firmware (the router may have been upgraded since the download)
        local still = c.affected and (nvd.fw == fw or (c.fixed_in ~= cjson.null and c.fixed_in and cmp(fw, c.fixed_in) < 0))
        res.items[#res.items + 1] = { id = c.id, kind = "nvd", title = c.id, severity = c.severity, score = c.score, link = c.link, published = c.published,
            summary = c.summary, fixed_in = c.fixed_in, status = still and "update" or "ok", found = {}, fix = cjson.null, upgrade = still and true or false, advice = cjson.null }
    end
    -- GL security posts from the last 90 days that no list entry covers (matched by the notice's link)
    feeds = feeds and feeds.err == cjson.null and feeds or jread(FEED_CACHE) or feeds or {}
    local covered = {}
    for _, a in ipairs(adv and type(adv.advisories) == "table" and adv.advisories or {}) do
        if a.link then covered[V.linkkey(a.link)] = true end
        for _, l in ipairs(type(a.also_covers) == "table" and a.also_covers or {}) do covered[V.linkkey(l)] = true end
    end
    local since = os.date("!%Y-%m-%d", os.time() - 90 * 86400)
    res.feed = { t = feeds.t or cjson.null, err = feeds.err or cjson.null, n = 0 }
    res.notices = 0
    for _, n in ipairs(type(feeds.list) == "table" and feeds.list or {}) do
        if (n.published or "") >= since and not covered[V.linkkey(n.link)] then
            res.notices = res.notices + 1
            res.items[#res.items + 1] = { id = "notice:" .. V.linkkey(n.link), kind = "notice", title = n.title, severity = "unknown", link = n.link, published = n.published,
                summary = "GL.iNet posted this security notice, and Router Home's vulnerability list doesn't cover it yet, so this router hasn't been checked for it. Read the notice; once the list on GitHub is updated, the router checks itself within a day (or press Check now).",
                status = "notice", found = {}, fix = cjson.null, upgrade = false, advice = cjson.null }
        end
    end
    res.feed.n = type(feeds.list) == "table" and #feeds.list or 0
    -- 1. security firmware from GL's release notes (any model), unless a list entry already says "fixed in" that version
    fws = (fws and not fws.err) and fws or jread(FWSEC) or {}
    res.fwsec = { t = fws.t or cjson.null, new = fws.new or cjson.null, security = fws.security == true, err = fws.err or cjson.null }
    if fws.security == true and type(fws.new) == "string" and cmp(fw, fws.new) < 0 then
        local dup = false; for _, it in ipairs(res.items) do if it.kind == "gl" and it.status == "update" and it.fixed_in == fws.new then dup = true end end
        if not dup then
            res.items[#res.items + 1] = { id = "fw:" .. fws.new, kind = "firmware", title = "GL firmware " .. fws.new .. " fixes security issues", severity = fws.critical and "critical" or "high",
                link = cjson.null, published = type(fws.compiled) == "string" and fws.compiled:sub(1, 10) or cjson.null, summary = fws.notes or "", fixed_in = fws.new, status = "update",
                found = (type(fws.cves) == "table" and #fws.cves > 0) and { "Fixes " .. table.concat(fws.cves, ", ") } or {}, fix = cjson.null, upgrade = true,
                advice = "GL's release notes for " .. fws.new .. " describe security fixes. Install it from the Upgrade page (use the Home tab's firmware checklist first; Router Home survives with Keep settings).",
                firmware_note = cjson.null, reset = false }
        end
    end
    -- 2. tampering sweep (daily): severe signs = "signs of compromise" + factory reset; the rest = "unusual activity"
    sw = sw or jread(SWOUT) or {}
    res.sweep = { t = sw.t or cjson.null, n = type(sw.found) == "table" and #sw.found or 0 }
    if type(sw.found) == "table" and #sw.found > 0 then
        local severe, labels = false, {}
        for _, f in ipairs(sw.found) do labels[#labels + 1] = f.label; if f.severe then severe = true end end
        res.items[#res.items + 1] = { id = "sweep", kind = "sweep", title = severe and "Signs that this router was tampered with" or "Unusual activity on this router",
            severity = severe and "critical" or "medium", link = cjson.null, published = os.date("%Y-%m-%d", sw.t or os.time()), found = labels,
            summary = "Router Home's daily check found things that aren't normal on this router. It doesn't need a published notice to spot these.",
            status = severe and "infected" or "unusual", fix = cjson.null, upgrade = false, accept = not severe, reset = severe,
            advice = severe and "Treat the router as compromised: back up nothing from it, factory-reset it, set it up again with a new admin password, install the latest firmware, then reinstall Router Home."
                or "If you made these changes yourself (added an SSH key, installed a program, opened a port), press \"These are expected\". Otherwise look into them, or ask for help.",
            firmware_note = cjson.null }
    end
    for _, it in ipairs(res.items) do
        if RANK[it.status] >= RANK.update then res.problems = res.problems + 1 end
        if RANK[it.status] > RANK[res.worst] then res.worst = it.status end
    end
    table.sort(res.items, function(a, b) if RANK[a.status] ~= RANK[b.status] then return RANK[a.status] > RANK[b.status] end; return tostring(a.published) > tostring(b.published) end)
    local prev = jread(OUT)
    if mode == "local" and prev then res.fetched = prev.fetched; res.adv.err = prev.adv and prev.adv.err or cjson.null end
    if mode == "run" then res.fetched = res.t end
    writef(OUT, cjson.encode(res))
    return res
end

-- ---------------------------------------------------------------- fixes (only these kinds, only from the signed list)
-- kill_remove  {process, path}  stop the matching processes, keep a copy of the file as evidence, delete it
-- uci_set      {key, value, restart?}  change one setting (undo script restores it)
-- service_off  {name}  stop + disable a service (undo script turns it back on)
-- chmod        {path, mode}  tighten a file's permissions (undo script restores them)
-- upgrade      nothing runs: the page shows the Upgrade button
function V.fix(id)
    local model, fw = V.model(), V.firmware()
    local adv = V.load_adv(); local a
    for _, x in ipairs(adv and type(adv.advisories) == "table" and adv.advisories or {}) do if x.id == id then a = x end end
    if not a then return { ok = false, err = "unknown advisory" } end
    local r = V.check_adv(a, model, fw)
    local f = type(a.fixes) == "table" and a.fixes[r.status] or nil
    if type(f) ~= "table" or f.type == "upgrade" then return { ok = false, err = "there's nothing to fix automatically for this one (status: " .. r.status .. ")" } end
    local ts = os.date("%Y%m%d-%H%M%S"); os.execute("mkdir -p " .. B)
    local tag = tostring(id):gsub("[^%w%-]", "")
    local undo, done = nil, nil
    if f.type == "kill_remove" then
        local m = tostring(f.process or ""); local p = f.path
        if #m < 3 and not p then return { ok = false, err = "bad fix entry" } end
        local ev = B .. "/vuln-" .. tag .. "-" .. ts; os.execute("mkdir -p " .. ev)
        os.execute("ps w > " .. ev .. "/processes-before.txt")
        local n = 0
        if #m >= 3 then
            procs_cache = nil
            for _, pr in ipairs(processes()) do if pr.cmd:find(m, 1, true) and pr.pid > 1 then os.execute("kill -9 " .. pr.pid .. " 2>/dev/null"); n = n + 1 end end
        end
        if p and SAFE_PATH(p) and (p:match("^/tmp/") or p:match("^/var/") or p:match("^/root/")) then
            os.execute("cp -a " .. q(p) .. " " .. ev .. "/ 2>/dev/null; rm -rf " .. q(p))
        end
        done = "stopped " .. n .. " process" .. (n == 1 and "" or "es") .. "; evidence kept in " .. ev
    elseif f.type == "uci_set" then
        local k, v, rs = tostring(f.key or ""), tostring(f.value or ""), f.restart
        if not k:match("^[%w_%-]+%.[%w_@%[%]%-]+%.[%w_]+$") or not v:match("^[%w%._%-]*$") or (rs and not tostring(rs):match("^[%w_%-]+$")) then return { ok = false, err = "bad fix entry" } end
        local old = trim(sh("uci -q get " .. q(k)))
        undo = (old == "" and ("uci -q delete " .. q(k)) or ("uci set " .. q(k .. "=" .. old))) .. "; uci commit " .. k:match("^([%w_%-]+)") .. (rs and ("; /etc/init.d/" .. rs .. " restart") or "")
        os.execute("uci set " .. q(k .. "=" .. v) .. "; uci commit " .. k:match("^([%w_%-]+)") .. (rs and ("; /etc/init.d/" .. rs .. " restart >/dev/null 2>&1") or ""))
        done = k .. " = " .. v
    elseif f.type == "service_off" then
        local s = tostring(f.name or ""); if not s:match("^[%w_%-]+$") or not readf("/etc/init.d/" .. s) then return { ok = false, err = "bad fix entry" } end
        local was = os.execute("/etc/init.d/" .. s .. " enabled >/dev/null 2>&1") == 0
        undo = was and ("/etc/init.d/" .. s .. " enable; /etc/init.d/" .. s .. " start") or nil
        os.execute("/etc/init.d/" .. s .. " stop >/dev/null 2>&1; /etc/init.d/" .. s .. " disable >/dev/null 2>&1")
        done = s .. " stopped and turned off"
    elseif f.type == "chmod" then
        local p, md = f.path, tostring(f.mode or "")
        if not SAFE_PATH(p) or not md:match("^[0-7][0-7][0-7][0-7]?$") then return { ok = false, err = "bad fix entry" } end
        local old = trim(sh("stat -c %a " .. q(p))); if old == "" then return { ok = false, err = "file not found" } end
        undo = "chmod " .. old .. " " .. q(p)
        os.execute("chmod " .. md .. " " .. q(p)); done = p .. " is now " .. md
    else return { ok = false, err = "unknown fix type" } end
    local uf = nil
    if undo then
        uf = B .. "/undo-vuln-" .. tag .. ".sh"
        writef(uf, "# undo: Security card fix for " .. tostring(id) .. " (" .. os.date("%Y-%m-%d %H:%M") .. ")\n" .. undo .. "\nlogger -t machome 'undo-vuln: " .. tag .. " undone'\n")
        os.execute("chmod 700 " .. uf)
    end
    log("fix for " .. tostring(id) .. " applied from the Home tab: " .. tostring(done))
    procs_cache = nil
    local after = V.run("local")
    local now; for _, it in ipairs(after.items) do if it.id == id then now = it.status end end
    return { ok = true, done = done, undo = uf or cjson.null, status = now or "ok" }
end

-- ---------------------------------------------------------------- background job
function V.running()
    local pid = tonumber(trim(readf(PID) or ""))
    return pid ~= nil and (readf("/proc/" .. pid .. "/cmdline") or ""):find("vulncheck", 1, true) ~= nil
end
function V.start(mode)
    if V.running() then return false end
    os.execute("start-stop-daemon -S -b -m -p " .. PID .. " -x /usr/bin/lua -- /usr/lib/machome/vulncheck.lua " .. (mode == "run" and "run" or "local") .. " >/dev/null 2>&1")
    return true
end

if arg and arg[0] and arg[0]:match("vulncheck%.lua$") and (arg[1] == "run" or arg[1] == "local") then
    local ok, e = pcall(V.run, arg[1])
    if not ok then log("check failed: " .. tostring(e):sub(1, 200)) end
    os.remove(PID)
end
return V
