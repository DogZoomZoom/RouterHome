-- machome weather: Open-Meteo (no account) + optional touchscreen sleep-wallpaper (GL screen models).
-- Wallpaper: 320x240, dark gradient with the weather on the left; GL's gl_screen draws its own clock on top.
local cjson = require "cjson"
local okbit, bit = pcall(require, "bit")
local W = {}

local DIR, EDIR = "/tmp/machome", "/etc/machome"
W.CFG, W.DATA = EDIR .. "/weather.json", DIR .. "/weather.json"
local ATLAS = "/usr/lib/machome/weather_atlas.bin"

local function readf(p) local f = io.open(p, "rb"); if not f then return nil end; local s = f:read("*a"); f:close(); return s end
local function writef(p, s) local t = p .. ".tmp"; local f = io.open(t, "wb"); if not f then return end; f:write(s); f:close(); os.rename(t, p) end
local function sh(c) local p = io.popen(c .. " 2>/dev/null"); if not p then return "" end; local s = p:read("*a") or ""; p:close(); return s end
local function jget(url) local ok, v = pcall(cjson.decode, sh("curl -s -m 12 '" .. url .. "'")); return ok and type(v) == "table" and v or nil end

function W.load_cfg() local s = readf(W.CFG); local ok, v = pcall(cjson.decode, s or ""); return (ok and type(v) == "table") and v or {} end
function W.save_cfg(c) os.execute("mkdir -p " .. EDIR); writef(W.CFG, cjson.encode(c)) end

-- ---------------------------------------------------------------- data
-- Location (2.6.7: worldwide, users asked): a 5-digit US ZIP code (as before), or a place anywhere: "London",
-- "London, GB", "London, Canada", "Springfield, IL", "75001, FR". Open-Meteo's geocoding finds city names everywhere;
-- postal codes outside the US work only in some countries, so the error suggests the city name.
local function urlenc(s) return (tostring(s):gsub("[^%w%-%._~]", function(ch) return string.format("%%%02X", ch:byte()) end)) end
local function geo(name, cc) local r = jget("https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&name=" .. urlenc(name) .. (cc and ("&countryCode=" .. cc) or "")); return (r and type(r.results) == "table") and r.results or {} end
function W.geocode(q)
    q = tostring(q or ""):gsub("^%s+", ""):gsub("%s+$", "")
    if q == "" or #q > 80 or q:find("[%c<>\"'`;|&$\\]") then return nil, "Enter a US ZIP code or a city, e.g. London or London, GB" end
    local g
    if q:match("^%d%d%d%d%d$") then
        g = geo(q, "US")[1]
        if not g then return nil, "Couldn't find ZIP " .. q .. ". Outside the US, enter your city (e.g. Paris, FR)" end
    else
        local name, where = q:match("^(.-)%s*,%s*([^,]-)%s*$")
        if not name or name == "" then name, where = q, nil end
        local lw = where and where:lower() or nil
        -- US state abbreviations ("Springfield, IL"): Open-Meteo only returns the full state name
        local ST = { al = "alabama", ak = "alaska", az = "arizona", ar = "arkansas", ca = "california", co = "colorado", ct = "connecticut", de = "delaware", dc = "district of columbia",
            fl = "florida", ga = "georgia", hi = "hawaii", id = "idaho", il = "illinois", ["in"] = "indiana", ia = "iowa", ks = "kansas", ky = "kentucky", la = "louisiana", me = "maine",
            md = "maryland", ma = "massachusetts", mi = "michigan", mn = "minnesota", ms = "mississippi", mo = "missouri", mt = "montana", ne = "nebraska", nv = "nevada", nh = "new hampshire",
            nj = "new jersey", nm = "new mexico", ny = "new york", nc = "north carolina", nd = "north dakota", oh = "ohio", ok = "oklahoma", ["or"] = "oregon", pa = "pennsylvania", ri = "rhode island",
            sc = "south carolina", sd = "south dakota", tn = "tennessee", tx = "texas", ut = "utah", vt = "vermont", va = "virginia", wa = "washington", wv = "west virginia", wi = "wisconsin", wy = "wyoming", pr = "puerto rico" }
        local function fits(x) return lw == nil or tostring(x.country_code or ""):lower() == lw or tostring(x.country or ""):lower() == lw
            or tostring(x.admin1 or ""):lower() == lw or tostring(x.admin1_code or ""):lower() == lw
            or (ST[lw] ~= nil and x.country_code == "US" and tostring(x.admin1 or ""):lower() == ST[lw]) end
        if where and where:match("^%a%a$") then g = geo(name, where:upper())[1] end            -- "London, GB"
        if not g then for _, x in ipairs(geo(name)) do if fits(x) then g = x; break end end end -- "London, Canada" / "Springfield, IL"
        if not g then return nil, "Couldn't find \"" .. q .. "\". Try the city name, e.g. London or London, GB" end
    end
    local cc = tostring(g.country_code or "")
    local place = g.name .. ((g.admin1 and g.admin1 ~= g.name) and (", " .. ((cc == "US" and g.admin1_code) or g.admin1)) or "") .. ((cc ~= "" and cc ~= "US") and (", " .. cc) or "")
    return { zip = q, place = place, lat = g.latitude, lon = g.longitude, cc = cc }
end
-- temperature unit (2.6.7): Control Center → Temperature unit, /etc/machome/prefs.json; °F by default
function W.unit() local ok, p = pcall(cjson.decode, readf(EDIR .. "/prefs.json") or ""); return (ok and type(p) == "table" and p.temp_unit == "C") and "C" or "F" end

local CODES = {
    [0] = { "Clear", 1 }, [1] = { "Mostly clear", 4 }, [2] = { "Partly cloudy", 4 }, [3] = { "Cloudy", 3 },
    [45] = { "Fog", 9 }, [48] = { "Fog", 9 }, [51] = { "Drizzle", 6 }, [53] = { "Drizzle", 6 }, [55] = { "Drizzle", 6 },
    [56] = { "Freezing drizzle", 6 }, [57] = { "Freezing drizzle", 6 }, [61] = { "Light rain", 6 }, [63] = { "Rain", 6 }, [65] = { "Heavy rain", 6 },
    [66] = { "Freezing rain", 6 }, [67] = { "Freezing rain", 6 }, [71] = { "Light snow", 7 }, [73] = { "Snow", 7 }, [75] = { "Heavy snow", 7 },
    [77] = { "Snow grains", 7 }, [80] = { "Showers", 6 }, [81] = { "Showers", 6 }, [82] = { "Heavy showers", 6 }, [85] = { "Snow showers", 7 },
    [86] = { "Snow showers", 7 }, [95] = { "Thunderstorms", 8 }, [96] = { "Thunderstorms", 8 }, [99] = { "Thunderstorms", 8 } }
local function cond(code, day)
    local c = CODES[code] or { "—", 3 }
    local icon = c[2]
    if day == 0 then if icon == 1 then icon = 2 elseif icon == 4 then icon = 5 end end
    return c[1], icon
end
W.cond = cond

function W.fetch(c)
    if not (c and c.lat and c.lon) then return nil end
    local U = W.unit()
    local r = jget(string.format("https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m" ..
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=%s&wind_speed_unit=%s&timezone=auto&forecast_days=4", c.lat, c.lon,
        U == "C" and "celsius" or "fahrenheit", U == "C" and "kmh" or "mph"))
    if not (r and r.current and r.daily) then return nil end
    local cur, d = r.current, r.daily
    local text, icon = cond(cur.weather_code, cur.is_day)
    local days = {}
    for i = 1, #(d.time or {}) do
        local t = cond(d.weather_code[i], 1)
        local _, ic = cond(d.weather_code[i], 1)
        days[#days + 1] = { date = d.time[i], hi = d.temperature_2m_max[i], lo = d.temperature_2m_min[i], cond = t, icon = ic, rain = d.precipitation_probability_max and d.precipitation_probability_max[i] or cjson.null }
    end
    return { time = os.time(), place = c.place, zip = c.zip, unit = U, wind_unit = U == "C" and "km/h" or "mph", temp = cur.temperature_2m, feels = cur.apparent_temperature, humidity = cur.relative_humidity_2m,
        wind = cur.wind_speed_10m, code = cur.weather_code, is_day = cur.is_day, cond = text, icon = icon,
        hi = days[1] and days[1].hi, lo = days[1] and days[1].lo, days = days }
end

-- ---------------------------------------------------------------- tiny renderer
local SW, SH = 320, 240
local glyphs, icons = nil, nil
local function load_atlas()
    if glyphs then return true end
    local s = readf(ATLAS); if not s or s:sub(1, 4) ~= "WXA1" then return false end
    glyphs, icons = { {}, {}, {} }, {}
    local p = 5
    while p <= #s do
        local t = s:byte(p); p = p + 1
        if t == 1 then
            local f, lo, hi, w, h, xo, yo, adv = s:byte(p, p + 7)
            local code = lo + hi * 256
            if xo > 127 then xo = xo - 256 end; if yo > 127 then yo = yo - 256 end
            p = p + 8
            glyphs[f][code] = { w = w, h = h, xo = xo, yo = yo, adv = adv, d = s:sub(p, p + w * h - 1) }
            p = p + w * h
        elseif t == 2 then
            local id, w, h = s:byte(p, p + 2); p = p + 3
            icons[id] = { w = w, h = h, d = s:sub(p, p + w * h * 4 - 1) }; p = p + w * h * 4
        else break end
    end
    return true
end

local buf
local function canvas(day)
    buf = {}
    for y = 0, SH - 1 do
        local t = y / (SH - 1)
        for x = 0, SW - 1 do
            local u = x / (SW - 1)
            local i = (y * SW + x) * 3
            if day then   -- daytime sky: deep blue at the top, lighter toward the horizon (white text stays readable)
                buf[i + 1] = math.floor(24 + 46 * t + 8 * u); buf[i + 2] = math.floor(70 + 62 * t + 6 * u); buf[i + 3] = math.floor(150 + 60 * t)
            else
                buf[i + 1] = math.floor(14 + 28 * t + 10 * (1 - u))
                buf[i + 2] = math.floor(22 + 6 * t)
                buf[i + 3] = math.floor(52 + 30 * t + 12 * u)
            end
        end
    end
end
local function disc(cx, cy, r, cr, cg, cb, alpha, cut_x, cut_y, cut_r)   -- anti-aliased filled circle, optional "bite" (moon)
    for y = math.floor(cy - r - 1), math.ceil(cy + r + 1) do
        for x = math.floor(cx - r - 1), math.ceil(cx + r + 1) do
            local d = math.sqrt((x - cx) ^ 2 + (y - cy) ^ 2)
            local a = math.max(0, math.min(1, r - d + 0.5))
            if a > 0 and cut_r then local dc = math.sqrt((x - cut_x) ^ 2 + (y - cut_y) ^ 2); a = a * math.max(0, math.min(1, dc - cut_r + 0.5)) end
            if a > 0 then
                local i = (y * SW + x) * 3
                if x >= 0 and y >= 0 and x < SW and y < SH then
                    local ia = 1 - a * alpha
                    buf[i + 1] = math.floor(buf[i + 1] * ia + cr * a * alpha); buf[i + 2] = math.floor(buf[i + 2] * ia + cg * a * alpha); buf[i + 3] = math.floor(buf[i + 3] * ia + cb * a * alpha)
                end
            end
        end
    end
end
local function glow(cx, cy, r0, r1, cr, cg, cb, peak)   -- soft halo from r0 (peak) fading to 0 at r1
    for y = math.max(0, math.floor(cy - r1)), math.min(SH - 1, math.ceil(cy + r1)) do
        for x = math.max(0, math.floor(cx - r1)), math.min(SW - 1, math.ceil(cx + r1)) do
            local d = math.sqrt((x - cx) ^ 2 + (y - cy) ^ 2)
            if d < r1 then
                local a = peak * (d <= r0 and 1 or (1 - (d - r0) / (r1 - r0)) ^ 2)
                local i = (y * SW + x) * 3
                buf[i + 1] = math.floor(buf[i + 1] * (1 - a) + cr * a); buf[i + 2] = math.floor(buf[i + 2] * (1 - a) + cg * a); buf[i + 3] = math.floor(buf[i + 3] * (1 - a) + cb * a)
            end
        end
    end
end
--- Sky scene used when the radar has no rain nearby: sun by day, crescent moon + stars at night (top-right corner).
local function sky(day)
    canvas(day)
    if day then
        glow(286, 36, 22, 92, 255, 214, 120, 0.45)
        disc(286, 36, 22, 255, 222, 110, 1)
        disc(281, 31, 9, 255, 245, 200, 0.45)
    else
        local seed = 12345
        local function rnd(n) seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n end
        for _ = 1, 46 do
            local x, y, b = rnd(SW), rnd(150), 0.35 + rnd(60) / 100
            if not (x < 200 and y > 18 and y < 92) then disc(x, y, rnd(10) < 2 and 1.2 or 0.7, 255, 255, 240, b) end   -- keep the weather text area clear
        end
        glow(282, 38, 18, 70, 200, 210, 255, 0.22)
        disc(282, 38, 19, 244, 238, 214, 1, 291, 31, 16)
    end
end

-- ---------------------------------------------------------------- radar background
-- Iowa State University's IEM map service (NWS NEXRAD composite, public data). Two images of the same area:
-- the map alone (cached per location in /tmp) and the map with radar; pixels that differ are radar echoes.
-- Runs as a background job ("lua weather.lua radar") so the sampler never waits on the download.
local RW, RH, RCROP = 320, 300, 60          -- IEM draws a title/legend banner + logo in the top ~58 px; it is cut off
W.BG, W.BGMETA = DIR .. "/wx_bg.rgb", DIR .. "/wx_bg.json"
local BASE, BASEKEY = DIR .. "/wx_base.rgb", DIR .. "/wx_base.key"
local function u32be(s, p) return s:byte(p) * 16777216 + s:byte(p + 1) * 65536 + s:byte(p + 2) * 256 + s:byte(p + 3) end
local function paeth(a, b, c) local p = a + b - c; local pa, pb, pc = math.abs(p - a), math.abs(p - b), math.abs(p - c); if pa <= pb and pa <= pc then return a elseif pb <= pc then return b end; return c end
--- Decodes an 8-bit RGB, non-interlaced PNG; returns a table of RGB row strings (rows 1..h) or nil.
local function png_rows(s)
    if not s or s:sub(1, 8) ~= "\137PNG\r\n\26\n" then return nil end
    local p, idat, w, h = 9, {}, 0, 0
    while p + 8 <= #s do
        local n, t = u32be(s, p), s:sub(p + 4, p + 7)
        if t == "IHDR" then
            w, h = u32be(s, p + 8), u32be(s, p + 12)
            if s:byte(p + 16) ~= 8 or s:byte(p + 17) ~= 2 or s:byte(p + 20) ~= 0 then return nil end
        elseif t == "IDAT" then idat[#idat + 1] = s:sub(p + 8, p + 7 + n) end
        p = p + 12 + n
    end
    local z = table.concat(idat); if #z < 8 or w ~= RW or h ~= RH then return nil end
    -- zlib -> gzip wrapper; busybox gunzip inflates it fully and then complains about the (unknown) CRC, which is fine
    writef(DIR .. "/wx_in.gz", "\31\139\8\0\0\0\0\0\0\255" .. z:sub(3, #z - 4) .. "\0\0\0\0\0\0\0\0")
    os.execute("gunzip -c " .. DIR .. "/wx_in.gz > " .. DIR .. "/wx_in.raw 2>/dev/null")
    local raw = readf(DIR .. "/wx_in.raw"); os.remove(DIR .. "/wx_in.gz"); os.remove(DIR .. "/wx_in.raw")
    local stride = w * 3
    if not raw or #raw ~= h * (stride + 1) then return nil end
    local rows, prev = {}, {}
    for i = 1, stride do prev[i] = 0 end
    for y = 0, h - 1 do
        local o, f, cur = y * (stride + 1) + 1, nil, {}
        f = raw:byte(o)
        for i = 1, stride do
            local x = raw:byte(o + i)
            local a = i > 3 and cur[i - 3] or 0
            local b = prev[i]
            if f == 1 then x = x + a elseif f == 2 then x = x + b elseif f == 3 then x = x + math.floor((a + b) / 2)
            elseif f == 4 then x = x + paeth(a, b, i > 3 and prev[i - 3] or 0) end
            cur[i] = x % 256
        end
        rows[y + 1] = string.char(unpack(cur)); prev = cur
    end
    return rows
end
local function iem(c, radar)
    local lat, lon = tonumber(c.lat), tonumber(c.lon)
    local lonspan = 3.6
    local latspan = lonspan * RH / RW * math.cos(math.rad(lat))
    local clat = lat + latspan * (RCROP / 2) / RH          -- keep home centered in the part that is shown
    local bbox = string.format("%.3f,%.3f,%.3f,%.3f", lon - lonspan / 2, clat - latspan / 2, lon + lonspan / 2, clat + latspan / 2)
    local url = "https://mesonet.agron.iastate.edu/GIS/radmap.php?width=" .. RW .. "&height=" .. RH .. "&bbox=" .. bbox ..
        (radar and "&layers[]=nexrad" or "") .. "&layers[]=uscounties&layers[]=interstates"
    local f = DIR .. "/wx_dl.png"
    os.execute("curl -s -f -m 25 -o " .. f .. " '" .. url .. "' 2>/dev/null")
    local s = readf(f); os.remove(f)
    return png_rows(s), bbox
end
--- Background job: builds the darkened map + radar background (320x240 RGB) and its meta file.
function W.radar_job()
    local c = W.load_cfg(); if not c.lat then return end
    local lock = DIR .. "/wx_radar.lock"
    local lt = tonumber(readf(lock) or "") or 0
    if os.time() - lt < 180 then return end
    writef(lock, tostring(os.time()))
    local function done() os.remove(lock) end
    local rrows, bbox = iem(c, true)
    if not rrows then return done() end
    local base = readf(BASE)
    if not base or #base ~= RW * (RH - RCROP) * 3 or (readf(BASEKEY) or "") ~= bbox then
        local brows = iem(c, false); if not brows then return done() end
        local t = {}; for y = RCROP + 1, RH do t[#t + 1] = brows[y] end
        base = table.concat(t); writef(BASE, base); writef(BASEKEY, bbox)
    end
    local out, n, rain, sum = {}, 0, 0, 0
    for y = 0, SH - 1 do
        local rr, row = rrows[RCROP + 1 + y], {}
        local bo = y * RW * 3
        for x = 0, SW - 1 do
            local k = x * 3
            local br, bg, bb = base:byte(bo + k + 1, bo + k + 3)
            local r, g, b = rr:byte(k + 1, k + 3)
            -- darkened map, slightly blue-tinted
            local R, G, B = br * 0.30 + 6, bg * 0.32 + 10, bb * 0.36 + 22
            if math.abs(r - br) + math.abs(g - bg) + math.abs(b - bb) > 40 then   -- radar echo
                n = n + 1; sum = (sum + x * 7 + y * 13 + r + g + b) % 1000000007
                local real = (g > b + 30) or r > 150                          -- green and up = real precipitation
                if real then rain = rain + 1 end
                local a = real and 0.95 or 0.55                               -- light clutter stays faint
                R, G, B = R * (1 - a) + r * a, G * (1 - a) + g * a, B * (1 - a) + b * a
            end
            row[k + 1], row[k + 2], row[k + 3] = math.floor(R), math.floor(G), math.floor(B)
        end
        out[y + 1] = string.char(unpack(row))
    end
    writef(W.BG, table.concat(out))
    writef(W.BGMETA, cjson.encode({ t = os.time(), n = n, rain = rain, stamp = n .. "-" .. sum }))
    done()
end
--- Latest radar result, or nil when missing / older than 45 minutes.
function W.radar_meta()
    local s = readf(W.BGMETA); local ok, m = pcall(cjson.decode, s or "")
    if not ok or type(m) ~= "table" or not m.t or os.time() - m.t > 2700 then return nil end
    return m
end
W.RAIN_MIN = 300   -- fewer rain pixels than this (~0.4% of the map) = "no rain nearby" -> sun / moon scene
local function radar_canvas()
    local s = readf(W.BG); if not s or #s ~= SW * SH * 3 then return false end
    buf = {}
    for i = 1, #s do buf[i] = s:byte(i) end
    -- darker band behind the weather text (top-left) and the "Tomorrow" line (bottom) so they stay readable
    for y = 0, SH - 1 do
        for x = 0, SW - 1 do
            local a = 0
            if y < 98 then a = math.max(0, 0.6 * (1 - x / 230)) end
            if y >= 206 then a = math.max(a, 0.5) end
            if a > 0 then local i = (y * SW + x) * 3; buf[i + 1] = math.floor(buf[i + 1] * (1 - a)); buf[i + 2] = math.floor(buf[i + 2] * (1 - a)); buf[i + 3] = math.floor(buf[i + 3] * (1 - a) + 8 * a) end
        end
    end
    return true
end
local function blend(x, y, r, g, b, a)
    if x < 0 or y < 0 or x >= SW or y >= SH or a <= 0 then return end
    local i = (y * SW + x) * 3
    local ia = 1 - a
    buf[i + 1] = math.floor(buf[i + 1] * ia + r * a); buf[i + 2] = math.floor(buf[i + 2] * ia + g * a); buf[i + 3] = math.floor(buf[i + 3] * ia + b * a)
end
local function codes(s)
    local out, i = {}, 1
    while i <= #s do
        local c = s:byte(i)
        if c == 0xC2 and i < #s then out[#out + 1] = s:byte(i + 1); i = i + 2 else out[#out + 1] = c; i = i + 1 end
    end
    return out
end
local function text_w(f, s) local w = 0; for _, c in ipairs(codes(s)) do local g = glyphs[f][c]; if g then w = w + g.adv end end; return w end
local function text(f, s, x, base, r, g, b, op, maxx)
    op = op or 1
    for _, c in ipairs(codes(s)) do
        local gl = glyphs[f][c]
        if gl then
            if maxx and x + gl.adv > maxx then return x end
            for yy = 0, gl.h - 1 do
                for xx = 0, gl.w - 1 do
                    local a = gl.d:byte(yy * gl.w + xx + 1)
                    if a > 0 then blend(x + gl.xo + xx, base + gl.yo + yy, r, g, b, a / 255 * op) end
                end
            end
            x = x + gl.adv
        end
    end
    return x
end
local function icon(id, x, y)
    local ic = icons[id]; if not ic then return end
    for yy = 0, ic.h - 1 do
        for xx = 0, ic.w - 1 do
            local k = (yy * ic.w + xx) * 4
            local r, g, b, a = ic.d:byte(k + 1, k + 4)
            if a > 0 then blend(x + xx, y + yy, r, g, b, a / 255) end
        end
    end
end

-- ---------------------------------------------------------------- PNG (zlib via busybox gzip, CRC via LuaBitOp)
local crct
local function crc32(s)
    if not crct then crct = {}; for n = 0, 255 do local c = n; for _ = 1, 8 do if bit.band(c, 1) ~= 0 then c = bit.bxor(0xEDB88320, bit.rshift(c, 1)) else c = bit.rshift(c, 1) end end; crct[n] = c end end
    local c = 0xFFFFFFFF
    for i = 1, #s do c = bit.bxor(crct[bit.band(bit.bxor(c, s:byte(i)), 0xFF)], bit.rshift(c, 8)) end
    return bit.bxor(c, 0xFFFFFFFF)
end
local function u32(n) n = n % 4294967296; return string.char(math.floor(n / 16777216) % 256, math.floor(n / 65536) % 256, math.floor(n / 256) % 256, n % 256) end
local function chunk(t, d) return u32(#d) .. t .. d .. u32(crc32(t .. d)) end
local function png()
    local rows = {}
    for y = 0, SH - 1 do
        local row = { 0 }
        local base = y * SW * 3
        for i = 1, SW * 3 do row[i + 1] = buf[base + i] end
        rows[#rows + 1] = string.char(unpack(row))
    end
    local raw = table.concat(rows)
    local a, b = 1, 0
    for i = 1, #raw do a = (a + raw:byte(i)) % 65521; b = (b + a) % 65521 end
    writef(DIR .. "/wx_raw.bin", raw)
    os.execute("gzip -c -6 " .. DIR .. "/wx_raw.bin > " .. DIR .. "/wx_raw.gz")
    local gz = readf(DIR .. "/wx_raw.gz") or ""
    os.remove(DIR .. "/wx_raw.bin"); os.remove(DIR .. "/wx_raw.gz")
    if #gz < 20 then return nil end
    local flg, hs = gz:byte(4), 11
    if bit.band(flg, 4) ~= 0 then hs = hs + 2 + gz:byte(11) + gz:byte(12) * 256 end
    if bit.band(flg, 8) ~= 0 then hs = gz:find("\0", hs, true) + 1 end
    local deflate = gz:sub(hs, #gz - 8)
    local z = "\120\156" .. deflate .. u32(b * 65536 + a)
    return "\137PNG\r\n\26\n" .. chunk("IHDR", u32(SW) .. u32(SH) .. "\8\2\0\0\0") .. chunk("IDAT", z) .. chunk("IEND", "")
end
local B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local function b64(s)
    local out = {}
    for i = 1, #s, 3 do
        local a, b2, c = s:byte(i, i + 2)
        local n = a * 65536 + (b2 or 0) * 256 + (c or 0)
        local c1, c2, c3, c4 = math.floor(n / 262144) % 64, math.floor(n / 4096) % 64, math.floor(n / 64) % 64, n % 64
        out[#out + 1] = B64:sub(c1 + 1, c1 + 1) .. B64:sub(c2 + 1, c2 + 1) .. (b2 and B64:sub(c3 + 1, c3 + 1) or "=") .. (c and B64:sub(c4 + 1, c4 + 1) or "=")
    end
    return table.concat(out)
end

local function r0(v) return v and math.floor(v + 0.5) or nil end

--- Which background to draw: "radar" (rain nearby), "sky" (radar on, no rain / no data) or nil (classic gradient).
function W.bg_mode(c)
    if c.radar == false then return nil end
    local m = W.radar_meta()
    if m and (m.rain or 0) >= W.RAIN_MIN then return "radar", m.stamp end
    return "sky", nil
end
--- Renders the sleep wallpaper; returns PNG bytes. mode = W.bg_mode() result.
function W.render(d, mode)
    if not okbit or not load_atlas() then return nil, "renderer unavailable" end
    if mode == "radar" then if not radar_canvas() then sky(d.is_day ~= 0) end
    elseif mode == "sky" then sky(d.is_day ~= 0)
    else canvas() end
    icon(d.icon or 3, 10, 26)
    local t = (r0(d.temp) or "--") .. "°"
    local tx = text(1, t, 54, 60, 255, 255, 255, 1)
    local hl = "H " .. (r0(d.hi) or "--") .. "°  L " .. (r0(d.lo) or "--") .. "°"
    text(3, hl, tx + 8, 44, 200, 206, 222, 1, 176)
    text(3, (d.place or ""):gsub(",.*", ""), tx + 8, 59, 160, 168, 190, 1, 176)
    text(2, d.cond or "", 13, 79, 235, 238, 246, 1, 178)
    local tm = d.days and d.days[2]
    if tm then text(3, "Tomorrow · " .. tm.cond .. " · " .. r0(tm.hi) .. "°/" .. r0(tm.lo) .. "°", 13, 226, 190, 196, 214, 0.95, 315) end
    return png()
end

local function screen_call(params)
    local body = cjson.encode({ jsonrpc = "2.0", id = 1, method = "call", params = { "", "screen", "set_config", params } })
    writef(DIR .. "/wx_body.json", body)
    local out = sh("curl -s -m 30 -H 'glinet: 1' -H 'Content-Type: application/json' --data-binary @" .. DIR .. "/wx_body.json http://127.0.0.1/rpc")
    os.remove(DIR .. "/wx_body.json")
    return out:find('"error"') == nil, out
end

--- Uploads the wallpaper as the screen's sleep (wake display) image; returns ok, detail.
function W.upload(pngbytes)
    return screen_call({ wallpaper_pair = false, wallpaper_wake_display_image = b64(pngbytes) })
end
function W.restore_screen() return screen_call({ wallpaper_pair = true }) end

--- Key for "did the visible content change?"
function W.screen_key(d, mode, stamp)
    local tm = d.days and d.days[2] or {}
    return table.concat({ r0(d.temp) or "", d.cond or "", d.icon or "", r0(d.hi) or "", r0(d.lo) or "", d.place or "", tm.cond or "", r0(tm.hi) or "", r0(tm.lo) or "",
        mode or "", mode == "radar" and (stamp or "") or (mode == "sky" and tostring(d.is_day) or "") }, "|")
end

-- run as a background job: lua /usr/lib/machome/weather.lua radar
if type(arg) == "table" and arg[1] == "radar" and tostring(arg[0] or ""):match("weather%.lua$") then pcall(W.radar_job) end

return W
