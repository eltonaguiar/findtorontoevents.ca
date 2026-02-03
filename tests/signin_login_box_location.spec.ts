/**
 * Confirm sign-in: (1) Sign-in button visibility and EXACT location,
 * (2) Click opens LOGIN BOX (modal) with Google + email, not direct redirect.
 * Screenshots prove fix.
 *
 * Run: VERIFY_REMOTE=1 npx playwright test tests/signin_login_box_location.spec.ts
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';

const BASE = process.env.VERIFY_REMOTE_URL || 'https://findtorontoevents.ca';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

test.describe('Sign-in: button location and login box (modal)', () => {
  test('1. Sign-in control is visible and EXACT location (top right)', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(4000);

    // Sign-in can be: (A) button in #signin-island (opens modal) or (B) link in #signin-island (old: direct nav)
    const island = page.locator('#signin-island');
    await expect(island).toBeVisible({ timeout: 10000 });

    const box = await island.boundingBox();
    expect(box).toBeTruthy();
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();

    // EXACT location: fixed top-right. right should be ~ calc(1.5rem + 80px) from right edge.
    // In pixels roughly: right 80-120px, top ~24px
    const rightEdge = viewport!.width - (box!.x + box!.width);
    const topPos = box!.y;
    console.log('[LOCATION] #signin-island: top=' + topPos + 'px, rightEdge=' + rightEdge + 'px, width=' + box!.width);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'signin_location_01_button_visible.png'),
      fullPage: false,
    });

    // Document: button is in top-right area
    expect(topPos).toBeLessThan(100);
    expect(rightEdge).toBeLessThan(250);
  });

  test('2. Click opens LOGIN BOX (modal) — not redirect', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(4000);

    const island = page.locator('#signin-island');
    await expect(island).toBeVisible({ timeout: 10000 });

    const trigger = island.locator('button, a').first();
    const tagName = await trigger.evaluate((el) => el.tagName.toLowerCase());
    console.log('[DEBUG] Sign-in trigger tag:', tagName);

    if (tagName === 'button') {
      await trigger.click();
      await page.waitForTimeout(800);
      const modal = page.locator('#signin-modal');
      await expect(modal).toBeVisible({ timeout: 3000 });
      const modalDisplay = await modal.evaluate((el) => window.getComputedStyle(el).display);
      expect(modalDisplay).toBe('flex');

      const box = page.locator('#signin-modal-box');
      await expect(box).toBeVisible();
      await expect(box.getByText('Sign in')).toBeVisible();
      await expect(box.getByText('Continue with Google')).toBeVisible();
      await expect(box.getByText('or use email')).toBeVisible();
      await expect(page.locator('#signin-email')).toBeVisible();
      await expect(page.locator('#signin-password')).toBeVisible();

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'signin_location_02_login_box_open.png'),
        fullPage: false,
      });
      console.log('[OK] Login box (modal) opened. Content: Sign in, Continue with Google, or use email, Email/Password.');
    } else {
      // Old deploy: link only — clicking would navigate. We still want to record.
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'signin_location_02_old_link_only.png'),
        fullPage: false,
      });
      expect(tagName, 'Deployed page should have Sign-in as BUTTON (opens modal), not link. Deploy latest index.html.').toBe('button');
    }
  });

  test('3. Login box EXACT location (centered overlay)', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(4000);

    const island = page.locator('#signin-island button, #signin-island a').first();
    const tag = await island.evaluate((el) => el.tagName.toLowerCase());
    if (tag !== 'button') {
      test.skip();
      return;
    }
    await island.click();
    await page.waitForTimeout(500);

    const modal = page.locator('#signin-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });
    const modalBox = page.locator('#signin-modal-box');
    const box = await modalBox.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    expect(viewport).toBeTruthy();

    const centerX = box!.x + box!.width / 2;
    const viewportCenterX = viewport!.width / 2;
    const horizontalOffset = Math.abs(centerX - viewportCenterX);
    console.log('[LOCATION] Login box: centerX=' + centerX + ', viewportCenter=' + viewportCenterX + ', offset=' + horizontalOffset);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'signin_location_03_modal_position.png'),
      fullPage: false,
    });

    expect(horizontalOffset).toBeLessThan(150);
  });
});
