# drish study flight tracker

a study timer shown as a flight across a 3d globe, built for drish.
pick two cities, press fly, and study for as long as the flight takes.

**live:** https://kathiir17.github.io/drish-study-flight-tracker

> this describes the app as of november 2026, before the planned ui overhaul.

## how it works

- **route:** choose a departure and destination from 70 cities (autocomplete). the
  distance is the great-circle distance; the plane cruises at 900 km/h, so a
  flight's duration is `km / 900` hours. london → paris is ~23 min; london → sydney
  is ~19 h.
- **the globe:** drag to rotate, scroll to zoom. the route is drawn as a dashed arc,
  filled in as the plane flies.
- **hud** (drawn on the globe canvas):
  - top-left: circular countdown of the real time left
  - below it: pomodoro circle (blue = focus, amber = break), if pomodoro is on
  - top-right: study-session box with the flight time left (and real time left when
    sped up)
  - centre: a banner that fades between milestone messages
- **pomodoro** (tick the box before flying): 50 min focus / 10 min break on real
  wall-clock time. the flight keeps going during breaks.
- **chimes:** takeoff, halfway, landing, break and back-to-focus. sound starts working
  after the first tap or key press (a browser rule).
- **speed** (1x–10000x): makes the flight go faster. it's there for testing; it can be
  changed mid-flight without the progress jumping.
- **history:** a flight is saved when it lands (not when stopped), newest first, with
  distance, flight time, real time if it was sped up, and the date. ✕ deletes one.

### timing and reliability

- all timing is worked out from the clock, not by counting timer ticks, so a slow or
  late update still shows the right numbers.
- **refresh-safe:** the flight in the air is kept on the device and picks up where it
  was after a refresh or reopening the tab. if it landed while the tab was closed,
  it's saved on reopen with its actual landing date.
- **background tabs:** a small web worker drives the timer (browsers slow these down
  less than normal timers) and the app catches up instantly on returning to the tab.
- **offline:** firestore keeps a copy of the history on the device. a flight that
  lands with no connection is saved locally and uploaded next time the page is open
  online.

## files

| file | what it is |
|---|---|
| `index.html` | the whole app: html, css and js inline. no build step, no framework. |
| `db.js` | the only file that talks to the database. exposes `window.DB` (`loadFlights`, `addFlight`, `deleteFlight`) and fires `db-ready`. |
| `firestore.rules` | database security rules (see below). |
| `CLAUDE.md` | project notes for claude code. |

dependencies, all loaded from cdns: firebase sdk 10.12.2 (gstatic), topojson-client
and world-atlas (jsdelivr, for the country shapes).

## data

firebase firestore, project `drish-flight-study-tracker`, no sign-in. one document per
flight:

```
flights/{id} = { seq, from, to, km, dur, realDur, date: "DD/MM/YYYY" }
```

`seq` goes up with each flight (oldest = 1). `realDur` is `null` unless the flight was
sped up. saves only ever add or delete a single flight, never rewrite the list.

**security rules** (`firestore.rules`): anyone can read, add a correctly-shaped flight,
or delete one; nothing can be edited. the rules list the exact fields and limits, so
**adding or changing a field means updating `firestore.rules` and re-publishing it**
(firebase console → firestore → rules → paste → publish), or saves are refused.

## running locally

`db.js` is an es module, which browsers won't load from a `file://` page, so serve
the folder:

```
cd ~/code/drish-study-flight-tracker
python3 -m http.server 8000
```

then open http://localhost:8000 (if port 8000 is taken, use another, e.g. 8001).

⚠️ local runs use the **live** database: test flights appear in drish's history.
delete them afterwards.

test in safari (including iphone) as well as chrome.

## deploying

github pages serves the `main` branch: pushing to `main` deploys. the page must stay
named `index.html`.

## known limitations

- **the globe needs the internet:** country shapes come from a cdn, so the page doesn't
  load fully offline (saved flights are still safe).
- **iphone, locked or in another app:** ios pauses the page completely, so chimes can't
  play then. the timer still keeps correct time and catches up (including saving a
  landed flight) as soon as the page is opened again.
- **iphone silent switch** mutes the chimes.
- **history shows city names as raw html.** since anyone can add a flight, someone
  could plant markup in the list. to be fixed by escaping the text.
- `ctx.roundRect` (hud boxes) needs safari 16+.
