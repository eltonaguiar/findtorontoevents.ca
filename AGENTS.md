# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a monorepo for **findtorontoevents.ca** — a multi-product platform including a Toronto events site, FavCreators tracker, VR experience, Game Arena, stock tools, and more. The main development workflow uses a custom Python dev server that mimics the production PHP environment.

### Dev Server

- **Primary dev server**: `python tools/serve_local.py` (port 5173). This serves the entire site locally, mocking PHP APIs. Do NOT use `python -m http.server`.
- Main site: `http://localhost:5173/`
- FavCreators: `http://localhost:5173/fc/#/guest`
- VR Hub: `http://localhost:5173/vr/` (requires HTTPS for full WebXR; HTTP shows security warning)

### Lint

- **Next.js 16 removed `next lint`**. The `npm run lint` script in `TORONTOEVENTS_ANTIGRAVITY/` will fail. Use `npx eslint .` directly if needed (note: it can be slow on the full directory).
- FavCreators lint: `cd favcreators_source && npm run lint` — has pre-existing warnings/errors.

### Tests

- **Playwright E2E** (root): `npx playwright test <spec-file> --project="Desktop Chrome"`. The Playwright config auto-starts `python tools/serve_local.py` as webServer.
- **Vitest unit tests** (TORONTOEVENTS_ANTIGRAVITY): `cd TORONTOEVENTS_ANTIGRAVITY && npx vitest run`. Note: MOVIESHOWS3 tests require a separate server at localhost:80 and will fail in the standard dev setup — this is expected.

### Package Manager

All sub-projects use **npm** (lockfiles are `package-lock.json`). Key directories with their own `package.json`:
- `/workspace` (root — Playwright, puppeteer)
- `/workspace/TORONTOEVENTS_ANTIGRAVITY` (Next.js 16, Vitest)
- `/workspace/favcreators_source` (Vite, React)

### Gotchas

- The `TORONTOEVENTS_ANTIGRAVITY/` directory contains mostly pre-built static output (JS chunks, HTML). The Next.js source (app/, pages/) is not present — it was built elsewhere and the output committed.
- The FavCreators built app is served from `favcreators/docs/` — the source is in `favcreators_source/`.
- Mock login for FavCreators: email=`admin`, password=`admin` (handled by serve_local.py).
