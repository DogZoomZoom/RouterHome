-- Router Home update job (owner, 2026-11-22). Started by updater.lua via start-stop-daemon:
--   lua upd_job.lua install   download the release package + signature, verify with usign, back up, install, check, roll back on failure
--   lua upd_job.lua rollback  restore the version saved before the last update
-- Status: /tmp/machome/upd_job.json (the page polls it; nginx restarts during an install, so the page waits).
local cjson = require "cjson"
local DIR, W, B = "/tmp/machome", "/tmp/rh-upd", "/root/machome-backup"
local JOB, CHECK, LOG = DIR .. "/upd_job.json", DIR .. "/upd_check.json", DIR .. "/upd.log"
local PUB = "/usr/share/machome/release.pub"
local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p, "w"); if f then f:write(s); f:close() end end
local function sh(c) local p = io.popen(c .. " 2>&1"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function run(c) return os.execute(c .. " >>" .. LOG .. " 2>&1") == 0 end
local function log(s) local f = io.open(LOG, "a"); if f then f:write(os.date("%H:%M:%S "), s, "\n"); f:close() end end
local ok0, st = pcall(cjson.decode, readf(JOB) or "{}"); if not ok0 or type(st) ~= "table" then st = {} end
st.running = true
local function save() writef(JOB .. ".tmp", cjson.encode(st)); os.rename(JOB .. ".tmp", JOB) end
local function step(p, s) st.pct = p; st.step = s; save(); log(s) end
local function done(err, msg)
    st.running = false; st.pct = 100; st.finished = os.time(); st.err = err; st.step = err and "Failed" or (msg or "Done")
    st.log = (sh("tail -n 12 " .. LOG)):sub(-1500); save()
    os.execute("logger -t machome 'update: " .. (err and ("failed: " .. err:gsub("'", "")) or (msg or "done")) .. "'")
    os.execute("rm -rf " .. W)
end
-- every file Router Home owns (settings in /etc/machome are never touched)
local FILES = "usr/share/oui/menu.d/machome.json www/views/gl-sdk4-ui-machome.common.js.gz usr/lib/oui-httpd/rpc/machome usr/bin/machome-sampler usr/lib/machome etc/init.d/machome usr/bin/machome-speedtest etc/init.d/machome-st usr/share/gl-download.d/machome usr/share/gl-validator.d/machome.lua usr/share/machome/release.pub usr/sbin/machome-vpn-rps"
local function existing() local t = {}; for f in FILES:gmatch("%S+") do if readf("/" .. f) or sh("[ -d /" .. f .. " ] && echo d"):match("d") then t[#t + 1] = f end end; return table.concat(t, " ") end
local function healthy()
    os.execute("sleep 15")
    local samp = sh("ps w | grep -c '[m]achome-sampler'"):match("%d+")
    -- a time limit: without -m this waited forever on a dead admin page and the rollback never started (2026-11-22)
    local web = nil
    for _ = 1, 4 do web = sh("curl -sk -m 8 -o /dev/null -w '%{http_code}' https://127.0.0.1/"):match("%d%d%d"); if web == "200" then break end; os.execute("sleep 5") end
    return samp and tonumber(samp) > 0 and web == "200", "sampler " .. tostring(samp) .. ", admin page HTTP " .. tostring(web)
end
-- This job is started from an nginx request, so it holds nginx's ports: never RESTART nginx from here (the new
-- nginx couldn't bind 80/443 and the admin page went down for minutes on 2026-11-22). Reload keeps the ports.
local function nginx_reload() if not run("nginx -s reload") then run("/etc/init.d/nginx reload") end end
local function restore(tgz)
    run("cd / && tar xzf " .. tgz)
    nginx_reload(); run("/etc/init.d/machome restart")
end

writef(LOG, "")
local mode = arg[1]
if mode == "rollback" then
    local f = sh("ls -t " .. B .. "/pre-update-*.tgz 2>/dev/null | head -1"):match("%S+")
    if not f then done("there's no earlier version saved") return end
    step(30, "Restoring the previous version…"); restore(f)
    local okh, why = healthy()
    if okh then os.remove(f); done(nil, "Previous version restored") else done("restored, but the check after it failed (" .. why .. ")") end
    return
end

-- ---------------------------------------------------------------- install
local okc, c = pcall(cjson.decode, readf(CHECK) or "null")
if not okc or type(c) ~= "table" or type(c.pkg) ~= "table" or type(c.sig) ~= "table" then done("no update package found; check for updates again") return end
os.execute("rm -rf " .. W .. "; mkdir -p " .. W)
step(10, "Downloading " .. tostring(c.pkg.name) .. "…")
if not run("curl -fsSL -m 300 -A RouterHome-updater -o " .. W .. "/pkg.tgz '" .. tostring(c.pkg.url):gsub("'", "") .. "'") then done("the download failed") return end
if not run("curl -fsSL -m 60 -A RouterHome-updater -o " .. W .. "/pkg.tgz.sig '" .. tostring(c.sig.url):gsub("'", "") .. "'") then done("the signature download failed") return end
step(30, "Checking the signature…")
if not run("usign -V -q -m " .. W .. "/pkg.tgz -p " .. PUB .. " -x " .. W .. "/pkg.tgz.sig") then done("the signature doesn't match the Router Home release key: NOT installed") return end
step(40, "Unpacking…")
if not run("mkdir -p " .. W .. "/x && tar xzf " .. W .. "/pkg.tgz -C " .. W .. "/x") then done("the package couldn't be unpacked") return end
local M = (readf("/tmp/sysinfo/board_name") or ""):match("gl%-mt5000") and "mt5000" or "generic"
if not readf(W .. "/x/install-on-router.sh") or sh("[ -d " .. W .. "/x/rootfs-" .. M .. " ] && echo y"):match("y") == nil then done("the package is incomplete (no " .. M .. " build)") return end
-- full backup of the current version (keep the 2 newest)
step(50, "Saving the current version…")
local cur = (st.from or "old"):gsub("[^%w%.%-]", "")
local BK = B .. "/pre-update-" .. cur .. ".tgz"
os.execute("mkdir -p " .. B)
if not run("cd / && tar czf " .. BK .. " " .. existing()) then done("couldn't save the current version first: nothing installed") return end
os.execute("ls -t " .. B .. "/pre-update-*.tgz 2>/dev/null | tail -n +3 | xargs rm -f 2>/dev/null")
step(60, "Installing " .. tostring(c.latest) .. " (the page reconnects in about a minute)…")
os.execute("tar czf /tmp/machome-rootfs.tgz -C " .. W .. "/x/rootfs-" .. M .. " .")
local okInst = run("tr -d '\\r' < " .. W .. "/x/install-on-router.sh | sh")
run("/etc/init.d/machome restart")
step(85, "Checking that everything works…")
local okh, why = healthy()
local newv = sh("zcat /www/views/gl-sdk4-ui-machome.common.js.gz | grep -o \"MH_VERSION = '[^']*'\" | head -1"):match("'([^']+)'")
if okInst and okh and newv == c.latest then done(nil, "Updated to " .. tostring(c.latest)) return end
step(90, "Something went wrong; putting the previous version back…")
restore(BK)
done("the update didn't work (" .. (okInst and why or "the installer stopped with an error") .. "); the previous version was restored")
