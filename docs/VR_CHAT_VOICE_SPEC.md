# VR Chat & Voice Module - Technical Specification

## Executive Summary

This document outlines the architecture and implementation plan for adding real-time text chat and proximity-based voice chat to the findtorontoevents.ca VR experience. The system will integrate with existing `presence.js`, `nav-menu.js`, and `vr-controls.js` modules.

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    VR Chat & Voice System                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Text Chat   │  │ Voice Chat   │  │   Presence Manager   │  │
│  │  (Socket.io) │  │  (PeerJS)    │  │  (WebSocket + LS)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                     │              │
│         └─────────────────┼─────────────────────┘              │
│                           │                                    │
│  ┌────────────────────────┴────────────────────────┐           │
│  │           VR UI Integration Layer                │           │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐   │           │
│  │  │ 2D Chat  │ │ 3D Chat  │ │ Voice Controls │   │           │
│  │  │  Overlay │ │  Panels  │ │   (PTT/Mute)   │   │           │
│  │  └──────────┘ └──────────┘ └────────────────┘   │           │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WebSocket Server (Node.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Chat Rooms  │  │  Signaling   │  │   Presence Hub       │  │
│  │  Namespace   │  │  (PeerJS)    │  │   (Redis/SQLite)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Diagram

```
User A (Events Zone)          WebSocket Server          User B (Movies Zone)
      │                              │                           │
      │── join_room("events") ───────▶│                           │
      │                              │◀── join_room("movies") ─────│
      │                              │                           │
      │── send_message() ───────────▶│                           │
      │                              │── broadcast_to_room() ────▶│
      │                              │                           │
      │◀── receive_message() ────────│◀── send_message() ─────────│
      │                              │                           │
      │── WebRTC offer ─────────────▶│── relay_signaling() ─────▶│
      │◀── WebRTC answer ────────────│◀── WebRTC answer ──────────│
      │                              │                           │
      │◀── ICE candidates ───────────│◀── ICE candidates ─────────│
      │                              │                           │
      │◀── proximity_audio_stream ───│                           │
```

---

## 2. Module Specifications

### 2.1 Chat Engine (`chat-engine.js`)

**Purpose:** Text chat with room-based messaging

**Key Features:**
- Room-based chat (per VR zone)
- Message history (last 50 messages per room)
- User presence indicators (typing, online)
- Message reactions (emoji)
- @mentions support

**API Interface:**
```javascript
// ChatEngine API
ChatEngine.joinRoom(zoneId, userInfo);
ChatEngine.leaveRoom(zoneId);
ChatEngine.sendMessage(zoneId, message, options);
ChatEngine.onMessage(callback);
ChatEngine.onUserJoin(callback);
ChatEngine.onUserLeave(callback);
ChatEngine.getHistory(zoneId, limit);
```

**Quest 3 Optimizations:**
- Message batching (max 10 messages per frame)
- Virtual keyboard integration
- Voice-to-text fallback
- Quick-reply gestures

### 2.2 Voice Engine (`voice-engine.js`)

**Purpose:** Proximity-based WebRTC voice chat

**Key Features:**
- Mesh network topology (max 8 concurrent peers)
- Spatial audio positioning
- Voice activity detection (VAD)
- Push-to-talk (PTT) support
- Mute/unmute controls
- Volume normalization

**API Interface:**
```javascript
// VoiceEngine API
VoiceEngine.init(userId, options);
VoiceEngine.joinZone(zoneId);
VoiceEngine.leaveZone(zoneId);
VoiceEngine.setMute(muted);
VoiceEngine.setPushToTalk(enabled);
VoiceEngine.setProximityRadius(meters);
VoiceEngine.onPeerConnect(callback);
VoiceEngine.onPeerDisconnect(callback);
VoiceEngine.onAudioLevel(callback); // For VU meters
```

**Quest 3 Optimizations:**
- Opus codec at 16-24 kbps
- Audio culling beyond 10m
- Suspend streams on focus loss
- Hardware echo cancellation

### 2.3 Presence Manager Extension

**Purpose:** Extend existing `presence.js` with real-time multi-user support

**Key Features:**
- WebSocket-based presence (upgrade from localStorage)
- User profile integration (avatar, display name)
- Mic status indicators
- Zone-based presence grouping
- Friend list support

**Integration Points:**
```javascript
// Extend presence.js
PresenceManager.upgradeToWebSocket(wsUrl);
PresenceManager.setUserInfo({ id, name, avatar });
PresenceManager.setMicStatus(isMuted);
PresenceManager.getUsersInZone(zoneId);
PresenceManager.onPresenceUpdate(callback);
```

---

## 3. UI/UX Specifications

### 3.1 2D Chat Overlay (Desktop/Mobile)

**Layout:**
- Collapsible chat drawer (right side)
- Message bubbles with user avatars
- Input field with emoji picker
- Zone selector dropdown
- Voice controls (mute, PTT, volume)

**Keyboard Shortcuts:**
- `T` - Focus chat input
- `Enter` - Send message
- `Shift+Enter` - New line
- `V` - Toggle voice mute
- `B` - Push-to-talk (hold)

### 3.2 3D Chat Panels (VR)

**Layout:**
- Curved chat panel attached to non-dominant hand
- Floating message bubbles in world space
- Proximity-based voice indicators (3D spatial icons)
- Virtual keyboard for text input
- Quick gesture replies (thumbs up, wave)

**VR Interactions:**
- Point at message to reply
- Grab panel to reposition
- Pinch to scroll message history
- Double-tap controller to toggle mute

### 3.3 Voice UI Elements

**Visual Indicators:**
- Mic status icon (muted/unmuted)
- Voice activity VU meter
- Proximity radius visualization
- Peer connection status dots

**Controller Bindings:**
- Left grip + A button = Push-to-talk
- Right B button = Toggle mute
- Both thumbsticks press = Toggle voice panel

---

## 4. Server Architecture

### 4.1 WebSocket Server (`server/chat-server.js`)

**Technology Stack:**
- Node.js + Socket.io
- Redis for presence/pub-sub (optional)
- SQLite for message persistence
- PeerJS server for WebRTC signaling

**Namespaces:**
- `/chat` - Text messaging
- `/presence` - User presence updates
- `/signal` - WebRTC signaling

**Room Management:**
```javascript
// Room structure
{
  roomId: "events",           // Zone identifier
  users: [userId],            // Active users
  messages: [],               // Message history
  maxHistory: 50,             // Message retention
  voiceEnabled: true,         // Voice chat allowed
  createdAt: timestamp
}
```

### 4.2 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT,
  user_id TEXT,
  content TEXT,
  type TEXT DEFAULT 'text', -- text, system, reaction
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Presence table
CREATE TABLE presence (
  user_id TEXT PRIMARY KEY,
  room_id TEXT,
  mic_muted BOOLEAN DEFAULT 1,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 5. Integration Points

### 5.1 Existing Module Updates

**presence.js Updates:**
```javascript
// Add to presence.js
var wsConnection = null;
var isWebSocketMode = false;

function upgradeToWebSocket(url) {
  wsConnection = new WebSocket(url);
  isWebSocketMode = true;
  // ... connection handling
}

function setMicStatus(muted) {
  micMuted = muted;
  if (isWebSocketMode && wsConnection) {
    wsConnection.send(JSON.stringify({
      type: 'mic_status',
      muted: muted
    }));
  }
}
```

**nav-menu.js Updates:**
```javascript
// Add chat toggle to menu
var chatMenuItem = {
  label: 'Toggle Chat',
  action: 'toggleChat',
  icon: '💬'
};

// Add to SECTION_ACTIONS
SECTION_ACTIONS.all.push(chatMenuItem);

// Add voice status indicator
function updateVoiceStatus() {
  var statusEl = document.getElementById('vr-voice-status');
  if (statusEl) {
    statusEl.setAttribute('color', VoiceEngine.isMuted() ? '#ef4444' : '#22c55e');
  }
}
```

**vr-controls.js Updates:**
```javascript
// Add voice controls to controller bindings
function wireController(el, hand) {
  // ... existing code ...
  
  // B button = toggle mute (right hand)
  el.addEventListener('bbuttondown', function() {
    if (hand === 'right') {
      VoiceEngine.toggleMute();
    }
  });
  
  // Grip + A = push-to-talk
  var gripPressed = false;
  el.addEventListener('gripdown', function() { gripPressed = true; });
  el.addEventListener('gripup', function() { 
    gripPressed = false;
    VoiceEngine.setPushToTalk(false);
  });
  el.addEventListener('abuttondown', function() {
    if (gripPressed) VoiceEngine.setPushToTalk(true);
  });
}
```

### 5.2 Zone Integration

All VR zones must include:
```html
<!-- In each zone's HTML -->
<script src="/vr/chat-engine.js"></script>
<script src="/vr/voice-engine.js"></script>
<script>
  // Initialize for current zone
  ChatEngine.joinRoom('events', userInfo);
  VoiceEngine.joinZone('events');
</script>
```

---

## 6. Security & Privacy

### 6.1 Consent Flow

```javascript
// First-time voice chat consent
function showVoiceConsent() {
  if (!localStorage.getItem('vr_voice_consent')) {
    showModal({
      title: 'Enable Voice Chat?',
      content: 'Voice chat uses your microphone. You can mute anytime.',
      actions: [
        { label: 'Enable', action: () => enableVoiceChat() },
        { label: 'Text Only', action: () => disableVoiceChat() }
      ]
    });
  }
}
```

### 6.2 Privacy Controls

- Default mute on entry
- Block/mute specific users
- Zone-specific opt-out
- Data retention limits (24h for messages)

---

## 7. Quest 3 Performance Optimizations

### 7.1 Audio Optimization

```javascript
// VoiceEngine configuration
var VOICE_CONFIG = {
  codec: 'opus',
  bitrate: 16000,        // 16 kbps
  sampleRate: 24000,     // 24 kHz
  channels: 1,           // Mono
  frameSize: 20,         // 20ms frames
  maxPeers: 8,           // Concurrent connections
  cullDistance: 10,      // Mute beyond 10m
  suspendOnBlur: true    // Pause when tab inactive
};
```

### 7.2 Rendering Optimization

- Chat panel: Max 20 visible messages
- Message pooling for bubbles
- LOD for distant voice indicators
- Throttle presence updates (5s interval)

---

## 8. Implementation Phases

### Phase 1A: Foundation (Week 1)
- [ ] Set up WebSocket server
- [ ] Implement chat-engine.js
- [ ] Basic 2D chat UI
- [ ] Integration with presence.js

### Phase 1B: Voice Foundation (Week 2)
- [ ] Implement voice-engine.js
- [ ] PeerJS integration
- [ ] Basic voice UI
- [ ] Controller bindings

### Phase 1C: VR Integration (Week 3)
- [ ] 3D chat panels
- [ ] Spatial audio
- [ ] Virtual keyboard
- [ ] Gesture controls
- [ ] Testing & optimization

---

## 9. Testing Checklist

### 9.1 Functional Testing
- [ ] Join/leave rooms
- [ ] Send/receive messages
- [ ] Message history
- [ ] Voice connect/disconnect
- [ ] Mute/unmute
- [ ] Push-to-talk
- [ ] Proximity audio
- [ ] Cross-zone presence

### 9.2 Quest 3 Specific
- [ ] Performance at 72fps
- [ ] Audio quality in VR
- [ ] Controller bindings
- [ ] Comfort in long sessions
- [ ] Battery impact

### 9.3 Edge Cases
- [ ] Network disconnection
- [ ] Rapid zone switching
- [ ] 8+ concurrent voice peers
- [ ] Background tab behavior
- [ ] Multiple tabs open

---

## 10. API Endpoints

```
WebSocket: wss://findtorontoevents.ca/ws

REST API:
GET  /api/chat/rooms              - List available rooms
GET  /api/chat/history/:roomId    - Get message history
POST /api/chat/message            - Send message (fallback)
GET  /api/presence/online         - Get online users
POST /api/users/profile           - Update user profile
```

---

## 11. File Structure

```
/vr/
  chat/
    chat-engine.js          # Core chat logic
    voice-engine.js         # WebRTC voice logic
    chat-ui-2d.js          # Desktop chat overlay
    chat-ui-vr.js          # VR chat panels
    virtual-keyboard.js    # VR text input
    styles.css             # Chat UI styles
  server/
    chat-server.js         # WebSocket server
    signal-server.js       # PeerJS signaling
    database.js            # SQLite wrapper
  components/
    vr-chat-panel.js       # A-Frame chat component
    vr-voice-indicator.js  # Spatial voice UI
```

---

## 12. Success Metrics

- **Performance:** < 100ms message latency, 72fps maintained
- **Audio Quality:** Opus @ 16kbps, < 200ms latency
- **User Engagement:** 30% of users enable voice chat
- **Reliability:** 99.5% message delivery rate
- **Scalability:** Support 100 concurrent users per zone

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**Author:** VR Architecture Team
