# drish study flight tracker

a study timer shown as a flight across a 3d globe, built for drish.
pick two cities, press fly, and study for as long as the flight takes.

**live:** https://kathiir17.github.io/drish-study-flight-tracker

> the revamp in `REVAMP.md` is done up to phase 4: new interface, smooth globe,
> pause and realistic flights, modules, boarding passes, the flight map with replay, and
> stats with badges. what's parked for later is listed there.

## how it works

- **the screen:** a 3d globe under a night sky, with a floating sidebar (like apple
  maps) holding the tabs: **fly**, **passes** (her flight history), **map** and **stats**.
  the globe always stays in view beside it. on a phone the panel docks at the bottom
  instead.
- **choosing a route:** tap a city on the globe for the departure, tap another for the
  destination, or type them (autocomplete, with arrow keys and enter). the card shows
  the distance and how long the flight will be before she takes off. 70 cities.
- **flight time:** airborne time only, from a simple speed profile: a 40-second takeoff
  roll ("preparing for takeoff"), a 22-minute climb to 850 km/h, cruise, a 28-minute
  descent and a 40-second touchdown. short hops never reach full cruise speed.
  london → paris is ~42 min, london → tokyo ~11 h 33 m, london → sydney ~20 h 18 m.
  the panel shows the phase and current speed ("cruising at 850 km/h").
- **the globe:** drag (mouse or finger) to turn it, and the spot you grab stays under
  your finger; flick it to spin. scroll, pinch or trackpad-pinch to zoom in towards
  that spot (the globe's outline stays the same size). choosing a route turns the globe
  to frame it; after dragging away, **recentre** (bottom left) glides back, and mid-flight
  it drifts back by itself after 12 seconds untouched.
  the route is a dashed arc that fills in amber behind the plane.
- **in flight:** the card shows the time left, distance flown and to go, and the
  pomodoro ring (blue = focus, amber = break). messages at the top change at takeoff,
  climb, cruise, halfway, descent and touchdown. stopping needs two taps, and a stopped
  flight isn't saved.
- **pause:** freezes the flight (the plane dims and pulses on the globe). paused time
  isn't counted, and resuming starts a fresh pomodoro focus period. survives a refresh.
- **module:** choose what she's studying from her list (year 4 and 5 modules, year 6,
  cpp, exam prep), search it, or add her own. flying without one asks first, and the flight counts
  as uncategorised in stats.
- **pomodoro:** switch it on and choose focus and break minutes (default 50 / 10,
  remembered on each device). real wall-clock time; the flight keeps going during breaks.
- **landing:** a summary card, with "fly onward" to start the next leg from there. if
  the flight earned any badges they're listed on the card, and tapping one opens it in
  the stats tab.
- **chimes:** takeoff, halfway, landing, break and back-to-focus. sound starts working
  after the first tap or key press (a browser rule).
- **boarding passes:** at takeoff a pass prints itself below the sidebar (airport codes,
  date, duration, seat, gate, module), the tear line draws and the stub tears off; the pass
  stays docked through the flight, gets a "landed" stamp on arrival and flies into the
  passes tab. seat and gate are random-looking but fixed for each flight.
- **passes tab:** every flight as a boarding pass, newest first, with the total distance
  flown (km or miles toggle). tapping a pass shows its route on the globe. deleting one
  needs two taps.
- **map tab:** every landed flight drawn on the globe, coloured by the continent it
  landed in (europe blue, asia amber, africa rose, north america violet, south america
  green, oceania cyan). a route flown more than once is one arc that gets thicker and
  brighter; cities she's landed in get a dot that grows with each landing (a place she's
  only flown from is a small ring, since "been to" means landed in).
  - **filters:** destination continent (chips, which double as the colour key), module,
    and a date range: a two-handle slider, week / month / all, or tap the dates above it
    for exact from/to pickers.
  - **summary line:** flights, distance and countries for whatever's shown.
  - **tap a route or a city** for a card: how many flights or landings, time studied,
    and when it was last flown.
  - **replay:** plays the filtered flights oldest first. a plane whizzes from a to b in
    1.25 s (1x, 2x or 5x), leaving its arc, while the globe follows, a caption names
    each flight and the summary counts up. if it would take over 60 s it asks first and
    suggests a faster speed, tighter filters or a shorter date range. touching the
    globe, changing a filter or leaving the tab stops it.
- **stats tab:** week / month / all time.
  - **headline numbers:** time studied, flights, distance and countries landed in.
    study time is the real time she spent (pauses left out), not the sped-up flight time.
  - **time per module:** a bar per module, biggest first, uncategorised last. tapping
    one opens the map filtered to that module.
  - **records:** longest flight, longest study day, most flown route, favourite
    destination.
  - **places:** the six continents, lit once she's landed on each, plus countries and
    cities.
  - **streak:** current and best run of days with a landing, and a 12-week calendar
    shaded by how much she studied each day.
  - **badges (35):** flights (1–100), hours (10–500), distance (from the length of the
    amazon, through the kangaroo route and around the world, to the moon), countries
    and continents, streaks (3–30 days), and one-offs (long haul, marathon day, early
    bird, night owl). earned ones glow; the rest show progress, closest first, with the
    nearest marked "next up".
  - week / month change the numbers, modules, records and places; the streak, calendar
    and badges always count everything.
- **speed:** 1x–10000x, chosen before takeoff or changed mid-flight without the
  progress jumping. sped-up flights record the real time spent too.
- **as an app:** in safari, share → add to home screen (iphone/ipad) or file → add to
  dock (mac) gives it its own icon and full-screen window.

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
| `index.html` | page structure. no build step, no framework. |
| `styles.css` | all styling; colours, type and spacing are tokens at the top. |
| `app.js` | the app, in labelled sections: cities and continents, globe drawing, camera and touch, flight timing, pomodoro, audio, interface, modules, boarding passes, flight map (and replay), stats and badges. |
| `db.js` | the only file that talks to the database. exposes `window.DB` (`loadFlights`, `addFlight`, `deleteFlight`, `loadModules`, `addModule`) and fires `db-ready`. |
| `firestore.rules` | database security rules (see below). |
| `manifest.webmanifest`, `icons/` | home-screen / dock app name and icon (`icon.svg` is the source). |
| `tests/` | browser tests with a fake database (see `tests/README.md`). |
| `REVAMP.md`, `CLAUDE.md` | the revamp plan, and project notes for claude code. |

dependencies, all loaded from cdns: firebase sdk 10.12.2 (gstatic), topojson-client
3.1.0 and world-atlas 2.0.2 (jsdelivr, for the country shapes). the jsdelivr files are
pinned with integrity hashes, so upgrading one means updating its version and hash
together.

history entries come from a database anyone can add to, so they're always shown as
plain text, never as html.

## data

firebase firestore, project `drish-flight-study-tracker`, no sign-in. one document per
flight:

```
flights/{id} = { seq, from, to, km, dur, realDur, date: "DD/MM/YYYY",
                 module, flightMin, realMin, startedAt, endedAt }
modules/{name} = { name }
```

- `seq` goes up with each flight (oldest = 1). `realDur` is `null` unless the flight was
  sped up.
- `flightMin` is the flight's length, `realMin` the real time she studied (pauses left
  out). stats are built from these. `startedAt` / `endedAt` are the real takeoff and
  landing times.
- `module` is left out when she flies without one (shown as uncategorised).
- `modules/` holds the modules she added herself; her main list is built into `app.js`.
- saves only ever add or delete a single flight, never rewrite the list. the flight's
  own id is the document id, so the same flight saved twice (two tabs) is refused, not
  doubled.

**data change on 15 nov 2026:** her first 23 flights (june–july 2026, from before
modules existed) were given modules (akt and osce, alternating from the oldest) and
`flightMin` / `realMin` from their saved durations. only those fields were added, using
the admin key; nothing else changed. a backup of the flights from just before is in
`~/code/drish-backups/` (outside the repo).

**security rules** (`firestore.rules`): anyone can read, add a correctly-shaped flight,
or delete one; nothing can be edited. the rules list the exact fields and limits, so
**adding or changing a field means updating `firestore.rules` and re-publishing it**
(firebase console → firestore → rules → paste → publish), or saves are refused.

## running locally

`db.js` is an es module, which browsers won't load from a `file://` page, so serve
the folder:

```
cd ~/code/drish-study-flight-tracker
python3 -m http.server 8001
```

then open http://localhost:8001.

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
- **badges and stats only count what's in the database:** a flight deleted from the
  passes tab disappears from the map and stats too.
- **anyone with the link can delete flights.** there's no sign-in, so the rules can't
  tell drish apart from anyone else. fixing this needs some form of sign-in.
