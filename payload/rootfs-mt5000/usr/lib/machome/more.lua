-- machome "more": NAS backups, AdGuard Home on the NAS, ISP report card, device pause.
-- Shared by the RPC module and the sampler. Secrets (NAS / AdGuard passwords) never leave the router.
local cjson = require "cjson"
local P = {}

local DIR, EDIR = "/tmp/machome", "/etc/machome"
P.NASCFG, P.NASSTATE, P.ADGCFG = EDIR .. "/nasbackup.json", EDIR .. "/nasbackup-state.json", EDIR .. "/nas-adguard.json"
P.OUTAGES, P.STHIST, P.ALERTS = EDIR .. "/outages.json", EDIR .. "/speedtest-history.json", EDIR .. "/alerts.json"
local KEY = EDIR .. "/nas_key"

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function trim(s) return s and (s:gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>&1"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jread(p, def) local s = readf(p); if not s or s == "" then return def end; local ok, v = pcall(cjson.decode, s); return (ok and type(v) == "table") and v or def end
local function writef(p, s, secret)
    os.execute("mkdir -p " .. EDIR .. " " .. DIR)
    local t = p .. ".tmp"; local f = io.open(t, "w"); if not f then return false end; f:write(s); f:close()
    if secret then os.execute("chmod 600 " .. t) end
    return os.rename(t, p)
end
P.jread, P.writef = jread, writef
local function q(s) return "'" .. tostring(s):gsub("'", "'\\''") .. "'" end   -- shell quote

-- curl credentials go through a root-only curl config file (quoted, so any character works) and never show in `ps`
local AUTH = DIR .. "/.curlauth"
local function authcfg(user, pass)
    local v = (user .. ":" .. pass):gsub("\\", "\\\\"):gsub('"', '\\"')
    writef(AUTH, 'user = "' .. v .. '"\n', true)
    return " -K " .. AUTH
end

-- ================================================================= NAS backup
local PROTOS = { ftp = 21, ftps = 21, webdav = 80, webdavs = 443, scp = 22 }
function P.nas_cfg() return jread(P.NASCFG, {}) end
function P.nas_public()
    local c = P.nas_cfg()
    local st = jread(P.NASSTATE, {})
    local pub = trim(readf(KEY .. ".pub") or "")
    return { configured = (c.host or "") ~= "", enabled = c.enabled == true, proto = c.proto or "ftp", host = c.host or "", port = c.port or cjson.null,
        path = c.path or "", user = c.user or "", has_pass = (c.pass or "") ~= "", keep = c.keep or 8, day = c.day or 0, hour = c.hour or 4,
        insecure = c.insecure == true, pubkey = pub ~= "" and pub or cjson.null,
        last = st.last or cjson.null, last_ok = st.last_ok or cjson.null, last_err = st.last_err or cjson.null, files = st.files or {},
        verify = st.verify or cjson.null }
end

function P.nas_set(a)
    local c = P.nas_cfg()
    if a.proto ~= nil then if not PROTOS[a.proto] then return nil, "Unknown transfer method" end; c.proto = a.proto end
    if a.host ~= nil then local h = trim(a.host); if h ~= "" and not h:match("^[%w%.%-:%[%]]+$") then return nil, "NAS address should be an IP or hostname" end; c.host = h end
    if a.port ~= nil then local p = tonumber(a.port); c.port = (p and p >= 1 and p <= 65535) and math.floor(p) or nil end
    if a.path ~= nil then local p = trim(a.path):gsub("\\", "/"); if p:find("%.%.") or p:find("[%c'\"`$;|&<>]") then return nil, "Folder contains characters that aren't allowed" end
        if p ~= "" and p:sub(1, 1) ~= "/" then p = "/" .. p end; c.path = p:gsub("/+$", "") end
    if a.user ~= nil then c.user = trim(a.user) end
    if type(a.pass) == "string" and a.pass ~= "" then c.pass = a.pass end
    if a.enabled ~= nil then c.enabled = a.enabled == true end
    if tonumber(a.keep) then c.keep = math.max(1, math.min(52, math.floor(tonumber(a.keep)))) end
    if tonumber(a.day) then c.day = math.max(0, math.min(7, math.floor(tonumber(a.day)))) end   -- 0-6 = Sun-Sat, 7 = every day
    if tonumber(a.hour) then c.hour = math.max(0, math.min(23, math.floor(tonumber(a.hour)))) end
    if a.insecure ~= nil then c.insecure = a.insecure == true end
    if c.proto == "scp" and not readf(KEY .. ".pub") then
        os.execute("dropbearkey -t ed25519 -f " .. KEY .. " >/dev/null 2>&1; dropbearkey -y -f " .. KEY .. " 2>/dev/null | grep '^ssh-' > " .. KEY .. ".pub; chmod 600 " .. KEY)
    end
    writef(P.NASCFG, cjson.encode(c), true)
    return true
end

local function url_for(c, name)
    local port = c.port or PROTOS[c.proto]
    local host = c.host:find(":") and not c.host:find("%[") and ("[" .. c.host .. "]") or c.host
    local scheme = ({ ftp = "ftp", ftps = "ftp", webdav = "http", webdavs = "https" })[c.proto]
    if c.proto == "ftps" and tonumber(port) == 990 then scheme = "ftps" end   -- implicit FTPS (port 990); 21 = explicit (AUTH TLS)
    return scheme .. "://" .. host .. ":" .. port .. (c.path or "") .. "/" .. (name or "")
end

local function curl_base(c)
    local b = "curl -sS -m 300" .. authcfg(c.user ~= "" and c.user or "anonymous", c.pass or "")
    if c.proto == "ftps" then b = b .. " --ssl-reqd" end
    if c.insecure then b = b .. " -k" end
    return b
end
local function dbc(c) return "dbclient -y -i " .. KEY .. " -p " .. (c.port or 22) end

local function nas_delete(c, name)
    if c.proto == "scp" then
        sh("echo | " .. dbc(c) .. " " .. q(c.user .. "@" .. c.host) .. " " .. q("rm -f '" .. (c.path ~= "" and c.path or ".") .. "/" .. name .. "'"))
    elseif c.proto == "ftp" or c.proto == "ftps" then
        local rel = (c.path or ""):gsub("^/", "")   -- same login-relative path the upload URL used
        sh(curl_base(c) .. " -o /dev/null -Q " .. q("DELE " .. (rel ~= "" and (rel .. "/") or "") .. name) .. " " .. q(url_for({ proto = c.proto, host = c.host, port = c.port, path = "" }, "")))
    else
        sh(curl_base(c) .. " -o /dev/null -X DELETE " .. q(url_for(c, name)))
    end
end

--- Make a settings backup and copy it to the NAS. Returns ok, message.
function P.nas_run()
    local c = P.nas_cfg()
    if (c.host or "") == "" then return false, "NAS not set up" end
    local host = trim(readf("/proc/sys/kernel/hostname") or "router")
    local name = host .. "-backup-" .. os.date("%Y%m%d-%H%M") .. ".tar.gz"
    local file = DIR .. "/" .. name
    os.execute("mkdir -p " .. DIR .. "; /sbin/sysupgrade -b " .. file .. " >/dev/null 2>&1")
    if not readf(file) then return false, "Couldn't create the backup file" end
    local out, ok
    if c.proto == "scp" then
        if not readf(KEY) then os.remove(file); return false, "No SSH key yet. Save the settings first" end
        writef(DIR .. "/dbc.sh", "#!/bin/sh\nexec " .. dbc(c) .. " \"$@\"\n"); os.execute("chmod 700 " .. DIR .. "/dbc.sh")
        if c.path ~= "" then sh("echo | " .. dbc(c) .. " " .. q(c.user .. "@" .. c.host) .. " " .. q("mkdir -p '" .. c.path .. "'")) end
        out = sh("scp -S " .. DIR .. "/dbc.sh " .. file .. " " .. q(c.user .. "@" .. c.host .. ":" .. (c.path ~= "" and c.path or ".") .. "/") .. " </dev/null; echo \"rc=$?\"")
        ok = out:match("rc=0%s*$") ~= nil
    else
        local extra = (c.proto == "ftp" or c.proto == "ftps") and " --ftp-create-dirs" or ""
        if c.proto:match("^webdav") and c.path ~= "" then
            -- create each folder level (MKCOL); "already exists" answers are fine
            local acc = ""
            for part in c.path:gmatch("[^/]+") do acc = acc .. "/" .. part; local cc = { proto = c.proto, host = c.host, port = c.port, path = acc }
                sh(curl_base(c) .. " -o /dev/null -X MKCOL " .. q(url_for(cc, ""))) end
        end
        out = sh(curl_base(c) .. extra .. " -o /dev/null -w 'code=%{http_code}' -T " .. file .. " " .. q(url_for(c, name)) .. "; echo \" rc=$?\"")
        local code = tonumber(out:match("code=(%d+)") or "0")
        ok = out:match("rc=0%s*$") ~= nil and (code == 0 or code == 226 or (code >= 200 and code < 300))
    end
    os.remove(file); os.remove(AUTH)
    local st = jread(P.NASSTATE, {}); st.files = st.files or {}
    st.last = os.time()
    if ok then
        st.last_ok = st.last; st.last_err = nil
        table.insert(st.files, name)
        while #st.files > (c.keep or 8) do nas_delete(c, table.remove(st.files, 1)) end
        os.remove(AUTH)
    else
        -- turn curl/scp exit codes into something a person can act on
        local rc = tonumber(out:match("rc=(%d+)") or "-1")
        local port = c.port or PROTOS[c.proto]
        local svc = ({ ftp = "FTP", ftps = "FTP", webdav = "WebDAV", webdavs = "WebDAV", scp = "SSH" })[c.proto]
        local code = tonumber(out:match("code=(%d+)") or "0")
        local why = ({
            [6] = "Couldn't find the NAS at " .. c.host .. ".",
            [7] = "The NAS refused the connection on port " .. port .. ". Turn on " .. svc .. " in your NAS settings (or pick another method/port).",
            [28] = "The NAS didn't answer on port " .. port .. " (timed out).",
            [67] = "The NAS rejected the username or password.",
            [9] = "The folder " .. (c.path ~= "" and c.path or "/") .. " can't be opened. Check the path and that this user can write there.",
            [25] = "The NAS refused the upload. Check the folder path and that this user has write permission.",
            [35] = "TLS connection failed. Try ticking “Accept self-signed certificate”.",
            [60] = "The NAS certificate isn't trusted. Tick “Accept self-signed certificate”.",
            [64] = "This NAS doesn't offer FTP over TLS. Choose plain FTP.",
        })[rc]
        if c.proto == "ftp" and (out:find("504", 1, true) or out:lower():find("tls", 1, true)) and (rc == 67 or rc == 8 or rc == 64) then
            why = "Your NAS only allows encrypted FTP. Switch the method to “FTP over TLS (FTPS)” and tick “Accept self-signed certificate”."
        end
        if not why and (code == 401 or code == 403) then why = "The NAS rejected the login or doesn't allow writing to that folder (HTTP " .. code .. ")." end
        if not why and code == 404 then why = "WebDAV folder not found (HTTP 404). Check the path." end
        local raw = trim(out:gsub("rc=%d+", ""):gsub("code=%d+", ""))
        st.last_err = (why or (raw ~= "" and raw or ("Upload failed (error " .. rc .. ")"))):sub(1, 240)
    end
    writef(P.NASSTATE, cjson.encode(st))
    if ok then pcall(P.nas_verify) end          -- prove the copy on the NAS is restorable, right away
    return ok, ok and ("Saved " .. name .. " to the NAS") or st.last_err
end

--- Restore drill without restoring: download the NEWEST backup from the NAS into RAM, check the archive is complete
--- (gzip CRC + full tar listing) and contains the router's settings, then delete the local copy. Never touches the NAS.
function P.nas_verify()
    local c = P.nas_cfg(); local st = jread(P.NASSTATE, {}); st.files = st.files or {}
    local name = st.files[#st.files]
    local res = { t = os.time(), ok = false, name = name or cjson.null }
    if (c.host or "") == "" or not name then res.err = (c.host or "") == "" and "NAS not set up" or "No backup on the NAS yet"
    else
        local file = DIR .. "/verify-" .. name
        local out
        if c.proto == "scp" then
            writef(DIR .. "/dbc.sh", "#!/bin/sh\nexec " .. dbc(c) .. " \"$@\"\n"); os.execute("chmod 700 " .. DIR .. "/dbc.sh")
            out = sh("scp -S " .. DIR .. "/dbc.sh " .. q(c.user .. "@" .. c.host .. ":" .. (c.path ~= "" and c.path or ".") .. "/" .. name) .. " " .. file .. " </dev/null; echo \"rc=$?\"")
        else
            out = sh(curl_base(c) .. " -o " .. file .. " " .. q(url_for(c, name)) .. "; echo \" rc=$?\"")
            os.remove(AUTH)
        end
        local size = tonumber(trim(sh("wc -c < " .. file))) or 0
        if not out:match("rc=0%s*$") or size < 1024 then
            res.err = "Couldn't download the newest backup from the NAS (" .. trim(out:gsub("rc=%d+", "")):sub(1, 120) .. ")"
        elseif not sh("gzip -t " .. file .. " && echo OK"):find("OK", 1, true) then
            res.err = "The newest backup on the NAS is damaged (gzip check failed)"
        else
            local list = sh("tar -tzf " .. file)
            local n = 0; for _ in list:gmatch("[^\n]+") do n = n + 1 end
            if not list:find("etc/config/network", 1, true) then res.err = "The newest backup doesn't contain the router's network settings"
            else res.ok = true; res.files = n; res.size = size end
        end
        os.remove(file)
    end
    st = jread(P.NASSTATE, {}); st.verify = res; writef(P.NASSTATE, cjson.encode(st))
    return res.ok, res.err
end

local function exists_bin(n) return trim(sh("command -v " .. n)) ~= "" end
-- ================================================================= DNS provider check ("who answers your lookups?")
-- Asks two "who is asking" names through the DNS server devices use (DHCP option 6, else the router):
-- whoami.akamai.net (A) and o-o.myaddr.l.google.com (TXT) answer with the address of the resolver that
-- actually reached them. Owner (ASN) via Team Cymru's DNS service. Compared with your ISP's ASN.
local DNS_KNOWN = { [13335] = "Cloudflare", [19281] = "Quad9", [42] = "Quad9", [15169] = "Google", [36692] = "Cisco OpenDNS",
    [212772] = "AdGuard DNS", [34939] = "NextDNS", [30607] = "Control D", [397213] = "Control D", [198425] = "Mullvad DNS",
    [57972] = "Mullvad DNS", [209242] = "Cloudflare" }
local function v6expand(a)
    if not a:find(":", 1, true) then return nil end
    local l, r = a:match("^(.-)::(.*)$"); local parts = {}
    if l then
        local L, R = {}, {}; for p in l:gmatch("[^:]+") do L[#L + 1] = p end; for p in r:gmatch("[^:]+") do R[#R + 1] = p end
        for _, p in ipairs(L) do parts[#parts + 1] = p end; for _ = 1, 8 - #L - #R do parts[#parts + 1] = "0" end; for _, p in ipairs(R) do parts[#parts + 1] = p end
    else for p in a:gmatch("[^:]+") do parts[#parts + 1] = p end end
    if #parts ~= 8 then return nil end
    local hex = ""; for _, p in ipairs(parts) do hex = hex .. string.rep("0", 4 - #p) .. p:lower() end
    return hex
end
local function asn_of(ip, srv)
    local q
    local a, b, c, d = ip:match("^(%d+)%.(%d+)%.(%d+)%.(%d+)$")
    if a then q = d .. "." .. c .. "." .. b .. "." .. a .. ".origin.asn.cymru.com"
    else local h = v6expand(ip); if not h then return nil end
        local n = {}; for i = 32, 1, -1 do n[#n + 1] = h:sub(i, i) end; q = table.concat(n, ".") .. ".origin6.asn.cymru.com" end
    local asn = tonumber((sh("dig @" .. srv .. " +time=3 +tries=1 +short TXT " .. q):match('"%s*(%d+)')))
    if not asn then return nil end
    local org = sh("dig @" .. srv .. " +time=3 +tries=1 +short TXT AS" .. asn .. ".asn.cymru.com"):match('|%s*([^|"]-)%s*"') or ""
    return asn, trim(org)
end
--- Returns { server, resolvers = { {ip, asn, org, name} }, names = {"Quad9"}, isp = {asn, org}, ispleak = bool } or nil, err
function P.dns_who()
    if not exists_bin("dig") then return nil, "dig is not installed" end
    local lanip = trim(sh("uci -q get network.lan.ipaddr")):gsub("/.*", "")
    local list = sh("uci -q get dhcp.lan.dhcp_option"):match("%f[%d]6,([%d%.]+)")
    local srv = list or (lanip ~= "" and lanip) or "127.0.0.1"
    local ips, seen = {}, {}
    for i = 1, 2 do
        for ip in sh("dig @" .. srv .. " +time=3 +tries=1 +short whoami.akamai.net"):gmatch("([%d%.]+)") do if not seen[ip] then seen[ip] = 1; ips[#ips + 1] = ip end end
        for ip in sh("dig @" .. srv .. " +time=3 +tries=1 +short TXT o-o.myaddr.l.google.com"):gmatch('"([%x%.:]+)"') do if not seen[ip] and not ip:match("^edns") then seen[ip] = 1; ips[#ips + 1] = ip end end
    end
    if #ips == 0 then return nil, "The DNS server (" .. srv .. ") didn't answer the test lookups" end
    -- ISP: owner of the router's own internet address (seen by Cloudflare through the WAN)
    local wan = trim(sh("ubus call network.interface.wan status 2>/dev/null | jsonfilter -e '@.l3_device' 2>/dev/null"))
    local isp = nil
    if wan:match("^[%w%._-]+$") then
        local pub = sh("curl --interface " .. wan .. " -s -m 6 https://1.1.1.1/cdn-cgi/trace 2>/dev/null"):match("ip=([%x%.:]+)")
        if pub then local a, o = asn_of(pub, srv); if a then isp = { asn = a, org = o } end end
    end
    local out = { t = os.time(), server = srv, resolvers = {}, names = {}, ispleak = false, isp = isp or cjson.null }
    local nseen = {}
    for _, ip in ipairs(ips) do
        local a, o = asn_of(ip, srv)
        local name = (a and DNS_KNOWN[a]) or (o ~= nil and o ~= "" and o:gsub(",.*", ""):gsub("%s+%-.*", "")) or "Unknown"
        -- Quad9 runs on several WoodyNet / Packet Clearing House networks (WOODYNET-1, WOODYNET-2, ...): all Quad9
        if type(o) == "string" and (o:upper():match("^WOODYNET") or o:upper():match("QUAD9")) then name = "Quad9" end
        if isp and a == isp.asn then name = "Your ISP (" .. (isp.org:gsub(",.*", "")) .. ")"; out.ispleak = true end
        out.resolvers[#out.resolvers + 1] = { ip = ip, asn = a or cjson.null, org = o or cjson.null, name = name }
        if not nseen[name] then nseen[name] = 1; out.names[#out.names + 1] = name end
    end
    return out
end

-- ================================================================= VPN leak test (read-only, background, ~30 s)
-- Proves from the router's side that nothing slips around the VPN: exit addresses, routing per tunnel rule,
-- kill switch, IPv6, DNS. Result: /tmp/machome/leaktest.json { t, checks = { {ok=true|false|nil(info), title, detail} } }
function P.leak_test()
    local out = { t = os.time(), checks = {} }
    -- fix = true: a failure that re-applying GL's VPN routing can repair (auto-heal leak_fix); others need a settings change
    local function add(ok, title, detail, fix) out.checks[#out.checks + 1] = { ok = (ok == nil) and cjson.null or ok, title = title, detail = detail or "", fix = (ok == false and fix) and true or nil } end
    local function done() out.t2 = os.time(); writef(DIR .. "/leaktest.json", cjson.encode(out)); return out end
    local rules = {}
    for idx, k, v in sh("uci -q show route_policy"):gmatch("route_policy%.@rule%[(%d+)%]%.(%w+)='([^']*)'") do
        local i = tonumber(idx) + 1; rules[i] = rules[i] or {}; rules[i][k] = v
    end
    local vpn = {}
    for i = 1, #rules do local r = rules[i]; if r and r.enabled ~= "0" and ((r.via or ""):match("^wgclient%d+$") or (r.via or ""):match("^ovpnclient%d+$")) and (r.mark or ""):match("^0x%x+$") then vpn[#vpn + 1] = r end end
    out.vpn = #vpn
    if #vpn == 0 then add(nil, "No VPN in use", "No device traffic is set to use a VPN here, so only the DNS check runs. Your devices' traffic and lookups use your normal internet.") end
    local function trace(ifc) local t = sh("curl --interface " .. ifc .. " -s -m 8 https://1.1.1.1/cdn-cgi/trace 2>/dev/null"); return t:match("ip=([%x%.:]+)"), t:match("colo=(%u+)"), t:match("loc=(%u+)") end
    local wan = trim(sh("ubus call network.interface.wan status 2>/dev/null | jsonfilter -e '@.l3_device' 2>/dev/null")); if not wan:match("^[%w%._-]+$") then wan = nil end
    local isp = wan and trace(wan)
    if #vpn > 0 then   -- checks 1-5 only make sense when devices are supposed to use a VPN
    -- 1. each tunnel hides the home address
    for _, r in ipairs(vpn) do
        local ip, colo, loc = trace(r.via); local n = r.name or r.via
        if not ip then add(false, n .. ": no answer through the tunnel", "A test page didn't load through " .. r.via .. ". The tunnel may be down right now; its devices are blocked or moved to another tunnel meanwhile.")
        elseif isp and ip == isp then add(false, n .. " shows your home internet address", "Traffic through this tunnel appears to come from your own address, so the VPN isn't hiding it.", true)
        else add(true, n .. " hides your home address", "Websites see a VPN address" .. (colo and (" (exit near " .. colo .. (loc and (", " .. loc) or "") .. ")") or "") .. ", not your home's.") end
    end
    -- 2. devices on a VPN rule can only leave through a tunnel
    for _, r in ipairs(vpn) do
        local dev = sh("ip route get 1.1.1.1 mark " .. r.mark .. " 2>&1"):match(" dev (%S+)"); local n = r.name or r.via
        if dev == r.via then add(true, n .. ": its devices only leave through the VPN", "Traffic from its devices is routed into " .. r.via .. ".")
        elseif dev and (dev:match("^wgclient%d+$") or dev:match("^ovpnclient%d+$")) then add(true, n .. ": its devices are on another tunnel right now", "Failover moved them to " .. dev .. " (still on the VPN) while their own tunnel recovers.")
        else add(false, n .. ": traffic isn't going into a tunnel", "Its devices would currently leave through " .. tostring(dev) .. " instead of the VPN.", true) end
    end
    -- 3. kill switch
    local rl = sh("ip rule"); local allks = true
    for _, r in ipairs(vpn) do if r.killswitch ~= "1" then allks = false end end
    local ksr = rl:find("not from all fwmark 0/0xf000 blackhole", 1, true) ~= nil
    if allks and ksr then add(true, "Kill switch is armed", "If a tunnel drops, its devices are blocked (or moved to another tunnel) instead of falling back to your normal internet.")
    -- every rule has the kill switch on but its blocking rule is missing = GL's routing needs re-applying (fixable);
    -- a rule with the switch off is a setting only the owner should change
    else add(false, "Kill switch isn't fully on", allks and "Every VPN rule has “Block non-VPN traffic” on, but the router's blocking rule is missing right now, so devices could fall back to your normal internet if a tunnel drops."
        or "Turn on “Block non-VPN traffic” for every VPN rule in GL's VPN settings, otherwise devices can fall back to your normal internet when a tunnel drops.", allks) end
    -- 4. IPv6
    local dis = trim(readf("/proc/sys/net/ipv6/conf/all/disable_ipv6") or "")
    local g6 = tonumber(trim(sh("ip -6 addr show br-lan scope global 2>/dev/null | grep -c inet6"))) or 0
    local d6 = trim(sh("ip -6 route show default 2>/dev/null"))
    if dis == "1" or g6 == 0 then add(true, "IPv6 can't bypass the VPN", "IPv6 is off on your network, so devices can't reach the internet around the VPN over IPv6.")
    elseif d6 ~= "" then add(false, "IPv6 may bypass the VPN", "Your network hands out IPv6 addresses and the router has an IPv6 internet route, but the VPN tunnels carry IPv4. Turn IPv6 off unless your VPN supports it.")
    else add(true, "IPv6 has no way out", "Devices have IPv6 addresses, but the router has no IPv6 internet route.") end
    -- 5. DNS: which server devices use, and whether ITS lookups go through the VPN
    local lanip = trim(sh("uci -q get network.lan.ipaddr")):gsub("/.*", "")
    local opt = sh("uci -q get dhcp.lan.dhcp_option"); local list = opt:match("%f[%d]6,([%d%.,]+)")
    local servers = {}; if list then for s in list:gmatch("[%d%.]+") do servers[#servers + 1] = s end else servers = { lanip } end
    for _, s in ipairs(servers) do
        if s == lanip then
            add(false, "DNS: lookups go to the router, then out via your ISP", "Devices ask the router (" .. s .. "), which forwards lookups over your normal internet, not the VPN, so your ISP could see which sites are looked up.")
        elseif s:match("^192%.168%.") or s:match("^10%.") or s:match("^172%.") then
            local mac; for l in (readf("/proc/net/arp") or ""):gmatch("[^\n]+") do local ip, m = l:match("^(%S+)%s+%S+%s+%S+%s+(%S+)"); if ip == s then mac = m end end
            if not mac then add(nil, "DNS server " .. s .. " wasn't seen on the network", "Couldn't check which way its own lookups go right now.")
            else
                local via = nil
                for _, r in ipairs(vpn) do
                    local neg, set = (r.from or ""):match("^(!?)(src_mac%d+)$")
                    if set then
                        local inset = sh("ipset test " .. set .. " " .. mac .. " 2>&1"):find("NOT", 1, true) == nil
                        if (neg == "!" and not inset) or (neg == "" and inset) then via = r; break end
                    end
                end
                -- 2026-11-18: AdGuard on the NAS sending its lookups ENCRYPTED (DoH / DoT / DoQ) isn't a leak even when the
                -- NAS itself is off the VPN: the ISP only sees an encrypted connection to the DNS provider
                local enc = nil
                if not via and P.adg_dns then
                    local okd, ad = pcall(P.adg_dns)
                    if okd and type(ad) == "table" and type(ad.upstream) == "table" and #ad.upstream > 0 then
                        enc = true
                        for _, u in ipairs(ad.upstream) do if not tostring(u):match("^https://") and not tostring(u):match("^tls://") and not tostring(u):match("^quic://") and not tostring(u):match("^sdns://") then enc = false end end
                    end
                end
                if via then add(true, "DNS lookups go through the VPN", "Devices use " .. s .. " (e.g. AdGuard), and its own lookups leave through " .. (via.name or via.via) .. ".")
                elseif enc then add(true, "DNS lookups are encrypted", "Devices use " .. s .. " (AdGuard). That device isn't on the VPN, but it sends every lookup encrypted to its DNS provider, so your ISP can't read them.")
                else add(false, "DNS lookups leave via your ISP", "Devices use " .. s .. ", but that device isn't on the VPN, so its lookups go out over your normal internet. Put that device on the VPN, or have it send lookups encrypted (DoH / DoT) to its DNS provider.") end
            end
        else add(true, "DNS uses " .. s, "Devices ask a public DNS server; those lookups travel through each device's VPN like any other traffic.") end
    end
    end   -- #vpn > 0
    -- 6. who answers the lookups (works with or without a VPN)
    local dw, derr = P.dns_who()
    if not dw then add(nil, "DNS provider couldn't be checked", derr or "")
    elseif dw.ispleak then add(false, "DNS: your ISP answers your lookups", "Lookups are answered by " .. table.concat(dw.names, ", ") .. ", so your internet provider can see every site your devices look up. Use a private DNS provider in AdGuard (e.g. Quad9 or Cloudflare over DoH/DoT).")
    else add(true, "DNS provider: " .. table.concat(dw.names, ", "), "Your lookups are answered by " .. table.concat(dw.names, ", ") .. " (not your internet provider)" .. (dw.isp ~= cjson.null and dw.isp and (", checked against your ISP " .. tostring(dw.isp.org):gsub(",.*", "")) or "") .. ".") end
    if dw then writef(DIR .. "/dnswho.json", cjson.encode(dw)) end
    -- 7. info: devices kept off the VPN on purpose
    local set = #vpn > 0 and (vpn[1].from or ""):match("^!(src_mac%d+)$")
    if set then
        local n = tonumber(trim(sh("ipset list " .. set .. " 2>/dev/null | grep -cE '^([0-9A-Fa-f]{2}:){5}'"))) or 0
        add(nil, n .. " device" .. (n == 1 and "" or "s") .. " stay off the VPN by your choice", "They're excluded in " .. (vpn[1].name or vpn[1].via) .. "'s rule in GL's VPN settings and use your normal internet.")
    end
    return done()
end

-- ================================================================= AdGuard Home on the NAS
function P.adg_cfg() return jread(P.ADGCFG, {}) end
function P.adg_set(a)
    local c = P.adg_cfg()
    if a.url ~= nil then
        local u = trim(a.url):gsub("/+$", "")
        if u ~= "" and not u:match("^https?://[%w%.%-:%[%]]+$") then return nil, "Use a URL like http://192.168.8.210:8080" end
        c.url = u
    end
    if a.user ~= nil then c.user = trim(a.user) end
    if type(a.pass) == "string" and a.pass ~= "" then c.pass = a.pass end
    if a.clear == true then c = {} end
    writef(P.ADGCFG, cjson.encode(c), true)
    return true
end
local function adg_get(c, path)
    local auth = (c.user or "") ~= "" and authcfg(c.user, c.pass or "") or ""
    local out = sh("curl -s -k -m 6 -w '\\n%{http_code}'" .. auth .. " " .. q(c.url .. path))
    local body, code = out:match("^(.*)\n(%d+)%s*$")
    local ok, v = pcall(cjson.decode, body or "")
    return (ok and type(v) == "table") and v or nil, tonumber(code or "0")
end
function P.adg_status()
    local c = P.adg_cfg()
    if (c.url or "") == "" then return { configured = false } end
    local s, code = adg_get(c, "/control/status")
    local out = { configured = true, url = c.url, host = c.url:match("^https?://([^/:%]]+)") or c.url, user = c.user or "", has_pass = (c.pass or "") ~= "" }
    if not s then
        os.remove(AUTH)
        out.ok = false
        out.err = (code == 401 or code == 403) and "Login rejected. Check the AdGuard username and password" or (code == 0 and "Can't reach AdGuard at " .. c.url or ("AdGuard answered HTTP " .. code))
        return out
    end
    local st = adg_get(c, "/control/stats") or {}
    os.remove(AUTH)
    local function top(list, n)
        local r = {}
        for _, e in ipairs(type(list) == "table" and list or {}) do
            for k, v in pairs(e) do r[#r + 1] = { name = k, count = v } end
            if #r >= n then break end
        end
        return r
    end
    out.ok = true
    out.running = s.running ~= false
    out.protection = s.protection_enabled == true
    out.version = s.version or cjson.null
    out.queries = st.num_dns_queries or 0
    out.blocked = (st.num_blocked_filtering or 0) + (st.num_replaced_safebrowsing or 0) + (st.num_replaced_parental or 0)
    out.avg_ms = st.avg_processing_time and math.floor(st.avg_processing_time * 1000 + 0.5) or cjson.null
    -- each upstream's average answer time (AdGuard 0.107+; seconds), for the Network Health DNS row (2026-11-18)
    out.up = {}
    for _, e in ipairs(type(st.top_upstreams_avg_time) == "table" and st.top_upstreams_avg_time or {}) do
        for k, v in pairs(e) do if tonumber(v) then out.up[#out.up + 1] = { name = k, ms = math.floor(tonumber(v) * 1000 + 0.5) } end end
    end
    out.top_blocked = top(st.top_blocked_domains, 4)
    out.series = type(st.dns_queries) == "table" and st.dns_queries or {}
    out.series_blocked = type(st.blocked_filtering) == "table" and st.blocked_filtering or {}
    out.interval = st.time_units or "hours"
    return out
end

-- ================================================================= forget removed VPNs (owner, 2026-11-18)
-- cur = { providers = {lowercase name = true}, servers = {"provider|server" lowercase = true}, ifaces = {via = true} }
-- keep_provider: forget by provider (servers of a provider still on a tunnel are kept) or else by server.
-- gone_ok(kind "prov"|"srv", id): may this one be forgotten now? (24 h grace for the automatic run; always for the button)
-- Returns { rel = {reliability keys}, sh = {speed-history labels -> count}, last = {ifaces}, items = {text}, total = n }.
local function prov_of_label(l) return tostring(l or ""):match("%(([^%(%)]+)%)%s*$") end
function P.vpn_forget_plan(cur, keep_provider, gone_ok)
    gone_ok = gone_ok or function() return true end
    local plan = { rel = {}, sh = {}, last = {}, items = {}, total = 0 }
    local rel = jread(EDIR .. "/reliability.json", { buckets = {} })
    for key, list in pairs(type(rel.buckets) == "table" and rel.buckets or {}) do
        local prov, peer = tostring(key):match("^(.-)|(.*)$")
        prov = (prov or key):lower()
        local gone
        if keep_provider then gone = not cur.providers[prov] and gone_ok("prov", prov)
        else gone = not cur.servers[tostring(key):lower()] and gone_ok("srv", tostring(key):lower()) end
        if gone then
            plan.rel[#plan.rel + 1] = key; plan.total = plan.total + 1
            local last = type(list) == "table" and list[#list] or {}
            plan.items[#plan.items + 1] = "7-day reliability: " .. tostring(last.label or prov) .. (peer and peer ~= "" and (" · " .. peer) or "")
        end
    end
    local hist = jread(EDIR .. "/speedtest-history.json", {})
    for _, e in ipairs(hist) do
        if type(e) == "table" and e.kind == "vpn" then
            local prov = (e.provider ~= nil and e.provider ~= cjson.null) and tostring(e.provider) or prov_of_label(e.label)
            if prov and not cur.providers[prov:lower()] and gone_ok("prov", prov:lower()) then
                local l = tostring(e.label or prov); plan.sh[l] = (plan.sh[l] or 0) + 1
            end
        end
    end
    for l, n in pairs(plan.sh) do plan.items[#plan.items + 1] = "Speed history: " .. l .. " (" .. n .. " test" .. (n == 1 and "" or "s") .. ")"; plan.total = plan.total + n end
    local sl = jread(EDIR .. "/speedtest-last.json", {})
    for _, r in ipairs(sl.vpn and type(sl.vpn.results) == "table" and sl.vpn.results or {}) do
        if type(r) == "table" and r.iface and not cur.ifaces[r.iface] then plan.last[#plan.last + 1] = r.iface; plan.total = plan.total + 1; plan.items[#plan.items + 1] = "Last speed test row: " .. tostring(r.iface) end
    end
    table.sort(plan.items)
    return plan
end
--- the file parts of a plan (speed history + last results). Reliability lives in the sampler's memory: X.rel_forget.
function P.vpn_forget_apply_files(plan)
    if next(plan.sh or {}) then
        local hist, keep = jread(EDIR .. "/speedtest-history.json", {}), {}
        for _, e in ipairs(hist) do if not (type(e) == "table" and e.kind == "vpn" and plan.sh[tostring(e.label or prov_of_label(e.label) or "")]) then keep[#keep + 1] = e end end
        writef(EDIR .. "/speedtest-history.json", cjson.encode(keep))
    end
    if #(plan.last or {}) > 0 then
        local sl = jread(EDIR .. "/speedtest-last.json", {})
        if sl.vpn and type(sl.vpn.results) == "table" then
            local drop = {}; for _, i in ipairs(plan.last) do drop[i] = true end
            local keep = {}; for _, r in ipairs(sl.vpn.results) do if not (type(r) == "table" and drop[r.iface]) then keep[#keep + 1] = r end end
            sl.vpn.results = keep; if #keep == 0 then sl.vpn = nil end
            writef(EDIR .. "/speedtest-last.json", cjson.encode(sl))
        end
    end
end
--- AdGuard on the NAS: the newest blocked lookups {client, time (ISO string), name} (unusual-blocking alert, 2026-11-18)
function P.adg_blocked(limit)
    local c = P.adg_cfg(); if (c.url or "") == "" then return nil end
    local j = adg_get(c, "/control/querylog?limit=" .. math.max(10, math.min(1000, tonumber(limit) or 500)) .. "&response_status=blocked")
    os.remove(AUTH)
    if type(j) ~= "table" or type(j.data) ~= "table" then return nil end
    local out = {}
    for _, e in ipairs(j.data) do
        out[#out + 1] = { client = tostring(e.client or ""), time = tostring(e.time or ""), name = type(e.question) == "table" and tostring(e.question.name or "") or "" }
    end
    return out
end
--- one speed-history line (legend "×"): every test with that label
function P.speedhist_remove(label)
    local hist, keep, n = jread(EDIR .. "/speedtest-history.json", {}), {}, 0
    for _, e in ipairs(hist) do if type(e) == "table" and tostring(e.label) == tostring(label) then n = n + 1 else keep[#keep + 1] = e end end
    if n > 0 then writef(EDIR .. "/speedtest-history.json", cjson.encode(keep)) end
    return n
end

--- DNS hub (2026-11-16): AdGuard's own DNS settings (upstreams, DNSSEC, cache), read-only. Never returns the login.
function P.adg_dns()
    local c = P.adg_cfg()
    if (c.url or "") == "" then return nil end
    local d = adg_get(c, "/control/dns_info"); os.remove(AUTH)
    if type(d) ~= "table" then return { ok = false } end
    local function list(v)
        local r = {}; for _, x in ipairs(type(v) == "table" and v or {}) do if type(x) == "string" and x ~= "" and not x:match("^#") then r[#r + 1] = x end end; return r
    end
    return { ok = true, upstream = list(d.upstream_dns), bootstrap = list(d.bootstrap_dns), mode = d.upstream_mode or cjson.null,
        dnssec = d.dnssec_enabled == true, cache = d.cache_size or cjson.null, blocking = d.blocking_mode or cjson.null }
end

--- DNS hub lookup map (2026-11-16): AdGuard's query-log entry for the newest A lookup of <domain> (read-only).
--- Returns which upstream answered, how long it took, cached or not, blocked or not (and the rule), and the answer.
function P.adg_querylog(domain)
    local c = P.adg_cfg()
    if (c.url or "") == "" or not tostring(domain or ""):match("^[%w][%w%-%.]*$") then return nil end
    local d = adg_get(c, "/control/querylog?search=" .. domain .. "&limit=25"); os.remove(AUTH)
    if type(d) ~= "table" or type(d.data) ~= "table" then return { ok = false } end
    local function s(v) return type(v) == "string" and v or "" end
    for _, e in ipairs(d.data) do   -- newest first
        local q = type(e.question) == "table" and e.question or {}
        if (s(q.name):lower():gsub("%.$", "")) == domain and s(q.type) == "A" then
            local ans = {}
            for _, a in ipairs(type(e.answer) == "table" and e.answer or {}) do
                if #ans < 6 then ans[#ans + 1] = { type = s(a.type), value = tostring(a.value or ""), ttl = tonumber(a.ttl) or cjson.null } end
            end
            local rule = type(e.rules) == "table" and type(e.rules[1]) == "table" and s(e.rules[1].text) or s(e.rule)
            return { ok = true, upstream = s(e.upstream), elapsed = tonumber(e.elapsedMs) or cjson.null, cached = e.cached == true,
                reason = s(e.reason), status = s(e.status), answer = ans, rule = rule ~= "" and rule or cjson.null, time = s(e.time) }
        end
    end
    return { ok = true, none = true }
end

-- ================================================================= device pause (GL's own client block list)
function P.pause(mac, on, ip, lrpc)
    mac = trim(tostring(mac or "")):upper()
    if not mac:match("^%x%x:%x%x:%x%x:%x%x:%x%x:%x%x$") then return nil, "invalid MAC" end
    -- same call GL's Clients page / the Home tab's Block button use
    local r = lrpc("black_white_list", "set_single_mac", { mode = "black", operate = on and "add" or "del", mac = mac })
    if on and ip and tostring(ip):match("^%d+%.%d+%.%d+%.%d+$") then
        os.execute("conntrack -D -s " .. ip .. " >/dev/null 2>&1; conntrack -D -d " .. ip .. " >/dev/null 2>&1")   -- cut existing connections
    end
    return r ~= nil, r
end

-- ================================================================= outages + ISP report card
function P.log_outage(start, finish)
    local o = jread(P.OUTAGES, {})
    o[#o + 1] = { s = start, e = finish }
    while #o > 500 do table.remove(o, 1) end
    writef(P.OUTAGES, cjson.encode(o))
end

-- AdGuard / DNS-server outages: kept apart from internet outages so the ISP report isn't blamed for them
P.DNSOUT = EDIR .. "/dns-outages.json"
function P.log_dns_outage(start, finish, server)
    local o = jread(P.DNSOUT, {})
    o[#o + 1] = { s = start, e = finish, server = server }
    while #o > 500 do table.remove(o, 1) end
    writef(P.DNSOUT, cjson.encode(o))
end

function P.isp_report(months)
    months = months or 6
    local a = jread(P.ALERTS, {})
    local plan_d, plan_u = tonumber(a.plan_down) or 2000, tonumber(a.plan_up) or 2000
    local outs = jread(P.OUTAGES, {})
    local hist = jread(P.STHIST, {})
    local now = os.time()
    local t = os.date("*t", now)
    local rep = {}
    for i = 0, months - 1 do
        local y, m = t.year, t.month - i
        while m < 1 do m = m + 12; y = y - 1 end
        local s = os.time({ year = y, month = m, day = 1, hour = 0 })
        local e = os.time({ year = m == 12 and y + 1 or y, month = m == 12 and 1 or m + 1, day = 1, hour = 0 })
        local r = { label = os.date("%B %Y", s), start = s, outages = 0, down_s = 0, tests = 0, sum_d = 0, sum_u = 0, min_d = nil, ok80 = 0, sum_ping = 0 }
        for _, o in ipairs(outs) do
            local os_, oe = math.max(o.s, s), math.min(o.e, e)
            if oe > os_ then r.outages = r.outages + 1; r.down_s = r.down_s + (oe - os_) end
        end
        for _, h in ipairs(hist) do
            if h.kind == "wan" and h.time >= s and h.time < e and type(h.down) == "number" then
                r.tests = r.tests + 1; r.sum_d = r.sum_d + h.down; r.sum_u = r.sum_u + (type(h.up) == "number" and h.up or 0)
                r.sum_ping = r.sum_ping + (type(h.ping) == "number" and h.ping or 0)
                r.min_d = (not r.min_d or h.down < r.min_d) and h.down or r.min_d
                if h.down >= plan_d * 0.8 then r.ok80 = r.ok80 + 1 end
            end
        end
        local span = math.min(e, now) - s
        r.uptime = span > 0 and (1 - r.down_s / span) * 100 or 100
        r.avg_d = r.tests > 0 and r.sum_d / r.tests or cjson.null
        r.avg_u = r.tests > 0 and r.sum_u / r.tests or cjson.null
        r.avg_ping = r.tests > 0 and r.sum_ping / r.tests or cjson.null
        r.min_d = r.min_d or cjson.null
        r.sum_d, r.sum_u, r.sum_ping = nil, nil, nil
        rep[#rep + 1] = r
    end
    local first = (outs[1] and outs[1].s) or nil
    for _, h in ipairs(hist) do if not first or h.time < first then first = h.time end end
    return { plan_down = plan_d, plan_up = plan_u, months = rep, since = first or cjson.null, recent = { table.unpack and table.unpack(outs, math.max(1, #outs - 9)) or unpack(outs, math.max(1, #outs - 9)) } }
end

return P
