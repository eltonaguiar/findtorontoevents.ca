# Event sources (Comet browser research)

These sources were added from Comet research. Scrapers run in `unified_scraper`; merge into `events.json` via `scrape_and_sync_events.py`.

## Web calendars (scrapers)

| Source | URL | Scraper | Notes |
|--------|-----|---------|--------|
| AllEvents.in Toronto calendar | https://allevents.in/toronto/calendar | `allevents_calendar.py` | Month grid, filters |
| Toronto Events Weekly | https://torontoeventsweekly.ca | `toronto_events_weekly.py` | Curated weekly / newsletter |
| AmericanArenas Toronto | https://americanarenas.com/city/toronto-events/ | `american_arenas.py` | Concerts, sports, big shows |
| City of Toronto Festivals Calendar | https://www.toronto.ca/explore-enjoy/festivals-events/festivals-events-calendar/ | `city_of_toronto.py` | Official; already in pipeline |
| The Toronto Calendar (Chris D) | https://lightmorning.substack.com/p/an-update-to-the-calendar | `lightmorning_calendar.py` | Landing page; calendar link in post |
| **Sofia Adel Giudice** (Toronto events calendar) | https://www.notion.so/2a11557746e4806ca2f8c95fba80ab77?v=2a11557746e480ccbd4c000cddb9687e | `sofiaadelgiudice_notion.py` | Notion calendar; fallback list includes FREE AGO Wednesday nights, etc. |

## Google Sheets / Docs (event-specific)

| Source | URL | Scraper | Notes |
|--------|-----|---------|--------|
| Creative Code Toronto sign-up | https://docs.google.com/spreadsheets/d/1MsbtdvTGMNT75lqq4lnxydY4TczStAOZE1Ap8mQJKeM | `creative_code_sheet.py` | CSV export (gid=0); event-specific, not citywide |

## Adding TikTok / creator calendar URLs

TikTok “Toronto events calendar” sheets are usually:

- In a creator’s bio link (Linktree, Beacons, etc.)
- Not in public search results in a stable way

To add a new Google Sheet/Calendar:

1. Get the public URL from the creator’s bio or CTA.
2. For **Google Sheets**: add a scraper that fetches  
   `https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid=0`  
   and parses rows (see `creative_code_sheet.py`).
3. For **Google Calendar**: if they share an iCal feed (e.g. “Secret address in iCal format”), add a scraper that fetches the `.ics` URL and parses events.
4. Register the new scraper in `unified_scraper.py` and run `scrape_and_sync_events.py`.

## Mirror / non-canonical

- https://date.idiomasfachse.edu.pe/wiki/calendar/city-of-toronto-events-calendar.html — points back to City of Toronto; not a separate feed. Not scraped.
