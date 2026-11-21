-- /usr/share/gl-validator.d/machome.lua
-- GL's RPC layer only allows [A-Za-z0-9 .-_:#/] in string params by default.
-- Login fields for the NAS need any printable character (they are written to a
-- root-only curl config file, never to a shell command line).
local function cred(v) return type(v) == "string" and #v <= 256 and not v:find("%c") end
local function folder(v) return type(v) == "string" and #v <= 256 and not v:find("[%c'\"`$;|&<>\\]") end
return {
    set_nas_adguard = { user = cred, pass = cred },
    set_nas_backup = { user = cred, pass = cred, path = folder },
    -- cable gateway admin password (kept root-only in /etc/machome/modem.json, sent as a POST body from a file)
    modem_set = { pass = cred },
    -- device name shown in "is offline" alerts
    devwatch_set = { name = function(v) return type(v) == "string" and #v <= 40 and not v:find("[%c<>\"`$\\]") end },
    -- device / person names (e.g. "user's iPhone"); life.lua strips anything unsafe again
    life = { name = function(v) return type(v) == "string" and #v <= 40 and not v:find("[%c<>\"`$\\]") end,
             person = function(v) return type(v) == "string" and #v <= 24 and not v:find("[%c<>\"`$\\]") end },
}
