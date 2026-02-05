# DEPLOYMENT GUIDE: Fix Overlapping Text on FavCreators Banner

## Summary
Fixed the overlapping text issue on the FavCreators banner at `https://findtorontoevents.ca/index.html`

## Problem
When hovering over the FavCreators banner, two text elements were overlapping:
1. Banner text: "Track creators across TikTok, Twitch, Kick & YouTube"
2. Tooltip text: "Track your favorite creators across TikTok, Twitch, Kick and YouTube..."

## Root Cause
Conflicting CSS hover selectors that both triggered simultaneously, causing the expanded banner text and the tooltip to appear in the same visual space.

## Files Modified
- `index.html` - Lines 157-189 (CSS style block)

## Changes Made

### 1. Removed conflicting CSS selectors (Lines 168-173)
**Before:**
```css
/* Show tooltips on hover */
.group:hover .group-hover\:visible {
  visibility: visible !important;
}
.group:hover .group-hover\:opacity-100 {
  opacity: 1 !important;
}
```

**After:**
```css
/* FIX: Only expand banner text, don't force tooltip visibility */
/* The group-hover classes in HTML handle tooltip visibility */
```

### 2. Added solid background to tooltips (Lines 170-177)
```css
/* FIX: Ensure tooltip has solid background to prevent text bleed-through */
.favcreators-promo .absolute,
.stocks-promo .absolute,
.movieshows-promo .absolute,
.windows-fixer-promo .absolute {
  background: rgba(30, 30, 40, 0.98) !important;
  backdrop-filter: blur(10px) !important;
}
```

### 3. Fixed FavCreators tooltip positioning (Lines 179-184)
```css
/* FIX: Position FavCreators tooltip lower to avoid overlap with expanded text */
.favcreators-promo .absolute {
  top: calc(100% + 8px) !important;
  right: 0 !important;
  min-width: 280px;
}
```

### 4. Added overflow protection (Lines 186-189)
```css
/* FIX: Ensure banner text doesn't overflow into tooltip space */
.favcreators-promo .override-overflow {
  overflow: hidden !important;
}
```

## Deployment Steps

1. **Upload the modified `index.html` to the server:**
   ```bash
   # Using FTP/SFTP
   sftp user@findtorontoevents.ca
   put index.html /
   
   # Or using SCP
   scp index.html user@findtorontoevents.ca:/var/www/html/
   ```

2. **Verify the fix:**
   - Navigate to `https://findtorontoevents.ca/index.html`
   - Hover over the FavCreators banner
   - Confirm the banner text and tooltip are no longer overlapping
   - Test on mobile (touch devices) to ensure tooltips don't interfere with scrolling

3. **Clear cache if necessary:**
   - CloudFlare: Purge cache from dashboard
   - Browser: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Testing Checklist

- [ ] Banner text is visible on hover
- [ ] Tooltip appears below the banner (not overlapping)
- [ ] Both texts are readable
- [ ] Mobile: Tooltips don't appear on touch (or appear on tap only)
- [ ] Other banners (Stocks, Movies, Windows Fixer) still work correctly
- [ ] No console errors related to banners

## Related Console Issues (Not Fixed, Low Priority)

The following console issues were observed but are **NOT** part of this fix:

1. **React Hydration Error (#418)** - Minified React error, likely hydration mismatch
2. **AdSense 400 Errors** - Invalid AdSense configuration
3. **MutationObserver Error** - Browser extension issue (ad blocker)

These don't affect the overlapping text fix and can be addressed separately.

## Rollback

If issues occur, restore from backup:
```bash
# If backup exists
cp index.html.backup index.html
```

Or revert the specific CSS changes by removing lines 170-189 from the style block.

---

**Deployer:** [Your Name]
**Date:** 2026-02-05
**Priority:** HIGH
**Risk:** LOW (CSS-only changes)
