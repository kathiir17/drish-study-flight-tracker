# Behaviour tests in WebKit with a fake database (live data never touched).
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
FAKE_DB = """
const flights = [
  {id:'new1', seq:3, from:'london', to:'paris', km:343, dur:'42m 01s', realDur:null, date:'14/11/2026', flightMin:42, realMin:42,
   startedAt:'2026-11-14T09:00:00Z', endedAt:'2026-11-14T09:42:00Z', module:'cardiology'},
  {id:'evil', seq:2, from:'<img src=x onerror="window.__xss=1">', to:'<b>bold</b>', km:1, dur:'1m', realDur:null, date:'01/01/2026'},
  {id:'a1', seq:1, from:'jaffna', to:'singapore', km:2580, dur:'2h 52m', realDur:null, date:'02/11/2026', flightMin:172, realMin:172},
];
window.__saved = []; window.__deleted = [];
window.DB = {
  loadFlights: async () => [...flights, ...(window.__extra || [])],
  addFlight: async f => { window.__saved.push(f); return f.id; },
  deleteFlight: async id => { window.__deleted.push(id); const i = flights.findIndex(f=>f.id===id); if (i>=0) flights.splice(i,1); },
  loadModules: async () => [...(window.__modules || ['anatomy revision'])],
  addModule: async n => { (window.__added = window.__added || []).push(n); return n; },
};
window.dispatchEvent(new Event('db-ready'));
"""
fails = 0
def ok(cond, msg):
    global fails
    print(("  PASS " if cond else "  FAIL ") + msg)
    if not cond: fails += 1

def new_page(browser, **opts):
    ctx = browser.new_context(**opts)
    ctx.route("**/db.js", lambda r: r.fulfill(status=200, content_type="text/javascript", body=FAKE_DB))
    page = ctx.new_page()
    errs = []
    page.on("console", lambda m: m.type == "error" and errs.append(m.text))
    page.on("pageerror", lambda e: errs.append(str(e)))
    return ctx, page, errs

def fly_click(page):
    """press fly; if the no-module warning appears, answer yes (fly uncategorised)"""
    page.click("#btn-fly")
    if page.is_visible("#confirm"):
        page.click("#confirm-yes")

def city_xy(page, name):
    return page.evaluate(f"(() => {{ const p = projectLL(findCity('{name}').lat, findCity('{name}').lng); return [p.sx, p.sy, p.vis]; }})()")

with sync_playwright() as p:
    b = p.webkit.launch()

    print("mac: choosing a route")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.goto(BASE); page.wait_for_timeout(1500)
    page.evaluate("localStorage.clear()")
    x, y, vis = city_xy(page, "new york"); ok(vis, "new york faces the viewer at start")
    page.mouse.click(x, y)
    ok(page.evaluate("sel.from && sel.from.n") == "new york", "clicking a city on the globe sets from")
    ok(page.input_value("#inp-from") == "new york", "from field fills in")
    x, y, _ = city_xy(page, "mexico city"); page.mouse.click(x, y)
    ok(page.evaluate("sel.to && sel.to.n") == "mexico city", "second click sets to")
    ok("km" in page.inner_text("#route-preview") and "of study" in page.inner_text("#route-preview"), "preview shows distance and time: " + page.inner_text("#route-preview"))
    page.wait_for_timeout(2500)   # picking a full route glides the globe to frame it
    x, y, _ = city_xy(page, "mexico city")
    page.mouse.move(x + 1, y); page.wait_for_timeout(200)
    ok(page.evaluate("hoverCity && hoverCity.n") == "mexico city", "hover detects the city under the mouse")
    page.click("#btn-swap")
    ok(page.input_value("#inp-from") == "mexico city" and page.input_value("#inp-to") == "new york", "swap button swaps")

    page.fill("#inp-to", "atlantis"); fly_click(page)
    ok("atlantis" in page.inner_text("#plan-msg"), "unknown city gives a clear message: " + page.inner_text("#plan-msg"))
    page.fill("#inp-to", "mexico city"); fly_click(page)
    ok("different" in page.inner_text("#plan-msg"), "same city twice is caught")
    page.fill("#inp-to", "lond"); page.keyboard.press("ArrowDown"); page.keyboard.press("Enter")
    ok(page.input_value("#inp-to") == "london", "keyboard autocomplete: arrow + enter picks london")

    print("mac: custom pomodoro")
    page.check("#chk-pomo", force=True)
    page.fill("#pomo-focus", "0"); fly_click(page)
    ok("1 to 180" in page.inner_text("#plan-msg"), "invalid focus length rejected")
    page.fill("#pomo-focus", "25"); page.fill("#pomo-break", "5"); fly_click(page)
    ok(page.evaluate("uiState()") == "flying", "flight takes off")
    ok(page.evaluate("pomo.focus") == 25 * 60000 and page.evaluate("pomo.brk") == 5 * 60000, "flight uses 25 / 5")
    ok(page.evaluate("JSON.parse(localStorage.getItem('pomoPrefs')).focus") == 25, "25 remembered for next time")
    ok(page.is_disabled("#chk-pomo"), "pomodoro toggle locked in flight")
    page.evaluate("pomo.start = Date.now() - 26*60000; tick()")
    ok(page.evaluate("pomo.onBreak"), "26 min in: on break (custom length)")
    page.wait_for_timeout(400)
    ok(page.inner_text("#pomo-phase") == "break" and "break" in page.get_attribute("#pomo-ring", "class"), "ring shows break")
    page.evaluate("pomo.start = Date.now() - 31*60000; tick()")
    ok(not page.evaluate("pomo.onBreak"), "31 min in: back to focus")

    print("mac: refresh keeps the flight and its lengths")
    page.evaluate("pomo.start = Date.now() - 26*60000; persistFlight()")
    page.reload(); page.wait_for_timeout(1200)
    ok(page.evaluate("uiState()") == "flying", "still flying after refresh")
    ok(page.evaluate("pomo && pomo.focus") == 25 * 60000 and page.evaluate("pomo.onBreak"), "pomodoro restored, 25/5, on break")
    ok(not page.is_hidden("#card-flight") and page.is_hidden("#card-plan"), "flight card shown")

    print("mac: stop needs two clicks")
    page.click("#btn-stop")
    ok(page.evaluate("uiState()") == "flying" and "won" in page.inner_text("#btn-stop"), "first click only asks")
    page.click("#btn-stop")
    ok(page.evaluate("uiState()") == "plan", "second click stops")
    ok(page.evaluate("localStorage.getItem('activeFlight')") is None and page.evaluate("window.__saved.length") == 0, "stopped flight not saved")

    print("mac: landing")
    page.uncheck("#chk-pomo", force=True)
    page.fill("#inp-from", "paris"); page.fill("#inp-to", "rome"); fly_click(page)
    page.evaluate("flight.virtMs = flight.totalMs + 1; tick()"); page.wait_for_timeout(300)
    ok(page.evaluate("uiState()") == "landed" and page.inner_text("#ld-title") == "landed in rome", "landed card")
    ok(page.evaluate("window.__saved.length") == 1 and page.evaluate("window.__saved[0].flightMin") > 0, "saved once with flightMin")
    page.click("#btn-onward")
    ok(page.input_value("#inp-from") == "rome" and page.input_value("#inp-to") == "", "fly onward: from = rome")

    print("mac: passes")
    page.click(".tab[data-view=passes]"); page.wait_for_timeout(500)
    ok(page.evaluate("window.__xss") is None, "malicious history entry did not run")
    ok('<img src=x' in page.inner_text("#hist-list"), "it shows as plain text")
    page.click(".hist-del >> nth=0")
    ok(page.evaluate("window.__deleted.length") == 0, "first ✕ only asks")
    page.click(".hist-del >> nth=0"); page.wait_for_timeout(300)
    ok(page.evaluate("window.__deleted") == ["new1"], "second ✕ deletes that one flight (the newest, listed first)")
    ok(page.evaluate("CX") > 372 + 16, "globe stays visible beside the sidebar on the passes tab")
    page.click(".tab[data-view=fly]")
    ok(not page.is_hidden("#card-plan"), "back to fly")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("camera maths")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.goto(BASE); page.wait_for_timeout(1500)
    worst = page.evaluate("""(() => {
      let worst = 0, n = 0;
      for (let i = 0; i < 400; i++) {
        rotX = (Math.random() * 2 - 1) * 1.2; rotY = Math.random() * 20 - 10; setZoom(1 + Math.random() * 3);
        const lat = Math.random() * 140 - 70, lng = Math.random() * 360 - 180, P = ll2xyz(lat, lng);
        const r = Math.random() * 0.8 / zoom, ang = Math.random() * 6.283;
        const qx = r * Math.cos(ang), qy = r * Math.sin(ang);
        if (Math.abs(qx) > Math.hypot(P[0], P[2]) * 0.98) continue;   // unreachable without rolling the globe
        const sol = solveRotation(P, qx, qy);
        if (Math.abs(sol.rotX) >= 1.399) continue;        // pole limit reached: allowed to be off
        rotX = sol.rotX; rotY = sol.rotY;
        const p = project(...P);
        worst = Math.max(worst, Math.hypot(p.sx - (CX + qx * R), p.sy - (CY - qy * R)), p.vis ? 0 : 999); n++;
      }
      return [worst, n];
    })()""")
    ok(worst[0] < 0.01 and worst[1] > 150, f"solveRotation lands the point exactly ({worst[1]} random cases, worst {worst[0]:.5f}px)")
    worst = page.evaluate("""(() => {
      let worst = 0;
      for (let i = 0; i < 300; i++) {
        rotX = (Math.random() * 2 - 1) * 1.3; rotY = Math.random() * 20 - 10; setZoom(1 + Math.random() * 3);
        const sx = CX + (Math.random() * 2 - 1) * baseR * 0.7, sy = CY + (Math.random() * 2 - 1) * baseR * 0.7;
        const P = unproject(sx, sy); if (!P) continue;
        const p = project(...P); worst = Math.max(worst, Math.hypot(p.sx - sx, p.sy - sy));
      }
      return worst;
    })()""")
    ok(worst < 0.01, f"unproject is the exact inverse of project (worst {worst:.5f}px)")

    print("mac: grabbing, zooming to the cursor, facing routes")
    page.evaluate("rotX = 0.3; rotY = 0; setZoom(1); cam.tZoom = 1; cam.auto = null")
    page.wait_for_timeout(100)
    sx, sy = page.evaluate("[CX + 60, CY - 40]")
    P = page.evaluate(f"unproject({sx}, {sy})")
    page.mouse.move(sx, sy); page.mouse.down()
    for i in range(1, 21): page.mouse.move(sx + i * 9, sy + i * 4)
    off = page.evaluate(f"(() => {{ const p = project(...{P}); return Math.hypot(p.sx - {sx + 180}, p.sy - {sy + 80}); }})()")
    page.mouse.up()
    ok(off < 1.5, f"the grabbed point stays under the cursor while dragging (off by {off:.2f}px)")
    page.evaluate("cam.vx = cam.vy = 0")
    ax, ay = page.evaluate("[CX - 120, CY + 90]")
    A = page.evaluate(f"unproject({ax}, {ay})")
    page.mouse.move(ax, ay)
    for _ in range(6): page.mouse.wheel(0, -120); page.wait_for_timeout(16)
    page.wait_for_timeout(1500)
    off = page.evaluate(f"(() => {{ const p = project(...{A}); return Math.hypot(p.sx - {ax}, p.sy - {ay}); }})()")
    ok(page.evaluate("zoom") > 2 and off < 1.5, f"zoom glides in towards the cursor, the point under it stays put (zoom {page.evaluate('zoom'):.2f}, off by {off:.2f}px)")
    steps = page.evaluate("""(async () => {
      cam.tZoom = 1; cam.anchor = null; const zs = [];
      for (let i = 0; i < 20; i++) { await new Promise(r => requestAnimationFrame(r)); zs.push(zoom); }
      return zs; })()""")
    moving = sum(1 for i in range(len(steps) - 1) if abs(steps[i+1] - steps[i]) > 1e-3)
    ok(moving >= 6 and steps[-1] < steps[0], f"zoom glides over many frames, not one jump ({moving} frames of movement)")

    for frm, to in [("london", "paris"), ("london", "tokyo"), ("sydney", "los angeles"), ("anchorage", "cape town")]:
        page.evaluate("stopFlight(); sel.from = sel.to = null; cam.auto = null")
        page.fill("#inp-from", frm); page.fill("#inp-to", to)
        page.wait_for_timeout(3500)
        res = page.evaluate(f"""(() => {{
          const a = ll2xyz(findCity('{frm}').lat, findCity('{frm}').lng), b = ll2xyz(findCity('{to}').lat, findCity('{to}').lng);
          const th = Math.acos(a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);
          const m = project(...slerp(a, b, 0.5)), pa = project(...a), pb = project(...b);
          return {{ th, off: Math.hypot(m.sx - CX, m.sy - CY), ends: pa.vis && pb.vis, zoom, settled: !cam.auto }};
        }})()""")
        if res["th"] < 2.0:
            ok(res["settled"] and res["off"] < 2 and res["ends"], f"{frm} → {to}: route centred (off {res['off']:.1f}px), both ends visible, zoom {res['zoom']:.2f}")
        else:
            ok(res["settled"], f"{frm} → {to}: too long for one side; centred on the plane's position instead")
    page.evaluate("stopFlight(); sel.from = sel.to = null")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "paris")
    fly_click(page); page.wait_for_timeout(2500)
    page.evaluate("rotY += 1.2; cam.lastInteract = performance.now() - 13000")
    page.wait_for_timeout(3500)
    off = page.evaluate("(() => { const a = ll2xyz(findCity('london').lat, findCity('london').lng), b = ll2xyz(findCity('paris').lat, findCity('paris').lng); const m = project(...slerp(a, b, 0.5)); return Math.hypot(m.sx - CX, m.sy - CY); })()")
    ok(off < 3, f"in flight, left alone for 12 s, the globe drifts back to the route (off {off:.1f}px)")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("flight profile and pause")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.goto(BASE); page.wait_for_timeout(1200)
    page.evaluate("localStorage.clear()")
    table = page.evaluate("""(() => [['london','paris'],['london','new york'],['new york','london'],['london','tokyo'],['london','sydney'],['dubai','singapore'],['los angeles','tokyo'],['jaffna','singapore']].map(([a, b]) => {
      const km = routeKm(findCity(a), findCity(b)), p = buildProfile(km);
      const peak = Math.max(...p.segs.map(g => g.v1));
      // sample: distance only ever increases, speed never jumps, ends at exactly 100%
      let last = -1, lastV = 0, mono = true, smooth = true;
      for (let i = 0; i <= 2000; i++) { const s = profileAt(p, p.totalMs * i / 2000); if (s.frac < last - 1e-12) mono = false;
        last = s.frac; }
      p.segs.forEach((g, i) => { if (i && Math.abs(g.v0 - p.segs[i-1].v1) > 1e-6) smooth = false; });
      return { route: a + ' → ' + b, km: Math.round(km), old: km / 900 * 60, now: p.totalMs / 60000, peak, mono, smooth, end: profileAt(p, p.totalMs).frac, startF: profileAt(p, 0).frac };
    }))()""")
    print("    route                     km     old (km/900)   new (airborne)   top speed")
    for r in table:
        o, n = round(r['old']), round(r['now'])
        print(f"    {r['route']:<24}{r['km']:>6}   {o//60:>5}h {o%60:02}m       {n//60:>5}h {n%60:02}m       {r['peak']:.0f} km/h")
    ok(all(r["mono"] and r["smooth"] and abs(r["end"] - 1) < 1e-9 and r["startF"] == 0 for r in table), "profiles: start at 0%, end at exactly 100%, never go backwards, no speed jumps")
    short = table[0]; ok(short["peak"] < 850 and short["now"] > short["old"], f"london → paris is too short to reach cruise (tops out at {short['peak']:.0f} km/h)")
    ok(all(abs(r["peak"] - 850) < 1 for r in table[1:]), "longer routes reach 850 km/h cruise")

    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); fly_click(page); page.wait_for_timeout(500)
    ok(page.evaluate("flight.model") == 2, "new flights use the realistic profile")
    ok("preparing for takeoff" in page.inner_text("#pill") or "preparing" in page.evaluate("pillTarget"), "on the runway: 'preparing for takeoff'")
    ok(page.inner_text("#fl-phase") == "on the runway", "phase readout: on the runway")
    page.evaluate("flight.virtMs = 10 * 60000; flight.lastT = Date.now(); tick()"); page.wait_for_timeout(400)
    ok(page.evaluate("pillTarget").startswith("wheels up") and "climbing" in page.inner_text("#fl-phase"), "climbing: 'wheels up', " + page.inner_text("#fl-phase"))
    page.evaluate("flight.virtMs = flight.totalMs * 0.6; flight.lastT = Date.now(); tick()"); page.wait_for_timeout(400)
    ok(page.inner_text("#fl-phase") == "cruising at 850 km/h" and page.evaluate("pillTarget").startswith("halfway"), "cruising past halfway: 'halfway there', cruising at 850 km/h")
    tf, df = page.evaluate("(() => { const v = flight.virtMs; flight.virtMs = flight.totalMs * 0.03; const r = [flightProgress(Date.now()), flightState(Date.now()).frac]; flight.virtMs = v; return r; })()")
    ok(df < tf, f"early on, the climbing plane is behind the clock (time {tf:.3f}, distance {df:.3f})")
    page.evaluate("flight.virtMs = flight.totalMs - 15 * 60000; flight.lastT = Date.now(); tick()"); page.wait_for_timeout(400)
    ok(page.evaluate("pillTarget").startswith("starting our descent") and "descending" in page.inner_text("#fl-phase"), "descent: 'starting our descent', " + page.inner_text("#fl-phase"))

    print("pause")
    page.evaluate("flight.virtMs = flight.totalMs * 0.3; flight.lastT = Date.now(); pomo = null; tick()")
    page.click("#btn-pause"); page.wait_for_timeout(300)
    v1 = page.evaluate("flightVirt(Date.now())"); page.wait_for_timeout(1200); v2 = page.evaluate("flightVirt(Date.now())")
    ok(v1 == v2 and page.evaluate("flight.paused"), "paused: the flight clock stands still")
    ok(page.inner_text("#btn-pause") == "resume" and page.evaluate("document.body.classList.contains('paused')"), "button says resume; page shows paused")
    ok(page.evaluate("pillTarget").startswith("paused") and page.inner_text("#fl-phase") == "holding position", "message: 'paused. take your time'")
    page.reload(); page.wait_for_timeout(1200)
    ok(page.evaluate("flight && flight.paused") and abs(page.evaluate("flightVirt(Date.now())") - v1) < 1, "refresh: still paused at the same point")
    page.evaluate("flight.pausedAt -= 10 * 60000; flight.startT -= 40 * 60000; persistFlight()")   # 40 min flight, 10 of them paused
    page.click("#btn-pause")
    ok(not page.evaluate("flight.paused") and abs(page.evaluate("flight.pausedMs") - 10 * 60000) < 5000, "resume: carries on, 10 paused minutes recorded")
    page.evaluate("flight.virtMs = flight.totalMs + 1; tick()"); page.wait_for_timeout(300)
    saved = page.evaluate("window.__saved[window.__saved.length - 1]")
    active = page.evaluate("flight.activeMs")
    ok(saved["realMin"] == round(active / 60000) and 29 <= saved["realMin"] <= 31, f"real time leaves out the pause (40 min flight, 10 paused: realMin {saved['realMin']})")
    ok(saved["dur"] and saved["flightMin"] == round(page.evaluate("flight.totalMs") / 60000), f"saved with the profile's duration ({saved['dur']})")

    print("pause with pomodoro")
    page.click("#btn-new"); page.check("#chk-pomo", force=True); page.fill("#pomo-focus", "25"); page.fill("#pomo-break", "5")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); fly_click(page); page.wait_for_timeout(300)
    page.evaluate("pomo.start = Date.now() - 27 * 60000; tick()")
    ok(page.evaluate("pomo.onBreak"), "on a pomodoro break")
    page.click("#btn-pause"); page.wait_for_timeout(300)
    ok(page.inner_text("#pomo-phase") == "paused", "pomodoro ring shows paused")
    page.click("#btn-pause"); page.wait_for_timeout(300)
    ok(not page.evaluate("pomo.onBreak") and page.evaluate("Date.now() - pomo.start") < 2000, "resume starts a fresh focus period")
    page.evaluate("stopFlight()"); page.uncheck("#chk-pomo", force=True)

    print("old in-progress flight keeps its timing")
    page.evaluate("""localStorage.setItem('activeFlight', JSON.stringify({v:1, id:'old1', from:'london', to:'paris', startT:Date.now()-60000, virtMs:0, lastT:Date.now()-60000, speed:1, sped:false, pomoStart:null}))""")
    page.reload(); page.wait_for_timeout(1000)
    ok(page.evaluate("flight.model") == 1 and abs(page.evaluate("flight.totalMs") - page.evaluate("flight.km / 900 * 3600000")) < 1, "a flight from before this update keeps km/900 timing")
    ok(not errs, "no console errors: " + str(errs))
    page.evaluate("stopFlight()")
    ctx.close()

    print("real db.js with no connection (nothing can reach the live database)")
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    ctx.route("**/firestore.googleapis.com/**", lambda r: r.abort())   # every server request fails
    page = ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(BASE); page.wait_for_timeout(2500)
    page.evaluate("""DB.addFlight({id:'offline1', seq:1, from:'almaty', to:'dakar', km:1, dur:'1m', realDur:null, date:'01/01/2020'})""")
    page.click(".tab[data-view=passes]"); page.wait_for_timeout(5500)
    sel = ".hist-del[aria-label='delete almaty to dakar']"
    ok(page.locator(sel).count() == 1, "offline: the list still loads (from this device's copy)")
    page.locator(sel).click(); page.wait_for_timeout(200); page.locator(sel).click()
    page.wait_for_timeout(8000)
    ok(page.locator(sel).count() == 0, "offline: deleting removes the flight instead of freezing")
    ok(not errs, "no page errors: " + str(errs))
    ctx.close()

    print("modules")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.goto(BASE); page.wait_for_timeout(1200)
    page.evaluate("localStorage.clear()")
    ok(page.inner_text("#module-value") == "choose a module", "module row starts empty")
    page.click("#btn-module"); page.wait_for_timeout(500)
    ok(page.is_visible("#module-menu"), "the module picker opens")
    mt, pb = page.evaluate("[document.getElementById('module-menu').getBoundingClientRect().top, document.getElementById('panel').getBoundingClientRect().bottom]")
    ok(mt > pb, f"it opens below the sidebar ({mt:.0f} > {pb:.0f})")
    count = page.locator(".module-item:not(.none)").count()
    ok(count == 35, f"all 34 of her modules plus 1 she added are listed ({count})")
    page.fill("#module-search", "exam")
    ok([x.strip() for x in page.locator(".module-item").all_inner_texts()] == ["akt", "osce"], "exam prep group: akt, osce")
    page.fill("#module-search", "")
    ok(page.locator(".module-group", has_text="your modules").count() == 1, "her own modules have their own group")
    scrolls = page.evaluate("(() => { const l = document.getElementById('module-list'); return l.scrollHeight > l.clientHeight; })()")
    ok(scrolls, "the list scrolls")
    page.fill("#module-search", "cardio")
    ok(page.locator(".module-item").count() == 1 and page.inner_text(".module-item") == "cardiology", "search narrows to cardiology")
    page.fill("#module-search", "year 6")
    ok(page.locator(".module-item").count() == 2, "searching a group name shows that group")
    page.fill("#module-search", "cardio"); page.keyboard.press("Enter")
    ok(page.is_hidden("#module-menu") and page.inner_text("#module-value") == "cardiology", "enter picks it and closes the picker")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "paris"); page.click("#btn-fly"); page.wait_for_timeout(300)
    ok(page.is_hidden("#confirm") and page.evaluate("flight.module") == "cardiology", "with a module chosen: no warning, flight takes off")
    ok(page.inner_text("#fl-module") == "cardiology", "flight card shows the module")
    page.reload(); page.wait_for_timeout(1000)
    ok(page.evaluate("flight.module") == "cardiology", "module survives a refresh mid-flight")
    page.evaluate("flight.virtMs = flight.totalMs + 1; tick()"); page.wait_for_timeout(300)
    ok(page.evaluate("window.__saved[window.__saved.length-1].module") == "cardiology", "saved with module: cardiology")
    ok("of cardiology" in page.inner_text("#ld-sub"), "landed card: " + page.inner_text("#ld-sub"))

    print("modules: flying without one")
    page.click("#btn-new"); page.wait_for_timeout(200)
    page.evaluate("chooseModule(null)")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "rome"); page.click("#btn-fly"); page.wait_for_timeout(300)
    ok(page.is_visible("#confirm") and page.evaluate("uiState()") == "plan", "warning appears and nothing takes off yet")
    ok("no module selected" in page.inner_text("#confirm"), "warning says: no module selected")
    page.click("#confirm-no"); page.wait_for_timeout(400)
    ok(page.is_hidden("#confirm") and page.is_visible("#module-menu"), "no: goes straight to the module picker")
    page.click(".module-item >> text=ethics and law"); page.wait_for_timeout(400)
    ok(page.evaluate("uiState()") == "flying" and page.evaluate("flight.module") == "ethics and law", "picking a module there takes off straight away")
    page.evaluate("stopFlight()")
    page.evaluate("chooseModule(null)")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "rome"); page.click("#btn-fly"); page.wait_for_timeout(300)
    page.keyboard.press("Escape")
    ok(page.is_hidden("#confirm") and page.is_visible("#module-menu") and page.evaluate("uiState()") == "plan", "escape counts as no")
    page.keyboard.press("Escape")
    page.click("#btn-fly"); page.wait_for_timeout(300); page.click("#confirm-yes"); page.wait_for_timeout(300)
    ok(page.evaluate("uiState()") == "flying" and page.evaluate("flight.module") is None, "yes: flies with no module")
    page.evaluate("flight.virtMs = flight.totalMs + 1; tick()"); page.wait_for_timeout(300)
    last = page.evaluate("window.__saved[window.__saved.length-1]")
    ok(last.get("module") is None, "saved with no module (uncategorised)")

    print("modules: adding one")
    page.click("#btn-new"); page.click("#btn-module"); page.wait_for_timeout(300)
    page.fill("#module-new", "  Pharmacology   Revision "); page.click("#module-add button")
    page.wait_for_timeout(400)
    ok(page.evaluate("window.__added") == ["pharmacology revision"], "added as 'pharmacology revision' (tidied, lowercase)")
    ok(page.inner_text("#module-value") == "pharmacology revision" and page.is_hidden("#module-menu"), "and chosen")
    page.click("#btn-module"); page.fill("#module-new", "a/b"); page.click("#module-add button")
    ok("/" in page.inner_text("#module-msg") and page.is_visible("#module-menu"), "a name with / is refused with a message")
    page.mouse.click(1200, 450); page.wait_for_timeout(200)
    ok(page.is_hidden("#module-menu"), "clicking elsewhere closes the picker")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("iphone: module picker")
    ctx, page, errs = new_page(b, viewport={"width": 393, "height": 852}, device_scale_factor=3, is_mobile=True, has_touch=True)
    page.goto(BASE); page.wait_for_timeout(1000)
    page.tap("#btn-module"); page.wait_for_timeout(400)
    mb, pt = page.evaluate("[document.getElementById('module-menu').getBoundingClientRect().bottom, document.getElementById('panel').getBoundingClientRect().top]")
    ok(mb <= pt, f"opens above the bottom panel ({mb:.0f} <= {pt:.0f})")
    ok(page.evaluate("document.activeElement.id") != "module-search", "doesn't pop the keyboard up on a touch screen")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("recentre")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.goto(BASE); page.wait_for_timeout(1200)
    page.evaluate("localStorage.clear(); chooseModule('cardiology')")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); fly_click(page); page.wait_for_timeout(3500)
    ok(page.is_hidden("#btn-recentre"), "hidden while the route is framed")
    page.mouse.move(1000, 450); page.mouse.down()
    for i in range(1, 15): page.mouse.move(1000 + i * 20, 450 + i * 8)
    page.mouse.up(); page.wait_for_timeout(300)
    page.mouse.wheel(0, -400); page.wait_for_timeout(600)
    ok(page.is_visible("#btn-recentre"), "appears after dragging and zooming away")
    bx = page.evaluate("(() => { const r = document.getElementById('btn-recentre').getBoundingClientRect(); return [r.left, r.bottom]; })()")
    ok(bx[0] < 60 and bx[1] > 900 - 60, f"sits bottom left ({bx[0]:.0f}, {bx[1]:.0f})")
    page.click("#btn-recentre"); page.wait_for_timeout(3500)
    off = page.evaluate("(() => { const a = ll2xyz(findCity('london').lat, findCity('london').lng), b = ll2xyz(findCity('tokyo').lat, findCity('tokyo').lng); const m = project(...slerp(a, b, 0.5)); return Math.hypot(m.sx - CX, m.sy - CY); })()")
    ok(off < 2 and page.evaluate("Math.abs(zoom - 1.06) < 0.02"), f"glides back to the takeoff framing (off {off:.1f}px, zoom {page.evaluate('zoom'):.2f})")
    ok(page.is_hidden("#btn-recentre"), "and hides again")
    page.mouse.move(1000, 450); page.mouse.down(); page.mouse.move(1150, 500, steps=8); page.mouse.up()
    page.evaluate("cam.vx = cam.vy = 0; cam.lastInteract = performance.now() - 13000"); page.wait_for_timeout(3500)
    ok(page.is_hidden("#btn-recentre"), "also hides when the globe drifts back on its own after 12 s")
    page.evaluate("stopFlight(); sel.from = sel.to = null; updatePlan()")
    page.mouse.move(1000, 450); page.mouse.down(); page.mouse.move(1150, 500, steps=8); page.mouse.up()
    ok(page.is_hidden("#btn-recentre"), "no route chosen: no button")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("iphone: recentre")
    ctx, page, errs = new_page(b, viewport={"width": 393, "height": 852}, device_scale_factor=3, is_mobile=True, has_touch=True)
    page.goto(BASE); page.wait_for_timeout(1000)
    page.evaluate("localStorage.clear(); chooseModule('akt')")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); fly_click(page); page.wait_for_timeout(1000)
    page.evaluate("interacted()"); page.wait_for_timeout(200)
    bb, pt = page.evaluate("[document.getElementById('btn-recentre').getBoundingClientRect().bottom, document.getElementById('panel').getBoundingClientRect().top]")
    ok(page.is_visible("#btn-recentre") and bb <= pt, f"sits just above the bottom panel ({bb:.0f} <= {pt:.0f})")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("boarding passes: data")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.goto(BASE); page.wait_for_timeout(1500)
    page.evaluate("localStorage.clear()")
    codes = page.evaluate("CITIES.map(c => c.a)")
    ok(len(codes) == 70 and all(isinstance(c, str) and len(c) == 3 and c.isupper() for c in codes) and len(set(codes)) == 70,
       "all 70 cities have their own 3-letter airport code")
    ok(page.evaluate("[findCity('london').a, findCity('tokyo').a, findCity('jaffna').a].join()") == "LHR,HND,JAF", "london LHR, tokyo HND, jaffna JAF")
    sg = page.evaluate("[seatGate('abc123'), seatGate('abc123'), seatGate('zzz999')]")
    import re
    ok(sg[0] == sg[1] and sg[0] != sg[2], f"seat and gate never change for a flight ({sg[0]['seat']}, gate {sg[0]['gate']})")
    ok(all(re.fullmatch(r"([1-9]|[1-3][0-9])[A-F]", x["seat"]) and re.fullmatch(r"[A-G]([1-9]|[1-3][0-9]|40)", x["gate"]) for x in sg), "seat like 14C, gate like B23")

    print("boarding passes: takeoff")
    page.evaluate("chooseModule('cardiology')")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); fly_click(page); page.wait_for_timeout(700)
    ok(page.locator("#pass-dock .pass.live").count() == 1 and page.is_visible("#pass-dock"), "pressing fly brings in a boarding pass")
    ok(page.evaluate("document.querySelector('#pass-dock .pass').classList.contains('printing')"), "it starts out filling itself in")
    dt, pb = page.evaluate("[document.getElementById('pass-dock').getBoundingClientRect().top, document.getElementById('panel').getBoundingClientRect().bottom]")
    ok(dt > pb, f"just below the sidebar ({dt:.0f} > {pb:.0f})")
    page.screenshot(path="/tmp/pass-1-printing.png")
    page.wait_for_timeout(2600); page.screenshot(path="/tmp/pass-2-filled.png")
    page.wait_for_timeout(5000)
    live = "#pass-dock .pass"
    ok(page.evaluate(f"document.querySelector('{live}').classList.contains('torn')") and page.locator(f"{live} .pass-stub").count() == 0,
       "after takeoff the stub has torn off and gone")
    ok(page.locator(f"{live} .pass-code").all_inner_texts() == ["LHR", "HND"], "pass reads LHR → HND")
    ok("cardiology" in page.inner_text(live) and page.inner_text(f"{live} .pass-status") == "in flight", "module shown; status 'in flight'")
    ok(page.is_visible(live), "the pass stays docked during the flight")
    page.evaluate("flight.virtMs = flight.totalMs * 0.5; flight.lastT = Date.now()"); page.wait_for_timeout(300)
    pl = page.evaluate("parseFloat(getComputedStyle(document.querySelector('#pass-dock .pass')).getPropertyValue('--p'))")
    ok(0.4 < pl < 0.6, f"the little plane on the pass follows the flight ({pl:.2f})")
    page.screenshot(path="/tmp/pass-3-docked.png")
    page.click("#btn-pause"); page.wait_for_timeout(200)
    ok(page.inner_text(f"{live} .pass-status") == "holding", "paused: status 'holding'")
    page.click("#btn-pause")
    page.click(".tab[data-view=passes]"); page.wait_for_timeout(300)
    ok(page.is_hidden("#pass-dock"), "the docked pass hides on other tabs")
    page.click(".tab[data-view=fly]"); page.wait_for_timeout(200)
    ok(page.is_visible("#pass-dock"), "and comes back on the fly tab")
    page.reload(); page.wait_for_timeout(1200)
    ok(page.evaluate("document.querySelector('#pass-dock .pass')?.classList.contains('torn')") and
       not page.evaluate("document.querySelector('#pass-dock .pass').classList.contains('printing')"), "refresh mid-flight: pass is just there, no replay")

    print("boarding passes: landing")
    page.evaluate("flight.virtMs = flight.totalMs + 1; tick()"); page.wait_for_timeout(500)
    ok(page.locator("#pass-dock .pass-stamp").count() == 1 and page.inner_text("#pass-dock .pass-status") == "landed", "landing: 'landed' stamp")
    page.screenshot(path="/tmp/pass-4-landed.png")
    page.wait_for_timeout(2800)
    ok(page.locator("#pass-dock .pass").count() == 0 and page.is_hidden("#pass-dock"), "then it flies off into the passes tab")
    nb = page.inner_text("#ld-badge") if page.is_visible("#ld-badge") else ""
    ok("the amazon" in nb and "long haul" in nb, "the landed card shows badges this flight earned: " + nb.replace("\n", " "))
    page.click("#ld-badge .badge-link:has-text('long haul')"); page.wait_for_timeout(900)
    ok(page.is_visible("#view-stats") and page.locator(".badge.flash[data-badge='long']").count() == 1, "tapping a new badge opens it in stats, glowing")
    bt, pt, pb = page.evaluate("[document.querySelector(\".badge[data-badge='long']\").getBoundingClientRect().top, ...(r => [r.top, r.bottom])(document.querySelector('.panel-body').getBoundingClientRect())]")
    ok(pt <= bt <= pb, f"and scrolled into view ({bt:.0f} within {pt:.0f}–{pb:.0f})")
    page.click(".tab[data-view=fly]"); page.wait_for_timeout(200)
    ok(page.evaluate("window.__saved.length") == 1, "and the flight is saved")

    print("boarding passes: stopping")
    page.click("#btn-new"); page.fill("#inp-from", "paris"); page.fill("#inp-to", "rome"); fly_click(page); page.wait_for_timeout(500)
    page.click("#btn-stop"); page.click("#btn-stop"); page.wait_for_timeout(700)
    ok(page.locator("#pass-dock .pass").count() == 0, "a stopped flight leaves no pass")
    ok(page.evaluate("window.__saved.length") == 1, "and nothing is saved")

    print("passes tab")
    page.click(".tab[data-view=passes]"); page.wait_for_timeout(700)
    n = page.evaluate("lastHistory.length")
    ok(page.locator("#hist-list .pass").count() == n, f"every flight is a boarding pass ({n})")
    first = "#hist-list .pass >> nth=0"
    ok(page.locator(first).locator(".pass-status").inner_text() == "landed", "newest first, marked landed")
    newp = page.locator("#hist-list .pass[data-id='new1']")
    ok(newp.locator(".pass-code").all_inner_texts() == ["LHR", "CDG"] and "cardiology" in newp.inner_text(), "a new flight's pass: LHR → CDG, cardiology")
    ok("14 november 2026" in newp.inner_text() and "departs" in newp.inner_text() and "arrives" in newp.inner_text(), "with its date and departure/arrival times")
    oldp = page.locator("#hist-list .pass[data-id='a1']")
    ok("uncategorised" in oldp.inner_text() and "before modules" not in oldp.inner_text() and "departs" not in oldp.inner_text() and "2 november 2026" in oldp.inner_text(), "a flight with no module or times: 'uncategorised', no times")
    total = page.evaluate("lastHistory.reduce((s, f) => s + (Number(f.km) || 0), 0)")
    ok(page.inner_text("#hist-total") == f"{total:,} km", f"total: {page.inner_text('#hist-total')}")
    page.click("[data-unit='mi']")
    mi = f"{round(total * 0.621371):,} mi"
    ok(page.inner_text("#hist-total") == mi and " mi" in newp.locator(".pass-field.dist dd").inner_text(), f"toggle to miles: {mi}, passes too")
    page.reload(); page.wait_for_timeout(800); page.click(".tab[data-view=passes]"); page.wait_for_timeout(600)
    ok(page.inner_text("#hist-total") == mi, "miles remembered after a refresh")
    page.click("[data-unit='km']")
    page.click("#hist-list .pass[data-id='new1']"); page.wait_for_timeout(3500)
    off = page.evaluate("(() => { const a = ll2xyz(findCity('london').lat, findCity('london').lng), b = ll2xyz(findCity('paris').lat, findCity('paris').lng); const m = project(...slerp(a, b, 0.5)); return Math.hypot(m.sx - CX, m.sy - CY); })()")
    ok(page.evaluate("viewRoute && viewRoute.id") == "new1" and off < 2, f"tapping a pass shows its route on the globe (centred, off {off:.1f}px)")
    ok("selected" in page.get_attribute("#hist-list .pass[data-id='new1']", "class"), "and highlights the pass")
    page.screenshot(path="/tmp/pass-5-list.png")
    page.click("#hist-list .pass[data-id='new1']")
    ok(page.evaluate("viewRoute") is None, "tapping it again lets go")
    page.click("#hist-list .pass[data-id='new1'] .hist-del")
    ok(page.evaluate("viewRoute") is None and page.evaluate("window.__deleted.length") == 0, "the ✕ doesn't select the pass, and only asks")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("iphone: boarding pass")
    ctx, page, errs = new_page(b, viewport={"width": 393, "height": 852}, device_scale_factor=3, is_mobile=True, has_touch=True)
    page.goto(BASE); page.wait_for_timeout(1000)
    page.evaluate("localStorage.clear(); chooseModule('akt')")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); fly_click(page); page.wait_for_timeout(2500)
    db_, pt = page.evaluate("[document.getElementById('pass-dock').getBoundingClientRect().bottom, document.getElementById('panel').getBoundingClientRect().top]")
    ok(page.is_visible("#pass-dock") and db_ <= pt, f"the pass prints just above the bottom panel ({db_:.0f} <= {pt:.0f})")
    page.screenshot(path="/tmp/pass-6-iphone.png")
    page.wait_for_timeout(7000)
    ok(page.is_hidden("#pass-dock"), "then tucks away, leaving the globe clear")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("ipad: touch")
    ctx, page, errs = new_page(b, viewport={"width": 1180, "height": 820}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page.goto(BASE); page.wait_for_timeout(1500)
    x, y, _ = city_xy(page, "chicago")
    page.touchscreen.tap(x, y); page.wait_for_timeout(100)
    ok(page.evaluate("sel.from && sel.from.n") == "chicago", "tapping a city with a finger sets from")
    r0 = page.evaluate("rotY")
    page.evaluate("""(() => { const c = document.getElementById('globe');
      const ev = (t, x, y, id) => c.dispatchEvent(new PointerEvent(t, {pointerId:id, pointerType:'touch', clientX:x, clientY:y, bubbles:true, isPrimary:id===1}));
      ev('pointerdown', 300, 400, 1); for (let i = 1; i <= 10; i++) ev('pointermove', 300 + i*15, 400, 1); ev('pointerup', 450, 400, 1); })()""")
    ok(page.evaluate("rotY") > r0 + 0.3, "one-finger drag rotates the globe")
    ok(page.evaluate("sel.to") is None, "a drag doesn't count as a tap")
    z0 = page.evaluate("zoom")
    page.evaluate("""(() => { const c = document.getElementById('globe');
      const ev = (t, x, y, id) => c.dispatchEvent(new PointerEvent(t, {pointerId:id, pointerType:'touch', clientX:x, clientY:y, bubbles:true}));
      ev('pointerdown', 500, 400, 1); ev('pointerdown', 600, 400, 2);
      for (let i = 1; i <= 10; i++) { ev('pointermove', 500 - i*10, 400, 1); ev('pointermove', 600 + i*10, 400, 2); }
      ev('pointerup', 400, 400, 1); ev('pointerup', 700, 400, 2); })()""")
    ok(page.evaluate("zoom") > z0 * 1.5, f"pinch zooms in ({z0:.2f} -> {page.evaluate('zoom'):.2f})")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("speed control")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.goto(BASE); page.wait_for_timeout(800)
    page.evaluate("localStorage.clear()")
    ok(page.is_visible("[data-speed='10']"), "speed control visible without ?dev")
    page.click("[data-speed='10']")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); fly_click(page)
    ok(page.evaluate("flight.speed") == 10 and page.get_attribute("[data-speed='10']", "aria-pressed") == "true", "flight takes off at the chosen 10x")
    ok(page.is_visible("#speed-row") and page.is_visible("#fl-real"), "speed control and real time shown in flight")
    page.evaluate("flight.virtMs = flight.totalMs * 0.3; flight.lastT = Date.now()")
    p1 = page.evaluate("flightProgress(Date.now())")
    page.click("[data-speed='100']")
    p2 = page.evaluate("flightProgress(Date.now())")
    ok(abs(p2 - p1) < 0.001 and page.evaluate("flight.speed") == 100, "changing speed mid-flight: no jump")
    page.evaluate("flight.virtMs = flight.totalMs + 1; tick()")
    ok(page.is_hidden("#speed-row"), "speed control hidden once landed")
    page.wait_for_timeout(1200)   # let the panel's width change and the globe's glide finish
    right = page.evaluate("document.getElementById('panel').getBoundingClientRect().right")
    ok(abs(page.evaluate("CX") - (right + (1440 - right) / 2)) < 3, "globe centred in the space right of the sidebar")

    print("mac: zoom keeps the outline fixed")
    page.click("#btn-new"); page.wait_for_timeout(1200)
    plan_w = page.evaluate("document.getElementById('panel').getBoundingClientRect().width")
    r0 = page.evaluate("baseR")
    for _ in range(12): page.mouse.move(1000, 450); page.mouse.wheel(0, -300)
    page.wait_for_timeout(300)
    ok(page.evaluate("zoom") > 3, f"wheel zooms in (zoom {page.evaluate('zoom'):.1f})")
    ok(abs(page.evaluate("baseR") - r0) < 1, "the globe's circle stays the same size")
    ok(page.evaluate("CX - baseR") > right, "zoomed globe never reaches the sidebar")
    hidden = page.evaluate("CITIES.filter(c => { const p = projectLL(c.lat, c.lng); return p.z > 0 && !p.vis; }).length")
    ok(hidden > 0, f"near-side cities outside the circle are hidden and untappable ({hidden})")
    page.screenshot(path="/tmp/zoomed.png")
    for _ in range(20): page.mouse.wheel(0, 400)
    page.wait_for_timeout(1500)
    ok(page.evaluate("zoom") == 1, "can't zoom out smaller than the circle")
    cx_plan = page.evaluate("CX")
    page.fill("#inp-from", "london"); page.fill("#inp-to", "paris"); fly_click(page); page.wait_for_timeout(1200)
    fly_w = page.evaluate("document.getElementById('panel').getBoundingClientRect().width")
    ok(fly_w < plan_w - 20, f"panel slims down in flight ({plan_w:.0f} -> {fly_w:.0f}px)")
    ok(page.evaluate("CX") < cx_plan - 10, f"and the globe moves into the space ({cx_plan:.0f} -> {page.evaluate('CX'):.0f})")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("flight map")
    ctx, page, errs = new_page(b, viewport={"width": 1440, "height": 900})
    page.add_init_script("""window.__extra = [
      {id:'e1', seq:4, from:'london', to:'paris', km:343, dur:'42m 01s', realDur:null, date:'10/11/2026', flightMin:42, realMin:40, module:'cardiology'},
      {id:'e2', seq:5, from:'london', to:'tokyo', km:9558, dur:'11h 33m', realDur:null, date:'13/11/2026', flightMin:693, realMin:690, module:'anatomy'},
      {id:'e3', seq:6, from:'new york', to:'sydney', km:15990, dur:'18h 50m', realDur:null, date:'12/11/2026', flightMin:1130, realMin:900},
    ];""")
    page.goto(BASE); page.wait_for_timeout(1200)
    ok(page.evaluate("CITIES.every(c => c.ct && c.ct.color)"), "every city has a continent")
    page.click(".tab[data-view=map]"); page.wait_for_timeout(2500)
    summ = page.inner_text("#map-summary")
    ok(summ.startswith("5 flights") and "4 countries" in summ, "summary counts the drawable flights and countries landed in: " + summ)
    ok(page.evaluate("mapState.routes.length") == 4 and page.evaluate("mapState.routes.find(r => r.key === 'london>paris').n") == 2,
       "the same route flown twice is one arc, counted twice")
    ok(page.evaluate("mapState.cities.get('london').landed") == 0 and page.evaluate("mapState.cities.get('paris').landed") == 2,
       "a city only counts as visited once she's landed there")
    chips = page.evaluate("[...document.querySelectorAll('#map-conts .chip')].map(b => b.textContent + ':' + (b.disabled ? 'off' : 'on'))")
    ok(chips == ['all:on', 'europe:on', 'asia:on', 'africa:off', 'n. america:off', 's. america:off', 'oceania:on'], "continent chips: only ones she's landed in can be picked " + str(chips))
    page.click("#map-conts .chip:has-text('europe')")
    ok(page.inner_text("#map-summary").startswith("2 flights") and page.evaluate("mapState.routes.length") == 1, "continent filter: europe only")
    page.click("#map-conts .chip:has-text('all')")
    opts = page.evaluate("[...document.querySelectorAll('#map-module option')].map(o => o.textContent)")
    ok(opts == ['all modules', 'anatomy', 'cardiology', 'uncategorised'], "module filter lists her modules " + str(opts))
    page.select_option("#map-module", label="cardiology")
    ok(page.inner_text("#map-summary").startswith("2 flights"), "module filter: cardiology")
    page.select_option("#map-module", label="uncategorised")
    ok(page.inner_text("#map-summary").startswith("2 flights"), "module filter: uncategorised")
    page.select_option("#map-module", label="all modules")
    page.evaluate("const i = document.getElementById('map-d0'); i.value = dayNum(new Date(2026, 10, 11)); i.dispatchEvent(new Event('input'))")
    ok(page.inner_text("#map-summary").startswith("3 flights") and "11 nov" in page.inner_text("#map-dates"), "date slider: from 11 nov on " + page.inner_text("#map-dates"))
    page.click("#map-dates")
    ok(page.is_visible("#map-from") and page.is_visible("#map-to"), "tapping the dates opens exact date pickers")
    ok(page.input_value("#map-from") == "2026-11-11", "they show the slider's range " + page.input_value("#map-from"))
    page.fill("#map-to", "2026-11-13"); page.dispatch_event("#map-to", "change")
    ok(page.inner_text("#map-summary").startswith("2 flights") and page.inner_text("#map-dates") == "11 nov – 13 nov", "custom range 11–13 nov: " + page.inner_text("#map-summary"))
    ok(page.evaluate("mapState.d1") == page.evaluate("dayNum(new Date(2026, 10, 13))") and page.evaluate("+document.getElementById('map-d1').value") == page.evaluate("mapState.d1"), "the slider follows the typed dates")
    page.fill("#map-from", "2026-11-20"); page.dispatch_event("#map-from", "change")
    ok(page.inner_text("#map-dates") == "13 nov", "a from-date after the to-date is held at the to-date")
    page.screenshot(path="/tmp/map-custom.png")
    page.click("#map-dates")
    ok(page.is_hidden("#map-custom"), "tapping the dates again closes the pickers")
    page.click("[data-preset=all]")
    ok(page.inner_text("#map-summary").startswith("5 flights"), "the 'all' preset brings everything back")
    page.screenshot(path="/tmp/map-all.png")

    page.evaluate("cam.auto = viewCentredOn(ll2xyz(48.86, 2.35), 3)"); page.wait_for_timeout(2500)
    x, y, _ = city_xy(page, "paris"); page.mouse.click(x, y); page.wait_for_timeout(300)
    det = page.inner_text("#map-detail") if page.is_visible("#map-detail") else ""
    ok("paris" in det and "2 times" in det and "france" in det, "tapping a city shows its details: " + det.replace("\n", " | "))
    page.screenshot(path="/tmp/map-city.png")
    page.mouse.click(x, y); page.wait_for_timeout(200)
    ok(page.is_hidden("#map-detail"), "tapping it again closes them")
    page.evaluate("cam.auto = viewCentredOn(slerp(ll2xyz(51.51,-0.13), ll2xyz(35.69,139.69), 0.5), 1)"); page.wait_for_timeout(2500)
    mx, my = page.evaluate("(() => { const p = project(...slerp(ll2xyz(51.51,-0.13), ll2xyz(35.69,139.69), 0.5)); return [p.sx, p.sy]; })()")
    page.mouse.click(mx, my + 3); page.wait_for_timeout(300)
    det = page.inner_text("#map-detail") if page.is_visible("#map-detail") else ""
    ok("london" in det and "tokyo" in det and "flight" in det and "11 h 30 min" in det, "tapping a route shows its details: " + det.replace("\n", " | "))
    page.screenshot(path="/tmp/map-route.png")
    page.mouse.click(1400, 60); page.wait_for_timeout(200)
    ok(page.is_hidden("#map-detail"), "tapping empty space closes them")
    ok(page.evaluate("window.__xss") is None, "junk from the database isn't drawn or run")

    print("stats")
    page.click(".tab[data-view=stats]"); page.wait_for_timeout(600)
    tiles = page.evaluate("[...document.querySelectorAll('.stat-tile')].map(t => t.innerText.replace(/\\n/g, ' '))")
    ok(tiles == ['30 h 44 min studied', '6 flights', '28,815 km flown', '4 countries'], "headline numbers, real study time " + str(tiles))
    bars = page.evaluate("[...document.querySelectorAll('.mod-bar .mod-name')].map(t => t.textContent)")
    ok(bars == ['anatomy', 'cardiology', 'uncategorised'] and "before modules" not in page.inner_text("#stats-body"), "time per module: biggest first, uncategorised last " + str(bars))
    recs = page.inner_text(".records")
    ok("new york → sydney" in recs and "12 nov" in recs and "15 h" in recs and "london → paris" in recs and "2 times" in recs, "records: longest flight, longest day, most flown, favourite " + recs.replace("\n", " | "))
    ok("on 3 of 6 continents" in page.inner_text("#stats-body") and page.locator(".chip.static.lit").count() == 3, "places: continents landed on are lit")
    ok("best 3" in page.inner_text("#stats-body") or "best streak: 3 days" in page.inner_text("#stats-body"), "best streak: 3 days")
    ok(page.locator(".cal-day").count() == 84 and page.locator(".cal-day.l4").count() >= 1, "12-week study calendar, shaded by time")
    earned = page.evaluate("[...document.querySelectorAll('.badge.earned .badge-name')].map(t => t.textContent)")
    ok(sorted(earned) == sorted(['first flight', 'ten hours', 'bookworm', 'the amazon', 'straight through', 'the great wall', 'around mars', 'on a roll', 'long haul', 'marathon day']),
       "badges earned " + str(earned))
    nxt = page.inner_text(".badge.next")
    ok("kangaroo" in nxt and "28,815 km of 33,980 km" in nxt and "next up" in nxt, "the closest badge comes next, with progress: " + nxt.replace("\n", " | "))
    ok("badges · 10 of 35" in page.inner_text("#stats-body"), "badge count in the heading")
    page.screenshot(path="/tmp/stats-top.png")
    page.evaluate("document.querySelector('.panel-body').scrollTop = 99999"); page.wait_for_timeout(200)
    page.screenshot(path="/tmp/stats-bottom.png")
    page.click("[data-srange='7']"); page.wait_for_timeout(200)
    ok(page.locator(".stat-tile").count() == 4 and "badges · 10 of 35" in page.inner_text("#stats-body"), "week view: numbers change, badges still count all time")
    page.click("[data-srange='all']")
    page.click(".mod-bar:has-text('cardiology')"); page.wait_for_timeout(800)
    ok(page.is_visible("#view-map") and page.input_value("#map-module") == "cardiology" and page.inner_text("#map-summary").startswith("2 flights"),
       "tapping a module bar opens the map filtered to it")
    page.select_option("#map-module", label="all modules")

    print("flight map: replay")
    page.click("#btn-replay"); page.wait_for_timeout(150)
    cap = page.inner_text("#replay-cap")
    ok(page.evaluate("document.body.classList.contains('replaying')") and "jaffna → singapore" in cap and "1 of 5" in cap,
       "replay starts with the oldest flight: " + cap)
    ok(page.inner_text("#map-summary").startswith("0 flights") and page.inner_text("#replay-label") == "stop", "summary starts from zero, button becomes stop")
    page.screenshot(path="/tmp/map-replay.png")
    page.wait_for_timeout(1300)
    ok(page.evaluate("replay && replay.i") == 1 and page.inner_text("#map-summary").startswith("1 flight "), "after 1.25 s the first has landed and counts")
    page.click("[data-rspeed='5']")
    ok(page.evaluate("replaySpeed") == 5 and page.evaluate("replay !== null"), "speed changes mid-replay")
    page.wait_for_timeout(1500)
    ok(page.evaluate("replay") is None and not page.evaluate("document.body.classList.contains('replaying')"), "at 5x the rest finish quickly, then it ends")
    ok(page.inner_text("#map-summary").startswith("5 flights") and page.evaluate("mapState.routes.length") == 4 and page.is_hidden("#replay-cap"),
       "the full map and real totals come back")
    page.click("#btn-replay"); page.wait_for_timeout(200); page.click("#btn-replay")
    ok(page.evaluate("replay") is None and page.inner_text("#replay-label") == "replay", "stop ends it straight away")
    page.click("#btn-replay"); page.wait_for_timeout(200)
    page.mouse.move(900, 450); page.mouse.down(); page.mouse.move(950, 470); page.mouse.up()
    ok(page.evaluate("replay") is None, "touching the globe stops it")
    page.click("#btn-replay"); page.wait_for_timeout(200)
    page.click("#map-conts .chip:has-text('asia')")
    ok(page.evaluate("replay") is None and page.inner_text("#map-summary").startswith("2 flights"), "changing a filter stops it")
    page.click("#map-conts .chip:has-text('all')")
    page.click("[data-rspeed='1']")
    page.evaluate("mapState.shown = Array(60).fill(mapState.shown[0])")
    page.click("#btn-replay"); page.wait_for_timeout(200)
    body = page.inner_text("#confirm-body") if page.is_visible("#confirm") else ""
    ok("60 flights will take 1 min 15 s at 1x" in body and "2x takes 38 s" in body and "5x takes 15 s" in body and "date range" in body,
       "over 60 s it asks first, with ways to shorten it: " + body)
    page.screenshot(path="/tmp/map-replay-warn.png")
    page.click("#confirm-no")
    ok(page.evaluate("replay") is None and page.is_hidden("#confirm"), "'change it' doesn't start it")
    page.click("#btn-replay"); page.wait_for_timeout(100); page.click("#confirm-yes"); page.wait_for_timeout(100)
    ok(page.evaluate("replay && replay.list.length") == 60, "'replay anyway' plays the lot")
    page.click("#btn-replay")
    ok(page.evaluate("replay") is None, "and it can still be stopped")
    ok(page.is_hidden("#btn-recentre"), "no recentre button on the map")
    page.click(".tab[data-view=fly]"); page.wait_for_timeout(300)
    ok(page.locator("#view-fly").is_visible(), "back to the fly tab")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()

    print("iphone: bottom panel")
    ctx, page, errs = new_page(b, viewport={"width": 393, "height": 852}, device_scale_factor=3, is_mobile=True, has_touch=True)
    page.goto(BASE); page.wait_for_timeout(1000)
    top = page.evaluate("document.getElementById('panel').getBoundingClientRect().top")
    ok(top > 852 * 0.4, f"panel docked at the bottom (top at {top:.0f}px)")
    ok(page.evaluate("CY + R") < top, "globe sits fully above the panel")
    page.click("#inp-from"); page.keyboard.type("lo"); page.wait_for_timeout(200)
    ac = page.evaluate("document.getElementById('ac').getBoundingClientRect().bottom")
    inp = page.evaluate("document.getElementById('inp-from').getBoundingClientRect().top")
    ok(ac <= inp, "suggestions open above the field")
    ok(not errs, "no console errors: " + str(errs))
    ctx.close()
    b.close()

print("\n" + ("ALL PASSED" if not fails else f"{fails} FAILED"))
