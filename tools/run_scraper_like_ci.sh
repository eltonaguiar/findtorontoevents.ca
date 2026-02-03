#!/usr/bin/env bash
# Run the scraper exactly like GitHub Actions: install deps from repo root, then run scraper.
# Run from repo root: ./tools/run_scraper_like_ci.sh
# Use this to debug CI failures locally (e.g. on Linux/macOS or in container).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ ! -f tools/scrape_and_sync_events.py ]; then
  echo "Run from repo root: could not find tools/scrape_and_sync_events.py"
  exit 1
fi
echo "[CI-sim] Installing dependencies (requests beautifulsoup4 lxml)..."
pip install requests beautifulsoup4 lxml -q
echo "[CI-sim] Verifying imports..."
python -c "import sys; sys.path.insert(0, 'tools'); from scrapers.unified_scraper import UnifiedTorontoScraper; print('imports OK')"
echo "[CI-sim] Running scraper..."
export EVENTS_UPDATE_SOURCE=local_ci_sim
python tools/scrape_and_sync_events.py
