/**
 * My Events persistence: test user bob/bob logs in, saves an event to "My Events",
 * and we confirm it is persisted (GET my events returns it).
 *
 * Run locally: npx playwright test tests/my_events_save_persisted.spec.ts
 * Run remote:  VERIFY_REMOTE=1 npx playwright test tests/my_events_save_persisted.spec.ts
 */
import { test, expect } from '@playwright/test';

function getFcApi(): string {
  const isRemote = process.env.VERIFY_REMOTE === '1' || process.env.VERIFY_REMOTE === 'true';
  const base = isRemote
    ? (process.env.VERIFY_REMOTE_URL || 'https://findtorontoevents.ca')
    : 'http://localhost:5173';
  return base.replace(/\/$/, '') + '/fc/api';
}

const TEST_USER = { email: 'bob', password: 'bob' };
const TEST_EVENT = {
  id: 'playwright-test-event-' + Date.now(),
  title: 'Playwright My Events Test Event',
  date: '2026-02-15',
  location: 'Toronto',
  url: 'https://example.com/event',
};

test.describe('My Events: save persists for user', () => {
  test('login as bob, save event to My Events, confirm it is persisted', async ({ request }) => {
    const FC_API = getFcApi();
    // 1. Login as bob
    const loginRes = await request.post(FC_API + '/login.php', {
      data: { email: TEST_USER.email, password: TEST_USER.password },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    expect(loginBody.error).toBeUndefined();
    expect(loginBody.user).toBeDefined();
    expect(loginBody.user.id).toBeDefined();
    const userId = loginBody.user.id;

    // 2. Save one event to My Events
    const saveRes = await request.post(FC_API + '/save_events.php', {
      data: {
        user_id: userId,
        action: 'add',
        event: TEST_EVENT,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(saveRes.ok()).toBeTruthy();
    const saveBody = await saveRes.json();
    expect(saveBody.error).toBeUndefined();
    expect(saveBody.status).toBe('success');

    // 3. Get My Events and confirm the event is there
    const getRes = await request.get(FC_API + '/get_my_events.php?user_id=' + userId);
    expect(getRes.ok()).toBeTruthy();
    const getBody = await getRes.json();
    expect(Array.isArray(getBody.events)).toBe(true);
    const found = getBody.events.find((e: { id?: string }) => e.id === TEST_EVENT.id);
    expect(found).toBeDefined();
    expect(found.title).toBe(TEST_EVENT.title);

    // 4. Optional: remove it and confirm it's gone
    const removeRes = await request.post(FC_API + '/save_events.php', {
      data: {
        user_id: userId,
        action: 'remove',
        event: { id: TEST_EVENT.id },
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(removeRes.ok()).toBeTruthy();
    const getAfterRes = await request.get(FC_API + '/get_my_events.php?user_id=' + userId);
    const getAfterBody = await getAfterRes.json();
    const foundAfter = getAfterBody.events.find((e: { id?: string }) => e.id === TEST_EVENT.id);
    expect(foundAfter).toBeUndefined();
  });
});
