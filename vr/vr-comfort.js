/**
 * VR Comfort Features
 * - Locomotion vignette: darkens screen edges during thumbstick movement
 * - F1 help overlay: shows controls cheat sheet for current input mode
 * 
 * Include in any zone: <script src="/vr/vr-comfort.js"></script>
 */
(function () {
  'use strict';

  // ===================== COMFORT VIGNETTE =====================
  // Reduces motion sickness by narrowing FOV during movement

  var vignetteEl = null;
  var vignetteActive = false;
  var vignetteOpacity = 0;
  var VIGNETTE_MAX = 0.55;
  var VIGNETTE_FADE_IN = 0.08;
  var VIGNETTE_FADE_OUT = 0.04;

  function createVignette() {
    if (vignetteEl) return;
    vignetteEl = document.createElement('div');
    vignetteEl.id = 'vr-comfort-vignette';
    vignetteEl.style.cssText = [
      'position: fixed', 'inset: 0', 'z-index: 9998', 'pointer-events: none',
      'opacity: 0', 'transition: none',
      'background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.9) 100%)'
    ].join(';');
    document.body.appendChild(vignetteEl);
  }

  function updateVignette(moving) {
    if (!vignetteEl) return;
    if (moving) {
      vignetteOpacity = Math.min(VIGNETTE_MAX, vignetteOpacity + VIGNETTE_FADE_IN);
    } else {
      vignetteOpacity = Math.max(0, vignetteOpacity - VIGNETTE_FADE_OUT);
    }
    vignetteEl.style.opacity = vignetteOpacity.toFixed(3);
  }

  // Poll gamepads for movement to drive vignette
  function vignetteLoop() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var moving = false;
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i];
      if (!p || !p.axes) continue;
      if (p.hand === 'left' && p.axes.length >= 2) {
        if (Math.abs(p.axes[0]) > 0.15 || Math.abs(p.axes[1]) > 0.15) moving = true;
      }
    }
    updateVignette(moving);
    requestAnimationFrame(vignetteLoop);
  }

  // Only activate vignette in VR mode
  function initVignette() {
    createVignette();
    var scene = document.querySelector('a-scene');
    if (!scene) return;
    scene.addEventListener('enter-vr', function () {
      vignetteActive = true;
      vignetteLoop();
    });
    scene.addEventListener('exit-vr', function () {
      vignetteActive = false;
      vignetteOpacity = 0;
      if (vignetteEl) vignetteEl.style.opacity = '0';
    });
  }

  // ===================== F1 HELP OVERLAY =====================

  var helpEl = null;
  var helpVisible = false;

  var HELP_HTML = [
    '<div style="max-width:420px;background:rgba(10,10,30,0.95);color:#e2e8f0;padding:24px 28px;border-radius:16px;border:1px solid rgba(0,212,255,0.3);font-family:\'Segoe UI\',system-ui,sans-serif;font-size:13px;line-height:1.6;backdrop-filter:blur(12px);">',
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">',
    '<span style="font-size:16px;font-weight:700;color:#00d4ff;">Controls</span>',
    '<span id="vr-help-close" style="cursor:pointer;color:#666;font-size:18px;">&times;</span>',
    '</div>',
    '<table style="width:100%;border-collapse:collapse;">',
    '<tr><td colspan="2" style="padding:6px 0 3px;color:#a855f7;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Quest Controllers</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Left Stick</td><td>Move</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Right Stick</td><td>Snap Turn</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Trigger</td><td>Select / Click</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Laser Pointer</td><td>Aim at objects</td></tr>',
    '<tr><td colspan="2" style="padding:10px 0 3px;color:#22c55e;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Keyboard &amp; Mouse</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">W A S D</td><td>Move</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Mouse Drag</td><td>Look Around</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Click</td><td>Select</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">M / Tab</td><td>Navigation Menu</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Esc</td><td>Close Panels</td></tr>',
    '<tr><td colspan="2" style="padding:10px 0 3px;color:#f59e0b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Gaze (No Controller)</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Look at object</td><td>Hover</td></tr>',
    '<tr><td style="color:#94a3b8;padding:2px 12px 2px 0;">Hold gaze 1.5s</td><td>Click</td></tr>',
    '</table>',
    '<div style="margin-top:12px;color:#555;font-size:11px;text-align:center;">Press <kbd style="background:#1e293b;padding:1px 6px;border-radius:3px;border:1px solid #334155;">F1</kbd> or <kbd style="background:#1e293b;padding:1px 6px;border-radius:3px;border:1px solid #334155;">?</kbd> to toggle</div>',
    '</div>'
  ].join('');

  function createHelp() {
    if (helpEl) return;
    helpEl = document.createElement('div');
    helpEl.id = 'vr-help-overlay';
    helpEl.style.cssText = [
      'position: fixed', 'top: 0', 'left: 0', 'right: 0', 'bottom: 0',
      'z-index: 10000', 'display: none', 'align-items: center', 'justify-content: center',
      'background: rgba(0,0,0,0.5)', 'backdrop-filter: blur(4px)'
    ].join(';');
    helpEl.innerHTML = HELP_HTML;
    document.body.appendChild(helpEl);

    // Close button
    helpEl.addEventListener('click', function (e) {
      if (e.target === helpEl || e.target.id === 'vr-help-close') toggleHelp();
    });
  }

  function toggleHelp() {
    if (!helpEl) createHelp();
    helpVisible = !helpVisible;
    helpEl.style.display = helpVisible ? 'flex' : 'none';
  }

  function initHelp() {
    createHelp();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'F1' || (e.key === '?' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        toggleHelp();
      }
      if (e.key === 'Escape' && helpVisible) {
        toggleHelp();
      }
    });
  }

  // ===================== INIT =====================
  function boot() {
    initVignette();
    initHelp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
