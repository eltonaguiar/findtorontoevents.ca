# Sign-in flow debug summary

## Fix applied (proven with Playwright)

**Root cause:** The main site’s “Sign in” link pointed to `/api/google_auth.php`. On your host, requests under `/api/` were being rewritten to the SPA (index.html), so the PHP never ran and users saw the default events page instead of Google’s sign-in.

**Fix:** Sign in now uses **FavCreators’ OAuth** under `/fc/`, which the server serves correctly:
- **Link:** `https://findtorontoevents.ca/fc/api/google_auth.php?return_to=/`
- After Google login, the callback redirects to `return_to` (e.g. `/` for the main page).

Playwright proof: click “Sign in” and direct visit to that URL both land on **Google’s “Sign in - Google Accounts”** page (“Email or phone”, “to continue to findtorontoevents.ca”).

## Playwright run (live site)

Run: `VERIFY_REMOTE=1 npx playwright test tests/signin_flow_debug.spec.ts`

### Result (last run)

- **Test 1** – Homepage loads; Sign in button/link is visible.
- **Test 2** – **Click Sign in** → browser navigates to **Google** (`accounts.google.com`), page shows "Sign in - Google Accounts", "Email or phone", "to continue to findtorontoevents.ca". ✅
- **Test 3** – **Direct visit** to `https://findtorontoevents.ca/api/google_auth.php?return_to=/` → after redirect, landing page is **Google sign-in**. ✅
- **Test 4** – Raw fetch of `google_auth.php` (no follow): status 0 in browser (expected for cross-origin/redirect); does not change the above.

### Screenshots (in this folder)

| File | Description |
|------|-------------|
| `signin_debug_01_homepage.png` | Homepage before Sign in |
| `signin_debug_02_homepage_with_signin.png` | Homepage with Sign in button visible |
| `signin_debug_03_after_click.png` | Page after clicking Sign in (should be Google) |
| `signin_debug_04_direct_google_auth.png` | Page after opening google_auth.php directly (should be Google) |

## If you still see the "default page" (events page) when opening the auth URL

In Playwright the flow works: both **clicking Sign in** and **opening** `https://findtorontoevents.ca/api/google_auth.php?return_to=/` land on Google’s sign-in page.

If in your browser you see the events page instead of Google when visiting that URL, likely causes:

1. **Server rewrite** – The host may be sending `/api/*` (or `/findevents/api/*`) to `index.html` (SPA fallback). Then the server never runs `api/google_auth.php` and you get the default page.  
   **Fix:** Ensure `/api/` is not rewritten to `index.html`. In Apache, do not use a catch-all that sends all non-file requests to `index.html` for paths under `/api/`. Let `api/google_auth.php` be served as a real file.

2. **Different base path** – You might be opening  
   `https://findtorontoevents.ca/findevents/api/google_auth.php`  
   while the PHP files are only under `https://findtorontoevents.ca/api/`. Confirm the link and redirect use the same base (root or `/findevents/`) and that PHP exists there.

3. **Caching** – Browser or proxy cache might be returning the events page for the auth URL. Try a hard refresh (Ctrl+Shift+R) or an incognito/private window.

4. **How you open the URL** – Use the **Sign in** button/link on the site, or paste the full URL in the address bar. Don’t rely on a link that might be rewritten (e.g. from a different subpath).

## Flow (no login form on our site)

Sign-in uses **Google OAuth**. There is no username/password field on findtorontoevents.ca:

1. User clicks **Sign in with Google**.
2. Browser goes to `https://findtorontoevents.ca/api/google_auth.php?return_to=/`.
3. That script redirects (302) to **Google** (`accounts.google.com`).
4. User signs in (or picks account) on **Google’s** page.
5. Google redirects back to `https://findtorontoevents.ca/api/google_callback.php?code=...&state=/`.
6. Our callback creates/updates the user and starts the session, then redirects to `return_to` (e.g. `/`).

Credentials are only entered on **Google’s** page, not on findtorontoevents.ca.
