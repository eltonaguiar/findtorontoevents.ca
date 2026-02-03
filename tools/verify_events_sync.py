#!/usr/bin/env python3
"""
Verify events sync and database data quality.
Calls remote API: events_status, events_get_stats, optionally events_find_duplicates.
Run after setting EVENTS_MYSQL_PASSWORD on the server and running a full sync.
"""
import json
import sys
from pathlib import Path

import requests

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
API_BASE = "https://findtorontoevents.ca/fc/api"
EVENTS_ROUTER = "https://findtorontoevents.ca/fc/events-router.php"


def get(url: str, timeout: int = 30, retry_router: bool = True) -> dict | None:
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 412 and retry_router and "events-router" not in url:
            return None
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  Error: {e}")
        return None


def get_events(endpoint: str, timeout: int = 30) -> dict | None:
    """GET events API; use router if direct returns 412."""
    url = f"{API_BASE}/{endpoint}"
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 412:
            raise requests.HTTPError("412")
        r.raise_for_status()
        return r.json()
    except Exception:
        pass
    e_map = {
        "events_status.php": "status",
        "events_get_stats.php": "get_stats",
        "events_find_duplicates.php": "find_duplicates",
    }
    router_url = f"{EVENTS_ROUTER}?e={e_map.get(endpoint, endpoint.replace('events_', '').replace('.php', ''))}"
    return get(router_url, timeout=timeout, retry_router=False)


def main():
    print("=" * 60)
    print("Events sync & data quality verification")
    print("=" * 60)
    print(f"API base: {API_BASE}\n")

    # 1. Status (DB connection, tables, counts)
    print("1. Events DB status")
    status = get_events("events_status.php")
    if not status:
        print("   FAIL: Could not reach events_status.php")
        sys.exit(1)
    if not status.get("ok"):
        print(f"   FAIL: {status.get('error', status)}")
        print("   Ensure EVENTS_MYSQL_PASSWORD is set on the server (env or fc/api/.env.events).")
        sys.exit(1)
    print(f"   DB: {status.get('db')}, tables_exist: {status.get('tables_exist')}")
    print(f"   events_count: {status.get('events_count', 0)}, pulls_count: {status.get('pulls_count', 0)}")
    if status.get("last_pull"):
        print(f"   last_pull: {status['last_pull']}")
    print()

    # 2. Stats (sync history, sources, categories)
    print("2. Stats (sync history & sources)")
    stats = get_events("events_get_stats.php")
    if not stats:
        print("   FAIL: Could not reach events_get_stats.php")
        sys.exit(1)
    if not stats.get("ok"):
        print(f"   FAIL: {stats.get('error', stats)}")
        sys.exit(1)
    print(f"   total_events: {stats.get('total_events', 0)}")
    print(f"   upcoming_events: {stats.get('upcoming_events', 0)}, free_events: {stats.get('free_events', 0)}")
    recent = stats.get("recent_pulls") or []
    print(f"   recent_pulls: {len(recent)}")
    for i, p in enumerate(recent[:5], 1):
        print(f"      {i}. {p.get('timestamp')} | {p.get('events_count')} events | {p.get('source')} | {p.get('status')}")
    sources = stats.get("sources") or []
    print(f"   sources: {len(sources)}")
    for s in sources[:8]:
        print(f"      {s.get('source')}: {s.get('count')}")
    print()

    # 3. Duplicate finder (data quality)
    print("3. Duplicate finder (data quality)")
    dup = get_events("events_find_duplicates.php", timeout=60)
    if dup and dup.get("ok"):
        print(f"   indexed: {dup.get('indexed', 0)}, duplicates_found: {dup.get('duplicates_found', 0)}, groups_created: {dup.get('groups_created', 0)}")
    else:
        print(f"   Skip or error: {dup.get('error', dup) if dup else 'no response'}")
    print()

    print("=" * 60)
    print("Verification complete. Sync history: https://findtorontoevents.ca/stats/")
    print("To run sync from server: GET https://findtorontoevents.ca/fc/events-router.php?e=sync")
    print("=" * 60)


if __name__ == "__main__":
    main()
