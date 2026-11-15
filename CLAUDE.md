# Study Flight Tracker
Study timer shown as a flight across a 3D globe, built for Drish.
Live at kathiir17.github.io/drish-study-flight-tracker (GitHub Pages: pushing to main deploys).
The filename must stay `index.html` for Pages to serve it.

**A revamp is in progress: read `REVAMP.md` for the plan, phase order and decisions.**

## Workflow
- No branch. Check locally, then commit and push to main together.
- Local: `python3 -m http.server 8001` → http://localhost:8001 (8000 is used by another
  project). Local runs use the LIVE database.
- Logic can be tested without a browser: macOS ships Safari's JS engine at
  `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`
  (no node installed). Stub the DOM and clock, load the inline script, fast-forward time.

## Stack
- `index.html` (inline CSS/JS, no build step, no framework) plus `db.js`, the only file
  that talks to the database. `db.js` is an ES module (blocked on file://), exposes
  `window.DB` and fires `db-ready`; index.html awaits it via the `dbReady` promise.
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

## How the app behaves (pre-revamp)
- Pick from/to (70 cities, autocomplete, exact lowercase name). Great-circle distance
  at 900 km/h, so duration = km/900 (to be replaced in phase 2).
- Timing is clock-based: `flight.virtMs` at `flight.lastT` plus `(now - lastT) × speed`.
  Never count ticks. A Web Worker drives `tick()`; `visibilitychange` catches up.
- Speed select (1x–10000x) is for testing; can change mid-flight without jumping.
- The in-progress flight is in localStorage (`activeFlight`) and resumes on reload;
  a flight that landed while closed is saved with its real landing time.
- Pomodoro: 50 min focus / 10 min break on real time, phase derived from the clock.
  For testing, temporarily set POMO_FOCUS/POMO_BREAK to 20s/10s, then change back.
- Chimes (Web Audio, synthesised): takeoff, halfway, landing, break, resume. None at
  25/75%. Audio unlocks on first tap (iOS silent-buffer trick).
- History is saved only on landing, not on stop.
- Voice: everything lowercase, dark navy palette, warm and encouraging.

## Gotchas
- Globe math is fiddly. `ll2xyz` negates longitude to fix a mirrored map, and drag signs
  are matched to that. Don't "tidy" these without testing orientation and drag direction.
- Fly-to-city was attempted three times and always landed wrong. If retried, derive the
  target rotation from `project()` and verify with a debug readout.
- HUD elements use hardcoded pixel offsets in canvas draw functions (phase 1 replaces this).
- `ctx.roundRect` needs Safari 16+.

## Known limitations
- The globe needs jsdelivr, so the page doesn't fully work offline (data is safe).
- iOS suspends the page when locked/backgrounded: no chimes then; it catches up on return.
- Anyone with the link can delete flights (no auth). Known, parked.
