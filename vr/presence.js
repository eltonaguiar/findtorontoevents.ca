/**
 * VR Hub — Lightweight Online Presence Tracker
 *
 * Shows approximate # of users online in the VR hub.
 * Uses two layers:
 *   1. BroadcastChannel (real-time across tabs on same device)
 *   2. localStorage heartbeats (persists across page reloads)
 *
 * Each VR page includes this script. It adds a small "X users online" badge
 * and a keyboard shortcuts help panel to every page.
 *
 * For true multi-user presence you'd need a WebSocket server (Phase 9+).
 */
(function () {
  'use strict';

  // ── Config ──
  var HEARTBEAT_KEY = 'vr_presence_heartbeats';
  var SESSION_KEY   = 'vr_session_id';
  var STALE_MS      = 60000; // sessions older than 60s are considered gone
  var HEARTBEAT_INTERVAL = 15000; // send heartbeat every 15s
  var ZONE_KEY      = 'vr_current_zone';

  // ── Session ID (unique per tab) ──
  var sessionId = 'vr_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();

  // ── Determine current zone from URL ──
  function getCurrentZone() {
    var path = window.location.pathname;
    if (path.indexOf('/vr/events') !== -1)  return 'Events';
    if (path.indexOf('/vr/movies') !== -1)  return 'Movies';
    if (path.indexOf('/vr/weather') !== -1) return 'Weather';
    if (path.indexOf('/vr/wellness') !== -1) return 'Wellness';
    if (path.indexOf('/vr/creators') !== -1) return 'Creators';
    if (path.indexOf('/vr/stocks') !== -1)  return 'Stocks';
    return 'Hub';
  }

  // ── Heartbeat: write to localStorage ──
  function sendHeartbeat() {
    try {
      var raw = localStorage.getItem(HEARTBEAT_KEY);
      var hb = raw ? JSON.parse(raw) : {};
      hb[sessionId] = { ts: Date.now(), zone: getCurrentZone() };
      // Clean stale entries
      var now = Date.now();
      Object.keys(hb).forEach(function (k) {
        if (now - hb[k].ts > STALE_MS) delete hb[k];
      });
      localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(hb));
    } catch (_) {}
  }

  // ── Count active sessions ──
  function getPresence() {
    try {
      var raw = localStorage.getItem(HEARTBEAT_KEY);
      if (!raw) return { total: 1, zones: {} };
      var hb = JSON.parse(raw);
      var now = Date.now();
      var total = 0;
      var zones = {};
      Object.keys(hb).forEach(function (k) {
        if (now - hb[k].ts <= STALE_MS) {
          total++;
          var z = hb[k].zone || 'Hub';
          zones[z] = (zones[z] || 0) + 1;
        }
      });
      return { total: Math.max(1, total), zones: zones };
    } catch (_) {
      return { total: 1, zones: {} };
    }
  }

  // ── BroadcastChannel for instant cross-tab updates ──
  var bc = null;
  try {
    bc = new BroadcastChannel('vr_presence');
    bc.onmessage = function () { updateBadge(); };
  } catch (_) {}

  function broadcastPing() {
    if (bc) try { bc.postMessage({ type: 'ping', id: sessionId }); } catch (_) {}
  }

  // ── Cleanup on unload ──
  window.addEventListener('beforeunload', function () {
    try {
      var raw = localStorage.getItem(HEARTBEAT_KEY);
      if (raw) {
        var hb = JSON.parse(raw);
        delete hb[sessionId];
        localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(hb));
      }
    } catch (_) {}
  });

  // ── Create the UI badge ──
  function createBadge() {
    var badge = document.createElement('div');
    badge.id = 'vr-presence-badge';
    badge.style.cssText = 'position:fixed;bottom:50px;right:16px;z-index:200;background:rgba(10,10,26,0.9);backdrop-filter:blur(10px);border:1px solid rgba(0,212,255,0.3);border-radius:10px;padding:10px 14px;color:#ccc;font-family:system-ui,sans-serif;font-size:12px;display:flex;flex-direction:column;gap:4px;min-width:140px;';
    badge.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block;animation:pulse-dot 2s ease infinite;"></span>' +
        '<span id="presence-count" style="color:#00d4ff;font-weight:600;">1 user online</span>' +
      '</div>' +
      '<div id="presence-zones" style="font-size:11px;color:#666;"></div>';

    // Add pulse animation
    var style = document.createElement('style');
    style.textContent = '@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}';
    document.head.appendChild(style);

    document.body.appendChild(badge);
  }

  // ── Create keyboard shortcuts panel ──
  function createShortcutsPanel() {
    var panel = document.createElement('div');
    panel.id = 'vr-shortcuts-panel';
    panel.style.cssText = 'position:fixed;bottom:50px;right:170px;z-index:200;background:rgba(10,10,26,0.9);backdrop-filter:blur(10px);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:10px 14px;color:#ccc;font-family:system-ui,sans-serif;font-size:11px;display:none;min-width:180px;';

    var shortcuts = [
      ['W / ↑',    'Move forward'],
      ['S / ↓',    'Move backward'],
      ['A / ←',    'Strafe left'],
      ['D / →',    'Strafe right'],
      ['Mouse',    'Look around'],
      ['Click',    'Interact'],
      ['Escape',   'Back / Close'],
      ['?',        'Toggle this help'],
    ];

    var html = '<div style="color:#a855f7;font-weight:600;margin-bottom:6px;">⌨️ Keyboard Shortcuts</div>';
    shortcuts.forEach(function (s) {
      html += '<div style="display:flex;justify-content:space-between;gap:12px;padding:2px 0;">' +
        '<kbd style="background:rgba(255,255,255,0.08);padding:1px 6px;border-radius:3px;color:#fff;font-size:10px;font-family:monospace;">' + s[0] + '</kbd>' +
        '<span style="color:#888;">' + s[1] + '</span></div>';
    });
    panel.innerHTML = html;
    document.body.appendChild(panel);

    // Toggle button
    var toggleBtn = document.createElement('button');
    toggleBtn.textContent = '?';
    toggleBtn.title = 'Keyboard shortcuts';
    toggleBtn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:200;width:32px;height:32px;border-radius:50%;background:rgba(168,85,247,0.3);color:#a855f7;border:1px solid rgba(168,85,247,0.5);cursor:pointer;font-size:16px;font-weight:bold;';
    toggleBtn.onclick = function () {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
    document.body.appendChild(toggleBtn);

    // ? key toggles
    document.addEventListener('keydown', function (e) {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // ── Update the badge ──
  function updateBadge() {
    var p = getPresence();
    var countEl = document.getElementById('presence-count');
    var zonesEl = document.getElementById('presence-zones');
    if (!countEl) return;

    var label = p.total === 1 ? '1 user online' : p.total + ' users online';
    countEl.textContent = label;

    // Show zone breakdown
    var parts = [];
    Object.keys(p.zones).forEach(function (z) {
      if (p.zones[z] > 0) parts.push(p.zones[z] + ' in ' + z);
    });
    zonesEl.textContent = parts.join(' · ');
  }

  // ── Initialize ──
  function init() {
    createBadge();
    createShortcutsPanel();
    sendHeartbeat();
    broadcastPing();
    updateBadge();

    setInterval(function () {
      sendHeartbeat();
      broadcastPing();
      updateBadge();
    }, HEARTBEAT_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
