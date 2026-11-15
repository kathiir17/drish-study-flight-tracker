# Behaviour tests in WebKit with a fake database (live data never touched).
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
FAKE_DB = """
const flights = [
  {id:'evil', seq:2, from:'<img src=x onerror="window.__xss=1">', to:'<b>bold</b>', km:1, dur:'1m', realDur:null, date:'01/01/2026'},
  {id:'a1', seq:1, from:'jaffna', to:'singapore', km:2580, dur:'2h 52m', realDur:null, date:'02/11/2026'},
];
window.__saved = []; window.__deleted = [];
window.DB = {
  loadFlights: async () => [...flights],
  addFlight: async f => { window.__saved.push(f); return f.id; },
  deleteFlight: async id => { window.__deleted.push(id); const i = flights.findIndex(f=>f.id===id); if (i>=0) flights.splice(i,1); },
  loadModules: async () => [], addModule: async n => n,
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

    page.fill("#inp-to", "atlantis"); page.click("#btn-fly")
    ok("atlantis" in page.inner_text("#plan-msg"), "unknown city gives a clear message: " + page.inner_text("#plan-msg"))
    page.fill("#inp-to", "mexico city"); page.click("#btn-fly")
    ok("different" in page.inner_text("#plan-msg"), "same city twice is caught")
    page.fill("#inp-to", "lond"); page.keyboard.press("ArrowDown"); page.keyboard.press("Enter")
    ok(page.input_value("#inp-to") == "london", "keyboard autocomplete: arrow + enter picks london")

    print("mac: custom pomodoro")
    page.check("#chk-pomo", force=True)
    page.fill("#pomo-focus", "0"); page.click("#btn-fly")
    ok("1 to 180" in page.inner_text("#plan-msg"), "invalid focus length rejected")
    page.fill("#pomo-focus", "25"); page.fill("#pomo-break", "5"); page.click("#btn-fly")
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
    page.fill("#inp-from", "paris"); page.fill("#inp-to", "rome"); page.click("#btn-fly")
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
    ok(page.evaluate("window.__deleted") == ["evil"], "second ✕ deletes that one flight")
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
    page.click("#btn-fly"); page.wait_for_timeout(2500)
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

    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); page.click("#btn-fly"); page.wait_for_timeout(500)
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
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); page.click("#btn-fly"); page.wait_for_timeout(300)
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
    page.fill("#inp-from", "london"); page.fill("#inp-to", "tokyo"); page.click("#btn-fly")
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
    page.fill("#inp-from", "london"); page.fill("#inp-to", "paris"); page.click("#btn-fly"); page.wait_for_timeout(1200)
    fly_w = page.evaluate("document.getElementById('panel').getBoundingClientRect().width")
    ok(fly_w < plan_w - 20, f"panel slims down in flight ({plan_w:.0f} -> {fly_w:.0f}px)")
    ok(page.evaluate("CX") < cx_plan - 10, f"and the globe moves into the space ({cx_plan:.0f} -> {page.evaluate('CX'):.0f})")
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
