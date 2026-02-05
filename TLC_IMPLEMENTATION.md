# TLC - Multi-Platform Live Check Implementation

**Created:** February 4, 2026  
**Updated:** February 4, 2026  
**Endpoint:** `https://findtorontoevents.ca/fc/TLC.php`

## Overview

TLC (The Live Check) is a PHP endpoint that checks if a streamer is currently live across multiple streaming platforms. It uses platform-specific detection methods, multiple verification passes, and proxy fallbacks to ensure accurate results.

## Supported Platforms

| Platform | Status | Detection Method |
|----------|--------|-----------------|
| TikTok | ✅ Full Support | SIGI_STATE JSON parsing, multiple HTML indicators |
| Twitch | ✅ Full Support | JSON-LD `isLiveBroadcast`, og:description |
| Kick | ✅ Full Support | API v1/v2 via proxies, HTML parsing fallback |
| YouTube | ✅ Full Support | `ytInitialPlayerResponse` JSON, video URLs |

## Files

| File | Purpose |
|------|---------|
| `favcreators/docs/TLC.php` | Main source file (deployed to `/fc/TLC.php`) |
| `favcreators/public/TLC.php` | Copy of main file |

## Usage

### By Username + Platform

```
GET https://findtorontoevents.ca/fc/TLC.php?user=USERNAME&platform=PLATFORM
```

**Examples:**
```bash
# TikTok (default if no platform specified)
curl "https://findtorontoevents.ca/fc/TLC.php?user=gabbyvn3&platform=tiktok"
curl "https://findtorontoevents.ca/fc/TLC.php?user=gabbyvn3"  # legacy support

# Twitch
curl "https://findtorontoevents.ca/fc/TLC.php?user=jynxzi&platform=twitch"

# Kick
curl "https://findtorontoevents.ca/fc/TLC.php?user=amandasoliss&platform=kick"

# YouTube (channel)
curl "https://findtorontoevents.ca/fc/TLC.php?user=wavemusic1809&platform=youtube"
```

### By URL (Auto-detects Platform)

```
GET https://findtorontoevents.ca/fc/TLC.php?url=STREAM_URL
```

**Examples:**
```bash
# TikTok URL
curl "https://findtorontoevents.ca/fc/TLC.php?url=https://www.tiktok.com/@gabbyvn3/live"

# Twitch URL
curl "https://findtorontoevents.ca/fc/TLC.php?url=https://www.twitch.tv/jynxzi"

# Kick URL
curl "https://findtorontoevents.ca/fc/TLC.php?url=https://kick.com/amandasoliss"

# YouTube video URL (for live streams)
curl "https://findtorontoevents.ca/fc/TLC.php?url=https://www.youtube.com/watch?v=2Q_MTz0ObVA"

# YouTube channel URL
curl "https://findtorontoevents.ca/fc/TLC.php?url=https://www.youtube.com/@wavemusic1809/live"
```

### Response Format

**Live:**
```json
{
  "user": "jynxzi",
  "platform": "twitch",
  "live": true,
  "method": "isLiveBroadcast_true",
  "checks": "1 live, 0 offline",
  "checked_at": "2026-02-04T22:35:52Z"
}
```

**Offline:**
```json
{
  "user": "pokimane",
  "platform": "twitch",
  "live": false,
  "method": "consensus_offline",
  "checks": "0 live, 2 offline",
  "checked_at": "2026-02-04T22:35:53Z"
}
```

**With Viewers (Kick):**
```json
{
  "user": "amandasoliss",
  "platform": "kick",
  "live": true,
  "method": "kick_api_v1_livestream",
  "checks": "1 api",
  "checked_at": "2026-02-04T22:45:22Z",
  "viewers": 1168
}
```

### Debug Mode

```
GET https://findtorontoevents.ca/fc/TLC.php?user=USERNAME&platform=PLATFORM&debug=1
```

Returns additional `debug` object with detailed check results.

---

## Platform-Specific Detection

### TikTok Detection Methods

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | `sigi_user_status` | SIGI_STATE JSON `user.status` (2=live, 4=offline) |
| 2 | `sigi_room_status` | SIGI_STATE `liveRoom.status` field |
| 3 | `sigi_roomId` | Non-empty roomId (10+ digits) = live |
| 4 | `universal_status` | __UNIVERSAL_DATA__ status field |
| 5 | `regex_roomId` | roomId pattern in raw HTML |
| 6 | `stream_url` | TikTok CDN stream URLs present |

**TikTok Status Codes:**
- `2` = **LIVE** - User is currently streaming
- `4` = **OFFLINE** - User is not streaming

### Twitch Detection Methods

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | `isLiveBroadcast_true` | JSON-LD schema `isLiveBroadcast: true` |
| 2 | `isLiveBroadcast_false` | JSON-LD schema `isLiveBroadcast: false` |
| 3 | `og_desc_stream_title` | og:description contains stream title pattern |
| 4 | `viewer_count` | Viewer count found in HTML |
| 5 | `offline_message` | "is offline" text present |

### Kick Detection Methods

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | `kick_api_v2_is_live` | API v2 `is_live: true/false` field |
| 2 | `kick_api_v1_livestream` | API v1 `livestream` object present |
| 3 | `kick_api_*_no_stream` | API returns `livestream: null` |
| 4 | `kick_nextdata_*` | __NEXT_DATA__ JSON parsing |
| 5 | `kick_html_livestream_*` | HTML JSON pattern matching |
| 6 | `kick_html_*_badge` | Text "LIVE" or "OFFLINE" badges |

**Kick API Endpoints (tried via proxy):**
- `https://kick.com/api/v2/channels/{username}` (newer)
- `https://kick.com/api/v1/channels/{username}` (original)

### YouTube Detection Methods

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | `yt_videoDetails_isLive` | `ytInitialPlayerResponse.videoDetails.isLive: true` |
| 2 | `yt_isLiveContent` | `videoDetails.isLiveContent: true` |
| 3 | `yt_liveStreamability` | `playabilityStatus.liveStreamability` present |
| 4 | `yt_jsonld_live` | JSON-LD `isLiveBroadcast: true` |
| 5 | `yt_isLive_true` | Raw `"isLive":true` pattern |
| 6 | `yt_live_badge` | `BADGE_STYLE_TYPE_LIVE_NOW` present |

**YouTube URL Support:**
- Channel URLs: `youtube.com/@username/live`
- Video URLs: `youtube.com/watch?v=VIDEO_ID`
- Short URLs: `youtu.be/VIDEO_ID`

---

## Anti-Blocking Features

### User-Agent Rotation
Rotates through multiple browser User-Agents:
- Chrome (Windows)
- Safari (Mac)
- Firefox (Windows)

### Proxy Fallbacks
If direct fetch fails, tries these proxy services:
- `api.allorigins.win`
- `corsproxy.io`
- `api.codetabs.com`

### Cache Busting
- Adds random `_cb` parameter to URLs
- Sets `Cache-Control: no-cache` headers
- Forces fresh connections with CURL

---

## Verification Strategy

1. **Multiple Passes:** Performs 2 verification checks (configurable)
2. **Early Exit:** Stops immediately when LIVE is detected
3. **Consensus:** If no LIVE detected, reports offline after offline confirmations
4. **Fallback Chain:** Direct fetch → Proxy services

---

## Architecture

```
Request: /fc/TLC.php?user=USERNAME&platform=PLATFORM
           │
           ▼
    ┌──────────────┐
    │ Parse Input  │──► URL provided? Extract platform & user
    │ & Validate   │──► Default platform = tiktok (legacy)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Platform     │
    │ Router       │
    └──────┬───────┘
           │
     ┌─────┴─────┬─────────┬──────────┐
     ▼           ▼         ▼          ▼
  TikTok      Twitch     Kick      YouTube
  Detection   Detection  Detection Detection
     │           │         │          │
     └─────┬─────┴─────────┴──────────┘
           │
           ▼
    ┌──────────────┐
    │ Return JSON  │
    │ Response     │
    └──────────────┘
```

---

## Testing

### Quick Test Commands

```bash
# TikTok
curl "https://findtorontoevents.ca/fc/TLC.php?user=gabbyvn3"

# Twitch (live user)
curl "https://findtorontoevents.ca/fc/TLC.php?user=jynxzi&platform=twitch"

# Twitch (offline user)
curl "https://findtorontoevents.ca/fc/TLC.php?user=pokimane&platform=twitch"

# Kick (live user)
curl "https://findtorontoevents.ca/fc/TLC.php?user=amandasoliss&platform=kick"

# Kick (offline user)
curl "https://findtorontoevents.ca/fc/TLC.php?user=nataliereynolds&platform=kick"

# YouTube (channel - offline)
curl "https://findtorontoevents.ca/fc/TLC.php?user=tobedeleted2030&platform=youtube"

# YouTube (video URL - live stream)
curl "https://findtorontoevents.ca/fc/TLC.php?url=https://www.youtube.com/watch?v=2Q_MTz0ObVA"
```

### PowerShell Test

```powershell
Invoke-WebRequest -Uri "https://findtorontoevents.ca/fc/TLC.php?user=jynxzi&platform=twitch" | Select -Expand Content | ConvertFrom-Json
```

---

## Deployment

```bash
# Copy and deploy
Copy-Item "favcreators/docs/TLC.php" "favcreators/public/TLC.php" -Force
python tools/deploy_to_ftp.py
```

---

## Key Learnings

1. **TikTok:** SIGI_STATE JSON is most reliable; "LIVE has ended" text is always present (unreliable)
2. **Twitch:** JSON-LD `isLiveBroadcast` field is definitive
3. **Kick:** Heavily blocks bots; API via proxy is most reliable, HTML parsing as fallback
4. **YouTube:** `ytInitialPlayerResponse` embedded JSON is authoritative; supports video URLs
5. **General:** Multiple detection methods and proxy fallbacks ensure reliability

---

## IMPORTANT: Modification Guidelines

When making changes to TLC.php:

1. **Read this document first**
2. **Preserve platform-specific detection functions** - Each platform has unique patterns
3. **Keep the multi-pass verification logic** - Prevents false negatives
4. **Maintain proxy fallbacks** - Handles platform blocking
5. **Test with BOTH live AND offline users** for each platform before deploying
6. **Use debug mode** (`?debug=1`) to verify detection methods

---

## API Reference

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `user` | Yes* | Username/handle on the platform |
| `platform` | No | Platform: `tiktok`, `twitch`, `kick`, `youtube`. Default: `tiktok` |
| `url` | Yes* | Full stream URL (auto-detects platform and user) |
| `debug` | No | Set to `1` for detailed debug output |

*Either `user` or `url` must be provided.

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | string | Username/identifier checked |
| `platform` | string | Platform checked |
| `live` | boolean/null | `true` = live, `false` = offline, `null` = undetermined |
| `method` | string | Detection method that determined the result |
| `checks` | string | Summary of check results |
| `checked_at` | string | ISO 8601 timestamp |
| `viewers` | number | (Optional) Viewer count if available |
| `debug` | object | (Optional) Detailed check results when `debug=1` |

### Error Response

```json
{
  "error": "Missing user or url parameter",
  "usage": {
    "by_user": "/fc/TLC.php?user=USERNAME&platform=PLATFORM",
    "by_url": "/fc/TLC.php?url=STREAM_URL",
    "platforms": ["tiktok", "twitch", "kick", "youtube"]
  }
}
```
