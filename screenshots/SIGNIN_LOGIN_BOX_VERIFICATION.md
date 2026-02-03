# Sign-in / Login Box — Playwright Verification & Exact Locations

## Remote (live) verification (findtorontoevents.ca)

**Run:** `npx playwright test tests/signin_login_box_location.spec.ts`  
(Default BASE = `https://findtorontoevents.ca`.)

### Result

| Test | Result | Notes |
|------|--------|--------|
| 1. Sign-in control visible and EXACT location (top right) | **PASS** | Button present and positioned correctly. |
| 2. Click opens LOGIN BOX (modal) — not redirect | **FAIL** | `#signin-modal` not found in DOM after click. |
| 3. Login box EXACT location (centered overlay) | **FAIL** | Same: modal element missing. |

**Cause:** The **live site is serving an older `index.html`** that does **not** include the login modal injection script. A quick check:

```text
curl -sS "https://findtorontoevents.ca/" | findstr "signin-modal ensureSignInModal"
```
→ No matches. The repo’s `index.html` contains both; the deployed one does not.

**Conclusion:** The login box is **not** fixed on the live site until the **latest `index.html`** (with modal injection and `openSignInModal` button) is deployed.

---

## EXACT locations (once the correct index is deployed)

### 1. Sign-in trigger (button that opens the login box)

- **Element:** `#signin-island` (fixed-position wrapper) → inner `<button>` “Sign in”.
- **Position (from Playwright):**
  - **Top:** ~24 px from viewport top (`top: 1.5rem`).
  - **Right:** ~104 px from viewport right (`right: calc(1.5rem + 80px)`).
- **Layout:** Top-right of the page, to the **left** of the System Configuration (gear) button; no overlap.
- **Behavior:** Click calls `window.openSignInModal()` and opens the login **modal** (no redirect).

### 2. Login box (modal)

- **Element:** `#signin-modal` (overlay) → `#signin-modal-box` (the visible box).
- **Position:**
  - **Overlay:** `position: fixed; inset: 0` (full viewport).
  - **Box:** Centered with flex: `display: flex; align-items: center; justify-content: center` on `#signin-modal`.
  - **Box size:** `max-width: 400px`, `width: 90%`, rounded corners, dark background.
- **Content:** “Sign in” heading, “Continue with Google” button, “or use email”, email/password inputs, “Email login” button, close (×).
- **Visibility:** Hidden by default (`display: none`); on button click → `display: flex` and centered over the page.

So:

- **Trigger:** Top-right, **~24 px from top, ~104 px from right** (Sign in button in `#signin-island`).
- **Login box:** **Center of the viewport** as a modal overlay (`#signin-modal` → `#signin-modal-box`).

---

## Next steps

1. **Deploy** the current repo `index.html` to the live server (so the modal script and button are present).
2. **Re-run** Playwright:
   ```bash
   npx playwright test tests/signin_login_box_location.spec.ts
   ```
3. All three tests should pass and screenshots in `screenshots/` will confirm:
   - `signin_location_01_button_visible.png` — trigger in top-right.
   - `signin_location_02_login_box_open.png` — modal open with Google + email.
   - `signin_location_03_modal_position.png` — modal centered.

Screenshots from the last remote run: `signin_location_01_button_visible.png` (PASS); test 2/3 failure screenshots in `test-results/` (modal missing because live index is old).
