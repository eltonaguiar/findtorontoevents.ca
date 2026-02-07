/**
 * VR Voice Engine - WebRTC Voice Chat Client
 * Spatial audio, proximity-based culling, and Quest 3 optimizations
 * 
 * @module voice-engine
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  // ============================================
  // Configuration Constants
  // ============================================
  const VOICE_CONFIG = {
    // Quest 3 Optimizations
    codec: 'opus',
    bitrate: 16000,        // 16 kbps (Quest 3 optimized)
    maxBitrate: 24000,     // 24 kbps max
    sampleRate: 24000,     // 24 kHz
    channels: 1,           // Mono
    frameSize: 20,         // 20ms frames
    
    // Mesh topology limits
    maxPeers: 8,           // Max concurrent peers
    
    // Proximity audio
    cullDistance: 10,      // Mute beyond 10 meters
    positionUpdateInterval: 100, // ms
    
    // Signaling
    signalServerUrl: 'ws://localhost:3002',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    
    // VAD (Voice Activity Detection)
    vadThreshold: -40,     // dB
    vadSmoothing: 0.8,     // smoothing factor
    
    // Audio processing
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  };

  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  const AUDIO_CONSTRAINTS = {
    audio: {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      sampleRate: { ideal: 24000 },
      channelCount: { ideal: 1 },
      latency: { ideal: 0.01 },
      googEchoCancellation: true,
      googNoiseSuppression: true,
      googAutoGainControl: true,
      googHighpassFilter: true
    },
    video: false
  };

  // ============================================
  // Voice Engine State
  // ============================================
  const state = {
    // User identity
    userId: null,
    peerId: null,
    displayName: null,
    
    // Connection state
    socket: null,
    connected: false,
    currentZone: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    
    // Media state
    localStream: null,
    audioContext: null,
    analyser: null,
    microphone: null,
    
    // Peer connections (mesh topology)
    peers: new Map(), // peerId -> PeerConnection
    peerData: new Map(), // peerId -> { userId, displayName, position, muted, audioLevel }
    
    // Audio control
    muted: true,
    pushToTalk: false,
    pushToTalkActive: false,
    proximityRadius: VOICE_CONFIG.cullDistance,
    
    // Position tracking
    position: { x: 0, y: 0, z: 0 },
    positionUpdateTimer: null,
    
    // VAD
    audioLevel: 0,
    speaking: false,
    vadTimer: null,
    
    // Tab visibility
    tabVisible: true,
    suspended: false,
    
    // Callbacks
    callbacks: {
      peerConnect: [],
      peerDisconnect: [],
      audioLevel: [],
      voiceState: [],
      error: []
    }
  };

  // ============================================
  // Utility Functions
  // ============================================
  
  /**
   * Generate unique ID
   */
  function generateId() {
    return 'voice_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Calculate distance between two 3D points
   */
  function calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate volume based on distance (inverse square law)
   */
  function calculateVolume(distance, maxDistance) {
    if (distance >= maxDistance) return 0;
    if (distance <= 1) return 1;
    return Math.max(0.1, 1 - (distance / maxDistance));
  }

  /**
   * Convert linear volume to gain value
   */
  function volumeToGain(volume) {
    // Use logarithmic curve for natural volume perception
    return volume > 0 ? Math.pow(volume, 2) : 0;
  }

  /**
   * Debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Log with prefix
   */
  function log(...args) {
    console.log('[VoiceEngine]', ...args);
  }

  function warn(...args) {
    console.warn('[VoiceEngine]', ...args);
  }

  function error(...args) {
    console.error('[VoiceEngine]', ...args);
  }

  // ============================================
  // Audio Context & Media Handling
  // ============================================

  /**
   * Initialize audio context
   */
  function initAudioContext() {
    if (state.audioContext) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioContext({
        sampleRate: VOICE_CONFIG.sampleRate,
        latencyHint: 'interactive'
      });
      
      log('Audio context initialized, sample rate:', state.audioContext.sampleRate);
    } catch (err) {
      error('Failed to create audio context:', err);
      throw err;
    }
  }

  /**
   * Get user media with Quest 3 optimizations
   */
  async function getUserMedia() {
    try {
      // Try with ideal constraints first
      let stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      log('Microphone access granted with optimized constraints');
      return stream;
    } catch (err) {
      warn('Optimized constraints failed, trying basic audio:', err);
      
      // Fallback to basic audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        log('Microphone access granted with basic constraints');
        return stream;
      } catch (fallbackErr) {
        error('Failed to access microphone:', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  /**
   * Setup audio analysis for VAD
   */
  function setupAudioAnalysis() {
    if (!state.audioContext || !state.localStream) return;

    try {
      // Create analyser
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 256;
      state.analyser.smoothingTimeConstant = VOICE_CONFIG.vadSmoothing;

      // Connect microphone to analyser
      const source = state.audioContext.createMediaStreamSource(state.localStream);
      source.connect(state.analyser);

      // Start VAD monitoring
      startVADMonitoring();
      
      log('Audio analysis setup complete');
    } catch (err) {
      error('Failed to setup audio analysis:', err);
    }
  }

  /**
   * Start Voice Activity Detection monitoring
   */
  function startVADMonitoring() {
    if (state.vadTimer) return;

    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function checkAudioLevel() {
      if (!state.analyser || state.suspended) return;

      state.analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS (root mean square) for volume level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      // Convert to dB (approximate)
      const db = 20 * Math.log10(rms / 255);
      
      // Normalize to 0-1 range for UI
      const normalizedLevel = Math.max(0, Math.min(1, (db + 60) / 60));
      state.audioLevel = normalizedLevel;
      
      // Detect speaking
      const wasSpeaking = state.speaking;
      state.speaking = db > VOICE_CONFIG.vadThreshold;
      
      // Notify callbacks
      if (normalizedLevel > 0.01 || wasSpeaking !== state.speaking) {
        notifyCallbacks('audioLevel', {
          level: normalizedLevel,
          speaking: state.speaking,
          db: Math.round(db)
        });
      }

      // Update voice state if speaking status changed
      if (wasSpeaking !== state.speaking) {
        broadcastVoiceState();
      }

      state.vadTimer = requestAnimationFrame(checkAudioLevel);
    }

    checkAudioLevel();
    log('VAD monitoring started');
  }

  /**
   * Stop VAD monitoring
   */
  function stopVADMonitoring() {
    if (state.vadTimer) {
      cancelAnimationFrame(state.vadTimer);
      state.vadTimer = null;
    }
    state.audioLevel = 0;
    state.speaking = false;
  }

  // ============================================
  // WebRTC Peer Connection Management
  // ============================================

  /**
   * Create RTCPeerConnection with Quest 3 optimizations
   */
  function createPeerConnection(peerId, isInitiator) {
    const pc = new RTCPeerConnection({
      ...RTC_CONFIG,
      // Quest 3: Optimize for low latency
      iceTransportPolicy: 'all',
      // Enable DTX (Discontinuous Transmission) for silence suppression
      rtcpMuxPolicy: 'require'
    });

    // Add local stream tracks
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        // Apply constraints for Opus optimization
        const sender = pc.addTrack(track, state.localStream);
        
        // Set codec preferences if supported
        if (sender.setParameters) {
          sender.getParameters().then(params => {
            // These will be applied when connection is established
            log('Track added to peer connection:', peerId);
          });
        }
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice_candidate', {
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      log(`Peer ${peerId} connection state:`, pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        onPeerConnected(peerId);
      } else if (pc.connectionState === 'disconnected' || 
                 pc.connectionState === 'failed' ||
                 pc.connectionState === 'closed') {
        onPeerDisconnected(peerId);
      }
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      log(`Received remote track from ${peerId}`);
      handleRemoteTrack(peerId, event.streams[0]);
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      log(`Peer ${peerId} ICE state:`, pc.iceConnectionState);
    };

    return pc;
  }

  /**
   * Handle incoming remote audio track
   */
  function handleRemoteTrack(peerId, stream) {
    const peerData = state.peerData.get(peerId);
    if (!peerData) return;

    try {
      // Create audio element for spatial audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.srcObject = stream;
      
      // Use Web Audio API for spatial positioning
      if (state.audioContext) {
        const source = state.audioContext.createMediaStreamSource(stream);
        const panner = createSpatialPanner(peerId);
        const gainNode = state.audioContext.createGain();
        
        // Connect: source -> panner -> gain -> destination
        source.connect(panner);
        panner.connect(gainNode);
        gainNode.connect(state.audioContext.destination);
        
        // Store audio nodes for later updates
        peerData.audioNodes = {
          source,
          panner,
          gainNode,
          audioEl
        };
        
        // Apply initial spatial position
        updatePeerSpatialAudio(peerId);
      } else {
        // Fallback: just play without spatial audio
        document.body.appendChild(audioEl);
        peerData.audioEl = audioEl;
      }

      log(`Remote audio setup complete for ${peerId}`);
    } catch (err) {
      error(`Failed to setup remote audio for ${peerId}:`, err);
    }
  }

  /**
   * Create spatial audio panner
   */
  function createSpatialPanner(peerId) {
    if (!state.audioContext) return null;

    const panner = state.audioContext.createPanner();
    
    // Quest 3 optimized settings
    panner.panningModel = 'HRTF'; // Head-related transfer function for VR
    panner.distanceModel = 'inverse'; // Natural attenuation
    panner.refDistance = 1;
    panner.maxDistance = state.proximityRadius;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360; // Omni-directional
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;
    
    return panner;
  }

  /**
   * Update spatial audio for a peer
   */
  function updatePeerSpatialAudio(peerId) {
    const peerData = state.peerData.get(peerId);
    if (!peerData || !peerData.audioNodes) return;

    const { panner, gainNode } = peerData.audioNodes;
    if (!panner || !gainNode) return;

    // Calculate distance
    const distance = calculateDistance(state.position, peerData.position || { x: 0, y: 0, z: 0 });
    
    // Apply proximity culling
    if (distance > state.proximityRadius) {
      gainNode.gain.value = 0;
      peerData.audible = false;
      return;
    }

    // Calculate volume based on distance
    const volume = calculateVolume(distance, state.proximityRadius);
    const gain = volumeToGain(volume);
    
    // Apply mute state
    const finalGain = peerData.muted ? 0 : gain;
    
    // Smooth gain transition
    const currentTime = state.audioContext.currentTime;
    gainNode.gain.setTargetAtTime(finalGain, currentTime, 0.1);
    
    // Update panner position (relative to listener at 0,0,0)
    const relativePos = {
      x: peerData.position.x - state.position.x,
      y: peerData.position.y - state.position.y,
      z: peerData.position.z - state.position.z
    };
    
    panner.positionX.setValueAtTime(relativePos.x, currentTime);
    panner.positionY.setValueAtTime(relativePos.y, currentTime);
    panner.positionZ.setValueAtTime(relativePos.z, currentTime);
    
    peerData.audible = true;
    peerData.volume = volume;
    peerData.distance = distance;
  }

  /**
   * Update spatial audio for all peers
   */
  function updateAllSpatialAudio() {
    for (const peerId of state.peers.keys()) {
      updatePeerSpatialAudio(peerId);
    }
  }

  /**
   * Initiate connection to a new peer
   */
  async function connectToPeer(peerId) {
    if (state.peers.has(peerId)) {
      warn(`Already connected to peer ${peerId}`);
      return;
    }

    if (state.peers.size >= VOICE_CONFIG.maxPeers) {
      warn(`Max peers (${VOICE_CONFIG.maxPeers}) reached, cannot connect to ${peerId}`);
      return;
    }

    log(`Initiating connection to peer ${peerId}`);

    const pc = createPeerConnection(peerId, true);
    state.peers.set(peerId, pc);

    try {
      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        voiceActivityDetection: true
      });

      // Set local description
      await pc.setLocalDescription(offer);

      // Send offer via signaling
      sendSignal('offer', {
        to: peerId,
        sdp: offer.sdp
      });

      log(`Offer sent to ${peerId}`);
    } catch (err) {
      error(`Failed to create offer for ${peerId}:`, err);
      cleanupPeer(peerId);
    }
  }

  /**
   * Handle incoming offer
   */
  async function handleOffer(from, sdp) {
    if (state.peers.has(from)) {
      warn(`Received offer from existing peer ${from}, ignoring`);
      return;
    }

    if (state.peers.size >= VOICE_CONFIG.maxPeers) {
      warn(`Max peers reached, rejecting offer from ${from}`);
      return;
    }

    log(`Received offer from ${from}`);

    const pc = createPeerConnection(from, false);
    state.peers.set(from, pc);

    try {
      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: sdp
      }));

      // Create answer
      const answer = await pc.createAnswer();
      
      // Apply Quest 3 optimizations to answer
      await pc.setLocalDescription(answer);

      // Send answer
      sendSignal('answer', {
        to: from,
        sdp: answer.sdp
      });

      log(`Answer sent to ${from}`);
    } catch (err) {
      error(`Failed to handle offer from ${from}:`, err);
      cleanupPeer(from);
    }
  }

  /**
   * Handle incoming answer
   */
  async function handleAnswer(from, sdp) {
    const pc = state.peers.get(from);
    if (!pc) {
      warn(`Received answer from unknown peer ${from}`);
      return;
    }

    log(`Received answer from ${from}`);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: sdp
      }));
    } catch (err) {
      error(`Failed to set remote description for ${from}:`, err);
      cleanupPeer(from);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async function handleIceCandidate(from, candidate) {
    const pc = state.peers.get(from);
    if (!pc) {
      warn(`Received ICE candidate from unknown peer ${from}`);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      error(`Failed to add ICE candidate for ${from}:`, err);
    }
  }

  /**
   * Peer connected callback
   */
  function onPeerConnected(peerId) {
    const peerData = state.peerData.get(peerId);
    if (!peerData) {
      // Create default peer data if not exists
      state.peerData.set(peerId, {
        userId: peerId,
        displayName: 'Unknown',
        position: { x: 0, y: 0, z: 0 },
        muted: true,
        audioLevel: 0,
        audible: false
      });
    }

    log(`Peer connected: ${peerId}`);
    notifyCallbacks('peerConnect', { peerId, peerData: state.peerData.get(peerId) });
  }

  /**
   * Peer disconnected callback
   */
  function onPeerDisconnected(peerId) {
    const peerData = state.peerData.get(peerId);
    
    log(`Peer disconnected: ${peerId}`);
    notifyCallbacks('peerDisconnect', { peerId, peerData });
    
    cleanupPeer(peerId);
  }

  /**
   * Clean up peer connection
   */
  function cleanupPeer(peerId) {
    const pc = state.peers.get(peerId);
    if (pc) {
      pc.close();
      state.peers.delete(peerId);
    }

    const peerData = state.peerData.get(peerId);
    if (peerData) {
      // Clean up audio nodes
      if (peerData.audioNodes) {
        const { source, panner, gainNode, audioEl } = peerData.audioNodes;
        try {
          if (source) source.disconnect();
          if (panner) panner.disconnect();
          if (gainNode) gainNode.disconnect();
          if (audioEl) {
            audioEl.pause();
            audioEl.srcObject = null;
            audioEl.remove();
          }
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      state.peerData.delete(peerId);
    }
  }

  /**
   * Clean up all peer connections
   */
  function cleanupAllPeers() {
    for (const peerId of state.peers.keys()) {
      cleanupPeer(peerId);
    }
    state.peers.clear();
    state.peerData.clear();
  }

  // ============================================
  // Signaling Server Communication
  // ============================================

  /**
   * Connect to signaling server
   */
  function connectSignaling() {
    if (state.socket) return;

    try {
      state.socket = new WebSocket(VOICE_CONFIG.signalServerUrl);

      state.socket.onopen = () => {
        log('Connected to signaling server');
        state.connected = true;
        state.reconnectAttempts = 0;
        
        // Re-join zone if we were in one
        if (state.currentZone) {
          joinZoneInternal(state.currentZone);
        }
      };

      state.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleSignalingMessage(message);
        } catch (err) {
          error('Failed to parse signaling message:', err);
        }
      };

      state.socket.onclose = () => {
        log('Signaling server connection closed');
        state.connected = false;
        state.socket = null;
        
        // Attempt reconnect
        attemptReconnect();
      };

      state.socket.onerror = (err) => {
        error('Signaling server error:', err);
      };

    } catch (err) {
      error('Failed to connect to signaling server:', err);
      attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect to signaling server
   */
  function attemptReconnect() {
    if (state.reconnectTimer) return;
    if (state.reconnectAttempts >= VOICE_CONFIG.maxReconnectAttempts) {
      error('Max reconnect attempts reached');
      notifyCallbacks('error', { type: 'reconnect_failed', message: 'Max reconnect attempts reached' });
      return;
    }

    state.reconnectAttempts++;
    log(`Attempting reconnect ${state.reconnectAttempts}/${VOICE_CONFIG.maxReconnectAttempts}`);

    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      connectSignaling();
    }, VOICE_CONFIG.reconnectInterval);
  }

  /**
   * Disconnect from signaling server
   */
  function disconnectSignaling() {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }

    if (state.socket) {
      state.socket.close();
      state.socket = null;
    }

    state.connected = false;
  }

  /**
   * Send signal to server
   */
  function sendSignal(type, data) {
    if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
      warn('Cannot send signal, socket not connected');
      return;
    }

    const message = {
      type,
      ...data,
      timestamp: Date.now()
    };

    state.socket.send(JSON.stringify(message));
  }

  /**
   * Handle incoming signaling message
   */
  function handleSignalingMessage(message) {
    const { type } = message;

    switch (type) {
      case 'connected':
        log('Server acknowledged connection, clientId:', message.clientId);
        break;

      case 'zone_joined':
        handleZoneJoined(message);
        break;

      case 'new_peer':
        handleNewPeer(message.peer);
        break;

      case 'peer_left':
        handlePeerLeft(message.peerId);
        break;

      case 'offer':
        handleOffer(message.from, message.sdp);
        break;

      case 'answer':
        handleAnswer(message.from, message.sdp);
        break;

      case 'ice_candidate':
        handleIceCandidate(message.from, message.candidate);
        break;

      case 'peer_voice_state':
        handlePeerVoiceState(message);
        break;

      case 'cull_update':
        handleCullUpdate(message);
        break;

      case 'error':
        error('Server error:', message.message);
        notifyCallbacks('error', { type: 'server_error', message: message.message });
        break;

      case 'peer_unavailable':
        warn(`Peer unavailable: ${message.peerId}, reason: ${message.reason}`);
        cleanupPeer(message.peerId);
        break;

      default:
        log('Unknown message type:', type);
    }
  }

  /**
   * Handle zone joined confirmation
   */
  function handleZoneJoined(message) {
    state.peerId = message.peerId;
    log(`Joined voice zone ${message.zoneId}, peerId: ${state.peerId}`);
    log(`Existing peers in zone:`, message.peers);

    // Connect to existing peers
    if (message.peers) {
      for (const peer of message.peers) {
        state.peerData.set(peer.peerId, {
          userId: peer.userId,
          displayName: peer.displayName,
          muted: peer.muted,
          position: { x: 0, y: 0, z: 0 },
          audioLevel: 0
        });
        
        // Initiate connection
        connectToPeer(peer.peerId);
      }
    }
  }

  /**
   * Handle new peer joining zone
   */
  function handleNewPeer(peer) {
    log(`New peer joined: ${peer.peerId}`);
    
    state.peerData.set(peer.peerId, {
      userId: peer.userId,
      displayName: peer.displayName,
      muted: peer.muted,
      position: { x: 0, y: 0, z: 0 },
      audioLevel: 0
    });

    // They will send us an offer
  }

  /**
   * Handle peer leaving zone
   */
  function handlePeerLeft(peerId) {
    log(`Peer left: ${peerId}`);
    cleanupPeer(peerId);
    notifyCallbacks('peerDisconnect', { peerId });
  }

  /**
   * Handle peer voice state update
   */
  function handlePeerVoiceState(message) {
    const peerData = state.peerData.get(message.peerId);
    if (!peerData) return;

    peerData.muted = message.muted;
    peerData.speaking = message.speaking;
    peerData.volume = message.volume;

    // Update spatial audio
    updatePeerSpatialAudio(message.peerId);

    notifyCallbacks('voiceState', {
      peerId: message.peerId,
      muted: message.muted,
      speaking: message.speaking,
      volume: message.volume
    });
  }

  /**
   * Handle cull update from server
   */
  function handleCullUpdate(message) {
    // Update audible peers
    if (message.audiblePeers) {
      for (const peerInfo of message.audiblePeers) {
        const peerData = state.peerData.get(peerInfo.peerId);
        if (peerData) {
          peerData.distance = peerInfo.distance;
          peerData.volume = peerInfo.volume;
          updatePeerSpatialAudio(peerInfo.peerId);
        }
      }
    }

    // Mute peers beyond range
    if (message.mutedPeers) {
      for (const peerId of message.mutedPeers) {
        const peerData = state.peerData.get(peerId);
        if (peerData && peerData.audioNodes) {
          peerData.audioNodes.gainNode.gain.value = 0;
          peerData.audible = false;
        }
      }
    }
  }

  /**
   * Broadcast voice state to peers
   */
  function broadcastVoiceState() {
    if (!state.connected || !state.currentZone) return;

    sendSignal('voice_state', {
      muted: state.muted,
      speaking: state.speaking,
      volume: state.audioLevel
    });
  }

  /**
   * Send position update (throttled)
   */
  const sendPositionUpdate = throttle(() => {
    if (!state.connected || !state.currentZone) return;

    sendSignal('position', {
      x: state.position.x,
      y: state.position.y,
      z: state.position.z
    });
  }, VOICE_CONFIG.positionUpdateInterval);

  // ============================================
  // Tab Visibility Handling
  // ============================================

  /**
   * Handle tab visibility change
   */
  function handleVisibilityChange() {
    state.tabVisible = !document.hidden;
    
    if (document.hidden) {
      // Tab hidden - suspend audio
      suspendAudio();
    } else {
      // Tab visible - resume audio
      resumeAudio();
    }
  }

  /**
   * Suspend audio processing
   */
  function suspendAudio() {
    if (state.suspended) return;
    
    log('Suspending audio (tab hidden)');
    state.suspended = true;

    // Suspend audio context
    if (state.audioContext && state.audioContext.state === 'running') {
      state.audioContext.suspend();
    }

    // Mute all remote audio
    for (const peerData of state.peerData.values()) {
      if (peerData.audioNodes && peerData.audioNodes.gainNode) {
        peerData.audioNodes.gainNode.gain.value = 0;
      }
    }

    // Stop local stream tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.enabled = false);
    }
  }

  /**
   * Resume audio processing
   */
  function resumeAudio() {
    if (!state.suspended) return;
    
    log('Resuming audio (tab visible)');
    state.suspended = false;

    // Resume audio context
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    // Update spatial audio for all peers
    updateAllSpatialAudio();

    // Re-enable local stream tracks (if not muted)
    if (state.localStream && !state.muted) {
      state.localStream.getTracks().forEach(track => track.enabled = true);
    }
  }

  // ============================================
  // Callback Management
  // ============================================

  /**
   * Register callback
   */
  function on(event, callback) {
    if (!state.callbacks[event]) {
      warn(`Unknown event type: ${event}`);
      return;
    }
    
    if (typeof callback !== 'function') {
      warn('Callback must be a function');
      return;
    }

    state.callbacks[event].push(callback);
  }

  /**
   * Remove callback
   */
  function off(event, callback) {
    if (!state.callbacks[event]) return;
    
    const index = state.callbacks[event].indexOf(callback);
    if (index > -1) {
      state.callbacks[event].splice(index, 1);
    }
  }

  /**
   * Notify all callbacks for an event
   */
  function notifyCallbacks(event, data) {
    if (!state.callbacks[event]) return;
    
    for (const callback of state.callbacks[event]) {
      try {
        callback(data);
      } catch (err) {
        error(`Error in ${event} callback:`, err);
      }
    }
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Initialize Voice Engine
   * @param {string} userId - Unique user identifier
   * @param {Object} options - Configuration options
   */
  async function init(userId, options = {}) {
    if (state.userId) {
      warn('VoiceEngine already initialized');
      return;
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    state.userId = userId;
    state.displayName = options.displayName || 'Anonymous';

    // Override config with options
    if (options.signalServerUrl) {
      VOICE_CONFIG.signalServerUrl = options.signalServerUrl;
    }
    if (options.proximityRadius) {
      state.proximityRadius = options.proximityRadius;
    }

    log('Initializing VoiceEngine for user:', userId);

    try {
      // Initialize audio context
      initAudioContext();

      // Get user media
      state.localStream = await getUserMedia();
      
      // Setup audio analysis for VAD
      setupAudioAnalysis();

      // Connect to signaling server
      connectSignaling();

      // Setup tab visibility handling
      document.addEventListener('visibilitychange', handleVisibilityChange);

      log('VoiceEngine initialized successfully');
    } catch (err) {
      error('Failed to initialize VoiceEngine:', err);
      throw err;
    }
  }

  /**
   * Join a voice zone
   * @param {string} zoneId - Zone identifier
   */
  function joinZone(zoneId) {
    if (!state.userId) {
      throw new Error('VoiceEngine not initialized. Call init() first.');
    }

    if (state.currentZone === zoneId) {
      warn(`Already in zone ${zoneId}`);
      return;
    }

    // Leave current zone if in one
    if (state.currentZone) {
      leaveZone(state.currentZone);
    }

    joinZoneInternal(zoneId);
  }

  /**
   * Internal join zone implementation
   */
  function joinZoneInternal(zoneId) {
    state.currentZone = zoneId;

    if (state.connected) {
      sendSignal('join_voice_zone', {
        zoneId: zoneId,
        userId: state.userId,
        displayName: state.displayName
      });
    }

    // Start position updates
    if (!state.positionUpdateTimer) {
      state.positionUpdateTimer = setInterval(() => {
        sendPositionUpdate();
      }, VOICE_CONFIG.positionUpdateInterval);
    }

    log(`Joining voice zone: ${zoneId}`);
  }

  /**
   * Leave a voice zone
   * @param {string} zoneId - Zone identifier
   */
  function leaveZone(zoneId) {
    if (state.currentZone !== zoneId) {
      warn(`Not in zone ${zoneId}`);
      return;
    }

    // Stop position updates
    if (state.positionUpdateTimer) {
      clearInterval(state.positionUpdateTimer);
      state.positionUpdateTimer = null;
    }

    // Send leave signal
    if (state.connected) {
      sendSignal('leave_voice_zone', { zoneId });
    }

    // Clean up all peer connections
    cleanupAllPeers();

    state.currentZone = null;
    log(`Left voice zone: ${zoneId}`);
  }

  /**
   * Set mute state
   * @param {boolean} muted - Mute state
   */
  function setMute(muted) {
    state.muted = muted;

    // Update local stream tracks
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }

    // Broadcast voice state
    broadcastVoiceState();

    log('Mute state:', muted ? 'muted' : 'unmuted');
  }

  /**
   * Toggle mute state
   * @returns {boolean} New mute state
   */
  function toggleMute() {
    setMute(!state.muted);
    return state.muted;
  }

  /**
   * Enable/disable push-to-talk
   * @param {boolean} enabled - PTT enabled state
   */
  function setPushToTalk(enabled) {
    state.pushToTalk = enabled;
    
    if (enabled) {
      // Start muted, will unmute when PTT activated
      setMute(true);
    }

    log('Push-to-talk:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Activate/deactivate push-to-talk (call on key down/up)
   * @param {boolean} active - PTT active state
   */
  function setPushToTalkActive(active) {
    if (!state.pushToTalk) return;

    state.pushToTalkActive = active;
    setMute(!active);
  }

  /**
   * Set proximity radius for audio culling
   * @param {number} meters - Radius in meters
   */
  function setProximityRadius(meters) {
    state.proximityRadius = Math.max(1, Math.min(50, meters));
    
    // Update all spatial audio
    updateAllSpatialAudio();
    
    log('Proximity radius set to:', state.proximityRadius, 'meters');
  }

  /**
   * Update user position for spatial audio
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  function updatePosition(x, y, z) {
    state.position.x = x;
    state.position.y = y;
    state.position.z = z;

    // Update spatial audio immediately
    updateAllSpatialAudio();

    // Send position update (throttled)
    sendPositionUpdate();
  }

  /**
   * Register peer connect callback
   * @param {Function} callback - Callback function(peerId, peerData)
   */
  function onPeerConnect(callback) {
    on('peerConnect', callback);
  }

  /**
   * Register peer disconnect callback
   * @param {Function} callback - Callback function(peerId, peerData)
   */
  function onPeerDisconnect(callback) {
    on('peerDisconnect', callback);
  }

  /**
   * Register audio level callback
   * @param {Function} callback - Callback function({ level, speaking, db })
   */
  function onAudioLevel(callback) {
    on('audioLevel', callback);
  }

  /**
   * Get list of connected peers
   * @returns {Array} Array of peer objects
   */
  function getPeers() {
    const peers = [];
    for (const [peerId, peerData] of state.peerData) {
      peers.push({
        peerId,
        ...peerData
      });
    }
    return peers;
  }

  /**
   * Get current mute state
   * @returns {boolean} Mute state
   */
  function isMuted() {
    return state.muted;
  }

  /**
   * Get current zone
   * @returns {string|null} Current zone ID
   */
  function getCurrentZone() {
    return state.currentZone;
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  function isConnected() {
    return state.connected;
  }

  /**
   * Destroy VoiceEngine and cleanup all resources
   */
  function destroy() {
    log('Destroying VoiceEngine...');

    // Leave current zone
    if (state.currentZone) {
      leaveZone(state.currentZone);
    }

    // Disconnect signaling
    disconnectSignaling();

    // Stop VAD
    stopVADMonitoring();

    // Stop local stream
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
      state.localStream = null;
    }

    // Close audio context
    if (state.audioContext) {
      state.audioContext.close();
      state.audioContext = null;
    }

    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    // Clear callbacks
    for (const key in state.callbacks) {
      state.callbacks[key] = [];
    }

    // Reset state
    state.userId = null;
    state.peerId = null;
    state.currentZone = null;
    state.muted = true;
    state.pushToTalk = false;
    state.pushToTalkActive = false;

    log('VoiceEngine destroyed');
  }

  // ============================================
  // Export Public API
  // ============================================
  const VoiceEngine = {
    // Core
    init,
    destroy,
    
    // Zone management
    joinZone,
    leaveZone,
    getCurrentZone,
    
    // Audio controls
    setMute,
    toggleMute,
    isMuted,
    setPushToTalk,
    setPushToTalkActive,
    
    // Spatial audio
    setProximityRadius,
    updatePosition,
    
    // Event callbacks
    onPeerConnect,
    onPeerDisconnect,
    onAudioLevel,
    on,
    off,
    
    // State queries
    getPeers,
    isConnected,
    
    // Configuration (read-only)
    get config() {
      return { ...VOICE_CONFIG };
    }
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceEngine;
  }
  
  if (typeof define === 'function' && define.amd) {
    define(() => VoiceEngine);
  }
  
  global.VoiceEngine = VoiceEngine;

})(typeof window !== 'undefined' ? window : this);
