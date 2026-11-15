# Screenshot every state of the app at mac / ipad / iphone sizes in WebKit (Safari's engine).
# db.js is replaced by an in-memory fake, so the live database is never touched.
import sys, pathlib, json
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(exist_ok=True)
ONLY = sys.argv[2:]  # optional device names
BASE = "http://127.0.0.1:8765/"

FAKE_DB = """
const flights = [
  {id:'a3', seq:3, from:'london', to:'tokyo', km:9560, dur:'10h 37m', realDur:null, date:'12/11/2026'},
  {id:'a2', seq:2, from:'paris', to:'rome', km:1106, dur:'1h 14m', realDur:'4m 20s', date:'10/11/2026'},
  {id:'a1', seq:1, from:'jaffna', to:'singapore', km:2580, dur:'2h 52m', realDur:null, date:'02/11/2026'},
];
window.__saved = [];
window.DB = {
  loadFlights: async () => [...window.__saved.map((f,i)=>({...f})), ...flights].sort((a,b)=>b.seq-a.seq),
  addFlight: async f => { window.__saved.push(f); return f.id; },
  deleteFlight: async id => { const i = flights.findIndex(f=>f.id===id); if (i>=0) flights.splice(i,1); },
  loadModules: async () => ['anatomy revision'], addModule: async n => n,
};
window.dispatchEvent(new Event('db-ready'));
"""

DEVICES = {
    "mac":    dict(viewport={"width": 1440, "height": 900}, device_scale_factor=2),
    "ipad":   dict(viewport={"width": 1180, "height": 820}, device_scale_factor=2, is_mobile=True, has_touch=True),
    "iphone": dict(viewport={"width": 393, "height": 852}, device_scale_factor=3, is_mobile=True, has_touch=True),
}

with sync_playwright() as p:
    browser = p.webkit.launch()
    for name, opts in DEVICES.items():
        if ONLY and name not in ONLY: continue
        ctx = browser.new_context(**opts)
        ctx.route("**/db.js", lambda r: r.fulfill(status=200, content_type="text/javascript", body=FAKE_DB))
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: m.type == "error" and errors.append(m.text))
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(BASE)
        page.wait_for_timeout(2500)
        shot = lambda label: page.screenshot(path=str(OUT / f"{name}-{label}.png"))
        shot("1-plan-empty")

        page.click("#inp-from"); page.keyboard.type("lo")
        page.wait_for_timeout(300); shot("2-autocomplete")
        page.keyboard.press("ArrowDown"); page.keyboard.press("Enter")
        page.evaluate("onCityTap(findCity('tokyo'))")
        page.wait_for_timeout(400); shot("3-plan-route")

        page.evaluate("chooseModule(null)"); page.click("#btn-fly"); page.wait_for_timeout(500); shot("3b-no-module-warning")
        page.click("#confirm-no"); page.wait_for_timeout(600); shot("3c-module-picker")
        page.keyboard.press("Escape"); page.mouse.click(5, 5); page.wait_for_timeout(200)
        page.evaluate("chooseModule('cardiology')")
        page.check("#chk-pomo", force=True)
        page.wait_for_timeout(200)
        page.click("#btn-fly")
        page.wait_for_timeout(300)
        # jump the flight forward to ~40% without waiting, through the real speed control
        page.evaluate("flight.virtMs = flight.totalMs * 0.4; flight.lastT = Date.now(); pomo.start -= 21*60000")
        page.wait_for_timeout(3000); shot("4-flying")

        page.evaluate("pomo.start -= 31*60000; tick()")
        page.wait_for_timeout(800); shot("5-flying-break")
        page.click("#btn-pause"); page.wait_for_timeout(900); shot("5b-paused")
        page.click("#btn-pause"); page.wait_for_timeout(300)

        page.click("[data-speed='10000']")
        page.wait_for_timeout(5000); shot("6-landed")

        page.click(".tab[data-view=passes]"); page.wait_for_timeout(600); shot("7-passes")
        page.click(".tab[data-view=map]"); page.wait_for_timeout(500); shot("8-map")
        page.click(".tab[data-view=fly]")
        page.click("#btn-onward"); page.wait_for_timeout(500); shot("9-onward")

        saved = page.evaluate("window.__saved")
        print(name, "errors:", errors or "none", "| saved:", json.dumps(saved, default=str)[:400])
        ctx.close()
    browser.close()
