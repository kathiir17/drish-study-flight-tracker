#!/usr/bin/env python3
"""One-off migration: Supabase backup -> Firestore flights/{id}.

The backup holds one row whose `data` is the flight list, newest first. Each flight
becomes its own document, with seq = 1 for the oldest. Then everything is read back
and verified against the backup: count, every field of every flight, order, total km.
Exits non-zero on any mismatch.

Usage (from the repo folder; reuses the poker repo's Python environment):
  python3 migration/migrate.py --dry-run          # check inputs only, no Firebase
  PY=~/code/poker-dashboard/migration/.venv/bin/python
  $PY migration/migrate.py                        # migrate + verify
  $PY migration/migrate.py --verify-only          # re-check later

The admin key is read from --key and never printed.
"""
import argparse
import json
import os
import re
import sys

PROJECT_ID = "drish-flight-study-tracker"
DEFAULT_KEY = os.path.expanduser("~/code/secrets/drish-admin-key.json")
DEFAULT_BACKUP = os.path.expanduser("~/code/backups/drish-supabase-2026-11-07.json")
DATE_RE = re.compile(r"^[0-3][0-9]/[01][0-9]/20[0-9][0-9]$")
FIELDS = {"from", "to", "km", "dur", "realDur", "date"}


def fail(msg):
    print(f"\n✗ {msg}")
    sys.exit(1)


def build_target(backup_path):
    with open(backup_path) as f:
        rows = json.load(f)
    if not (isinstance(rows, list) and len(rows) == 1 and isinstance(rows[0].get("data"), list)):
        fail("Backup isn't in the expected shape: one row with a 'data' list of flights")
    newest_first = rows[0]["data"]
    n = len(newest_first)
    flights = []
    for i, e in enumerate(newest_first):
        where = f"flight #{i + 1} ({e.get('from')} → {e.get('to')})"
        if set(e) != FIELDS:
            fail(f"{where} has unexpected fields: {sorted(e)}")
        if not isinstance(e["km"], int) or not 0 <= e["km"] <= 20100:
            fail(f"{where} has a bad km: {e['km']!r}")
        if not DATE_RE.match(e["date"]):
            fail(f"{where} has a bad date: {e['date']!r}")
        if e["from"] == e["to"]:
            fail(f"{where} goes nowhere")
        flights.append({"seq": n - i, **{k: e[k] for k in ("from", "to", "km", "dur", "realDur", "date")}})
    return flights  # newest first, like the backup


def print_summary(flights, title):
    print(f"\n{title}")
    print(f"  flights: {len(flights)}   total km: {sum(f['km'] for f in flights):,}")
    if flights:
        print(f"  newest: {flights[0]['from']} → {flights[0]['to']} ({flights[0]['date']})")
        print(f"  oldest: {flights[-1]['from']} → {flights[-1]['to']} ({flights[-1]['date']})")


def connect(key_path):
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        fail("firebase-admin isn't installed. Use ~/code/poker-dashboard/migration/.venv/bin/python")
    if not os.path.isfile(key_path):
        fail(f"Admin key not found at {key_path}")
    with open(key_path) as f:
        key_project = json.load(f).get("project_id")
    if key_project != PROJECT_ID:
        fail(f"Admin key is for project {key_project!r}, expected {PROJECT_ID!r}")
    firebase_admin.initialize_app(credentials.Certificate(key_path))
    return firestore.client()


def verify(expected, db):
    actual = sorted((d.to_dict() for d in db.collection("flights").stream()), key=lambda f: -f["seq"])
    problems = []
    if len(actual) != len(expected):
        problems.append(f"{len(actual)} flights in Firestore, expected {len(expected)}")
    for e, a in zip(expected, actual):
        if a != e:
            problems.append(f"seq {e['seq']}: expected {e}, got {a}")
    if sum(f["km"] for f in actual) != sum(f["km"] for f in expected):
        problems.append("total km differs")
    print_summary(actual, "Read back from Firestore:")
    if problems:
        print(f"\n✗ VERIFICATION FAILED — {len(problems)} problem(s):")
        for p in problems:
            print(f"  • {p}")
        sys.exit(1)
    print(f"\n✓ VERIFIED: {len(expected)} flights match the backup exactly, field by field and in the same order.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--key", default=DEFAULT_KEY)
    ap.add_argument("--backup", default=DEFAULT_BACKUP)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verify-only", action="store_true")
    ap.add_argument("--force", action="store_true", help="delete existing flights first and re-migrate")
    args = ap.parse_args()

    expected = build_target(args.backup)
    print_summary(expected, "Expected (from backup):")
    if args.dry_run:
        print("\nDry run: backup looks valid. Nothing was written.")
        return

    db = connect(args.key)
    if not args.verify_only:
        existing = list(db.collection("flights").list_documents())
        if existing and not args.force:
            fail("Firestore already has flights. Use --verify-only to check them, or --force to wipe and re-migrate.")
        for ref in existing:
            ref.delete()
        batch = db.batch()
        for f in expected:
            batch.set(db.document(f"flights/{f['seq']:03d}"), f)
        batch.commit()
        print(f"\nWrote {len(expected)} flights.")
    verify(expected, db)


if __name__ == "__main__":
    main()
