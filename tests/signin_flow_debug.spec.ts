/**
 * Sign-in flow debug & proof: Sign in uses /fc/api/google_auth.php (FavCreators path).
 * Proves: click Sign in or visit that URL → land on Google sign-in (not default page).
 *
 * Run against LIVE site:
 *   VERIFY_REMOTE=1 npx playwright test tests/signin_flow_debug.spec.ts
 *
 * Screenshots saved to screenshots/
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';

const BASE = process.env.VERIFY_REMOTE_URL || 'https://findtorontoevents.ca';
const AUTH_URL = BASE + '/fc/api/google_auth.php?return_to=/';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

test.describe('Sign-in flow debug (live: ' + BASE + ')', () => {
  test('1. Homepage: capture state before Sign in', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'signin_debug_01_homepage.png'),
      fullPage: false,
    });
    const signin = page.locator('#signin-island a, a[href*="google_auth"]').first();
    await expect(signin).toBeVisible({ timeout: 5000 });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'signin_debug_02_homepage_with_signin.png'),
      fullPage: false,
    });
  });

  test('2. Click Sign in and capture where we land', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const signin = page.locator('#signin-island a, a[href*="google_auth"]').first();
    await expect(signin).toBeVisible({ timeout: 8000 });
    const href = await signin.getAttribute('href');
    console.log('[DEBUG] Sign in href:', href);

    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null),
      signin.click(),
    ]);

    await page.waitForTimeout(3000);
    const url = page.url();
    const title = await page.title();
    const bodyText = await page.locator('body').innerText().catch(() => '');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'signin_debug_03_after_click.png'),
      fullPage: true,
    });

    console.log('[DEBUG] After click - URL:', url);
    console.log('[DEBUG] After click - title:', title);
    console.log('[DEBUG] Body snippet:', bodyText.slice(0, 500));

    const onGoogle = url.includes('accounts.google.com');
    const hasGoogleSignIn = bodyText.includes('Sign in') && (bodyText.includes('Email or phone') || bodyText.includes('findtorontoevents'));
    expect(onGoogle || hasGoogleSignIn, 'Click Sign in must land on Google sign-in (Email or phone), not default page').toBe(true);
    if (onGoogle || hasGoogleSignIn) {
      console.log('[DEBUG] OK: Landed on Google sign-in');
    }
  });

  test('3. Direct visit to /fc/api/google_auth.php: follow redirect and capture', async ({ page }) => {
    const response = await page.goto(AUTH_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    await page.waitForTimeout(4000);
    const url = page.url();
    const title = await page.title();
    const bodyText = await page.locator('body').innerText().catch(() => '');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'signin_debug_04_direct_google_auth.png'),
      fullPage: true,
    });

    console.log('[DEBUG] Initial response status:', response?.status());
    console.log('[DEBUG] Final URL after direct visit:', url);
    console.log('[DEBUG] Page title:', title);
    console.log('[DEBUG] Body (first 600 chars):', bodyText.slice(0, 600));

    const onGoogle = url.includes('accounts.google.com');
    const pageHasGoogleForm =
      bodyText.includes('Email or phone') ||
      bodyText.includes('continue to findtorontoevents') ||
      (title.includes('Sign in') && bodyText.includes('Google'));

    if (onGoogle) {
      console.log('[DEBUG] OK: google_auth.php redirected to Google');
    } else if (pageHasGoogleForm) {
      console.log('[DEBUG] OK: Page shows Google sign-in content');
    } else {
      const looksLikeEventsPage =
        (url.includes('findtorontoevents.ca') && !url.includes('api/')) ||
        bodyText.includes('GLOBAL FEED') ||
        (bodyText.includes('Toronto') && bodyText.includes('Events') && !bodyText.includes('Email or phone'));
      if (looksLikeEventsPage) {
        console.log('[DEBUG] BUG: Server returned default/events page instead of redirecting to Google. Check server rewrite - /api/* must NOT be sent to index.html.');
      } else {
        console.log('[DEBUG] BUG: Did not reach Google. URL=' + url + ' title=' + title);
      }
    }
    expect(onGoogle || pageHasGoogleForm, 'Visiting /fc/api/google_auth.php must redirect to Google sign-in').toBe(true);
  });

  test('4. Inspect raw response from /fc/api/google_auth.php (redirect target)', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const result = await page.evaluate(async (url) => {
      const r = await fetch(url, { redirect: 'manual' });
      return { status: r.status, location: r.headers.get('location') || '', url: r.url };
    }, AUTH_URL);
    console.log('[DEBUG] /fc/api/google_auth.php (no follow) - status:', result.status, 'location:', result.location);
    if (result.status === 302 && result.location && result.location.includes('accounts.google.com')) {
      console.log('[DEBUG] OK: Server sends 302 to Google');
    } else {
      console.log('[DEBUG] BUG: Server did not send 302 to Google. Check if /api/ is rewritten to index.');
    }
  });
});
