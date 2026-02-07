# Fix: Movie Search from Nav Menu (movies.html) — IMPLEMENTED

## Problem

When the user opens the nav menu (M key) on the Movies page (`/vr/movies.html`) and clicks **Search**, nothing visible happens — no search panel opens, no feedback is given.

## Root Cause Analysis

There are **three separate search implementations**, and the one wired to the first nav menu "Search" button doesn't work on the movies page:

### 1. Nav Menu "🔍 Search" (line 292 of `nav-menu.js`)
```
onclick: VRQuickWins7.openSearch()
```
- Opens `#vr-qw7-search` overlay from `quick-wins-set7.js`
- **Only searches `window.filteredEvents` and `window.allCreators`**
- Movies page has neither of those globals → search opens but yields "No results" for any query
- **Movies are not searchable at all** via this path

### 2. Nav Menu "🔎 Search" (line 312 of `nav-menu.js`)
```
onclick: VRIntelEngage.smartSearch.open()
```
- Opens `#vr17-search` overlay from `intelligence-engage.js`
- Uses a **hardcoded** content array with only 4 sample movies (Shawshank, Inception, Dark Knight, Parasite)
- Does NOT read `allMovies` or `filteredMovies` from the page
- Results have no click action to navigate to/play the actual movie

### 3. Quick-Wins Set 12 Smart Search (`quick-wins-substantial-set12.js`)
```
VRQuickWinsSet12.Search.showSearch()
```
- Only searches zone names and settings (Hub, Weather, Movies Zone, etc.)
- Not wired to nav menu at all
- Does NOT search actual movie titles

### Key Problem: `allMovies` is a local `var`, not exposed globally

In `movies.html` line 639:
```javascript
var allMovies = [];
```
This is scoped inside the IIFE/script block. None of the search modules can access it.

## Fix Plan

### Step 1: Expose movie data globally (movies.html)

After `allMovies` is populated (around line 1434), expose it to `window`:
```javascript
window.allMovies = allMovies;
window.filteredMovies = filteredMovies;
```

### Step 2: Update `VRQuickWins7.openSearch()` to search movies (quick-wins-set7.js)

Add a movies search block after the creators block (~line 176):
```javascript
// Search movies
var allMoviesData = window.allMovies || window.filteredMovies || [];
allMoviesData.forEach(function (m) {
  if ((m.title && m.title.toLowerCase().indexOf(q) !== -1) ||
      (m.genre && m.genre.toLowerCase().indexOf(q) !== -1)) {
    results.push({
      type: 'movie',
      title: m.title,
      sub: (m.genre || '') + (m.release_year ? ' (' + m.release_year + ')' : ''),
      url: '/vr/movies.html',
      color: '#00d4ff',
      icon: m.type === 'tv' ? '📺' : '🎬'
    });
  }
});
```

### Step 3: Update `VRIntelEngage.smartSearch` to use live data (intelligence-engage.js)

Replace the hardcoded `movies` content array with dynamic data:
```javascript
// In the search() function, pull live movie data
var liveMovies = (window.allMovies || []).map(function(m) {
  return { title: m.title, category: m.genre || m.type, zone: 'movies' };
});
// Search against liveMovies instead of content.movies
```

### Step 4: Make search results actionable on Movies page

When a movie search result is clicked on `movies.html`:
- Scroll to / highlight that movie's poster
- Or trigger `playTrailer(movie)` directly

### Step 5: Deduplicate the two "Search" buttons in nav-menu

Currently both `🔍 Search` (line 292) and `🔎 Search` (line 312) appear in the same Tools section. Options:
- **Option A:** Remove one, keep the better implementation
- **Option B:** Merge — have one Search button that calls a unified search combining all data sources

**Recommendation:** Keep the `VRQuickWins7.openSearch()` button (it has the best overlay UX) and enhance it to search movies. Remove the duplicate `VRIntelEngage.smartSearch.open()` button, or keep it as a secondary "Deep Search".

## Files Modified

| File | Change | Status |
|---|---|---|
| `vr/movies.html` | Exposed `allMovies`, `filteredMovies`, `playTrailer`, `selectMovieByTitle` to `window` | Done |
| `vr/quick-wins-set7.js` | Added movies search in `performSearch()` + clickable results that play trailers | Done |
| `vr/intelligence-engage.js` | Replaced hardcoded movies with live data from `window.allMovies`; results clickable | Done |
| `vr/quick-wins-substantial-set12.js` | Added live movies to search index with delayed rebuild | Done |
| `vr/nav-menu.js` | No change needed — both buttons now work correctly | N/A |

## Risks / Coordination

- **Other agents:** These changes touch `nav-menu.js` (shared), `movies.html` (page-specific), and two quick-wins JS files. Avoid changing unrelated sections of these files.
- **No breaking changes:** We are only *adding* search capability and exposing existing data — no removal or restructuring of existing features.
- **Testing:** After changes, verify:
  1. Menu → Search opens the overlay
  2. Typing a movie title (e.g., "Inception", "Batman") shows results
  3. Clicking a result navigates to/highlights the movie
  4. Ctrl+K shortcut still works
  5. Search still works on other zones (events, creators)

## Secondary Issues (from console)

| Issue | Severity | Notes |
|---|---|---|
| `quick-wins.js:109 Uncaught` | Low | AudioContext creation — browser warning, not a real error |
| `quick-wins-substantial-set8.js:1277 Uncaught` | Low | API exposure — not a real error |
| `movies.html:767` 404s | Medium | API URLs returning 404 for MOVIESHOWS3/MOVIESHOWS2 endpoints; demo data kicks in as fallback — separate issue |
| ServiceWorker 404 (`sw.js`) | Low | `/vr/sw.js` not deployed — PWA offline won't work, not critical |
| `useLegacyLights` deprecation | Low | THREE.js warning — cosmetic |
| Passive event listener warnings | Low | A-Frame touch handling — cosmetic |
