# Event sources data quality audit

## Provider filter fix (sofiaadelgiudice)

**Issue:** Events from `sofiaadelgiudice` appeared on the main page but the source did not appear in the "Providers" filter.

**Cause:** The frontend loads `/next/events.json`. That file was not in sync with root `events.json`; root had sofiaadelgiudice events, `next/events.json` did not.

**Fix:**

1. **One-time:** Copied `events.json` → `next/events.json` so the Providers list includes all sources.
2. **Pipeline:**
   - `scrape_and_sync_events.py` now writes merged events to both `events.json` and `next/events.json`.
   - `deploy_to_ftp.py` uploads root `events.json` to both `events.json` and `next/events.json` on the server (single source of truth).
   - GitHub Actions scrape workflow stages `next/events.json` when present.

## Running the audit

```bash
python tools/audit_events_sources.py
```

This reports:

- Event counts per source in `events.json` and `next/events.json`
- Scraper sources with zero or low events
- Sources in the data that are not from current scrapers (e.g. Eventbrite, manual/API)

## Scraper sources with zero events

The audit may list scraper source names that have 0 events in `events.json`. Possible reasons:

- Scraper not run recently (data comes from merge with existing file).
- Scraper fails (e.g. URL change, parsing break).
- Different source name in data (e.g. City of Toronto uses sub-source names in some scrapers).

For "City of Toronto", the scraper uses per-feed `source_name`; the main scraper attribute is `City of Toronto` but events may be stored under a sub-name. Check `city_of_toronto.py` and the data for actual `source` values.

## Sources not from scrapers

Eventbrite, Narcity, 25dates.com, CitySwoon, Thursday, etc. appear in the data but are not produced by the current scrapers in `tools/scrapers/`. They may come from:

- Manual import or legacy pipeline
- FavCreators/API sync
- Another repo or process

No change is required for the Provider filter; all sources in `events.json` (and thus `next/events.json`) appear in the filter.
