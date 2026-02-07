/**
 * VR Comfort, Accessibility & Intelligence — Set 13
 *
 * 10 comfort, accessibility, and intelligence features:
 *
 *  1. Multi-Language i18n      — EN/FR/ES selector for UI labels
 *  2. Focus/Zen Mode           — hide all overlays (Z key)
 *  3. Smart Recommendations    — "You might like" based on usage
 *  4. Custom Hotkeys           — user-rebindable keyboard shortcuts
 *  5. Zone Transition FX       — fade/wipe when navigating zones
 *  6. Daily Challenge          — gamified daily exploration tasks
 *  7. Comfort Settings V2      — FOV vignette, motion reduction, UI scale
 *  8. Content Bookmarks        — bookmark with tags and search
 *  9. Session Replay           — timeline of actions during session
 * 10. Particle Density Control — slider for all particle systems
 *
 * Load via <script src="/vr/comfort-intelligence.js"></script>
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

  function store(k, v) { try { localStorage.setItem('vr13_' + k, JSON.stringify(v)); } catch (e) {} }
  function load(k, d) { try { var v = localStorage.getItem('vr13_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function css(id, t) { if (document.getElementById(id)) return; var s = document.createElement('style'); s.id = id; s.textContent = t; document.head.appendChild(s); }
  function toast(m, c) {
    c = c || '#7dd3fc';
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9200;background:rgba(15,12,41,0.95);color:' + c + ';padding:10px 20px;border-radius:10px;font:600 13px/1.3 Inter,system-ui,sans-serif;border:1px solid ' + c + '33;backdrop-filter:blur(10px);pointer-events:none;animation:vr13t .3s ease-out';
    t.textContent = m; document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2500);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3000);
  }
  css('vr13-base', '@keyframes vr13t{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}');

  /* ═══════════════════════════════════════════════
     1. MULTI-LANGUAGE i18n (EN/FR/ES)
     ═══════════════════════════════════════════════ */
  var i18n = (function () {
    var lang = load('lang', 'en');
    var strings = {
      en: { menu: 'Menu', hub: 'Hub', events: 'Events', movies: 'Movies', creators: 'Creators', stocks: 'Stocks', weather: 'Weather', wellness: 'Wellness', tutorial: 'Tutorial', settings: 'Settings', close: 'Close', search: 'Search', favorites: 'Favorites', theme: 'Theme', notifications: 'Notifications', export_data: 'Export Data', photo: 'Photo', voice: 'Voice', zen: 'Zen Mode', challenge: 'Daily Challenge', bookmarks: 'Bookmarks', language: 'Language' },
      fr: { menu: 'Menu', hub: 'Accueil', events: 'Événements', movies: 'Films', creators: 'Créateurs', stocks: 'Bourse', weather: 'Météo', wellness: 'Bien-être', tutorial: 'Tutoriel', settings: 'Paramètres', close: 'Fermer', search: 'Rechercher', favorites: 'Favoris', theme: 'Thème', notifications: 'Notifications', export_data: 'Exporter', photo: 'Photo', voice: 'Voix', zen: 'Mode Zen', challenge: 'Défi du jour', bookmarks: 'Signets', language: 'Langue' },
      es: { menu: 'Menú', hub: 'Inicio', events: 'Eventos', movies: 'Películas', creators: 'Creadores', stocks: 'Bolsa', weather: 'Clima', wellness: 'Bienestar', tutorial: 'Tutorial', settings: 'Ajustes', close: 'Cerrar', search: 'Buscar', favorites: 'Favoritos', theme: 'Tema', notifications: 'Notificaciones', export_data: 'Exportar', photo: 'Foto', voice: 'Voz', zen: 'Modo Zen', challenge: 'Desafío diario', bookmarks: 'Marcadores', language: 'Idioma' }
    };

    function t(key) { return (strings[lang] && strings[lang][key]) || (strings.en[key]) || key; }

    function setLang(l) {
      if (!strings[l]) return;
      lang = l;
      store('lang', l);
      document.documentElement.setAttribute('lang', l);
      window.dispatchEvent(new CustomEvent('vr-lang-change', { detail: { lang: l } }));
      toast(t('language') + ': ' + l.toUpperCase(), '#a855f7');
    }

    function createSelector() {
      css('vr13-lang-css',
        '#vr13-lang{position:fixed;top:8px;right:140px;z-index:200;display:flex;gap:2px;background:rgba(15,12,41,0.9);border:1px solid rgba(168,85,247,0.2);border-radius:8px;padding:3px;backdrop-filter:blur(10px)}' +
        '.vr13-lang-btn{padding:3px 8px;border:none;border-radius:5px;background:transparent;color:#94a3b8;cursor:pointer;font:700 10px Inter,system-ui,sans-serif;transition:all .15s}' +
        '.vr13-lang-btn.active{background:rgba(168,85,247,0.2);color:#c4b5fd}'
      );
      var el = document.createElement('div');
      el.id = 'vr13-lang';
      ['en', 'fr', 'es'].forEach(function (l) {
        var btn = document.createElement('button');
        btn.className = 'vr13-lang-btn' + (l === lang ? ' active' : '');
        btn.textContent = l.toUpperCase();
        btn.onclick = function () {
          setLang(l);
          el.querySelectorAll('.vr13-lang-btn').forEach(function (b) { b.classList.toggle('active', b.textContent === l.toUpperCase()); });
        };
        el.appendChild(btn);
      });
      document.body.appendChild(el);
    }

    document.documentElement.setAttribute('lang', lang);
    setTimeout(createSelector, 1200);
    return { t: t, setLang: setLang, getLang: function () { return lang; }, strings: strings };
  })();

  /* ═══════════════════════════════════════════════
     2. FOCUS / ZEN MODE (Z key)
     ═══════════════════════════════════════════════ */
  var zenMode = (function () {
    var active = false;
    var hiddenEls = [];
    var OVERLAY_SELECTORS = [
      '#vr-nav-overlay', '#vr-area-guide', '#vr11-notif-bell', '#vr11-notif-panel',
      '#vr11-pin-badge', '#vr11-pin-panel', '#vr12-minimap', '#vr12-photo-btn',
      '#vr12-voice', '#vr12-countdown', '#vr12-autoplay', '#vr12-spotlight',
      '#vr11-playlists', '#vr11-notes-badge', '#vr11-city-sel', '#vr11-creator-history',
      '#vr11-portfolio', '#vr11-quick-launch', '#vr13-lang', '#vr13-challenge',
      '#vr13-bookmarks-btn', '[id^="vr7-"]', '[id^="vr9-"]', '[id^="vr5-"]',
      '.vr-nav-open-btn'
    ];

    function toggle() {
      active = !active;
      if (active) {
        hiddenEls = [];
        OVERLAY_SELECTORS.forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (el) {
            if (el.style.display !== 'none') {
              hiddenEls.push({ el: el, prev: el.style.display });
              el.style.display = 'none';
            }
          });
        });
        css('vr13-zen-active', '#vr13-zen-badge{display:block!important}');
        toast(i18n.t('zen') + ' ON', '#10b981');
      } else {
        hiddenEls.forEach(function (h) { h.el.style.display = h.prev || ''; });
        hiddenEls = [];
        var s = document.getElementById('vr13-zen-active');
        if (s) s.remove();
        toast(i18n.t('zen') + ' OFF', '#64748b');
      }
      updateBadge();
    }

    function createBadge() {
      css('vr13-zen-css',
        '#vr13-zen-badge{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:9300;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:4px 12px;color:#6ee7b7;font:600 11px Inter,system-ui,sans-serif;cursor:pointer;display:none;backdrop-filter:blur(10px)}'
      );
      var badge = document.createElement('div');
      badge.id = 'vr13-zen-badge';
      badge.textContent = 'ZEN — press Z to exit';
      badge.addEventListener('click', toggle);
      document.body.appendChild(badge);
    }

    function updateBadge() {
      var b = document.getElementById('vr13-zen-badge');
      if (b) b.style.display = active ? 'block' : 'none';
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'z' && !e.ctrlKey && !e.altKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') toggle();
    });

    setTimeout(createBadge, 1500);
    return { toggle: toggle, isActive: function () { return active; } };
  })();

  /* ═══════════════════════════════════════════════
     3. SMART RECOMMENDATIONS
     ═══════════════════════════════════════════════ */
  var recommendations = (function () {
    function getUsageProfile() {
      var sessions = [];
      try { sessions = JSON.parse(localStorage.getItem('vr12_sessions') || '[]'); } catch (e) {}
      var zoneTime = {};
      sessions.forEach(function (s) { zoneTime[s.zone] = (zoneTime[s.zone] || 0) + s.duration; });
      return zoneTime;
    }

    var zoneRelated = {
      events:  ['movies', 'creators', 'weather'],
      movies:  ['events', 'wellness', 'creators'],
      creators:['movies', 'events', 'stocks'],
      stocks:  ['weather', 'events', 'creators'],
      weather: ['events', 'wellness', 'stocks'],
      wellness:['weather', 'movies', 'creators'],
      hub:     ['events', 'movies', 'creators'],
      tutorial:['hub', 'events', 'movies']
    };

    function getRecommendations() {
      var usage = getUsageProfile();
      var related = zoneRelated[zone] || ['events', 'movies'];
      // Sort by least-visited related zones
      var recs = related.map(function (z) {
        return { zone: z, time: usage[z] || 0, reason: (usage[z] || 0) === 0 ? 'Not yet explored!' : 'Related to ' + zone };
      }).sort(function (a, b) { return a.time - b.time; });
      return recs.slice(0, 3);
    }

    function createWidget() {
      css('vr13-rec-css',
        '#vr13-recs{position:fixed;top:50px;right:10px;z-index:155;background:rgba(15,12,41,0.9);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:10px 14px;width:180px;color:#e2e8f0;font:11px/1.4 Inter,system-ui,sans-serif;backdrop-filter:blur(10px)}' +
        '#vr13-recs h4{margin:0 0 6px;color:#22d3ee;font-size:12px}' +
        '.vr13-rec-item{padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:color .15s}' +
        '.vr13-rec-item:hover{color:#fff}' +
        '.vr13-rec-reason{color:#64748b;font-size:9px}'
      );
      var el = document.createElement('div');
      el.id = 'vr13-recs';
      var recs = getRecommendations();
      var urls = { events: '/vr/events/', movies: '/vr/movies.html', creators: '/vr/creators.html', stocks: '/vr/stocks-zone.html', weather: '/vr/weather-zone.html', wellness: '/vr/wellness/', hub: '/vr/', tutorial: '/vr/tutorial/' };
      var html = '<h4>💡 You might like</h4>';
      recs.forEach(function (r) {
        html += '<div class="vr13-rec-item" onclick="location.href=\'' + (urls[r.zone] || '/vr/') + '\'"><strong style="text-transform:capitalize">' + r.zone + '</strong><div class="vr13-rec-reason">' + r.reason + '</div></div>';
      });
      el.innerHTML = html;
      document.body.appendChild(el);
    }

    setTimeout(createWidget, 2500);
    return { get: getRecommendations };
  })();

  /* ═══════════════════════════════════════════════
     4. CUSTOM HOTKEYS
     ═══════════════════════════════════════════════ */
  var customHotkeys = (function () {
    var defaults = { menu: 'n', search: 'k', guide: 'g', photo: 'p', voice: 'v', zen: 'z', theme: ',', bookmarks: 'b' };
    var bindings = load('hotkeys', defaults);

    function rebind(action, key) {
      if (!defaults[action]) return;
      bindings[action] = key.toLowerCase();
      store('hotkeys', bindings);
      toast('Rebound ' + action + ' → ' + key.toUpperCase(), '#f59e0b');
    }

    function getBinding(action) { return bindings[action] || defaults[action]; }
    function getAll() { return Object.assign({}, bindings); }

    function openEditor() {
      var existing = document.getElementById('vr13-hotkeys');
      if (existing) { existing.remove(); return; }
      css('vr13-hk-css',
        '#vr13-hotkeys{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:600;background:rgba(15,12,41,0.97);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:24px;width:min(320px,90vw);color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)}' +
        '#vr13-hotkeys h3{margin:0 0 12px;color:#f59e0b;font-size:16px}' +
        '.vr13-hk-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px}' +
        '.vr13-hk-key{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:4px;padding:2px 8px;color:#fbbf24;font:700 11px monospace;cursor:pointer;min-width:24px;text-align:center}'
      );
      var el = document.createElement('div');
      el.id = 'vr13-hotkeys';
      el.setAttribute('role', 'dialog');
      var html = '<h3>⌨️ Custom Hotkeys</h3>';
      Object.keys(bindings).forEach(function (action) {
        html += '<div class="vr13-hk-row"><span style="text-transform:capitalize">' + action + '</span><span class="vr13-hk-key" data-action="' + action + '" title="Click to rebind">' + bindings[action].toUpperCase() + '</span></div>';
      });
      html += '<div style="margin-top:10px;display:flex;gap:6px"><button onclick="document.getElementById(\'vr13-hotkeys\').remove()" style="flex:1;padding:6px;background:rgba(245,158,11,0.1);color:#fbbf24;border:1px solid rgba(245,158,11,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif">' + i18n.t('close') + '</button><button onclick="VRComfortIntel.customHotkeys.reset()" style="flex:1;padding:6px;background:rgba(100,116,139,0.1);color:#94a3b8;border:1px solid rgba(100,116,139,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif">Reset</button></div>';
      el.innerHTML = html;
      document.body.appendChild(el);
      // Click-to-rebind
      el.querySelectorAll('.vr13-hk-key').forEach(function (keyEl) {
        keyEl.addEventListener('click', function () {
          keyEl.textContent = '...';
          keyEl.style.color = '#fff';
          function handler(e) {
            e.preventDefault();
            rebind(keyEl.dataset.action, e.key);
            keyEl.textContent = e.key.toUpperCase();
            keyEl.style.color = '#fbbf24';
            document.removeEventListener('keydown', handler);
          }
          document.addEventListener('keydown', handler);
        });
      });
    }

    function reset() {
      bindings = Object.assign({}, defaults);
      store('hotkeys', bindings);
      toast('Hotkeys reset to defaults', '#64748b');
      var existing = document.getElementById('vr13-hotkeys');
      if (existing) { existing.remove(); openEditor(); }
    }

    return { get: getBinding, getAll: getAll, rebind: rebind, openEditor: openEditor, reset: reset };
  })();

  /* ═══════════════════════════════════════════════
     5. ZONE TRANSITION EFFECTS
     ═══════════════════════════════════════════════ */
  var transitions = (function () {
    var type = load('transition', 'fade'); // fade, wipe, zoom

    function apply(targetUrl) {
      css('vr13-trans-css',
        '#vr13-transition{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none}' +
        '.vr13-fade{background:#000;animation:vr13fadeIn .4s ease-out forwards}' +
        '.vr13-wipe{background:linear-gradient(90deg,#000 50%,transparent 50%);animation:vr13wipe .5s ease-in-out forwards}' +
        '.vr13-zoom{background:radial-gradient(circle,transparent 0%,#000 70%);animation:vr13zoomIn .4s ease-out forwards}' +
        '@keyframes vr13fadeIn{from{opacity:0}to{opacity:1}}' +
        '@keyframes vr13wipe{from{transform:translateX(-100%)}to{transform:translateX(0)}}' +
        '@keyframes vr13zoomIn{from{opacity:0;transform:scale(2)}to{opacity:1;transform:scale(1)}}'
      );
      var overlay = document.createElement('div');
      overlay.id = 'vr13-transition';
      overlay.className = 'vr13-' + type;
      document.body.appendChild(overlay);
      setTimeout(function () { location.href = targetUrl; }, type === 'wipe' ? 500 : 400);
    }

    function setType(t) {
      if (['fade', 'wipe', 'zoom'].indexOf(t) === -1) return;
      type = t;
      store('transition', t);
      toast('Transition: ' + t, '#7dd3fc');
    }

    // Intercept zone navigation links
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="/vr/"]');
      if (a && a.href && a.href.indexOf('/vr/') !== -1 && a.href !== location.href) {
        e.preventDefault();
        apply(a.href);
      }
    });

    return { apply: apply, setType: setType, getType: function () { return type; } };
  })();

  /* ═══════════════════════════════════════════════
     6. DAILY CHALLENGE SYSTEM
     ═══════════════════════════════════════════════ */
  var dailyChallenge = (function () {
    var today = new Date().toISOString().slice(0, 10);
    var state = load('challenge_' + today, null);

    var challenges = [
      { id: 'visit3', desc: 'Visit 3 different zones', check: function (s) { return (s.zonesVisited || []).length >= 3; } },
      { id: 'spend5', desc: 'Spend 5 minutes in any zone', check: function (s) { return (s.timeSpent || 0) >= 300; } },
      { id: 'use_search', desc: 'Use the search feature', check: function (s) { return !!s.usedSearch; } },
      { id: 'pin_item', desc: 'Pin an item to your pinboard', check: function (s) { return !!s.pinnedItem; } },
      { id: 'switch_theme', desc: 'Try a different theme', check: function (s) { return !!s.switchedTheme; } },
      { id: 'take_photo', desc: 'Take a VR photo', check: function (s) { return !!s.tookPhoto; } },
      { id: 'zen_mode', desc: 'Enter Zen mode', check: function (s) { return !!s.usedZen; } }
    ];

    // Pick today's challenge deterministically from date
    var dayIdx = parseInt(today.replace(/-/g, '')) % challenges.length;
    var todayChallenge = challenges[dayIdx];

    if (!state) {
      state = { id: todayChallenge.id, completed: false, progress: {}, date: today };
      store('challenge_' + today, state);
    }

    function createBadge() {
      css('vr13-ch-css',
        '#vr13-challenge{position:fixed;top:8px;right:210px;z-index:200;background:rgba(15,12,41,0.9);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:5px 10px;color:#fbbf24;font:600 11px Inter,system-ui,sans-serif;cursor:pointer;transition:all .2s;backdrop-filter:blur(10px)}' +
        '#vr13-challenge:hover{border-color:rgba(245,158,11,0.4);color:#fff}' +
        '#vr13-challenge.done{border-color:rgba(34,197,94,0.3);color:#86efac}'
      );
      var el = document.createElement('div');
      el.id = 'vr13-challenge';
      el.innerHTML = (state.completed ? '✅ ' : '🎯 ') + todayChallenge.desc;
      if (state.completed) el.classList.add('done');
      el.title = i18n.t('challenge');
      document.body.appendChild(el);
    }

    function markProgress(key, value) {
      state.progress[key] = value;
      if (todayChallenge.check(state.progress) && !state.completed) {
        state.completed = true;
        store('challenge_' + today, state);
        toast('🎯 Daily Challenge Complete!', '#22c55e');
        var badge = document.getElementById('vr13-challenge');
        if (badge) { badge.innerHTML = '✅ ' + todayChallenge.desc; badge.classList.add('done'); }
      }
      store('challenge_' + today, state);
    }

    // Auto-track zone visits
    var visited = load('today_zones_' + today, []);
    if (visited.indexOf(zone) === -1) { visited.push(zone); store('today_zones_' + today, visited); }
    markProgress('zonesVisited', visited);

    setTimeout(createBadge, 1200);
    return { getChallenge: function () { return todayChallenge; }, getState: function () { return state; }, markProgress: markProgress };
  })();

  /* ═══════════════════════════════════════════════
     7. COMFORT SETTINGS V2
     ═══════════════════════════════════════════════ */
  var comfortV2 = (function () {
    var prefs = load('comfort', { vignette: false, motionReduce: false, uiScale: 1.0 });

    function applyPrefs() {
      // FOV Vignette
      var vig = document.getElementById('vr13-vignette');
      if (prefs.vignette && !vig) {
        css('vr13-vig-css', '#vr13-vignette{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40;background:radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,0.5) 100%)}');
        var v = document.createElement('div'); v.id = 'vr13-vignette'; document.body.appendChild(v);
      } else if (!prefs.vignette && vig) { vig.remove(); }

      // Motion reduction
      if (prefs.motionReduce) {
        css('vr13-motion', '*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }');
      } else {
        var ms = document.getElementById('vr13-motion'); if (ms) ms.remove();
      }

      // UI Scale
      document.documentElement.style.setProperty('--vr-ui-scale', String(prefs.uiScale));
      css('vr13-scale', '[id^="vr11-"],[id^="vr12-"],[id^="vr13-"],[id^="vr7-"],[id^="vr9-"]{transform-origin:top left;scale:var(--vr-ui-scale,1)}');
    }

    function openPanel() {
      var existing = document.getElementById('vr13-comfort');
      if (existing) { existing.remove(); return; }
      css('vr13-cf-css',
        '#vr13-comfort{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:600;background:rgba(15,12,41,0.97);border:1px solid rgba(16,185,129,0.25);border-radius:16px;padding:24px;width:min(300px,90vw);color:#e2e8f0;font:13px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)}' +
        '#vr13-comfort h3{margin:0 0 14px;color:#6ee7b7;font-size:16px}' +
        '.vr13-cf-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)}' +
        '.vr13-cf-toggle{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;transition:all .2s;position:relative}' +
        '.vr13-cf-toggle.on{background:#10b981}.vr13-cf-toggle.off{background:#374151}'
      );
      var el = document.createElement('div');
      el.id = 'vr13-comfort';
      el.setAttribute('role', 'dialog');
      el.innerHTML = '<h3>🛋️ Comfort Settings</h3>' +
        '<div class="vr13-cf-row"><span>FOV Vignette</span><button class="vr13-cf-toggle ' + (prefs.vignette ? 'on' : 'off') + '" onclick="VRComfortIntel.comfortV2.set(\'vignette\',' + !prefs.vignette + ')">' + (prefs.vignette ? 'ON' : 'OFF') + '</button></div>' +
        '<div class="vr13-cf-row"><span>Reduce Motion</span><button class="vr13-cf-toggle ' + (prefs.motionReduce ? 'on' : 'off') + '" onclick="VRComfortIntel.comfortV2.set(\'motionReduce\',' + !prefs.motionReduce + ')">' + (prefs.motionReduce ? 'ON' : 'OFF') + '</button></div>' +
        '<div class="vr13-cf-row"><span>UI Scale (' + prefs.uiScale.toFixed(1) + '×)</span><input type="range" min="0.7" max="1.5" step="0.1" value="' + prefs.uiScale + '" oninput="VRComfortIntel.comfortV2.set(\'uiScale\',parseFloat(this.value))" style="width:100px"></div>' +
        '<button onclick="document.getElementById(\'vr13-comfort\').remove()" style="margin-top:12px;width:100%;padding:6px;background:rgba(16,185,129,0.1);color:#6ee7b7;border:1px solid rgba(16,185,129,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif">' + i18n.t('close') + '</button>';
      document.body.appendChild(el);
    }

    function set(key, value) {
      prefs[key] = value;
      store('comfort', prefs);
      applyPrefs();
      // Re-render panel if open
      var panel = document.getElementById('vr13-comfort');
      if (panel) { panel.remove(); openPanel(); }
    }

    applyPrefs();
    return { open: openPanel, set: set, getPrefs: function () { return Object.assign({}, prefs); } };
  })();

  /* ═══════════════════════════════════════════════
     8. CONTENT BOOKMARKS (with tags + search)
     ═══════════════════════════════════════════════ */
  var bookmarks = (function () {
    var items = load('bookmarks', []);

    function add(title, url, tags) {
      var id = 'bk_' + Date.now();
      if (items.some(function (b) { return b.title === title && b.url === url; })) { toast('Already bookmarked', '#64748b'); return; }
      items.unshift({ id: id, title: title, url: url || location.href, zone: zone, tags: tags || [], time: Date.now() });
      if (items.length > 50) items = items.slice(0, 50);
      store('bookmarks', items);
      updateBadge();
      toast('Bookmarked: ' + title, '#f59e0b');
    }

    function remove(id) {
      items = items.filter(function (b) { return b.id !== id; });
      store('bookmarks', items);
      updateBadge();
    }

    function search(query) {
      var q = query.toLowerCase();
      return items.filter(function (b) {
        return b.title.toLowerCase().indexOf(q) !== -1 || b.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1; }) || b.zone.indexOf(q) !== -1;
      });
    }

    function createBadge() {
      css('vr13-bk-css',
        '#vr13-bookmarks-btn{position:fixed;top:8px;left:180px;z-index:200;background:rgba(15,12,41,0.9);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:5px 10px;color:#f59e0b;font:600 12px Inter,system-ui,sans-serif;cursor:pointer;transition:all .2s;backdrop-filter:blur(10px)}' +
        '#vr13-bookmarks-btn:hover{border-color:rgba(245,158,11,0.4);color:#fff}' +
        '#vr13-bookmarks-panel{position:fixed;top:42px;left:180px;z-index:200;background:rgba(15,12,41,0.97);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:12px;width:260px;max-height:320px;overflow-y:auto;color:#e2e8f0;font:12px/1.4 Inter,system-ui,sans-serif;backdrop-filter:blur(16px);display:none}' +
        '#vr13-bookmarks-panel.open{display:block}' +
        '.vr13-bk-item{padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11px;display:flex;justify-content:space-between;align-items:center}' +
        '.vr13-bk-tags{color:#64748b;font-size:9px}'
      );
      var btn = document.createElement('div');
      btn.id = 'vr13-bookmarks-btn';
      btn.innerHTML = '🔖 ' + items.length;
      btn.addEventListener('click', togglePanel);
      document.body.appendChild(btn);
    }

    function updateBadge() {
      var b = document.getElementById('vr13-bookmarks-btn');
      if (b) b.innerHTML = '🔖 ' + items.length;
    }

    function togglePanel() {
      var p = document.getElementById('vr13-bookmarks-panel');
      if (p) { p.classList.toggle('open'); return; }
      p = document.createElement('div');
      p.id = 'vr13-bookmarks-panel';
      p.classList.add('open');
      renderPanel(p);
      document.body.appendChild(p);
    }

    function renderPanel(container) {
      container = container || document.getElementById('vr13-bookmarks-panel');
      if (!container) return;
      var html = '<div style="font-weight:700;color:#f59e0b;margin-bottom:8px;font-size:13px">🔖 ' + i18n.t('bookmarks') + ' (' + items.length + ')</div>';
      html += '<input type="text" placeholder="Search bookmarks..." oninput="VRComfortIntel.bookmarks.filterUI(this.value)" style="width:100%;padding:4px 8px;margin-bottom:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e2e8f0;font:11px Inter,system-ui,sans-serif;outline:none">';
      html += '<div id="vr13-bk-list">';
      items.slice(0, 15).forEach(function (b) {
        html += '<div class="vr13-bk-item"><div><a href="' + b.url + '" style="color:#7dd3fc;text-decoration:none">' + b.title + '</a><div class="vr13-bk-tags">' + b.zone + (b.tags.length ? ' · ' + b.tags.join(', ') : '') + '</div></div><button onclick="VRComfortIntel.bookmarks.remove(\'' + b.id + '\')" style="background:none;border:none;color:#ef4444;cursor:pointer;opacity:0.5;font-size:11px">✕</button></div>';
      });
      html += '</div>';
      container.innerHTML = html;
    }

    function filterUI(query) {
      var list = document.getElementById('vr13-bk-list');
      if (!list) return;
      var results = query ? search(query) : items.slice(0, 15);
      var html = '';
      results.forEach(function (b) {
        html += '<div class="vr13-bk-item"><div><a href="' + b.url + '" style="color:#7dd3fc;text-decoration:none">' + b.title + '</a><div class="vr13-bk-tags">' + b.zone + '</div></div></div>';
      });
      if (results.length === 0) html = '<div style="color:#64748b;font-size:11px">No matches</div>';
      list.innerHTML = html;
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'b' && !e.ctrlKey && !e.altKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') togglePanel();
    });

    setTimeout(createBadge, 1200);
    return { add: add, remove: remove, search: search, getAll: function () { return items; }, toggle: togglePanel, filterUI: filterUI };
  })();

  /* ═══════════════════════════════════════════════
     9. SESSION REPLAY (action timeline)
     ═══════════════════════════════════════════════ */
  var sessionReplay = (function () {
    var actions = [];
    var startTime = Date.now();

    function log(action, detail) {
      actions.push({ action: action, detail: detail || '', time: Date.now(), elapsed: Math.round((Date.now() - startTime) / 1000) });
      if (actions.length > 200) actions = actions.slice(-200);
    }

    // Auto-log key events
    document.addEventListener('click', function (e) {
      var tag = e.target.tagName;
      var text = (e.target.textContent || '').substring(0, 30).trim();
      log('click', tag + (text ? ': ' + text : ''));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key.length === 1 || ['Enter', 'Escape', 'Tab'].indexOf(e.key) !== -1) {
        log('keypress', e.key);
      }
    });

    // Zone entry
    log('zone_enter', zone);

    function openTimeline() {
      var existing = document.getElementById('vr13-replay');
      if (existing) { existing.remove(); return; }
      css('vr13-rp-css',
        '#vr13-replay{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:600;background:rgba(15,12,41,0.97);border:1px solid rgba(0,212,255,0.25);border-radius:16px;padding:20px;width:min(380px,92vw);max-height:60vh;overflow-y:auto;color:#e2e8f0;font:12px/1.5 Inter,system-ui,sans-serif;backdrop-filter:blur(16px)}' +
        '.vr13-rp-item{display:flex;gap:10px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:11px}' +
        '.vr13-rp-time{color:#64748b;min-width:36px;font-family:monospace}'
      );
      var el = document.createElement('div');
      el.id = 'vr13-replay';
      el.setAttribute('role', 'dialog');
      var html = '<h3 style="margin:0 0 10px;color:#7dd3fc;font-size:15px">🔁 Session Replay</h3>';
      html += '<div style="color:#64748b;font-size:11px;margin-bottom:8px">' + actions.length + ' actions · ' + Math.round((Date.now() - startTime) / 1000) + 's elapsed</div>';
      actions.slice(-30).reverse().forEach(function (a) {
        var m = Math.floor(a.elapsed / 60);
        var s = a.elapsed % 60;
        html += '<div class="vr13-rp-item"><span class="vr13-rp-time">' + m + ':' + String(s).padStart(2, '0') + '</span><span><strong>' + a.action + '</strong> ' + a.detail + '</span></div>';
      });
      html += '<button onclick="document.getElementById(\'vr13-replay\').remove()" style="margin-top:10px;width:100%;padding:6px;background:rgba(0,212,255,0.1);color:#7dd3fc;border:1px solid rgba(0,212,255,0.2);border-radius:8px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif">' + i18n.t('close') + '</button>';
      el.innerHTML = html;
      document.body.appendChild(el);
    }

    return { log: log, getActions: function () { return actions; }, open: openTimeline };
  })();

  /* ═══════════════════════════════════════════════
     10. PARTICLE DENSITY CONTROL
     ═══════════════════════════════════════════════ */
  var particleDensity = (function () {
    var density = load('particle_density', 1.0); // 0.0 to 2.0

    function setDensity(val) {
      density = Math.max(0, Math.min(2, parseFloat(val) || 1));
      store('particle_density', density);
      applyDensity();
      toast('Particles: ' + Math.round(density * 100) + '%', '#06b6d4');
    }

    function applyDensity() {
      // Toggle visibility of particle elements based on density
      var particles = document.querySelectorAll('.vr12-rain, .vr12-snow, [id^="vr8-particle"], a-sphere[class*="mote"], a-sphere[class*="particle"]');
      particles.forEach(function (p, i) {
        if (density === 0) { p.style.display = 'none'; return; }
        // Show/hide based on density threshold
        p.style.display = (i % Math.ceil(1 / density)) === 0 ? '' : 'none';
        // Scale opacity
        if (p.style.display !== 'none') {
          var currentOpacity = parseFloat(p.style.opacity) || 1;
          p.style.opacity = String(Math.min(1, currentOpacity * density));
        }
      });
      // Also fire event for custom particle systems
      window.dispatchEvent(new CustomEvent('vr-particle-density', { detail: { density: density } }));
    }

    function createSlider() {
      css('vr13-pd-css',
        '#vr13-particles{position:fixed;bottom:50px;right:10px;z-index:170;background:rgba(15,12,41,0.9);border:1px solid rgba(6,182,212,0.2);border-radius:10px;padding:6px 12px;color:#67e8f9;font:600 11px Inter,system-ui,sans-serif;backdrop-filter:blur(10px);display:flex;align-items:center;gap:6px}' +
        '#vr13-pd-slider{width:60px;accent-color:#06b6d4}'
      );
      var el = document.createElement('div');
      el.id = 'vr13-particles';
      el.innerHTML = '✨ <input type="range" id="vr13-pd-slider" min="0" max="2" step="0.1" value="' + density + '" oninput="VRComfortIntel.particleDensity.set(this.value)"><span id="vr13-pd-val">' + Math.round(density * 100) + '%</span>';
      document.body.appendChild(el);
    }

    setTimeout(function () { createSlider(); applyDensity(); }, 2000);
    return { set: setDensity, get: function () { return density; } };
  })();

  /* ═══════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════ */
  window.VRComfortIntel = {
    zone: zone,
    version: 13,
    i18n: i18n,
    zenMode: zenMode,
    recommendations: recommendations,
    customHotkeys: customHotkeys,
    transitions: transitions,
    dailyChallenge: dailyChallenge,
    comfortV2: comfortV2,
    bookmarks: bookmarks,
    sessionReplay: sessionReplay,
    particleDensity: particleDensity
  };

  console.log('[VR Comfort & Intelligence] Set 13 loaded — ' + zone + ' (lang: ' + i18n.getLang() + ')');
})();
