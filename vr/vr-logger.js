/**
 * VR Logger - Fixed version without infinite recursion
 */

(function() {
  'use strict';

  // Store original console methods IMMEDIATELY before any modifications
  const _originalLog = console.log.bind(console);
  const _originalWarn = console.warn.bind(console);
  const _originalError = console.error.bind(console);

  const VRLogger = {
    logs: [],
    maxLogs: 500,
    startTime: Date.now(),
    sessionId: Math.random().toString(36).substring(2, 15),

    init() {
      this.log('VR', 'Logger initialized', { sessionId: this.sessionId });
      this.captureErrors();
      this.createOverlay();
      this.logSystemInfo();
    },

    logSystemInfo() {
      this.log('SYS', 'System info', {
        userAgent: navigator.userAgent.substring(0, 100),
        platform: navigator.platform,
        screenSize: `${screen.width}x${screen.height}`,
        touchSupport: 'ontouchstart' in window
      });
    },

    log(category, message, data = null) {
      const entry = {
        timestamp: Date.now(),
        elapsed: Date.now() - this.startTime,
        category,
        message,
        data
      };

      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Use the TRULY original console.log (stored at module load time)
      const prefix = `[VR-${category}]`;
      if (data) {
        _originalLog(prefix, message, data);
      } else {
        _originalLog(prefix, message);
      }

      // Save to localStorage
      try {
        localStorage.setItem('vr-logs', JSON.stringify(this.logs.slice(-100)));
      } catch (e) {}
    },

    logMobileDetection(isMobile, deviceInfo) {
      this.log('MOBILE', 'Detection result', { isMobile, ...deviceInfo });
    },

    logRedirect(from, to, reason) {
      this.log('REDIRECT', reason, { from, to });
    },

    captureErrors() {
      window.addEventListener('error', (e) => {
        this.log('ERROR', e.message, { 
          filename: e.filename, 
          lineno: e.lineno 
        });
      });
    },

    createOverlay() {
      const toggle = document.createElement('button');
      toggle.id = 'vr-log-toggle';
      toggle.innerHTML = '📋';
      toggle.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        width: 50px; height: 50px;
        background: rgba(0,0,0,0.8);
        border: 2px solid #00d4ff;
        border-radius: 50%;
        color: #00d4ff;
        font-size: 20px;
        cursor: pointer;
        z-index: 99999;
      `;
      toggle.onclick = () => this.toggleOverlay();
      document.body.appendChild(toggle);
    },

    toggleOverlay() {
      let overlay = document.getElementById('vr-log-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'vr-log-overlay';
        overlay.style.cssText = `
          position: fixed; top: 60px; left: 20px; right: 20px; bottom: 90px;
          background: rgba(10,10,20,0.95);
          border: 2px solid #00d4ff;
          border-radius: 10px;
          z-index: 99999;
          display: none;
          flex-direction: column;
          font-family: monospace;
          font-size: 12px;
          padding: 15px;
          overflow-y: auto;
          color: #ccc;
        `;
        document.body.appendChild(overlay);
      }
      
      if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
      } else {
        overlay.innerHTML = this.logs.map(log => 
          `<div>[${new Date(log.timestamp).toLocaleTimeString()}] <b>${log.category}</b>: ${log.message}</div>`
        ).join('');
        overlay.style.display = 'flex';
      }
    }
  };

  window.VRLogger = VRLogger;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VRLogger.init());
  } else {
    VRLogger.init();
  }
})();
