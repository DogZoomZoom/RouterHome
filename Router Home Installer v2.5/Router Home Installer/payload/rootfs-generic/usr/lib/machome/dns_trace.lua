-- DNS hub "Lookup map" (owner 2026-11-16). READ-ONLY. Shows what it takes to resolve <domain>:
--   1. ask the DNS your devices use (LAN DNS, e.g. AdGuard on the NAS) and time it
--   2. read AdGuard's query log for that lookup: cached? blocked? which upstream answered (e.g. Quad9 DoH) and how fast
--   3. replay the full resolution from the top (dig +trace): root server -> TLD servers -> the domain's own servers
-- Result: /tmp/machome/dnstrace.json. Started in the background by rpc machome.dns_trace.
--   lua /usr/lib/machome/dns_trace.lua <domain>
local cjson = require "cjson"
local domain = arg and arg[1] or "example.com"
if not domain:match("^[%w][%w%-%.]*%.[%a][%w%-]*$") or #domain > 100 then return end
local DIR = "/tmp/machome"
local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local f = io.open(p, "w"); if f then f:write(s); f:close() end end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); local s = p and p:read("*a") or ""; if p then p:close() end; return s end
local function trim(s) return ((s or ""):gsub("^%s+", ""):gsub("%s+$", "")) end

local out = { domain = domain }
-- which DNS your devices use
local nas = ""
do local ok, c = pcall(cjson.decode, readf("/etc/machome/nas-adguard.json") or "{}"); if ok and type(c) == "table" and type(c.url) == "string" then nas = c.url:match("^https?://([^/:%]]+)") or "" end end
local lan = nil
for o in sh("uci -q get dhcp.lan.dhcp_option"):gmatch("%S+") do local v = o:match("^6,(.+)$") or o:match("^option:dns%-server,(.+)$"); if v and not lan then lan = v:match("^([^,]+)") end end
local ap = trim(sh("uci -q get glconfig.general.mode")) == "ap"
local target = lan or (ap and nil) or "127.0.0.1"
if not target then target = trim(sh("awk '/^nameserver/{print $2; exit}' /tmp/resolv.conf.d/resolv.conf.auto")) end
out.first = { server = target, kind = (target == nas and nas ~= "") and "nas_adguard" or (target == "127.0.0.1" and "router" or "lan") }

-- 1. the lookup a device would make
local function parse_answers(o)
  local t = {}
  for owner, ttl, typ, val in o:gmatch("\n([^;%s]%S*)%s+(%d+)%s+IN%s+(%u+)%s+([^\n]+)") do
    if (typ == "A" or typ == "AAAA" or typ == "CNAME") and #t < 6 then t[#t + 1] = { owner = owner, ttl = tonumber(ttl), type = typ, value = trim(val) } end
  end
  return t
end
local d1 = sh("dig @" .. target .. " +time=3 +tries=1 " .. domain .. " A")
out.first.status = d1:match("status: (%u+)") or "TIMEOUT"
out.first.ms = tonumber(d1:match("Query time: (%d+) msec")) or cjson.null
out.first.answer = parse_answers(d1)

-- 2. AdGuard's own record of that lookup
if out.first.kind == "nas_adguard" then
  os.execute("sleep 1")
  local ok, P = pcall(dofile, "/usr/lib/machome/more.lua")
  if ok and type(P) == "table" and P.adg_querylog then
    local okq, q = pcall(P.adg_querylog, domain)
    out.adg = okq and q or { ok = false }
  end
end

-- 3. the full resolution from the top, as a resolver without a cache does it
local tr = sh("dig -4 +trace +nodnssec +time=2 +tries=1 " .. domain .. " A")
local hops, recs = {}, {}
for line in (tr .. "\n"):gmatch("([^\n]*)\n") do
  local ip, name, ms = line:match("^;; Received %d+ bytes from ([^#]+)#%d+%(([^)]*)%) in (%d+) ms")
  if ip then
    local h = { server = (name ~= "" and name or ip), ip = ip, ms = tonumber(ms) }
    local ns, nsx, zone, ans = 0, nil, nil, {}
    for _, r in ipairs(recs) do
      if r.type == "NS" then ns = ns + 1; zone = zone or r.owner; nsx = nsx or r.value
      elseif (r.type == "A" or r.type == "AAAA" or r.type == "CNAME") and #ans < 6 then ans[#ans + 1] = r end
    end
    if #ans > 0 then h.kind = "answer"; h.answer = ans
    elseif ns > 0 then h.kind = "referral"; h.zone = zone; h.ns = ns; h.ns_example = nsx
    else h.kind = "other" end
    hops[#hops + 1] = h; recs = {}
  elseif line ~= "" and not line:match("^;") then
    local owner, ttl, typ, val = line:match("^(%S+)%s+(%d+)%s+IN%s+(%u+)%s+(.+)$")
    if owner and typ ~= "RRSIG" and typ ~= "DS" and typ ~= "NSEC" and typ ~= "NSEC3" then
      recs[#recs + 1] = { owner = owner, ttl = tonumber(ttl), type = typ, value = trim(val) }
    end
  end
end
out.trace = { hops = hops, ok = #hops > 0 and hops[#hops].kind == "answer" }
out.t = os.time()
writef(DIR .. "/dnstrace.json.tmp", cjson.encode(out))
os.rename(DIR .. "/dnstrace.json.tmp", DIR .. "/dnstrace.json")
