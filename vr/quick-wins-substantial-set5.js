/**
 * VR Substantial Quick Wins - Set 5: Social & Advanced Features
 * 
 * 10 Additional Major Features:
 * 1. Friend System (add friends, see online status)
 * 2. Emote System (quick emotes: wave, dance, etc.)
 * 3. Hand Menu (wrist-mounted radial menu)
 * 4. Screenshot Gallery (view saved screenshots)
 * 5. Zone Ratings (rate and review zones)
 * 6. Daily Challenges (daily tasks to complete)
 * 7. Leaderboards (compare stats with others)
 * 8. VR Keyboard Shortcuts (visual shortcut helper)
 * 9. Comfort Turning (incremental snap/smooth options)
 * 10. Session Analytics (detailed VR usage insights)
 */

(function() {
  'use strict';

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    friends: {
      maxFriends: 50,
      statusUpdateInterval: 30000
    },
    emotes: {
      cooldown: 2000,
      animations: true
    },
    challenges: {
      dailyReset: '00:00',
      maxActive: 3
    },
    leaderboard: {
      categories: ['distance', 'time', 'achievements', 'interactions'],
      topCount: 10
    }
  };

  // ==================== STATE ====================
  const state = {
    friends: JSON.parse(localStorage.getItem('vr-friends') || '[]'),
    emoteCooldown: false,
    handMenuOpen: false,
    screenshots: JSON.parse(localStorage.getItem('vr-screenshots') || '[]'),
    zoneRatings: JSON.parse(localStorage.getItem('vr-zone-ratings') || '{}'),
    dailyChallenges: JSON.parse(localStorage.getItem('vr-daily-challenges') || '[]'),
    lastChallengeDate: localStorage.getItem('vr-last-challenge-date'),
    sessionData: {
      startTime: Date.now(),
      actions: [],
      zonesVisited: [],
      objectsInteracted: []
    }
  };

  // ==================== 1. FRIEND SYSTEM ====================
  const FriendSystem = {
    init() {
      this.createUI();
      this.startStatusUpdates();
      console.log('[VR Friends] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-friends-btn';
      btn.innerHTML = '👥';
      btn.title = 'Friends (F)';
      btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 500px;
        background: rgba(236, 72, 153, 0.5);
        border: 2px solid #ec4899;
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      btn.addEventListener('click', () => this.showFriends());
      document.body.appendChild(btn);

      // Friend count badge
      const badge = document.createElement('span');
      badge.id = 'vr-friends-badge';
      badge.style.cssText = `
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        font-size: 10px;
        padding: 2px 5px;
        border-radius: 10px;
        display: ${this.getOnlineCount() > 0 ? 'block' : 'none'};
      `;
      badge.textContent = this.getOnlineCount();
      btn.appendChild(badge);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F') {
          this.showFriends();
        }
      });
    },

    getOnlineCount() {
      return state.friends.filter(f => f.status === 'online').length;
    },

    showFriends() {
      let panel = document.getElementById('vr-friends-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-friends-panel';
        panel.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #ec4899;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 350px;
          max-height: 70vh;
          overflow-y: auto;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(panel);
      }

      const onlineFriends = state.friends.filter(f => f.status === 'online');
      const offlineFriends = state.friends.filter(f => f.status !== 'online');

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #ec4899;">👥 Friends (${state.friends.length})</h3>
          <button onclick="document.getElementById('vr-friends-panel').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        
        <div style="margin-bottom: 15px;">
          <input type="text" id="vr-friend-input" placeholder="Enter username to add..." 
            style="width: 70%; padding: 8px; border-radius: 5px; border: 1px solid #ec4899; background: rgba(255,255,255,0.1); color: white;">
          <button onclick="VRQuickWinsSet5.Friends.addFriend()" style="width: 28%; padding: 8px; background: #ec4899; border: none; border-radius: 5px; color: white; cursor: pointer;">Add</button>
        </div>

        ${onlineFriends.length > 0 ? `
          <div style="font-weight: bold; color: #22c55e; margin-bottom: 10px;">● Online (${onlineFriends.length})</div>
          ${onlineFriends.map(f => this.renderFriendItem(f)).join('')}
        ` : ''}

        ${offlineFriends.length > 0 ? `
          <div style="font-weight: bold; color: #888; margin: 15px 0 10px;">○ Offline (${offlineFriends.length})</div>
          ${offlineFriends.map(f => this.renderFriendItem(f)).join('')}
        ` : ''}

        ${state.friends.length === 0 ? '<p style="text-align: center; opacity: 0.6; padding: 20px;">No friends yet. Add some!</p>' : ''}
      `;
      panel.style.display = 'block';
    },

    renderFriendItem(friend) {
      const isOnline = friend.status === 'online';
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: ${isOnline ? '#22c55e' : '#888'};">●</span>
            <span>${friend.name}</span>
            ${friend.zone ? `<span style="font-size: 11px; opacity: 0.6;">in ${friend.zone}</span>` : ''}
          </div>
          <button onclick="VRQuickWinsSet5.Friends.removeFriend('${friend.id}')" style="background: transparent; border: none; color: #ef4444; cursor: pointer;">×</button>
        </div>
      `;
    },

    addFriend() {
      const input = document.getElementById('vr-friend-input');
      const name = input?.value.trim();
      if (!name) return;

      if (state.friends.length >= CONFIG.friends.maxFriends) {
        showToast('❌ Friend list full!');
        return;
      }

      if (state.friends.find(f => f.name === name)) {
        showToast('❌ Already friends!');
        return;
      }

      const friend = {
        id: 'friend-' + Date.now(),
        name,
        status: 'offline',
        added: Date.now()
      };

      state.friends.push(friend);
      localStorage.setItem('vr-friends', JSON.stringify(state.friends));
      
      input.value = '';
      this.showFriends();
      showToast(`✅ Added friend: ${name}`);
    },

    removeFriend(id) {
      state.friends = state.friends.filter(f => f.id !== id);
      localStorage.setItem('vr-friends', JSON.stringify(state.friends));
      this.showFriends();
      showToast('🗑️ Friend removed');
    },

    startStatusUpdates() {
      // Simulate friend status updates
      setInterval(() => {
        state.friends.forEach(f => {
          // Randomly change status for demo
          if (Math.random() > 0.9) {
            f.status = f.status === 'online' ? 'offline' : 'online';
          }
        });
        localStorage.setItem('vr-friends', JSON.stringify(state.friends));
        
        // Update badge
        const badge = document.getElementById('vr-friends-badge');
        if (badge) {
          const count = this.getOnlineCount();
          badge.textContent = count;
          badge.style.display = count > 0 ? 'block' : 'none';
        }
      }, CONFIG.friends.statusUpdateInterval);
    }
  };

  // ==================== 2. EMOTE SYSTEM ====================
  const EmoteSystem = {
    emotes: [
      { id: 'wave', icon: '👋', name: 'Wave', animation: 'wave' },
      { id: 'dance', icon: '💃', name: 'Dance', animation: 'dance' },
      { id: 'clap', icon: '👏', name: 'Clap', animation: 'clap' },
      { id: 'cheer', icon: '🙌', name: 'Cheer', animation: 'cheer' },
      { id: 'point', icon: '👉', name: 'Point', animation: 'point' },
      { id: 'sit', icon: '🧘', name: 'Sit', animation: 'sit' }
    ],

    init() {
      this.createUI();
      console.log('[VR Emotes] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-emotes-btn';
      btn.innerHTML = '🕺';
      btn.title = 'Emotes (E)';
      btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 560px;
        background: rgba(168, 85, 247, 0.5);
        border: 2px solid #a855f7;
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      btn.addEventListener('click', () => this.showEmoteWheel());
      document.body.appendChild(btn);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'e' || e.key === 'E') {
          this.showEmoteWheel();
        }
      });
    },

    showEmoteWheel() {
      if (state.emoteCooldown) {
        showToast('⏳ Emote on cooldown...');
        return;
      }

      let wheel = document.getElementById('vr-emote-wheel');
      if (!wheel) {
        wheel = document.createElement('div');
        wheel.id = 'vr-emote-wheel';
        wheel.style.cssText = `
          position: fixed;
          bottom: 100px;
          right: 500px;
          background: rgba(0,0,0,0.9);
          border: 2px solid #a855f7;
          border-radius: 50%;
          width: 200px;
          height: 200px;
          z-index: 99999;
          display: none;
        `;
        document.body.appendChild(wheel);
      }

      // Position emotes in circle
      const angleStep = (Math.PI * 2) / this.emotes.length;
      wheel.innerHTML = this.emotes.map((emote, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = 100 + Math.cos(angle) * 70 - 25;
        const y = 100 + Math.sin(angle) * 70 - 25;
        return `
          <button onclick="VRQuickWinsSet5.Emotes.play('${emote.id}')" 
            style="
              position: absolute;
              left: ${x}px;
              top: ${y}px;
              width: 50px;
              height: 50px;
              border-radius: 50%;
              background: rgba(168,85,247,0.3);
              border: 2px solid #a855f7;
              color: white;
              font-size: 24px;
              cursor: pointer;
            " title="${emote.name}">${emote.icon}</button>
        `;
      }).join('');

      // Center close button
      wheel.innerHTML += `
        <button onclick="document.getElementById('vr-emote-wheel').style.display='none'" 
          style="
            position: absolute;
            left: 75px;
            top: 75px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(239,68,68,0.5);
            border: 2px solid #ef4444;
            color: white;
            font-size: 20px;
            cursor: pointer;
          ">×</button>
      `;

      wheel.style.display = wheel.style.display === 'none' ? 'block' : 'none';
    },

    play(emoteId) {
      const emote = this.emotes.find(e => e.id === emoteId);
      if (!emote) return;

      // Hide wheel
      const wheel = document.getElementById('vr-emote-wheel');
      if (wheel) wheel.style.display = 'none';

      // Show emote above player
      this.showEmoteVisual(emote);

      // Set cooldown
      state.emoteCooldown = true;
      setTimeout(() => {
        state.emoteCooldown = false;
      }, CONFIG.emotes.cooldown);

      showToast(`${emote.icon} ${emote.name}!`);
    },

    showEmoteVisual(emote) {
      const visual = document.createElement('div');
      visual.style.cssText = `
        position: fixed;
        bottom: 300px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 48px;
        animation: emoteFloat 2s ease forwards;
        pointer-events: none;
        z-index: 99999;
      `;
      visual.textContent = emote.icon;
      document.body.appendChild(visual);

      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes emoteFloat {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-100px) scale(1.5); }
        }
      `;
      document.head.appendChild(style);

      setTimeout(() => visual.remove(), 2000);
    }
  };

  // ==================== 3. HAND MENU ====================
  const HandMenu = {
    init() {
      this.createMenu();
      this.setupToggle();
      console.log('[VR Hand Menu] Initialized');
    },

    createMenu() {
      const menu = document.createElement('div');
      menu.id = 'vr-hand-menu';
      menu.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 80px;
        background: rgba(0,0,0,0.9);
        border: 2px solid #00d4ff;
        border-radius: 50%;
        width: 150px;
        height: 150px;
        z-index: 99997;
        display: none;
      `;

      const items = [
        { icon: '🏠', action: "window.location.href='/vr/'" },
        { icon: '🎒', action: 'VRQuickWinsSet3?.Inventory?.toggle()' },
        { icon: '📍', action: 'VRQuickWinsSet3?.Waypoints?.showPanel()' },
        { icon: '⚡', action: 'VRQuickWinsSet3?.QuickTravel?.showMenu()' }
      ];

      items.forEach((item, i) => {
        const angle = (i * Math.PI / 2) - Math.PI / 4;
        const x = 75 + Math.cos(angle) * 45 - 20;
        const y = 75 + Math.sin(angle) * 45 - 20;
        
        const btn = document.createElement('button');
        btn.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0,212,255,0.3);
          border: 2px solid #00d4ff;
          font-size: 20px;
          cursor: pointer;
        `;
        btn.textContent = item.icon;
        btn.onclick = () => {
          try { eval(item.action); } catch(e) {}
          menu.style.display = 'none';
        };
        menu.appendChild(btn);
      });

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = `
        position: absolute;
        left: 55px;
        top: 55px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(239,68,68,0.5);
        border: 2px solid #ef4444;
        color: white;
        font-size: 16px;
        cursor: pointer;
      `;
      closeBtn.textContent = '×';
      closeBtn.onclick = () => menu.style.display = 'none';
      menu.appendChild(closeBtn);

      document.body.appendChild(menu);
    },

    setupToggle() {
      // Toggle with X key or hand gesture
      document.addEventListener('keydown', (e) => {
        if (e.key === 'x' || e.key === 'X') {
          this.toggle();
        }
      });
    },

    toggle() {
      const menu = document.getElementById('vr-hand-menu');
      if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      }
    }
  };

  // ==================== 4. SCREENSHOT GALLERY ====================
  const ScreenshotGallery = {
    init() {
      this.createUI();
      console.log('[VR Screenshot Gallery] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-gallery-btn';
      btn.innerHTML = '🖼️';
      btn.title = 'Screenshot Gallery';
      btn.style.cssText = `
        position: fixed;
        top: 320px;
        right: 20px;
        background: rgba(14, 165, 233, 0.5);
        border: 2px solid #0ea5e9;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showGallery());
      document.body.appendChild(btn);
    },

    showGallery() {
      let panel = document.getElementById('vr-gallery-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-gallery-panel';
        panel.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #0ea5e9;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(panel);
      }

      const screenshots = state.screenshots;

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #0ea5e9;">🖼️ Screenshot Gallery (${screenshots.length})</h3>
          <button onclick="document.getElementById('vr-gallery-panel').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        
        ${screenshots.length === 0 ? 
          '<p style="text-align: center; opacity: 0.6; padding: 40px;">No screenshots yet. Press Ctrl+P to capture!</p>' :
          `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${screenshots.map((ss, i) => `
              <div style="aspect-ratio: 16/9; background: rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; position: relative;">
                <img src="${ss.dataUrl}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 5px; font-size: 10px;">
                  ${new Date(ss.timestamp).toLocaleDateString()}
                </div>
              </div>
            `).join('')}
          </div>`
        }
      `;
      panel.style.display = 'block';
    },

    addScreenshot(dataUrl) {
      state.screenshots.unshift({
        dataUrl,
        timestamp: Date.now(),
        zone: window.location.pathname
      });

      // Keep only last 50
      if (state.screenshots.length > 50) {
        state.screenshots = state.screenshots.slice(0, 50);
      }

      localStorage.setItem('vr-screenshots', JSON.stringify(state.screenshots));
    }
  };

  // ==================== 5. ZONE RATINGS ====================
  const ZoneRatings = {
    init() {
      this.createRatingUI();
      console.log('[VR Zone Ratings] Initialized');
    },

    createRatingUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-rate-btn';
      btn.innerHTML = '⭐';
      btn.title = 'Rate Zone';
      btn.style.cssText = `
        position: fixed;
        top: 370px;
        right: 20px;
        background: rgba(250, 204, 21, 0.5);
        border: 2px solid #facc15;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showRatingDialog());
      document.body.appendChild(btn);
    },

    showRatingDialog() {
      const currentZone = window.location.pathname;
      const existing = state.zoneRatings[currentZone];

      const rating = prompt(`Rate this zone (1-5 stars):${existing ? `\nYour current rating: ${existing.rating}⭐` : ''}`);
      if (!rating) return;

      const numRating = parseInt(rating);
      if (numRating < 1 || numRating > 5) {
        showToast('❌ Please enter 1-5');
        return;
      }

      state.zoneRatings[currentZone] = {
        rating: numRating,
        timestamp: Date.now()
      };
      localStorage.setItem('vr-zone-ratings', JSON.stringify(state.zoneRatings));

      showToast(`⭐ Rated ${numRating}/5!`);
    },

    getAverageRating(zone) {
      // In real implementation, would fetch from server
      return 4.2; // Placeholder
    }
  };

  // ==================== 6. DAILY CHALLENGES ====================
  const DailyChallenges = {
    challenges: [
      { id: 'explorer', name: 'Explorer', desc: 'Visit 3 different zones', target: 3, type: 'zones' },
      { id: 'social', name: 'Social Butterfly', desc: 'Wave at 5 friends', target: 5, type: 'waves' },
      { id: 'photographer', name: 'Photographer', desc: 'Take 3 screenshots', target: 3, type: 'screenshots' },
      { id: 'collector', name: 'Collector', desc: 'Grab 10 objects', target: 10, type: 'grabs' },
      { id: 'traveler', name: 'Traveler', desc: 'Walk 100 meters', target: 100, type: 'distance' }
    ],

    init() {
      this.checkDailyReset();
      this.createUI();
      console.log('[VR Daily Challenges] Initialized');
    },

    checkDailyReset() {
      const today = new Date().toDateString();
      if (state.lastChallengeDate !== today) {
        // Generate new challenges
        state.dailyChallenges = this.generateChallenges();
        state.lastChallengeDate = today;
        localStorage.setItem('vr-daily-challenges', JSON.stringify(state.dailyChallenges));
        localStorage.setItem('vr-last-challenge-date', today);
      }
    },

    generateChallenges() {
      const shuffled = [...this.challenges].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, CONFIG.challenges.maxActive).map(c => ({
        ...c,
        progress: 0,
        completed: false
      }));
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-challenges-btn';
      btn.innerHTML = '🎯';
      btn.title = 'Daily Challenges';
      btn.style.cssText = `
        position: fixed;
        top: 420px;
        right: 20px;
        background: rgba(34, 197, 94, 0.5);
        border: 2px solid #22c55e;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showChallenges());
      document.body.appendChild(btn);
    },

    showChallenges() {
      let panel = document.getElementById('vr-challenges-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-challenges-panel';
        panel.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #22c55e;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 350px;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(panel);
      }

      const completed = state.dailyChallenges.filter(c => c.completed).length;

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #22c55e;">🎯 Daily Challenges (${completed}/${state.dailyChallenges.length})</h3>
          <button onclick="document.getElementById('vr-challenges-panel').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        <div style="font-size: 12px; opacity: 0.7; margin-bottom: 15px;">Resets at midnight</div>
        
        ${state.dailyChallenges.map(c => `
          <div style="padding: 12px; background: ${c.completed ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)'}; border-radius: 10px; margin-bottom: 10px; border: 1px solid ${c.completed ? '#22c55e' : 'rgba(255,255,255,0.1)'};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">${c.completed ? '✅ ' : ''}${c.name}</span>
              <span style="font-size: 12px; color: ${c.completed ? '#22c55e' : '#888'};">${c.progress}/${c.target}</span>
            </div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">${c.desc}</div>
            ${!c.completed ? `
              <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 8px;">
                <div style="width: ${(c.progress / c.target) * 100}%; height: 100%; background: #22c55e; border-radius: 2px; transition: width 0.3s;"></div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      `;
      panel.style.display = 'block';
    },

    updateProgress(type, amount = 1) {
      state.dailyChallenges.forEach(c => {
        if (c.type === type && !c.completed) {
          c.progress = Math.min(c.progress + amount, c.target);
          if (c.progress >= c.target) {
            c.completed = true;
            showToast(`🎯 Challenge complete: ${c.name}!`);
            // Award would go here
          }
        }
      });
      localStorage.setItem('vr-daily-challenges', JSON.stringify(state.dailyChallenges));
    }
  };

  // ==================== 7. LEADERBOARDS ====================
  const Leaderboards = {
    mockData: {
      distance: [
        { name: 'VR_Explorer', value: '52.3 km', score: 52300 },
        { name: 'WalkMaster', value: '48.1 km', score: 48100 },
        { name: 'StepCounter', value: '45.7 km', score: 45700 },
        { name: 'You', value: '12.4 km', score: 12400, isPlayer: true }
      ],
      time: [
        { name: 'VR_Addict', value: '128h', score: 128 },
        { name: 'TimeLord', value: '95h', score: 95 },
        { name: 'AlwaysHere', value: '87h', score: 87 },
        { name: 'You', value: '24h', score: 24, isPlayer: true }
      ],
      achievements: [
        { name: 'TrophyHunter', value: '45', score: 45 },
        { name: 'AchieveKing', value: '42', score: 42 },
        { name: 'BadgeMaster', value: '38', score: 38 },
        { name: 'You', value: '12', score: 12, isPlayer: true }
      ],
      interactions: [
        { name: 'ClickFrenzy', value: '2,341', score: 2341 },
        { name: 'TouchEverything', value: '1,987', score: 1987 },
        { name: 'Interactive', value: '1,654', score: 1654 },
        { name: 'You', value: '456', score: 456, isPlayer: true }
      ]
    },

    init() {
      this.createUI();
      console.log('[VR Leaderboards] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-leaderboard-btn';
      btn.innerHTML = '🏆';
      btn.title = 'Leaderboards';
      btn.style.cssText = `
        position: fixed;
        top: 470px;
        right: 20px;
        background: rgba(234, 179, 8, 0.5);
        border: 2px solid #eab308;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showLeaderboard());
      document.body.appendChild(btn);
    },

    showLeaderboard(category = 'distance') {
      let panel = document.getElementById('vr-leaderboard-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-leaderboard-panel';
        panel.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #eab308;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 400px;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(panel);
      }

      const categories = [
        { id: 'distance', icon: '🚶', name: 'Distance' },
        { id: 'time', icon: '⏰', name: 'Time' },
        { id: 'achievements', icon: '🏅', name: 'Achievements' },
        { id: 'interactions', icon: '👆', name: 'Interactions' }
      ];

      const data = this.mockData[category];

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #eab308;">🏆 Leaderboards</h3>
          <button onclick="document.getElementById('vr-leaderboard-panel').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        
        <div style="display: flex; gap: 5px; margin-bottom: 20px;">
          ${categories.map(c => `
            <button onclick="VRQuickWinsSet5.Leaderboards.showLeaderboard('${c.id}')" 
              style="flex: 1; padding: 8px; background: ${category === c.id ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${category === c.id ? '#eab308' : 'rgba(255,255,255,0.1)'}; border-radius: 8px; color: white; cursor: pointer; font-size: 12px;">
              ${c.icon} ${c.name}
            </button>
          `).join('')}
        </div>

        <div style="display: grid; gap: 8px;">
          ${data.map((entry, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: ${entry.isPlayer ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.05)'}; border-radius: 8px; border: ${entry.isPlayer ? '1px solid #eab308' : 'none'};">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: bold; color: ${i < 3 ? '#eab308' : '#888'}; width: 24px;">#${i + 1}</span>
                <span style="${entry.isPlayer ? 'color: #eab308; font-weight: bold;' : ''}">${entry.name}</span>
              </div>
              <span style="font-weight: bold; color: #00d4ff;">${entry.value}</span>
            </div>
          `).join('')}
        </div>
      `;
      panel.style.display = 'block';
    }
  };

  // ==================== 8. VR KEYBOARD SHORTCUTS ====================
  const VRKeyboardShortcuts = {
    shortcuts: [
      { key: 'WASD', desc: 'Move around' },
      { key: 'Mouse', desc: 'Look around' },
      { key: 'M', desc: 'Set waypoint' },
      { key: 'I', desc: 'Open inventory' },
      { key: 'T', desc: 'Quick travel' },
      { key: 'G', desc: 'Quick select wheel' },
      { key: 'E', desc: 'Emotes' },
      { key: 'F', desc: 'Friends' },
      { key: 'V', desc: 'Voice chat' },
      { key: 'N', desc: 'Toggle minimap' },
      { key: 'Q/E', desc: 'Snap turn' },
      { key: 'R', desc: 'Reset position' },
      { key: 'H', desc: 'Return to hub' },
      { key: 'ESC', desc: 'Close menus / Emergency exit' },
      { key: 'Ctrl+F', desc: 'Performance monitor' },
      { key: 'Ctrl+P', desc: 'Screenshot' }
    ],

    init() {
      this.createButton();
      console.log('[VR Shortcuts] Initialized');
    },

    createButton() {
      const btn = document.createElement('button');
      btn.id = 'vr-shortcuts-helper-btn';
      btn.innerHTML = '⌨️';
      btn.title = 'Keyboard Shortcuts (?)';
      btn.style.cssText = `
        position: fixed;
        top: 520px;
        right: 20px;
        background: rgba(100, 116, 139, 0.5);
        border: 2px solid #64748b;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showShortcuts());
      document.body.appendChild(btn);

      document.addEventListener('keydown', (e) => {
        if (e.key === '?') {
          this.showShortcuts();
        }
      });
    },

    showShortcuts() {
      let panel = document.getElementById('vr-shortcuts-helper-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-shortcuts-helper-panel';
        panel.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #64748b;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 350px;
          max-height: 70vh;
          overflow-y: auto;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(panel);
      }

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #64748b;">⌨️ Keyboard Shortcuts</h3>
          <button onclick="document.getElementById('vr-shortcuts-helper-panel').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        
        <div style="display: grid; gap: 8px;">
          ${this.shortcuts.map(s => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 6px;">
              <kbd style="background: rgba(100,116,139,0.3); padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 12px; border: 1px solid #64748b;">${s.key}</kbd>
              <span style="font-size: 14px; opacity: 0.9;">${s.desc}</span>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; opacity: 0.6; text-align: center;">
          Press ? anytime to show this help
        </div>
      `;
      panel.style.display = 'block';
    }
  };

  // ==================== 9. COMFORT TURNING ====================
  const ComfortTurning = {
    init() {
      this.createUI();
      console.log('[VR Comfort Turning] Initialized');
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-comfort-turn-btn';
      btn.innerHTML = '🔄';
      btn.title = 'Comfort Turning';
      btn.style.cssText = `
        position: fixed;
        top: 570px;
        right: 20px;
        background: rgba(139, 92, 246, 0.5);
        border: 2px solid #8b5cf6;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showOptions());
      document.body.appendChild(btn);
    },

    showOptions() {
      let panel = document.getElementById('vr-comfort-turn-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-comfort-turn-panel';
        panel.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #8b5cf6;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 300px;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(panel);
      }

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #8b5cf6;">🔄 Comfort Turning</h3>
          <button onclick="document.getElementById('vr-comfort-turn-panel').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px;">Turn Style:</label>
          <select id="vr-turn-style" style="width: 100%; padding: 8px; border-radius: 5px; background: rgba(255,255,255,0.1); border: 1px solid #8b5cf6; color: white;">
            <option value="snap">Snap Turn (45°)</option>
            <option value="smooth">Smooth Turn</option>
            <option value="snap30">Snap Turn (30°)</option>
            <option value="snap90">Snap Turn (90°)</option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="vr-vignette-turn" checked style="width: 18px; height: 18px;">
            <span>Show vignette during turn</span>
          </label>
        </div>

        <button onclick="VRQuickWinsSet5.ComfortTurn.saveSettings()" style="width: 100%; padding: 10px; background: #8b5cf6; border: none; border-radius: 8px; color: white; cursor: pointer;">Save Settings</button>
      `;
      panel.style.display = 'block';
    },

    saveSettings() {
      const style = document.getElementById('vr-turn-style')?.value;
      const vignette = document.getElementById('vr-vignette-turn')?.checked;
      
      localStorage.setItem('vr-comfort-turn-style', style);
      localStorage.setItem('vr-comfort-vignette', vignette);
      
      document.getElementById('vr-comfort-turn-panel').style.display = 'none';
      showToast('🔄 Settings saved!');
    }
  };

  // ==================== 10. SESSION ANALYTICS ====================
  const SessionAnalytics = {
    init() {
      this.startTracking();
      this.createUI();
      console.log('[VR Session Analytics] Initialized');
    },

    startTracking() {
      // Track zone visits
      const currentZone = window.location.pathname;
      if (!state.sessionData.zonesVisited.includes(currentZone)) {
        state.sessionData.zonesVisited.push(currentZone);
      }

      // Track session time
      setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.sessionData.startTime) / 1000);
        localStorage.setItem('vr-session-current', JSON.stringify({
          ...state.sessionData,
          duration: elapsed
        }));
      }, 10000);
    },

    createUI() {
      const btn = document.createElement('button');
      btn.id = 'vr-analytics-btn';
      btn.innerHTML = '📈';
      btn.title = 'Session Analytics';
      btn.style.cssText = `
        position: fixed;
        top: 620px;
        right: 20px;
        background: rgba(20, 184, 166, 0.5);
        border: 2px solid #14b8a6;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 99998;
      `;
      btn.addEventListener('click', () => this.showAnalytics());
      document.body.appendChild(btn);
    },

    showAnalytics() {
      const duration = Math.floor((Date.now() - state.sessionData.startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;

      let panel = document.getElementById('vr-analytics-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vr-analytics-panel';
        panel.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--vr-overlay-bg, rgba(10,10,20,0.95));
          border: 2px solid #14b8a6;
          border-radius: 20px;
          padding: 25px;
          z-index: 100000;
          min-width: 350px;
          backdrop-filter: blur(15px);
          color: var(--vr-text, #e0e0e0);
        `;
        document.body.appendChild(panel);
      }

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #14b8a6;">📈 Session Analytics</h3>
          <button onclick="document.getElementById('vr-analytics-panel').style.display='none'" style="background: rgba(239,68,68,0.8); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">×</button>
        </div>
        
        <div style="display: grid; gap: 12px;">
          <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <div style="font-size: 12px; opacity: 0.7;">Session Duration</div>
            <div style="font-size: 24px; font-weight: bold; color: #14b8a6;">${minutes}m ${seconds}s</div>
          </div>
          
          <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <div style="font-size: 12px; opacity: 0.7;">Zones Visited This Session</div>
            <div style="font-size: 24px; font-weight: bold; color: #14b8a6;">${state.sessionData.zonesVisited.length}</div>
          </div>
          
          <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <div style="font-size: 12px; opacity: 0.7;">Current Zone</div>
            <div style="font-size: 16px; font-weight: bold; color: #14b8a6;">${window.location.pathname.replace('/vr/', '').replace('.html', '') || 'Hub'}</div>
          </div>
        </div>

        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
          <button onclick="VRQuickWinsSet5.Analytics.exportData()" style="width: 100%; padding: 10px; background: rgba(20,184,166,0.3); border: 1px solid #14b8a6; border-radius: 8px; color: #14b8a6; cursor: pointer;">
            📥 Export Session Data
          </button>
        </div>
      `;
      panel.style.display = 'block';
    },

    exportData() {
      const data = {
        ...state.sessionData,
        duration: Math.floor((Date.now() - state.sessionData.startTime) / 1000),
        exportTime: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vr-session-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('📥 Session data exported!');
    }
  };

  // ==================== UTILITY: TOAST ====================
  function showToast(message) {
    let toast = document.getElementById('vr-toast-set5');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vr-toast-set5';
      toast.style.cssText = `
        position: fixed;
        bottom: 250px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(10,10,20,0.95);
        backdrop-filter: blur(12px);
        border: 1px solid #ec4899;
        border-radius: 10px;
        color: #e0e0e0;
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
    }, 2500);
  }

  // ==================== INITIALIZATION ====================
  function init() {
    console.log('[VR Substantial Quick Wins - Set 5] Initializing...');

    FriendSystem.init();
    EmoteSystem.init();
    HandMenu.init();
    ScreenshotGallery.init();
    ZoneRatings.init();
    DailyChallenges.init();
    Leaderboards.init();
    VRKeyboardShortcuts.init();
    ComfortTurning.init();
    SessionAnalytics.init();

    console.log('[VR Substantial Quick Wins - Set 5] Initialized!');
    console.log('New shortcuts:');
    console.log('  F - Friends list');
    console.log('  E - Emote wheel');
    console.log('  X - Hand menu');
    console.log('  ? - Keyboard shortcuts');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.VRQuickWinsSet5 = {
    Friends: FriendSystem,
    Emotes: EmoteSystem,
    HandMenu,
    Gallery: ScreenshotGallery,
    Ratings: ZoneRatings,
    Challenges: DailyChallenges,
    Leaderboards,
    Shortcuts: VRKeyboardShortcuts,
    ComfortTurn: ComfortTurning,
    Analytics: SessionAnalytics,
    showToast
  };

})();
