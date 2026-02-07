/**
 * VR Simple/Advanced Mode Toggle
 * Reduces UI clutter by hiding advanced features in Simple mode
 */

(function() {
  'use strict';

  const VRModeToggle = {
    mode: 'advanced', // 'simple' or 'advanced'
    simpleButtons: [],
    advancedButtons: [],
    
    init() {
      // Load saved preference
      const savedMode = localStorage.getItem('vr-ui-mode');
      if (savedMode) this.mode = savedMode;
      
      this.createToggle();
      this.categorizeButtons();
      this.applyMode();
      
      console.log('[VR Mode] Initialized:', this.mode);
    },
    
    createToggle() {
      // Create mode toggle button
      const toggle = document.createElement('button');
      toggle.id = 'vr-mode-toggle';
      toggle.innerHTML = this.mode === 'simple' ? '🎯' : '🎛️';
      toggle.title = this.mode === 'simple' ? 'Switch to Advanced Mode' : 'Switch to Simple Mode';
      toggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 50px;
        height: 50px;
        background: ${this.mode === 'simple' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #6b7280, #4b5563)'};
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 25px;
        color: white;
        font-size: 20px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      `;
      
      toggle.onclick = () => this.toggleMode();
      document.body.appendChild(toggle);
      
      // Create mode indicator text
      const indicator = document.createElement('div');
      indicator.id = 'vr-mode-indicator';
      indicator.textContent = this.mode === 'simple' ? 'Simple Mode' : 'Advanced Mode';
      indicator.style.cssText = `
        position: fixed;
        bottom: 75px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: ${this.mode === 'simple' ? '#22c55e' : '#6b7280'};
        padding: 5px 15px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: bold;
        z-index: 99998;
        pointer-events: none;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(indicator);
      
      // First-time user: show mode selector
      if (!localStorage.getItem('vr-mode-seen')) {
        // Small delay to ensure page is fully rendered
        setTimeout(() => {
          this.showModeSelector();
          localStorage.setItem('vr-mode-seen', 'true');
        }, 500);
      }
    },
    
    showModeSelector() {
      const selector = document.createElement('div');
      selector.id = 'vr-mode-selector';
      selector.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10,10,30,0.98);
        backdrop-filter: blur(10px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        pointer-events: auto;
      `;
      
      // Determine current mode to highlight the active button
      const currentMode = this.mode;
      const simpleActive = currentMode === 'simple';
      const advancedActive = currentMode === 'advanced';
      
      selector.innerHTML = `
        <h2 style="color: #00d4ff; font-size: 28px; margin-bottom: 10px;">Choose Your Experience</h2>
        <p style="color: #888; margin-bottom: 40px; text-align: center;">${simpleActive ? 'Simple Mode is active' : advancedActive ? 'Advanced Mode is active' : 'Select a mode that suits your preference'}</p>
        
        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
          <button id="vr-mode-simple-btn" style="
            width: 200px;
            padding: 30px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: ${simpleActive ? '4px solid #fff' : '3px solid transparent'};
            border-radius: 20px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            box-shadow: ${simpleActive ? '0 0 30px rgba(34,197,94,0.6)' : 'none'};
            opacity: ${simpleActive ? '1' : '0.7'};
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <div style="font-size: 48px; margin-bottom: 15px;">🎯</div>
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">${simpleActive ? '✓ Simple Mode' : 'Simple Mode'}</div>
            <div style="font-size: 12px; opacity: 0.9;">Clean, minimal UI<br>Essential features only</div>
          </button>
          
          <button id="vr-mode-advanced-btn" style="
            width: 200px;
            padding: 30px;
            background: linear-gradient(135deg, #6b7280, #4b5563);
            border: ${advancedActive ? '4px solid #fff' : '3px solid transparent'};
            border-radius: 20px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            box-shadow: ${advancedActive ? '0 0 30px rgba(107,114,128,0.6)' : 'none'};
            opacity: ${advancedActive ? '1' : '0.7'};
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <div style="font-size: 48px; margin-bottom: 15px;">🎛️</div>
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">${advancedActive ? '✓ Advanced Mode' : 'Advanced Mode'}</div>
            <div style="font-size: 12px; opacity: 0.9;">Full feature set<br>160+ VR features</div>
          </button>
        </div>
        
        <p style="color: #666; margin-top: 30px; font-size: 12px;">You can change this anytime using the mode button at the bottom</p>
      `;
      
      document.body.appendChild(selector);
      
      const simpleBtn = selector.querySelector('#vr-mode-simple-btn');
      const advancedBtn = selector.querySelector('#vr-mode-advanced-btn');
      
      const handleSimpleMode = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        console.log('[VR Mode] Simple mode selected');
        
        // Visual feedback
        simpleBtn.style.transform = 'scale(0.95)';
        simpleBtn.style.boxShadow = '0 0 30px rgba(34,197,94,0.8)';
        
        setTimeout(() => {
          this.setMode('simple');
          selector.remove();
          this.showToast('🎯 Simple Mode activated!');
        }, 200);
      };
      
      const handleAdvancedMode = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        console.log('[VR Mode] Advanced mode selected');
        
        // Visual feedback
        advancedBtn.style.transform = 'scale(0.95)';
        advancedBtn.style.boxShadow = '0 0 30px rgba(107,114,128,0.8)';
        
        setTimeout(() => {
          this.setMode('advanced');
          selector.remove();
          this.showToast('🎛️ Advanced Mode activated!');
        }, 200);
      };
      
      simpleBtn.addEventListener('click', handleSimpleMode);
      advancedBtn.addEventListener('click', handleAdvancedMode);
      
      // Also add touch handlers for mobile
      simpleBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleSimpleMode();
      });
      
      advancedBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleAdvancedMode();
      });
    },
    
    categorizeButtons() {
      // Clear previous categorization
      this.simpleButtons = [];
      this.advancedButtons = [];
      
      // Check if we're on mobile
      const isMobilePage = window.location.pathname.includes('mobile');
      
      // Get all buttons and categorize them
      const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
      
      allButtons.forEach(btn => {
        const id = btn.id || '';
        const classes = btn.className || '';
        
        // Skip already categorized
        if (btn.dataset.vrMode) {
          if (btn.dataset.vrMode === 'simple') this.simpleButtons.push(btn);
          else this.advancedButtons.push(btn);
          return;
        }
        
        // MOBILE: Keep most UI elements visible - only hide true power-user features
        if (isMobilePage) {
          // Essential mobile UI (always visible)
          if (
            id.includes('hub') ||
            id.includes('back') ||
            id.includes('menu') ||
            id.includes('reset') ||
            id.includes('jump') ||
            id.includes('select') ||
            id.includes('vr-enter') ||
            id === 'vr-mode-toggle' ||
            classes.includes('mobile-action-btn') ||
            classes.includes('mobile-menu-btn') ||
            classes.includes('mobile-close-btn') ||
            classes.includes('primary')
          ) {
            this.simpleButtons.push(btn);
            btn.dataset.vrMode = 'simple';
          }
          // Only truly advanced features on mobile (AI, profiler, etc)
          else if (
            id.includes('profiler') ||
            id.includes('ai-full') ||
            id.includes('developer') ||
            id.includes('debug') ||
            classes.includes('advanced-only')
          ) {
            this.advancedButtons.push(btn);
            btn.dataset.vrMode = 'advanced';
          }
          // Everything else is simple on mobile
          else {
            this.simpleButtons.push(btn);
            btn.dataset.vrMode = 'simple';
          }
        }
        // DESKTOP: Full simple/advanced separation
        else {
          // Simple mode buttons (always visible)
          if (
            id.includes('hub') ||
            id.includes('back') ||
            id.includes('menu') ||
            id.includes('reset') ||
            classes.includes('primary') ||
            btn.textContent.includes('ENTER') ||
            id === 'vr-mode-toggle'
          ) {
            this.simpleButtons.push(btn);
            btn.dataset.vrMode = 'simple';
          }
          // Advanced mode buttons (hidden in simple mode)
          else if (
            id.includes('set') ||
            id.includes('quick') ||
            id.includes('clipboard') ||
            id.includes('gesture') ||
            id.includes('haptic') ||
            id.includes('profiler') ||
            id.includes('bookmark') ||
            id.includes('note') ||
            id.includes('pet') ||
            id.includes('weather-widget') ||
            id.includes('notifications') ||
            id.includes('shortcuts') ||
            id.includes('ambient') ||
            id.includes('fireworks') ||
            id.includes('celebration') ||
            classes.includes('advanced') ||
            (btn.style.position === 'fixed' && !btn.dataset.vrMode)
          ) {
            this.advancedButtons.push(btn);
            btn.dataset.vrMode = 'advanced';
          }
        }
      });
      
      console.log('[VR Mode] Simple buttons:', this.simpleButtons.length, '| Advanced:', this.advancedButtons.length);
    },
    
    toggleMode() {
      this.mode = this.mode === 'simple' ? 'advanced' : 'simple';
      this.setMode(this.mode);
    },
    
    setMode(mode) {
      console.log('[VR Mode] Setting mode to:', mode);
      this.mode = mode;
      localStorage.setItem('vr-ui-mode', mode);
      localStorage.setItem('vr-mode-seen', 'true');
      
      // Re-categorize buttons before applying (DOM may have changed)
      this.simpleButtons = [];
      this.advancedButtons = [];
      this.categorizeButtons();
      
      // Apply with slight delay to ensure DOM ready
      setTimeout(() => {
        this.applyMode();
        this.updateToggleAppearance();
        this.showToast(mode === 'simple' ? '🎯 Simple Mode: Clean UI' : '🎛️ Advanced Mode: All Features');
        console.log('[VR Mode] Mode applied:', mode);
      }, 100);
    },
    
    applyMode() {
      if (this.mode === 'simple') {
        // Hide advanced buttons
        this.advancedButtons.forEach(btn => {
          btn.style.display = 'none';
        });
        
        // Show simple buttons
        this.simpleButtons.forEach(btn => {
          btn.style.display = '';
        });
      } else {
        // Show all buttons
        this.advancedButtons.forEach(btn => {
          btn.style.display = '';
        });
        this.simpleButtons.forEach(btn => {
          btn.style.display = '';
        });
      }
    },
    
    updateToggleAppearance() {
      const toggle = document.getElementById('vr-mode-toggle');
      const indicator = document.getElementById('vr-mode-indicator');
      
      if (toggle) {
        toggle.innerHTML = this.mode === 'simple' ? '🎯' : '🎛️';
        toggle.title = this.mode === 'simple' ? 'Switch to Advanced Mode' : 'Switch to Simple Mode';
        toggle.style.background = this.mode === 'simple' 
          ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
          : 'linear-gradient(135deg, #6b7280, #4b5563)';
      }
      
      if (indicator) {
        indicator.textContent = this.mode === 'simple' ? 'Simple Mode' : 'Advanced Mode';
        indicator.style.color = this.mode === 'simple' ? '#22c55e' : '#6b7280';
      }
    },
    
    showToast(message) {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10,10,20,0.95);
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 14px;
        z-index: 100001;
        animation: fadeInOut 2s ease;
      `;
      toast.textContent = message;
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(toast);
      
      setTimeout(() => toast.remove(), 2000);
    }
  };
  
  // Expose globally
  window.VRModeToggle = VRModeToggle;
  
  // Initialize after page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VRModeToggle.init());
  } else {
    // Delay to let other buttons load first
    setTimeout(() => VRModeToggle.init(), 2000);
  }
})();
