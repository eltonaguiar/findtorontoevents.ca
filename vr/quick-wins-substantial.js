/**
 * VR Movies - Substantial Quick Wins
 * 
 * Features:
 * - Auto-scroll mode (TikTok-style continuous playback)
 * - Swipe gestures for navigation (up/down to skip)
 * - Auto-advance when video ends
 * - Visual countdown timer
 * - Keyboard shortcuts (arrow keys)
 */

(function() {
  'use strict';

  // ===== AUTO-SCROLL STATE =====
  const AUTOSCROLL_CONFIG = {
    enabled: false,
    autoAdvanceDelay: 5000, // 5 seconds before auto-advancing
    countdownInterval: null,
    countdownStartTime: null,
    currentPlaylist: [],
    currentIndex: 0,
    isPlaying: false
  };

  // ===== DOM ELEMENTS =====
  let toggleBtn, indicators, countdownBar, countdownContainer;

  function initElements() {
    toggleBtn = document.getElementById('autoscroll-toggle');
    indicators = document.getElementById('autoscroll-indicators');
    countdownBar = document.getElementById('autoscroll-countdown-bar');
    countdownContainer = document.getElementById('autoscroll-countdown');
  }

  // ===== TOGGLE AUTO-SCROLL =====
  window.toggleAutoscroll = function() {
    AUTOSCROLL_CONFIG.enabled = !AUTOSCROLL_CONFIG.enabled;
    
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', AUTOSCROLL_CONFIG.enabled);
    }
    
    if (indicators) {
      indicators.classList.toggle('visible', AUTOSCROLL_CONFIG.enabled);
    }
    
    if (AUTOSCROLL_CONFIG.enabled) {
      enableAutoscroll();
    } else {
      disableAutoscroll();
    }
    
    showToast(AUTOSCROLL_CONFIG.enabled ? '🔁 Auto-scroll enabled' : '⏹️ Auto-scroll disabled');
    console.log('[Auto-scroll]', AUTOSCROLL_CONFIG.enabled ? 'Enabled' : 'Disabled');
  };

  function enableAutoscroll() {
    // Build playlist from all movies
    buildPlaylist();
    
    // Start with first video if not playing
    if (!AUTOSCROLL_CONFIG.isPlaying && AUTOSCROLL_CONFIG.currentPlaylist.length > 0) {
      playCurrent();
    }
    
    // Setup video end detection
    setupVideoEndDetection();
  }

  function disableAutoscroll() {
    stopCountdown();
    if (countdownContainer) {
      countdownContainer.classList.remove('active');
    }
  }

  // ===== BUILD PLAYLIST =====
  function buildPlaylist() {
    // Get all movies from the global scope (set by movies.html)
    let allMovies = [];
    
    // Try to get from window.allMovies first
    if (window.allMovies && Array.isArray(window.allMovies)) {
      allMovies = window.allMovies;
    } else {
      // Fallback: collect from DOM
      const movieElements = document.querySelectorAll('[data-movie-id]');
      movieElements.forEach(el => {
        const movieData = el.dataset.movieData;
        if (movieData) {
          try {
            allMovies.push(JSON.parse(movieData));
          } catch(e) {}
        }
      });
    }
    
    // Filter by current filter if set
    const currentFilter = window.currentFilter || 'all';
    if (currentFilter === 'all') {
      AUTOSCROLL_CONFIG.currentPlaylist = allMovies.filter(m => m.trailer_id);
    } else {
      AUTOSCROLL_CONFIG.currentPlaylist = allMovies.filter(m => 
        m.type === currentFilter && m.trailer_id
      );
    }
    
    console.log('[Auto-scroll] Playlist built:', AUTOSCROLL_CONFIG.currentPlaylist.length, 'videos');
  }

  // ===== PLAYBACK CONTROL =====
  function playCurrent() {
    const movie = AUTOSCROLL_CONFIG.currentPlaylist[AUTOSCROLL_CONFIG.currentIndex];
    if (!movie) return;
    
    AUTOSCROLL_CONFIG.isPlaying = true;
    
    // Use the global playTrailer function from movies.html
    if (typeof window.playTrailer === 'function') {
      window.playTrailer(movie);
    } else if (typeof window.playVRVideo === 'function') {
      window.playVRVideo(movie);
    }
    
    // Start countdown for auto-advance
    startCountdown();
  }

  window.autoscrollNext = function() {
    if (AUTOSCROLL_CONFIG.currentPlaylist.length === 0) return;
    
    // Move to next
    AUTOSCROLL_CONFIG.currentIndex++;
    
    // Loop if at end
    if (AUTOSCROLL_CONFIG.currentIndex >= AUTOSCROLL_CONFIG.currentPlaylist.length) {
      AUTOSCROLL_CONFIG.currentIndex = 0;
      showToast('🔁 Restarting playlist');
    }
    
    playCurrent();
    showToast(`▶️ Next: ${AUTOSCROLL_CONFIG.currentPlaylist[AUTOSCROLL_CONFIG.currentIndex].title}`);
  };

  window.autoscrollPrev = function() {
    if (AUTOSCROLL_CONFIG.currentPlaylist.length === 0) return;
    
    // Move to previous
    AUTOSCROLL_CONFIG.currentIndex--;
    
    // Loop if at beginning
    if (AUTOSCROLL_CONFIG.currentIndex < 0) {
      AUTOSCROLL_CONFIG.currentIndex = AUTOSCROLL_CONFIG.currentPlaylist.length - 1;
    }
    
    playCurrent();
    showToast(`◀️ Previous: ${AUTOSCROLL_CONFIG.currentPlaylist[AUTOSCROLL_CONFIG.currentIndex].title}`);
  };

  // ===== COUNTDOWN & AUTO-ADVANCE =====
  function startCountdown() {
    stopCountdown();
    
    if (!AUTOSCROLL_CONFIG.enabled) return;
    
    if (countdownContainer) {
      countdownContainer.classList.add('active');
    }
    
    AUTOSCROLL_CONFIG.countdownStartTime = Date.now();
    
    AUTOSCROLL_CONFIG.countdownInterval = setInterval(() => {
      const elapsed = Date.now() - AUTOSCROLL_CONFIG.countdownStartTime;
      const progress = Math.min((elapsed / AUTOSCROLL_CONFIG.autoAdvanceDelay) * 100, 100);
      
      if (countdownBar) {
        countdownBar.style.width = progress + '%';
      }
      
      if (elapsed >= AUTOSCROLL_CONFIG.autoAdvanceDelay) {
        // Time to advance!
        window.autoscrollNext();
      }
    }, 100);
  }

  function stopCountdown() {
    if (AUTOSCROLL_CONFIG.countdownInterval) {
      clearInterval(AUTOSCROLL_CONFIG.countdownInterval);
      AUTOSCROLL_CONFIG.countdownInterval = null;
    }
    
    if (countdownBar) {
      countdownBar.style.width = '0%';
    }
  }

  // ===== VIDEO END DETECTION =====
  function setupVideoEndDetection() {
    // Listen for YouTube player state changes
    // The YouTube IFrame API will call onPlayerStateChange when video ends
    
    // Override the existing onPlayerStateChange if it exists
    const originalOnPlayerStateChange = window.onPlayerStateChange;
    
    window.onPlayerStateChange = function(event) {
      // Call original first
      if (originalOnPlayerStateChange) {
        originalOnPlayerStateChange(event);
      }
      
      // YT.PlayerState.ENDED === 0
      if (event.data === 0 && AUTOSCROLL_CONFIG.enabled) {
        console.log('[Auto-scroll] Video ended, advancing...');
        setTimeout(() => {
          window.autoscrollNext();
        }, 1000); // 1 second pause between videos
      }
    };
    
    // Also detect when overlay is closed manually
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.id === 'yt-overlay' || mutation.target.id === 'vr-dom-overlay') {
          if (!mutation.target.classList.contains('active')) {
            // Overlay was closed
            AUTOSCROLL_CONFIG.isPlaying = false;
            stopCountdown();
          }
        }
      });
    });
    
    // Observe both overlays
    const ytOverlay = document.getElementById('yt-overlay');
    const vrOverlay = document.getElementById('vr-dom-overlay');
    
    if (ytOverlay) {
      observer.observe(ytOverlay, { attributes: true, attributeFilter: ['class'] });
    }
    if (vrOverlay) {
      observer.observe(vrOverlay, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // ===== SWIPE GESTURES =====
  let touchStartY = 0;
  let touchStartX = 0;

  function initSwipeGestures() {
    // Touch events for mobile
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Mouse wheel for desktop (scroll up/down)
    document.addEventListener('wheel', handleWheel, { passive: true });
  }

  function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (!AUTOSCROLL_CONFIG.enabled) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    
    const deltaY = touchStartY - touchEndY;
    const deltaX = touchStartX - touchEndX;
    
    // Vertical swipe (more vertical than horizontal)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // Swiped up - next video
        window.autoscrollNext();
      } else {
        // Swiped down - previous video
        window.autoscrollPrev();
      }
    }
  }

  function handleWheel(e) {
    if (!AUTOSCROLL_CONFIG.enabled) return;
    
    // Debounce wheel events
    if (window._wheelTimeout) return;
    
    window._wheelTimeout = setTimeout(() => {
      window._wheelTimeout = null;
    }, 500);
    
    if (e.deltaY > 50) {
      // Scrolled down - next video
      window.autoscrollNext();
    } else if (e.deltaY < -50) {
      // Scrolled up - previous video
      window.autoscrollPrev();
    }
  }

  // ===== KEYBOARD SHORTCUTS =====
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!AUTOSCROLL_CONFIG.enabled) return;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          window.autoscrollNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          window.autoscrollPrev();
          break;
        case ' ':
          // Space to toggle auto-scroll
          if (!e.target.matches('input, textarea, button')) {
            e.preventDefault();
            window.toggleAutoscroll();
          }
          break;
      }
    });
  }

  // ===== VR CONTROLLER GESTURES =====
  function initVRControllerGestures() {
    // Poll for controller input
    let lastRightThumbY = 0;
    let thumbstickThreshold = 0.7;
    let cooldown = false;
    
    function pollControllers() {
      if (!AUTOSCROLL_CONFIG.enabled) {
        requestAnimationFrame(pollControllers);
        return;
      }
      
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      
      for (let gp of gamepads) {
        if (!gp) continue;
        
        // Right controller thumbstick (index 3 is typically right thumbstick Y)
        if (gp.hand === 'right' && gp.axes.length >= 4) {
          const thumbY = gp.axes[3] || 0;
          
          if (!cooldown && Math.abs(thumbY) > thumbstickThreshold) {
            if (thumbY < -0.7) {
              // Thumbstick up - next video
              window.autoscrollNext();
            } else if (thumbY > 0.7) {
              // Thumbstick down - previous video
              window.autoscrollPrev();
            }
            
            cooldown = true;
            setTimeout(() => { cooldown = false; }, 500);
          }
          
          lastRightThumbY = thumbY;
        }
      }
      
      requestAnimationFrame(pollControllers);
    }
    
    requestAnimationFrame(pollControllers);
  }

  // ===== HELPER: Show Toast =====
  function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(10,10,20,0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(78,205,196,0.3);
        border-radius: 10px;
        color: #e2e8f0;
        font-size: 14px;
        padding: 12px 24px;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 99999;
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2000);
  }

  // ===== INITIALIZATION =====
  function init() {
    console.log('[Substantial Quick Wins] Initializing...');
    
    initElements();
    initSwipeGestures();
    initKeyboardShortcuts();
    initVRControllerGestures();
    
    console.log('[Substantial Quick Wins] Initialized!');
    console.log('Controls:');
    console.log('  - Click "Auto-Scroll" toggle to enable');
    console.log('  - Swipe up/Scroll down/Arrow down: Next video');
    console.log('  - Swipe down/Scroll up/Arrow up: Previous video');
    console.log('  - Space: Toggle auto-scroll');
    console.log('  - Right thumbstick up/down: Navigate in VR');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();