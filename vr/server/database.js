/**
 * VR Chat Database Module
 * SQLite wrapper for message persistence and user presence
 * 
 * @module database
 * @version 1.0.0
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class VRChatDatabase {
  constructor(dbPath = './vr_chat.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.maxHistoryPerRoom = 50;
    this.messageRetentionHours = 24;
  }

  /**
   * Initialize database connection and create tables
   */
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection failed:', err);
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');
        this.createTables()
          .then(() => this.createIndexes())
          .then(() => {
            console.log('Database schema initialized');
            resolve();
          })
          .catch(reject);
      });
    });
  }

  /**
   * Create database tables
   */
  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Presence table
      `CREATE TABLE IF NOT EXISTS presence (
        user_id TEXT PRIMARY KEY,
        room_id TEXT,
        status TEXT DEFAULT 'online',
        mic_muted BOOLEAN DEFAULT 1,
        is_typing BOOLEAN DEFAULT 0,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        socket_id TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Rooms table
      `CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        voice_enabled BOOLEAN DEFAULT 1,
        max_users INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // User sessions for reconnection
      `CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        room_id TEXT,
        last_message_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    for (const sql of tables) {
      await this.run(sql);
    }

    // Insert default rooms
    await this.seedDefaultRooms();
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_presence_room ON presence(room_id)',
      'CREATE INDEX IF NOT EXISTS idx_presence_status ON presence(status)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)'
    ];

    for (const sql of indexes) {
      await this.run(sql);
    }
  }

  /**
   * Seed default VR zones/rooms
   */
  async seedDefaultRooms() {
    const defaultRooms = [
      { id: 'events', name: 'Events Zone', description: 'Toronto events and happenings', voice_enabled: 1 },
      { id: 'movies', name: 'Movies Zone', description: 'Movie discussions and screenings', voice_enabled: 1 },
      { id: 'creators', name: 'Creators Zone', description: 'Content creator hangout', voice_enabled: 1 },
      { id: 'stocks', name: 'Stocks Zone', description: 'Stock market discussions', voice_enabled: 1 },
      { id: 'wellness', name: 'Wellness Zone', description: 'Mental health and wellness', voice_enabled: 1 },
      { id: 'weather', name: 'Weather Zone', description: 'Weather updates and chat', voice_enabled: 1 },
      { id: 'hub', name: 'Main Hub', description: 'Central meeting point', voice_enabled: 1 }
    ];

    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO rooms (id, name, description, voice_enabled) VALUES (?, ?, ?, ?)`
    );

    for (const room of defaultRooms) {
      await new Promise((resolve, reject) => {
        stmt.run(room.id, room.name, room.description, room.voice_enabled, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    stmt.finalize();
    console.log('Default rooms seeded');
  }

  /**
   * Execute SQL query (run)
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Execute SQL query (get single row)
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Execute SQL query (get all rows)
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // ==================== USER METHODS ====================

  /**
   * Create or update user
   */
  async upsertUser(userId, displayName, avatarUrl = null) {
    const sql = `
      INSERT INTO users (id, display_name, avatar_url, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
        updated_at = CURRENT_TIMESTAMP
    `;
    await this.run(sql, [userId, displayName, avatarUrl]);
    return this.getUser(userId);
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    return this.get(sql, [userId]);
  }

  /**
   * Get multiple users by IDs
   */
  async getUsers(userIds) {
    if (!userIds || userIds.length === 0) return [];
    const placeholders = userIds.map(() => '?').join(',');
    const sql = `SELECT * FROM users WHERE id IN (${placeholders})`;
    return this.all(sql, userIds);
  }

  // ==================== MESSAGE METHODS ====================

  /**
   * Store a new message
   */
  async storeMessage(roomId, userId, content, type = 'text', metadata = null) {
    const messageId = `msg_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const sql = `
      INSERT INTO messages (message_id, room_id, user_id, content, type, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await this.run(sql, [
      messageId,
      roomId,
      userId,
      content,
      type,
      metadata ? JSON.stringify(metadata) : null
    ]);

    // Clean up old messages to maintain max history
    await this.cleanupOldMessages(roomId);

    return {
      id: result.id,
      messageId,
      roomId,
      userId,
      content,
      type,
      metadata,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get message history for a room
   */
  async getMessageHistory(roomId, limit = 50, beforeId = null) {
    let sql = `
      SELECT 
        m.id,
        m.message_id as messageId,
        m.room_id as roomId,
        m.user_id as userId,
        m.content,
        m.type,
        m.metadata,
        m.created_at as timestamp,
        u.display_name as displayName,
        u.avatar_url as avatarUrl
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
    `;
    const params = [roomId];

    if (beforeId) {
      sql += ' AND m.id < ?';
      params.push(beforeId);
    }

    sql += ` ORDER BY m.created_at DESC LIMIT ?`;
    params.push(limit);

    const messages = await this.all(sql, params);
    return messages.reverse(); // Return in chronological order
  }

  /**
   * Get messages after a specific ID (for reconnection)
   */
  async getMessagesAfter(roomId, afterId) {
    const sql = `
      SELECT 
        m.id,
        m.message_id as messageId,
        m.room_id as roomId,
        m.user_id as userId,
        m.content,
        m.type,
        m.metadata,
        m.created_at as timestamp,
        u.display_name as displayName,
        u.avatar_url as avatarUrl
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ? AND m.id > ?
      ORDER BY m.created_at ASC
    `;
    return this.all(sql, [roomId, afterId]);
  }

  /**
   * Cleanup old messages beyond max history
   */
  async cleanupOldMessages(roomId) {
    const sql = `
      DELETE FROM messages
      WHERE room_id = ?
      AND id NOT IN (
        SELECT id FROM messages
        WHERE room_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      )
    `;
    await this.run(sql, [roomId, roomId, this.maxHistoryPerRoom]);

    // Also cleanup messages older than retention period
    const cleanupSql = `
      DELETE FROM messages
      WHERE created_at < datetime('now', '-${this.messageRetentionHours} hours')
    `;
    await this.run(cleanupSql);
  }

  // ==================== PRESENCE METHODS ====================

  /**
   * Update user presence
   */
  async updatePresence(userId, roomId, status = 'online', socketId = null, metadata = {}) {
    const sql = `
      INSERT INTO presence (user_id, room_id, status, mic_muted, is_typing, last_seen, socket_id)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        room_id = excluded.room_id,
        status = excluded.status,
        mic_muted = COALESCE(?, presence.mic_muted),
        is_typing = COALESCE(?, presence.is_typing),
        last_seen = CURRENT_TIMESTAMP,
        socket_id = COALESCE(?, presence.socket_id)
    `;
    await this.run(sql, [
      userId, roomId, status,
      metadata.micMuted !== undefined ? metadata.micMuted : 1,
      metadata.isTyping || 0,
      socketId,
      metadata.micMuted,
      metadata.isTyping,
      socketId
    ]);
  }

  /**
   * Get users in a room
   */
  async getUsersInRoom(roomId) {
    const sql = `
      SELECT 
        p.user_id as userId,
        p.room_id as roomId,
        p.status,
        p.mic_muted as micMuted,
        p.is_typing as isTyping,
        p.last_seen as lastSeen,
        u.display_name as displayName,
        u.avatar_url as avatarUrl
      FROM presence p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ? AND p.status = 'online'
      ORDER BY p.last_seen DESC
    `;
    return this.all(sql, [roomId]);
  }

  /**
   * Get all online users
   */
  async getAllOnlineUsers() {
    const sql = `
      SELECT 
        p.user_id as userId,
        p.room_id as roomId,
        p.status,
        p.mic_muted as micMuted,
        p.is_typing as isTyping,
        p.last_seen as lastSeen,
        u.display_name as displayName,
        u.avatar_url as avatarUrl
      FROM presence p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = 'online'
      ORDER BY p.room_id, p.last_seen DESC
    `;
    return this.all(sql);
  }

  /**
   * Set user offline
   */
  async setUserOffline(userId) {
    const sql = `
      UPDATE presence
      SET status = 'offline', room_id = NULL, last_seen = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;
    await this.run(sql, [userId]);
  }

  /**
   * Update mic status
   */
  async updateMicStatus(userId, muted) {
    const sql = `
      UPDATE presence
      SET mic_muted = ?, last_seen = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;
    await this.run(sql, [muted ? 1 : 0, userId]);
  }

  /**
   * Update typing status
   */
  async updateTypingStatus(userId, isTyping) {
    const sql = `
      UPDATE presence
      SET is_typing = ?, last_seen = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;
    await this.run(sql, [isTyping ? 1 : 0, userId]);
  }

  /**
   * Cleanup stale presence entries
   */
  async cleanupStalePresence(timeoutMinutes = 5) {
    const sql = `
      UPDATE presence
      SET status = 'offline'
      WHERE status = 'online'
      AND last_seen < datetime('now', '-${timeoutMinutes} minutes')
    `;
    const result = await this.run(sql);
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} stale presence entries`);
    }
    return result.changes;
  }

  // ==================== ROOM METHODS ====================

  /**
   * Get all rooms
   */
  async getAllRooms() {
    const sql = `
      SELECT 
        r.*,
        COUNT(p.user_id) as userCount
      FROM rooms r
      LEFT JOIN presence p ON r.id = p.room_id AND p.status = 'online'
      GROUP BY r.id
      ORDER BY r.created_at
    `;
    return this.all(sql);
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId) {
    const sql = `
      SELECT 
        r.*,
        COUNT(p.user_id) as userCount
      FROM rooms r
      LEFT JOIN presence p ON r.id = p.room_id AND p.status = 'online'
      WHERE r.id = ?
      GROUP BY r.id
    `;
    return this.get(sql, [roomId]);
  }

  // ==================== SESSION METHODS ====================

  /**
   * Create session for reconnection
   */
  async createSession(userId, roomId, lastMessageId = null) {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const sql = `
      INSERT INTO sessions (session_id, user_id, room_id, last_message_id, expires_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        room_id = excluded.room_id,
        last_message_id = excluded.last_message_id,
        expires_at = excluded.expires_at
    `;
    await this.run(sql, [sessionId, userId, roomId, lastMessageId, expiresAt.toISOString()]);
    return sessionId;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const sql = `
      SELECT * FROM sessions
      WHERE session_id = ? AND expires_at > CURRENT_TIMESTAMP
    `;
    return this.get(sql, [sessionId]);
  }

  /**
   * Update session last message
   */
  async updateSessionLastMessage(sessionId, lastMessageId) {
    const sql = `
      UPDATE sessions
      SET last_message_id = ?
      WHERE session_id = ?
    `;
    await this.run(sql, [lastMessageId, sessionId]);
  }

  /**
   * Delete expired sessions
   */
  async cleanupExpiredSessions() {
    const sql = `DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`;
    const result = await this.run(sql);
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired sessions`);
    }
    return result.changes;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get database stats
   */
  async getStats() {
    const stats = {};
    
    stats.users = (await this.get('SELECT COUNT(*) as count FROM users')).count;
    stats.messages = (await this.get('SELECT COUNT(*) as count FROM messages')).count;
    stats.onlineUsers = (await this.get(`SELECT COUNT(*) as count FROM presence WHERE status = 'online'`)).count;
    stats.rooms = (await this.get('SELECT COUNT(*) as count FROM rooms')).count;
    stats.sessions = (await this.get('SELECT COUNT(*) as count FROM sessions')).count;

    return stats;
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            console.log('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}

module.exports = VRChatDatabase;
