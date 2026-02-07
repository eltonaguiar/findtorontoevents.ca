/**
 * VR Polish, Productivity & Accessibility — Set 15
 *
 * 10 polish, productivity, and accessibility features:
 *
 *  1. Keyboard Map Overlay    — visual shortcut guide (? key)
 *  2. Color Blind Modes       — deuteranopia/protanopia/tritanopia SVG filters
 *  3. Focus Timer (Pomodoro)  — 25/5 work-break cycle with alerts
 *  4. Content Tagging         — universal tag system across all zones
 *  5. Multi-Tab Sync          — BroadcastChannel state sync
 *  6. QR Code Sharing         — generate QR for current view URL
 *  7. Command Palette         — Ctrl+Shift+P fuzzy command search
 *  8. Content History Graph   — canvas-rendered exploration pattern graph
 *  9. Auto-Save State         — periodic snapshots with restore points
 * 10. Haptic Feedback         — vibration patterns for controller events
 *
 * Load via <script src="/vr/polish-productivity.js"></script>
 */
(function () {
  'use strict';

  function detectZone() {
    var p = location.pathname;
    if (p.indexOf('/vr/events') !== -1) return 'events';
    if (p.indexOf('/vr/movies') !== -1) return 'movies';
    if (p.indexOf('/vr/creators') !== -1) return 'creators';
    if (p.indexOf('/vr/stocks') !== -1) return 'stocks';
    if (p.indexOf('/vr/wellness') !== -1) return 'wellness';
    if (p.indexOf('/vr/weather') !== -1) return 'weather';
    if (p.indexOf('/vr/tutorial') !== -1) return 'tutorial';
    return 'hub';
  }
  var zone = detectZone();

  function store(k, v) { try { localStorage.setItem('vr15_' + k, JSON.stringify(v)); } catch (e) {} }
  function load(k, d) { try { var v = localStorage.getItem('vr15_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function css(id, t) { if (document.getElementById(id)) return; var s = document.createElement('style'); s.id = id; s.textContent = t; document.head.appendChild(s); }
  function toast(m, c) {
    c = c || '#7dd3fc';
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9400;background:rgba(15,12,41,0.95);color:' + c + ';padding:10px 20px;border-radius:10px;font:600 13px/1.3 Inter,system-ui,sans-serif;border:1px solid ' + c + '33;backdrop-filter:blur(10px);pointer-events:none;animation:vr15t .3s ease-out';
    t.textContent = m; document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2500);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3000);
  }
  css('vr15-base', '@keyframes vr15t{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}');

  /* ═══════════════════════════════════════════════
     1. KEYBOARD MAP OVERLAY (? key)
     ═══════════════════════════════════════════════ */
  var keyboardMap = (function () {
    var shortcuts = [
      { key: 'N', desc: 'Open nav menu' },
      { key: 'G', desc: 'Area guide' },
      { key: 'K', desc: 'Cross-zone search' },
      { key: 'Z', desc: 'Zen/Focus mode' },
      { key: 'P', desc: 'Photo mode' },
      { key: 'V', desc: 'Voice commands' },
      { key: 'B', desc: 'Bookmarks' },
      { key: '?', desc: 'This help overlay' },
      { key: 'Ctrl+,', desc: 'Theme customizer' },
      { key: 'Ctrl+N', desc: 'Scratchpad' },
      { key: 'Ctrl+Shift+P', desc: 'Command palette' },
      { key: 'Esc', desc: 'Close any panel' },
      { key: 'F1', desc: 'Tutorial/Help' }
    ];

    function toggle() {
      var el = document.getElementById('vr15-keymap');
      if (el) { el.remove(); return; }
      css('vr15-km-css',
        '#vr15-keymap{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:700;background:rgba(15,12,41,0.97);border:1px solid rgba(0,212,255,0.25);border-radius:16px;padding:24px;width:min(380px,92vw);max-height:70vh;overflow-y:auto;color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)}' +
        '.vr15-km-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05)}' +
        '.vr15-km-key{background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:5px;padding:2px 10px;color:#7dd3fc;font:700 11px monospace;min-width:30px;text-align:center}'
      );
      el = document.createElement('div');
      el.id = 'vr15-keymap';
      el.setAttribute('role', 'dialog');
      var html = '<h3 style="margin:0 0 14px;color:#7dd3fc;font-size:16px">⌨️ Keyboard Shortcuts</h3>';
      shortcuts.forEach(function (s) {
        html += '<div class="vr15-km-row"><span>' + s.desc + '</span><span class="vr15-km-key">' + s.key + '</span></div>';
      });
      html += '<button onclick="document.getElementById(\'vr15-keymap\').remove()" style="margin-top:14px;width:100%;padding:7px;background:rgba(0,212,255,0.1);color:#7dd3fc;border:1px solid rgba(0,212,255,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif">Close</button>';
      el.innerHTML = html;
      document.body.appendChild(el);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === '?' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); toggle(); }
    });

    return { toggle: toggle, getShortcuts: function () { return shortcuts; } };
  })();

  /* ═══════════════════════════════════════════════
     2. COLOR BLIND MODES
     ═══════════════════════════════════════════════ */
  var colorBlind = (function () {
    var mode = load('colorblind', 'none');
    var filters = {
      none: '',
      deuteranopia: 'url(#vr15-deuteranopia)',
      protanopia: 'url(#vr15-protanopia)',
      tritanopia: 'url(#vr15-tritanopia)'
    };

    function injectSVG() {
      if (document.getElementById('vr15-cb-svg')) return;
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'vr15-cb-svg';
      svg.setAttribute('style', 'position:absolute;width:0;height:0');
      svg.innerHTML =
        '<defs>' +
        '<filter id="vr15-deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>' +
        '<filter id="vr15-protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>' +
        '<filter id="vr15-tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>' +
        '</defs>';
      document.body.appendChild(svg);
    }

    function apply(m) {
      mode = m || 'none';
      store('colorblind', mode);
      injectSVG();
      document.documentElement.style.filter = filters[mode] || '';
      document.body.setAttribute('data-cb-mode', mode);
      toast('Color mode: ' + (mode === 'none' ? 'Normal' : mode), '#a855f7');
    }

    function cycle() {
      var modes = Object.keys(filters);
      var idx = (modes.indexOf(mode) + 1) % modes.length;
      apply(modes[idx]);
    }

    if (mode !== 'none') { setTimeout(function () { apply(mode); }, 500); }
    return { apply: apply, cycle: cycle, getMode: function () { return mode; }, modes: Object.keys(filters) };
  })();

  /* ═══════════════════════════════════════════════
     3. FOCUS TIMER (POMODORO)
     ═══════════════════════════════════════════════ */
  var focusTimer = (function () {
    var state = { running: false, phase: 'idle', remaining: 0, workMin: 25, breakMin: 5, sessions: load('pomodoro_sessions', 0) };
    var intervalId = null;

    function createUI() {
      css('vr15-pomo-css',
        '#vr15-pomo{position:fixed;top:90px;right:10px;z-index:160;background:rgba(15,12,41,0.92);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:10px 14px;width:160px;color:#e2e8f0;font:12px/1.4 Inter,system-ui,sans-serif;backdrop-filter:blur(10px);text-align:center}' +
        '#vr15-pomo h4{margin:0 0 4px;color:#fca5a5;font-size:12px}' +
        '#vr15-pomo-time{font:700 24px monospace;color:#fca5a5;margin:6px 0}' +
        '#vr15-pomo-phase{color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px}' +
        '.vr15-pomo-btn{padding:4px 12px;border-radius:6px;border:1px solid rgba(239,68,68,0.2);background:rgba(239,68,68,0.06);color:#fca5a5;cursor:pointer;font:600 11px Inter,system-ui,sans-serif;margin:2px}'
      );
      var el = document.createElement('div');
      el.id = 'vr15-pomo';
      render(el);
      document.body.appendChild(el);
    }

    function render(container) {
      container = container || document.getElementById('vr15-pomo');
      if (!container) return;
      var m = Math.floor(state.remaining / 60);
      var s = state.remaining % 60;
      container.innerHTML = '<h4>🍅 Pomodoro</h4>' +
        '<div id="vr15-pomo-phase">' + state.phase + '</div>' +
        '<div id="vr15-pomo-time">' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '</div>' +
        '<div>' + (state.running
          ? '<button class="vr15-pomo-btn" onclick="VRPolish.focusTimer.stop()">⏸ Pause</button>'
          : '<button class="vr15-pomo-btn" onclick="VRPolish.focusTimer.startWork()">▶ Work</button><button class="vr15-pomo-btn" onclick="VRPolish.focusTimer.startBreak()">☕ Break</button>'
        ) + '</div>' +
        '<div style="color:#64748b;font-size:9px;margin-top:4px">Sessions: ' + state.sessions + '</div>';
    }

    function tick() {
      if (state.remaining <= 0) {
        state.running = false;
        clearInterval(intervalId);
        if (state.phase === 'work') { state.sessions++; store('pomodoro_sessions', state.sessions); toast('🍅 Work session complete! Take a break.', '#22c55e'); }
        else { toast('Break over! Ready for work.', '#fca5a5'); }
        state.phase = 'done';
        render();
        return;
      }
      state.remaining--;
      var m = Math.floor(state.remaining / 60);
      var s = state.remaining % 60;
      var timeEl = document.getElementById('vr15-pomo-time');
      if (timeEl) timeEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function startWork() {
      state.phase = 'work'; state.remaining = state.workMin * 60; state.running = true;
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, 1000);
      render();
    }

    function startBreak() {
      state.phase = 'break'; state.remaining = state.breakMin * 60; state.running = true;
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, 1000);
      render();
    }

    function stop() {
      state.running = false;
      if (intervalId) clearInterval(intervalId);
      render();
    }

    setTimeout(createUI, 2000);
    return { startWork: startWork, startBreak: startBreak, stop: stop, getState: function () { return Object.assign({}, state); } };
  })();

  /* ═══════════════════════════════════════════════
     4. CONTENT TAGGING SYSTEM
     ═══════════════════════════════════════════════ */
  var tagging = (function () {
    var tags = load('tags', {});

    function addTag(itemId, tag) {
      if (!tags[itemId]) tags[itemId] = [];
      tag = tag.toLowerCase().trim();
      if (tags[itemId].indexOf(tag) === -1) tags[itemId].push(tag);
      store('tags', tags);
      toast('Tagged: #' + tag, '#06b6d4');
    }

    function removeTag(itemId, tag) {
      if (!tags[itemId]) return;
      tags[itemId] = tags[itemId].filter(function (t) { return t !== tag.toLowerCase(); });
      if (tags[itemId].length === 0) delete tags[itemId];
      store('tags', tags);
    }

    function getTags(itemId) { return tags[itemId] || []; }

    function searchByTag(tag) {
      var results = [];
      Object.keys(tags).forEach(function (id) {
        if (tags[id].indexOf(tag.toLowerCase()) !== -1) results.push(id);
      });
      return results;
    }

    function getAllTags() {
      var all = {};
      Object.keys(tags).forEach(function (id) {
        tags[id].forEach(function (t) { all[t] = (all[t] || 0) + 1; });
      });
      return all;
    }

    return { add: addTag, remove: removeTag, get: getTags, search: searchByTag, getAll: getAllTags };
  })();

  /* ═══════════════════════════════════════════════
     5. MULTI-TAB SYNC
     ═══════════════════════════════════════════════ */
  var tabSync = (function () {
    var channel = null;
    var listeners = [];

    try { channel = new BroadcastChannel('vr-tab-sync'); } catch (e) {}

    function broadcast(type, data) {
      if (!channel) return;
      channel.postMessage({ type: type, data: data, zone: zone, time: Date.now() });
    }

    function onMessage(cb) {
      listeners.push(cb);
    }

    if (channel) {
      channel.onmessage = function (e) {
        listeners.forEach(function (cb) { try { cb(e.data); } catch (err) {} });
      };
    }

    // Auto-broadcast zone changes
    broadcast('zone_enter', { zone: zone });

    return { broadcast: broadcast, onMessage: onMessage, isSupported: function () { return !!channel; } };
  })();

  /* ═══════════════════════════════════════════════
     6. QR CODE SHARING
     ═══════════════════════════════════════════════ */
  var qrSharing = (function () {
    function generateQR(text, size) {
      size = size || 150;
      // Use a simple QR generation via Google Charts API (works offline-safe as fallback)
      return 'https://chart.googleapis.com/chart?cht=qr&chs=' + size + 'x' + size + '&chl=' + encodeURIComponent(text) + '&choe=UTF-8';
    }

    function showQR(url) {
      url = url || location.href;
      var existing = document.getElementById('vr15-qr');
      if (existing) { existing.remove(); return; }
      css('vr15-qr-css',
        '#vr15-qr{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:700;background:rgba(15,12,41,0.97);border:1px solid rgba(0,212,255,0.25);border-radius:16px;padding:24px;text-align:center;color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)}' +
        '#vr15-qr img{border-radius:8px;margin:10px 0;background:#fff;padding:8px}'
      );
      var el = document.createElement('div');
      el.id = 'vr15-qr';
      el.setAttribute('role', 'dialog');
      el.innerHTML = '<h3 style="margin:0 0 8px;color:#7dd3fc;font-size:16px">📱 Share via QR</h3>' +
        '<img src="' + generateQR(url) + '" alt="QR Code" width="150" height="150">' +
        '<div style="color:#94a3b8;font-size:10px;max-width:200px;word-break:break-all;margin:0 auto">' + url + '</div>' +
        '<button onclick="document.getElementById(\'vr15-qr\').remove()" style="margin-top:12px;padding:6px 20px;background:rgba(0,212,255,0.1);color:#7dd3fc;border:1px solid rgba(0,212,255,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif">Close</button>';
      document.body.appendChild(el);
    }

    return { show: showQR, generate: generateQR };
  })();

  /* ═══════════════════════════════════════════════
     7. COMMAND PALETTE (Ctrl+Shift+P)
     ═══════════════════════════════════════════════ */
  var commandPalette = (function () {
    var commands = [
      { name: 'Go to Hub', action: function () { location.href = '/vr/'; } },
      { name: 'Go to Events', action: function () { location.href = '/vr/events/'; } },
      { name: 'Go to Movies', action: function () { location.href = '/vr/movies.html'; } },
      { name: 'Go to Creators', action: function () { location.href = '/vr/creators.html'; } },
      { name: 'Go to Stocks', action: function () { location.href = '/vr/stocks-zone.html'; } },
      { name: 'Go to Weather', action: function () { location.href = '/vr/weather-zone.html'; } },
      { name: 'Go to Wellness', action: function () { location.href = '/vr/wellness/'; } },
      { name: 'Open Menu', action: function () { if (window.openNavMenu) window.openNavMenu(); } },
      { name: 'Toggle Zen Mode', action: function () { if (window.VRComfortIntel) window.VRComfortIntel.zenMode.toggle(); } },
      { name: 'Open Theme Customizer', action: function () { if (window.VRPersonalization) window.VRPersonalization.themeCustomizer.openPanel(); } },
      { name: 'Take Photo', action: function () { if (window.VRAdvancedUX) window.VRAdvancedUX.photoMode.capture(); } },
      { name: 'Export Data', action: function () { if (window.VRAdvancedUX) window.VRAdvancedUX.dataExport.export(); } },
      { name: 'Show QR Code', action: function () { qrSharing.show(); } },
      { name: 'Keyboard Shortcuts', action: function () { keyboardMap.toggle(); } },
      { name: 'Analytics Dashboard', action: function () { if (window.VRAdvancedUX) window.VRAdvancedUX.analytics.open(); } },
      { name: 'Cross-Zone Timeline', action: function () { if (window.VRContentDepth) window.VRContentDepth.crossTimeline.open(); } },
      { name: 'Comfort Settings', action: function () { if (window.VRComfortIntel) window.VRComfortIntel.comfortV2.open(); } },
      { name: 'Start Pomodoro Work', action: function () { focusTimer.startWork(); } },
      { name: 'Color Blind Mode: Cycle', action: function () { colorBlind.cycle(); } },
      { name: 'Scratchpad', action: function () { if (window.VRContentDepth) window.VRContentDepth.scratchpad.toggle(); } }
    ];

    function open() {
      var existing = document.getElementById('vr15-palette');
      if (existing) { existing.remove(); return; }
      css('vr15-pal-css',
        '#vr15-palette{position:fixed;top:20%;left:50%;transform:translateX(-50%);z-index:800;background:rgba(15,12,41,0.98);border:1px solid rgba(0,212,255,0.3);border-radius:14px;padding:12px;width:min(360px,90vw);color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(20px);box-shadow:0 8px 40px rgba(0,0,0,0.5)}' +
        '#vr15-pal-input{width:100%;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:8px;color:#e2e8f0;font:13px Inter,system-ui,sans-serif;outline:none;margin-bottom:8px}' +
        '#vr15-pal-input:focus{border-color:rgba(0,212,255,0.5)}' +
        '.vr15-pal-item{padding:6px 10px;border-radius:6px;cursor:pointer;transition:all .1s;font-size:12px}' +
        '.vr15-pal-item:hover{background:rgba(0,212,255,0.1);color:#fff}'
      );
      var el = document.createElement('div');
      el.id = 'vr15-palette';
      el.innerHTML = '<input id="vr15-pal-input" type="text" placeholder="Type a command..." autofocus><div id="vr15-pal-list"></div>';
      document.body.appendChild(el);
      renderList('');
      var input = document.getElementById('vr15-pal-input');
      input.addEventListener('input', function () { renderList(input.value); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') el.remove();
        if (e.key === 'Enter') {
          var first = document.querySelector('.vr15-pal-item');
          if (first) first.click();
        }
      });
      input.focus();
    }

    function renderList(query) {
      var list = document.getElementById('vr15-pal-list');
      if (!list) return;
      var q = query.toLowerCase();
      var filtered = commands.filter(function (c) { return c.name.toLowerCase().indexOf(q) !== -1; });
      list.innerHTML = filtered.slice(0, 10).map(function (c, i) {
        return '<div class="vr15-pal-item" data-idx="' + i + '">' + c.name + '</div>';
      }).join('');
      list.querySelectorAll('.vr15-pal-item').forEach(function (item, i) {
        item.addEventListener('click', function () {
          var el = document.getElementById('vr15-palette');
          if (el) el.remove();
          filtered[i].action();
        });
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') { e.preventDefault(); open(); }
    });

    return { open: open, getCommands: function () { return commands.map(function (c) { return c.name; }); } };
  })();

  /* ═══════════════════════════════════════════════
     8. CONTENT HISTORY GRAPH
     ═══════════════════════════════════════════════ */
  var historyGraph = (function () {
    function getData() {
      var sessions = [];
      try { sessions = JSON.parse(localStorage.getItem('vr12_sessions') || '[]'); } catch (e) {}
      var zones = ['hub', 'events', 'movies', 'creators', 'stocks', 'weather', 'wellness'];
      var data = {};
      zones.forEach(function (z) { data[z] = 0; });
      sessions.forEach(function (s) { if (data[s.zone] !== undefined) data[s.zone] += s.duration; });
      return data;
    }

    function openGraph() {
      var existing = document.getElementById('vr15-graph');
      if (existing) { existing.remove(); return; }
      css('vr15-graph-css',
        '#vr15-graph{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:600;background:rgba(15,12,41,0.97);border:1px solid rgba(0,212,255,0.25);border-radius:16px;padding:20px;color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)}'
      );
      var el = document.createElement('div');
      el.id = 'vr15-graph';
      el.setAttribute('role', 'dialog');
      el.innerHTML = '<h3 style="margin:0 0 10px;color:#7dd3fc;font-size:15px">📈 Exploration Graph</h3>' +
        '<canvas id="vr15-graph-canvas" width="340" height="200"></canvas>' +
        '<button onclick="document.getElementById(\'vr15-graph\').remove()" style="margin-top:10px;width:100%;padding:6px;background:rgba(0,212,255,0.1);color:#7dd3fc;border:1px solid rgba(0,212,255,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif">Close</button>';
      document.body.appendChild(el);
      drawGraph();
    }

    function drawGraph() {
      var canvas = document.getElementById('vr15-graph-canvas');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var data = getData();
      var zones = Object.keys(data);
      var max = Math.max.apply(null, Object.values(data).concat([1]));
      var colors = { hub: '#7dd3fc', events: '#ff6b6b', movies: '#4ecdc4', creators: '#a855f7', stocks: '#22c55e', weather: '#06b6d4', wellness: '#10b981' };
      var barW = 36;
      var gap = 10;
      var startX = 15;

      ctx.fillStyle = 'rgba(15,12,41,0.5)';
      ctx.fillRect(0, 0, 340, 200);

      zones.forEach(function (z, i) {
        var x = startX + i * (barW + gap);
        var h = Math.max(2, (data[z] / max) * 140);
        var y = 160 - h;
        // Bar
        ctx.fillStyle = colors[z] || '#64748b';
        ctx.fillRect(x, y, barW, h);
        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(z, x + barW / 2, 178);
        // Value
        ctx.fillStyle = colors[z] || '#64748b';
        ctx.font = '9px Inter,sans-serif';
        var valText = data[z] > 60 ? Math.round(data[z] / 60) + 'm' : data[z] + 's';
        ctx.fillText(valText, x + barW / 2, y - 4);
      });
    }

    return { open: openGraph, getData: getData };
  })();

  /* ═══════════════════════════════════════════════
     9. AUTO-SAVE STATE
     ═══════════════════════════════════════════════ */
  var autoSave = (function () {
    var snapshots = load('snapshots', []);
    var INTERVAL = 60000; // every 60 seconds

    function takeSnapshot() {
      var snap = {
        time: Date.now(),
        zone: zone,
        url: location.href,
        scrollY: window.scrollY,
        keys: Object.keys(localStorage).length
      };
      snapshots.push(snap);
      if (snapshots.length > 20) snapshots = snapshots.slice(-20);
      store('snapshots', snapshots);
    }

    function restore(idx) {
      var snap = snapshots[idx];
      if (!snap) return;
      if (snap.url !== location.href) { location.href = snap.url; }
      else { window.scrollTo(0, snap.scrollY); toast('Restored snapshot from ' + new Date(snap.time).toLocaleTimeString(), '#22c55e'); }
    }

    function getSnapshots() { return snapshots; }

    // Auto-save periodically
    setInterval(takeSnapshot, INTERVAL);
    // Save on first load
    setTimeout(takeSnapshot, 5000);

    return { save: takeSnapshot, restore: restore, getSnapshots: getSnapshots };
  })();

  /* ═══════════════════════════════════════════════
     10. HAPTIC FEEDBACK PATTERNS
     ═══════════════════════════════════════════════ */
  var haptics = (function () {
    var supported = typeof navigator !== 'undefined' && navigator.vibrate;
    var patterns = {
      click:    [10],
      success:  [30, 50, 30],
      error:    [100, 30, 100],
      navigate: [15, 30, 15],
      alert:    [50, 100, 50, 100, 50],
      gentle:   [5]
    };
    var enabled = load('haptics_enabled', true);

    function vibrate(pattern) {
      if (!enabled || !supported) return;
      var p = typeof pattern === 'string' ? (patterns[pattern] || patterns.click) : pattern;
      try { navigator.vibrate(p); } catch (e) {}
    }

    function toggle() {
      enabled = !enabled;
      store('haptics_enabled', enabled);
      toast('Haptics ' + (enabled ? 'ON' : 'OFF'), '#a855f7');
      if (enabled) vibrate('success');
    }

    // Auto-haptic on button clicks
    document.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) vibrate('click');
    });

    return { vibrate: vibrate, toggle: toggle, isEnabled: function () { return enabled; }, isSupported: function () { return !!supported; }, patterns: Object.keys(patterns) };
  })();

  /* ═══════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════ */
  window.VRPolish = {
    zone: zone,
    version: 15,
    keyboardMap: keyboardMap,
    colorBlind: colorBlind,
    focusTimer: focusTimer,
    tagging: tagging,
    tabSync: tabSync,
    qrSharing: qrSharing,
    commandPalette: commandPalette,
    historyGraph: historyGraph,
    autoSave: autoSave,
    haptics: haptics
  };

  console.log('[VR Polish] Set 15 loaded — ' + zone);
})();
