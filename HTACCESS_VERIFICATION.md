# .htaccess verification for findtorontoevents.ca

FTP site: **https://findtorontoevents.ca** (document root = repo root when deployed).

**FTP deploy rule:** All deploy scripts write **only** under `findtorontoevents.ca/` (or `FTP_REMOTE_PATH`). They must **never** write to the FTP account root (no bare `stats`, `fc`, `api`, `index.html`, etc. at root). See `tools/deploy_to_ftp.py` (default `FTP_REMOTE_PATH=findtorontoevents.ca`).

## Root `/` (repo root `.htaccess`)

- **Purpose:** Main rules for findtorontoevents.ca document root.
- **RewriteBase:** `/`
- **API:** `^api/` — pass through (no rewrite); `api/*.php` runs (Google OAuth, etc.).
- **Info disclosure:** `^services/users/` → `/` (301).
- **Stats:** `^stats/?$` → `stats/index.html` (serve `/stats` and `/stats/` at root).
- **Redirects to /stats/:** `debug`, `info`, `details`, `events`, `events_summary` → `/stats/` (301).
- **Chunk JS:** `_next/static/` and `next/_next/` — pass through.
- **Home:** `^$` → `index.html` (301).
- **FavCreators /fc:** `^fc/?$` → `fc/index.html`; `^fc/(.+)$` → `fc/$1`. Requires a physical `fc/` directory on the server (e.g. populated from `favcreators/docs/` on deploy).
- **next/static:** Compatibility rewrites to `_next/static/`.

## `/api` and `/api/events`

- **`api/.htaccess`:** Deny access to `.env`.
- **`api/events/.htaccess`:** Deny access to `.env` and `.env.example`.

## `/fc` (findtorontoevents.ca/fc)

- No `.htaccess` inside `favcreators/` in the repo. The `/fc` URL is handled entirely by the **root** `.htaccess` (rules above). The server must have a directory `fc/` (e.g. contents of `favcreators/docs/`) so that `fc/index.html`, `fc/events-router.php`, `fc/api/`, etc. exist.

## Other .htaccess (MOVIES, TV, etc.)

- **MOVIES, TV, SHOWS, TVFINDER** (and TORONTOEVENTS_ANTIGRAVITY copies): Redirect to `https://findtorontoevents.ca/MOVIESHOWS/`.
- **DEPLOY/.htaccess:** Alternate deploy layout (js-proxy, Favcreators aliases). Use when deploying from DEPLOY.
- **tdotevent-fix/.htaccess:** Reference for tdotevent.ca (RewriteBase `/`, services/users redirect).

## Checklist for findtorontoevents.ca

1. Root `.htaccess` is in the document root on the server.
2. `stats/` directory exists with `stats/index.html` → **https://findtorontoevents.ca/stats** and **https://findtorontoevents.ca/stats/** work.
3. `fc/` directory exists on the server (e.g. from favcreators/docs) → **https://findtorontoevents.ca/fc/** and **https://findtorontoevents.ca/fc/api/...** work.
4. `api/` directory exists with PHP scripts and `api/.htaccess` → **https://findtorontoevents.ca/api/...** works.
