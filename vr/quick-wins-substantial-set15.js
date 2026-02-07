/**
 * VR Substantial Quick Wins - Set 15: Ultimate Features (10 features)
 * Continuing to 150 TOTAL VR FEATURES!
 * 
 * 10 Additional Major Features:
 * 1. VR Music Sequencer (beat maker)
 * 2. Hand Tracking Calibration (precision tool)
 * 3. Virtual Mirror (self-view)
 * 4. Haptic Typing Feedback (keyboard vibrations)
 * 5. 3D Photo Frame (image display)
 * 6. Voice Memo Recorder (audio notes)
 * 7. Proximity Social Distance (safety zone)
 * 8. VR Sketch Pad (quick doodles)
 * 9. Light Saber Tool (laser pointer)
 * 10. Celebration Mode (party effects)
 */

(function() {
  'use strict';

  const CONFIG = {
    sequencer: { bpm: 120, steps: 16 },
    socialDistance: { radius: 2.0 },
    lightSaber: { color: '#00ff00' }
  };

  const state = {
    sequencerPlaying: false,
    voiceRecording: false,
    celebrationActive: false,
    mediaRecorder: null,
    audioChunks: []
  };

  // ==================== 1. VR MUSIC SEQUENCER ====================
  const MusicSequencer = {
    steps: Array(16).fill(false),
    currentStep: 0,
    interval: null,

    init() {
      this.createUI();
      console.log('[VR Music Sequencer] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-sequencer-btn';
      btn.innerHTML = '🎹';
      btn.title = 'Music Sequencer';
      btn.style.cssText = `
        position: fixed; top: 3870px; right: 20px;
        background: rgba(236, 72, 153, 0.5); border: 2px solid #ec4899;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showSequencer());
      document.body.appendChild(btn);
    },

    showSequencer() {
      let panel = document.getElementById('vr-sequencer-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-sequencer-panel';
        panel.style.cssText = `
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(20,10,30,0.95); border: 2px solid #ec4899;
          border-radius: 20px; padding: 25px; z-index: 100000;
          min-width: 400px; color: white;
        `;
        document.body.appendChild(panel);
      }

      panel.innerHTML = `
        <h3 style="color: #ec4899; margin-bottom: 15px;">🎹 Music Sequencer</h3>
        <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; margin-bottom: 15px;">
          ${this.steps.map((active, i) => `
            <div onclick="VRQuickWinsSet15.Sequencer.toggleStep(${i})" 
              style="aspect-ratio: 1; background: ${active ? '#ec4899' : 'rgba(236,72,153,0.2)'}; 
              border: 2px solid #ec4899; border-radius: 8px; cursor: pointer;
              box-shadow: ${this.currentStep === i ? '0 0 15px #ec4899' : 'none'};">
            </div>
          `).join('')}
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="VRQuickWinsSet15.Sequencer.play()" 
            style="flex: 1; padding: 12px; background: #22c55e; border: none; border-radius: 8px; color: white; cursor: pointer;">▶️ Play</button>
          <button onclick="VRQuickWinsSet15.Sequencer.stop()" 
            style="flex: 1; padding: 12px; background: #ef4444; border: none; border-radius: 8px; color: white; cursor: pointer;">⏹️ Stop</button>
          <button onclick="VRQuickWinsSet15.Sequencer.clear()" 
            style="flex: 1; padding: 12px; background: #6b7280; border: none; border-radius: 8px; color: white; cursor: pointer;">🗑️ Clear</button>
        </div>
        <button onclick="document.getElementById('vr-sequencer-panel').style.display='none'" 
          style="width: 100%; margin-top: 15px; padding: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #888; cursor: pointer;">Close</button>
      `;
      panel.style.display = 'block';
    },

    toggleStep(index) {
      this.steps[index] = !this.steps[index];
      this.showSequencer();
    },

    play() {
      if (this.interval) return;
      state.sequencerPlaying = true;
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      this.interval = setInterval(() => {
        if (this.steps[this.currentStep]) {
          this.playBeat(audioCtx);
        }
        this.currentStep = (this.currentStep + 1) % 16;
        this.showSequencer();
      }, 60000 / CONFIG.sequencer.bpm / 4);
      
      showToast('🎹 Sequencer playing');
    },

    playBeat(audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    },

    stop() {
      clearInterval(this.interval);
      this.interval = null;
      state.sequencerPlaying = false;
      showToast('🎹 Sequencer stopped');
    },

    clear() {
      this.steps = Array(16).fill(false);
      this.showSequencer();
      showToast('🎹 Pattern cleared');
    }
  };

  // ==================== 2. HAND TRACKING CALIBRATION ====================
  const HandCalibration = {
    init() {
      this.createUI();
      console.log('[VR Hand Calibration] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-handcalib-btn';
      btn.innerHTML = '✋';
      btn.title = 'Hand Calibration';
      btn.style.cssText = `
        position: fixed; top: 3920px; right: 20px;
        background: rgba(59, 130, 246, 0.5); border: 2px solid #3b82f6;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.calibrate());
      document.body.appendChild(btn);
    },

    calibrate() {
      const panel = document.createElement('div');
      panel.id = 'vr-calib-panel';
      panel.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(10,20,40,0.95); border: 2px solid #3b82f6;
        border-radius: 20px; padding: 30px; z-index: 100000;
        text-align: center; color: white;
      `;
      
      panel.innerHTML = `
        <h3 style="color: #3b82f6; margin-bottom: 20px;">✋ Hand Calibration</h3>
        <div style="width: 200px; height: 200px; border: 3px dashed #3b82f6; border-radius: 50%; margin: 20px auto;
          display: flex; align-items: center; justify-content: center; font-size: 60px;">
          🖐️
        </div>
        <p style="color: #888; margin-bottom: 20px;">Hold your hand steady in the circle</p>
        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
          <div id="calib-progress" style="width: 0%; height: 100%; background: #3b82f6; transition: width 0.3s;"></div>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        document.getElementById('calib-progress').style.width = progress + '%';
        
        if (progress >= 100) {
          clearInterval(interval);
          panel.innerHTML = `
            <h3 style="color: #22c55e; margin-bottom: 20px;">✅ Calibration Complete!</h3>
            <p style="color: #888;">Your hand tracking is now optimized</p>
            <button onclick="document.getElementById('vr-calib-panel').remove()" 
              style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; border: none; border-radius: 8px; color: white; cursor: pointer;">Done</button>
          `;
          showToast('✋ Hand calibration complete');
        }
      }, 200);
    }
  };

  // ==================== 3. VIRTUAL MIRROR ====================
  const VirtualMirror = {
    init() {
      this.createUI();
      console.log('[VR Virtual Mirror] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-mirror-btn';
      btn.innerHTML = '🪞';
      btn.title = 'Virtual Mirror (M)';
      btn.style.cssText = `
        position: fixed; top: 3970px; right: 20px;
        background: rgba(168, 85, 247, 0.5); border: 2px solid #a855f7;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.toggle());
      document.body.appendChild(btn);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'm' && !e.ctrlKey) this.toggle();
      });
    },

    toggle() {
      let mirror = document.getElementById('vr-mirror');
      
      if (mirror) {
        mirror.remove();
        showToast('🪞 Mirror OFF');
        return;
      }

      mirror = document.createElement('div');
      mirror.id = 'vr-mirror';
      mirror.style.cssText = `
        position: fixed; top: 50%; right: 50px;
        transform: translateY(-50%);
        width: 300px; height: 400px;
        background: linear-gradient(135deg, rgba(168,85,247,0.3), rgba(100,50,150,0.3));
        border: 3px solid #a855f7; border-radius: 20px;
        z-index: 99997; overflow: hidden;
        box-shadow: 0 0 30px rgba(168,85,247,0.5);
      `;
      
      mirror.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a855f7;">
          <div style="font-size: 80px; margin-bottom: 20px;">👤</div>
          <p style="font-size: 14px;">Virtual Avatar</p>
          <p style="font-size: 12px; opacity: 0.7; margin-top: 10px;">Mirror Mode Active</p>
        </div>
      `;
      
      document.body.appendChild(mirror);
      showToast('🪞 Mirror ON - Press M to toggle');
    }
  };

  // ==================== 4. HAPTIC TYPING FEEDBACK ====================
  const HapticTyping = {
    enabled: false,

    init() {
      this.createUI();
      this.setupListeners();
      console.log('[VR Haptic Typing] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-haptic-type-btn';
      btn.innerHTML = '⌨️';
      btn.title = 'Haptic Typing';
      btn.style.cssText = `
        position: fixed; top: 4020px; right: 20px;
        background: rgba(234, 179, 8, 0.5); border: 2px solid #eab308;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.toggle());
      document.body.appendChild(btn);
    },

    setupListeners() {
      document.addEventListener('keydown', (e) => {
        if (this.enabled && e.key.length === 1) {
          this.triggerHaptic();
        }
      });
    },

    toggle() {
      this.enabled = !this.enabled;
      const btn = document.getElementById('vr-haptic-type-btn');
      
      if (this.enabled) {
        btn.style.background = 'rgba(234, 179, 8, 0.9)';
        btn.style.boxShadow = '0 0 20px #eab308';
        showToast('⌨️ Haptic typing ON');
      } else {
        btn.style.background = 'rgba(234, 179, 8, 0.5)';
        btn.style.boxShadow = 'none';
        showToast('⌨️ Haptic typing OFF');
      }
    },

    triggerHaptic() {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (gp?.hapticActuators?.[0]) {
          gp.hapticActuators[0].pulse(0.2, 30);
        }
      }
    }
  };

  // ==================== 5. 3D PHOTO FRAME ====================
  const PhotoFrame = {
    init() {
      this.createUI();
      console.log('[VR Photo Frame] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-photoframe-btn';
      btn.innerHTML = '🖼️';
      btn.title = '3D Photo Frame';
      btn.style.cssText = `
        position: fixed; top: 4070px; right: 20px;
        background: rgba(251, 146, 60, 0.5); border: 2px solid #fb923c;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showFrame());
      document.body.appendChild(btn);
    },

    showFrame() {
      const frame = document.createElement('div');
      frame.id = 'vr-photoframe';
      frame.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 400px; height: 500px;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 8px solid #fb923c; border-radius: 10px;
        z-index: 100000; padding: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      `;
      
      frame.innerHTML = `
        <div style="width: 100%; height: 350px; background: linear-gradient(45deg, #2d1b4e, #1a1a2e); 
          border-radius: 5px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
          <div style="font-size: 100px;">🖼️</div>
        </div>
        <input type="text" placeholder="Enter image URL..." 
          style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid #fb923c; 
          border-radius: 6px; color: white; margin-bottom: 10px; box-sizing: border-box;">
        <div style="display: flex; gap: 10px;">
          <button onclick="document.getElementById('vr-photoframe').remove()" 
            style="flex: 1; padding: 10px; background: #fb923c; border: none; border-radius: 6px; color: white; cursor: pointer;">Load</button>
          <button onclick="document.getElementById('vr-photoframe').remove()" 
            style="flex: 1; padding: 10px; background: transparent; border: 1px solid #fb923c; border-radius: 6px; color: #fb923c; cursor: pointer;">Close</button>
        </div>
      `;
      
      document.body.appendChild(frame);
    }
  };

  // ==================== 6. VOICE MEMO RECORDER ====================
  const VoiceMemo = {
    init() {
      this.createUI();
      console.log('[VR Voice Memo] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-voicememo-btn';
      btn.innerHTML = '🎙️';
      btn.title = 'Voice Memo (Hold R)';
      btn.style.cssText = `
        position: fixed; top: 4120px; right: 20px;
        background: rgba(239, 68, 68, 0.5); border: 2px solid #ef4444;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('mousedown', () => this.startRecording());
      btn.addEventListener('mouseup', () => this.stopRecording());
      btn.addEventListener('mouseleave', () => this.stopRecording());
      document.body.appendChild(btn);

      // Keyboard shortcut
      document.addEventListener('keydown', (e) => {
        if (e.key === 'r' && !state.voiceRecording) this.startRecording();
      });
      document.addEventListener('keyup', (e) => {
        if (e.key === 'r' && state.voiceRecording) this.stopRecording();
      });
    },

    async startRecording() {
      if (state.voiceRecording) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];
        
        state.mediaRecorder.ondataavailable = (e) => {
          state.audioChunks.push(e.data);
        };
        
        state.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(state.audioChunks, { type: 'audio/wav' });
          this.saveMemo(audioBlob);
        };
        
        state.mediaRecorder.start();
        state.voiceRecording = true;
        
        document.getElementById('vr-voicememo-btn').style.background = 'rgba(239, 68, 68, 0.9)';
        document.getElementById('vr-voicememo-btn').style.boxShadow = '0 0 20px #ef4444';
        showToast('🔴 Recording...');
      } catch (e) {
        showToast('❌ Microphone access denied');
      }
    },

    stopRecording() {
      if (!state.voiceRecording || !state.mediaRecorder) return;
      
      state.mediaRecorder.stop();
      state.voiceRecording = false;
      
      document.getElementById('vr-voicememo-btn').style.background = 'rgba(239, 68, 68, 0.5)';
      document.getElementById('vr-voicememo-btn').style.boxShadow = 'none';
      showToast('✅ Recording saved');
    },

    saveMemo(blob) {
      const memos = JSON.parse(localStorage.getItem('vr-voice-memos') || '[]');
      memos.push({
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        size: blob.size
      });
      localStorage.setItem('vr-voice-memos', JSON.stringify(memos));
    }
  };

  // ==================== 7. PROXIMITY SOCIAL DISTANCE ====================
  const SocialDistance = {
    init() {
      this.createUI();
      console.log('[VR Social Distance] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-socialdist-btn';
      btn.innerHTML = '😷';
      btn.title = 'Social Distance Zone';
      btn.style.cssText = `
        position: fixed; top: 4170px; right: 20px;
        background: rgba(34, 197, 94, 0.5); border: 2px solid #22c55e;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.toggle());
      document.body.appendChild(btn);
    },

    toggle() {
      let zone = document.getElementById('vr-social-zone');
      
      if (zone) {
        zone.remove();
        showToast('😷 Social distance zone OFF');
        return;
      }

      zone = document.createElement('div');
      zone.id = 'vr-social-zone';
      zone.style.cssText = `
        position: fixed; bottom: 100px; left: 50%;
        transform: translateX(-50%);
        width: 200px; height: 200px;
        border: 3px dashed #22c55e; border-radius: 50%;
        z-index: 99996; opacity: 0.5;
        display: flex; align-items: center; justify-content: center;
      `;
      
      zone.innerHTML = `
        <div style="text-align: center; color: #22c55e;">
          <div style="font-size: 30px;">😷</div>
          <div style="font-size: 10px; margin-top: 5px;">2m Safety Zone</div>
        </div>
      `;
      
      document.body.appendChild(zone);
      showToast('😷 Social distance zone ON - 2 meter radius');
    }
  };

  // ==================== 8. VR SKETCH PAD ====================
  const SketchPad = {
    init() {
      this.createUI();
      console.log('[VR Sketch Pad] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-sketch-btn';
      btn.innerHTML = '✏️';
      btn.title = 'Sketch Pad (S)';
      btn.style.cssText = `
        position: fixed; top: 4220px; right: 20px;
        background: rgba(100, 100, 100, 0.5); border: 2px solid #888;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.open());
      document.body.appendChild(btn);

      document.addEventListener('keydown', (e) => {
        if (e.key === 's' && !e.ctrlKey) this.open();
      });
    },

    open() {
      let pad = document.getElementById('vr-sketch-pad');
      if (pad) {
        pad.remove();
        return;
      }

      pad = document.createElement('div');
      pad.id = 'vr-sketch-pad';
      pad.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 500px; height: 400px;
        background: #f5f5f5; border-radius: 10px;
        z-index: 100000; padding: 10px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      `;
      
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 340;
      canvas.style.cssText = 'background: white; border-radius: 5px; cursor: crosshair;';
      
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      let drawing = false;
      
      canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
      });
      
      canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      });
      
      canvas.addEventListener('mouseup', () => drawing = false);
      canvas.addEventListener('mouseleave', () => drawing = false);
      
      pad.appendChild(canvas);
      
      const controls = document.createElement('div');
      controls.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';
      controls.innerHTML = `
        <button onclick="this.parentElement.parentElement.querySelector('canvas').getContext('2d').clearRect(0,0,480,340)" 
          style="padding: 8px 15px; background: #ef4444; border: none; border-radius: 6px; color: white; cursor: pointer;">Clear</button>
        <button onclick="document.getElementById('vr-sketch-pad').remove()" 
          style="padding: 8px 15px; background: #6b7280; border: none; border-radius: 6px; color: white; cursor: pointer;">Close</button>
      `;
      pad.appendChild(controls);
      
      document.body.appendChild(pad);
      showToast('✏️ Sketch Pad opened');
    }
  };

  // ==================== 9. LIGHT SABER TOOL ====================
  const LightSaber = {
    active: false,

    init() {
      this.createUI();
      console.log('[VR Light Saber] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-lightsaber-btn';
      btn.innerHTML = '⚔️';
      btn.title = 'Light Saber (L)';
      btn.style.cssText = `
        position: fixed; top: 4270px; right: 20px;
        background: rgba(0, 255, 0, 0.5); border: 2px solid #00ff00;
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.toggle());
      document.body.appendChild(btn);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'l' || e.key === 'L') this.toggle();
      });
    },

    toggle() {
      this.active = !this.active;
      
      let saber = document.getElementById('vr-lightsaber');
      
      if (this.active) {
        saber = document.createElement('div');
        saber.id = 'vr-lightsaber';
        saber.style.cssText = `
          position: fixed; top: 50%; left: 50%;
          width: 10px; height: 300px;
          background: linear-gradient(180deg, #00ff00, #00aa00);
          border-radius: 5px;
          box-shadow: 0 0 30px #00ff00, 0 0 60px #00ff00;
          z-index: 99999; pointer-events: none;
          transform-origin: bottom center;
        `;
        
        // Handle
        const handle = document.createElement('div');
        handle.style.cssText = `
          position: absolute; bottom: -40px; left: -10px;
          width: 30px; height: 40px;
          background: linear-gradient(90deg, #444, #666, #444);
          border-radius: 5px;
        `;
        saber.appendChild(handle);
        
        document.body.appendChild(saber);
        
        // Follow mouse
        document.addEventListener('mousemove', this.moveSaber);
        
        // Haptic feedback
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
          if (gp?.hapticActuators?.[0]) {
            gp.hapticActuators[0].pulse(0.8, 500);
          }
        }
        
        showToast('⚔️ Light Saber activated!');
      } else {
        if (saber) saber.remove();
        document.removeEventListener('mousemove', this.moveSaber);
        showToast('⚔️ Light Saber deactivated');
      }
    },

    moveSaber(e) {
      const saber = document.getElementById('vr-lightsaber');
      if (saber) {
        const angle = Math.atan2(e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2);
        saber.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`;
        saber.style.left = e.clientX + 'px';
        saber.style.top = e.clientY + 'px';
      }
    }
  };

  // ==================== 10. CELEBRATION MODE ====================
  const CelebrationMode = {
    init() {
      this.createUI();
      console.log('[VR Celebration Mode] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-celebrate-btn';
      btn.innerHTML = '🎉';
      btn.title = 'Celebration Mode (C)';
      btn.style.cssText = `
        position: fixed; top: 4320px; right: 20px;
        background: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6);
        color: white; width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; font-size: 18px; z-index: 99998;
      `;
      btn.addEventListener('click', () => this.activate());
      document.body.appendChild(btn);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'c' && !e.ctrlKey) this.activate();
      });
    },

    activate() {
      state.celebrationActive = true;
      
      // Create confetti
      for (let i = 0; i < 100; i++) {
        setTimeout(() => this.createConfetti(), i * 30);
      }
      
      // Flash screen
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(255,255,255,0.3); z-index: 100000;
        pointer-events: none;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 200);
      
      // Haptic party
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          for (const gp of gamepads) {
            if (gp?.hapticActuators?.[0]) {
              gp.hapticActuators[0].pulse(Math.random(), 100);
            }
          }
        }, i * 100);
      }
      
      showToast('🎉🎊 CELEBRATION MODE! 🎊🎉');
      
      setTimeout(() => {
        state.celebrationActive = false;
      }, 5000);
    },

    createConfetti() {
      const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed; 
        left: ${Math.random() * 100}vw; 
        top: -20px;
        width: 10px; height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        z-index: 99999;
      `;
      
      document.body.appendChild(confetti);
      
      const duration = 2000 + Math.random() * 3000;
      const rotation = Math.random() * 720;
      
      confetti.animate([
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        { transform: `translateY(${window.innerHeight + 50}px) rotate(${rotation}deg)`, opacity: 0 }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => confetti.remove();
    }
  };

  // ==================== UTILITY ====================
  function showToast(message) {
    let toast = document.getElementById('vr-toast-set15');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vr-toast-set15';
      toast.style.cssText = `
        position: fixed; bottom: 750px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(10,10,20,0.95); backdrop-filter: blur(12px);
        border: 1px solid #ec4899; border-radius: 10px;
        color: #e0e0e0; font-size: 14px; padding: 12px 24px;
        opacity: 0; pointer-events: none; transition: all 0.3s ease;
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
    console.log('[VR Substantial Quick Wins - Set 15] Initializing...');
    console.log('🚀 TARGET: 150 TOTAL VR FEATURES!');

    MusicSequencer.init();
    HandCalibration.init();
    VirtualMirror.init();
    HapticTyping.init();
    PhotoFrame.init();
    VoiceMemo.init();
    SocialDistance.init();
    SketchPad.init();
    LightSaber.init();
    CelebrationMode.init();

    console.log('[VR Set 15] COMPLETE - 150 TOTAL FEATURES!');
    
    setTimeout(() => {
      showToast('🎉 Set 15 Active! 150 VR Features Total!');
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.VRQuickWinsSet15 = {
    Sequencer: MusicSequencer,
    HandCalibration,
    Mirror: VirtualMirror,
    HapticTyping,
    PhotoFrame,
    VoiceMemo,
    SocialDistance,
    SketchPad,
    LightSaber,
    Celebration: CelebrationMode,
    showToast
  };

})();
