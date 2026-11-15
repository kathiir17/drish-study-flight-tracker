# study flight tracker — revamp plan

read alongside `CLAUDE.md` (stack, firestore layout, rules, data rules). this covers what
we're building next, in what order, and the decisions already made.

## ground rules (non-negotiable)

- **never lose drish's saved flights.** add or delete single documents only; never
  rewrite the whole collection. old flights must keep displaying correctly.
- **pushing to main deploys live.** no branch: check locally
  (`python3 -m http.server 8001`, which uses the LIVE database), then commit and push to
  main together.
- test in safari (incl. iphone/ipad) as well as chrome. she is fully on apple devices.
- any new or changed field means updating `firestore.rules` and re-publishing it in the
  firebase console **before** the code that writes it goes live. the rules whitelist
  exact fields, so unpublished changes make saves fail.
- new fields are **optional** in the rules, never required: an old tab still open on her
  device saves flights without them, and requiring them would lose that flight.
- voice: everything lowercase, warm and encouraging.
- one phase at a time; check the browser console after each change.

## decisions made

- **modules:** a pre-existing list she can add to. the seed list is being compiled by
  kdot; ask for it when we reach module selection. don't invent one.
- **pausing** doesn't feed into anything: no effect on streaks, stats or achievements.
  paused time is simply excluded and the flight clock stops while paused.
- **pomodoro after a pause:** it resets to a fresh focus period on resume (the pause was
  a break in itself).
- **pomodoro lengths are customisable:** she can type her own focus and break minutes
  (default 50 / 10). stored per device; a flight in the air keeps the lengths it started with.
- **boarding passes** exist only for completed flights. the pass is shown at takeoff
  (with the rip animation) but only saved to her collection on landing. a stopped flight
  leaves no pass.
- **order:** data model first, then the ui shell, then features slot into the new ui.
  don't build new screens in the old style.
- **navigation pattern:** apple maps-style floating sidebar with the tabs across its top;
  the globe always stays in view beside it (docks to the bottom on iphone). passes →
  history with boarding passes, map → its own globe lit with every past route, stats →
  its own page, all inside this panel in later phases.
- **custom pomodoro lengths** came forward into phase 1 (with the new route card).
- **home-screen / dock app** set up in phase 1 (manifest, icon, apple meta tags).

## phase 0 — data model (one rules change for everything)

new **optional** fields on `flights/{id}`:

| field | type | meaning |
|---|---|---|
| `module` | string, 1–40 chars | the module studied |
| `flightMin` | int, 0–3000 | in-world flight duration in minutes (summable; `dur` is display-only) |
| `realMin` | int, 0–3000 | active real minutes spent, excluding pauses |
| `startedAt` | timestamp | real time the flight took off |
| `endedAt` | timestamp | real time it landed (≥ `startedAt`) |

`seq, from, to, km, dur, realDur, date` stay required, for display and compatibility.

new collection `modules/{name}` = `{ name }`: the document id **is** the name, so a
duplicate can't be created (a second create counts as an edit and is refused). anyone
can read or create one; none can be edited or deleted.

**not stored in flights (derived in code instead):** city codes, countries and continents
(they live in the city list, so old flights get them for free), and seat/gate flavour
(derived from the flight id).

**backward compatibility:** old flights have none of the new fields. stats and views use
`flightMin` when present, otherwise derive from `km / 900`, and treat a missing `module`
as "untagged". never backfill by rewriting the list. any backfill is a one-off admin-key
script updating individual documents, and only with kdot's sign-off.

## phase 1 — ui shell and look (done, november 2026)

built: star field, shaded globe with atmosphere and full retina sharpness, frosted
panels, sf pro rounded numerals, sidebar panel with tabs, plan / flying / landed cards, passes
tab (history), map and stats placeholders, tap-a-city picking with hover/press bulge,
touch drag + pinch + trackpad pinch, autocomplete with countries and keyboard support,
custom pomodoro lengths, two-tap stop and delete, a visible speed control, app icon and
manifest, split into index.html / styles.css / app.js. original brief below.

- apple maps feel: clean, light-touch panels, a proper type scale, generous spacing.
- move hud elements out of hardcoded canvas pixel offsets into a responsive layout; most
  of the hud becomes dom overlays rather than canvas drawing.
- navigation that new screens slot into: fly (the globe), passes, map, stats, later
  to-do. tabs or side panel: propose options first.
- star field behind the globe.
- click a city on the globe to set from/to (first click = from, second = to), hit-tested
  with the existing `project()`. cities bulge on hover (laptop) and press (touch).
  typing with autocomplete still works.
- works well on iphone, ipad and laptop, including touch drag on the globe.

## phase 2 — core flight upgrades

- **smooth globe motion** (done). zoom and drag feel jumpy ("comical"): make zoom glide to its
  target instead of stepping per scroll event, zoom towards the point under the
  cursor/fingers, keep the point under the finger under it while dragging, frame-rate
  independent momentum, a soft stop at the poles, and a faster draw (precompute country
  points) so nothing drops frames. measure frame rate with playwright before and after.
- **turn the globe to face the route** (done; moved here from parked, same maths as above):
  derive the target rotation from `project()`, glide to it, verify the route's midpoint
  lands at the centre automatically.

- **module selection** (done): her list is built into app.js (`MODULE_GROUPS`), her
  additions go to `modules`; flying with none asks first and counts as uncategorised.
- **pause and resume** (done). elapsed time becomes accumulated active time. a paused flight
  survives refresh (same on-device persistence as the active flight). show the paused
  state clearly on the globe and hud. pomodoro resets to fresh focus on resume.
- **custom pomodoro lengths** (focus / break minutes).
- **more realistic flight times** (done, simplified: airborne-only speed profile, no
  jet stream, no real-route calibration, at kdot's request). replace `km / 900` with an approximation of real block
  time: ~30–40 min fixed overhead plus cruise at ~800–850 km/h, eastbound faster than
  westbound (jet stream). calibrate against 8–10 real routes (london–paris, london–new
  york both ways, london–tokyo, london–sydney, dubai–singapore, la–tokyo, …). show kdot
  the comparison table before shipping.

## phase 3 — boarding passes and miles (done)

built as planned, plus: tapping a pass shows its route on the globe; km/miles toggle (one
unit at a time, per device). stats rule agreed with kdot: flights without `flightMin`
(saved before phase 0) get passes but are left out of phase 4 stats; flights since then
with no module count as uncategorised.


- at takeoff, show a generated boarding pass (from/to with city codes, module, date,
  duration, seat/gate flavour), then the stub-rip animation.
- on landing, it joins her collection. passes are derived from flight documents, not
  stored separately.
- a passes screen to browse them all, newest first, with a cumulative miles/km total.

## phase 4 — data views

split into 4a (map) and 4b (stats), pushed separately.

- **4a flight map tab (built):** every landed route on the globe, coloured by destination
  continent; repeat routes merge into one thicker, brighter arc; landed-in cities get a dot
  sized by landings, departure-only cities a ring. filters: destination continent, module
  (incl. uncategorised), date range slider with
  week/month/all and exact from/to pickers (tap the dates) (every flight has `date`, so old ones count). summary line (flights ·
  distance · countries landed in). tap a route or city for a details card. agreed rule:
  she has only "been" somewhere if she landed there. replay (built): plays the filtered flights oldest first, 1.25 s per whizz at 1x
  (2x/5x), caption + counting-up summary; over 60 s it asks first with suggestions (no
  length cap, no "new country" moments, by agreement). later ideas: colour-by switch (#5, low priority); short/long-haul filter not wanted for now.
- **4b stats and achievements (built):** see README "stats tab". decisions: study time =
  realMin (real time, pauses out). her 23 older flights (all pre-phase-0) were given
  modules (akt/osce alternating, kdot's call) and minutes from their durations on
  2026-11-15, so the "before modules" case is gone everywhere. badges count all time and
  open from the landed card. distance badges picked around her 29,572 km at the time (next: kangaroo route 33,980, satellite height 35,786, around the world 40,075).

## parked (don't start without kdot's go-ahead)

- **plane-down view.** the "centre the globe on a lat/lng" maths is now solved and tested
  (`solveRotation`), so this is unblocked when kdot wants it.
- **layovers and transits.** turns a flight into multiple legs, a real data-model change.
  pause covers most of the long-haul need for now.
- **to-do list.** fully separate: its own collection, rules and screen.
- **anyone with the link can delete flights.** known; ignored for now.

## open questions

