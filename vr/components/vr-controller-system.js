/**
 * VR Controller System - ENH-001
 * Comprehensive Meta Quest 3 controller support with movement, teleportation, and interaction
 * 
 * Features:
 * - Left controller: Movement (thumbstick), Menu (X), Context (Y)
 * - Right controller: Rotation (thumbstick), Select (A), Back (B), Teleport (Trigger)
 * - Hand tracking fallback
 * - Visual controller models
 * - Smooth locomotion and snap turning
 */

AFRAME.registerComponent('vr-controller-system', {
  schema: {
    movementSpeed: { type: 'number', default: 3 },
    rotationSnap: { type: 'number', default: 45 },
    smoothRotationSpeed: { type: 'number', default: 100 },
    useSmoothRotation: { type: 'boolean', default: false },
    teleportEnabled: { type: 'boolean', default: true },
    handTrackingEnabled: { type: 'boolean', default: true }
  },

  init: function() {
    this.cameraRig = this.el;
    this.camera = this.el.querySelector('a-camera');
    this.scene = this.el.sceneEl;
    
    // Controller references
    this.leftController = null;
    this.rightController = null;
    this.leftHand = null;
    this.rightHand = null;
    
    // Movement state
    this.moveVector = new THREE.Vector3();
    this.rotationVector = new THREE.Vector2();
    this.isMoving = false;
    this.isTeleporting = false;
    
    // Teleport state
    this.teleportLine = null;
    this.teleportMarker = null;
    this.teleportDestination = null;
    
    // Input mode
    this.inputMode = 'controllers'; // 'controllers', 'hands', 'gaze'
    
    // Bind methods
    this.onLeftAxisMove = this.onLeftAxisMove.bind(this);
    this.onRightAxisMove = this.onRightAxisMove.bind(this);
    this.onLeftButtonDown = this.onLeftButtonDown.bind(this);
    this.onRightButtonDown = this.onRightButtonDown.bind(this);
    this.onLeftButtonUp = this.onLeftButtonUp.bind(this);
    this.onRightButtonUp = this.onRightButtonUp.bind(this);
    this.onTeleportTrigger = this.onTeleportTrigger.bind(this);
    this.updateMovement = this.updateMovement.bind(this);
    
    this.setupControllers();
    this.setupTeleportation();
    this.setupHandTracking();
    
    // Start update loop
    this.scene.addEventListener('tick', this.updateMovement);
    
    console.log('[VR Controller System] Initialized');
  },

  setupControllers: function() {
    // Left Controller - Movement
    this.leftController = document.createElement('a-entity');
    this.leftController.setAttribute('oculus-touch-controls', 'hand: left');
    this.leftController.setAttribute('laser-controls', 'hand: left');
    this.leftController.setAttribute('raycaster', {
      objects: '.clickable',
      far: 30,
      lineColor: '#00d4ff',
      lineOpacity: 0.5
    });
    this.leftController.setAttribute('cursor', 'rayOrigin: entity; fuse: false');
    
    // Right Controller - Rotation and Teleport
    this.rightController = document.createElement('a-entity');
    this.rightController.setAttribute('oculus-touch-controls', 'hand: right');
    this.rightController.setAttribute('laser-controls', 'hand: right');
    this.rightController.setAttribute('raycaster', {
      objects: '.clickable',
      far: 30,
      lineColor: '#a855f7',
      lineOpacity: 0.5
    });
    this.rightController.setAttribute('cursor', 'rayOrigin: entity; fuse: false');
    
    // Add controller models
    this.leftController.setAttribute('hand-controls', 'hand: left; handModelStyle: lowPoly; color: #00d4ff');
    this.rightController.setAttribute('hand-controls', 'hand: right; handModelStyle: lowPoly; color: #a855f7');
    
    // Event listeners for left controller
    this.leftController.addEventListener('thumbstickmoved', this.onLeftAxisMove);
    this.leftController.addEventListener('xbuttondown', () => this.onLeftButtonDown('x'));
    this.leftController.addEventListener('ybuttondown', () => this.onLeftButtonDown('y'));
    this.leftController.addEventListener('triggerdown', () => this.onLeftButtonDown('trigger'));
    this.leftController.addEventListener('gripdown', () => this.onLeftButtonDown('grip'));
    
    // Event listeners for right controller
    this.rightController.addEventListener('thumbstickmoved', this.onRightAxisMove);
    this.rightController.addEventListener('abuttondown', () => this.onRightButtonDown('a'));
    this.rightController.addEventListener('bbuttondown', () => this.onRightButtonDown('b'));
    this.rightController.addEventListener('triggerdown', this.onTeleportTrigger);
    this.rightController.addEventListener('triggerup', this.onTeleportEnd);
    this.rightController.addEventListener('gripdown', () => this.onRightButtonDown('grip'));
    
    // Add to rig
    this.cameraRig.appendChild(this.leftController);
    this.cameraRig.appendChild(this.rightController);
    
    // Listen for controller connection
    this.leftController.addEventListener('connected', (e) => {
      console.log('[VR Controller] Left connected:', e.detail);
      this.inputMode = 'controllers';
    });
    
    this.rightController.addEventListener('connected', (e) => {
      console.log('[VR Controller] Right connected:', e.detail);
      this.inputMode = 'controllers';
    });
  },

  setupHandTracking: function() {
    if (!this.data.handTrackingEnabled) return;
    
    // Hand tracking as fallback/alternative
    this.leftHand = document.createElement('a-entity');
    this.leftHand.setAttribute('hand-tracking-controls', 'hand: left');
    this.leftHand.setAttribute('hand-controls', 'hand: left; handModelStyle: lowPoly');
    
    this.rightHand = document.createElement('a-entity');
    this.rightHand.setAttribute('hand-tracking-controls', 'hand: right');
    this.rightHand.setAttribute('hand-controls', 'hand: right; handModelStyle: lowPoly');
    
    // Pinch gesture for selection
    this.leftHand.addEventListener('pinchstarted', () => {
      console.log('[VR Hand] Left pinch');
    });
    
    this.rightHand.addEventListener('pinchstarted', () => {
      console.log('[VR Hand] Right pinch');
      if (this.data.teleportEnabled) {
        this.startTeleport();
      }
    });
    
    this.rightHand.addEventListener('pinchended', () => {
      if (this.data.teleportEnabled && this.isTeleporting) {
        this.executeTeleport();
      }
    });
    
    this.cameraRig.appendChild(this.leftHand);
    this.cameraRig.appendChild(this.rightHand);
    
    // Monitor hand tracking availability
    this.scene.addEventListener('enter-vr', () => {
      setTimeout(() => {
        if (this.leftHand.components['hand-tracking-controls'] && 
            this.leftHand.components['hand-tracking-controls'].mesh) {
          console.log('[VR Controller] Hand tracking active');
          if (this.inputMode !== 'controllers') {
            this.inputMode = 'hands';
          }
        }
      }, 2000);
    });
  },

  setupTeleportation: function() {
    if (!this.data.teleportEnabled) return;
    
    // Create teleport line (parabolic arc)
    this.teleportLine = document.createElement('a-entity');
    this.teleportLine.setAttribute('teleport-line', '');
    this.teleportLine.setAttribute('visible', false);
    this.scene.appendChild(this.teleportLine);
    
    // Create teleport marker (circle on ground)
    this.teleportMarker = document.createElement('a-entity');
    this.teleportMarker.setAttribute('geometry', {
      primitive: 'ring',
      radiusInner: 0.3,
      radiusOuter: 0.4
    });
    this.teleportMarker.setAttribute('material', {
      color: '#00ff00',
      shader: 'flat',
      opacity: 0.8,
      transparent: true
    });
    this.teleportMarker.setAttribute('rotation', '-90 0 0');
    this.teleportMarker.setAttribute('visible', false);
    this.scene.appendChild(this.teleportMarker);
  },

  onLeftAxisMove: function(e) {
    // Left thumbstick - Movement
    const x = e.detail.x;
    const y = e.detail.y;
    
    // Deadzone
    if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) {
      this.moveVector.set(0, 0, 0);
      this.isMoving = false;
      return;
    }
    
    this.isMoving = true;
    this.moveVector.set(x, 0, -y); // Invert Y for forward/back
  },

  onRightAxisMove: function(e) {
    // Right thumbstick - Rotation
    const x = e.detail.x;
    
    // Deadzone
    if (Math.abs(x) < 0.3) return;
    
    if (this.data.useSmoothRotation) {
      // Smooth rotation
      const rotationSpeed = this.data.smoothRotationSpeed * 0.01;
      this.cameraRig.object3D.rotation.y -= x * rotationSpeed * 0.016;
    } else {
      // Snap rotation with cooldown
      const now = Date.now();
      if (this.lastRotationTime && now - this.lastRotationTime < 300) return;
      
      if (x > 0.5) {
        this.cameraRig.object3D.rotation.y -= THREE.MathUtils.degToRad(this.data.rotationSnap);
        this.lastRotationTime = now;
      } else if (x < -0.5) {
        this.cameraRig.object3D.rotation.y += THREE.MathUtils.degToRad(this.data.rotationSnap);
        this.lastRotationTime = now;
      }
    }
  },

  onLeftButtonDown: function(button) {
    console.log('[VR Controller] Left button:', button);
    
    switch(button) {
      case 'x':
        // Menu toggle
        this.toggleMenu();
        break;
      case 'y':
        // Context action
        this.emit('context-action');
        break;
      case 'trigger':
        // Alternative select
        break;
      case 'grip':
        // Grab
        break;
    }
  },

  onRightButtonDown: function(button) {
    console.log('[VR Controller] Right button:', button);
    
    switch(button) {
      case 'a':
        // Primary select
        break;
      case 'b':
        // Back/Menu
        this.goBack();
        break;
      case 'grip':
        // Grab
        break;
    }
  },

  onTeleportTrigger: function() {
    if (!this.data.teleportEnabled || !this.rightController) return;
    this.startTeleport();
  },

  onTeleportEnd: function() {
    if (this.isTeleporting) {
      this.executeTeleport();
    }
  },

  startTeleport: function() {
    this.isTeleporting = true;
    if (this.teleportLine) this.teleportLine.setAttribute('visible', true);
    if (this.teleportMarker) this.teleportMarker.setAttribute('visible', true);
  },

  executeTeleport: function() {
    this.isTeleporting = false;
    if (this.teleportLine) this.teleportLine.setAttribute('visible', false);
    if (this.teleportMarker) this.teleportMarker.setAttribute('visible', false);
    
    if (this.teleportDestination) {
      // Teleport with fade
      this.fadeTeleport(this.teleportDestination);
    }
  },

  fadeTeleport: function(position) {
    // Create fade overlay
    const fade = document.createElement('div');
    fade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;z-index:99999;pointer-events:none;transition:opacity 0.2s;';
    document.body.appendChild(fade);
    
    // Fade out
    requestAnimationFrame(() => {
      fade.style.opacity = '1';
      
      setTimeout(() => {
        // Move rig
        this.cameraRig.object3D.position.copy(position);
        
        // Fade in
        fade.style.opacity = '0';
        setTimeout(() => fade.remove(), 200);
      }, 200);
    });
  },

  updateMovement: function() {
    if (!this.isMoving) return;
    
    // Get camera direction (horizontal only)
    const cameraDirection = new THREE.Vector3();
    this.camera.object3D.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    // Calculate movement direction relative to camera
    const forward = cameraDirection.clone().multiplyScalar(this.moveVector.z);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).multiplyScalar(this.moveVector.x);
    
    const moveDirection = forward.add(right).normalize();
    const speed = this.data.movementSpeed * 0.016; // Per frame
    
    this.cameraRig.object3D.position.add(moveDirection.multiplyScalar(speed));
  },

  updateTeleportVisualization: function() {
    if (!this.isTeleporting || !this.rightController) return;
    
    const controllerPosition = new THREE.Vector3();
    const controllerDirection = new THREE.Vector3();
    
    this.rightController.object3D.getWorldPosition(controllerPosition);
    this.rightController.object3D.getWorldDirection(controllerDirection);
    
    // Cast ray downward from controller
    const raycaster = new THREE.Raycaster(
      controllerPosition,
      new THREE.Vector3(0, -1, 0),
      0,
      20
    );
    
    const intersects = raycaster.intersectObjects(this.scene.object3D.children, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const point = hit.point;
      
      // Update marker position
      this.teleportMarker.object3D.position.copy(point);
      this.teleportDestination = point.clone();
      this.teleportDestination.y = this.cameraRig.object3D.position.y; // Maintain height
      
      // Check if valid (not too steep, not obstacle)
      const isValid = hit.face.normal.y > 0.7; // Mostly flat ground
      
      this.teleportMarker.setAttribute('material', 'color', isValid ? '#00ff00' : '#ff0000');
    }
  },

  toggleMenu: function() {
    // Emit event for menu system to handle
    this.scene.emit('vr-menu-toggle');
  },

  goBack: function() {
    window.history.back();
  },

  remove: function() {
    this.scene.removeEventListener('tick', this.updateMovement);
  }
});

/**
 * Teleport Line Component - Visual parabolic arc for teleportation
 */
AFRAME.registerComponent('teleport-line', {
  init: function() {
    this.el.setAttribute('line', {
      start: '0 0 0',
      end: '0 0 0',
      color: '#00d4ff',
      opacity: 0.6
    });
  }
});

/**
 * Input Mode Indicator - Shows current input method
 */
AFRAME.registerComponent('input-indicator', {
  init: function() {
    this.indicator = document.createElement('a-entity');
    this.indicator.setAttribute('position', '0 -0.5 -2');
    this.indicator.setAttribute('text', {
      value: 'Controllers',
      align: 'center',
      width: 2,
      color: '#00d4ff'
    });
    this.el.appendChild(this.indicator);
  },
  
  updateMode: function(mode) {
    const labels = {
      'controllers': 'Controllers Active',
      'hands': 'Hand Tracking',
      'gaze': 'Gaze Only'
    };
    this.indicator.setAttribute('text', 'value', labels[mode] || mode);
  }
});

console.log('[VR Controller System] Component loaded');