# VR Chat & Voice Server

WebSocket-based real-time chat and WebRTC voice chat server for the findtorontoevents.ca VR platform.

## Features

- **Real-time Text Chat**: Room-based messaging with Socket.io
- **WebRTC Voice Chat**: Peer-to-peer voice with signaling relay
- **Message Persistence**: SQLite database with 50-message history per room
- **User Presence**: Online status, typing indicators, mic status
- **Reconnection Support**: Missed message recovery after disconnect
- **REST API**: Fallback endpoints for non-WebSocket clients
- **Rate Limiting**: 30 messages per minute per user
- **Proximity Audio**: Distance-based volume culling for voice

## Quick Start

### 1. Install Dependencies

```bash
cd vr/server
npm install
```

### 2. Start Servers

```bash
# Start both servers
npm start

# Or start individually
node chat-server.js    # Port 3001
node signal-server.js  # Port 3002
```

### 3. Test the Server

Open the test client in your browser:
```
http://localhost:3001/test-client.html
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Chat server port |
| `SIGNAL_PORT` | 3002 | Signal server port |
| `CORS_ORIGIN` | * | Allowed CORS origins |
| `NODE_ENV` | development | Environment mode |

## API Endpoints

### Chat Server (Port 3001)

#### WebSocket Events

**Client → Server:**
- `join_room` - Join a chat room
- `leave_room` - Leave current room
- `chat` - Send a message
- `typing` - Typing indicator
- `presence` - Update presence
- `voice_state` - Update voice state
- `reconnect` - Reconnect with recovery

**Server → Client:**
- `connected` - Connection acknowledged
- `room_joined` - Successfully joined room
- `user_joined` - New user in room
- `user_left` - User left room
- `message` - New message
- `message_ack` - Message delivered
- `typing` - User typing status
- `presence` - Presence update
- `voice_state` - Voice state update
- `reconnected` - Reconnection success
- `error` - Error message

#### REST Endpoints

```
GET  /health                    - Server health check
GET  /api/chat/rooms            - List all rooms
GET  /api/chat/rooms/:roomId    - Get room details
GET  /api/chat/history/:roomId  - Get message history
POST /api/chat/message          - Send message via REST
GET  /api/presence/online       - Get online users
GET  /api/stats                 - Server statistics
```

### Signal Server (Port 3002)

#### WebSocket Events

**Client → Server:**
- `join_voice_zone` - Join voice zone
- `leave_voice_zone` - Leave voice zone
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice_candidate` - ICE candidate
- `voice_state` - Voice state update
- `position` - Position update (for proximity)

**Server → Client:**
- `connected` - Connection acknowledged
- `zone_joined` - Successfully joined zone
- `new_peer` - New peer in zone
- `peer_left` - Peer left zone
- `offer` - Relayed offer
- `answer` - Relayed answer
- `ice_candidate` - Relayed ICE candidate
- `peer_voice_state` - Peer voice state
- `cull_update` - Audio cull update
- `peer_unavailable` - Peer unavailable
- `error` - Error message

#### REST Endpoints

```
GET /health                - Server health check
GET /api/signal/ice-config - WebRTC ICE configuration
GET /api/signal/zones      - Active voice zones
GET /api/signal/peers/:zoneId - Peers in zone
```

## Database Schema

### Tables

**users**
- `id` (TEXT PRIMARY KEY) - User ID
- `display_name` (TEXT) - Display name
- `avatar_url` (TEXT) - Avatar URL
- `created_at` (DATETIME) - Creation time
- `updated_at` (DATETIME) - Last update

**messages**
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `message_id` (TEXT UNIQUE) - Unique message ID
- `room_id` (TEXT) - Room/zone ID
- `user_id` (TEXT) - User ID
- `content` (TEXT) - Message content
- `type` (TEXT) - Message type (text, system, reaction)
- `metadata` (TEXT) - JSON metadata
- `created_at` (DATETIME) - Creation time

**presence**
- `user_id` (TEXT PRIMARY KEY) - User ID
- `room_id` (TEXT) - Current room
- `status` (TEXT) - online/offline
- `mic_muted` (BOOLEAN) - Mic muted state
- `is_typing` (BOOLEAN) - Typing status
- `last_seen` (DATETIME) - Last activity
- `socket_id` (TEXT) - Socket.io ID

**rooms**
- `id` (TEXT PRIMARY KEY) - Room ID
- `name` (TEXT) - Room name
- `description` (TEXT) - Room description
- `voice_enabled` (BOOLEAN) - Voice chat enabled
- `max_users` (INTEGER) - Max concurrent users
- `created_at` (DATETIME) - Creation time

**sessions**
- `session_id` (TEXT PRIMARY KEY) - Session ID
- `user_id` (TEXT) - User ID
- `room_id` (TEXT) - Room ID
- `last_message_id` (INTEGER) - Last seen message
- `created_at` (DATETIME) - Creation time
- `expires_at` (DATETIME) - Expiration time

## Default Rooms

The server automatically creates these VR zones:

- `events` - Events Zone (Toronto events and happenings)
- `movies` - Movies Zone (Movie discussions)
- `creators` - Creators Zone (Content creator hangout)
- `stocks` - Stocks Zone (Stock market discussions)
- `wellness` - Wellness Zone (Mental health and wellness)
- `weather` - Weather Zone (Weather updates)
- `hub` - Main Hub (Central meeting point)

## WebRTC Configuration

Default ICE servers:
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
}
```

## Client Integration

### Basic Chat Connection

```javascript
const socket = io('ws://localhost:3001');

socket.on('connected', (data) => {
  console.log('Connected:', data.clientId);
  
  // Join a room
  socket.emit('join_room', {
    roomId: 'events',
    userInfo: {
      id: 'user_123',
      name: 'Alice',
      avatar: 'https://example.com/avatar.png',
      zone: 'events'
    }
  });
});

socket.on('room_joined', (data) => {
  console.log('Joined room:', data.roomId);
  console.log('Users:', data.users);
  console.log('History:', data.history);
});

socket.on('message', (data) => {
  console.log('New message:', data);
});

// Send message
socket.emit('chat', {
  roomId: 'events',
  content: 'Hello everyone!',
  type: 'text'
});
```

### Voice Connection

```javascript
const signalSocket = io('ws://localhost:3002');

signalSocket.on('connected', (data) => {
  // Join voice zone
  signalSocket.emit('join_voice_zone', {
    zoneId: 'events',
    userId: 'user_123',
    displayName: 'Alice'
  });
});

signalSocket.on('zone_joined', (data) => {
  console.log('Joined voice zone:', data.zoneId);
  console.log('Peers:', data.peers);
  
  // Start WebRTC connections with peers
  data.peers.forEach(peer => {
    createPeerConnection(peer.peerId, data.iceConfig);
  });
});

signalSocket.on('new_peer', (data) => {
  console.log('New peer:', data.peer);
  createPeerConnection(data.peer.peerId);
});

// WebRTC signaling
signalSocket.on('offer', (data) => {
  handleOffer(data.from, data.sdp);
});

signalSocket.on('answer', (data) => {
  handleAnswer(data.from, data.sdp);
});

signalSocket.on('ice_candidate', (data) => {
  handleIceCandidate(data.from, data.candidate);
});
```

## Performance

- **Max concurrent users per room**: 100 (chat), 8 (voice)
- **Message history**: 50 messages per room
- **Message retention**: 24 hours
- **Rate limit**: 30 messages per minute per user
- **Presence cleanup**: 5 minute timeout
- **Session expiry**: 24 hours

## Testing

Run the test client and verify:

1. ✅ Connect to chat server
2. ✅ Join a room
3. ✅ Send/receive messages
4. ✅ See message history
5. ✅ User presence updates
6. ✅ Typing indicators
7. ✅ Connect to signal server
8. ✅ Join voice zone
9. ✅ WebRTC signaling relay
10. ✅ Reconnection with recovery

## Troubleshooting

### Port already in use
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9
# or
netstat -ano | findstr :3001
```

### SQLite errors
```bash
# Remove database and restart
rm vr_chat.db
npm start
```

### CORS issues
Set `CORS_ORIGIN` to your domain:
```bash
CORS_ORIGIN=https://findtorontoevents.ca npm start
```

## License

MIT License - findtorontoevents.ca
