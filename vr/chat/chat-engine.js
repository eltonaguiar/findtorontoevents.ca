/**
 * VR Chat Engine - Client-side Text Chat Module
 *
 * Features:
 *   - WebSocket connection to chat server
 *   - Room-based messaging (per VR zone)
 *   - Message history retrieval
 *   - Typing indicators
 *   - User presence updates
 *   - Reconnection with missed message recovery
 *   - Integration with presence.js
 *
 * Usage:
 *   ChatEngine.init({ serverUrl: 'ws://localhost:3001' });
 *   ChatEngine.joinRoom('events', { id: 'user123', name: 'Alice' });
 *   ChatEngine.sendMessage('Hello everyone!');
 */
(function () {
  'use strict';

  /* ═══════ CONFIGURATION ═══════ */
  var CONFIG = {
    serverUrl: 'ws://localhost:3001',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 15000,
    messageBatchSize: 10,
    historyLimit: 50,
    typingTimeout: 3000
  };

  /* ═══════ STATE ═══════ */
  var state = {
    socket: null,
    connected: false,
    reconnectAttempts: 0,
    currentRoom: null,
    userInfo: null,
    messageQueue: [],
    lastMessageId: null,
    typingTimer: null,
    isTyping: false,
    callbacks: {
      onConnect: [],
      onDisconnect: [],
      onMessage: [],
      onUserJoin: [],
      onUserLeave: [],
      onTyping: [],
      onPresence: [],
      onError: []
    }
  };

  /* ═══════ WEBSOCKET MANAGEMENT ═══════ */

  function init(options) {
    if (options) {
      Object.assign(CONFIG, options);
    }
    connect();
    return ChatEngine;
  }

  function connect() {
    if (state.socket) {
      state.socket.close();
    }

    try {
      state.socket = new WebSocket(CONFIG.serverUrl);

      state.socket.onopen = function () {
        console.log('[ChatEngine] Connected to server');
        state.connected = true;
        state.reconnectAttempts = 0;

        // Send any queued messages
        flushMessageQueue();

        // Start heartbeat
        startHeartbeat();

        // Rejoin room if we were in one
        if (state.currentRoom && state.userInfo) {
          joinRoom(state.currentRoom, state.userInfo);
        }

        emit('onConnect');
      };

      state.socket.onmessage = function (event) {
        handleMessage(JSON.parse(event.data));
      };

      state.socket.onclose = function () {
        console.log('[ChatEngine] Disconnected');
        state.connected = false;
        stopHeartbeat();
        emit('onDisconnect');
        attemptReconnect();
      };

      state.socket.onerror = function (error) {
        console.error('[ChatEngine] WebSocket error:', error);
        emit('onError', error);
      };
    } catch (err) {
      console.error('[ChatEngine] Failed to create WebSocket:', err);
      attemptReconnect();
    }
  }

  function attemptReconnect() {
    if (state.reconnectAttempts >= CONFIG.maxReconnectAttempts) {
      console.error('[ChatEngine] Max reconnection attempts reached');
      emit('onError', { type: 'max_reconnect_attempts' });
      return;
    }

    state.reconnectAttempts++;
    console.log('[ChatEngine] Reconnecting... (attempt ' + state.reconnectAttempts + ')');

    setTimeout(connect, CONFIG.reconnectInterval);
  }

  /* ═══════ HEARTBEAT ═══════ */

  var heartbeatTimer = null;

  function startHeartbeat() {
    heartbeatTimer = setInterval(function () {
      if (state.connected) {
        send({ type: 'ping' });
      }
    }, CONFIG.heartbeatInterval);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  /* ═══════ MESSAGE HANDLING ═══════ */

  function handleMessage(data) {
    switch (data.type) {
      case 'connected':
        console.log('[ChatEngine] Server acknowledged connection');
        break;

      case 'room_joined':
        state.currentRoom = data.roomId;
        console.log('[ChatEngine] Joined room:', data.roomId);
        // Store message history
        if (data.history) {
          data.history.forEach(function (msg) {
            emit('onMessage', msg);
          });
        }
        break;

      case 'room_left':
        state.currentRoom = null;
        console.log('[ChatEngine] Left room:', data.roomId);
        break;

      case 'chat':
      case 'message':
        state.lastMessageId = data.messageId || data.id;
        emit('onMessage', data);
        break;

      case 'user_joined':
        emit('onUserJoin', data.user);
        break;

      case 'user_left':
        emit('onUserLeave', data.user);
        break;

      case 'typing':
        emit('onTyping', { userId: data.userId, isTyping: data.isTyping });
        break;

      case 'presence':
        emit('onPresence', data);
        break;

      case 'message_ack':
        console.log('[ChatEngine] Message delivered:', data.messageId);
        break;

      case 'reconnected':
        if (data.missedMessages) {
          data.missedMessages.forEach(function (msg) {
            emit('onMessage', msg);
          });
        }
        break;

      case 'error':
        console.error('[ChatEngine] Server error:', data.message);
        emit('onError', data);
        break;
    }
  }

  /* ═══════ ROOM MANAGEMENT ═══════ */

  function joinRoom(roomId, userInfo) {
    if (!state.connected) {
      console.warn('[ChatEngine] Cannot join room - not connected');
      // Queue for when connected
      state.userInfo = userInfo;
      return false;
    }

    state.userInfo = userInfo;

    send({
      type: 'join_room',
      roomId: roomId,
      userInfo: userInfo
    });

    return true;
  }

  function leaveRoom(roomId) {
    if (!state.connected) return false;

    send({
      type: 'leave_room',
      roomId: roomId || state.currentRoom
    });

    state.currentRoom = null;
    return true;
  }

  function getCurrentRoom() {
    return state.currentRoom;
  }

  /* ═══════ MESSAGING ═══════ */

  function sendMessage(content, options) {
    options = options || {};

    var message = {
      type: 'chat',
      roomId: state.currentRoom,
      content: content,
      timestamp: Date.now()
    };

    if (options.replyTo) {
      message.replyTo = options.replyTo;
    }

    if (options.type) {
      message.messageType = options.type;
    }

    if (state.connected) {
      send(message);
    } else {
      // Queue message for later
      state.messageQueue.push(message);
    }

    return message;
  }

  function sendTyping(isTyping) {
    if (!state.connected || !state.currentRoom) return;

    // Debounce typing events
    if (isTyping === state.isTyping) return;
    state.isTyping = isTyping;

    send({
      type: 'typing',
      roomId: state.currentRoom,
      isTyping: isTyping
    });
  }

  function flushMessageQueue() {
    while (state.messageQueue.length > 0 && state.connected) {
      var msg = state.messageQueue.shift();
      msg.roomId = msg.roomId || state.currentRoom;
      send(msg);
    }
  }

  function send(data) {
    if (state.socket && state.connected) {
      state.socket.send(JSON.stringify(data));
    }
  }

  /* ═══════ PRESENCE ═══════ */

  function updatePresence(presenceData) {
    if (!state.connected) return;

    send({
      type: 'presence',
      roomId: state.currentRoom,
      ...presenceData
    });
  }

  /* ═══════ EVENT HANDLING ═══════ */

  function on(event, callback) {
    if (state.callbacks[event]) {
      state.callbacks[event].push(callback);
    }
    return ChatEngine;
  }

  function off(event, callback) {
    if (state.callbacks[event]) {
      var idx = state.callbacks[event].indexOf(callback);
      if (idx > -1) {
        state.callbacks[event].splice(idx, 1);
      }
    }
    return ChatEngine;
  }

  function emit(event, data) {
    if (state.callbacks[event]) {
      state.callbacks[event].forEach(function (cb) {
        try {
          cb(data);
        } catch (err) {
          console.error('[ChatEngine] Callback error:', err);
        }
      });
    }
  }

  /* ═══════ UTILITY ═══════ */

  function isConnected() {
    return state.connected;
  }

  function getUserInfo() {
    return state.userInfo;
  }

  function disconnect() {
    stopHeartbeat();
    if (state.socket) {
      state.socket.close();
      state.socket = null;
    }
    state.connected = false;
  }

  /* ═══════ INTEGRATION WITH PRESENCE.JS ═══════ */

  function upgradePresence() {
    // Check if presence.js is loaded
    if (typeof PresenceManager !== 'undefined') {
      // Override presence.js to use WebSocket instead of localStorage
      var originalSendHeartbeat = PresenceManager.sendHeartbeat;

      PresenceManager.sendHeartbeat = function () {
        // Send via WebSocket if connected
        if (state.connected && state.currentRoom) {
          updatePresence({
            zone: state.currentRoom,
            status: 'online'
          });
        } else {
          // Fall back to original localStorage method
          originalSendHeartbeat.call(PresenceManager);
        }
      };

      console.log('[ChatEngine] Upgraded presence.js to WebSocket mode');
    }
  }

  /* ═══════ PUBLIC API ═══════ */

  window.ChatEngine = {
    init: init,
    joinRoom: joinRoom,
    leaveRoom: leaveRoom,
    getCurrentRoom: getCurrentRoom,
    sendMessage: sendMessage,
    sendTyping: sendTyping,
    updatePresence: updatePresence,
    on: on,
    off: off,
    isConnected: isConnected,
    getUserInfo: getUserInfo,
    disconnect: disconnect,
    upgradePresence: upgradePresence,
    CONFIG: CONFIG
  };

})();
