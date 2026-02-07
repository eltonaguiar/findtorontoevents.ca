/**
 * VR Logger - Comprehensive logging for debugging
 * Logs to console, localStorage, and a visual overlay
 */

(function() {
  'use strict';

  const VRLogger = {
    logs: [],
    maxLogs: 500,
    startTime: Date.now(),
    sessionId: Math.random().toString(36).substring(2, 15),

    init() {
      this.log('VR', 'Logger initialized', { sessionId: this.sessionId, userAgent: navigator.userAgent });
      this.captureErrors();
      this.captureConsole();
      this.createOverlay();
      this.logSystemInfo();
      
      // Log page navigation
      this.log('NAV', 'Page loaded', { 
        url: window.location.href,
        pathname: window.location.pathname,
        referrer: document.referrer
      });
    },

    logSystemInfo() {
      this.log('SYS', 'System info', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenSize: `${screen.width}x${screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        maxTouchPoints: navigator.maxTouchPoints,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        webGL: this.checkWebGL(),
        webVR: 'getVRDisplays' in navigator,
        webXR: 'xr' in navigator
      });
    },

    checkWebGL() {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    },

    log(category, message, data = null) {
      const entry = {
        timestamp: Date.now(),
        elapsed: Date.now() - this.startTime,
        category,
        message,
        data,
        sessionId: this.sessionId
      };

      this.logs.push(entry);

      // Trim old logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Console output
      const prefix = `[VR-${category}]`;
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }

      // Update overlay if visible
      this.updateOverlay();

      // Save to localStorage (last 100 entries)
      try {
        const recentLogs = this.logs.slice(-100);
        localStorage.setItem('vr-logs', JSON.stringify(recentLogs));
        localStorage.setItem('vr-last-session', this.sessionId);
      } catch (e) {
        // localStorage might be full
      }
    },

    captureErrors() {
      // Capture JS errors
      window.addEventListener('error', (e) => {
        this.log('ERROR', 'JavaScript Error', {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          error: e.error ? e.error.stack : null
        });
      });

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (e) => {
        this.log('ERROR', 'Unhandled Promise Rejection', {
          reason: e.reason ? e.reason.toString() : null
        });
      });

      // Capture resource errors
      window.addEventListener('error', (e) => {
        if (e.target && e.target.tagName) {
          this.log('ERROR', 'Resource Load Error', {
            tag: e.target.tagName,
            src: e.target.src || e.target.href
          });
        }
      }, true);
    },

    captureConsole() {
      // Capture original console methods
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args) => {
        this.log('CONSOLE', 'LOG', { args: args.map(a => String(a)) });
        originalLog.apply(console, args);
      };

      console.warn = (...args) => {
        this.log('CONSOLE', 'WARN', { args: args.map(a => String(a)) });
        originalWarn.apply(console, args);
      };

      console.error = (...args) => {
        this.log('CONSOLE', 'ERROR', { args: args.map(a => String(a)) });
        originalError.apply(console, args);
      };
    },

    createOverlay() {
      // Create toggle button
      const toggle = document.createElement('button');
      toggle.id = 'vr-log-toggle';
      toggle.innerHTML = '📋';
      toggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: rgba(0,0,0,0.8);
        border: 2px solid #00d4ff;
        border-radius: 50%;
        color: #00d4ff;
        font-size: 20px;
        cursor: pointer;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      toggle.onclick = () => this.toggleOverlay();
      document.body.appendChild(toggle);

      // Create overlay container
      const overlay = document.createElement('div');
      overlay.id = 'vr-log-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 60px;
        left: 20px;
        right: 20px;
        bottom: 90px;
        background: rgba(10,10,20,0.95);
        border: 2px solid #00d4ff;
        border-radius: 10px;
        z-index: 99999;
        display: none;
        flex-direction: column;
        font-family: 'Courier New', monospace;
        font-size: 12px;
      `;

      overlay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #00d4ff; background: rgba(0,212,255,0.1);">
          <span style="color: #00d4ff; font-weight: bold;">📋 VR Logs (Session: ${this.sessionId})</span>
          <div>
            <button onclick="VRLogger.exportLogs()" style="background: #22c55e; border: none; padding: 5px 10px; border-radius: 4px; color: white; cursor: pointer; margin-right: 5px;">Export</button>
            <button onclick="VRLogger.clearLogs()" style="background: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; color: white; cursor: pointer; margin-right: 5px;">Clear</button>
            <button onclick="VRLogger.toggleOverlay()" style="background: transparent; border: 1px solid #00d4ff; padding: 5px 10px; border-radius: 4px; color: #00d4ff; cursor: pointer;">Close</button>
          </div>
        </div>
        <div id="vr-log-content" style="flex: 1; overflow-y: auto; padding: 10px; color: #ccc;"></div>
        <div style="display: flex; gap: 10px; padding: 10px; border-top: 1px solid #00d4ff;">
          <input type="text" id="vr-log-filter" placeholder="Filter logs..." onkeyup="VRLogger.filterLogs(this.value)" style="flex: 1; background: rgba(255,255,255,0.1); border: 1px solid #00d4ff; border-radius: 4px; padding: 5px 10px; color: white;">
        </div>
      `;

      document.body.appendChild(overlay);
    },

    toggleOverlay() {
      const overlay = document.getElementById('vr-log-overlay');
      if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
      } else {
        overlay.style.display = 'flex';
        this.updateOverlay();
      }
    },

    updateOverlay() {
      const content = document.getElementById('vr-log-content');
      if (!content || document.getElementById('vr-log-overlay').style.display === 'none') return;

      const filter = document.getElementById('vr-log-filter')?.value || '';
      
      const filteredLogs = this.logs.filter(log => {
        if (!filter) return true;
        const searchText = `${log.category} ${log.message} ${JSON.stringify(log.data)}`.toLowerCase();
        return searchText.includes(filter.toLowerCase());
      });

      content.innerHTML = filteredLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const elapsed = log.elapsed;
        let color = '#ccc';
        if (log.category === 'ERROR') color = '#ef4444';
        if (log.category === 'WARN') color = '#eab308';
        if (log.category === 'NAV') color = '#22c55e';
        if (log.category === 'SYS') color = '#0ea5e9';

        return `
          <div style="margin-bottom: 5px; border-left: 3px solid ${color}; padding-left: 8px;">
            <span style="color: #666;">[${time} +${elapsed}ms]</span>
            <span style="color: ${color}; font-weight: bold;">${log.category}</span>: 
            ${log.message}
            ${log.data ? `<pre style="margin: 2px 0 0 20px; color: #888; font-size: 10px; white-space: pre-wrap;">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
          </div>
        `;
      }).join('');

      // Auto-scroll to bottom
      content.scrollTop = content.scrollHeight;
    },

    filterLogs(filter) {
      this.updateOverlay();
    },

    clearLogs() {
      this.logs = [];
      this.updateOverlay();
      this.log('VR', 'Logs cleared');
    },

    exportLogs() {
      const data = JSON.stringify({
        sessionId: this.sessionId,
        exportedAt: new Date().toISOString(),
        logs: this.logs
      }, null, 2);

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vr-logs-${this.sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.log('VR', 'Logs exported');
    },

    // Special logging methods
    logNavigation(from, to) {
      this.log('NAV', `Navigation: ${from} -> ${to}`, { from, to });
    },

    logMobileDetection(isMobile, details) {
      this.log('MOBILE', `Detection: ${isMobile ? 'MOBILE' : 'DESKTOP'}`, details);
    },

    logRedirect(from, to, reason) {
      this.log('REDIRECT', `Redirect: ${from} -> ${to}`, { reason });
    },

    logAFrame(event, data) {
      this.log('AFRAME', event, data);
    },

    logUserAction(action, data) {
      this.log('USER', action, data);
    }
  };

  // Expose globally
  window.VRLogger = VRLogger;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VRLogger.init());
  } else {
    VRLogger.init();
  }

  // Track clicks
  document.addEventListener('click', (e) => {
    VRLogger.logUserAction('click', {
      tag: e.target.tagName,
      id: e.target.id,
      class: e.target.className,
      text: e.target.textContent?.substring(0, 50)
    });
  });

  // Track key presses
  document.addEventListener('keydown', (e) => {
    VRLogger.logUserAction('keydown', {
      key: e.key,
      code: e.code,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey
    });
  });

})();
