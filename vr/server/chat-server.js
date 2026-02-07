/**
 * VR Chat Server
 * WebSocket server using Socket.io for real-time chat
 * 
 * @module chat-server
 * @version 1.0.0
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const VRChatDatabase = require('./database');

class VRChatServer {
  constructor(options = {}) {
    this.port = options.port || process.env.PORT || 3001;
    this.dbPath = options.dbPath || './vr_chat.db';
    this.maxMessagesPerRoom = 50;
    this.cleanupInterval = 60000; // 1 minute
    
    // Initialize Express app
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: options.corsOrigin || "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Initialize database
    this.db = new VRChatDatabase(this.dbPath);
    
    // Track connected sockets
    this.connectedSockets = new Map();
    
    // Room management
    this.rooms = new Map(); // roomId -> Set of socket IDs
    
    // Rate limiting
    this.messageRateLimits = new Map(); // socketId -> { count, resetTime }
    this.RATE_LIMIT_MESSAGES = 30; // messages per minute
    this.RATE_LIMIT_WINDOW = 60000; // 1 minute
  }

  /**
   * Initialize server
   */
  async init() {
    // Initialize database
    await this.db.init();
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup REST API routes
    this.setupRoutes();
    
    // Setup Socket.io handlers
    this.setupSocketHandlers();
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    console.log('VR Chat Server initialized');
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Serve static files (test client)
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  /**
   * Setup REST API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connections: this.connectedSockets.size
      });
    });

    // Get all rooms
    this.app.get('/api/chat/rooms', async (req, res) => {
      try {
        const rooms = await this.db.getAllRooms();
        res.json({
          success: true,
          rooms: rooms.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            voiceEnabled: r.voice_enabled === 1,
            userCount: r.userCount || 0,
            maxUsers: r.max_users
          }))
        });
      } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
      }
    });

    // Get room details
    this.app.get('/api/chat/rooms/:roomId', async (req, res) => {
      try {
        const room = await this.db.getRoom(req.params.roomId);
        if (!room) {
          return res.status(404).json({ success: false, error: 'Room not found' });
        }
        res.json({
          success: true,
          room: {
            id: room.id,
            name: room.name,
            description: room.description,
            voiceEnabled: room.voice_enabled === 1,
            userCount: room.userCount || 0,
            maxUsers: room.max_users
          }
        });
      } catch (err) {
        console.error('Error fetching room:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch room' });
      }
    });

    // Get message history for a room
    this.app.get('/api/chat/history/:roomId', async (req, res) => {
      try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const beforeId = req.query.before || null;
        const messages = await this.db.getMessageHistory(req.params.roomId, limit, beforeId);
        
        res.json({
          success: true,
          roomId: req.params.roomId,
          messages: messages.map(m => ({
            id: m.messageId,
            roomId: m.roomId,
            userId: m.userId,
            content: m.content,
            type: m.type,
            metadata: m.metadata ? JSON.parse(m.metadata) : null,
            timestamp: m.timestamp,
            displayName: m.displayName,
            avatarUrl: m.avatarUrl
          }))
        });
      } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch message history' });
      }
    });

    // Send message via REST API (fallback)
    this.app.post('/api/chat/message', async (req, res) => {
      try {
        const { roomId, userId, content, type = 'text', metadata } = req.body;
        
        if (!roomId || !userId || !content) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: roomId, userId, content'
          });
        }

        // Store message
        const message = await this.db.storeMessage(roomId, userId, content, type, metadata);
        
        // Get user info
        const user = await this.db.getUser(userId);
        
        // Broadcast to room via WebSocket
        const messageData = {
          type: 'chat',
          id: message.messageId,
          roomId: message.roomId,
          userId: message.userId,
          content: message.content,
          messageType: message.type,
          metadata: message.metadata,
          timestamp: message.timestamp,
          displayName: user ? user.display_name : 'Unknown',
          avatarUrl: user ? user.avatar_url : null
        };
        
        this.io.to(roomId).emit('message', messageData);
        
        res.json({
          success: true,
          message: messageData
        });
      } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ success: false, error: 'Failed to send message' });
      }
    });

    // Get online users
    this.app.get('/api/presence/online', async (req, res) => {
      try {
        const roomId = req.query.room;
        let users;
        
        if (roomId) {
          users = await this.db.getUsersInRoom(roomId);
        } else {
          users = await this.db.getAllOnlineUsers();
        }
        
        res.json({
          success: true,
          count: users.length,
          users: users.map(u => ({
            userId: u.userId,
            roomId: u.roomId,
            status: u.status,
            micMuted: u.micMuted === 1,
            isTyping: u.isTyping === 1,
            lastSeen: u.lastSeen,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl
          }))
        });
      } catch (err) {
        console.error('Error fetching online users:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch online users' });
      }
    });

    // Get server stats
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.db.getStats();
        res.json({
          success: true,
          stats: {
            ...stats,
            activeConnections: this.connectedSockets.size,
            activeRooms: this.rooms.size
          }
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
      }
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Store socket info
      this.connectedSockets.set(socket.id, {
        socket,
        userId: null,
        roomId: null,
        connectedAt: Date.now()
      });

      // Send connection acknowledgment
      socket.emit('connected', {
        type: 'connected',
        clientId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Handle join room
      socket.on('join_room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      // Handle leave room
      socket.on('leave_room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      // Handle chat message
      socket.on('chat', async (data) => {
        await this.handleChatMessage(socket, data);
      });

      // Handle typing indicator
      socket.on('typing', async (data) => {
        await this.handleTyping(socket, data);
      });

      // Handle presence update
      socket.on('presence', async (data) => {
        await this.handlePresenceUpdate(socket, data);
      });

      // Handle voice state
      socket.on('voice_state', async (data) => {
        await this.handleVoiceState(socket, data);
      });

      // Handle reconnection
      socket.on('reconnect', async (data) => {
        await this.handleReconnect(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        await this.handleDisconnect(socket, reason);
      });
    });
  }

  /**
   * Handle join room request
   */
  async handleJoinRoom(socket, data) {
    try {
      const { roomId, userInfo } = data;
      
      if (!roomId || !userInfo || !userInfo.id) {
        socket.emit('error', {
          type: 'error',
          code: 'INVALID_JOIN_REQUEST',
          message: 'Missing roomId or userInfo'
        });
        return;
      }

      const { id: userId, name: displayName, avatar: avatarUrl, zone } = userInfo;

      // Leave current room if any
      const socketInfo = this.connectedSockets.get(socket.id);
      if (socketInfo && socketInfo.roomId) {
        await this.handleLeaveRoom(socket, { roomId: socketInfo.roomId });
      }

      // Create or update user
      await this.db.upsertUser(userId, displayName, avatarUrl);

      // Update presence
      await this.db.updatePresence(userId, roomId, 'online', socket.id, {
        micMuted: true,
        isTyping: false
      });

      // Join Socket.io room
      socket.join(roomId);
      
      // Update room tracking
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId).add(socket.id);

      // Update socket info
      socketInfo.userId = userId;
      socketInfo.roomId = roomId;
      socketInfo.userInfo = userInfo;

      // Get room users and history
      const [users, history] = await Promise.all([
        this.db.getUsersInRoom(roomId),
        this.db.getMessageHistory(roomId, this.maxMessagesPerRoom)
      ]);

      // Send room joined confirmation
      socket.emit('room_joined', {
        type: 'room_joined',
        roomId,
        users: users.map(u => ({
          id: u.userId,
          name: u.displayName,
          avatar: u.avatarUrl,
          micMuted: u.micMuted === 1,
          isTyping: u.isTyping === 1
        })),
        history: history.map(m => ({
          id: m.messageId,
          userId: m.userId,
          content: m.content,
          type: m.type,
          timestamp: m.timestamp,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl
        }))
      });

      // Broadcast user joined to room
      socket.to(roomId).emit('user_joined', {
        type: 'user_joined',
        roomId,
        user: {
          id: userId,
          name: displayName,
          avatar: avatarUrl,
          micMuted: true,
          isTyping: false
        }
      });

      console.log(`User ${userId} joined room ${roomId}`);

    } catch (err) {
      console.error('Error joining room:', err);
      socket.emit('error', {
        type: 'error',
        code: 'JOIN_ROOM_FAILED',
        message: 'Failed to join room'
      });
    }
  }

  /**
   * Handle leave room request
   */
  async handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;
      const socketInfo = this.connectedSockets.get(socket.id);
      
      if (!socketInfo || !socketInfo.userId) return;

      const userId = socketInfo.userId;
      const actualRoomId = roomId || socketInfo.roomId;

      if (!actualRoomId) return;

      // Leave Socket.io room
      socket.leave(actualRoomId);
      
      // Update room tracking
      if (this.rooms.has(actualRoomId)) {
        this.rooms.get(actualRoomId).delete(socket.id);
        if (this.rooms.get(actualRoomId).size === 0) {
          this.rooms.delete(actualRoomId);
        }
      }

      // Update presence
      await this.db.setUserOffline(userId);

      // Update socket info
      socketInfo.roomId = null;

      // Send confirmation
      socket.emit('room_left', {
        type: 'room_left',
        roomId: actualRoomId
      });

      // Broadcast user left to room
      socket.to(actualRoomId).emit('user_left', {
        type: 'user_left',
        roomId: actualRoomId,
        userId
      });

      console.log(`User ${userId} left room ${actualRoomId}`);

    } catch (err) {
      console.error('Error leaving room:', err);
    }
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(socket, data) {
    try {
      const socketInfo = this.connectedSockets.get(socket.id);
      
      if (!socketInfo || !socketInfo.userId || !socketInfo.roomId) {
        socket.emit('error', {
          type: 'error',
          code: 'NOT_IN_ROOM',
          message: 'You must join a room before sending messages'
        });
        return;
      }

      // Rate limiting check
      if (!this.checkRateLimit(socket.id)) {
        socket.emit('error', {
          type: 'error',
          code: 'RATE_LIMITED',
          message: 'Too many messages. Please slow down.'
        });
        return;
      }

      const { roomId, userId } = socketInfo;
      const { content, type = 'text', metadata } = data;

      if (!content || content.trim().length === 0) {
        socket.emit('error', {
          type: 'error',
          code: 'EMPTY_MESSAGE',
          message: 'Message content cannot be empty'
        });
        return;
      }

      // Limit message length
      const trimmedContent = content.trim().substring(0, 1000);

      // Store message
      const message = await this.db.storeMessage(roomId, userId, trimmedContent, type, metadata);

      // Get user info
      const user = await this.db.getUser(userId);

      // Create message data
      const messageData = {
        type: 'chat',
        id: message.messageId,
        roomId: message.roomId,
        userId: message.userId,
        content: message.content,
        messageType: message.type,
        metadata: message.metadata,
        timestamp: message.timestamp,
        displayName: user ? user.display_name : 'Unknown',
        avatarUrl: user ? user.avatar_url : null
      };

      // Send acknowledgment to sender
      socket.emit('message_ack', {
        type: 'message_ack',
        messageId: message.messageId,
        status: 'delivered',
        timestamp: message.timestamp
      });

      // Broadcast to room (excluding sender)
      socket.to(roomId).emit('message', messageData);

      console.log(`Message from ${userId} in ${roomId}: ${trimmedContent.substring(0, 50)}...`);

    } catch (err) {
      console.error('Error handling chat message:', err);
      socket.emit('error', {
        type: 'error',
        code: 'MESSAGE_FAILED',
        message: 'Failed to send message'
      });
    }
  }

  /**
   * Handle typing indicator
   */
  async handleTyping(socket, data) {
    try {
      const socketInfo = this.connectedSockets.get(socket.id);
      
      if (!socketInfo || !socketInfo.userId || !socketInfo.roomId) return;

      const { roomId, userId } = socketInfo;
      const { isTyping } = data;

      // Update typing status in database
      await this.db.updateTypingStatus(userId, isTyping);

      // Broadcast to room
      socket.to(roomId).emit('typing', {
        type: 'typing',
        roomId,
        userId,
        isTyping
      });

    } catch (err) {
      console.error('Error handling typing:', err);
    }
  }

  /**
   * Handle presence update
   */
  async handlePresenceUpdate(socket, data) {
    try {
      const socketInfo = this.connectedSockets.get(socket.id);
      
      if (!socketInfo || !socketInfo.userId) return;

      const { userId } = socketInfo;
      const { status, zone, micMuted } = data;

      // Update presence
      await this.db.updatePresence(userId, zone || socketInfo.roomId, status, socket.id, {
        micMuted: micMuted !== undefined ? micMuted : undefined
      });

      // Broadcast to room if in one
      if (socketInfo.roomId) {
        socket.to(socketInfo.roomId).emit('presence', {
          type: 'presence',
          userId,
          status,
          zone: zone || socketInfo.roomId,
          micMuted: micMuted !== undefined ? micMuted : true
        });
      }

    } catch (err) {
      console.error('Error handling presence update:', err);
    }
  }

  /**
   * Handle voice state update
   */
  async handleVoiceState(socket, data) {
    try {
      const socketInfo = this.connectedSockets.get(socket.id);
      
      if (!socketInfo || !socketInfo.userId || !socketInfo.roomId) return;

      const { roomId, userId } = socketInfo;
      const { muted, speaking, volume } = data;

      // Update mic status in database
      if (muted !== undefined) {
        await this.db.updateMicStatus(userId, muted);
      }

      // Broadcast to room
      socket.to(roomId).emit('voice_state', {
        type: 'voice_state',
        userId,
        muted: muted !== undefined ? muted : undefined,
        speaking: speaking !== undefined ? speaking : undefined,
        volume: volume !== undefined ? volume : undefined
      });

    } catch (err) {
      console.error('Error handling voice state:', err);
    }
  }

  /**
   * Handle reconnection with missed message recovery
   */
  async handleReconnect(socket, data) {
    try {
      const { lastMessageId, roomId, userInfo } = data;
      
      if (!roomId || !userInfo) {
        socket.emit('error', {
          type: 'error',
          code: 'INVALID_RECONNECT',
          message: 'Missing roomId or userInfo'
        });
        return;
      }

      // Rejoin room
      await this.handleJoinRoom(socket, { roomId, userInfo });

      // Get missed messages if lastMessageId provided
      let missedMessages = [];
      if (lastMessageId) {
        missedMessages = await this.db.getMessagesAfter(roomId, lastMessageId);
      }

      // Send reconnected confirmation with missed messages
      socket.emit('reconnected', {
        type: 'reconnected',
        roomId,
        missedMessages: missedMessages.map(m => ({
          id: m.messageId,
          userId: m.userId,
          content: m.content,
          type: m.type,
          timestamp: m.timestamp,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl
        }))
      });

      console.log(`User ${userInfo.id} reconnected to ${roomId}, ${missedMessages.length} missed messages`);

    } catch (err) {
      console.error('Error handling reconnect:', err);
      socket.emit('error', {
        type: 'error',
        code: 'RECONNECT_FAILED',
        message: 'Failed to reconnect'
      });
    }
  }

  /**
   * Handle disconnection
   */
  async handleDisconnect(socket, reason) {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    const socketInfo = this.connectedSockets.get(socket.id);
    
    if (socketInfo) {
      // Leave room if in one
      if (socketInfo.roomId && socketInfo.userId) {
        await this.db.setUserOffline(socketInfo.userId);
        
        // Broadcast user left
        socket.to(socketInfo.roomId).emit('user_left', {
          type: 'user_left',
          roomId: socketInfo.roomId,
          userId: socketInfo.userId
        });
      }
      
      // Remove from tracking
      this.connectedSockets.delete(socket.id);
      
      // Clean up rate limit data
      this.messageRateLimits.delete(socket.id);
    }
  }

  /**
   * Check rate limit for socket
   */
  checkRateLimit(socketId) {
    const now = Date.now();
    const limitInfo = this.messageRateLimits.get(socketId);
    
    if (!limitInfo || now > limitInfo.resetTime) {
      // New window
      this.messageRateLimits.set(socketId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }
    
    if (limitInfo.count >= this.RATE_LIMIT_MESSAGES) {
      return false;
    }
    
    limitInfo.count++;
    return true;
  }

  /**
   * Start cleanup interval for stale data
   */
  startCleanupInterval() {
    setInterval(async () => {
      try {
        // Cleanup stale presence
        await this.db.cleanupStalePresence(5);
        
        // Cleanup expired sessions
        await this.db.cleanupExpiredSessions();
        
        // Log stats
        const stats = await this.db.getStats();
        console.log('Server stats:', stats);
        
      } catch (err) {
        console.error('Error in cleanup interval:', err);
      }
    }, this.cleanupInterval);
  }

  /**
   * Start the server
   */
  async start() {
    await this.init();
    
    this.server.listen(this.port, () => {
      console.log(`VR Chat Server running on port ${this.port}`);
      console.log(`WebSocket endpoint: ws://localhost:${this.port}`);
      console.log(`REST API: http://localhost:${this.port}/api`);
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    return new Promise((resolve) => {
      // Close all socket connections
      this.io.close(() => {
        console.log('Socket.io closed');
      });
      
      // Close HTTP server
      this.server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database
        await this.db.close();
        
        resolve();
      });
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new VRChatServer({
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGIN || '*'
  });
  
  server.start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });
}

module.exports = VRChatServer;
