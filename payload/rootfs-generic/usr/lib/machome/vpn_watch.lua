-- VPN monitor (VPN Health card button, owner 2026-11-15). READ-ONLY: pings, DNS lookups and one tiny web page per
-- tunnel; changes no settings. Started by rpc machome.vpnwatch_start:
--   start-stop-daemon -S -b -m -p /tmp/machome/vpnwatch.launch.pid -x /usr/bin/lua -- /usr/lib/machome/vpn_watch.lua <minutes>
-- Every ~3 s, for EVERY WireGuard / OpenVPN client tunnel that is up, in parallel:
--   ping 9.9.9.9 (Quad9), 1.1.1.1 (Cloudflare), 8.8.8.8 (Google) through the tunnel -> stall = all three fail, 2+ checks in a row
--   control: ping 9.9.9.9 over the regular internet (was the internet itself fine?)
-- Every ~30 s, and on every check while a tunnel is stalled:
--   DNS through the tunnel: example.com at Quad9, asked from the tunnel's own address (dig -b)
--   Web through the tunnel: HTTPS https://www.google.com/generate_204 (expects 204)
-- Status for the page: /tmp/machome/vpnwatch.json. Stop early: touch /tmp/machome/vpnwatch.stop (the summary is still sent).
-- At the end: ONE Discord message (webhook from the Home tab settings, never printed), and /tmp/machome/vpnwatch-summary.txt.
local cjson = require "cjson"
local MIN = tonumber(arg and arg[1]) or 300
local DIR, W = "/tmp/machome", "/tmp/vw"
local STATUS, STOP, LOG = DIR .. "/vpnwatch.json", DIR .. "/vpnwatch.stop", DIR .. "/vpnwatch.log"

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p, "w"); if f then f:write(s); f:close() end end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); local s = p and p:read("*a") or ""; if p then p:close() end; return s end
local function trim(s) return ((s or ""):gsub("^%s+", ""):gsub("%s+$", "")) end
local function exists(p) local f = io.open(p, "r"); if f then f:close(); return true end; return false end
local function hm(t) return (os.date("%I:%M %p", t):gsub("^0", "")) end
local function dur(s) s = math.floor(s + 0.5); if s < 90 then return s .. " s" end; local h = math.floor(s / 3600)
  if h > 0 then return string.format("%d h %d min", h, math.floor(s % 3600 / 60)) end; return string.format("%d min %d s", math.floor(s / 60), s % 60) end
local function log(s) local f = io.open(LOG, "a"); if f then f:write(os.time(), " ", s, "\n"); f:close() end end
local function rpc(obj, m)
  local o = sh("curl -s -m 10 -H 'glinet: 1' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"call\",\"params\":[\"\",\"" .. obj .. "\",\"" .. m .. "\",{}]}' http://127.0.0.1/rpc")
  local ok, j = pcall(cjson.decode, o); return ok and type(j) == "table" and type(j.result) == "table" and j.result or {}
end

os.execute("mkdir -p " .. W .. " " .. DIR); os.remove(STOP); writef(LOG, "")
local tuns = {}
-- WireGuard (wgclientN) and OpenVPN (ovpnclientN, since 2026-11-17) client tunnels that are up
for i in sh("ls /sys/class/net"):gmatch("%S+") do if i:match("^wgclient%d+$") or i:match("^ovpnclient%d+$") then tuns[#tuns + 1] = i end end
table.sort(tuns)
local start = os.time(); local END = start + MIN * 60
if #tuns == 0 then
  writef(STATUS, cjson.encode({ running = false, start = start, finished = start, err = "no VPN tunnel is up" })); return
end

-- tunnel names / servers / providers (names only)
local function labels()
  local st, pv = rpc("vpn-client", "get_status"), rpc("machome", "get_vpn_providers")
  local L = {}
  for _, v in ipairs(st.status_list or {}) do
    if v.via then L[v.via] = { name = v.name or v.via, server = v.peer_name or "?", provider = (pv.groups or {})[tostring(v.group_id or "")] } end
  end
  return L
end
local LAB0 = labels()
-- list tunnels in their GL order (Tunnel 1, 2, 3), not by interface number (they don't match)
table.sort(tuns, function(a, b) return tostring((LAB0[a] or {}).name or a) < tostring((LAB0[b] or {}).name or b) end)

local S = {}
for _, t in ipairs(tuns) do
  S[t] = { checks = 0, off = 0, lossy = 0, rtt = 0, rttn = 0, stalls = {}, down = false,
           dok = 0, dfail = 0, dout = 0, wok = 0, wfail = 0, wout = 0 }
end
local function status(running)
  local per = {}
  for _, t in ipairs(tuns) do per[t] = { name = (LAB0[t] or {}).name or t, stalls = #S[t].stalls + (S[t].down and S[t].cur and S[t].cur.n >= 2 and 1 or 0) } end
  writef(STATUS .. ".tmp", cjson.encode({ running = running, start = start, ["end"] = END, tunnels = tuns, per = per, finished = (not running) and os.time() or nil }))
  os.rename(STATUS .. ".tmp", STATUS)
end
status(true)
log("start " .. table.concat(tuns, " ") .. " minutes " .. MIN)

local function ms(f) local v = trim(readf(f) or ""); return tonumber(v) end
local loop, wanbad_total, last_status = 0, 0, 0
local PING = "ping -c 1 -W 1 -I %s %s 2>/dev/null | sed -n 's/.*time=\\([0-9.]*\\).*/\\1/p' > %s &"
-- 2026-11-20 (owner-approved): read the sampler's CONTINUOUS pingers (one per tunnel and server, files
-- /tmp/machome/cp_<tunnel>_<server> = "<replies> <sum ms> <last ms>") instead of starting 3 new pings every 3 s.
-- Proven side by side: Nord blocks NEW ping sessions for ~30 s when one client opens many, while a continuous ping
-- (and the owner's PC) lost nothing. A server "answered" in a loop if its reply count went up.
local CPT = { "1.1.1.1", "9.9.9.9" }
local cprev = {}
local function cpread(t, ip)
  local n, _, last = (readf(DIR .. "/cp_" .. t .. "_" .. ip) or ""):match("^(%d+) ([%d%.]+) ([%d%.]+)")
  return tonumber(n), tonumber(last)
end
while os.time() < END and not exists(STOP) do
  loop = loop + 1
  local deepall = (loop % 10 == 1)
  local parts, up, deep, src, usecp = {}, {}, {}, {}, {}
  for _, t in ipairs(tuns) do
    up[t] = exists("/sys/class/net/" .. t .. "/operstate")
    if up[t] then
      usecp[t] = cpread(t, CPT[1]) ~= nil and cpread(t, CPT[2]) ~= nil
      if not usecp[t] then   -- sampler not running: old way
        for k, ip in pairs({ a = "9.9.9.9", b = "1.1.1.1", c = "8.8.8.8" }) do parts[#parts + 1] = string.format(PING, t, ip, W .. "/" .. t .. "." .. k) end
      end
      deep[t] = deepall or S[t].down
      if deep[t] then
        src[t] = trim(sh("ip -4 -o addr show dev " .. t .. " | awk '{print $4}' | cut -d/ -f1"))
        parts[#parts + 1] = "(dig -b '" .. src[t] .. "' @9.9.9.9 +time=2 +tries=1 +short example.com A | grep -qE '^[0-9]+\\.' && echo 1 || echo 0) > " .. W .. "/" .. t .. ".d 2>/dev/null &"
        parts[#parts + 1] = "([ \"$(curl --interface " .. t .. " -s -m 4 -o /dev/null -w '%{http_code}' https://www.google.com/generate_204)\" = 204 ] && echo 1 || echo 0) > " .. W .. "/" .. t .. ".h 2>/dev/null &"
      end
    end
  end
  parts[#parts + 1] = "(ping -c 1 -W 1 9.9.9.9 >/dev/null 2>&1 && echo 1 || echo 0) > " .. W .. "/wan &"
  os.execute(table.concat(parts, " ") .. " wait")
  local now = os.time()
  local wanok = trim(readf(W .. "/wan") or "") == "1"
  if not wanok then wanbad_total = wanbad_total + 1 end
  for _, t in ipairs(tuns) do
    local s = S[t]
    if not up[t] then s.off = s.off + 1
    else
      s.checks = s.checks + 1
      local got, total = 0, 3
      if usecp[t] then
        total = #CPT; local first = false
        for _, ip in ipairs(CPT) do
          local k = t .. "|" .. ip
          local n, last = cpread(t, ip)
          if cprev[k] == nil or n < cprev[k] then first = true   -- first look, or the pinger restarted
          elseif n > cprev[k] then got = got + 1; if last then s.rtt = s.rtt + last; s.rttn = s.rttn + 1 end end
          cprev[k] = n
        end
        if first then got = total end   -- no verdict on the first look
      else
        local a, b, c = ms(W .. "/" .. t .. ".a"), ms(W .. "/" .. t .. ".b"), ms(W .. "/" .. t .. ".c")
        for _, v in ipairs({ a, b, c }) do if v then got = got + 1; s.rtt = s.rtt + v; s.rttn = s.rttn + 1 end end
      end
      local stalled = got == 0
      if got > 0 and got < total then s.lossy = s.lossy + 1 end
      local dd, hh
      if deep[t] then
        dd = trim(readf(W .. "/" .. t .. ".d") or "") == "1"; hh = trim(readf(W .. "/" .. t .. ".h") or "") == "1"
        if dd then s.dok = s.dok + 1 else s.dfail = s.dfail + 1; if not stalled then s.dout = s.dout + 1 end end
        if hh then s.wok = s.wok + 1 else s.wfail = s.wfail + 1; if not stalled then s.wout = s.wout + 1 end end
      end
      if stalled then
        if not s.down then s.down = true; s.cur = { t = now, n = 0, inet = false, sd = 0, sdf = 0, sw = 0, swf = 0 } end
        local cu = s.cur; cu.n = cu.n + 1; if not wanok then cu.inet = true end
        if deep[t] then cu.sd = cu.sd + 1; if not dd then cu.sdf = cu.sdf + 1 end; cu.sw = cu.sw + 1; if not hh then cu.swf = cu.swf + 1 end end
      elseif s.down then
        s.down = false
        if s.cur.n >= 2 then s.cur.d = now - s.cur.t; s.stalls[#s.stalls + 1] = s.cur; log("stall " .. t .. " " .. s.cur.t .. " " .. s.cur.d) end
        s.cur = nil
      end
    end
  end
  if now - last_status >= 30 then last_status = now; status(true) end
  os.execute("sleep 2")
end
local stopped_early = exists(STOP); os.remove(STOP)
local fin = os.time()
for _, t in ipairs(tuns) do local s = S[t]; if s.down and s.cur and s.cur.n >= 2 then s.cur.d = fin - s.cur.t; s.cur.open = true; s.stalls[#s.stalls + 1] = s.cur end end

-- the Home tab's own VPN check in the same window (vh_drops.json: real drops vs ping-only blips)
local okd, dv = pcall(cjson.decode, readf(DIR .. "/vh_drops.json") or "{}"); if not okd or type(dv) ~= "table" then dv = {} end

-- summary
local LAB = labels()
local lines, worst, best, troubled = {}, nil, nil, nil
for _, t in ipairs(tuns) do
  local s, l0, l1 = S[t], LAB0[t] or {}, LAB[t] or {}
  local name = l1.name or l0.name or t
  local who = (l1.provider and (l1.provider .. " · ") or "") .. tostring(l1.server or l0.server or "?")
  if l0.server and l1.server and l0.server ~= l1.server then who = who .. " (was " .. l0.server .. " at the start)" end
  -- 2026-11-20: a stall is REAL only if web pages through the tunnel failed during it; otherwise it was a
  -- ping-only blip (traffic kept flowing) and is listed separately, not counted as trouble
  local blips = {}; do local rs = {}
    for _, x in ipairs(s.stalls) do if (x.sw or 0) > 0 and (x.swf or 0) == 0 then blips[#blips + 1] = x else rs[#rs + 1] = x end end
    s.stalls = rs end
  local tot, longest = 0, 0; for _, x in ipairs(s.stalls) do tot = tot + x.d; if x.d > longest then longest = x.d end end
  local po, real = 0, 0
  for _, e in ipairs(type(dv[t]) == "table" and dv[t] or {}) do if type(e) == "table" and (tonumber(e.t) or 0) >= start then if e.po then po = po + 1 else real = real + 1 end end end
  local head = #s.stalls == 0 and "✅ no stalls" or ((#s.stalls <= 2 and "🟡 " or "🔴 ") .. #s.stalls .. " stall" .. (#s.stalls == 1 and "" or "s") ..
    " · longest " .. dur(longest) .. " · total " .. dur(tot))
  local body = {}
  if s.checks > 0 then
    body[#body + 1] = string.format("ping %s avg · partial loss in %d of %d checks", s.rttn > 0 and string.format("%.0f ms", s.rtt / s.rttn) or "—", s.lossy, s.checks)
  end
  body[#body + 1] = string.format("DNS %d/%d ok · web %d/%d ok", s.dok, s.dok + s.dfail, s.wok, s.wok + s.wfail)
  if s.dout + s.wout > 0 then body[#body + 1] = string.format("⚠ failed while pings were fine: DNS %d, web %d", s.dout, s.wout) end
  if #s.stalls > 0 then
    local sdx, swx, inet = 0, 0, 0
    for _, x in ipairs(s.stalls) do if x.sdf > 0 then sdx = sdx + 1 end; if x.swf > 0 then swx = swx + 1 end; if x.inet then inet = inet + 1 end end
    local tl = {}; for i, x in ipairs(s.stalls) do if i <= 8 then tl[#tl + 1] = hm(x.t) .. " (" .. dur(x.d) .. ")" end end
    body[#body + 1] = "times: " .. table.concat(tl, ", ") .. (#s.stalls > 8 and (" +" .. (#s.stalls - 8) .. " more") or "")
    body[#body + 1] = string.format("during stalls: web failed in %d of %d, DNS failed in %d of %d, your internet had trouble in %d",
      swx, #s.stalls, sdx, #s.stalls, inet)
  end
  if #blips > 0 then body[#body + 1] = string.format("ping-only blips (pings paused, web pages kept loading; not counted): %d", #blips) end
  body[#body + 1] = string.format("Home tab: %d real drop%s (devices moved) · %d ping-only blip%s ignored", real, real == 1 and "" or "s", po, po == 1 and "" or "s")
  if s.off > 0 then body[#body + 1] = string.format("tunnel was off/down for %d checks", s.off) end
  lines[#lines + 1] = "**" .. name .. "** (" .. who .. "): " .. head .. "\n" .. table.concat(body, "\n")
  local score = #s.stalls * 1000 + real * 100 + s.lossy
  if #s.stalls > 0 or real > 0 then troubled = (troubled or 0) + 1 end
  if not worst or score > worst.score then worst = { t = name, score = score } end
  if not best or score < best.score then best = { t = name, score = score } end
end
local hours = (fin - start) / 3600
local verdict
if not troubled then verdict = "✅ No stalls or drops on any tunnel." .. ((worst and worst.score > 0) and " (Single lost pings only, listed below.)" or "")
elseif best and worst and best.t ~= worst.t then verdict = "Steadiest: **" .. best.t .. "** · most trouble: **" .. worst.t .. "**."
else verdict = "All tunnels had some trouble." end
local text = string.format("**Watched:** %s – %s (%.1f h)%s · %d tunnel%s\n%s\n\n%s", hm(start), hm(fin), hours,
  stopped_early and " · stopped early from the Home tab" or "", #tuns, #tuns == 1 and "" or "s", verdict, table.concat(lines, "\n\n"))
if wanbad_total > 0 then text = text .. string.format("\n\nYour regular internet missed %d control pings in this time.", wanbad_total) end
text = text .. "\n_Checks every ~3 s per tunnel: the router's continuous pings to Cloudflare and Quad9 (stall = neither answers 2+ checks in a row; it counts only if web pages also failed during it); a domain lookup and a web page through each tunnel every ~30 s and on every check during a stall. Read-only._"
if #text > 3900 then text = text:sub(1, 3890) .. "…" end
writef(DIR .. "/vpnwatch-summary.txt", text .. "\n")

local c = {}; local okc, v = pcall(cjson.decode, readf("/etc/machome/alerts.json") or "{}"); if okc and type(v) == "table" then c = v end
local sent = false
local okN, NT = pcall(dofile, "/usr/lib/machome/notify.lua"); if not okN or type(NT) ~= "table" then NT = nil end
if os.getenv("VW_DRY") == "1" then   -- test run: summary saved, nothing sent
  os.execute("logger -t machome 'VPN monitor: test run finished (nothing sent)'")
elseif NT and c.enabled == true and NT.any(c) then   -- 2.7.1: every notification provider that's set up
  local host = trim(readf("/proc/sys/kernel/hostname") or "Router")
  local color = (not troubled) and 3446617 or (worst and worst.score < 3000 and 16752394 or 16726832)
  local ok = NT.send(c, { title = "📋 VPN monitor finished", description = text, color = color,
    footer = { text = host .. " · Home tab" }, timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ") })
  sent = ok ~= nil
  os.execute("logger -t machome 'VPN monitor: finished, summary sent" .. (ok == false and " (some providers failed)" or "") .. "'")
else
  os.execute("logger -t machome 'VPN monitor: finished (alerts are off; summary saved on the router)'")
end
local per = {}; for _, t in ipairs(tuns) do per[t] = { name = (LAB[t] or LAB0[t] or {}).name or t, stalls = #S[t].stalls } end
writef(STATUS, cjson.encode({ running = false, start = start, ["end"] = END, finished = fin, tunnels = tuns, per = per, sent = sent, early = stopped_early }))
os.execute("rm -rf " .. W)
