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
    page.wait_for_timeout(200)
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
