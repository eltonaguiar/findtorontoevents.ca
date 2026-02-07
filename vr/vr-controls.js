/**
 * VR Controls — Shared Quest Controller Module
 *
 * Auto-enhances ANY VR zone with:
 *   1. Quest controller laser pointers (left + right)
 *   2. Hand tracking support (Quest 3)
 *   3. Thumbstick locomotion (left stick = move)
 *   4. Snap turning (right stick left/right)
 *   5. Teleportation arc (right stick forward, release to teleport)
 *   6. Gaze cursor fallback for headset-only use
 *   7. Rig height correction for VR mode
 *
 * Requires: A-Frame 1.6.0, camera rig with id="rig" or id="camera-rig"
 * Usage:   <script src="/vr/vr-controls.js"></script>
 * Zero dependencies beyond A-Frame core.
 */
(function () {
  'use strict';

  /* ═══════ CONFIG ═══════ */
  var CFG = {
    MOVE_SPEED:        3.0,     // m/s continuous movement
    SNAP_DEGREES:      45,      // degrees per snap turn
    SNAP_COOLDOWN:     350,     // ms between snap turns
    DEAD_ZONE:         0.15,    // thumbstick dead-zone radius
    TELEPORT_THRESH:   0.7,     // thumbstick push to start teleport
    TELEPORT_MAX:      15,      // max teleport distance (m)
    ARC_SEGMENTS:      20,      // dots in the teleport arc
    ARC_SPEED:         8,       // initial velocity of arc (m/s)
    ARC_GRAVITY:       9.8,     // gravity for arc
    LASER_FAR:         20,      // laser pointer reach (m)
    LASER_L:           '#00d4ff',
    LASER_R:           '#a855f7'
  };

  /* ═══════ SHARED STATE ═══════ */
  var leftStick  = { x: 0, y: 0 };
  var rightStick = { x: 0, y: 0 };
  var lastSnapTime     = 0;
  var teleportActive   = false;
  var teleportValid    = false;
  var teleportPos      = null;  // THREE.Vector3
  var arcEls           = [];
  var markerEl         = null;
  var rigDesktopY      = 1.6;
  var controllersAdded = false;

  /* ═══════ UTILITY ═══════ */
  function findRig() {
    return document.getElementById('rig') || document.getElementById('camera-rig');
  }

  /* ═══════════════════════════════════════════════
     1. VR-LOCOMOTION COMPONENT (scene-level tick)
     ═══════════════════════════════════════════════ */
  AFRAME.registerComponent('vr-locomotion', {
    init: function () {
      this._dir   = new THREE.Vector3();
      this._quat  = new THREE.Quaternion();
      this._v     = new THREE.Vector3();
      teleportPos = new THREE.Vector3();
    },

    tick: function (time, delta) {
      if (!this.el.is('vr-mode')) return;
      var rig = findRig();
      if (!rig) return;
      var dt = Math.min(delta / 1000, 0.1);

      /* ── Left stick: continuous movement ── */
      var lx = leftStick.x, ly = leftStick.y;
      if (Math.abs(lx) > CFG.DEAD_ZONE || Math.abs(ly) > CFG.DEAD_ZONE) {
        var cam = this.el.camera;
        if (cam) {
          cam.getWorldQuaternion(this._quat);
          this._dir.set(lx, 0, ly).applyQuaternion(this._quat);
          this._dir.y = 0;
          var len = this._dir.length();
          if (len > 0.01) {
            this._dir.divideScalar(len); // normalize
            var mag = Math.min(1, Math.max(Math.abs(lx), Math.abs(ly)));
            this._dir.multiplyScalar(CFG.MOVE_SPEED * dt * mag);
            rig.object3D.position.add(this._dir);
          }
        }
      }

      /* ── Right stick X: snap turn ── */
      var rx = rightStick.x;
      var ry = rightStick.y;
      // Only snap-turn when NOT teleporting
      if (ry > -CFG.TELEPORT_THRESH && Math.abs(rx) > 0.6 && (time - lastSnapTime) > CFG.SNAP_COOLDOWN) {
        var sign = rx > 0 ? -1 : 1;
        rig.object3D.rotation.y += sign * CFG.SNAP_DEGREES * (Math.PI / 180);
        lastSnapTime = time;
      }

      /* ── Right stick Y forward: teleport arc ── */
      if (ry < -CFG.TELEPORT_THRESH) {
        teleportActive = true;
        computeArc(this.el);
        showArc();
      } else if (teleportActive) {
        // Released — execute teleport
        if (teleportValid) executeTeleport(rig);
        hideArc();
        teleportActive = false;
      }
    }
  });

  /* ═══════════════════════════════════════════════
     2. TELEPORT ARC HELPERS
     ═══════════════════════════════════════════════ */
  var arcPoints = [];

  function computeArc(sceneEl) {
    var hand = document.getElementById('right-ctrl');
    if (!hand || !hand.object3D) { teleportValid = false; return; }

    var wp  = new THREE.Vector3();
    var wq  = new THREE.Quaternion();
    hand.object3D.getWorldPosition(wp);
    hand.object3D.getWorldQuaternion(wq);

    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(wq);
    var vel = dir.multiplyScalar(CFG.ARC_SPEED);
    var pos = wp.clone();
    var grav = new THREE.Vector3(0, -CFG.ARC_GRAVITY, 0);
    var step = 0.05;

    arcPoints = [];
    teleportValid = false;

    for (var i = 0; i < CFG.ARC_SEGMENTS; i++) {
      arcPoints.push(pos.clone());
      vel.add(grav.clone().multiplyScalar(step));
      pos.add(vel.clone().multiplyScalar(step));

      if (pos.y <= 0.05) {
        teleportPos.set(pos.x, 0.02, pos.z);
        var rig = findRig();
        if (rig) {
          var dist = rig.object3D.position.distanceTo(teleportPos);
          teleportValid = dist <= CFG.TELEPORT_MAX && dist > 0.3;
        }
        break;
      }
      if (pos.y > 25 || pos.y < -5) break;
    }
  }

  function showArc() {
    var col = teleportValid ? '#00ff88' : '#ff4444';
    for (var i = 0; i < arcEls.length; i++) {
      if (i < arcPoints.length) {
        var p = arcPoints[i];
        arcEls[i].object3D.position.set(p.x, p.y, p.z);
        arcEls[i].setAttribute('color', col);
        arcEls[i].object3D.visible = true;
      } else {
        arcEls[i].object3D.visible = false;
      }
    }
    if (markerEl) {
      if (teleportValid) {
        markerEl.object3D.position.set(teleportPos.x, teleportPos.y, teleportPos.z);
        markerEl.object3D.visible = true;
      } else {
        markerEl.object3D.visible = false;
      }
    }
  }

  function hideArc() {
    for (var i = 0; i < arcEls.length; i++) arcEls[i].object3D.visible = false;
    if (markerEl) markerEl.object3D.visible = false;
  }

  function executeTeleport(rig) {
    if (!teleportValid) return;
    var y = rig.object3D.position.y;
    rig.object3D.position.set(teleportPos.x, y, teleportPos.z);
  }

  function createArcVisuals(scene) {
    for (var i = 0; i < CFG.ARC_SEGMENTS; i++) {
      var dot = document.createElement('a-sphere');
      dot.setAttribute('radius', '0.025');
      dot.setAttribute('color', '#00ff88');
      dot.setAttribute('material', 'shader: flat; opacity: 0.7');
      dot.object3D.visible = false;
      scene.appendChild(dot);
      arcEls.push(dot);
    }

    markerEl = document.createElement('a-entity');
    markerEl.innerHTML =
      '<a-ring radius-inner="0.28" radius-outer="0.38" rotation="-90 0 0" color="#00ff88" material="shader:flat; opacity:0.85"></a-ring>' +
      '<a-ring radius-inner="0.04" radius-outer="0.09" rotation="-90 0 0" color="#fff" material="shader:flat; opacity:0.9"></a-ring>' +
      '<a-ring radius-inner="0.48" radius-outer="0.5" rotation="-90 0 0" color="#00ff88" material="shader:flat; opacity:0.35" ' +
        'animation="property:scale;from:0.8 0.8 0.8;to:1.2 1.2 1.2;dur:900;dir:alternate;loop:true;easing:easeInOutSine"></a-ring>';
    markerEl.object3D.visible = false;
    scene.appendChild(markerEl);
  }

  /* ═══════════════════════════════════════════════
     3. CONTROLLER SETUP
     ═══════════════════════════════════════════════ */
  function addControllers(scene) {
    if (controllersAdded) return;
    var rig = findRig();
    if (!rig) return;

    // --- Left controller ---
    var leftCtrl = document.createElement('a-entity');
    leftCtrl.id = 'left-ctrl';
    leftCtrl.setAttribute('hand-controls', 'hand: left; handModelStyle: lowPoly; color: #00d4ff');
    leftCtrl.setAttribute('raycaster', 'objects: .clickable; showLine: true; far: ' + CFG.LASER_FAR +
      '; lineColor: ' + CFG.LASER_L + '; lineOpacity: 0.5');

    // --- Right controller ---
    var rightCtrl = document.createElement('a-entity');
    rightCtrl.id = 'right-ctrl';
    rightCtrl.setAttribute('hand-controls', 'hand: right; handModelStyle: lowPoly; color: #a855f7');
    rightCtrl.setAttribute('raycaster', 'objects: .clickable; showLine: true; far: ' + CFG.LASER_FAR +
      '; lineColor: ' + CFG.LASER_R + '; lineOpacity: 0.5');

    // --- Hand tracking (Quest 3 pinch gestures) ---
    var leftHT = document.createElement('a-entity');
    leftHT.id = 'left-hand-track';
    leftHT.setAttribute('hand-tracking-controls', 'hand: left; modelColor: #00d4ff; modelOpacity: 0.5');

    var rightHT = document.createElement('a-entity');
    rightHT.id = 'right-hand-track';
    rightHT.setAttribute('hand-tracking-controls', 'hand: right; modelColor: #a855f7; modelOpacity: 0.5');

    // Wire up events
    wireController(leftCtrl, 'left');
    wireController(rightCtrl, 'right');

    rig.appendChild(leftCtrl);
    rig.appendChild(rightCtrl);
    rig.appendChild(leftHT);
    rig.appendChild(rightHT);

    controllersAdded = true;
    console.log('[VR Controls] Controllers + hand tracking added');
  }

  function wireController(el, hand) {
    var stick = (hand === 'left') ? leftStick : rightStick;

    // Thumbstick events from hand-controls → oculus-touch-controls
    el.addEventListener('thumbstickmoved', function (evt) {
      stick.x = evt.detail.x;
      stick.y = evt.detail.y;
    });

    // Reset on controller disconnect
    el.addEventListener('controllerconnected', function () {
      console.log('[VR Controls] ' + hand + ' controller connected');
    });
    el.addEventListener('controllerdisconnected', function () {
      stick.x = 0;
      stick.y = 0;
    });

    // Trigger → click on intersected entity
    el.addEventListener('triggerdown', function () {
      var rc = el.components.raycaster;
      if (rc && rc.intersectedEls.length > 0) {
        rc.intersectedEls[0].emit('click', null, false);
      }
    });

    // Hover events
    el.addEventListener('raycaster-intersection', function (evt) {
      var els = evt.detail.els;
      if (els && els.length > 0) els[0].emit('mouseenter', null, false);
    });
    el.addEventListener('raycaster-intersection-cleared', function (evt) {
      var cls = evt.detail.clearedEls;
      if (cls && cls.length > 0) cls[0].emit('mouseleave', null, false);
    });

    // Grip button → could be used for grab later
    el.addEventListener('gripdown', function () {
      // Reserved for future grab mechanics
    });
  }

  /* ═══════════════════════════════════════════════
     4. RIG HEIGHT CORRECTION
     ═══════════════════════════════════════════════ */
  function setupHeightCorrection(scene) {
    var rig = findRig();
    if (!rig) return;

    scene.addEventListener('enter-vr', function () {
      rigDesktopY = rig.object3D.position.y;
      rig.object3D.position.y = 0; // XR headset provides real height
    });
    scene.addEventListener('exit-vr', function () {
      rig.object3D.position.y = rigDesktopY;
    });
  }

  /* ═══════════════════════════════════════════════
     5. GAZE CURSOR MANAGEMENT
     ═══════════════════════════════════════════════ */
  function setupGazeCursorToggle(scene) {
    scene.addEventListener('enter-vr', function () {
      // Dim gaze cursor — controllers take over
      var gaze = scene.querySelector('a-cursor[fuse="true"]');
      if (gaze) gaze.setAttribute('material', 'opacity', '0.25');
    });
    scene.addEventListener('exit-vr', function () {
      var gaze = scene.querySelector('a-cursor[fuse="true"]');
      if (gaze) gaze.setAttribute('material', 'opacity', '0.7');
    });
  }

  /* ═══════════════════════════════════════════════
     6. GAMEPAD POLLING FALLBACK
     If thumbstickmoved events don't fire (some browsers),
     poll the Gamepad API directly.
     ═══════════════════════════════════════════════ */
  function setupGamepadFallback(scene) {
    var hadEvents = false;

    // If we get a thumbstickmoved event, skip polling
    scene.addEventListener('thumbstickmoved', function () { hadEvents = true; }, true);

    // After 3 seconds, if no events seen, start polling
    setTimeout(function () {
      if (hadEvents) return;

      console.log('[VR Controls] No thumbstick events — using gamepad polling');
      var pollInterval = setInterval(function () {
        if (!scene.is('vr-mode')) return;
        var gps = navigator.getGamepads ? navigator.getGamepads() : [];
        for (var i = 0; i < gps.length; i++) {
          var gp = gps[i];
          if (!gp || !gp.connected || !gp.axes) continue;
          // Use hand property or index
          if (gp.hand === 'left' || (!gp.hand && i === 0 && gp.axes.length >= 2)) {
            leftStick.x = gp.axes[0] || 0;
            leftStick.y = gp.axes[1] || 0;
          }
          if (gp.hand === 'right' || (!gp.hand && i === 1 && gp.axes.length >= 2)) {
            rightStick.x = gp.axes[0] || 0;
            rightStick.y = gp.axes[1] || 0;
          }
        }
      }, 16); // ~60fps

      scene.addEventListener('exit-vr', function () { clearInterval(pollInterval); });
    }, 3000);
  }

  /* ═══════════════════════════════════════════════
     7. INITIALIZATION
     ═══════════════════════════════════════════════ */
  function bootstrap() {
    var scene = document.querySelector('a-scene');
    if (!scene) {
      var t = setInterval(function () {
        scene = document.querySelector('a-scene');
        if (scene) { clearInterval(t); onScene(scene); }
      }, 200);
      setTimeout(function () { clearInterval(t); }, 15000);
      return;
    }
    onScene(scene);
  }

  function onScene(scene) {
    function go() {
      // Skip if components already registered by another instance
      if (scene.hasAttribute('vr-locomotion')) return;

      scene.setAttribute('vr-locomotion', '');
      addControllers(scene);
      createArcVisuals(scene);
      setupHeightCorrection(scene);
      setupGazeCursorToggle(scene);
      setupGamepadFallback(scene);

      console.log('[VR Controls] Ready — Controllers, locomotion, teleport, snap turn');
    }

    if (scene.hasLoaded) go();
    else scene.addEventListener('loaded', go);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
