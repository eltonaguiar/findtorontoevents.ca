/**
 * VR Voice Indicator - A-Frame Component for Spatial Voice Activity UI
 *
 * Features:
 *   - Spatial indicators above user avatars
 *   - Speaking state with VU meter visualization
 *   - Mute state indicator
 *   - Color coding (green = speaking, red = muted, gray = idle)
 *   - Proximity-based visibility (fade beyond 10m)
 *
 * Quest 3 Optimizations:
 *   - Low poly geometry (8-segment cylinders)
 *   - Simple vertex colors (no textures)
 *   - LOD system (simplified beyond 5m)
 *   - Batched updates (throttled to 30fps)
 *   - Distance culling (hidden beyond 15m)
 *
 * Usage:
 *   <a-entity vr-voice-indicator="userId: user123; height: 2.2"></a-entity>
 */
AFRAME.registerComponent('vr-voice-indicator', {
  schema: {
    userId: { type: 'string', default: '' },
    height: { type: 'number', default: 2.2 },
    size: { type: 'number', default: 0.15 },
    showLabel: { type: 'boolean', default: true },
    fadeDistance: { type: 'number', default: 10 },
    cullDistance: { type: 'number', default: 15 },
    updateRate: { type: 'number', default: 33 } // ~30fps
  },

  init: function () {
    this.audioLevel = 0;
    this.isSpeaking = false;
    this.isMuted = true;
    this.lastUpdate = 0;
    this.currentDistance = 0;
    this.lodLevel = 0; // 0 = full, 1 = simplified

    // State colors
    this.colors = {
      speaking: new THREE.Color(0x22c55e), // Green
      muted: new THREE.Color(0xef4444),    // Red
      idle: new THREE.Color(0x6b7280),     // Gray
      bg: new THREE.Color(0x1a1a2e)        // Dark background
    };

    // Bind methods
    this.onVoiceState = this.onVoiceState.bind(this);
    this.onAudioLevel = this.onAudioLevel.bind(this);

    this.initIndicator();
    this.setupVoiceEngine();
  },

  /**
   * Initialize the 3D indicator geometry
   * Quest 3 optimized: Low poly, simple materials
   */
  initIndicator: function () {
    const data = this.data;
    const size = data.size;

    // Create indicator container
    this.indicatorGroup = new THREE.Group();
    this.el.setObject3D('mesh', this.indicatorGroup);

    // Position above user
    this.el.setAttribute('position', `0 ${data.height} 0`);

    // === Main indicator circle (8 segments for low poly) ===
    const circleGeo = new THREE.CylinderGeometry(size, size, 0.02, 8);
    circleGeo.rotateX(Math.PI / 2);

    this.circleMat = new THREE.MeshBasicMaterial({
      color: this.colors.idle,
      transparent: true,
      opacity: 0.9
    });

    this.circleMesh = new THREE.Mesh(circleGeo, this.circleMat);
    this.indicatorGroup.add(this.circleMesh);

    // === VU Meter ring (audio level visualization) ===
    const ringGeo = new THREE.RingGeometry(size * 0.7, size * 0.85, 8);

    this.ringMat = new THREE.MeshBasicMaterial({
      color: this.colors.speaking,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    this.ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
    this.ringMesh.position.z = 0.01;
    this.indicatorGroup.add(this.ringMesh);

    // === Mute icon (X shape) ===
    const muteGroup = new THREE.Group();
    muteGroup.visible = false;

    const lineGeo = new THREE.BoxGeometry(size * 1.2, 0.02, 0.02);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const line1 = new THREE.Mesh(lineGeo, lineMat);
    line1.rotation.z = Math.PI / 4;
    muteGroup.add(line1);

    const line2 = new THREE.Mesh(lineGeo, lineMat);
    line2.rotation.z = -Math.PI / 4;
    muteGroup.add(line2);

    this.muteGroup = muteGroup;
    this.indicatorGroup.add(muteGroup);

    // === Speaking waves (animated rings) ===
    this.waveRings = [];
    for (let i = 0; i < 3; i++) {
      const waveGeo = new THREE.RingGeometry(size * (1.2 + i * 0.3), size * (1.25 + i * 0.3), 8);
      const waveMat = new THREE.MeshBasicMaterial({
        color: this.colors.speaking,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.position.z = -0.01 * i;
      this.indicatorGroup.add(wave);
      this.waveRings.push({ mesh: wave, mat: waveMat, phase: i * Math.PI * 0.3 });
    }

    // === Username label ===
    if (data.showLabel) {
      this.labelEl = document.createElement('a-text');
      this.labelEl.setAttribute('value', '...');
      this.labelEl.setAttribute('align', 'center');
      this.labelEl.setAttribute('position', `0 ${-size - 0.1} 0`);
      this.labelEl.setAttribute('width', '2');
      this.labelEl.setAttribute('color', '#ffffff');
      this.labelEl.setAttribute('font', 'roboto');
      this.labelEl.setAttribute('side', 'double');
      this.el.appendChild(this.labelEl);
    }

    // === Distance fade plane ===
    const fadeGeo = new THREE.PlaneGeometry(size * 4, size * 2);
    this.fadeMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.fadeMesh = new THREE.Mesh(fadeGeo, this.fadeMat);
    this.fadeMesh.position.y = -size / 2;
    this.fadeMesh.rotation.x = Math.PI / 2;
    this.indicatorGroup.add(this.fadeMesh);

    // Billboard component - always face camera
    this.el.setAttribute('billboard', '');
  },

  /**
   * Setup VoiceEngine event listeners
   */
  setupVoiceEngine: function () {
    if (typeof VoiceEngine === 'undefined') return;

    // Listen for voice state changes
    VoiceEngine.on('voiceState', this.onVoiceState);
    VoiceEngine.on('audioLevel', this.onAudioLevel);

    // Get initial state if this is local user
    const userInfo = VoiceEngine.getUserInfo?.();
    if (userInfo && userInfo.id === this.data.userId) {
      this.isMuted = VoiceEngine.isMuted?.() ?? true;
      this.updateVisuals();
    }
  },

  /**
   * Handle voice state change from VoiceEngine
   */
  onVoiceState: function (data) {
    if (data.peerId !== this.data.userId && data.userId !== this.data.userId) return;

    this.isMuted = data.muted ?? this.isMuted;
    this.isSpeaking = data.speaking ?? this.isSpeaking;

    this.updateVisuals();
  },

  /**
   * Handle audio level update
   */
  onAudioLevel: function (data) {
    if (data.peerId !== this.data.userId && data.userId !== this.data.userId) return;

    this.audioLevel = data.level ?? 0;

    // Update VU meter
    this.updateVUMeter();
  },

  /**
   * Update visual state based on mute/speaking status
   */
  updateVisuals: function () {
    const circleColor = this.isMuted ? this.colors.muted :
                        this.isSpeaking ? this.colors.speaking :
                        this.colors.idle;

    this.circleMat.color.copy(circleColor);

    // Show/hide mute icon
    this.muteGroup.visible = this.isMuted;

    // Update ring opacity based on speaking state
    this.ringMat.opacity = this.isSpeaking && !this.isMuted ? 0.8 : 0;

    // Update label color
    if (this.labelEl) {
      const labelColor = this.isMuted ? '#ef4444' :
                         this.isSpeaking ? '#22c55e' :
                         '#9ca3af';
      this.labelEl.setAttribute('color', labelColor);
    }
  },

  /**
   * Update VU meter based on audio level
   */
  updateVUMeter: function () {
    if (this.isMuted) {
      this.ringMat.opacity = 0;
      return;
    }

    // Scale ring based on audio level
    const scale = 0.7 + (this.audioLevel * 0.5);
    this.ringMesh.scale.setScalar(scale);
    this.ringMat.opacity = this.isSpeaking ? 0.6 + (this.audioLevel * 0.4) : 0;
  },

  /**
   * Update wave animation
   */
  updateWaves: function (time) {
    if (!this.isSpeaking || this.isMuted) {
      // Hide waves when not speaking
      for (const wave of this.waveRings) {
        wave.mat.opacity = 0;
      }
      return;
    }

    // Animate waves
    const speed = 3;
    for (const wave of this.waveRings) {
      const t = (time * 0.001 * speed + wave.phase) % (Math.PI * 2);
      const intensity = (Math.sin(t) + 1) / 2;

      wave.mat.opacity = intensity * 0.5 * this.audioLevel;
      const scale = 1 + intensity * 0.3;
      wave.mesh.scale.setScalar(scale);
    }
  },

  /**
   * Update LOD based on distance
   */
  updateLOD: function () {
    const distance = this.currentDistance;
    const newLOD = distance > 5 ? 1 : 0;

    if (newLOD !== this.lodLevel) {
      this.lodLevel = newLOD;

      if (this.lodLevel === 1) {
        // Simplified: Hide waves, reduce opacity
        for (const wave of this.waveRings) {
          wave.mesh.visible = false;
        }
        this.muteGroup.visible = this.isMuted;
      } else {
        // Full detail
        for (const wave of this.waveRings) {
          wave.mesh.visible = true;
        }
      }
    }

    // Distance-based visibility
    const shouldBeVisible = distance < this.data.cullDistance;
    if (this.indicatorGroup.visible !== shouldBeVisible) {
      this.indicatorGroup.visible = shouldBeVisible;
    }
  },

  /**
   * Update fade based on distance
   */
  updateFade: function () {
    const distance = this.currentDistance;
    const fadeStart = this.data.fadeDistance;
    const fadeEnd = this.data.cullDistance;

    if (distance < fadeStart) {
      this.fadeMat.opacity = 0;
      this.indicatorGroup.children.forEach(child => {
        if (child !== this.fadeMesh) {
          child.visible = true;
        }
      });
    } else if (distance < fadeEnd) {
      const fade = (distance - fadeStart) / (fadeEnd - fadeStart);
      this.fadeMat.opacity = fade * 0.8;

      // Fade out elements
      const opacity = 1 - fade;
      this.circleMat.opacity = 0.9 * opacity;
      this.ringMat.opacity = this.isSpeaking ? 0.8 * opacity : 0;
    } else {
      this.indicatorGroup.visible = false;
    }
  },

  /**
   * Calculate distance to camera
   */
  updateDistance: function () {
    const camera = this.el.sceneEl.camera;
    if (!camera) return;

    const indicatorPos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(indicatorPos);

    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);

    this.currentDistance = indicatorPos.distanceTo(cameraPos);
  },

  /**
   * Set username label
   */
  setUsername: function (name) {
    if (this.labelEl) {
      this.labelEl.setAttribute('value', name || 'Unknown');
    }
  },

  /**
   * Set user ID and update VoiceEngine connection
   */
  setUserId: function (userId) {
    this.data.userId = userId;
    this.setupVoiceEngine();
  },

  /**
   * Update speaking state manually (for non-VoiceEngine users)
   */
  setSpeaking: function (speaking, level = 0) {
    this.isSpeaking = speaking;
    this.audioLevel = level;
    this.updateVisuals();
    this.updateVUMeter();
  },

  /**
   * Update mute state manually
   */
  setMuted: function (muted) {
    this.isMuted = muted;
    this.updateVisuals();
  },

  /**
   * Tick function - throttled updates
   */
  tick: function (time, delta) {
    // Throttle updates
    if (time - this.lastUpdate < this.data.updateRate) return;
    this.lastUpdate = time;

    // Update distance and LOD
    this.updateDistance();
    this.updateLOD();
    this.updateFade();

    // Update wave animation
    this.updateWaves(time);

    // Update VU meter
    this.updateVUMeter();
  },

  /**
   * Remove component
   */
  remove: function () {
    // Unregister from VoiceEngine
    if (typeof VoiceEngine !== 'undefined') {
      VoiceEngine.off('voiceState', this.onVoiceState);
      VoiceEngine.off('audioLevel', this.onAudioLevel);
    }

    // Dispose geometries and materials
    this.circleMesh.geometry.dispose();
    this.circleMat.dispose();
    this.ringMesh.geometry.dispose();
    this.ringMat.dispose();
    this.fadeMesh.geometry.dispose();
    this.fadeMat.dispose();

    for (const wave of this.waveRings) {
      wave.mesh.geometry.dispose();
      wave.mat.dispose();
    }

    // Remove label
    if (this.labelEl) {
      this.labelEl.remove();
    }
  }
});

/**
 * Billboard component - makes entity always face camera
 */
AFRAME.registerComponent('billboard', {
  tick: function () {
    const camera = this.el.sceneEl.camera;
    if (!camera) return;

    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);

    this.el.object3D.lookAt(cameraPos);

    // Only rotate on Y axis (keep upright)
    this.el.object3D.rotation.x = 0;
    this.el.object3D.rotation.z = 0;
  }
});

/**
 * Voice Indicator Manager - manages indicators for all users
 */
AFRAME.registerComponent('vr-voice-manager', {
  schema: {
    enabled: { type: 'boolean', default: true },
    indicatorHeight: { type: 'number', default: 2.2 },
    showLocal: { type: 'boolean', default: true }
  },

  init: function () {
    this.indicators = new Map(); // userId -> indicator entity
    this.localUserId = null;

    this.onPeerConnect = this.onPeerConnect.bind(this);
    this.onPeerDisconnect = this.onPeerDisconnect.bind(this);
    this.onVoiceState = this.onVoiceState.bind(this);

    this.setupVoiceEngine();
  },

  setupVoiceEngine: function () {
    if (typeof VoiceEngine === 'undefined') return;

    VoiceEngine.onPeerConnect(this.onPeerConnect);
    VoiceEngine.onPeerDisconnect(this.onPeerDisconnect);
    VoiceEngine.on('voiceState', this.onVoiceState);

    // Get local user info
    const userInfo = VoiceEngine.getUserInfo?.();
    if (userInfo) {
      this.localUserId = userInfo.id;

      // Create local indicator if enabled
      if (this.data.showLocal) {
        this.createIndicator(userInfo.id, userInfo.displayName || 'You', true);
      }
    }

    // Create indicators for existing peers
    const peers = VoiceEngine.getPeers?.() || [];
    for (const peer of peers) {
      this.createIndicator(peer.peerId, peer.displayName, false);
    }
  },

  onPeerConnect: function (data) {
    const { peerId, peerData } = data;
    this.createIndicator(peerId, peerData?.displayName, false);
  },

  onPeerDisconnect: function (data) {
    const { peerId } = data;
    this.removeIndicator(peerId);
  },

  onVoiceState: function (data) {
    const indicator = this.indicators.get(data.peerId);
    if (indicator) {
      indicator.components['vr-voice-indicator']?.setMuted(data.muted);
      indicator.components['vr-voice-indicator']?.setSpeaking(data.speaking, data.volume);
    }
  },

  createIndicator: function (userId, username, isLocal) {
    if (this.indicators.has(userId)) return;

    const indicator = document.createElement('a-entity');
    indicator.setAttribute('vr-voice-indicator', {
      userId: userId,
      height: this.data.indicatorHeight,
      showLabel: true
    });

    // Find user avatar to attach to
    const avatar = document.querySelector(`[data-user-id="${userId}"]`) ||
                   document.getElementById(`avatar-${userId}`);

    if (avatar) {
      avatar.appendChild(indicator);
    } else {
      // Create floating indicator at default position
      indicator.setAttribute('position', '0 0 0');
      this.el.appendChild(indicator);
    }

    // Set username
    setTimeout(() => {
      indicator.components['vr-voice-indicator']?.setUsername(username);
    }, 100);

    this.indicators.set(userId, indicator);
    return indicator;
  },

  removeIndicator: function (userId) {
    const indicator = this.indicators.get(userId);
    if (indicator) {
      indicator.remove();
      this.indicators.delete(userId);
    }
  },

  updateIndicatorPosition: function (userId, position) {
    const indicator = this.indicators.get(userId);
    if (indicator && !indicator.parentElement?.classList.contains('avatar')) {
      indicator.setAttribute('position', position);
    }
  },

  remove: function () {
    // Remove all indicators
    for (const [userId, indicator] of this.indicators) {
      indicator.remove();
    }
    this.indicators.clear();
  }
});
