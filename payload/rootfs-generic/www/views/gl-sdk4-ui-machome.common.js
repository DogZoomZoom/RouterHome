module.exports=(function(){
"use strict";

var CSS = [
"#machome{--mh-font:-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Helvetica Neue','Segoe UI Variable','Segoe UI',system-ui,sans-serif;font-family:var(--mh-font);-webkit-font-smoothing:antialiased;color:var(--mh-text);font-size:13px;line-height:1.4;",
"--mh-text:#1d1d1f;--mh-text2:#6e6e73;--mh-text3:#8e8e93;--mh-glass:rgba(255,255,255,.66);--mh-glass-b:rgba(255,255,255,.75);--mh-sep:rgba(0,0,0,.08);--mh-track:rgba(0,0,0,.08);--mh-bar:rgba(255,255,255,.5);--mh-row:rgba(0,0,0,.035);--mh-sheet:rgba(248,248,250,.97);",
"--mh-blue:#007aff;--mh-green:#28a745;--mh-yellow:#e6a700;--mh-orange:#ff9500;--mh-red:#ff3b30;--mh-purple:#af52de;--mh-teal:#30b0c7;--mh-shadow:0 12px 40px rgba(31,38,80,.16),0 0 0 .5px rgba(0,0,0,.06);",
"--mh-wall:radial-gradient(1100px 620px at 8% -8%,#ffd6b0 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,#a9c8ff 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,#d3b8ff 0%,transparent 62%),linear-gradient(160deg,#f7ecff,#e2ecff)}",
"#machome.mh-dark{--mh-text:#f5f5f7;--mh-text2:#a1a1a6;--mh-text3:#8e8e93;--mh-glass:rgba(28,28,34,.62);--mh-glass-b:rgba(255,255,255,.09);--mh-sep:rgba(255,255,255,.09);--mh-track:rgba(255,255,255,.1);--mh-bar:rgba(20,20,28,.5);--mh-row:rgba(255,255,255,.04);--mh-sheet:rgba(38,38,44,.97);",
"--mh-blue:#0a84ff;--mh-green:#30d158;--mh-yellow:#ffd60a;--mh-orange:#ff9f0a;--mh-red:#ff453a;--mh-purple:#bf5af2;--mh-teal:#64d2ff;--mh-shadow:0 14px 44px rgba(0,0,0,.45),0 0 0 .5px rgba(255,255,255,.06);",
"--mh-wall:radial-gradient(1100px 620px at 8% -8%,#4b2a8a 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,#0e4d8f 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,#b4536a 0%,transparent 64%),linear-gradient(160deg,#16162c,#0a0c18)}",
"#machome *{box-sizing:border-box}","#machome{container:mh/inline-size;display:block}",
"#machome .mh-wall{background:var(--mh-wall);border-radius:18px;min-height:calc(100vh - 110px);padding:0 0 135px;position:relative;overflow:hidden}",
/* live wallpaper (Settings > Live wallpaper, on by default): two copies of the theme's own --mh-wall drift, swell and shift hue behind
   everything (z-index:-1 inside an isolated wall). Transform + filter only, so it runs on the GPU; anchored at the top and always scaled >= 1.25 with x-shift <= 9% of the width, so no edge ever shows. Dark mode brightens them (--mh-lb/--mh-ls) and screen-blends the second layer. */
"#machome .mh-wall{isolation:isolate}",
"#machome.mh-live .mh-wall::before,#machome.mh-live .mh-wall::after{content:'';position:absolute;inset:0;z-index:-1;background:var(--mh-wall);pointer-events:none;will-change:transform,filter;transform-origin:50% 0}",
"#machome{--mh-lb:1.06;--mh-ls:1.5}#machome.mh-dark{--mh-lb:1.6;--mh-ls:1.8}#machome.mh-live .mh-wall::before{animation:mhWallA 16s ease-in-out infinite alternate}",
"#machome.mh-live .mh-wall::after{opacity:.75;animation:mhWallB 22s ease-in-out infinite alternate}#machome.mh-live.mh-dark .mh-wall::after{mix-blend-mode:screen;opacity:.8}",
"@keyframes mhWallA{0%{transform:translate3d(-9%,0,0) scale(1.25);filter:hue-rotate(-60deg) saturate(var(--mh-ls)) brightness(var(--mh-lb))}33%{transform:translate3d(8%,-120px,0) scale(1.5);filter:hue-rotate(50deg) saturate(var(--mh-ls)) brightness(var(--mh-lb))}66%{transform:translate3d(-6%,-60px,0) scale(1.35);filter:hue-rotate(140deg) saturate(var(--mh-ls)) brightness(var(--mh-lb))}100%{transform:translate3d(9%,-20px,0) scale(1.3);filter:hue-rotate(220deg) saturate(var(--mh-ls)) brightness(var(--mh-lb))}}",
"@keyframes mhWallB{0%{transform:scaleX(-1) translate3d(9%,-60px,0) scale(1.3);filter:hue-rotate(90deg) saturate(var(--mh-ls)) brightness(var(--mh-lb))}50%{transform:scaleX(-1) translate3d(-9%,0,0) scale(1.55);filter:hue-rotate(-80deg) saturate(var(--mh-ls)) brightness(var(--mh-lb))}100%{transform:scaleX(-1) translate3d(4%,-140px,0) scale(1.3);filter:hue-rotate(-200deg) saturate(var(--mh-ls)) brightness(var(--mh-lb))}}",
"@media (prefers-reduced-motion:reduce){#machome.mh-live .mh-wall::before,#machome.mh-live .mh-wall::after{animation:none}}",
/* menu bar */
"#machome .mh-menubar{height:30px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;background:var(--mh-bar);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border-bottom:.5px solid var(--mh-sep);font-size:13px;position:sticky;top:0;z-index:5}",
"#machome .mh-menubar .l,#machome .mh-menubar .r{display:flex;align-items:center;gap:16px;white-space:nowrap;overflow:hidden}",
"#machome .mh-menubar .l b{font-weight:700}",
"#machome .mh-menubar .l span{color:var(--mh-text);opacity:.85;cursor:pointer}",
"#machome .mh-menubar .l span:hover{opacity:1}",
"#machome .mh-menubar svg{width:15px;height:15px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-mbi{display:flex;align-items:center;gap:5px;font-size:12px;font-variant-numeric:tabular-nums}",
/* page search (under the menu bar) */
"#machome .mh-srch{position:relative;max-width:620px;margin:14px auto 0;padding:0 28px;z-index:6}#machome .mh-srch>svg{position:absolute;z-index:1;left:40px;top:10px;width:16px;height:16px;fill:none;stroke:var(--mh-text2);stroke-width:2;stroke-linecap:round;pointer-events:none}",
"#machome .mh-sq{width:100%;box-sizing:border-box;height:36px;padding:0 12px 0 36px;border-radius:12px;border:.5px solid var(--mh-glass-b);background:var(--mh-glass);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 2px 10px rgba(0,0,0,.06);font:inherit;font-size:14px;color:var(--mh-text);outline:none}",
"#machome .mh-sq::placeholder{color:var(--mh-text3)}#machome .mh-sq:focus{border-color:var(--mh-blue);box-shadow:0 0 0 3px rgba(0,122,255,.22)}",
"#machome .mh-sres{position:absolute;left:28px;right:28px;top:42px;max-height:min(60vh,480px);overflow:auto;padding:6px;border-radius:14px;background:var(--mh-sheet,var(--mh-glass));border:.5px solid var(--mh-glass-b);-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%);box-shadow:var(--mh-shadow);animation:mhPop .15s ease-out}#machome .mh-sres[hidden]{display:none}",
"#machome .mh-sres .h{font-size:11px;color:var(--mh-text2);padding:4px 10px 6px}#machome .mh-sres .r{padding:7px 10px;border-radius:9px;cursor:pointer}#machome .mh-sres .r.on,#machome .mh-sres .r:hover{background:var(--mh-row)}",
"#machome .mh-sres .r small{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mh-text3)}#machome .mh-sres .r span{display:block;font-size:13px;color:var(--mh-text);line-height:1.35;overflow-wrap:anywhere}#machome .mh-sres .r.ab span{color:var(--mh-blue)}",
"#machome .mh-sres mark{background:rgba(255,204,0,.45);color:inherit;border-radius:3px;padding:0 1px}",
"#machome .mh-sfl{outline:3px solid var(--mh-blue);outline-offset:3px}#machome .mh-sfh{background:rgba(255,204,0,.35)!important;border-radius:6px}",
"@container mh (max-width:760px){#machome .mh-srch{padding:0 12px;margin-top:10px}#machome .mh-srch>svg{left:24px}#machome .mh-sres{left:12px;right:12px}}",
"#machome.mh-and .mh-sq{height:44px;border:0;border-radius:999px;padding-left:40px;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}#machome.mh-and .mh-srch>svg{top:14px;left:42px}#machome.mh-and .mh-sres{top:50px;border:0;border-radius:24px}",
"#machome .mh-mbi .dot{width:7px;height:7px;border-radius:50%;background:var(--mh-text3)}",
/* top-bar status lights: green ones "breathe" slowly (2026-11-14); orange/red stay steady */
"#machome .mh-mbi .dot.blink{animation:mhBlink 2.4s ease-in-out infinite;box-shadow:0 0 0 0 rgba(52,199,89,.55)}",
"@keyframes mhBlink{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(52,199,89,.55)}50%{opacity:.35;box-shadow:0 0 0 4px rgba(52,199,89,0)}}",
"@media (prefers-reduced-motion:reduce){#machome .mh-mbi .dot.blink{animation:none}}",
"#machome .mh-mbi[data-k=mb-sys]{cursor:pointer;white-space:nowrap}",
"@container mh (max-width:760px){#machome .mh-mbi[data-k=mb-sys] .t{display:none}}",
/* hero */
"#machome .mh-hero{padding:34px 28px 10px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px}",
"#machome .mh-hero h1{margin:0;font-size:34px;font-weight:700;letter-spacing:-.02em;color:var(--mh-text)}",
"#machome .mh-hero p{margin:4px 0 0;font-size:15px;color:var(--mh-text2)}",
"#machome .mh-chips{display:flex;flex-wrap:nowrap;gap:var(--chg,8px);overflow:hidden;max-width:100%}",
"#machome .mh-chips .mh-chip{flex:0 1 auto;min-width:0;white-space:nowrap;font-size:var(--chf,12px)}#machome .mh-chips.fit .mh-chip{flex:none}#machome .mh-chips.wrap{flex-wrap:wrap;overflow:visible}#machome .mh-chips.wrap .mh-chip{flex:none}#machome .mh-chip .t{overflow:hidden;text-overflow:ellipsis;min-width:0}#machome .mh-chip i{flex:none}",
/* NAS AdGuard card, pause buttons, bufferbloat grade, ISP table */
"#machome .mh-nasb{display:flex;align-items:center;gap:8px;margin:-2px 0 12px;padding:7px 10px;border-radius:10px;background:linear-gradient(90deg,rgba(48,176,160,.18),rgba(48,176,160,.05));color:var(--mh-text);font-size:12px;font-weight:600}",
"#machome .mh-nasb svg{width:18px;height:18px;flex:none;fill:none;stroke:#30b0a0;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-nspark{display:block;width:100%;height:34px;margin:8px 0 4px}",
"#machome .mh-ntop div{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:4px 0;border-bottom:.5px solid var(--mh-sep,rgba(128,128,128,.2))}#machome .mh-ntop span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mh-text2)}",
"#machome .mh-pz{flex:none;width:28px;height:28px;margin-left:8px;border-radius:50%;border:0;background:var(--mh-track);color:var(--mh-text2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}",
"#machome .mh-pz svg{width:13px;height:13px;fill:currentColor}#machome .mh-pz:hover{background:var(--mh-orange);color:#fff}#machome .mh-pz.on{background:var(--mh-green);color:#fff}",
"#machome .mh-str .bb{display:block;margin-top:2px;white-space:nowrap}#machome .mh-str .bb i{font-style:normal;color:#fff;font-weight:700;font-size:10px;padding:0 5px;border-radius:5px;margin-left:2px}",
"#machome .mh-fang{cursor:pointer;border-radius:14px;transition:background .15s}#machome .mh-fang:hover{background:var(--mh-track)}",
"#machome-modal .mh-seg{display:flex;gap:4px;padding:3px;border-radius:10px;background:var(--mh-track);margin:6px 0 12px}#machome-modal .mh-seg button{flex:1;border:0;border-radius:8px;padding:7px;background:none;color:var(--mh-text);font:inherit;font-weight:600;cursor:pointer}",
"#machome-modal .mh-seg button.on{background:var(--mh-glass,#fff);box-shadow:0 1px 4px rgba(0,0,0,.15)}#machome-modal .mh-fin{display:flex;align-items:center;gap:8px}#machome-modal .mh-fin input{width:90px}",
"#machome-modal .mh-2c{display:grid;grid-template-columns:1fr 1fr;gap:10px}#machome-modal .sheet:has(.mh-isp){max-width:min(780px,94vw);width:780px}",
"#machome-modal .mh-isp{overflow-x:auto;margin:10px 0}#machome-modal .mh-isp table{width:100%;border-collapse:collapse;font-size:12px;text-align:left}",
"#machome-modal .mh-isp th{font-weight:600;color:var(--mh-text2);padding:6px 8px;border-bottom:1px solid var(--mh-track);white-space:nowrap}#machome-modal .mh-isp td{padding:7px 8px;border-bottom:.5px solid var(--mh-track);white-space:nowrap}",
"#machome-modal .mh-isp small{color:var(--mh-text2)}#machome-modal textarea{font-family:ui-monospace,monospace;border-radius:8px;padding:6px;box-sizing:border-box}",
/* weather widget + ZIP prompt */
"#machome .mh-hero>.l{display:flex;align-items:flex-end;gap:22px;flex-wrap:wrap}",
"#machome .mh-wth{display:flex;align-items:center;gap:14px;padding:12px 20px 12px 15px;border-radius:18px;color:#fff;cursor:pointer;background:linear-gradient(160deg,#4a90e2,#1c4f9c);box-shadow:0 6px 20px rgba(10,60,140,.25);transition:transform .15s;animation:mhIn .4s ease-out both}",
"#machome .mh-wth.night{background:linear-gradient(160deg,#2c3a64,#121a33)}#machome .mh-wth.grey{background:linear-gradient(160deg,#7d8aa0,#45516a)}",
"#machome .mh-wth:hover{transform:translateY(-1px)}#machome .mh-wth .wi{width:54px;height:54px;flex:none}",
"#machome .mh-wth .t{font-size:37px;font-weight:600;letter-spacing:-.02em;line-height:1}#machome .mh-wth .c{font-size:13.5px;line-height:1.35}#machome .mh-wth .c b{display:block;font-size:15px}",
"#machome .mh-wth .c span{opacity:.85}#machome .mh-wth .fc{display:flex;gap:13px;margin-left:8px;padding-left:15px;border-left:1px solid rgba(255,255,255,.25)}",
"#machome .mh-wth .fc div{text-align:center;font-size:12.5px;line-height:1.3}#machome .mh-wth .fc .wi{width:30px;height:30px;display:block;margin:2px auto}",
"@container mh (max-width:760px){#machome .mh-wth .fc{display:none}}",
"#machome .mh-zip{margin:14px 28px 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:11px 14px;border-radius:14px;background:var(--mh-glass);border:.5px solid var(--mh-glass-b);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 4px 18px rgba(0,0,0,.10);border-left:5px solid var(--mh-blue);animation:mhIn .35s ease-out both}",
"#machome .mh-zip .wi{width:36px;height:36px;flex:none}#machome .mh-zip .tx{flex:1;min-width:200px}#machome .mh-zip .tx b{display:block;font-size:14px}#machome .mh-zip .tx small{color:var(--mh-text2);font-size:12px}",
"#machome .mh-zip input{width:92px;padding:7px 10px;border-radius:8px;border:.5px solid var(--mh-glass-b);background:var(--mh-track);color:var(--mh-text);font:inherit;font-size:14px;letter-spacing:.05em}",
"#machome .mh-zip .mh-btn{margin:0}#machome .mh-zip .er{width:100%;color:var(--mh-red);font-size:12px}#machome .mh-zip .er:empty{display:none}",
"@container mh (max-width:760px){#machome .mh-zip{margin:10px 12px 0}}",
"#machome .mh-chip{display:inline-flex;align-items:center;gap:7px;padding:var(--chp,7px 12px);border-radius:999px;background:var(--mh-glass);border:.5px solid var(--mh-glass-b);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);font-weight:600;font-size:12px;box-shadow:0 2px 10px rgba(0,0,0,.06);cursor:pointer;transition:transform .15s}",
"#machome .mh-chip:hover{transform:translateY(-1px)}",
"#machome .mh-chip i{width:8px;height:8px;border-radius:50%;display:block}",
/* grid + windows */
"#machome .mh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(max(330px,calc((100% - 36px) / 3)),100%),1fr));gap:18px;padding:16px 28px}",
"@container mh (max-width:1081px){#machome .mh-win.hist{order:1}}",
"#machome .mh-win{background:var(--mh-glass);border:.5px solid var(--mh-glass-b);border-radius:14px;-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);box-shadow:var(--mh-shadow);overflow:hidden;display:flex;flex-direction:column;animation:mhIn .45s cubic-bezier(.2,.8,.2,1) both}",
"#machome .mh-win.wide{grid-column:span 2}",
"#machome .mh-win.full{grid-column:1/-1;order:3}",
/* weather-style alert banner */
"#machome .mh-wx{margin:14px 28px 0;display:flex;flex-direction:column;gap:8px}",
"@container mh (max-width:760px){#machome .mh-wx{margin:10px 12px 0}#machome .mh-wxi{flex-wrap:wrap}#machome .mh-wxi .ac{width:100%;justify-content:flex-end}}",
"#machome .mh-wxi{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;background:var(--mh-glass);border:.5px solid var(--mh-glass-b);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 4px 18px rgba(0,0,0,.10);border-left:5px solid var(--mh-orange);animation:mhIn .35s ease-out both}",
"#machome .mh-wxi.crit{border-left-color:var(--mh-red);background:linear-gradient(90deg,rgba(255,59,48,.16),rgba(255,59,48,.04) 60%),var(--mh-glass)}",
"#machome .mh-wxi.warn{background:linear-gradient(90deg,rgba(255,149,0,.14),rgba(255,149,0,.03) 60%),var(--mh-glass)}",
"#machome .mh-wxi.ok{border-left-color:var(--mh-green);background:linear-gradient(90deg,rgba(52,199,89,.14),rgba(52,199,89,.03) 60%),var(--mh-glass)}",
"#machome .mh-wxi .ic{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;background:var(--mh-orange)}",
"#machome .mh-wxi.crit .ic{background:var(--mh-red);animation:mhPulse 1.8s ease-in-out infinite}#machome .mh-wxi.ok .ic{background:var(--mh-green)}",
"@keyframes mhPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,59,48,.55)}50%{box-shadow:0 0 0 7px rgba(255,59,48,0)}}",
"#machome .mh-wxi .ic svg{width:19px;height:19px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-wxi .tx{flex:1;min-width:0}#machome .mh-wxi .tx b{display:block;font-size:14px;font-weight:700}#machome .mh-wxi.crit .tx b{color:var(--mh-red)}",
"#machome .mh-wxi .tx small{display:block;color:var(--mh-text2);font-size:12px;margin-top:1px}",
"#machome .mh-wxi .ac{display:flex;gap:8px;align-items:center;flex:none}#machome .mh-wxi .ac .mh-btn{margin:0}",
"#machome .mh-wxi.crit .ac .mh-btn{background:var(--mh-red)}#machome .mh-wxi.warn .ac .mh-btn{background:var(--mh-orange)}",
"#machome .mh-wxi .ac .mh-btn.mh-fix{background:var(--mh-green)}",
"#machome .mh-wxd{border:0;background:none;color:var(--mh-text2);font:inherit;font-size:12px;cursor:pointer;padding:6px 4px;border-radius:6px}#machome .mh-wxd:hover{color:var(--mh-text);background:var(--mh-track)}",
"#machome .mh-wxf{font-size:12px;color:var(--mh-text2);padding:0 4px}#machome .mh-wxf a{color:var(--mh-blue);text-decoration:none}",
/* firmware banner */
"#machome .mh-fwb{margin:0 28px 4px;display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:var(--mh-glass);border:.5px solid var(--mh-glass-b);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);box-shadow:0 2px 12px rgba(0,0,0,.08);cursor:pointer}",
"#machome .mh-fwb .ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none}",
"#machome .mh-fwb .ic svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-fwb b{display:block}#machome .mh-fwb small{color:var(--mh-text2);font-size:12px}",
"@container mh (max-width:760px){#machome .mh-fwb{margin:0 12px 4px}}",
"#machome .mh-ck.click:hover{background:var(--mh-track)}",
"#machome .mh-ccb.on{color:var(--mh-blue);background:var(--mh-track)}",
/* reliability table */
"#machome .mh-rel{display:flex;flex-direction:column;gap:6px}",
"#machome .mh-relr{display:grid;grid-template-columns:minmax(0,2.2fr) .8fr .8fr .7fr .7fr 1.3fr 1fr;gap:12px;align-items:center;background:var(--mh-row);border-radius:10px;padding:9px 12px}",
"#machome .mh-relr.hd{background:none;padding:0 12px;font-size:10px;font-weight:700;color:var(--mh-text3);text-transform:uppercase;letter-spacing:.06em}",
"#machome .mh-relr>div{min-width:0}#machome .mh-relr b{display:block;font-weight:600;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-relr small{display:block;color:var(--mh-text2);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-relr.old{opacity:.6}",
/* VPN card: 7-day line per tunnel + past servers (merged VPN Reliability card) */
"#machome .mh-r .m small.rl{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.4;margin-top:2px}#machome .mh-r .m small.rl b{display:inline;font-weight:700}#machome .mh-r .m small.rl .h{color:var(--mh-text3)}",
"#machome .mh-vpast{margin-top:8px;font-size:12px}#machome .mh-vpast summary{cursor:pointer;color:var(--mh-text2);font-weight:600;padding:4px 0}#machome .mh-vpast>div{padding:6px 10px;border-radius:9px;background:var(--mh-row);margin-top:5px;opacity:.75}#machome .mh-vpast>div b{display:block;font-size:12px}#machome .mh-vpast>div small{display:block;color:var(--mh-text2);font-size:11px;line-height:1.4}#machome .mh-vpast>div small b{display:inline}",
"@container mh (max-width:1081px){#machome .mh-relr{grid-template-columns:minmax(0,1.8fr) .8fr .7fr .7fr .6fr 1.2fr .9fr;gap:8px}#machome .mh-relr>div:first-child b{white-space:normal}}",
"@container mh (max-width:760px){#machome .mh-relr{grid-template-columns:1fr 1fr 1fr}#machome .mh-relr.hd{display:none}#machome .mh-relr>div:first-child{grid-column:1/-1}}",
/* alert settings + readiness (modal) */
"#machome-modal .mh-mrow{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:.5px solid var(--mh-sep);margin:0;font-size:13px;color:var(--mh-text);font-weight:400;text-transform:none;letter-spacing:0}",
"#machome-modal .mh-mrow b{display:block;font-weight:600}#machome-modal .mh-mrow small{display:block;color:var(--mh-text2);font-size:11px;font-weight:400}",
"#machome-modal .mh-mgrp{margin-top:12px;background:var(--mh-row);border-radius:12px;padding:2px 12px}",
"#machome-modal .mh-mgrp h4{margin:8px 0 0;font-size:10px;font-weight:700;color:var(--mh-text3);text-transform:uppercase;letter-spacing:.07em}",
"#machome-modal .mh-mgrp .mh-mrow:last-child{border-bottom:0}",
"#machome-modal .mh-msw{appearance:none;-webkit-appearance:none;position:relative;width:40px;height:24px;border-radius:12px;background:var(--mh-track);flex:none;cursor:pointer;transition:background .2s;margin:0}",
"#machome-modal .mh-msw::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}",
"#machome-modal .mh-msw:checked{background:var(--mh-green)}#machome-modal .mh-msw:checked::after{transform:translateX(16px)}",
"#machome-modal select,#machome-modal input[type=number]{padding:6px 8px;border-radius:8px;border:.5px solid var(--mh-sep);background:var(--mh-row);color:var(--mh-text);font:inherit}",
"#machome-modal .mh-ready>div{text-align:left;padding:9px 12px;border-radius:10px;margin-top:8px;background:var(--mh-row)}",
"#machome-modal .mh-ready ul{margin:4px 0 0 18px;padding:0}#machome-modal .mh-ready .bad{border-left:3px solid var(--mh-red)}#machome-modal .mh-ready .warn{border-left:3px solid var(--mh-orange)}#machome-modal .mh-ready .ok{border-left:3px solid var(--mh-green)}",
"#machome-modal .sheet{width:460px}",
/* speed test */
"#machome .mh-st{display:grid;grid-template-columns:240px minmax(0,1fr);gap:22px;align-items:start}",
"@container mh (max-width:760px){#machome .mh-st{grid-template-columns:minmax(0,1fr)}}",
"#machome .mh-stg{text-align:center;background:var(--mh-row);border-radius:14px;padding:14px 12px}",
"#machome .mh-stg .ring{position:relative;width:170px;height:170px;margin:0 auto}",
"#machome .mh-stg svg{width:170px;height:170px;display:block}",
"#machome .mh-stg .trk{fill:none;stroke:var(--mh-track);stroke-width:13}",
"#machome .mh-stg .val{fill:none;stroke-width:13;stroke-linecap:round}",
"#machome .mh-stg .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}",
"#machome .mh-stg .num b{font-size:34px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1}",
"#machome .mh-stg .num small{font-size:12px;color:var(--mh-text2);margin-top:3px}",
"#machome .mh-stg .ph{font-weight:700;margin-top:6px}",
"#machome .mh-stg .sb{font-size:11px;color:var(--mh-text2);min-height:30px;margin-top:2px}",
"#machome .mh-stg .mh-bar{margin-top:8px}",
"#machome .mh-stb{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
"#machome .mh-stb .mh-btn{margin:0}",
"#machome .mh-btn[disabled]{opacity:.45;cursor:default;filter:none}",
"#machome .mh-stn{font-size:11px;color:var(--mh-text3);margin:8px 0 2px}",
"#machome .mh-wpg{background:var(--mh-row);border-radius:10px;padding:8px 8px 4px;margin:4px 0 8px}",
"#machome .mh-wpc{position:relative;padding-left:46px}",
"#machome .mh-wpc svg{width:100%;height:110px;display:block}",
"#machome .mh-wpc .yl{position:absolute;left:0;top:0;bottom:0;width:42px}",
"#machome .mh-wpc .yl span{position:absolute;right:4px;transform:translateY(-50%);font-size:10px;color:var(--mh-text3);white-space:nowrap}",
"#machome .mh-wpg .gl{stroke:var(--mh-text3);stroke-width:1;stroke-dasharray:2 3;opacity:.35;vector-effect:non-scaling-stroke}",
"#machome .mh-wpg .ax{display:flex;justify-content:space-between;font-size:10px;color:var(--mh-text3);margin-top:3px;padding-left:46px}",
"#machome .mh-wpg .lg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:var(--mh-text2);margin-top:6px}",
"#machome .mh-wpg .lg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:0}",
"#machome .mh-wpe{font-size:12px;color:var(--mh-text3);padding:28px 4px;text-align:center}",
"#machome .mh-wps{margin:0 0 6px}",
"#machome .mh-whg{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px}",
"#machome .mh-whg .pill{color:#fff;font-weight:700;font-size:12px;padding:3px 10px;border-radius:999px;white-space:nowrap}",
"#machome .mh-whg .why{font-size:11px;color:var(--mh-text2)}",
"#machome .mh-chain{display:flex;align-items:stretch;gap:4px;margin:0 0 6px}",
"#machome .mh-chain .st{flex:1;min-width:0;background:var(--mh-row);border-radius:9px;padding:6px 8px;text-align:center}",
"#machome .mh-chain .st i{font-style:normal;font-weight:800;margin-right:4px}",
"#machome .mh-chain .st b{font-size:12px}",
"#machome .mh-chain .st small{display:block;font-size:11px;color:var(--mh-text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
"#machome .mh-chain .ar{align-self:center;color:var(--mh-text3);font-size:12px}",
"#machome .mh-whv{font-size:11px;color:var(--mh-text2);margin:0 0 8px}",
"#machome .mh-whw{font-size:11px;color:var(--mh-text2);border:1px solid var(--mh-orange);border-radius:9px;padding:7px 9px;margin:0 0 8px}",
"#machome .mh-uses{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;font-size:12px;margin:8px 0 4px}",
"#machome .mh-uses small{color:var(--mh-text3);font-size:11px}",
"#machome .mh-uses i{font-style:normal;font-weight:800;margin-right:4px}",
"#machome .mh-whs{font-size:11px;color:var(--mh-text2);margin:3px 0}",
"#machome .mh-strip{margin:6px 0 4px}",
"#machome .mh-strip .bar{display:flex;gap:2px;height:12px}",
"#machome .mh-strip .bar i{flex:1;border-radius:2px;opacity:.85}",
"#machome .mh-strip .ax{display:flex;justify-content:space-between;font-size:10px;color:var(--mh-text3);margin-top:2px}",
"#machome .mh-nps{margin:8px 0 4px;display:flex;flex-direction:column;gap:4px}",
"#machome .mh-pv{display:none}",
"#machome.mh-ph-on .mh-grid,#machome.mh-ph-on .mh-hero,#machome.mh-ph-on .mh-srch,#machome.mh-ph-on [data-k=fwb],#machome.mh-ph-on .mh-ver,#machome.mh-ph-on .mh-dockwrap,#machome.mh-ph-on .mh-menubar .l span{display:none}",
"#machome.mh-ph-on .mh-pv{display:flex;flex-direction:column;align-items:stretch;gap:12px;padding:12px 14px 40px;max-width:560px;margin:0 auto;box-sizing:border-box;width:100%}",
"#machome.mh-ph-on .mh-pvb{background:var(--mh-blue);color:#fff}",
"#machome .pv-top{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;background:var(--mh-glass)}",
"#machome .pv-top i{width:14px;height:14px;border-radius:50%;flex:none}",
"#machome .pv-top div{flex:1;min-width:0}#machome .pv-top b{display:block;font-size:20px;color:var(--mh-text)}#machome .pv-top small{color:var(--mh-text2);font-size:12px}",
"#machome .pv-card{padding:14px 16px;border-radius:16px;background:var(--mh-glass)}",
"#machome .pv-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}#machome .pv-h b{font-size:16px;color:var(--mh-text)}",
"#machome .pv-pill{color:#fff;font-weight:700;font-size:12px;padding:3px 10px;border-radius:999px}",
"#machome .pv-n{font-size:13px;color:var(--mh-text2)}",
"#machome .pv-kv{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}#machome .pv-kv>div{background:var(--mh-row);border-radius:10px;padding:8px 10px}",
"#machome .pv-kv small{display:block;font-size:11px;color:var(--mh-text3)}#machome .pv-kv b{font-size:17px;color:var(--mh-text);white-space:nowrap}",
"#machome .pv-sub{display:block;margin-top:8px;font-size:12px;color:var(--mh-text2)}",
"#machome .pv-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:.5px solid var(--mh-sep)}",
"#machome .pv-row i{width:10px;height:10px;border-radius:50%;flex:none}#machome .pv-row span{flex:1;min-width:0}",
"#machome .pv-row b{display:block;font-size:15px;color:var(--mh-text)}#machome .pv-row small{font-size:12px;color:var(--mh-text2)}",
"#machome .pv-acts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}",
"#machome .pv-act{display:flex;align-items:center;gap:10px;min-height:58px;padding:12px 14px;border:0;border-radius:14px;background:var(--mh-glass);color:var(--mh-text);font:inherit;font-size:15px;font-weight:600;cursor:pointer;text-align:left}",
"#machome .pv-act span{font-size:22px;line-height:1}",
"#machome .mh-npr{display:flex;align-items:baseline;gap:6px;font-size:11px;color:var(--mh-text2);min-width:0}",
"#machome .mh-npr i{flex:none;width:7px;height:7px;border-radius:50%;align-self:center}",
"#machome .mh-npr b{flex:none;color:var(--mh-text);font-weight:600}",
"#machome .mh-npr span{flex:1;min-width:0}",
"#machome .mh-npr em{flex:none;font-style:normal;color:var(--mh-text3);white-space:nowrap}",
"#machome .mh-tg{font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;color:#fff;vertical-align:1px}",
"#machome .mh-tg.good{background:var(--mh-green)}#machome .mh-tg.fair{background:var(--mh-orange)}#machome .mh-tg.poor{background:var(--mh-red)}",
"#machome .mh-x{border:0;background:none;color:var(--mh-text3);cursor:pointer;font:inherit;font-size:13px;line-height:1;padding:0 2px;margin-left:3px}",
"#machome .mh-x:hover{color:var(--mh-red)}",
"#machome-modal .mh-evk{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px;justify-content:flex-start}",
"#machome-modal .mh-evk button{border:1px solid var(--mh-sep);background:none;border-radius:999px;font:inherit;font-size:11px;padding:2px 9px;cursor:pointer;color:var(--mh-text2)}",
"#machome-modal .mh-evk button.on{background:var(--mh-blue);border-color:var(--mh-blue);color:#fff}",
"#machome-modal .mh-evopt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;color:var(--mh-text2);margin:0 0 8px;text-align:left}",
"#machome-modal .mh-evopt select{width:auto;margin:0;padding:3px 6px;font-size:12px}",
"#machome-modal .mh-ev p .mu{display:inline-block;margin-left:6px;font-size:11px;color:var(--mh-blue);cursor:pointer}",
"#machome-modal .mh-fgl{text-align:left;font-size:12px;color:var(--mh-text2);max-height:40vh;overflow:auto;margin:8px 0;padding:6px 10px;background:var(--mh-row);border-radius:10px}",
"#machome-modal .mh-fgl div{padding:3px 0;border-bottom:.5px solid var(--mh-sep)}",
"#machome-modal .mh-ilog{text-align:left;max-height:38vh;overflow:auto;margin:8px 0;border-top:.5px solid var(--mh-sep)}",
"#machome-modal .mh-ilr{display:flex;gap:8px;padding:6px 2px;border-bottom:.5px solid var(--mh-sep);font-size:12px;color:var(--mh-text2)}",
"#machome-modal .mh-ilr i{font-style:normal;flex:none}#machome-modal .mh-ilr b{display:block;color:var(--mh-text);font-weight:600;font-size:11px}",
"#machome .mh-stt{margin-top:10px;display:flex;flex-direction:column;gap:6px}",
"#machome .mh-sth{display:flex;justify-content:space-between;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--mh-text3);margin:8px 2px 0}",
"#machome .mh-sth span:last-child{text-transform:none;letter-spacing:0;font-weight:500}",
"#machome .mh-str{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1.1fr) 88px 78px minmax(0,1.4fr) minmax(0,1.4fr);gap:12px;align-items:center;background:var(--mh-row);border-radius:10px;padding:9px 12px}",
"#machome .mh-str.hd{background:none;padding:0 12px;font-size:10px;font-weight:700;color:var(--mh-text3);text-transform:uppercase;letter-spacing:.06em}",
"#machome .mh-str b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-str>div{min-width:0;overflow:hidden}#machome .mh-str .srv b,#machome .mh-str>div:first-child b{display:block}",
"#machome .mh-str small{display:block;color:var(--mh-text2);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-str .sp{font-variant-numeric:tabular-nums}#machome .mh-str .sp b{font-size:15px}#machome .mh-str .sp .mh-bar{margin-top:4px;height:5px}",
"#machome .mh-str.err{grid-template-columns:minmax(0,1.2fr) minmax(0,4fr)}",
"@container mh (max-width:1081px){#machome .mh-str{grid-template-columns:minmax(0,1.45fr) minmax(0,1.15fr) 64px 62px minmax(0,1fr) minmax(0,1fr);gap:10px}#machome .mh-str>div:first-child b{white-space:normal;line-height:1.25}#machome .mh-st{grid-template-columns:200px minmax(0,1fr);gap:16px}}",
"@container mh (max-width:760px){#machome .mh-str{grid-template-columns:1fr 1fr}#machome .mh-str.hd{display:none}#machome .mh-str .srv{grid-column:1/-1;order:-1}}",
"#machome .mh-str.live{outline:1.5px solid var(--mh-blue);outline-offset:-1.5px}",
"@container mh (max-width:760px){#machome .mh-win.wide{grid-column:auto}#machome .mh-grid{padding:12px;grid-template-columns:minmax(0,1fr)}#machome .mh-hero{padding:24px 16px 6px}#machome .mh-hero h1{font-size:28px}#machome .mh-menubar .l span{display:none}#machome .mh-menubar [data-k=clock]{display:none}#machome .mh-gauges{display:grid;grid-template-columns:1fr 1fr;justify-items:center}#machome .mh-cores{grid-template-columns:1fr 1fr}#machome .mh-tiles b{font-size:20px}#machome .mh-r .x{font-size:10px}}",
"#machome.mh-and,#machome-modal.mh-and{--mh-font:'Google Sans Flex','Google Sans Text','Google Sans','Roboto Flex',Roboto,'Segoe UI Variable','Segoe UI',system-ui,sans-serif;--mh-text:#1b1b23;--mh-text2:#474656;--mh-text3:#777586;--mh-glass:#f3f0fb;--mh-glass-b:transparent;--mh-sep:rgba(71,70,86,.12);--mh-track:#e2dfee;--mh-bar:transparent;--mh-row:#e9e5f5;--mh-sheet:#f6f2fe;--mh-blue:#5157c9;--mh-green:#2a7a3e;--mh-yellow:#8a6d00;--mh-orange:#a65400;--mh-red:#ba1a1a;--mh-purple:#7a4fb4;--mh-teal:#00696e;--mh-shadow:0 1px 2px rgba(20,18,40,.06),0 3px 10px rgba(20,18,40,.05);--mh-wall:radial-gradient(900px 520px at 0% 0%,#dcdcff 0%,transparent 60%),radial-gradient(800px 600px at 100% 100%,#ffd9e4 0%,transparent 60%),#fbf8ff;--mh-on-pri:#fff;--mh-pri-c:#e0e0ff;--mh-on-pri-c:#0b1170;--mh-sec-c:#e2e0f9;--mh-on-sec-c:#191a2c;--mh-err-c:#ffdad6;--mh-warn-c:#ffdcbf;--mh-ok-c:#c2efc8;--mh-on-err:#fff;--mh-qs:rgba(243,240,251,.80)}",
"#machome.mh-and.mh-dark,#machome-modal.mh-and.mh-dark{--mh-text:#e4e1ee;--mh-text2:#c8c5d6;--mh-text3:#918fa1;--mh-glass:#1f1f29;--mh-sep:rgba(200,197,214,.12);--mh-track:#34333f;--mh-row:#2a2935;--mh-sheet:#24232e;--mh-blue:#bfc2ff;--mh-green:#8fd99c;--mh-yellow:#e9c348;--mh-orange:#ffb77a;--mh-red:#ffb4ab;--mh-purple:#d7baff;--mh-teal:#7dd3d8;--mh-shadow:none;--mh-wall:radial-gradient(900px 520px at 0% 0%,#2a2a5c 0%,transparent 60%),radial-gradient(800px 600px at 100% 100%,#4a2436 0%,transparent 60%),#121218;--mh-on-pri:#1c2280;--mh-pri-c:#373b9c;--mh-on-pri-c:#e0e0ff;--mh-sec-c:#45455b;--mh-on-sec-c:#e2e0f9;--mh-err-c:#93000a;--mh-warn-c:#6b3a00;--mh-ok-c:#14522a;--mh-on-err:#690005;--mh-qs:rgba(31,31,41,.80)}",
"#machome.mh-and .mh-wall{border-radius:28px}#machome.mh-and .mh-menubar{height:40px;padding:0 22px;background:transparent;-webkit-backdrop-filter:none;backdrop-filter:none;border:0;font-size:14px;font-weight:500}",
"#machome.mh-and .mh-hero h1{font-size:44px;font-weight:500;letter-spacing:-.01em}#machome.mh-and .mh-hero p{font-size:16px}",
"#machome.mh-and .mh-win{border:0;border-radius:28px;-webkit-backdrop-filter:none;backdrop-filter:none;animation:mhSpring .6s cubic-bezier(.34,1.56,.64,1) both}",
"#machome.mh-and .mh-tb{height:54px;padding:0 20px;border-bottom:0}#machome.mh-and .mh-tl{display:none}#machome.mh-and .mh-tb .t{position:static;transform:none;font-size:16px;font-weight:600;color:var(--mh-text)}",
"#machome.mh-and .mh-tb .o{padding:7px 14px;border-radius:999px;background:var(--mh-sec-c);color:var(--mh-on-sec-c);font-weight:600;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}#machome.mh-and .mh-tb .o:hover{text-decoration:none;transform:scale(1.04)}",
"#machome.mh-and .mh-chip{border:0;border-radius:999px;padding:var(--chpa,9px 16px);background:var(--mh-sec-c);color:var(--mh-on-sec-c);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}",
"#machome.mh-and .mh-btn{border-radius:999px;padding:10px 20px;font-size:13px;background:var(--mh-blue);color:var(--mh-on-pri);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}#machome.mh-and .mh-btn:active,#machome.mh-and .mh-ccbtn:active,#machome-modal.mh-and .btns button:active{transform:scale(.94)}#machome.mh-and .mh-btn.sec{background:var(--mh-sec-c);color:var(--mh-on-sec-c)}",
"#machome.mh-and .mh-sw{width:52px;height:32px;border-radius:16px;background:var(--mh-track);box-shadow:inset 0 0 0 2px var(--mh-text3)}#machome.mh-and .mh-sw::after{top:8px;left:8px;width:16px;height:16px;background:var(--mh-text3);box-shadow:none;transition:all .3s cubic-bezier(.34,1.56,.64,1)}",
"#machome.mh-and .mh-sw.on{background:var(--mh-blue);box-shadow:none}#machome.mh-and .mh-sw.on::after{top:4px;left:4px;width:24px;height:24px;background:var(--mh-on-pri);transform:translateX(20px)}",
"#machome.mh-and .mh-cc{border:0;border-radius:32px;padding:16px;background:var(--mh-qs);-webkit-backdrop-filter:blur(36px) saturate(140%);backdrop-filter:blur(36px) saturate(140%)}#machome.mh-and .mh-cc h3{font-size:18px;font-weight:600;margin:2px 6px 12px}",
"#machome.mh-and .mh-ccg{border-radius:24px;padding:4px 16px;background:var(--mh-row)}#machome.mh-and .mh-ccr{border-bottom-color:transparent}#machome.mh-and .mh-ccbtn{border-radius:24px;padding:16px 10px;background:var(--mh-pri-c);color:var(--mh-on-pri-c);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}",
"#machome.mh-and .mh-ccbtn .ic{background:var(--mh-blue)!important}#machome.mh-and .mh-ccbtn svg{stroke:var(--mh-on-pri)}",
"#machome.mh-and .mh-dock{border:0;border-radius:999px;padding:10px 16px;background:var(--mh-qs);-webkit-backdrop-filter:blur(30px) saturate(140%);backdrop-filter:blur(30px) saturate(140%)}",
"#machome.mh-and .mh-app .ic{border-radius:50%;background:var(--mh-pri-c)!important;box-shadow:none;transition:transform .35s cubic-bezier(.34,1.56,.64,1)}#machome.mh-and .mh-app svg{stroke:var(--mh-on-pri-c)}#machome.mh-and .mh-app:hover .ic{transform:scale(1.1) translateY(-3px)}",
"#machome.mh-and .mh-wxi,#machome.mh-and .mh-zip{border:0;border-radius:24px;padding:14px 18px;background:var(--mh-row);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}",
"#machome.mh-and .mh-wxi.crit{background:var(--mh-err-c)}#machome.mh-and .mh-wxi.warn{background:var(--mh-warn-c)}#machome.mh-and .mh-wxi.ok{background:var(--mh-ok-c)}",
"#machome.mh-and .mh-wth,#machome.mh-and .mh-wth.night,#machome.mh-and .mh-wth.grey{border-radius:28px;background:var(--mh-pri-c);color:var(--mh-on-pri-c);box-shadow:none}#machome.mh-and .mh-wth .fc{border-left-color:var(--mh-sep)}",
"#machome-modal.mh-and .sheet{border:0;border-radius:28px;background:var(--mh-sheet)}#machome-modal.mh-and .btns button{border-radius:999px;padding:11px 16px;background:var(--mh-sec-c);color:var(--mh-on-sec-c);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}",
"#machome-modal.mh-and .btns button.pri{background:var(--mh-blue);color:var(--mh-on-pri)}#machome-modal.mh-and .btns button.dan{background:var(--mh-red);color:var(--mh-on-err)}#machome-modal.mh-and .hic{border-radius:20px}",
"#machome .mh-thm{display:flex;gap:2px;padding:2px;border-radius:10px;background:var(--mh-track);flex:none}#machome .mh-thm button{border:0;background:none;color:var(--mh-text2);font:inherit;font-size:12px;font-weight:600;padding:5px 10px;border-radius:8px;cursor:pointer}",
"#machome .mh-thm button.on{background:var(--mh-glass);color:var(--mh-text);box-shadow:0 1px 3px rgba(0,0,0,.12)}#machome.mh-and .mh-thm{border-radius:999px}#machome.mh-and .mh-thm button{border-radius:999px}#machome.mh-and .mh-thm button.on{background:var(--mh-blue);color:var(--mh-on-pri);box-shadow:none}",
"@keyframes mhSpring{0%{opacity:0;transform:translateY(16px) scale(.96)}60%{opacity:1;transform:translateY(-3px) scale(1.01)}100%{opacity:1;transform:none}}",
"@media (prefers-reduced-motion:reduce){#machome.mh-and .mh-win{animation:none}#machome.mh-and *{transition:none!important}}",
"#machome.mh-and.mh-vivid{--mh-wall:radial-gradient(700px 480px at 2% 0%,#ffc2d9 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,#cfe9a0 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,#c9b8ff 0%,transparent 62%),radial-gradient(520px 420px at 0% 92%,#ffd2b0 0%,transparent 60%),#fff8fb;--mh-blue:#6a3df0;--mh-on-pri:#fff}",
"#machome.mh-and.mh-vivid.mh-dark{--mh-wall:radial-gradient(700px 480px at 2% 0%,#5a1d3a 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,#2f4a0c 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,#3b2a88 0%,transparent 62%),radial-gradient(520px 420px at 0% 92%,#5c2c10 0%,transparent 60%),#120f17;--mh-blue:#c4b2ff;--mh-on-pri:#2a0d78}",
"#machome.mh-and.mh-vivid .mh-hero h1{font-size:50px;font-weight:700;letter-spacing:-.02em}",
"#machome.mh-and.mh-vivid .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:#ffd8e4;--mh-text:#3b0b20;--mh-text2:#3b0b20cc;--mh-text3:#3b0b2099;--mh-row:rgba(255,255,255,.55);--mh-track:rgba(0,0,0,.09);--mh-sep:rgba(0,0,0,.08);color:#3b0b20}",
"#machome.mh-and.mh-vivid.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:#6b2443;--mh-text:#ffd8e4;--mh-text2:#ffd8e4cc;--mh-text3:#ffd8e499;--mh-row:rgba(0,0,0,.22);--mh-track:rgba(255,255,255,.14);--mh-sep:rgba(255,255,255,.10);color:#ffd8e4}",
"#machome.mh-and.mh-vivid .mh-chips>*:nth-child(6n+1){background:#ffd8e4;color:#3b0b20}#machome.mh-and.mh-vivid.mh-dark .mh-chips>*:nth-child(6n+1){background:#6b2443;color:#ffd8e4}",
"#machome.mh-and.mh-vivid .mh-dock>*:nth-child(6n+1) .ic{background:#ff5c93!important;border-radius:50%}",
"#machome.mh-and.mh-vivid .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:#d3f39b;--mh-text:#1a2d00;--mh-text2:#1a2d00cc;--mh-text3:#1a2d0099;--mh-row:rgba(255,255,255,.55);--mh-track:rgba(0,0,0,.09);--mh-sep:rgba(0,0,0,.08);color:#1a2d00}",
"#machome.mh-and.mh-vivid.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:#38560a;--mh-text:#d6f7a3;--mh-text2:#d6f7a3cc;--mh-text3:#d6f7a399;--mh-row:rgba(0,0,0,.22);--mh-track:rgba(255,255,255,.14);--mh-sep:rgba(255,255,255,.10);color:#d6f7a3}",
"#machome.mh-and.mh-vivid .mh-chips>*:nth-child(6n+2){background:#d3f39b;color:#1a2d00}#machome.mh-and.mh-vivid.mh-dark .mh-chips>*:nth-child(6n+2){background:#38560a;color:#d6f7a3}",
"#machome.mh-and.mh-vivid .mh-dock>*:nth-child(6n+2) .ic{background:#8ccf2e!important;border-radius:34%}",
"#machome.mh-and.mh-vivid .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:#e5dbff;--mh-text:#250a66;--mh-text2:#250a66cc;--mh-text3:#250a6699;--mh-row:rgba(255,255,255,.55);--mh-track:rgba(0,0,0,.09);--mh-sep:rgba(0,0,0,.08);color:#250a66}",
"#machome.mh-and.mh-vivid.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:#4a3496;--mh-text:#e8deff;--mh-text2:#e8deffcc;--mh-text3:#e8deff99;--mh-row:rgba(0,0,0,.22);--mh-track:rgba(255,255,255,.14);--mh-sep:rgba(255,255,255,.10);color:#e8deff}",
"#machome.mh-and.mh-vivid .mh-chips>*:nth-child(6n+3){background:#e5dbff;color:#250a66}#machome.mh-and.mh-vivid.mh-dark .mh-chips>*:nth-child(6n+3){background:#4a3496;color:#e8deff}",
"#machome.mh-and.mh-vivid .mh-dock>*:nth-child(6n+3) .ic{background:#8a6cff!important;border-radius:50% 50% 50% 14%}",
"#machome.mh-and.mh-vivid .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:#ffd9bf;--mh-text:#3d1500;--mh-text2:#3d1500cc;--mh-text3:#3d150099;--mh-row:rgba(255,255,255,.55);--mh-track:rgba(0,0,0,.09);--mh-sep:rgba(0,0,0,.08);color:#3d1500}",
"#machome.mh-and.mh-vivid.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:#7a3b12;--mh-text:#ffdcc6;--mh-text2:#ffdcc6cc;--mh-text3:#ffdcc699;--mh-row:rgba(0,0,0,.22);--mh-track:rgba(255,255,255,.14);--mh-sep:rgba(255,255,255,.10);color:#ffdcc6}",
"#machome.mh-and.mh-vivid .mh-chips>*:nth-child(6n+4){background:#ffd9bf;color:#3d1500}#machome.mh-and.mh-vivid.mh-dark .mh-chips>*:nth-child(6n+4){background:#7a3b12;color:#ffdcc6}",
"#machome.mh-and.mh-vivid .mh-dock>*:nth-child(6n+4) .ic{background:#ff8a3d!important;border-radius:42% 58% 46% 54% / 52% 44% 56% 48%}",
"#machome.mh-and.mh-vivid .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:#c8e6ff;--mh-text:#00224a;--mh-text2:#00224acc;--mh-text3:#00224a99;--mh-row:rgba(255,255,255,.55);--mh-track:rgba(0,0,0,.09);--mh-sep:rgba(0,0,0,.08);color:#00224a}",
"#machome.mh-and.mh-vivid.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:#0e4f86;--mh-text:#cde6ff;--mh-text2:#cde6ffcc;--mh-text3:#cde6ff99;--mh-row:rgba(0,0,0,.22);--mh-track:rgba(255,255,255,.14);--mh-sep:rgba(255,255,255,.10);color:#cde6ff}",
"#machome.mh-and.mh-vivid .mh-chips>*:nth-child(6n+5){background:#c8e6ff;color:#00224a}#machome.mh-and.mh-vivid.mh-dark .mh-chips>*:nth-child(6n+5){background:#0e4f86;color:#cde6ff}",
"#machome.mh-and.mh-vivid .mh-dock>*:nth-child(6n+5) .ic{background:#3d9cff!important;border-radius:28%}",
"#machome.mh-and.mh-vivid .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:#b4f1dc;--mh-text:#002319;--mh-text2:#002319cc;--mh-text3:#00231999;--mh-row:rgba(255,255,255,.55);--mh-track:rgba(0,0,0,.09);--mh-sep:rgba(0,0,0,.08);color:#002319}",
"#machome.mh-and.mh-vivid.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:#0b5a46;--mh-text:#b8f3df;--mh-text2:#b8f3dfcc;--mh-text3:#b8f3df99;--mh-row:rgba(0,0,0,.22);--mh-track:rgba(255,255,255,.14);--mh-sep:rgba(255,255,255,.10);color:#b8f3df}",
"#machome.mh-and.mh-vivid .mh-chips>*:nth-child(6n+6){background:#b4f1dc;color:#002319}#machome.mh-and.mh-vivid.mh-dark .mh-chips>*:nth-child(6n+6){background:#0b5a46;color:#b8f3df}",
"#machome.mh-and.mh-vivid .mh-dock>*:nth-child(6n+6) .ic{background:#22c3a0!important;border-radius:50% 14% 50% 50%}",
"#machome.mh-and.mh-vivid .mh-app svg{stroke:#fff}#machome.mh-and.mh-vivid .mh-app:hover .ic{transform:scale(1.14) rotate(-6deg) translateY(-3px)}",
"#machome.mh-and.mh-vivid .mh-ccbtn:nth-child(1){background:#d3f39b;color:#1a2d00}#machome.mh-and.mh-vivid .mh-ccbtn:nth-child(2){background:#ffd8e4;color:#3b0b20}",
"#machome.mh-and.mh-vivid.mh-dark .mh-ccbtn:nth-child(1){background:#38560a;color:#d6f7a3}#machome.mh-and.mh-vivid.mh-dark .mh-ccbtn:nth-child(2){background:#6b2443;color:#ffd8e4}",
"#machome.mh-and.mh-vivid .mh-ccbtn:nth-child(1) .ic{background:#8ccf2e!important;border-radius:34%}#machome.mh-and.mh-vivid .mh-ccbtn:nth-child(2) .ic{background:#ff5c93!important;border-radius:50% 50% 50% 14%}#machome.mh-and.mh-vivid .mh-ccbtn svg{stroke:#fff}",
"#machome.mh-and.mh-vivid .mh-ccg:nth-of-type(1){background:#e5dbff}#machome.mh-and.mh-vivid .mh-ccg:nth-of-type(2){background:#c8e6ff}#machome.mh-and.mh-vivid .mh-ccg:nth-of-type(3){background:#b4f1dc}",
"#machome.mh-and.mh-vivid.mh-dark .mh-ccg:nth-of-type(1){background:#4a3496}#machome.mh-and.mh-vivid.mh-dark .mh-ccg:nth-of-type(2){background:#0e4f86}#machome.mh-and.mh-vivid.mh-dark .mh-ccg:nth-of-type(3){background:#0b5a46}",
"#machome.mh-and.mh-vivid .mh-wth,#machome.mh-and.mh-vivid .mh-wth.night,#machome.mh-and.mh-vivid .mh-wth.grey{background:linear-gradient(135deg,#7cc4ff,#8a6cff);color:#fff;border-radius:40px 40px 40px 14px}#machome.mh-and.mh-vivid .mh-wth .fc{border-left-color:rgba(255,255,255,.35)}",
"#machome.mh-and.mh-vivid .mh-tb .o{background:rgba(255,255,255,.6);color:inherit}#machome.mh-and.mh-vivid.mh-dark .mh-tb .o{background:rgba(255,255,255,.14)}#machome.mh-and.mh-vivid .mh-tb .t{color:inherit;font-size:17px;font-weight:700}",
"#machome.mh-and.mh-vivid .mh-sw.on{background:var(--mh-blue)}#machome.mh-and.mh-vivid .mh-btn{box-shadow:0 2px 0 rgba(0,0,0,.08)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark){--mh-blue:hsl(205,72%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(200,80%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(212,80%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(188,80%,84%) 0%,transparent 62%),hsl(205,40%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark{--mh-blue:hsl(205,72%,80%);--mh-on-pri:hsl(205,72%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(200,80%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(212,80%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(188,80%,22%) 0%,transparent 62%),hsl(205,30%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(200,80%,88%);--mh-text:hsl(200,55%,14%);--mh-text2:hsl(200,30%,30%);--mh-text3:hsl(200,18%,42%);color:hsl(200,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(200,55%,25%);--mh-text:hsl(200,70%,90%);--mh-text2:hsl(200,35%,76%);--mh-text3:hsl(200,20%,62%);color:hsl(200,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(200,80%,86%);color:hsl(200,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(200,55%,27%);color:hsl(200,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-dock>*:nth-child(6n+1) .ic{background:hsl(200,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(212,80%,88%);--mh-text:hsl(212,55%,14%);--mh-text2:hsl(212,30%,30%);--mh-text3:hsl(212,18%,42%);color:hsl(212,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(212,55%,25%);--mh-text:hsl(212,70%,90%);--mh-text2:hsl(212,35%,76%);--mh-text3:hsl(212,20%,62%);color:hsl(212,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(212,80%,86%);color:hsl(212,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(212,55%,27%);color:hsl(212,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-dock>*:nth-child(6n+2) .ic{background:hsl(212,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(188,80%,88%);--mh-text:hsl(188,55%,14%);--mh-text2:hsl(188,30%,30%);--mh-text3:hsl(188,18%,42%);color:hsl(188,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(188,55%,25%);--mh-text:hsl(188,70%,90%);--mh-text2:hsl(188,35%,76%);--mh-text3:hsl(188,20%,62%);color:hsl(188,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(188,80%,86%);color:hsl(188,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(188,55%,27%);color:hsl(188,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-dock>*:nth-child(6n+3) .ic{background:hsl(188,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(224,80%,88%);--mh-text:hsl(224,55%,14%);--mh-text2:hsl(224,30%,30%);--mh-text3:hsl(224,18%,42%);color:hsl(224,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(224,55%,25%);--mh-text:hsl(224,70%,90%);--mh-text2:hsl(224,35%,76%);--mh-text3:hsl(224,20%,62%);color:hsl(224,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(224,80%,86%);color:hsl(224,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(224,55%,27%);color:hsl(224,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-dock>*:nth-child(6n+4) .ic{background:hsl(224,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(176,80%,88%);--mh-text:hsl(176,55%,14%);--mh-text2:hsl(176,30%,30%);--mh-text3:hsl(176,18%,42%);color:hsl(176,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(176,55%,25%);--mh-text:hsl(176,70%,90%);--mh-text2:hsl(176,35%,76%);--mh-text3:hsl(176,20%,62%);color:hsl(176,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(176,80%,86%);color:hsl(176,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(176,55%,27%);color:hsl(176,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-dock>*:nth-child(6n+5) .ic{background:hsl(176,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(235,80%,88%);--mh-text:hsl(235,55%,14%);--mh-text2:hsl(235,30%,30%);--mh-text3:hsl(235,18%,42%);color:hsl(235,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(235,55%,25%);--mh-text:hsl(235,70%,90%);--mh-text2:hsl(235,35%,76%);--mh-text3:hsl(235,20%,62%);color:hsl(235,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(235,80%,86%);color:hsl(235,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(235,55%,27%);color:hsl(235,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-dock>*:nth-child(6n+6) .ic{background:hsl(235,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(200,80%,88%)}#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(212,80%,88%)}#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(188,80%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-ccg:nth-of-type(1){background:hsl(200,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-ccg:nth-of-type(2){background:hsl(212,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-ccg:nth-of-type(3){background:hsl(188,55%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(224,80%,86%);color:hsl(224,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-ocean:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(176,80%,86%);color:hsl(176,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-ccbtn:nth-child(1){background:hsl(224,55%,27%);color:hsl(224,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-ocean.mh-dark .mh-ccbtn:nth-child(2){background:hsl(176,55%,27%);color:hsl(176,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-ccbtn:nth-child(1) .ic{background:hsl(224,72%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-ocean .mh-ccbtn:nth-child(2) .ic{background:hsl(176,72%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-ocean .mh-wth,#machome.mh-and.mh-vivid.mh-pal-ocean .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-ocean .mh-wth.grey{background:linear-gradient(135deg,hsl(212,72%,62%),hsl(205,72%,46%))}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark){--mh-blue:hsl(135,48%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(128,56%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(145,56%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(105,56%,84%) 0%,transparent 62%),hsl(135,40%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark{--mh-blue:hsl(135,48%,80%);--mh-on-pri:hsl(135,48%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(128,56%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(145,56%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(105,56%,22%) 0%,transparent 62%),hsl(135,30%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(128,56%,88%);--mh-text:hsl(128,55%,14%);--mh-text2:hsl(128,30%,30%);--mh-text3:hsl(128,18%,42%);color:hsl(128,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(128,55%,25%);--mh-text:hsl(128,70%,90%);--mh-text2:hsl(128,35%,76%);--mh-text3:hsl(128,20%,62%);color:hsl(128,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(128,56%,86%);color:hsl(128,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(128,55%,27%);color:hsl(128,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-dock>*:nth-child(6n+1) .ic{background:hsl(128,48%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(145,56%,88%);--mh-text:hsl(145,55%,14%);--mh-text2:hsl(145,30%,30%);--mh-text3:hsl(145,18%,42%);color:hsl(145,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(145,55%,25%);--mh-text:hsl(145,70%,90%);--mh-text2:hsl(145,35%,76%);--mh-text3:hsl(145,20%,62%);color:hsl(145,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(145,56%,86%);color:hsl(145,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(145,55%,27%);color:hsl(145,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-dock>*:nth-child(6n+2) .ic{background:hsl(145,48%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(105,56%,88%);--mh-text:hsl(105,55%,14%);--mh-text2:hsl(105,30%,30%);--mh-text3:hsl(105,18%,42%);color:hsl(105,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(105,55%,25%);--mh-text:hsl(105,70%,90%);--mh-text2:hsl(105,35%,76%);--mh-text3:hsl(105,20%,62%);color:hsl(105,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(105,56%,86%);color:hsl(105,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(105,55%,27%);color:hsl(105,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-dock>*:nth-child(6n+3) .ic{background:hsl(105,48%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(160,56%,88%);--mh-text:hsl(160,55%,14%);--mh-text2:hsl(160,30%,30%);--mh-text3:hsl(160,18%,42%);color:hsl(160,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(160,55%,25%);--mh-text:hsl(160,70%,90%);--mh-text2:hsl(160,35%,76%);--mh-text3:hsl(160,20%,62%);color:hsl(160,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(160,56%,86%);color:hsl(160,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(160,55%,27%);color:hsl(160,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-dock>*:nth-child(6n+4) .ic{background:hsl(160,48%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(115,56%,88%);--mh-text:hsl(115,55%,14%);--mh-text2:hsl(115,30%,30%);--mh-text3:hsl(115,18%,42%);color:hsl(115,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(115,55%,25%);--mh-text:hsl(115,70%,90%);--mh-text2:hsl(115,35%,76%);--mh-text3:hsl(115,20%,62%);color:hsl(115,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(115,56%,86%);color:hsl(115,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(115,55%,27%);color:hsl(115,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-dock>*:nth-child(6n+5) .ic{background:hsl(115,48%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(152,56%,88%);--mh-text:hsl(152,55%,14%);--mh-text2:hsl(152,30%,30%);--mh-text3:hsl(152,18%,42%);color:hsl(152,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(152,55%,25%);--mh-text:hsl(152,70%,90%);--mh-text2:hsl(152,35%,76%);--mh-text3:hsl(152,20%,62%);color:hsl(152,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(152,56%,86%);color:hsl(152,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(152,55%,27%);color:hsl(152,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-dock>*:nth-child(6n+6) .ic{background:hsl(152,48%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(128,56%,88%)}#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(145,56%,88%)}#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(105,56%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-ccg:nth-of-type(1){background:hsl(128,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-ccg:nth-of-type(2){background:hsl(145,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-ccg:nth-of-type(3){background:hsl(105,55%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(160,56%,86%);color:hsl(160,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-forest:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(115,56%,86%);color:hsl(115,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-ccbtn:nth-child(1){background:hsl(160,55%,27%);color:hsl(160,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-forest.mh-dark .mh-ccbtn:nth-child(2){background:hsl(115,55%,27%);color:hsl(115,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-ccbtn:nth-child(1) .ic{background:hsl(160,48%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-forest .mh-ccbtn:nth-child(2) .ic{background:hsl(115,48%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-forest .mh-wth,#machome.mh-and.mh-vivid.mh-pal-forest .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-forest .mh-wth.grey{background:linear-gradient(135deg,hsl(145,48%,62%),hsl(135,48%,46%))}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark){--mh-blue:hsl(18,85%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(14,90%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(32,90%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(352,90%,84%) 0%,transparent 62%),hsl(18,40%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark{--mh-blue:hsl(18,85%,80%);--mh-on-pri:hsl(18,85%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(14,90%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(32,90%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(352,90%,22%) 0%,transparent 62%),hsl(18,30%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(14,90%,88%);--mh-text:hsl(14,55%,14%);--mh-text2:hsl(14,30%,30%);--mh-text3:hsl(14,18%,42%);color:hsl(14,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(14,55%,25%);--mh-text:hsl(14,70%,90%);--mh-text2:hsl(14,35%,76%);--mh-text3:hsl(14,20%,62%);color:hsl(14,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(14,90%,86%);color:hsl(14,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(14,55%,27%);color:hsl(14,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-dock>*:nth-child(6n+1) .ic{background:hsl(14,85%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(32,90%,88%);--mh-text:hsl(32,55%,14%);--mh-text2:hsl(32,30%,30%);--mh-text3:hsl(32,18%,42%);color:hsl(32,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(32,55%,25%);--mh-text:hsl(32,70%,90%);--mh-text2:hsl(32,35%,76%);--mh-text3:hsl(32,20%,62%);color:hsl(32,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(32,90%,86%);color:hsl(32,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(32,55%,27%);color:hsl(32,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-dock>*:nth-child(6n+2) .ic{background:hsl(32,85%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(352,90%,88%);--mh-text:hsl(352,55%,14%);--mh-text2:hsl(352,30%,30%);--mh-text3:hsl(352,18%,42%);color:hsl(352,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(352,55%,25%);--mh-text:hsl(352,70%,90%);--mh-text2:hsl(352,35%,76%);--mh-text3:hsl(352,20%,62%);color:hsl(352,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(352,90%,86%);color:hsl(352,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(352,55%,27%);color:hsl(352,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-dock>*:nth-child(6n+3) .ic{background:hsl(352,85%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(42,90%,88%);--mh-text:hsl(42,55%,14%);--mh-text2:hsl(42,30%,30%);--mh-text3:hsl(42,18%,42%);color:hsl(42,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(42,55%,25%);--mh-text:hsl(42,70%,90%);--mh-text2:hsl(42,35%,76%);--mh-text3:hsl(42,20%,62%);color:hsl(42,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(42,90%,86%);color:hsl(42,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(42,55%,27%);color:hsl(42,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-dock>*:nth-child(6n+4) .ic{background:hsl(42,85%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(4,90%,88%);--mh-text:hsl(4,55%,14%);--mh-text2:hsl(4,30%,30%);--mh-text3:hsl(4,18%,42%);color:hsl(4,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(4,55%,25%);--mh-text:hsl(4,70%,90%);--mh-text2:hsl(4,35%,76%);--mh-text3:hsl(4,20%,62%);color:hsl(4,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(4,90%,86%);color:hsl(4,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(4,55%,27%);color:hsl(4,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-dock>*:nth-child(6n+5) .ic{background:hsl(4,85%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(334,90%,88%);--mh-text:hsl(334,55%,14%);--mh-text2:hsl(334,30%,30%);--mh-text3:hsl(334,18%,42%);color:hsl(334,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(334,55%,25%);--mh-text:hsl(334,70%,90%);--mh-text2:hsl(334,35%,76%);--mh-text3:hsl(334,20%,62%);color:hsl(334,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(334,90%,86%);color:hsl(334,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(334,55%,27%);color:hsl(334,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-dock>*:nth-child(6n+6) .ic{background:hsl(334,85%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(14,90%,88%)}#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(32,90%,88%)}#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(352,90%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-ccg:nth-of-type(1){background:hsl(14,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-ccg:nth-of-type(2){background:hsl(32,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-ccg:nth-of-type(3){background:hsl(352,55%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(42,90%,86%);color:hsl(42,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-sunset:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(4,90%,86%);color:hsl(4,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-ccbtn:nth-child(1){background:hsl(42,55%,27%);color:hsl(42,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-sunset.mh-dark .mh-ccbtn:nth-child(2){background:hsl(4,55%,27%);color:hsl(4,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-ccbtn:nth-child(1) .ic{background:hsl(42,85%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-sunset .mh-ccbtn:nth-child(2) .ic{background:hsl(4,85%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-sunset .mh-wth,#machome.mh-and.mh-vivid.mh-pal-sunset .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-sunset .mh-wth.grey{background:linear-gradient(135deg,hsl(32,85%,62%),hsl(18,85%,46%))}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark){--mh-blue:hsl(270,62%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(265,70%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(283,70%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(250,70%,84%) 0%,transparent 62%),hsl(270,40%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark{--mh-blue:hsl(270,62%,80%);--mh-on-pri:hsl(270,62%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(265,70%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(283,70%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(250,70%,22%) 0%,transparent 62%),hsl(270,30%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(265,70%,88%);--mh-text:hsl(265,55%,14%);--mh-text2:hsl(265,30%,30%);--mh-text3:hsl(265,18%,42%);color:hsl(265,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(265,55%,25%);--mh-text:hsl(265,70%,90%);--mh-text2:hsl(265,35%,76%);--mh-text3:hsl(265,20%,62%);color:hsl(265,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(265,70%,86%);color:hsl(265,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(265,55%,27%);color:hsl(265,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-dock>*:nth-child(6n+1) .ic{background:hsl(265,62%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(283,70%,88%);--mh-text:hsl(283,55%,14%);--mh-text2:hsl(283,30%,30%);--mh-text3:hsl(283,18%,42%);color:hsl(283,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(283,55%,25%);--mh-text:hsl(283,70%,90%);--mh-text2:hsl(283,35%,76%);--mh-text3:hsl(283,20%,62%);color:hsl(283,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(283,70%,86%);color:hsl(283,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(283,55%,27%);color:hsl(283,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-dock>*:nth-child(6n+2) .ic{background:hsl(283,62%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(250,70%,88%);--mh-text:hsl(250,55%,14%);--mh-text2:hsl(250,30%,30%);--mh-text3:hsl(250,18%,42%);color:hsl(250,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(250,55%,25%);--mh-text:hsl(250,70%,90%);--mh-text2:hsl(250,35%,76%);--mh-text3:hsl(250,20%,62%);color:hsl(250,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(250,70%,86%);color:hsl(250,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(250,55%,27%);color:hsl(250,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-dock>*:nth-child(6n+3) .ic{background:hsl(250,62%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(298,70%,88%);--mh-text:hsl(298,55%,14%);--mh-text2:hsl(298,30%,30%);--mh-text3:hsl(298,18%,42%);color:hsl(298,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(298,55%,25%);--mh-text:hsl(298,70%,90%);--mh-text2:hsl(298,35%,76%);--mh-text3:hsl(298,20%,62%);color:hsl(298,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(298,70%,86%);color:hsl(298,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(298,55%,27%);color:hsl(298,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-dock>*:nth-child(6n+4) .ic{background:hsl(298,62%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(274,70%,88%);--mh-text:hsl(274,55%,14%);--mh-text2:hsl(274,30%,30%);--mh-text3:hsl(274,18%,42%);color:hsl(274,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(274,55%,25%);--mh-text:hsl(274,70%,90%);--mh-text2:hsl(274,35%,76%);--mh-text3:hsl(274,20%,62%);color:hsl(274,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(274,70%,86%);color:hsl(274,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(274,55%,27%);color:hsl(274,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-dock>*:nth-child(6n+5) .ic{background:hsl(274,62%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(240,70%,88%);--mh-text:hsl(240,55%,14%);--mh-text2:hsl(240,30%,30%);--mh-text3:hsl(240,18%,42%);color:hsl(240,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(240,55%,25%);--mh-text:hsl(240,70%,90%);--mh-text2:hsl(240,35%,76%);--mh-text3:hsl(240,20%,62%);color:hsl(240,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(240,70%,86%);color:hsl(240,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(240,55%,27%);color:hsl(240,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-dock>*:nth-child(6n+6) .ic{background:hsl(240,62%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(265,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(283,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(250,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-ccg:nth-of-type(1){background:hsl(265,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-ccg:nth-of-type(2){background:hsl(283,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-ccg:nth-of-type(3){background:hsl(250,55%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(298,70%,86%);color:hsl(298,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-grape:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(274,70%,86%);color:hsl(274,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-ccbtn:nth-child(1){background:hsl(298,55%,27%);color:hsl(298,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-grape.mh-dark .mh-ccbtn:nth-child(2){background:hsl(274,55%,27%);color:hsl(274,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-ccbtn:nth-child(1) .ic{background:hsl(298,62%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-grape .mh-ccbtn:nth-child(2) .ic{background:hsl(274,62%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-grape .mh-wth,#machome.mh-and.mh-vivid.mh-pal-grape .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-grape .mh-wth.grey{background:linear-gradient(135deg,hsl(283,62%,62%),hsl(270,62%,46%))}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark){--mh-blue:hsl(340,72%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(340,80%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(354,80%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(326,80%,84%) 0%,transparent 62%),hsl(340,40%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark{--mh-blue:hsl(340,72%,80%);--mh-on-pri:hsl(340,72%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(340,80%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(354,80%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(326,80%,22%) 0%,transparent 62%),hsl(340,30%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(340,80%,88%);--mh-text:hsl(340,55%,14%);--mh-text2:hsl(340,30%,30%);--mh-text3:hsl(340,18%,42%);color:hsl(340,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(340,55%,25%);--mh-text:hsl(340,70%,90%);--mh-text2:hsl(340,35%,76%);--mh-text3:hsl(340,20%,62%);color:hsl(340,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(340,80%,86%);color:hsl(340,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(340,55%,27%);color:hsl(340,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-dock>*:nth-child(6n+1) .ic{background:hsl(340,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(354,80%,88%);--mh-text:hsl(354,55%,14%);--mh-text2:hsl(354,30%,30%);--mh-text3:hsl(354,18%,42%);color:hsl(354,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(354,55%,25%);--mh-text:hsl(354,70%,90%);--mh-text2:hsl(354,35%,76%);--mh-text3:hsl(354,20%,62%);color:hsl(354,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(354,80%,86%);color:hsl(354,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(354,55%,27%);color:hsl(354,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-dock>*:nth-child(6n+2) .ic{background:hsl(354,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(326,80%,88%);--mh-text:hsl(326,55%,14%);--mh-text2:hsl(326,30%,30%);--mh-text3:hsl(326,18%,42%);color:hsl(326,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(326,55%,25%);--mh-text:hsl(326,70%,90%);--mh-text2:hsl(326,35%,76%);--mh-text3:hsl(326,20%,62%);color:hsl(326,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(326,80%,86%);color:hsl(326,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(326,55%,27%);color:hsl(326,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-dock>*:nth-child(6n+3) .ic{background:hsl(326,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(8,80%,88%);--mh-text:hsl(8,55%,14%);--mh-text2:hsl(8,30%,30%);--mh-text3:hsl(8,18%,42%);color:hsl(8,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(8,55%,25%);--mh-text:hsl(8,70%,90%);--mh-text2:hsl(8,35%,76%);--mh-text3:hsl(8,20%,62%);color:hsl(8,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(8,80%,86%);color:hsl(8,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(8,55%,27%);color:hsl(8,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-dock>*:nth-child(6n+4) .ic{background:hsl(8,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(334,80%,88%);--mh-text:hsl(334,55%,14%);--mh-text2:hsl(334,30%,30%);--mh-text3:hsl(334,18%,42%);color:hsl(334,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(334,55%,25%);--mh-text:hsl(334,70%,90%);--mh-text2:hsl(334,35%,76%);--mh-text3:hsl(334,20%,62%);color:hsl(334,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(334,80%,86%);color:hsl(334,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(334,55%,27%);color:hsl(334,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-dock>*:nth-child(6n+5) .ic{background:hsl(334,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(316,80%,88%);--mh-text:hsl(316,55%,14%);--mh-text2:hsl(316,30%,30%);--mh-text3:hsl(316,18%,42%);color:hsl(316,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(316,55%,25%);--mh-text:hsl(316,70%,90%);--mh-text2:hsl(316,35%,76%);--mh-text3:hsl(316,20%,62%);color:hsl(316,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(316,80%,86%);color:hsl(316,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(316,55%,27%);color:hsl(316,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-dock>*:nth-child(6n+6) .ic{background:hsl(316,72%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(340,80%,88%)}#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(354,80%,88%)}#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(326,80%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-ccg:nth-of-type(1){background:hsl(340,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-ccg:nth-of-type(2){background:hsl(354,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-ccg:nth-of-type(3){background:hsl(326,55%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(8,80%,86%);color:hsl(8,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-rose:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(334,80%,86%);color:hsl(334,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-ccbtn:nth-child(1){background:hsl(8,55%,27%);color:hsl(8,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-rose.mh-dark .mh-ccbtn:nth-child(2){background:hsl(334,55%,27%);color:hsl(334,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-ccbtn:nth-child(1) .ic{background:hsl(8,72%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-rose .mh-ccbtn:nth-child(2) .ic{background:hsl(334,72%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-rose .mh-wth,#machome.mh-and.mh-vivid.mh-pal-rose .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-rose .mh-wth.grey{background:linear-gradient(135deg,hsl(354,72%,62%),hsl(340,72%,46%))}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark){--mh-blue:hsl(62,78%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(58,86%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(78,86%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(44,86%,84%) 0%,transparent 62%),hsl(62,40%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark{--mh-blue:hsl(62,78%,80%);--mh-on-pri:hsl(62,78%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(58,86%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(78,86%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(44,86%,22%) 0%,transparent 62%),hsl(62,30%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(58,86%,88%);--mh-text:hsl(58,55%,14%);--mh-text2:hsl(58,30%,30%);--mh-text3:hsl(58,18%,42%);color:hsl(58,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(58,55%,25%);--mh-text:hsl(58,70%,90%);--mh-text2:hsl(58,35%,76%);--mh-text3:hsl(58,20%,62%);color:hsl(58,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(58,86%,86%);color:hsl(58,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(58,55%,27%);color:hsl(58,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-dock>*:nth-child(6n+1) .ic{background:hsl(58,78%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(78,86%,88%);--mh-text:hsl(78,55%,14%);--mh-text2:hsl(78,30%,30%);--mh-text3:hsl(78,18%,42%);color:hsl(78,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(78,55%,25%);--mh-text:hsl(78,70%,90%);--mh-text2:hsl(78,35%,76%);--mh-text3:hsl(78,20%,62%);color:hsl(78,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(78,86%,86%);color:hsl(78,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(78,55%,27%);color:hsl(78,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-dock>*:nth-child(6n+2) .ic{background:hsl(78,78%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(44,86%,88%);--mh-text:hsl(44,55%,14%);--mh-text2:hsl(44,30%,30%);--mh-text3:hsl(44,18%,42%);color:hsl(44,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(44,55%,25%);--mh-text:hsl(44,70%,90%);--mh-text2:hsl(44,35%,76%);--mh-text3:hsl(44,20%,62%);color:hsl(44,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(44,86%,86%);color:hsl(44,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(44,55%,27%);color:hsl(44,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-dock>*:nth-child(6n+3) .ic{background:hsl(44,78%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(92,86%,88%);--mh-text:hsl(92,55%,14%);--mh-text2:hsl(92,30%,30%);--mh-text3:hsl(92,18%,42%);color:hsl(92,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(92,55%,25%);--mh-text:hsl(92,70%,90%);--mh-text2:hsl(92,35%,76%);--mh-text3:hsl(92,20%,62%);color:hsl(92,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(92,86%,86%);color:hsl(92,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(92,55%,27%);color:hsl(92,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-dock>*:nth-child(6n+4) .ic{background:hsl(92,78%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(68,86%,88%);--mh-text:hsl(68,55%,14%);--mh-text2:hsl(68,30%,30%);--mh-text3:hsl(68,18%,42%);color:hsl(68,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(68,55%,25%);--mh-text:hsl(68,70%,90%);--mh-text2:hsl(68,35%,76%);--mh-text3:hsl(68,20%,62%);color:hsl(68,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(68,86%,86%);color:hsl(68,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(68,55%,27%);color:hsl(68,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-dock>*:nth-child(6n+5) .ic{background:hsl(68,78%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(36,86%,88%);--mh-text:hsl(36,55%,14%);--mh-text2:hsl(36,30%,30%);--mh-text3:hsl(36,18%,42%);color:hsl(36,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(36,55%,25%);--mh-text:hsl(36,70%,90%);--mh-text2:hsl(36,35%,76%);--mh-text3:hsl(36,20%,62%);color:hsl(36,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(36,86%,86%);color:hsl(36,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(36,55%,27%);color:hsl(36,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-dock>*:nth-child(6n+6) .ic{background:hsl(36,78%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(58,86%,88%)}#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(78,86%,88%)}#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(44,86%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-ccg:nth-of-type(1){background:hsl(58,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-ccg:nth-of-type(2){background:hsl(78,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-ccg:nth-of-type(3){background:hsl(44,55%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(92,86%,86%);color:hsl(92,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-citrus:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(68,86%,86%);color:hsl(68,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-ccbtn:nth-child(1){background:hsl(92,55%,27%);color:hsl(92,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-citrus.mh-dark .mh-ccbtn:nth-child(2){background:hsl(68,55%,27%);color:hsl(68,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-ccbtn:nth-child(1) .ic{background:hsl(92,78%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-citrus .mh-ccbtn:nth-child(2) .ic{background:hsl(68,78%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-citrus .mh-wth,#machome.mh-and.mh-vivid.mh-pal-citrus .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-citrus .mh-wth.grey{background:linear-gradient(135deg,hsl(78,78%,62%),hsl(62,78%,46%))}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark){--mh-blue:hsl(165,55%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(160,63%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(175,63%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(150,63%,84%) 0%,transparent 62%),hsl(165,40%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark{--mh-blue:hsl(165,55%,80%);--mh-on-pri:hsl(165,55%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(160,63%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(175,63%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(150,63%,22%) 0%,transparent 62%),hsl(165,30%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(160,63%,88%);--mh-text:hsl(160,55%,14%);--mh-text2:hsl(160,30%,30%);--mh-text3:hsl(160,18%,42%);color:hsl(160,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(160,55%,25%);--mh-text:hsl(160,70%,90%);--mh-text2:hsl(160,35%,76%);--mh-text3:hsl(160,20%,62%);color:hsl(160,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(160,63%,86%);color:hsl(160,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(160,55%,27%);color:hsl(160,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-dock>*:nth-child(6n+1) .ic{background:hsl(160,55%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(175,63%,88%);--mh-text:hsl(175,55%,14%);--mh-text2:hsl(175,30%,30%);--mh-text3:hsl(175,18%,42%);color:hsl(175,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(175,55%,25%);--mh-text:hsl(175,70%,90%);--mh-text2:hsl(175,35%,76%);--mh-text3:hsl(175,20%,62%);color:hsl(175,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(175,63%,86%);color:hsl(175,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(175,55%,27%);color:hsl(175,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-dock>*:nth-child(6n+2) .ic{background:hsl(175,55%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(150,63%,88%);--mh-text:hsl(150,55%,14%);--mh-text2:hsl(150,30%,30%);--mh-text3:hsl(150,18%,42%);color:hsl(150,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(150,55%,25%);--mh-text:hsl(150,70%,90%);--mh-text2:hsl(150,35%,76%);--mh-text3:hsl(150,20%,62%);color:hsl(150,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(150,63%,86%);color:hsl(150,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(150,55%,27%);color:hsl(150,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-dock>*:nth-child(6n+3) .ic{background:hsl(150,55%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(186,63%,88%);--mh-text:hsl(186,55%,14%);--mh-text2:hsl(186,30%,30%);--mh-text3:hsl(186,18%,42%);color:hsl(186,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(186,55%,25%);--mh-text:hsl(186,70%,90%);--mh-text2:hsl(186,35%,76%);--mh-text3:hsl(186,20%,62%);color:hsl(186,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(186,63%,86%);color:hsl(186,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(186,55%,27%);color:hsl(186,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-dock>*:nth-child(6n+4) .ic{background:hsl(186,55%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(142,63%,88%);--mh-text:hsl(142,55%,14%);--mh-text2:hsl(142,30%,30%);--mh-text3:hsl(142,18%,42%);color:hsl(142,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(142,55%,25%);--mh-text:hsl(142,70%,90%);--mh-text2:hsl(142,35%,76%);--mh-text3:hsl(142,20%,62%);color:hsl(142,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(142,63%,86%);color:hsl(142,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(142,55%,27%);color:hsl(142,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-dock>*:nth-child(6n+5) .ic{background:hsl(142,55%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(196,63%,88%);--mh-text:hsl(196,55%,14%);--mh-text2:hsl(196,30%,30%);--mh-text3:hsl(196,18%,42%);color:hsl(196,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(196,55%,25%);--mh-text:hsl(196,70%,90%);--mh-text2:hsl(196,35%,76%);--mh-text3:hsl(196,20%,62%);color:hsl(196,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(196,63%,86%);color:hsl(196,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(196,55%,27%);color:hsl(196,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-dock>*:nth-child(6n+6) .ic{background:hsl(196,55%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(160,63%,88%)}#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(175,63%,88%)}#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(150,63%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-ccg:nth-of-type(1){background:hsl(160,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-ccg:nth-of-type(2){background:hsl(175,55%,25%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-ccg:nth-of-type(3){background:hsl(150,55%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(186,63%,86%);color:hsl(186,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-mint:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(142,63%,86%);color:hsl(142,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-ccbtn:nth-child(1){background:hsl(186,55%,27%);color:hsl(186,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-mint.mh-dark .mh-ccbtn:nth-child(2){background:hsl(142,55%,27%);color:hsl(142,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-ccbtn:nth-child(1) .ic{background:hsl(186,55%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-mint .mh-ccbtn:nth-child(2) .ic{background:hsl(142,55%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-mint .mh-wth,#machome.mh-and.mh-vivid.mh-pal-mint .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-mint .mh-wth.grey{background:linear-gradient(135deg,hsl(175,55%,62%),hsl(165,55%,46%))}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark){--mh-blue:hsl(220,30%,42%);--mh-on-pri:#fff;--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(215,24%,84%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(225,24%,86%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(205,24%,84%) 0%,transparent 62%),hsl(220,16%,98%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark{--mh-blue:hsl(220,30%,80%);--mh-on-pri:hsl(220,30%,18%);--mh-wall:radial-gradient(700px 480px at 2% 0%,hsl(215,24%,22%) 0%,transparent 62%),radial-gradient(640px 520px at 98% 4%,hsl(225,24%,20%) 0%,transparent 60%),radial-gradient(760px 560px at 60% 112%,hsl(205,24%,22%) 0%,transparent 62%),hsl(220,16%,7%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(215,24%,88%);--mh-text:hsl(215,55%,14%);--mh-text2:hsl(215,30%,30%);--mh-text3:hsl(215,18%,42%);color:hsl(215,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-grid>.mh-win:nth-child(6n+1){--mh-glass:hsl(215,24%,25%);--mh-text:hsl(215,70%,90%);--mh-text2:hsl(215,35%,76%);--mh-text3:hsl(215,20%,62%);color:hsl(215,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-chips>*:nth-child(6n+1){background:hsl(215,24%,86%);color:hsl(215,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-chips>*:nth-child(6n+1){background:hsl(215,24%,27%);color:hsl(215,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-dock>*:nth-child(6n+1) .ic{background:hsl(215,25%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(225,24%,88%);--mh-text:hsl(225,55%,14%);--mh-text2:hsl(225,30%,30%);--mh-text3:hsl(225,18%,42%);color:hsl(225,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-grid>.mh-win:nth-child(6n+2){--mh-glass:hsl(225,24%,25%);--mh-text:hsl(225,70%,90%);--mh-text2:hsl(225,35%,76%);--mh-text3:hsl(225,20%,62%);color:hsl(225,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-chips>*:nth-child(6n+2){background:hsl(225,24%,86%);color:hsl(225,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-chips>*:nth-child(6n+2){background:hsl(225,24%,27%);color:hsl(225,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-dock>*:nth-child(6n+2) .ic{background:hsl(225,25%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(205,24%,88%);--mh-text:hsl(205,55%,14%);--mh-text2:hsl(205,30%,30%);--mh-text3:hsl(205,18%,42%);color:hsl(205,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-grid>.mh-win:nth-child(6n+3){--mh-glass:hsl(205,24%,25%);--mh-text:hsl(205,70%,90%);--mh-text2:hsl(205,35%,76%);--mh-text3:hsl(205,20%,62%);color:hsl(205,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-chips>*:nth-child(6n+3){background:hsl(205,24%,86%);color:hsl(205,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-chips>*:nth-child(6n+3){background:hsl(205,24%,27%);color:hsl(205,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-dock>*:nth-child(6n+3) .ic{background:hsl(205,25%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(232,24%,88%);--mh-text:hsl(232,55%,14%);--mh-text2:hsl(232,30%,30%);--mh-text3:hsl(232,18%,42%);color:hsl(232,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-grid>.mh-win:nth-child(6n+4){--mh-glass:hsl(232,24%,25%);--mh-text:hsl(232,70%,90%);--mh-text2:hsl(232,35%,76%);--mh-text3:hsl(232,20%,62%);color:hsl(232,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-chips>*:nth-child(6n+4){background:hsl(232,24%,86%);color:hsl(232,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-chips>*:nth-child(6n+4){background:hsl(232,24%,27%);color:hsl(232,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-dock>*:nth-child(6n+4) .ic{background:hsl(232,25%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(210,24%,88%);--mh-text:hsl(210,55%,14%);--mh-text2:hsl(210,30%,30%);--mh-text3:hsl(210,18%,42%);color:hsl(210,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-grid>.mh-win:nth-child(6n+5){--mh-glass:hsl(210,24%,25%);--mh-text:hsl(210,70%,90%);--mh-text2:hsl(210,35%,76%);--mh-text3:hsl(210,20%,62%);color:hsl(210,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-chips>*:nth-child(6n+5){background:hsl(210,24%,86%);color:hsl(210,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-chips>*:nth-child(6n+5){background:hsl(210,24%,27%);color:hsl(210,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-dock>*:nth-child(6n+5) .ic{background:hsl(210,25%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(220,24%,88%);--mh-text:hsl(220,55%,14%);--mh-text2:hsl(220,30%,30%);--mh-text3:hsl(220,18%,42%);color:hsl(220,55%,14%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-grid>.mh-win:nth-child(6n+6){--mh-glass:hsl(220,24%,25%);--mh-text:hsl(220,70%,90%);--mh-text2:hsl(220,35%,76%);--mh-text3:hsl(220,20%,62%);color:hsl(220,70%,90%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-chips>*:nth-child(6n+6){background:hsl(220,24%,86%);color:hsl(220,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-chips>*:nth-child(6n+6){background:hsl(220,24%,27%);color:hsl(220,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-dock>*:nth-child(6n+6) .ic{background:hsl(220,25%,52%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-ccg:nth-of-type(1){background:hsl(215,24%,88%)}#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-ccg:nth-of-type(2){background:hsl(225,24%,88%)}#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-ccg:nth-of-type(3){background:hsl(205,24%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-ccg:nth-of-type(1){background:hsl(215,24%,25%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-ccg:nth-of-type(2){background:hsl(225,24%,25%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-ccg:nth-of-type(3){background:hsl(205,24%,25%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-ccbtn:nth-child(1){background:hsl(232,24%,86%);color:hsl(232,55%,16%)}#machome.mh-and.mh-vivid.mh-pal-slate:not(.mh-dark) .mh-ccbtn:nth-child(2){background:hsl(210,24%,86%);color:hsl(210,55%,16%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-ccbtn:nth-child(1){background:hsl(232,24%,27%);color:hsl(232,70%,88%)}#machome.mh-and.mh-vivid.mh-pal-slate.mh-dark .mh-ccbtn:nth-child(2){background:hsl(210,24%,27%);color:hsl(210,70%,88%)}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-ccbtn:nth-child(1) .ic{background:hsl(232,25%,50%)!important}#machome.mh-and.mh-vivid.mh-pal-slate .mh-ccbtn:nth-child(2) .ic{background:hsl(210,25%,50%)!important}",
"#machome.mh-and.mh-vivid.mh-pal-slate .mh-wth,#machome.mh-and.mh-vivid.mh-pal-slate .mh-wth.night,#machome.mh-and.mh-vivid.mh-pal-slate .mh-wth.grey{background:linear-gradient(135deg,hsl(225,25%,62%),hsl(220,25%,46%))}",
"#machome .mh-palr{flex-wrap:wrap}#machome .mh-pals{display:flex;flex-wrap:wrap;gap:8px;width:100%;padding:8px 0 4px}",
"#machome .mh-pals button{width:28px;height:28px;border-radius:50%;border:0;padding:0;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.12);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}#machome .mh-pals button:hover{transform:scale(1.15)}",
"#machome .mh-pals button.on{outline:3px solid var(--mh-blue);outline-offset:2px}",
"#machome:not(.mh-and).mh-acc-blue:not(.mh-dark){--mh-blue:hsl(211,100%,50%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(189,80%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(229,80%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(211,80%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(201,60%,95%),hsl(221,60%,90%))}",
"#machome:not(.mh-and).mh-acc-blue.mh-dark{--mh-blue:hsl(211,100%,62%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(189,80%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(229,80%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(211,80%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(211,40%,10%),hsl(221,40%,6%))}",
"#machome:not(.mh-and).mh-acc-blue .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and).mh-acc-purple:not(.mh-dark){--mh-blue:hsl(280,62%,52%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(258,62%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(298,62%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(280,62%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(270,60%,95%),hsl(290,60%,90%))}",
"#machome:not(.mh-and).mh-acc-purple.mh-dark{--mh-blue:hsl(280,62%,64%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(258,62%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(298,62%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(280,62%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(280,40%,10%),hsl(290,40%,6%))}",
"#machome:not(.mh-and).mh-acc-purple .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and).mh-acc-pink:not(.mh-dark){--mh-blue:hsl(330,85%,55%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(308,80%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(348,80%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(330,80%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(320,60%,95%),hsl(340,60%,90%))}",
"#machome:not(.mh-and).mh-acc-pink.mh-dark{--mh-blue:hsl(330,85%,67%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(308,80%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(348,80%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(330,80%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(330,40%,10%),hsl(340,40%,6%))}",
"#machome:not(.mh-and).mh-acc-pink .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and).mh-acc-red:not(.mh-dark){--mh-blue:hsl(3,88%,55%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(341,80%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(21,80%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(3,80%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(353,60%,95%),hsl(13,60%,90%))}",
"#machome:not(.mh-and).mh-acc-red.mh-dark{--mh-blue:hsl(3,88%,67%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(341,80%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(21,80%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(3,80%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(3,40%,10%),hsl(13,40%,6%))}",
"#machome:not(.mh-and).mh-acc-red .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and).mh-acc-orange:not(.mh-dark){--mh-blue:hsl(30,95%,50%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(8,80%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(48,80%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(30,80%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(20,60%,95%),hsl(40,60%,90%))}",
"#machome:not(.mh-and).mh-acc-orange.mh-dark{--mh-blue:hsl(30,95%,62%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(8,80%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(48,80%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(30,80%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(30,40%,10%),hsl(40,40%,6%))}",
"#machome:not(.mh-and).mh-acc-orange .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and).mh-acc-yellow:not(.mh-dark){--mh-blue:hsl(44,95%,42%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(22,80%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(62,80%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(44,80%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(34,60%,95%),hsl(54,60%,90%))}",
"#machome:not(.mh-and).mh-acc-yellow.mh-dark{--mh-blue:hsl(44,95%,60%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(22,80%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(62,80%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(44,80%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(44,40%,10%),hsl(54,40%,6%))}",
"#machome:not(.mh-and).mh-acc-yellow .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and).mh-acc-green:not(.mh-dark){--mh-blue:hsl(135,55%,40%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(113,55%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(153,55%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(135,55%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(125,55%,95%),hsl(145,55%,90%))}",
"#machome:not(.mh-and).mh-acc-green.mh-dark{--mh-blue:hsl(135,55%,60%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(113,55%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(153,55%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(135,55%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(135,40%,10%),hsl(145,40%,6%))}",
"#machome:not(.mh-and).mh-acc-green .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and).mh-acc-graphite:not(.mh-dark){--mh-blue:hsl(220,8%,45%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(198,8%,84%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(238,8%,80%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(220,8%,78%) 0%,transparent 62%),linear-gradient(160deg,hsl(210,8%,95%),hsl(230,8%,90%))}",
"#machome:not(.mh-and).mh-acc-graphite.mh-dark{--mh-blue:hsl(220,8%,60%);--mh-wall:radial-gradient(1100px 620px at 8% -8%,hsl(198,8%,28%) 0%,transparent 60%),radial-gradient(900px 620px at 100% 0%,hsl(238,8%,24%) 0%,transparent 58%),radial-gradient(1000px 700px at 50% 125%,hsl(220,8%,26%) 0%,transparent 64%),linear-gradient(160deg,hsl(220,8%,10%),hsl(230,8%,6%))}",
"#machome:not(.mh-and).mh-acc-graphite .mh-sw.on{background:var(--mh-blue)}",
"#machome:not(.mh-and) .mh-pals button.acc{box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.15),inset 0 2px 4px rgba(255,255,255,.35)}",
"#machome .mh-win.mh-uhide{display:none!important}#machome.mh-editing .mh-win{outline:2px dashed var(--mh-blue);outline-offset:-2px}#machome.mh-editing .mh-win.mh-hid{opacity:.45}",
"#machome .mh-edt{display:inline-flex;gap:4px;margin-left:auto;margin-right:8px;position:relative;z-index:2}#machome .mh-edt button{border:0;border-radius:8px;padding:3px 8px;font:inherit;font-size:11px;font-weight:700;cursor:pointer;background:var(--mh-track);color:var(--mh-text)}#machome .mh-edt button:hover{background:var(--mh-blue);color:#fff}",
"#machome.mh-editing .mh-tb .t{position:static;transform:none;margin-left:12px}",
"#machome .mh-layb{position:fixed;bottom:110px;left:50%;transform:translateX(-50%);z-index:60;display:flex;justify-content:center;gap:10px;pointer-events:none}#machome .mh-layb>div{pointer-events:auto;display:flex;gap:10px;align-items:center;padding:8px 10px 8px 16px;border-radius:999px;background:var(--mh-glass);box-shadow:var(--mh-shadow);-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);font-weight:600;font-size:12px}",
"@keyframes mhFlow{to{stroke-dashoffset:-12}}",
"#machome .mh-ppl{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}#machome .mh-ppl>div{display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;background:var(--mh-row)}#machome .mh-ppl i{width:38px;height:38px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-style:normal;font-weight:700;font-size:16px;position:relative}",
"#machome .mh-ppl i::after{content:'';position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;border:2px solid var(--mh-glass);background:var(--mh-text3)}#machome .mh-ppl .home i::after{background:var(--mh-green)}#machome .mh-ppl b{display:block;font-size:13px}#machome .mh-ppl small{color:var(--mh-text2);font-size:11px}",
"#machome .mh-dbig{font-size:30px;font-weight:700;letter-spacing:-.02em}#machome .mh-dbig small{font-size:13px;font-weight:500;color:var(--mh-text2);margin-left:6px}#machome .mh-meter{height:10px;border-radius:5px;background:var(--mh-track);overflow:hidden;margin:10px 0 6px}#machome .mh-meter i{display:block;height:100%;border-radius:5px}",
"#machome .mh-dbars{display:flex;align-items:flex-end;gap:2px;height:54px;margin-top:10px}#machome .mh-dbars i{flex:1;min-width:2px;border-radius:2px 2px 0 0;background:var(--mh-blue);opacity:.75}#machome .mh-dbars i.t{opacity:1}",
"#machome .mh-sph svg{display:block;width:100%;height:auto}#machome .mh-sph .lg{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;margin-top:6px}#machome .mh-sph .lg span{display:inline-flex;align-items:center;gap:5px}#machome .mh-sph .lg i{width:10px;height:10px;border-radius:3px;display:inline-block}",
"#machome .mh-seg2{display:inline-flex;gap:2px;padding:2px;border-radius:9px;background:var(--mh-track);margin-bottom:6px}#machome .mh-seg2 button{border:0;background:none;font:inherit;font-size:11px;font-weight:600;padding:4px 10px;border-radius:7px;cursor:pointer;color:var(--mh-text2)}#machome .mh-seg2 button.on{background:var(--mh-glass);color:var(--mh-text)}",
"#machome .mh-adb div{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:12px;padding:5px 0}#machome .mh-adb i{grid-column:1/-1;height:6px;border-radius:3px;background:var(--mh-red);opacity:.75;display:block}",
"#machome-modal .mh-dsec{margin-top:14px;padding-top:10px;border-top:.5px solid var(--mh-track)}#machome-modal .mh-dsec h4{margin:0 0 6px;font-size:12px}#machome-modal .mh-dsec small{color:var(--mh-text2)}#machome-modal .mh-days{display:flex;gap:4px;margin:6px 0}",
"#machome-modal .mh-days button{width:30px;height:30px;border-radius:50%;border:0;font:inherit;font-weight:700;font-size:11px;cursor:pointer;background:var(--mh-track);color:var(--mh-text)}#machome-modal .mh-days button.on{background:var(--mh-blue);color:#fff}#machome-modal .mh-trow{display:flex;gap:8px;align-items:center;font-size:12px}#machome-modal .mh-trow input[type=time]{width:auto}",
"#machome-modal .mh-dsec label:has(input[type=checkbox]),#machome-modal label:has(#mh-dun){display:flex;gap:8px;align-items:center;margin:4px 0}#machome-modal .mh-dsec input[type=checkbox],#machome-modal #mh-dun{width:auto;margin:0;flex:none}",
"#machome .mh-ver{text-align:center;font-size:11px;color:var(--mh-text3);padding:14px 0 0;letter-spacing:.02em}",
"@keyframes mhIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}",
"#machome .mh-tb{height:36px;display:flex;align-items:center;padding:0 12px;border-bottom:.5px solid var(--mh-sep);position:relative;flex:none}",
"#machome .mh-tl{display:flex;gap:8px}",
"#machome .mh-tl i{width:12px;height:12px;border-radius:50%;display:block;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.18)}",
"#machome .mh-tl i:nth-child(1){background:#ff5f57}#machome .mh-tl i:nth-child(2){background:#febc2e}#machome .mh-tl i:nth-child(3){background:#28c840}",
"#machome .mh-tb .t{position:absolute;left:50%;transform:translateX(-50%);font-weight:600;font-size:13px;color:var(--mh-text2);white-space:nowrap}",
"#machome .mh-tb .t{display:inline-flex;align-items:center;gap:6px}#machome .mh-tic{width:18px;height:18px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}#machome .mh-tic svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-tb .o{margin-left:auto;font-size:12px;color:var(--mh-blue);cursor:pointer;font-weight:500;background:none;border:0;padding:4px 0;font-family:inherit}",
"#machome .mh-tb .o:hover{text-decoration:underline}",
"#machome .mh-body{padding:16px;flex:1}",
/* gauges */
"#machome .mh-gauges{display:flex;justify-content:space-around;gap:10px;flex-wrap:wrap;padding:4px 0 14px}",
"#machome .mh-gauge{position:relative;width:110px;text-align:center}",
"#machome .mh-gauge svg{width:110px;height:110px;display:block}",
"#machome .mh-gauge .trk{fill:none;stroke:var(--mh-track);stroke-width:9}",
"#machome .mh-gauge .val{fill:none;stroke-width:9;stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1),stroke .4s}",
"#machome .mh-gv{position:absolute;top:0;left:0;width:110px;height:110px;display:flex;flex-direction:column;align-items:center;justify-content:center}",
"#machome .mh-gv b{font-size:22px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}",
"#machome .mh-gv small{font-size:11px;color:var(--mh-text2)}",
"#machome .mh-gl{margin-top:4px;font-weight:600;font-size:12px;color:var(--mh-text2)}",
/* key/value lists */
"#machome .mh-kv{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(180px,100%),1fr));gap:0 18px}",
"#machome .mh-kv div{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:.5px solid var(--mh-sep);min-width:0}",
"#machome .mh-kv span{color:var(--mh-text2);white-space:nowrap}",
"#machome .mh-kv b{font-weight:500;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}",
"#machome .mh-win.uplw:not(.on){display:none}",
"#machome .mh-win.vhw:not(.on){display:none}",
"#machome-modal .sheet.mh-dnsw{max-width:780px;width:calc(100vw - 32px);text-align:left}#machome-modal .sheet.mh-dnsw h2{text-align:center}",
"#machome-modal .mh-dv{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 12px;border-radius:12px;font-weight:700;font-size:16px;margin:6px 0 4px;text-align:center}#machome-modal .mh-dv small{font-weight:500;font-size:12px;opacity:.8}#machome-modal .mh-dv span{font-weight:500;font-size:12px;color:var(--mh-text2)}#machome-modal .mh-dv.ok{background:rgba(52,199,89,.13)}#machome-modal .mh-dv.bad{background:rgba(255,59,48,.14)}",
"#machome-modal .mh-dsec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mh-text3);margin:14px 2px 6px}",
"#machome-modal .mh-dflow{display:flex;flex-direction:column;gap:6px}#machome-modal .mh-dfr{display:flex;align-items:stretch;gap:6px;flex-wrap:wrap}#machome-modal .mh-da{align-self:center;color:var(--mh-text3);font-weight:700}",
"#machome-modal .mh-dc{display:flex;flex-direction:column;justify-content:center;padding:6px 10px;border-radius:9px;background:var(--mh-row);font-size:12px;min-width:0;max-width:100%}#machome-modal .mh-dc b{font-weight:600}#machome-modal .mh-dc small{color:var(--mh-text2);font-size:11px;line-height:1.35;overflow-wrap:anywhere}#machome-modal .mh-dc.teal{box-shadow:inset 0 0 0 1.5px var(--mh-teal)}#machome-modal .mh-dc.ok{box-shadow:inset 0 0 0 1.5px var(--mh-green)}#machome-modal .mh-dc.warn{box-shadow:inset 0 0 0 1.5px var(--mh-orange)}#machome-modal .mh-dc.muted{opacity:.7}",
"#machome-modal .mh-dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:6px}#machome-modal .mh-dk{padding:7px 10px;border-radius:9px;background:var(--mh-row);font-size:12px;min-width:0}#machome-modal .mh-dk span{display:block;color:var(--mh-text3);font-size:11px}#machome-modal .mh-dk b{display:block;font-weight:600;overflow-wrap:anywhere}#machome-modal .mh-dk b small{font-weight:400;color:var(--mh-text2)}#machome-modal .mh-dk>small{display:block;color:var(--mh-text2);font-size:11px;line-height:1.35;margin-top:2px}",
"#machome-modal .mh-dtun{border:1px solid var(--mh-sep);border-radius:12px;padding:6px;display:flex;flex-direction:column;gap:6px}#machome-modal .mh-dth{font-weight:700;font-size:12.5px;padding:2px 4px}#machome-modal .mh-dth small{font-weight:500;color:var(--mh-text2);margin-left:6px}#machome-modal .mh-dc.struck b,#machome-modal .mh-dc.struck small{text-decoration:line-through;opacity:.6}#machome-modal .mh-dnote{align-self:center;font-size:11px;color:var(--mh-text2);font-style:italic}",
"#machome-modal .mh-dmap{display:flex;flex-direction:column;margin-top:8px}#machome-modal .mh-dst{display:flex;gap:10px;align-items:flex-start;padding:7px 10px;border-radius:10px;background:var(--mh-row);font-size:12px}#machome-modal .mh-dst .ic{font-size:16px;width:22px;text-align:center;flex:none}#machome-modal .mh-dst b{display:block;font-weight:600;overflow-wrap:anywhere}#machome-modal .mh-dst small{display:block;color:var(--mh-text2);font-size:11px;line-height:1.35;overflow-wrap:anywhere}#machome-modal .mh-dst.teal{box-shadow:inset 0 0 0 1.5px var(--mh-teal)}#machome-modal .mh-dst.ok{box-shadow:inset 0 0 0 1.5px var(--mh-green)}#machome-modal .mh-dst.bad{background:rgba(255,59,48,.10)}#machome-modal .mh-dst.muted{opacity:.75}#machome-modal .mh-dsg{margin-left:20px;border-left:2px dashed var(--mh-sep);padding:2px 0 2px 12px;font-size:10.5px;color:var(--mh-text3);min-height:12px}#machome-modal .mh-dbs{margin:12px 2px 6px;font-size:11px;font-weight:600;color:var(--mh-text2)}",
"#machome-modal .mh-dp{margin:0 2px;font-size:12.5px}#machome-modal .mh-dp small{color:var(--mh-text2)}",
"#machome-modal .mh-drace{display:flex;gap:8px}#machome-modal .mh-drace input{flex:1;min-width:0;padding:8px 10px;border-radius:9px;border:1px solid var(--mh-sep);background:var(--mh-row);color:var(--mh-text);font:inherit;font-size:13px}#machome-modal .mh-drace button{margin:0;flex:none;padding:8px 16px;border-radius:9px;border:0;background:var(--mh-blue);color:#fff;font-weight:600;cursor:pointer;font-family:inherit}#machome-modal .mh-drace button:disabled{opacity:.6}",
"#machome-modal .mh-drr{margin-top:8px;display:flex;flex-direction:column;gap:5px}#machome-modal .mh-drow{display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:9px;background:var(--mh-row);font-size:12px}#machome-modal .mh-drow.bad{background:rgba(255,59,48,.10)}#machome-modal .mh-drow .md{width:22px;text-align:center;font-size:16px}#machome-modal .mh-drow .lb{flex:1;min-width:0}#machome-modal .mh-drow .lb b{display:block;font-weight:600}#machome-modal .mh-drow small{display:block;color:var(--mh-text2);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#machome-modal .mh-drow .rt{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}",
"#machome-modal .mh-dfun{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;margin-top:14px;padding:10px 12px;border-radius:12px;background:var(--mh-row);font-size:12px}#machome-modal .mh-dhaiku{font-style:italic;font-family:Georgia,serif;color:var(--mh-text2);line-height:1.5;border-right:1px solid var(--mh-sep);padding-right:14px}",
"@media (max-width:560px){#machome-modal .mh-dfun{grid-template-columns:1fr}#machome-modal .mh-dhaiku{border-right:0;padding-right:0}}",
"#machome .mh-vwb{margin:0 0 0 auto;align-self:center;white-space:nowrap;font-variant-numeric:tabular-nums}",
"#machome-modal .mh-srvl{max-height:50vh;overflow-y:auto;margin:6px 0 4px}#machome-modal .mh-srvg{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--mh-text3);margin:12px 2px 6px}",
"#machome-modal .mh-srv{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;margin:0 0 6px;border:0;border-radius:10px;background:var(--mh-row);color:var(--mh-text);font:inherit;cursor:pointer}#machome-modal .mh-srv:hover:not(:disabled){background:var(--mh-track)}#machome-modal .mh-srv .m{flex:1;min-width:0}#machome-modal .mh-srv b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#machome-modal .mh-srv small{display:block;font-size:11px;color:var(--mh-text2)}#machome-modal .mh-srv.cur{box-shadow:inset 0 0 0 2px var(--mh-green);cursor:default}#machome-modal .mh-srv:disabled:not(.cur){opacity:.5;cursor:not-allowed}#machome-modal .mh-srv .ck{color:var(--mh-green);font-weight:700}",
"#machome .mh-vh{background:var(--mh-row);border-radius:10px;padding:9px 11px}#machome .mh-vh+.mh-vh{margin-top:6px}",
"#machome .mh-vh>b{display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:3px}#machome .mh-vh>b .d{width:9px;height:9px;border-radius:50%;flex:none}#machome .mh-vh>b span{margin-left:auto;font-size:11px;font-weight:600}",
"#machome .mh-vk{display:flex;gap:7px;font-size:12px;line-height:1.55;color:var(--mh-text2)}#machome .mh-vk i{font-style:normal;font-weight:700;width:14px;flex:none;text-align:center}#machome .mh-vk em{font-style:normal;color:var(--mh-text)}",
/* travel cards */
"#machome .mh-grade,#machome-modal .mh-grade{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 5px;border-radius:7px;color:#fff;font-weight:800;font-size:12px;vertical-align:middle;box-sizing:border-box}",
"#machome .mh-trvp{margin:10px 0;padding:12px 14px;border-radius:12px;background:rgba(255,149,0,.12);border-left:4px solid var(--mh-orange)}#machome .mh-trvp b{display:block;font-size:14px}#machome .mh-trvp small{display:block;color:var(--mh-text2);font-size:12px;margin:3px 0 8px;line-height:1.4}#machome .mh-trvp .mh-btn{margin:0;background:var(--mh-orange)}",
"#machome .mh-trvd{font-size:13px;color:var(--mh-text2);margin:4px 0}#machome .mh-trvd b{font-size:20px;color:var(--mh-text);margin-right:4px}",
"#machome .mh-trvh{display:flex;gap:10px;align-items:flex-start;padding:6px 0;font-size:13px}#machome .mh-trvh .i{flex:none;width:20px;text-align:center}#machome .mh-trvh b{display:block;font-weight:600}#machome .mh-trvh small{display:block;color:var(--mh-text2);font-size:12px;margin-top:1px;line-height:1.4}#machome .mh-trvh.bad b{color:var(--mh-orange)}",
"#machome .mh-nets .r{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:.5px solid var(--mh-sep)}#machome .mh-nets .r:last-child{border-bottom:0}#machome .mh-nets .g .mh-grade{width:34px;height:34px;font-size:16px;border-radius:10px}",
"#machome .mh-nets .t{flex:1;min-width:0}#machome .mh-nets .t b{display:block;font-size:13px;font-weight:600}#machome .mh-nets .t small{display:block;color:var(--mh-text2);font-size:12px;line-height:1.4}",
"#machome .mh-lbox{margin-top:16px;padding:14px 16px;border-radius:14px;background:var(--mh-row);border:.5px solid var(--mh-sep)}#machome .mh-lbox .mh-sth{margin-top:0}",
"#machome .mh-dnsw{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;margin:8px 0 6px;border-radius:10px;background:var(--mh-glass);font-size:13px}#machome .mh-dnsw .i{flex:none;width:20px;text-align:center}#machome .mh-dnsw b{display:block;font-weight:600}#machome .mh-dnsw small{display:block;color:var(--mh-text2);font-size:12px;margin-top:2px;line-height:1.45}#machome .mh-dnsw.bad b{color:var(--mh-red)}",
"#machome .mh-leaksum{font-weight:700;font-size:13px;margin:6px 0 2px}#machome .mh-leak>div{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:.5px solid var(--mh-sep);font-size:13px}",
"#machome .mh-leakd{margin:6px 0 2px}#machome .mh-leakd>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:6px 8px;margin:0 -8px;border-radius:8px}#machome .mh-leakd>summary::-webkit-details-marker{display:none}#machome .mh-leakd>summary::before{content:'';width:6px;height:6px;border-right:2px solid var(--mh-text2);border-bottom:2px solid var(--mh-text2);transform:rotate(-45deg);transition:transform .15s;flex:none;margin:0 3px 0 1px}#machome .mh-leakd[open]>summary::before{transform:rotate(45deg)}#machome .mh-leakd>summary:hover{background:var(--mh-track)}#machome .mh-leakd .n{margin-left:auto;font-weight:500;font-size:12px;color:var(--mh-text2)}",
"#machome .mh-leak .i{flex:none;width:20px;text-align:center}#machome .mh-leak b{display:block;font-weight:600}#machome .mh-leak small{display:block;color:var(--mh-text2);font-size:12px;margin-top:1px;line-height:1.4}#machome .mh-leak .bad b{color:var(--mh-orange)}",
"#machome-modal .sheet:has(.mh-evm){width:640px;max-width:94vw}#machome-modal .mh-evm .mh-evl{max-height:60vh;overflow:auto;margin:6px 0 0;text-align:left;border-top:.5px solid var(--mh-sep)}#machome-modal .mh-evmore{font-size:11px;color:var(--mh-text2);margin-top:6px}",
"#machome-modal .mh-ev{border-bottom:.5px solid var(--mh-sep)}#machome-modal .mh-ev summary{display:flex;align-items:center;gap:8px;padding:9px 4px;cursor:pointer;list-style:none;font-size:13px;color:var(--mh-text)}#machome-modal .mh-ev summary::-webkit-details-marker{display:none}",
"#machome-modal .mh-ev i{width:8px;height:8px;border-radius:50%;flex:none}#machome-modal .mh-ev b{flex:1;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#machome-modal .mh-ev small{color:var(--mh-text2);font-size:11px;white-space:nowrap}",
"#machome-modal .mh-evclr{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:2px 0 10px;font-size:12px;color:var(--mh-text2);text-align:left}#machome-modal .mh-evclr button{border:0;border-radius:8px;padding:5px 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;background:var(--mh-track);color:var(--mh-text)}#machome-modal .mh-evclr button:hover{background:var(--mh-sep)}#machome-modal .mh-evclr button.dang{background:var(--mh-red);color:#fff}",
"#machome-modal .mh-ev p{margin:0 0 9px 20px;font-size:12px;color:var(--mh-text2);line-height:1.45;text-align:left}#machome-modal .mh-ev p .k{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--mh-text3);margin-right:4px}",
"#machome-modal .sheet:has(.mh-about){width:760px;max-width:94vw}#machome-modal .mh-about{text-align:left}#machome-modal .mh-about h2,#machome-modal .mh-about .hic{text-align:center}",
"#machome-modal .mh-ab-sub{text-align:center;color:var(--mh-text2);font-size:12px;margin:2px 0 12px}#machome-modal .mh-ab-q{margin-bottom:8px}#machome-modal .mh-al-q{margin:4px 0 10px}#machome-modal .mh-al-none{color:var(--mh-text2);font-size:13px;margin:14px 0}",
"#machome-modal .mh-about details{border-bottom:.5px solid var(--mh-sep);padding:2px 0}#machome-modal .mh-about details[hidden]{display:none}",
"#machome-modal .mh-about summary{cursor:pointer;font-weight:700;font-size:14px;padding:10px 4px;display:flex;justify-content:space-between;align-items:center;color:var(--mh-text)}#machome-modal .mh-about summary small{font-weight:600;font-size:11px;color:var(--mh-text2);background:var(--mh-track);border-radius:10px;padding:1px 8px}",
"#machome-modal .mh-ab-in{font-size:12px;color:var(--mh-text2);margin:0 4px 6px;text-align:left}#machome-modal .mh-about dl{margin:0 4px 10px}#machome-modal .mh-ab-f[hidden]{display:none}",
"#machome-modal .mh-about dt{font-weight:600;font-size:13px;margin-top:10px;color:var(--mh-text)}#machome-modal .mh-about dd{margin:2px 0 0;font-size:12.5px;color:var(--mh-text2);line-height:1.5}",
"#machome-modal .mh-ab-cred{text-align:center;font-size:12px;color:var(--mh-text2);margin:16px 0 0}#machome-modal .mh-ab-none{text-align:center;color:var(--mh-text2);font-size:13px}",
"#machome .mh-sig{display:flex;align-items:center;gap:10px;margin:12px 0 6px}#machome .mh-sig b{font-size:15px;font-variant-numeric:tabular-nums}#machome .mh-sig span.q{color:var(--mh-text2);font-size:12px}",
"#machome .mh-sbars,#machome-modal .mh-sbars{display:inline-flex;align-items:flex-end;gap:3px;height:20px;flex:none}#machome .mh-sbars i,#machome-modal .mh-sbars i{display:block;width:6px;border-radius:2px}",
"#machome .mh-body[data-k=upl]>.mh-btn{align-self:flex-start;margin-top:12px}",
"#machome-modal .mh-wl{max-height:40vh;overflow:auto;margin:4px 0;border-top:.5px solid var(--mh-sep)}",
"#machome-modal .mh-wl>div{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:.5px solid var(--mh-sep);cursor:pointer;font-size:13px;border-radius:6px}#machome-modal .mh-wl>div:hover,#machome-modal .mh-wl>div.sel{background:var(--mh-row)}",
"#machome-modal .mh-wl b{flex:1;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#machome-modal .mh-wl small{color:var(--mh-text2);font-size:11px;white-space:nowrap}#machome-modal .mh-wl .cur{color:var(--mh-green);font-weight:600}",
"#machome-modal .mh-wl .mh-sbars{height:14px}#machome-modal .mh-wl .mh-sbars i{width:4px}#machome-modal .mh-wl .mh-empty{cursor:default;color:var(--mh-text2)}",
"#machome-modal .mh-wsec{font-size:11px;font-weight:700;color:var(--mh-text2);text-transform:uppercase;letter-spacing:.04em;margin:14px 0 2px;display:flex;justify-content:space-between;align-items:center}",
"#machome-modal .mh-wsec button{border:0;background:none;color:var(--mh-blue);font:inherit;font-size:12px;text-transform:none;letter-spacing:0;font-weight:600;cursor:pointer;padding:0}",
"#machome-modal .mh-wjoin{background:var(--mh-row);border-radius:10px;padding:12px;margin:10px 0 4px;text-align:left}#machome-modal .mh-wjoin p{margin:0 0 8px;font-size:13px;text-align:left}#machome-modal .mh-wjoin .btns{margin-top:10px}",
"#machome .mh-sec{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--mh-text3);margin:14px 0 8px}",
"#machome .mh-sec:first-child{margin-top:0}",
/* bars */
"#machome .mh-bar{height:6px;border-radius:3px;background:var(--mh-track);overflow:hidden}",
"#machome .mh-bar i{display:block;height:100%;border-radius:3px;transition:width .8s cubic-bezier(.2,.8,.2,1)}",
"#machome .mh-cores{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}",
"#machome .mh-cores div small{display:flex;justify-content:space-between;color:var(--mh-text2);font-size:11px;margin-bottom:4px;font-variant-numeric:tabular-nums}",
/* status header */
"#machome .mh-big{display:flex;align-items:center;gap:14px;margin-bottom:12px}",
"#machome .mh-ico{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 4px 12px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.25)}",
"#machome .mh-ico svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-big h3{margin:0;font-size:18px;font-weight:700;letter-spacing:-.01em}",
"#machome .mh-big p{margin:1px 0 0;color:var(--mh-text2);font-size:12px}",
"#machome .mh-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:600}",
"#machome .mh-pill.ok{background:rgba(52,199,89,.16);color:var(--mh-green)}",
"#machome .mh-pill.warn{background:rgba(255,149,0,.16);color:var(--mh-orange)}",
"#machome .mh-pill.bad{background:rgba(255,59,48,.14);color:var(--mh-red)}",
"#machome .mh-pill.off{background:var(--mh-track);color:var(--mh-text2)}",
/* throughput */
"#machome .mh-tp{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}",
"#machome .mh-tp>div{background:var(--mh-row);border-radius:10px;padding:10px 12px;overflow:hidden}",
"#machome .mh-tp small{color:var(--mh-text2);font-size:11px;display:flex;align-items:center;gap:5px}",
"#machome .mh-tp b{font-size:20px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;display:block}",
"#machome .mh-tp svg{display:block;width:100%;height:34px;margin-top:4px}",
/* rows */
"#machome .mh-rows{display:flex;flex-direction:column;gap:6px}",
"#machome .mh-body[data-k=cli],#machome .mh-body[data-k=svc],#machome .mh-body[data-k=sec],#machome .mh-body[data-k=hlt]{display:flex;flex-direction:column}",
"#machome .mh-svc.mh-scroll{min-height:118px;align-content:start}",
"#machome .mh-body[data-k=sen],#machome .mh-body[data-k=vpn],#machome .mh-body[data-k=adg]{display:flex;flex-direction:column}",
"#machome .mh-body[data-k=sen]>.mh-rows,#machome .mh-body[data-k=vpn]>.mh-rows{flex:1}#machome .mh-body[data-k=sen]>.mh-rows>.mh-r,#machome .mh-body[data-k=vpn]>.mh-rows>.mh-r{flex:1;align-content:center}",
"#machome .mh-body[data-k=adg]>.mh-btn{align-self:flex-start;margin-top:auto}#machome .mh-body[data-k=adg]>.mh-kv{margin-bottom:10px}",
"#machome .mh-cstat{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
"#machome .mh-cstat>b{font-size:26px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}",
"#machome .mh-cstat>span{color:var(--mh-text2);font-weight:500}",
"#machome .mh-cstat .p{margin-left:auto;display:flex;gap:6px}",
"#machome .mh-body[data-k=cli] .mh-sec{margin:12px 0 8px}",
"#machome .mh-scroll .mh-r{padding:7px 10px}",
"#machome .mh-scroll{height:0;flex:1 1 auto;min-height:154px;overflow-y:auto;overscroll-behavior:contain;padding-right:4px;margin-right:-4px;scrollbar-width:thin;scrollbar-color:var(--mh-track) transparent}",
"#machome .mh-scroll::-webkit-scrollbar{width:6px}#machome .mh-scroll::-webkit-scrollbar-thumb{background:var(--mh-track);border-radius:3px}#machome .mh-scroll:hover::-webkit-scrollbar-thumb{background:var(--mh-text3)}",
"#machome .mh-scroll .mh-r{flex:none}",
"#machome .mh-r{display:flex;align-items:center;gap:10px;padding:9px 10px;background:var(--mh-row);border-radius:10px;min-width:0}",
"#machome .mh-r .d{width:9px;height:9px;border-radius:50%;flex:none}",
"#machome .mh-r .m{flex:1;min-width:0}",
"#machome .mh-r .m b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-r .m small{display:block;color:var(--mh-text2);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-r .x{text-align:right;font-size:11px;color:var(--mh-text2);font-variant-numeric:tabular-nums;white-space:nowrap}",
/* stats tiles */
"#machome .mh-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}",
"#machome .mh-tiles div{background:var(--mh-row);border-radius:10px;padding:10px 12px}",
"#machome .mh-tiles b{display:block;font-size:24px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}",
"#machome .mh-tiles small{color:var(--mh-text2);font-size:11px}",
/* services */
"#machome .mh-svc{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}",
"#machome .mh-svc div{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--mh-row);border-radius:9px;font-weight:500;font-size:12px;min-width:0}",
"#machome .mh-svc div i{width:8px;height:8px;border-radius:50%;flex:none}",
"#machome .mh-svc div span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:8px;border:0;background:var(--mh-blue);color:#fff;font-weight:600;font-size:12px;font-family:inherit;cursor:pointer;margin:8px 8px 0 0;text-decoration:none}",
"#machome .mh-btn.sec{background:var(--mh-track);color:var(--mh-text)}",
"#machome .mh-btn:hover{filter:brightness(1.08)}",
"#machome .mh-empty{color:var(--mh-text2);padding:6px 0}",
"#machome .mh-pv{display:inline-flex;align-items:center;gap:5px;max-width:100%;vertical-align:middle}",
"#machome .mh-pv .mask{color:var(--mh-text2);letter-spacing:.04em}",
"#machome .mh-eye{border:0;background:none;padding:2px;margin:-2px 0;cursor:pointer;color:var(--mh-text3);display:inline-flex;border-radius:5px;flex:none;transition:color .15s,background .15s}",
"#machome .mh-eye:hover{color:var(--mh-blue);background:var(--mh-track)}",
"#machome .mh-eye svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block}",
"#machome small .mh-eye svg{width:12px;height:12px}",
/* dock */
"#machome .mh-dockwrap{position:absolute;left:0;right:0;bottom:14px;display:flex;justify-content:center;pointer-events:none;z-index:4}",
"#machome .mh-dock{pointer-events:auto;display:flex;align-items:flex-end;gap:10px;padding:8px 10px;border-radius:22px;background:var(--mh-glass);border:.5px solid var(--mh-glass-b);-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);box-shadow:var(--mh-shadow);max-width:calc(100% - 24px);overflow-x:auto}",
"#machome .mh-app{width:72px;border:0;padding:2px 0 0;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;flex:none;font-family:inherit;color:var(--mh-text)}",
"#machome .mh-app .ic{width:54px;height:54px;border-radius:13px;display:flex;align-items:center;justify-content:center;transition:transform .2s cubic-bezier(.2,.8,.2,1);transform-origin:bottom center;box-shadow:0 4px 10px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.3)}",
"#machome .mh-app svg{width:28px;height:28px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-app:hover .ic{transform:scale(1.15) translateY(-4px)}",
"#machome .mh-app .lb{font-size:11px;font-weight:600;white-space:nowrap;color:var(--mh-text);opacity:.85}",
"#machome .mh-app:hover .lb{opacity:1}",
"#machome .mh-dsep{width:.5px;align-self:stretch;background:var(--mh-sep);margin:4px 2px}",
"@container mh (max-width:760px){#machome .mh-app{width:58px}#machome .mh-app .ic{width:44px;height:44px;border-radius:11px}#machome .mh-app svg{width:22px;height:22px}#machome .mh-app .lb{font-size:10px}#machome .mh-app:hover .ic{transform:none}}",
/* new-device badge, clickable rows */
"#machome .mh-new{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:6px;background:var(--mh-orange);color:#fff;font-size:10px;font-weight:700;vertical-align:1px;letter-spacing:.02em}",
"#machome .mh-r.click{cursor:pointer;transition:background .15s}#machome .mh-r.click:hover{background:var(--mh-track)}",
/* security checks */
"#machome .mh-ck{display:flex;align-items:center;gap:10px;padding:7px 10px;background:var(--mh-row);border-radius:9px;flex:none;min-width:0}",
"#machome .mh-ck i{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;color:#fff;font-style:normal;font-size:11px;font-weight:800}",
"#machome .mh-ck b{flex:1;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-ck small{color:var(--mh-text2);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48%}",
/* health */
"#machome .mh-tp b.sm{font-size:18px}",
"#machome .mh-hrow .x b{display:block;font-size:13px;color:var(--mh-text);font-weight:600}",
"#machome .mh-body[data-k=hlt] .mh-r.mh-hrow{padding:6px 10px}#machome .mh-body[data-k=hlt]>.mh-rows{gap:5px}",
/* history charts */
"#machome .mh-hgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}",
"#machome .mh-use4{max-height:228px;overflow-y:auto;overscroll-behavior:contain;padding-right:4px;margin-right:-4px;scrollbar-width:thin;scrollbar-color:var(--mh-track) transparent}",
"@container mh (max-width:760px){#machome .mh-hgrid{grid-template-columns:1fr}}",
"#machome .mh-chart{background:var(--mh-row);border-radius:12px;padding:10px 12px 8px;min-width:0}",
"#machome .mh-chart .hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px}",
"#machome .mh-chart .hd span{color:var(--mh-text2);font-size:12px;font-weight:600}",
"#machome .mh-chart .hd b{font-size:18px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}",
"#machome .mh-chart svg{display:block;width:100%;height:96px;margin:6px 0 2px}",
"#machome .mh-chart .ft{display:flex;justify-content:space-between;color:var(--mh-text3);font-size:10px;font-variant-numeric:tabular-nums}",
"#machome .mh-legend{display:flex;gap:12px;font-size:11px;color:var(--mh-text2);margin-top:4px}#machome .mh-legend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:0}",
/* control center */
"#machome .mh-ccb{border:0;background:none;color:var(--mh-text);padding:3px 5px;border-radius:5px;cursor:pointer;display:flex;align-items:center}",
"#machome .mh-ccb:hover,#machome .mh-ccb.on{background:var(--mh-track)}",
"#machome .mh-cc{position:absolute;top:36px;right:10px;width:340px;max-width:calc(100% - 20px);z-index:8;background:var(--mh-glass);border:.5px solid var(--mh-glass-b);-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%);border-radius:18px;box-shadow:var(--mh-shadow);padding:12px;animation:mhPop .18s ease-out}",
"#machome .mh-cc[hidden]{display:none}",
"@keyframes mhPop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}",
"#machome .mh-cc h3{margin:2px 4px 10px;font-size:14px;font-weight:700}",
"#machome .mh-ccg{background:var(--mh-row);border-radius:12px;padding:2px 12px;margin-bottom:8px}",
"#machome .mh-ccg h4{margin:8px 0 0;font-size:10px;font-weight:700;color:var(--mh-text3);text-transform:uppercase;letter-spacing:.07em}",
"#machome .mh-ccr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:.5px solid var(--mh-sep)}",
"#machome .mh-ccr:last-child{border-bottom:0}",
"#machome .mh-ccr .m{flex:1;min-width:0}#machome .mh-ccr .m b{display:block;font-weight:600}#machome .mh-ccr .m small{display:block;color:var(--mh-text2);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome .mh-sw{position:relative;width:40px;height:24px;border-radius:12px;border:0;background:var(--mh-track);cursor:pointer;flex:none;transition:background .2s;padding:0}",
"#machome .mh-sw::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}",
"#machome .mh-sw.on{background:var(--mh-green)}#machome .mh-sw.on::after{transform:translateX(16px)}",
"#machome .mh-ccbtns{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
"#machome .mh-ccbtn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;border-radius:12px;border:0;background:var(--mh-row);color:var(--mh-text);font:inherit;font-weight:600;font-size:12px;cursor:pointer}",
"#machome .mh-ccbtn:hover{background:var(--mh-track)}",
"#machome .mh-ccbtn .ic{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center}",
"#machome .mh-ccbtn svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
"#machome .mh-ccnote{font-size:11px;color:var(--mh-text3);text-align:center;margin:8px 0 0}",
/* Settings window: Control Center row styles, re-scoped for the modal on <body> */
"#machome-modal .mh-ccg{background:var(--mh-row);border-radius:12px;padding:2px 12px;margin:10px 0 0;text-align:left}#machome-modal .mh-ccg h4{margin:8px 0 0;font-size:10px;font-weight:700;color:var(--mh-text3);text-transform:uppercase;letter-spacing:.07em}",
"#machome-modal .mh-ccr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:.5px solid var(--mh-sep)}#machome-modal .mh-ccr:last-child{border-bottom:0}#machome-modal .mh-ccr .m{flex:1;min-width:0}#machome-modal .mh-ccr .m b{display:block;font-weight:600}#machome-modal .mh-ccr .m small{display:block;color:var(--mh-text2);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
"#machome-modal .mh-sw{position:relative;width:40px;height:24px;border-radius:12px;border:0;background:var(--mh-track);cursor:pointer;flex:none;transition:background .2s;padding:0}#machome-modal .mh-sw::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}#machome-modal .mh-sw.on{background:var(--mh-green)}#machome-modal .mh-sw.on::after{transform:translateX(16px)}#machome-modal.mh-and .mh-sw.on{background:var(--mh-blue)}",
"#machome-modal .mh-thm{display:flex;gap:2px;padding:2px;border-radius:10px;background:var(--mh-track);flex:none}#machome-modal .mh-thm button{border:0;background:none;color:var(--mh-text2);font:inherit;font-size:12px;font-weight:600;padding:5px 10px;border-radius:8px;cursor:pointer}#machome-modal .mh-thm button.on{background:var(--mh-sheet);color:var(--mh-text);box-shadow:0 1px 3px rgba(0,0,0,.12)}#machome-modal.mh-and .mh-thm,#machome-modal.mh-and .mh-thm button{border-radius:999px}#machome-modal.mh-and .mh-thm button.on{background:var(--mh-blue);color:#fff;box-shadow:none}",
"#machome-modal .mh-palr{flex-wrap:wrap}#machome-modal .mh-pals{display:flex;flex-wrap:wrap;gap:8px;width:100%;padding:8px 0 4px}#machome-modal .mh-pals button{width:28px;height:28px;border-radius:50%;border:0;padding:0;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.12)}#machome-modal .mh-pals button.on{outline:3px solid var(--mh-blue);outline-offset:2px}",
"#machome-modal .mh-go{border:0;border-radius:8px;padding:6px 12px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;background:var(--mh-track);color:var(--mh-text);flex:none}#machome-modal .mh-go:hover{filter:brightness(.95)}#machome-modal.mh-and .mh-go{border-radius:999px}",
/* modal + toast live on <body>, vars copied from #machome at open time */
"#machome-modal{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);padding:16px;animation:mhFade .15s;font-family:var(--mh-font);font-size:13px;line-height:1.4;color:var(--mh-text);-webkit-font-smoothing:antialiased}",
"#machome-modal *{box-sizing:border-box}",
"@keyframes mhFade{from{opacity:0}to{opacity:1}}",
"#machome-modal .sheet{width:420px;max-width:100%;max-height:calc(100vh - 32px);overflow:auto;background:var(--mh-sheet);border:.5px solid var(--mh-glass-b);border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.35);padding:22px;animation:mhPop .2s ease-out}",
"#machome-modal .hic{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 4px 12px rgba(0,0,0,.15)}",
"#machome-modal .hic svg{width:28px;height:28px;stroke:#fff;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}",
"#machome-modal h2{margin:0 0 6px;font-size:16px;font-weight:700;text-align:center}",
"#machome-modal p{margin:0 0 6px;color:var(--mh-text2);text-align:center}",
"#machome-modal .btns{display:flex;gap:10px;margin-top:18px}",
"#machome-modal .btns button{flex:1;padding:9px 12px;border-radius:9px;border:0;font:inherit;font-weight:600;cursor:pointer;background:var(--mh-track);color:var(--mh-text)}",
"#machome-modal .btns button.pri{background:var(--mh-blue);color:#fff}#machome-modal .btns button.dan{background:var(--mh-red);color:#fff}",
"#machome-modal .btns button[disabled]{opacity:.6;cursor:default}",
"#machome-modal button:focus{outline:none}#machome-modal button:focus-visible{box-shadow:0 0 0 3px rgba(0,122,255,.35)}",
"#machome-modal .kv{margin:14px 0 0}#machome-modal .kv div{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:.5px solid var(--mh-sep)}",
"#machome-modal .kv span{color:var(--mh-text2)}#machome-modal .kv b{font-weight:500;text-align:right;font-variant-numeric:tabular-nums;word-break:break-all}",
"#machome-modal label{display:block;font-size:11px;font-weight:600;color:var(--mh-text2);margin:4px 0 5px}",
"#machome-modal input{width:100%;padding:8px 10px;border-radius:8px;border:.5px solid var(--mh-sep);background:var(--mh-row);color:var(--mh-text);font:inherit;outline:none}",
"#machome-modal input:focus{border-color:var(--mh-blue);box-shadow:0 0 0 3px rgba(0,122,255,.2)}",
"#machome-modal .err{color:var(--mh-red);font-size:11px;min-height:15px;margin-top:4px}",
"#machome-modal .eye{border:0;background:none;color:var(--mh-text3);cursor:pointer;padding:0 0 0 6px;font:inherit}",
"#machome-modal .spin{width:30px;height:30px;border-radius:50%;border:3px solid var(--mh-track);border-top-color:var(--mh-blue);margin:6px auto 12px;animation:mhSpin 1s linear infinite}",
"@keyframes mhSpin{to{transform:rotate(360deg)}}",
"#machome-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,12px);opacity:0;z-index:3001;padding:10px 16px;border-radius:12px;background:var(--mh-sheet);color:var(--mh-text);border:.5px solid var(--mh-glass-b);box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:var(--mh-font);font-size:13px;font-weight:600;transition:opacity .2s,transform .2s;pointer-events:none;max-width:calc(100% - 32px)}",
"#machome-toast.show{opacity:1;transform:translate(-50%,0)}",
"@media (prefers-reduced-motion:reduce){#machome *,#machome-modal *{animation:none!important;transition:none!important}}"
].join("\n");
var VARS = ['--mh-yellow','--mh-teal','--mh-sheet','--mh-font','--mh-text','--mh-text2','--mh-text3','--mh-glass','--mh-glass-b','--mh-sep','--mh-track','--mh-row','--mh-blue','--mh-green','--mh-orange','--mh-red','--mh-purple'];

var ICONS = {
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  devices:'<rect x="2" y="4" width="14" height="10" rx="2"/><path d="M6 18h6M9 14v4"/><rect x="17.5" y="8" width="4.5" height="11" rx="1.3"/>',
  lock:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9.5a2 2 0 014 0V11"/>',
  shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  shieldx:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M12 8v5M12 16.2v.01"/>',
  apps:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  up:'<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  net:'<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 17h.01M11 17h.01M12 14V9M8 9h8M8 9V6M16 9V6"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  therm:'<path d="M14 14.8V5a2 2 0 10-4 0v9.8a4 4 0 104 0z"/><path d="M12 9v7"/>',
  router:'<rect x="3" y="12" width="18" height="7" rx="2"/><path d="M7 15.5h.01M11 15.5h.01M8 12l-2-6M16 12l2-6"/>',
  down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  upa:'<path d="M12 19V5M6 11l6-6 6 6"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.2 4.1M6.6 6.6A17.4 17.4 0 002 12s3.6 7 10 7a9.8 9.8 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2"/>',
  cc:'<rect x="3" y="5" width="18" height="6" rx="3"/><circle cx="16" cy="8" r="1.6"/><rect x="3" y="13" width="18" height="6" rx="3"/><circle cx="8" cy="16" r="1.6"/>',
  power:'<path d="M12 3v8M6.3 6.3a8 8 0 1011.4 0"/>',
  dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  pulse:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  dnsq:'<circle cx="10.5" cy="10.5" r="7"/><path d="M3.5 10.5h14M10.5 3.5c1.9 1.9 2.8 4.2 2.8 7s-.9 5.1-2.8 7c-1.9-1.9-2.8-4.2-2.8-7s.9-5.1 2.8-7zM15.6 15.6L21 21"/>',
  fan:'<circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7s3 4-2 7M14 12c4 0 7 1 7 4s-4 3-7-2M12 14c0 4-1 7-4 7s-3-4 2-7M10 12c-4 0-7-1-7-4s4-3 7 2"/>',
  server:'<rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/><path d="M8 6.5h.01M8 17.5h.01M12 6.5h4M12 17.5h4"/>',
  chart:'<path d="M4 19V5M4 19h16M8 15l4-5 3 3 5-6"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  /* title-bar icons (owner, 2026-11-15) */
  heart:'<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.8c0 5.8-7.5 10.4-7.5 10.4z"/><path d="M7 12.5h2.5l1.3-2.3 2 4 1.2-1.7H17"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  bars:'<path d="M4 20h16"/><rect x="5.5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="15.5" y="13" width="3" height="5" rx="1"/>',
  pie:'<path d="M11 4a8.5 8.5 0 108.5 8.5H11z"/><path d="M14 2.5a7.5 7.5 0 017.5 7.5H14z"/>',
  pc:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  speedo:'<path d="M4.5 17a8.5 8.5 0 1115 0"/><path d="M12 14.5l4-5"/><circle cx="12" cy="14.5" r="1.3"/>',
  faucet:'<path d="M6 4.5h4M8 4.5V8"/><path d="M3 8h10a3 3 0 013 3v2h-3v-1a1 1 0 00-1-1H3z"/><path d="M14.5 16.2s-1.4 1.6-1.4 2.6a1.4 1.4 0 002.8 0c0-1-1.4-2.6-1.4-2.6z"/>',
  wifi:'<path d="M2.5 9a14 14 0 0119 0M5.5 12.4a9.5 9.5 0 0113 0M8.6 15.8a5 5 0 016.8 0"/><circle cx="12" cy="19.2" r="1.1"/>'
};
/* extra search words for each Settings-window row (Settings search box + the page search bar) */
var SETK = {
  'Privacy mode':'privacy hide hidden private screenshot share sharing eye mac address ip names personal',
  'Look': 'look theme style macos mac android appearance design dark light',
  'Accent color': 'accent color colour theme palette tint blue purple pink red orange yellow green graphite',
  'Colors': 'colors colour theme palette material you playful ocean forest sunset grape rose citrus mint slate',
  'Live wallpaper': 'live wallpaper background animated animation moving morphing colors motion battery',
  'Layout': 'layout cards move resize hide show arrange order rearrange edit size',
  'Discord alerts': 'discord alerts notifications notify webhook messages vpn upload temperature speed test weekly monthly report offline router home update updates new version github firmware upgrade zram',
  'Auto-heal': 'auto-heal autoheal auto fix autofix self-heal self heal repair fixes automatic restart reboot failover tunnel vpn server switch wifi band internet renew dns tailscale',
  'NAS backup': 'nas backup backups ftp ftps webdav scp ssh restore verify schedule copy synology',
  'Cable modem': 'cable modem xfinity the ISP gateway signal snr power docsis uncorrectable errors 10.0.0.1',
  'ISP report card': 'isp report card internet provider plan speed uptime outages monthly copy',
  'Weather': 'weather zip code postal city country forecast radar temperature screen location town off hide remove',
  'Temperature unit': 'temperature unit celsius fahrenheit metric degrees c f °c °f',
  'Wake a computer': 'wake on lan wol computer pc desktop turn on power on'
};
/* Auto-heal switches (Settings > Auto-heal). k = settings key, d = on by default, g = group, l/s = label/description,
   only = 'router' (main routers) / 'ap' (access points), warn = two warnings before it can be turned on */
var HEAL = [
  { g: 'VPN', k: 'autoheal', d: true, l: 'Restart VPN tunnels that stay down', s: 'Disconnects and reconnects a dead tunnel after 2 minutes, then every 10 minutes, at most 3 tries per outage (its devices are already on a working tunnel meanwhile). Tells you if it can’t fix it. Skipped while the internet itself is down.' },
  { g: 'VPN', k: 'failover', d: true, l: 'Move devices to a working tunnel', s: 'If a tunnel stops working for ~30 seconds (no pings AND no web pages through it; ping-only blips are ignored), its devices switch to another healthy VPN tunnel (never off the VPN), and move back once it has been healthy for a minute.' },
  { g: 'VPN', k: 'vpn_switch', d: false, l: 'Switch a stalling tunnel to its next server (opt-in)', s: 'Off by default. If a tunnel goes down 4+ times in 2 hours, move it to the next server already saved on that tunnel in GL’s VPN page (never a server you didn’t add). When off, you just get a suggestion.' },
  { g: 'VPN', k: 'vpn_return', d: true, only: 'router', l: 'Reconnect when the VPN server is back', s: 'After auto-heal has given up on a tunnel (or it has been down 30 minutes), keep watching its VPN server. As soon as the server answers again, reconnect the tunnel (if the server never answers pings, try once an hour). At most 6 tries a day.' },
  { g: 'VPN', k: 'stuck_fix', d: true, only: 'router', l: 'Restart a tunnel stuck “connecting”', s: 'If a tunnel is switched on but hasn’t connected for 10 minutes, restart its connection process (OpenVPN or WireGuard), at most 3 times in 6 hours. If it still won’t connect, you’re told to try another server.' },
  { g: 'VPN', k: 'leak_fix', d: true, only: 'router', l: 'Fix a VPN leak the hourly leak test finds', s: 'If the leak test finds devices’ traffic leaving outside a tunnel, a tunnel showing your home address, or the kill switch’s blocking rule missing, re-apply the VPN routing (every tunnel reconnects for a few seconds) and test again 2 minutes later. Settings problems (IPv6, DNS choices) are reported, never changed. At most every 6 hours.' },
  { g: 'Internet & network', k: 'wan_heal', d: true, only: 'router', l: 'Renew the internet connection if it drops', s: 'If the cable to the modem is connected but there’s no internet for 3 minutes, renew the connection to your ISP once per outage.' },
  { g: 'Internet & network', k: 'ap_uplink', d: true, only: 'ap', l: 'Reconnect this access point to the main router', s: 'If the cable is connected but the main router hasn’t answered for 3 minutes, renew this access point’s address (no interruption); 3 minutes later, restart its network link once (Wi-Fi devices drop for a few seconds).' },
  { g: 'Internet & network', k: 'sqm_auto', d: false, only: 'router', warn: 'sqm', l: 'Try SQM when the line lags under load (opt-in)', s: 'Off by default. If a speed test shows your ping rising 60+ ms while the line is busy (bufferbloat), turn on GL’s SQM traffic shaping at 85% of your measured speed. The next speed test decides: it stays only if the lag drops a lot without losing more than half your speed, otherwise your old settings come back by themselves. Never touches SQM you turned on yourself. At most one try a week.' },
  { g: 'Internet & network', k: 'dns_heal', d: true, l: 'Restart the router’s DNS if it stops answering', s: 'Only when the router’s own DNS can’t even answer for itself for 3 minutes. Never touches AdGuard or its settings.' },
  { g: 'Internet & network', k: 'ts_heal', d: true, l: 'Restart Tailscale if it stays disconnected', s: 'If Tailscale is switched on but not connected for 10 minutes, restart it (at most once an hour). If it’s signed out, you get a message instead.' },
  { g: 'Wi-Fi', k: 'wifi_heal', d: true, l: 'Restart a Wi-Fi band that stops working', s: 'Models with Wi-Fi: if a band (2.4, 5 or 6 GHz) is down or not answering for 3 minutes, restart just that band once (at most every 6 hours) and tell you. A band with no devices on it is NOT restarted.' },
  { g: 'Wi-Fi', k: 'chan_auto', d: false, l: 'Switch to a quieter Wi-Fi channel (opt-in)', s: 'Off by default. When the weekly Wi-Fi report finds a much quieter channel, switch to it at 3 AM, then check 7 minutes later that devices reconnected; otherwise switch back. Only for bands set to a fixed channel (Auto already picks its own) and never to radar-check (DFS) channels.' },
  { g: 'NAS', k: 'nas_retry', d: true, only: 'router', l: 'Retry a failed NAS backup', s: 'If a backup fails because the NAS was asleep, rebooting or busy, try again after 1 hour, then after 6 hours. Not retried when the NAS is full or the password or folder is wrong; you’re told what to fix instead.' },
  { g: 'NAS', k: 'nas_wake', d: true, only: 'router', l: 'Wake the NAS if it’s asleep', s: 'When the NAS stops answering (offline alert) or doesn’t answer before a backup, send it a Wake-on-LAN signal. Only works if Wake-on-LAN is turned on in the NAS’s own settings.' },
  { g: 'Router', k: 'ct_relief', d: true, l: 'Clear a runaway device’s connections', s: 'If the connection table stays over 90% full for 5 minutes, clear the connections of the one device holding most of them (it just reconnects), or else let idle connections expire sooner until it’s back under 60%. Long before a reboot would be considered.' },
  { g: 'Router', k: 'mem_fix', d: true, l: 'Restart a service whose memory keeps growing', s: 'Checked hourly. If one service (web server, Tailscale, DNS, AdGuard) keeps growing for 6 hours by 15 MB+ while the router is short on memory, restart just that service, at most once a day. Much gentler than a reboot.' },
  { g: 'Router', k: 'storage_trim', d: true, l: 'Free up storage when it’s nearly full', s: 'If the router’s storage or RAM disk is nearly full, delete files that are safe to lose (package lists, leftover temporary files). Never settings, history or your undo backups.' },
  { g: 'Router', k: 'svc_autostop', d: false, l: 'Turn a service off again if it comes back (opt-in)', s: 'Off by default. If a firmware update starts a service on this router’s turned-off list again, stop and disable it again. If it comes straight back, it’s left running and you’re told.' },
  { g: 'Last resort', k: 'autoreboot', d: true, l: 'Reboot the router if it has a major problem', s: 'Only for lasting serious problems (memory exhausted, connection table full, admin services stuck) after a gentler fix fails. At most once a day and twice a week, never within 6 hours of starting, never during a speed test, backup or upgrade.' },
  { g: 'Last resort', k: 'modem_restart', d: false, only: 'router', warn: true, l: 'Restart the cable modem (opt-in)', s: 'Off by default. If the internet has been down for 15 minutes and renewing the connection didn’t help, press Restart on your Xfinity gateway (at most once a day). From 10 minutes into the outage the Home tab shows a warning with a Cancel button. Needs the gateway password (Settings → Cable modem).' }
];
var GRAD = {
  blue:'linear-gradient(160deg,#5ac8fa,#0a6cff)', green:'linear-gradient(160deg,#5ee27a,#1f9d45)',
  purple:'linear-gradient(160deg,#c77dff,#5e5ce6)', teal:'linear-gradient(160deg,#4cd9c0,#0a8f74)',
  orange:'linear-gradient(160deg,#ffb340,#ff6a00)', gray:'linear-gradient(160deg,#a5a5ad,#55555c)',
  pink:'linear-gradient(160deg,#ff6b8b,#c2278f)', red:'linear-gradient(160deg,#ff7a6b,#e0241b)',
  indigo:'linear-gradient(160deg,#7d8cff,#3a3fd1)'
};
function svg(name){ return '<svg viewBox="0 0 24 24">' + ICONS[name] + '</svg>'; }

var SVC_NAMES = {wgserver:'WireGuard Server',ovpnserver:'OpenVPN Server',adguard:'AdGuard Home',tor:'Tor',parental_control:'Parental Control',tailscale:'Tailscale',zerotier:'ZeroTier',mptun:'MPTun'};
var FEAT = [['netnat_enabled','NAT'],['qos_enabled','QoS'],['sqm_enabled','SQM'],['ddns_enabled','Dynamic DNS'],['ipv6_enabled','IPv6'],['flow_statistics_enabled','Traffic Stats'],['content_protection_enabled','Content Protection'],['prio_enabled','Priority']];
var SENSOR_NAMES = {soc_thermal:'SoC',mcusys_thermal:'CPU cluster',eth2p5g_thermal:'2.5G Ethernet PHY'};

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
/* which Discord alert type a Home banner belongs to (mute, 2026-11-18); null = can't be muted */
function alertKind(id){
  id = String(id || '');
  if (id === 'loss-wan' || id === 'wan' || id === 'mrs') return 'wan';
  if (/^(vpn|stale|loss)-/.test(id)) return 'vpn';
  if (id === 'dns') return 'dns'; if (id === 'ping') return 'ping';
  if (id === 'temp' || id === 'throttle') return 'temp';
  if (/^sec-/.test(id)) return 'security'; if (/^new-/.test(id)) return 'newdev'; if (/^fw-/.test(id)) return 'firmware';
  return null;
}
/* alert types that can wait for the daily digest (owner's pick 19) */
var DIGEST_TYPES = ['newdev', 'config', 'login', 'presence', 'schedule', 'devwatch', 'wifi', 'upload', 'speed', 'backup', 'health', 'isp', 'data', 'firmware'];
var KIND_NAMES = { vpn: 'VPN', wan: 'Internet', dns: 'DNS', ping: 'High ping', newdev: 'New device', security: 'Security', temp: 'Temperature', firmware: 'Firmware', upgrade: 'Firmware upgrade',
  speed: 'Speed test', login: 'Sign-in', weekly: 'Weekly report', backup: 'NAS backup', health: 'Router health', config: 'Settings changed', isp: 'Internet speed',
  wifi: 'Wi-Fi report', schedule: 'Schedule', presence: 'Who’s home', data: 'Data cap', upload: 'Unusual upload', devwatch: 'Watched device', monthly: 'Monthly summary', travel: 'Travel', adspike: 'Unusual blocking', rhupdate: 'Router Home update', vuln: 'Vulnerability' };
function bytes(n){ n = Number(n) || 0; var u = ['B','KB','MB','GB','TB','PB'], i = 0; while (n >= 1024 && i < u.length - 1){ n /= 1024; i++; } return (i ? n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) : n) + ' ' + u[i]; }
function rate(bps){ var b = (Number(bps) || 0) * 8; if (b >= 1e9) return [(b/1e9).toFixed(2),'Gbps']; if (b >= 1e6) return [(b/1e6).toFixed(b >= 1e8 ? 0 : 1),'Mbps']; if (b >= 1e3) return [(b/1e3).toFixed(0),'Kbps']; return [b.toFixed(0),'bps']; }
function dur(s){ s = Math.floor(Number(s) || 0); var d = Math.floor(s/86400), h = Math.floor(s%86400/3600), m = Math.floor(s%3600/60); return (d ? d + 'd ' : '') + (d || h ? h + 'h ' : '') + m + 'm'; }
function pct(a,b){ return b ? Math.max(0, Math.min(100, a / b * 100)) : 0; }
function cf(c){ return Math.round(c * 9 / 5 + 32); }
/* Temperature unit (2.6.7, users asked): Control Center → Temperature unit; saved on the router (rpc set_prefs) and
   cached in this browser so the first paint is right. cf() stays °F for limits and math; these are for DISPLAY. */
var TU = 'F'; try { if (localStorage.getItem('machome-tu') === 'C') TU = 'C'; } catch (e) {}
function tconv(c){ return TU === 'C' ? Math.round(c) : Math.round(c * 9 / 5 + 32); }                       /* °C reading → number in the chosen unit */
function tdisp(c){ return c == null ? '—' : tconv(c) + '°' + TU; }                                        /* °C reading → "77°F" / "25°C" */
function tdispF(f){ return TU === 'C' ? Math.round((f - 32) * 5 / 9) + '°C' : Math.round(f) + '°F'; }       /* a °F number → text in the chosen unit */
function loadColor(p){ return p < 60 ? 'var(--mh-green)' : p < 80 ? 'var(--mh-yellow)' : p < 90 ? 'var(--mh-orange)' : 'var(--mh-red)'; }
function tempColor(t){ return t < 60 ? 'var(--mh-green)' : t < 75 ? 'var(--mh-yellow)' : t < 85 ? 'var(--mh-orange)' : 'var(--mh-red)'; }
function rpc(o, m, p){ try { return Promise.resolve(window.$rpcRequest('call', ['sid', o, m, p || {}])).catch(function(){ return null; }); } catch (e) { return Promise.resolve(null); } }
/* rpcx: like rpc but rejects on failure, for actions that change settings */
function rpcx(o, m, p, timeout){
  try { return Promise.resolve(window.$rpcRequest('call', ['sid', o, m, p || {}], timeout ? { timeout: timeout } : undefined)).then(function(r){
    if (r && (r.err_msg || r.err_code)) throw new Error(r.err_msg || ('Error ' + r.err_code)); return r; }); }
  catch (e) { return Promise.reject(e); }
}
function lossColor(v){ return v == null ? 'var(--mh-text3)' : v <= 0 ? 'var(--mh-green)' : v <= 2 ? 'var(--mh-orange)' : 'var(--mh-red)'; }
function ago(sec){ sec = Math.max(0, Math.floor(sec)); return sec < 60 ? sec + 's ago' : sec < 3600 ? Math.floor(sec / 60) + 'm ago' : sec < 86400 ? Math.floor(sec / 3600) + 'h ago' : Math.floor(sec / 86400) + 'd ago'; }
function hhmm(ts){ var d = new Date(ts * 1000); return d.toLocaleTimeString(undefined, { hour:'numeric', minute:'2-digit' }); }
function cookie(name){ var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; }

/* area/line chart for the 24h history card */
function chart(series, opts){
  var W = 300, H = 96, n = series[0].data.length;
  if (n < 2) return '<svg viewBox="0 0 300 96" preserveAspectRatio="none"></svg>';
  var all = []; series.forEach(function(s){ all = all.concat(s.data); });
  var mx = Math.max.apply(null, all), mn = opts.zero ? 0 : Math.min.apply(null, all);
  if (mx === mn){ mx += 1; mn -= opts.zero ? 0 : 1; }
  var pad = (mx - mn) * 0.08; mx += pad; if (!opts.zero) mn -= pad;
  var out = '<svg viewBox="0 0 300 96" preserveAspectRatio="none">';
  [0.25, 0.5, 0.75].forEach(function(f){ out += '<line x1="0" x2="300" y1="' + (H * f) + '" y2="' + (H * f) + '" stroke="currentColor" stroke-opacity=".08" vector-effect="non-scaling-stroke"/>'; });
  series.forEach(function(s, si){
    var pts = s.data.map(function(v, i){ return [(i / (n - 1)) * W, H - 1 - ((v - mn) / (mx - mn)) * (H - 2)]; });
    var line = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var gid = opts.id + si;
    if (s.fill) out += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s.color + '" stop-opacity=".32"/><stop offset="1" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient></defs><path d="' + line + 'L300 96L0 96Z" fill="url(#' + gid + ')"/>';
    out += '<path d="' + line + '" fill="none" stroke="' + s.color + '" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>';
  });
  return out + '</svg>';
}

function spark(arr, color, id){
  var w = 200, h = 34, n = arr.length;
  if (n < 2) return '<svg viewBox="0 0 200 34" preserveAspectRatio="none"></svg>';
  var mx = Math.max.apply(null, arr.concat([1]));
  var pts = arr.map(function(v, i){ return [(i / (n - 1)) * w, h - 2 - (v / mx) * (h - 4)]; });
  var line = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
  return '<svg viewBox="0 0 200 34" preserveAspectRatio="none"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".35"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="' + line + 'L200 34L0 34Z" fill="url(#' + id + ')"/><path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
}

function win(key, title, opts){
  opts = opts || {};
  return '<section class="mh-win' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : '') + '" data-card="' + key + '" style="animation-delay:' + (opts.delay || 0) + 'ms">' +
    '<div class="mh-tb"><div class="mh-tl"><i></i><i></i><i></i></div><span class="t">' + (opts.ic || []).map(function(c){ return '<i class="mh-tic" style="background:' + GRAD[c[1]] + '">' + svg(c[0]) + '</i>'; }).join('') + title + '</span>' +
    (opts.route ? '<button class="o" data-route="' + opts.route + '">Open ›</button>' : '') + '</div>' +
    '<div class="mh-body" data-k="' + key + '">' + (opts.body || '<div class="mh-empty">Loading…</div>') + '</div></section>';
}

function gauge(key, label){
  var c = (2 * Math.PI * 46).toFixed(2);
  return '<div class="mh-gauge" data-g="' + key + '"><svg viewBox="0 0 110 110"><circle class="trk" cx="55" cy="55" r="46"/>' +
    '<circle class="val" cx="55" cy="55" r="46" stroke="var(--mh-green)" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" transform="rotate(-90 55 55)"/></svg>' +
    '<div class="mh-gv"><b>—</b><small></small></div><div class="mh-gl">' + label + '</div></div>';
}

var DOCK = [
  ['internet','Internet','globe','blue'],['clients','Clients','devices','green'],['vpndashboard','VPN','lock','purple'],
  ['adguardhome','AdGuard','shield','teal'],['plugins','Applications','apps','orange'],
  ['lanip','Network','net','indigo'],'|',['overview','System','gear','gray'],['upgrade','Upgrade','up','pink'],['@dnshub','DNS','dnsq','red']
];

var MH_VERSION = '2.6.7', MH_BUILD = '2026-11-22';
var MH_REPO = 'https://github.com/xDarkHawkx/RouterHome';   /* updates come from this repo's GitHub Releases */
var MH_CREDIT = 'Made by DogZoomZoom &amp; Claude AI (the bot)';
/* "About Home" guide (Control Center > About Home): [section, intro, [[feature, how it works / how to use], ...]] */
var ABOUT = [
 ['Getting around', 'The Home tab is the first item in the router’s admin menu. It refreshes itself every few seconds; after an update press Ctrl+F5 (Cmd+Shift+R on a Mac).', [
  ['About (this guide)', 'In the top bar next to System. Every feature, what it does and how to use it, with a search box.'],
  ['Page search', 'The search box under the top bar searches everything on the Home tab right now: alerts, the status chips and every card (a device name, “tunnel 2”, “temperature”, an IP you revealed…). Results show which card and the matching line. Click one (or use ↑↓ and Enter) to scroll there; the card gets a blue outline and the line is highlighted. The last result searches this About guide instead. Press / anywhere on the page to jump to the box, Esc to clear it. Values hidden by privacy mode can’t be found, because they’re never on the page.'],
  ['Control Center', 'The switches icon in the top bar. Settings and quick switches live here. Every change asks you to confirm first.'],
  ['Privacy mode', 'The eye icon in the top bar (or Control Center). Hides MAC addresses, public IP, gateway, device names, network names and your town so you can share screenshots. Hidden values are never even sent to the page.'],
  ['Reveal a hidden value', 'Values like MAC and IP addresses show as dots with a small eye next to them. Click the eye to show that one value, click again to hide it.'],
  ['Dock', 'The row of app icons at the bottom jumps straight to GL’s own pages: Internet, Clients, VPN, AdGuard, Applications, Network, System, Upgrade.'],
  ['“Open ›” on a card', 'Opens the matching page in GL’s admin.'],
  ['Version + credits', 'The line at the very bottom shows which Router Home version and build this router runs.']]],
 ['Top of the page', '', [
  ['Alert banner', 'Only shows when something needs attention. Red = serious (internet or VPN down, DNS not answering, overheating, an important security check failing); orange = warning. Each says how long it has been going on.'],
  ['Fix buttons', 'One-click fixes on some alerts (Restart tunnel, Renew connection, Fix DNS, Restore settings), always with a confirmation first.'],
  ['Dismiss / It’s mine', 'Dismiss hides an alert for a while (1 h for red, 24 h for orange). “It’s mine” on a new-device alert marks the device as known for good. “↻ Clear” on a packet-loss alert starts the 10-minute loss check fresh (handy right after changing a VPN server): the alert only comes back if new loss shows up. “Mute” silences that kind of alert (banner and Discord) for 1 hour, the rest of today or a week; it’s still listed in Recent events. “Clear all” under the alerts restarts the VPN, packet-loss and high-ping checks from scratch and hides the rest like Dismiss.'],
  ['How VPN pings are checked', 'Each VPN tunnel keeps one steady ping running to Cloudflare and one to Quad9 (one a second each, like ping -t on a PC), instead of starting new pings every check. Tested 11-20 side by side: some VPN servers (Nord, Surfshark) pause answers for ~30 s when one client starts many new pings, while a steady ping, and your devices, lost nothing. When pings do stop, a web page is loaded through the tunnel: if it loads, it is a ping-only blip (not counted as down, loss or a stall anywhere); if it fails too, it is a real drop and devices move to another tunnel.'],
  ['Updates', 'Control Center → Router Home updates: checks the Router Home GitHub page (github.com/xDarkHawkx/RouterHome) for a newer release, shows what’s new, and installs it with one click in about a minute. Only updates signed with the Router Home release key install, so a fake or tampered download is refused. The current version is saved first and put back automatically if anything goes wrong; “Go back to it” restores it later. Your settings, history and alerts are kept. Under “Everything is running smoothly” the page shows “Router Home is up to date” or “Router Home needs an update” with an Update now button (checked when the page opens, at most once an hour). It never installs by itself. The router also checks GitHub once a day on its own and sends one Discord message per new version (alert type “New Router Home version”).'],
  ['GL.inet Utilities Toolkit','The last card on the page: point-and-click tools inspired by phantasm22’s GL.iNet Utilities Toolkit (github.com/phantasm22/GL-iNet_utils), rebuilt from scratch for Router Home. Hardware: CPU, memory, storage, temperatures (°F or °C), network ports, Wi-Fi radios and a VPN crypto acceleration check. Benchmarks: CPU thermal stress (stops at 203 °F / 95 °C), VPN & crypto speed, storage, memory and DNS latency; results stay until the router restarts. Network: MTU check and per-device speed limits (below). Zram & system: zram size and compression, package system check (leftover lock, refresh lists). SSH keys: list, add and remove; the last key can’t be removed while password sign-in is off.'],
  ['MTU check','Toolkit → Network → “Check MTU”: measures the biggest packet the internet path (and the path to each VPN server) carries without being split up, then shows the best size for each WireGuard tunnel (path minus 60 bytes for WireGuard’s own wrapping, 80 for an IPv6 server). Nothing changes while it measures. “Use N” changes that tunnel’s size and tests it for a minute: if websites or full-size packets stop getting through, the old size comes back by itself. Only the server the tunnel uses now is changed (other saved servers keep their size); an undo script is kept in /root/machome-backup/. OpenVPN tunnels aren’t changed.'],
  ['Speed limits','Toolkit → Network → Speed limits: cap a device’s download and upload speed (Mbps). This uses GL’s own speed limiter, the same one as Clients → Speed limit, so limits show there too and stay after a restart. Remove a limit with “Remove”. Set limits on the main router; an access point passes its devices’ traffic to the main router, which limits them there.'],
  ['Known vulnerabilities','Security card → “Known vulnerabilities”: checks this router against published security problems, with plain rules (no AI). Source 1: GL.iNet security notices, turned into a signed list on the Router Home GitHub page (which models/firmware, what to look for on the router: a process, file, setting, service or open port, and which fix applies). The router only accepts a list signed with the Router Home release key; a copy ships built in. Source 2: the National Vulnerability Database (NVD), published CVEs for this exact model matched to this firmware version. Also reads GL.iNet’s own news feeds (Security Updates and the blog) once a day: a security post the list doesn’t cover yet shows as “New notice, not checked yet” and sends one Discord alert. Downloaded once a day; the on-router checks repeat every 10 minutes. Results: Not affected, Exposed (a risky setting is on), Suspicious file, Signs of infection, or Firmware update needed. Fixes come from a short fixed list (stop a process and delete its file, keeping a copy as evidence; change one setting; turn off a service; tighten file permissions), always ask first and leave an undo script in /root/machome-backup/ where that makes sense. Firmware upgrades are never automatic: you get a button to the Upgrade page. New findings send one Discord alert (type “Vulnerability”). It only knows what has been published, and “no signs” doesn’t prove a router was never attacked.'],
  ['Zram gauge','System card, next to Memory: zram is memory the router compresses instead of running out of RAM (GL’s zram-swap package; about half the RAM, set up automatically at boot). The gauge shows how full it is; hover for the compression ratio, the real RAM it uses and the peak since the last restart. Orange from 60% full, red from 85%. Shown only when zram is on. A GL firmware upgrade removes the zram-swap package; Router Home reinstalls it by itself once the internet is back (only on a router that had it) and sends an “upgrade” alert.'],
  ['VPN outage log','VPN Health card → “Outage log”: every REAL VPN outage (30 s or more with no pings and no web page through the tunnel) of the last 7, 30 or 60 days, with server, length, why, where devices went and whether auto-heal restarted it. Filter by provider, then “Copy as text” or “Send to Discord” for the VPN provider’s support. Ping-only blips aren’t listed. Recording since 11-20 evening; kept for 60 days.'],
  ['Phone view','The 📱 button in the menu bar switches to a compact page for phones: overall status, internet grade and speed, VPN tunnels with on/off switches, devices online, and big buttons (speed test, test VPN, clear alerts, recent events, DNS hub, outage log, settings). It turns on by itself on small screens; your choice is remembered in that browser. “Full page” goes back.'],
  ['Outage & lag log', 'In the ISP report card (and the Network Health “Log” link): every outage with its likely cause, lag episode, modem restart and slow speed test from the last 30 days, plus a per-day table (ping, evening ping, lag spikes, no answer). “Copy as text” or “Send to Discord”, ready for your ISP.'],
  ['Evenings, modem restarts, VPN server back', 'Every night at 11 PM the router compares 7–11 PM with the rest of the day; if the evenings were much worse on 4 of the last 7 days you get one message (at most weekly) and Network Health says so. A modem that restarts by itself (its uptime starts over) is reported and logged. After auto-heal gives up on a tunnel, the router keeps watching its VPN server and reconnects as soon as it answers again (Settings → Auto-heal).'],
  ['Unusual blocking (opt-in)', 'Discord alerts → “Watch for unusual blocking”: AdGuard’s blocked lookups are counted per device every hour; if one device suddenly has 5x its usual (300+ in an hour) you get one message with the domains it was trying to reach.'],
  ['Daily digest', 'In the Discord alerts window: tick less urgent alert types (new devices, settings changed, sign-ins, who’s home…) and they arrive together as one message a day at the time you pick, instead of one by one.'],
  ['Recent events: clear by type', 'The type chips at the top of Recent events show or clear only those types (e.g. just VPN events). “Keep events for” sets how long events are kept (1 to 30 days).'],
  ['Forget removed VPNs', 'VPNs you remove from GL drop out of the speed history, 7-day reliability and last speed results by themselves after 24 hours (or right away with “Forget removed VPNs” in Speed History or under “Past servers this week”). By default the history of older servers from a provider you still use is kept. The × next to a Speed History line or a past server removes just that one.'],
  ['Resolved', 'A green card briefly appears when a problem clears by itself.'],
  ['Greeting + status chips', 'A one-line summary (“Everything is running smoothly” or “Heads up: …”) and chips for Internet, VPN, AdGuard, clients, temperature, Security, Tailscale and new devices. Click a chip to open its page. The chips always stay on one line: on narrower windows they shrink a little, then switch to short labels (“VPN 3/3”, “Secure”, “Backups OK”). Hover a chip for its full text.'],
  ['Backups chip', 'When NAS backup is set up: “Backups healthy” (green) means the newest backup is under 8 days old AND passed its restore check. Orange: overdue, not verified yet or paused. Red: the last backup failed or the copy on the NAS is damaged. Click it for the NAS backup settings, the restore-check result and “Verify now”.'],
  ['Tailscale chip', 'On routers with Tailscale: grey = off, orange = connecting, green = on. Click it for GL’s Tailscale page. (GL doesn’t allow Tailscale in access-point mode.)'],
  ['Weather widget', 'Current weather, today’s high/low and a 3-day forecast for your ZIP (Open-Meteo, no account). Set the ZIP in Control Center > Settings > Weather.'],
  ['DNS easter egg', 'The red DNS button at the end of the dock opens “It’s always DNS, Hub”: a verdict (is it DNS?), how a lookup travels (your devices → AdGuard → its upstream → who answers; the router; each VPN tunnel’s DNS), every DNS setting in one place (WAN, LAN, GL DNS page, overrides, rebind protection, IPv6, AdGuard on the router and on your NAS with DNSSEC and today’s blocked share), who has answered your lookups over the last 48 hours, and a DNS Race: type a name and every resolver (AdGuard, this router, Quad9, Cloudflare, Google, and each VPN tunnel’s DNS) looks it up at once, with medals. Below it, the Lookup map: type a name (e.g. weather.com) to see every step it took: your DNS (blocked? remembered? which upstream answered and how fast, from AdGuard’s own log), then the full trail from a root server to the .com servers to the site’s own servers, and the answer with how long it’s remembered. Read-only. Plus the haiku and a DNS fact.'],
  ['Radar easter egg','Click the weather widget: a live Ventusky radar opens, centered on your ZIP. It only loads when opened and is removed completely when closed (X, Esc or click outside), so it uses no memory afterwards. “Weather settings” in its top bar opens the ZIP settings.']]],
 ['Cards', 'Every card can be moved, resized or hidden: Control Center > Settings > Layout > Edit.', [
  ['System', 'Gauges for CPU, memory, zram (when on), temperature (°F or °C), connections, fan (models with a fan) and DHCP pool, plus per-core load, model, firmware, uptime, storage, MAC, thermal throttling, hardware acceleration, bufferbloat grade and the last NAS backup.'],
  ['Connections gauge', 'How many network connections pass through the router right now, out of the most it can track. Each web page, app, stream or game uses several, so a few hundred to a couple of thousand is normal. If it fills up, new connections fail; you’re alerted and the router looks after it.'],
  ['DHCP pool gauge', 'How many of the router’s DHCP addresses are handed out (active leases in the pool, e.g. 28 of 150). Hover for the range. Only shown when the router hands out addresses itself (not in access-point mode).'],
  ['Fan (models with a fan)', 'Click the fan gauge: Auto (set the start temperature) or Manual (fixed speed) with a failsafe that switches back to Auto if it gets too hot.'],
  ['Internet', 'Online/offline, live download/upload with graphs, how the router gets internet (cable, Wi-Fi repeater, tethering, cellular), public IP and gateway (eye to reveal), WAN DNS (the DNS servers set on the internet connection), LAN DNS (what your devices are told to use, e.g. AdGuard on a NAS; "From main router" in access-point mode), link speed and data totals. WAN ping (2026-11-17): Cloudflare 1.1.1.1, Google 8.8.8.8 and Quad9 9.9.9.9 pinged directly over the internet connection (not the VPN) every 10 s, with a 24-hour graph and, per server, ping now, averages over 10 min / 1 h / 24 h, jitter, packet loss (1 h / 24 h) and the 24-hour range.'],
  ['Wi-Fi Uplink (travel routers)', 'When the router gets internet over Wi-Fi: the network name, signal bars and dBm (Excellent/Good/Fair/Weak), band, channel, Wi-Fi generation, security, link speed, retry rate, IP, gateway, DNS, the router’s MAC on that network, MAC type and how long it’s been connected. On these routers it takes the VPN card’s place near the top.'],
  ['Choose network', 'Button on the Wi-Fi Uplink card. Saved networks connect with one click (no password needed). Nearby networks come from a ~20-second scan, strongest first, with band and security. “Join a hidden network” for networks that don’t broadcast. Business (802.1X) networks: use GL’s Internet page. While it switches (up to a minute) the router’s own Wi-Fi stays up but internet pauses.'],
  ['VPN', 'Each WireGuard tunnel: connected or not, server, data used, kill switch and when it last checked in with the server (Stale after 3 min). Under each tunnel, its last 7 days: uptime, average ping, packet loss, day vs evening ping and nightly speed; the steadiest tunnel is tagged MOST RELIABLE. “Past servers this week” (click to open) lists servers or providers you used earlier in the week. Each tunnel has an on/off switch, and clicking a tunnel opens its server list (servers saved in GL’s VPN page, grouped by provider) so you can switch it to another server; a server another tunnel is using can’t be picked. In access-point mode this becomes the Access Point card.'],
  ['VPN Health', 'A plain checklist for each WireGuard or OpenVPN tunnel, next to the VPN card: pings (Cloudflare and Quad9, every 10 s, each server shown separately), a domain lookup of example.com sent through the tunnel and a web page check through the tunnel (once a minute), the WireGuard handshake (for OpenVPN, which has none: when data last came back from its server), and drops in the last hour and 24 hours, with the time and length of the last one. A drop = 30 s or more with no pings AND no web page through the tunnel (or no handshake). When pings stop but web pages still load, it’s a “ping-only blip”: listed separately and ignored, so devices aren’t moved to another tunnel. The “Monitor 5 h” button watches every tunnel closely for 5 hours (pings to 3 servers every few seconds, plus a domain lookup and a web page through each tunnel) and sends one summary to Discord at the end; it counts down while running and can be stopped early (the summary is still sent). “Clear all VPN alerts” (bottom of the card) clears every VPN warning, moves devices back to their own tunnels and resets the drop history; tunnels are then re-checked from scratch. Turning a tunnel off, removing it or switching its server never sends an alert: a tunnel gets 2 minutes to reconnect after a change, and a new or changed tunnel starts with a clean history. Green ✓ = passing, orange ! = shaky, red ✗ = failing. The domain lookup is shown only; it doesn’t trigger alerts or failover. Hidden in access-point mode.'],
  ['Access Point', 'Access points only: the main router’s address, internet latency, uplink and Wi-Fi clients.'],
  ['AdGuard Home', 'Whether ad blocking is on and which DNS server your devices use. With AdGuard on a NAS connected (the card’s Connection button) it shows live stats: protection, queries, % blocked, a 24-hour graph and top blocked domains.'],
  ['Clients', 'Every connected device. NEW = joined in the last 24 h, PAUSED = internet paused. The pause button cuts a device off immediately; click a device to rename, block or open its sheet.'],
  ['Network Health', 'Ping and packet loss for the internet and through each VPN tunnel (now and last 10 minutes) and whether your DNS server answers. Each tunnel is tested against two servers at once (Cloudflare and Quad9); it only counts as down when both get no answer, so one server briefly ignoring pings doesn’t set off a false “VPN down”. Internet health (2026-11-17): a Good / Fair / Poor verdict for the last hour with the reason; where a problem is (this router → modem → internet, with ping to each); a warning if the modem is in router mode (double NAT) or the ISP uses carrier-grade NAT; jitter and lag spikes (over your high-ping limit) on the Direct tile; what the line is good for right now (browsing, video calls, gaming); uptime today and over 7 days with the last outage; a 24-hour strip with one colored block per hour (hover for details); and the cable modem signal. Also (2026-11-18): the busiest device right now and its share of the traffic, DNS answer time vs usual plus AdGuard’s blocked share, ping under load measured from normal heavy use (bufferbloat grade), how full the connection table is, IPv6 status (and whether it could bypass the VPN), the likely cause of the last outage (the modem kept answering = your ISP’s side), and a Good / Fair / Poor grade next to each VPN tunnel.'],
  ['Security', '11 live checks every minute: SSH login type, your SSH key only, VPN key file, HTTPS-only admin, firewall, IPsec, port forwards, UPnP, remote access, services you turned off, and more. Plus whether your setup survives a firmware upgrade and whether Discord alerts work.'],
  ['Recent events (System card)', 'The “Recent events” line in the System card shows how many events the router has recorded (or “No events”). Click it for the timeline of everything the router noticed or did: outages, VPN failovers and auto-fixes, new devices, unusual uploads, sign-ins, settings changes and more, newest first. Click an event for details. Recorded even when Discord alerts are off, kept for 14 days and through restarts. Privacy mode shows only the type and time. Clear at the top removes the events from the past hour, day or week, or all of them (asks first; can’t be undone).'],
  ['Sensors / Last 24 Hours / Services', 'Every temperature sensor; 24-hour temperature and traffic charts (kept across reboots); the on/off state of each router service.'],
  ['Wi-Fi', 'Models with Wi-Fi: each band’s network name, channel, width, clients and Wi-Fi 7 multi-link (MLO) devices.'],
  ['Top Devices by Data', 'The biggest users over 24 hours and 7 days. Each list shows 4 devices; scroll inside it for more (up to 20). The two lists sit side by side when there is room, otherwise one above the other.'],
  ['Speed Test', 'Ookla speed test (if accepted at install): Test Internet, Test VPN (pick one tunnel, or all of them one after another; testing one keeps the others’ earlier results) or Test Both, with ping, jitter, loss, speeds and a bufferbloat grade. Runs nightly (set the time in Alerts). The ISP button opens the ISP report card.'],
  ['VPN & DNS leak test', 'Its own box in the “Speed Test & Leak Test” card (main routers). “Run leak test” checks from the router, in about 30 seconds and without changing or interrupting anything, that: each tunnel hides your home address, devices on the VPN can only leave through a tunnel, the kill switch is armed, IPv6 can’t bypass the VPN, and DNS lookups (e.g. AdGuard’s own) go through the VPN. The DNS check also works with the VPN off: it names the company that actually answers your lookups (Quad9, Cloudflare, Google, OpenDNS… or your internet provider, which is flagged as a leak). The results fold into one line (“No leaks found · N checks passed”); click the arrow to see each check. If something fails, the list opens by itself.'],
  ['Automatic leak test (hourly)', 'Main routers run the full leak test by themselves every hour, quietly in the background. If a check fails you get a 🚨 “Possible VPN / DNS leak” alert naming what failed (a tunnel showing your home address, traffic able to skip the VPN, kill switch off, IPv6 bypass, DNS outside the tunnel or your internet provider answering lookups), and a ✅ message once it’s clear again. Both land in Recent events. Not run in access-point mode or while the internet is down.'],
  ['Hourly DNS check', 'Every hour the main router checks which DNS provider answers your devices’ lookups and shows it at the top of the leak-test box with a short history. You get a message if lookups ever go to your internet provider, or a provider you’ve never used before appears (AdGuard switching between its usual upstreams doesn’t count).'],
  ['Ads Blocked by Device', 'Which devices AdGuard blocked the most (last 500 blocked lookups). Uses AdGuard on this router first (read by your browser with your existing login), otherwise AdGuard on a NAS. If AdGuard can’t tell devices apart, it shows the most-blocked sites instead. Needs AdGuard’s query log turned on.'],
  ['Data This Month', 'Internet use for your billing month with a bar per day and an “on pace for” estimate. “Set a data cap” for your cap (or Unlimited) and billing start day; Discord warns at 80% and 100%. Main routers only.'],
  ['Speed History', 'Your speed tests over 60 days: one line for the internet and one per VPN tunnel. Switch between Download and Upload.'],
  ['Who’s Home', 'Hidden by default (Layout > Edit > Show). Shows who’s home and since when, based on their phone being connected (away after 10 minutes unseen). Optional Discord messages on arrive/leave.']]],
 ['Device sheet (click a device in Clients)', '', [
  ['Rename / block / pause', 'Give the device a name, block it, or pause its internet. You’re asked before pausing the device that provides DNS for the whole network.'],
  ['Internet schedule', 'Pause that device’s internet on chosen days between two times (e.g. 22:00-07:00 on school nights; overnight is fine). Best set on the main router. Deleting a schedule restores the device.'],
  ['This is ___’s phone', 'Adds the person to Who’s Home.'],
  ['Wake-on-LAN', 'Tick it for a computer and a Wake button appears in Control Center to turn it on remotely (it must support Wake-on-LAN).']]],
 ['Control Center', '', [
  ['VPN tunnels / AdGuard / LEDs', 'Quick on/off switches. LEDs only on models that have them.'],
  ['Back up settings', 'Downloads a full router settings backup to your computer.'],
  ['Restart router', 'Restarts the router (1-2 minutes), after a confirmation.'],
  ['Restart modem', 'Presses Restart on the cable gateway, after a confirmation (internet down about 5-10 minutes). Only in router mode, once the cable modem is connected in Settings → Cable modem. At most once every 10 minutes.'],
  ['Settings', 'The Settings button opens one window with everything else, grouped: Privacy & look (privacy mode, look, colors, layout), Alerts & backups (Discord alerts, Auto-heal, NAS backup), Internet (cable modem, ISP report card) and Home (weather). The search box at the top filters it as you type (e.g. color, backup, xfinity); the page search bar finds settings too.'],
  ['Look', 'macOS or Android style, saved per browser. macOS: 9 accent colors. Android: 9 Material-You color themes. Both follow light/dark mode.'],
  ['Live wallpaper', 'Settings > Live wallpaper (on by default, saved per browser): the background colors of both looks slowly drift and blend, following your accent color or color theme. Off gives the still background. Turned off automatically if your device asks for reduced motion.'],
  ['Layout', 'Edit: ◀ ▶ to move cards, S/M/L to resize, Hide/Show. Done to finish, Reset for the default. Saved per browser.'],
  ['Discord alerts', 'Paste a Discord webhook, pick which alerts you want, set the temperature limit and the high-ping limit (default 75 ms: alerts when the internet ping stays over it for 5 minutes, one all-clear after 10 calm minutes, at most one alert an hour if it keeps bouncing), nightly speed test time, weekly report day/time and the weekly Wi-Fi report. The repair switches are in Settings > Auto-heal. “Send test” checks it works. The search box at the top filters everything in the window as you type (e.g. “vpn”, “upload”, “weekly”); hidden rows keep their settings when you save.'],
  ['Auto-heal', 'Settings > Auto-heal (moved out of Discord alerts): the switches for every repair the router does by itself, grouped VPN / Internet, DNS & Wi-Fi / Last resort (see  to your NAS (FTP, FTPS, WebDAV or SCP), with how many to keep. The password is stored on the router only. After every backup a restore check downloads the newest copy back into the router’s memory, makes sure it’s complete and contains the router’s settings, then deletes the temporary copy (“Verify now” runs it any time).'],
  ['NAS backup', 'Scheduled settings backups to your NAS (FTP, FTPS, WebDAV or SCP), with how many to keep. The password is stored on the router only. After every backup a restore check downloads the newest copy back into the router’s memory, makes sure it’s complete and contains the router’s settings, then deletes the temporary copy (“Verify now” runs it any time).'],
  ['ISP report card', 'Monthly uptime and outages, average and slowest speeds and how often tests reached 80% of your plan. Set your plan speeds here; “Copy as text” for your ISP.'],
  ['Weather', 'Location: a US ZIP code or a city anywhere (add the country if there are several: London, GB). “Show weather” off removes the weather from the Home tab and stops the downloads. On touchscreen models: weather on the sleep screen and the radar background (radar covers the US only).'],
  ['Temperature unit', '°F or °C for the whole Home tab, the weather and Discord alerts. Saved on the router, so every browser shows the same. Alert limits keep working the same way; they’re just shown in your unit.']]],
 ['Things it does by itself', 'Switches are in Control Center > Settings > Auto-heal. Each fix happens at most once per problem with a cool-down, sends a Discord message when it acts, and tells you if it didn’t help.', [
  ['Background checks', 'Every ~10 seconds: pings, DNS, VPN check-ins and temperature. Every minute: security checks, new devices, history and the self-care below.'],
  ['VPN failover', 'If a tunnel stops working for ~30 seconds its devices move to another working tunnel (never off the VPN) and move back once it has been healthy for a minute. WireGuard and OpenVPN tunnels are treated the same and can cover for each other.'],
  ['Stuck tunnel restart', 'A tunnel that’s switched on but hasn’t connected for 10 minutes gets its connection process restarted (at most 3 times in 6 hours); after that you’re told to try another server. Switch: Settings → Auto-heal.'],
  ['Memory leak fix', 'Checked hourly: if one service (web server, Tailscale, DNS, AdGuard) keeps growing for 6 hours while the router is short on memory, just that service is restarted, at most once a day. Switch: Settings → Auto-heal.'],
  ['SQM trial (opt-in)', 'If a speed test shows your ping rising 60+ ms while the line is busy, GL’s SQM traffic shaping is turned on at 85% of your measured speed. The next speed test decides whether it stays; otherwise your old settings come back. Two warnings before you can turn it on, because SQM can lower your top speed.'],
  ['Modem mode + slow DNS alerts', 'One message when the modem slips into router mode (double NAT) with the steps to fix it, and one when it’s back in bridge mode. One message when new lookups get slow, saying whether it’s AdGuard on your NAS or the DNS provider (at most every 3 hours, not while the whole line is lagging). Internet outage messages now say the likely cause.'],
  ['VPN auto-heal', 'A tunnel still down after 2 minutes is disconnected and reconnected, then every 10 minutes, up to 3 tries. If that fails you’re told which tunnel its devices are using meanwhile. A tunnel counts as down if pings fail, its check-ins stop, or web pages through it fail twice (catches “pings but no web”).'],
  ['Internet renew', 'If the cable to the modem is connected but there’s no internet for 3 minutes, the connection to your ISP is renewed once per outage. If it doesn’t help, it’s probably the modem or ISP.'],
  ['Wi-Fi band self-heal', 'Models with Wi-Fi: if a band (2.4, 5 or 6 GHz) is down or not answering for 3 minutes, just that band is restarted once (at most every 6 hours) and you get a message. A band that is simply empty is never restarted. Switch: Settings → Auto-heal.'],
  ['Slow speed test re-check', 'If the nightly Internet result is under your “slower than plan” limit, it’s tested again 10 minutes later and that result counts instead, so one busy moment doesn’t count as a slow night.'],
  ['Stalling VPN server', 'If a tunnel goes down 4+ times in 2 hours you get a suggestion to try another server. Optional (off by default): switch it automatically to the next server already saved on that tunnel in GL’s VPN page.'],
  ['Tailscale key expiry', 'The router reads when its Tailscale key expires and warns you 14, 7 and 1 days before (the Tailscale chip turns orange too). Renew it, or disable key expiry for the router in the Tailscale admin console.'],
  ['Offline alerts for devices', 'Open a device (Clients card) and switch on “Alert me if it goes offline”: a message after 3 minutes offline and when it’s back. The NAS is pre-selected. Works for devices that ignore ping too (checked by their network presence). Main routers only.'],
  ['Cable modem signal', 'Control Center → Settings → Cable modem: enter your Xfinity gateway’s admin password once (stored root-only). The router reads the modem hourly and warns you if the signal levels drift out of the normal range or errors pile up. The Internet card shows “Cable modem signal” (status, SNR and channel count) and “Modem uptime” (how long since the modem last restarted); click the signal for every reading. Nothing on the modem is changed.'],
  ['Monthly summary', 'On the 1st of each month: a Discord message with last month’s uptime, outages, VPN drops per provider, nightly speeds, data used, new devices, security events and auto-fixes. Preview it any time in Discord alerts.'],
  ['NAS full', 'If a NAS backup fails because the NAS ran out of space, the message says so clearly (your NAS can’t report free space over FTPS, so it’s detected from the upload error).'],
  ['NAS backup retry', 'A backup that failed because the NAS was asleep, rebooting or busy is tried again after 1 hour, then 6 hours. Not when the NAS is full or the password/folder is wrong (you’re told what to fix). Switch: Settings → Auto-heal.'],
  ['Wake the NAS', 'When the NAS goes offline, or doesn’t answer right before a backup, it’s sent a Wake-on-LAN signal (the backup then waits 3 minutes). Only helps if Wake-on-LAN is on in the NAS’s own settings.'],
  ['VPN leak fix', 'If the hourly leak test finds traffic leaving outside a tunnel, a tunnel showing your home address or the kill switch’s blocking rule missing, the VPN routing is re-applied (tunnels reconnect for a few seconds) and the test runs again 2 minutes later. Settings problems are reported, never changed.'],
  ['Connection table relief', 'Over 90% full for 5 minutes: the one device holding most connections has them cleared (it reconnects), or idle connections expire sooner until it’s under 60%. Long before a reboot is considered.'],
  ['Storage clean-up', 'Nearly full storage or RAM disk: files that are safe to lose are deleted (package lists, leftover temporary files). Never settings, history or undo backups.'],
  ['Access point reconnect', 'Access points: cable connected but no answer from the main router for 3 minutes → renew the address; 3 minutes later → restart the network link once.'],
  ['Quieter Wi-Fi channel (opt-in)', 'Applies the weekly report’s quieter channel at 3 AM, checks 7 minutes later that devices came back, and switches back if not. Only bands on a fixed channel, never radar-check (DFS) channels.'],
  ['Cable modem restart (opt-in)', 'Two warnings before it can be turned on. Internet down 10 minutes → a red “Restarting the cable modem in 5 min” banner with Cancel restart; at 15 minutes it presses Restart on the Xfinity gateway. At most once a day; you’re told when the internet is back, or that it’s probably an Xfinity outage. “Check (no restart)” tests the login without restarting.'],
  ['Router DNS', 'If the router’s own DNS stops answering even for itself for 3 minutes it’s restarted. Never touches AdGuard.'],
  ['Tailscale', 'If Tailscale is on but disconnected for 10 minutes it’s restarted (at most once an hour); if it’s signed out you get a message instead. It waits while the internet itself is down, since Tailscale reconnects by itself once it’s back.'],
  ['Smart reboot', 'Only for lasting serious problems (memory exhausted, connection table full, admin services stuck) after a gentler fix fails. At most once a day and twice a week, never within 6 hours of starting, never during a speed test, backup or upgrade; non-urgent ones wait for 2-5 AM.'],
  ['Stuck admin services / clock', 'GL’s web/API services are restarted if they stop answering for 3 minutes; the time service is restarted if time sync fails.'],
  ['Capacity alerts', 'When the connection table, storage, RAM disk, memory or DHCP pool (90%) gets nearly full.'],
  ['Unexpected restart', 'If the router starts up without having shut down normally first (usually a power cut or the power cable being pulled, less often a crash), you get one message. Normal restarts, restarts from the admin page and the router’s own automatic reboots don’t count.'],
  ['Unusual upload', 'Every 10 minutes the main router checks how much each device sent out. If one uploads 1 GB+ in about an hour AND 10× more than it normally does (its 7-day average), you get a message: it may be a cloud backup, but it can also be a hacked camera or malware sending data out. At most once a day per device. Your own GL.iNet routers (an access point or repeater behind this one) are treated specially: a speed test on them uploads in one short burst, and that burst is left out, so a speed test never sets it off, while steady uploading from them still does. Turn the alert type on or off in Discord alerts.'],
  ['Turned-off services', 'If a service you turned off is running again (often after a firmware update) you get one message. With the opt-in Auto-heal switch on, it’s stopped and disabled again instead (left running if it comes straight back).'],
  ['Log flood', 'If the router logs 300+ lines a minute for 3 minutes (something stuck in an error loop) you get a message naming the source.'],
  ['Settings change log', 'Hourly Discord message listing router settings that changed (passwords and keys never shown).'],
  ['Slow internet / cable check', 'Alert if 3 nightly speed tests in a row are under 70% of your plan, or the cable to the modem runs slower than it should or keeps disconnecting.'],
  ['Weekly Wi-Fi report', 'Routers with Wi-Fi, 3 AM on the weekly-report day: suggests a clearly quieter channel if there is one. You decide whether to change it.'],
  ['Firmware watch', 'Alerts when new firmware is out, with an upgrade checklist, and reports afterwards what (if anything) the upgrade broke.']]],
 ['Discord alert types', 'Turn each on or off in Control Center > Settings > Discord alerts.', [
  ['Network', 'VPN tunnel down or stale · internet outage (sent when it’s back) · DNS server not responding · new device joins · unusual upload from a device. Internet and VPN are each checked against two servers (Cloudflare and Quad9) and only count as down when both get no answer. Access points don’t send internet-outage alerts (their connection goes through the main router, which reports real outages); in router mode they do.'],
  ['Router', 'Security check changes · running hot · new firmware + checklist · after an upgrade: what broke · router health (auto-heal, reboots, stuck services, clock, storage/memory, cable, DHCP pool, log flood) · settings changed.'],
  ['Reports', 'Nightly speed test · weekly summary · internet slower than your plan · weekly Wi-Fi channel report · NAS backup failures.'],
  ['People + devices', 'Admin sign-ins (web + SSH) and failed SSH attempts · device schedules · who’s home · data cap (80% / 100%).']]],
 ['Travel routers (e.g. Slate 7 Pro)', 'Shown when the router gets internet over Wi-Fi (repeater), a phone (USB tethering), cellular, or is a travel model. They only read and show things; nothing changes your settings.', [
  ['Hotel sign-in page', 'Hotels and airports often show a login / “accept terms” page before the internet works, and devices behind a travel router never see it. The router checks every minute; when it finds one, an orange banner “This Wi-Fi needs you to sign in” appears with an Open sign-in page button. Accept there and the router goes online by itself (noticed within 20 seconds), followed by a “Signed in” message.'],
  ['This Network card', 'A safety check runs each time the router joins a network (after any sign-in page), or with Check again: is the Wi-Fi encrypted or open, is the router hidden from other guests (firewall), is the VPN on, who answers your DNS lookups, where websites think you are, Tailscale, and the VPN leak test when tunnels are on. Verdict: Looks safe / Mostly safe / Be careful, with a plain explanation for anything to know.'],
  ['Networks You’ve Used', 'A report card for each network: grade A–F from ping, packet loss, drops and speed, average signal, data used, security, last used, and what it’s good for (video calls, HD or 4K streaming). “Test this network” runs an Internet speed test to fill in the speed. Grades also show in Choose network. Forget removes a card (not the saved Wi-Fi). Keeps the 40 most recent.'],
  ['Home check', 'Every 5 minutes the router pings your home router through Tailscale and shows if home is reachable, the ping, and whether the path is direct or through a Tailscale relay. If home doesn’t answer for 15 minutes you get a “Can’t reach home” banner and message (home internet or power may be down). Pick the home router in This Network › Settings (automatic picks the Brume).'],
  ['Data per network', 'Data used on the current network today and in total. Optional daily limit per network (This Network › Settings) with a warning at 80% and 100%, useful for paid hotel Wi-Fi or a phone hotspot.']]],
 ['Touchscreen models (e.g. Slate 7 Pro)', '', [
  ['Weather on the sleep screen', 'The sleep screen shows the weather on the left; GL draws its clock on top. Turn it on or off in Weather settings.'],
  ['Radar background', 'A live radar map of your area behind the weather (Iowa State University / National Weather Service, refreshed every 15 minutes, ~4 MB a day). With no rain nearby: a sun by day, a moon and stars at night. Switch: Weather settings > Radar background.']]],
 ['Privacy and security', '', [
  ['What leaves the router', 'Only: Discord (if you add a webhook), Open-Meteo (weather), Iowa State (radar map for the touchscreen), Ookla (speed tests, if accepted) and GL’s normal firmware check. Ventusky is loaded by YOUR browser, only while the radar window is open.'],
  ['Passwords', 'NAS and AdGuard passwords and the Discord webhook are stored on the router only, readable by its admin account only, and never shown again.'],
  ['Login', 'The Home tab only works when you’re signed in to the router’s admin page.']]],
 ['Updates and undo', '', [
  ['Updating', 'Run the newer Router Home installer and choose 1. Your settings are kept.'],
  ['Undo', 'Every change made to a router keeps a backup and an undo script in /root/machome-backup/. The installer’s option 3 undoes its optional changes; option 2 removes the Home tab.']]]
];
function skeleton(){
  var dock = DOCK.map(function(d){
    if (d === '|') return '<span class="mh-dsep"></span>';
    if (d[0].charAt(0) === '@') return '<button class="mh-app" data-act="' + d[0].slice(1) + '" title="It' + String.fromCharCode(8217) + 's always DNS"><span class="ic" style="background:' + GRAD[d[3]] + '">' + svg(d[2]) + '</span><span class="lb">' + d[1] + '</span></button>';
    return '<button class="mh-app" data-route="' + d[0] + '" title="Open ' + d[1] + '"><span class="ic" style="background:' + GRAD[d[3]] + '">' + svg(d[2]) + '</span><span class="lb">' + d[1] + '</span></button>';
  }).join('');
  return '<div class="mh-wall">' +
    '<div class="mh-menubar"><div class="l">' + svg('router') + '<b data-k="host">Router</b><span data-route="internet">Internet</span><span data-route="clients">Clients</span><span data-route="vpndashboard">VPN</span><span data-route="overview">System</span><span data-act="about" title="What every part of this page does">About</span></div>' +
    '<div class="r"><span class="mh-mbi" data-k="mb-sys" data-act="sys" title="Click to see any alerts"></span><span class="mh-mbi" data-k="mb-vpn"></span><span class="mh-mbi" data-k="mb-wan"></span><button class="mh-ccb mh-pvb" data-act="phone" title="Phone view (compact page for small screens)" aria-label="Phone view">📱</button><button class="mh-ccb" data-act="priv" data-k="privb" title="Privacy mode" aria-label="Privacy mode">' + svg('eye') + '</button><button class="mh-ccb" data-act="cc" title="Control Center" aria-label="Control Center">' + svg('cc') + '</button><span class="mh-mbi" data-k="clock"></span></div></div>' +
    '<div class="mh-srch">' + svg('search') + '<input class="mh-sq" type="search" placeholder="Search this page (e.g. tunnel, temperature, a device name)   /" autocomplete="off" spellcheck="false" aria-label="Search this page"><div class="mh-sres" role="listbox" hidden></div></div>' +
    '<div class="mh-cc" data-k="cc" hidden></div>' +
    '<div data-k="wxz"></div>' +
    '<div data-k="wx"></div>' +
    '<div class="mh-pv" data-k="phone"></div>' +
    '<div class="mh-hero"><div class="l"><div><h1 data-k="greet">Welcome</h1><p data-k="summary">Gathering status…</p><p class="mh-updl" data-k="updline" style="display:none;margin-top:4px"></p></div><div data-k="wxw"></div></div><div class="mh-chips" data-k="chips"></div></div>' +
    '<div data-k="fwb"></div>' +
    '<div class="mh-grid">' +
      win('sys', 'System', {ic:[['cpu','gray']], wide:true, route:'overview', delay:0, body:'<div class="mh-gauges">' + gauge('cpu','CPU') + gauge('mem','Memory') + '<div class="mh-zramg" style="display:none">' + gauge('zram','Zram') + '</div>' + gauge('temp','Temperature') + gauge('conn','Connections') +
        '<div class="mh-dhcpg" style="display:none">' + gauge('dhcp','DHCP pool') + '</div>' +
        '<div class="mh-fang" data-act="fan" title="Fan control" style="display:none">' + gauge('fan','Fan') + '</div></div><div data-k="sysinfo"></div>'}) +
      /* owner's order (2026-11-13): Internet + Network Health side by side, Last 24 Hours right under them */
      win('net', 'Internet', {route:'internet', delay:60}) +
      win('hlt', 'Network Health', {ic:[['heart','red']], route:'internet', delay:80}) +
      win('his', 'Last 24 Hours', {ic:[['clock','blue']], wide:true, cls:'hist', route:'overview', delay:100}) +
      win('upl', 'Wi-Fi Uplink', {cls:'uplw', route:'internet', delay:110}) +
      win('trv', 'This Network', {cls:'uplw', delay:115}) +
      /* owner's order (2026-11-15): VPN Health next to VPN; Security next to AdGuard Home; Clients at the bottom */
      win('vpn', 'VPN', {route:'vpndashboard', delay:120}) +
      win('vhl', 'VPN Health', {cls:'vhw', route:'vpndashboard', delay:150}) +
      win('sec', 'Security', {route:'firewallview', delay:180}) +
      win('adg', 'AdGuard Home', {route:'adguardhome', delay:300}) +
      /* owner's order (2026-11-13): devices & usage, then speed, then router hardware last */
      win('adb', 'Ads Blocked by Device', {ic:[['bars','teal']], delay:330}) +
      win('dat', 'Data This Month', {ic:[['pie','purple']], delay:340}) +
      /* owner (2026-11-15): Clients and Top Devices by Data side by side (both half width) */
      win('cli', 'Clients', {ic:[['pc','green']], route:'clients', delay:350}) +
      win('use', 'Top Devices by Data', {ic:[['trophy','orange']], route:'clients', delay:360}) +
      win('nets', 'Networks You’ve Used', {cls:'uplw full', delay:370}) +
      win('spd', 'Speed Test &amp; Leak Test', {ic:[['speedo','blue'],['faucet','teal']], cls:'full', delay:380}) +
      win('sph', 'Speed History', {ic:[['chart','indigo']], wide:true, delay:390}) +
      win('wif', 'Wi-Fi', {cls:'full wifiw', route:'wireless', delay:400}) +
      win('sen', 'Sensors', {ic:[['therm','orange']], route:'overview', delay:420}) +
      win('svc', 'Services', {ic:[['apps','pink']], route:'plugins', delay:440}) +
      win('home', 'Who’s Home', {delay:470}) +
      /* GL.inet Utilities Toolkit (owner, 2026-11-22): always the last card */
      win('tk', 'GL.inet Utilities Toolkit', {ic:[['cpu','indigo']], cls:'full', delay:480}) +
    '</div>' +
    '<div class="mh-ver">Router Home v' + MH_VERSION + ' · build ' + MH_BUILD + ' · ' + MH_CREDIT + '</div>' +
    '<div class="mh-dockwrap"><nav class="mh-dock">' + dock + '</nav></div>' +
  '</div>';
}

return {
  name: 'machome',
  render: function(h){ return h('div', { attrs: { id: 'machome' } }); },
  created: function(){
    this.mh = { info:null, status:null, load:null, vpn:null, tun:null, adg:null, cable:null, cli:null, list:null, stats:null,
                prevNet:null, down:[], up:[], timers:[], alive:true, revealed:{}, hist:null, led:null, bwl:null,
                ccOpen:false, devMap:{}, busy:false, st:null, stT:null, rel:null, usage:null, alerts:null,
                priv: (function(){ try { return localStorage.getItem('machome-privacy') === '1'; } catch (e) { return false; } })() };
  },
  mounted: function(){
    var self = this, el = this.$el;
    if (!document.getElementById('machome-style')){
      var st = document.createElement('style'); st.id = 'machome-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    el.innerHTML = skeleton();
    if (this.phoneOn()) el.classList.add('mh-ph-on');   /* phone view (2026-11-18): remembered choice, else small screens */
    el.addEventListener('click', function(e){
      var rv = e.target.closest ? e.target.closest('[data-reveal]') : null;
      if (rv){
        e.preventDefault(); e.stopPropagation();
        var key = rv.getAttribute('data-reveal');
        self.mh.revealed[key] = !self.mh.revealed[key];
        self.paint();
        return;
      }
      var a = e.target.closest ? e.target.closest('[data-act]') : null;
      if (a){ e.preventDefault(); self.act(a.getAttribute('data-act'), a.getAttribute('data-arg')); return; }
      var t = e.target.closest ? e.target.closest('[data-route]') : null;
      if (t){ self.closeCC(); self.go(t.getAttribute('data-route')); return; }
      if (self.mh.ccOpen && !(e.target.closest && e.target.closest('.mh-cc'))) self.closeCC();
    });
    this.mh.onKey = function(e){
      if (e.key === 'Escape'){ self.closeRadar(); self.closeModal(); self.closeCC(); }
      /* "/" jumps to the page search (not while typing somewhere or with a window open) */
      var tg = e.target || {};
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !document.getElementById('machome-modal') && !/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || '') && !tg.isContentEditable){
        var sq = self.$el.querySelector('.mh-sq'); if (sq && sq.offsetParent){ e.preventDefault(); sq.focus(); }
      }
    };
    this.searchInit();
    /* leak-test details: remember open/closed so the 5-minute refresh doesn't fold it back up */
    /* (only the owner's own clicks count; opening by itself for a leak isn't remembered) */
    el.addEventListener('click', function(e){ var s = e.target.closest && e.target.closest('.mh-leakd > summary'); if (s) setTimeout(function(){ self.mh.leakOpen = !!s.parentNode.open; }, 0); }, true);
    document.addEventListener('keydown', this.mh.onKey);
    this.theme(); this.clock();
    rpc('system','get_info').then(function(r){ self.mh.info = r; self.paint(); if (r && r.hardware_feature && (r.hardware_feature.wifi_type || r.hardware_feature.fan)) self.slow(); });
    this.fast(); this.slow(); this.history(); this.speed();
    rpc('machome', 'get_alerts').then(function(a){ if (a) self.mh.alerts = a; });
    /* temperature unit saved on the router (2.6.7): a new browser picks it up; repaint only if it differs */
    rpc('machome', 'get_prefs').then(function(p){ if (!p || !p.temp_unit || p.temp_unit === TU) return; TU = p.temp_unit === 'C' ? 'C' : 'F'; try { localStorage.setItem('machome-tu', TU); } catch (e) {} if (self.mh.alive) self.paint(); });
    this.weather();
    this.mh.timers.push(setInterval(function(){ if (!document.hidden) self.weather(); }, 300000));
    this.mh.timers.push(setInterval(function(){ if (!document.hidden) self.fast(); }, 3000));
    this.mh.timers.push(setInterval(function(){ if (!document.hidden) self.slow(); }, 15000));
    this.mh.timers.push(setInterval(function(){ if (!document.hidden) self.history(); }, 60000));
    this.mh.timers.push(setInterval(function(){ self.clock(); self.theme(); self.vwTick(); }, 1000));
    this.layApply(); this.lifeLoad(); this.tkLoad(); this.updAuto();
    this.mh.timers.push(setInterval(function(){ if (!document.hidden) self.lifeLoad(); }, 30000));
    /* toolkit: follow a running test every 2 s */
    this.mh.timers.push(setInterval(function(){ var t = self.mh.tk; if (!document.hidden && t && t.job && t.job.running) self.tkJob(); }, 2000));
    this.mh.timers.push(setInterval(function(){ if (!document.hidden) self.lifePaint(); }, 5000));
  },
  beforeDestroy: function(){
    this.mh.alive = false;
    this.mh.timers.forEach(clearInterval);
    document.removeEventListener('keydown', this.mh.onKey);
    this.closeRadar(); this.closeModal();
    var t = document.getElementById('machome-toast'); if (t) t.remove();
    clearTimeout(this.mh.stT);
  },
  methods: {
    go: function(name){
      /* GL hides its Tailscale page in access-point mode (menu show_mode: router), so open our own panel there */
      if (name === 'tailscaleview' && this.isAP()) return this.openTs();
      try { var p = this.$router.push({ name: name }); if (p && p.catch) p.catch(function(){}); } catch (e) {}
    },
    /* ---- Tailscale panel for access points: GL's own tailscale RPCs (get_config / set_config / get_status /
       get_auth_url / logout), the same calls GL's Tailscale page makes. Never shares the LAN or acts as an exit node. */
    /* ---- Recent events: a line in the System card ("No events" / "N events") opens this window: every alert /
       auto-fix / outage, newest first (machome.get_events). The list only redraws when something new arrives,
       so an opened row stays open. Privacy mode shows the kind and time only. */
    evtLine: function(){
      var r = this.mh.evt; if (!r) return '…';
      var n = Number(r.total != null ? r.total : (r.list || []).length) || 0;
      return '<a href="#" data-act="events" style="color:var(--mh-blue)">' + (n ? n + ' event' + (n === 1 ? '' : 's') : 'No events') + '</a>';
    },
    openEvents: function(){
      var self = this, m = this.mh, pick = null;
      m.evSel = m.evSel || {};
      var LBL = { hour: 'the past hour', day: 'the past day', week: 'the past week', all: 'all time' };
      var selK = function(){ return Object.keys(m.evSel).filter(function(k){ return m.evSel[k]; }); };
      /* Clear row: pick a period, then confirm in place (no second window). With type chips picked, only those types. */
      var clrRow = function(md){
        var row = md.querySelector('.mh-evclr'); if (!row) return;
        var ks = selK(), what = ks.length ? ' (' + ks.map(function(k){ return KIND_NAMES[k] || k; }).join(', ') + ' only)' : '';
        row.innerHTML = pick ? '<span>Clear events from <b>' + LBL[pick] + '</b>' + esc(what) + '? This can’t be undone.</span><button class="dang" data-m="clrok">Clear</button><button data-m="clrno">Cancel</button>'
          : '<span>Clear' + esc(what) + ':</span><button data-m="clr" data-r="hour">Past hour</button><button data-m="clr" data-r="day">Past day</button><button data-m="clr" data-r="week">Past week</button><button data-m="clr" data-r="all">All</button>';
      };
      var kd = (m.alerts && m.alerts.ev_keep_days) || 14;
      var md = this.openModal('<div class="mh-evm"><div class="hic" style="background:' + GRAD.purple + '">' + svg('pulse') + '</div><h2>Recent events</h2>' +
        '<p>Everything the router noticed or did, newest first. Click an event for details. Recorded even when Discord alerts are off.</p>' +
        '<div class="mh-evopt">Keep events for <select data-kd>' + [1, 3, 7, 14, 30].map(function(d){ return '<option value="' + d + '"' + (d === kd ? ' selected' : '') + '>' + d + (d === 1 ? ' day' : ' days') + '</option>'; }).join('') + '</select>' +
        '<span>· pick types below to show or clear only those</span></div><div class="mh-evk" data-evk></div><div class="mh-evclr"></div><div data-evl></div></div>' +
        '<div class="btns"><button data-m="cancel">Close</button></div>', {
          clr: function(md2, b){ pick = b.getAttribute('data-r'); clrRow(md2); },
          clrno: function(md2){ pick = null; clrRow(md2); },
          evk: function(md2, b){ var k = b.getAttribute('data-k'); m.evSel[k] = !m.evSel[k]; m.evtSig = null; self.evtModalRefresh(md2); clrRow(md2); },
          evmute: function(md2, b){ self.muteDialog(b.getAttribute('data-k'), function(){ self.openEvents(); }); },
          clrok: function(md2, b){
            var range = pick; b.disabled = true; b.textContent = 'Clearing…';
            var ks = selK();
            rpcx('machome', 'clear_events', ks.length ? { range: range, kinds: ks } : { range: range }).then(function(r){
              if (!r || !r.ok) throw new Error((r && r.err) || 'the router didn’t accept it');
              pick = null; clrRow(md2);
              self.toast(r.removed ? 'Cleared ' + r.removed + ' event' + (r.removed === 1 ? '' : 's') : 'Nothing to clear in ' + LBL[range]);
              return rpc('machome', 'get_events');
            }).then(function(r){ if (r){ m.evt = r; m.evtSig = null; self.evtModalRefresh(md2); self.paint(); } })
              .catch(function(e){ b.disabled = false; b.textContent = 'Clear'; self.toast('Couldn’t clear: ' + e.message); });
          }
        });
      clrRow(md);
      /* "Keep events for": saved right away (alert settings), older events go within a minute */
      var kdSel = md.querySelector('[data-kd]');
      if (kdSel) kdSel.addEventListener('change', function(){
        var d = Number(kdSel.value) || 14;
        rpcx('machome', 'set_alerts', { ev_keep_days: d }).then(function(r){ if (!r || !r.ok) throw new Error('not saved'); if (m.alerts) m.alerts.ev_keep_days = d; self.toast('Events are kept for ' + d + (d === 1 ? ' day' : ' days')); })
          .catch(function(){ self.toast('Couldn’t save that setting'); });
      });
      if (!m.alerts) rpc('machome', 'get_alerts').then(function(a){ if (a){ m.alerts = a; if (kdSel && a.ev_keep_days) kdSel.value = String(a.ev_keep_days); } });
      this.mh.evtSig = null; this.evtModalRefresh(md);
    },
    evtModalRefresh: function(md){
      md = md || document.getElementById('machome-modal'); var box = md && md.querySelector('[data-evl]'); if (!box) return;
      var m = this.mh, r = m.evt || {};
      var all = Array.isArray(r.list) ? r.list : [], sel = m.evSel || {};
      var picked = Object.keys(sel).filter(function(k){ return sel[k]; });
      var L = picked.length ? all.filter(function(e){ return sel[e.k]; }) : all;
      var sig = all.length + ':' + (all[0] ? all[0].t + all[0].ti : '') + ':' + (m.priv ? 1 : 0) + ':' + picked.join(',');
      if (sig === m.evtSig) return; m.evtSig = sig;
      /* type chips: every type in the list, with its count */
      var kc = {}; all.forEach(function(e){ kc[e.k] = (kc[e.k] || 0) + 1; });
      var chips = md.querySelector('[data-evk]');
      if (chips) chips.innerHTML = Object.keys(kc).sort(function(a, b){ return kc[b] - kc[a]; }).map(function(k){
        return '<button data-m="evk" data-k="' + esc(k) + '" class="' + (sel[k] ? 'on' : '') + '">' + esc(KIND_NAMES[k] || k) + ' ' + kc[k] + '</button>'; }).join('');
      if (!L.length){ box.innerHTML = '<p class="mh-empty">' + (all.length ? 'No events of the picked types.' : 'No events yet. Alerts, auto-fixes, outages, new devices and unusual uploads will show up here.') + '</p>'; return; }
      var KIND = KIND_NAMES;
      var COL = { red: 'var(--mh-red)', orange: 'var(--mh-orange)', green: 'var(--mh-green)', blue: 'var(--mh-blue)', purple: 'var(--mh-purple)', gray: 'var(--mh-text3)' };
      var today = new Date().toDateString(), priv = m.priv;
      var h = L.map(function(e){
        var w = new Date(e.t * 1000);
        var ts = (w.toDateString() === today ? '' : w.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ') + w.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        var title = priv ? (KIND[e.k] || 'Event') : String(e.ti || KIND[e.k] || 'Event');
        return '<details class="mh-ev"><summary><i style="background:' + (COL[e.c] || COL.blue) + '"></i><b>' + esc(title) + '</b><small>' + esc(ts) + '</small></summary>' +
          (priv ? '<p>Details hidden in privacy mode.</p>' : (e.d ? '<p><span class="k">' + esc(KIND[e.k] || e.k || '') + '</span> ' + esc(e.d) + '</p>' : '')) +
          (e.k && /^[a-z_]+$/.test(e.k) ? '<p><a class="mu" data-m="evmute" data-k="' + esc(e.k) + '">Mute ' + esc(KIND[e.k] || e.k) + ' alerts for a while…</a></p>' : '') + '</details>';
      }).join('');
      box.innerHTML = '<div class="mh-evl">' + h + '</div>' + (Number(r.total) > L.length ? '<p class="mh-evmore">Showing the newest ' + L.length + ' of ' + r.total + '.</p>' : '');
    },
    /* ---- Page search (bar under the menu bar). Searches the text that is on screen right now: the alert banners,
       the greeting + chips and every visible card. Each hit is the smallest element holding ALL the typed words,
       widened to its row (<= 110 chars) for context; max 4 per card. Picking one scrolls to it, outlines the card and
       highlights the row. Only reads the page (hidden/private values are never in the page, so never searchable). */
    searchInit: function(){
      var self = this, el = this.$el, q = el.querySelector('.mh-sq'), box = el.querySelector('.mh-sres');
      if (!q || !box) return;
      var res = [], on = 0, tmr = null, words = [];
      var norm = function(s){ return (s || '').replace(/\s+/g, ' ').trim(); };
      var mark = function(s){
        var L = s.toLowerCase(), m = [];
        words.forEach(function(w){ var i = 0; while ((i = L.indexOf(w, i)) > -1){ m.push([i, i + w.length]); i += w.length; } });
        m.sort(function(a, b){ return a[0] - b[0]; });
        var out = '', p = 0;
        m.forEach(function(r){ var a = Math.max(r[0], p); if (r[1] <= a) return; out += esc(s.slice(p, a)) + '<mark>' + esc(s.slice(a, r[1])) + '</mark>'; p = r[1]; });
        return out + esc(s.slice(p));
      };
      var clip = function(s){ if (s.length <= 130) return s; var i = Math.max(0, s.toLowerCase().indexOf(words[0]) - 45); return (i ? '…' : '') + s.slice(i, i + 130) + (i + 130 < s.length ? '…' : ''); };
      var sections = function(){
        var out = [];
        ['wx', 'fwb'].forEach(function(k){ var n = el.querySelector('[data-k="' + k + '"]'); if (n && n.getClientRects().length) out.push({ n: 'Alerts', el: n, card: n }); });
        var hero = el.querySelector('.mh-hero'); if (hero) out.push({ n: 'Top of page', el: hero, card: hero });
        el.querySelectorAll('.mh-grid > .mh-win').forEach(function(c){
          if (!c.getClientRects().length) return;                       /* hidden cards (layout / not on this model) */
          var t = c.querySelector('.mh-tb .t'); out.push({ n: norm(t && t.textContent), el: c.querySelector('.mh-body'), card: c });
        });
        return out;
      };
      var all = function(t){ t = (t || '').toLowerCase(); for (var i = 0; i < words.length; i++) if (t.indexOf(words[i]) < 0) return false; return true; };
      var render = function(){
        var cards = {}; res.forEach(function(r){ if (!r.about) cards[r.set ? 'set:' + r.set : r.n] = 1; });
        var nc = Object.keys(cards).length;
        box.innerHTML = '<div class="h">' + (nc ? 'Found in ' + nc + ' place' + (nc > 1 ? 's' : '') + ' · ↑↓ to choose, Enter to go' : 'Nothing on this page matches.') + '</div>' +
          res.map(function(r, i){
            return '<div class="r' + (r.about ? ' ab' : '') + (i === on ? ' on' : '') + '" data-i="' + i + '" role="option"><small>' + esc(r.n) + '</small><span>' +
              (r.about ? 'Search the feature guide for “' + esc(q.value.trim()) + '” ›' : r.set ? mark(r.set) + ' ›' : r.more ? '+' + r.more + ' more in this card' : r.t ? mark(clip(r.t)) : 'Go to this card') + '</span></div>';
          }).join('');
        box.hidden = false;
        var a = box.querySelector('.r.on'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
      };
      var run = function(){
        words = norm(q.value).toLowerCase().split(' ').filter(Boolean); res = []; on = 0;
        if (!words.length){ box.hidden = true; box.innerHTML = ''; return; }
        sections().forEach(function(S){
          var hits = [], stamp = {};
          if (S.el){
            var els = S.el.querySelectorAll('*'), M = [];
            for (var i = 0; i < els.length; i++){
              var e = els[i];
              if (/^(style|script|option|select|input|textarea)$/i.test(e.tagName) || e.closest('svg,select,.mh-tb')) continue;
              if (all(e.textContent)){ e.__sm = stamp; M.push(e); }
            }
            M.forEach(function(e){
              for (var c = e.firstElementChild; c; c = c.nextElementSibling) if (c.__sm === stamp) return;   /* a child holds it all: use that */
              if (!e.getClientRects().length) return;
              var r = e;
              while (r.parentElement && r.parentElement !== S.el && norm(r.parentElement.textContent).length <= 110) r = r.parentElement;
              if (hits.some(function(h){ return h.el === r || h.el.contains(r) || r.contains(h.el); })) return;
              /* innerText keeps the gaps between a row's parts ("Tunnel 1 · WireGuard"), textContent glues them */
              hits.push({ el: r, t: norm(String(r.innerText || r.textContent).replace(/\s*\n\s*/g, ' · ')).replace(/( · ?)+(?=·)/g, ' ').replace(/(\s*·\s*)+/g, ' · ').replace(/^ ?· | ·$/g, '') });
            });
          }
          if (!hits.length && !all(S.n)) return;
          if (!hits.length) res.push({ n: S.n, el: S.card, card: S.card });
          hits.slice(0, 4).forEach(function(h){ res.push({ n: S.n, el: h.el, card: S.card, t: h.t }); });
          if (hits.length > 4) res.push({ n: S.n, el: S.card, card: S.card, more: hits.length - 4 });
        });
        res = res.slice(0, 40);
        /* Settings window rows (it's a pop-up, so not on the page): opening one shows the window filtered to it */
        try { self.settingsIndex().forEach(function(s){ if (all(s.text)) res.push({ n: 'Settings', set: s.name }); }); } catch (e) {}
        res.push({ n: 'About guide', about: true });
        render();
      };
      var go = function(r){
        if (!r) return;
        box.hidden = true;
        if (r.about){
          var t = q.value; self.openAbout();
          var aq = document.querySelector('#machome-modal .mh-ab-q'); if (aq){ aq.value = t; aq.dispatchEvent(new Event('input')); }
          return;
        }
        if (r.set){ self.closeCC(); self.openSettings(false, r.set); return; }
        var target = r.el && r.el.isConnected ? r.el : r.card;
        if (!target || !target.isConnected) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var c = r.card; if (c && c.isConnected){ c.classList.add('mh-sfl'); setTimeout(function(){ c.classList.remove('mh-sfl'); }, 1800); }
        if (target !== c){ target.classList.add('mh-sfh'); setTimeout(function(){ target.classList.remove('mh-sfh'); }, 2200); }
      };
      q.addEventListener('input', function(){ clearTimeout(tmr); tmr = setTimeout(run, 120); });
      q.addEventListener('focus', function(){ if (q.value.trim()) run(); });
      q.addEventListener('blur', function(){ setTimeout(function(){ if (document.activeElement !== q) box.hidden = true; }, 120); });
      q.addEventListener('keydown', function(e){
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
          e.preventDefault(); if (box.hidden){ run(); return; } if (!res.length) return;
          on = (on + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; render();
        } else if (e.key === 'Enter'){ e.preventDefault(); if (box.hidden) run(); else go(res[on]); }
        else if (e.key === 'Escape'){ e.stopPropagation(); if (q.value){ q.value = ''; run(); } else q.blur(); }
      });
      box.addEventListener('mousedown', function(e){ e.preventDefault(); var d = e.target.closest('[data-i]'); if (d) go(res[+d.getAttribute('data-i')]); });
    },
    /* ---- About Home: the full feature guide (ABOUT), with a search box */
    openAbout: function(){
      var n = 0; ABOUT.forEach(function(s){ n += s[2].length; });
      var html = '<div class="mh-about"><div class="hic" style="background:' + GRAD.indigo + '">' + svg('bulb') + '</div><h2>About Home</h2>' +
        '<p class="mh-ab-sub">Router Home v' + MH_VERSION + ' · build ' + MH_BUILD + ' · ' + n + ' features explained</p>' +
        '<input class="mh-ab-q" type="search" placeholder="Search features (e.g. radar, VPN, DHCP)…" autocomplete="off">' +
        ABOUT.map(function(s, i){
          return '<details' + (i === 0 ? ' open' : '') + '><summary>' + s[0] + '<small>' + s[2].length + '</small></summary>' + (s[1] ? '<p class="mh-ab-in">' + s[1] + '</p>' : '') +
            '<dl>' + s[2].map(function(f){ return '<div class="mh-ab-f"><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join('') + '</dl></details>';
        }).join('') +
        '<p class="mh-ab-none" hidden>Nothing matches that search.</p>' +
        '<p class="mh-ab-cred">' + MH_CREDIT + '</p></div>' +
        '<div class="btns"><button data-m="cancel">Close</button></div>';
      var md = this.openModal(html, {});
      var q = md.querySelector('.mh-ab-q');
      if (q) q.addEventListener('input', function(){
        var t = q.value.trim().toLowerCase(), any = false;
        md.querySelectorAll('.mh-about details').forEach(function(d){
          var hit = 0;
          d.querySelectorAll('.mh-ab-f').forEach(function(f){ var ok = !t || f.textContent.toLowerCase().indexOf(t) > -1 || d.querySelector('summary').textContent.toLowerCase().indexOf(t) > -1; f.hidden = !ok; if (ok) hit++; });
          d.hidden = !hit; if (t && hit) d.open = true; if (hit) any = true;
        });
        md.querySelector('.mh-ab-none').hidden = any;
      });
    },
    openTs: function(){
      var self = this, m = this.mh;
      var md = this.openModal('<div data-t></div>', {
        on: function(md2, b){ self.tsSet(md, true, b); },
        off: function(md2, b){ self.tsSet(md, false, b); },
        login: function(md2, b){ self.tsLogin(md, b); },
        logout: function(md2, b){ self.tsLogout(md, b); }
      });
      m.tsw = { cfg: null, st: null, url: '', err: '' };
      this.tsRender(md); this.tsLoad(md);
    },
    tsLoad: function(md, then){
      var self = this, m = this.mh;
      Promise.all([rpc('tailscale', 'get_config'), rpc('tailscale', 'get_status')]).then(function(r){
        if (!m.tsw || !md.parentNode) return; m.tsw.cfg = r[0] || m.tsw.cfg; m.tsw.st = r[1] || {}; self.tsRender(md); if (then) then(m.tsw);
      });
    },
    tsPoll: function(md, until, maxMs, done){
      var self = this, m = this.mh, t0 = Date.now();
      var step = function(){ if (!m.tsw || !md.parentNode) return;
        self.tsLoad(md, function(W){ if (until(W)) return done && done(true); if (Date.now() - t0 > maxMs) return done && done(false); setTimeout(step, 3000); }); };
      setTimeout(step, 2000);
    },
    tsRender: function(md){
      var m = this.mh, W = m.tsw; if (!W || !md.parentNode) return; var box = md.querySelector('[data-t]'); if (!box) return;
      var c = W.cfg || {}, s = W.st || {}, on = !!c.enabled, con = on && s.status === 3;
      var st = !W.cfg ? 'Loading…' : !on ? 'Off' : ({ 1: 'Sign-in needed', 2: 'Waiting for approval', 3: 'Connected', 4: 'Connecting…' })[s.status] || 'Starting…';
      var row = function(k, v){ return '<div class="mh-mrow"><span>' + esc(k) + '</span><b>' + v + '</b></div>'; };
      var rows = row('Status', '<span style="font-weight:600;color:' + (con ? 'var(--mh-green)' : on ? 'var(--mh-orange)' : 'var(--mh-text2)') + '">' + esc(st) + '</span>') +
        (con && s.address_v4 ? row('Tailscale address', esc(m.priv ? 'Hidden' : s.address_v4)) : '') +
        (con && s.login_name ? row('Account', esc(m.priv ? 'Hidden' : s.login_name)) : '');
      var link = W.url && !con ? '<p style="margin-top:10px">If the sign-in page didn’t open: <a href="' + esc(W.url) + '" target="_blank" rel="noopener noreferrer" style="color:var(--mh-blue)">open it here</a>. Sign in with the same Tailscale account as your other routers.</p>' : '';
      var b = !W.cfg ? '' : !on ? '<button class="pri" data-m="on">Turn on</button>' :
        con ? '<button data-m="logout">Sign out</button><button class="dan" data-m="off">Turn off</button>' :
        '<button class="pri" data-m="login">Sign in</button><button class="dan" data-m="off">Turn off</button>';
      box.innerHTML = '<div class="hic" style="background:' + GRAD.indigo + '">' + svg('lock') + '</div><h2>Tailscale</h2>' +
        '<p>GL hides its Tailscale page while this router is an access point, so it’s controlled here with the same settings GL uses. This router won’t share your home network or act as an exit node.</p>' +
        rows + link + '<div class="err" data-e>' + esc(W.err || '') + '</div>' +
        '<div class="btns">' + b + '<button data-m="cancel">Close</button></div>';
    },
    tsSet: function(md, on, btn){
      var self = this, m = this.mh, W = m.tsw; if (!W) return;
      var p = {}; Object.keys(W.cfg || {}).forEach(function(k){ p[k] = W.cfg[k]; });
      p.enabled = on; p.lan_enabled = false; p.wan_enabled = false; p.run_exit_node = false; p.masq = false;
      btn.disabled = true; btn.textContent = on ? 'Turning on…' : 'Turning off…'; W.err = '';
      rpcx('tailscale', 'set_config', p, 30000).then(function(){
        self.tsPoll(md, function(X){ return on ? (X.st && X.st.status) : !(X.cfg && X.cfg.enabled); }, 30000, function(ok){
          if (!ok && m.tsw){ m.tsw.err = on ? 'Tailscale is taking a while to start. Close this and check again in a minute.' : ''; self.tsRender(md); }
          if (ok) self.refreshSoon(1500);
        });
      }).catch(function(e){ W.err = 'The router refused: ' + ((e && e.message) || 'error'); self.tsRender(md); });
    },
    tsLogin: function(md, btn){
      var self = this, m = this.mh, W = m.tsw; if (!W) return;
      var win = null; try { win = window.open('about:blank', '_blank'); if (win) win.opener = null; } catch (e) {}
      btn.disabled = true; btn.textContent = 'Getting link…'; W.err = '';
      rpcx('tailscale', 'get_auth_url', {}, 30000).then(function(r){
        var u = r && (r.auth_url || r.url || r.AuthURL);
        if (!u || !/^https:\/\/login\.tailscale\.com\//.test(u)) throw new Error('no sign-in link yet, try again in a few seconds');
        W.url = u; if (win) win.location.href = u; self.tsRender(md);
        self.tsPoll(md, function(X){ return X.st && X.st.status === 3; }, 300000, function(ok){ if (ok){ self.toast('Tailscale connected'); self.refreshSoon(1500); } });
      }).catch(function(e){ if (win) try { win.close(); } catch (x) {} W.err = 'Couldn’t get the sign-in link: ' + ((e && e.message) || 'error'); self.tsRender(md); });
    },
    tsLogout: function(md, btn){
      var self = this, m = this.mh, W = m.tsw; if (!W) return;
      btn.disabled = true; btn.textContent = 'Signing out…';
      rpcx('tailscale', 'logout', {}, 30000).then(function(){ W.url = ''; self.tsLoad(md); self.refreshSoon(1500); })
        .catch(function(e){ W.err = 'Couldn’t sign out: ' + ((e && e.message) || 'error'); self.tsRender(md); });
    },
    q: function(k){ return this.$el.querySelector('[data-k="' + k + '"]'); },
    set: function(k, html){
      var n = this.q(k); if (!n || n.__h === html) return;
      /* keep the scroll position of every scrolling list in the window (2026-11-15: Top Devices has two) */
      var SS = '.mh-scroll,.mh-use4', tops = Array.prototype.map.call(n.querySelectorAll(SS), function(e){ return e.scrollTop; });
      n.innerHTML = html; n.__h = html;
      if (tops.some(function(t){ return t > 0; })) Array.prototype.forEach.call(n.querySelectorAll(SS), function(e, i){ if (tops[i]) e.scrollTop = tops[i]; });
    },
    theme: function(){
      var dark = !!document.querySelector('link[href*="/theme/dark/"]') || !!document.getElementById('theme-dark');
      this.$el.classList.toggle('mh-dark', dark);
      var ui = 'mac'; try { ui = localStorage.getItem('machome-ui') || 'mac'; } catch (e) {}
      this.$el.classList.toggle('mh-and', ui === 'android'); this.$el.classList.toggle('mh-vivid', ui === 'android');
      var pal = 'playful'; try { pal = localStorage.getItem('machome-pal') || 'playful'; } catch (e) {}
      var el = this.$el; [['playful','Playful','conic-gradient(#ff5c93,#8ccf2e,#8a6cff,#ff8a3d,#3d9cff,#22c3a0,#ff5c93)'],['ocean','Ocean','linear-gradient(135deg,hsl(200,72%,70%) 0 50%,hsl(205,72%,42%) 50% 100%)'],['forest','Forest','linear-gradient(135deg,hsl(128,48%,70%) 0 50%,hsl(135,48%,42%) 50% 100%)'],['sunset','Sunset','linear-gradient(135deg,hsl(14,85%,70%) 0 50%,hsl(18,85%,42%) 50% 100%)'],['grape','Grape','linear-gradient(135deg,hsl(265,62%,70%) 0 50%,hsl(270,62%,42%) 50% 100%)'],['rose','Rose','linear-gradient(135deg,hsl(340,72%,70%) 0 50%,hsl(340,72%,42%) 50% 100%)'],['citrus','Citrus','linear-gradient(135deg,hsl(58,78%,70%) 0 50%,hsl(62,78%,42%) 50% 100%)'],['mint','Mint','linear-gradient(135deg,hsl(160,55%,70%) 0 50%,hsl(165,55%,42%) 50% 100%)'],['slate','Slate','linear-gradient(135deg,hsl(215,25%,70%) 0 50%,hsl(220,25%,42%) 50% 100%)']].forEach(function(p){ el.classList.toggle('mh-pal-' + p[0], ui === 'android' && p[0] === pal && p[0] !== 'playful'); });
      var live = true; try { live = localStorage.getItem('machome-live') !== '0'; } catch (e) {}
      this.$el.classList.toggle('mh-live', live);
      var acc = 'multi'; try { acc = localStorage.getItem('machome-acc') || 'multi'; } catch (e) {}
      [['multi','Multicolor','conic-gradient(#ff5f57,#febc2e,#28c840,#00b4ff,#af52de,#ff5f57)'],['blue','Blue','hsl(211,100%,50%)'],['purple','Purple','hsl(280,62%,52%)'],['pink','Pink','hsl(330,85%,55%)'],['red','Red','hsl(3,88%,55%)'],['orange','Orange','hsl(30,95%,50%)'],['yellow','Yellow','hsl(44,95%,42%)'],['green','Green','hsl(135,55%,40%)'],['graphite','Graphite','hsl(220,8%,45%)']].forEach(function(p){ el.classList.toggle('mh-acc-' + p[0], ui !== 'android' && p[0] === acc && p[0] !== 'multi'); });
    },
    clock: function(){
      var d = new Date();
      this.set('clock', esc(d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' }) + '  ' + d.toLocaleTimeString(undefined, { hour:'numeric', minute:'2-digit' })));
      var hr = d.getHours();
      this.set('greet', hr < 5 ? 'Good night' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening');
    },
    fast: function(){
      var self = this, m = this.mh;
      Promise.all([rpc('system','get_status'), rpc('vpn-client','get_status'), rpc('cable','get_status'), rpc('machome','get_stats')])
        .then(function(r){
          if (!m.alive) return;
          if (r[0]) m.status = r[0];
          m.vpn = r[1]; m.cable = r[2];
          if (r[3]) self.track(r[3]);
          self.paint();
        });
      /* Wi-Fi uplink card (travel routers): live link status every ~6 s while it's shown */
      if (m.uplOn && !m.uplBusy && (!m.uplT || Date.now() - m.uplT > 5500)){
        m.uplT = Date.now();
        Promise.all([rpc('repeater','get_status'), rpc('machome','get_uplink')]).then(function(r){
          if (!m.alive) return; if (r[0]) m.rep = r[0]; m.upl = r[1]; self.paint(); });
      }
      /* travel data (sign-in page, safety check, report cards, home, data): every ~10 s on travel routers */
      if (m.uplOn && (!m.trvT || Date.now() - m.trvT > 9500)){
        m.trvT = Date.now();
        rpc('machome', 'get_travel').then(function(r){ if (!m.alive || !r) return; m.trv = r; self.paint(); });
      }
    },
    slow: function(){
      var self = this, m = this.mh;
      Promise.all([rpc('adguardhome','get_config'), rpc('vpn-client','get_tunnel'), rpc('clients','get_list'), rpc('dns','get_config'),
                   /* routers without LEDs (e.g. Slate 7 Pro) have no led module; asking triggers GL's "Unknown error" toast */
                   (m.info && m.info.hardware_feature && m.info.hardware_feature.noled) || !m.info ? Promise.resolve(null) : rpc('led','get_config'),
                   rpc('black_white_list','get_config')])
        .then(function(r){
          if (!m.alive) return;
          m.adg = r[0]; m.adgLoaded = true; m.tun = r[1]; m.list = r[2]; m.dns = r[3]; m.led = r[4]; m.bwl = r[5];
          self.paint();
        });
      /* Wi-Fi / repeater / fan only on hardware that has them */
      var hf = (m.info && m.info.hardware_feature) || {};
      if (hf.wifi_type || hf.radio){
        Promise.all([rpc('wifi','get_config'), rpc('repeater','get_status')]).then(function(r){ if (!m.alive) return; m.wifi = r[0]; m.rep = r[1]; self.paint(); });
      }
      if (hf.fan) rpc('fan','get_config').then(function(r){ if (m.alive && r) m.fanCfg = r; });
      rpc('machome', 'get_events').then(function(r){ if (m.alive && r){ m.evt = r; self.evtModalRefresh(); } });
      /* trackers (watch.lua): Tailscale key expiry, watched devices, cable modem */
      rpc('machome', 'get_watch').then(function(r){ if (m.alive && r){ m.watch = r; } });
      /* last leak-test result (cheap file read); the Speed Test card shows it */
      if ((!m.leakT || Date.now() - m.leakT > 300000) && !(m.leak && m.leak.running)){ m.leakT = Date.now(); rpc('machome', 'get_leaktest').then(function(r){ if (m.alive && r){ m.leak = r; if (self.q('spd')) self.set('spd', self.spdHtml()); } }); }
      /* once a minute: AdGuard on the NAS + hardware acceleration */
      var nowMs = Date.now();
      if (!m.extT || nowMs - m.extT > 55000){
        m.extT = nowMs;
        rpc('machome', 'get_nas_adguard').then(function(r){ if (m.alive && r){ m.nasAdg = r; self.paint(); } });
        rpc('machome', 'get_accel').then(function(r){ if (m.alive && r){ m.accel = r; self.paint(); } });
        rpc('machome', 'get_nas_backup').then(function(r){ if (m.alive && r) m.nasB = r; });
      }
      if (!(m.st && m.st.running)) this.speed();
    },
    speed: function(){
      var self = this, m = this.mh;
      rpc('machome', 'get_speedtest').then(function(r){
        if (!m.alive || !r) return;
        var was = m.st && m.st.running;
        m.st = r;
        self.set('spd', self.spdHtml());
        clearTimeout(m.stT);
        if (r.running) m.stT = setTimeout(function(){ self.speed(); }, 1000);
        else if (was){ var st = r.state || {}; self.toast(st.cancelled ? 'Speed test cancelled' : st.error ? st.error : 'Speed test finished'); }
      });
    },
    history: function(){
      var self = this, m = this.mh;
      rpc('machome','get_history').then(function(r){ if (!m.alive || !r) return; m.hist = r; self.paint(); });
      rpc('machome','get_vpn_providers').then(function(r){ if (!m.alive || !r || !r.groups) return; m.prov = r.groups; m.srv = Array.isArray(r.servers) ? r.servers : []; self.paint(); });
      self.vwLoad();   /* VPN monitor status (countdown) */
      rpc('machome','get_reliability').then(function(r){ if (!m.alive || !r) return; m.rel = r; self.paint(); });
      rpc('machome','get_usage').then(function(r){ if (!m.alive || !r) return; m.usage = r; self.set('use', self.useHtml()); });
    },
    refreshSoon: function(ms){
      var self = this;
      setTimeout(function(){ if (self.mh.alive){ self.slow(); self.fast(); } }, ms || 4000);
    },
    wanIf: function(){
      var i = this.mh.info, hf = i && i.hardware_feature;
      return (this.mh.stats && this.mh.stats.wan_dev) || (hf && hf.wan) || 'eth1';   /* active uplink (default route) first */
    },
    track: function(s){
      var m = this.mh, w = this.wanIf(), cur = s.net && s.net[w];
      if (cur && m.prevNet && s.time > m.prevNet.time){
        var dt = s.time - m.prevNet.time;
        var dn = Math.max(0, (cur.rx - m.prevNet.rx) / dt), up = Math.max(0, (cur.tx - m.prevNet.tx) / dt);
        m.down.push(dn); m.up.push(up);
        if (m.down.length > 40){ m.down.shift(); m.up.shift(); }
        m.rateDown = dn; m.rateUp = up;
      }
      if (cur) m.prevNet = { rx: cur.rx, tx: cur.tx, time: s.time };
      m.stats = s;
    },
    gaugeSet: function(key, p, color, val, sub){
      var g = this.$el.querySelector('[data-g="' + key + '"]'); if (!g) return;
      var c = g.querySelector('.val'), L = 2 * Math.PI * 46;
      c.setAttribute('stroke-dashoffset', (L * (1 - Math.max(0, Math.min(100, p)) / 100)).toFixed(2));
      c.setAttribute('stroke', color);
      g.querySelector('b').textContent = val;
      g.querySelector('small').textContent = sub || '';
    },
    clientsArr: function(){
      var l = this.mh.list; if (!l) return null;
      var a = Array.isArray(l) ? l : (l.clients || l.list || l.client_list || null);
      if (!a && typeof l === 'object'){ for (var k in l){ if (Array.isArray(l[k])){ a = l[k]; break; } } }
      return Array.isArray(a) ? a : null;
    },
    paint: function(){
      if (this.phoneOn()){ try { this.set('phone', this.phoneHtml()); } catch (e) {} }
      var m = this.mh, st = m.status || {}, sys = st.system || {}, info = m.info || {}, s = m.stats || {};
      var board = info.board_info || {};
      var temps = s.temps || [];
      var maxT = temps.reduce(function(a, t){ return Math.max(a, t.temp || 0); }, 0);
      var memUsed = (sys.memory_total || 0) - (sys.memory_free || 0) - (sys.memory_buff_cache || 0);
      var memP = pct(memUsed, sys.memory_total);
      var cpuP = s.cpu ? s.cpu.usage : null;
      var wanUp = this.wanOnline();
      var vlist = (m.vpn && m.vpn.status_list) || [];
      var vEnabled = vlist.filter(function(v){ return v.enabled; });
      var vConn = vEnabled.filter(function(v){ return v.status === 1; });
      var adgOn = !!(m.adg && m.adg.enabled);
      var cliTot = this.clientTotals();
      var L = s.live || {}, now = L.time || s.time || Math.floor(Date.now() / 1000);
      /* rec = a check that never passed on this router (2.6.7): a recommendation, not a failure */
      var secList = L.sec || [], secBad = secList.filter(function(c){ return !c.ok && !c.rec; });
      var seen = L.seen || {};
      var arrAll = this.clientsArr() || [];
      var isNew = function(c){ var ts = c && c.mac && seen[String(c.mac).toUpperCase()]; return ts > 0 && now - ts < 86400; };
      var newDevs = arrAll.filter(isNew);
      var staleTun = vEnabled.filter(function(v){ var hs = L.wg && L.wg[v.via]; return (v.type === 'wireguard' || v.type === 'openvpn') && v.status === 1 && hs && now - hs > 180; });
      var dnsBad = !!(L.dns && !L.dns.ok);

      this.set('host', esc(s.hostname || board.hostname || 'Router'));

      /* menu bar status */
      this.set('mb-vpn', m.vpn ? svg('lock') + ' ' + (vEnabled.length ? vConn.length + '/' + vEnabled.length : 'Off') : '');
      this.set('mb-wan', '<i class="dot' + (wanUp ? ' blink' : '') + '" style="background:' + (wanUp ? 'var(--mh-green)' : 'var(--mh-red)') + '"></i>' + (wanUp ? 'Online' : 'Offline'));
      this.set('mb-sys', this.sysStatusHtml());

      /* hero */
      var issues = [];
      if (!wanUp && m.cable) issues.push('the internet connection is down');
      if (vEnabled.length && vConn.length < vEnabled.length) issues.push((vEnabled.length - vConn.length) + ' VPN tunnel' + (vEnabled.length - vConn.length > 1 ? 's are' : ' is') + ' not connected');
      if (maxT >= 85) issues.push('the router is running hot');
      if (cpuP != null && cpuP >= 90) issues.push('CPU load is very high');
      if (memP >= 90) issues.push('memory is almost full');
      if (dnsBad) issues.push('the DNS server (' + L.dns.server + ') is not responding');
      if (staleTun.length) issues.push(staleTun.length + ' VPN tunnel' + (staleTun.length > 1 ? 's have' : ' has') + ' gone quiet (no recent handshake / server contact)');
      if (newDevs.length) issues.push(newDevs.length + ' new device' + (newDevs.length > 1 ? 's' : '') + ' joined today');
      if (secBad.length) issues.push(secBad.length + ' security check' + (secBad.length > 1 ? 's need' : ' needs') + ' attention');
      this.set('summary', esc((board.model || 'GL.iNet router') + ' · ' + (issues.length ? 'Heads up: ' + issues.join(', ') + '.' : 'Everything is running smoothly.')));
      var chips = [
        ['internet', wanUp ? 'var(--mh-green)' : 'var(--mh-red)', 'Internet ' + (wanUp ? 'online' : 'offline')],
        this.isAP() ? ['internet', 'var(--mh-blue)', 'Access point mode']
          : ['vpndashboard', !vEnabled.length ? 'var(--mh-text3)' : vConn.length === vEnabled.length ? 'var(--mh-green)' : 'var(--mh-orange)', 'VPN ' + (vEnabled.length ? vConn.length + ' of ' + vEnabled.length : 'off')],
        (!adgOn && m.nasAdg && m.nasAdg.configured)
          ? ['adguardhome', m.nasAdg.ok && m.nasAdg.protection ? 'var(--mh-green)' : 'var(--mh-orange)', 'AdGuard on NAS' + (m.nasAdg.ok ? (m.nasAdg.protection ? '' : ' · paused') : ' · unreachable')]
          : ['adguardhome', adgOn ? 'var(--mh-green)' : 'var(--mh-text3)', 'AdGuard ' + (m.adg ? (adgOn ? 'on' : 'disabled') : '…')],
        ['clients', 'var(--mh-blue)', cliTot.total + ' clients'],
        ['overview', maxT ? tempColor(maxT) : 'var(--mh-text3)', maxT ? tdisp(maxT) : 'Temp …'],
        ['firewallview', !secList.length ? 'var(--mh-text3)' : secBad.length ? 'var(--mh-orange)' : 'var(--mh-green)',
          !secList.length ? 'Security …' : secBad.length ? secBad.length + ' security alert' + (secBad.length > 1 ? 's' : '') : 'Security OK']
      ];
      /* Tailscale (only on routers that have it installed) */
      var ts = s.tailscale;
      /* key expiring within 14 days: the chip says so (watch.lua reads the expiry from tailscale status) */
      var tsx = m.watch && typeof m.watch.ts_expiry === 'number' ? Math.floor((m.watch.ts_expiry - Date.now() / 1000) / 86400) : null;
      if (ts && ts.enabled && tsx != null && tsx <= 14) chips.push(['tailscaleview', tsx <= 1 ? 'var(--mh-red)' : 'var(--mh-orange)', 'Tailscale key: ' + Math.max(0, tsx) + ' day' + (tsx === 1 ? '' : 's') + ' left']);
      else if (ts) chips.push(['tailscaleview', !ts.enabled ? 'var(--mh-text3)' : ts.up ? 'var(--mh-green)' : 'var(--mh-orange)',
        !ts.enabled ? 'Tailscale off' : ts.up ? 'Tailscale on' : 'Tailscale connecting']);
      var bh = this.backupHealth(m.nasB); if (bh) chips.push(['#nasbak', bh[0], bh[1]]);
      if (newDevs.length) chips.push(['clients', 'var(--mh-orange)', newDevs.length + ' new device' + (newDevs.length > 1 ? 's' : '')]);
      /* "#action" chips open a Home-tab window instead of a GL page */
      /* short labels, used only when the row still doesn't fit on one line at the smallest size */
      var shortOf = function(t){ var x;
        if ((x = /^Internet (online|offline)$/.exec(t))) return x[1] === 'online' ? 'Online' : 'Offline';
        if (t === 'Access point mode') return 'AP mode';
        if ((x = /^VPN (\d+) of (\d+)$/.exec(t))) return 'VPN ' + x[1] + '/' + x[2];
        if ((x = /^AdGuard on NAS(.*)$/.exec(t))) return 'AdGuard' + x[1];
        if (t === 'Security OK') return 'Secure';
        if ((x = /^(\d+) security alerts?$/.exec(t))) return x[1] + ' alert' + (x[1] === '1' ? '' : 's');
        if ((x = /^Tailscale (on|off|connecting)$/.exec(t))) return 'TS ' + x[1];
        if (t === 'Backups healthy') return 'Backups OK';
        if ((x = /^(\d+) new devices?$/.exec(t))) return x[1] + ' new';
        return t; };
      this.set('chips', chips.map(function(c){ return '<span class="mh-chip" ' + (c[0].charAt(0) === '#' ? 'data-act="' + c[0].slice(1) + '"' : 'data-route="' + c[0] + '"') + ' title="' + esc(c[2]) + '"><i style="background:' + c[1] + '"></i><span class="t" data-f="' + esc(c[2]) + '" data-s="' + esc(shortOf(c[2])) + '">' + esc(c[2]) + '</span></span>'; }).join(''));
      this.fitChips();

      /* system window */
      if (cpuP != null) this.gaugeSet('cpu', cpuP, loadColor(cpuP), Math.round(cpuP) + '%', (s.freq_mhz ? (s.freq_mhz / 1000).toFixed(1) + ' GHz' : ''));
      if (sys.memory_total) this.gaugeSet('mem', memP, loadColor(memP), Math.round(memP) + '%', bytes(memUsed) + ' used');
      /* zram gauge (owner, 2026-11-22): only when zram is on; % of the zram swap in use */
      var zg = this.$el.querySelector('.mh-zramg'), zr = s.live && s.live.zram;
      if (zg){
        zg.style.display = (zr && zr.size) ? '' : 'none';
        if (zr && zr.size){
          var zp = zr.used / zr.size * 100;
          this.gaugeSet('zram', Math.max(zp, 2), zp >= 85 ? 'var(--mh-red)' : zp >= 60 ? 'var(--mh-orange)' : 'var(--mh-green)', Math.round(zp) + '%', bytes(zr.used) + ' used');
          zg.title = this.zramTip(zr);
        }
      }
      if (maxT) this.gaugeSet('temp', maxT, tempColor(maxT), tdisp(maxT), 'hottest sensor');
      /* fan dial (models with a PWM fan): power %, RPM, manual / failsafe state */
      var fg = this.$el.querySelector('.mh-fang');
      if (fg){
        var hasFan = !!(s.fan && info.hardware_feature && info.hardware_feature.fan);
        fg.style.display = hasFan ? '' : 'none';
        if (hasFan){
          var rpm = (s.fan_rpm && s.fan_rpm.length) ? Math.max.apply(null, s.fan_rpm) : 0, fp = s.fan.pct || 0;
          this.gaugeSet('fan', Math.max(fp, 1), s.fan.failsafe ? 'var(--mh-red)' : s.fan.mode === 'manual' ? 'var(--mh-purple)' : '#30b0c7',
            fp > 0 ? fp + '%' : 'Off', (rpm > 0 ? Math.round(rpm).toLocaleString() + ' RPM' : s.fan.mode === 'manual' ? 'manual' : 'auto') + (s.fan.failsafe ? ' · failsafe' : ''));
        }
      }
      if (s.conntrack && s.conntrack.count != null){
        var cp = pct(s.conntrack.count, s.conntrack.max);
        this.gaugeSet('conn', Math.max(cp, 2), 'var(--mh-blue)', String(s.conntrack.count), 'of ' + s.conntrack.max);
      }
      /* DHCP pool: only when this router hands out addresses (not in AP mode / DHCP off) */
      var dg = this.$el.querySelector('.mh-dhcpg'), dh = s.dhcp;
      if (dg){
        dg.style.display = dh ? '' : 'none';
        if (dh){
          var dp = dh.size ? dh.used / dh.size * 100 : 0;
          this.gaugeSet('dhcp', Math.max(dp, 2), loadColor(dp), String(dh.used), 'of ' + dh.size);
          dg.title = 'DHCP pool ' + dh.first + ' – ' + dh.last + ': ' + dh.used + ' in use, ' + (dh.size - dh.used) + ' free';
        }
      }
      var cores = (s.cpu && s.cpu.cores) || [];
      var la = sys.load_average || [];
      var flashUsed = (sys.flash_total || 0) - (sys.flash_free || 0);
      var html = '';
      if (cores.length){
        html += '<div class="mh-sec">CPU cores</div><div class="mh-cores">' + cores.map(function(c, i){
          return '<div><small><span>Core ' + (i + 1) + '</span><span>' + Math.round(c) + '%</span></small><div class="mh-bar"><i style="width:' + Math.max(c, 1) + '%;background:' + loadColor(c) + '"></i></div></div>';
        }).join('') + '</div>';
      }
      html += '<div class="mh-sec">About this router</div><div class="mh-kv">' +
        kv('Model', board.model || info.model) + kv('Firmware', info.firmware_version ? info.firmware_version + ' (' + (info.firmware_type || '') + ')' : null) +
        kv('Uptime', sys.uptime ? dur(sys.uptime) : null) + kv('Load average', la.length ? la.map(function(x){ return Number(x).toFixed(2); }).join('  ') : null) +
        kv('Processor', info.cpu_num ? info.cpu_num + '-core ARM' + (s.max_freq_mhz ? ' @ ' + (s.max_freq_mhz / 1000).toFixed(1) + ' GHz' : '') : null) +
        kv('Kernel', board.kernel_version) + kv('LAN IP', sys.lan_ip) + kv('Storage', sys.flash_total ? bytes(flashUsed) + ' of ' + bytes(sys.flash_total) : null) +
        kv('Memory', sys.memory_total ? bytes(memUsed) + ' of ' + bytes(sys.memory_total) : null) + kv('MAC', this.pv('sysmac', info.mac, 'mac'), true) +
        kv('Fan', this.fanText()) + kv('Thermal throttling', this.throttleText()) +
        /* row 5: hardware NAT, latest bufferbloat grade, last NAS backup */
        kv('HW acceleration', m.accel && m.accel.supported ? '<span title="MediaTek hardware NAT offloads regular (non-VPN) traffic so 2 Gbps doesn’t load the CPU. VPN traffic is always encrypted by the CPU.">' +
          (m.accel.enabled ? 'On · ' + m.accel.bound + ' flow' + (m.accel.bound === 1 ? '' : 's') : 'Off') + '</span>' : 'Not available', true) +
        kv('Bufferbloat', this.bloatText(), true) +
        kv('NAS backup', m.nasB ? (m.nasB.configured ? (m.nasB.last_ok ? ago(Math.floor(Date.now() / 1000) - m.nasB.last_ok) : (m.nasB.last ? '<span style="color:var(--mh-orange)">Failed</span>' : 'None yet')) : '<a href="#" data-act="nasbak" style="color:var(--mh-blue)">Set up</a>') : '…', true) +
        kv('Recent events', this.evtLine(), true) +
        '</div>';
      this.set('sysinfo', html);

      /* internet window */
      var cb = m.cable || {}, v4 = cb.ipv4 || {};
      var w = this.wanIf(), wn = s.net && s.net[w];
      var rd = rate(m.rateDown), ru = rate(m.rateUp);
      this.set('net',
        '<div class="mh-big"><div class="mh-ico" style="background:' + GRAD.blue + '">' + svg('globe') + '</div><div><h3>' + (wanUp ? 'Connected' : 'Not connected') + '</h3>' +
        '<p><span class="mh-pill ' + (wanUp ? 'ok' : 'bad') + '">' + (wanUp ? 'Online' : 'Offline') + '</span> &nbsp;' + esc((cb.protocol || '').toUpperCase()) + (wn && wn.speed > 0 ? ' · ' + (wn.speed >= 1000 ? (wn.speed / 1000) + ' Gbps' : wn.speed + ' Mbps') + ' link' : '') + '</p></div></div>' +
        '<div class="mh-tp"><div><small>' + svg('down').replace('<svg', '<svg style="width:12px;height:12px;stroke:var(--mh-blue);fill:none;stroke-width:2.4"') + 'Download</small><b>' + rd[0] + ' <small style="display:inline;font-size:12px">' + rd[1] + '</small></b>' + spark(m.down, '#0a84ff', 'mhgd') + '</div>' +
        '<div><small>' + svg('upa').replace('<svg', '<svg style="width:12px;height:12px;stroke:var(--mh-purple);fill:none;stroke-width:2.4"') + 'Upload</small><b>' + ru[0] + ' <small style="display:inline;font-size:12px">' + ru[1] + '</small></b>' + spark(m.up, '#bf5af2', 'mhgu') + '</div></div>' +
        /* owner (2026-11-15): pairs side by side: Uplink | Public IP, Gateway | Secondary WAN, WAN DNS | LAN DNS,
           Received | Sent, Cable modem signal | Modem uptime. kvRow() starts a new grid row so a missing item never shifts a pair. */
        '<div class="mh-kv">' + kv('Uplink', this.uplinkText()) + kv('Public IP', this.pv('wanip', v4.ip, 'ip'), true) +
        kvRow(kv('Gateway', this.pv('gateway', v4.gateway, 'ip'), true)) + (cb.secondwan ? kv('Secondary WAN', cb.secondwan.status === 1 ? 'Connected' : 'Not in use') : '') +
        kvRow(kv('WAN DNS', m.priv ? 'Hidden' : (v4.dns || []).join(', '))) +
          /* LAN DNS: what devices are told to use (DHCP option 6, else the router itself); AP mode: the main router decides */
          kv('LAN DNS', m.priv ? 'Hidden' : (this.isAP() && !(m.stats && m.stats.lan_dns && m.stats.lan_dns.length) ? 'From main router' : this.clientDns())) +
        kvRow(kv('Received', wn ? bytes(wn.rx) : null)) + kv('Sent', wn ? bytes(wn.tx) : null) +
        kvRow(kv('Cable modem signal', this.modemText(), true)) + kv('Modem uptime', this.modemUptime()) + '</div>' + this.wanPingHtml());

      /* Wi-Fi uplink window (travel routers / repeater in use); takes the VPN card's spot (layKeys) */
      var uOn = this.uplOn();
      if (uOn !== !!m.uplOn){ m.uplOn = uOn; try { this.layApply(); } catch (e) {} }
      /* travel cards (This Network, Networks You've Used) only once the router reports travel data */
      var tOn = uOn && !!(m.trv && m.trv.active);
      this.$el.querySelectorAll('.mh-win.uplw').forEach(function(w){ var k = w.getAttribute('data-card'); w.classList.toggle('on', k === 'upl' ? uOn : tOn); });
      if (uOn) this.set('upl', this.uplHtml());
      if (tOn){ this.set('trv', this.trvHtml()); this.set('nets', this.netsHtml()); }

      /* vpn window */
      var tunMap = {};
      ((m.tun && m.tun.tunnels) || []).forEach(function(t){ tunMap[t.tunnel_id] = t; });
      var vh = '<div class="mh-big"><div class="mh-ico" style="background:' + GRAD.purple + '">' + svg('lock') + '</div><div><h3>' +
        (!m.vpn ? 'Checking…' : vEnabled.length ? (vConn.length === vEnabled.length ? 'Protected' : vConn.length ? 'Partially connected' : 'Not connected') : 'VPN is off') + '</h3><p>' +
        (vEnabled.length ? vConn.length + ' of ' + vEnabled.length + ' tunnels connected' : 'No active tunnels') + '</p></div></div>';
      if (vlist.length){
        /* each tunnel: live status (left/right) + its 7-day reliability line (merged VPN Reliability card) */
        var RR = this.relRows(), used = {}, self2 = this;
        var relFor = function(v){
          var hit = null;
          RR.rows.forEach(function(r){ if (!hit && r.active && v.peer_name && r.peer === v.peer_name) hit = r; });
          if (!hit) RR.rows.forEach(function(r){ if (!hit && r.active && r.label && v.name && r.label.indexOf(v.name + ' ') === 0) hit = r; });
          if (hit) used[hit.k] = 1;
          return hit;
        };
        vh += '<div class="mh-rows">' + vlist.map(function(v){
          var t = tunMap[v.tunnel_id] || {}, r = relFor(v);
          var hs = L.wg && L.wg[v.via], stale = v.enabled && v.status === 1 && hs && now - hs > 180;
          var col = !v.enabled ? 'var(--mh-text3)' : stale ? 'var(--mh-orange)' : v.status === 1 ? 'var(--mh-green)' : v.status === 2 ? 'var(--mh-orange)' : 'var(--mh-red)';
          var lbl = !v.enabled ? 'Disabled' : stale ? 'Stale' : v.status === 1 ? 'Connected' : v.status === 2 ? 'Connecting' : 'Disconnected';
          return '<div class="mh-r click" data-act="vpnsrv" data-arg="' + esc(v.tunnel_id) + '" title="Click to change this tunnel’s server"><i class="d" style="background:' + col + '"></i><div class="m"><b>' + esc(v.name) +
            (r && r.k === RR.best ? ' <span class="mh-new" style="background:var(--mh-green)" title="Best uptime, loss and ping over 7 days">MOST RELIABLE</span>' : '') + '</b><small>' +
            esc((v.type === 'wireguard' ? 'WireGuard' : v.type === 'openvpn' ? 'OpenVPN' : v.type || '') + ' · ' + (m.priv ? 'server hidden' : (v.peer_name || '') + (v.ipv4 ? ' · ' + v.ipv4 : ''))) + '</small>' +
            (v.enabled ? '<small class="rl">' + self2.relLine(r) + '</small>' : '') + '</div>' +
            '<div class="x"><span' + (stale ? ' style="color:var(--mh-orange)"' : '') + (hs ? ' title="' + (v.type === 'openvpn' ? 'Last data from the OpenVPN server' : 'Last WireGuard handshake') + '"' : '') + '>' + lbl + (hs ? ' · ' + ago(now - hs) : '') + '</span>' +
            (t.killswitch ? ' · <span title="Kill switch on">🛡</span>' : '') + '<br>↓ ' + bytes(v.rx_bytes) + '  ↑ ' + bytes(v.tx_bytes) + '</div>' +
            /* on/off switch (owner, 2026-11-15): same confirm as the Control Center */
            (t.tunnel_id != null ? '<button class="mh-sw' + (t.enabled ? ' on' : '') + '" data-act="vpn" data-arg="' + esc(t.tunnel_id) + '" title="Turn ' + esc(v.name) + (t.enabled ? ' off' : ' on') + '" aria-label="Turn ' + esc(v.name) + (t.enabled ? ' off' : ' on') + '"></button>' : '') + '</div>';
        }).join('') + '</div>';
        /* servers / providers used earlier this week (not on a tunnel now) */
        var past = RR.rows.filter(function(r){ return !used[r.k] && r.uptime != null; });
        if (past.length) vh += '<details class="mh-vpast"><summary>Past servers this week (' + past.length + ')</summary>' + past.map(function(r){
          return '<div><b>' + esc(m.priv ? (r.provider || 'Server') : (r.label + (r.peer ? ' · ' + r.peer : ''))) + '<button class="mh-x" data-act="relrm" data-arg="' + esc(r.k) + '" title="Remove this server from the 7-day history">×</button></b><small>' + self2.relLine(r) + '</small></div>'; }).join('') +
          '<div><a href="#" data-act="vpnforget" style="color:var(--mh-blue);font-size:11px">Forget removed VPNs…</a></div></details>';
        vh += '<div class="mh-stn">7 days: uptime = share of 10-second checks the tunnel answered (Cloudflare or Quad9). Day 8 AM–7 PM, evening 7 PM–midnight. Nightly ↓ from the 3 AM speed test.</div>';
      } else if (m.vpn) {
        vh += '<button class="mh-btn" data-route="vpndashboard">Set up VPN</button>';
      }
      if (this.isAP()) vh = this.apHtml(cliTot);
      this.set('vpn', vh);
      /* AP mode: the VPN window becomes "Access Point"; 7-day VPN reliability is hidden */
      var vw = this.q('vpn') && this.q('vpn').closest('.mh-win');
      if (vw){ var ap = this.isAP(), tt = vw.querySelector('.mh-tb .t'), ob = vw.querySelector('.mh-tb .o');
        if (tt) tt.textContent = ap ? 'Access Point' : 'VPN'; if (ob) ob.setAttribute('data-route', ap ? 'internet' : 'vpndashboard'); }
      /* VPN Health window (2026-11-15): router mode with at least one WireGuard or OpenVPN (2026-11-17) tunnel on */
      var vhw = this.$el.querySelector('.mh-win.vhw'), vhOn = !this.isAP() && vEnabled.some(function(v){ return /^(wgclient|ovpnclient)\d+$/.test(v.via || ''); });
      if (vhw) vhw.classList.toggle('on', vhOn);
      if (vhOn) this.set('vhl', this.vhHtml(vlist, L, now));

      /* adguard window */
      var lanIp = sys.lan_ip || location.hostname;
      var na = m.nasAdg;
      if (na && na.configured && !adgOn){ this.set('adg', this.nasAdgHtml(na)); }
      else this.set('adg',
        '<div class="mh-big"><div class="mh-ico" style="background:' + (adgOn ? GRAD.teal : GRAD.gray) + '">' + svg('shield') + '</div><div><h3>' +
        (!m.adg ? 'Checking…' : adgOn ? 'Protection on' : 'Disabled') + '</h3><p>' +
        (!m.adg ? '' : adgOn ? 'Blocking ads & trackers network-wide' : esc('Using System DNS ' + (this.clientDns() || '…'))) + '</p></div></div>' +
        '<div class="mh-kv">' + kv('Service', m.adg ? '<span class="mh-pill ' + (adgOn ? 'ok' : 'off') + '">' + (adgOn ? 'Running' : 'Disabled') + '</span>' : null, true) +
        (adgOn ? kv('Handles LAN DNS', '<span class="mh-pill ' + (m.adg.dns_enabled ? 'ok' : 'off') + '">' + (m.adg.dns_enabled ? 'Yes' : 'No') + '</span>', true)
               : kv('DNS server', this.clientDns()) + (s.lan_dns && s.lan_dns.length ? kv('Assigned via', 'DHCP to all clients') + kv('Router upstream', this.dnsText()) : '')) + '</div>' +
        (adgOn ? '<button class="mh-btn" data-route="adguardhome">AdGuard settings</button><a class="mh-btn sec" href="http://' + esc(lanIp) + ':3000" target="_blank" rel="noopener">Open dashboard ↗</a>'
               : '<button class="mh-btn" data-act="nasadg">Connect AdGuard on my NAS</button><button class="mh-btn sec" data-route="adguardhome">Router AdGuard</button>'));

      /* clients window */
      var arr = this.clientsArr();
      var ch = '<div class="mh-cstat"><b>' + cliTot.total + '</b><span>clients</span><div class="p"><span class="mh-pill off">' + cliTot.wired + ' wired</span><span class="mh-pill off">' + cliTot.wireless + ' wireless</span></div></div>';
      if (arr && arr.length){
        /* paused (blocked) devices stay listed even if they drop offline, so they can be resumed here */
        var online = arr.filter(function(c){ return c.online === true || c.online === 1 || c.online === '1' || c.blocked; });
        online.sort(function(a, b){ return (isNew(b) - isNew(a)) || ((Number(b.rx) || Number(b.total_rx) || 0) - (Number(a.rx) || Number(a.total_rx) || 0)); });
        m.devMap = {};
        var canPause = m.bwl && m.bwl.mode === 'black';
        ch +='<div class="mh-sec">Online now · ' + online.length + (online.length > 3 ? ' <span style="text-transform:none;letter-spacing:0;font-weight:500">· scroll for more</span>' : '') + '</div><div class="mh-rows mh-scroll">' + online.map(function(c){
          var nm = m.priv ? 'Device ' + (Object.keys(m.devMap).length + 1) : (c.alias || c.name || c.hostname || c.mac || 'Unknown device');
          var tx = (c.rx != null || c.tx != null) ? '↓ ' + rate(c.rx)[0] + ' ' + rate(c.rx)[1] + '<br>↑ ' + rate(c.tx)[0] + ' ' + rate(c.tx)[1] : '';
          var key = c.mac ? this.anonKey(c.mac) : null;
          var mac = key ? this.pv(key, c.mac, 'mac') : '';
          if (key) m.devMap[key] = c;
          return '<div class="mh-r' + (key ? ' click" data-act="dev" data-arg="' + key : '') + '" title="Device details"><i class="d" style="background:' + (c.blocked ? 'var(--mh-red)' : 'var(--mh-green)') + '"></i><div class="m"><b>' + esc(nm) +
            (isNew(c) ? '<span class="mh-new">NEW</span>' : '') + (c.blocked ? '<span class="mh-new" style="background:var(--mh-red)">PAUSED</span>' : '') + '</b><small>' + esc(m.priv ? 'IP hidden' : (c.ip || '')) + (c.ip && mac ? ' · ' : '') + mac + '</small></div><div class="x">' + tx + '</div>' +
            (key && canPause ? '<button class="mh-pz' + (c.blocked ? ' on' : '') + '" data-act="pause" data-arg="' + key + '" title="' + (c.blocked ? 'Resume internet' : 'Pause internet') + '" aria-label="' + (c.blocked ? 'Resume internet' : 'Pause internet') + '">' +
              (c.blocked ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>') + '</button>' : '') + '</div>';
        }, this).join('') + '</div>';
      }
      this.set('cli', ch);

      /* sensors */
      var sh = temps.length ? '<div class="mh-rows">' + temps.map(function(t){
        return '<div class="mh-r" style="flex-wrap:wrap"><div class="m" style="display:flex;justify-content:space-between;align-items:center;width:100%"><b>' + esc(SENSOR_NAMES[t.name] || t.name) + '</b><span style="font-weight:600;font-variant-numeric:tabular-nums;color:' + tempColor(t.temp) + '">' + tdisp(t.temp) + '</span></div>' +
          '<div class="mh-bar" style="width:100%;margin-top:6px"><i style="width:' + Math.min(100, t.temp) + '%;background:' + tempColor(t.temp) + '"></i></div></div>';
      }).join('') + '</div>' : '<div class="mh-empty">Waiting for sensor data…</div>';
      if (info.hardware_feature && info.hardware_feature.fan === false) sh += '<div class="mh-empty" style="margin-top:8px;font-size:11px">Passively cooled (no fan). Brume 3 normally runs warm; sustained readings above ' + tdispF(185) + ' are worth a look.</div>';
      this.set('sen', sh);

      /* services */
      var svcs = (st.service || []).map(function(x){ return [SVC_NAMES[x.name] || x.name, x.status === 1 || x.status === true]; });
      FEAT.forEach(function(f){ if (f[0] in sys) svcs.push([f[1], !!sys[f[0]]]); });
      this.set('svc', svcs.length ? '<div class="mh-svc mh-scroll">' + svcs.map(function(x){
        return '<div><i style="background:' + (x[1] ? 'var(--mh-green)' : 'var(--mh-track)') + '"></i><span>' + esc(x[0]) + '</span></div>';
      }).join('') + '</div>' : '<div class="mh-empty">Loading…</div>');

      this.set('hlt', this.healthHtml(L, vlist));
      this.set('sec', this.secHtml(secList, secBad));
      this.set('fwb', '');   /* firmware notice now lives in the alert banner */
      this.set('wx', this.wxHtml());
      this.paintWeather();
      var pb = this.q('privb'); if (pb) pb.classList.toggle('on', !!m.priv);
      this.$el.classList.toggle('mh-privon', !!m.priv);
      if (m.usage) this.set('use', this.useHtml());
      /* MediaTek models report wifi_type; Qualcomm ones (Flint 3) leave it empty but list radios */
      var hfw = info.hardware_feature || {}, ww = this.$el.querySelector('.mh-win.wifiw'), hasWifi = !!(hfw.wifi_type || hfw.radio);
      if (ww) ww.style.display = hasWifi ? '' : 'none';
      if (hasWifi) this.set('wif', this.wifiHtml());
      this.set('his', this.histHtml());
      if (m.ccOpen) this.set('cc', this.ccHtml());
      if (m.st) this.set('spd', this.spdHtml());
    },

    /* ---------- new cards ---------- */
    healthHtml: function(L, vlist){
      if (!L || !L.ping) return '<div class="mh-empty">Starting the health monitor… first results in about 10 seconds.</div>';
      var ph = L.ph || {}, priv = this.mh.priv;
      var clean = function(a){ return (a || []).map(function(v){ return v < 0 ? 0 : v; }); };
      var vp = null, vkey = null, vname = 'VPN';
      vlist.forEach(function(v){ if (!vp && v.enabled && v.status === 1 && L.ping[v.via]){ vp = L.ping[v.via]; vkey = v.via; vname = v.name; } });
      var pl = L.pl || {};
      var loss10 = function(k){ var a = pl[k]; if (!a || !a.length) return null; var s = 0; a.forEach(function(x){ s += x; }); return s / a.length; };
      var lfmt = function(v){ return v == null ? 'n/a' : (v === 0 ? '0' : v < 10 ? v.toFixed(1) : Math.round(v)) + '%'; };
      var tile = function(title, p, key, color, id, extra){
        var ok = p && p.ms != null && p.loss < 100, l10 = loss10(key);
        return '<div><small>' + esc(title) + '</small><b class="sm">' + (ok ? p.ms + ' <small style="display:inline;font-size:12px">ms</small>' : '<span style="color:var(--mh-red)">No reply</span>') + '</b>' +
          '<small style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="Packet loss now / average over the last 10 minutes">Loss <span style="color:' + lossColor(p ? p.loss : null) + '">' + (p ? p.loss + '%' : 'n/a') + '</span> · 10 min <span style="color:' + lossColor(l10) + '">' + lfmt(l10) + '</span></small>' + (extra || '') + spark(clean(ph[key]), color, id) + '</div>';
      };
      /* WAN health (owner, 2026-11-17): verdict, path, modem mode on top; jitter + spikes on the Direct tile; more below */
      var WH = L.wh && typeof L.wh === 'object' ? L.wh : null;
      var wx = WH ? '<small style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="Jitter = average change between checks (10 min). Spikes = checks over your ' + WH.limit + ' ms high-ping limit (last hour).">Jitter ' +
        (WH.jitter != null ? '<span style="color:' + (WH.jitter >= 30 ? 'var(--mh-orange)' : 'inherit') + '">' + Math.round(WH.jitter) + ' ms</span>' : '—') + ' · <span style="color:' + (WH.spk >= 5 ? (WH.spk >= 25 ? 'var(--mh-red)' : 'var(--mh-orange)') : 'inherit') + '">' + Math.round(WH.spk || 0) + '% spikes</span></small>' : '';
      var h = (WH ? this.whTop(WH) : '') + '<div class="mh-tp">' + tile('Direct (ISP)', L.ping.wan, 'wan', '#30b0c7', 'mhlw', wx) + (vp ? tile('VPN (via ' + vname + ')', vp, vkey, '#bf5af2', 'mhlv') : '') + '</div>' +
        (WH ? this.whMore(WH) : '');
      var d = L.dns || {}, dh = L.dh || [];
      var dnsUp = dh.length ? Math.round(dh.filter(function(x){ return x >= 0; }).length * 100 / dh.length) : null;
      h += '<div class="mh-rows">' +
        '<div class="mh-r mh-hrow"><i class="d" style="background:' + (d.ok ? 'var(--mh-green)' : 'var(--mh-red)') + '"></i><div class="m"><b>DNS server</b><small>' + esc(d.server || '') + ' · ' + esc(d.ok ? 'answering' : (d.status || 'no reply')) + '</small></div>' +
        '<div class="x"><b>' + (d.ok ? (d.ms != null ? (d.ms < 1 ? '<1' : d.ms) + ' ms' : 'OK') : 'Failing') + '</b>' + (dnsUp != null ? dnsUp + '% up · 10 min' : '') + '</div></div>';
      /* per-tunnel grade (owner's pick 7, 2026-11-18): same rules as the internet verdict, over the last 10 minutes */
      var tgrade = function(via){
        var a = (ph[via] || []).filter(function(x){ return x >= 0; }); if (a.length < 12) return null;
        var srt = a.slice().sort(function(x, y){ return x - y; }), med = srt[Math.floor(srt.length / 2)], lim = (WH && WH.limit) || 75;
        var spk = a.filter(function(x){ return x > lim; }).length / a.length, los = loss10(via) || 0, jd = 0;
        for (var i = 1; i < a.length; i++) jd += Math.abs(a[i] - a[i - 1]);
        var jit = jd / Math.max(1, a.length - 1);
        return (med > lim || spk >= 0.25 || los >= 2 || jit >= 60) ? 'Poor' : (med > lim * 0.6 || spk >= 0.05 || los >= 0.5 || jit >= 30) ? 'Fair' : 'Good';
      };
      vlist.forEach(function(v){
        var p = L.ping[v.via];
        if (!v.enabled || !p) return;
        var l10 = loss10(v.via), worst = Math.max(p.loss || 0, l10 || 0), tg = tgrade(v.via);
        h += '<div class="mh-r mh-hrow"><i class="d" style="background:' + (p.loss >= 100 ? 'var(--mh-red)' : lossColor(worst)) + '"></i><div class="m"><b>' + esc(v.name) +
          (tg ? ' <span class="mh-tg ' + tg.toLowerCase() + '" title="Last 10 minutes: ping, spikes, loss and jitter">' + tg + '</span>' : '') + '</b><small>' + esc((priv ? 'Server hidden' : (v.peer_name || 'VPN')) + ' · latency') + '</small></div>' +
          '<div class="x"><b>' + (p.ms != null && p.loss < 100 ? p.ms + ' ms' : 'No reply') + '</b><span style="color:' + lossColor(l10) + '">' + lfmt(l10) + ' loss · 10 min</span></div></div>';
      });
      return h + '</div>';
    },
    /* ---------- Network Health: WAN health (owner, 2026-11-17 evening; data = sampler live.wh) ---------- */
    whTop: function(W){
      var m = this.mh, isAP = this.isAP();
      var GC = { good: ['Good', 'var(--mh-green)'], fair: ['Fair', 'var(--mh-orange)'], poor: ['Poor', 'var(--mh-red)'] };
      var g = GC[W.grade] || ['Checking…', 'var(--mh-text3)'];
      var why = (W.why || []).join(' · ');
      var h = '<div class="mh-whg"><span class="pill" style="background:' + g[1] + '">' + (W.grade ? 'Internet: ' + g[0] : 'Internet: checking…') + '</span>' +
        '<span class="why">' + (W.grade ? (why ? esc(why) : 'steady ping, no lag spikes, nothing lost') + ' · last hour' : 'needs ~5 minutes of checks') + '</span></div>';
      /* where is the problem: this router -> modem (or main router) -> the internet beyond it */
      var hp = W.hop;
      if (hp && typeof hp === 'object'){
        var mOk = hp.modem_ms != null && hp.modem_loss < 50, mWarn = mOk && (hp.modem_ms > 20 || hp.modem_loss > 5);
        var nBad = hp.net_ms == null || hp.net_loss >= 50 || W.grade === 'poor', nWarn = !nBad && W.grade === 'fair';
        var st = function(ok, warn){ return ok ? (warn ? ['!', 'var(--mh-orange)'] : ['✓', 'var(--mh-green)']) : ['✗', 'var(--mh-red)']; };
        var s1 = st(mOk, mWarn), s2 = st(!nBad, nWarn);
        var hopName = isAP ? 'Main router' : 'Modem';
        var step = function(icon, name, val, s){ return '<div class="st"><i style="color:' + s[1] + '">' + s[0] + '</i><b>' + name + '</b><small>' + val + '</small></div>'; };
        h += '<div class="mh-chain">' + step('', 'Router', 'this one', ['✓', 'var(--mh-green)']) + '<span class="ar">→</span>' +
          step('', hopName, hp.modem_ms != null ? Math.round(hp.modem_ms * 10) / 10 + ' ms' : 'no answer', s1) + '<span class="ar">→</span>' +
          step('', 'Internet', hp.net_ms != null ? Math.round(hp.net_ms) + ' ms' + (W.spk >= 5 ? ' · spiky' : '') : 'no answer', s2) + '</div>';
        var verdict = !mOk ? 'The ' + hopName.toLowerCase() + ' isn’t answering: check that it’s powered on and the cable to it.' :
          nBad ? 'The ' + hopName.toLowerCase() + ' answers fine, so the trouble is past it: ' + (isAP ? 'on the main router’s internet connection.' : 'your ISP’s side (line or network). Restart the modem; if it stays bad, call your ISP.') :
          nWarn ? 'A bit shaky past the ' + hopName.toLowerCase() + ' (your ISP’s side). Your own network is fine.' : '';
        if (verdict) h += '<div class="mh-whv">' + verdict + '</div>';
      }
      /* modem in router mode (double NAT) / carrier-grade NAT: only meaningful on a main router */
      if (!isAP && W.nat === 'private') h += '<div class="mh-whw"><b>Your modem is in router mode (double NAT).</b> This router gets a private address from it' + (m.priv ? '' : ' (' + esc(W.wanip || '') + ')') +
        ' instead of a public one, so two routers are in a row. Turn bridge mode back on in your modem’s app or settings page; this router reconnects by itself.</div>';
      else if (!isAP && W.nat === 'cgnat') h += '<div class="mh-whw" style="border-color:var(--mh-blue)"><b>Your ISP uses carrier-grade NAT.</b> Your internet address is shared with other customers (100.64.x.x). Normal for some ISPs; incoming connections (port forwarding) won’t work.</div>';
      return h;
    },
    whMore: function(W){
      var self = this, isAP = this.isAP(), now = Math.floor(Date.now() / 1000);
      var h = '';
      /* what it's good for right now */
      if (W.uses && typeof W.uses === 'object'){
        var U = { ok: ['✓', 'var(--mh-green)', 'good'], warn: ['!', 'var(--mh-orange)', 'so-so'], bad: ['✗', 'var(--mh-red)', 'poor'] };
        var chip = function(k, label, tip){ var u = U[W.uses[k]] || U.ok; return '<span title="' + label + ': ' + u[2] + ' (' + tip + ')"><i style="color:' + u[1] + '">' + u[0] + '</i>' + label + '</span>'; };
        h += '<div class="mh-uses"><small>Good for, last hour:</small>' + chip('browse', 'Browsing', 'needs a working line') + chip('calls', 'Video calls', 'needs low jitter, few spikes') + chip('gaming', 'Gaming', 'needs low ping, no spikes') + '</div>';
      }
      /* spikes / jitter / no-answer line */
      h += '<div class="mh-whs">Lag spikes over ' + W.limit + ' ms: <b style="color:' + (W.spk >= 25 ? 'var(--mh-red)' : W.spk >= 5 ? 'var(--mh-orange)' : 'inherit') + '">' + (W.spikes || 0) + '</b> in the last hour' +
        (W.checks ? ' (' + (W.spk || 0) + '% of checks)' : '') + ' · jitter ' + (W.jitter != null ? Math.round(W.jitter) + ' ms' : '—') + ' · no answer ' + (W.loss || 0) + '%</div>';
      /* uptime + last outage */
      var lo = W.last_out && typeof W.last_out === 'object' ? W.last_out : null;
      var dur2 = function(s){ s = Math.max(0, Math.round(s)); return s < 90 ? s + ' s' : s < 5400 ? Math.round(s / 60) + ' min' : (s / 3600).toFixed(1) + ' h'; };
      /* likely cause of the last outage (netplus: did the modem keep answering?) */
      var NPx = (this.mh.stats && this.mh.stats.live && this.mh.stats.live.x && this.mh.stats.live.x.np) || {}, lc = NPx.last_cause;
      var CAUSE = { isp: 'your ISP’s side: the modem stayed up', home: 'the modem or its cable: the modem didn’t answer either', mixed: 'the modem or the line was unstable' };
      var causeTxt = (lo && lc && typeof lc === 'object' && Math.abs((lc.e || 0) - (lo.e || 0)) < 300 && CAUSE[lc.cause]) ? ' · likely ' + CAUSE[lc.cause] : '';
      h += '<div class="mh-whs">' + (W.down_now ? '<b style="color:var(--mh-red)">Down right now</b> since ' + hhmm(W.down_now) + ' · ' : '') +
        'Online <b>' + W.up_today + '%</b> today · ' + W.up_7d + '% over 7 days' +
        (lo ? ' · last outage ' + (new Date(lo.s * 1000).toDateString() === new Date().toDateString() ? '' : new Date(lo.s * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ') + hhmm(lo.s) + '–' + hhmm(lo.e) + ' (' + dur2(lo.e - lo.s) + ')' + causeTxt : ' · no outages logged') + '</div>';
      /* 24 h quality strip: one block per hour */
      if (Array.isArray(W.strip)){
        var SC = { good: 'var(--mh-green)', fair: 'var(--mh-orange)', poor: 'var(--mh-red)' }, GN = { good: 'Good', fair: 'Fair', poor: 'Poor' };
        var cells = W.strip.map(function(x, i){
          var t = (W.strip_start || now - 23 * 3600) + i * 3600;
          if (!x || typeof x !== 'object') return '<i style="background:var(--mh-track)" title="' + hhmm(t) + ': no data"></i>';
          return '<i style="background:' + (SC[x.g] || 'var(--mh-track)') + '" title="' + hhmm(t) + '–' + hhmm(t + 3600) + ': ' + (GN[x.g] || '') + ' · ' + (x.ms != null ? Math.round(x.ms) + ' ms' : '—') + ' · ' + x.spk + '% spikes"></i>';
        }).join('');
        h += '<div class="mh-strip"><div class="bar">' + cells + '</div><div class="ax"><span>' + hhmm(W.strip_start || now - 23 * 3600) + '</span><span>24 h · hover an hour</span><span>now</span></div></div>';
      }
      /* cable modem signal (when the modem reader is set up) */
      var mt = this.modemText && this.modemText(true);
      if (mt && !isAP) h += '<div class="mh-whs">Cable modem signal: <a href="#" data-act="modem" style="color:inherit">' + esc(mt) + '</a></div>';
      return h + this.npRows();
    },
    /* Network Health extra rows (owner's picks 1-5, 2026-11-18; data = live.x.np from netplus.lua + conntrack) */
    npRows: function(){
      var m = this.mh, s = m.stats || {}, L = s.live || {}, NP = (L.x && L.x.np) || {};
      var G = 'var(--mh-green)', O = 'var(--mh-orange)', R = 'var(--mh-red)', N0 = 'var(--mh-text3)';
      var mb = function(v){ v = Number(v) || 0; return v >= 1000 ? (v / 1000).toFixed(2) + ' Gbps' : (v < 10 ? v.toFixed(1) : Math.round(v)) + ' Mbps'; };
      var ms = function(v){ return v == null ? '—' : v < 1 ? '<1 ms' : (v < 10 ? Number(v).toFixed(1) : Math.round(v)) + ' ms'; };
      var row = function(col, title, txt, right){ return '<div class="mh-npr"><i style="background:' + col + '"></i><b>' + title + '</b><span>' + txt + '</span>' + (right ? '<em>' + right + '</em>' : '') + '</div>'; };
      var h = '';
      /* 3. busiest device right now */
      var tp = NP.top;
      if (tp && typeof tp === 'object') h += tp.quiet ? row(G, 'Busiest device', 'The line is quiet right now (↓ ' + mb(tp.wan_down) + ' · ↑ ' + mb(tp.wan_up) + ')')
        : row(tp.share >= 80 ? O : G, 'Busiest device', esc(m.priv ? 'A device' : (tp.name || tp.ip || 'A device')) + ' · ↓ ' + mb(tp.down) + ' ↑ ' + mb(tp.up), tp.share + '% of traffic');
      /* 2. DNS at a glance */
      var dn = NP.dns, ad = NP.adg, pr = NP.probe;
      if (dn && typeof dn === 'object' && dn.now != null){
        var slow = (pr && pr.slow) || (dn.usual != null && dn.now > Math.max(dn.usual * 2, dn.usual + 20));
        var dtx = (ad ? 'AdGuard ' : '') + 'answers in ' + ms(dn.now) + (dn.usual != null ? ' (usual ' + ms(dn.usual) + ')' : '') + (pr && pr.adg != null ? ' · new names ' + pr.adg + ' ms' : '');
        h += row(slow ? O : G, 'DNS', esc(dtx) + (slow ? ' · <span style="color:var(--mh-orange)">slower than usual</span>' : ''), ad && ad.pct != null ? ad.pct + '% blocked' : '');
      }
      /* 4. ping under load (live bufferbloat) */
      var bl = NP.bloat;
      if (bl && typeof bl === 'object')
        h += bl.add != null && bl.n >= 6 ? row(/^A|^B/.test(bl.grade || '') ? G : bl.grade === 'C' ? O : R, 'Ping under load', '+' + Math.round(bl.add) + ' ms when the line is busy (idle ' + ms(bl.idle) + ') · ' + bl.n + ' busy moments in 24 h', 'Grade ' + esc(bl.grade))
          : row(N0, 'Ping under load', 'Not measured yet: needs some heavy use, like a big download or a speed test');
      /* 5. connection table */
      var ct = s.conntrack;
      if (ct && ct.max){ var cp = Math.round(ct.count * 100 / ct.max); h += row(cp >= 80 ? R : cp >= 60 ? O : G, 'Connections', Number(ct.count).toLocaleString() + ' of ' + Number(ct.max).toLocaleString() + ' the router can track', cp + '% full'); }
      /* 1. IPv6 */
      var v6 = NP.v6;
      if (v6 && typeof v6 === 'object'){
        var t6 = !v6.wan && !v6.lan ? ['Off: nothing can leak around the VPN over IPv6', G] : v6.leak ? ['Devices have working IPv6, which can bypass the VPN (tunnels carry IPv4)', O] :
          v6.wan && !v6.lan ? ['On for the internet side only; your devices don’t get it (no leak)', G] : v6.lan && !v6.route ? ['Devices have IPv6 but there’s no IPv6 way out (no leak)', G] : ['On', G];
        h += row(t6[1], 'IPv6', t6[0], v6.works === true ? 'works' : v6.works === false ? 'not answering' : '');
      }
      /* evenings (owner's pick 10): the nightly 7-11 PM comparison over the last week */
      var ev = NP.evening;
      if (ev && typeof ev === 'object' && ev.days >= 4)
        h += row(ev.slow >= 4 ? O : G, 'Evenings', ev.slow >= 4 ? 'Slower most evenings: ' + Math.round(ev.eve || 0) + ' ms 7–11 PM vs ' + Math.round(ev.rest || 0) + ' ms in the day (' + ev.slow + ' of ' + ev.days + ' days)'
          : 'Normal (' + ev.slow + ' of ' + ev.days + ' days slower in the evening)', '<a href="#" data-act="isplog" style="color:var(--mh-blue)">Log</a>');
      else h += row(N0, 'Evenings', 'Checking: needs 4 days of hourly stats (started 11-18)', '<a href="#" data-act="isplog" style="color:var(--mh-blue)">Log</a>');
      /* modem restarted by itself (owner's pick 16) */
      var mbt = NP.modem_boot;
      if (mbt && typeof mbt === 'object' && mbt.t && (L.time || Date.now() / 1000) - mbt.t < 7 * 86400)
        h += row(O, 'Modem', 'Restarted ' + new Date(mbt.t * 1000).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) + (mbt.up ? ' (was up ' + Math.round(mbt.up / 3600) + ' h)' : ''));
      /* SQM repair state (opt-in) */
      if (NP.sqm === 'trial') h += row('var(--mh-blue)', 'SQM trial', 'Traffic shaping is on to fix lag under load; the next speed test decides');
      else if (NP.sqm === 'kept') h += row(G, 'SQM', 'On: auto-heal kept it because it cut the lag under load');
      return h ? '<div class="mh-nps">' + h + '</div>' : '';
    },
    /* ---------- privacy, alerts, readiness, reliability, usage ---------- */
    togglePrivacy: function(){
      var m = this.mh; m.priv = !m.priv;
      try { localStorage.setItem('machome-privacy', m.priv ? '1' : '0'); } catch (e) {}
      m.revealed = {};
      this.toast(m.priv ? 'Privacy mode on: personal details hidden' : 'Privacy mode off');
      this.paint(); if (m.st) this.set('spd', this.spdHtml());
    },
    /* ---------- weather-style alert banner ---------- */
    issues: function(){
      var m = this.mh, s = m.stats || {}, L = s.live || {}, x = L.x || {}, inc = x.inc || {}, now = L.time || Math.floor(Date.now() / 1000);
      var out = [], add = function(o){ out.push(o); };
      var vl = (m.vpn && m.vpn.status_list) || [], byIf = {}, prov = m.prov || {};
      vl.forEach(function(v){ if (v.via) byIf[v.via] = v; });
      var lab = function(via){ var v = byIf[via]; if (!v) return via; var p = prov[String(v.group_id)]; return v.name + (p ? ' (' + p + ')' : ''); };
      var pl = L.pl || {}, l10 = function(k){ var a = pl[k]; if (!a || !a.length) return null; var t = 0; a.forEach(function(v){ t += v; }); return t / a.length; };

      if (inc.wan_since) add({ id: 'wan', lvl: 'crit', icon: 'globe', title: 'Internet is down',
        detail: 'The router can’t reach the internet. Check the modem and the WAN cable.', since: inc.wan_since, route: 'internet', rl: 'Open Internet' });
      /* auto-heal modem restart (opt-in): the on-page warning before it acts, with Cancel (watch.lua mrs_tick) */
      var mr = m.watch && m.watch.mrs;
      if (mr && mr.state === 'pending' && mr.at){
        var mins = Math.max(0, Math.ceil((mr.at - now) / 60));
        add({ id: 'mrs', lvl: 'crit', icon: 'power', title: mins > 0 ? 'Restarting the cable modem in ' + mins + ' min' : 'Restarting the cable modem now',
          detail: 'The internet has been down since ' + hhmm(mr.since) + ' and renewing the connection didn’t help, so auto-heal will press Restart on the Xfinity gateway at ' + hhmm(mr.at) + '. Everyone stays offline about 5–10 minutes longer (Xfinity phone service too).',
          since: mr.since, act: 'mrs-cancel', rl: 'Cancel restart' });
      } else if (mr && mr.state === 'restarting' && mr.t) add({ id: 'mrs', lvl: 'warn', icon: 'power', title: 'The cable modem is restarting',
          detail: 'Auto-heal restarted the Xfinity gateway at ' + hhmm(mr.t) + '. The internet should be back within about 10 minutes.', since: mr.t });
      if (inc.dns_since) add({ id: 'dns', lvl: 'crit', icon: 'globe', title: 'DNS is not responding',
        detail: ((L.dns && L.dns.server) || 'Your DNS server') + ' isn’t answering, so devices can’t look up websites.', since: inc.dns_since, route: 'dnsview', rl: 'DNS settings' });
      /* high WAN ping (2026-11-17): same rule as the Discord alert (5-minute middle value over the limit) */
      if (inc.ping_high && inc.ping_high.ms != null){ var phi = inc.ping_high;
        add({ id: 'ping', lvl: 'warn', icon: 'pulse', title: phi.spiky ? 'Internet ping is spiky: ' + phi.pct + '% of checks over ' + phi.limit + ' ms' : 'Internet ping is high: ' + phi.ms + ' ms',
          detail: (phi.spiky ? 'Lag spikes in the last 15 minutes' : 'Over your ' + phi.limit + ' ms limit for 5+ minutes') + ' (best of Cloudflare, Google and Quad9, measured directly, not through the VPN). Usually the ISP or the modem.',
          since: phi.since, route: 'internet', rl: 'Open Internet' }); }
      var down = {};
      if (inc.vpn && typeof inc.vpn === 'object') Object.keys(inc.vpn).forEach(function(via){
        down[via] = 1;
        var hs = L.wg && L.wg[via], p = L.ping && L.ping[via];
        var fov = inc.failover && inc.failover[via];
        add({ id: 'vpn-' + via, lvl: fov ? 'warn' : 'crit', icon: 'lock', title: 'VPN ' + lab(via) + ' is down' + (fov ? ' (devices moved to ' + lab(fov) + ')' : ''),
          detail: (p && p.loss < 100 && hs ? (/^ovpn/.test(via) ? 'Nothing from the OpenVPN server for ' : 'No WireGuard handshake for ') + dur(now - hs) : 'Not replying through the tunnel') + '. ' +
            (fov ? 'Its devices are using ' + lab(fov) + ' for now (still on the VPN) and will move back automatically.' : 'Devices on this tunnel may have no internet (kill switch).'),
          since: inc.vpn[via].since, route: 'vpndashboard', rl: 'Open VPN' });
      });
      vl.forEach(function(v){
        if (!v.enabled || down[v.via]) return;
        var hs = L.wg && L.wg[v.via];
        var ov = v.type === 'openvpn';
        if (v.status === 1 && hs && now - hs > 180) add({ id: 'stale-' + v.via, lvl: 'warn', icon: 'lock', title: lab(v.via) + (ov ? ' has gone quiet' : ' handshake is stale'),
          detail: (ov ? 'Nothing has come back from the OpenVPN server since ' : 'Last WireGuard handshake was ') + ago(now - hs) + '. The tunnel may be about to drop.', route: 'vpndashboard', rl: 'Open VPN' });
        var lv = l10(v.via);
        if (lv != null && lv > 2) add({ id: 'loss-' + v.via, lvl: 'warn', icon: 'pulse', title: 'Packet loss on ' + lab(v.via) + ': ' + lv.toFixed(1) + '%',
          detail: 'Averaged over the last 10 minutes. Try a different server if it continues.', route: 'vpndashboard', rl: 'Open VPN', clr: v.via });
      });
      var lw = l10('wan');
      if (!inc.wan_since && lw != null && lw > 2) add({ id: 'loss-wan', lvl: 'warn', icon: 'pulse', title: 'Packet loss on your internet: ' + lw.toFixed(1) + '%',
        detail: 'Averaged over 10 minutes on the direct (non-VPN) connection. Usually the ISP, modem or cabling.', route: 'internet', rl: 'Open Internet', clr: 'wan' });
      var temps = s.temps || [], maxT = temps.reduce(function(a, t){ return Math.max(a, t.temp || 0); }, 0), lim = inc.temp_limit || 185;
      if (maxT){
        var f = cf(maxT);
        if (f >= lim + 10) add({ id: 'temp', lvl: 'crit', icon: 'therm', title: 'Router is overheating: ' + tdispF(f), detail: 'Well above your ' + tdispF(lim) + ' limit. Improve airflow or reduce the load.', since: inc.temp_since, route: 'overview', rl: 'Open System' });
        else if (f >= lim) add({ id: 'temp', lvl: 'warn', icon: 'therm', title: 'Router is running hot: ' + tdispF(f), detail: 'Above your ' + tdispF(lim) + ' alert limit.', since: inc.temp_since, route: 'overview', rl: 'Open System' });
      }
      var th = (s.cooling || []).filter(function(c){ return /cpufreq/.test(c.type); })[0];
      if (th && th.cur > 0) add({ id: 'throttle', lvl: 'warn', icon: 'cpu', title: 'CPU is being throttled to cool down', detail: 'Thermal throttling level ' + th.cur + ' of ' + th.max + '. Speeds may be reduced.', route: 'overview', rl: 'Open System' });
      var CRIT = { ssh: 1, keys: 1, wanfw: 1, pf: 1, remote: 1, upnp: 1, https: 1 };
      (L.sec || []).forEach(function(c){ if (!c.ok && !c.rec) add({ id: 'sec-' + c.id, lvl: CRIT[c.id] ? 'crit' : 'warn', icon: 'shield', title: 'Security: ' + c.label + ' failed',
        detail: String(c.detail), since: inc.sec_since && inc.sec_since[c.id], route: 'firewallview', rl: 'Open Security' }); });
      var seen = L.seen || {};
      (this.clientsArr() || []).forEach(function(c){
        var ts = c.mac && seen[String(c.mac).toUpperCase()];
        if (ts > 0 && now - ts < 86400) add({ id: 'new-' + c.mac, lvl: 'warn', soft: true, icon: 'devices',
          title: 'New device joined: ' + (m.priv ? 'a device' : (c.alias || c.name || 'Unknown device')),
          detail: (m.priv ? 'Details hidden in privacy mode' : (c.ip || 'No IP yet')) + '. Make sure you recognise it.', since: ts, route: 'clients', rl: 'Open Clients', ack: c.mac });
      });
      /* travel routers: hotel / airport sign-in page, home unreachable */
      var tv = m.trv;
      if (m.uplOn && tv && tv.active && tv.up){
        var tpo = tv.portal || {}, tnm = m.priv ? 'This network' : (tv.up.name || 'This network');
        if (tpo.state === 'portal') add({ id: 'portal', lvl: 'warn', icon: 'wifi', title: 'This Wi-Fi needs you to sign in',
          detail: tnm + ' shows a sign-in page (hotel / airport login) before it lets the router online. Open it, accept, and the internet starts working by itself.', since: tpo.since, act: 'trv-portal', rl: 'Open sign-in page' });
        var th = tv.home;
        if (th && th.running && th.ip && th.ok === false && th.bad_since && (tv.t || now) - th.bad_since >= 900) add({ id: 'home', lvl: 'warn', icon: 'globe', title: 'Can’t reach home',
          detail: 'Your home router (' + (m.priv ? 'hidden' : (th.name || th.ip)) + ') isn’t answering through Tailscale. Home internet or power may be down.', since: th.bad_since, act: 'trv-check', rl: 'Check again' });
      }
      if (x.fw && x.fw.new){
        var rd = x.ready || {}, lost = (rd.lost && rd.lost.length) || 0;
        add({ id: 'fw-' + x.fw.new, lvl: 'warn', soft: true, icon: 'up', title: 'Firmware ' + x.fw.new + ' is available',
          detail: (lost ? lost + ' item' + (lost > 1 ? 's' : '') + ' would be wiped by the upgrade. ' : 'Your setup is set to survive the upgrade. ') + 'Read the checklist first.', act: 'ready', rl: 'Checklist' });
      }
      /* attach one-click fixes */
      out.forEach(function(i){
        var mm = /^(vpn|stale|loss)-((?:wgclient|ovpnclient)\d+)$/.exec(i.id);
        if (mm) i.fix = { action: 'vpn', target: mm[2], label: 'Restart tunnel', what: 'Restart ' + lab(mm[2]) + '? Devices on it lose internet for a few seconds while it reconnects.' };
        else if (i.id === 'wan') i.fix = { action: 'wan', label: 'Renew connection', what: 'Renew the internet connection? This restarts the router’s WAN link. It can’t power-cycle your modem.' };
        else if (i.id === 'dns') i.fix = { action: 'dns', label: 'Fix DNS', what: 'Check your DNS server and restart the router’s DNS service? If the NAS itself is down, you’ll need to fix it there.' };
        else if (/^sec-/.test(i.id)) i.fix = { action: 'harden', label: 'Restore settings', what: 'Put back the security settings this router had before (only the ones it had; SSH key-only only if an SSH key is installed)?' };
      });
      /* muted alert types (Mute on a banner, 2026-11-18) are left out everywhere (banner, top bar) until the mute ends */
      var mu = (x.alerts && x.alerts.mutes) || {}, nMu = 0;
      out = out.filter(function(i){ var k = alertKind(i.id); if (k && mu[k] && mu[k] > now){ nMu++; return false; } i.kind = k; return true; });
      m.nMuted = nMu;
      return out;
    },
    wxFix: function(key){
      var self = this, m = this.mh, id = m.wxRev && m.wxRev[key];
      var it = (m.wxLast || []).filter(function(i){ return i.id === id; })[0];
      if (!it || !it.fix) return;
      var f = it.fix;
      this.confirm({ title: f.label + '?', icon: 'bolt', grad: GRAD.orange, ok: f.label, working: 'Working…', body: '<p>' + esc(f.what) + '</p>' },
        function(){ return rpcx('machome', 'fix', f.target ? { action: f.action, target: f.target } : { action: f.action }, 30000).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'the fix could not run');
          if (f.action === 'dns' || f.action === 'harden'){
            setTimeout(function(){ self.openModal('<div class="hic" style="background:' + (r.answering === false ? GRAD.orange : GRAD.green) + '">' + svg('shield') + '</div><h2>' + esc(f.label) + '</h2><p>' + esc(r.msg) + '</p><div class="btns"><button class="pri" data-m="cancel">OK</button></div>', {}); }, 80);
            return null;
          }
          return r.msg;
        }); });
    },
    wxDismiss: function(key){
      var m = this.mh, id = m.wxRev && m.wxRev[key]; if (!id) return;
      var it = (m.wxLast || []).filter(function(i){ return i.id === id; })[0];
      var secs = !it ? 3600 : it.soft ? 30 * 86400 : it.lvl === 'crit' ? 3600 : 86400;
      var d = {}; try { d = JSON.parse(localStorage.getItem('machome-dismiss') || '{}') || {}; } catch (e) {}
      d[id] = Math.floor(Date.now() / 1000) + secs;
      try { localStorage.setItem('machome-dismiss', JSON.stringify(d)); } catch (e) {}
      this.set('wx', this.wxHtml());
    },
    /* "It's mine": mark one new device (key) or all new devices (null) as known on the router, so the alert clears for good */
    wxAck: function(key){
      var self = this, m = this.mh, L = (m.stats && m.stats.live) || {}, items;
      if (key){ var id = m.wxRev && m.wxRev[key]; items = (m.wxLast || []).filter(function(i){ return i.id === id && i.ack; }); }
      else items = (m.wxLast || []).filter(function(i){ return i.ack; });
      if (!items.length) return;
      var p = key ? rpcx('machome', 'ack_device', { mac: items[0].ack }) : rpcx('machome', 'ack_device', { all: true });
      p.then(function(r){
        if (!r || !r.ok) throw new Error((r && r.err) || 'The router didn’t accept it');
        var seen = L.seen || {}, d = {};
        try { d = JSON.parse(localStorage.getItem('machome-dismiss') || '{}') || {}; } catch (e) {}
        items.forEach(function(i){ seen[String(i.ack).toUpperCase()] = 0; delete d[i.id]; });
        try { localStorage.setItem('machome-dismiss', JSON.stringify(d)); } catch (e) {}
        self.paint();
        self.toast(items.length > 1 ? items.length + ' devices marked as yours' : 'Marked as your device');
      }).catch(function(e){ self.toast('Couldn’t save: ' + e.message); });
    },
    /* top bar "All systems normal": the same issues the alert banner shows (dismissed ones and soft notices like
       "firmware available" don't count). Green breathes; orange = warnings, red = problems; click scrolls to the banner. */
    sysStatusHtml: function(){
      var m = this.mh, list; try { list = this.issues(); } catch (e) { return ''; }
      var Lt = m.stats && m.stats.live && m.stats.live.time, now = Lt || Math.floor(Date.now() / 1000);
      var dis = {}; try { dis = JSON.parse(localStorage.getItem('machome-dismiss') || '{}') || {}; } catch (e) {}
      var vis = list.filter(function(i){ return !i.soft && !(dis[i.id] && dis[i.id] > now); });
      var crit = vis.filter(function(i){ return i.lvl === 'crit'; }).length, warn = vis.length - crit;
      var col = crit ? 'var(--mh-red)' : warn ? 'var(--mh-orange)' : 'var(--mh-green)';
      var txt = crit ? crit + ' problem' + (crit > 1 ? 's' : '') + (warn ? ' · ' + warn + ' warning' + (warn > 1 ? 's' : '') : '')
              : warn ? warn + ' warning' + (warn > 1 ? 's' : '') : 'All systems normal';
      return '<i class="dot' + (vis.length ? '' : ' blink') + '" style="background:' + col + '"></i><span class="t">' + txt + '</span>';
    },
    wxHtml: function(){
      var self = this, m = this.mh, list = this.issues();
      var Lt = m.stats && m.stats.live && m.stats.live.time, now = Lt || Math.floor(Date.now() / 1000);   /* router clock, same as the since-times */
      m.wxLast = list; m.wxRev = m.wxRev || {};
      var dis = {}; try { dis = JSON.parse(localStorage.getItem('machome-dismiss') || '{}') || {}; } catch (e) {}
      m.prevIss = m.prevIss || {}; m.recov = m.recov || {};
      var cur = {};
      list.forEach(function(i){ cur[i.id] = 1; var p = m.prevIss[i.id]; m.prevIss[i.id] = { title: i.title, since: i.since || (p && p.since) || now, soft: i.soft }; if (!i.since && !i.soft) i.since = m.prevIss[i.id].since; });
      Object.keys(m.prevIss).forEach(function(id){ if (!cur[id]){ var p = m.prevIss[id]; if (!p.soft) m.recov[id] = { title: p.title, dur: now - (p.since || now), until: now + 90 }; delete m.prevIss[id]; } });
      Object.keys(m.recov).forEach(function(id){ if (m.recov[id].until < now || cur[id]) delete m.recov[id]; });
      var vis = list.filter(function(i){ return !(dis[i.id] && dis[i.id] > now); });
      vis.sort(function(a, b){ return (a.lvl === 'crit' ? 0 : 1) - (b.lvl === 'crit' ? 0 : 1); });
      var nDis = list.length - vis.length, rec = Object.keys(m.recov).map(function(id){ return m.recov[id]; });
      if (!vis.length && !rec.length && !nDis && !m.nMuted) return '';
      var MAX = 3, shown = m.wxAll ? vis : vis.slice(0, MAX);
      var row = function(i){
        var key = self.anonKey('wx:' + i.id); m.wxRev[key] = i.id;
        var when = i.since ? 'since ' + hhmm(i.since) + ' (' + dur(Math.max(60, now - i.since)).trim() + ')' : '';
        return '<div class="mh-wxi ' + i.lvl + '"><span class="ic">' + svg(i.icon || 'shield') + '</span>' +
          '<div class="tx"><b>' + esc(i.title) + '</b><small>' + esc(i.detail) + (when ? ' · ' + esc(when) : '') + '</small></div>' +
          '<div class="ac">' + (i.fix ? '<button class="mh-btn mh-fix" data-act="wx-fix" data-arg="' + key + '">⚡ ' + esc(i.fix.label) + '</button>' : '') + (i.clr ? '<button class="mh-btn sec" data-act="lossclr" data-arg="' + esc(i.clr) + '" title="Start the 10-minute packet-loss check fresh (e.g. after changing the server)">&#8635; Clear</button>' : '') + (i.act ? '<button class="mh-btn" data-act="' + i.act + '">' + esc(i.rl) + '</button>' : i.route ? '<button class="mh-btn" data-route="' + i.route + '">' + esc(i.rl) + '</button>' : '') +
          (i.ack ? '<button class="mh-btn" data-act="wx-ack" data-arg="' + key + '" title="Mark as a known device and clear this alert for good">✓ It’s mine</button>' : '') +
          '<button class="mh-wxd" data-act="wx-dis" data-arg="' + key + '" title="Hide this alert">' + (i.soft ? 'Dismiss' : i.lvl === 'crit' ? 'Dismiss 1h' : 'Dismiss 24h') + '</button>' +
          (i.kind ? '<button class="mh-wxd" data-act="wx-mute" data-arg="' + esc(i.kind) + '" title="Mute all ' + esc(KIND_NAMES[i.kind] || i.kind) + ' alerts for a while (banner and Discord)">Mute</button>' : '') + '</div></div>';
      };
      var h = '<div class="mh-wx">' + shown.map(row).join('') +
        rec.map(function(r){ return '<div class="mh-wxi ok"><span class="ic">' + svg('shield') + '</span><div class="tx"><b>Resolved: ' + esc(r.title) + '</b><small>Recovered' + (r.dur > 30 ? ' after ' + dur(r.dur).trim() : '') + '.</small></div></div>'; }).join('');
      var foot = [];
      if (vis.length > MAX) foot.push('<a href="#" data-act="wx-more">' + (m.wxAll ? 'Show fewer' : '+' + (vis.length - MAX) + ' more alert' + (vis.length - MAX > 1 ? 's' : '')) + '</a>');
      var newAll = list.filter(function(i){ return i.ack; });
      if (newAll.length > 1 || (newAll.length && newAll.some(function(i){ return dis[i.id] && dis[i.id] > now; })))
        foot.push('<a href="#" data-act="wx-ackall">✓ ' + (newAll.length > 1 ? 'All ' + newAll.length + ' new devices are mine' : 'The dismissed new device is mine') + '</a>');
      if (nDis) foot.push('<a href="#" data-act="wx-undis">' + nDis + ' dismissed · show again</a>');
      if (m.nMuted) foot.push('<a href="#" data-act="wx-muted">' + m.nMuted + ' muted · manage</a>');
      if (vis.length) foot.push('<a href="#" data-act="wx-clearall" title="Clear every alert: VPN, packet-loss and high-ping checks start fresh, the rest are hidden like Dismiss">Clear all</a>');
      return h + (foot.length ? '<div class="mh-wxf">' + foot.join(' · ') + '</div>' : '') + '</div>';
    },
    fwbHtml: function(){
      var x = (this.mh.stats && this.mh.stats.live && this.mh.stats.live.x) || {}, fw = x.fw || {}, rd = x.ready || {};
      if (!fw.new) return '';
      var warn = ((rd.lost && rd.lost.length) || 0) + ((rd.revert && rd.revert.length) ? 1 : 0);
      return '<div class="mh-fwb" data-act="ready"><span class="ic" style="background:' + GRAD.purple + '">' + svg('up') + '</span><div><b>Firmware ' + esc(fw.new) + ' is available</b>' +
        '<small>You’re on ' + esc(fw.current || '?') + '. ' + (warn ? warn + ' item' + (warn > 1 ? 's' : '') + ' to recheck after upgrading.' : 'Everything is set to survive the upgrade.') + ' Tap for the checklist.</small></div></div>';
    },
    openReadiness: function(){
      var self = this, x = (this.mh.stats && this.mh.stats.live && this.mh.stats.live.x) || {}, fw = x.fw || {}, rd = x.ready;
      if (!rd){ this.toast('Upgrade check runs within a few minutes, try again shortly'); return; }
      var li = function(arr){ return '<ul>' + arr.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>'; };
      var html = '<div class="hic" style="background:' + GRAD.purple + '">' + svg('up') + '</div><h2>Firmware upgrade checklist</h2>' +
        '<p>' + (fw.new ? 'Firmware <b>' + esc(fw.new) + '</b> is available (you’re on ' + esc(fw.current || '?') + ').' : 'No new firmware right now. This is what an upgrade would keep.') + '</p>' +
        '<div class="mh-ready"><div class="ok">✓ <b>' + rd.kept + '</b> custom files and settings survive an upgrade with <b>Keep settings</b> ticked.</div>' +
        (rd.lost && rd.lost.length ? '<div class="bad">⚠ <b>Will be wiped:</b>' + li(rd.lost) + '</div>' : '') +
        (rd.revert && rd.revert.length ? '<div class="warn">↩ <b>Will turn back on</b> (re-disable after):' + li(rd.revert) + '</div>' : '') +
        (rd.notes && rd.notes.length ? '<div class="note">' + li(rd.notes) + '</div>' : '') +
        '<div class="note"><b>Before upgrading:</b> use <b>Back up settings</b> in the Control Center. After it finishes, you’ll get a Discord report of anything that broke, and Claude can reapply it all from the brume3-home folder.</div></div>' +
        '<div class="btns"><button data-m="cancel">Close</button>' + (fw.new ? '<button class="pri" data-m="go">Open Upgrade page</button>' : '') + '</div>';
      this.openModal(html, { go: function(){ self.closeModal(); self.go('upgrade'); } });
    },
    /* Auto-heal window (Settings > Alerts & backups > Auto-heal; moved out of Discord alerts 2026-11-14, round 3 of
       repairs added the same day). Same settings file as alerts: set_alerts only changes the keys it's given, so this
       saves just these switches. Rows for the other kind of router are hidden (only: 'router' / 'ap'). */
    healOn: function(a, h){ return h.d ? a[h.k] !== false : a[h.k] === true; },
    healRows: function(){ var ap = this.isAP(); return HEAL.filter(function(h){ return !h.only || (h.only === 'ap') === ap; }); },
    /* "12 of 15 repairs on" for the Settings row (null until alert settings are loaded) */
    healSummary: function(){
      var a = this.mh.alerts, self = this; if (!a) return null;
      var rows = this.healRows(), n = rows.filter(function(h){ return self.healOn(a, h); }).length;
      return n === 0 ? 'All off' : n + ' of ' + rows.length + ' repairs on';
    },
    openAutoheal: function(){
      var self = this;
      Promise.all([rpc('machome', 'get_alerts'), rpc('machome', 'get_watch').catch(function(){ return null; })]).then(function(res){
        var a = res[0], w = res[1] || {};
        if (!a){ self.toast('Couldn’t load auto-heal settings'); return; }
        self.mh.alerts = a; if (res[1]) self.mh.watch = res[1];
        var rows = self.healRows(), groups = [];
        rows.forEach(function(h){ if (groups.indexOf(h.g) < 0) groups.push(h.g); });
        var sw = function(h){
          var on = self.healOn(a, h), dis = h.k === 'modem_restart' && !w.modem_set && !on;
          return '<label class="mh-mrow"' + (dis ? ' style="opacity:.55"' : '') + '><span><b>' + esc(h.l) + '</b><small>' + esc(h.s) + (dis ? ' Set up Settings → Cable modem first.' : '') + '</small></span>' +
            '<input type="checkbox" class="mh-msw" data-f="' + h.k + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '></label>' +
            (h.k === 'modem_restart' && w.modem_set ? '<div class="mh-mrow" style="justify-content:flex-start;gap:10px"><button class="mh-go" data-m="mrcheck">Check (no restart)</button>' +
              '<small data-mrc style="color:var(--mh-text2)">Logs in to the gateway and finds its Restart button without pressing it.</small></div>' : '');
        };
        var html = '<div class="hic" style="background:' + GRAD.green + '">' + svg('shield') + '</div><h2>Auto-heal</h2>' +
          '<p>Problems the router fixes by itself. Each fix happens at most once per problem with a cool-down, and tells you if it didn’t help. Switches marked opt-in are off until you turn them on.</p>' +
          groups.map(function(g){ return '<div class="mh-mgrp"><h4>' + esc(g) + '</h4>' + rows.filter(function(h){ return h.g === g; }).map(sw).join('') + '</div>'; }).join('') +
          '<p style="text-align:left;font-size:11px;margin-top:10px">' + (a.enabled && a.has_webhook ? 'When a fix runs you get a Discord message (VPN, Router health, Security, Wi-Fi or NAS backup alert) and it’s listed in Recent events.' : 'Fixes are listed in Recent events. Set up Discord alerts to also get a message when one runs.') + '</p>' +
          '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button class="pri" data-m="save">Save</button></div>';
        var doSave = function(p){
          return rpcx('machome', 'set_alerts', p).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'could not save');
            self.closeModal(); self.toast('Auto-heal settings saved');
            rpc('machome', 'get_alerts').then(function(x){ if (x) self.mh.alerts = x; });
          });
        };
        self.openModal(html, {
          mrcheck: function(md, b){
            var t = md.querySelector('[data-mrc]'); b.disabled = true; t.style.color = ''; t.textContent = 'Checking… (up to 20 seconds)';
            rpcx('machome', 'modem_rs_check', {}, 45000).then(function(r){
              b.disabled = false;
              if (r && r.ok){ t.style.color = 'var(--mh-green)'; t.textContent = r.msg || 'OK'; }
              else { t.style.color = 'var(--mh-orange)'; t.textContent = 'Couldn’t: ' + ((r && r.err) || 'no answer'); }
            }).catch(function(e){ b.disabled = false; t.textContent = e.message; });
          },
          save: function(md, b){
            var p = {};
            rows.forEach(function(h){ var i = md.querySelector('[data-f="' + h.k + '"]'); if (i && !i.disabled) p[h.k] = !!i.checked; });
            /* turning ON a switch marked warn (modem restart, SQM): two warnings each first; Cancel leaves everything unsaved */
            var newly = rows.filter(function(h){ return h.warn && p[h.k] && !self.healOn(a, h); });
            if (newly.length){
              var go = function(i){
                if (i >= newly.length) return doSave(p);
                self[newly[i].warn === 'sqm' ? 'sqmWarn' : 'modemWarn'](function(){ return go(i + 1); }, function(){ self.openAutoheal(); });
                return Promise.resolve();
              };
              return go(0);
            }
            b.disabled = true;
            doSave(p).catch(function(e){ b.disabled = false; md.querySelector('[data-e]').textContent = e.message; });
          }
        });
      }).catch(function(){ self.toast('Couldn’t load auto-heal settings'); });
    },
    /* the two warnings before the router may restart the cable modem by itself */
    modemWarn: function(ok, back){
      var self = this;
      var w1 = '<div class="hic" style="background:' + GRAD.orange + '">' + svg('bolt') + '</div><h2>Warning 1 of 2: restarting your modem</h2>' +
        '<p style="text-align:left">This is the only auto-heal fix that changes <b>another device</b>: your Xfinity gateway. Before you turn it on:</p>' +
        '<ul style="text-align:left;font-size:12px;margin:8px 0 0 18px;padding:0;color:var(--mh-text2);line-height:1.5">' +
        '<li>A restart keeps <b>everyone</b> offline for about <b>5–10 more minutes</b>.</li>' +
        '<li>Anything that runs through the gateway also goes down while it restarts: Xfinity Voice home phone, Xfinity Home security, Xfinity Wi-Fi.</li>' +
        '<li>If the outage is on Xfinity’s side, a restart won’t fix it. It only helps when the gateway itself is stuck.</li>' +
        '<li>It only runs after <b>15 minutes</b> without internet, after renewing the connection already failed, and at most <b>once a day</b>.</li>' +
        '<li>From 10 minutes into an outage the Home tab shows a warning with <b>Cancel restart</b>. Discord can’t warn you first, because the internet is down.</li></ul>' +
        '<div class="btns"><button data-m="back">Cancel</button><button class="pri" data-m="next">I understand, continue</button></div>';
      this.openModal(w1, {
        back: function(){ back(); },
        next: function(){
          var w2 = '<div class="hic" style="background:' + GRAD.red + '">' + svg('power') + '</div><h2>Warning 2 of 2: are you sure?</h2>' +
            '<p>The router will press <b>Restart</b> on your Xfinity gateway by itself, without asking at the time, whenever the internet has been down for 15 minutes.</p>' +
            '<label style="display:flex;gap:8px;align-items:flex-start;text-align:left;font-size:12px;font-weight:500;color:var(--mh-text);margin:12px 0 0"><input type="checkbox" id="mh-mrok" style="width:auto;margin:2px 0 0;flex:none"> ' +
            'I understand that everyone loses internet (and Xfinity phone service) while the gateway restarts, and that I can turn this off any time in Settings → Auto-heal.</label>' +
            '<div class="err" data-e></div><div class="btns"><button data-m="back">Cancel</button><button class="dan" data-m="yes">Turn on modem restarts</button></div>';
          self.openModal(w2, {
            back: function(){ back(); },
            yes: function(md, b){
              if (!md.querySelector('#mh-mrok').checked){ md.querySelector('[data-e]').textContent = 'Tick the box to confirm.'; return; }
              b.disabled = true;
              ok().catch(function(e){ b.disabled = false; md.querySelector('[data-e]').textContent = e.message; });
            }
          });
        }
      });
    },
    /* the two warnings before the router may turn on SQM by itself (2026-11-18) */
    sqmWarn: function(ok, back){
      var self = this;
      var w1 = '<div class="hic" style="background:' + GRAD.orange + '">' + svg('bolt') + '</div><h2>Warning 1 of 2: SQM can lower your top speed</h2>' +
        '<p style="text-align:left">SQM (traffic shaping) keeps ping low while the line is busy, but:</p>' +
        '<ul style="text-align:left;font-size:12px;margin:8px 0 0 18px;padding:0;color:var(--mh-text2);line-height:1.5">' +
        '<li>It shapes <b>all</b> internet traffic on the router’s own processor. At multi-gig speeds that can cap your download and upload <b>well below your plan</b> while it’s on.</li>' +
        '<li>It only turns on when a speed test shows your ping rising <b>60+ ms</b> when the line is busy.</li>' +
        '<li>The next speed test decides: if the lag didn’t drop a lot, or you lost more than half your speed, your previous SQM settings come back by themselves.</li>' +
        '<li>It never changes SQM you turned on yourself, and tries at most once a week.</li>' +
        '<li>Lag spikes on an idle line (like a problem on your ISP’s side) are <b>not</b> fixed by SQM.</li></ul>' +
        '<div class="btns"><button data-m="back">Cancel</button><button class="pri" data-m="next">I understand, continue</button></div>';
      this.openModal(w1, {
        back: function(){ back(); },
        next: function(){
          var w2 = '<div class="hic" style="background:' + GRAD.red + '">' + svg('bolt') + '</div><h2>Warning 2 of 2: are you sure?</h2>' +
            '<p>The router will turn on SQM by itself, without asking at the time, when a speed test shows lag under load.</p>' +
            '<label style="display:flex;gap:8px;align-items:flex-start;text-align:left;font-size:12px;font-weight:500;color:var(--mh-text);margin:12px 0 0"><input type="checkbox" id="mh-sqok" style="width:auto;margin:2px 0 0;flex:none"> ' +
            'I understand SQM may slow my top internet speed while it’s on, and that I can turn this off any time in Settings → Auto-heal (which also puts my old SQM settings back).</label>' +
            '<div class="err" data-e></div><div class="btns"><button data-m="back">Cancel</button><button class="dan" data-m="yes">Turn on the SQM repair</button></div>';
          self.openModal(w2, {
            back: function(){ back(); },
            yes: function(md, b){
              if (!md.querySelector('#mh-sqok').checked){ md.querySelector('[data-e]').textContent = 'Tick the box to confirm.'; return; }
              b.disabled = true;
              ok().catch(function(e){ b.disabled = false; md.querySelector('[data-e]').textContent = e.message; });
            }
          });
        }
      });
    },
    /* "Cancel restart" on the Home tab's modem warning: this outage only */
    mrsCancel: function(){
      var self = this, mr = this.mh.watch && this.mh.watch.mrs; if (!mr || !mr.since) return;
      this.confirm({ title: 'Cancel the modem restart?', icon: 'power', grad: GRAD.orange, ok: 'Don’t restart', working: 'Cancelling…',
        body: '<p>The gateway won’t be restarted during this outage. Modem restarts stay on for future outages (Settings → Auto-heal).</p>' },
        function(){ return rpcx('machome', 'modem_rs_cancel', { since: mr.since }).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'couldn’t cancel');
          mr.state = 'cancelled'; self.set('wx', self.wxHtml());
          return 'Modem restart cancelled for this outage';
        }); });
    },
    openAlerts: function(){
      var self = this;
      rpc('machome', 'get_alerts').then(function(a){
        if (!a){ self.toast('Couldn’t load alert settings'); return; }
        self.mh.alerts = a;
        var T = [['vpn','VPN tunnel down or stale'],['wan','Internet outage (sent when it’s back)'],['ping','High internet ping (over your limit for 5 min; at most 1 alert an hour if it keeps bouncing)'],['dns','DNS server not responding'],['newdev','New device joins'],
                 ['security','Security check changes'],['temp','Router running hot'],['firmware','New firmware + upgrade checklist'],['upgrade','After an upgrade: what broke'],['speed','Nightly speed test results'],
                 ['login','Admin sign-ins (web + SSH) and failed SSH attempts'],['weekly','Weekly summary report'],['backup','NAS backup failures'],['health','Router health: auto-reboot, stuck services, clock, storage/memory, cable speed'],['config','Router settings changed'],['isp','Internet slower than your plan 3 nights in a row'],['wifi','Weekly Wi-Fi channel report'],['schedule','Device schedules (paused / back online)'],['presence','Who’s home (arrive / leave)'],['data','Data cap (80% and 100%)'],['upload','Unusual upload from a device (possible hacked device or runaway backup)'],['devwatch','Watched device goes offline / comes back (pick devices in their device sheet)'],['monthly','Monthly summary (1st of the month)'],['travel','Travel router: hotel sign-in page, can’t reach home, daily data limit'],['adspike','Unusual blocking for one device (needs “Watch for unusual blocking” below)'],['rhupdate','New Router Home version on GitHub (checked once a day; never installs by itself)'],['vuln','Known vulnerability found (GL.iNet notices + NVD; signs of infection, exposed settings, firmware updates)']];
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        var dayOpts = days.map(function(d, i){ return '<option value="' + i + '"' + (i === a.weekly_day ? ' selected' : '') + '>' + d + '</option>'; }).join('');
        var whours = ''; for (var wh = 0; wh < 24; wh++) whours += '<option value="' + wh + '"' + (wh === a.weekly_hour ? ' selected' : '') + '>' + ((wh % 12) || 12) + ':00 ' + (wh < 12 ? 'AM' : 'PM') + '</option>';
        var sw = function(id, on, label, sub){ return '<label class="mh-mrow"><span><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><input type="checkbox" class="mh-msw" data-f="' + id + '"' + (on ? ' checked' : '') + '></label>'; };
        var hours = ''; for (var h = 0; h < 24; h++) hours += '<option value="' + h + '"' + (h === a.speed_hour ? ' selected' : '') + '>' + ((h % 12) || 12) + ':00 ' + (h < 12 ? 'AM' : 'PM') + '</option>';
        var html = '<div class="hic" style="background:' + GRAD.indigo + '">' + svg('pulse') + '</div><h2>Discord alerts</h2>' +
          '<p>Get notified in a Discord channel when something needs attention.</p>' +
          '<input class="mh-al-q" type="search" placeholder="Search alerts and schedules (e.g. VPN, upload, weekly)…" autocomplete="off" aria-label="Search alert settings">' +
          '<div class="mh-al-sec" data-k="setup webhook discord url channel send alerts on off pause">' +
          sw('enabled', a.enabled, 'Send alerts', a.has_webhook ? 'Webhook saved ' + a.hint : 'Add a webhook below first') +
          '<label for="mh-wh">Discord webhook URL</label><input id="mh-wh" type="password" autocomplete="off" placeholder="' + (a.has_webhook ? 'Saved (' + esc(a.hint) + '). Paste a new one to replace' : 'https://discord.com/api/webhooks/…') + '">' +
          '<p style="text-align:left;font-size:11px;margin-top:6px">In Discord: <b>Server Settings → Integrations → Webhooks → New Webhook</b>, choose the channel, then <b>Copy Webhook URL</b>. It’s stored on the router (root-only) and never shown here again.</p></div>' +
          '<div class="mh-mgrp" data-k="alert alerts notify notification message type"><h4>Alert me about</h4>' + T.map(function(t){ return sw('t-' + t[0], a.types[t[0]] !== false, t[1]); }).join('') + '</div>' +
          '<div class="mh-mgrp" data-k="threshold schedule time when"><h4>Thresholds &amp; schedule</h4>' +
            '<label class="mh-mrow"><span><b>Temperature limit</b><small>Alert after 5 minutes above this</small></span><span><input type="number" id="mh-tf" min="' + (TU === 'C' ? 49 : 120) + '" max="' + (TU === 'C' ? 104 : 220) + '" value="' + (TU === 'C' ? Math.round((a.temp_f - 32) * 5 / 9) : a.temp_f) + '" style="width:76px"> °' + TU + '</span></label>' +
            '<label class="mh-mrow" data-k="ping latency high wan internet lag"><span><b>High ping limit</b><small>Internet ping (best of Cloudflare, Google, Quad9) over this for 5 minutes. All clear after 10 minutes under 80% of it.</small></span><span><input type="number" id="mh-pm" min="20" max="1000" value="' + (a.ping_ms || 75) + '" style="width:76px"> ms</span></label>' +
            sw('adg_watch', a.adg_watch === true, 'Watch for unusual blocking (opt-in)', 'Off by default. Counts AdGuard’s blocked lookups per device every hour. If one device suddenly has 5x its usual blocked lookups (300+ in an hour), you get one message with the domains it was trying to reach: often a new app, sometimes malware calling home. Needs AdGuard on the NAS set up.') +
            sw('speed_daily', a.speed_daily, 'Nightly speed test', 'Internet + all VPN tunnels, about 15 GB per run') +
            sw('speed_retest', a.speed_retest !== false, 'Re-test a slow nightly result', 'If the Internet result is under ' + (a.isp_slow_pct || 70) + '% of your plan, test again 10 minutes later and count that one instead (fewer false “slower than your plan” alerts).') +
            '<label class="mh-mrow" data-k="nightly speed test time"><span><b>Run at</b></span><select id="mh-sh">' + hours + '</select></label>' +
            '<label class="mh-mrow"><span><b>Weekly report</b><small>Uptime, outages, speeds, VPN reliability, top devices</small></span><span><select id="mh-wd">' + dayOpts + '</select> <select id="mh-wh2">' + whours + '</select></span></label>' +
            '<label class="mh-mrow" data-k="monthly summary report"><span><b>Monthly summary</b><small>On the 1st of each month at the weekly report time: uptime, outages, VPN drops per provider, data used, new devices, security, auto-fixes</small></span><button class="mh-btn sec" data-m="mprev" style="margin:0">Preview</button></label><div data-mp></div>' +
            sw('wifi_report', a.wifi_report !== false, 'Weekly Wi-Fi report', 'Routers with Wi-Fi: at 3 AM on the weekly-report day, scans for neighboring networks and suggests a quieter channel, plus the week’s Wi-Fi health: weak-signal devices, devices dropped for a poor connection, connects/drops and radar (DFS) events.') + '</div>' +
          /* daily digest + muted types (2026-11-18) */
          (function(){
            var dt = Array.isArray(a.digest_types) ? a.digest_types : [], dh = a.digest_hour != null ? a.digest_hour : 18, hrs = '';
            for (var x = 0; x < 24; x++) hrs += '<option value="' + x + '"' + (x === dh ? ' selected' : '') + '>' + ((x % 12) || 12) + ':00 ' + (x < 12 ? 'AM' : 'PM') + '</option>';
            return '<div class="mh-mgrp" data-k="digest daily summary once a day batch quiet less urgent"><h4>Daily digest</h4>' +
              '<label class="mh-mrow" style="cursor:default"><span><b>Get these as one message a day</b><small>Less urgent alerts can wait: the ticked types arrive together once a day instead of one by one (Recent events still lists them right away).</small></span></label>' +
              DIGEST_TYPES.map(function(k){ return sw('dg-' + k, dt.indexOf(k) >= 0, KIND_NAMES[k] || k); }).join('') +
              '<label class="mh-mrow"><span><b>Send the digest at</b></span><select id="mh-dgh">' + hrs + '</select></label></div>';
          })() +
          (function(){
            var mu = a.mutes && typeof a.mutes === 'object' ? a.mutes : {}, now = Math.floor(Date.now() / 1000);
            var ks = Object.keys(mu).filter(function(k){ return mu[k] > now; });
            if (!ks.length) return '';
            return '<div class="mh-mgrp" data-k="muted mute silenced"><h4>Muted right now</h4>' + ks.map(function(k){
              return '<div class="mh-mrow"><span><b>' + esc(KIND_NAMES[k] || k) + '</b><small>until ' + esc(new Date(mu[k] * 1000).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })) + '</small></span><button class="mh-btn sec" data-m="unmute" data-k="' + esc(k) + '" style="margin:0">Unmute</button></div>'; }).join('') + '</div>';
          })() +
          /* the repair switches moved to their own window (Settings > Auto-heal, 2026-11-14); their messages still arrive here */
          '<div class="mh-mgrp" data-k="auto fix autofix auto-fix fixes self heal self-heal repair automatic reboot failover"><h4>Auto-heal</h4>' +
            '<label class="mh-mrow"><span><b>Moved to Settings → Auto-heal</b><small>The automatic repairs (VPN, internet, Wi-Fi, NAS, router storage, smart reboot, modem restart) now have their own window. Their messages still arrive here as alerts (mostly VPN and Router health).</small></span><button class="mh-btn sec" data-m="goheal" style="margin:0">Open</button></label></div>' +
          '<p class="mh-al-none" style="display:none">Nothing matches that search.</p>' +
          '<div class="err" data-e></div>' +
          '<div class="btns"><button data-m="cancel">Close</button><button data-m="test">Send test</button><button class="pri" data-m="save">Save</button></div>';
        var collect = function(md){
          var g = function(f){ var i = md.querySelector('[data-f="' + f + '"]'); return !!(i && i.checked); };
          var types = {}; T.forEach(function(t){ types[t[0]] = g('t-' + t[0]); });
          var p = { enabled: g('enabled'), types: types, temp_f: (function(v){ v = Number(v); if (!v) return 185; return TU === 'C' ? Math.round(v * 9 / 5 + 32) : v; })(md.querySelector('#mh-tf').value),   /* stored in °F */ ping_ms: Number(md.querySelector('#mh-pm').value) || 75, adg_watch: g('adg_watch'),
                    speed_daily: g('speed_daily'), speed_hour: Number(md.querySelector('#mh-sh').value),
                    /* the Auto-heal switches are NOT sent from here (own window now): the router keeps whatever they are */
                    wifi_report: g('wifi_report'), speed_retest: g('speed_retest'), weekly_day: Number(md.querySelector('#mh-wd').value), weekly_hour: Number(md.querySelector('#mh-wh2').value),
                    digest_types: DIGEST_TYPES.filter(function(k){ return g('dg-' + k); }), digest_hour: Number((md.querySelector('#mh-dgh') || {}).value || 18) };
          var w = md.querySelector('#mh-wh').value.trim(); if (w) p.webhook = w;
          return p;
        };
        var save = function(md){
          var e = md.querySelector('[data-e]'); e.style.color = ''; e.textContent = '';
          var p = collect(md);
          if (p.enabled && !p.webhook && !a.has_webhook) return Promise.reject(new Error('Add a webhook URL to turn alerts on'));
          return rpcx('machome', 'set_alerts', p).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'could not save'); if (p.webhook){ a.has_webhook = true; md.querySelector('#mh-wh').value = ''; } return r; });
        };
        var amd = self.openModal(html, {
          goheal: function(){ self.openAutoheal(); },
          unmute: function(md, b){
            var k = b.getAttribute('data-k'); b.disabled = true;
            rpcx('machome', 'alert_mute', { kind: k, secs: 0 }).then(function(r){
              if (!r || !r.ok) throw new Error('not saved');
              delete self.localMutes()[k]; if (a.mutes) delete a.mutes[k];
              var row = b.closest('.mh-mrow'); if (row) row.remove(); self.paint(); self.toast((KIND_NAMES[k] || k) + ' alerts unmuted');
            }).catch(function(){ b.disabled = false; self.toast('Couldn’t unmute'); });
          },
          mprev: function(md, b){
            var box = md.querySelector('[data-mp]'); b.disabled = true; box.innerHTML = '<p style="font-size:12px;text-align:left">Building the preview…</p>';
            rpcx('machome', 'monthly_preview', {}, 30000).then(function(r){
              b.disabled = false; if (!r || !r.ok){ box.textContent = 'Preview not available.'; return; }
              box.innerHTML = '<div style="text-align:left;font-size:12px;padding:8px 10px;border-radius:10px;background:var(--mh-row);margin:6px 0"><b>' + esc(r.month) + ' so far</b>' +
                (r.fields || []).map(function(f){ return '<div style="margin-top:6px"><b>' + esc(f.name) + '</b><br>' + esc(f.value).replace(/\n/g, '<br>') + '</div>'; }).join('') + '</div>';
            }).catch(function(e){ b.disabled = false; box.textContent = e.message; });
          },
          save: function(md, b){ b.disabled = true; save(md).then(function(){ self.closeModal(); self.toast('Alert settings saved'); rpc('machome','get_alerts').then(function(x){ self.mh.alerts = x; }); })
            .catch(function(err){ b.disabled = false; md.querySelector('[data-e]').textContent = err.message; }); },
          test: function(md, b){ b.disabled = true; b.textContent = 'Sending…'; var e = md.querySelector('[data-e]');
            save(md).then(function(){ return rpcx('machome', 'test_alert', {}, 20000); }).then(function(r){
              b.disabled = false; b.textContent = 'Send test';
              if (r && r.ok){ e.style.color = 'var(--mh-green)'; e.textContent = 'Test alert sent. Check your Discord channel.'; }
              else { e.style.color = ''; e.textContent = 'Discord didn’t accept it' + (r && r.code ? ' (HTTP ' + r.code + ')' : '') + '. Check the webhook URL.'; }
            }).catch(function(err){ b.disabled = false; b.textContent = 'Send test'; e.style.color = ''; e.textContent = err.message; }); }
        });
        /* search: every word must appear in the row's label/description or its section's name/keywords.
           Rows are only hidden (display:none), so Save still sends every setting. */
        var q = amd.querySelector('.mh-al-q');
        if (q) q.addEventListener('input', function(){
          var words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean), any = false;
          var hit = function(txt){ txt = txt.toLowerCase(); return words.every(function(w){ return txt.indexOf(w) > -1; }); };
          amd.querySelectorAll('.mh-al-sec, .mh-mgrp').forEach(function(g){
            var gt = (g.getAttribute('data-k') || '') + ' ' + ((g.querySelector('h4') || {}).textContent || ''), n = 0;
            if (g.classList.contains('mh-al-sec')){ n = !words.length || hit(gt + ' ' + g.textContent) ? 1 : 0; }
            else g.querySelectorAll('.mh-mrow').forEach(function(r){ var ok = !words.length || hit(gt + ' ' + (r.getAttribute('data-k') || '') + ' ' + r.textContent); r.style.display = ok ? '' : 'none'; if (ok) n++; });
            g.style.display = n ? '' : 'none'; if (n) any = true;
          });
          amd.querySelector('.mh-al-none').style.display = any ? 'none' : '';
        });
      });
    },
    /* 7-day reliability per tunnel/server (merged into the VPN card 2026-11-13; was its own "VPN Reliability" card).
       Returns { rows, best } — rows: k, label, provider, peer, active, uptime, loss, ping, stale, day, eve, hours, speed, tests. */
    relRows: function(){
      var m = this.mh, R = m.rel || {}, B = (R.rel && R.rel.buckets) || {}, C = R.cur || {}, S = R.speed || [], now = R.time || Math.floor(Date.now() / 1000);
      var keys = {}; Object.keys(B).forEach(function(k){ keys[k] = 1; }); Object.keys(C).forEach(function(k){ keys[k] = 1; });
      var rows = Object.keys(keys).map(function(k){
        var list = (B[k] || []).slice(); if (C[k]) list.push(C[k]);
        var a = { n: 0, loss: 0, lat: 0, latn: 0, down: 0, stale: 0, dl: 0, dn: 0, el: 0, en: 0, hours: list.length };
        var lastB = list[list.length - 1] || {};
        list.forEach(function(b){
          a.n += b.n; a.loss += b.loss; a.lat += b.lat; a.latn += b.latn; a.down += b.down; a.stale += b.stale;
          var hr = new Date(b.h * 1000).getHours();
          if (b.latn){ if (hr >= 8 && hr < 19){ a.dl += b.lat; a.dn += b.latn; } else if (hr >= 19){ a.el += b.lat; a.en += b.latn; } }
        });
        var sp = S.filter(function(e){ return e.kind === 'vpn' && e.label === lastB.label && e.down != null && now - e.time < 7 * 86400; });
        var avgDown = sp.length ? sp.reduce(function(s, e){ return s + e.down; }, 0) / sp.length : null;
        return { k: k, label: lastB.label || k.split('|')[0], provider: lastB.provider, peer: lastB.peer, active: !!C[k] || (now - (lastB.h || 0) < 7200),
          uptime: a.n ? 100 * (1 - a.down / a.n) : null, loss: a.n ? a.loss / a.n : null, ping: a.latn ? a.lat / a.latn : null,
          stale: a.stale, day: a.dn ? a.dl / a.dn : null, eve: a.en ? a.el / a.en : null, hours: a.hours, speed: avgDown, tests: sp.length };
      });
      var cand = rows.filter(function(r){ return r.active && r.hours >= 6 && r.uptime != null; });
      cand.sort(function(a, b){ return (b.uptime - a.uptime) || (a.loss - b.loss) || (a.ping - b.ping); });
      return { rows: rows, best: cand.length > 1 ? cand[0].k : null };
    },
    /* VPN Health card → "Clear all VPN alerts" (owner, 2026-11-16) */
    /* "↺ Clear" on a packet-loss warning (owner, 2026-11-16): start that line's 10-minute loss check fresh */
    doLossClear: function(via){
      var self = this, m = this.mh, L = (m.stats && m.stats.live) || {};
      rpcx('machome', 'loss_clear', { via: via }, 15000).then(function(r){
        if (!r || r.ok === false) throw new Error((r && r.err) || 'the router returned an error');
        if (L.pl) L.pl[via] = []; if (L.ph) L.ph[via] = [];
        self.paint();
        self.toast('Packet-loss check restarted' + (via === 'wan' ? ' for your internet' : '') + '. It comes back only if new loss shows up.');
        self.refreshSoon(12000);
      }).catch(function(e){ self.toast('Couldn’t clear it: ' + ((e && e.message) || 'error')); });
    },
    doVpnClear: function(){
      var self = this;
      this.confirm({ title: 'Clear all VPN alerts?', icon: 'pulse', grad: GRAD.orange, ok: 'Clear', working: 'Clearing…',
        body: '<p>This clears every VPN warning (including tunnels that are turned off or no longer exist), moves any devices back to their own tunnels, and resets the drop and blip history on this card.</p>' +
              '<p>Every tunnel is then checked from scratch: one that really is down shows up again within about 30 seconds. Recent events keeps its history.</p>' },
        function(){ return rpcx('machome', 'vpn_clear', {}, 15000).then(function(r){
          if (!r || r.ok === false) throw new Error((r && r.err) || 'the router returned an error');
          return 'VPN alerts cleared; tunnels are being re-checked';
        }); });
    },
    /* VPN monitor (owner, 2026-11-15): "Monitor 5 h" button in the VPN Health header; countdown while it runs */
    /* "It's always DNS, Hub" (owner, 2026-11-16): dock easter egg. Every DNS setting of this network in one window,
       how a lookup travels, who answers, a live DNS race and some DNS trivia. Data: rpc machome.dns_hub (read-only). */
    openDnsHub: function(){
      var self = this, m = this.mh;
      var html = '<div class="hic" style="background:' + GRAD.red + '">' + svg('dnsq') + '</div><h2>It’s always DNS, Hub</h2>' +
        '<div class="mh-dhb"><p style="text-align:center;color:var(--mh-text2)">Asking every DNS server what it’s up to…</p></div>' +
        '<div class="btns"><button data-m="cancel">Close</button></div>';
      var md = this.openModal(html, { race: function(md2){ self.dnsRace(md2); }, trace: function(md2){ self.dnsTrace(md2); } });
      var sh = md.querySelector('.sheet'); if (sh) sh.classList.add('mh-dnsw');
      md.addEventListener('keydown', function(e){ if (e.key === 'Enter' && e.target && e.target.id === 'mh-dnsq'){ e.preventDefault(); self.dnsRace(md); }
        else if (e.key === 'Enter' && e.target && e.target.id === 'mh-dnst'){ e.preventDefault(); self.dnsTrace(md); } });
      rpc('machome', 'dns_hub').then(function(r){
        var b = md.querySelector('.mh-dhb'); if (!b || !document.body.contains(md)) return;
        m.dnsHub = r || {}; b.innerHTML = self.dnsHubHtml(m.dnsHub);
      }).catch(function(){ var b = md.querySelector('.mh-dhb'); if (b) b.innerHTML = '<p>Couldn’t read the DNS settings. (Was it DNS? It was DNS.)</p>'; });
    },
    dnsHubHtml: function(r){
      var m = this.mh, priv = m.priv;
      var NM = { '9.9.9.9': 'Quad9', '149.112.112.112': 'Quad9', '1.1.1.1': 'Cloudflare', '1.0.0.1': 'Cloudflare', '8.8.8.8': 'Google', '8.8.4.4': 'Google',
        '208.67.222.222': 'OpenDNS', '208.67.220.220': 'OpenDNS', '94.140.14.14': 'AdGuard DNS', '94.140.15.15': 'AdGuard DNS', '103.86.96.100': 'NordVPN DNS', '103.86.99.100': 'NordVPN DNS', '127.0.0.1': 'this router' };
      var lanIp = function(ip){ return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|fd|fe80)/i.test(String(ip || '')); };
      var ipv = function(ip){ return priv && lanIp(ip) && ip !== '127.0.0.1' ? '•••' : String(ip); };
      var dn = function(ip){ return esc(ipv(ip)) + (NM[ip] ? ' <small>(' + NM[ip] + ')</small>' : ''); };
      var list = function(a){ return (a && a.length) ? a.map(dn).join(', ') : '—'; };
      var up = function(u){   /* AdGuard upstream string -> friendly */
        var s = String(u), who = /quad9/i.test(s) ? 'Quad9' : /cloudflare|1\.1\.1\.1|1\.0\.0\.1/i.test(s) ? 'Cloudflare' : /google|8\.8\.8\.8|8\.8\.4\.4/i.test(s) ? 'Google' : /adguard/i.test(s) ? 'AdGuard DNS' : /nextdns/i.test(s) ? 'NextDNS' : /opendns|umbrella/i.test(s) ? 'OpenDNS' : (NM[s] || '');
        var how = /^https:/i.test(s) ? 'DoH 🔐' : /^tls:/i.test(s) ? 'DoT 🔐' : /^quic:/i.test(s) ? 'DoQ 🔐' : /^sdns:/i.test(s) ? 'DNSCrypt 🔐' : 'plain';
        if (/^\[\//.test(s)) return 'per-domain rule';
        return (who || (priv ? 'custom' : esc(s.replace(/^https?:\/\//, '').slice(0, 40)))) + ' · ' + how;
      };
      var chip = function(t, sub, tone){ return '<span class="mh-dc' + (tone ? ' ' + tone : '') + '"><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; };
      var arrow = '<span class="mh-da">→</span>';
      var lv = (r.live && r.live.dns) || {}, ok = lv.ok === true, dm = r.dnsmasq || {}, gl = r.gl || {}, lan = r.lan || {}, nas = r.nas_adg, nd = (nas && nas.dns) || {};
      var isAP = r.mode === 'ap', bad = !ok || (dm.running === false && !isAP);   /* an access point's own DNS is off on purpose */
      /* verdict */
      var h = '<div class="mh-dv ' + (bad ? 'bad' : 'ok') + '">' + (bad ? '🔴 It’s DNS. It’s always DNS.' : '🟢 It’s not DNS. <small>(This time.)</small>') + '<span>' +
        (lv.server ? esc(nas && lv.server === nas.host ? 'AdGuard on your NAS' : 'Your DNS server') + ' ' + (ok ? 'answered in ' + (lv.ms != null ? lv.ms + ' ms' : 'time') : 'isn’t answering (' + esc(lv.status || 'no reply') + ')') : 'Checking…') + (dm.running === false && !isAP ? ' · the router’s DNS service is NOT running' : '') + '</span></div>';
      /* how a lookup travels: a complete map (owner, 2026-11-16: every "overridden" says what replaced it) */
      var devDns = (lan.dhcp && lan.dhcp.length) ? lan.dhcp : null;
      var devIsNas = devDns && nas && devDns.indexOf(nas.host) > -1;
      var devOffRouter = devDns && devDns.indexOf(lan.router) < 0 && devDns.indexOf('127.0.0.1') < 0;   /* devices ask another box directly */
      var who = (r.who && r.who.names && r.who.names.length) ? r.who.names.map(esc).join(', ') : '?';
      var wa0 = (r.wan && r.wan.active && r.wan.active.length) ? r.wan.active : (r.wan && r.wan.set) || [];
      var gm = ({ manual: 'Manual', auto: 'Automatic' })[gl.mode] || gl.mode || '?';
      /* where the router's own DNS (dnsmasq) sends lookups */
      var radg = r.router_adg && r.router_adg.enabled && r.router_adg.dns;
      var rUpT = radg ? 'AdGuard on this router' : gl.mode === 'manual' ? 'GL Manual DNS' : gl.mode === 'auto' ? 'WAN DNS (automatic)' : 'GL DNS: ' + esc(gm);
      var rUpS = radg ? 'blocks ads, then its own upstream' : list(gl.mode === 'manual' && gl.manual && gl.manual.length ? gl.manual : gl.mode === 'auto' ? wa0 : dm.servers);
      var rUp = function(pre){ return chip((pre || '') + rUpT, rUpS, radg ? 'teal' : ''); };
      var nasUp = nd.ok ? ((nd.upstream || []).slice(0, 2).map(up).join('<br>') + ((nd.upstream || []).length > 2 ? '<br>+' + (nd.upstream.length - 2) + ' more' : '')) : 'couldn’t read AdGuard’s settings';
      var answered = arrow + chip('🌐 Answered by', who + (r.who && r.who.ispleak ? ' ⚠ your ISP can see lookups' : ''), r.who && r.who.ispleak ? 'warn' : 'ok');
      /* the chain a normal device's lookup takes */
      var devChain = devIsNas ? chip('AdGuard on your NAS', esc(ipv(nas.host)) + ' · blocks ads & trackers', 'teal') + arrow + chip('AdGuard’s upstream', nasUp)
        : devOffRouter ? chip('LAN DNS', list(devDns))
        : chip('This router', 'dnsmasq' + (lan.router ? ' · ' + esc(ipv(lan.router)) : '')) + arrow + rUp();
      var lane = function(icon, title, sub){ return chip(icon + ' ' + title, sub); };
      h += '<div class="mh-dsec">How a lookup travels</div><div class="mh-dflow">';
      if (r.mode === 'ap') h += '<div class="mh-dfr">' + lane('📱', 'Your devices') + arrow + chip('The main router', 'this is an access point: DHCP and DNS come from the main router') + '</div>';
      else {
        h += '<div class="mh-dfr">' + lane('📱', 'Your devices', 'told to use the LAN DNS') + arrow + devChain + answered + '</div>';
        if (gl.force) h += '<div class="mh-dfr">' + lane('🚫', 'Devices with their own DNS', 'e.g. a phone set to 8.8.8.8') + arrow +
          chip('Redirected to this router', 'Override clients’ DNS is on', 'warn') + arrow + rUp() + '</div>';
        h += '<div class="mh-dfr">' + lane('📦', 'This router itself', 'its own lookups') + arrow + chip('dnsmasq', 'GL DNS: ' + esc(gm) + ' · cache ' + (dm.cache || 0) + ' names') + arrow + rUp() + '</div>';
        if (wa0.length) h += '<div class="mh-dfr">' + lane('🌐', 'WAN DNS', list(wa0)) + arrow +
          (dm.noresolv || gl.mode === 'manual' || radg ? chip('Not used for lookups', 'the router uses ' + rUpT + ' instead', 'muted') : chip('Used by the router', 'GL DNS is Automatic', 'ok')) + '</div>';
      }
      (r.vpn || []).filter(function(v){ return v.enabled; }).forEach(function(v){
        var vd = (v.dns && v.dns.length) ? v.dns : (v.resolv || []);
        var vdc = function(tone){ return chip('VPN DNS', vd.length ? list(vd) : 'none set', tone); };
        h += '<div class="mh-dtun"><div class="mh-dth">🔒 ' + esc(v.name || v.via) + '<small>' + esc(v.provider || '') + (v.server && !priv ? ' · ' + esc(v.server) : '') + '</small></div>';
        if (r.mode !== 'ap'){
          /* lane 1: the devices that use this tunnel */
          h += '<div class="mh-dfr">' + lane('📱', 'Its devices', devOffRouter ? 'ask the LAN DNS directly, inside your network' : 'ask this router') + arrow +
            (devOffRouter ? devChain + answered + '<span class="mh-dnote">The tunnel’s own DNS isn’t used for them.</span>'
              : chip('This router', 'dnsmasq') + arrow + (gl.override_vpn ? vdc('struck') + arrow + rUp('Overridden by ') : vdc('ok'))) + '</div>';
        }
        /* lane 2: the router's own lookups that follow this tunnel */
        h += '<div class="mh-dfr">' + lane('📦', 'Router lookups', 'that follow this tunnel') + arrow +
          (gl.override_vpn ? vdc('struck') + arrow + rUp('Overridden by ') : vdc('ok') + arrow + chip('Used', 'through the tunnel', 'ok')) + '</div></div>';
      });
      h += '</div>';
      /* every setting */
      var kvr = function(k, v, hint){ return '<div class="mh-dk"><span>' + k + '</span><b>' + v + '</b>' + (hint ? '<small>' + hint + '</small>' : '') + '</div>'; };
      var wa = (r.wan && r.wan.active && r.wan.active.length) ? r.wan.active : (r.wan && r.wan.set) || [];
      var ad = m.nasAdg || {};
      var dh = (r.live && r.live.dh) || [], okn = dh.filter(function(x){ return x >= 0; }), avg = okn.length ? Math.round(okn.reduce(function(a, b){ return a + b; }, 0) / okn.length) : null;
      h += '<div class="mh-dsec">Every DNS setting</div><div class="mh-dgrid">' +
        kvr('WAN DNS', list(wa), r.wan && r.wan.peerdns === '0' ? 'Set by you: your ISP’s DNS is ignored' : 'From your internet provider') +
        kvr('LAN DNS', devDns ? list(devDns) : (r.mode === 'ap' ? 'From the main router' : 'This router'), 'What your devices are told to use') +
        kvr('GL DNS page', esc(({ manual: 'Manual', auto: 'Automatic' })[gl.mode] || gl.mode || '?') + ((gl.manual && gl.manual.length) ? ' · ' + list(gl.manual) : ''), 'Where the router’s own DNS sends lookups') +
        kvr('Router DNS service', isAP ? 'Off (normal)' : dm.running === false ? '<span style="color:var(--mh-red)">Not running</span>' : 'Running', isAP ? 'Access point: the main router answers DNS' : 'dnsmasq · remembers up to ' + (dm.cache || 0) + ' answers') +
        kvr('Override VPN DNS', gl.override_vpn ? 'On' : 'Off', gl.override_vpn ? 'VPN lookups use the Manual DNS too' : 'Each tunnel uses its VPN’s DNS') +
        kvr('Override clients’ DNS', gl.force ? 'On' : 'Off', gl.force ? 'Devices that ask other DNS servers on the internet are redirected to the router' : 'Devices may use any DNS server') +
        kvr('Rebind protection', gl.rebind ? 'On' : 'Off', 'Blocks answers that point at your own network (DNS-rebinding attacks)') +
        kvr('IPv6 DNS', (lan.dhcpv6 === 'disabled' && lan.ra === 'disabled') ? 'Off' : 'On', (lan.dhcpv6 === 'disabled' && lan.ra === 'disabled') ? 'IPv6 isn’t handed out, so nothing leaks around it' : 'Devices also get DNS over IPv6') +
        kvr('AdGuard on this router', r.router_adg && r.router_adg.enabled ? 'On' : 'Off') +
        kvr('AdGuard on your NAS', nas ? esc(ipv(nas.host)) + (nd.ok ? (nd.dnssec ? ' · DNSSEC ✓' : ' · DNSSEC off') : '') : 'Not connected',
          nas ? (nd.ok ? (nd.mode ? 'Upstream mode: ' + esc(nd.mode) : '') + (nd.cache ? ' · cache ' + Math.round(nd.cache / 1024) + ' KB' : '') : 'couldn’t read its DNS settings') : 'Connect it on the AdGuard card') +
        (ad.ok ? kvr('AdGuard today', Number(ad.queries || 0).toLocaleString() + ' lookups', (ad.queries ? Math.round((ad.blocked || 0) * 100 / ad.queries) + '% blocked · ' : '') + (ad.avg_ms != null ? ad.avg_ms + ' ms average' : '')) : '') +
        kvr('DNS health (10 min)', dh.length ? Math.round(okn.length * 100 / dh.length) + '% answered' : '—', avg != null ? 'average ' + avg + ' ms · checked every 10 s' : '') +
        '</div>';
      /* who answers, over time */
      var hist = r.whohist || [], cnt = {}; hist.forEach(function(x){ var k = x.n || '?'; cnt[k] = (cnt[k] || 0) + 1; });
      h += '<div class="mh-dsec">Who answers your devices</div><p class="mh-dp">' + (r.who ? '<b>' + who + '</b>' + (r.who.t ? ' · checked ' + ago(Math.floor(Date.now() / 1000) - r.who.t) : '') : 'Not checked yet (the hourly leak test does it).') +
        (hist.length ? '<br><small>Last ' + hist.length + ' hourly checks: ' + Object.keys(cnt).map(function(k){ return esc(k) + ' ×' + cnt[k]; }).join(' · ') + '</small>' : '') + '</p>';
      /* race */
      h += '<div class="mh-dsec">🏁 DNS Race</div><div class="mh-drace"><input id="mh-dnsq" type="text" value="' + esc(m.dnsRaceQ || 'example.com') + '" spellcheck="false" autocomplete="off" aria-label="Domain to look up">' +
        '<button class="pri" data-m="race">Race!</button></div><div class="mh-drr">' + this.dnsRaceHtml(m.dnsRaceRes) + '</div>';
      /* lookup map */
      h += '<div class="mh-dsec">&#128506; Lookup map</div><div class="mh-drace"><input id="mh-dnst" type="text" value="' + esc(m.dnsTraceQ || 'weather.com') + '" spellcheck="false" autocomplete="off" aria-label="Domain to map">' +
        '<button class="pri" data-m="trace">Map it</button></div><div class="mh-dtr">' + this.dnsTraceHtml(m.dnsTraceRes) + '</div>';
      /* trivia */
      var F = ['DNS was created in 1983 by Paul Mockapetris (RFC 882 and 883).', 'There are 13 root server names (a to m.root-servers.net), answered by well over a thousand machines around the world.',
        'DNS normally uses port 53, and most lookups are a single UDP packet each way.', 'Google Public DNS (8.8.8.8) launched in December 2009.', 'Cloudflare launched 1.1.1.1 on April 1, 2018. It wasn’t a joke.',
        'Quad9 (9.9.9.9) launched in 2017 and refuses to answer for domains known to spread malware.', 'TTL (time to live) is how many seconds an answer may be remembered before it must be asked again.',
        'A full DNS name can be up to 253 characters, and each part between the dots up to 63.', 'DNSSEC signs DNS answers so they can’t be forged on the way to you.',
        'DNS over HTTPS (DoH) hides your lookups inside normal web traffic, so the network in between can’t read them.', '.com is the biggest top-level domain, with well over 150 million names.'];
      h += '<div class="mh-dfun"><div class="mh-dhaiku">It’s not DNS.<br>There’s no way it’s DNS.<br>It was DNS.</div><div><b>DNS fact</b><br>' + F[Math.floor(Math.random() * F.length)] + '</div></div>';
      return h;
    },
    dnsRaceHtml: function(R){
      if (!R) return '<p class="mh-dp"><small>Looks up the same name at every DNS server this network has, all at once: AdGuard, this router, Quad9, Cloudflare and Google directly, and through each VPN tunnel.</small></p>';
      if (R.running) return '<p class="mh-dp">On your marks… 🏁</p>';
      if (R.err) return '<p class="mh-dp" style="color:var(--mh-red)">' + esc(R.err) + '</p>';
      var priv = this.mh.priv, rs = (R.results || []).slice();
      var okr = rs.filter(function(x){ return x.ok && x.ms != null; }).sort(function(a, b){ return a.ms - b.ms; }), bad = rs.filter(function(x){ return !(x.ok && x.ms != null); });
      var medal = ['🥇', '🥈', '🥉'];
      var row = function(x, i, slow){
        var lan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(x.server || '');
        return '<div class="mh-drow' + (x.ok ? '' : ' bad') + '"><span class="md">' + (x.ok ? (medal[i] || (slow ? '🐢' : '')) : '❌') + '</span><span class="lb"><b>' + esc(x.label) + '</b><small>' +
          esc(x.path) + ' · ' + esc(priv && lan ? '•••' : x.server) + '</small></span><span class="rt">' + (x.ok ? x.ms + ' ms<small>' + esc(x.answer || '') + '</small>' : 'It was DNS.<small>' + esc(x.status || 'no answer') + '</small>') + '</span></div>';
      };
      return '<p class="mh-dp"><small>' + esc(R.domain || '') + ' · ' + (R.t ? hhmm(R.t) : '') + '</small></p>' +
        okr.map(function(x, i){ return row(x, i, okr.length > 3 && i === okr.length - 1); }).join('') + bad.map(function(x){ return row(x, 99, false); }).join('');
    },
    /* DNS hub "Lookup map" (owner, 2026-11-16): what it took to resolve one name, step by step (rpc dns_trace) */
    dnsTraceHtml: function(T){
      if (!T) return '<p class="mh-dp"><small>Type a name (e.g. weather.com) to see every step it takes: your DNS (and whether AdGuard blocked it, remembered it or asked its upstream), then the full chain from a root server down to the site’s own servers.</small></p>';
      if (T.running) return '<p class="mh-dp">Following the trail… 🔎</p>';
      if (T.err) return '<p class="mh-dp" style="color:var(--mh-red)">' + esc(T.err) + '</p>';
      var m = this.mh, priv = m.priv, H = m.dnsHub || {}, f = T.first || {}, a = T.adg, hops = (T.trace && T.trace.hops) || [];
      var lanIp = function(ip){ return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(String(ip || '')); };
      var ipv = function(ip){ return priv && lanIp(ip) ? '•••' : String(ip || ''); };
      var step = function(ic, title, sub, tone){ return '<div class="mh-dst' + (tone ? ' ' + tone : '') + '"><span class="ic">' + ic + '</span><div><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>'; };
      var gap = function(t){ return '<div class="mh-dsg">' + (t || '') + '</div>'; };
      var dom = esc(T.domain || '');
      var firstA = (f.answer || []).filter(function(x){ return x.type === 'A'; })[0];
      var upName = function(u){ var s = String(u || ''); return /quad9/i.test(s) ? 'Quad9' : /cloudflare|1\.1\.1\.1/i.test(s) ? 'Cloudflare' : /google|8\.8\.8\.8/i.test(s) ? 'Google' : /adguard/i.test(s) ? 'AdGuard DNS' : /nextdns/i.test(s) ? 'NextDNS' : (priv ? 'its upstream' : s.replace(/^https?:\/\//, '').replace(/:\d+\/.*$/, '').slice(0, 40)); };
      var upHow = function(u){ var s = String(u || ''); return /^https:/i.test(s) ? 'DoH 🔐' : /^tls:/i.test(s) ? 'DoT 🔐' : /^quic:/i.test(s) ? 'DoQ 🔐' : 'plain DNS'; };
      var h = '<div class="mh-dmap">' + step('📱', 'You asked for ' + dom, 'this router asked on a device’s behalf, the same way your devices do');
      /* who your devices ask */
      var blocked = a && a.ok && /^Filtered/.test(a.reason || '') && !/Allow/i.test(a.reason || '');
      if (f.kind === 'nas_adguard'){
        h += gap(f.ms != null ? f.ms + ' ms in total' : '');
        h += step('🛡', 'AdGuard on your NAS', esc(ipv(f.server)) + ' · ' + (blocked ? '<span style="color:var(--mh-red)">blocked</span>' + (a.rule ? ' by the rule “' + esc(a.rule) + '”' : ' by a filter list') : (!a || !a.ok) ? 'couldn’t read its query log' : a.none ? 'not found in its query log (is the log turned off?)' : a.cached ? 'answered from its memory (cache), so it didn’t need to ask anyone' : 'not blocked · not in its memory, so it asked its upstream'), blocked ? 'bad' : 'teal');
        if (a && a.ok && !a.none && !blocked && !a.cached && a.upstream){
          h += gap(a.elapsed != null ? Math.round(a.elapsed) + ' ms' : '');
          h += step('🔐', upName(a.upstream) + ' · ' + upHow(a.upstream), 'AdGuard’s upstream answered' + (a.elapsed != null ? ' in ' + Math.round(a.elapsed) + ' ms' : ''));
        }
      } else if (f.kind === 'router'){
        var gl = H.gl || {}, ups = (gl.manual && gl.manual.length) ? gl.manual : ((H.dnsmasq || {}).servers || []);
        h += gap(f.ms != null ? f.ms + ' ms in total' : '') + step('📦', 'This router (dnsmasq)', 'answered from its memory or asked its upstream') + gap() +
          step('🌐', 'Router’s upstream', esc(ups.join(', ') || '?'));
      } else {
        h += gap(f.ms != null ? f.ms + ' ms in total' : '') + step('🗄', 'Your LAN DNS', esc(ipv(f.server)));
      }
      /* behind the scenes: the full chain */
      if (hops.length){
        h += '<div class="mh-dbs">Behind the scenes: what a resolver like ' + esc(a && a.upstream ? upName(a.upstream) : 'Quad9') + ' does when it doesn’t already know the answer (replayed live by this router)</div>';
        var zoneLabel = function(z){ z = String(z || ''); if (z === '.' || z === '') return 'root server'; var n = z.replace(/\.$/, ''); return n.indexOf('.') < 0 ? '.' + n + ' server' : n + '’s own server'; };
        var prevZone = null;
        hops.forEach(function(x, i){
          if (i === 0 && x.kind === 'referral' && x.zone === '.'){
            h += step('📋', 'Got the list of the ' + (x.ns || 13) + ' root servers', 'from ' + esc(ipv(x.server)) + (x.ms != null ? ' · ' + x.ms + ' ms' : ''), 'muted');
            prevZone = '.'; return;
          }
          var who = prevZone ? zoneLabel(prevZone) : 'server', ic = prevZone === '.' ? '🌍' : (prevZone && String(prevZone).replace(/\.$/, '').indexOf('.') < 0) ? '🏷' : '🏠';
          var said = x.kind === 'referral' ? '“ask the ' + esc(zoneLabel(x.zone)) + 's”' + (x.ns_example ? ' (' + esc(String(x.ns_example).replace(/\.$/, '')) + (x.ns > 1 ? ' + ' + (x.ns - 1) + ' more' : '') + ')' : '')
            : x.kind === 'answer' ? '“' + dom + ' is ' + esc((x.answer || []).map(function(r){ return r.type === 'CNAME' ? '→ ' + String(r.value).replace(/\.$/, '') : r.value; }).join(', ')) + '”' : 'the reply came back empty';
          h += gap(x.ms != null ? x.ms + ' ms' : '') + step(ic, (who.charAt(0).toUpperCase() + who.slice(1)) + ' · ' + esc(String(x.server).replace(/\.$/, '')), 'said ' + said, x.kind === 'answer' ? 'ok' : '');
          if (x.kind === 'referral') prevZone = x.zone;
        });
        if (!(T.trace && T.trace.ok)) h += '<p class="mh-dp"><small>The trail went cold: a step came back empty, so something in between answered instead of the real server. ' +
          (H.mode === 'ap' ? 'This is an access point, and the main router redirects DNS sent to outside servers (“Override clients’ DNS”), so the full trail can only be followed on the main router.' : 'DNS redirection along the way (for example a VPN or “Override clients’ DNS” on an upstream router) does this.') + '</small></p>';
      }
      /* the answer */
      var ans = (blocked ? (f.answer || []) : (f.answer || [])).filter(function(x){ return x.type === 'A'; });
      h += gap() + step(blocked ? '🚫' : '✅', blocked ? 'Blocked: your devices get no real address' : (ans.length ? dom + ' = ' + esc(ans.map(function(x){ return x.value; }).join(', ')) : 'No address came back (' + esc(f.status || 'no answer') + ')'),
        (!blocked && firstA && firstA.ttl != null) ? 'remembered for ' + (firstA.ttl < 120 ? firstA.ttl + ' s' : Math.round(firstA.ttl / 60) + ' min') + ' (TTL), then asked again' : '', blocked ? 'bad' : (ans.length ? 'ok' : 'bad'));
      var last = hops.length && hops[hops.length - 1].kind === 'answer' ? (hops[hops.length - 1].answer || []).filter(function(x){ return x.type === 'A'; }).map(function(x){ return x.value; }) : [];
      if (ans.length && last.length && last.join() !== ans.map(function(x){ return x.value; }).join()) h += '<p class="mh-dp"><small>The replay got a different address: big sites use content networks (CDNs), so each resolver can be sent to a different nearby server. Both are correct.</small></p>';
      return h + '</div>';
    },
    dnsTrace: function(md){
      var self = this, m = this.mh, inp = md.querySelector('#mh-dnst'), box = md.querySelector('.mh-dtr'), btn = md.querySelector('[data-m=trace]');
      if (!inp || !box || (btn && btn.disabled)) return;
      m.dnsTraceQ = inp.value.trim() || 'weather.com';
      if (btn) btn.disabled = true;
      m.dnsTraceRes = { running: true }; box.innerHTML = this.dnsTraceHtml(m.dnsTraceRes);
      var done = function(res){ if (btn) btn.disabled = false; m.dnsTraceRes = res; if (document.body.contains(md)) box.innerHTML = self.dnsTraceHtml(res); };
      rpcx('machome', 'dns_trace', { domain: m.dnsTraceQ }, 15000).then(function(r){
        if (!r || r.ok === false) return done({ err: (r && r.err) || 'the router returned an error' });
        var n = 0;
        (function poll(){
          setTimeout(function(){
            rpc('machome', 'dns_trace_result').then(function(x){
              if (x && !x.running && x.t >= r.started) return done(x);
              if (++n > 25) return done({ err: 'the lookup map didn’t finish in time' });
              poll();
            }).catch(function(){ done({ err: 'couldn’t read the result' }); });
          }, 800);
        })();
      }).catch(function(e){ done({ err: (e && e.message) || 'error' }); });
    },
    dnsRace: function(md){
      var self = this, m = this.mh, inp = md.querySelector('#mh-dnsq'), box = md.querySelector('.mh-drr'), btn = md.querySelector('[data-m=race]');
      if (!inp || !box || (btn && btn.disabled)) return;
      m.dnsRaceQ = inp.value.trim() || 'example.com';
      if (btn) btn.disabled = true;
      m.dnsRaceRes = { running: true }; box.innerHTML = this.dnsRaceHtml(m.dnsRaceRes);
      var done = function(res){ if (btn) btn.disabled = false; m.dnsRaceRes = res; if (document.body.contains(md)) box.innerHTML = self.dnsRaceHtml(res); };
      rpcx('machome', 'dns_race', { domain: m.dnsRaceQ }, 15000).then(function(r){
        if (!r || r.ok === false) return done({ err: (r && r.err) || 'the router returned an error' });
        var n = 0;
        (function poll(){
          setTimeout(function(){
            rpc('machome', 'dns_race_result').then(function(x){
              if (x && !x.running && x.t >= r.started) return done(x);
              if (++n > 14) return done({ err: 'the race didn’t finish in time' });
              poll();
            }).catch(function(){ done({ err: 'couldn’t read the result' }); });
          }, 800);
        })();
      }).catch(function(e){ done({ err: (e && e.message) || 'error' }); });
    },
    vwLoad: function(){
      var self = this, m = this.mh;
      return rpc('machome', 'vpnwatch_status').then(function(r){
        if (!m.alive || !r) return; m.vw = r; if (r.now) m.vwOff = r.now - Date.now() / 1000; self.paint();
      }).catch(function(){});
    },
    vwLeft: function(end){
      var s = Math.max(0, Math.floor((end || 0) - (Date.now() / 1000 + (this.mh.vwOff || 0))));
      var h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
      return h + ':' + (mi < 10 ? '0' : '') + mi + ':' + (se < 10 ? '0' : '') + se;
    },
    vwTick: function(){
      var self = this, v = this.mh.vw; if (!v || !v.running || !this.$el) return;
      var txt = this.vwLeft(v['end']);
      Array.prototype.forEach.call(this.$el.querySelectorAll('.mh-vwcd'), function(e){ if (e.textContent !== txt) e.textContent = txt; });
      if (txt === '0:00:00' && !this.mh.vwPoll) this.mh.vwPoll = setTimeout(function(){ self.mh.vwPoll = null; self.vwLoad(); }, 20000);
    },
    vwBtn: function(){
      var v = this.mh.vw || {}, run = !!v.running;
      return '<button class="mh-btn ' + (run ? '' : 'sec ') + 'mh-vwb" data-act="vwatch" title="' +
        (run ? 'Monitoring every tunnel. Click to stop early (the summary is still sent).' : 'Watch every tunnel closely for 5 hours and get one summary in Discord') + '">' +
        (run ? '■ <span class="mh-vwcd">' + this.vwLeft(v['end']) + '</span> left' : '▶ Monitor 5 h') + '</button>';
    },
    vwSub: function(){
      var v = this.mh.vw || {}, now = Date.now() / 1000 + (this.mh.vwOff || 0);
      if (v.running){
        var n = 0; Object.keys(v.per || {}).forEach(function(k){ n += (v.per[k].stalls || 0); });
        return 'Monitoring all tunnels · summary at ' + hhmm(v['end']) + (v.per ? ' · ' + n + ' stall' + (n === 1 ? '' : 's') + ' so far' : '');
      }
      if (v.lost) return 'The last monitor stopped early (the router restarted)';
      if (v.finished && now - v.finished < 12 * 3600)
        return 'Last monitor ' + hhmm(v.start) + '–' + hhmm(v.finished) + (v.sent ? ': summary sent to Discord' : ': summary saved on the router');
      return 'Live checks through each tunnel';
    },
    doVpnWatch: function(){
      var self = this, m = this.mh, v = m.vw || {};
      var al = (((m.stats || {}).live || {}).x || {}).alerts || {};
      if (v.running){
        return this.confirm({ title: 'Stop the VPN monitor?', icon: 'pulse', grad: GRAD.orange, ok: 'Stop', working: 'Stopping…',
          body: '<p>It has been running since ' + hhmm(v.start) + '. The summary of what it saw so far is still sent' + (al.enabled && al.configured ? ' to Discord' : '') + '.</p>' },
          function(){ return rpcx('machome', 'vpnwatch_stop', {}, 15000).then(function(r){
            if (!r || r.ok === false) throw new Error((r && r.err) || 'the router returned an error');
            setTimeout(function(){ self.vwLoad(); }, 8000); return 'Stopping the monitor; the summary is on its way';
          }); });
      }
      var discord = al.enabled && al.configured;
      this.confirm({ title: 'Monitor all VPN tunnels for 5 hours?', icon: 'pulse', grad: GRAD.green, ok: 'Start', working: 'Starting…',
        body: '<p>Every few seconds, each tunnel gets pings to three servers, plus a domain lookup and a web page through the tunnel. It only checks; nothing is changed.</p>' +
          '<p>' + (discord ? 'When it’s done (about ' + hhmm(Date.now() / 1000 + 18000) + '), one summary goes to Discord.'
                           : '<b>Discord alerts are off</b>, so the summary is only saved on the router. Turn them on in Settings → Discord alerts.') +
          ' The button counts down, and you can stop it early.</p>' },
        function(){ return rpcx('machome', 'vpnwatch_start', {}, 15000).then(function(r){
          if (!r || r.ok === false) throw new Error((r && r.err) || 'the router returned an error');
          m.vw = { running: true, start: r.start, 'end': r['end'], now: r.start }; m.vwOff = r.start - Date.now() / 1000; self.paint();
          setTimeout(function(){ self.vwLoad(); }, 10000);
          return 'VPN monitor started: 5 hours';
        }); });
    },
    /* VPN Health card: a plain-language checklist per tunnel (pings, domain lookup, web page, handshake, drops) */
    vhHtml: function(vlist, L, now){
      var X = (L.x && L.x.vh) || {}, P = L.ping || {}, inc = (L.x && L.x.inc) || {}, fo = inc.failover || {};
      var tl = vlist.filter(function(v){ return v.enabled && /^(wgclient|ovpnclient)\d+$/.test(v.via || ''); });
      var I = { ok: '<i style="color:var(--mh-green)">✓</i>', bad: '<i style="color:var(--mh-red)">✗</i>', warn: '<i style="color:var(--mh-orange)">!</i>', wait: '<i style="color:var(--mh-text3)">…</i>' };
      var line = function(st, what, detail){ return '<div class="mh-vk">' + I[st] + '<span><em>' + what + '</em>' + (detail ? ' · ' + detail : '') + '</span></div>'; };
      var nameOf = {}; vlist.forEach(function(v){ nameOf[v.via] = v.name; });
      var ms = function(v){ return v == null ? '' : Math.round(v) + ' ms'; };
      var sick = 0, shaky = 0;
      var blocks = tl.map(function(v){
        var h = X[v.via] || {}, p = P[v.via], hs = L.wg && L.wg[v.via], st = [], rows = '';
        var add = function(s, what, detail){ st.push(s); rows += line(s, what, detail); };
        /* pings: Cloudflare 1.1.1.1 + Quad9 9.9.9.9 through the tunnel, every 10 s */
        if (!p) add('wait', 'Pings', 'waiting for the first check');
        else {
          var ea = p.each || [], NM = ['Cloudflare', 'Quad9'], part = ea.map(function(e, i){
            return NM[i] + ' ' + (e.loss >= 100 ? '<span style="color:var(--mh-red)">no reply</span>' : ms(e.ms) + (e.loss > 0 ? ' <span style="color:' + lossColor(e.loss) + '">(' + e.loss + '% loss)</span>' : '')); }).join(', ');
          var some = ea.some(function(e){ return e.loss > 0; });
          if (p.loss >= 100) add('bad', 'Pings failing', part || 'no reply');
          else if (p.loss > 0 || some) add('warn', 'Pings partly successful', part);
          else add('ok', 'Pings successful', part || ms(p.ms));
        }
        /* domain lookup: example.com asked through the tunnel, once a minute */
        var d = h.dns;
        if (!d) add('wait', 'Domain lookup', 'first result within 2 minutes');
        else if (d.ok) add('ok', 'Domain lookup successful', 'example.com' + (d.ms != null ? ' in ' + d.ms + ' ms' : ''));
        else add('bad', 'Domain lookup failed', esc(d.status === 'TIMEOUT' ? 'no answer' : d.status === 'NOADDR' ? 'tunnel has no address' : d.status || 'error'));
        /* web page: HTTPS through the tunnel, once a minute */
        var w = h.web;
        if (!w) add('wait', 'Web page check', 'first result within 2 minutes');
        else if (/^[23]\d\d$/.test(w.code || '')) add('ok', 'Web page loads', 'HTTPS ' + esc(w.code) + (w.t ? ', ' + ago(now - w.t) : ''));
        else add('bad', 'Web page check failed', (h.webfail >= 2 ? h.webfail + ' in a row' : 'once') + (w.t ? ', ' + ago(now - w.t) : ''));
        /* WireGuard handshake; OpenVPN has none, so: last time data came back from its server (2026-11-17) */
        if (v.type === 'openvpn'){
          if (!hs) add('wait', 'Server contact', 'not connected yet');
          else if (now - hs > 180) add('bad', 'Server gone quiet', 'nothing back for ' + dur(now - hs));
          else add('ok', 'Server responding', 'OpenVPN, data back ' + ago(now - hs));
        }
        else if (!hs) add('wait', 'Handshake', 'none yet');
        else if (now - hs > 180) add('bad', 'Handshake stale', ago(now - hs));
        else add('ok', 'Handshake OK', ago(now - hs));
        /* drops (30 s+ outages) in the last 24 h, and right now */
        var all = (Array.isArray(h.drops) ? h.drops : []).filter(function(e){ return now - e.t < 86400; });
        var dl = all.filter(function(e){ return !e.po; }), po = all.filter(function(e){ return e.po; });   /* po = ping-only blip (web kept working) */
        var hr = dl.filter(function(e){ return now - e.t < 3600; }).length, last = dl[dl.length - 1];
        if (h.down) add('bad', 'Down right now', 'since ' + hhmm(last ? last.t : now) + (fo[v.via] ? ', its devices are on ' + esc(nameOf[fo[v.via]] || 'another tunnel') : ''));
        else if (dl.length) add(hr ? 'warn' : 'ok', hr ? 'Dropped ' + hr + '× in the last hour' : 'No drops in the last hour',
          dl.length + ' in 24 h · last ' + hhmm(last.t) + (last.d ? ' (' + (last.d < 90 ? last.d + ' s' : Math.round(last.d / 60) + ' min') + ')' : ''));
        else add('ok', 'No drops', 'since tracking started');
        if (po.length){ var poh = po.filter(function(e){ return now - e.t < 3600; }).length;
          add('ok', 'Ping-only blips ignored', poh + ' in the last hour · ' + po.length + ' in 24 h · pings stopped but web pages kept loading, so devices stayed put'); }
        var nb = st.filter(function(s){ return s === 'bad'; }).length, nw = st.filter(function(s){ return s === 'warn'; }).length;
        if (nb) sick++; else if (nw) shaky++;
        var col = nb ? 'var(--mh-red)' : nw ? 'var(--mh-orange)' : 'var(--mh-green)';
        return '<div class="mh-vh"><b><i class="d" style="background:' + col + '"></i>' + esc(v.name) + '<span style="color:' + col + '">' +
          (nb ? nb + ' problem' + (nb > 1 ? 's' : '') : nw ? 'Shaky' : 'All checks OK') + '</span></b>' + rows + '</div>';
      });
      var g = sick ? 'red' : shaky ? 'orange' : 'green';
      return '<div class="mh-big"><div class="mh-ico" style="background:' + GRAD[g] + '">' + svg('pulse') + '</div><div><h3>' +
        (sick ? sick + ' tunnel' + (sick > 1 ? 's' : '') + ' with problems' : shaky ? 'Mostly healthy' : 'All tunnels healthy') + '</h3><p>' +
        this.vwSub() + '</p></div>' + this.vwBtn() + '</div>' + blocks.join('') +
        '<div class="mh-stn">Steady pings to Cloudflare + Quad9 (one a second, summed every 10 s). Domain lookup (example.com) and web page check go through the tunnel once a minute. A drop = 30 s or more with no pings AND no web page through the tunnel (or no handshake); only drops move devices to another tunnel.</div>' +
        '<div class="mh-mrow" style="justify-content:flex-start;gap:8px;flex-wrap:wrap"><button class="mh-btn sec" data-act="vpnlog" title="Every real VPN outage of the last 30 days, ready to copy for your VPN provider">Outage log</button>' +
        '<button class="mh-btn sec" data-act="vpnclear" title="Clear every VPN warning and re-check all tunnels">Clear all VPN alerts</button></div>';
    },
    /* one line of 7-day stats for a tunnel row in the VPN card */
    relLine: function(r){
      if (!r || r.uptime == null) return '7 days: collecting (stats appear within an hour)';
      var f1 = function(v, d){ return v == null ? '—' : v.toFixed(d == null ? 1 : d); };
      var up = '<b style="color:' + (r.uptime >= 99.9 ? 'var(--mh-green)' : r.uptime >= 99 ? 'var(--mh-orange)' : 'var(--mh-red)') + '">' + f1(r.uptime, 2) + '%</b> up';
      return '7 days: ' + up + ' · ' + f1(r.ping) + ' ms avg · <span style="color:' + lossColor(r.loss) + '">' + f1(r.loss, 2) + '% loss</span>' +
        (r.day != null || r.eve != null ? ' · day/evening ' + f1(r.day, 0) + '/' + f1(r.eve, 0) + ' ms' : '') +
        ' · nightly ↓ ' + (r.speed != null ? (r.speed >= 1000 ? (r.speed / 1000).toFixed(2) + ' Gbps' : Math.round(r.speed) + ' Mbps') : '—') +
        (r.stale ? ' · <span style="color:var(--mh-orange)">' + r.stale + ' stale</span>' : '') + (r.hours < 168 ? ' <span class="h">(' + r.hours + 'h of data)</span>' : '');
    },
    useHtml: function(){
      var m = this.mh, U = m.usage || {}, priv = m.priv;
      var col = function(list, title, since){
        list = list || [];
        var max = 1; list.forEach(function(d){ max = Math.max(max, d.rx + d.tx); });
        var hrs = since ? (Date.now() / 1000 - since) / 3600 : 0;
        var note = since && ((title === '24 hours' && hrs < 23) || (title === '7 days' && hrs < 160)) ? ' · since ' + (hrs < 24 ? hhmm(since) : new Date(since * 1000).toLocaleDateString(undefined, { weekday: 'short' })) : '';
        return '<div><div class="mh-sth" style="margin-top:0"><span>Last ' + title + '</span><span>' + note.replace(/^ · /, '') + '</span></div>' +
          (list.length ? '<div class="mh-rows mh-use4">' + list.slice(0, 20).map(function(d, i){
            var nm = priv ? 'Device ' + (i + 1) : (d.name && d.name !== null ? d.name : 'Unknown device');
            return '<div class="mh-r"><div class="m"><b>' + esc(nm) + '</b><div class="mh-bar" style="margin-top:5px"><i style="width:' + Math.max(2, Math.round((d.rx + d.tx) * 100 / max)) + '%;background:linear-gradient(90deg,#0a84ff,#bf5af2)"></i></div></div>' +
              '<div class="x"><b style="display:block;color:var(--mh-text);font-size:13px">' + bytes(d.rx + d.tx) + '</b>↓ ' + bytes(d.rx) + ' · ↑ ' + bytes(d.tx) + '</div></div>';
          }).join('') + '</div>' : '<div class="mh-empty">Collecting… first numbers appear within about an hour.</div>') + '</div>';
      };
      /* half-width card (2026-11-15): the two lists sit side by side only when each gets 300 px, otherwise they stack */
      return '<div class="mh-hgrid" style="grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))">' + col(U.d24, '24 hours', U.since24) + col(U.d7, '7 days', U.since7) + '</div>';
    },
    secHtml: function(list, bad){
      if (!list.length) return '<div class="mh-empty">Running security checks… results within a minute.</div>';
      var xv = (this.mh.stats && this.mh.stats.live && this.mh.stats.live.x && this.mh.stats.live.x.vuln) || null;
      var nvb = (xv && xv.problems > 0) ? 1 : 0, nb = bad.length + nvb;   /* a vulnerability finding counts as one issue (a new, unchecked GL notice doesn't) */
      var h = '<div class="mh-big"><div class="mh-ico" style="background:' + (xv && xv.worst === 'infected' ? GRAD.red : nb ? GRAD.orange : GRAD.green) + '">' + svg('shield') + '</div><div><h3>' +
        (nb ? nb + ' issue' + (nb > 1 ? 's' : '') + ' found' : 'All clear') + '</h3><p>' + list.filter(function(c){ return c.ok; }).length + ' of ' + list.filter(function(c){ return !c.rec; }).length + ' checks passed' +
        (list.some(function(c){ return c.rec; }) ? ' · ' + list.filter(function(c){ return c.rec; }).length + ' recommended' : '') + ' · rechecked every minute</p></div></div>';
      var sorted = bad.concat(list.filter(function(c){ return c.ok; }));
      /* Recommendations (2.6.7, user report): checks that never passed on this router, e.g. GL's defaults on a router whose
         owner chose "Home tab only" in the installer. No alert, no red: a short why + "Turn on" where one click is safe. */
      var REC = {
        ssh: ['Sign in to SSH with a key instead of a password. Needs an SSH key first (Toolkit → SSH keys); the Router Home installer then can’t use the password.', 1],
        https: ['Always use encrypted HTTPS for the admin page (your browser may warn about the router’s own certificate once).', 1],
        wgperm: ['Make the WireGuard key file readable by the admin account only. No downside.', 1],
        ovpnperm: ['Make the OpenVPN login files readable by the admin account only. No downside.', 1],
        ipsec: ['Close two firewall openings for IPsec VPN. Leave them if you run an IPsec VPN server on this router.', 1],
        keys: ['More than one SSH key can sign in. Review them in Toolkit → SSH keys.', 0],
        wanfw: ['Block unrequested traffic from the internet: GL’s Network → Firewall.', 0],
        pf: ['Port forwards open devices to the internet. Review them in GL’s Network → Firewall.', 0],
        upnp: ['UPnP lets devices open ports by themselves. Turn it off in GL’s Network → UPnP if you don’t need it.', 0],
        remote: ['Cloud remote access is on (GoodCloud / remote SSH). Turn it off in GL’s Applications → GoodCloud if you don’t use it.', 0] };
      var recs = list.filter(function(c){ return !c.ok && c.rec; });
      var recHtml = recs.length ? '<div style="font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mh-text3);margin:10px 2px 4px">Recommended · optional</div>' +
        recs.map(function(c){ var r = REC[c.id] || ['', 0];
          return '<div class="mh-ck" style="flex-wrap:wrap"><i style="background:var(--mh-blue)">i</i><b>' + esc(c.label) + '</b><small>' + esc(c.detail) + '</small>' +
            (r[0] ? '<div style="flex-basis:100%;font-size:11.5px;color:var(--mh-text2);margin:3px 0 0 28px">' + esc(r[0]) +
              (r[1] ? ' <button data-act="secon" data-arg="' + esc(c.id) + '" style="border:0;border-radius:7px;padding:2px 9px;font-size:11.5px;font-weight:600;cursor:pointer;background:var(--mh-blue);color:#fff;margin-left:4px">Turn on</button>' : '') + '</div>' : '') + '</div>';
        }).join('') : '';
      var x = (this.mh.stats && this.mh.stats.live && this.mh.stats.live.x) || {}, rd = x.ready, al = x.alerts;
      var extra = '';
      /* Known vulnerabilities (2.6.5+): the card's featured panel, right under the header (owner, 11-22: "make it a stand-out
         feature"). Signed GL notice list + NVD + GL's news feeds, checked by vulncheck.lua; details in openVuln(). */
      var vu = x.vuln, VS = {
        infected:   ['#ff3b30', 'rgba(255,59,48,.13)',  'Signs of infection', 'shieldx'],
        exposed:    ['#ff9500', 'rgba(255,149,0,.13)',  'Exposed', 'shieldx'],
        update:     ['#ff9500', 'rgba(255,149,0,.13)',  'Firmware update needed', 'shieldx'],
        suspicious: ['#ff9500', 'rgba(255,149,0,.13)',  'Suspicious file found', 'shieldx'],
        notice:     ['#007aff', 'rgba(0,122,255,.11)',  'New GL.iNet security notice', 'shieldx'],
        ok:         ['#28a745', 'rgba(40,167,69,.11)',  'No known vulnerabilities', 'shield'] };
      var vs = vu ? (VS[vu.worst] || VS.ok) : ['#8e8e93', 'rgba(127,127,127,.10)', 'Checking for known vulnerabilities…', 'shield'];
      var vtop = vu && vu.top, vmodel = vu && vu.model ? 'GL-' + String(vu.model).toUpperCase() : 'this router';
      var vhead = vs[2] + (vu && vu.worst !== 'ok' && vu.worst !== 'notice' && vu.problems > 1 ? ' · ' + vu.problems + ' findings' : vu && vu.worst === 'notice' && vu.notices > 1 ? 's (' + vu.notices + ')' : '');
      var vsub = !vu ? 'The first check runs a few minutes after the router starts.'
        : vu.worst === 'ok' ? 'Checked ' + vmodel + (vu.fw ? ' on firmware ' + vu.fw : '') + ' against ' + (vu.n_gl || 0) + ' GL.iNet notice' + (vu.n_gl === 1 ? '' : 's') + ' and ' + (vu.n_nvd || 0) + ' published CVE' + (vu.n_nvd === 1 ? '' : 's') + ' for this model.'
        : vu.worst === 'notice' ? (vtop ? '“' + vtop.title + '”: not checked on this router yet.' : 'Not checked on this router yet.')
        : vtop ? (vtop.found || vtop.title) : '';
      var vbtn = function(act, label, solid){ return '<button data-act="' + act + '" style="border:0;border-radius:8px;padding:5px 11px;font-size:12px;font-weight:600;cursor:pointer;' +
        (solid ? 'background:' + vs[0] + ';color:#fff' : 'background:rgba(127,127,127,.16);color:inherit') + '">' + label + '</button>'; };
      var vtile = '<div data-act="vuln" style="cursor:pointer;display:flex;gap:12px;align-items:flex-start;margin:10px 0 12px;padding:12px 14px;border-radius:14px;background:' + vs[1] + ';box-shadow:inset 4px 0 0 ' + vs[0] + '">' +
        '<div style="flex:none;width:40px;height:40px;border-radius:11px;background:' + vs[0] + ';display:grid;place-items:center">' +
          svg(vs[3]).replace('<svg ', '<svg style="width:24px;height:24px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" ') + '</div>' +
        '<div style="flex:1;min-width:0"><div style="font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:' + vs[0] + '">Known vulnerabilities</div>' +
          '<div style="font-size:15px;font-weight:700;margin:1px 0 2px">' + esc(vhead) + '</div>' +
          (vsub ? '<div style="font-size:12px;color:var(--mh-text2)">' + esc(vsub) + '</div>' : '') +
          '<div style="font-size:11px;color:var(--mh-text3);margin-top:4px">GL.iNet notices (signed) · NVD · GL news feeds' + (vu && vu.t ? ' · checked ' + ago(Math.floor(Date.now() / 1000) - vu.t) : '') + '</div>' +
          '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
            vbtn('vuln', vu && vu.worst !== 'ok' ? (vtop && vtop.fix ? 'Review & fix ›' : 'Review ›') : 'Details ›', vu && vu.worst !== 'ok') + vbtn('vulnchk', 'Check now', false) + '</div></div></div>';
      if (rd){
        var lost = (rd.lost || []).length, rev = (rd.revert || []).length;
        extra += '<div class="mh-ck click" data-act="ready" style="cursor:pointer"><i style="background:' + (lost ? 'var(--mh-orange)' : 'var(--mh-blue)') + '">' + (lost ? '!' : 'i') + '</i><b>Firmware-upgrade safe</b><small>' +
          (lost ? lost + ' item' + (lost > 1 ? 's' : '') + ' would be wiped' : rd.kept + ' kept' + (rev ? ' · ' + rev + ' services re-enable' : '')) + ' ›</small></div>';
      }
      if (al) extra += '<div class="mh-ck click" data-act="alerts" style="cursor:pointer"><i style="background:' + (al.enabled && al.configured ? 'var(--mh-green)' : 'var(--mh-text3)') + '">' + (al.enabled && al.configured ? '✓' : '–') + '</i><b>Discord alerts</b><small>' +
          (al.enabled && al.configured ? 'On' + (al.sent ? ' · ' + al.sent + ' sent' : '') + (al.queued ? ' · ' + al.queued + ' queued' : '') : al.configured ? 'Paused' : 'Not set up') + ' ›</small></div>';
      var ckRow = function(c){ return '<div class="mh-ck"><i style="background:' + (c.ok ? 'var(--mh-green)' : 'var(--mh-orange)') + '">' + (c.ok ? '✓' : '!') + '</i><b>' + esc(c.label) + '</b><small>' + esc(c.detail) + '</small></div>'; };
      /* order: real failures, then recommendations, then passing checks */
      return h + vtile + '<div class="mh-rows mh-scroll">' + bad.map(ckRow).join('') + recHtml +
        (recHtml ? '<div style="font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mh-text3);margin:10px 2px 4px">Checks</div>' : '') +
        list.filter(function(c){ return c.ok; }).map(ckRow).join('') + extra + '</div>';
    },
    histHtml: function(){
      var h = this.mh.hist;
      if (!h) return '<div class="mh-empty">Loading history…</div>';
      if (!h.t || h.t.length < 2) return '<div class="mh-empty">Collecting data' + (h.first ? ' since ' + hhmm(h.first) : '') + '. Charts appear after about 10 minutes and fill in over the next 24 hours.</div>';
      var temps = h.temp.map(tconv), last = h.t.length - 1, dn = h.down, up = h.up;   /* in the chosen unit (2.6.7) */
      var peak = rate(Math.max.apply(null, dn.concat(up))), now = rate(dn[last]);
      var start = hhmm(h.t[0]), span = (h.t[last] - h.t[0]) / 3600;
      return '<div class="mh-hgrid">' +
        '<div class="mh-chart"><div class="hd"><span>Temperature</span><b style="color:' + tempColor(h.temp[last]) + '">' + temps[last] + '°' + TU + '</b></div>' +
          chart([{ data: temps, color: '#ff9500', fill: true }], { id: 'mhht' }) +
          '<div class="ft"><span>' + start + '</span><span>low ' + Math.min.apply(null, temps) + '°' + TU + ' · high ' + Math.max.apply(null, temps) + '°' + TU + '</span><span>now</span></div>' +
          '<div class="mh-legend"><span><i style="background:#ff9500"></i>Hottest sensor, 5-min average</span></div></div>' +
        '<div class="mh-chart"><div class="hd"><span>Internet traffic</span><b>' + now[0] + ' <small style="font-size:11px;color:var(--mh-text2)">' + now[1] + ' down</small></b></div>' +
          chart([{ data: dn, color: '#0a84ff', fill: true }, { data: up, color: '#bf5af2' }], { id: 'mhhb', zero: true }) +
          '<div class="ft"><span>' + start + '</span><span>peak ' + peak[0] + ' ' + peak[1] + '</span><span>now</span></div>' +
          '<div class="mh-legend"><span><i style="background:#0a84ff"></i>Download</span><span><i style="background:#bf5af2"></i>Upload</span></div></div>' +
        '</div>' + (span < 23 ? '<div class="mh-empty" style="font-size:11px;margin-top:6px">Showing the last ' + (span < 1 ? Math.max(1, Math.round(span * 60)) + ' minutes' : span.toFixed(1) + ' hours') + '. Keeps 24 hours; resets if the router restarts.</div>' : '');
    },
    ccHtml: function(){
      var m = this.mh, tl = (m.tun && m.tun.tunnels) || [], st = {};
      ((m.vpn && m.vpn.status_list) || []).forEach(function(v){ st[v.tunnel_id] = v; });
      var adgOn = !!(m.adg && m.adg.enabled), ledOn = !!(m.led && m.led.led_enable);
      var h = '<h3>Control Center</h3><div class="mh-ccg"><h4>VPN tunnels</h4>' + (tl.length ? tl.map(function(t){
        var s = st[t.tunnel_id] || {};
        var sub = !t.enabled ? 'Off' : s.status === 1 ? 'Connected · ' + (m.priv ? 'server hidden' : (s.peer_name || '')) : s.status === 2 ? 'Connecting…' : 'Not connected';
        return '<div class="mh-ccr"><div class="m"><b>' + esc(t.name) + '</b><small>' + esc(sub) + '</small></div><button class="mh-sw' + (t.enabled ? ' on' : '') + '" data-act="vpn" data-arg="' + esc(t.tunnel_id) + '" aria-label="Turn ' + esc(t.name) + (t.enabled ? ' off' : ' on') + '"></button></div>';
      }).join('') : '<div class="mh-ccr"><div class="m"><small>No tunnels set up</small></div></div>') + '</div>';
      h += '<div class="mh-ccg">' +
        '<div class="mh-ccr"><div class="m"><b>AdGuard Home</b><small>' + (m.adg ? (adgOn ? 'Filtering on' : 'Disabled') : '…') + '</small></div><button class="mh-sw' + (adgOn ? ' on' : '') + '" data-act="adg"' + (m.adg ? '' : ' disabled') + ' aria-label="Turn AdGuard Home ' + (adgOn ? 'off' : 'on') + '"></button></div>' +
        ((m.info && m.info.hardware_feature && m.info.hardware_feature.noled) ? '' :
        '<div class="mh-ccr"><div class="m"><b>Status LEDs</b><small>' + (m.led ? (ledOn ? 'On' : 'Off') : '…') + '</small></div><button class="mh-sw' + (ledOn ? ' on' : '') + '" data-act="led"' + (m.led ? '' : ' disabled') + ' aria-label="Turn LEDs ' + (ledOn ? 'off' : 'on') + '"></button></div>') + '</div>';
      var hasWake = !!(m.life && m.life.wake && Object.keys(m.life.wake).length);
      return h + '<div class="mh-ccbtns"><button class="mh-ccbtn" data-act="backup"><span class="ic" style="background:' + GRAD.blue + '">' + svg('dl') + '</span>Back up settings</button>' +
        '<button class="mh-ccbtn" data-act="reboot"><span class="ic" style="background:' + GRAD.red + '">' + svg('power') + '</span>Restart router</button>' +
        /* router mode only, and only once the cable modem is connected (gateway password saved in Settings → Cable modem) */
        (!this.isAP() && m.watch && m.watch.modem_set ? '<button class="mh-ccbtn" data-act="modemrs" style="grid-column:1/-1"><span class="ic" style="background:' + GRAD.orange + '">' + svg('power') + '</span>Restart modem</button>' : '') + '</div>' +
        (hasWake ? '<div class="mh-ccg" style="margin-top:8px">' + this.wakeCC() + '</div>' : '') +
        '<div class="mh-ccg" style="margin-top:8px">' +
          /* Router Home updates from GitHub (owner, 2026-11-22: in the Control Center) */
          '<div class="mh-ccr"><div class="m"><b>Router Home updates</b><small>' + (m.updAvail ? '<span style="color:var(--mh-blue)">Version ' + esc(m.updAvail) + ' is available</span>' : 'Version ' + esc(MH_VERSION) + ' · checks GitHub for a newer one') + '</small></div><button class="mh-btn" style="margin:0" data-act="updates">' + (m.updAvail ? 'Update' : 'Check') + '</button></div>' +
          '<div class="mh-ccr"><div class="m"><b>Settings</b><small>Privacy, look, layout, alerts, backups, modem, weather</small></div><button class="mh-btn" style="margin:0" data-act="settings">Open</button></div></div>' +
        '<p class="mh-ccnote">Every change asks you to confirm first.</p>';
    },
    /* Settings window (Control Center > Settings): everything that used to be listed under the two big buttons.
       Rows use data-m="go" + data-arg=<act name> (+ data-a2) and are routed through act(); look/privacy changes re-open the window in place. */
    settingsHtml: function(){
      var m = this.mh, a = false, cur = 'playful', acc = 'multi', live = true;
      try { live = localStorage.getItem('machome-live') !== '0'; } catch (e) {}
      try { a = localStorage.getItem('machome-ui') === 'android'; cur = localStorage.getItem('machome-pal') || 'playful'; acc = localStorage.getItem('machome-acc') || 'multi'; } catch (e) {}
      var row = function(t, s, ctl, cls){ return '<div class="mh-ccr' + (cls ? ' ' + cls : '') + '" data-k="' + esc(SETK[t] || '') + '"><div class="m"><b>' + t + '</b><small>' + s + '</small></div>' + ctl + '</div>'; };
      var go = function(act, label, a2){ return '<button class="mh-go" data-m="go" data-arg="' + act + '"' + (a2 ? ' data-a2="' + a2 + '"' : '') + '>' + (label || 'Settings') + '</button>'; };
      var PAL = [['playful','Playful','conic-gradient(#ff5c93,#8ccf2e,#8a6cff,#ff8a3d,#3d9cff,#22c3a0,#ff5c93)'],['ocean','Ocean','linear-gradient(135deg,hsl(200,72%,70%) 0 50%,hsl(205,72%,42%) 50% 100%)'],['forest','Forest','linear-gradient(135deg,hsl(128,48%,70%) 0 50%,hsl(135,48%,42%) 50% 100%)'],['sunset','Sunset','linear-gradient(135deg,hsl(14,85%,70%) 0 50%,hsl(18,85%,42%) 50% 100%)'],['grape','Grape','linear-gradient(135deg,hsl(265,62%,70%) 0 50%,hsl(270,62%,42%) 50% 100%)'],['rose','Rose','linear-gradient(135deg,hsl(340,72%,70%) 0 50%,hsl(340,72%,42%) 50% 100%)'],['citrus','Citrus','linear-gradient(135deg,hsl(58,78%,70%) 0 50%,hsl(62,78%,42%) 50% 100%)'],['mint','Mint','linear-gradient(135deg,hsl(160,55%,70%) 0 50%,hsl(165,55%,42%) 50% 100%)'],['slate','Slate','linear-gradient(135deg,hsl(215,25%,70%) 0 50%,hsl(220,25%,42%) 50% 100%)']];
      var ACC = [['multi','Multicolor','conic-gradient(#ff5f57,#febc2e,#28c840,#00b4ff,#af52de,#ff5f57)'],['blue','Blue','hsl(211,100%,50%)'],['purple','Purple','hsl(280,62%,52%)'],['pink','Pink','hsl(330,85%,55%)'],['red','Red','hsl(3,88%,55%)'],['orange','Orange','hsl(30,95%,50%)'],['yellow','Yellow','hsl(44,95%,42%)'],['green','Green','hsl(135,55%,40%)'],['graphite','Graphite','hsl(220,8%,45%)']];
      var L = a ? PAL : ACC, sel = a ? cur : acc, n = L.filter(function(p){ return p[0] === sel; })[0] || L[0];
      var colors = row(a ? 'Colors' : 'Accent color', n[1], '<div class="mh-pals" role="group" aria-label="' + (a ? 'Color theme' : 'Accent color') + '">' +
        L.map(function(p){ return '<button class="' + (a ? '' : 'acc') + (p[0] === sel ? ' on' : '') + '" data-m="go" data-arg="' + (a ? 'uipal' : 'uiacc') + '" data-a2="' + p[0] + '" title="' + p[1] + '" aria-label="' + p[1] + (a ? ' colors' : ' accent') + '" style="background:' + p[2] + '"></button>'; }).join('') + '</div>', 'mh-palr');
      return '<div class="hic" style="background:' + GRAD.indigo + '">' + svg('cc') + '</div><h2>Settings</h2>' +
        '<input class="mh-al-q mh-set-q" type="search" placeholder="Search settings (e.g. privacy, color, backup, modem)…" autocomplete="off" spellcheck="false" aria-label="Search settings">' +
        '<div class="mh-al-none mh-set-none" style="display:none">No settings match. Try the page search or the About guide.</div>' +
        '<div class="mh-ccg"><h4>Privacy &amp; look</h4>' +
          row('Privacy mode', m.priv ? 'On · personal details hidden' : 'Off', '<button class="mh-sw' + (m.priv ? ' on' : '') + '" data-m="go" data-arg="priv" aria-label="Toggle privacy mode"></button>') +
          row('Look', 'Saved in this browser', '<div class="mh-thm" role="group" aria-label="Look"><button data-m="go" data-arg="uitheme" data-a2="mac"' + (a ? '' : ' class="on"') + '>macOS</button><button data-m="go" data-arg="uitheme" data-a2="android"' + (a ? ' class="on"' : '') + '>Android</button></div>') +
          colors +
          row('Live wallpaper', live ? 'On · colors slowly move and blend' : 'Off · still background', '<button class="mh-sw' + (live ? ' on' : '') + '" data-m="go" data-arg="uilive" aria-label="Toggle live wallpaper"></button>') +
          row('Layout', 'Hide, move and resize cards', go('lay', 'Edit', 'edit')) + '</div>' +
        '<div class="mh-ccg"><h4>Alerts &amp; backups</h4>' +
          row('Discord alerts', m.alerts ? (m.alerts.enabled && m.alerts.has_webhook ? 'On' : m.alerts.has_webhook ? 'Paused' : 'Not set up') : '…', go('alerts')) +
          row('Auto-heal', esc(this.healSummary() || 'Problems the router fixes by itself'), go('autoheal')) +
          row('NAS backup', m.nasB ? (m.nasB.configured ? (m.nasB.enabled ? 'On' + (m.nasB.last_ok ? ' · last ' + ago(Math.floor(Date.now() / 1000) - m.nasB.last_ok) : '') : 'Paused') : 'Not set up') : '…', go('nasbak')) + '</div>' +
        '<div class="mh-ccg"><h4>Internet</h4>' +
          (this.isAP() ? '' : row('Cable modem', m.watch && m.watch.modem_set ? esc(this.modemText(true) || 'Connected · reading…') : 'Not set up', go('modem'))) +
          row('ISP report card', 'Monthly uptime + speeds vs your plan', go('isp', 'Open')) + '</div>' +
        '<div class="mh-ccg"><h4>Home</h4>' +
          /* 2.6.7 (users asked): °F/°C for the whole page, Discord messages and the weather; weather can be turned off */
          row('Temperature unit', TU === 'C' ? 'Celsius · page, alerts and weather' : 'Fahrenheit · page, alerts and weather', '<div class="mh-thm" role="group" aria-label="Temperature unit"><button data-m="go" data-arg="tunit" data-a2="F"' + (TU === 'F' ? ' class="on"' : '') + '>°F</button><button data-m="go" data-arg="tunit" data-a2="C"' + (TU === 'C' ? ' class="on"' : '') + '>°C</button></div>') +
          row('Weather', m.wth ? (m.wth.off ? 'Off' : m.wth.zip ? (m.priv ? 'On' : esc(m.wth.place || m.wth.zip)) : 'Not set up') : '…', go('wth')) +
          (m.life && m.life.wake && Object.keys(m.life.wake).length ? '' : row('Wake a computer', 'Turn it on in a PC’s device sheet (Clients card)', '')) + '</div>' +
        '<div class="btns"><button data-m="cancel">Close</button></div>';
    },
    /* keep: re-open in place after a look/privacy change (keeps scroll + search text). query: pre-fill the search box. */
    openSettings: function(keep, query){
      var self = this, old = document.querySelector('#machome-modal .sheet'), top = keep && old ? old.scrollTop : 0;
      var oq = keep && old && old.querySelector('.mh-set-q'); if (oq) query = oq.value;
      var md = this.openModal(this.settingsHtml(), { go: function(md, b){
        var a = b.getAttribute('data-arg'), a2 = b.getAttribute('data-a2'), stay = /^(priv|uitheme|uipal|uiacc|uilive|tunit)$/.test(a);
        if (!stay) self.closeModal();
        self.act(a, a2);
        if (stay) self.openSettings(true);
      } });
      if (!md) return;
      /* search: every word must appear in the row's name, status, keywords or its group's heading */
      var q = md.querySelector('.mh-set-q'), filt = function(){
        var words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean), any = false;
        md.querySelectorAll('.mh-ccg').forEach(function(g){
          var gh = ((g.querySelector('h4') || {}).textContent || '').toLowerCase(), n = 0;
          g.querySelectorAll('.mh-ccr').forEach(function(r){
            var t = gh + ' ' + (r.getAttribute('data-k') || '') + ' ' + r.textContent.toLowerCase();
            var ok = words.every(function(w){ return t.indexOf(w) > -1; }); r.style.display = ok ? '' : 'none'; if (ok) n++;
          });
          g.style.display = n ? '' : 'none'; if (n) any = true;
        });
        md.querySelector('.mh-set-none').style.display = any ? 'none' : '';
      };
      q.addEventListener('input', filt);
      q.addEventListener('keydown', function(e){ if (e.key === 'Escape' && q.value){ e.stopPropagation(); q.value = ''; filt(); } });
      if (query){ q.value = query; filt(); }
      var sh = md.querySelector('.sheet');
      if (sh && keep){ sh.style.animation = 'none'; md.style.animation = 'none'; sh.scrollTop = top; }
      if (keep && !q.value) q.blur();   /* openModal focuses the box; after a swatch click don't pop a phone keyboard */
    },
    /* settings rows for the page search bar: [name, keywords], read from the real window so hidden rows (AP, look) match */
    settingsIndex: function(){
      var d = document.createElement('div'); d.innerHTML = this.settingsHtml();
      return Array.prototype.map.call(d.querySelectorAll('.mh-ccr'), function(r){
        var g = r.closest('.mh-ccg'), h = g && g.querySelector('h4');
        return { name: r.querySelector('b').textContent, text: (h ? h.textContent : '') + ' ' + r.textContent + ' ' + (r.getAttribute('data-k') || '') };
      });
    },

    /* ---------- actions ---------- */
    act: function(name, arg){
      if (name === 'cc'){ if (this.mh.ccOpen) this.closeCC(); else this.openCC(); return; }
      if (name === 'dev') return this.openDevice(arg);
      if (name === 'vpn') return this.doVpn(Number(arg));
      if (name === 'vpnsrv') return this.openVpnServer(arg);
      if (name === 'vwatch') return this.doVpnWatch();
      if (name === 'vpnclear') return this.doVpnClear();
      if (name === 'vpnlog') return this.openVpnLog(30, '');
      if (name === 'tk') return this.tkAct(arg);
      if (name === 'updates'){ this.closeCC(); return this.openUpdates(); }
      if (name === 'lossclr') return this.doLossClear(arg);
      if (name === 'dnshub') return this.openDnsHub();
      if (name === 'adg') return this.doAdg();
      if (name === 'led') return this.doLed();
      if (name === 'backup') return this.doBackup();
      if (name === 'reboot') return this.doReboot();
      if (name === 'modemrs') return this.doModemRestart();
      if (name === 'st-wan') return this.startSpeed('wan');
      if (name === 'st-vpn') return this.pickSpeedVpn();
      if (name === 'st-all') return this.startSpeed('all');
      if (name === 'st-cancel') return this.cancelSpeed();
      if (name === 'priv') return this.togglePrivacy();
      if (name === 'lay') return this.layAct(arg);
      if (name === 'wake') return this.wakeAct(arg);
      if (name === 'datcfg') return this.openDatCfg();
      if (name === 'sphmode'){ this.mh.sphMode = arg === 'u' ? 'u' : 'd'; this.sphPaint(); return; }
      if (name === 'wprange'){ this.mh.wpRange = arg === '24h' ? '24h' : '1h'; var wpw = this.$el.querySelector('.mh-wpwrap'); if (wpw) wpw.outerHTML = this.wanPingHtml(); return; }
      if (name === 'uiacc'){ try { localStorage.setItem('machome-acc', String(arg || 'multi').replace(/[^a-z]/g, '')); } catch (e) {} this.theme(); if (this.mh.ccOpen) this.set('cc', this.ccHtml()); return; }
      if (name === 'uipal'){ try { localStorage.setItem('machome-pal', String(arg || 'playful').replace(/[^a-z]/g, '')); } catch (e) {} this.theme(); if (this.mh.ccOpen) this.set('cc', this.ccHtml()); return; }
      if (name === 'uilive'){ var lv = true; try { lv = localStorage.getItem('machome-live') !== '0'; localStorage.setItem('machome-live', lv ? '0' : '1'); } catch (e) {} this.theme(); return; }
      if (name === 'uitheme'){ try { localStorage.setItem('machome-ui', arg === 'android' ? 'android' : 'mac'); } catch (e) {} this.theme(); if (this.mh.ccOpen) this.set('cc', this.ccHtml()); return; }
      if (name === 'alerts'){ this.closeCC(); return this.openAlerts(); }
      if (name === 'ready') return this.openReadiness();
      if (name === 'secon'){   /* Security card recommendation → "Turn on" (2.6.7). HTTPS via GL's own setting, the rest via rpc sec_apply */
        var sid = String(arg || ''), sself = this;
        var SW = { ssh: ['Use SSH keys only?', '<p>Password sign-in over SSH turns off; only installed SSH keys can sign in. <b>The Router Home installer signs in with the password</b>, so for updates use Control Center → Router Home updates (or turn password sign-in back on first). The router refuses this if no SSH key is installed.</p>'],
          https: ['Use HTTPS only for the admin page?', '<p>The admin page always opens with https://. Your browser may warn once about the router’s own certificate. Turn it back off in GL’s Security page if needed.</p>'],
          wgperm: ['Lock the WireGuard key file?', '<p>Makes /etc/config/wireguard readable by the admin account only. Nothing else changes.</p>'],
          ovpnperm: ['Lock the OpenVPN login files?', '<p>Makes the saved OpenVPN logins readable by the admin account only, and keeps them that way when GL saves them again.</p>'],
          ipsec: ['Close the unused IPsec openings?', '<p>Turns off two firewall rules for IPsec VPN (ESP and UDP 500). <b>Don’t</b> do this if you run an IPsec VPN server on this router.</p>'] }[sid];
        if (!SW) return;
        return this.confirm({ title: SW[0], icon: 'shield', grad: GRAD.blue, ok: 'Turn on', working: 'Working…', body: SW[1] + '<p style="font-size:12px">An undo script is saved in /root/machome-backup/.</p>' }, function(){
          var p = sid === 'https' ? rpcx('local-access', 'set_config', { redirect_https: true }, 20000).then(function(){ return { ok: true, done: 'Admin page is HTTPS-only' }; })
            : rpcx('machome', 'sec_apply', { id: sid }, 20000);
          return p.then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'didn’t work'); setTimeout(function(){ sself.fast(); }, 4000); return r.done + ' · the card updates within a minute'; });
        });
      }
      if (name === 'tunit'){   /* °F / °C (2.6.7): this browser right away, the router (alerts, weather) in the background */
        var nu = arg === 'C' ? 'C' : 'F', tself = this; if (nu === TU) return;
        TU = nu; try { localStorage.setItem('machome-tu', nu); } catch (e) {}
        this.paint(); this.tkPaint();
        rpcx('machome', 'set_prefs', { temp_unit: nu }, 30000).then(function(){ tself.weather(); }).catch(function(e){ tself.toast('Couldn’t save on the router: ' + e.message); });
        return;
      }
      if (name === 'vuln') return this.openVuln();
      if (name === 'vulnchk'){ var vself = this; return rpcx('machome', 'vuln_check', {}, 15000).then(function(){ vself.toast('Checking for known vulnerabilities… the card updates within a minute'); })
        .catch(function(e){ vself.toast('Couldn’t start the check: ' + e.message); }); }
      if (name === 'wx-dis') return this.wxDismiss(arg);
      if (name === 'wx-ack') return this.wxAck(arg);
      if (name === 'wx-ackall') return this.wxAck(null);
      if (name === 'wx-fix') return this.wxFix(arg);
      if (name === 'wx-more'){ this.mh.wxAll = !this.mh.wxAll; this.set('wx', this.wxHtml()); return; }
      if (name === 'wx-undis'){ try { localStorage.removeItem('machome-dismiss'); } catch (e) {} this.set('wx', this.wxHtml()); return; }
      /* 2026-11-18: mute / Clear all on the banner, remove one speed-history line or past server, forget removed VPNs */
      if (name === 'wx-mute') return this.muteDialog(arg);
      if (name === 'wx-muted') return this.mutedDialog();
      if (name === 'wx-clearall') return this.alertsClearAll();
      if (name === 'sphrm') return this.sphRemove(arg);
      if (name === 'relrm') return this.relRemove(arg);
      if (name === 'vpnforget') return this.vpnForget();
      if (name === 'isplog') return this.openIspLog(30);
      /* phone view (owner's pick 17) */
      if (name === 'phone' || name === 'phone-off'){
        var on = name === 'phone' ? !this.phoneOn() : false;
        try { localStorage.setItem('machome-phone', on ? '1' : '0'); } catch (e) {}
        this.$el.classList.toggle('mh-ph-on', on); this.paint(); window.scrollTo(0, 0); return;
      }
      if (name === 'zip-save') return this.zipSave();
      if (name === 'zip-later') return this.zipLater();
      if (name === 'wth'){ this.closeCC(); return this.openWeather(); }
      if (name === 'radar') return this.openRadar();
      if (name === 'upl-pick') return this.openUplink();
      if (name === 'about'){ this.closeCC(); return this.openAbout(); }
      if (name === 'settings'){ this.closeCC(); return this.openSettings(); }
      if (name === 'autoheal'){ this.closeCC(); return this.openAutoheal(); }
      if (name === 'mrs-cancel') return this.mrsCancel();
      if (name === 'sys'){ var wxn = this.q('wx'); if (wxn && wxn.textContent.trim()) wxn.scrollIntoView({ behavior: 'smooth', block: 'start' }); else this.toast('All systems normal: no active alerts'); return; }
      if (name === 'events') return this.openEvents();
      if (name === 'leak') return this.leakRun();
      if (name === 'modem'){ this.closeCC(); return this.openModem(); }
      if (/^trv-/.test(name)) return this.trvAct(name.slice(4), arg);
      if (name === 'nasadg'){ this.closeCC(); return this.openNasAdg(); }
      if (name === 'nasbak'){ this.closeCC(); return this.openNasBackup(); }
      if (name === 'isp'){ this.closeCC(); return this.openIsp(); }
      if (name === 'pause') return this.pauseDevice(arg);
      if (name === 'fan'){ this.closeCC(); return this.openFan(); }
    },
    /* ---------------- fan control sheet */
    openFan: function(){
      var self = this;
      rpc('machome', 'get_fan').then(function(f){
        if (!f || !f.supported){ self.toast('This router has no controllable fan'); return; }
        var tf = function(c){ return c == null ? '—' : tconv(c); };   /* chosen unit (2.6.7); GL's target is still sent in °F */
        var manual = f.mode === 'manual';
        var html = '<div class="hic" style="background:linear-gradient(160deg,#5ac8fa,#30b0c7)">' + svg('fan') + '</div><h2>Fan</h2>' +
          '<p data-fnow>CPU ' + tf(f.temp_c) + '°' + TU + ' · fan ' + (f.rpm > 0 ? Math.round(f.rpm).toLocaleString() + ' RPM (' + f.pct + '%)' : 'off') + (f.failsafe ? ' · <b style="color:var(--mh-red)">failsafe active</b>' : '') + '</p>' +
          '<div class="mh-seg" role="radiogroup"><button data-m="mauto" class="' + (manual ? '' : 'on') + '">Auto</button><button data-m="mman" class="' + (manual ? 'on' : '') + '">Manual</button></div>' +
          '<div data-pa' + (manual ? ' style="display:none"' : '') + '>' +
            '<label for="mh-ft">Turn the fan on at</label><span class="mh-fin"><input id="mh-ft" type="number" min="' + (TU === 'C' ? 40 : 104) + '" max="' + (TU === 'C' ? 85 : 185) + '" step="1" value="' + tf(f.target_c) + '"> °' + TU + '</span>' +
            '<p style="text-align:left;font-size:11px;margin-top:6px">GL’s controller speeds the fan up to hold the CPU near this temperature, so a lower number means the fan runs more often (and a little louder). Default ' + tdispF(158) + '. Your CPU idles around ' + tf(f.temp_c) + '°' + TU + ', so anything below that keeps the fan running.</p></div>' +
          '<div data-pm' + (manual ? '' : ' style="display:none"') + '>' +
            '<label for="mh-fs">Fan speed <b data-fsv>' + f.manual_pct + '%</b></label><input id="mh-fs" type="range" min="0" max="100" step="5" value="' + f.manual_pct + '" style="width:100%">' +
            '<p style="text-align:left;font-size:11px;margin-top:6px">Holds this speed and pauses GL’s automatic control. <b>Failsafe:</b> if the CPU reaches ' + tf(f.warn_c) + '°' + TU + ', automatic control takes over until it cools to ' + tf(f.warn_c != null ? f.warn_c - 8 : null) + '°' + TU + ', and you get an alert.</p></div>' +
          '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button class="pri" data-m="save">Save</button></div>';
        var mode = f.mode;
        self.openModal(html, {
          mauto: function(md){ mode = 'auto'; md.querySelector('[data-m="mauto"]').className = 'on'; md.querySelector('[data-m="mman"]').className = ''; md.querySelector('[data-pa]').style.display = ''; md.querySelector('[data-pm]').style.display = 'none'; },
          mman: function(md){ mode = 'manual'; md.querySelector('[data-m="mman"]').className = 'on'; md.querySelector('[data-m="mauto"]').className = ''; md.querySelector('[data-pm]').style.display = ''; md.querySelector('[data-pa]').style.display = 'none'; },
          save: function(md, b){
            var e = md.querySelector('[data-e]'), p = { mode: mode };
            if (mode === 'auto'){
              var v = Number(md.querySelector('#mh-ft').value);
              if (!(TU === 'C' ? (v >= 40 && v <= 85) : (v >= 104 && v <= 185))){ e.textContent = 'Choose a temperature between ' + tdispF(104) + ' and ' + tdispF(185) + '.'; return; }
              if (v !== tf(f.target_c)) p.target_f = TU === 'C' ? Math.round(v * 9 / 5 + 32) : v;
            } else p.pct = Number(md.querySelector('#mh-fs').value);
            b.disabled = true; b.textContent = 'Saving…';
            rpcx('machome', 'set_fan', p, 20000).then(function(r){
              if (!r || !r.ok) throw new Error((r && r.err) || 'Couldn’t save');
              self.closeModal(); self.toast(mode === 'manual' ? 'Fan set to ' + p.pct + '%' : 'Fan on automatic' + (p.target_f ? ', starts at ' + tdispF(p.target_f) : ''));
              self.fast();
            }).catch(function(err){ b.disabled = false; b.textContent = 'Save'; e.textContent = err.message; });
          }
        });
        var md = document.getElementById('machome-modal'), sl = md && md.querySelector('#mh-fs');
        if (sl) sl.addEventListener('input', function(){ md.querySelector('[data-fsv]').textContent = sl.value + '%'; });
      });
    },
    isAP: function(){ var s = this.mh.stats; return !!(s && s.net_mode && s.net_mode.mode === 'ap'); },
    /* Access Point card (replaces the VPN card when the router runs in AP mode) */
    apHtml: function(cliTot){
      var m = this.mh, s = m.stats || {}, nm = s.net_mode || {}, L = s.live || {}, p = (L.ping || {}).wan || {};
      var lat = p.ms != null ? Number(p.ms).toFixed(1) + ' ms' : '…';
      var up = p.loss == null || p.loss < 100;
      return '<div class="mh-big"><div class="mh-ico" style="background:' + (up ? GRAD.blue : GRAD.red) + '">' + svg('router') + '</div><div><h3>' +
          (up ? 'Access point mode' : 'No internet through main router') + '</h3><p>Wi-Fi is bridged to your main router, which handles internet, VPN, DHCP and DNS.</p></div></div>' +
        '<div class="mh-kv">' + kv('Main router', nm.gateway ? esc(nm.gateway) : '—') + kv('Internet latency', lat) +
          kv('This access point', esc(((m.status || {}).system || {}).lan_ip || location.hostname)) + kv('Uplink', this.uplinkText()) +
          kv('Wi-Fi clients here', String(cliTot ? cliTot.wireless : '—')) + '</div>' +
        (nm.gateway ? '<a class="mh-btn" href="https://' + esc(nm.gateway) + '/" target="_blank" rel="noopener">Open main router ↗</a>' : '');
    },
    /* latest Internet (no-VPN) bufferbloat grade from the speed test */
    bloatText: function(){
      var g = this.mh.st && this.mh.st.last && this.mh.st.last.wan, r = g && g.results && g.results[0];
      if (!r || r.ping == null || (r.dl_lat == null && r.ul_lat == null)) return '<a href="#" data-act="st-wan" style="color:var(--mh-blue)">Run a test</a>';
      var add = Math.max(0, Math.max(Number(r.dl_lat) || 0, Number(r.ul_lat) || 0) - Number(r.ping));
      var gr = add < 5 ? 'A+' : add < 30 ? 'A' : add < 60 ? 'B' : add < 200 ? 'C' : add < 400 ? 'D' : 'F';
      return '<span title="Ping rises ' + Math.round(add) + ' ms when the line is busy">' + gr + ' · +' + Math.round(add) + ' ms</span>';
    },
    /* ---------------- AdGuard Home running on the NAS */
    nasAdgHtml: function(a){
      var m = this.mh, host = m.priv ? 'your NAS' : a.host;
      var head = '<div class="mh-nasb">' + svg('server') + '<span>Running on your NAS' + (m.priv ? '' : ' · <b>' + esc(a.host) + '</b>') + '</span></div>';
      if (!a.ok) return head + '<div class="mh-big"><div class="mh-ico" style="background:' + GRAD.orange + '">' + svg('shield') + '</div><div><h3>Can’t reach AdGuard</h3><p>' + esc(a.err || '') + '</p></div></div>' +
        '<button class="mh-btn" data-act="nasadg">Connection settings</button>';
      var pct = a.queries > 0 ? (a.blocked * 100 / a.queries) : 0;
      var n = function(v){ return v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e4 ? Math.round(v / 1e3) + 'k' : String(v); };
      var spark = '';
      var ser = a.series || [];
      if (ser.length > 1){
        var mx = Math.max.apply(null, ser.concat([1])), w = 100 / (ser.length - 1);
        var pts = ser.map(function(v, i){ return (i * w).toFixed(1) + ',' + (30 - v * 28 / mx).toFixed(1); }).join(' ');
        var bl = (a.series_blocked || []).map(function(v, i){ return (i * w).toFixed(1) + ',' + (30 - v * 28 / mx).toFixed(1); }).join(' ');
        spark = '<svg class="mh-nspark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="var(--mh-teal,#30b0a0)" stroke-width="1.4" vector-effect="non-scaling-stroke"/>' +
          (bl ? '<polyline points="' + bl + '" fill="none" stroke="var(--mh-red)" stroke-width="1.2" vector-effect="non-scaling-stroke"/>' : '') + '</svg>';
      }
      var top = (a.top_blocked || []).slice(0, 3).map(function(t){ return '<div><span>' + esc(m.priv ? 'hidden' : t.name) + '</span><b>' + n(t.count) + '</b></div>'; }).join('');
      return head +
        '<div class="mh-big"><div class="mh-ico" style="background:' + (a.protection ? GRAD.teal : GRAD.orange) + '">' + svg('shield') + '</div><div><h3>' + (a.protection ? 'Protection on' : 'Protection paused') + '</h3><p>' +
          esc(n(a.queries) + ' queries · ' + pct.toFixed(1) + '% blocked' + (a.avg_ms != null ? ' · ' + a.avg_ms + ' ms avg' : '')) + '</p></div></div>' + spark +
        (top ? '<div class="mh-sec">Top blocked · last 24 h</div><div class="mh-ntop">' + top + '</div>' : '') +
        '<a class="mh-btn" href="' + esc(a.url) + '" target="_blank" rel="noopener">Open AdGuard on ' + esc(host) + ' ↗</a><button class="mh-btn sec" data-act="nasadg">Connection</button>';
    },
    openNasAdg: function(){
      var self = this, a = this.mh.nasAdg || {}, dns = this.clientDns() || '192.168.8.210';
      var html = '<div class="hic" style="background:' + GRAD.teal + '">' + svg('shield') + '</div><h2>AdGuard Home on your NAS</h2>' +
        '<p>Show your NAS’s AdGuard stats on this Home tab. The login is stored on the router (root-only) and never shown again.</p>' +
        '<label for="mh-au">AdGuard address</label><input id="mh-au" autocomplete="off" value="' + esc(a.url || '') + '" placeholder="http://' + esc(String(dns).split(',')[0].trim()) + ':8080">' +
        '<p style="text-align:left;font-size:11px;margin-top:4px">The address you open AdGuard’s dashboard with, including the port (e.g. 192.168.8.210:8080).</p>' +
        '<label for="mh-aus">Username</label><input id="mh-aus" autocomplete="off" value="' + esc(a.user || '') + '">' +
        '<label for="mh-ap">Password</label><input id="mh-ap" type="password" autocomplete="new-password" placeholder="' + (a.has_pass ? 'Saved. Type a new one to replace' : '') + '">' +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button>' + (a.configured ? '<button class="dan" data-m="clear">Disconnect</button>' : '') + '<button class="pri" data-m="save">Test &amp; save</button></div>';
      this.openModal(html, {
        clear: function(md, b){ b.disabled = true; rpcx('machome', 'set_nas_adguard', { clear: true }).then(function(){ self.mh.nasAdg = { configured: false }; self.closeModal(); self.paint(); self.toast('Disconnected'); }); },
        save: function(md, b){
          var e = md.querySelector('[data-e]'); e.style.color = ''; e.textContent = '';
          var p = { url: md.querySelector('#mh-au').value.trim(), user: md.querySelector('#mh-aus').value.trim() };
          var pw = md.querySelector('#mh-ap').value; if (pw) p.pass = pw;
          if (p.url && !/^https?:\/\//i.test(p.url)) p.url = 'http://' + p.url;   /* a bare IP / IP:port is fine */
          p.url = p.url.replace(/\/+$/, '');
          if (!/^https?:\/\/[\w.\-:\[\]]+$/i.test(p.url)){ e.textContent = 'Enter the NAS address, like 192.168.8.210:8080'; return; }
          md.querySelector('#mh-au').value = p.url;
          b.disabled = true; b.textContent = 'Testing…';
          rpcx('machome', 'set_nas_adguard', p, 20000).then(function(r){
            b.disabled = false; b.textContent = 'Test & save';
            if (!r || !r.ok){ e.textContent = (r && r.err) || 'Couldn’t save'; return; }
            self.mh.nasAdg = r.status; self.paint();
            if (r.status && r.status.ok){ self.closeModal(); self.toast('Connected to AdGuard on your NAS'); }
            else e.textContent = 'Saved, but: ' + ((r.status && r.status.err) || 'no answer');
          }).catch(function(err){ b.disabled = false; b.textContent = 'Test & save'; e.textContent = err.message; });
        }
      });
    },
    /* ---------------- NAS backup */
    /* Status chips stay on ONE line: if they don't fit, step down text size / padding / gaps until they do
       (the last step lets long labels end in "…"; the full text is in each chip's tooltip). Re-fitted only when
       the chips or the available width change. */
    fitChips: function(){
      var el = this.q('chips'); if (!el) return;
      if (!el.clientWidth) return;                 /* not laid out yet: try again on the next paint */
      var mode = this.$el.classList.contains('mh-and') ? 'a' : 'm';
      if (el.textContent + '|' + el.clientWidth + '|' + mode === el.__fitSig) return;
      var ts = Array.prototype.slice.call(el.querySelectorAll('.t'));
      var L = [['12px', '7px 12px', '9px 16px', '8px'], ['11.5px', '6px 10px', '8px 13px', '6px'], ['11px', '5px 9px', '7px 11px', '5px'],
               ['10.5px', '5px 8px', '6px 9px', '4px'], ['10px', '4px 7px', '5px 8px', '4px']];
      var fits = function(){ return el.scrollWidth <= el.clientWidth + 1; };
      el.classList.add('fit');                     /* measure the chips at their natural (unshrunk) width */
      var ok = false;
      el.classList.remove('wrap');
      for (var s = 0; s < 2 && !ok; s++){          /* pass 1: full labels; pass 2: short labels ("VPN 3/3", "Secure"...) */
        ts.forEach(function(t){ t.textContent = t.getAttribute(s ? 'data-s' : 'data-f'); });
        for (var i = 0; i < L.length; i++){
          el.style.setProperty('--chf', L[i][0]); el.style.setProperty('--chp', L[i][1]); el.style.setProperty('--chpa', L[i][2]); el.style.setProperty('--chg', L[i][3]);
          if (fits()){ ok = true; break; }
        }
      }
      el.classList.remove('fit');
      if (!ok){                                    /* phones / very narrow windows: short labels on two lines beat "O…" */
        el.style.setProperty('--chf', L[2][0]); el.style.setProperty('--chp', L[2][1]); el.style.setProperty('--chpa', L[2][2]); el.style.setProperty('--chg', L[2][3]);
        el.classList.add('wrap');
      }
      el.__fitSig = el.textContent + '|' + el.clientWidth + '|' + mode;
    },
    /* backup health: [color, chip text] or null when NAS backup isn't set up. Healthy = newest backup < 8 days old
       AND the restore check passed on that same file. */
    backupHealth: function(c){
      if (!c || !c.configured) return null;
      var now = Date.now() / 1000, v = c.verify, newest = (c.files || [])[(c.files || []).length - 1];
      if (c.last && c.last_ok !== c.last) return ['var(--mh-red)', 'Backup failed'];
      if (v && v.ok === false && v.name === newest) return ['var(--mh-red)', 'Backup damaged'];
      if (!c.last_ok) return [c.enabled ? 'var(--mh-orange)' : 'var(--mh-text3)', c.enabled ? 'No backup yet' : 'Backups paused'];
      if (now - c.last_ok > 8 * 86400) return ['var(--mh-orange)', c.enabled ? 'Backup overdue' : 'Backups paused'];
      if (!v || !v.ok || v.name !== newest) return ['var(--mh-orange)', 'Backup not verified'];
      return ['var(--mh-green)', 'Backups healthy'];
    },
    verifyText: function(c){
      var v = c && c.verify; if (!v) return 'Not checked yet. Runs automatically after each backup.';
      var when = new Date(v.t * 1000).toLocaleString();
      return v.ok ? '✅ ' + v.name + ' is complete and restorable (' + v.files + ' files, ' + Math.round((v.size || 0) / 1024) + ' KB) · checked ' + when
        : '⚠ ' + (v.err || 'Check failed') + ' · ' + when;
    },
    openNasBackup: function(){
      var self = this;
      rpc('machome', 'get_nas_backup').then(function(c){
        if (!c){ self.toast('Couldn’t load NAS backup settings'); return; }
        self.mh.nasB = c;
        var P = [['ftp','FTP'],['ftps','FTP over TLS (FTPS)'],['webdav','WebDAV (http)'],['webdavs','WebDAV (https)'],['scp','SSH / SCP (key)']];
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Every day'];
        var hrs = ''; for (var h = 0; h < 24; h++) hrs += '<option value="' + h + '"' + (h === c.hour ? ' selected' : '') + '>' + ((h % 12) || 12) + ':00 ' + (h < 12 ? 'AM' : 'PM') + '</option>';
        var dns = String(self.clientDns() || '').split(',')[0].trim();
        var last = c.last ? (c.last_ok === c.last ? '✅ Last backup ' + new Date(c.last * 1000).toLocaleString() : '⚠ Last attempt failed: ' + (c.last_err || '')) : 'No backups yet.';
        var html = '<div class="hic" style="background:' + GRAD.blue + '">' + svg('dl') + '</div><h2>Back up to your NAS</h2>' +
          '<p>Copies the router’s full settings backup to a folder on your NAS on a schedule, keeping the newest ones.</p>' +
          '<label class="mh-mrow"><span><b>Automatic backups</b><small>' + esc(last) + '</small></span><input type="checkbox" class="mh-msw" data-f="enabled"' + (c.enabled ? ' checked' : '') + '></label>' +
          (c.configured ? '<div class="mh-mrow"><span><b>Restore check</b><small data-vr>' + esc(self.verifyText(c)) + '</small></span>' +
            '<button data-m="verify" style="flex:none;border:0;border-radius:8px;padding:6px 12px;background:var(--mh-track);color:var(--mh-text);font:inherit;font-weight:600;cursor:pointer">Verify now</button></div>' : '') +
          '<label for="mh-np">Transfer method</label><select id="mh-np">' + P.map(function(p){ return '<option value="' + p[0] + '"' + (p[0] === c.proto ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select>' +
          '<div class="mh-2c"><div><label for="mh-nh">NAS IP or hostname</label><input id="mh-nh" autocomplete="off" value="' + esc(c.host) + '" placeholder="' + esc(dns || '192.168.8.210') + '"></div>' +
          '<div><label for="mh-npt">Port</label><input id="mh-npt" inputmode="numeric" value="' + (c.port || '') + '" placeholder="default"></div></div>' +
          '<label for="mh-nf">Folder on the NAS</label><input id="mh-nf" autocomplete="off" value="' + esc(c.path) + '" placeholder="/backups/router">' +
          '<div class="mh-2c"><div><label for="mh-nu">Username</label><input id="mh-nu" autocomplete="off" value="' + esc(c.user) + '"></div>' +
          '<div data-pw><label for="mh-npw">Password</label><input id="mh-npw" type="password" autocomplete="new-password" placeholder="' + (c.has_pass ? 'Saved' : '') + '"></div></div>' +
          '<div data-key style="display:none"><label>Router’s public key, add it to the NAS user’s <code>~/.ssh/authorized_keys</code></label><textarea id="mh-nk" readonly rows="3" style="width:100%;font-size:11px">' + esc(c.pubkey || 'Save once with SSH / SCP selected to generate the key') + '</textarea></div>' +
          '<label class="mh-mrow" data-ins><span><b>Accept self-signed certificate</b><small>Most NAS boxes use one for FTPS/WebDAV https</small></span><input type="checkbox" class="mh-msw" data-f="insecure"' + (c.insecure ? ' checked' : '') + '></label>' +
          '<div class="mh-mgrp"><h4>Schedule</h4><label class="mh-mrow"><span><b>When</b></span><span><select id="mh-nd">' + days.map(function(d, i){ return '<option value="' + i + '"' + (i === c.day ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select> <select id="mh-nhr">' + hrs + '</select></span></label>' +
          '<label class="mh-mrow"><span><b>Keep newest</b><small>Older backups are deleted from the NAS</small></span><span><input id="mh-nkp" type="number" min="1" max="52" value="' + (c.keep || 8) + '" style="width:64px"> backups</span></label></div>' +
          '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button data-m="test">Save &amp; back up now</button><button class="pri" data-m="save">Save</button></div>';
        var collect = function(md){
          var p = { proto: md.querySelector('#mh-np').value, host: md.querySelector('#mh-nh').value.trim(), port: md.querySelector('#mh-npt').value.trim() || 0,
            path: md.querySelector('#mh-nf').value.trim(), user: md.querySelector('#mh-nu').value.trim(), day: Number(md.querySelector('#mh-nd').value),
            hour: Number(md.querySelector('#mh-nhr').value), keep: Number(md.querySelector('#mh-nkp').value) || 8,
            enabled: md.querySelector('[data-f="enabled"]').checked, insecure: md.querySelector('[data-f="insecure"]').checked };
          var pw = md.querySelector('#mh-npw').value; if (pw) p.pass = pw;
          return p;
        };
        var save = function(md){
          var p = collect(md);
          if (!p.host) return Promise.reject(new Error('Enter your NAS IP address'));
          return rpcx('machome', 'set_nas_backup', p).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'Couldn’t save'); if (r.pubkey) md.querySelector('#mh-nk').value = r.pubkey; return r; });
        };
        var poll = function(md, e, b, n){
          rpc('machome', 'get_nas_backup').then(function(s){
            if (s && s.running && n < 90){ setTimeout(function(){ poll(md, e, b, n + 1); }, 2000); return; }
            b.disabled = false; b.textContent = 'Save & back up now'; self.mh.nasB = s;
            if (s && s.last_ok && s.last_ok === s.last){ e.style.color = 'var(--mh-green)'; e.textContent = 'Backup saved to the NAS (' + s.files[s.files.length - 1] + ').'; }
            else { e.style.color = ''; e.textContent = 'Backup failed: ' + ((s && s.last_err) || 'unknown error'); }
          });
        };
        self.openModal(html, {
          verify: function(md, b){
            var vr = md.querySelector('[data-vr]'); b.disabled = true; b.textContent = 'Checking…'; vr.textContent = 'Downloading the newest backup from the NAS and checking it…';
            var vpoll = function(n){ rpc('machome', 'get_nas_backup').then(function(s){
              if (s && s.verifying && n < 90){ setTimeout(function(){ vpoll(n + 1); }, 2000); return; }
              b.disabled = false; b.textContent = 'Verify now'; if (s){ self.mh.nasB = s; vr.textContent = self.verifyText(s); self.paint(); } }); };
            rpcx('machome', 'run_nas_verify', {}).then(function(){ setTimeout(function(){ vpoll(0); }, 2500); })
              .catch(function(err){ b.disabled = false; b.textContent = 'Verify now'; vr.textContent = 'Couldn’t start the check: ' + err.message; });
          },
          save: function(md, b){ b.disabled = true; save(md).then(function(){ self.closeModal(); self.toast('NAS backup settings saved'); })
            .catch(function(err){ b.disabled = false; md.querySelector('[data-e]').textContent = err.message; }); },
          test: function(md, b){ var e = md.querySelector('[data-e]'); e.style.color = ''; e.textContent = ''; b.disabled = true; b.textContent = 'Backing up…';
            save(md).then(function(){ return rpcx('machome', 'run_nas_backup', {}); }).then(function(){ setTimeout(function(){ poll(md, e, b, 0); }, 2500); })
              .catch(function(err){ b.disabled = false; b.textContent = 'Save & back up now'; e.textContent = err.message; }); }
        });
        /* show the key box for SCP, the password + certificate options otherwise */
        var md = document.getElementById('machome-modal') || document;
        var sync = function(){ var v = md.querySelector('#mh-np').value; md.querySelector('[data-key]').style.display = v === 'scp' ? '' : 'none';
          md.querySelector('[data-pw]').style.visibility = v === 'scp' ? 'hidden' : ''; md.querySelector('[data-ins]').style.display = (v === 'ftps' || v === 'webdavs') ? '' : 'none'; };
        var sel = md.querySelector('#mh-np'); if (sel){ sel.addEventListener('change', sync); sync(); }
      });
    },
    /* VPN outage log (owner, 2026-11-20): rpc vpn_log; real outages only; filter by provider; Copy / Send to Discord */
    openVpnLog: function(days, prov){
      var self = this;
      days = days || 30; prov = prov || '';
      rpc('machome', 'vpn_log', { days: days, provider: prov }).then(function(r){
        if (!r || !r.ok){ self.toast('Couldn’t load the VPN log'); return; }
        var ev = Array.isArray(r.events) ? r.events : [], pv = Array.isArray(r.providers) ? r.providers : [], tt = Array.isArray(r.totals) ? r.totals : [];
        var dfmt = function(t){ var d = new Date(t * 1000); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + hhmm(t); };
        /* filter pills: the selected one is filled blue */
        var pill = function(on){ return 'margin:0 6px 6px 0;padding:4px 12px;border-radius:14px;font-size:12px;cursor:pointer;border:1px solid ' + (on ? '#0a7cff;background:#0a7cff;color:#fff;font-weight:600' : 'rgba(128,128,128,.45);background:transparent;color:inherit'); };
        var chip = function(p, lab){ return '<button data-m="p" data-p="' + esc(p) + '" style="' + pill(p === prov) + '">' + esc(lab) + '</button>'; };
        var chips = pv.length > 1 ? '<div style="text-align:left">' + chip('', 'All') + pv.map(function(p){ return chip(p, p); }).join('') + '</div>' : '';
        var dchips = '<div style="text-align:left">' + [7, 30, 60].map(function(d){ return '<button data-m="d" data-d="' + d + '" style="' + pill(d === r.days) + '">' + d + ' days</button>'; }).join('') + '</div>';
        var list = ev.length ? ev.map(function(e){
            return '<div class="mh-ilr"><i>' + (e.open ? '🔴' : '🔌') + '</i><span><b>' + esc(dfmt(e.t)) + '</b>' + esc(e.text) + '</span></div>'; }).join('')
          : '<p class="mh-empty">No real VPN outages in this period. (Ping-only blips, where pings stopped but web pages kept loading, aren’t outages and aren’t listed.)</p>';
        var sum = tt.length ? '<p style="text-align:left">' + tt.map(function(x){ return '<b>' + esc(x.name) + '</b>: ' + x.n + ' outage' + (x.n === 1 ? '' : 's') + ' (' + (x.u >= x.n ? 'lengths not recorded' : dur(x.s).trim() + ' in total' + (x.u ? ', ' + x.u + ' with no recorded length' : '')) + ')'; }).join('<br>') + '</p>' : '';
        var html = '<div class="hic" style="background:' + GRAD.purple + '">' + svg('pulse') + '</div><h2>VPN outage log</h2>' +
          '<p>Real outages only: 30 s or more with no pings <b>and</b> no web page through the tunnel. Ready to copy for your VPN provider’s support.</p>' +
          dchips + chips + sum + '<div class="mh-ilog">' + list + '</div>' +
          '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button data-m="copy">Copy as text</button><button class="pri" data-m="send">Send to Discord</button></div>';
        self.openModal(html, {
          p: function(md, b){ self.openVpnLog(r.days, b.getAttribute('data-p') || ''); },
          d: function(md, b){ self.openVpnLog(Number(b.getAttribute('data-d')) || 30, prov); },
          copy: function(md, b){ (navigator.clipboard ? navigator.clipboard.writeText(r.text) : Promise.reject()).then(function(){ b.textContent = 'Copied ✓'; })
            .catch(function(){ md.querySelector('[data-e]').textContent = 'Copy blocked by the browser. Select the list instead.'; }); },
          send: function(md, b){ b.disabled = true; b.textContent = 'Sending…';
            rpcx('machome', 'vpn_log_send', { days: r.days, provider: prov }).then(function(x){ if (!x || !x.ok) throw new Error((x && x.err) || 'not sent'); b.textContent = 'Sent ✓ (within 10 s)'; })
              .catch(function(e){ b.disabled = false; b.textContent = 'Send to Discord'; md.querySelector('[data-e]').textContent = 'Couldn’t send: ' + e.message; }); }
        });
      });
    },
    /* ---------------- ISP report card */
    /* Outage & lag log (owner's pick 9, 2026-11-18): rpc isp_log; Copy / Send to Discord (rpc isp_log_send) */
    openIspLog: function(days){
      var self = this, m = this.mh;
      days = days || 30;
      rpc('machome', 'isp_log', { days: days }).then(function(r){
        if (!r || !r.ok){ self.toast('Couldn’t load the log'); return; }
        var ev = Array.isArray(r.events) ? r.events : [], dl = Array.isArray(r.daily) ? r.daily : [], tt = r.totals || {};
        var IC = { outage: ['🌐', 'var(--mh-red)'], lag: ['🐢', 'var(--mh-orange)'], modem: ['🔁', 'var(--mh-orange)'], slow: ['📉', 'var(--mh-orange)'] };
        var dfmt = function(t){ var d = new Date(t * 1000); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + hhmm(t); };
        var list = ev.length ? ev.map(function(e){ var ic = IC[e.kind] || ['•', 'var(--mh-text2)'];
          return '<div class="mh-ilr"><i>' + ic[0] + '</i><span><b>' + esc(dfmt(e.t)) + '</b>' + esc(e.text) + '</span></div>'; }).join('')
          : '<p class="mh-empty">Nothing recorded in this period: no outages, lag episodes, modem restarts or slow speed tests.</p>';
        var fx = function(v){ return v == null ? '—' : Math.round(v) + ' ms'; };
        var dtab = dl.length ? '<div class="mh-isp"><table><thead><tr><th>Day</th><th>Ping</th><th>Evening</th><th>Lag spikes</th><th>No answer</th></tr></thead><tbody>' + dl.map(function(x){
          var bad = x.eve != null && x.ping != null && x.eve >= x.ping * 2 && x.eve - x.ping >= 20;
          return '<tr><td>' + esc(new Date(x.t * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })) + '</td><td>' + fx(x.ping) + '</td><td' + (bad ? ' style="color:var(--mh-orange)"' : '') + '>' + fx(x.eve) + '</td><td' + (x.spk >= 5 ? ' style="color:var(--mh-orange)"' : '') + '>' + x.spk + '%</td><td>' + x.loss + '%</td></tr>'; }).join('') + '</tbody></table></div>'
          : '<p style="font-size:11px">The per-day table fills in from today (hourly internet stats started on 11-18).</p>';
        var html = '<div class="hic" style="background:' + GRAD.purple + '">' + svg('pulse') + '</div><h2>Outage &amp; lag log</h2>' +
          '<p>Last ' + r.days + ' days: <b>' + (tt.outages || 0) + '</b> outage' + (tt.outages === 1 ? '' : 's') + ' (' + r.uptime + '% online) · <b>' + (tt.lag || 0) + '</b> lag episode' + (tt.lag === 1 ? '' : 's') + ' · <b>' + (tt.modem || 0) + '</b> modem restart' + (tt.modem === 1 ? '' : 's') + ' · <b>' + (tt.slow || 0) + '</b> slow speed test' + (tt.slow === 1 ? '' : 's') + '.</p>' +
          '<div class="mh-ilog">' + list + '</div>' + dtab +
          '<div class="err" data-e></div><div class="btns"><button data-m="back">Back</button><button data-m="copy">Copy as text</button><button class="pri" data-m="send">Send to Discord</button></div>';
        self.openModal(html, {
          back: function(){ self.openIsp(); },
          copy: function(md, b){ (navigator.clipboard ? navigator.clipboard.writeText('Internet log, last ' + r.days + ' days\n' + r.text) : Promise.reject()).then(function(){ b.textContent = 'Copied ✓'; })
            .catch(function(){ md.querySelector('[data-e]').textContent = 'Copy blocked by the browser. Select the list instead.'; }); },
          send: function(md, b){ b.disabled = true; b.textContent = 'Sending…';
            rpcx('machome', 'isp_log_send', { days: r.days }).then(function(x){ if (!x || !x.ok) throw new Error((x && x.err) || 'not sent'); b.textContent = 'Sent ✓ (within 10 s)'; })
              .catch(function(e){ b.disabled = false; b.textContent = 'Send to Discord'; md.querySelector('[data-e]').textContent = 'Couldn’t send: ' + e.message; }); }
        });
      });
    },
    openIsp: function(){
      var self = this;
      rpc('machome', 'get_isp_report').then(function(r){
        if (!r){ self.toast('Couldn’t load the report'); return; }
        var mb = function(v){ return v == null ? '—' : v >= 1000 ? (v / 1000).toFixed(2) + ' Gbps' : Math.round(v) + ' Mbps'; };
        var col = function(p){ return p >= 90 ? 'var(--mh-green)' : p >= 70 ? 'var(--mh-orange)' : 'var(--mh-red)'; };
        var rows = r.months.map(function(x){
          var pd = x.avg_d != null ? x.avg_d * 100 / r.plan_down : null;
          return '<tr><td><b>' + esc(x.label) + '</b></td><td style="color:' + (x.uptime >= 99.9 ? 'var(--mh-green)' : x.uptime >= 99 ? 'var(--mh-orange)' : 'var(--mh-red)') + '">' + x.uptime.toFixed(2) + '%</td>' +
            '<td>' + x.outages + (x.down_s ? ' <small>(' + dur(x.down_s).trim() + ')</small>' : '') + '</td>' +
            '<td>' + mb(x.avg_d) + (pd != null ? ' <small style="color:' + col(pd) + '">' + Math.round(pd) + '%</small>' : '') + '</td><td>' + mb(x.avg_u) + '</td><td>' + mb(x.min_d) + '</td>' +
            '<td>' + (x.tests ? Math.round(x.ok80 * 100 / x.tests) + '%' : '—') + ' <small>of ' + x.tests + '</small></td></tr>';
        }).join('');
        var since = r.since ? new Date(r.since * 1000).toLocaleDateString() : 'today';
        var html = '<div class="hic" style="background:' + GRAD.purple + '">' + svg('pulse') + '</div><h2>ISP report card</h2>' +
          '<p>Internet outages and router-side speed tests (no VPN) by month. Data since ' + esc(since) + '.</p>' +
          '<div class="mh-2c"><div><label for="mh-pd">Plan download (Mbps)</label><input id="mh-pd" type="number" value="' + r.plan_down + '"></div><div><label for="mh-pu">Plan upload (Mbps)</label><input id="mh-pu" type="number" value="' + r.plan_up + '"></div></div>' +
          '<div class="mh-isp"><table><thead><tr><th>Month</th><th>Uptime</th><th>Outages</th><th>Avg ↓</th><th>Avg ↑</th><th>Slowest ↓</th><th>Tests ≥80% plan</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p style="font-size:11px;text-align:left">Outages count when the router can’t reach the internet for 30 s or more. Speeds come from the nightly and manual “Test Internet” runs.</p>' +
          '<div class="mh-mrow" style="justify-content:flex-start;gap:10px;margin-top:8px"><button class="mh-btn" data-m="log" style="margin:0">Outage &amp; lag log (30 days)</button><small style="color:var(--mh-text2)">Every outage, lag episode, modem restart and slow speed test, ready to copy or send to Discord for your ISP.</small></div>' +
          '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button data-m="copy">Copy as text</button><button class="pri" data-m="save">Save plan</button></div>';
        self.openModal(html, {
          log: function(){ self.openIspLog(30); },
          save: function(md, b){ b.disabled = true;
            rpcx('machome', 'set_alerts', { plan_down: Number(md.querySelector('#mh-pd').value), plan_up: Number(md.querySelector('#mh-pu').value) })
              .then(function(){ self.closeModal(); self.toast('Plan saved'); self.openIsp(); }).catch(function(err){ b.disabled = false; md.querySelector('[data-e]').textContent = err.message; }); },
          copy: function(md, b){
            var t = 'ISP report card (plan ' + mb(r.plan_down) + ' / ' + mb(r.plan_up) + ')\n' + r.months.map(function(x){
              return x.label + ': uptime ' + x.uptime.toFixed(2) + '%, ' + x.outages + ' outage(s)' + (x.down_s ? ' (' + dur(x.down_s).trim() + ')' : '') + ', avg ' + mb(x.avg_d) + ' down / ' + mb(x.avg_u) + ' up, slowest ' + mb(x.min_d) + ', ' + x.tests + ' tests'; }).join('\n');
            (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ b.textContent = 'Copied ✓'; }).catch(function(){ md.querySelector('[data-e]').textContent = 'Copy blocked by the browser. Select the table instead.'; });
          }
        });
      });
    },
    /* ---------------- one-tap pause / resume (GL's block list) */
    pauseDevice: function(key){
      var self = this, m = this.mh, c = m.devMap[key]; if (!c) return;
      var nm = m.priv ? 'Device' : (c.alias || c.name || 'Device'), on = !c.blocked;
      var go = function(){
        return rpcx('machome', 'pause_device', { mac: c.mac, ip: c.ip, pause: on }).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'The router didn’t accept it');
          c.blocked = on; self.paint(); self.refreshSoon(2500);
          return nm + (on ? ' paused' : ' resumed');
        });
      };
      /* the DNS server (your NAS) needs internet for every device's lookups; double-check before pausing it */
      var dnsIps = String(this.clientDns() || '').split(/[ ,]+/);
      if (on && c.ip && dnsIps.indexOf(c.ip) > -1){
        return this.confirm({ title: 'Pause your DNS server?', icon: 'devices', grad: GRAD.red, danger: true, ok: 'Pause anyway', working: 'Pausing…',
          body: '<p>' + esc(nm) + ' is the DNS server (AdGuard) for your whole network. Pausing it can stop <b>every</b> device from loading websites.</p>' }, go);
      }
      go().then(function(msg){ self.toast(msg); }).catch(function(e){ self.toast('Couldn’t ' + (on ? 'pause' : 'resume') + ': ' + e.message); });
    },
    /* ---------------- weather */
    weather: function(){
      var self = this;
      rpc('machome', 'get_weather').then(function(w){ if (!w || !self.mh.alive) return; self.mh.wth = w; self.paintWeather(); });
    },
    wxIcon: function(id){
      var sun = '<circle cx="24" cy="24" r="8" fill="#ffcc33"/><g stroke="#ffcc33" stroke-width="2.6" stroke-linecap="round"><path d="M24 7v4M24 37v4M7 24h4M37 24h4M12 12l2.8 2.8M33.2 33.2l2.8 2.8M12 36l2.8-2.8M33.2 14.8l2.8-2.8"/></g>';
      var moon = function(x, y, s){ return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M20 6a14 14 0 1 0 16 17A11 11 0 0 1 20 6z" fill="#f2e8be"/>'; };
      var cloud = function(c, y){ return '<path transform="translate(0 ' + (y || 0) + ')" d="M14 36h21a8 8 0 0 0 0-16 11 11 0 0 0-21-2 9 9 0 0 0 0 18z" fill="' + c + '"/>'; };
      var drops = function(c){ return '<g stroke="' + c + '" stroke-width="2.6" stroke-linecap="round"><path d="M17 37l-2 6M25 37l-2 6M33 37l-2 6"/></g>'; };
      var I = {
        1: sun, 2: moon(4, 4, 1),
        3: cloud('#b0b8c8', -3) + cloud('#f5f7fc', 2),
        4: '<g transform="translate(-1 -2) scale(.7)">' + sun + '</g>' + cloud('#f5f7fc', 4),
        5: moon(0, 0, .75) + cloud('#f5f7fc', 4),
        6: cloud('#d4dae6', -6) + drops('#5aaaff'),
        7: cloud('#f5f7fc', -6) + '<g fill="#fff"><circle cx="16" cy="40" r="2"/><circle cx="24" cy="44" r="2"/><circle cx="32" cy="40" r="2"/></g>',
        8: cloud('#8a93a8', -6) + '<path d="M26 30l-7 9h5l-3 8 9-11h-5l3-6z" fill="#ffd60a"/>',
        9: '<g stroke="#d4dae6" stroke-width="3" stroke-linecap="round"><path d="M8 16h32M6 24h36M10 32h28"/></g>'
      };
      return '<svg class="wi" viewBox="0 0 48 48" aria-hidden="true">' + (I[id] || I[3]) + '</svg>';
    },
    paintWeather: function(){
      var w = this.mh.wth; if (!w) return;
      var priv = this.mh.priv;
      /* weather turned off (2.6.7, Settings → Weather): nothing on the page */
      if (w.off){ this.set('wxz', ''); this.set('wxw', ''); return; }
      /* location prompt at the top until one is set (or "Not now"). US ZIP or a city anywhere (2.6.7) */
      if (!w.zip && !w.dismissed){
        if (!this.q('wxz').querySelector('.mh-zip'))
          this.set('wxz', '<div class="mh-zip">' + this.wxIcon(4) + '<div class="tx"><b>Show your local weather</b><small>Enter a US ZIP code or your city (e.g. London, GB) for weather on this Home screen' +
            (w.screen_supported ? ' and on the router’s touchscreen sleep screen' : '') + '. Forecast from Open-Meteo, no account needed. Don’t want weather? “Not now”, or turn it off in Settings → Weather.</small></div>' +
            '<input id="mh-zipin" maxlength="80" placeholder="ZIP or city" autocomplete="off"><button class="mh-btn" data-act="zip-save">Save</button>' +
            '<button class="mh-wxd" data-act="zip-later">Not now</button><div class="er" data-k="ziperr"></div></div>');
      } else this.set('wxz', '');
      var d = w.data;
      if (!w.zip || !d){ this.set('wxw', w.zip ? '<div class="mh-wth grey" data-act="wth">' + this.wxIcon(3) + '<div class="c"><b>Weather</b><span>Loading forecast…</span></div></div>' : ''); return; }
      var r = function(v){ return v == null ? '--' : Math.round(v); };
      var self = this, days = (d.days || []).slice(1, 4);
      var dn = function(s){ var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { weekday: 'short' }); };
      var cls = d.is_day === 0 ? ' night' : ([3, 6, 7, 8, 9].indexOf(d.icon) >= 0 ? ' grey' : '');
      var place = priv ? 'Local weather' : (d.place || w.place || '');
      this.set('wxw', '<div class="mh-wth' + cls + '" data-act="radar">' + this.wxIcon(d.icon) +
        '<div class="t">' + r(d.temp) + '°</div><div class="c"><b>' + esc(d.cond || '') + '</b><span>H ' + r(d.hi) + '° · L ' + r(d.lo) + '°</span><br><span>' + esc(place) + '</span></div>' +
        (days.length ? '<div class="fc">' + days.map(function(x){ return '<div>' + esc(dn(x.date)) + self.wxIcon(x.icon) + r(x.hi) + '°/' + r(x.lo) + '°</div>'; }).join('') + '</div>' : '') + '</div>');
    },
    zipSave: function(){
      var self = this, inp = this.$el.querySelector('#mh-zipin'), er = this.q('ziperr'), b = this.$el.querySelector('[data-act="zip-save"]');
      var z = inp ? inp.value.trim() : '';
      if (!z || z.length > 80){ if (er) er.textContent = 'Enter a US ZIP code or your city'; return; }
      if (b){ b.disabled = true; b.textContent = 'Saving…'; }
      rpcx('machome', 'set_weather', { place: z }, 30000).then(function(r){
        if (!r || !r.ok) throw new Error((r && r.err) || 'Couldn’t save');
        self.toast('Weather set for ' + (self.mh.priv ? 'your location' : (r.place || z)));
        self.weather();
      }).catch(function(e){ if (b){ b.disabled = false; b.textContent = 'Save'; } if (er) er.textContent = e.message; });
    },
    zipLater: function(){
      var self = this;
      rpcx('machome', 'set_weather', { dismiss: true }).then(function(){ self.toast('You can add weather later from Control Center'); self.weather(); });
    },
    /* Easter egg: clicking the weather box opens a live Ventusky radar. Nothing is loaded until it is clicked,
       and the whole window (iframe included) is removed on close, so it uses no memory afterwards. */
    openRadar: function(){
      var self = this, m = this.mh, w = m.wth || {};
      if (m.radarEl) return;
      var btn = 'border:0;border-radius:8px;padding:5px 10px;font:inherit;cursor:pointer;background:rgba(255,255,255,.12);color:#f5f5f7';
      var ov = document.createElement('div'); ov.id = 'machome-radar';
      ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:3000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
      ov.innerHTML = '<div style="width:1200px;max-width:100%;height:800px;max-height:100%;border-radius:16px;overflow:hidden;background:#15161a;box-shadow:0 20px 60px rgba(0,0,0,.5);display:flex;flex-direction:column">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px 8px 14px;background:#1d1e24;color:#f5f5f7;font:13px -apple-system,BlinkMacSystemFont,system-ui,sans-serif">' +
        '<b style="flex:1;font-size:14px">Weather radar</b>' +
        '<a data-r="full" target="_blank" rel="noopener noreferrer" style="color:#64d2ff;text-decoration:none;margin-right:6px;display:none">Open Ventusky ↗</a>' +
        '<button data-r="zip" style="' + btn + '">Weather settings</button><button data-r="x" title="Close (Esc)" style="' + btn + '">✕</button></div>' +
        '<div data-r="body" style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;color:#a1a1a6;font:14px system-ui,sans-serif">Loading radar…</div></div>';
      ov.addEventListener('click', function(e){
        var r = e.target.closest ? e.target.closest('[data-r]') : null, k = r && r.getAttribute('data-r');
        if (e.target === ov || k === 'x'){ self.closeRadar(); return; }
        if (k === 'zip'){ self.closeRadar(); self.openWeather(); }
      });
      document.body.appendChild(ov); m.radarEl = ov;
      var show = function(lat, lon, z){
        if (m.radarEl !== ov) return;   /* closed before the location came back */
        var p = (Math.round(lat * 10) / 10) + ';' + (Math.round(lon * 10) / 10) + ';' + z;
        var full = ov.querySelector('[data-r="full"]'); full.href = 'https://www.ventusky.com/?p=' + p + '&l=radar'; full.style.display = '';
        ov.querySelector('[data-r="body"]').innerHTML = '<iframe src="https://embed.ventusky.com/?p=' + p + '&l=radar" title="Ventusky weather radar" ' +
          'style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" loading="eager" referrerpolicy="no-referrer"></iframe>';
      };
      if (m.radarLoc) return show(m.radarLoc[0], m.radarLoc[1], 7);
      if (w.lat != null && w.lon != null) return show(w.lat, w.lon, 7);   /* saved location, anywhere (2.6.7) */
      if (!w.zip || !/^\d{5}$/.test(String(w.zip)) || !window.fetch) return show(39.8, -98.6, 4);   /* no ZIP: whole US */
      fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + w.zip + '&count=1&countryCode=US', { referrerPolicy: 'no-referrer' })
        .then(function(r){ return r.json(); })
        .then(function(j){ var g = j && j.results && j.results[0]; if (!g) throw 0; m.radarLoc = [g.latitude, g.longitude]; show(g.latitude, g.longitude, 7); })
        .catch(function(){ show(39.8, -98.6, 4); });
    },
    closeRadar: function(){
      var ov = this.mh && this.mh.radarEl; if (!ov) return;
      var f = ov.querySelector('iframe'); if (f) f.src = 'about:blank';   /* stop the map before removing it */
      ov.remove(); this.mh.radarEl = null;
    },
    openWeather: function(){
      var self = this, w = this.mh.wth || {};
      var html = '<div class="hic" style="background:' + GRAD.blue + '">' + this.wxIcon(4) + '</div><h2>Weather</h2>' +
        '<p>Forecast from Open-Meteo, refreshed every 20 minutes by the router.</p>' +
        '<div class="mh-mgrp"><label class="mh-mrow"><span><b>Show weather</b><small>Off: no weather on the Home tab and no forecast downloads' + (w.screen_supported ? '; the touchscreen gets its own wallpaper back' : '') + '.</small></span>' +
          '<input type="checkbox" class="mh-msw" data-f="on"' + (w.off ? '' : ' checked') + '></label></div>' +
        '<label for="mh-wzip">Location: US ZIP code or a city</label><input id="mh-wzip" maxlength="80" autocomplete="off" placeholder="' + (w.zip ? (this.mh.priv ? 'Saved' : esc(w.place || w.zip)) : 'e.g. 60601, London, Toronto, CA') + '">' +
        '<p style="font-size:11px;text-align:left;margin:4px 0 0">Outside the US, use your city name; add the country if there are several (London, GB · London, CA). Temperatures follow Settings → Temperature unit.</p>' +
        (w.screen_supported ? '<div class="mh-mgrp"><h4>Touchscreen</h4><label class="mh-mrow"><span><b>Weather on sleep screen</b><small>Replaces the sleep-screen wallpaper with a weather background (the clock stays). Turning this off restores your wallpaper.</small></span>' +
          '<input type="checkbox" class="mh-msw" data-f="screen"' + (w.screen !== false ? ' checked' : '') + '></label>' +
          '<label class="mh-mrow"><span><b>Radar background</b><small>Live weather radar map behind the weather (refreshed every 15 minutes, from Iowa State University / National Weather Service; covers the US only, elsewhere it shows the sky). With no rain nearby it shows a sun, or a moon and stars at night.</small></span>' +
          '<input type="checkbox" class="mh-msw" data-f="radar"' + (w.radar !== false ? ' checked' : '') + '></label></div>' : '') +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button class="pri" data-m="save">Save</button></div>';
      this.openModal(html, {
        save: function(md, b){
          var p = {}, z = md.querySelector('#mh-wzip').value.trim(), sc = md.querySelector('[data-f="screen"]'), on = md.querySelector('[data-f="on"]').checked;
          if (!on){   /* turn weather off (2.6.7) */
            b.disabled = true; b.textContent = 'Saving…';
            return rpcx('machome', 'set_weather', { off: true }, 30000).then(function(){ self.closeModal(); self.toast('Weather turned off'); self.weather(); })
              .catch(function(e){ b.disabled = false; b.textContent = 'Save'; md.querySelector('[data-e]').textContent = e.message; });
          }
          if (w.off) p.off = false;
          if (z){ if (z.length > 80){ md.querySelector('[data-e]').textContent = 'Enter a US ZIP code or a city'; return; } p.place = z; }
          if (w.off && !z && !w.zip){ md.querySelector('[data-e]').textContent = 'Enter a US ZIP code or a city to turn weather on'; return; }
          if (sc) p.screen = sc.checked;
          var rd = md.querySelector('[data-f="radar"]'); if (rd) p.radar = rd.checked;
          if (!p.place && p.off === undefined && p.screen === undefined && p.radar === undefined){ self.closeModal(); return; }
          b.disabled = true; b.textContent = 'Saving…';
          rpcx('machome', 'set_weather', p, 30000).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'Couldn’t save');
            self.closeModal(); self.toast('Weather settings saved'); self.weather();
          }).catch(function(e){ b.disabled = false; b.textContent = 'Save'; md.querySelector('[data-e]').textContent = e.message; });
        }
      });
    },
    /* Internet card → "WAN ping" (owner, 2026-11-17): Cloudflare, Google and Quad9 pinged directly over the internet
       connection (not the VPN) every 10 s by the sampler (live.wp). 24 h graph + per-server now / averages / jitter / loss. */
    wanPingHtml: function(){
      var L = (this.mh.stats && this.mh.stats.live) || {}, W = L.wp, isAP = this.isAP();
      if (!W || !Array.isArray(W.servers) || !W.servers.length) return '';
      var NM = { '1.1.1.1': ['Cloudflare', '#f38020'], '8.8.8.8': ['Google', '#34a853'], '9.9.9.9': ['Quad9', '#bf5af2'] };
      var msf = function(v){ return v == null ? '—' : (v < 10 ? Number(v).toFixed(1) : Math.round(v)) + ' ms'; };
      var latCol = function(v){ return v == null ? 'var(--mh-red)' : v < 30 ? 'var(--mh-green)' : v < 80 ? 'var(--mh-orange)' : 'var(--mh-red)'; };
      var lossf = function(v){ return v == null ? 'n/a' : (v === 0 ? '0' : v < 10 ? Number(v).toFixed(1) : Math.round(v)) + '%'; };
      var S = W.servers;
      /* graph with numbers (owner, 2026-11-17 evening): "Last hour" (60 one-minute points, fills in within minutes) or
         "24 hours" (96 x 15-minute points). ms scale on the left, times along the bottom, hover anywhere for exact values. */
      var rng = this.mh.wpRange === '24h' ? '24h' : '1h';
      var key = rng === '1h' ? 's1' : 'series', stepS = rng === '1h' ? 60 : 900, t0 = rng === '1h' ? W.s1start : W.s24start, n = rng === '1h' ? 60 : 96;
      if (!t0) t0 = (L.time || Math.floor(Date.now() / 1000)) - (n - 1) * stepS;
      var all = []; S.forEach(function(s){ (s[key] || []).forEach(function(v){ if (v >= 0) all.push(v); }); });
      var seg = '<div class="mh-seg2 mh-wps"><button data-act="wprange" data-arg="1h" class="' + (rng === '1h' ? 'on' : '') + '">Last hour</button>' +
        '<button data-act="wprange" data-arg="24h" class="' + (rng === '24h' ? 'on' : '') + '">24 hours</button></div>';
      var graph;
      if (!all.length) graph = '<div class="mh-wpg"><div class="mh-wpe">Collecting… the first points appear within a minute.</div></div>';
      else {
        all.sort(function(a, b){ return a - b; });
        var mx = all[all.length - 1], p95 = all[Math.min(all.length - 1, Math.floor(all.length * 0.95))];
        var nice = function(x){ var st = [10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];
          for (var i = 0; i < st.length; i++) if (st[i] >= x) return st[i]; return Math.ceil(x / 1000) * 1000; };
        var top = nice(mx <= p95 * 3 ? mx * 1.1 : p95 * 1.3), clipped = mx > top;   /* one huge spike doesn't flatten the rest */
        var w = 300, h = 100;
        var X = function(i){ return (i / (n - 1)) * w; }, Y = function(v){ return h - 4 - Math.min(v, top) / top * (h - 8); };
        var grid = [0, top / 4, top / 2, top * 3 / 4, top].map(function(v){ return '<line x1="0" x2="' + w + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="gl"/>'; }).join('');
        var lines = S.map(function(s){
          var ser = s[key] || [], d = '';
          ser.forEach(function(v, i){
            if (v < 0) return;
            var x = X(i).toFixed(1), y = Y(v).toFixed(1);
            if (i > 0 && ser[i - 1] >= 0) d += 'L' + x + ' ' + y;
            else d += 'M' + x + ' ' + y + (ser[i + 1] != null && ser[i + 1] >= 0 ? '' : 'h0.01');   /* a lone point shows as a dot */
          });
          return d ? '<path d="' + d + '" fill="none" stroke="' + (NM[s.ip] || ['', '#888'])[1] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' : '';
        }).join('');
        var hov = '', cw = w / (n - 1);
        for (var i = 0; i < n; i++){
          if (!S.some(function(s){ return (s[key] || [])[i] >= 0; })) continue;
          var vals = S.map(function(s){ var v = (s[key] || [])[i]; return (NM[s.ip] || [s.ip])[0] + ' ' + (v >= 0 ? msf(v) : '—'); }).join(' · ');
          hov += '<rect x="' + Math.max(0, X(i) - cw / 2).toFixed(1) + '" y="0" width="' + cw.toFixed(2) + '" height="' + h + '" fill="transparent"><title>' +
            hhmm(t0 + i * stepS) + (rng === '24h' ? '–' + hhmm(t0 + (i + 1) * stepS) : '') + ': ' + vals + '</title></rect>';
        }
        var yl = [top, top * 3 / 4, top / 2, top / 4, 0].map(function(v){ return '<span style="top:' + (Y(v) / h * 100).toFixed(1) + '%">' + (v < 10 && v > 0 ? v.toFixed(1) : Math.round(v)) + ' ms</span>'; }).join('');
        graph = '<div class="mh-wpg"><div class="mh-wpc"><div class="yl">' + yl + '</div><svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + grid + lines + hov + '</svg></div>' +
          '<div class="ax"><span>' + hhmm(t0) + '</span><span>' + hhmm(t0 + Math.floor(n / 2) * stepS) + '</span><span>now</span></div>' +
          '<div class="lg">' + S.map(function(s){ var nm = NM[s.ip] || [s.ip, '#888']; return '<span><i style="background:' + nm[1] + '"></i>' + nm[0] + '</span>'; }).join('') +
          (clipped ? '<span style="margin-left:auto">peaks up to ' + Math.round(mx) + ' ms are cut off at the top</span>' : '') + '</div></div>';
      }
      graph = seg + graph;
      var rows = S.map(function(s){
        var nm = NM[s.ip] || [s.ip, '#888'], m10 = s.m10 || {}, h1 = s.h1 || {}, h24 = s.h24 || {};
        return '<div class="mh-r mh-hrow"><i class="d" style="background:' + nm[1] + '"></i><div class="m"><b>' + nm[0] + ' <small style="display:inline;color:var(--mh-text3)">' + s.ip + '</small></b>' +
          '<small>avg 10 min ' + msf(m10.ms) + ' · 1 h ' + msf(h1.ms) + ' · 24 h ' + msf(h24.ms) + '</small>' +
          '<small>jitter ' + (s.jitter != null ? Number(s.jitter).toFixed(1) + ' ms' : '—') + ' · loss 1 h <span style="color:' + lossColor(h1.loss) + '">' + lossf(h1.loss) + '</span> · 24 h <span style="color:' + lossColor(h24.loss) + '">' + lossf(h24.loss) + '</span></small>' +
          (s.lo != null ? '<small>24 h range ' + Math.round(s.lo) + '–' + Math.round(s.hi) + ' ms (1-minute averages)</small>' : '') + '</div>' +
          '<div class="x"><b style="color:' + latCol(s.now) + '">' + (s.now == null ? 'No reply' : msf(s.now)) + '</b>now</div></div>';
      }).join('');
      var since = S[0] && S[0].since, nowS = L.time || Math.floor(Date.now() / 1000);
      return '<div class="mh-wpwrap"><div class="mh-sec">WAN ping · direct, not through the VPN</div>' + graph + '<div class="mh-rows">' + rows + '</div>' +
        '<div class="mh-stn">Pinged every 10 s from the router over ' + (isAP ? 'the main router' : 'your internet connection') + '. Hover the graph for exact values. Jitter = average change between checks over the last 10 min.' +
        (since && nowS - since < 86000 ? ' Collecting since ' + hhmm(since) + '; the 24 h numbers fill in over the day.' : '') + '</div></div>';
    },
    liveTunnels: function(){
      var m = this.mh, L = (m.stats && m.stats.live) || {}, now = L.time || Math.floor(Date.now() / 1000);
      return ((m.vpn && m.vpn.status_list) || []).filter(function(v){ var hs = L.wg && L.wg[v.via]; return v.enabled && v.status === 1 && hs && now - hs < 180; });
    },
    /* Speed Test card → "Test VPN" (owner, 2026-11-17): choose ONE tunnel to test, or all of them one after another */
    pickSpeedVpn: function(){
      var self = this, m = this.mh, T = this.liveTunnels(), prov = m.prov || {};
      if (m.st && m.st.running) return;
      if (!T.length){ this.toast('No VPN tunnel is connected right now'); return; }
      var last = (m.st && m.st.last && m.st.last.vpn && m.st.last.vpn.results) || [], now = Math.floor(Date.now() / 1000);
      var lastOf = function(via){
        var r = last.filter(function(x){ return x && x.iface === via && x.down != null; })[0];
        return r ? 'last ↓ ' + (r.down >= 1000 ? (r.down / 1000).toFixed(2) + ' Gbps' : Math.round(r.down) + ' Mbps') + (r.time > 1e9 ? ', ' + ago(now - r.time) : '') : 'not tested yet';
      };
      var btn = function(arg, title, sub, all){ return '<button class="mh-srv" data-m="go" data-v="' + esc(arg) + '"' + (all ? ' style="border-color:var(--mh-purple)"' : '') + '><span class="m"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span><span class="ck">›</span></button>'; };
      var body = T.map(function(v){
        var p = prov[String(v.group_id)];
        return btn(v.via, v.name + (p ? ' (' + p + ')' : ''), (v.type === 'openvpn' ? 'OpenVPN' : 'WireGuard') + (m.priv || !v.peer_name ? '' : ' · ' + v.peer_name) + ' · ' + lastOf(v.via));
      }).join('') + (T.length > 1 ? btn('all', 'All ' + T.length + ' tunnels', 'one after another · about ' + Math.ceil(T.length * 35 / 60) + ' min · ' + (T.length * 2) + '–' + (T.length * 4) + ' GB', true) : '');
      var html = '<div class="hic" style="background:' + GRAD.blue + '">' + svg('pulse') + '</div><h2>Which VPN do you want to test?</h2>' +
        '<p>Pick one tunnel, or test them all one after another. Only connected tunnels are listed.</p>' +
        '<div class="mh-srvl">' + body + '</div><div class="btns"><button data-m="cancel">Close</button></div>';
      this.openModal(html, { go: function(md, b){ var v = b.getAttribute('data-v'); self.startSpeed('vpn', v === 'all' ? null : v); } });
    },
    startSpeed: function(mode, iface){
      var self = this, LT = this.liveTunnels(), n = LT.length;
      if (this.mh.st && this.mh.st.running) return;
      var one = iface ? LT.filter(function(v){ return v.via === iface; })[0] : null;
      if (iface && !one){ this.toast('That tunnel isn’t connected right now'); return; }
      if (one) n = 1;
      var oneName = one ? one.name + ((this.mh.prov || {})[String(one.group_id)] ? ' (' + this.mh.prov[String(one.group_id)] + ')' : '') : '';
      this.confirm({
        title: mode === 'wan' ? 'Run an Internet speed test?' : mode === 'all' ? 'Test the Internet and ' + n + ' VPN tunnel' + (n === 1 ? '' : 's') + '?' : one ? 'Test ' + oneName + '?' : 'Test all ' + n + ' VPN tunnel' + (n === 1 ? '' : 's') + '?',
        icon: 'pulse', grad: GRAD.blue, ok: 'Start Test', working: 'Starting…',
        body: '<p>' + (mode === 'wan' ? 'Tests your connection directly, bypassing the VPN.' : mode === 'all' ? 'Tests the Internet directly first, then each connected tunnel, one at a time.' : one ? 'Tests only this tunnel; the other tunnels keep their earlier results.' : 'Tests each connected tunnel one at a time.') + ' Uses Ookla Speedtest from the router.</p>' +
              '<p>' + (mode === 'all' ? 'Takes about ' + Math.max(1, Math.round((n + 1) * 30 / 60)) + '–' + Math.ceil((n + 1) * 40 / 60) + ' minutes and uses roughly <b>' + (5 + n * 2) + '–' + (7 + n * 4) + ' GB</b>'
                : 'Takes about 30 seconds ' + (mode === 'wan' || one ? '' : 'per tunnel ') + 'and uses roughly <b>' + (mode === 'wan' ? '5–7 GB' : one ? '2–4 GB' : '2–4 GB per tunnel') + '</b>') + ' of data at your speeds. Other devices will notice slower internet while it runs.</p>' },
        function(){ return rpcx('machome', 'start_speedtest', one ? { mode: 'vpn', iface: one.via } : { mode: mode }).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'the test could not start');
          setTimeout(function(){ self.speed(); }, 600); return null; }); });
    },
    cancelSpeed: function(){
      var self = this;
      rpcx('machome', 'cancel_speedtest', {}).then(function(){ setTimeout(function(){ self.speed(); }, 800); }).catch(function(){ self.toast('Could not cancel the test'); });
    },
    spdHtml: function(){
      var m = this.mh, S = m.st || {}, st = S.state || {}, last = S.last || {}, running = !!S.running;
      var byIf = {}; ((m.vpn && m.vpn.status_list) || []).forEach(function(v){ if (v.via) byIf[v.via] = v; });
      var prov = m.prov || {};
      var nameOf = function(r){
        if (r.kind === 'wan') return 'Internet';
        var v = byIf[r.iface]; if (!v) return r.iface;
        var p = prov[String(v.group_id)];
        return v.name + (p ? ' (' + p + ')' : '');
      };
      var peerOf = function(r){ if (r.kind === 'wan') return 'No VPN'; if (m.priv) return 'Server hidden'; var v = byIf[r.iface]; return v && v.peer_name ? v.peer_name : (/^ovpn/.test(r.iface || '') ? 'OpenVPN' : 'WireGuard'); };
      var nT = this.liveTunnels().length;
      var cur = (running && st.current && typeof st.current === 'object') ? st.current : null;
      var fmt = function(v){ return v == null ? '—' : v >= 1000 ? (v / 1000).toFixed(2) : v >= 100 ? Math.round(v) : v.toFixed(1); };
      var unit = function(v){ return v != null && v >= 1000 ? 'Gbps' : 'Mbps'; };

      /* gauge */
      var val = null, color = '#0a84ff', ph = 'Ready', sb = 'Choose a test to start', prog = null, scale = 2500;
      var recent = null;
      ['wan', 'vpn'].forEach(function(k){ var g = last[k]; if (g && g.results && g.results.length && (!recent || g.finished > recent.finished)) recent = g; });
      if (cur){
        scale = cur.kind === 'wan' ? 2500 : 1500;
        val = cur.phase === 'upload' ? cur.up : cur.phase === 'download' ? cur.down : null;
        color = cur.phase === 'upload' ? '#bf5af2' : '#0a84ff';
        ph = { connecting: 'Connecting…', ping: 'Measuring ping…', download: 'Download', upload: 'Upload' }[cur.phase] || 'Testing…';
        sb = esc(nameOf(cur)) + (st.total > 1 ? ' · ' + st.index + ' of ' + st.total : '') + (cur.server ? '<br>' + esc(cur.server.name + ' · ' + cur.server.location) : '');
        var pf = cur.progress || 0, seg = cur.phase === 'upload' ? 0.6 + pf * 0.4 : cur.phase === 'download' ? 0.1 + pf * 0.5 : pf * 0.1;
        prog = ((Math.max(st.index, 1) - 1) + seg) / Math.max(st.total, 1);
      } else if (running){ ph = 'Starting…'; sb = 'Preparing the test'; prog = 0; }
      else if (recent){
        var best = recent.results.filter(function(r){ return r.down != null; })[0];
        if (best){ val = best.down; scale = best.kind === 'wan' ? 2500 : 1500; ph = 'Last result'; sb = esc(nameOf(best)) + ' · ' + ago(Math.floor(Date.now() / 1000) - recent.finished); }
      }
      var R = 72, C = 2 * Math.PI * R, arc = 0.75;
      var frac = val != null ? Math.min(1, val / scale) : 0;
      var g = '<div class="mh-stg"><div class="ring"><svg viewBox="0 0 170 170"><g transform="rotate(135 85 85)">' +
        '<circle class="trk" cx="85" cy="85" r="' + R + '" stroke-dasharray="' + (C * arc).toFixed(1) + ' ' + C.toFixed(1) + '"/>' +
        '<circle class="val" cx="85" cy="85" r="' + R + '" stroke="' + color + '" stroke-dasharray="' + (C * arc * frac).toFixed(1) + ' ' + C.toFixed(1) + '"/></g></svg>' +
        '<div class="num"><b>' + (val != null ? fmt(val) : '—') + '</b><small>' + (val != null ? unit(val) : 'Mbps') + '</small></div></div>' +
        '<div class="ph">' + ph + '</div><div class="sb">' + sb + '</div>' +
        (prog != null ? '<div class="mh-bar"><i style="width:' + Math.round(prog * 100) + '%;background:var(--mh-blue)"></i></div>' : '') + '</div>';

      /* controls */
      var h = '<div><div class="mh-stb">' +
        '<button class="mh-btn" data-act="st-wan"' + (running ? ' disabled' : '') + '>Test Internet</button>' +
        '<button class="mh-btn" data-act="st-vpn"' + (running || !nT ? ' disabled' : '') + ' title="Choose one tunnel, or all of them">Test VPN' + (nT ? ' (' + nT + ' tunnel' + (nT > 1 ? 's' : '') + ') ▾' : ' (none connected)') + '</button>' +
        '<button class="mh-btn" data-act="st-all"' + (running ? ' disabled' : '') + ' style="background:var(--mh-purple)">Test Both' + (nT ? ' (Internet + ' + nT + ')' : '') + '</button>' +
        (running ? '<button class="mh-btn sec" data-act="st-cancel">Cancel</button>' : '') +
        '<button class="mh-btn sec" data-act="isp">ISP report card</button></div>' +
        '<div class="mh-stn">Runs Ookla Speedtest on the router itself, so results reflect the router and its connections, not your device’s Wi-Fi or cable. Tests run one at a time.' +
        (function(){ var x = (m.stats && m.stats.live && m.stats.live.x) || {}, sc = x.sched; if (!sc) return '';
          var hr = sc.hour, lbl = (hr % 12 || 12) + ' ' + (hr < 12 ? 'AM' : 'PM');
          return sc.enabled ? ' <b style="color:var(--mh-text2)">Nightly: Internet + VPN at ' + lbl + '.</b> <a href="#" data-act="alerts" style="color:var(--mh-blue)">Change</a>' : ' Nightly test is off. <a href="#" data-act="alerts" style="color:var(--mh-blue)">Turn on</a>'; })() + '</div>';

      /* results */
      var rows = function(list, liveIface){
        var max = 0; list.forEach(function(r){ max = Math.max(max, r.down || 0, r.up || 0); }); max = Math.max(max, 1000);
        return list.map(function(r){
          if (r.error) return '<div class="mh-str err"><div><b>' + esc(nameOf(r)) + '</b><small>' + esc(peerOf(r) + (r._age ? ' · ' + r._age : '')) + '</small></div><div style="color:var(--mh-orange)">' + esc(r.error) + '</div></div>';
          var bar = function(v, c){ return '<div class="mh-bar"><i style="width:' + Math.max(1, Math.round((v || 0) * 100 / max)) + '%;background:' + c + '"></i></div>'; };
          return '<div class="mh-str' + (r.iface === liveIface ? ' live' : '') + '"><div><b>' + esc(nameOf(r)) + '</b><small>' + esc(peerOf(r) + (r._age ? ' · ' + r._age : '')) + '</small></div>' +
            (function(){
              var full = r.server && r.server.name ? String(r.server.name) : '—';
              var short = full.length > 10 ? full.slice(0, 10).replace(/\s+$/, '') + '…' : full;
              return '<div class="srv" title="' + esc(full + (r.server && r.server.location ? ' · ' + r.server.location : '')) + '"><b>' + esc(short) + '</b><small>' + esc(r.server && r.server.location ? r.server.location : '') + '</small></div>';
            })() +
            '<div class="sp"><b>' + (r.ping != null ? Number(r.ping).toFixed(1) : '—') + '</b><small>ms · jitter ' + (r.jitter != null ? Number(r.jitter).toFixed(1) : '—') + '</small>' +
            (function(){
              /* bufferbloat: extra latency while the line is saturated (Ookla's loaded latency vs idle ping) */
              if (r.ping == null || (r.dl_lat == null && r.ul_lat == null)) return '';
              var add = Math.max(0, Math.max(Number(r.dl_lat) || 0, Number(r.ul_lat) || 0) - Number(r.ping));
              var gr = add < 5 ? ['A+', 'var(--mh-green)'] : add < 30 ? ['A', 'var(--mh-green)'] : add < 60 ? ['B', '#9bc53d'] : add < 200 ? ['C', 'var(--mh-orange)'] : add < 400 ? ['D', 'var(--mh-red)'] : ['F', 'var(--mh-red)'];
              return '<small class="bb" title="Bufferbloat: ping rises ' + Math.round(add) + ' ms when the connection is busy (↓ ' + Math.round(r.dl_lat || 0) + ' ms, ↑ ' + Math.round(r.ul_lat || 0) + ' ms under load)">' +
                'load +' + Math.round(add) + ' ms <i style="background:' + gr[1] + '">' + gr[0] + '</i></small>';
            })() + '</div>' +
            (function(){
              var lv = (r.loss != null && r.loss !== '' && !isNaN(Number(r.loss))) ? Number(r.loss) : null, done = r.time != null;
              return '<div class="sp"><b style="color:' + (done ? lossColor(lv) : 'var(--mh-text3)') + '">' + (!done ? '—' : lv == null ? 'n/a' : (lv === 0 ? '0' : lv < 10 ? lv.toFixed(1) : Math.round(lv)) + '%') + '</b><small>' + (!done ? 'measuring' : lv == null ? 'not reported' : 'packet loss') + '</small></div>';
            })() +
            '<div class="sp"><b>' + fmt(r.down) + '</b> <small style="display:inline">' + unit(r.down) + ' ↓</small>' + bar(r.down, '#0a84ff') + '</div>' +
            '<div class="sp"><b>' + fmt(r.up) + '</b> <small style="display:inline">' + unit(r.up) + ' ↑</small>' + bar(r.up, '#bf5af2') + '</div></div>';
        }).join('');
      };
      var group = function(key, title){
        var res, when, liveIf = null;
        var inRun = running && (st.mode === key || st.mode === 'all');
        if (inRun){
          res = (st.results || []).filter(function(r){ return r.kind === key; });
          if (cur && cur.kind === key){ res.push({ iface: cur.iface, kind: cur.kind, server: cur.server, ping: cur.ping, down: cur.down, up: cur.up }); liveIf = cur.iface; }
          when = res.length ? 'testing now' : 'waiting…';
          if (!res.length && last[key] && last[key].results){ res = last[key].results; when = 'up next · showing previous'; }
        }
        if (!inRun && last[key] && last[key].results){ res = last[key].results; when = 'tested ' + ago(Math.floor(Date.now() / 1000) - last[key].finished); }
        /* one tunnel being tested (VPN chooser): keep showing the other tunnels' earlier results below it */
        if (inRun && key === 'vpn' && st.only && last.vpn && last.vpn.results){
          var seenIf = {}; res.forEach(function(r){ seenIf[r.iface] = 1; });
          last.vpn.results.forEach(function(r){ if (r && !seenIf[r.iface]) res.push(r); });
        }
        if (!res || !res.length) return '';
        /* rows from an earlier test than the newest one say how old they are */
        var fin = last[key] && last[key].finished, nowS = Math.floor(Date.now() / 1000);
        res = res.map(function(r){
          if (r && r.time > 1e9 && ((inRun && st.only && r.iface !== st.only) || (!inRun && fin && fin - r.time > 600))){ var c = {}; for (var k in r) c[k] = r[k]; c._age = 'tested ' + ago(nowS - r.time); return c; }
          return r;
        });
        var gb = 0; res.forEach(function(r){ if (!r._age) gb += (r.down_bytes || 0) + (r.up_bytes || 0); });
        return '<div class="mh-sth"><span>' + title + '</span><span>' + when + (gb ? ' · used ' + (gb / 1e9).toFixed(1) + ' GB' : '') + '</span></div>' + rows(res, liveIf);
      };
      var body = group('wan', 'Internet (no VPN)') + group('vpn', 'VPN tunnels');
      h += body ? '<div class="mh-stt"><div class="mh-str hd"><div>Path</div><div>Server</div><div>Ping</div><div>Loss</div><div>Download</div><div>Upload</div></div>' + body + '</div>'
                : '<div class="mh-empty" style="margin-top:12px">No results yet. Run a test to see download, upload and ping for each path.</div>';
      if (!running && st.error) h += '<div class="mh-empty" style="color:var(--mh-orange)">' + esc(st.error) + '</div>';
      h += this.leakHtml();
      return '<div class="mh-st">' + g + h + '</div></div>';
    },
    /* ---- VPN leak test (under the speed test results; routers with VPN tunnels only) */
    leakHtml: function(){
      var m = this.mh; if (this.isAP()) return '';   /* access points don't hand out DNS or run tunnels */
      var L = m.leak || {}, r = L.result, running = !!L.running, priv = m.priv;
      var mask = function(s){ return priv ? String(s).replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, '•••.•••.•••.•••') : String(s); };
      var hasVpn = !!(m.tun && m.tun.tunnels && m.tun.tunnels.length);
      var h = '<div class="mh-sth" style="margin-top:0"><span>' + (hasVpn ? 'VPN &amp; DNS leak test' : 'DNS leak test') + '</span><span>' + (running ? 'testing now…' : r && r.t ? 'tested ' + ago(Math.floor(Date.now() / 1000) - r.t) : 'not run yet') + '</span></div>';
      /* hourly DNS provider watch */
      var W = Array.isArray(L.watch) ? L.watch : [];
      if (W.length){
        var cur = W[W.length - 1], since = cur.t; for (var i = W.length - 1; i >= 0 && W[i].n === cur.n; i--) since = W[i].t;
        var hist = []; W.slice(-24).forEach(function(x){ if (!hist.length || hist[hist.length - 1].n !== x.n) hist.push(x); });
        h += '<div class="mh-dnsw' + (cur.leak ? ' bad' : '') + '"><span class="i">' + (cur.leak ? '⚠️' : '🛡') + '</span><span><b>DNS provider: ' + esc(cur.n) + '</b><small>Checked every hour · this provider since ' +
          esc(new Date(since * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) + ' · last check ' + ago(Math.floor(Date.now() / 1000) - cur.t) +
          (hist.length > 1 ? '<br>Last 24 checks: ' + hist.map(function(x){ return esc(x.n); }).join(' → ') : '') + '</small></span></div>';
      }
      if (r && r.checks && r.checks.length && !running){
        var bad = r.checks.filter(function(c){ return c.ok === false; }).length;
        /* collapsible: one summary line with an arrow; the check list opens on click (owner, 2026-11-13).
           Opens by itself when something failed, and remembers if you opened it (m.leakOpen, kept across refreshes). */
        var passed = r.checks.filter(function(c){ return c.ok === true; }).length;
        h += '<details class="mh-leakd"' + (bad || m.leakOpen ? ' open' : '') + '><summary class="mh-leaksum" style="color:' + (bad ? 'var(--mh-orange)' : 'var(--mh-green)') + '">' +
          (bad ? '⚠ ' + bad + ' possible leak' + (bad > 1 ? 's' : '') + ' found' : '✅ No leaks found') + '<span class="n">' + passed + ' check' + (passed === 1 ? '' : 's') + ' passed · details</span></summary>' +
          '<div class="mh-leak">' + r.checks.map(function(c){
            return '<div' + (c.ok === false ? ' class="bad"' : '') + '><span class="i">' + (c.ok === true ? '✅' : c.ok === false ? '⚠️' : 'ℹ️') + '</span><span><b>' + esc(mask(c.title)) + '</b><small>' + esc(mask(c.detail)) + '</small></span></div>'; }).join('') + '</div></details>';
      }
      h += '<div class="mh-stb" style="margin-top:8px"><button class="mh-btn sec" data-act="leak"' + (running ? ' disabled' : '') + '>' + (running ? 'Testing… (about 30 s)' : r ? 'Run leak test again' : 'Run leak test') + '</button></div>' +
        '<div class="mh-stn">' + (hasVpn ? 'Checks from the router that nothing gets around the VPN: each tunnel hides your home address, devices can only leave through a tunnel, the kill switch and IPv6. ' : '') +
        'The DNS check shows which company actually answers your devices’ lookups (works with or without a VPN) and warns if it’s your internet provider. Read-only: nothing is changed and no traffic is interrupted.</div>';
      return '<div class="mh-lbox">' + h + '</div>';
    },
    leakRun: function(){
      var self = this, m = this.mh;
      m.leak = m.leak || {}; m.leak.running = true; this.set('spd', this.spdHtml());
      var poll = function(n){ rpc('machome', 'get_leaktest').then(function(r){
        if (!m.alive) return;
        if (r && r.running && n < 40){ setTimeout(function(){ poll(n + 1); }, 3000); return; }
        m.leak = r || { running: false }; self.set('spd', self.spdHtml());
        if (r && r.result && r.result.checks){ var bad = r.result.checks.filter(function(c){ return c.ok === false; }).length; self.toast(bad ? bad + ' possible VPN leak' + (bad > 1 ? 's' : '') + ' found' : 'VPN leak test: no leaks found'); }
      }); };
      rpcx('machome', 'run_leaktest', {}).then(function(){ setTimeout(function(){ poll(0); }, 4000); })
        .catch(function(e){ m.leak.running = false; self.set('spd', self.spdHtml()); self.toast('Couldn’t start the leak test: ' + e.message); });
    },
    openCC: function(){
      var n = this.q('cc'); if (!n) return;
      this.mh.ccOpen = true; n.hidden = false; n.__h = null; this.set('cc', this.ccHtml());
      var b = this.$el.querySelector('.mh-ccb'); if (b) b.classList.add('on');
    },
    closeCC: function(){
      if (!this.mh.ccOpen) return;
      this.mh.ccOpen = false;
      var n = this.q('cc'); if (n) n.hidden = true;
      var b = this.$el.querySelector('.mh-ccb'); if (b) b.classList.remove('on');
    },
    openModal: function(html, handlers){
      this.closeModal();
      var self = this, md = document.createElement('div');
      md.id = 'machome-modal';
      if (this.$el.classList.contains('mh-and')) md.classList.add('mh-and');
      if (this.$el.classList.contains('mh-dark')) md.classList.add('mh-dark');
      var cs = getComputedStyle(this.$el);
      VARS.forEach(function(v){ md.style.setProperty(v, cs.getPropertyValue(v)); });
      md.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
      md.addEventListener('click', function(e){
        if (e.target === md){ if (!self.mh.busy) self.closeModal(); return; }
        var b = e.target.closest('[data-m]'); if (!b || b.disabled) return;
        var k = b.getAttribute('data-m');
        if (k === 'cancel'){ if (!self.mh.busy) self.closeModal(); return; }
        if (handlers && handlers[k]) handlers[k](md, b);
      });
      document.body.appendChild(md);
      var f = md.querySelector('input') || md.querySelector('[data-m=cancel]'); if (f) f.focus();
      return md;
    },
    closeModal: function(){
      var md = document.getElementById('machome-modal'); if (md) md.remove();
      if (this.mh){ this.mh.busy = false; }
    },
    confirm: function(o, run){
      var self = this;
      var html = '<div class="hic" style="background:' + (o.grad || GRAD.blue) + '">' + svg(o.icon || 'shield') + '</div><h2>' + esc(o.title) + '</h2>' + (o.body || '') +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Cancel</button><button class="' + (o.danger ? 'dan' : 'pri') + '" data-m="ok">' + esc(o.ok || 'Confirm') + '</button></div>';
      this.openModal(html, { ok: function(md, btn){
        var cancel = md.querySelector('[data-m=cancel]');
        self.mh.busy = true; btn.disabled = true; cancel.disabled = true; btn.textContent = o.working || 'Working…';
        Promise.resolve().then(run).then(function(msg){
          self.closeModal(); if (msg) self.toast(msg); self.refreshSoon(4000); self.refreshSoon(12000);
        }).catch(function(err){
          self.mh.busy = false; btn.disabled = false; cancel.disabled = false; btn.textContent = o.ok || 'Confirm';
          md.querySelector('[data-e]').textContent = 'That didn’t work: ' + ((err && err.message) || 'the router returned an error') + '. Check the setting on its own page.';
        });
      }});
    },
    toast: function(msg){
      var t = document.getElementById('machome-toast');
      if (!t){ t = document.createElement('div'); t.id = 'machome-toast'; document.body.appendChild(t); }
      var cs = getComputedStyle(this.$el); VARS.forEach(function(v){ t.style.setProperty(v, cs.getPropertyValue(v)); });
      t.textContent = msg; t.classList.add('show');
      clearTimeout(this.mh.toastT); this.mh.toastT = setTimeout(function(){ t.classList.remove('show'); }, 3500);
    },
    /* VPN card (owner, 2026-11-15): click a tunnel to pick another saved WireGuard (or, since 11-17, OpenVPN) server for it.
       The list comes from machome.get_vpn_providers (names and locations only). Saving = GL's own set_tunnel with the
       chosen server first in the tunnel's list (same as Auto-heal's server switch). */
    openVpnServer: function(id){
      var self = this, m = this.mh, T = (m.tun && m.tun.tunnels) || [];
      var t = T.filter(function(x){ return String(x.tunnel_id) === String(id); })[0];
      if (!t) return;
      var via = t.via || {}, cf = (via.configs || [])[0] || {}, cur = (cf.id_list || [])[0];
      /* WireGuard and OpenVPN (2026-11-17). Only servers of the tunnel's own type are listed: switching a tunnel between
         WireGuard and OpenVPN changes its interface, so that stays in GL's VPN page. */
      var kind = via.type || 'wireguard';
      if (kind !== 'wireguard' && kind !== 'openvpn'){ this.toast('This tunnel type can’t be changed here. Use GL’s VPN page for this one.'); return; }
      var S = (Array.isArray(m.srv) ? m.srv : []).filter(function(s){ return (s.kind || 'wireguard') === kind; });
      if (!S.length){ this.toast('No saved ' + (kind === 'openvpn' ? 'OpenVPN' : 'WireGuard') + ' servers found yet. Add servers in GL’s VPN page.'); return; }
      /* the server each OTHER tunnel is using right now: two tunnels on one server (same key) knock each other offline.
         Keyed by type too: a WireGuard and an OpenVPN server can have the same id number. */
      var used = {}; T.forEach(function(o){ if (o === t || ((o.via || {}).type || 'wireguard') !== kind) return; var c = ((o.via || {}).configs || [])[0]; if (c && c.id_list && c.id_list.length) used[String(c.id_list[0])] = o.name; });
      var groups = {}, order = [];
      S.forEach(function(s){ var g = String(s.group_id); if (!groups[g]){ groups[g] = []; order.push(g); } groups[g].push(s); });
      order.sort(function(a, b){ return (b === String(cf.group_id)) - (a === String(cf.group_id)); });
      var body = order.map(function(g){
        var list = groups[g];
        return '<div class="mh-srvg">' + esc(list[0].provider || 'VPN') + (g === String(cf.group_id) ? ' · current provider' : '') + '</div>' + list.map(function(s, i){
          var isCur = String(s.peer_id) === String(cur), by = used[String(s.peer_id)];
          var nm = m.priv ? (s.provider || 'VPN') + ' server ' + (i + 1) : s.name;
          var sub = isCur ? (t.enabled ? 'In use now' : 'Selected (tunnel is off)') : by ? 'In use by ' + by + ', pick another' : (m.priv ? '' : s.location.replace(/,/g, ', '));
          return '<button class="mh-srv' + (isCur ? ' cur' : '') + '" data-m="pick" data-p="' + esc(s.peer_id) + '" data-g="' + esc(s.group_id) + '"' + (isCur || by ? ' disabled' : '') + '>' +
            '<span class="m"><b>' + esc(nm) + '</b><small>' + esc(sub) + '</small></span>' + (isCur ? '<span class="ck">✓</span>' : '') + '</button>';
        }).join('');
      }).join('');
      var html = '<div class="hic" style="background:' + GRAD.purple + '">' + svg('lock') + '</div><h2>' + esc(t.name) + ' server</h2>' +
        '<p>Pick a server for this tunnel. Only servers already saved in GL’s VPN page are listed; add more there.</p>' +
        '<div class="mh-srvl">' + body + '</div><div class="btns"><button data-m="cancel">Close</button></div>';
      this.openModal(html, { pick: function(md, b){
        var p = Number(b.getAttribute('data-p')), g = Number(b.getAttribute('data-g'));
        var s = S.filter(function(x){ return Number(x.peer_id) === p; })[0] || {};
        var nm = m.priv ? (s.provider || 'another') + ' server' : s.name;
        self.confirm({ title: 'Switch ' + t.name + ' to ' + nm + '?', icon: 'lock', grad: GRAD.purple, ok: 'Switch', working: 'Switching…',
          body: '<p>' + esc(t.name) + ' reconnects to the new server. Devices on it lose internet for a few seconds' + (t.killswitch ? ' (the kill switch blocks them until it’s connected, so nothing leaks)' : '') + '.</p>' +
            (String(g) !== String(cf.group_id) ? '<p>This also changes the provider for ' + esc(t.name) + ' to <b>' + esc(s.provider || 'another provider') + '</b>.</p>' : '') +
            (t.enabled ? '' : '<p>The tunnel is off right now: the new server is saved and used when you turn it on.</p>') },
          function(){
            var n = JSON.parse(JSON.stringify(t)), nv = n.via || (n.via = {});
            if (String(g) === String(cf.group_id) && Array.isArray(cf.id_list)){
              nv.configs = [{ group_id: g, id_list: [p].concat(cf.id_list.filter(function(x){ return Number(x) !== p; })) }];
            } else nv.configs = [{ group_id: g, id_list: [p] }];
            return rpcx('vpn-client', 'set_tunnel', n, 30000).then(function(){
              t.via = n.via; return t.name + ' is switching to ' + nm;
            });
          });
      }});
    },
    doVpn: function(id){
      var m = this.mh, t = ((m.tun && m.tun.tunnels) || []).filter(function(x){ return Number(x.tunnel_id) === id; })[0];
      if (!t) return;
      var off = !!t.enabled;
      this.confirm({ title: (off ? 'Turn off ' : 'Turn on ') + t.name + '?', icon: 'lock', grad: GRAD.purple, danger: off,
        ok: off ? 'Turn Off' : 'Turn On', working: off ? 'Turning off…' : 'Turning on…',
        body: off ? '<p>Devices routed through ' + esc(t.name) + ' will stop using this VPN.' + (t.killswitch ? ' Its kill switch is on, so those devices may lose internet access until you turn it back on.' : '') + '</p>'
                  : '<p>Devices assigned to ' + esc(t.name) + ' will route through the VPN again.</p>' },
        function(){ return rpcx('vpn-client', 'set_tunnel', { tunnel_id: t.tunnel_id, enabled: !off }, 30000).then(function(){ t.enabled = !off; return t.name + (off ? ' turned off' : ' turned on'); }); });
    },
    doAdg: function(){
      var m = this.mh, on = !!(m.adg && m.adg.enabled), lanDns = m.stats && m.stats.lan_dns && m.stats.lan_dns.length;
      this.confirm({ title: on ? 'Turn off AdGuard Home?' : 'Turn on AdGuard Home?', icon: 'shield', grad: GRAD.teal, danger: on,
        ok: on ? 'Turn Off' : 'Turn On', working: on ? 'Turning off…' : 'Starting AdGuard…',
        body: on ? '<p>Ad and tracker filtering will stop.</p>'
                 : '<p>AdGuard Home will start on the router.</p>' + (lanDns ? '<p><b>Heads up:</b> DHCP tells your devices to use <b>' + esc(this.clientDns()) + '</b> for DNS, so they won’t be filtered by AdGuard until that is changed.</p>' : '') },
        function(){
          var p = on ? { enabled: false } : { enabled: true, dns_enabled: !!(m.adg && m.adg.dns_enabled) };
          return rpcx('adguardhome', 'set_config', p, 60000).then(function(){ return on ? 'AdGuard Home turned off' : 'AdGuard Home is starting'; });
        });
    },
    doLed: function(){
      var m = this.mh, on = !!(m.led && m.led.led_enable);
      this.confirm({ title: on ? 'Turn off the status LEDs?' : 'Turn on the status LEDs?', icon: 'bulb', grad: GRAD.orange, ok: on ? 'Turn Off' : 'Turn On',
        body: '<p>' + (on ? 'The lights on the router will go dark. Your LED schedule (on at 7 AM, off at 9 PM) can still switch them back.' : 'The lights on the router will turn back on.') + '</p>' },
        function(){ return rpcx('led', 'set_config', { led_enable: !on }).then(function(){ m.led = { led_enable: !on }; return on ? 'LEDs turned off' : 'LEDs turned on'; }); });
    },
    doReboot: function(){
      var self = this;
      this.confirm({ title: 'Restart the router?', icon: 'power', grad: GRAD.red, danger: true, ok: 'Restart', working: 'Restarting…',
        body: '<p>Your whole network, including the VPN, will be offline for about a minute.</p>' },
        function(){ return rpcx('system', 'reboot', { delay: 1 }).then(function(){ setTimeout(function(){ self.rebootWait(); }, 60); return null; }); });
    },
    /* Control Center → Restart modem: presses Restart on the cable gateway (router mode + modem connected only) */
    doModemRestart: function(){
      var self = this;
      this.confirm({ title: 'Restart the cable modem?', icon: 'power', grad: GRAD.orange, danger: true, ok: 'Restart Modem', working: 'Restarting the modem…',
        body: '<p>The router will press <b>Restart</b> on your Xfinity gateway.</p>' +
          '<p><b>Everyone loses internet for about 5–10 minutes</b>, including the VPN. Xfinity Voice and Xfinity Home also go down while it restarts. Your Wi-Fi and this page keep working.</p>' },
        function(){
          return rpcx('machome', 'modem_restart_now', {}, 60000).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'the modem didn’t answer');
            return 'Modem is restarting. The internet should be back in about 5–10 minutes.';
          });
        });
    },
    rebootWait: function(){
      var self = this, t0 = Date.now();
      this.openModal('<div class="spin"></div><h2>Restarting…</h2><p data-w>This page reloads by itself when the router is back.</p>', {});
      this.mh.busy = true;
      var poll = function(){
        if (Date.now() - t0 > 300000){ var md = document.getElementById('machome-modal'), p = md && md.querySelector('[data-w]'); if (p) p.textContent = 'Still waiting. If this keeps going, refresh the page.'; }
        fetch('/?_=' + Date.now(), { cache: 'no-store' }).then(function(r){ if (r.ok) location.reload(); else setTimeout(poll, 3000); }).catch(function(){ setTimeout(poll, 3000); });
      };
      setTimeout(poll, 30000);
    },
    doBackup: function(){
      var self = this;
      this.confirm({ title: 'Download a settings backup?', icon: 'dl', grad: GRAD.blue, ok: 'Download', working: 'Creating backup…',
        body: '<p>Saves the router’s full configuration so you can restore it later.</p><p><b>Keep the file private:</b> it contains your VPN private keys and the admin password hash.</p>' },
        function(){
          return rpcx('machome', 'make_backup', {}, 60000).then(function(r){
            if (!r || !r.ok) throw new Error('the backup could not be created');
            var sid = cookie('Admin-Token');
            if (!sid) throw new Error('your login session was not found; log in again and retry');
            var d = new Date(), host = (self.mh.stats && self.mh.stats.hostname) || 'router';
            var name = host + '-backup-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '.tar.gz';
            var ifr = document.getElementById('machome-dl');
            if (!ifr){ ifr = document.createElement('iframe'); ifr.id = 'machome-dl'; ifr.name = 'machome-dl'; ifr.style.display = 'none'; document.body.appendChild(ifr); }
            var f = document.createElement('form'); f.method = 'POST'; f.action = '/download'; f.target = 'machome-dl'; f.style.display = 'none';
            [['path', r.path], ['sid', sid], ['filename', name], ['delete', '1']].forEach(function(p){ var i = document.createElement('input'); i.type = 'hidden'; i.name = p[0]; i.value = p[1]; f.appendChild(i); });
            document.body.appendChild(f); f.submit(); f.remove();
            return 'Backup downloaded (' + bytes(r.size) + ')';
          });
        });
    },
    /* ---- watched devices (watch.lua): "Alert me if it goes offline" in the device sheet; main routers only */
    devWatchHtml: function(c){
      if (this.isAP() || !c || !c.mac) return '';
      var w = (this.mh.watch && this.mh.watch.watched) || {}, on = !!w[String(c.mac).toUpperCase()];
      return '<label class="mh-mrow" style="margin-top:8px"><span><b>Alert me if it goes offline</b><small>A message after 3 minutes offline, and again when it’s back. Good for a NAS, cameras or a PC that should always be on.</small></span>' +
        '<input type="checkbox" class="mh-msw" data-m="dwatch"' + (on ? ' checked' : '') + '></label>';
    },
    /* ---- cable modem signal (watch.lua reads the Xfinity gateway at 10.0.0.1 hourly) */
    /* Internet card "Cable modem signal" row (HTML, click opens the modem sheet); plain = text only (Settings window) */
    modemText: function(plain){
      var w = this.mh.watch; if (!w || !w.modem_set) return null;
      var d = w.modem; if (!d) return 'Reading…';
      if (!d.ok) return plain ? 'Can’t read the modem' : '<a href="#" data-act="modem" style="color:var(--mh-orange)">Can’t read the modem</a>';
      var bad = d.issues && d.issues.length, f1 = function(v){ return v == null ? '—' : (Math.round(v * 10) / 10); };
      var bits = [];
      if (d.snr_min != null) bits.push('SNR ' + Math.round(d.snr_min) + ' dB');
      if (d.ds_n) bits.push(d.ds_n + '↓ ' + (d.us_n || 0) + '↑ ch');
      var status = bad ? 'Check signal' : 'Good', txt = status + (bits.length ? ' · ' + bits.join(' · ') : '');
      if (plain) return txt;
      return '<a href="#" data-act="modem" style="color:inherit;text-decoration:none" title="Downstream ' + f1(d.ds_min) + ' to ' + f1(d.ds_max) + ' dBmV · SNR ' + f1(d.snr_min) + ' to ' + f1(d.snr_max) + ' dB · upstream ' + f1(d.us_min) + ' to ' + f1(d.us_max) + ' dBmV. Click for details.">' +
        '<span style="color:' + (bad ? 'var(--mh-orange)' : 'var(--mh-green)') + '">' + status + '</span>' + (bits.length ? ' · ' + bits.join(' · ') : '') + '</a>';
    },
    /* gateway uptime: read hourly (up_s at time t), counted forward to now. "2 days 9 h", "5 h 12 min", "8 min" */
    modemUptime: function(){
      var w = this.mh.watch, d = w && w.modem_set && w.modem;
      if (!d || !d.ok || d.up_s == null || !d.t) return null;
      var s = d.up_s + Math.max(0, Math.floor(Date.now() / 1000) - d.t), dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60);
      return dd ? dd + (dd === 1 ? ' day ' : ' days ') + h + ' h' : h ? h + ' h ' + mi + ' min' : mi + ' min';
    },
    openModem: function(){
      var self = this, m = this.mh, w = m.watch || {}, d = w.modem, f1 = function(v){ return v == null ? '—' : (Math.round(v * 10) / 10); };
      var cur = !w.modem_set ? '<p>Not set up yet.</p>' : !d ? '<p>Saved. Reading the modem…</p>' : !d.ok ? '<p style="color:var(--mh-orange)">Couldn’t read the modem: ' + esc(d.err || '') + '</p>' :
        '<div class="kv">' +
        (d.product || d.model ? '<div><span>Gateway</span><b>' + esc([d.product, [d.vendor, d.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')) + '</b></div>' : '') +
        '<div><span>Downstream channels</span><b>' + (d.ds_n || 0) + (d.ds_ofdm ? ' (' + d.ds_ofdm + ' DOCSIS 3.1)' : '') + (d.ds_unlock ? ' · <span style="color:var(--mh-orange)">' + d.ds_unlock + ' not locked</span>' : d.ds_n ? ' · all locked' : '') + '</b></div>' +
        '<div><span>Downstream power <small style="color:var(--mh-text3)">(OK −10 to +10)</small></span><b>' + f1(d.ds_min) + ' to ' + f1(d.ds_max) + ' dBmV</b></div>' +
        '<div><span>Signal-to-noise <small style="color:var(--mh-text3)">(OK 33+)</small></span><b>' + f1(d.snr_min) + (d.snr_max != null ? ' to ' + f1(d.snr_max) : '') + ' dB</b></div>' +
        '<div><span>Upstream channels</span><b>' + (d.us_n || 0) + (d.us_ofdma ? ' (' + d.us_ofdma + ' DOCSIS 3.1)' : '') + (d.us_unlock ? ' · <span style="color:var(--mh-orange)">' + d.us_unlock + ' not locked</span>' : d.us_n ? ' · all locked' : '') + '</b></div>' +
        '<div><span>Upstream power <small style="color:var(--mh-text3)">(OK up to 51)</small></span><b>' + f1(d.us_min) + ' to ' + f1(d.us_max) + ' dBmV</b></div>' +
        (d.corr != null ? '<div><span>Corrected errors</span><b>' + Number(d.corr).toLocaleString() + '</b></div>' : '') +
        (d.uncorr != null ? '<div><span>Uncorrectable errors</span><b>' + Number(d.uncorr).toLocaleString() + '</b></div>' : '') +
        (this.modemUptime() ? '<div><span>Modem uptime</span><b>' + this.modemUptime() + '</b></div>' : '') +
        (d.t ? '<div><span>Last read</span><b>' + ago(Math.floor(Date.now() / 1000) - d.t) + '</b></div>' : '') + '</div>' +
        (d.issues && d.issues.length ? '<p style="color:var(--mh-orange)">' + esc(d.issues.join('; ')) + '</p>' : '<p style="color:var(--mh-green)">All within the normal range.</p>');
      var html = '<div class="hic" style="background:' + GRAD.blue + '">' + svg('globe') + '</div><h2>Cable modem</h2>' +
        '<p>The router reads your Xfinity gateway (10.0.0.1) every hour and warns you if the cable signal drifts out of the normal range, which usually comes before slowdowns or drops.</p>' + cur +
        '<label for="mh-mpw">Gateway admin password</label><input id="mh-mpw" type="password" autocomplete="off" placeholder="' + (w.modem_set ? 'Saved. Type a new one to replace' : 'The password for 10.0.0.1 (user: admin)') + '">' +
        '<p style="text-align:left;font-size:11px;margin-top:6px">Stored on the router only (root-only) and never shown again. Only used to read the status page; nothing on the modem is changed.</p>' +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button>' + (w.modem_set ? '<button data-m="clear">Remove</button><button data-m="test">Read now</button>' : '') + '<button class="pri" data-m="save">Save & test</button></div>';
      var test = function(md, b){
        var e = md.querySelector('[data-e]'); e.style.color = ''; e.textContent = 'Reading the modem… (up to 20 seconds)'; if (b) b.disabled = true;
        rpcx('machome', 'modem_test', {}, 45000).then(function(r){
          if (b) b.disabled = false;
          if (!r || !r.ok){ e.textContent = 'Couldn’t read it: ' + ((r && r.err) || 'no answer'); return; }
          m.watch = m.watch || {}; m.watch.modem = r; m.watch.modem_set = true;
          e.style.color = 'var(--mh-green)'; e.textContent = 'Read OK: ' + (r.ds_n || 0) + ' downstream channels, SNR ' + f1(r.snr_min) + ' dB.';
          setTimeout(function(){ self.openModem(); }, 900);
        }).catch(function(x){ if (b) b.disabled = false; e.textContent = x.message; });
      };
      this.openModal(html, {
        save: function(md, b){
          var pw = md.querySelector('#mh-mpw').value, e = md.querySelector('[data-e]');
          if (!pw){ if (w.modem_set) return test(md, b); e.textContent = 'Enter the gateway password.'; return; }
          b.disabled = true;
          rpcx('machome', 'modem_set', { pass: pw }).then(function(r){ b.disabled = false; if (!r || !r.ok) throw new Error((r && r.err) || 'not saved'); md.querySelector('#mh-mpw').value = ''; test(md, b); })
            .catch(function(x){ b.disabled = false; e.textContent = x.message; });
        },
        test: function(md, b){ test(md, b); },
        clear: function(md, b){ b.disabled = true; rpcx('machome', 'modem_set', { clear: true }).then(function(){ if (m.watch){ m.watch.modem_set = false; m.watch.modem = null; } self.closeModal(); self.toast('Modem password removed'); }); }
      });
    },
    openDevice: function(key){
      var self = this, m = this.mh, c = m.devMap[key]; if (!c) return;
      if (m.priv){ this.toast('Turn off privacy mode to see device details'); return; }
      var L = (m.stats && m.stats.live) || {}, now = L.time || Math.floor(Date.now() / 1000);
      var ts = (L.seen || {})[String(c.mac).toUpperCase()];
      var fresh = ts > 0 && now - ts < 86400;
      var canBlock = m.bwl && m.bwl.mode === 'black';
      var conn = c.iface === 'cable' ? 'Wired' : c.iface ? 'Wi-Fi (' + c.iface + ')' : 'Unknown';
      var row = function(k, v){ return v == null || v === '' ? '' : '<div><span>' + esc(k) + '</span><b>' + v + '</b></div>'; };
      var masked = '••:••:••:••:••:••';
      var html = '<div class="hic" style="background:' + (c.blocked ? GRAD.red : GRAD.green) + '">' + svg('devices') + '</div>' +
        '<h2>' + esc(c.alias || c.name || 'Device') + (fresh ? ' <span class="mh-new" style="display:inline-block;padding:1px 6px;border-radius:6px;background:var(--mh-orange);color:#fff;font-size:10px;vertical-align:2px">NEW</span>' : '') + '</h2>' +
        '<p>' + esc(c.ip || '') + ' · ' + (c.blocked ? 'Blocked' : (c.online ? 'Online' : 'Offline')) + '</p>' +
        '<label for="mh-dn">Name</label><input id="mh-dn" maxlength="32" value="' + esc(c.alias || c.name || '') + '" placeholder="Device name" autocomplete="off">' +
        '<div class="kv">' +
          row('Connection', esc(conn)) +
          row('MAC address', '<span data-macv>' + masked + '</span><button class="eye" data-m="mac">Reveal</button>') +
          row('Hostname', c.name && c.alias && c.name !== c.alias ? esc(c.name) : '') +
          row('Online for', c.online && c.online_time > 0 && now > c.online_time ? dur(now - c.online_time) : '') +
          row('Current speed', c.rx != null ? '↓ ' + rate(c.rx).join(' ') + '  ↑ ' + rate(c.tx).join(' ') : '') +
          row('Total downloaded', c.total_rx != null ? bytes(c.total_rx) : '') +
          row('Total uploaded', c.total_tx != null ? bytes(c.total_tx) : '') +
          row('First seen', ts > 0 ? esc(new Date(ts * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : 'Before monitoring started') +
        '</div>' + self.devWatchHtml(c) + '<div class="err" data-e></div>' + self.lifeDevHtml(c) +
        (canBlock ? '' : '<p style="font-size:11px;margin-top:8px">Blocking is managed on the Clients page because access control is in allow-list mode.</p>') +
        '<div class="btns"><button data-m="cancel">Close</button>' +
          (canBlock ? '<button class="' + (c.blocked ? 'pri' : 'dan') + '" data-m="block">' + (c.blocked ? 'Unblock' : 'Block') + '</button>' : '') +
          '<button class="pri" data-m="save">Save name</button></div>';
      this.openModal(html, {
        day: function(md, b){ b.classList.toggle('on'); },
        lifesave: function(md, b){ self.lifeDevSave(c, md, b); },
        dwatch: function(md, b){
          var on = b.checked, mac = String(c.mac).toUpperCase(), nm = c.alias || c.name || c.ip || 'Device';
          rpcx('machome', 'devwatch_set', { mac: mac, on: on, name: nm }).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'not saved');
            m.watch = m.watch || {}; m.watch.watched = m.watch.watched || {};
            if (on) m.watch.watched[mac] = { name: nm }; else delete m.watch.watched[mac];
            self.toast(on ? 'You’ll get a message if ' + nm + ' goes offline' : 'Offline alerts off for ' + nm);
          }).catch(function(e){ b.checked = !on; self.toast('Couldn’t save: ' + e.message); });
        },
        mac: function(md, b){
          var s = md.querySelector('[data-macv]'), shown = b.textContent === 'Hide';
          s.textContent = shown ? masked : c.mac; b.textContent = shown ? 'Reveal' : 'Hide';
        },
        save: function(md, b){
          var v = md.querySelector('#mh-dn').value.trim(), e = md.querySelector('[data-e]');
          if (!v){ e.textContent = 'Enter a name.'; return; }
          if (v.indexOf('"') > -1){ e.textContent = 'Names can’t contain the " character.'; return; }
          if (v === (c.alias || c.name)){ self.closeModal(); return; }
          self.mh.busy = true; b.disabled = true; b.textContent = 'Saving…';
          rpcx('clients', 'set_info', { mac: c.mac, alias: v, class: c.class || '' }).then(function(){
            c.alias = v; self.closeModal(); self.toast('Renamed to ' + v); self.refreshSoon(2000);
          }).catch(function(err){ self.mh.busy = false; b.disabled = false; b.textContent = 'Save name'; e.textContent = 'Couldn’t rename: ' + ((err && err.message) || 'router error'); });
        },
        block: function(){
          var nm = c.alias || c.name || 'this device', blk = !c.blocked;
          self.confirm({ title: (blk ? 'Block ' : 'Unblock ') + nm + '?', icon: 'devices', grad: blk ? GRAD.red : GRAD.green, danger: blk,
            ok: blk ? 'Block' : 'Unblock', working: blk ? 'Blocking…' : 'Unblocking…',
            body: '<p>' + (blk ? esc(nm) + ' will lose network and internet access. You can unblock it here or on the Clients page.' : esc(nm) + ' will be allowed back on the network.') + '</p>' },
            function(){ return rpcx('black_white_list', 'set_single_mac', { mode: 'black', operate: blk ? 'add' : 'del', mac: c.mac }).then(function(){ c.blocked = blk; return nm + (blk ? ' blocked' : ' unblocked'); }); });
        }
      });
    },
    /* Opaque per-session key so a private value never appears in a DOM attribute. */
    /* ---------------- life features (backend: machome.life / life.lua) */
    lifeLoad: function(){
      var self = this, m = this.mh, now = Date.now();
      rpc('machome', 'life', { op: 'get' }).then(function(r){ if (m.alive && r && r.ok){ m.life = r; self.lifePaint(); } });
      if (!m.sphT || now - m.sphT > 600000){ m.sphT = now; rpc('machome', 'life', { op: 'speedhist' }).then(function(r){ if (m.alive && r && r.ok){ m.sph = r.list; self.lifePaint(); } }); }
      /* Ads blocked: AdGuard on THIS router (read by the browser, see adbLocal) wins when it is on, because GL sends
         all DNS through it; otherwise AdGuard on the NAS (collected by the router in the background). */
      var adgKnown = !!m.adgLoaded, localAdg = !!(m.adg && m.adg.enabled);
      if ((adgKnown || (m.nasAdg && m.nasAdg.configured)) && (!m.adbT || now - m.adbT > 120000)){
        m.adbT = now;
        if (localAdg) this.adbLocal();
        else rpc('machome', 'life', { op: 'adblock' }).then(function(r){ if (m.alive && r){ m.adb = r; self.lifePaint(); } });
      }
    },
    lifePaint: function(){
      try { this.layApply(); } catch (e) {}
      try { this.homePaint(); } catch (e) {} try { this.datPaint(); } catch (e) {}
      try { this.sphPaint(); } catch (e) {} try { this.adbPaint(); } catch (e) {}
    },
    devName: function(c, i){ return this.mh.priv ? 'Device ' + (i + 1) : (c.alias || c.name || c.ip || 'Device'); },
    /* ---- layout editor: per-browser order / size / hidden */
    layGet: function(){ var L = null; try { L = JSON.parse(localStorage.getItem('machome-layout') || 'null'); } catch (e) {} L = L || {}; L.order = L.order || null; L.hidden = L.hidden || {}; L.size = L.size || {};
      /* layout v2 (one-time): Ads Blocked by Device takes Who's Home's place; Who's Home hidden by default */
      if (!(L.v >= 2)){ if (L.order){ var i = L.order.indexOf('home'), j = L.order.indexOf('adb'); if (i > -1 && j > -1){ L.order[i] = 'adb'; L.order[j] = 'home'; } } if (L.hidden.home === undefined) L.hidden.home = true; L.v = 2; try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      /* layout v3 (one-time, 2026-11-13): Network Health right after Internet, Last 24 Hours right after Network Health */
      if (!(L.v >= 3)){ if (L.order){ var o3 = L.order.filter(function(k){ return k !== 'hlt' && k !== 'his'; }), n3 = o3.indexOf('net'); o3.splice(n3 > -1 ? n3 + 1 : 0, 0, 'hlt', 'his'); L.order = o3; }
        L.v = 3; try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      /* layout v4 (one-time, 2026-11-13): Security next to VPN, AdGuard Home next to Clients (swap places) */
      if (!(L.v >= 4)){ if (L.order){ var a4 = L.order.indexOf('adg'), s4 = L.order.indexOf('sec'); if (a4 > -1 && s4 > -1 && a4 < s4){ L.order[a4] = 'sec'; L.order[s4] = 'adg'; } }
        L.v = 4; try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      /* layout v5 (one-time, 2026-11-13): bottom of the page regrouped (devices & usage, speed, router hardware last).
         The cards keep the same slots in the saved order; only their sequence among themselves changes. */
      if (!(L.v >= 5)){ if (L.order){ var T5 = ['adb', 'dat', 'use', 'nets', 'spd', 'sph', 'wif', 'sen', 'svc'], slots = [], present = T5.filter(function(k){ return L.order.indexOf(k) > -1; });
          L.order.forEach(function(k, i){ if (T5.indexOf(k) > -1) slots.push(i); }); slots.forEach(function(pos, j){ L.order[pos] = present[j]; }); }
        L.v = 5; try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      /* layout v6 (one-time, 2026-11-15): VPN Health right after VPN, Security just before AdGuard Home, Clients last */
      if (!(L.v >= 6)){ if (L.order){ var o6 = L.order.filter(function(k){ return k !== 'vhl' && k !== 'sec' && k !== 'cli'; });
          var v6 = o6.indexOf('vpn'); o6.splice(v6 > -1 ? v6 + 1 : o6.length, 0, 'vhl');
          var a6 = o6.indexOf('adg'); o6.splice(a6 > -1 ? a6 : o6.length, 0, 'sec');
          o6.push('cli'); L.order = o6; }
        L.v = 6; try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      /* layout v7 (one-time, 2026-11-15): Clients right above Top Devices by Data */
      if (!(L.v >= 7)){ if (L.order){ var o7 = L.order.filter(function(k){ return k !== 'cli'; }), u7 = o7.indexOf('use');
          o7.splice(u7 > -1 ? u7 : o7.length, 0, 'cli'); L.order = o7; }
        L.v = 7; try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      /* layout v8 (one-time, 2026-11-15): Clients + Top Devices by Data side by side: drop any saved size for the two */
      if (!(L.v >= 8)){ delete L.size.cli; delete L.size.use;
        L.v = 8; try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      return L; },
    laySet: function(L){ try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} this.layApply(); },
    layCards: function(){ var g = this.$el.querySelector('.mh-grid'); return g ? Array.prototype.filter.call(g.children, function(x){ return x.getAttribute && x.getAttribute('data-card'); }) : []; },
    layKeys: function(){
      var L = this.layGet(), cards = this.layCards(), keys = cards.map(function(c){ return c.getAttribute('data-card'); });
      /* travel routers: the Wi-Fi Uplink card sits right after Internet and the VPN card moves down (after Sensors).
         A saved layout gets the same change once, the first time the uplink card appears in this browser. */
      var travel = function(o){ o = o.filter(function(k){ return k !== 'vpn' && k !== 'upl' && k !== 'vhl'; });
        var i = o.indexOf('net'); o.splice(i > -1 ? i + 1 : 0, 0, 'upl');
        var j = o.indexOf('sen'); o.splice(j > -1 ? j + 1 : o.length, 0, 'vpn', 'vhl'); return o; };
      if (this.mh.uplOn){
        if (!L.order) return travel(keys);
        if (L.order.indexOf('upl') < 0){ L.order = travel(L.order); try { localStorage.setItem('machome-layout', JSON.stringify(L)); } catch (e) {} }
      }
      if (!L.order) return keys;
      var o = L.order.filter(function(k){ return keys.indexOf(k) > -1; }); keys.forEach(function(k){ if (o.indexOf(k) < 0) o.push(k); }); return o;
    },
    layApply: function(){
      var self = this, m = this.mh, L = this.layGet(), keys = this.layKeys(), edit = !!m.layEdit;
      this.$el.classList.toggle('mh-editing', edit);
      this.layCards().forEach(function(c, i){
        var k = c.getAttribute('data-card');
        if (c.__def == null) c.__def = c.classList.contains('full') ? 'f' : c.classList.contains('wide') ? 'w' : 'n';
        var sz = L.size[k] || c.__def;
        c.classList.toggle('wide', sz === 'w'); c.classList.toggle('full', sz === 'f');
        c.style.order = String(keys.indexOf(k));   /* always explicit (2026-11-13), so the default order = the card order in skeleton() */
        c.classList.toggle('mh-uhide', !!L.hidden[k] && !edit); c.classList.toggle('mh-hid', !!L.hidden[k] && edit);
        var tb = c.querySelector('.mh-tb'), ed = tb && tb.querySelector('.mh-edt');
        if (edit && tb){
          var h = '<button data-act="lay" data-arg="up:' + k + '" title="Move earlier">◀</button><button data-act="lay" data-arg="down:' + k + '" title="Move later">▶</button>' +
                  '<button data-act="lay" data-arg="size:' + k + '" title="Card size">' + ({ n: 'S', w: 'M', f: 'L' })[sz] + '</button>' +
                  '<button data-act="lay" data-arg="hide:' + k + '" title="Hide or show">' + (L.hidden[k] ? 'Show' : 'Hide') + '</button>';
          if (!ed){ ed = document.createElement('span'); ed.className = 'mh-edt'; var o = tb.querySelector('.o'); tb.insertBefore(ed, o || null); }
          if (ed.__h !== h){ ed.innerHTML = h; ed.__h = h; }
        } else if (ed) ed.remove();
      });
      var bar = this.$el.querySelector('.mh-layb');
      if (edit && !bar){ bar = document.createElement('div'); bar.className = 'mh-layb'; bar.innerHTML = '<div>Editing layout · saved in this browser<button class="mh-btn sec" style="margin:0" data-act="lay" data-arg="reset">Reset</button><button class="mh-btn" style="margin:0" data-act="lay" data-arg="done">Done</button></div>'; var g = this.$el.querySelector('.mh-grid'); g.parentNode.insertBefore(bar, g.nextSibling); }
      if (!edit && bar) bar.remove();
    },
    layAct: function(arg){
      var m = this.mh, L = this.layGet(), p = String(arg || '').split(':'), op = p[0], k = p[1];
      if (op === 'edit'){ m.layEdit = true; this.closeCC(); this.layApply(); this.toast('Use ◀ ▶ to move, S/M/L to resize, Hide to hide. Press Done when finished.'); return; }
      if (op === 'done'){ m.layEdit = false; this.layApply(); return; }
      if (op === 'reset'){ try { localStorage.removeItem('machome-layout'); } catch (e) {} this.layApply(); this.toast('Layout reset'); return; }
      var keys = this.layKeys(), i = keys.indexOf(k); if (i < 0) return;
      if (op === 'up' && i > 0){ keys.splice(i, 1); keys.splice(i - 1, 0, k); L.order = keys; }
      if (op === 'down' && i < keys.length - 1){ keys.splice(i, 1); keys.splice(i + 1, 0, k); L.order = keys; }
      if (op === 'size'){ var c = this.layCards().filter(function(x){ return x.getAttribute('data-card') === k; })[0]; var cur = L.size[k] || (c && c.__def) || 'n'; L.size[k] = ({ n: 'w', w: 'f', f: 'n' })[cur]; }
      if (op === 'hide'){ if (L.hidden[k]) delete L.hidden[k]; else L.hidden[k] = true; }
      this.laySet(L);
    },
    /* ---- Who's home */
    homePaint: function(){
      var m = this.mh, l = m.life; if (!this.q('home') || !l) return;
      var keys = Object.keys(l.people || {});
      if (!keys.length){ this.set('home', '<p class="mh-empty" style="margin:0">Nobody added yet. Open a phone in the <b>Clients</b> card and fill in <b>“This is ___’s phone”</b>.</p>'); return; }
      var now = l.now || Math.floor(Date.now() / 1000), priv = m.priv;
      var h = keys.map(function(mac, i){
        var nm = priv ? 'Person ' + (i + 1) : l.people[mac], p = (l.presence || {})[mac] || {}, hue = 0;
        for (var j = 0; j < nm.length; j++) hue = (hue * 31 + nm.charCodeAt(j)) % 360;
        return '<div class="' + (p.home ? 'home' : '') + '"><i style="background:hsl(' + hue + ',65%,52%)">' + esc(nm.charAt(0).toUpperCase()) + '</i><span><b>' + esc(nm) + '</b><small>' + (p.home ? 'Home' : 'Away') + (p.since ? ' · ' + ago(now - p.since) : '') + '</small></span></div>';
      }).join('');
      this.set('home', '<div class="mh-ppl">' + h + '</div>');
    },
    /* ---- Data this month */
    datPaint: function(){
      var l = this.mh.life; if (!this.q('dat') || !l) return;
      if (l.ap || !l.data){ this.set('dat', '<p class="mh-empty" style="margin:0">This router is an access point, so internet usage is measured on the main router.</p>'); return; }
      var d = l.data, used = (d.rx || 0) + (d.tx || 0), cap = d.unlimited ? 0 : (d.cap_gb || 0) * 1e9;
      var p = cap ? Math.min(100, used / cap * 100) : 0, col = p < 70 ? 'var(--mh-green)' : p < 90 ? 'var(--mh-orange)' : 'var(--mh-red)';
      var cs = d.cycle ? new Date(d.cycle + 'T00:00:00') : null, now = new Date();
      var next = cs ? new Date(cs.getFullYear(), cs.getMonth() + 1, cs.getDate()) : null;
      var elapsed = cs ? Math.max(1, (now - cs) / 86400000) : 1, total = next && cs ? (next - cs) / 86400000 : 30, proj = used / elapsed * total;
      var days = Object.keys(d.days || {}).sort(), mx = days.reduce(function(a, k){ return Math.max(a, d.days[k][0] + d.days[k][1]); }, 1), today = (now.getMonth() < 9 ? '0' : '') + (now.getMonth() + 1) + '-' + (now.getDate() < 10 ? '0' : '') + now.getDate();
      var bars = days.map(function(k){ var v = d.days[k][0] + d.days[k][1]; return '<i class="' + (k === today ? 't' : '') + '" style="height:' + Math.max(3, v / mx * 100).toFixed(0) + '%" title="' + k + ': ' + bytes(v) + '"></i>'; }).join('');
      this.set('dat', '<div class="mh-dbig">' + bytes(used) + '<small>' + (cap ? 'of ' + d.cap_gb + ' GB' : 'Unlimited plan') + '</small></div>' +
        (cap ? '<div class="mh-meter"><i style="width:' + p.toFixed(1) + '%;background:' + col + '"></i></div>' : '<div style="height:8px"></div>') +
        '<small style="color:var(--mh-text2)">↓ ' + bytes(d.rx || 0) + ' · ↑ ' + bytes(d.tx || 0) + (next ? ' · resets ' + next.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '') + ' · on pace for ~' + bytes(proj) + '</small>' +
        '<div class="mh-dbars">' + bars + '</div><button class="mh-btn sec" data-act="datcfg">' + (cap ? 'Change cap' : 'Set a data cap') + '</button>');
    },
    openDatCfg: function(){
      var self = this, d = (this.mh.life && this.mh.life.data) || {}, opts = '';
      for (var i = 1; i <= 28; i++) opts += '<option value="' + i + '"' + (i === (d.start_day || 1) ? ' selected' : '') + '>' + i + '</option>';
      this.openModal('<div class="hic" style="background:' + GRAD.blue + '">' + svg('dl') + '</div><h2>Data plan</h2><p>Usage is measured on this router’s internet port. Your ISP’s meter can differ a little.</p>' +
        '<label><input type="checkbox" id="mh-dun"' + (d.unlimited ? ' checked' : '') + '> Unlimited (still show usage)</label>' +
        '<label for="mh-dcap">Monthly data cap (GB)</label><input id="mh-dcap" type="number" min="1" max="100000" value="' + (d.cap_gb || '') + '" placeholder="e.g. 1229">' +
        '<label for="mh-dday">Billing month starts on day</label><select id="mh-dday">' + opts + '</select>' +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Cancel</button><button class="pri" data-m="save">Save</button></div>', {
        save: function(md, b){
          var un = md.querySelector('#mh-dun').checked, cap = Number(md.querySelector('#mh-dcap').value) || 0, e = md.querySelector('[data-e]');
          if (!un && cap < 1){ e.textContent = 'Enter your cap in GB, or tick Unlimited.'; return; }
          b.disabled = true; rpcx('machome', 'life', { op: 'set_data', cap_gb: cap, unlimited: un, start_day: Number(md.querySelector('#mh-dday').value) }).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'not saved'); self.closeModal(); self.toast('Data plan saved'); self.lifeLoad();
          }).catch(function(err){ b.disabled = false; e.textContent = 'Couldn’t save: ' + err.message; });
        } });
    },
    /* ---- phone view (owner's pick 17, 2026-11-18): a compact page for small screens. On by itself under 700 px
       wide unless the 📱 button chose otherwise (remembered per browser). Big tap targets, the essentials only. */
    phoneOn: function(){ var v = null; try { v = localStorage.getItem('machome-phone'); } catch (e) {} return v === '1' || (v == null && window.innerWidth < 700); },
    phoneHtml: function(){
      var m = this.mh, s = m.stats || {}, L = s.live || {}, x = L.x || {}, W = L.wh || {}, NP = x.np || {}, isAP = this.isAP();
      var G = 'var(--mh-green)', O = 'var(--mh-orange)', R = 'var(--mh-red)';
      var list = []; try { list = this.issues(); } catch (e) {}
      var now = L.time || Math.floor(Date.now() / 1000);
      var dis = {}; try { dis = JSON.parse(localStorage.getItem('machome-dismiss') || '{}') || {}; } catch (e) {}
      var vis = list.filter(function(i){ return !i.soft && !(dis[i.id] && dis[i.id] > now); });
      var crit = vis.filter(function(i){ return i.lvl === 'crit'; }).length;
      var col = crit ? R : vis.length ? O : G;
      var head = crit ? crit + ' problem' + (crit > 1 ? 's' : '') : vis.length ? vis.length + ' warning' + (vis.length > 1 ? 's' : '') : 'All good';
      var h = '<div class="pv-top"><i style="background:' + col + '"></i><div><b>' + head + '</b><small>' + (isAP ? 'Access point' : 'Router') + ' · ' + hhmm(now) + (vis.length ? ' · details above' : '') + '</small></div></div>';
      /* internet */
      var GC = { good: ['Good', G], fair: ['Fair', O], poor: ['Poor', R] }, g = GC[W.grade] || ['Checking', 'var(--mh-text3)'];
      var rd = rate(m.rateDown), ru = rate(m.rateUp), p = L.ping && L.ping.wan;
      h += '<div class="pv-card"><div class="pv-h"><b>Internet</b><span class="pv-pill" style="background:' + g[1] + '">' + g[0] + '</span></div>' +
        '<div class="pv-kv"><div><small>Ping</small><b>' + (p && p.ms != null && p.loss < 100 ? Math.round(p.ms) + ' ms' : '—') + '</b></div><div><small>↓ now</small><b>' + rd[0] + ' <small style="display:inline">' + rd[1] + '</small></b></div><div><small>↑ now</small><b>' + ru[0] + ' <small style="display:inline">' + ru[1] + '</small></b></div></div>' +
        (W.why && W.why.length ? '<small class="pv-sub">' + esc(W.why.join(' · ')) + '</small>' : '') + '</div>';
      if (m.st && m.st.running) h += '<div class="pv-card"><div class="pv-h"><b>Speed test running…</b></div><small class="pv-sub">Open the full page to watch it live.</small></div>';
      /* VPN with on/off switches (same confirm as the VPN card) */
      var vl = (m.vpn && m.vpn.status_list) || [], tm = {};
      ((m.tun && m.tun.tunnels) || []).forEach(function(t){ tm[t.tunnel_id] = t; });
      if (!isAP) h += '<div class="pv-card"><div class="pv-h"><b>VPN</b></div>' + (vl.length ? vl.map(function(v){
          var t = tm[v.tunnel_id] || {}, pp = L.ping && L.ping[v.via];
          var c = !v.enabled ? 'var(--mh-text3)' : v.status === 1 ? G : v.status === 2 ? O : R;
          return '<div class="pv-row"><i style="background:' + c + '"></i><span><b>' + esc(v.name) + '</b><small>' + (v.enabled ? (v.status === 1 ? 'Connected' + (pp && pp.ms != null && pp.loss < 100 ? ' · ' + Math.round(pp.ms) + ' ms' : '') : v.status === 2 ? 'Connecting…' : 'Not connected') : 'Off') + '</small></span>' +
            (t.tunnel_id != null ? '<button class="mh-sw' + (t.enabled ? ' on' : '') + '" data-act="vpn" data-arg="' + esc(t.tunnel_id) + '" aria-label="Turn ' + esc(v.name) + (t.enabled ? ' off' : ' on') + '"></button>' : '') + '</div>';
        }).join('') : '<small class="pv-sub">No tunnels set up.</small>') + '</div>';
      /* devices */
      var on = (this.clientsArr() || []).filter(function(c){ return c.online; }).length, tp = NP.top;
      h += '<div class="pv-card"><div class="pv-h"><b>Devices</b><span class="pv-n">' + on + ' online</span></div>' +
        (tp && typeof tp === 'object' && !tp.quiet && tp.down != null ? '<small class="pv-sub">Busiest now: ' + esc(m.priv ? 'a device' : (tp.name || tp.ip || 'a device')) + ' · ↓ ' + tp.down + ' Mbps (' + tp.share + '% of traffic)</small>' : '<small class="pv-sub">The line is quiet right now.</small>') + '</div>';
      /* big buttons */
      var A = function(act, icon, label){ return '<button class="pv-act" data-act="' + act + '"><span>' + icon + '</span>' + label + '</button>'; };
      h += '<div class="pv-acts">' + A('st-wan', '⚡', 'Speed test') + (isAP ? '' : A('st-vpn', '🔒', 'Test VPN')) + A('wx-clearall', '🧹', 'Clear alerts') + A('events', '📜', 'Recent events') +
        A('dnshub', '🌐', 'DNS hub') + (isAP ? '' : A('isplog', '📋', 'Outage log')) + A('cc', '⚙️', 'Settings') + A('phone-off', '🖥', 'Full page') + '</div>';
      return h;
    },
    /* ---- alert housekeeping (owner's picks 15 + 18, 2026-11-18) ---- */
    localMutes: function(){ var x = this.mh.stats && this.mh.stats.live && this.mh.stats.live.x; if (!x) return {}; x.alerts = x.alerts || {}; if (!x.alerts.mutes || typeof x.alerts.mutes !== 'object') x.alerts.mutes = {}; return x.alerts.mutes; },
    muteDialog: function(kind, after){
      var self = this, nm = KIND_NAMES[kind] || kind;
      var mid = new Date(); mid.setHours(24, 0, 0, 0);
      var today = Math.max(3600, Math.round((mid.getTime() - Date.now()) / 1000));
      this.openModal('<div class="hic" style="background:' + GRAD.gray + '">' + svg('shield') + '</div><h2>Mute ' + esc(nm) + ' alerts</h2>' +
        '<p>No banner and no Discord message for ' + esc(nm) + ' alerts while muted. They’re still listed in Recent events, and the mute ends by itself.</p>' +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Cancel</button><button data-m="mu" data-s="3600">1 hour</button><button data-m="mu" data-s="' + today + '">Rest of today</button><button class="pri" data-m="mu" data-s="604800">1 week</button></div>', {
        mu: function(md, b){
          b.disabled = true;
          rpcx('machome', 'alert_mute', { kind: kind, secs: Number(b.getAttribute('data-s')) }).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'not saved');
            if (r.until) self.localMutes()[kind] = r.until;
            self.closeModal(); self.toast(nm + ' alerts muted until ' + hhmm(r.until)); self.paint();
            if (after) after();
          }).catch(function(e){ b.disabled = false; md.querySelector('[data-e]').textContent = 'Couldn’t mute: ' + e.message; });
        } });
    },
    mutedDialog: function(){
      var self = this, mu = this.localMutes(), now = Math.floor(Date.now() / 1000);
      var ks = Object.keys(mu).filter(function(k){ return mu[k] > now; });
      var body = ks.length ? ks.map(function(k){ return '<div class="mh-mrow"><span><b>' + esc(KIND_NAMES[k] || k) + '</b><small>until ' + esc(new Date(mu[k] * 1000).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })) + '</small></span><button class="mh-btn sec" data-m="un" data-k="' + esc(k) + '" style="margin:0">Unmute</button></div>'; }).join('')
        : '<p>Nothing is muted.</p>';
      this.openModal('<div class="hic" style="background:' + GRAD.gray + '">' + svg('shield') + '</div><h2>Muted alerts</h2><div class="mh-mgrp">' + body + '</div><div class="btns"><button class="pri" data-m="cancel">Done</button></div>', {
        un: function(md, b){
          var k = b.getAttribute('data-k'); b.disabled = true;
          rpcx('machome', 'alert_mute', { kind: k, secs: 0 }).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'not saved');
            delete self.localMutes()[k]; self.paint(); self.mutedDialog(); self.toast((KIND_NAMES[k] || k) + ' alerts unmuted');
          }).catch(function(e){ b.disabled = false; self.toast('Couldn’t unmute: ' + e.message); });
        } });
    },
    alertsClearAll: function(){
      var self = this, m = this.mh;
      this.confirm({ title: 'Clear all alerts?', icon: 'shield', grad: GRAD.blue, ok: 'Clear all', working: 'Clearing…',
        body: '<p>The VPN, packet-loss and high-ping checks start over from scratch: a problem that’s really still there comes back within a few minutes. The other alerts are hidden like Dismiss.</p>' },
        function(){ return rpcx('machome', 'alerts_clear', {}).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'the router didn’t accept it');
          var L = (m.stats && m.stats.live) || {}, inc = (L.x && L.x.inc) || {}, now = Math.floor(Date.now() / 1000);
          var d = {}; try { d = JSON.parse(localStorage.getItem('machome-dismiss') || '{}') || {}; } catch (e) {}
          (m.wxLast || []).forEach(function(i){
            if (/^(vpn|stale|loss)-/.test(i.id) || i.id === 'ping') return;     /* those checks restart on the router */
            d[i.id] = now + (i.soft ? 30 * 86400 : i.lvl === 'crit' ? 3600 : 86400);
          });
          try { localStorage.setItem('machome-dismiss', JSON.stringify(d)); } catch (e) {}
          inc.vpn = null; inc.ping_high = null; if (L.pl) Object.keys(L.pl).forEach(function(k){ L.pl[k] = []; });
          m.recov = {}; self.paint();
          return 'Alerts cleared; checks start fresh';
        }); });
    },
    /* ---- forgetting old VPN history (owner's picks 20-23, 2026-11-18) ---- */
    sphRemove: function(label){
      var self = this, m = this.mh, n = (m.sph || []).filter(function(r){ return r.l === label; }).length;
      this.confirm({ title: 'Remove “' + label + '” from the speed history?', icon: 'pulse', grad: GRAD.orange, danger: true, ok: 'Remove', working: 'Removing…',
        body: '<p>Deletes its ' + n + ' saved test' + (n === 1 ? '' : 's') + ' from the history. This can’t be undone.</p>' },
        function(){ return rpcx('machome', 'speedhist_remove', { label: label }).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'not removed');
          m.sph = (m.sph || []).filter(function(x){ return x.l !== label; }); m.sphT = 0; self.sphPaint();
          return 'Removed ' + r.removed + ' test' + (r.removed === 1 ? '' : 's');
        }); });
    },
    relRemove: function(key){
      var self = this, m = this.mh;
      this.confirm({ title: 'Remove this server from the 7-day history?', icon: 'lock', grad: GRAD.orange, danger: true, ok: 'Remove', working: 'Removing…',
        body: '<p>' + esc(key.replace('|', ' · ')) + ' disappears from “Past servers this week”. This can’t be undone.</p>' },
        function(){ return rpcx('machome', 'rel_remove', { key: key }).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'not removed');
          if (m.rel){ if (m.rel.rel && m.rel.rel.buckets) delete m.rel.rel.buckets[key]; if (m.rel.cur) delete m.rel.cur[key]; }
          self.paint();
          return 'Removed';
        }); });
    },
    vpnForget: function(){
      var self = this, m = this.mh, kp = !(m.alerts && m.alerts.vpn_keep_provider === false), total = 0;
      var load = function(md){
        var box = md.querySelector('[data-fl]'), go = md.querySelector('[data-m=go]');
        box.textContent = 'Checking…'; go.disabled = true;
        rpcx('machome', 'vpn_forget_preview', { keep_provider: kp }, 30000).then(function(r){
          if (!r || !r.ok) throw new Error((r && r.err) || 'no answer');
          total = r.total || 0;
          box.innerHTML = total ? (r.items || []).map(function(t){ return '<div>' + esc(m.priv ? t.replace(/·.*$/, '') : t) + '</div>'; }).join('') : '<div>Nothing to forget: everything in the history belongs to a VPN that’s on a tunnel now.</div>';
          go.disabled = !total; go.textContent = total ? 'Forget ' + total + ' item' + (total === 1 ? '' : 's') : 'Forget';
        }).catch(function(e){ box.textContent = 'Couldn’t check: ' + e.message; });
      };
      var md = this.openModal('<div class="hic" style="background:' + GRAD.purple + '">' + svg('lock') + '</div><h2>Forget removed VPNs</h2>' +
        '<p>Clears the speed history, 7-day reliability and last speed results of VPNs that aren’t on any tunnel anymore. The router also does this by itself 24 hours after you remove one.</p>' +
        '<label style="display:flex;gap:8px;align-items:flex-start;text-align:left;font-size:12px;margin:8px 0 0"><input type="checkbox" data-m="kp" style="width:auto;margin:2px 0 0;flex:none"' + (kp ? ' checked' : '') + '> ' +
        'Keep the history of old servers from providers I still use (for example older Nord servers while Nord is still on a tunnel)</label>' +
        '<label style="display:flex;gap:8px;align-items:flex-start;text-align:left;font-size:12px;margin:6px 0 0"><input type="checkbox" data-m="af" style="width:auto;margin:2px 0 0;flex:none"' + (m.alerts && m.alerts.vpn_autoforget === false ? '' : ' checked') + '> ' +
        'Do this by itself 24 hours after a VPN is removed from GL</label>' +
        '<div class="mh-fgl" data-fl></div><div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button class="dan" data-m="go" disabled>Forget</button></div>', {
        kp: function(md2, b){
          kp = !!b.checked; if (m.alerts) m.alerts.vpn_keep_provider = kp;
          rpcx('machome', 'set_alerts', { vpn_keep_provider: kp }).catch(function(){});
          load(md2);
        },
        af: function(md2, b){
          var on = !!b.checked; if (m.alerts) m.alerts.vpn_autoforget = on;
          rpcx('machome', 'set_alerts', { vpn_autoforget: on }).then(function(){ self.toast(on ? 'Removed VPNs are forgotten by themselves after 24 h' : 'Only the Forget button clears old VPN history now'); }).catch(function(){ self.toast('Couldn’t save that setting'); });
        },
        go: function(md2, b){
          b.disabled = true; b.textContent = 'Forgetting…';
          rpcx('machome', 'vpn_forget_apply', { keep_provider: kp }, 30000).then(function(r){
            if (!r || !r.ok) throw new Error((r && r.err) || 'not done');
            self.closeModal(); self.toast('Forgot ' + r.total + ' item' + (r.total === 1 ? '' : 's'));
            m.sphT = 0; self.lifeLoad();
            setTimeout(function(){ rpc('machome', 'get_reliability').then(function(x){ if (x){ m.rel = x; self.paint(); } }); }, 12000);
          }).catch(function(e){ b.disabled = false; b.textContent = 'Forget'; md2.querySelector('[data-e]').textContent = 'Couldn’t: ' + e.message; });
        } });
      load(md);
    },
    /* ---- Router Home updates from GitHub (owner, 2026-11-22): Control Center → Router Home updates (rpc upd_*).
       Only packages signed with the Router Home release key install; a failed update rolls itself back. */
    updAuto: function(){
      /* on page load (at most once an hour per browser): ask the router to check GitHub. Shows the line under
         "Everything is running smoothly" (2.6.1) and, once a day, a toast; it never installs by itself. */
      var self = this, m = this.mh, last = 0, cached = null;
      try { last = Number(localStorage.getItem('machome-updchk') || 0); cached = localStorage.getItem('machome-updavail'); } catch (e) {}
      if (Date.now() - last < 3600000 && cached !== null){ m.updAvail = cached || null; m.updChecked = true; return this.updLine(); }
      rpc('machome', 'upd_check').then(function(r){
        if (!r || !r.ok) return;
        var told = 0; try { told = Number(localStorage.getItem('machome-updtold') || 0); } catch (e) {}
        try { localStorage.setItem('machome-updchk', String(Date.now())); localStorage.setItem('machome-updavail', r.newer ? r.latest : ''); } catch (e) {}
        m.updAvail = r.newer ? r.latest : null; m.updChecked = true;
        self.updLine();
        if (r.newer && Date.now() - told > 86400000){ try { localStorage.setItem('machome-updtold', String(Date.now())); } catch (e) {} self.toast('Router Home ' + r.latest + ' is available'); }
      });
    },
    /* the line under "Everything is running smoothly" (owner, 2026-11-22, v2.6.1) */
    updLine: function(){
      var el = this.q('updline'), m = this.mh; if (!el || !m.updChecked) return;
      el.style.display = '';
      el.innerHTML = m.updAvail
        ? '<span style="color:var(--mh-orange)">⬆ Router Home needs an update: version ' + esc(m.updAvail) + ' is available.</span> <button class="mh-btn" data-act="updates" style="margin:0 0 0 6px;padding:3px 10px;font-size:12px">Update now</button>'
        : '<span style="color:var(--mh-green)">✓ Router Home is up to date</span> <span style="color:var(--mh-text2)">(' + esc(MH_VERSION) + ')</span>';
    },
    /* ---- Known vulnerabilities (2.6.5): Security card row → this window. Data: rpc vuln_status (vulncheck.lua). */
    openVuln: function(msg){
      var self = this;
      var shell = function(inner, running){ return '<div class="hic" style="background:' + GRAD.indigo + '">' + svg('shield') + '</div><h2>Known vulnerabilities</h2>' + inner +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button class="pri" data-m="check"' + (running ? ' disabled' : '') + '>' + (running ? 'Checking…' : 'Check now') + '</button></div>'; };
      if (!document.getElementById('machome-modal') || !msg) this.openModal(shell('<p>Loading…</p>', true), {});
      rpc('machome', 'vuln_status').then(function(r){
        if (!document.getElementById('machome-modal')) return;
        if (!r || !r.ok){ self.openModal(shell('<p>Couldn’t read the results from the router.</p>'), self.vulnHandlers()); return; }
        var now = Math.floor(Date.now() / 1000), items = r.items || [];
        var ST = { infected: ['var(--mh-red)', 'Signs of infection'], exposed: ['var(--mh-orange)', 'Exposed'], update: ['var(--mh-orange)', 'Firmware update needed'],
                   suspicious: ['var(--mh-orange)', 'Suspicious file'], notice: ['var(--mh-blue)', 'New notice, not checked yet'], ok: ['var(--mh-green)', 'Not affected'] };
        var SEV = { critical: 'var(--mh-red)', high: 'var(--mh-orange)', medium: 'var(--mh-yellow)', low: 'var(--mh-text2)' };
        var model = String(r.model || '').toUpperCase();
        var h = (msg && msg.trim() ? '<p style="color:var(--mh-green)">' + esc(msg) + '</p>' : '') +
          '<p style="font-size:13px"><b>' + (model ? 'GL-' + esc(model) : 'This router') + '</b> · firmware ' + esc(r.fw || '?') + ' · ' +
          (r.t ? 'checked ' + ago(now - r.t) : 'not checked yet') + (r.running ? ' · <b>checking now…</b>' : '') + '</p>';
        var probs = items.filter(function(i){ return i.status !== 'ok'; }), oks = items.filter(function(i){ return i.status === 'ok'; });
        var card = function(i){
          var st = ST[i.status] || ST.ok, src = i.kind === 'nvd' ? 'NVD' : i.kind === 'notice' ? 'GL.iNet news feed' : 'GL.iNet notice';
          return '<div class="mh-vh" style="text-align:left;margin:8px 0"><b>' + esc(i.title) + '</b>' +
            '<div style="font-size:12px;margin:3px 0"><span style="color:' + st[0] + ';font-weight:600">' + st[1] + '</span>' + (i.kind === 'notice' ? '' : ' · <span style="color:' + (SEV[i.severity] || 'var(--mh-text2)') + '">' + esc(i.severity || 'unknown') + (i.score ? ' ' + esc(i.score) : '') + '</span>') + ' · ' + esc(src) + (i.published ? ' · ' + esc(i.published) : '') +
            (i.link ? ' · <a href="' + esc(i.link) + '" target="_blank" rel="noopener" style="color:var(--mh-blue)">details ›</a>' : '') + '</div>' +
            ((i.found || []).length ? '<ul style="margin:4px 0 4px 18px;font-size:12px">' + i.found.map(function(f){ return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
            (i.status === 'notice' ? '<p style="text-align:left;font-size:12px;margin:4px 0">' + esc(i.summary) + '</p>' : i.status !== 'ok' && i.summary ? '<details style="font-size:12px;margin:4px 0"><summary>What it is</summary>' + esc(i.summary) + '</details>' : '') +
            (i.advice ? '<p style="text-align:left;font-size:12px;margin:4px 0">' + esc(i.advice) + '</p>' : '') +
            (i.firmware_note ? '<p style="text-align:left;font-size:12px;margin:4px 0;color:var(--mh-text2)">Firmware: ' + esc(i.firmware_note) + '</p>' : '') +
            (i.fixed_in ? '<p style="text-align:left;font-size:12px;margin:4px 0">Fixed in firmware ' + esc(i.fixed_in) + '.</p>' : '') +
            ((i.fix || i.upgrade) ? '<p style="text-align:left;margin:6px 0 0">' + (i.fix ? '<button style="border:0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;background:var(--mh-blue);color:#fff;margin:2px 4px 2px 0" data-m="fix" data-id="' + esc(i.id) + '" data-label="' + esc(i.fix.label) + '"' + (r.running ? ' disabled' : '') + '>' + esc(i.fix.label) + '</button> ' : '') +
              (i.upgrade ? '<button style="border:0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;background:rgba(127,127,127,.18);color:inherit;margin:2px 4px 2px 0" data-m="upgrade">Open the Upgrade page</button>' : '') + '</p>' : '') + '</div>';
        };
        h += '<div style="max-height:52vh;overflow:auto">';
        h += probs.length ? probs.map(card).join('') : '<p style="text-align:left;color:var(--mh-green)">✓ Nothing known affects this router right now.</p>';
        if (oks.length) h += '<details style="text-align:left;font-size:12px;margin:6px 0"><summary>Checked and not affected (' + oks.length + ')</summary>' + oks.map(card).join('') + '</details>';
        var adv = r.adv || {}, nvd = r.nvd || {};
        h += '<p style="font-size:12px;color:var(--mh-text2);text-align:left;margin-top:8px">Sources: <b>GL.iNet notices</b>: ' + (adv.n || 0) + ' in the signed list (' + (adv.source === 'github' ? 'from GitHub' : 'built-in copy') + (adv.updated ? ', updated ' + esc(adv.updated) : '') + ')' + (adv.err ? ' · ' + esc(adv.err) : '') +
          '. <b>NVD</b>: ' + (nvd.err ? 'couldn’t check (' + esc(nvd.err) + ')' : (nvd.n || 0) + ' published vulnerabilit' + (nvd.n === 1 ? 'y' : 'ies') + ' for this model' + (nvd.t ? ', downloaded ' + ago(now - nvd.t) : '')) + '. <b>GL news feeds</b> (new notices): ' +
          (r.feed && r.feed.err ? 'couldn’t check (' + esc(r.feed.err) + ')' : r.feed && r.feed.t ? 'read ' + ago(now - r.feed.t) + (r.notices ? ', ' + r.notices + ' not in the list yet' : ', nothing new') : 'not read yet') + '.</p>';
        h += '</div>';
        h += '<details style="text-align:left;font-size:12px;margin:8px 0"><summary><b>How this works</b></summary><div style="text-align:left">' +
          '<p>Two sources, checked with plain rules (no AI):</p>' +
          '<p><b>1. GL.iNet security notices.</b> When GL posts a notice, it’s turned into an entry in a list on the Router Home GitHub page: which models and firmware it affects, what to look for on the router (a running process, a file, a setting, a service, an open port), and which fix applies. The list is signed with the Router Home release key, the same one updates use, and the router ignores any copy whose signature doesn’t match, so nobody can slip in fake checks or fixes. A copy ships with Router Home, so it works offline too.</p>' +
          '<p><b>2. The National Vulnerability Database (NVD).</b> Published vulnerabilities (CVEs) for this exact model, matched against this router’s firmware version. NVD can take days or weeks to list something new, and many GL models have no entries.</p>' +
          '<p><b>New GL notices:</b> the router also reads GL.iNet’s own news feeds (Security Updates and the blog) once a day. A security post from the last 90 days that the list doesn’t cover yet shows here as “New notice, not checked yet” and sends one Discord alert, so you hear about it the same day. It isn’t checked on the router until the signed list on GitHub is updated.</p>' +
          '<p><b>When:</b> all of this is downloaded once a day; the checks on the router repeat every 10 minutes. A new finding sends one Discord alert (type “Vulnerability”).</p>' +
          '<p><b>Fixes</b> only come from a short fixed list: stop a process and delete its file (a copy is kept as evidence), change one setting, turn off a service, tighten a file’s permissions. Each asks first and leaves an undo script in /root/machome-backup/ where undoing makes sense. Firmware upgrades are never automatic: you get a button to the Upgrade page.</p>' +
          '<p><b>Limits:</b> it only knows what has been published. It can’t find unknown problems, and “no signs” doesn’t prove a router was never attacked.</p></div></details>';
        self.openModal(shell(h, r.running), self.vulnHandlers());
        if (r.running) setTimeout(function(){ if (document.getElementById('machome-modal')) self.openVuln(msg || ' '); }, 2500);
      });
    },
    vulnHandlers: function(){
      var self = this;
      return {
        check: function(md, b){ b.disabled = true; b.textContent = 'Checking…';
          rpcx('machome', 'vuln_check', {}, 15000).then(function(){ setTimeout(function(){ self.openVuln(' '); }, 1500); })
            .catch(function(e){ b.disabled = false; b.textContent = 'Check now'; md.querySelector('[data-e]').textContent = 'Couldn’t start: ' + e.message; }); },
        fix: function(md, b){
          var id = b.getAttribute('data-id'), label = b.getAttribute('data-label');
          if (!confirm(label + '?\n\nA backup or evidence copy is kept in /root/machome-backup/ on the router.')) return;
          b.disabled = true; b.textContent = 'Working…';
          rpcx('machome', 'vuln_fix', { id: id }, 30000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'didn’t work');
            self.openVuln('Done: ' + r.done + (r.undo ? ' (undo: ' + r.undo + ')' : '') + '. Now: ' + (r.status === 'ok' ? 'not affected.' : r.status + '.')); })
            .catch(function(e){ b.disabled = false; b.textContent = label; md.querySelector('[data-e]').textContent = 'Fix failed: ' + e.message; }); },
        upgrade: function(){ self.closeModal(); self.go('upgrade'); }
      };
    },
    openUpdates: function(){
      var self = this, m = this.mh;
      var shell = function(inner, btns){ return '<div class="hic" style="background:' + GRAD.indigo + '">' + svg('cc') + '</div><h2>Router Home updates</h2>' + inner +
        '<div class="err" data-e></div><div class="btns">' + (btns || '<button data-m="cancel">Close</button>') + '</div>'; };
      var notes = function(t){ return '<div style="max-height:220px;overflow:auto;text-align:left;font-size:12px;white-space:pre-wrap;background:var(--mh-fill,rgba(127,127,127,.08));border-radius:10px;padding:8px 10px;margin:8px 0">' + esc(String(t || 'No release notes.')).slice(0, 6000) + '</div>'; };
      this.openModal(shell('<p>Installed: <b>Router Home ' + esc(MH_VERSION) + '</b>. Checking GitHub…</p>'), {});
      rpc('machome', 'upd_status').then(function(st){
        if (st && st.running) return self.updProgress();
        return rpc('machome', 'upd_check').then(function(r){
          if (!document.getElementById('machome-modal')) return;
          if (!r || !r.ok){ self.openModal(shell('<p>Couldn’t check for updates: ' + esc((r && r.err) || 'no answer from the router') + '.</p>' + self.updRollbackRow(st)), self.updHandlers()); return; }
          try { localStorage.setItem('machome-updchk', String(Date.now())); localStorage.setItem('machome-updavail', r.newer ? r.latest : ''); } catch (e) {}
          m.updAvail = r.newer ? r.latest : null; m.updChecked = true; self.updLine();
          var src ='<p style="font-size:12px;color:var(--mh-text2)">From <a href="' + MH_REPO + '/releases" target="_blank" rel="noopener" style="color:var(--mh-blue)">GitHub · xDarkHawkx/RouterHome</a>. Only updates signed with the Router Home release key can install.</p>';
          if (r.none) return self.openModal(shell('<p>Installed: <b>Router Home ' + esc(r.current) + '</b>.</p><p>' + esc(r.msg) + '</p>' + src + self.updRollbackRow(st)), self.updHandlers());
          if (!r.newer) return self.openModal(shell('<p>✓ You’re up to date: <b>Router Home ' + esc(r.current) + '</b> (latest on GitHub: ' + esc(r.latest) + ').</p>' + src + self.updRollbackRow(st)), self.updHandlers());
          var when = r.published ? new Date(r.published).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          var body = '<p>A new version is available: <b>Router Home ' + esc(r.latest) + '</b>' + (when ? ' (' + esc(when) + ')' : '') + '. You have ' + esc(r.current) + '.</p>' + notes(r.notes) +
            (r.installable ? '<p style="font-size:12px">Installing takes about a minute. Your settings, history and alerts are kept. The current version is saved first, and if anything goes wrong it’s put back automatically.</p>'
              : '<p style="color:var(--mh-orange)">This release has no signed update package, so it can’t install from here. Download the installer from GitHub instead.</p>') + src;
          self.openModal(shell(body, '<button data-m="cancel">Not now</button>' + (r.url ? '<a class="mh-btn sec" href="' + esc(r.url) + '" target="_blank" rel="noopener" style="margin:0 6px">View on GitHub</a>' : '') +
            (r.installable ? '<button class="pri" data-m="install">Install ' + esc(r.latest) + '</button>' : '')), self.updHandlers());
        });
      });
    },
    updRollbackRow: function(st){
      return (st && st.rollback) ? '<p style="font-size:12px;margin-top:10px">Saved earlier version: <b>' + esc(st.rollback) + '</b> <button class="mh-btn sec" data-m="rollback" style="margin-left:6px">Go back to it</button></p>' : '';
    },
    updHandlers: function(){
      var self = this;
      return {
        install: function(md, b){ b.disabled = true; b.textContent = 'Starting…';
          rpcx('machome', 'upd_install', {}, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'not started'); self.updProgress(); })
            .catch(function(e){ b.disabled = false; b.textContent = 'Install'; md.querySelector('[data-e]').textContent = 'Couldn’t start: ' + e.message; }); },
        rollback: function(md, b){ if (!confirm('Go back to the previous version of Router Home? Your settings are kept.')) return; b.disabled = true;
          rpcx('machome', 'upd_rollback', {}, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'not started'); self.updProgress(); })
            .catch(function(e){ b.disabled = false; md.querySelector('[data-e]').textContent = 'Couldn’t start: ' + e.message; }); }
      };
    },
    /* follows the update job; nginx restarts mid-install, so failed polls just mean "wait" (up to ~3 min) */
    updProgress: function(){
      var self = this, misses = 0, m = this.mh;
      var paint = function(st){
        var html = '<div class="hic" style="background:' + GRAD.indigo + '">' + svg('cc') + '</div><h2>Updating Router Home</h2>' +
          '<p>' + esc((st && st.step) || 'Working…') + '</p><div class="mh-bar" style="margin:10px 0"><i style="width:' + Math.max(4, (st && st.pct) || 0) + '%;background:var(--mh-blue)"></i></div>' +
          '<p style="font-size:12px;color:var(--mh-text2)">Keep this page open. The admin page restarts during the install; that’s expected.</p>';
        self.openModal(html, {}); m.busy = true;
      };
      paint({ step: 'Starting…', pct: 2 });
      var tick = function(){
        rpc('machome', 'upd_status').then(function(st){
          /* rpc() answers null while nginx restarts: that's "still working", not "done" */
          if (!st || st.ok !== true){ if (++misses < 90) return setTimeout(tick, 2000); m.busy = false; return self.toast('Lost contact with the router. Reload the page to see the result.'); }
          misses = 0;
          if (st.running){ paint(st); return setTimeout(tick, 2000); }
          m.busy = false;
          if (st.err){
            self.openModal('<div class="hic" style="background:' + GRAD.red + '">' + svg('cc') + '</div><h2>Update not installed</h2><p>' + esc(st.err) + '.</p>' +
              (st.log ? '<details style="text-align:left;font-size:11px"><summary>Details</summary><pre style="white-space:pre-wrap">' + esc(st.log) + '</pre></details>' : '') +
              '<div class="btns"><button data-m="cancel">Close</button></div>', {});
            return;
          }
          try { localStorage.setItem('machome-updavail', ''); } catch (e) {}
          self.openModal('<div class="hic" style="background:' + GRAD.green + '">' + svg('cc') + '</div><h2>' + esc(st.step || 'Done') + '</h2><p>Reloading the page in a moment…</p>', {});
          setTimeout(function(){ location.reload(); }, 3000);
        });
      };
      setTimeout(tick, 1500);
    },
    /* ---- GL.inet Utilities Toolkit (owner, 2026-11-22): point-and-click versions of the kinds of tools in
       phantasm22's GL.iNet Utilities Toolkit, rebuilt from scratch for Router Home (rpc tk_*, toolkit.lua, tk_job.lua). */
    tkLoad: function(){
      var self = this, m = this.mh, t = m.tk = m.tk || { tab: 'hw' };
      var tab = t.tab;
      var done = function(){ if (m.alive) self.tkPaint(); };
      if (tab === 'hw') rpc('machome', 'tk_info').then(function(r){ if (r && r.ok) t.info = r; done(); });
      if (tab === 'bench') this.tkJob();
      if (tab === 'sys'){ rpc('machome', 'tk_zram').then(function(r){ if (r && r.ok) t.zram = r; done(); }); rpc('machome', 'tk_pkg').then(function(r){ if (r && r.ok) t.pkg = r; done(); }); this.tkJob(); }
      if (tab === 'ssh') rpc('machome', 'tk_ssh').then(function(r){ if (r && r.ok) t.ssh = r; done(); });
      if (tab === 'net'){ this.tkJob(); this.tkClients(); }
      this.tkPaint();
    },
    /* Network tab (phase 2, 2026-11-22): GL's client list carries each device's speed limit (limit_rx = download,
       limit_tx = upload, in KB/s); limits are set with GL's own qos.set_speed_limit_rule, like GL's Clients page */
    tkClients: function(){
      var self = this, m = this.mh;
      return rpc('clients', 'get_list').then(function(r){ if (r){ m.list = r; if (m.alive) self.tkPaint(); } });
    },
    tkBwDialog: function(mac){
      var self = this, m = this.mh, all = (this.clientsArr() || []).filter(function(c){ return c.mac; });
      var cur = mac ? all.filter(function(c){ return c.mac === mac; })[0] : null;
      if (mac && !cur) return;
      var nm = function(c, i){ return self.devName(c, i); };
      var mb = function(kb){ return kb ? Math.round(kb * 8 / 1000 * 10) / 10 : ''; };   /* KB/s → Mbps */
      var pick = all.map(function(c, i){ return { c: c, n: nm(c, i) }; }).sort(function(a, b){ return (b.c.online ? 1 : 0) - (a.c.online ? 1 : 0) || String(a.n).localeCompare(String(b.n)); });
      var sel = cur ? '<p><b>' + esc(nm(cur, all.indexOf(cur))) + '</b>' + (cur.ip && !m.priv ? ' <small>' + esc(cur.ip) + '</small>' : '') + '</p>'
        : '<label for="mh-bwdev">Device</label><select id="mh-bwdev">' + pick.map(function(x){ return '<option value="' + esc(x.c.mac) + '">' + esc(x.n) + (x.c.online ? '' : ' (offline)') + '</option>'; }).join('') + '</select>';
      this.confirm({ title: cur ? 'Change speed limit' : 'Add a speed limit', icon: 'dl', grad: GRAD.orange, ok: 'Save limit', working: 'Saving…',
        body: sel + '<div style="display:flex;gap:10px;margin-top:8px"><div style="flex:1"><label for="mh-bwd">Download (Mbps)</label><input id="mh-bwd" type="number" min="0" step="0.5" value="' + (cur ? mb(cur.limit_rx) : '') + '" placeholder="no limit"></div>' +
          '<div style="flex:1"><label for="mh-bwu">Upload (Mbps)</label><input id="mh-bwu" type="number" min="0" step="0.5" value="' + (cur ? mb(cur.limit_tx) : '') + '" placeholder="no limit"></div></div>' +
          '<p style="font-size:12px">Leave a box empty for no limit in that direction. Uses GL’s own speed limiter (Clients → Speed limit), so it stays after a restart.</p>' },
        function(){
          var md = document.getElementById('machome-modal');
          var dm = cur ? cur.mac : md.querySelector('#mh-bwdev').value;
          var d = Number(md.querySelector('#mh-bwd').value) || 0, u = Number(md.querySelector('#mh-bwu').value) || 0;
          if (d < 0 || u < 0 || d > 10000 || u > 10000) return Promise.reject(new Error('use 0.1 to 10000 Mbps'));
          if (!d && !u) return Promise.reject(new Error('enter a download or upload limit (or use Remove)'));
          /* Mbps → KB/s, the unit GL's API takes */
          return rpcx('qos', 'set_speed_limit_rule', { mac: dm, download: Math.round(d * 125), upload: Math.round(u * 125) }, 30000).then(function(){
            return self.tkClients().then(function(){ return 'Speed limit saved'; }); });
        });
    },
    tkJob: function(){
      var self = this, m = this.mh, t = m.tk = m.tk || { tab: 'hw' };
      var was = t.job && t.job.running;
      rpc('machome', 'tk_job_status').then(function(r){
        if (!r || !r.ok) return;
        t.job = r.job; t.results = r.results || {};
        /* a zram restart or package refresh just finished: reload that tab's data */
        if (was && !r.job.running && (r.job.kind === 'zram' || r.job.kind === 'opkg')){
          if (r.job.kind === 'zram') rpc('machome', 'tk_zram').then(function(z){ if (z && z.ok){ t.zram = z; self.tkPaint(); } });
          if (r.job.kind === 'opkg') rpc('machome', 'tk_pkg').then(function(p){ if (p && p.ok){ t.pkg = p; self.tkPaint(); } });
          self.toast(r.job.err ? 'That didn’t work: ' + r.job.err : (r.job.kind === 'zram' ? 'Zram restarted with the new settings' : 'Package lists refreshed'));
        }
        if (was && !r.job.running && r.job.kind === 'mtuapply'){
          var x = r.job.result || {};
          if (r.job.err) self.toast('MTU not changed: ' + r.job.err);
          else if (x.undone) self.openModal('<div class="hic" style="background:' + GRAD.orange + '">' + svg('net') + '</div><h2>Size put back</h2><p>' + esc(x.name) + ' didn’t work well with ' + esc(x.mtu) + ' (' + esc(x.why || 'test failed') + '), so it went back to ' + esc(x.old) + ' by itself. Nothing else changed.</p><div class="btns"><button data-m="cancel">OK</button></div>', {});
          else self.toast(x.name + ' now uses MTU ' + x.mtu + ' (tested for a minute)');
        }
        if (m.alive) self.tkPaint();
      });
    },
    tkAct: function(arg){
      var self = this, m = this.mh, t = m.tk = m.tk || { tab: 'hw' }, a = String(arg || '').split(':');
      if (a[0] === 'tab'){ t.tab = a[1]; return this.tkLoad(); }
      if (a[0] === 'refresh') return this.tkLoad();
      if (a[0] === 'run'){
        var kind = a[1], secs = Number(a[2]) || 60;
        var go = function(){ return rpcx('machome', 'tk_job_start', { kind: kind, secs: secs }, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'not started'); t.job = { running: true, kind: kind, pct: 0, step: 'Starting…' }; self.tkPaint(); return ''; }); };
        if (kind === 'cpu') return this.confirm({ title: 'Run the CPU stress test?', icon: 'cpu', grad: GRAD.orange, ok: 'Start', working: 'Starting…',
          body: '<p>All ' + ((t.info && t.info.cores && t.info.cores.length) || '') + ' CPU cores run at full load for ' + (secs >= 120 ? '2 minutes' : secs + ' seconds') + ' while the temperature is recorded. Internet and VPN keep working but can be a little slower during the test.</p><p>It stops by itself if the router reaches ' + tdispF(203) + '.</p>' }, go);
        if (kind === 'disk') return this.confirm({ title: 'Run the storage speed test?', icon: 'cpu', grad: GRAD.blue, ok: 'Start', working: 'Starting…',
          body: '<p>Writes 64 MB of test data to the router’s flash storage, reads it back and deletes it. Takes about 10 seconds; a one-off test like this doesn’t wear the flash in any meaningful way.</p>' }, go);
        return go().catch(function(e){ self.toast('Couldn’t start it: ' + e.message); });
      }
      if (a[0] === 'stop') return rpcx('machome', 'tk_job_stop', {}, 10000).then(function(){ self.toast('Stopping…'); self.tkJob(); });
      if (a[0] === 'zram') return this.tkZramDialog();
      if (a[0] === 'zramreset') return this.confirm({ title: 'Put zram back to its defaults?', icon: 'cpu', grad: GRAD.blue, ok: 'Reset', working: 'Restarting…',
        body: '<p>Zram goes back to GL’s defaults: half the RAM, lzo compression. It restarts in a few seconds; anything swapped out moves back into RAM first.</p>' },
        function(){ return rpcx('machome', 'tk_zram_reset', {}, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'error'); t.job = { running: true, kind: 'zram', pct: 0, step: 'Restarting zram…' }; self.tkPaint(); return 'Restarting zram…'; }); });
      if (a[0] === 'pkgfix') return this.confirm({ title: a[1] === 'lock' ? 'Remove the leftover lock?' : 'Refresh the package lists?', icon: 'apps', grad: GRAD.blue, ok: a[1] === 'lock' ? 'Remove' : 'Refresh', working: 'Working…',
        body: a[1] === 'lock' ? '<p>An install that didn’t finish left a lock file behind, which blocks new installs. Nothing is installing right now, so it’s safe to remove.</p>'
          : '<p>Downloads the current package lists from GL.iNet’s servers (what GL’s Plug-ins page does). Nothing is installed or removed.</p>' },
        function(){ return rpcx('machome', 'tk_pkg_fix', { what: a[1] }, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'error');
          if (a[1] === 'update'){ t.job = { running: true, kind: 'opkg', pct: 0, step: 'Downloading package lists…' }; self.tkPaint(); return 'Refreshing package lists…'; }
          return rpc('machome', 'tk_pkg').then(function(p){ if (p && p.ok){ t.pkg = p; self.tkPaint(); } return 'Lock removed'; }); }); });
      if (a[0] === 'mtuuse'){
        var ifc = a[1], nmtu = Number(a[2]), tu = ((((t.results || {}).mtu || {}).r || {}).tunnels || []).filter(function(x){ return x.ifc === ifc; })[0];
        if (!tu || !nmtu) return;
        return this.confirm({ title: 'Change ' + (tu.name || ifc) + ' to ' + nmtu + '?', icon: 'net', grad: GRAD.blue, ok: 'Change & test', working: 'Starting…',
          body: '<p>The tunnel’s packet size (MTU) goes from <b>' + esc(tu.cur) + '</b> to <b>' + nmtu + '</b> right away; no reconnect needed.</p>' +
            '<p>For the next minute the router checks that websites load and full-size packets get through this tunnel. If either fails twice, <b>' + esc(tu.cur) + ' comes back by itself</b>.</p>' +
            '<p style="font-size:12px">Only the server this tunnel uses now (' + esc(tu.name || ifc) + ') is changed; other saved servers keep their size. GL’s VPN page shows the new size too. Undo script: /root/machome-backup/.</p>' },
          function(){ return rpcx('machome', 'tk_mtu_apply', { ifc: ifc, mtu: nmtu }, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'error');
            t.job = { running: true, kind: 'mtuapply', pct: 0, step: 'Starting…' }; self.tkPaint(); return 'Testing the new size…'; }); });
      }
      if (a[0] === 'bwadd') return this.tkBwDialog(null);
      if (a[0] === 'bwedit') return this.tkBwDialog(a.slice(1).join(':'));
      if (a[0] === 'bwrm'){
        var bmac = a.slice(1).join(':'), all = this.clientsArr() || [], bc = all.filter(function(c){ return c.mac === bmac; })[0];
        if (!bc) return;
        return this.confirm({ title: 'Remove the speed limit?', icon: 'dl', grad: GRAD.orange, ok: 'Remove limit', working: 'Removing…',
          body: '<p><b>' + esc(this.devName(bc, all.indexOf(bc))) + '</b> goes back to full speed.</p>' },
          function(){ return rpcx('qos', 'remove_speed_limit_rule', { mac: bmac }, 30000).then(function(){ return self.tkClients().then(function(){ return 'Limit removed'; }); }); });
      }
      if (a[0] === 'sshadd') return this.tkSshAdd();
      if (a[0] === 'sshrm'){
        var fp = a.slice(1).join(':'), k = ((t.ssh && t.ssh.keys) || []).filter(function(x){ return x.fp === fp; })[0];
        if (!k) return;
        return this.confirm({ title: 'Remove this SSH key?', icon: 'shield', grad: GRAD.red, ok: 'Remove key', working: 'Removing…', danger: true,
          body: '<p><b>' + esc(k.type) + '</b> ' + esc(k.comment || '(no name)') + '<br><small style="word-break:break-all">' + esc(k.fp) + '</small></p>' +
            (k.claude ? '<p style="color:var(--mh-red)"><b>This is the key Claude Code uses to manage this router.</b> Without it, Claude can’t make changes or run checks over SSH until a new key is added.</p>' : '') +
            '<p>Anyone using this key can no longer sign in over SSH. A copy of the key file is kept in /root/machome-backup/.</p>' },
          function(){ return rpcx('machome', 'tk_ssh_remove', { fp: fp }, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'error');
            return rpc('machome', 'tk_ssh').then(function(s){ if (s && s.ok){ t.ssh = s; self.tkPaint(); } return 'Key removed'; }); }); });
      }
    },
    tkZramDialog: function(){
      var self = this, t = this.mh.tk, z = t.zram; if (!z) return;
      var ramMb = Math.round(z.ram / 1048576), cur = z.set_size || 0;
      var sizes = [[0, 'Default: half the RAM (' + z.default_mb + ' MB)'], [Math.round(ramMb * .25), '25% of RAM (' + Math.round(ramMb * .25) + ' MB)'], [Math.round(ramMb * .75), '75% of RAM (' + Math.round(ramMb * .75) + ' MB)'], [ramMb, '100% of RAM (' + ramMb + ' MB)']];
      var AD = { 'lzo': 'lzo: fast, GL’s default', 'lzo-rle': 'lzo-rle: a bit faster than lzo', 'lz4': 'lz4: fastest', 'lz4hc': 'lz4hc: slower to compress, fast to read', 'zstd': 'zstd: best compression, uses the most CPU', '842': '842: hardware-friendly, rarely better' };
      var opt = function(v, l, sel){ return '<option value="' + esc(String(v)) + '"' + (sel ? ' selected' : '') + '>' + esc(l) + '</option>'; };
      this.confirm({ title: 'Zram settings', icon: 'cpu', grad: GRAD.green, ok: 'Apply & restart zram', working: 'Applying…',
        body: '<p>Zram is memory the router compresses instead of running out of RAM. A bigger size lets it squeeze more in; a stronger algorithm packs it tighter but uses more CPU.</p>' +
          '<label for="mh-zsz">Size</label><select id="mh-zsz">' + sizes.map(function(s){ return opt(s[0], s[1], s[0] === cur || (!cur && !s[0])); }).join('') + '</select>' +
          '<label for="mh-zal" style="margin-top:8px">Compression</label><select id="mh-zal">' + (z.algos || []).map(function(a){ return opt(a, AD[a] || a, a === z.algo); }).join('') + '</select>' +
          '<p style="font-size:12px">Applying restarts zram in a few seconds; anything swapped out moves back into RAM first. The old settings are saved in /root/machome-backup/.</p>' },
        function(){
          var md = document.getElementById('machome-modal');
          var size = Number(md.querySelector('#mh-zsz').value), algo = md.querySelector('#mh-zal').value;
          return rpcx('machome', 'tk_zram_set', { size_mb: size, algo: algo }, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'error');
            t.job = { running: true, kind: 'zram', pct: 0, step: 'Restarting zram…' }; self.tkPaint(); return 'Restarting zram…'; });
        });
    },
    tkSshAdd: function(){
      var self = this, t = this.mh.tk;
      this.confirm({ title: 'Add an SSH key', icon: 'shield', grad: GRAD.blue, ok: 'Add key', working: 'Adding…',
        body: '<p>Paste a <b>public</b> key (one line starting with ssh-ed25519, ssh-rsa or ecdsa-sha2-…). The person or computer holding the matching private key can then sign in as root over SSH.</p>' +
          '<textarea id="mh-sshk" rows="4" style="width:100%;font-family:monospace;font-size:12px" placeholder="ssh-ed25519 AAAA… name"></textarea>' },
        function(){
          var v = document.getElementById('machome-modal').querySelector('#mh-sshk').value;
          return rpcx('machome', 'tk_ssh_add', { key: v }, 15000).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'error');
            return rpc('machome', 'tk_ssh').then(function(s){ if (s && s.ok){ t.ssh = s; self.tkPaint(); } return 'Key added'; }); });
        });
    },
    tkPaint: function(){
      if (!this.q('tk')) return;
      var t = this.mh.tk || { tab: 'hw' }, tab = t.tab, job = t.job || {}, R = t.results || {}, self = this;
      var F = function(c){ return c == null ? '—' : tconv(c) + ' °' + TU; };
      var yes = function(b, y, n){ return '<span style="color:' + (b ? 'var(--mh-green)' : 'var(--mh-orange)') + '">' + (b ? '✓ ' : '✗ ') + esc(b ? y : n) + '</span>'; };
      var tabs = [['hw', 'Hardware'], ['bench', 'Benchmarks'], ['net', 'Network'], ['sys', 'Zram & system'], ['ssh', 'SSH keys']];
      var h = '<div class="mh-seg2" style="margin-bottom:12px">' + tabs.map(function(x){ return '<button data-act="tk" data-arg="tab:' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
      var sec = function(s){ return '<div class="mh-sec">' + s + '</div>'; };
      var tbl = function(head, rows){ return '<div class="mh-isp"><table><thead><tr>' + head.map(function(x){ return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; };
      var running = job.running ? '<div class="mh-vh" style="margin-bottom:10px"><b>' + esc(({ cpu: 'CPU stress test', crypto: 'VPN & crypto test', disk: 'Storage test', mem: 'Memory test', dns: 'DNS test', zram: 'Zram', opkg: 'Package lists', mtu: 'MTU check', mtuapply: 'MTU change' })[job.kind] || 'Test') + ': ' + esc(job.step || '…') +
        '</b><div class="mh-bar" style="margin:8px 0"><i style="width:' + Math.max(3, job.pct || 0) + '%;background:var(--mh-blue)"></i></div>' + (job.kind !== 'zram' && job.kind !== 'opkg' && job.kind !== 'mtuapply' ? '<button class="mh-btn sec" data-act="tk" data-arg="stop">Stop</button>' : '') + '</div>' : '';
      if (tab === 'hw'){
        var i = t.info;
        if (!i) h += '<p class="mh-empty">Reading the hardware…</p>';
        else {
          var c0 = (i.cores && i.cores[0]) || {}, mem = i.mem || {}, cr = i.crypto || {};
          /* short sizes so values fit the narrow grid: "113 MB", "7.2 GB" */
          var sz = function(n){ n = Number(n) || 0; return n >= 1073741824 ? (n / 1073741824).toFixed(1) + ' GB' : Math.round(n / 1048576) + ' MB'; };
          h += sec('Processor & system') + '<div class="mh-kv">' + kv('Device', i.board) + kv('CPU', i.core + ' × ' + (i.cores || []).length) +
            kv('Clock', c0.max ? Math.round(c0.max / 1000) + ' MHz' : null) + kv('Power mode', c0.gov || null) +
            kv('Firmware', i.firmware) + kv('OpenWrt', i.openwrt ? String(i.openwrt).replace(/^OpenWrt\s*/, '') : null) + kv('Kernel', i.kernel) + kv('Uptime', dur(i.uptime)) + '</div>';
          h += sec('Memory & storage') + '<div class="mh-kv">' + kv('RAM', sz(mem.total)) + kv('Available', sz(mem.avail)) + kv('Cache', sz(mem.cached)) + kv('Zram in use', mem.swap ? sz(mem.swap - mem.swapfree) + ' of ' + sz(mem.swap) : 'Off') +
            (i.disks || []).map(function(d){ return kv(d.mnt === '/overlay' ? 'Flash storage' : d.mnt === '/tmp' ? 'RAM disk' : 'Firmware space', sz(d.used) + ' of ' + sz(d.size)); }).join('') + '</div>';
          h += sec('Temperatures') + '<div class="mh-kv">' + (i.temps || []).map(function(x){ return kv(x.name.replace(/_thermal$|_tz_sensor/g, ' ').replace(/_/g, ' ').trim(), F(x.c)); }).join('') + '</div>';
          /* crypto audit as a table: the driver names are too long for the grid */
          var ok2 = function(b){ return '<span style="color:' + (b ? 'var(--mh-green)' : 'var(--mh-orange)') + '">' + (b ? '✓ Yes' : '✗ No') + '</span>'; };
          h += sec('VPN crypto acceleration') + tbl(['Feature', 'Active', 'Details'], [
            ['AES instructions (ARMv8 Crypto Extensions)', ok2(cr.aes_ce), 'Speeds up AES, used by OpenVPN and HTTPS'],
            ['NEON (SIMD)', ok2(cr.neon), 'Vector instructions that speed up ChaCha20'],
            ['AES-GCM in the kernel', ok2(!!cr.gcm), esc(cr.gcm || cr.aes || '—')],
            ['ChaCha20 (WireGuard’s cipher)', ok2(cr.chacha_fast), esc(cr.chacha || 'plain C code')],
            ['Hardware crypto engine', ok2(!!cr.engine), esc(cr.engine || 'none found')],
            ['WireGuard kernel module', ok2(cr.wg), cr.wg ? 'loaded' : 'not loaded'],
            ['OpenSSL', ok2(!!cr.openssl), esc(cr.openssl || 'not installed')]]);
          h += sec('Network ports') + tbl(['Port', 'State', 'Link', 'MTU', 'Received', 'Sent'], (i.ifs || []).map(function(x){
            return [esc(x.name), x.state === 'up' ? '<span style="color:var(--mh-green)">up</span>' : esc(x.state || '—'), x.speed && x.speed > 0 ? (x.speed >= 1000 ? (x.speed / 1000) + ' Gbps' : x.speed + ' Mbps') + (x.duplex === 'full' ? '' : x.duplex ? ' ' + esc(x.duplex) : '') : '—', x.mtu || '—', bytes(x.rx), bytes(x.tx)]; }));
          h += sec('Wi-Fi radios') + ((i.radios || []).length ? tbl(['Interface', 'Band', 'Channel', 'Width', 'Power', 'Hardware'], i.radios.map(function(r){
            return [esc(r.ifname), r.ghz ? (r.ghz > 5.9 ? '6 GHz' : r.ghz > 4 ? '5 GHz' : '2.4 GHz') : '—', r.channel || '—', esc(r.width), r.txpower != null ? r.txpower + ' dBm' : '—', esc(r.hw || '—')]; }))
            : '<p class="mh-empty" style="margin:0">' + (i.mode === 'ap' ? 'No Wi-Fi radios found.' : 'This router has no Wi-Fi radios.') + '</p>');
          h += '<p style="margin-top:8px"><button class="mh-btn sec" data-act="tk" data-arg="refresh">Refresh</button></p>';
        }
      }
      if (tab === 'bench'){
        var when = function(k){ return R[k] ? ' <small style="color:var(--mh-text2)">· ' + ago(Math.floor(Date.now() / 1000) - R[k].t) + '</small>' : ''; };
        var btn = function(k, l, extra){ return '<button class="mh-btn' + (job.running ? ' sec' : '') + '" data-act="tk" data-arg="run:' + k + (extra ? ':' + extra : '') + '"' + (job.running ? ' disabled' : '') + ' style="margin:0 6px 6px 0">' + l + '</button>'; };
        var item = function(title, desc, buttons, k, res){ return '<div class="mh-vh"><b>' + title + when(k) + '</b><p style="margin:4px 0 8px;color:var(--mh-text2);font-size:12px">' + desc + '</p>' + buttons + (res || '') + '</div>'; };
        var spark = function(s){ if (!s || s.length < 2) return ''; var lo = Math.min.apply(null, s) - 1, hi = Math.max.apply(null, s) + 1, W = 240, H = 40;
          return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:240px;height:40px;display:block;margin-top:6px"><polyline fill="none" stroke="var(--mh-orange)" stroke-width="2" points="' + s.map(function(v, j){ return (j * W / (s.length - 1)).toFixed(1) + ',' + (H - (v - lo) / (hi - lo) * H).toFixed(1); }).join(' ') + '"/></svg>'; };
        var rc = R.cpu && R.cpu.r, rk = R.crypto && R.crypto.r, rd = R.disk && R.disk.r, rm = R.mem && R.mem.r, rn = R.dns && R.dns.r;
        h += running;
        h += item('CPU thermal stress', 'Runs every CPU core at full load and records how hot the router gets and whether it slows itself down (throttles). Stops by itself at ' + tdispF(203) + '.',
          btn('cpu', '30 s', '30') + btn('cpu', '1 min', '60') + btn('cpu', '2 min', '120'), 'cpu',
          rc ? '<p style="margin:6px 0 0">Peak <b>' + F(rc.peak_c) + '</b> (started at ' + F(rc.start_c) + ', back to ' + F(rc.end_c) + ') over ' + rc.secs + ' s on ' + rc.cores + ' cores · CPU ' + (rc.throttled ? '<span style="color:var(--mh-orange)">slowed to ' + rc.low_mhz + ' MHz (throttled)</span>' : 'stayed at ' + ((rc.low_mhz && rc.max_mhz && rc.low_mhz < rc.max_mhz) ? rc.low_mhz + '–' + rc.max_mhz : (rc.max_mhz || rc.avg_mhz || '—')) + ' MHz (no throttling)') + (rc.note ? ' · ' + esc(rc.note) : '') + '</p>' + spark((rc.series || []).map(tconv)) : '');
        h += item('VPN & crypto speed', 'How fast one CPU core encrypts with OpenSSL: ChaCha20 (what WireGuard uses) and AES-GCM (OpenVPN and most HTTPS), plus RSA handshakes. Takes about 40 seconds. WireGuard itself runs in the kernel and can use several cores.',
          btn('crypto', 'Run'), 'crypto',
          rk ? tbl(['Cipher', 'Speed (one core)', 'Used by'], (rk.ciphers || []).map(function(c){ return ['<b>' + esc(c.name) + '</b>', c.mbs != null ? c.mbs + ' MB/s <small>(' + Math.round(c.mbs * 8.39) + ' Mbps)</small>' : '—', esc(c.what)]; })) +
            '<p style="margin:6px 0 0;font-size:12px">RSA-2048: ' + (rk.rsa_sign != null ? Math.round(rk.rsa_sign) + ' signs/s · ' + Math.round(rk.rsa_verify) + ' verifies/s' : '—') + ' · ' + esc(rk.openssl || '') + '</p>' : '');
        h += item('Storage speed', 'Writes 64 MB of test data to the flash storage, reads it back and deletes it.', btn('disk', 'Run'), 'disk',
          rd ? '<p style="margin:6px 0 0">Write <b>' + rd.write_mbs + ' MB/s</b> · read <b>' + rd.read_mbs + ' MB/s</b> <small>(' + rd.mb + ' MB' + (rd.fs ? ', ' + esc(rd.fs) + ' flash' : '') + ')</small></p>' : '');
        h += item('Memory speed', 'How fast the RAM moves data, and the RAM disk (/tmp) where the router keeps temporary files.', btn('mem', 'Run'), 'mem',
          rm ? '<p style="margin:6px 0 0">Memory copy <b>' + rm.copy_mbs + ' MB/s</b> · RAM disk write <b>' + rm.write_mbs + ' MB/s</b>, read <b>' + rm.read_mbs + ' MB/s</b></p>' : '');
        h += item('DNS latency', 'Looks up 10 popular sites at your devices’ DNS, the router’s own DNS, Cloudflare, Quad9 and Google, straight from the router. Lower is better; your own DNS often wins because it caches answers.', btn('dns', 'Run'), 'dns',
          rn ? tbl(['DNS server', 'Middle', 'Average', 'Best – worst', 'Failed'], (rn.servers || []).map(function(s){ return ['<b>' + esc(s.label) + '</b> <small>' + esc(s.ip) + '</small>', s.median != null ? s.median + ' ms' : '—', s.avg != null ? s.avg + ' ms' : '—', s.best != null ? s.best + '–' + s.worst + ' ms' : '—', s.fails ? '<span style="color:var(--mh-orange)">' + s.fails + ' of ' + s.n + '</span>' : '0']; })) : '');
        h += '<p style="font-size:12px;color:var(--mh-text2)">Results stay until the router restarts. Only one test runs at a time.</p>';
      }
      if (tab === 'net'){
        var rmt = R.mtu && R.mtu.r, rap = R.mtuapply && R.mtuapply.r, apm = this.isAP() || (rmt && rmt.ap);
        h += running;
        /* ---- MTU */
        h += sec('MTU (packet size)') + '<p style="font-size:13px;margin:0 0 8px;color:var(--mh-text2)">The biggest packet that gets through without being split up. A VPN tunnel set too high splits packets (slower, sometimes pages hang); too low wastes a little speed. Measuring changes nothing.</p>';
        h += '<p><button class="mh-btn' + (job.running ? ' sec' : '') + '" data-act="tk" data-arg="run:mtu"' + (job.running ? ' disabled' : '') + '>' + (rmt ? 'Check again' : 'Check MTU') + '</button>' + (R.mtu ? ' <small style="color:var(--mh-text2)">· ' + ago(Math.floor(Date.now() / 1000) - R.mtu.t) + '</small>' : '') + '</p>';
        if (rmt){
          h += '<div class="mh-kv">' + kv('Internet path', rmt.wan ? rmt.wan + (rmt.wan >= 1500 ? ' (full)' : '') : 'couldn’t measure') +
            (rmt.targets || []).map(function(x){ return kv('To ' + x.name, x.mtu ? String(x.mtu) : esc(x.note || '—')); }).join('') + '</div>';
          var ST = { best: ['var(--mh-green)', '✓ best size'], fine: ['var(--mh-green)', '✓ fine'], low: ['var(--mh-orange)', 'lower than needed'], high: ['var(--mh-red)', 'too high: packets get split'], unknown: ['var(--mh-text2)', 'couldn’t tell'] };
          if ((rmt.tunnels || []).length){
            h += tbl(['Tunnel', 'Now', 'Best', 'Status', ''], rmt.tunnels.map(function(x){
              var s = ST[x.status] || ST.unknown, can = x.best && x.best !== x.cur && (x.status === 'high' || x.status === 'low');
              return ['<b>' + esc(x.name || x.ifc) + '</b> <small>' + esc(x.ifc) + '</small>', esc(x.cur) + (x.works ? '' : ' <small style="color:var(--mh-orange)">(full-size ping failed)</small>'),
                x.best ? esc(x.best) + ' <small>' + (x.measured ? 'path to server ' + esc(x.path) : 'from internet path') + (x.v6 ? ', IPv6' : '') + '</small>' : '—',
                '<span style="color:' + s[0] + '">' + s[1] + '</span>',
                can ? '<button class="mh-btn sec" data-act="tk" data-arg="mtuuse:' + esc(x.ifc) + ':' + esc(x.best) + '"' + (job.running ? ' disabled' : '') + '>Use ' + esc(x.best) + '</button>' : ''];
            }));
          } else h += '<p class="mh-empty" style="margin:6px 0 0">' + (apm ? 'This router is an access point: its VPN tunnels run on the main router, so check MTU there.' : 'No WireGuard tunnels are running.') + '</p>';
          h += '<p style="font-size:12px;color:var(--mh-text2)">Best = path size − 60 bytes for WireGuard’s own wrapping (80 for an IPv6 server). “Use” tests the new size for a minute and goes back by itself if anything breaks. OpenVPN tunnels aren’t changed here.</p>';
        }
        if (rap) h += '<p style="font-size:12px;margin:4px 0 0">Last change: ' + esc(rap.name) + ' ' + esc(rap.old) + ' → ' + esc(rap.mtu) + (rap.undone ? ' <span style="color:var(--mh-orange)">put back automatically (' + esc(rap.why || 'test failed') + ')</span>' : ' <span style="color:var(--mh-green)">kept</span>') + ' · ' + ago(Math.floor(Date.now() / 1000) - R.mtuapply.t) + '</p>';
        /* ---- speed limits (GL's own limiter) */
        h += sec('Speed limits');
        if (apm) h += '<p class="mh-empty" style="margin:0">Set speed limits on the main router: this access point passes its devices’ traffic to it, and it limits them there.</p>';
        else {
          var cl = this.clientsArr();
          if (!cl) h += '<p class="mh-empty">Loading devices…</p>';
          else {
            var mbs = function(kb){ return kb ? (Math.round(kb * 8 / 1000 * 10) / 10) + ' Mbps' : 'no limit'; };
            var lim = cl.map(function(c, i){ return { c: c, i: i }; }).filter(function(x){ return x.c.limit_rx || x.c.limit_tx; });
            h += '<p style="font-size:13px;margin:0 0 8px;color:var(--mh-text2)">Cap how fast one device can download or upload. Uses GL’s own speed limiter (Clients → Speed limit), so limits stay after a restart.</p>';
            h += lim.length ? tbl(['Device', 'Download', 'Upload', ''], lim.map(function(x){
              return ['<b>' + esc(self.devName(x.c, x.i)) + '</b>' + (x.c.online ? '' : ' <small style="color:var(--mh-text2)">offline</small>'), mbs(x.c.limit_rx), mbs(x.c.limit_tx),
                '<button class="mh-btn sec" data-act="tk" data-arg="bwedit:' + esc(x.c.mac) + '">Change</button> <button class="mh-btn sec" data-act="tk" data-arg="bwrm:' + esc(x.c.mac) + '">Remove</button>'];
            })) : '<p class="mh-empty" style="margin:0 0 8px">No device has a speed limit.</p>';
            h += '<p><button class="mh-btn" data-act="tk" data-arg="bwadd">Add a speed limit</button></p>';
          }
        }
      }
      if (tab === 'sys'){
        var z = t.zram, p = t.pkg;
        h += running;
        h += sec('Zram (compressed memory)');
        if (!z) h += '<p class="mh-empty">Checking…</p>';
        else if (!z.installed) h += '<p class="mh-empty" style="margin:0">Zram isn’t installed. Install GL’s <b>zram-swap</b> package in System → Plug-ins; it sets itself up at every boot.</p>';
        else {
          var ratio = z.compr > 0 ? (z.orig / z.compr).toFixed(1) + '×' : '—';
          h += '<div class="mh-kv">' + kv('Status', z.on ? '<span style="color:var(--mh-green)">On</span>' : '<span style="color:var(--mh-orange)">Off</span>', true) + kv('Size', z.on ? bytes(z.size) + (z.set_size ? ' (custom)' : ' (default)') : '—') +
            kv('In use', z.on ? bytes(z.used) + ' (' + Math.round(z.size ? z.used / z.size * 100 : 0) + '%)' : '—') + kv('Compression', (z.algo || '—') + ' · ratio ' + ratio) +
            kv('RAM it takes', bytes(z.mem)) + kv('Peak since restart', bytes(z.peak)) + '</div>' +
            '<p><button class="mh-btn" data-act="tk" data-arg="zram"' + (job.running ? ' disabled' : '') + '>Change size or compression</button> ' +
            ((z.set_size || z.set_algo) ? '<button class="mh-btn sec" data-act="tk" data-arg="zramreset"' + (job.running ? ' disabled' : '') + '>Back to defaults</button>' : '') + '</p>';
        }
        h += sec('Package system');
        if (!p) h += '<p class="mh-empty">Checking…</p>';
        else {
          h += '<div class="mh-kv">' + kv('Installed packages', String(p.packages)) + kv('Database', p.problems.length ? '<span style="color:var(--mh-orange)">' + p.problems.length + ' problem' + (p.problems.length > 1 ? 's' : '') + '</span>' : '<span style="color:var(--mh-green)">✓ healthy</span>', true) +
            kv('Package lists', p.lists ? p.lists + ' downloaded' : 'none yet') + kv('Installing now', p.busy ? 'yes' : 'no') + '</div>' +
            (p.problems.length ? '<ul style="margin:6px 0 8px 18px;font-size:13px">' + p.problems.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
            '<p>' + (p.stale_lock ? '<button class="mh-btn" data-act="tk" data-arg="pkgfix:lock">Remove leftover lock</button> ' : '') +
            '<button class="mh-btn sec" data-act="tk" data-arg="pkgfix:update"' + (job.running ? ' disabled' : '') + '>Refresh package lists</button></p>' +
            (p.dups && p.dups.length ? '<p style="font-size:12px;color:var(--mh-text2)">Packages listed twice can’t be fixed safely from here: reinstalling them in System → Plug-ins usually clears it.</p>' : '');
        }
        h += sec('Mode switch') + '<p style="font-size:13px;margin:0;color:var(--mh-text2)">This router has no physical mode switch, so there’s nothing to set here.</p>';
      }
      if (tab === 'ssh'){
        var s = t.ssh;
        if (!s) h += '<p class="mh-empty">Reading the keys…</p>';
        else {
          var only = (s.keys || []).length <= 1;
          h += '<p style="font-size:13px;margin:0 0 8px">Keys that can sign in as root over SSH. Password sign-in is <b>' + (s.password_login ? '<span style="color:var(--mh-orange)">on</span>' : 'off') + '</b>' + (s.password_login ? '' : ', so the last key can’t be removed (it would lock SSH out)') + '.</p>' +
            ((s.keys || []).length ? (s.keys.map(function(k){ return '<div class="mh-vh"><b>' + esc(k.comment || '(no name)') + ' <small style="color:var(--mh-text2)">' + esc(k.type) + '</small>' + (k.claude ? ' <span class="mh-pill" style="font-size:11px;padding:1px 6px;border-radius:8px;background:var(--mh-blue);color:#fff">Claude Code</span>' : '') +
              (k.restricted ? ' <small style="color:var(--mh-text2)">(restricted)</small>' : '') + '</b><p style="margin:4px 0 6px;font-size:12px;word-break:break-all;color:var(--mh-text2)">' + esc(k.fp) + '</p>' +
              '<button class="mh-btn sec" data-act="tk" data-arg="sshrm:' + esc(k.fp) + '"' + (only && !s.password_login ? ' disabled title="The last key can’t be removed while password sign-in is off"' : '') + '>Remove</button></div>'; }).join(''))
              : '<p class="mh-empty">No SSH keys.</p>') +
            '<p><button class="mh-btn" data-act="tk" data-arg="sshadd">Add a key</button></p>';
        }
      }
      h += '<p style="margin-top:14px;padding-top:10px;border-top:1px solid var(--mh-sep);font-size:12px;color:var(--mh-text2)">Inspired by the <a href="https://github.com/phantasm22/GL-iNet_utils" target="_blank" rel="noopener" style="color:var(--mh-blue)">GL.iNet Utilities Toolkit</a> by <b>phantasm22</b> (GPL-3.0). Rebuilt from scratch for Router Home as point-and-click tools; no code from the original script is used.</p>';
      this.set('tk', h);
    },
    /* ---- Speed history */
    sphPaint: function(){
      var m = this.mh, list = m.sph; if (!this.q('sph') || !list) return;
      var mode = m.sphMode || 'd', since = Date.now() / 1000 - 60 * 86400;
      list = list.filter(function(r){ return r.t >= since && (mode === 'd' ? r.d != null : r.u != null); });
      if (!list.length){ this.set('sph', '<p class="mh-empty" style="margin:0">No speed tests in the last 60 days.</p>'); return; }
      var series = {}, order = []; list.forEach(function(r){ if (!series[r.l]){ series[r.l] = []; order.push(r.l); } series[r.l].push(r); });
      var cols = ['var(--mh-blue)', 'var(--mh-orange)', 'var(--mh-purple)', 'var(--mh-teal)', 'var(--mh-red)', 'var(--mh-green)'];
      var W = 640, H = 200, P = 34, t0 = list[0].t, t1 = list[list.length - 1].t; if (t1 === t0) t1 = t0 + 1;
      var mx = list.reduce(function(a, r){ return Math.max(a, mode === 'd' ? r.d : r.u); }, 1) * 1.1;
      var X = function(t){ return P + (W - P - 8) * (t - t0) / (t1 - t0); }, Y = function(v){ return H - 20 - (H - 30) * v / mx; };
      var g = '';
      [0, .5, 1].forEach(function(f){ var v = mx * f; g += '<line x1="' + P + '" x2="' + (W - 8) + '" y1="' + Y(v).toFixed(0) + '" y2="' + Y(v).toFixed(0) + '" stroke="var(--mh-sep)"/><text x="2" y="' + (Y(v) + 4).toFixed(0) + '" font-size="10" fill="var(--mh-text2)">' + (v >= 1000 ? (v / 1000).toFixed(1) + 'G' : v.toFixed(0)) + '</text>'; });
      order.forEach(function(l, i){
        var pts = series[l].map(function(r){ return X(r.t).toFixed(1) + ',' + Y(mode === 'd' ? r.d : r.u).toFixed(1); });
        g += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + cols[i % cols.length] + '" stroke-width="2.2" stroke-linejoin="round"/>';
        series[l].forEach(function(r){ g += '<circle cx="' + X(r.t).toFixed(1) + '" cy="' + Y(mode === 'd' ? r.d : r.u).toFixed(1) + '" r="2.6" fill="' + cols[i % cols.length] + '"><title>' + esc(l) + ' · ' + new Date(r.t * 1000).toLocaleDateString() + ' · ' + (mode === 'd' ? r.d : r.u) + ' Mbps</title></circle>'; });
      });
      g += '<text x="' + P + '" y="' + (H - 4) + '" font-size="10" fill="var(--mh-text2)">' + new Date(t0 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + '</text><text x="' + (W - 8) + '" y="' + (H - 4) + '" font-size="10" text-anchor="end" fill="var(--mh-text2)">' + new Date(t1 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + '</text>';
      /* each line can be removed (×); "Forget removed VPNs" clears VPNs that aren't on a tunnel anymore (2026-11-18) */
      var lg = order.map(function(l, i){ return '<span><i style="background:' + cols[i % cols.length] + '"></i>' + esc(l) + '<button class="mh-x" data-act="sphrm" data-arg="' + esc(l) + '" title="Remove this line from the history">×</button></span>'; }).join('');
      this.set('sph', '<div class="mh-sph"><div class="mh-seg2"><button data-act="sphmode" data-arg="d" class="' + (mode === 'd' ? 'on' : '') + '">Download</button><button data-act="sphmode" data-arg="u" class="' + (mode === 'u' ? 'on' : '') + '">Upload</button></div>' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '">' + g + '</svg><div class="lg">' + lg + '<span style="color:var(--mh-text2)">Mbps · last 60 days</span>' +
        '<a href="#" data-act="vpnforget" style="color:var(--mh-blue);margin-left:auto">Forget removed VPNs</a></div></div>');
    },
    /* ---- Ads blocked by device (AdGuard on the NAS) */
    /* AdGuard Home running ON this router: GL puts its API behind the admin page (/control/ -> AdGuard), protected
       by the browser's own GL login, exactly like GL's AdGuard page. The router never sees or stores a login. */
    adbLocal: function(){
      var self = this, m = this.mh;
      if (!window.fetch){ m.adb = { ok: false, err: 'This browser can’t read AdGuard’s log.' }; return this.lifePaint(); }
      fetch('/control/querylog?limit=500&response_status=blocked', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(function(r){ if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'login' : 'http'); return r.json(); })
        .then(function(j){
          var lan = (m.status && m.status.system && m.status.system.lan_ip) || location.hostname;
          var cnt = {}, dom = {}, total = 0, loop = 0;
          (j && j.data || []).forEach(function(e){
            var ip = String(e.client || ''), d = String((e.question && e.question.name) || '').replace(/\.$/, '');
            if (!ip) return; total++;
            if (/^(127\.|::1$|::ffff:127\.)/.test(ip) || ip === lan) loop++;
            cnt[ip] = (cnt[ip] || 0) + 1; if (d) dom[d] = (dom[d] || 0) + 1;
          });
          var top = function(o){ return Object.keys(o).map(function(k){ return { k: k, n: o[k] }; }).sort(function(a, b){ return b.n - a.n; }).slice(0, 10); };
          m.adb = { ok: true, local: true, total: total, perDevice: total > 0 && loop / total < 0.9,
            list: top(cnt).map(function(x){ return { ip: x.k, n: x.n }; }), domains: top(dom).map(function(x){ return { d: x.k, n: x.n }; }) };
          if (m.alive) self.lifePaint();
        })
        .catch(function(e){
          m.adb = { ok: false, err: e && e.message === 'login' ? 'Couldn’t read this router’s AdGuard log. Sign in to the admin page again, then reload.'
            : 'Couldn’t read this router’s AdGuard log (is the query log turned on in AdGuard Home settings?).' };
          if (m.alive) self.lifePaint();
        });
    },
    adbPaint: function(){
      var m = this.mh, r = m.adb; if (!this.q('adb') || !r) return;
      if (!r.ok){ this.set('adb', '<p class="mh-empty" style="margin:0">' + esc(r.err || 'Not available') + '</p>'); return; }
      if (r.local && !r.perDevice){
        /* lookups reach this router's AdGuard through the router's own DNS, so every device looks like the router:
           show the most-blocked sites instead (domains are shown even in privacy mode: they aren't personal IDs) */
        var dm = (r.domains[0] && r.domains[0].n) || 1;
        var hd = (r.domains || []).map(function(x){ return '<div><span>' + esc(x.d) + '</span><b>' + x.n + '</b><i style="width:' + (x.n / dm * 100).toFixed(0) + '%"></i></div>'; }).join('');
        this.set('adb', '<div class="mh-adb">' + (hd || '<p class="mh-empty">Nothing blocked recently.</p>') + '</div><small style="color:var(--mh-text2)">Most-blocked sites from this router’s AdGuard (last ' + (r.total || 0) +
          ' blocked lookups). AdGuard here sees every lookup as coming from the router, so it can’t split them by device.</small>');
        return;
      }
      var byip = {}; (this.clientsArr() || []).forEach(function(c){ if (c.ip) byip[c.ip] = c; });
      var self = this, mx = (r.list[0] && r.list[0].n) || 1;
      var h = r.list.map(function(x, i){ var c = byip[x.ip]; var nm = c ? self.devName(c, i) : (m.priv ? 'Device ' + (i + 1) : x.ip);
        return '<div><span>' + esc(nm) + '</span><b>' + x.n + '</b><i style="width:' + (x.n / mx * 100).toFixed(0) + '%"></i></div>'; }).join('');
      this.set('adb', '<div class="mh-adb">' + (h || '<p class="mh-empty">Nothing blocked recently.</p>') + '</div><small style="color:var(--mh-text2)">From ' + (r.local ? 'this router’s AdGuard' : 'AdGuard') + '’s last ' + (r.total || 0) + ' blocked lookups.</small>');
    },
    /* ---- Wake-on-LAN (Control Center rows) */
    wakeCC: function(){
      var self = this, m = this.mh, w = (m.life && m.life.wake) || {}, keys = Object.keys(w); m.wkRev = m.wkRev || {};
      if (!keys.length) return '<div class="mh-ccr"><div class="m"><b>Wake a computer</b><small>Turn it on in a PC’s device sheet (Clients card)</small></div></div>';
      return keys.map(function(mac, i){ var k = self.anonKey('wk:' + mac); m.wkRev[k] = mac;
        return '<div class="mh-ccr"><div class="m"><b>' + esc(m.priv ? 'Computer ' + (i + 1) : w[mac]) + '</b><small>Wake-on-LAN</small></div><button class="mh-btn" style="margin:0" data-act="wake" data-arg="' + k + '">Wake</button></div>'; }).join('');
    },
    wakeAct: function(k){
      var self = this, mac = this.mh.wkRev && this.mh.wkRev[k]; if (!mac) return;
      rpcx('machome', 'life', { op: 'wake', mac: mac }).then(function(r){ self.toast(r && r.ok ? 'Wake signal sent. The computer should start in a few seconds.' : 'Couldn’t send the wake signal'); }).catch(function(){ self.toast('Couldn’t send the wake signal'); });
    },
    /* ---- device sheet: schedule, person, wake */
    lifeDevHtml: function(c){
      var l = this.mh.life || {}, mac = String(c.mac || '').toUpperCase(), sc = (l.schedules || {})[mac] || null, person = (l.people || {})[mac] || '', wk = !!(l.wake || {})[mac];
      var days = sc ? sc.days : '12345', D = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      var dayBtns = D.map(function(d, i){ return '<button type="button" data-m="day" data-d="' + i + '" class="' + (days.indexOf(String(i)) > -1 ? 'on' : '') + '">' + d + '</button>'; }).join('');
      return '<div class="mh-dsec"><h4>Internet schedule</h4><label><input type="checkbox" id="mh-son"' + (sc && sc.on !== false ? ' checked' : '') + '> Pause this device’s internet on a schedule</label>' +
        '<div class="mh-days">' + dayBtns + '</div><div class="mh-trow">From <input id="mh-sfrom" type="time" value="' + esc(sc ? sc.from : '22:00') + '"> to <input id="mh-sto" type="time" value="' + esc(sc ? sc.to : '07:00') + '"></div>' +
        '<small>Days are when the pause starts; overnight times continue into the next morning.</small></div>' +
        '<div class="mh-dsec"><h4>Who’s home</h4><label for="mh-pn">This is ___’s phone (leave empty if not)</label><input id="mh-pn" maxlength="24" value="' + esc(person) + '" placeholder="e.g. user" autocomplete="off"></div>' +
        '<div class="mh-dsec"><h4>Wake-on-LAN</h4><label><input type="checkbox" id="mh-wk"' + (wk ? ' checked' : '') + '> Show a Wake button for this computer in Control Center</label><small>The computer must have Wake-on-LAN enabled in its settings and be wired.</small></div>' +
        '<div class="btns" style="margin-top:10px"><button class="pri" data-m="lifesave">Save schedule / home / wake</button></div>';
    },
    lifeDevSave: function(c, md, b){
      var self = this, e = md.querySelector('[data-e]'), days = '';
      Array.prototype.forEach.call(md.querySelectorAll('.mh-days button.on'), function(x){ days += x.getAttribute('data-d'); });
      var on = md.querySelector('#mh-son').checked, from = md.querySelector('#mh-sfrom').value, to = md.querySelector('#mh-sto').value;
      var name = String(c.alias || c.name || 'Device').replace(/["<>`$\\]/g, '').slice(0, 40), person = md.querySelector('#mh-pn').value.trim(), wk = md.querySelector('#mh-wk').checked;
      if (on && !days){ e.textContent = 'Pick at least one day for the schedule.'; return; }
      if (/["<>`$\\]/.test(person)){ e.textContent = 'The name can’t contain " < > ` $ or \\'; return; }
      var had = !!((this.mh.life || {}).schedules || {})[String(c.mac).toUpperCase()];
      b.disabled = true; b.textContent = 'Saving…';
      var jobs = [];
      if (on) jobs.push(rpcx('machome', 'life', { op: 'set_schedule', mac: c.mac, name: name, days: days, from: from, to: to, on: true }));
      else if (had) jobs.push(rpcx('machome', 'life', { op: 'set_schedule', mac: c.mac, on: false, del: true }));
      jobs.push(rpcx('machome', 'life', { op: 'set_person', mac: c.mac, person: person }));
      jobs.push(rpcx('machome', 'life', { op: 'set_wake', mac: c.mac, name: name, on: wk }));
      Promise.all(jobs).then(function(rs){
        var bad = rs.filter(function(r){ return !r || !r.ok; })[0]; if (bad) throw new Error(bad.err || 'not saved');
        self.closeModal(); self.toast('Saved' + (on ? ' · schedule ' + from + '–' + to : '')); self.lifeLoad();
      }).catch(function(err){ b.disabled = false; b.textContent = 'Save schedule / home / wake'; e.textContent = 'Couldn’t save: ' + err.message; });
    },
    anonKey: function(v){
      var m = this.mh; m.keys = m.keys || {}; m.keyN = m.keyN || 0;
      if (!m.keys[v]) m.keys[v] = 'k' + (++m.keyN);
      return m.keys[v];
    },
    /* Private value: hidden by default; the real value is only written to the DOM once revealed. */
    pv: function(key, val, kind){
      if (val == null || val === '') return null;
      if (this.mh.priv) return '<span class="mh-pv"><span class="mask">' + (kind === 'mac' ? '••:••:••:••:••:••' : '•••.•••.•••.•••') + '</span></span>';
      var shown = !!this.mh.revealed[key];
      var mask = kind === 'mac' ? '••:••:••:••:••:••' : '•••.•••.•••.•••';
      return '<span class="mh-pv">' + (shown ? '<span>' + esc(val) + '</span>' : '<span class="mask">' + mask + '</span>') +
        '<button class="mh-eye" data-reveal="' + esc(key) + '" title="' + (shown ? 'Hide' : 'Reveal') + '" aria-label="' + (shown ? 'Hide' : 'Reveal') + '">' +
        svg(shown ? 'eyeoff' : 'eye') + '</button></span>';
    },
    uplinkText: function(){
      var m = this.mh, st = m.status || {}, n = (st.network || []).filter(function(x){ return x.up && x.online && !/6$/.test(x.interface); })[0];
      var name = n ? n.interface : null, r = m.rep;
      if (name === 'wwan' || (r && r.state_s === 'connected' && !name)){
        var ssid = r && r.wpa_status && r.wpa_status.ssid, band = r && r.band ? String(r.band).replace('g', ' GHz') : '';
        return 'Repeater (Wi-Fi)' + (ssid && !m.priv ? ' · ' + ssid : '') + (band ? ' · ' + band : '');
      }
      if (name === 'tethering') return 'USB tethering';
      if (name && /^modem/.test(name)) return 'Cellular modem';
      if (name === 'secondwan') return 'Secondary WAN (Ethernet)';
      if (name === 'wan') return 'Ethernet WAN';
      return name;
    },
    /* ---- Wi-Fi uplink (repeater) card + network chooser. Uses GL's own repeater RPCs with the same parameters
       as GL's Internet page (scan {refresh}, connect {ssid, remember, …, key}, get_saved_ap_list). */
    /* ---- Travel routers (travel.lua): This Network card, Networks You've Used, sign-in page, home check, data.
       Everything shown here is read from the router; the only actions are: open the sign-in page, run the safety
       check again, run a speed test (asks first), settings (data limit, home router, touchscreen line), forget a card. */
    trvGrade: function(g){
      var c = { A: 'var(--mh-green)', B: 'var(--mh-green)', C: 'var(--mh-orange)', D: 'var(--mh-orange)', F: 'var(--mh-red)' }[g] || 'var(--mh-text3)';
      return '<span class="mh-grade" style="background:' + c + '">' + esc(g || '?') + '</span>';
    },
    trvNet: function(name){ return this.mh.priv ? 'Hidden network' : (name || 'Network'); },
    trvHtml: function(){
      var self = this, m = this.mh, T = m.trv || {}, up = T.up, S = T.safety, P = T.portal || {}, H = T.home, now = Math.floor(Date.now() / 1000);
      var cur = null; (T.nets || []).forEach(function(n){ if (up && n.key === up.key) cur = n; });
      if (!up) return '<div class="mh-empty">Not connected to a network right now. Pick one in the Wi-Fi Uplink card.</div>' + this.trvHome(H);
      var fresh = S && S.key === up.key, checks = fresh ? (S.checks || []) : [], bad = fresh ? (S.bad || 0) : 0;
      var verdict = P.state === 'portal' ? ['Sign-in needed', GRAD.orange, 'This network shows a sign-in page first']
        : P.state === 'offline' ? ['No internet', GRAD.red, 'Connected to the network, but nothing gets through']
        : !fresh ? ['Checking…', GRAD.blue, 'The safety check runs when you join a network']
        : bad === 0 ? ['Looks safe', GRAD.green, 'Every check passed'] : bad === 1 ? ['Mostly safe', GRAD.orange, '1 thing to know'] : ['Be careful', GRAD.red, bad + ' things to know'];
      var h = '<div class="mh-big"><div class="mh-ico" style="background:' + verdict[1] + '">' + svg('shield') + '</div><div><h3>' + verdict[0] + '</h3>' +
        '<p>' + esc(this.trvNet(up.name)) + (cur ? ' &nbsp;' + this.trvGrade(cur.grade) : '') + ' · ' + esc(verdict[2]) + (fresh && S.t ? ' · checked ' + ago(now - S.t) : '') + '</p></div></div>';
      if (P.state === 'portal') h += '<div class="mh-trvp"><b>🏨 Sign in to ' + esc(this.trvNet(up.name)) + '</b><small>Hotels and airports show a login or “accept terms” page first. Open it here, accept, and the router goes online by itself (this page notices within 20 seconds).</small>' +
        '<button class="mh-btn" data-act="trv-portal">Open sign-in page</button></div>';
      if (checks.length) h += '<div class="mh-leak">' + checks.map(function(c){
        return '<div' + (c.ok === false ? ' class="bad"' : '') + '><span class="i">' + (c.ok === true ? '✅' : c.ok === false ? '⚠️' : 'ℹ️') + '</span><span><b>' + esc(c.title) + '</b><small>' + esc(c.detail || '') + '</small></span></div>'; }).join('') + '</div>';
      /* data */
      var lim = (T.cfg && T.cfg.limit_gb) || 0, today = T.today || 0;
      h += '<div class="mh-sth"><span>Data on this network</span><span>' + (cur ? bytes(cur.bytes) + ' in total' : '') + '</span></div>' +
        '<div class="mh-trvd"><b>' + bytes(today) + '</b> today' + (lim ? ' of your ' + lim + ' GB daily limit' : '') + '</div>' +
        (lim ? '<div class="mh-meter"><i style="width:' + Math.min(100, today / (lim * 1e9) * 100).toFixed(1) + '%;background:' + (today >= lim * 1e9 ? 'var(--mh-red)' : today >= lim * 0.8e9 ? 'var(--mh-orange)' : 'var(--mh-blue)') + '"></i></div>' : '');
      h += this.trvHome(H);
      h += '<div class="mh-stb" style="margin-top:10px"><button class="mh-btn sec" data-act="trv-check">Check again</button><button class="mh-btn sec" data-act="trv-speed">Test this network</button><button class="mh-btn sec" data-act="trv-set">Settings</button></div>';
      return h;
    },
    trvHome: function(H){
      var m = this.mh, now = Math.floor(Date.now() / 1000);
      var h = '<div class="mh-sth"><span>Home</span><span>through Tailscale</span></div>';
      if (!H) return h + '<div class="mh-trvh">Checking…</div>';
      if (!H.running) return h + '<div class="mh-trvh"><span class="i">⚪</span><span><b>Tailscale is off</b><small>Turn it on to check on home (and reach it) from anywhere.</small></span></div>';
      if (!H.ip) return h + '<div class="mh-trvh"><span class="i">⚪</span><span><b>Pick your home router</b><small>Settings › Home router.</small></span></div>';
      var nm = m.priv ? 'Home router' : (H.name || H.ip);
      if (H.ok) return h + '<div class="mh-trvh"><span class="i">🏠</span><span><b>' + esc(nm) + ' is reachable · ' + Math.round(H.ms) + ' ms</b><small>' +
        (H.via === 'relay' ? 'Through a Tailscale relay (a direct path isn’t possible on this network; still works, a bit slower).' : 'Direct connection.') + ' Home internet and power are up.</small></span></div>';
      return h + '<div class="mh-trvh bad"><span class="i">⚠️</span><span><b>Can’t reach ' + esc(nm) + '</b><small>' + (H.bad_since ? 'Not answering since ' + hhmm(H.bad_since) + '. ' : '') +
        (H.last_ok ? 'Last reached ' + ago(now - H.last_ok) + '. ' : '') + 'Home internet or power may be down, or Tailscale there stopped.</small></span></div>';
    },
    netsHtml: function(){
      var self = this, m = this.mh, T = m.trv || {}, L = T.nets || [], cur = T.up && T.up.key;
      if (!L.length) return '<div class="mh-empty">Networks show up here once the router has used them. Each gets a grade from its ping, packet loss, drops and speed.</div>';
      m.trvKeys = L.map(function(n){ return n.key; });
      var day = function(t){ return t ? new Date(t * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''; };
      return '<div class="mh-nets">' + L.map(function(n, i){
        var bits = [n.signal != null ? n.signal + ' dBm' : null, n.ping != null ? n.ping + ' ms ping' : null, n.loss != null ? n.loss + '% loss' : null,
          n.speed && n.speed.down != null ? '↓ ' + Math.round(n.speed.down) + (n.speed.up != null ? ' / ↑ ' + Math.round(n.speed.up) : '') + ' Mbps' : 'no speed test yet',
          (n.drops || 0) + ' drop' + (n.drops === 1 ? '' : 's'), bytes(n.bytes || 0)].filter(Boolean).join(' · ');
        return '<div class="r"><div class="g">' + self.trvGrade(n.grade) + '</div><div class="t"><b>' + esc(self.trvNet(n.name)) + (n.key === cur ? ' <span class="mh-new" style="background:var(--mh-green)">CONNECTED</span>' : '') + '</b>' +
          '<small>' + esc(bits) + '</small><small>' + (n.uses && n.uses.length ? 'Good for ' + esc(n.uses.join(', ')) + ' · ' : '') + esc(n.sec || '') + (n.last ? ' · last used ' + esc(day(n.last)) : '') + '</small></div>' +
          '<button class="mh-wxd" data-act="trv-forget" data-arg="' + i + '" title="Remove this report card">Forget</button></div>';
      }).join('') + '</div><div class="mh-stn">Grades: A–B good, C–D usable, F poor. Ping and loss are measured all the time while connected; speed comes from the newest Internet speed test run on that network (“Test this network”). Kept for the 40 most recent networks.</div>';
    },
    trvAct: function(k, arg){
      var self = this, m = this.mh, T = m.trv || {};
      if (k === 'portal'){
        var u = (T.portal && T.portal.url) || 'http://neverssl.com/';
        if (!/^https?:\/\//i.test(u)) u = 'http://neverssl.com/';
        window.open(u, '_blank', 'noopener');
        this.toast('Sign in on the page that opened. This page notices within 20 seconds.');
        return;
      }
      if (k === 'check'){ rpcx('machome', 'travel_check', {}).then(function(){ self.toast('Checking this network… (about 15 seconds)'); m.trvT = 0; setTimeout(function(){ m.trvT = 0; self.fast(); }, 16000); }); return; }
      if (k === 'speed') return this.startSpeed('wan');
      if (k === 'set') return this.trvSettings();
      if (k === 'forget'){
        var key = (m.trvKeys || [])[Number(arg)]; if (!key) return;
        var n = (T.nets || []).filter(function(x){ return x.key === key; })[0] || {};
        this.confirm({ title: 'Forget this report card?', icon: 'wifi', grad: GRAD.orange, ok: 'Forget', working: 'Removing…',
          body: '<p>Removes the grade, history and data total for <b>' + esc(this.trvNet(n.name)) + '</b>. The saved Wi-Fi network itself stays (manage those in GL’s Internet page).</p>' },
          function(){ return rpcx('machome', 'travel_forget', { key: key }).then(function(r){ if (!r || !r.ok) throw new Error('could not remove it'); m.trvT = 0; setTimeout(function(){ self.fast(); }, 11000); return 'Removed'; }); });
      }
    },
    trvSettings: function(){
      var self = this, m = this.mh, T = m.trv || {}, c = T.cfg || {}, H = T.home || {};
      var opts = '<option value="">Automatic' + (H.auto && H.name ? ' (' + esc(m.priv ? 'hidden' : H.name) + ')' : '') + '</option>' + (H.peers || []).map(function(p){
        return '<option value="' + esc(p.ip) + '"' + (c.home_ip === p.ip ? ' selected' : '') + '>' + esc(m.priv ? 'Device' : p.name) + (p.online ? '' : ' (offline)') + '</option>'; }).join('');
      var html = '<div class="hic" style="background:' + GRAD.teal + '">' + svg('wifi') + '</div><h2>Travel settings</h2>' +
        '<label class="mh-mrow"><span><b>Daily data limit per network</b><small>Warns at 80% and 100% of this per network per day (paid hotel Wi-Fi, phone hotspot). 0 = off.</small></span><span><input type="number" id="mh-tlim" min="0" max="1000" step="0.5" value="' + (c.limit_gb || 0) + '" style="width:76px"> GB</span></label>' +
        '<label class="mh-mrow"><span><b>Home router</b><small>The Tailscale device the “Home” check pings every 5 minutes.</small></span><select id="mh-thome">' + opts + '</select></label>' +
        '<div class="err" data-e></div><div class="btns"><button data-m="cancel">Close</button><button class="pri" data-m="save">Save</button></div>';
      this.openModal(html, { save: function(md, b){
        b.disabled = true;
        var p = { limit_gb: Number(md.querySelector('#mh-tlim').value) || 0, home_ip: md.querySelector('#mh-thome').value };
        rpcx('machome', 'travel_set', p).then(function(r){ if (!r || !r.ok) throw new Error((r && r.err) || 'could not save'); self.closeModal(); self.toast('Travel settings saved'); m.trvT = 0; self.fast(); })
          .catch(function(e){ b.disabled = false; md.querySelector('[data-e]').textContent = e.message; });
      } });
    },
    uplOn: function(){
      var m = this.mh, r = m.rep, hf = (m.info && m.info.hardware_feature) || {};
      if (!r || !(hf.wifi_type || hf.radio) || this.isAP()) return false;
      if (r.running || r.state_s === 'connected' || r.state_s === 'connecting') return true;
      var md = String(((m.info || {}).board_info || {}).model || '');
      return /slate|beryl|mango|opal|be3600|be10000|mt3000|mt300|mt1300|axt1800|ar300|e750|puli|xe300/i.test(md);
    },
    uplSec: function(km){
      km = String(km || '').toUpperCase();
      if (/8021X|EAP/.test(km)) return 'Enterprise';
      if (/SAE/.test(km)) return 'WPA3'; if (/PSK/.test(km)) return 'WPA2'; if (km === 'NONE') return 'Open';
      return km || null;
    },
    uplBars: function(sig){
      var q = sig == null ? null : sig >= -55 ? ['Excellent', 'var(--mh-green)', 4] : sig >= -67 ? ['Good', 'var(--mh-green)', 3] : sig >= -75 ? ['Fair', 'var(--mh-orange)', 2] : ['Weak', 'var(--mh-red)', 1];
      return { q: q, html: '<span class="mh-sbars">' + [1, 2, 3, 4].map(function(i){ return '<i style="height:' + (i * 25) + '%;background:' + (q && i <= q[2] ? q[1] : 'var(--mh-track)') + '"></i>'; }).join('') + '</span>' };
    },
    uplHtml: function(){
      var m = this.mh, r = m.rep || {}, w = r.wpa_status || {}, v4 = r.ipv4 || {}, u = m.upl || {}, priv = m.priv, cfg = r.config || {};
      var st = r.state_s || (r.running ? 'connecting' : 'off'), con = st === 'connected';
      var ssid = w.ssid || r.ssid || '';
      var f = Number(w.freq) || 0, ch = f > 5940 ? (f - 5950) / 5 : f > 4900 ? (f - 5000) / 5 : f === 2484 ? 14 : f ? (f - 2407) / 5 : null;
      var band = r.band ? String(r.band).replace(/g$/i, ' GHz').replace(/^2 /, '2.4 ') : '';
      var gen = r.wifi_generation || w.wifi_generation;
      var b = this.uplBars(con ? u.signal : null);
      var spd = u.rate ? (u.rate >= 1000 ? (u.rate / 1000).toFixed(1) + ' Gbps' : Math.round(u.rate) + ' Mbps') : '';
      var link = [spd, u.tx && u.tx.nss ? u.tx.nss + '×' + u.tx.nss : '', u.tx && u.tx.bw ? u.tx.bw + ' MHz' : '', u.tx && u.tx.mcs != null ? 'MCS ' + u.tx.mcs : ''].filter(Boolean).join(' · ') || null;
      var head = '<div class="mh-big"><div class="mh-ico" style="background:' + GRAD.teal + '">' + svg('wifi') + '</div><div><h3>' +
        (con ? (priv ? 'Connected' : esc(ssid)) : st === 'connecting' ? 'Connecting…' : 'Not connected') + '</h3>' +
        '<p><span class="mh-pill ' + (con ? 'ok' : st === 'connecting' ? 'warn' : 'bad') + '">' + (con ? 'Online' : st === 'connecting' ? 'Connecting' : 'Offline') + '</span> &nbsp;' +
        esc([band, gen ? 'Wi-Fi ' + gen : '', ch ? 'channel ' + ch : ''].filter(Boolean).join(' · ')) + '</p></div></div>';
      var sig = con ? '<div class="mh-sig">' + b.html + '<b>' + (u.signal != null ? u.signal + ' dBm' : '—') + '</b><span class="q">' + (b.q ? b.q[0] : 'Signal') + (u.chains ? ' · ' + u.chains + ' antennas' : '') + '</span></div>' : '';
      var macMode = cfg.macaddr && cfg.macaddr.mode ? ({ random: 'Random (private)', default: 'Router’s own', clone: 'Cloned' })[cfg.macaddr.mode] || cfg.macaddr.mode : null;
      var rows = con ? kv('Network', priv ? 'Hidden' : ssid) + kv('Security', this.uplSec(w.key_mgmt)) + kv('Link', link) +
          kv('Retries', u.tx_per != null ? u.tx_per + '%' : null) +
          kv('IP address', this.pv('uplip', v4.ip ? String(v4.ip).replace(/\/\d+$/, '') : null, 'ip'), true) + kv('Gateway', this.pv('uplgw', v4.gateway, 'ip'), true) +
          kv('DNS', priv ? 'Hidden' : (v4.dns || []).join(', ')) + kv('Slate MAC', this.pv('uplmac', w.address, 'mac'), true) + kv('MAC type', macMode) +
          kv('Access point', this.pv('uplbss', w.bssid || r.bssid, 'mac'), true) + kv('Connected for', r.connected ? String(r.connected).replace(/,/g, ' ') : null)
        : kv('Status', r.fail_type ? 'Couldn’t connect (' + r.fail_type + ')' : st === 'connecting' ? 'Joining…' : 'Not linked to a Wi-Fi network');
      return head + sig + '<div class="mh-kv">' + rows + '</div><button class="mh-btn" data-act="upl-pick">Choose network</button>';
    },
    openUplink: function(){
      var self = this, m = this.mh;
      m.uw = { saved: null, scan: null, scanning: false, sel: null, err: '' };
      var md = this.openModal('<div data-w></div>', {
        scan: function(){ if (!m.uplBusy) self.uplScan(md); },
        pick: function(md2, b){ if (m.uplBusy) return; var k = b.getAttribute('data-i'); m.uw.sel = k; m.uw.err = ''; self.uplRender(md); var p = md.querySelector('#mh-wpw') || md.querySelector('#mh-wss'); if (p) p.focus(); },
        other: function(){ if (m.uplBusy) return; m.uw.sel = 'o'; m.uw.err = ''; self.uplRender(md); var p = md.querySelector('#mh-wss'); if (p) p.focus(); },
        gl: function(){ self.closeModal(); self.go('internet'); },
        join: function(md2, b){ self.uplJoin(md, b); }
      });
      this.uplRender(md);
      rpc('repeater', 'get_saved_ap_list').then(function(r){ if (m.uw){ m.uw.saved = (r && r.res) || []; self.uplRender(md); } });
      this.uplScan(md);
    },
    uplScan: function(md){
      var self = this, m = this.mh; if (!m.uw || m.uw.scanning) return;
      m.uw.scanning = true; this.uplRender(md);
      rpcx('repeater', 'scan', { refresh: !!m.uw.scan }, 300000).catch(function(){ return null; }).then(function(r){
        if (!m.uw) return; m.uw.scanning = false;
        var g = {}; ((r && r.res) || []).forEach(function(e){
          if (!e || !e.ssid) return; var x = g[e.ssid];
          if (!x){ x = g[e.ssid] = { ssid: e.ssid, best: e, bands: {}, saved: false }; }
          if (Number(e.signal) > Number(x.best.signal)) x.best = e;
          if (e.band) x.bands[e.band] = 1; if (e.saved) x.saved = true;
        });
        m.uw.scan = Object.keys(g).map(function(k){ return g[k]; }).sort(function(a, b){ return b.best.signal - a.best.signal; }).slice(0, 40);
        if (!m.uplBusy) self.uplRender(md);      /* never redraw under a running connect */
      });
    },
    uplEnc: function(e){
      var en = e && e.encryption || {}, d = String(en.description || '');
      if (d.indexOf('802.1X') > -1) return 'ent';
      return en.enabled ? (/SAE/.test(d) ? (/PSK/.test(d) ? 'WPA2/WPA3' : 'WPA3') : 'WPA2') : 'open';
    },
    uplRender: function(md){
      var self = this, m = this.mh, W = m.uw; if (!W || !md || !md.parentNode) return;
      var box = md.querySelector('[data-w]'); if (!box) return;
      /* keep what was typed across redraws (scan results arriving, errors) */
      var keep = {}; ['mh-wss', 'mh-wpw'].forEach(function(id){ var el = md.querySelector('#' + id); if (el) keep[id] = el.value; });
      var focused = document.activeElement && document.activeElement.id;
      if (W.lastSel !== W.sel){ keep = {}; W.lastSel = W.sel; }
      var r = m.rep || {}, cur = r.state_s === 'connected' ? ((r.wpa_status || {}).ssid || r.ssid) : null;
      var savedBy = {}; (W.saved || []).forEach(function(s, i){ savedBy[s.ssid] = i; });
      var bandTxt = function(o){ return Object.keys(o).sort().map(function(b){ return b.replace(/g$/i, '').replace(/^2$/, '2.4'); }).join('/') + ' GHz'; };
      /* join form for the selected network */
      var form = '';
      if (W.sel){
        var t = W.sel.charAt(0), i = Number(W.sel.slice(2)), sv = null, sc = null;
        if (t === 's') sv = (W.saved || [])[i];
        if (t === 'n'){ sc = (W.scan || [])[i]; if (sc && savedBy[sc.ssid] != null) sv = W.saved[savedBy[sc.ssid]]; }
        var nm = t === 'o' ? null : (sv || sc || {}).ssid;
        if (t === 'o') form = '<p><b>Join a hidden network</b></p><label for="mh-wss">Network name (SSID)</label><input id="mh-wss" maxlength="32" autocomplete="off">' +
          '<label for="mh-wpw">Password (leave empty if open)</label><input id="mh-wpw" type="password" maxlength="63" autocomplete="new-password">';
        else if (sv) form = '<p><b>' + esc(nm) + '</b> · saved, no password needed</p>';
        else if (sc && this.uplEnc(sc.best) === 'ent') form = '<p><b>' + esc(nm) + '</b> uses a business (802.1X) login. Join it from GL’s Internet page.</p><div class="btns"><button data-m="gl">Open Internet page</button></div>';
        else if (sc && this.uplEnc(sc.best) === 'open') form = '<p><b>' + esc(nm) + '</b> · open network (no password). Traffic on it isn’t encrypted.</p>';
        else if (sc) form = '<p><b>' + esc(nm) + '</b> · ' + this.uplEnc(sc.best) + '</p><label for="mh-wpw">Password</label><input id="mh-wpw" type="password" maxlength="63" autocomplete="new-password">';
        if (form && !(sc && this.uplEnc(sc.best) === 'ent')) form += '<div class="btns"><button class="pri" data-m="join">' + (nm && nm === cur ? 'Reconnect' : 'Connect') + '</button></div>';
        form = '<div class="mh-wjoin">' + form + '</div>';
      }
      /* report-card grade (travel.lua) next to networks the router has used before */
      var gmap = {}; ((m.trv && m.trv.nets) || []).forEach(function(n){ if (/^wifi:/.test(n.key)) gmap[n.key.slice(5)] = n; });
      var gof = function(ss){ var n = gmap[ss]; return n ? ' <span title="Report card: ' + esc((n.uses || []).length ? 'good for ' + n.uses.join(', ') : 'see Networks You’ve Used') + '">' + self.trvGrade(n.grade) + '</span>' : ''; };
      var savedRows = W.saved == null ? '<div class="mh-empty">Loading…</div>' : !W.saved.length ? '<div class="mh-empty">No saved networks yet</div>' :
        W.saved.map(function(s, i){ return '<div data-m="pick" data-i="s:' + i + '"' + (W.sel === 's:' + i ? ' class="sel"' : '') + '><b>' + esc(s.ssid) + gof(s.ssid) + '</b>' + (s.ssid === cur ? '<small class="cur">Connected</small>' : '<small>Saved</small>') + '</div>'; }).join('');
      var scanRows = W.scanning && !W.scan ? '<div class="mh-empty">Scanning… (about 20 seconds)</div>' : !W.scan ? '' : !W.scan.length ? '<div class="mh-empty">No networks found</div>' :
        W.scan.map(function(g, i){ var e = g.best, enc = self.uplEnc(e);
          return '<div data-m="pick" data-i="n:' + i + '"' + (W.sel === 'n:' + i ? ' class="sel"' : '') + '>' + self.uplBars(Number(e.signal)).html + '<b>' + esc(g.ssid) + gof(g.ssid) + '</b><small>' +
            (g.ssid === cur ? '<span class="cur">Connected</span> · ' : savedBy[g.ssid] != null ? 'Saved · ' : '') + bandTxt(g.bands) + ' · ' + (enc === 'open' ? 'Open' : enc === 'ent' ? 'Enterprise' : '🔒 ' + enc) + ' · ' + e.signal + ' dBm</small></div>'; }).join('');
      var remote = /^100\./.test(location.hostname) ? '<p style="color:var(--mh-orange)">You’re connected through Tailscale. If the Slate switches networks, this page may drop for a minute until it reconnects.</p>' : '';
      box.innerHTML = '<div class="hic" style="background:' + GRAD.teal + '">' + svg('wifi') + '</div><h2>Choose Wi-Fi network</h2>' +
        '<p>Pick the network this router uses for internet. While it switches (up to a minute), its own Wi-Fi stays up but internet pauses.</p>' + remote + form +
        '<div class="err" data-e>' + esc(W.err || '') + '</div>' +
        '<div class="mh-wsec">Saved networks</div><div class="mh-wl">' + savedRows + '</div>' +
        '<div class="mh-wsec">Nearby' + (W.scanning ? ' · scanning…' : '') + '<button data-m="scan"' + (W.scanning ? ' disabled' : '') + '>' + (W.scan ? 'Rescan' : 'Scan') + '</button></div><div class="mh-wl">' + scanRows + '</div>' +
        '<div class="mh-wsec">Other<button data-m="other">Join a hidden network…</button></div>' +
        '<div class="btns"><button data-m="cancel">Close</button></div>';
      Object.keys(keep).forEach(function(id){ var el = md.querySelector('#' + id); if (el) el.value = keep[id]; });
      if (focused && keep[focused] != null){ var fe = md.querySelector('#' + focused); if (fe) fe.focus(); }
    },
    uplJoin: function(md, btn){
      var self = this, m = this.mh, W = m.uw; if (!W || !W.sel) return;
      var t = W.sel.charAt(0), i = Number(W.sel.slice(2)), p = null, ssid = '';
      var rmac = function(){ var b = []; for (var k = 0; k < 6; k++) b.push(Math.floor(Math.random() * 256)); b[0] = (b[0] & 0xfc) | 0x02;
        return b.map(function(x){ return (x < 16 ? '0' : '') + x.toString(16).toUpperCase(); }).join(':'); };
      var pwEl = md.querySelector('#mh-wpw'), pw = pwEl ? pwEl.value : '';
      var savedBy = {}; (W.saved || []).forEach(function(s, k){ savedBy[s.ssid] = k; });
      var fail = function(msg){ W.err = msg; self.uplRender(md); };
      if (t === 's' || (t === 'n' && W.scan[i] && savedBy[W.scan[i].ssid] != null)){
        var sv = W.saved[t === 's' ? i : savedBy[W.scan[i].ssid]];
        p = {}; Object.keys(sv).forEach(function(k){ p[k] = sv[k]; }); p.remember = true; ssid = sv.ssid;      /* same as GL: the saved entry as-is */
      } else if (t === 'n'){
        var g = W.scan[i], e = g.best, enc = this.uplEnc(e); ssid = g.ssid;
        if (enc !== 'open' && (pw.length < 8 || pw.length > 63)) return fail('The password must be 8 to 63 characters.');
        p = { ssid: ssid, remember: true, bssid: '', band: e.band, channel: e.channel, device: e.device, dfs: !!e.dfs, saved: false, signal: e.signal,
              macaddr: { macaddr: rmac(), mode: 'random', update: 'none' } };
        if (enc !== 'open') p.key = pw;
      } else if (t === 'o'){
        ssid = (md.querySelector('#mh-wss') || {}).value || '';
        if (!ssid || ssid.length > 32) return fail('Enter the network name (up to 32 characters).');
        if (pw && (pw.length < 8 || pw.length > 63)) return fail('The password must be 8 to 63 characters (or empty for an open network).');
        p = { ssid: ssid, remember: true, macaddr: { macaddr: rmac(), mode: 'random', update: 'none' } }; if (pw) p.key = pw;
      }
      if (!p) return;
      m.busy = true; m.uplBusy = true; btn.disabled = true; btn.textContent = 'Connecting…';
      var t0 = Date.now(), done = function(ok, msg){ m.uplBusy = false; m.busy = false;
        if (ok){ self.closeModal(); self.toast(msg); m.uplT = 0; self.fast(); } else { btn.disabled = false; btn.textContent = 'Connect'; fail(msg); } };
      rpcx('repeater', 'connect', p, 30000).then(function(){
        var poll = function(){
          if (!m.alive) return;
          rpc('repeater', 'get_status').then(function(r){
            if (r){ m.rep = r; }
            var ok = r && r.state_s === 'connected' && ((r.wpa_status || {}).ssid || r.ssid) === ssid;
            if (ok) return done(true, 'Connected to ' + (m.priv ? 'the network' : ssid));
            if (Date.now() - t0 > 60000) return done(false, 'Didn’t connect' + (r && r.fail_type ? ' (' + r.fail_type + ')' : '') + '. Check the password and try again, or use GL’s Internet page.');
            btn.textContent = 'Connecting… ' + Math.round((Date.now() - t0) / 1000) + ' s'; setTimeout(poll, 3000);
          });
        };
        setTimeout(poll, 4000);
      }).catch(function(e){ done(false, 'The router refused: ' + ((e && e.message) || 'error') + '.'); });
    },
    wifiHtml: function(){
      var m = this.mh, W = m.wifi, priv = m.priv;
      if (!W || !W.res) return '<div class="mh-empty">Loading Wi-Fi…</div>';
      var cnt = {}; (this.clientsArr() || []).forEach(function(c){ if (c.online && c.iface && c.iface !== 'cable') cnt[c.iface] = (cnt[c.iface] || 0) + 1; });
      var col = function(b){
        var main = (b.ifaces || []).filter(function(i){ return !i.guest; })[0] || {}, guest = (b.ifaces || []).filter(function(i){ return i.guest; })[0];
        var on = !!main.enabled, label = (String(b.band || '') === '2G' ? '2.4' : String(b.band || '').replace('G', '')) + ' GHz';
        var key = String(b.band || '').replace('2G', '2.4G');
        var n = cnt[key] || cnt[b.band] || 0;
        return '<div class="mh-r" style="flex-direction:column;align-items:stretch;gap:4px"><div style="display:flex;justify-content:space-between;align-items:center">' +
          '<b style="font-size:15px">' + label + '</b><span class="mh-pill ' + (on ? 'ok' : 'off') + '">' + (on ? 'On' : 'Off') + '</span></div>' +
          '<small>' + esc(priv ? 'SSID hidden' : (main.ssid || '—')) + ' · ' + esc(String(main.encryption || '').toUpperCase()) + '</small>' +
          '<small>Channel ' + (b.channel ? b.channel : 'auto') + ' · ' + esc(b.htmode === 'auto' ? 'auto width' : (b.htmode || '')) + ' · power ' + esc(b.txpower || '—') + '</small>' +
          '<div style="display:flex;justify-content:space-between;margin-top:4px"><span><b style="font-size:18px">' + n + '</b> <small style="display:inline">clients</small></span>' +
          (guest ? '<small style="display:inline">Guest ' + (guest.enabled ? 'on' : 'off') + '</small>' : '') + '</div></div>';
      };
      var mld = cnt.mld || cnt.MLD || 0;
      return '<div class="mh-hgrid" style="grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))">' + W.res.map(col).join('') + '</div>' +
        '<div class="mh-stn">' + (mld ? '<b style="color:var(--mh-text2)">' + mld + ' device' + (mld > 1 ? 's' : '') + ' using Wi-Fi 7 MLO</b> (multiple bands at once). ' : '') +
        (m.rep && m.rep.running ? 'This router is also repeating an upstream Wi-Fi network as its internet uplink.' : '') + '</div>';
    },
    fanText: function(){
      var s = this.mh.stats, info = this.mh.info, fc = this.mh.fanCfg;
      if (s && s.fan && s.fan.mode === 'manual') return '<a href="#" data-act="fan" style="color:var(--mh-purple)">Manual ' + s.fan.pct + '%' + (s.fan.failsafe ? ' · failsafe' : '') + '</a>';
      if (s && s.fan_rpm && s.fan_rpm.length){
        var rpm = Math.max.apply(null, s.fan_rpm);
        if (rpm > 0) return Math.round(rpm).toLocaleString() + ' RPM';
        if (info && info.hardware_feature && info.hardware_feature.fan) return 'Off' + (fc && fc.temperature ? ' · starts at ' + tdisp(fc.temperature) : '');
      }
      if (info && info.hardware_feature && info.hardware_feature.fan === false) return 'None (passive cooling)';
      return s ? 'Not detected' : null;
    },
    /* hover text for the zram gauge (owner, 2026-11-22; data = sampler live.zram) */
    zramTip: function(z){
      var ratio = z.compr > 0 ? (z.orig / z.compr) : 0;
      return 'Zram: memory the router compresses instead of running out of RAM. ' + bytes(z.used) + ' of ' + bytes(z.size) + ' swapped out' +
        (ratio ? ', compressed ' + ratio.toFixed(1) + '× into ' + bytes(z.mem) + ' of RAM' : '') + '. Peak since restart: ' + bytes(z.peak) + ' of RAM' +
        (z.algo ? ' (' + z.algo + ')' : '') + '. Orange from 60% full, red from 85%.';
    },
    throttleText: function(){
      var s = this.mh.stats; if (!s || !s.cooling) return null;
      var c = s.cooling.filter(function(x){ return /cpufreq/.test(x.type); })[0] || s.cooling[0];
      if (!c) return null;
      return c.cur > 0 ? 'Active (level ' + c.cur + ' of ' + c.max + ')' : 'Off';
    },
    clientDns: function(){
      var s = this.mh.stats, l = s && s.lan_dns;
      if (l && l.length) return l.join(', ');
      var lan = this.mh.status && this.mh.status.system && this.mh.status.system.lan_ip;
      return lan || null;
    },
    dnsText: function(){
      var d = this.mh.dns, cb = this.mh.cable;
      var wan = (cb && cb.ipv4 && cb.ipv4.dns) || [];
      if (!d) return wan.length ? wan.join(', ') : null;
      var mode = d.mode || 'auto';
      if (mode === 'manual' && d.manual_list && d.manual_list.length) return d.manual_list.join(', ');
      if (mode === 'auto' || mode === 'automatic') return wan.length ? wan.join(', ') : 'Automatic (from ISP)';
      if (d.provider === 'nextdns' || mode === 'nextdns') return 'NextDNS' + (d.nextdns_id ? ' (' + d.nextdns_id + ')' : '');
      if (d.provider === 'controld' || mode === 'controld') return 'Control D';
      if (d.servers_list && d.servers_list.length) return d.servers_list.map(function(x){ return x.server || x.address || x; }).join(', ');
      if (d.secure_manual_list && d.secure_manual_list.length) return d.secure_manual_list.join(', ');
      return wan.length ? wan.join(', ') : mode;
    },
    wanOnline: function(){
      var c = this.mh.cable, st = this.mh.status;
      if (c && c.status === 1) return true;
      var n = st && st.network;
      return !!(n && n.some(function(x){ return x.up && x.online && !/6$/.test(x.interface); }));
    },
    clientTotals: function(){
      var cl = this.mh.status && this.mh.status.client && this.mh.status.client[0];
      var wired = cl ? (cl.cable_total || 0) : 0, wireless = cl ? (cl.wireless_total || 0) : 0;
      return { wired: wired, wireless: wireless, total: wired + wireless };
    }
  }
};

/* start a new row in a .mh-kv grid (keeps side-by-side pairs together) */
function kvRow(h){ return h ? h.replace('<div>', '<div style="grid-column-start:1">') : ''; }
function kv(k, v, raw){
  if (v == null || v === '') return '';
  return '<div><span>' + esc(k) + '</span><b>' + (raw ? v : esc(v)) + '</b></div>';
}
})();
