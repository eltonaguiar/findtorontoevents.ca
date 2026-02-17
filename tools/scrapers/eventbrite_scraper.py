#!/usr/bin/env python3
"""
Eventbrite Toronto scraper — JSON-LD based.
Fetches Toronto event listing pages, follows individual event links,
and extracts schema.org Event JSON-LD (including images).
"""
import json
import re
import time
from datetime import datetime
from typing import List, Optional, Tuple
from .base_scraper import BaseScraper, ScrapedEvent

# How many individual event pages to fetch per run (keeps CI runtime reasonable)
MAX_EVENTS = 300
# Delay between individual page fetches (seconds)
PAGE_DELAY = 0.4

LISTING_URLS = [
    "https://www.eventbrite.ca/d/canada--toronto/events/",
    "https://www.eventbrite.ca/d/canada--toronto/events/?page=2",
    "https://www.eventbrite.ca/d/canada--toronto/events/?page=3",
    "https://www.eventbrite.ca/d/canada--toronto/events/?page=4",
    "https://www.eventbrite.ca/d/canada--toronto/events/?page=5",
]


def _extract_json_ld(soup) -> List[dict]:
    """Return all JSON-LD blocks from a BeautifulSoup page."""
    results = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
            if isinstance(data, list):
                results.extend(data)
            else:
                results.append(data)
        except (json.JSONDecodeError, TypeError):
            pass
    return results


def _parse_iso(dt_str: str) -> Optional[datetime]:
    if not dt_str:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(dt_str[:19], fmt[:len(fmt)])
        except ValueError:
            pass
    return None


def _safe_price(offers) -> Tuple[str, float, bool]:
    """Return (price_str, price_amount, is_free) from schema.org Offer list."""
    if not offers:
        return "Free", 0.0, True
    if isinstance(offers, dict):
        offers = [offers]
    prices = []
    for o in offers:
        p = o.get("price", "") or o.get("lowPrice", "")
        try:
            prices.append(float(str(p).replace("$", "").replace(",", "")))
        except (ValueError, TypeError):
            pass
    if not prices:
        return "Free", 0.0, True
    mn = min(prices)
    if mn == 0.0:
        return "Free", 0.0, True
    return f"${mn:.0f}", mn, False


class EventbriteScraper(BaseScraper):
    """Scrapes Eventbrite Toronto events using JSON-LD on individual event pages."""

    SOURCE_NAME = "Eventbrite"
    BASE_URL = "https://www.eventbrite.ca"

    def _collect_event_urls(self) -> List[str]:
        """Gather unique event page URLs from listing pages."""
        seen = set()
        urls = []
        for listing_url in LISTING_URLS:
            if len(urls) >= MAX_EVENTS:
                break
            soup = self.fetch_page(listing_url)
            if not soup:
                continue
            for a in soup.find_all("a", href=re.compile(r"/e/", re.I)):
                href = a.get("href", "")
                # Normalise — strip query strings
                href = href.split("?")[0].rstrip("/")
                if not href.startswith("http"):
                    href = self.BASE_URL + href
                if "eventbrite" in href and "/e/" in href and href not in seen:
                    seen.add(href)
                    urls.append(href)
            time.sleep(PAGE_DELAY)
        return urls[:MAX_EVENTS]

    def _scrape_event_page(self, url: str) -> Optional[ScrapedEvent]:
        """Fetch a single Eventbrite event page and extract JSON-LD."""
        soup = self.fetch_page(url)
        if not soup:
            return None
        ld_blocks = _extract_json_ld(soup)
        event_ld = None
        for block in ld_blocks:
            if block.get("@type") in ("Event", "SocialEvent", "MusicEvent", "EducationEvent"):
                event_ld = block
                break
        if not event_ld:
            return None

        title = event_ld.get("name", "").strip()
        if not title or self.should_exclude(title):
            return None

        start_dt = _parse_iso(event_ld.get("startDate", ""))
        end_dt = _parse_iso(event_ld.get("endDate", ""))
        if not start_dt:
            return None

        is_multi = bool(end_dt and (end_dt.date() > start_dt.date()))

        # Location
        loc = event_ld.get("location", {})
        if isinstance(loc, list):
            loc = loc[0] if loc else {}
        loc_name = (
            loc.get("name")
            or (loc.get("address") or {}).get("addressLocality")
            or "Toronto, ON"
        )
        address_obj = loc.get("address") or {}
        address_str = ", ".join(filter(None, [
            address_obj.get("streetAddress"),
            address_obj.get("addressLocality"),
            address_obj.get("addressRegion"),
            address_obj.get("postalCode"),
        ])) or None

        geo = loc.get("geo") or {}
        lat = geo.get("latitude") or None
        lng = geo.get("longitude") or None
        try:
            lat = float(lat) if lat else None
            lng = float(lng) if lng else None
        except (ValueError, TypeError):
            lat = lng = None

        loc_info = self.enhance_location(loc_name, title)
        if lat is None:
            lat = loc_info.get("lat")
        if lng is None:
            lng = loc_info.get("lng")
        if address_str is None:
            address_str = loc_info.get("address")

        # Image
        image_url = None
        raw_img = event_ld.get("image")
        if isinstance(raw_img, list):
            raw_img = raw_img[0] if raw_img else None
        if isinstance(raw_img, dict):
            raw_img = raw_img.get("url") or raw_img.get("@id")
        if raw_img and isinstance(raw_img, str) and raw_img.startswith("http"):
            image_url = raw_img

        # Price
        offers = event_ld.get("offers") or event_ld.get("offer")
        price_str, price_amount, is_free = _safe_price(offers)

        # Description
        description = event_ld.get("description", "")
        if isinstance(description, str) and len(description) > 800:
            description = description[:800].rstrip() + "…"

        # Organizer
        org = event_ld.get("organizer") or {}
        if isinstance(org, list):
            org = org[0] if org else {}
        host = org.get("name", "") or "Various Organizers"

        categories, tags = self.categorize_event(title, description)
        event_id = self.generate_event_id(title, start_dt.isoformat(), self.SOURCE_NAME)

        return ScrapedEvent(
            id=event_id,
            title=title,
            date=start_dt.isoformat() + "Z",
            end_date=end_dt.isoformat() + "Z" if end_dt and is_multi else None,
            location=loc_name,
            address=address_str,
            lat=lat,
            lng=lng,
            source=self.SOURCE_NAME,
            host=host,
            url=url,
            price=price_str,
            price_amount=price_amount,
            is_free=is_free,
            description=description,
            image=image_url,
            categories=categories,
            tags=tags,
            status="UPCOMING",
            is_multi_day=is_multi,
        )

    def scrape(self) -> List[ScrapedEvent]:
        print(f"[{self.SOURCE_NAME}] Collecting event URLs from listing pages…")
        event_urls = self._collect_event_urls()
        print(f"[{self.SOURCE_NAME}] Found {len(event_urls)} event URLs. Fetching details…")

        events = []
        seen_ids = set()
        for i, url in enumerate(event_urls):
            try:
                ev = self._scrape_event_page(url)
                if ev and ev.id not in seen_ids:
                    seen_ids.add(ev.id)
                    events.append(ev)
            except Exception as exc:
                print(f"[{self.SOURCE_NAME}] Error scraping {url}: {exc}")
            if i > 0 and i % 50 == 0:
                print(f"[{self.SOURCE_NAME}] Progress: {i}/{len(event_urls)} ({len(events)} valid)")
            time.sleep(PAGE_DELAY)

        with_images = sum(1 for e in events if e.image)
        print(f"[{self.SOURCE_NAME}] Done: {len(events)} events, {with_images} with images")
        return events
