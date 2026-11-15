# Study Flight Tracker
Study timer shown as a flight across a 3D globe, built for Drish.
Live at kathiir17.github.io/drish-study-flight-tracker (GitHub Pages: pushing to main deploys).
The filename must stay `index.html` for Pages to serve it.

**A revamp is in progress: read `REVAMP.md` for the plan, phase order and decisions.**

## Workflow
- No branch. Check locally, then commit and push to main together.
- Local: `python3 -m http.server 8001` → http://localhost:8001 (8000 is used by another
  project). Local runs use the LIVE database.
- Tests: `tests/` (Playwright + WebKit, fake database; see tests/README.md). Run
  `tests/behaviour.py` after every change and look at `tests/screenshots.py` output.
  Playwright (Python) + WebKit are installed; no node, no Chrome on this Mac.
- Drish uses Safari, mainly on Mac and iPad, rarely iPhone, via the link (no home-screen app yet).

## Stack
- No build step, no framework. `index.html` (structure), `styles.css` (design tokens on
  `:root`, then components), `app.js` (everything except the database, in labelled
  sections), `db.js` (the only file that talks to Firebase; an ES module, blocked on
  file://, exposes `window.DB` and fires `db-ready`; app.js awaits it via `dbReady`).
- Home-screen / dock app: `manifest.webmanifest`, `icons/` (icon.svg is the source;
  PNGs rendered from it with Playwright), apple meta tags in index.html.
  Firestore's offline cache (IndexedDB) keeps a flight landed without a connection and
  uploads it later.
- Firebase Firestore, project `drish-flight-study-tracker`, no auth.
- Layout: `flights/{id}` = `{seq, from, to, km, dur, realDur, date:"DD/MM/YYYY"}` plus
  optional `module, flightMin, realMin, startedAt, endedAt` (see REVAMP.md phase 0).
  `seq` increases (oldest = 1); list shows highest first. No cap. The flight's own id is
  the doc id, so a duplicate save (two tabs) is refused rather than doubled.
  `modules/{name}` = `{name}`, id = name.
- Rules live in `firestore.rules`, applied by pasting into the Firebase console
  (Firestore → Rules → Publish). Anyone can read, add a well-formed flight/module, or
  delete a flight; nothing can be edited. The rules whitelist exact fields and limits:
  adding or changing a field means updating the rules AND re-publishing them BEFORE the
  code that writes it goes live, or saves silently fail. New fields stay optional.
- CDN deps: topojson-client 3.1.0 + world-atlas 2.0.2 (jsdelivr, pinned with SRI hashes:
  upgrading means a new version AND hash), Firebase SDK 10.12.2 (gstatic).
- Admin key: `~/code/secrets/drish-admin-key.json` (bypasses rules). Never copy into the
  repo or print.
- Legacy: the app used Supabase, then localStorage for history. Both gone; history must
  stay in Firestore. localStorage holds only the in-progress flight (and device prefs).

## Data rules
- Never lose her saved flights: saves add or delete single documents; never rewrite the
  whole list.
- Test in Safari (incl. iPhone) as well as Chrome. She's fully on Apple devices.
- Anything from the database is shown with textContent, never innerHTML (anyone can add).
- Never `await` a Firestore write or read without a timeout: write promises only resolve
  when the server confirms, so offline/stalled they hang forever (this froze delete once).
  db.js `settle()` gives writes 3 s, `loadFlights` falls back to the device copy after 4 s.

## How the app behaves
- UI: full-screen globe + star field, with an Apple Maps-style floating sidebar panel
  (`#panel`): tabs (fly, passes, map, stats) across its top, content below, sized to its
  content. ≥700px wide it sits top-left and the globe centres in the space to its right;
  narrower it docks at the bottom and the globe sits above. app.js measures the panel
  (`computeLayout`, ResizeObserver) and eases the globe into place; `--globe-cx` centres
  the top message pill over the globe. Fly tab: plan → flying → landed blocks, plus a
  speed segmented control (1x–10000x) shown before takeoff and in flight.
- Pick from/to by tapping cities on the globe (1st = from, 2nd = to) or typing
  (autocomplete with country, arrow keys). Pointer events handle mouse, touch drag and
  pinch; Safari trackpad pinch comes as gesture events.
- Flight profile (`buildProfile`): airborne only, speed ramps: runway 0→280 km/h (40 s),
  climb →850 (22 min), cruise 850, descent →250 (28 min), touchdown →30 (40 s). Short
  routes peak below cruise. `flightProgress` = share of TIME (study timer, messages,
  halfway chime); `flightState` = share of DISTANCE, speed and phase (plane, km flown).
  Persisted flights carry `model: 2`; one without it keeps the old km/900 timing
  (`legacyProfile`) so an in-progress flight never jumps when the app updates.
- Pause: flight clock freezes (`flight.paused`, rebased like a speed change); paused time
  (`pausedMs`) is left out of realDur/realMin; resume restarts the pomodoro's focus.
  A paused flight survives refresh.
- Timing is clock-based: `flight.virtMs` at `flight.lastT` plus `(now - lastT) × speed` (0 while paused).
  Never count ticks. A Web Worker drives `tick()`; `visibilitychange` catches up.
- Speed can change mid-flight without jumping.
- The in-progress flight is in localStorage (`activeFlight`) and resumes on reload;
  a flight that landed while closed is saved with its real landing time.
- Pomodoro: custom focus/break minutes (default 50/10, remembered per device in
  `pomoPrefs`); each flight stores its own lengths. Phase derived from the clock.
- Stop and delete both need two taps.
- Chimes (Web Audio, synthesised): takeoff, halfway, landing, break, resume. None at
  25/75%. Audio unlocks on first tap (iOS silent-buffer trick).
- History is saved only on landing, not on stop.
- Voice: everything lowercase, dark navy palette, warm and encouraging.

## Gotchas
- Globe math is fiddly. `ll2xyz` negates longitude to fix a mirrored map, and drag signs
  are matched to that. Don't "tidy" these without testing orientation and drag direction.
- Camera (app.js "Camera" section): `solveRotation(P, qx, qy)` gives the rotation that puts
  world point P at a screen offset; `unproject()` is project()'s exact inverse. Dragging,
  zoom-to-cursor, pinch and facing routes (`frameRoute`, `faceCity`) all use them.
  tests/behaviour.py checks both against project() on hundreds of random cases. The globe
  only spins and tilts (no roll), so points near a pole can't reach far left/right.
  All motion is time-based (`frameDt`); never use per-frame constants.
- Zoom keeps the globe's circle fixed (`baseR`) and magnifies inside it (`R = baseR × zoom`,
  zoom 1–4). `project().vis` = near side AND inside the circle; drawGlobe clips to `baseR`.
  The panel slims (332 → 296px) in flight via `body.in-flight`.
- Country fills push far-side points to the globe's edge (so shapes crossing the edge hug
  it); borders are drawn on the near side only.

## Known limitations
- The globe needs jsdelivr, so the page doesn't fully work offline (data is safe).
- iOS suspends the page when locked/backgrounded: no chimes then; it catches up on return.
- Anyone with the link can delete flights (no auth). Known, parked.
