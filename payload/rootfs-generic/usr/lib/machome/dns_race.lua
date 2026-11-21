-- DNS Race (DNS hub, owner 2026-11-16). READ-ONLY: one lookup of <domain> at every resolver this network uses,
-- all at the same time, then /tmp/machome/dnsrace.json. Started in the background by rpc machome.dns_race.
--   lua /usr/lib/machome/dns_race.lua <domain>
local cjson = require "cjson"
local domain = arg and arg[1] or "example.com"
if not domain:match("^[%w][%w%-%.]*%.[%a][%w%-]*$") or #domain > 100 then return end
local DIR, W = "/tmp/machome", "/tmp/dnsrace"
local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p, "w"); if f then f:write(s); f:close() end end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); local s = p and p:read("*a") or ""; if p then p:close() end; return s end
local function trim(s) return ((s or ""):gsub("^%s+", ""):gsub("%s+$", "")) end
local NAMES = { ["9.9.9.9"] = "Quad9", ["149.112.112.112"] = "Quad9", ["1.1.1.1"] = "Cloudflare", ["1.0.0.1"] = "Cloudflare",
  ["8.8.8.8"] = "Google", ["8.8.4.4"] = "Google", ["208.67.222.222"] = "OpenDNS", ["94.140.14.14"] = "AdGuard DNS",
  ["103.86.96.100"] = "NordVPN DNS", ["103.86.99.100"] = "NordVPN DNS" }
local function exists(p) local f = io.open(p, "r"); if f then f:close(); return true end; return false end

local T = {}
local function add(label, server, path, src, kind) T[#T + 1] = { label = label, server = server, path = path, src = src, kind = kind } end
-- what your devices use (DHCP option 6), else the router
local nas = ""
do local ok, c = pcall(cjson.decode, readf("/etc/machome/nas-adguard.json") or "{}"); if ok and type(c) == "table" and type(c.url) == "string" then nas = c.url:match("^https?://([^/:%]]+)") or "" end end
local lan = {}
for o in sh("uci -q get dhcp.lan.dhcp_option"):gmatch("%S+") do local v = o:match("^6,(.+)$") or o:match("^option:dns%-server,(.+)$"); if v then for ip in v:gmatch("[^,]+") do lan[#lan + 1] = ip end end end
for _, ip in ipairs(lan) do add(ip == nas and "AdGuard on your NAS" or "LAN DNS", ip, "your devices", nil, "lan") end
if trim(sh("uci -q get glconfig.general.mode")) ~= "ap" then add("This router (dnsmasq)", "127.0.0.1", "the router", nil, "router") end   -- an AP's own DNS is off
for _, ip in ipairs({ "9.9.9.9", "1.1.1.1", "8.8.8.8" }) do add(NAMES[ip], ip, "direct, no VPN", nil, "public") end
-- through each VPN tunnel that is up: its provider's DNS (or Quad9 if none is set)
local st = sh("curl -s -m 8 -H 'glinet: 1' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"call\",\"params\":[\"\",\"vpn-client\",\"get_status\",{}]}' http://127.0.0.1/rpc")
local tn = sh("curl -s -m 8 -H 'glinet: 1' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"call\",\"params\":[\"\",\"vpn-client\",\"get_tunnel\",{}]}' http://127.0.0.1/rpc")
local okS, S = pcall(cjson.decode, st); local okT, TN = pcall(cjson.decode, tn)
local act = {}
for _, t in ipairs(okT and type(TN) == "table" and type(TN.result) == "table" and TN.result.tunnels or {}) do
  local v = type(t.via) == "table" and t.via or {}; local cf = type(v.configs) == "table" and v.configs[1] or {}
  if v.via and type(cf.id_list) == "table" then act[v.via] = cf.id_list[1] end
end
local tl = {}
for _, v in ipairs(okS and type(S) == "table" and type(S.result) == "table" and S.result.status_list or {}) do
  if v.via and (v.via:match("^wgclient%d+$") or v.via:match("^ovpnclient%d+$")) and v.enabled and exists("/sys/class/net/" .. v.via .. "/operstate") then tl[#tl + 1] = v end
end
table.sort(tl, function(a, b) return tostring(a.name) < tostring(b.name) end)
for _, v in ipairs(tl) do
  local src = trim(sh("ip -4 -o addr show dev " .. v.via .. " | awk '{print $4}' | cut -d/ -f1"))
  local dns
  if v.via:match("^ovpn") then   -- OpenVPN: the DNS its server pushed on connect
    dns = (readf("/tmp/resolv.conf.d/resolv.conf." .. v.via) or ""):match("nameserver%s+(%d+%.%d+%.%d+%.%d+)") or ""
  else
    dns = act[v.via] and trim((sh("uci -q get wireguard.peer_" .. (tostring(act[v.via]):gsub("%D", "")) .. ".dns"):gsub(",", " "))) or ""
  end
  local server = dns:match("^(%d+%.%d+%.%d+%.%d+)") or "9.9.9.9"
  if src ~= "" then add((NAMES[server] or "VPN DNS") .. (dns == "" and " (no VPN DNS set)" or ""), server, "through " .. tostring(v.name or v.via), src, "vpn") end
end

-- race: everything at once
os.execute("rm -rf " .. W .. "; mkdir -p " .. W)
local parts = {}
for i, t in ipairs(T) do
  parts[#parts + 1] = string.format("(dig %s@%s +time=2 +tries=1 %s A > %s/%d.out 2>&1) &", t.src and ("-b " .. t.src .. " ") or "", t.server, domain, W, i)
end
os.execute(table.concat(parts, " ") .. " wait")
local res = {}
for i, t in ipairs(T) do
  local o = readf(W .. "/" .. i .. ".out") or ""
  local status = o:match("status: (%u+)")
  local ms = tonumber(o:match("Query time: (%d+) msec"))
  local ans = o:match("\n[^;\n]-%s+IN%s+A%s+(%d+%.%d+%.%d+%.%d+)")
  local cname = (not ans) and o:match("\n[^;\n]-%s+IN%s+CNAME%s+(%S+)") or nil
  res[#res + 1] = { label = t.label, server = t.server, path = t.path, kind = t.kind, ok = status == "NOERROR" and ans ~= nil,
    status = status or "TIMEOUT", ms = ms or cjson.null, answer = ans or cname or cjson.null }
end
os.execute("rm -rf " .. W)
writef(DIR .. "/dnsrace.json.tmp", cjson.encode({ t = os.time(), domain = domain, results = res }))
os.rename(DIR .. "/dnsrace.json.tmp", DIR .. "/dnsrace.json")
