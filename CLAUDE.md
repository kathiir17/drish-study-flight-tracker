# Study Flight Tracker
Study timer shown as a flight across a globe, built for Drish.
Live at kathiir17.github.io/drish-study-flight-tracker (GitHub Pages: pushing to main deploys).

## Stack
- `index.html` (inline CSS/JS, no build step) plus `db.js`, the only file that talks to the database. `db.js` is an ES module, so run locally with `python3 -m http.server 8000` and open http://localhost:8000 (browsers block modules from `file://`). Local runs use the live database.
- Firebase Firestore project `drish-flight-study-tracker`, no auth. `db.js` exposes `window.DB` (`loadFlights`, `addFlight`, `deleteFlight`) and fires `db-ready`. Firestore's offline cache (IndexedDB) keeps a flight finished without a connection and uploads it later.
- Layout: `flights/{id}` = `{seq, from, to, km, dur, realDur, date:"DD/MM/YYYY"}`, one document per flight; `seq` increases (oldest = 1), list shows highest first. No cap on the number of flights.
- Security rules live in `firestore.rules`, applied by pasting into the Firebase console (Firestore → Rules → Publish). Anyone can read, add a well-formed flight, or delete one; nothing can be edited.
- `migration/migrate.py` was the one-off Supabase → Firestore move (2026-11-07, 24 flights); `--verify-only` re-checks against `~/code/backups/drish-supabase-2026-11-07.json`. Admin key: `~/code/secrets/drish-admin-key.json` — never copy into the repo or print.

## Data rules
- Never lose her saved flights: saves add or delete single documents; never rewrite the whole list.
- Test in Safari (incl. iPhone) as well as Chrome.
