/**
 * VR Quick Wins - Polish & UX Enhancements
 * 
 * Features that don't collide with other agents' work:
 * - Zone transition fade effects
 * - UI sound effects on interactions
 * - Reset position button
 * - Quick return to hub
 * - Keyboard shortcut helper
 * - Better loading screen
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    sounds: {
      enabled: true,
      volume: 0.3,
      click: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==', // Placeholder - will generate simple beep
    },
    transitions: {
      enabled: true,
      duration: 300
    }
  };

  // ========== 1. ZONE TRANSITION FADES ==========
  
  function createTransitionOverlay() {
    if (document.getElementById('vr-transition-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'vr-transition-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      opacity: 0;
      pointer-events: none;
      z-index: 999999;
      transition: opacity ${CONFIG.transitions.duration}ms ease;
    `;
    document.body.appendChild(overlay);

    // Also create VR fade plane
    const scene = document.querySelector('a-scene');
    if (scene) {
      const vrFade = document.createElement('a-plane');
      vrFade.id = 'vr-fade-plane';
      vrFade.setAttribute('position', '0 0 -0.1');
      vrFade.setAttribute('width', '10');
      vrFade.setAttribute('height', '10');
      vrFade.setAttribute('color', '#000');
      vrFade.setAttribute('opacity', '0');
      vrFade.setAttribute('visible', 'false');
      vrFade.setAttribute('material', 'shader: flat; transparent: true');
      
      const camera = document.querySelector('a-camera');
      if (camera) camera.appendChild(vrFade);
    }
  }

  window.fadeToZone = function(url) {
    createTransitionOverlay();
    
    const overlay = document.getElementById('vr-transition-overlay');
    const vrFade = document.getElementById('vr-fade-plane');
    
    // Fade out
    if (overlay) overlay.style.opacity = '1';
    if (vrFade) {
      vrFade.setAttribute('visible', 'true');
      vrFade.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 300');
    }
    
    // Play transition sound
    playUISound('transition');
    
    // Navigate after fade
    setTimeout(() => {
      window.location.href = url;
    }, CONFIG.transitions.duration);
  };

  // Override all zone navigation to use fade
  function patchNavigation() {
    // Patch all onclick handlers that navigate
    document.querySelectorAll('[onclick*="window.location"], [onclick*="goToZone"]').forEach(el => {
      const originalOnclick = el.getAttribute('onclick');
      if (originalOnclick) {
        const urlMatch = originalOnclick.match(/['"]([^'"]*(?:vr|hub|zone)[^'"]*)['"]/);
        if (urlMatch) {
          el.setAttribute('onclick', `fadeToZone('${urlMatch[1]}')`);
        }
      }
    });
  }

  // ========== 2. UI SOUND EFFECTS ==========

  function playUISound(type) {
    if (!CONFIG.sounds.enabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
      case 'click':
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(CONFIG.sounds.volume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'hover':
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(CONFIG.sounds.volume * 0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
      case 'transition':
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(CONFIG.sounds.volume * 0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case 'success':
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(CONFIG.sounds.volume * 0.3, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
    }
  }

  function addSoundToInteractables() {
    // Add hover and click sounds to all clickable elements
    document.querySelectorAll('.clickable, a-box, a-sphere, a-cylinder, [onclick]').forEach(el => {
      el.addEventListener('mouseenter', () => playUISound('hover'));
      el.addEventListener('click', () => playUISound('click'));
    });
  }

  // ========== 3. RESET POSITION BUTTON ==========

  function createResetPositionButton() {
    if (document.getElementById('vr-reset-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'vr-reset-btn';
    btn.innerHTML = '↺ Reset Position';
    btn.title = 'Reset to starting position (R key)';
    btn.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 20px;
      background: rgba(0, 212, 255, 0.2);
      border: 2px solid #00d4ff;
      color: #00d4ff;
      padding: 10px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: bold;
      z-index: 99998;
      backdrop-filter: blur(10px);
      transition: all 0.3s;
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(0, 212, 255, 0.4)';
      playUISound('hover');
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(0, 212, 255, 0.2)';
    });
    btn.addEventListener('click', () => {
      resetPosition();
      playUISound('success');
    });

    document.body.appendChild(btn);
  }

  window.resetPosition = function() {
    const cameraRig = document.getElementById('camera-rig') || 
                      document.querySelector('a-entity[a-camera]')?.parentElement;
    
    if (cameraRig) {
      // Get starting position from initial load or default
      const startPos = window.VR_INITIAL_POSITION || { x: 0, y: 0, z: 0 };
      
      cameraRig.setAttribute('animation', 
        `property: position; to: ${startPos.x} ${startPos.y} ${startPos.z}; dur: 500; easing: easeInOutQuad`
      );
      
      // Also reset rotation
      const camera = document.querySelector('a-camera');
      if (camera) {
        camera.setAttribute('rotation', '0 0 0');
      }
    }
  };

  // R key for reset
  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      resetPosition();
    }
  });

  // ========== 4. QUICK RETURN TO HUB ==========

  function createQuickHubButton() {
    if (document.getElementById('vr-hub-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'vr-hub-btn';
    btn.innerHTML = '🏠 Hub';
    btn.title = 'Return to VR Hub (H key)';
    btn.style.cssText = `
      position: fixed;
      bottom: 140px;
      left: 20px;
      background: rgba(168, 85, 247, 0.2);
      border: 2px solid #a855f7;
      color: #a855f7;
      padding: 10px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: bold;
      z-index: 99998;
      backdrop-filter: blur(10px);
      transition: all 0.3s;
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(168, 85, 247, 0.4)';
      playUISound('hover');
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(168, 85, 247, 0.2)';
    });
    btn.addEventListener('click', () => {
      playUISound('transition');
      fadeToZone('/vr/');
    });

    document.body.appendChild(btn);
  }

  // H key for hub
  document.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
      if (e.target === document.body) {
        fadeToZone('/vr/');
      }
    }
  });

  // ========== 5. KEYBOARD SHORTCUT HELPER ==========

  function createShortcutHelper() {
    if (document.getElementById('vr-shortcuts-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'vr-shortcuts-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.85);
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    `;

    overlay.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a3e 0%, #0f0f1f 100%);
        border: 2px solid #00d4ff;
        border-radius: 20px;
        padding: 30px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 25px 100px rgba(0,212,255,0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #00d4ff; margin: 0;">⌨️ Keyboard Shortcuts</h2>
          <button onclick="toggleShortcutHelper()" style="
            background: rgba(239,68,68,0.8);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
          ">×</button>
        </div>
        
        <div style="color: #ccc; line-height: 2;">
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">WASD</kbd> Move around</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">Mouse</kbd> Look around</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">M</kbd> or <kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">Tab</kbd> Open navigation menu</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">1-6</kbd> Jump to zones</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">0</kbd> Return to center</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">R</kbd> Reset position</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">H</kbd> Return to Hub</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">?</kbd> Toggle this help</div>
          <div><kbd style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #00d4ff; font-family: monospace;">ESC</kbd> Close menus</div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #888; font-size: 12px;">
          <strong>Quest 3 Controllers:</strong><br>
          Left Thumbstick = Move | Right Thumbstick = Teleport aim<br>
          Trigger = Select | Menu Button = Open nav
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  window.toggleShortcutHelper = function() {
    const overlay = document.getElementById('vr-shortcuts-overlay');
    if (overlay) {
      const isVisible = overlay.style.display === 'flex';
      overlay.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) playUISound('click');
    }
  };

  // ? key for shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      toggleShortcutHelper();
    }
  });

  // ========== 6. BETTER LOADING SCREEN ==========

  function enhanceLoadingScreen() {
    const loading = document.getElementById('loading');
    if (!loading) return;

    // Add progress bar
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 200px;
      height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      margin-top: 20px;
      overflow: hidden;
    `;

    const progressBar = document.createElement('div');
    progressBar.id = 'vr-loading-progress';
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #00d4ff, #a855f7);
      transition: width 0.3s ease;
    `;

    progressContainer.appendChild(progressBar);
    loading.appendChild(progressContainer);

    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) progress = 100;
      progressBar.style.width = progress + '%';
      
      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          loading.style.opacity = '0';
          setTimeout(() => loading.style.display = 'none', 500);
        }, 300);
      }
    }, 200);
  }

  // ========== 7. SMOOTH LOCOMOTION VIGNETTE ==========

  function createComfortVignette() {
    if (document.getElementById('vr-vignette')) return;

    const vignette = document.createElement('div');
    vignette.id = 'vr-vignette';
    vignette.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 99997;
      opacity: 0;
      transition: opacity 0.3s ease;
      background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.5) 100%);
    `;
    document.body.appendChild(vignette);

    // Show vignette during movement
    let moveTimeout;
    const originalMove = window.addEventListener;
    
    ['keydown', 'thumbstick'].forEach(event => {
      window.addEventListener(event, () => {
        if (event === 'keydown' && !['w','a','s','d','Arrow'].some(k => event.key?.includes(k))) return;
        
        vignette.style.opacity = '1';
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
          vignette.style.opacity = '0';
        }, 300);
      }, true);
    });
  }

  // ========== INITIALIZATION ==========

  function init() {
    console.log('[VR Quick Wins] Initializing...');

    // Store initial position
    setTimeout(() => {
      const cameraRig = document.getElementById('camera-rig') || 
                        document.querySelector('a-entity[a-camera]')?.parentElement;
      if (cameraRig) {
        const pos = cameraRig.getAttribute('position');
        window.VR_INITIAL_POSITION = { x: pos.x, y: pos.y, z: pos.z };
      }
    }, 1000);

    // Create UI elements
    createTransitionOverlay();
    createResetPositionButton();
    createQuickHubButton();
    createShortcutHelper();
    enhanceLoadingScreen();
    createComfortVignette();

    // Patch navigation after a short delay
    setTimeout(() => {
      patchNavigation();
      addSoundToInteractables();
    }, 2000);

    console.log('[VR Quick Wins] Initialized!');
    console.log('Shortcuts: R=Reset, H=Hub, ?=Help, M=Menu');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.VRQuickWins = {
    fadeToZone,
    resetPosition,
    playUISound,
    toggleShortcutHelper
  };
})();
