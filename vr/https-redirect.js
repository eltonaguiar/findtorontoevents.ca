/**
 * HTTPS Redirect Notice for VR pages
 * 
 * If the user accesses a VR page over plain HTTP, this script:
 *   1. Shows a friendly banner explaining they need HTTPS
 *   2. Auto-redirects to the HTTPS version after 4 seconds
 *   3. Provides a manual "Redirect Now" button
 * 
 * On HTTPS pages this script does nothing (zero overhead).
 */
(function () {
  if (location.protocol === 'https:') return; // already secure — nothing to do

  // Prevent the rest of the page from rendering (A-Frame, etc.)
  document.documentElement.style.overflow = 'hidden';

  // Build the HTTPS URL (keep path, query, hash)
  var secureUrl = 'https://' + location.host + location.pathname + location.search + location.hash;

  // --- Banner DOM ---
  var overlay = document.createElement('div');
  overlay.id = 'https-redirect-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
    'background:linear-gradient(135deg,#0f0f0f 0%,#1a0a2e 100%)',
    'color:#fff', 'font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
    'text-align:center', 'padding:2rem'
  ].join(';');

  overlay.innerHTML =
    '<div style="max-width:520px">' +
      '<div style="font-size:2.5rem;margin-bottom:0.5rem">&#x1F512;</div>' +
      '<h1 style="font-size:1.6rem;margin:0 0 0.75rem;' +
        'background:linear-gradient(90deg,#00d4ff,#a855f7);' +
        '-webkit-background-clip:text;-webkit-text-fill-color:transparent;' +
        'background-clip:text;color:transparent;">' +
        'Secure Connection Required</h1>' +
      '<p style="color:#cbd5e1;line-height:1.6;margin:0 0 1.25rem;font-size:1.05rem">' +
        'This VR experience requires a <strong style="color:#7dd3fc">secure HTTPS connection</strong> ' +
        'to work properly.<br>You\'re currently on an insecure HTTP link.</p>' +
      '<p style="color:#94a3b8;font-size:0.95rem;margin:0 0 1.5rem">' +
        'Redirecting you automatically in <span id="https-countdown" style="color:#00d4ff;font-weight:700">4</span> seconds&hellip;</p>' +
      '<a id="https-redirect-btn" href="' + secureUrl + '" style="' +
        'display:inline-block;padding:12px 32px;border-radius:2rem;' +
        'background:linear-gradient(135deg,#00d4ff,#a855f7);color:#fff;' +
        'font-weight:700;font-size:1rem;text-decoration:none;' +
        'box-shadow:0 4px 20px rgba(0,212,255,0.3);transition:transform 0.15s,box-shadow 0.15s' +
      '">Redirect Now &rarr;</a>' +
      '<p style="margin-top:1.5rem;font-size:0.8rem;color:#64748b">' +
        'Tip: Bookmark <strong style="color:#94a3b8">' + secureUrl.split('?')[0] + '</strong> to avoid this in the future.</p>' +
    '</div>';

  // Insert as first child of <body> (works even if called from <head>)
  function inject() {
    document.body.insertBefore(overlay, document.body.firstChild);

    // Countdown timer
    var remaining = 4;
    var countdownEl = document.getElementById('https-countdown');
    var timer = setInterval(function () {
      remaining--;
      if (countdownEl) countdownEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(timer);
        location.replace(secureUrl);
      }
    }, 1000);
  }

  // Ensure body exists before injecting
  if (document.body) {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
