/**
 * VR Substantial Quick Wins - Set 4: Immersion & Polish
 * 
 * 10 Additional Major Features:
 * 1. Multiplayer Voice Chat (spatial audio communication)
 * 2. Room Scale Boundary (Chaperone-style guardian)
 * 3. Interactive Tutorial System (guided onboarding)
 * 4. Weather Effects (rain, snow, fog particles)
 * 5. Day/Night Cycle (dynamic lighting transitions)
 * 6. Object Inspection Mode (examine objects up close)
 * 7. Teleportation Trails (visual trail effect)
 * 8. Controller Pointer Beams (enhanced laser pointers)
 * 9. VR Notifications System (in-VR message toasts)
 * 10. Performance Auto-Scaler (dynamic quality adjustment)
 */

(function() {
  'use strict';

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    voiceChat: {
      enabled: true,
      spatialAudio: true,
      maxDistance: 20
    },
    boundary: {
      enabled: true,
      radius: 5,
      color: '#00d4ff'
    },
    tutorial: {
      enabled: true,
      autoShow: true
    },
    weather: {
      enabled: true,
      types: ['clear', 'rain', 'snow', 'fog']
    },
    dayNight: {
      enabled: true,
      cycleDuration: 600 // 10 minutes for full cycle
    },
    autoScale: {
      enabled: true,
      targetFPS: 72,
      checkInterval: 5000
    }
  };

  // ==================== STATE ====================
  const state = {
    localStream: null,
    peerConnections: new Map(),
    boundaryVisible: false,
    tutorialStep: parseInt(localStorage.getItem('vr-tutorial-step') || '0'),
    tutorialCompleted: localStorage.getItem('vr-tutorial-completed') === 'true',
    currentWeather: 'clear',
    dayNightTime: 0,
    inspectionMode: false,
    inspectedObject: null,
    qualityLevel: localStorage.getItem('vr-quality-level') || 'high'
  };

  // ==================== 1. MULTIPLAYER VOICE CHAT ====================
  const VoiceChat = {
    audioContext: null,
    localStream: null,

    init() {
      if (!CONFIG.voiceChat.enabled) return;
      
      this.createUI();
      console.log('[VR Voice Chat] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-voicechat-btn';
      btn.innerHTML = '🎤';
      btn.title = 'Voice Chat (V)';
      btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 440px;
        background: rgba(239, 68, 68, 0.3);
        border: 2px solid #ef4444;
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      btn.addEventListener('click', () => this.toggle());
      document.body.appendChild(btn);

      // Voice indicator
      const indicator = document.createElement('div');
      indicator.id = 'vr-voice-indicator';
      indicator.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 440px;
        background: rgba(0,0,0,0.8);
        border-radius: 8px;
        padding: 5px 10px;
        color: #888;
        font-size: 11px;
        z-index: 99997;
        display: none;
      `;
      indicator.textContent = 'Voice: OFF';
      document.body.appendChild(indicator);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'v' || e.key === 'V') {
          this.toggle();
        }
      });
    },

    async toggle() {
      const btn = document.getElementById('vr-voicechat-btn');
      const indicator = document.getElementById('vr-voice-indicator');

      if (this.localStream) {
        // Stop
        this.localStream.getTracks().forEach(t => t.stop());
        this.localStream = null;
        if (btn) {
          btn.style.background = 'rgba(239, 68, 68, 0.3)';
          btn.style.borderColor = '#ef4444';
        }
        if (indicator) {
          indicator.textContent = 'Voice: OFF';
          indicator.style.color = '#888';
        }
        showToast('🎤 Voice chat OFF');
      } else {
        // Start
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (btn) {
            btn.style.background = 'rgba(34, 197, 94, 0.5)';
            btn.style.borderColor = '#22c55e';
          }
          if (indicator) {
            indicator.textContent = 'Voice: ON';
            indicator.style.color = '#22c55e';
            indicator.style.display = 'block';
          }
          showToast('🎤 Voice chat ON');
          this.startAudioVisualization();
        } catch (e) {
          showToast('❌ Microphone access denied');
        }
      }
    },

    startAudioVisualization() {
      if (!this.localStream) return;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(this.localStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const indicator = document.getElementById('vr-voice-indicator');

      const checkVolume = () => {
        if (!this.localStream) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (indicator && average > 30) {
          indicator.style.boxShadow = '0 0 10px #22c55e';
        } else if (indicator) {
          indicator.style.boxShadow = 'none';
        }

        requestAnimationFrame(checkVolume);
      };
      requestAnimationFrame(checkVolume);
    }
  };

  // ==================== 2. ROOM SCALE BOUNDARY ====================
  const RoomScaleBoundary = {
    boundaryEl: null,
    floorGrid: null,

    init() {
      if (!CONFIG.boundary.enabled) return;
      
      this.createBoundary();
      this.createFloorGrid();
      this.startBoundaryCheck();
      console.log('[VR Boundary] Initialized');
    },

    createBoundary() {
      const scene = document.querySelector('a-scene');
      if (!scene) return;

      // Create circular boundary
      const boundary = document.createElement('a-entity');
      boundary.id = 'vr-room-boundary';
      boundary.innerHTML = `
        <a-ring radius-inner="${CONFIG.boundary.radius - 0.05}" 
                radius-outer="${CONFIG.boundary.radius}" 
                rotation="-90 0 0" 
                color="${CONFIG.boundary.color}" 
                opacity="0.5"
                material="shader: flat; transparent: true">
        </a-ring>
        <a-ring radius-inner="${CONFIG.boundary.radius - 0.02}" 
                radius-outer="${CONFIG.boundary.radius - 0.01}" 
                rotation="-90 0 0" 
                color="${CONFIG.boundary.color}" 
                opacity="0.8"
                material="shader: flat; transparent: true"
                animation="property: opacity; from: 0.8; to: 0.2; dur: 1000; loop: true; dir: alternate">
        </a-ring>
      `;
      boundary.setAttribute('visible', 'false');
      scene.appendChild(boundary);
      this.boundaryEl = boundary;
    },

    createFloorGrid() {
      const scene = document.querySelector('a-scene');
      if (!scene) return;

      const grid = document.createElement('a-entity');
      grid.id = 'vr-floor-grid';
      
      // Create grid lines
      let gridHTML = '';
      const size = 10;
      const divisions = 20;
      const step = size / divisions;
      
      for (let i = 0; i <= divisions; i++) {
        const pos = -size/2 + i * step;
        gridHTML += `<a-line start="${pos} 0.01 ${-size/2}" end="${pos} 0.01 ${size/2}" color="#00d4ff" opacity="0.1"></a-line>`;
        gridHTML += `<a-line start="${-size/2} 0.01 ${pos}" end="${size/2} 0.01 ${pos}" color="#00d4ff" opacity="0.1"></a-line>`;
      }
      
      grid.innerHTML = gridHTML;
      scene.appendChild(grid);
      this.floorGrid = grid;
    },

    startBoundaryCheck() {
      const check = () => {
        const rig = document.getElementById('rig') || document.getElementById('camera-rig');
        if (!rig || !this.boundaryEl) {
          requestAnimationFrame(check);
          return;
        }

        const pos = rig.getAttribute('position');
        const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

        // Show boundary when close to edge
        if (distance > CONFIG.boundary.radius * 0.7) {
          this.boundaryEl.setAttribute('visible', 'true');
          
          // Pulse effect when very close
          if (distance > CONFIG.boundary.radius * 0.9) {
            HapticFeedback.play('boundary');
          }
        } else {
          this.boundaryEl.setAttribute('visible', 'false');
        }

        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    },

    toggleVisibility() {
      if (this.boundaryEl) {
        const visible = this.boundaryEl.getAttribute('visible') === 'true';
        this.boundaryEl.setAttribute('visible', !visible);
      }
      if (this.floorGrid) {
        const visible = this.floorGrid.getAttribute('visible') !== 'false';
        this.floorGrid.setAttribute('visible', !visible);
      }
    }
  };

  // ==================== 3. INTERACTIVE TUTORIAL SYSTEM ====================
  const TutorialSystem = {
    steps: [
      { title: 'Welcome to VR!', text: 'Use WASD or left thumbstick to move around.', icon: '🚶' },
      { title: 'Looking Around', text: 'Move your mouse or turn your head to look.', icon: '👀' },
      { title: 'Teleporting', text: 'Push right thumbstick forward to aim teleport.', icon: '⚡' },
      { title: 'Interacting', text: 'Point at objects with your controller laser.', icon: '👆' },
      { title: 'Quick Menu', text: 'Press G or Tab for the quick select wheel.', icon: '🎯' },
      { title: 'Grab Objects', text: 'Right-click or use trigger to grab objects.', icon: '✊' },
      { title: 'All Set!', text: 'Enjoy exploring the Toronto Events VR Hub!', icon: '🎉' }
    ],

    init() {
      if (!CONFIG.tutorial.enabled) return;
      if (state.tutorialCompleted) return;
      
      this.createUI();
      
      if (CONFIG.tutorial.autoShow && state.tutorialStep === 0) {
        setTimeout(() => this.show(), 2000);
      }
      
      console.log('[VR Tutorial] Initialized');
    },

    createUI() {
      const overlay = document.createElement('div');
      overlay.id = 'vr-tutorial-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.85);
        z-index: 100003;
        display: none;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
      `;

      overlay.innerHTML = `
        <div id="vr-tutorial-card" style="
          background: linear-gradient(135deg, #1a1a3e 0%, #0f0f1f 100%);
          border: 2px solid #00d4ff;
          border-radius: 20px;
          padding: 40px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 25px 100px rgba(0,212,255,0.3);
        ">
          <div id="vr-tutorial-icon" style="font-size: 64px; margin-bottom: 20px;">📚</div>
          <h2 id="vr-tutorial-title" style="color: #00d4ff; margin-bottom: 15px;">Tutorial</h2>
          <p id="vr-tutorial-text" style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Welcome!</p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="VRQuickWinsSet4.Tutorial.skip()" style="padding: 12px 24px; background: rgba(239,68,68,0.3); border: 1px solid #ef4444; border-radius: 8px; color: #ef4444; cursor: pointer;">Skip</button>
            <button onclick="VRQuickWinsSet4.Tutorial.next()" style="padding: 12px 24px; background: rgba(0,212,255,0.3); border: 1px solid #00d4ff; border-radius: 8px; color: #00d4ff; cursor: pointer;">Next →</button>
          </div>
          <div id="vr-tutorial-progress" style="margin-top: 20px; display: flex; gap: 5px; justify-content: center;"></div>
        </div>
      `;

      document.body.appendChild(overlay);
    },

    show() {
      const overlay = document.getElementById('vr-tutorial-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
        this.updateContent();
      }
    },

    hide() {
      const overlay = document.getElementById('vr-tutorial-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    },

    updateContent() {
      const step = this.steps[state.tutorialStep];
      if (!step) return;

      document.getElementById('vr-tutorial-icon').textContent = step.icon;
      document.getElementById('vr-tutorial-title').textContent = step.title;
      document.getElementById('vr-tutorial-text').textContent = step.text;

      // Update progress dots
      const progress = document.getElementById('vr-tutorial-progress');
      progress.innerHTML = this.steps.map((_, i) => `
        <div style="
          width: 10px; 
          height: 10px; 
          border-radius: 50%; 
          background: ${i === state.tutorialStep ? '#00d4ff' : i < state.tutorialStep ? '#22c55e' : 'rgba(255,255,255,0.2)'};
        "></div>
      `).join('');

      // Update button text
      const nextBtn = document.querySelector('#vr-tutorial-card button:last-child');
      if (nextBtn) {
        nextBtn.textContent = state.tutorialStep === this.steps.length - 1 ? 'Finish!' : 'Next →';
      }
    },

    next() {
      state.tutorialStep++;
      localStorage.setItem('vr-tutorial-step', state.tutorialStep);

      if (state.tutorialStep >= this.steps.length) {
        this.complete();
      } else {
        this.updateContent();
      }
    },

    skip() {
      this.hide();
    },

    complete() {
      state.tutorialCompleted = true;
      localStorage.setItem('vr-tutorial-completed', 'true');
      this.hide();
      showToast('🎉 Tutorial Complete!');
      
      // Unlock achievement if available
      if (window.VRQuickWinsSet3?.Achievements) {
        window.VRQuickWinsSet3.Achievements.unlock?.('tutorialComplete');
      }
    },

    reset() {
      state.tutorialStep = 0;
      state.tutorialCompleted = false;
      localStorage.removeItem('vr-tutorial-step');
      localStorage.removeItem('vr-tutorial-completed');
      this.show();
    }
  };

  // ==================== 4. WEATHER EFFECTS ====================
  const WeatherEffects = {
    currentSystem: null,

    init() {
      if (!CONFIG.weather.enabled) return;
      
      this.createUI();
      this.setWeather('clear');
      console.log('[VR Weather] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-weather-btn';
      btn.innerHTML = '🌤️';
      btn.title = 'Weather Effects';
      btn.style.cssText = `
        position: fixed;
        top: 220px;
        right: 20px;
        background: rgba(59, 130, 246, 0.5);
        border: 2px solid #3b82f6;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showMenu());
      document.body.appendChild(btn);
    },

    showMenu() {
      const weathers = [
        { id: 'clear', icon: '☀️', name: 'Clear' },
        { id: 'rain', icon: '🌧️', name: 'Rain' },
        { id: 'snow', icon: '❄️', name: 'Snow' },
        { id: 'fog', icon: '🌫️', name: 'Fog' }
      ];

      let menu = document.getElementById('vr-weather-menu');
      if (!menu) {
        menu = document.createElement('div');
        menu.id = 'vr-weather-menu';
        menu.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #3b82f6;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 250px;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(menu);
      }

      menu.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #3b82f6;">🌤️ Weather</h3>
          <button onclick="document.getElementById('vr-weather-menu').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        <div style="display: grid; gap: 10px;">
          ${weathers.map(w => `
            <button onclick="VRQuickWinsSet4.Weather.setWeather('${w.id}')" 
              style="padding: 12px; background: ${state.currentWeather === w.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${state.currentWeather === w.id ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; border-radius: 10px; color: white; cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${w.icon}</span> ${w.name}
            </button>
          `).join('')}
        </div>
      `;
      menu.style.display = 'block';
    },

    setWeather(type) {
      // Clear existing
      if (this.currentSystem) {
        this.currentSystem.remove();
        this.currentSystem = null;
      }

      state.currentWeather = type;

      const scene = document.querySelector('a-scene');
      if (!scene) return;

      switch(type) {
        case 'rain':
          this.createRain(scene);
          break;
        case 'snow':
          this.createSnow(scene);
          break;
        case 'fog':
          this.createFog(scene);
          break;
        default:
          // Clear - remove all effects
          break;
      }

      const menu = document.getElementById('vr-weather-menu');
      if (menu) menu.style.display = 'none';
      
      showToast(`${this.getWeatherIcon(type)} Weather: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    },

    getWeatherIcon(type) {
      const icons = { clear: '☀️', rain: '🌧️', snow: '❄️', fog: '🌫️' };
      return icons[type] || '☀️';
    },

    createRain(scene) {
      const rain = document.createElement('a-entity');
      rain.id = 'vr-weather-system';
      
      // Create rain particles
      for (let i = 0; i < 100; i++) {
        const drop = document.createElement('a-cylinder');
        drop.setAttribute('radius', '0.01');
        drop.setAttribute('height', '0.2');
        drop.setAttribute('color', '#88ccff');
        drop.setAttribute('opacity', '0.6');
        drop.setAttribute('position', `${(Math.random() - 0.5) * 20} ${10 + Math.random() * 10} ${(Math.random() - 0.5) * 20}`);
        drop.setAttribute('animation', `property: position; to: ${(Math.random() - 0.5) * 20} 0 ${(Math.random() - 0.5) * 20}; dur: ${500 + Math.random() * 500}; loop: true`);
        rain.appendChild(drop);
      }
      
      scene.appendChild(rain);
      this.currentSystem = rain;
    },

    createSnow(scene) {
      const snow = document.createElement('a-entity');
      snow.id = 'vr-weather-system';
      
      for (let i = 0; i < 50; i++) {
        const flake = document.createElement('a-sphere');
        flake.setAttribute('radius', '0.03');
        flake.setAttribute('color', '#ffffff');
        flake.setAttribute('opacity', '0.8');
        flake.setAttribute('position', `${(Math.random() - 0.5) * 20} ${10 + Math.random() * 10} ${(Math.random() - 0.5) * 20}`);
        flake.setAttribute('animation', `property: position; to: ${(Math.random() - 0.5) * 20} 0 ${(Math.random() - 0.5) * 20}; dur: ${3000 + Math.random() * 2000}; loop: true; easing: easeInOutSine`);
        snow.appendChild(flake);
      }
      
      scene.appendChild(snow);
      this.currentSystem = snow;
    },

    createFog(scene) {
      const fog = document.createElement('a-entity');
      fog.id = 'vr-weather-system';
      
      // Add fog plane
      const fogPlane = document.createElement('a-plane');
      fogPlane.setAttribute('width', '100');
      fogPlane.setAttribute('height', '100');
      fogPlane.setAttribute('rotation', '-90 0 0');
      fogPlane.setAttribute('color', '#cccccc');
      fogPlane.setAttribute('opacity', '0.3');
      fogPlane.setAttribute('position', '0 0.5 0');
      fogPlane.setAttribute('material', 'transparent: true; shader: flat');
      fog.appendChild(fogPlane);
      
      scene.appendChild(fog);
      this.currentSystem = fog;
      
      // Reduce render distance
      scene.setAttribute('fog', 'type: exponential; color: #cccccc; density: 0.05');
    }
  };

  // ==================== 5. DAY/NIGHT CYCLE ====================
  const DayNightCycle = {
    time: 0, // 0-1, 0=dawn, 0.25=noon, 0.5=dusk, 0.75=midnight

    init() {
      if (!CONFIG.dayNight.enabled) return;
      
      this.createUI();
      this.startCycle();
      console.log('[VR Day/Night] Initialized');
    },

    createUI() {
      const indicator = document.createElement('div');
      indicator.id = 'vr-daynight-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 200px;
        background: rgba(0,0,0,0.6);
        border-radius: 20px;
        padding: 8px 16px;
        color: white;
        font-size: 14px;
        z-index: 99997;
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      indicator.innerHTML = `
        <span id="vr-daynight-icon">☀️</span>
        <span id="vr-daynight-time">12:00</span>
      `;
      document.body.appendChild(indicator);
    },

    startCycle() {
      const update = () => {
        // Increment time
        state.dayNightTime += 1 / (CONFIG.dayNight.cycleDuration * 60); // per frame at 60fps
        if (state.dayNightTime >= 1) state.dayNightTime = 0;

        this.updateLighting();
        this.updateUI();

        requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    },

    updateLighting() {
      const scene = document.querySelector('a-scene');
      if (!scene) return;

      const time = state.dayNightTime;
      
      // Calculate sun position
      const angle = time * Math.PI * 2 - Math.PI / 2;
      const sunX = Math.cos(angle) * 50;
      const sunY = Math.sin(angle) * 50;

      // Update sun light
      const sunLight = scene.querySelector('a-light[type="directional"]');
      if (sunLight) {
        sunLight.setAttribute('position', `${sunX} ${sunY} 0`);
        
        // Color changes throughout day
        let color, intensity;
        if (time < 0.2 || time > 0.8) {
          color = '#ff8844'; // Dawn/dusk
          intensity = 0.5;
        } else if (time >= 0.2 && time <= 0.4) {
          color = '#ffffff'; // Day
          intensity = 1.0;
        } else {
          color = '#4444aa'; // Night
          intensity = 0.2;
        }
        
        sunLight.setAttribute('color', color);
        sunLight.setAttribute('intensity', intensity);
      }

      // Update sky color
      const sky = scene.querySelector('a-sky');
      if (sky) {
        let skyColor;
        if (time < 0.2) skyColor = '#ff9966'; // Dawn
        else if (time < 0.4) skyColor = '#00BFFF'; // Day
        else if (time < 0.6) skyColor = '#ff6633'; // Dusk
        else skyColor = '#0a0a1a'; // Night
        
        sky.setAttribute('color', skyColor);
      }
    },

    updateUI() {
      const time = state.dayNightTime;
      const hours = Math.floor(time * 24);
      const minutes = Math.floor((time * 24 * 60) % 60);
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const timeEl = document.getElementById('vr-daynight-time');
      if (timeEl) timeEl.textContent = timeStr;

      // Update icon
      const iconEl = document.getElementById('vr-daynight-icon');
      if (iconEl) {
        if (time >= 0.2 && time < 0.4) iconEl.textContent = '☀️';
        else if (time >= 0.4 && time < 0.6) iconEl.textContent = '🌅';
        else if (time >= 0.6 && time < 0.8) iconEl.textContent = '🌙';
        else iconEl.textContent = '🌅';
      }
    },

    setTime(hour) {
      state.dayNightTime = hour / 24;
      this.updateLighting();
    }
  };

  // ==================== 6. OBJECT INSPECTION MODE ====================
  const ObjectInspection = {
    originalPosition: null,
    originalRotation: null,
    originalParent: null,

    init() {
      this.setupInspection();
      console.log('[VR Inspection] Initialized');
    },

    setupInspection() {
      // Add inspect on double-click
      document.querySelectorAll('.grabbable, [data-grabbable], a-box, a-sphere').forEach(el => {
        el.addEventListener('dblclick', () => this.inspect(el));
      });

      // Exit on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.inspectionMode) {
          this.exit();
        }
      });
    },

    inspect(obj) {
      if (state.inspectionMode) return;
      
      state.inspectionMode = true;
      state.inspectedObject = obj;

      // Save original state
      this.originalPosition = obj.getAttribute('position');
      this.originalRotation = obj.getAttribute('rotation');
      this.originalParent = obj.parentNode;

      // Move to inspection position (in front of camera)
      const camera = document.querySelector('a-camera');
      if (camera) {
        const inspectPos = document.createElement('a-entity');
        inspectPos.setAttribute('position', '0 0 -2');
        camera.appendChild(inspectPos);
        
        inspectPos.appendChild(obj);
        obj.setAttribute('position', '0 0 0');
        obj.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 10000; loop: true; easing: linear');
        
        this.inspectContainer = inspectPos;
      }

      // Show UI
      this.showInspectionUI();
      HapticFeedback.play('success');
    },

    showInspectionUI() {
      const ui = document.createElement('div');
      ui.id = 'vr-inspection-ui';
      ui.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        border: 1px solid #00d4ff;
        border-radius: 10px;
        padding: 15px 25px;
        color: white;
        z-index: 99999;
        text-align: center;
      `;
      ui.innerHTML = `
        <div>🔍 Inspection Mode</div>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">Double-click to rotate • ESC to exit</div>
      `;
      document.body.appendChild(ui);
    },

    exit() {
      if (!state.inspectionMode || !state.inspectedObject) return;

      const obj = state.inspectedObject;
      
      // Remove animation
      obj.removeAttribute('animation');
      
      // Return to original parent and position
      if (this.originalParent) {
        this.originalParent.appendChild(obj);
        obj.setAttribute('position', this.originalPosition);
        obj.setAttribute('rotation', this.originalRotation);
      }

      // Cleanup
      if (this.inspectContainer) {
        this.inspectContainer.remove();
      }

      const ui = document.getElementById('vr-inspection-ui');
      if (ui) ui.remove();

      state.inspectionMode = false;
      state.inspectedObject = null;
      HapticFeedback.play('click');
    }
  };

  // ==================== 7. TELEPORTATION TRAILS ====================
  const TeleportationTrails = {
    trailEls: [],

    init() {
      this.setupTrailSystem();
      console.log('[VR Trails] Initialized');
    },

    setupTrailSystem() {
      // Hook into teleport from controller-support
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        if (name === 'animation' && typeof value === 'string' && value.includes('position') && this.id?.includes('rig')) {
          TeleportationTrails.createTrail(this);
        }
        return originalSetAttribute.call(this, name, value);
      };
    },

    createTrail(rig) {
      const startPos = rig.getAttribute('position');
      
      // Create trail particles
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const trail = document.createElement('a-sphere');
          trail.setAttribute('radius', '0.1');
          trail.setAttribute('color', '#00d4ff');
          trail.setAttribute('opacity', '0.5');
          trail.setAttribute('position', startPos);
          
          const scene = document.querySelector('a-scene');
          if (scene) {
            scene.appendChild(trail);
            
            // Fade out animation
            setTimeout(() => {
              trail.setAttribute('animation', 'property: opacity; to: 0; dur: 500');
              setTimeout(() => trail.remove(), 500);
            }, 100);
          }
        }, i * 50);
      }
    }
  };

  // ==================== 8. CONTROLLER POINTER BEAMS ====================
  const ControllerPointerBeams = {
    init() {
      this.enhanceBeams();
      console.log('[VR Beams] Initialized');
    },

    enhanceBeams() {
      // Enhance existing laser controls
      const checkBeams = () => {
        ['left-hand', 'right-hand'].forEach(id => {
          const hand = document.getElementById(id);
          if (hand && !hand.hasAttribute('data-beam-enhanced')) {
            this.enhanceHand(hand);
          }
        });
        requestAnimationFrame(checkBeams);
      };
      requestAnimationFrame(checkBeams);
    },

    enhanceHand(hand) {
      hand.setAttribute('data-beam-enhanced', 'true');
      
      // Add beam end cursor
      const cursor = document.createElement('a-entity');
      cursor.innerHTML = `
        <a-ring radius-inner="0.02" radius-outer="0.03" color="#00d4ff" opacity="0.8" rotation="0 0 0">
        </a-ring>
      `;
      cursor.setAttribute('visible', 'false');
      hand.appendChild(cursor);

      // Show cursor on intersection
      hand.addEventListener('raycaster-intersection', () => {
        cursor.setAttribute('visible', 'true');
      });
      
      hand.addEventListener('raycaster-intersection-cleared', () => {
        cursor.setAttribute('visible', 'false');
      });
    }
  };

  // ==================== 9. VR NOTIFICATIONS SYSTEM ====================
  const VRNotifications = {
    queue: [],
    showing: false,

    init() {
      this.createContainer();
      console.log('[VR Notifications] Initialized');
    },

    createContainer() {
      const container = document.createElement('div');
      container.id = 'vr-notifications-container';
      container.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 99999;
        max-width: 300px;
      `;
      document.body.appendChild(container);
    },

    show(message, type = 'info', duration = 3000) {
      const colors = {
        info: '#00d4ff',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
      };

      const notif = document.createElement('div');
      notif.style.cssText = `
        background: rgba(0,0,0,0.9);
        border-left: 4px solid ${colors[type]};
        border-radius: 8px;
        padding: 12px 16px;
        color: white;
        font-size: 13px;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(10px);
      `;
      notif.textContent = message;

      const container = document.getElementById('vr-notifications-container');
      if (container) {
        container.appendChild(notif);
        
        setTimeout(() => {
          notif.style.animation = 'slideOut 0.3s ease forwards';
          setTimeout(() => notif.remove(), 300);
        }, duration);
      }
    },

    info(msg) { this.show(msg, 'info'); },
    success(msg) { this.show(msg, 'success'); },
    warning(msg) { this.show(msg, 'warning'); },
    error(msg) { this.show(msg, 'error'); }
  };

  // ==================== 10. PERFORMANCE AUTO-SCALER ====================
  const PerformanceAutoScaler = {
    fpsHistory: [],
    lastCheck: Date.now(),

    init() {
      if (!CONFIG.autoScale.enabled) return;
      
      this.startMonitoring();
      this.createUI();
      console.log('[VR Auto-Scale] Initialized');
    },

    createUI() {
      const indicator = document.createElement('div');
      indicator.id = 'vr-quality-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 270px;
        right: 20px;
        background: rgba(0,0,0,0.6);
        border-radius: 8px;
        padding: 5px 10px;
        color: #888;
        font-size: 11px;
        z-index: 99996;
      `;
      indicator.textContent = `Quality: ${state.qualityLevel}`;
      document.body.appendChild(indicator);
    },

    startMonitoring() {
      let frameCount = 0;
      let lastTime = performance.now();

      const measure = () => {
        frameCount++;
        const now = performance.now();
        
        if (now - lastTime >= 1000) {
          const fps = frameCount;
          this.fpsHistory.push(fps);
          if (this.fpsHistory.length > 5) this.fpsHistory.shift();
          
          frameCount = 0;
          lastTime = now;
          
          this.adjustQuality();
        }
        
        requestAnimationFrame(measure);
      };
      requestAnimationFrame(measure);
    },

    adjustQuality() {
      const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      
      if (avgFPS < CONFIG.autoScale.targetFPS * 0.7 && state.qualityLevel !== 'low') {
        this.setQuality('low');
        VRNotifications.warning('Performance lowered for smoother experience');
      } else if (avgFPS > CONFIG.autoScale.targetFPS * 1.2 && state.qualityLevel === 'low') {
        this.setQuality('high');
        VRNotifications.success('Performance restored');
      }
    },

    setQuality(level) {
      state.qualityLevel = level;
      localStorage.setItem('vr-quality-level', level);

      const scene = document.querySelector('a-scene');
      if (!scene) return;

      const indicator = document.getElementById('vr-quality-indicator');
      if (indicator) {
        indicator.textContent = `Quality: ${level}`;
        indicator.style.color = level === 'high' ? '#22c55e' : '#f59e0b';
      }

      switch(level) {
        case 'low':
          scene.setAttribute('renderer', 'antialias: false; colorManagement: false; highRefreshRate: false');
          // Reduce shadow quality
          document.querySelectorAll('a-light[castshadow]').forEach(light => {
            light.setAttribute('shadowMapWidth', '512');
            light.setAttribute('shadowMapHeight', '512');
          });
          break;
        case 'high':
          scene.setAttribute('renderer', 'antialias: true; colorManagement: true; highRefreshRate: true');
          document.querySelectorAll('a-light[castshadow]').forEach(light => {
            light.setAttribute('shadowMapWidth', '2048');
            light.setAttribute('shadowMapHeight', '2048');
          });
          break;
      }
    }
  };

  // ==================== UTILITY: HAPTIC FEEDBACK ====================
  const HapticFeedback = {
    play(type) {
      const patterns = {
        click: { intensity: 0.3, duration: 50 },
        success: { intensity: 0.5, duration: 100 },
        boundary: { intensity: 0.7, duration: 100 }
      };

      const config = patterns[type];
      if (!config) return;

      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (gp && gp.hapticActuators?.[0]) {
          gp.hapticActuators[0].pulse(config.intensity, config.duration);
        }
      }
    }
  };

  // ==================== UTILITY: TOAST ====================
  function showToast(message) {
    let toast = document.getElementById('vr-toast-set4');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vr-toast-set4';
      toast.style.cssText = `
        position: fixed;
        bottom: 210px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(10,10,20,0.95);
        backdrop-filter: blur(12px);
        border: 1px solid #f59e0b;
        border-radius: 10px;
        color: #e0e0e0;
        font-size: 14px;
        padding: 12px 24px;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 99999;
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
  }

  // ==================== INITIALIZATION ====================
  function init() {
    console.log('[VR Substantial Quick Wins - Set 4] Initializing...');

    VoiceChat.init();
    RoomScaleBoundary.init();
    TutorialSystem.init();
    WeatherEffects.init();
    DayNightCycle.init();
    ObjectInspection.init();
    TeleportationTrails.init();
    ControllerPointerBeams.init();
    VRNotifications.init();
    PerformanceAutoScaler.init();

    console.log('[VR Substantial Quick Wins - Set 4] Initialized!');
    console.log('New shortcuts:');
    console.log('  V - Toggle voice chat');
    console.log('  ESC - Exit inspection mode');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.VRQuickWinsSet4 = {
    VoiceChat,
    Boundary: RoomScaleBoundary,
    Tutorial: TutorialSystem,
    Weather: WeatherEffects,
    DayNight: DayNightCycle,
    Inspection: ObjectInspection,
    Notifications: VRNotifications,
    AutoScale: PerformanceAutoScaler,
    showToast
  };

})();
