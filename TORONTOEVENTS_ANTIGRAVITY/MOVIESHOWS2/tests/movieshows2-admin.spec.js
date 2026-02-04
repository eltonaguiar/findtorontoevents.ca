// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://findtorontoevents.ca/movieshows2';
const AUTH_KEY = 'ms2_sync_2024_findto';

// ============================================================
// LOG PAGE TESTS
// ============================================================

test.describe('Sync Log Page', () => {
  test('log page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    await expect(page).toHaveTitle(/Movie.*TV.*Log/i);
  });

  test('log page shows stats cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    // Should have stat cards with numbers
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(6);
  });

  test('log page shows total titles count', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    const totalCard = page.locator('.stat-card').first();
    const number = totalCard.locator('.number');
    const text = await number.textContent();
    const count = parseInt(text.replace(/,/g, ''));
    expect(count).toBeGreaterThan(0);
  });

  test('log page shows sync history section', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    await expect(page.locator('h2', { hasText: 'Sync History' })).toBeVisible();
  });

  test('log page shows sync log entries', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    // We ran syncs earlier, so there should be entries
    const rows = page.locator('table').first().locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('log page shows content by year section', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    await expect(page.locator('h2', { hasText: 'Content by Year' })).toBeVisible();
  });

  test('log page year table has data', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    const yearRows = page.locator('table').nth(1).locator('tbody tr');
    const count = await yearRows.count();
    expect(count).toBeGreaterThan(10);
  });

  test('log page has refresh button', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    await expect(page.locator('.refresh-btn')).toBeVisible();
  });

  test('log page has TMDB attribution in footer', async ({ page }) => {
    await page.goto(`${BASE_URL}/log/`);
    await expect(page.locator('.footer')).toContainText('TMDB');
  });
});

// ============================================================
// API STATUS ENDPOINT TESTS
// ============================================================

test.describe('API Status Endpoint', () => {
  test('api_status returns valid JSON', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/log/api_status.php`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('api_status contains stats', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/log/api_status.php`);
    const data = await response.json();
    expect(data.stats).toBeDefined();
    expect(data.stats.total_titles).toBeGreaterThan(0);
    expect(data.stats.movies).toBeGreaterThan(0);
    expect(data.stats.tv_shows).toBeGreaterThan(0);
    expect(data.stats.active_trailers).toBeGreaterThan(0);
  });

  test('api_status contains by_year data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/log/api_status.php`);
    const data = await response.json();
    expect(data.by_year).toBeDefined();
    expect(data.by_year.length).toBeGreaterThan(10);
  });

  test('api_status contains recent syncs', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/log/api_status.php`);
    const data = await response.json();
    expect(data.recent_syncs).toBeDefined();
    expect(Array.isArray(data.recent_syncs)).toBe(true);
  });

  test('api_status has timestamp', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/log/api_status.php`);
    const data = await response.json();
    expect(data.timestamp).toBeDefined();
    expect(data.timestamp).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

// ============================================================
// ADMIN SEARCH API TESTS
// ============================================================

test.describe('Admin Search API', () => {
  test('search returns results for known title', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_search.php?q=Avatar&type=movie`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('search results have required fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_search.php?q=Avengers&type=movie`);
    const data = await response.json();
    const first = data.results[0];
    expect(first.tmdb_id).toBeDefined();
    expect(first.title).toBeDefined();
    expect(first.type).toBeDefined();
    expect(typeof first.in_database).toBe('boolean');
  });

  test('search correctly identifies items in database', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_search.php?q=The+Batman&type=movie`);
    const data = await response.json();
    // The Batman (2022) should be in database based on our earlier test
    const theBatman = data.results.find(r => r.tmdb_id === 414906);
    if (theBatman) {
      expect(theBatman.in_database).toBe(true);
    }
  });

  test('search returns error for empty query', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_search.php?q=`);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('multi search includes both movies and TV', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_search.php?q=Breaking+Bad&type=multi`);
    const data = await response.json();
    expect(data.success).toBe(true);
    const types = data.results.map(r => r.type);
    // Breaking Bad should have at least TV results
    expect(types).toContain('tv');
  });
});

// ============================================================
// ADMIN PANEL UI TESTS
// ============================================================

test.describe('Admin Panel UI', () => {
  test('admin page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await expect(page).toHaveTitle(/Admin Panel/i);
  });

  test('admin page shows status bar with stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    // Wait for stats to load
    await page.waitForFunction(() => {
      const el = document.getElementById('statTotal');
      return el && el.textContent !== '-';
    }, { timeout: 10000 });
    const total = await page.locator('#statTotal').textContent();
    expect(parseInt(total.replace(/,/g, ''))).toBeGreaterThan(0);
  });

  test('admin page has three tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    const tabs = page.locator('.tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('Search');
    await expect(tabs.nth(1)).toContainText('Year');
    await expect(tabs.nth(2)).toContainText('Fetch');
  });

  test('search tab is active by default', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await expect(page.locator('.tab').first()).toHaveClass(/active/);
    await expect(page.locator('#panel-search')).toHaveClass(/active/);
  });

  test('search input exists and is functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    const input = page.locator('#searchInput');
    await expect(input).toBeVisible();
    await input.fill('Inception');
    await expect(input).toHaveValue('Inception');
  });

  test('search type dropdown has options', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    const select = page.locator('#searchType');
    await expect(select).toBeVisible();
    const options = select.locator('option');
    await expect(options).toHaveCount(3);
  });

  test('search returns results in UI', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await page.locator('#searchInput').fill('Inception');
    await page.locator('.search-box button').click();
    // Wait for results
    await page.waitForSelector('.result-card', { timeout: 15000 });
    const results = page.locator('.result-card');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search results show in_database status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await page.locator('#searchInput').fill('Avatar');
    await page.locator('.search-box button').click();
    await page.waitForSelector('.result-card', { timeout: 15000 });
    // Should have badge showing database status
    const badges = page.locator('.result-card .badge-yes, .result-card .badge-no');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('year analysis tab shows year grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    // Switch to Year Analysis tab
    await page.locator('.tab', { hasText: 'Year' }).click();
    await expect(page.locator('#panel-years')).toHaveClass(/active/);
    // Wait for year cards to render
    await page.waitForSelector('.year-card', { timeout: 10000 });
    const cards = page.locator('.year-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);
  });

  test('year cards show movie and TV counts', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await page.locator('.tab', { hasText: 'Year' }).click();
    await page.waitForSelector('.year-card', { timeout: 10000 });
    const firstCard = page.locator('.year-card').first();
    await expect(firstCard.locator('.year-label')).toBeVisible();
    await expect(firstCard.locator('.count-item')).toHaveCount(2);
  });

  test('year cards have gap indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await page.locator('.tab', { hasText: 'Year' }).click();
    await page.waitForSelector('.year-card', { timeout: 10000 });
    const indicators = page.locator('.gap-indicator');
    const count = await indicators.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking year card opens fetch panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await page.locator('.tab', { hasText: 'Year' }).click();
    await page.waitForSelector('.year-card', { timeout: 10000 });
    await page.locator('.year-card').first().click();
    await expect(page.locator('#yearFetchPanel')).toBeVisible();
  });

  test('bulk fetch tab has controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin.html`);
    await page.locator('.tab', { hasText: 'Fetch' }).click();
    await expect(page.locator('#panel-fetch')).toHaveClass(/active/);
    await expect(page.locator('#bulkMode')).toBeVisible();
    await expect(page.locator('#bulkType')).toBeVisible();
    await expect(page.locator('#bulkPages')).toBeVisible();
  });
});

// ============================================================
// FETCH ENDPOINT TESTS
// ============================================================

test.describe('Fetch Endpoint Security', () => {
  // Note: 50webs shared hosting may return HTTP 200 even when script sends 403,
  // so we check the response body for "Unauthorized" text instead of status code.

  test('fetch rejects unauthorized requests', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/fetch_new_content.php`);
    const body = await response.text();
    expect(body).toContain('Unauthorized');
  });

  test('fetch rejects wrong key', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/fetch_new_content.php?key=wrong_key`);
    const body = await response.text();
    expect(body).toContain('Unauthorized');
  });

  test('admin_fetch_year rejects unauthorized requests', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_fetch_year.php?year=2024`);
    const body = await response.text();
    expect(body).toContain('Unauthorized');
  });

  test('admin_add_single rejects unauthorized requests', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_add_single.php?tmdb_id=550&type=movie`);
    const body = await response.text();
    const data = JSON.parse(body);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });
});

// ============================================================
// DEDUPLICATION TESTS
// ============================================================

test.describe('Deduplication', () => {
  test('adding existing movie returns already in database', async ({ request }) => {
    // The Batman (2022) tmdb_id=414906 should already be in DB
    const response = await request.get(
      `${BASE_URL}/admin_add_single.php?key=${AUTH_KEY}&tmdb_id=414906&type=movie`
    );
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Already in database');
  });

  test('search correctly marks existing movies', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/admin_search.php?q=The+Batman&type=movie`);
    const data = await response.json();
    const inDb = data.results.filter(r => r.in_database);
    expect(inDb.length).toBeGreaterThan(0);
  });
});
