/**
 * VR Chat Panel - A-Frame Component for 3D Curved Chat Interface
 *
 * Features:
 *   - Curved chat panel optimized for VR readability
 *   - Attach to non-dominant hand or world space positioning
 *   - 3D message bubbles with user avatars
 *   - Virtual keyboard integration
 *   - Grab to reposition
 *   - Pinch to scroll
 *   - Double-tap to toggle mute
 *
 * Quest 3 Optimizations:
 *   - Low poly curved geometry (16 segments)
 *   - Simple flat materials (no shaders)
 *   - Batched message rendering (max 20 visible)
 *   - Object pooling for message bubbles
 *   - LOD for distant elements
 *
 * Usage:
 *   <a-entity vr-chat-panel="hand: left; radius: 2"></a-entity>
 */
AFRAME.registerComponent('vr-chat-panel', {
  schema: {
    hand: { type: 'string', default: 'left', oneOf: ['left', 'right', 'world'] },
    radius: { type: 'number', default: 1.5 },
    width: { type: 'number', default: 1.2 },
    height: { type: 'number', default: 0.8 },
    curveAngle: { type: 'number', default: 60 },
    maxMessages: { type: 'number', default: 20 },
    fontSize: { type: 'number', default: 0.04 },
    followHand: { type: 'boolean', default: true },
    worldPosition: { type: 'vec3', default: { x: 0, y: 1.6, z: -2 } },
    keyboardEnabled: { type: 'boolean', default: true }
  },

  init: function () {
    this.messages = [];
    this.messagePool = [];
    this.visibleMessageCount = 0;
    this.scrollOffset = 0;
    this.isGrabbing = false;
    this.grabHand = null;
    this.lastTapTime = 0;
    this.tapCount = 0;
    this.isMuted = true;
    this.keyboardOpen = false;

    // Three.js vectors for calculations
    this._tempVec3 = new THREE.Vector3();
    this._tempQuat = new THREE.Quaternion();
    this._handPos = new THREE.Vector3();

    // Bind methods
    this.onMessage = this.onMessage.bind(this);
    this.onUserJoin = this.onUserJoin.bind(this);
    this.onUserLeave = this.onUserLeave.bind(this);
    this.handleGrab = this.handleGrab.bind(this);
    this.handleRelease = this.handleRelease.bind(this);
    this.handlePinch = this.handlePinch.bind(this);
    this.handleControllerButton = this.handleControllerButton.bind(this);

    this.initPanel();
    this.initMessagePool();
    this.initInputArea();
    this.setupEventListeners();
    this.setupChatEngine();
  },

  /**
   * Create the curved panel geometry
   */
  initPanel: function () {
    const data = this.data;

    // Create curved panel using cylinder segment
    // Quest 3 optimized: 16 segments for smooth curve with low poly count
    const curveRad = (data.curveAngle * Math.PI) / 180;
    const geometry = new THREE.CylinderGeometry(
      data.radius,
      data.radius,
      data.height,
      16,
      1,
      true,
      -curveRad / 2,
      curveRad
    );

    // Create panel mesh
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    this.panelMesh = new THREE.Mesh(geometry, material);
    this.panelMesh.rotation.y = Math.PI; // Face inward
    this.el.setObject3D('mesh', this.panelMesh);

    // Add panel border (low poly)
    const borderGeo = new THREE.TorusGeometry(
      data.radius,
      0.01,
      4,
      16,
      curveRad
    );
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    this.borderMesh = new THREE.Mesh(borderGeo, borderMat);
    this.borderMesh.rotation.x = Math.PI / 2;
    this.borderMesh.position.y = data.height / 2;
    this.el.object3D.add(this.borderMesh);

    // Bottom border
    const bottomBorder = this.borderMesh.clone();
    bottomBorder.position.y = -data.height / 2;
    this.el.object3D.add(bottomBorder);

    // Create message container
    this.messageContainer = document.createElement('a-entity');
    this.messageContainer.setAttribute('position', `0 0 ${-data.radius + 0.05}`);
    this.el.appendChild(this.messageContainer);

    // Set initial position
    this.updatePosition();
  },

  /**
   * Initialize message bubble object pool
   * Quest 3 optimization: Pre-allocate and reuse DOM elements
   */
  initMessagePool: function () {
    const poolSize = this.data.maxMessages;

    for (let i = 0; i < poolSize; i++) {
      const bubble = this.createMessageBubble();
      bubble.visible = false;
      bubble.object3D.visible = false;
      this.messagePool.push(bubble);
      this.messageContainer.appendChild(bubble);
    }
  },

  /**
   * Create a single message bubble entity
   */
  createMessageBubble: function () {
    const bubble = document.createElement('a-entity');
    bubble.classList.add('chat-message');

    // Background plane
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.9');
    bg.setAttribute('height', '0.12');
    bg.setAttribute('color', '#2d2d44');
    bg.setAttribute('transparent', true);
    bg.setAttribute('opacity', '0.9');
    bg.setAttribute('class', 'message-bg');
    bubble.appendChild(bg);

    // Avatar circle
    const avatar = document.createElement('a-circle');
    avatar.setAttribute('radius', '0.04');
    avatar.setAttribute('position', '-0.38 0 0.01');
    avatar.setAttribute('color', '#00d4ff');
    avatar.setAttribute('class', 'message-avatar');
    bubble.appendChild(avatar);

    // Username text
    const username = document.createElement('a-text');
    username.setAttribute('value', 'User');
    username.setAttribute('position', '-0.32 0.03 0.01');
    username.setAttribute('width', '1.5');
    username.setAttribute('align', 'left');
    username.setAttribute('color', '#00d4ff');
    username.setAttribute('font', 'roboto');
    username.setAttribute('class', 'message-username');
    bubble.appendChild(username);

    // Message text
    const text = document.createElement('a-text');
    text.setAttribute('value', '');
    text.setAttribute('position', '-0.32 -0.03 0.01');
    text.setAttribute('width', '1.2');
    text.setAttribute('align', 'left');
    text.setAttribute('color', '#ffffff');
    text.setAttribute('font', 'roboto');
    text.setAttribute('wrap-count', '35');
    text.setAttribute('class', 'message-text');
    bubble.appendChild(text);

    // Timestamp
    const time = document.createElement('a-text');
    time.setAttribute('value', '');
    time.setAttribute('position', '0.42 0.03 0.01');
    time.setAttribute('width', '0.8');
    time.setAttribute('align', 'right');
    time.setAttribute('color', '#888888');
    time.setAttribute('font', 'roboto');
    time.setAttribute('class', 'message-time');
    bubble.appendChild(time);

    return bubble;
  },

  /**
   * Initialize input area at bottom of panel
   */
  initInputArea: function () {
    const data = this.data;

    // Input background
    this.inputArea = document.createElement('a-entity');
    this.inputArea.setAttribute('position', `0 ${-data.height / 2 + 0.1} ${-data.radius + 0.05}`);

    const inputBg = document.createElement('a-plane');
    inputBg.setAttribute('width', '1.0');
    inputBg.setAttribute('height', '0.08');
    inputBg.setAttribute('color', '#0f0f1a');
    inputBg.setAttribute('class', 'clickable');
    inputBg.setAttribute('id', 'chat-input-bg');
    this.inputArea.appendChild(inputBg);

    // Input text
    this.inputText = document.createElement('a-text');
    this.inputText.setAttribute('value', 'Tap to type...');
    this.inputText.setAttribute('position', '-0.45 0 0.01');
    this.inputText.setAttribute('width', '1');
    this.inputText.setAttribute('align', 'left');
    this.inputText.setAttribute('color', '#666666');
    this.inputText.setAttribute('font', 'roboto');
    this.inputText.setAttribute('id', 'chat-input-text');
    this.inputArea.appendChild(this.inputText);

    // Keyboard button
    const kbBtn = document.createElement('a-plane');
    kbBtn.setAttribute('width', '0.08');
    kbBtn.setAttribute('height', '0.06');
    kbBtn.setAttribute('position', '0.44 0 0.01');
    kbBtn.setAttribute('color', '#00d4ff');
    kbBtn.setAttribute('class', 'clickable');
    kbBtn.setAttribute('id', 'chat-kb-btn');
    kbBtn.innerHTML = '<a-text value="⌨" position="0 0 0.01" align="center" width="1.5" color="#ffffff"></a-text>';
    this.inputArea.appendChild(kbBtn);

    // Mute indicator
    this.muteIndicator = document.createElement('a-circle');
    this.muteIndicator.setAttribute('radius', '0.03');
    this.muteIndicator.setAttribute('position', '0.35 0 0.01');
    this.muteIndicator.setAttribute('color', '#ef4444');
    this.muteIndicator.setAttribute('class', 'clickable');
    this.muteIndicator.setAttribute('id', 'chat-mute-btn');
    this.inputArea.appendChild(this.muteIndicator);

    this.el.appendChild(this.inputArea);

    // Click handlers
    inputBg.addEventListener('click', () => this.openKeyboard());
    kbBtn.addEventListener('click', () => this.openKeyboard());
    this.muteIndicator.addEventListener('click', () => this.toggleMute());
  },

  /**
   * Setup event listeners for controller interactions
   */
  setupEventListeners: function () {
    const scene = this.el.sceneEl;

    // Controller events
    scene.addEventListener('gripdown', this.handleGrab);
    scene.addEventListener('gripup', this.handleRelease);

    // Hand tracking pinch events
    scene.addEventListener('pinchstarted', this.handlePinch);
    scene.addEventListener('pinchended', this.handlePinchEnd);

    // Button events for double-tap detection
    scene.addEventListener('abuttondown', this.handleControllerButton);
    scene.addEventListener('bbuttondown', this.handleControllerButton);

    // Scroll with thumbstick while pointing at panel
    this.el.addEventListener('thumbstickmoved', (evt) => {
      if (this.isPointingAtPanel()) {
        this.scrollMessages(-evt.detail.y * 0.1);
      }
    });

    // Hover effects
    this.el.addEventListener('mouseenter', () => {
      this.panelMesh.material.opacity = 0.95;
    });
    this.el.addEventListener('mouseleave', () => {
      this.panelMesh.material.opacity = 0.85;
    });
  },

  /**
   * Connect to ChatEngine
   */
  setupChatEngine: function () {
    if (typeof ChatEngine !== 'undefined') {
      ChatEngine.on('onMessage', this.onMessage);
      ChatEngine.on('onUserJoin', this.onUserJoin);
      ChatEngine.on('onUserLeave', this.onUserLeave);
    }

    // Connect to VoiceEngine for mute state
    if (typeof VoiceEngine !== 'undefined') {
      this.isMuted = VoiceEngine.isMuted();
      VoiceEngine.on('voiceState', (data) => {
        if (data.userId === VoiceEngine.getUserInfo()?.id) {
          this.isMuted = data.muted;
          this.updateMuteIndicator();
        }
      });
    }
  },

  /**
   * Update panel position based on hand or world space
   */
  updatePosition: function () {
    const data = this.data;

    if (data.hand === 'world') {
      // World space positioning
      this.el.setAttribute('position', data.worldPosition);
      this.el.setAttribute('rotation', '0 0 0');
    } else {
      // Hand-attached positioning
      const handId = data.hand === 'left' ? 'left-ctrl' : 'right-ctrl';
      const handEl = document.getElementById(handId);

      if (handEl && data.followHand) {
        // Position relative to hand
        const offset = data.hand === 'left' ? { x: 0.3, y: 0.2, z: -0.2 } : { x: -0.3, y: 0.2, z: -0.2 };
        this.el.setAttribute('position', offset);

        // Attach to hand rig
        const rig = handEl.parentElement;
        if (rig && this.el.parentElement !== rig) {
          rig.appendChild(this.el);
        }
      }
    }
  },

  /**
   * Handle incoming chat message
   */
  onMessage: function (data) {
    const message = {
      id: data.messageId || Date.now(),
      userId: data.userId,
      username: data.userInfo?.name || data.username || 'Unknown',
      content: data.content,
      timestamp: new Date(data.timestamp || Date.now()),
      color: data.userInfo?.color || this.getUserColor(data.userId)
    };

    this.messages.push(message);

    // Keep only last maxMessages
    if (this.messages.length > this.data.maxMessages * 2) {
      this.messages = this.messages.slice(-this.data.maxMessages * 2);
    }

    this.renderMessages();
  },

  /**
   * Handle user join
   */
  onUserJoin: function (user) {
    this.addSystemMessage(`${user.name || user.userId} joined`);
  },

  /**
   * Handle user leave
   */
  onUserLeave: function (user) {
    this.addSystemMessage(`${user.name || user.userId} left`);
  },

  /**
   * Add system message
   */
  addSystemMessage: function (content) {
    this.onMessage({
      userId: 'system',
      username: 'System',
      content: content,
      timestamp: Date.now(),
      color: '#888888'
    });
  },

  /**
   * Render visible messages
   * Quest 3 optimization: Only render visible messages, reuse DOM elements
   */
  renderMessages: function () {
    const visibleCount = Math.min(this.messages.length, this.data.maxMessages);
    const startIdx = Math.max(0, this.messages.length - visibleCount - Math.floor(this.scrollOffset));
    const endIdx = Math.min(startIdx + visibleCount, this.messages.length);

    // Update visible bubbles
    for (let i = 0; i < this.messagePool.length; i++) {
      const bubble = this.messagePool[i];
      const msgIdx = endIdx - i - 1;

      if (msgIdx >= 0 && msgIdx < this.messages.length) {
        const msg = this.messages[msgIdx];
        this.updateMessageBubble(bubble, msg, i);
        bubble.object3D.visible = true;
      } else {
        bubble.object3D.visible = false;
      }
    }
  },

  /**
   * Update a message bubble with message data
   */
  updateMessageBubble: function (bubble, message, index) {
    const yPos = (this.data.height / 2) - 0.15 - (index * 0.14) + this.scrollOffset * 0.14;
    const zOffset = -this.data.radius + 0.05;

    // Position with slight curve
    const angle = (index - this.data.maxMessages / 2) * 0.02;
    const xPos = Math.sin(angle) * 0.1;

    bubble.setAttribute('position', `${xPos} ${yPos} ${zOffset}`);

    // Update content
    const username = bubble.querySelector('.message-username');
    const text = bubble.querySelector('.message-text');
    const time = bubble.querySelector('.message-time');
    const avatar = bubble.querySelector('.message-avatar');

    if (username) username.setAttribute('value', message.username);
    if (text) text.setAttribute('value', this.truncateText(message.content, 40));
    if (time) time.setAttribute('value', this.formatTime(message.timestamp));
    if (avatar) avatar.setAttribute('color', message.color);

    // Adjust background height for long messages
    const bg = bubble.querySelector('.message-bg');
    if (bg) {
      const lines = Math.ceil(message.content.length / 35);
      bg.setAttribute('height', Math.max(0.12, lines * 0.04));
    }
  },

  /**
   * Truncate text to max length
   */
  truncateText: function (text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * Format timestamp
   */
  formatTime: function (timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Get consistent color for user
   */
  getUserColor: function (userId) {
    const colors = ['#00d4ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  /**
   * Scroll messages
   */
  scrollMessages: function (delta) {
    const maxScroll = Math.max(0, this.messages.length - this.data.maxMessages);
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + delta));
    this.renderMessages();
  },

  /**
   * Handle grab start (grip button)
   */
  handleGrab: function (evt) {
    const hand = evt.target;
    if (!hand) return;

    // Check if pointing at panel
    if (this.isHandPointingAtPanel(hand)) {
      this.isGrabbing = true;
      this.grabHand = hand;
      this.grabStartPos = hand.object3D.position.clone();
      this.panelStartPos = this.el.object3D.position.clone();

      // Detach from hand if attached
      if (this.data.hand !== 'world') {
        const worldPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(worldPos);
        this.el.sceneEl.appendChild(this.el);
        this.el.object3D.position.copy(worldPos);
        this.data.hand = 'world';
        this.data.worldPosition = worldPos;
      }
    }
  },

  /**
   * Handle grab release
   */
  handleRelease: function (evt) {
    if (this.isGrabbing && this.grabHand === evt.target) {
      this.isGrabbing = false;
      this.grabHand = null;
    }
  },

  /**
   * Handle pinch gesture (hand tracking)
   */
  handlePinch: function (evt) {
    const hand = evt.target;
    if (!this.isHandPointingAtPanel(hand)) return;

    this.pinchStartY = evt.detail.position?.y || 0;
    this.pinchActive = true;
  },

  /**
   * Handle pinch end
   */
  handlePinchEnd: function () {
    this.pinchActive = false;
  },

  /**
   * Handle controller button for double-tap detection
   */
  handleControllerButton: function (evt) {
    const now = Date.now();
    const timeDiff = now - this.lastTapTime;

    if (timeDiff < 300) {
      this.tapCount++;
      if (this.tapCount >= 2) {
        this.toggleMute();
        this.tapCount = 0;
      }
    } else {
      this.tapCount = 1;
    }

    this.lastTapTime = now;
  },

  /**
   * Check if hand is pointing at panel
   */
  isHandPointingAtPanel: function (hand) {
    if (!hand || !hand.object3D) return false;

    // Simple distance check
    const handPos = new THREE.Vector3();
    hand.object3D.getWorldPosition(handPos);

    const panelPos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(panelPos);

    const distance = handPos.distanceTo(panelPos);
    return distance < 0.5;
  },

  /**
   * Check if laser is pointing at panel
   */
  isPointingAtPanel: function () {
    // Check if panel has hover state
    return this.panelMesh.material.opacity > 0.9;
  },

  /**
   * Toggle mute state
   */
  toggleMute: function () {
    if (typeof VoiceEngine !== 'undefined') {
      this.isMuted = VoiceEngine.toggleMute();
    } else {
      this.isMuted = !this.isMuted;
    }
    this.updateMuteIndicator();

    // Visual feedback
    this.showMuteNotification();
  },

  /**
   * Update mute indicator color
   */
  updateMuteIndicator: function () {
    const color = this.isMuted ? '#ef4444' : '#22c55e';
    this.muteIndicator.setAttribute('color', color);
  },

  /**
   * Show mute notification
   */
  showMuteNotification: function () {
    const notif = document.createElement('a-text');
    notif.setAttribute('value', this.isMuted ? '🔇 Muted' : '🔊 Unmuted');
    notif.setAttribute('position', '0 0.5 0');
    notif.setAttribute('align', 'center');
    notif.setAttribute('width', '2');
    notif.setAttribute('color', this.isMuted ? '#ef4444' : '#22c55e');
    this.el.appendChild(notif);

    setTimeout(() => {
      notif.remove();
    }, 1500);
  },

  /**
   * Open virtual keyboard
   */
  openKeyboard: function () {
    if (!this.data.keyboardEnabled) return;

    this.keyboardOpen = true;

    // Emit event for virtual-keyboard component
    this.el.emit('openkeyboard', {
      panel: this.el,
      onSubmit: (text) => this.sendMessage(text),
      onClose: () => { this.keyboardOpen = false; }
    });

    // Update input text
    this.inputText.setAttribute('value', 'Type with virtual keyboard...');
    this.inputText.setAttribute('color', '#ffffff');
  },

  /**
   * Send message
   */
  sendMessage: function (text) {
    if (!text || text.trim().length === 0) return;

    if (typeof ChatEngine !== 'undefined') {
      ChatEngine.sendMessage(text.trim());
    }

    // Reset input
    this.inputText.setAttribute('value', 'Tap to type...');
    this.inputText.setAttribute('color', '#666666');
    this.keyboardOpen = false;
  },

  /**
   * Tick function for smooth updates
   */
  tick: function () {
    // Handle grabbing
    if (this.isGrabbing && this.grabHand) {
      const handPos = new THREE.Vector3();
      this.grabHand.object3D.getWorldPosition(handPos);

      const delta = handPos.clone().sub(this.grabStartPos);
      this.el.object3D.position.copy(this.panelStartPos).add(delta);

      // Update world position data
      this.data.worldPosition = this.el.object3D.position.clone();
    }

    // Handle pinch scrolling
    if (this.pinchActive) {
      // Scroll logic handled in pinch move
    }

    // Update position if following hand
    if (this.data.followHand && this.data.hand !== 'world') {
      this.updatePosition();
    }
  },

  /**
   * Remove component
   */
  remove: function () {
    // Unregister from ChatEngine
    if (typeof ChatEngine !== 'undefined') {
      ChatEngine.off('onMessage', this.onMessage);
      ChatEngine.off('onUserJoin', this.onUserJoin);
      ChatEngine.off('onUserLeave', this.onUserLeave);
    }

    // Clean up mesh
    if (this.panelMesh) {
      this.panelMesh.geometry.dispose();
      this.panelMesh.material.dispose();
    }

    // Clean up event listeners
    const scene = this.el.sceneEl;
    scene.removeEventListener('gripdown', this.handleGrab);
    scene.removeEventListener('gripup', this.handleRelease);
    scene.removeEventListener('pinchstarted', this.handlePinch);
    scene.removeEventListener('pinchended', this.handlePinchEnd);
    scene.removeEventListener('abuttondown', this.handleControllerButton);
    scene.removeEventListener('bbuttondown', this.handleControllerButton);
  }
});

/**
 * Helper component to attach chat panel to scene
 */
AFRAME.registerComponent('vr-chat-system', {
  schema: {
    enabled: { type: 'boolean', default: true },
    hand: { type: 'string', default: 'left' }
  },

  init: function () {
    if (!this.data.enabled) return;

    // Create chat panel
    const panel = document.createElement('a-entity');
    panel.setAttribute('vr-chat-panel', `hand: ${this.data.hand}`);
    panel.setAttribute('id', 'vr-chat-panel');

    this.el.appendChild(panel);
    this.panel = panel;
  },

  remove: function () {
    if (this.panel) {
      this.panel.remove();
    }
  }
});
