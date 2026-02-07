/**
 * VR WebRTC Signaling Server
 * PeerJS-compatible signaling server for voice chat
 * 
 * @module signal-server
 * @version 1.0.0
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

class VRSignalServer {
  constructor(options = {}) {
    this.port = options.port || process.env.SIGNAL_PORT || 3002;
    this.corsOrigin = options.corsOrigin || process.env.CORS_ORIGIN || '*';
    
    // Initialize Express app
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: this.corsOrigin,
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Track voice zones and peers
    this.voiceZones = new Map(); // zoneId -> Map of peerId -> peerInfo
    this.peerConnections = new Map(); // peerId -> { socket, zoneId, userInfo }
    
    // WebRTC configuration
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };

    // Timeouts
    this.offerTimeout = 10000; // 10 seconds for answer
    this.iceTimeout = 5000; // 5 seconds for ICE candidates
  }

  /**
   * Initialize server
   */
  async init() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    console.log('VR Signal Server initialized');
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  /**
   * Setup REST API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'signal-server',
        timestamp: new Date().toISOString(),
        activeZones: this.voiceZones.size,
        activePeers: this.peerConnections.size
      });
    });

    // Get ICE servers configuration
    this.app.get('/api/signal/ice-config', (req, res) => {
      res.json({
        success: true,
        config: this.rtcConfig
      });
    });

    // Get peers in a zone
    this.app.get('/api/signal/peers/:zoneId', (req, res) => {
      const zoneId = req.params.zoneId;
      const zone = this.voiceZones.get(zoneId);
      
      if (!zone) {
        return res.json({
          success: true,
          zoneId,
          peers: []
        });
      }

      const peers = Array.from(zone.values()).map(peer => ({
        peerId: peer.peerId,
        userId: peer.userId,
        displayName: peer.displayName,
        muted: peer.muted,
        joinedAt: peer.joinedAt
      }));

      res.json({
        success: true,
        zoneId,
        peers
      });
    });

    // Get all active zones
    this.app.get('/api/signal/zones', (req, res) => {
      const zones = Array.from(this.voiceZones.entries()).map(([zoneId, peers]) => ({
        zoneId,
        peerCount: peers.size
      }));

      res.json({
        success: true,
        zones
      });
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Signal client connected: ${socket.id}`);

      // Store basic socket info
      let peerInfo = {
        socket,
        peerId: null,
        zoneId: null,
        userId: null,
        displayName: null,
        muted: true,
        joinedAt: null
      };

      // Send connection acknowledgment with ICE config
      socket.emit('connected', {
        type: 'connected',
        clientId: socket.id,
        iceConfig: this.rtcConfig,
        timestamp: new Date().toISOString()
      });

      // Handle join voice zone
      socket.on('join_voice_zone', (data) => {
        this.handleJoinVoiceZone(socket, peerInfo, data);
      });

      // Handle leave voice zone
      socket.on('leave_voice_zone', () => {
        this.handleLeaveVoiceZone(socket, peerInfo);
      });

      // Handle WebRTC offer
      socket.on('offer', (data) => {
        this.handleOffer(socket, peerInfo, data);
      });

      // Handle WebRTC answer
      socket.on('answer', (data) => {
        this.handleAnswer(socket, peerInfo, data);
      });

      // Handle ICE candidate
      socket.on('ice_candidate', (data) => {
        this.handleIceCandidate(socket, peerInfo, data);
      });

      // Handle voice state update
      socket.on('voice_state', (data) => {
        this.handleVoiceState(socket, peerInfo, data);
      });

      // Handle position update (for proximity audio)
      socket.on('position', (data) => {
        this.handlePositionUpdate(socket, peerInfo, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, peerInfo, reason);
      });
    });
  }

  /**
   * Handle join voice zone
   */
  handleJoinVoiceZone(socket, peerInfo, data) {
    try {
      const { zoneId, userId, displayName } = data;

      if (!zoneId || !userId) {
        socket.emit('error', {
          type: 'error',
          code: 'INVALID_JOIN',
          message: 'Missing zoneId or userId'
        });
        return;
      }

      // Generate peer ID
      const peerId = `peer_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

      // Update peer info
      peerInfo.peerId = peerId;
      peerInfo.zoneId = zoneId;
      peerInfo.userId = userId;
      peerInfo.displayName = displayName || 'Anonymous';
      peerInfo.muted = true;
      peerInfo.joinedAt = new Date().toISOString();
      peerInfo.position = { x: 0, y: 0, z: 0 };

      // Create zone if doesn't exist
      if (!this.voiceZones.has(zoneId)) {
        this.voiceZones.set(zoneId, new Map());
      }

      const zone = this.voiceZones.get(zoneId);

      // Check max peers (8 concurrent as per spec)
      if (zone.size >= 8) {
        socket.emit('error', {
          type: 'error',
          code: 'ZONE_FULL',
          message: 'Voice zone is full (max 8 peers)'
        });
        return;
      }

      // Add peer to zone
      zone.set(peerId, peerInfo);
      this.peerConnections.set(peerId, peerInfo);

      // Join Socket.io room for zone
      socket.join(`voice_${zoneId}`);

      // Get existing peers in zone
      const existingPeers = Array.from(zone.values())
        .filter(p => p.peerId !== peerId)
        .map(p => ({
          peerId: p.peerId,
          userId: p.userId,
          displayName: p.displayName,
          muted: p.muted
        }));

      // Send zone joined confirmation
      socket.emit('zone_joined', {
        type: 'zone_joined',
        zoneId,
        peerId,
        peers: existingPeers,
        iceConfig: this.rtcConfig
      });

      // Notify existing peers about new peer
      socket.to(`voice_${zoneId}`).emit('new_peer', {
        type: 'new_peer',
        zoneId,
        peer: {
          peerId,
          userId,
          displayName: peerInfo.displayName,
          muted: true
        }
      });

      console.log(`Peer ${peerId} (${userId}) joined voice zone ${zoneId}`);

    } catch (err) {
      console.error('Error joining voice zone:', err);
      socket.emit('error', {
        type: 'error',
        code: 'JOIN_FAILED',
        message: 'Failed to join voice zone'
      });
    }
  }

  /**
   * Handle leave voice zone
   */
  handleLeaveVoiceZone(socket, peerInfo) {
    try {
      if (!peerInfo.peerId || !peerInfo.zoneId) return;

      const { peerId, zoneId } = peerInfo;

      // Remove from zone
      if (this.voiceZones.has(zoneId)) {
        const zone = this.voiceZones.get(zoneId);
        zone.delete(peerId);

        // Clean up empty zones
        if (zone.size === 0) {
          this.voiceZones.delete(zoneId);
        } else {
          // Notify remaining peers
          socket.to(`voice_${zoneId}`).emit('peer_left', {
            type: 'peer_left',
            zoneId,
            peerId
          });
        }
      }

      // Remove from connections
      this.peerConnections.delete(peerId);

      // Leave Socket.io room
      socket.leave(`voice_${zoneId}`);

      // Send confirmation
      socket.emit('zone_left', {
        type: 'zone_left',
        zoneId
      });

      console.log(`Peer ${peerId} left voice zone ${zoneId}`);

      // Clear peer info
      peerInfo.peerId = null;
      peerInfo.zoneId = null;

    } catch (err) {
      console.error('Error leaving voice zone:', err);
    }
  }

  /**
   * Handle WebRTC offer
   */
  handleOffer(socket, peerInfo, data) {
    try {
      if (!peerInfo.peerId || !peerInfo.zoneId) {
        socket.emit('error', {
          type: 'error',
          code: 'NOT_IN_ZONE',
          message: 'Not in a voice zone'
        });
        return;
      }

      const { to, sdp } = data;
      const { peerId, zoneId } = peerInfo;

      if (!to || !sdp) {
        socket.emit('error', {
          type: 'error',
          code: 'INVALID_OFFER',
          message: 'Missing to or sdp'
        });
        return;
      }

      // Find target peer
      const zone = this.voiceZones.get(zoneId);
      if (!zone || !zone.has(to)) {
        socket.emit('peer_unavailable', {
          type: 'peer_unavailable',
          peerId: to,
          reason: 'not_found'
        });
        return;
      }

      const targetPeer = zone.get(to);

      // Relay offer to target
      targetPeer.socket.emit('offer', {
        type: 'offer',
        from: peerId,
        sdp,
        timestamp: Date.now()
      });

      // Set timeout for answer
      setTimeout(() => {
        // Check if connection was established (simplified check)
        // In production, you'd track connection state more carefully
        socket.emit('peer_timeout_warning', {
          type: 'peer_timeout_warning',
          peerId: to,
          elapsed: this.offerTimeout
        });
      }, this.offerTimeout);

      console.log(`Offer relayed from ${peerId} to ${to}`);

    } catch (err) {
      console.error('Error handling offer:', err);
      socket.emit('error', {
        type: 'error',
        code: 'OFFER_FAILED',
        message: 'Failed to relay offer'
      });
    }
  }

  /**
   * Handle WebRTC answer
   */
  handleAnswer(socket, peerInfo, data) {
    try {
      if (!peerInfo.peerId) {
        socket.emit('error', {
          type: 'error',
          code: 'NOT_IN_ZONE',
          message: 'Not in a voice zone'
        });
        return;
      }

      const { to, sdp } = data;
      const { peerId, zoneId } = peerInfo;

      if (!to || !sdp) {
        socket.emit('error', {
          type: 'error',
          code: 'INVALID_ANSWER',
          message: 'Missing to or sdp'
        });
        return;
      }

      // Find target peer
      const zone = this.voiceZones.get(zoneId);
      if (!zone || !zone.has(to)) {
        socket.emit('peer_unavailable', {
          type: 'peer_unavailable',
          peerId: to,
          reason: 'not_found'
        });
        return;
      }

      const targetPeer = zone.get(to);

      // Relay answer to target
      targetPeer.socket.emit('answer', {
        type: 'answer',
        from: peerId,
        sdp,
        timestamp: Date.now()
      });

      console.log(`Answer relayed from ${peerId} to ${to}`);

    } catch (err) {
      console.error('Error handling answer:', err);
      socket.emit('error', {
        type: 'error',
        code: 'ANSWER_FAILED',
        message: 'Failed to relay answer'
      });
    }
  }

  /**
   * Handle ICE candidate
   */
  handleIceCandidate(socket, peerInfo, data) {
    try {
      if (!peerInfo.peerId) return;

      const { to, candidate } = data;
      const { peerId, zoneId } = peerInfo;

      if (!to || !candidate) return;

      // Find target peer
      const zone = this.voiceZones.get(zoneId);
      if (!zone || !zone.has(to)) return;

      const targetPeer = zone.get(to);

      // Relay ICE candidate to target
      targetPeer.socket.emit('ice_candidate', {
        type: 'ice_candidate',
        from: peerId,
        candidate,
        timestamp: Date.now()
      });

    } catch (err) {
      console.error('Error handling ICE candidate:', err);
    }
  }

  /**
   * Handle voice state update
   */
  handleVoiceState(socket, peerInfo, data) {
    try {
      if (!peerInfo.peerId || !peerInfo.zoneId) return;

      const { muted, speaking, volume } = data;
      const { peerId, zoneId } = peerInfo;

      // Update peer info
      if (muted !== undefined) {
        peerInfo.muted = muted;
      }
      if (speaking !== undefined) {
        peerInfo.speaking = speaking;
      }
      if (volume !== undefined) {
        peerInfo.volume = volume;
      }

      // Broadcast to zone
      socket.to(`voice_${zoneId}`).emit('peer_voice_state', {
        type: 'peer_voice_state',
        peerId,
        muted: peerInfo.muted,
        speaking: peerInfo.speaking,
        volume: peerInfo.volume,
        timestamp: Date.now()
      });

    } catch (err) {
      console.error('Error handling voice state:', err);
    }
  }

  /**
   * Handle position update (for proximity audio)
   */
  handlePositionUpdate(socket, peerInfo, data) {
    try {
      if (!peerInfo.peerId || !peerInfo.zoneId) return;

      const { x, y, z } = data;
      const { peerId, zoneId } = peerInfo;

      // Update position
      peerInfo.position = { x, y, z };

      // Calculate distances and determine audible peers
      const zone = this.voiceZones.get(zoneId);
      if (!zone) return;

      const audiblePeers = [];
      const mutedPeers = [];
      const CULL_DISTANCE = 10; // meters

      for (const [otherPeerId, otherPeer] of zone) {
        if (otherPeerId === peerId) continue;

        // Calculate distance
        const dx = x - otherPeer.position.x;
        const dy = y - otherPeer.position.y;
        const dz = z - otherPeer.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance <= CULL_DISTANCE) {
          // Calculate volume based on distance (inverse square law approximation)
          const volume = Math.max(0.1, 1 - (distance / CULL_DISTANCE));
          audiblePeers.push({
            peerId: otherPeerId,
            distance: Math.round(distance * 100) / 100,
            volume: Math.round(volume * 100) / 100
          });
        } else {
          mutedPeers.push(otherPeerId);
        }
      }

      // Send cull update to client
      socket.emit('cull_update', {
        type: 'cull_update',
        audiblePeers,
        mutedPeers,
        timestamp: Date.now()
      });

    } catch (err) {
      console.error('Error handling position update:', err);
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(socket, peerInfo, reason) {
    console.log(`Signal client disconnected: ${socket.id}, reason: ${reason}`);

    if (peerInfo.peerId && peerInfo.zoneId) {
      // Remove from zone
      if (this.voiceZones.has(peerInfo.zoneId)) {
        const zone = this.voiceZones.get(peerInfo.zoneId);
        zone.delete(peerInfo.peerId);

        // Notify remaining peers
        if (zone.size > 0) {
          socket.to(`voice_${peerInfo.zoneId}`).emit('peer_left', {
            type: 'peer_left',
            zoneId: peerInfo.zoneId,
            peerId: peerInfo.peerId
          });
        } else {
          // Clean up empty zone
          this.voiceZones.delete(peerInfo.zoneId);
        }
      }

      // Remove from connections
      this.peerConnections.delete(peerInfo.peerId);

      console.log(`Peer ${peerInfo.peerId} disconnected from zone ${peerInfo.zoneId}`);
    }
  }

  /**
   * Start the server
   */
  async start() {
    await this.init();

    this.server.listen(this.port, () => {
      console.log(`VR Signal Server running on port ${this.port}`);
      console.log(`WebSocket endpoint: ws://localhost:${this.port}`);
      console.log(`ICE config endpoint: http://localhost:${this.port}/api/signal/ice-config`);
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    return new Promise((resolve) => {
      this.io.close(() => {
        console.log('Signal Socket.io closed');
      });

      this.server.close(() => {
        console.log('Signal HTTP server closed');
        resolve();
      });
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new VRSignalServer({
    port: process.env.SIGNAL_PORT || 3002,
    corsOrigin: process.env.CORS_ORIGIN || '*'
  });

  server.start().catch(err => {
    console.error('Failed to start signal server:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down signal server gracefully');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down signal server gracefully');
    await server.stop();
    process.exit(0);
  });
}

module.exports = VRSignalServer;
