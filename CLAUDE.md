# Study Flight Tracker
Study timer shown as a flight across a globe, built for Drish.
Live at kathiir17.github.io/drish-study-flight-tracker (GitHub Pages: pushing to main deploys).

## Stack
- Single standalone `index.html`, no build step.
- Supabase project `dwzvbiuylptzeoohwovt`: table `sessions`, one row (id=1) with all data as JSON in the `data` column, saved via PATCH.
- Supabase is the source of truth. localStorage is only a backup (Safari wipes it for rarely visited sites).
- A keep-alive GitHub Action (separate repo) pings Supabase twice a week.

## Data rules
- Never lose her saved sessions: an empty or stale local copy must never overwrite Supabase.
- Test in Safari (incl. iPhone) as well as Chrome.

## Open checks
- Confirm RLS status on `sessions` and that seed row id=1 exists.
