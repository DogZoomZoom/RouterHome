-- Router Home notification providers (2.8.0): Discord, Telegram, Gmail, Slack, Home Assistant (ntfy was in beta.1,
-- removed in beta.2 by the owner; a saved ntfy block in alerts.json is simply ignored).
-- Router name (beta.2): alerts.json router_name, e.g. "Flint 3", shown instead of the model host name (GL-MT5000) as the
-- Discord sender, email sender + subject, Home Assistant title, and in every footer. Empty = the host name.
-- One message goes to every provider that is set up and switched on, all at the same time (one background
-- curl/openssl each, then wait), so a slow provider can't hold up the others.
-- Settings live in /etc/machome/alerts.json (root-only, mode 600):
--   webhook (Discord, since 2026-11), discord_off,
--   router_name,  tg = {token, chat, on}   gmail = {user, pass, to, on}
--   slack = {url, on}        ha = {url, on}
-- Secrets never reach the page (status() only gives "…last 4" hints) and never appear in a command line:
-- URLs, headers and the Gmail login go through mode-600 files in /tmp/machome that are deleted after sending.
local cjson = require "cjson"
local N = {}
local DIR = "/tmp/machome"
local CA = "/etc/ssl/certs/ca-certificates.crt"

N.LIST = { "discord", "telegram", "gmail", "slack", "ha" }
N.NAMES = { discord = "Discord", telegram = "Telegram", gmail = "Gmail", slack = "Slack", ha = "Home Assistant" }
N.PAT = {
    discord = "^https://[%w%.]*discord[%w]*%.com/api/webhooks/%d+/[%w_%-]+$",
    tg_token = "^%d+:[%w_%-]+$",
    tg_chat = "^%-?%d+$",
    gmail_user = "^[%w%._%+%-]+@gmail%.com$",
    gmail_user2 = "^[%w%._%+%-]+@googlemail%.com$",
    email = "^[%w%._%+%-]+@[%w%-]+%.[%w%.%-]+$",
    gmail_pass = "^%l+$",
    slack = "^https://hooks%.slack%.com/services/[%w/]+$",
    ha = "^https?://[%w%.%-]+:?%d*/api/webhook/[%w_%-]+$",
}

local function readf(p) local f = io.open(p, "r"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function trim(s) return s and (tostring(s):gsub("^%s+", ""):gsub("%s+$", "")) or "" end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
-- private file (mode 600 before anything is written)
local function pwrite(p, s) local f = io.open(p, "w"); if not f then return false end; f:close(); os.execute("chmod 600 '" .. p .. "'"); f = io.open(p, "w"); f:write(s); f:close(); return true end
local function tab(v) return type(v) == "table" and v or {} end

-- ---------------------------------------------------------------- which providers are set up
function N.gmail_addr(s) s = tostring(s or ""):lower(); return s:match(N.PAT.gmail_user) ~= nil or s:match(N.PAT.gmail_user2) ~= nil end
local function cfg_ok(c, p)
    if p == "discord" then return tostring(c.webhook or ""):match(N.PAT.discord) ~= nil end
    if p == "telegram" then local t = tab(c.tg); return tostring(t.token or ""):match(N.PAT.tg_token) ~= nil and tostring(t.chat or ""):match(N.PAT.tg_chat) ~= nil end
    if p == "gmail" then local t = tab(c.gmail); return N.gmail_addr(t.user) and tostring(t.pass or ""):gsub("%s", ""):match(N.PAT.gmail_pass) ~= nil and tostring(t.to or ""):match(N.PAT.email) ~= nil end
    if p == "slack" then return tostring(tab(c.slack).url or ""):match(N.PAT.slack) ~= nil end
    if p == "ha" then return tostring(tab(c.ha).url or ""):match(N.PAT.ha) ~= nil end
    return false
end
N.configured = cfg_ok
local function is_on(c, p)
    if p == "discord" then return c.discord_off ~= true end
    local t = c[({ telegram = "tg", gmail = "gmail", slack = "slack", ha = "ha" })[p]]
    return type(t) == "table" and t.on ~= false
end
N.is_on = is_on
--- providers that are set up and switched on
function N.active(c)
    local l = {}
    for _, p in ipairs(N.LIST) do if cfg_ok(c, p) and is_on(c, p) then l[#l + 1] = p end end
    return l
end
function N.any(c) return #N.active(c) > 0 end
local function hint(s) s = tostring(s or ""); return s ~= "" and ("…" .. s:sub(-4)) or "" end
--- for the page: what's set up, never the secrets
function N.status(c)
    local tg, gm, sl, ha = tab(c.tg), tab(c.gmail), tab(c.slack), tab(c.ha)
    local s = {
        discord = { hint = hint(c.webhook) },
        telegram = { hint = hint(tg.token), chat = tg.chat or "" },
        gmail = { user = gm.user or "", to = gm.to or "", has_pass = (gm.pass or "") ~= "" },
        slack = { hint = hint(sl.url) },
        ha = { hint = hint(ha.url), host = tostring(ha.url or ""):match("^(https?://[^/]+)") or "" },
    }
    for _, p in ipairs(N.LIST) do s[p].configured = cfg_ok(c, p); s[p].on = is_on(c, p) end
    return s
end

-- ---------------------------------------------------------------- message text for each provider
-- m = { title, description, color (Discord number), fields = {{name, value}}, footer = { text } }
local function plain(s)
    s = tostring(s or "")
    s = s:gsub("%[([^%]]+)%]%((https?://[^%)]+)%)", "%1 (%2)")   -- [text](url) -> text (url)
    s = s:gsub("%*%*", ""):gsub("`", ""):gsub("__", "")
    return s
end
local function body_plain(m)
    local t = { plain(m.description) }
    for _, f in ipairs(tab(m.fields)) do t[#t + 1] = plain(f.name) .. ": " .. plain(f.value) end
    return trim(table.concat(t, "\n"))
end
local function hexcolor(n) n = tonumber(n) or 689407; return string.format("#%06x", n) end
local function slack_text(s)
    s = tostring(s or ""):gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
    s = s:gsub("%[([^%]]+)%]%((https?://[^%)]+)%)", "<%2|%1>")
    s = s:gsub("%*%*(.-)%*%*", "*%1*")
    return s
end
local function cut(s, n) s = tostring(s or ""); if #s > n then return s:sub(1, n - 3) .. "..." end; return s end

-- base64 (Lua 5.1, no bit library needed)
local B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local function b64(s)
    return ((s:gsub(".", function(x)
        local r, b = "", x:byte()
        for i = 8, 1, -1 do r = r .. (b % 2 ^ i - b % 2 ^ (i - 1) > 0 and "1" or "0") end
        return r
    end) .. "0000"):gsub("%d%d%d?%d?%d?%d?", function(x)
        if #x < 6 then return "" end
        local c = 0
        for i = 1, 6 do c = c + (x:sub(i, i) == "1" and 2 ^ (6 - i) or 0) end
        return B64:sub(c + 1, c + 1)
    end) .. ({ "", "==", "=" })[#s % 3 + 1])
end
N.b64 = b64

-- ---------------------------------------------------------------- one provider's job (a shell line run in the background)
-- curl reads the URL, headers and body from a private config file, so nothing secret is on the command line.
local function curl_job(p, url, headers, body)
    local base = DIR .. "/nt_" .. p
    pwrite(base .. ".body", body)
    local cfg = { 'url = "' .. url:gsub('"', '') .. '"', "silent", "max-time = 15", 'output = "/dev/null"', 'write-out = "%{http_code}"',
        'data-binary = "@' .. base .. '.body"' }
    for _, h in ipairs(headers) do cfg[#cfg + 1] = 'header = "' .. h:gsub('"', '') .. '"' end
    pwrite(base .. ".cfg", table.concat(cfg, "\n") .. "\n")
    return "curl -K " .. base .. ".cfg > " .. base .. ".code 2>/dev/null"
end

--- the name alerts are signed with: Settings → Notification providers → Router name, else the host name (GL-MT5000)
function N.name(c)
    local n = trim(type(c) == "table" and c.router_name or "")
    if n == "" then n = trim(readf("/proc/sys/kernel/hostname") or "Router") end
    return n
end
local function job(c, p, m, host, name)
    local title, text = tostring(m.title or "Router Home"), body_plain(m)
    -- footers are built as "<host name> · Home tab": show the router name instead
    local footer = tostring((m.footer and m.footer.text) or (host .. " · Home tab"))
    if host ~= "" then local a, b = footer:find(host, 1, true); if a then footer = footer:sub(1, a - 1) .. name .. footer:sub(b + 1) end end
    if p == "discord" then
        local e = {}; for k, v in pairs(m) do e[k] = v end
        e.footer = { text = footer }
        return curl_job(p, c.webhook, { "Content-Type: application/json" }, cjson.encode({ username = cut(name, 80), embeds = { e } }))
    elseif p == "telegram" then
        local t = tab(c.tg)
        return curl_job(p, "https://api.telegram.org/bot" .. t.token .. "/sendMessage", { "Content-Type: application/json" },
            cjson.encode({ chat_id = tostring(t.chat), text = cut(name .. " · " .. title .. "\n\n" .. text .. "\n\n" .. footer, 4000), disable_web_page_preview = true }))
    elseif p == "slack" then
        return curl_job(p, tab(c.slack).url, { "Content-Type: application/json" }, cjson.encode({ text = cut(plain(title), 300),
            attachments = { { color = hexcolor(m.color), title = cut(slack_text(plain(title)), 300), text = cut(slack_text(m.description or "") ..
                (function() local t = {}; for _, f in ipairs(tab(m.fields)) do t[#t + 1] = "\n*" .. slack_text(f.name) .. ":* " .. slack_text(f.value) end; return table.concat(t) end)(), 3500),
                footer = footer, ts = os.time() } } }))
    elseif p == "ha" then
        local red = tonumber(m.color) == 16726832
        return curl_job(p, tab(c.ha).url, { "Content-Type: application/json" }, cjson.encode({ title = name .. ": " .. title, message = cut(text, 3900), router = name,
            color = hexcolor(m.color), level = red and "critical" or "normal", kind = m.kind or "alert" }))
    elseif p == "gmail" then
        -- SMTP over TLS to smtp.gmail.com:465 with OpenSSL (the router's curl has no mail support). The certificate
        -- is verified (CA bundle + host name). The session is written to private files and fed with pauses.
        local g = tab(c.gmail)
        local base = DIR .. "/nt_gmail"
        local pass = tostring(g.pass):gsub("%s", "")
        local function crlf(s) return (tostring(s):gsub("\r?\n", "\r\n")) end
        local bodytxt = crlf(text .. "\n\n-- \n" .. footer .. "\nSent by Router Home. Change or turn off these emails in the Home tab: Settings > Notification providers.")
        bodytxt = bodytxt:gsub("\r\n%.", "\r\n.."):gsub("^%.", "..")
        local fromname = "=?UTF-8?B?" .. b64(name) .. "?="
        pwrite(base .. ".1", "EHLO router\r\n")
        pwrite(base .. ".2", "AUTH PLAIN " .. b64("\0" .. g.user .. "\0" .. pass) .. "\r\n")
        pwrite(base .. ".3", "MAIL FROM:<" .. g.user .. "> BODY=8BITMIME\r\nRCPT TO:<" .. g.to .. ">\r\nDATA\r\n")
        pwrite(base .. ".4", "From: " .. fromname .. " <" .. g.user .. ">\r\nTo: <" .. g.to .. ">\r\nSubject: =?UTF-8?B?" .. b64(cut(name .. ": " .. plain(title), 180)) .. "?=\r\n" ..
            "Date: " .. os.date("!%a, %d %b %Y %H:%M:%S +0000") .. "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n" ..
            bodytxt .. "\r\n.\r\n")
        return "( sleep 1; cat " .. base .. ".1; sleep 1; cat " .. base .. ".2; sleep 2; cat " .. base .. ".3; sleep 1; cat " .. base .. ".4; sleep 2; printf 'QUIT\\r\\n'; sleep 1 ) | " ..
            "openssl s_client -connect smtp.gmail.com:465 -quiet -verify_return_error -verify_hostname smtp.gmail.com -CAfile " .. CA .. " > " .. base .. ".out 2>&1"
    end
end

local function result(p)
    local base = DIR .. "/nt_" .. p
    local code
    if p == "gmail" then
        local out = readf(base .. ".out") or ""
        if out:find("\n250 2%.0%.0 OK") then code = "250"
        elseif out:find("\n535") or out:find("\n534") then code = "auth"
        elseif out:find("verify error") or out:find("errno") and not out:find("\n220 ") then code = "tls"
        else code = (out:match("\n(5%d%d)") or out:match("\n(4%d%d)") or "no answer") end
    else code = trim(readf(base .. ".code") or "") end
    os.execute("rm -f " .. base .. ".*")
    local ok = (p == "gmail" and code == "250") or (p ~= "gmail" and code:match("^2%d%d$") ~= nil)
    return ok, (code ~= "" and code or "no answer")
end

--- send one message. only = { "telegram" } to send to some providers only; force = ignore the "Send alerts"
--- master switch and each provider's on/off (tests). Returns ok (true = every provider took it, false = at least
--- one failed, nil = nothing to send), res = { provider = { ok, code } }, failed = { provider, ... }.
function N.send(c, m, only, force)
    c = type(c) == "table" and c or {}
    if not force and c.enabled ~= true then return nil, {}, {} end
    local list = {}
    if type(only) == "table" then for _, p in ipairs(only) do if cfg_ok(c, p) and (force or is_on(c, p)) then list[#list + 1] = p end end
    else list = N.active(c) end
    if #list == 0 then return nil, {}, {} end
    os.execute("mkdir -p " .. DIR)
    local host = trim(readf("/proc/sys/kernel/hostname") or "Router")
    local name = N.name(c)
    local lines = {}
    for _, p in ipairs(list) do local ok, j = pcall(job, c, p, m, host, name); if ok and j then lines[#lines + 1] = j .. " &" end end
    sh(table.concat(lines, "\n") .. "\nwait")
    local res, failed = {}, {}
    for _, p in ipairs(list) do local ok, code = result(p); res[p] = { ok = ok, code = code }; if not ok then failed[#failed + 1] = p end end
    return #failed == 0, res, failed
end

--- plain-words reason for a failed test
function N.why(p, code)
    code = tostring(code or "")
    if code == "no answer" or code == "000" then return "No answer (is the router online? For Home Assistant: is the address reachable from the router?)" end
    if p == "gmail" then
        if code == "auth" then return "Gmail refused the login. Check the address and the 16-letter app password (not your normal password)." end
        if code == "tls" then return "Couldn't make a secure connection to Gmail." end
        return "Gmail didn't accept the message (" .. code .. ")."
    end
    if p == "telegram" and (code == "400" or code == "403") then return "Telegram refused it (" .. code .. "). Press Start in your bot's chat first, and check the chat ID." end
    if p == "telegram" and (code == "401" or code == "404") then return "Telegram doesn't know that bot token (" .. code .. ")." end
    if p == "ha" and code == "404" then return "Home Assistant has no automation with that webhook ID (404)." end
    if (p == "slack" or p == "discord") and (code == "404" or code == "403" or code == "410") then return "The webhook URL doesn't work any more (" .. code .. "). Make a new one." end
    return "Not accepted (HTTP " .. code .. ")."
end

--- Telegram helper: the chats that have messaged this bot recently (for "Find my chat ID")
function N.tg_chats(token)
    if not tostring(token or ""):match(N.PAT.tg_token) then return nil, "That doesn't look like a bot token (123456789:AA…)" end
    os.execute("mkdir -p " .. DIR)
    pwrite(DIR .. "/nt_tgq.cfg", 'url = "https://api.telegram.org/bot' .. token .. '/getUpdates?limit=50"\nsilent\nmax-time = 15\n')
    local out = sh("curl -K " .. DIR .. "/nt_tgq.cfg")
    os.remove(DIR .. "/nt_tgq.cfg")
    local ok, v = pcall(cjson.decode, out)
    if not ok or type(v) ~= "table" then return nil, "Telegram didn't answer" end
    if v.ok ~= true then return nil, "Telegram refused the token" .. (v.error_code and (" (" .. v.error_code .. ")") or "") end
    local seen, list = {}, {}
    for _, u in ipairs(tab(v.result)) do
        local msg = u.message or u.channel_post or u.edited_message or u.my_chat_member
        local ch = type(msg) == "table" and msg.chat or nil
        if type(ch) == "table" and ch.id and not seen[ch.id] then
            seen[ch.id] = true
            local name = ch.title or trim((ch.first_name or "") .. " " .. (ch.last_name or ""))
            if name == "" then name = ch.username or "chat" end
            list[#list + 1] = { id = string.format("%.0f", ch.id), name = name, type = ch.type or "" }
        end
    end
    return list
end

return N
