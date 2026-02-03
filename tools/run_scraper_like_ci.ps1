# Run the scraper exactly like GitHub Actions: install deps from repo root, then run scraper.
# Run from repo root: .\tools\run_scraper_like_ci.ps1
# Use this to debug CI failures locally.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $root "tools\scrape_and_sync_events.py"))) {
    Write-Host "Run this script from repo root or from tools/: could not find tools/scrape_and_sync_events.py"
    exit 1
}
Set-Location $root
Write-Host "[CI-sim] Installing dependencies (requests beautifulsoup4 lxml)..."
pip install requests beautifulsoup4 lxml --quiet
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "[CI-sim] Verifying imports..."
python -c "import sys; sys.path.insert(0, 'tools'); from scrapers.unified_scraper import UnifiedTorontoScraper; print('imports OK')"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "[CI-sim] Running scraper..."
$env:EVENTS_UPDATE_SOURCE = "local_ci_sim"
python tools/scrape_and_sync_events.py
exit $LASTEXITCODE
