/**
 * VR Chat & Voice Server Starter
 * Starts both the chat server and signal server
 * 
 * @module start-servers
 * @version 1.0.0
 */

const VRChatServer = require('./chat-server');
const VRSignalServer = require('./signal-server');

async function startServers() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     VR Chat & Voice Server - findtorontoevents.ca      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const chatPort = process.env.CHAT_PORT || 3001;
  const signalPort = process.env.SIGNAL_PORT || 3002;
  const corsOrigin = process.env.CORS_ORIGIN || '*';

  try {
    // Start chat server
    const chatServer = new VRChatServer({
      port: chatPort,
      corsOrigin: corsOrigin,
      dbPath: './vr_chat.db'
    });

    await chatServer.start();

    // Start signal server
    const signalServer = new VRSignalServer({
      port: signalPort,
      corsOrigin: corsOrigin
    });

    await signalServer.start();

    console.log('');
    console.log('✅ Both servers started successfully!');
    console.log('');
    console.log('📡 Endpoints:');
    console.log(`   Chat Server:    http://localhost:${chatPort}`);
    console.log(`   Signal Server:  http://localhost:${signalPort}`);
    console.log('');
    console.log('🔌 WebSocket URLs:');
    console.log(`   Chat:    ws://localhost:${chatPort}`);
    console.log(`   Signal:  ws://localhost:${signalPort}`);
    console.log('');
    console.log('📚 API Documentation:');
    console.log(`   GET  /health                    - Health check`);
    console.log(`   GET  /api/chat/rooms            - List all rooms`);
    console.log(`   GET  /api/chat/history/:roomId  - Get message history`);
    console.log(`   POST /api/chat/message          - Send message (REST)`);
    console.log(`   GET  /api/presence/online       - Get online users`);
    console.log(`   GET  /api/stats                 - Server statistics`);
    console.log(`   GET  /api/signal/ice-config     - WebRTC ICE config`);
    console.log(`   GET  /api/signal/zones          - Active voice zones`);
    console.log(`   GET  /api/signal/peers/:zoneId  - Peers in zone`);
    console.log('');
    console.log('🧪 Test Client:');
    console.log(`   Open: http://localhost:${chatPort}/test-client.html`);
    console.log('');

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log('');
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      await chatServer.stop();
      await signalServer.stop();
      
      console.log('👋 Servers stopped. Goodbye!');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start servers:', err);
    process.exit(1);
  }
}

// Start servers
startServers();
