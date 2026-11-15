# tests

browser tests in webkit (safari's engine) via playwright. **db.js is swapped for a fake
in-memory database**, so these never touch drish's real flights.

setup (once): `python3 -m pip install playwright && python3 -m playwright install webkit`

```
cd ~/code/drish-study-flight-tracker
python3 -m http.server 8765 --bind 127.0.0.1 &      # the tests expect this port
python3 tests/behaviour.py                          # ~170 checks: route picking, pomodoro, refresh, stop, landing, passes, touch
python3 tests/screenshots.py /tmp/shots             # every state at mac / ipad / iphone sizes
```
