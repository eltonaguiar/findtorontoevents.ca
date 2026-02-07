# VR Chat & Voice - Packet Flow Diagrams

## 1. Text Chat Packet Flow

### 1.1 Connection Establishment

```
┌─────────┐                              ┌─────────┐
│ Client  │                              │ Server  │
└────┬────┘                              └────┬────┘
     │                                        │
     │────── WebSocket CONNECT ──────────────▶│
     │                                        │
     │◀───── connection_ack ──────────────────│
     │  { type: "connected", clientId: "..." }│
     │                                        │
     │────── join_room ──────────────────────▶│
     │  {                                     │
     │    type: "join_room",                  │
     │    roomId: "events",                   │
     │    userInfo: {                         │
     │      id: "user_123",                   │
     │      name: "Alice",                    │
     │      avatar: "...",                    │
     │      zone: "events"                    │
     │    }                                   │
     │  }                                     │
     │                                        │
     │◀───── room_joined ─────────────────────│
     │  {                                     │
     │    type: "room_joined",                │
     │    roomId: "events",                   │
     │    users: [...],                       │
     │    history: [...]                      │
     │  }                                     │
     │                                        │
     │◀───── user_joined (broadcast) ─────────│
     │  {                                     │
     │    type: "user_joined",                │
     │    user: { id, name, avatar }          │
     │  }                                     │
```

### 1.2 Message Flow

```
User A (Alice)              Server                 User B (Bob)
     │                        │                        │
     │── send_message ───────▶│                        │
     │  {                     │                        │
     │    type: "chat",       │                        │
     │    roomId: "events",   │                        │
     │    content: "Hello!",  │                        │
     │    timestamp: 1234567  │                        │
     │  }                     │                        │
     │                        │── validate & store ───▶│
     │                        │                        │
     │◀──── message_ack ──────│                        │
     │  {                     │                        │
     │    type: "message_ack",│                        │
     │    messageId: "msg_1", │                        │
     │    status: "delivered" │                        │
     │  }                     │                        │
     │                        │── broadcast_message ──▶│
     │                        │  {                     │
     │                        │    type: "chat",       │
     │                        │    from: "user_123",   │
     │                        │    content: "Hello!",  │
     │                        │    timestamp: 1234567  │
     │                        │  }                     │
     │                        │                        │
     │                        │                        │◀── display
```

### 1.3 Presence Update Flow

```
Client A                    Server                 Client B
     │                        │                        │
     │── presence_update ────▶│                        │
     │  {                     │                        │
     │    type: "presence",   │                        │
     │    userId: "user_123", │                        │
     │    status: "online",   │                        │
     │    zone: "events",     │                        │
     │    micMuted: false     │                        │
     │  }                     │                        │
     │                        │── update Redis/DB ─────│
     │                        │                        │
     │                        │── broadcast ──────────▶│
     │                        │  {                     │
     │                        │    type: "presence",   │
     │                        │    userId: "user_123", │
     │                        │    status: "online",   │
     │                        │    micMuted: false     │
     │                        │  }                     │
     │                        │                        │
     │                        │                        │◀── update UI
```

---

## 2. Voice Chat (WebRTC) Packet Flow

### 2.1 Signaling Flow - Peer Connection

```
Alice                       Server                       Bob
  │                           │                           │
  │── join_voice_zone ───────▶│                           │
  │  { zoneId: "events" }     │                           │
  │                           │                           │
  │◀──── zone_joined ─────────│                           │
  │  { peers: ["bob_id"] }    │                           │
  │                           │                           │
  │                           │◀──── join_voice_zone ─────│
  │                           │                           │
  │                           │──── zone_joined ─────────▶│
  │                           │  { peers: ["alice_id"] }  │
  │                           │                           │
  │                           │                           │
  │◀──── new_peer ────────────│                           │
  │  { peerId: "bob_id" }     │                           │
  │                           │                           │
  │                           │                           │
  │── create_offer ──────────▶│                           │
  │  {                        │                           │
  │    type: "offer",         │                           │
  │    to: "bob_id",          │                           │
  │    sdp: "v=0..."          │                           │
  │  }                        │                           │
  │                           │                           │
  │                           │──── relay_offer ────────▶│
  │                           │  {                        │
  │                           │    type: "offer",         │
  │                           │    from: "alice_id",      │
  │                           │    sdp: "v=0..."          │
  │                           │  }                        │
  │                           │                           │
  │                           │                           │◀── create answer
  │                           │                           │
  │                           │◀──── send_answer ─────────│
  │                           │  {                        │
  │                           │    type: "answer",        │
  │                           │    to: "alice_id",        │
  │                           │    sdp: "v=0..."          │
  │                           │  }                        │
  │                           │                           │
  │◀──── answer ──────────────│                           │
  │  {                        │                           │
  │    type: "answer",        │                           │
  │    from: "bob_id",        │                           │
  │    sdp: "v=0..."          │                           │
  │  }                        │                           │
  │                           │                           │
  │◀── ICE candidate ─────────│                           │
  │── ICE candidate ─────────▶│                           │
  │                           │──── relay ICE ──────────▶│
  │                           │                           │
  │                           │◀──── ICE candidate ───────│
  │                           │──── ICE candidate ──────▶│
  │                           │                           │
  │◀═════════════════════════════════════════════════════│
  │              WebRTC Data Channel Established          │
  │══════════════════════════════════════════════════════▶│
  │              Audio Stream Flowing (Opus)              │
```

### 2.2 Voice State Management

```
Client                      Server
  │                           │
  │── voice_state ───────────▶│
  │  {                        │
  │    type: "voice_state",   │
  │    muted: true/false,     │
  │    speaking: true/false,  │
  │    volume: 0.8            │
  │  }                        │
  │                           │
  │                           │── broadcast to peers
  │                           │
  │◀──── peer_voice_state ────│
  │  {                        │
  │    peerId: "bob_id",      │
  │    muted: false,          │
  │    speaking: true,        │
  │    audioLevel: 0.65       │
  │  }                        │
```

### 2.3 Proximity-Based Audio Culling

```
Alice (position: 0,0,0)     Server
  │                           │
  │── position_update ───────▶│ (every 100ms)
  │  {                        │
  │    type: "position",      │
  │    x: 5.2,                │
  │    y: 1.6,                │
  │    z: 3.1                 │
  │  }                        │
  │                           │
  │                           │── calculate distances
  │                           │   Alice-Bob: 8.5m
  │                           │   Alice-Charlie: 12.3m
  │                           │
  │◀──── audio_cull_update ───│
  │  {                        │
  │    type: "cull_update",   │
  │    audiblePeers: [        │
  │      {                    │
  │        peerId: "bob_id",  │
  │        distance: 8.5,     │
  │        volume: 0.65       │
  │      }                    │
  │    ],                     │
  │    mutedPeers: ["charlie"]│
  │  }                        │
  │                           │
  │── apply spatial audio ───▶│ (client-side)
  │   Bob: volume 0.65        │
  │   Charlie: muted          │
```

---

## 3. Zone Transition Flow

```
User (in Events Zone)       Server
     │                        │
     │── leave_room ─────────▶│
     │  { roomId: "events" }  │
     │                        │
     │◀──── room_left ─────────│
     │                        │
     │── disconnect_voice ───▶│
     │                        │── close WebRTC peers
     │                        │
     │                        │
     │ [User clicks Movies]   │
     │                        │
     │── join_room ──────────▶│
     │  { roomId: "movies" }  │
     │                        │
     │◀──── room_joined ───────│
     │                        │
     │── join_voice_zone ────▶│
     │  { zoneId: "movies" }  │
     │                        │
     │◀──── zone_joined ───────│
     │  { peers: [...] }      │
     │                        │
     │ [New WebRTC connections]│
```

---

## 4. Error Handling Flows

### 4.1 Connection Recovery

```
Client                      Server
  │                           │
  │◀──── connection_lost ─────│
  │  (WebSocket timeout)      │
  │                           │
  │── attempt_reconnect ────▶│
  │  {                        │
  │    type: "reconnect",     │
  │    lastMessageId: "msg_5" │
  │  }                        │
  │                           │
  │◀──── reconnect_success ───│
  │  {                        │
  │    type: "reconnected",   │
    │    missedMessages: [...]│
  │  }                        │
```

### 4.2 Voice Connection Failure

```
Alice                       Server                       Bob
  │                           │                           │
  │── WebRTC offer ──────────▶│                           │
  │                           │                           │
  │                           │──── relay_offer ────────▶│
  │                           │                           │
  │                           │◀──── timeout ─────────────│
  │                           │  (no answer in 10s)       │
  │                           │                           │
  │◀──── peer_unavailable ────│                           │
  │  {                        │                           │
  │    peerId: "bob_id",      │                           │
  │    reason: "timeout"      │                           │
  │  }                        │                           │
```

---

## 5. Data Packet Specifications

### 5.1 WebSocket Message Types

```typescript
// Client → Server
interface ClientMessage {
  type: 'join_room' | 'leave_room' | 'chat' | 'typing' | 
        'presence' | 'voice_state' | 'position' | 'offer' | 
        'answer' | 'ice_candidate' | 'reconnect';
  // ... type-specific fields
}

// Server → Client
interface ServerMessage {
  type: 'connected' | 'room_joined' | 'room_left' | 'chat' | 
        'user_joined' | 'user_left' | 'presence' | 'voice_state' |
        'offer' | 'answer' | 'ice_candidate' | 'error' | 
        'reconnected' | 'peer_unavailable';
  // ... type-specific fields
}
```

### 5.2 WebRTC Configuration

```javascript
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 24000,
    channelCount: 1
  },
  video: false
};
```

---

## 6. Bandwidth Estimates

### 6.1 Text Chat

| Operation | Payload Size | Frequency | Bandwidth |
|-----------|--------------|-----------|-----------|
| Join room | ~200 bytes | Once | 200 B |
| Send message | ~150 bytes + content | User action | Variable |
| Presence update | ~100 bytes | Every 5s | 20 B/s |
| Typing indicator | ~50 bytes | As needed | Variable |

### 6.2 Voice Chat

| Scenario | Bitrate | Per Peer | Total (8 peers) |
|----------|---------|----------|-----------------|
| Idle (muted) | 0 kbps | 0 | 0 |
| Speaking (Opus) | 16 kbps | 16 kbps | 128 kbps |
| Speaking (max) | 24 kbps | 24 kbps | 192 kbps |
| Signaling overhead | ~2 kbps | ~2 kbps | ~16 kbps |

**Total estimated bandwidth per user:**
- Text only: ~50 B/s
- Voice active: ~150 kbps (upstream + downstream)

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-07
