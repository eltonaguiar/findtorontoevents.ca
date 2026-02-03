#!/usr/bin/env python3
"""
Data quality audit: event sources in events.json vs scrapers.

- Counts events by source in events.json (and next/events.json if present).
- Lists expected scraper source names from unified_scraper.
- Flags sources with zero or very low counts; warns if scraper source has no events.
"""
import json
import sys
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent


def load_events(path: Path) -> list:
    if not path.is_file():
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else data.get("events", [])


def main():
    events_path = PROJECT_ROOT / "events.json"
    next_events_path = PROJECT_ROOT / "next" / "events.json"

    events = load_events(events_path)
    next_events = load_events(next_events_path) if next_events_path.is_file() else []

    # Expected scraper source names (from unified_scraper + SOURCES_COMET_RESEARCH)
    scraper_sources = {
        "AllEvents.in",
        "Toronto Events Weekly",
        "AmericanArenas",
        "City of Toronto",
        "Unity Maps",
        "Creative Code Toronto",
        "LightMorning",
        "The Toronto Calendar (Chris D)",
        "Nathan Phillips Square",
        "Sankofa Square",
        "sofiaadelgiudice",
    }
    # Normalize: some scrapers use "LightMorning" vs "The Toronto Calendar (Chris D)"
    try:
        from scrapers.unified_scraper import UnifiedTorontoScraper
        scraper_sources = {s.SOURCE_NAME for s in UnifiedTorontoScraper().scrapers}
    except Exception:
        pass

    by_source = Counter(e.get("source") or "Unknown" for e in events)
    by_source_next = Counter(e.get("source") or "Unknown" for e in next_events) if next_events else None

    print("=" * 60)
    print("Event sources data quality audit")
    print("=" * 60)
    print(f"events.json: {len(events)} events, {len(by_source)} unique sources")
    if by_source_next is not None:
        print(f"next/events.json: {len(next_events)} events, {len(by_source_next)} unique sources")
        if set(by_source.keys()) != set(by_source_next.keys()):
            only_root = set(by_source.keys()) - set(by_source_next.keys())
            only_next = set(by_source_next.keys()) - set(by_source.keys())
            if only_root:
                print(f"  WARNING: sources only in events.json: {only_root}")
            if only_next:
                print(f"  WARNING: sources only in next/events.json: {only_next}")
    print()

    print("--- Events per source (events.json) ---")
    for source, count in sorted(by_source.items(), key=lambda x: (-x[1], x[0])):
        flag = ""
        if source in scraper_sources and count == 0:
            flag = " [SCRAPER ZERO]"
        elif count > 0 and count <= 3:
            flag = " [LOW]"
        print(f"  {count:5d}  {source}{flag}")
    print()

    print("--- Scraper sources with no or low events ---")
    zero_or_low = []
    for name in sorted(scraper_sources):
        count = by_source.get(name, 0)
        if count == 0:
            zero_or_low.append((name, 0, "ZERO"))
        elif count <= 5:
            zero_or_low.append((name, count, "LOW"))
    if zero_or_low:
        for name, count, level in zero_or_low:
            print(f"  {level}: {name} ({count} events)")
    else:
        print("  None; all scraper sources have > 5 events.")
    print()

    print("--- Sources in data but not from current scrapers ---")
    other = set(by_source.keys()) - scraper_sources - {"Unknown"}
    if other:
        for s in sorted(other):
            print(f"  {s} ({by_source[s]} events)")
    else:
        print("  (all sources match scrapers or Unknown)")
    print("=" * 60)


if __name__ == "__main__":
    sys.path.insert(0, str(SCRIPT_DIR))
    main()
