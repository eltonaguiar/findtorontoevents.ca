# MovieShows Deployment Package - 2026-02-03

## Quick Fixes Ready for Deployment

This package contains all the files needed to deploy the MovieShows backend and quick fixes.

## Files to Upload

### 📁 Upload to `/findtorontoevents.ca/MOVIESHOWS/api/`

**New API Files:**
- ✅ `queue.php` - User queue management
- ✅ `preferences.php` - User preferences
- ✅ `playlists.php` - Playlist sharing

**Existing Files (no changes needed):**
- `db-config.php`
- `movies.php`
- `trailers.php`

### 📁 Upload to `/findtorontoevents.ca/MOVIESHOWS/database/`

**Updated Files:**
- 🔄 `schema.sql` - **REPLACE** with updated version (includes 4 new tables)
- ✅ `init-db.php` - Database initialization

## Deployment Steps

### Step 1: Backup Remote Files (IMPORTANT!)

Before uploading, manually download the current `/findtorontoevents.ca/MOVIESHOWS/` directory via FTP client.

**Recommended FTP Clients:**
- FileZilla
- WinSCP
- Cyberduck

**Connection Details:**
- Host: `ftps2.50webs.com`
- Port: `22` (SFTP) or `21` (FTP)
- Username: (from `.env` file)
- Password: (from `.env` file)

### Step 2: Upload New Files

**Upload these files:**

```
Local Path → Remote Path
─────────────────────────────────────────────────────────────
MOVIESHOWS/api/queue.php → /findtorontoevents.ca/MOVIESHOWS/api/queue.php
MOVIESHOWS/api/preferences.php → /findtorontoevents.ca/MOVIESHOWS/api/preferences.php
MOVIESHOWS/api/playlists.php → /findtorontoevents.ca/MOVIESHOWS/api/playlists.php
database/schema.sql → /findtorontoevents.ca/MOVIESHOWS/database/schema.sql
```

### Step 3: Initialize Database

Visit this URL in your browser:
```
https://findtorontoevents.ca/MOVIESHOWS/database/init-db.php
```

This will create the 4 new tables:
- `user_queues`
- `user_preferences`
- `shared_playlists`
- `playlist_items`

### Step 4: Verify Deployment

Test the new APIs:

```bash
# Test queue API
curl https://findtorontoevents.ca/MOVIESHOWS/api/queue.php

# Test preferences API
curl https://findtorontoevents.ca/MOVIESHOWS/api/preferences.php

# Test playlists API
curl https://findtorontoevents.ca/MOVIESHOWS/api/playlists.php
```

Expected response: `{"error":"Not authenticated"}` (this is correct!)

### Step 5: Run Quick Fixes (Optional)

After deployment, you can run these scripts locally to improve content:

```bash
# Discover missing trailers
npm run movies:discover

# Populate more content (2026-2015)
npm run movies:bulk
```

## What's Being Deployed

### Backend APIs (3 new files)

1. **queue.php** - Queue Management
   - Get user queue
   - Add/remove movies
   - Reorder queue
   - Mark as watched
   - Sync from localStorage

2. **preferences.php** - User Settings
   - Rewatch enabled
   - Auto-play
   - Sound on scroll

3. **playlists.php** - Playlist Sharing
   - Create shareable playlists
   - Generate unique share codes
   - Copy playlists to queue
   - Track views

### Database Schema Updates

**New Tables:**
- `user_queues` - Persistent queue storage
- `user_preferences` - User settings
- `shared_playlists` - Shareable playlists
- `playlist_items` - Playlist contents

## Troubleshooting

### If init-db.php shows errors:

1. Check database credentials in `db-config.php`
2. Ensure MySQL database exists
3. Verify database user has CREATE TABLE permissions

### If APIs return 404:

1. Verify files uploaded to correct directory
2. Check file permissions (should be 644)
3. Ensure `.htaccess` allows PHP execution

### If APIs return 500:

1. Check PHP error logs
2. Verify database connection in `db-config.php`
3. Ensure all required tables exist

## Rollback Procedure

If something goes wrong:

1. Restore backed up files from your local backup
2. Re-upload original files via FTP
3. Contact support if database needs restoration

## GitHub Backup

A backup branch has been created:
```
backup-before-movieshows-deployment-2026-02-03
```

You can restore from this branch if needed:
```bash
git checkout backup-before-movieshows-deployment-2026-02-03
```

## Support

If you encounter issues:
1. Check `TEST_RESULTS.md` for known issues
2. Review `ALTERNATIVE_TRAILERS.md` for trailer system docs
3. See `DATABASE_README.md` for API documentation

---

**Deployment Date:** 2026-02-03  
**Version:** 0.5.0  
**Status:** Ready for deployment ✅
