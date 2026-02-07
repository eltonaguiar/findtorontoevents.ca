/**
 * VR Chat 2D UI - Desktop/Mobile Chat Overlay Interface
 *
 * Features:
 *   - Collapsible chat drawer (right side)
 *   - Message bubbles with avatars and timestamps
 *   - Text input with emoji picker
 *   - Zone selector dropdown
 *   - Voice controls (mute, PTT, volume)
 *   - User list with online status
 *   - Typing indicators
 *   - Keyboard shortcuts
 *   - Mobile responsive
 *
 * Dependencies:
 *   - ChatEngine from chat-engine.js
 *   - VoiceEngine from voice-engine.js
 *   - styles.css for styling
 *
 * Usage:
 *   ChatUI2D.init({
 *     userId: 'user123',
 *     userName: 'Alice',
 *     avatarUrl: '/avatar.png'
 *   });
 */
(function() {
  'use strict';

  /* ═══════ CONFIGURATION ═══════ */
  var CONFIG = {
    // Zone options
    zones: [
      { id: 'hub', name: 'Hub', icon: '🏠' },
      { id: 'events', name: 'Events', icon: '📅' },
      { id: 'movies', name: 'Movies', icon: '🎬' },
      { id: 'creators', name: 'Creators', icon: '⭐' },
      { id: 'stocks', name: 'Stocks', icon: '📈' },
      { id: 'wellness', name: 'Wellness', icon: '🧘' },
      { id: 'weather', name: 'Weather', icon: '🌤️' }
    ],

    // Default settings
    defaultZone: 'hub',
    maxMessages: 100,
    typingTimeout: 3000,
    reconnectInterval: 5000,

    // Emoji set
    emojis: [
      '😀', '😂', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🎉', '🔥',
      '👏', '🙏', '🤝', '✨', '🌟', '💯', '🚀', '💪', '🎮', '🎯',
      '🎪', '🎨', '🎭', '🎪', '🌈', '☀️', '🌙', '⭐', '⚡', '💫'
    ]
  };

  /* ═══════ STATE ═══════ */
  var state = {
    isOpen: false,
    isMinimized: false,
    currentZone: null,
    userId: null,
    userName: null,
    avatarUrl: null,
    messages: [],
    users: new Map(),
    typingUsers: new Set(),
    unreadCount: 0,
    isTyping: false,
    typingTimer: null,
    voiceMuted: true,
    voiceConnected: false,
    pushToTalkActive: false,
    audioLevel: 0,
    volume: 80,
    emojiPickerOpen: false,
    contextMenuOpen: false,
    selectedMessageId: null,
    replyToMessageId: null,
    initialized: false
  };

  /* ═══════ DOM ELEMENTS ═══════ */
  var elements = {};

  /* ═══════ UTILITY FUNCTIONS ═══════ */

  function generateId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function formatTime(timestamp) {
    var date = new Date(timestamp);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
  }

  function formatRelativeTime(timestamp) {
    var now = Date.now();
    var diff = now - timestamp;
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    return formatTime(timestamp);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(n) {
      return n[0];
    }).join('').toUpperCase().slice(0, 2);
  }

  function detectZoneFromUrl() {
    var path = window.location.pathname.toLowerCase();
    if (path.includes('event')) return 'events';
    if (path.includes('movie')) return 'movies';
    if (path.includes('creator') || path.includes('favcreator')) return 'creators';
    if (path.includes('stock')) return 'stocks';
    if (path.includes('wellness') || path.includes('mental')) return 'wellness';
    if (path.includes('weather')) return 'weather';
    return 'hub';
  }

  /* ═══════ SVG ICONS ═══════ */
  var ICONS = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    minimize: '<svg viewBox="0 0 24 24"><path d="M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z"/></svg>',
    maximize: '<svg viewBox="0 0 24 24"><path d="M5.88 4.12L13.76 12l-7.88 7.88L8 22l10-10L8 2z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    emoji: '<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
    micOff: '<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.17 1.75-.57 2.46-1.12l4.22 4.22 1.27-1.27L4.27 3z"/></svg>',
    volume: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    volumeMute: '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
    reply: '<svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>',
    delete: '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    ptt: '<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>'
  };

  /* ═══════ DOM CREATION ═══════ */

  function createElement(tag, className, html) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (html) el.innerHTML = html;
    return el;
  }

  function createChatDrawer() {
    // Main drawer container
    var drawer = createElement('div', 'vr-chat-drawer');
    drawer.id = 'vr-chat-drawer';

    // Header
    var header = createElement('div', 'vr-chat-header');
    var headerLeft = createElement('div', 'vr-chat-header-left');
    var title = createElement('div', 'vr-chat-header-title');
    title.innerHTML = '<span class="zone-indicator"></span><span id="vr-chat-title">Chat</span>';

    var zoneSelector = createElement('select', 'vr-zone-selector');
    zoneSelector.id = 'vr-zone-selector';
    CONFIG.zones.forEach(function(zone) {
      var option = createElement('option');
      option.value = zone.id;
      option.textContent = zone.icon + ' ' + zone.name;
      zoneSelector.appendChild(option);
    });
    zoneSelector.addEventListener('change', onZoneChange);

    headerLeft.appendChild(title);
    headerLeft.appendChild(zoneSelector);

    var headerActions = createElement('div', 'vr-chat-header-actions');
    var minimizeBtn = createElement('button', 'vr-header-btn', ICONS.minimize);
    minimizeBtn.title = 'Minimize';
    minimizeBtn.addEventListener('click', toggleMinimize);
    var closeBtn = createElement('button', 'vr-header-btn', ICONS.close);
    closeBtn.title = 'Close (Esc)';
    closeBtn.addEventListener('click', closeDrawer);

    headerActions.appendChild(minimizeBtn);
    headerActions.appendChild(closeBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerActions);

    // User list
    var userList = createElement('div', 'vr-user-list');
    userList.id = 'vr-user-list';
    userList.innerHTML = '<div class="vr-user-list-header">Online Users <span class="vr-user-count" id="vr-user-count">0</span></div>';

    // Messages area
    var messages = createElement('div', 'vr-chat-messages');
    messages.id = 'vr-chat-messages';
    messages.innerHTML = '<div class="vr-welcome-message"><h3>Welcome to VR Chat</h3><p>Select a zone to start chatting with others in the same area.</p></div>';
    messages.addEventListener('scroll', onMessagesScroll);

    // Typing indicator
    var typingIndicator = createElement('div', 'vr-typing-indicator');
    typingIndicator.id = 'vr-typing-indicator';
    typingIndicator.style.display = 'none';
    typingIndicator.innerHTML = '<span id="vr-typing-text">Someone is typing</span><div class="vr-typing-dots"><span class="vr-typing-dot"></span><span class="vr-typing-dot"></span><span class="vr-typing-dot"></span></div>';

    // Voice panel
    var voicePanel = createElement('div', 'vr-voice-panel');
    voicePanel.innerHTML = '<div class="vr-voice-header"><span>Voice Chat</span><div class="vr-voice-status"><span class="vr-voice-status-dot" id="vr-voice-status-dot"></span><span id="vr-voice-status-text">Disconnected</span></div></div>';

    var voiceControls = createElement('div', 'vr-voice-controls');

    var muteBtn = createElement('button', 'vr-voice-btn muted', ICONS.micOff);
    muteBtn.id = 'vr-mute-btn';
    muteBtn.title = 'Toggle Mute (V)';
    muteBtn.addEventListener('click', toggleMute);

    var pttBtn = createElement('button', 'vr-voice-btn ptt', ICONS.ptt + '<span>PTT</span>');
    pttBtn.id = 'vr-ptt-btn';
    pttBtn.title = 'Push to Talk (Hold B)';
    pttBtn.addEventListener('mousedown', startPTT);
    pttBtn.addEventListener('mouseup', endPTT);
    pttBtn.addEventListener('mouseleave', endPTT);
    pttBtn.addEventListener('touchstart', function(e) { e.preventDefault(); startPTT(); });
    pttBtn.addEventListener('touchend', function(e) { e.preventDefault(); endPTT(); });

    var vuMeter = createElement('div', 'vr-vu-meter');
    vuMeter.innerHTML = '<div class="vr-vu-fill" id="vr-vu-fill" style="width: 0%"></div>';

    voiceControls.appendChild(muteBtn);
    voiceControls.appendChild(pttBtn);
    voiceControls.appendChild(vuMeter);

    var volumeControl = createElement('div', 'vr-volume-control');
    volumeControl.innerHTML = ICONS.volume + '<input type="range" class="vr-volume-slider" id="vr-volume-slider" min="0" max="100" value="80"><span class="vr-volume-value" id="vr-volume-value">80%</span>';
    volumeControl.querySelector('input').addEventListener('input', onVolumeChange);

    voicePanel.appendChild(voiceControls);
    voicePanel.appendChild(volumeControl);

    // Input area
    var inputArea = createElement('div', 'vr-chat-input-area');

    var inputWrapper = createElement('div', 'vr-input-wrapper');

    var input = createElement('textarea', 'vr-chat-input');
    input.id = 'vr-chat-input';
    input.placeholder = 'Type a message...';
    input.rows = 1;
    input.addEventListener('input', onInputChange);
    input.addEventListener('keydown', onInputKeydown);
    input.addEventListener('focus', onInputFocus);
    input.addEventListener('blur', onInputBlur);

    var inputActions = createElement('div', 'vr-input-actions');

    var emojiBtn = createElement('button', 'vr-input-btn', ICONS.emoji);
    emojiBtn.title = 'Add emoji';
    emojiBtn.addEventListener('click', toggleEmojiPicker);

    var sendBtn = createElement('button', 'vr-input-btn send', ICONS.send);
    sendBtn.title = 'Send message';
    sendBtn.addEventListener('click', sendMessage);

    inputActions.appendChild(emojiBtn);
    inputActions.appendChild(sendBtn);

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(inputActions);

    var inputHint = createElement('div', 'vr-input-hint');
    inputHint.innerHTML = '<kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line';

    // Emoji picker
    var emojiPicker = createElement('div', 'vr-emoji-picker');
    emojiPicker.id = 'vr-emoji-picker';
    CONFIG.emojis.forEach(function(emoji) {
      var btn = createElement('button', 'vr-emoji-btn');
      btn.textContent = emoji;
      btn.addEventListener('click', function() {
        insertEmoji(emoji);
      });
      emojiPicker.appendChild(btn);
    });

    inputArea.appendChild(inputWrapper);
    inputArea.appendChild(inputHint);
    inputArea.appendChild(emojiPicker);

    // Assemble drawer
    drawer.appendChild(header);
    drawer.appendChild(userList);
    drawer.appendChild(messages);
    drawer.appendChild(typingIndicator);
    drawer.appendChild(voicePanel);
    drawer.appendChild(inputArea);

    return drawer;
  }

  function createToggleButton() {
    var btn = createElement('button', 'vr-chat-toggle', ICONS.chat);
    btn.id = 'vr-chat-toggle';
    btn.title = 'Toggle Chat (T)';
    btn.addEventListener('click', toggleDrawer);
    return btn;
  }

  function createContextMenu() {
    var menu = createElement('div', 'vr-context-menu');
    menu.id = 'vr-context-menu';
    menu.innerHTML = '<div class="vr-context-item" data-action="reply">' + ICONS.reply + ' Reply</div><div class="vr-context-item" data-action="copy">' + ICONS.copy + ' Copy</div><div class="vr-context-divider"></div><div class="vr-context-item" data-action="delete">' + ICONS.delete + ' Delete</div>';

    menu.addEventListener('click', onContextMenuClick);
    document.addEventListener('click', function() {
      hideContextMenu();
    });

    return menu;
  }

  function createToast() {
    var toast = createElement('div', 'vr-chat-toast');
    toast.id = 'vr-chat-toast';
    toast.innerHTML = '<div class="vr-chat-toast-icon">' + ICONS.check + '</div><div class="vr-chat-toast-content"><div class="vr-chat-toast-title" id="vr-toast-title">Title</div><div class="vr-chat-toast-message" id="vr-toast-message">Message</div></div>';
    return toast;
  }

  /* ═══════ UI UPDATES ═══════ */

  function updateZoneSelector() {
    var selector = elements.zoneSelector;
    if (selector) {
      selector.value = state.currentZone;
    }
  }

  function updateTypingIndicator() {
    var indicator = elements.typingIndicator;
    var text = document.getElementById('vr-typing-text');

    if (state.typingUsers.size === 0) {
      indicator.style.display = 'none';
      return;
    }

    indicator.style.display = 'flex';

    var names = [];
    state.typingUsers.forEach(function(userId) {
      var user = state.users.get(userId);
      if (user) {
        names.push(user.name || userId);
      }
    });

    if (names.length === 1) {
      text.textContent = names[0] + ' is typing...';
    } else if (names.length === 2) {
      text.textContent = names.join(' and ') + ' are typing...';
    } else if (names.length > 2) {
      text.textContent = names.length + ' people are typing...';
    }
  }

  function updateUserList() {
    var list = elements.userList;
    var count = document.getElementById('vr-user-count');

    // Clear existing users (keep header)
    var header = list.querySelector('.vr-user-list-header');
    list.innerHTML = '';
    list.appendChild(header);

    var onlineCount = 0;
    state.users.forEach(function(user, userId) {
      if (user.status !== 'offline') {
        onlineCount++;
        var item = createUserItem(user, userId);
        list.appendChild(item);
      }
    });

    count.textContent = onlineCount;
  }

  function createUserItem(user, userId) {
    var item = createElement('div', 'vr-user-item');
    item.dataset.userId = userId;

    var avatar = createElement('div', 'vr-user-avatar');
    if (user.avatarUrl) {
      avatar.innerHTML = '<img src="' + escapeHtml(user.avatarUrl) + '" alt="">';
    } else {
      avatar.textContent = getInitials(user.name);
    }

    var statusClass = user.status || 'online';
    var statusIndicator = createElement('span', 'vr-user-status ' + statusClass);
    avatar.appendChild(statusIndicator);

    var info = createElement('div', 'vr-user-info');
    var name = createElement('div', 'vr-user-name');
    name.textContent = user.name || 'Anonymous';
    var statusText = createElement('div', 'vr-user-status-text');
    statusText.textContent = user.status === 'voice' ? 'In voice chat' : 'Online';

    info.appendChild(name);
    info.appendChild(statusText);

    var voiceIndicator = createElement('div', 'vr-user-voice-indicator');
    for (var i = 0; i < 4; i++) {
      var bar = createElement('span', 'vr-voice-bar');
      bar.dataset.index = i;
      voiceIndicator.appendChild(bar);
    }

    var micStatus = createElement('span', 'vr-user-mic-status' + (user.muted ? ' muted' : ''));
    micStatus.innerHTML = user.muted ? ICONS.micOff : ICONS.mic;

    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(voiceIndicator);
    item.appendChild(micStatus);

    return item;
  }

  function updateVoiceUI() {
    var muteBtn = elements.muteBtn;
    var statusDot = document.getElementById('vr-voice-status-dot');
    var statusText = document.getElementById('vr-voice-status-text');

    if (state.voiceMuted) {
      muteBtn.classList.add('muted');
      muteBtn.innerHTML = ICONS.micOff;
      muteBtn.title = 'Unmute (V)';
    } else {
      muteBtn.classList.remove('muted');
      muteBtn.innerHTML = ICONS.mic;
      muteBtn.title = 'Mute (V)';
    }

    if (state.voiceConnected) {
      statusDot.className = 'vr-voice-status-dot connected';
      statusText.textContent = 'Connected';
    } else {
      statusDot.className = 'vr-voice-status-dot';
      statusText.textContent = 'Disconnected';
    }

    // Update VU meter
    var vuFill = document.getElementById('vr-vu-fill');
    if (vuFill) {
      var level = state.pushToTalkActive ? state.audioLevel : 0;
      vuFill.style.width = (level * 100) + '%';
      vuFill.classList.toggle('speaking', level > 0.3);
    }
  }

  function updateUnreadBadge() {
    var toggle = elements.toggleBtn;
    var existingBadge = toggle.querySelector('.unread-badge');

    if (state.unreadCount > 0 && !state.isOpen) {
      if (!existingBadge) {
        var badge = createElement('span', 'unread-badge');
        badge.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
        toggle.appendChild(badge);
      } else {
        existingBadge.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  }

  /* ═══════ MESSAGE HANDLING ═══════ */

  function addMessage(message, isHistory) {
    // Add to state
    state.messages.push(message);

    // Trim if needed
    if (state.messages.length > CONFIG.maxMessages) {
      state.messages.shift();
      // Remove oldest DOM element
      var firstMsg = elements.messages.querySelector('.vr-message:not(.system)');
      if (firstMsg) firstMsg.remove();
    }

    // Create message element
    var msgEl = createMessageElement(message);
    elements.messages.appendChild(msgEl);

    // Scroll to bottom if not history and we're at bottom
    if (!isHistory) {
      var isAtBottom = elements.messages.scrollHeight - elements.messages.scrollTop <= elements.messages.clientHeight + 50;
      if (isAtBottom || message.userId === state.userId) {
        scrollToBottom();
      }

      // Increment unread if drawer closed and not our message
      if (!state.isOpen && message.userId !== state.userId) {
        state.unreadCount++;
        updateUnreadBadge();
      }
    }
  }

  function createMessageElement(message) {
    var isOwn = message.userId === state.userId;
    var isSystem = message.type === 'system';

    var msgEl = createElement('div', 'vr-message' + (isOwn ? ' own' : '') + (isSystem ? ' system' : ''));
    msgEl.dataset.messageId = message.id;

    if (!isSystem) {
      var avatar = createElement('div', 'vr-message-avatar');
      if (message.avatarUrl) {
        avatar.innerHTML = '<img src="' + escapeHtml(message.avatarUrl) + '" alt="">';
      } else {
        avatar.textContent = getInitials(message.userName);
      }
      msgEl.appendChild(avatar);
    }

    var content = createElement('div', 'vr-message-content');

    var header = createElement('div', 'vr-message-header');
    if (!isSystem) {
      var author = createElement('span', 'vr-message-author');
      author.textContent = message.userName || 'Anonymous';
      header.appendChild(author);
    }
    var time = createElement('span', 'vr-message-time');
    time.textContent = formatTime(message.timestamp);
    time.title = new Date(message.timestamp).toLocaleString();
    header.appendChild(time);
    content.appendChild(header);

    var bubble = createElement('div', 'vr-message-bubble');
    bubble.textContent = message.content;
    content.appendChild(bubble);

    // Add context menu for non-system messages
    if (!isSystem) {
      msgEl.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e, message.id);
      });
    }

    msgEl.appendChild(content);

    return msgEl;
  }

  function addSystemMessage(content) {
    addMessage({
      id: generateId(),
      type: 'system',
      content: content,
      timestamp: Date.now()
    });
  }

  function scrollToBottom() {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  /* ═══════ EVENT HANDLERS ═══════ */

  function onZoneChange(e) {
    var newZone = e.target.value;
    if (newZone === state.currentZone) return;

    // Leave current zone
    if (state.currentZone) {
      if (typeof ChatEngine !== 'undefined') {
        ChatEngine.leaveRoom(state.currentZone);
      }
      if (typeof VoiceEngine !== 'undefined') {
        VoiceEngine.leaveZone(state.currentZone);
      }
    }

    // Join new zone
    state.currentZone = newZone;
    joinZone(newZone);

    // Clear messages and show welcome
    elements.messages.innerHTML = '<div class="vr-welcome-message"><h3>Welcome to ' + getZoneName(newZone) + '</h3><p>You\'ve joined the ' + getZoneName(newZone) + ' zone. Start chatting!</p></div>';
    state.messages = [];

    // Update title
    document.getElementById('vr-chat-title').textContent = getZoneName(newZone);
  }

  function getZoneName(zoneId) {
    var zone = CONFIG.zones.find(function(z) {
      return z.id === zoneId;
    });
    return zone ? zone.name : zoneId;
  }

  function onInputChange(e) {
    var input = e.target;

    // Auto-resize
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';

    // Send typing indicator
    if (!state.isTyping && input.value.length > 0) {
      state.isTyping = true;
      if (typeof ChatEngine !== 'undefined') {
        ChatEngine.sendTyping(true);
      }
    }

    // Clear typing timer
    if (state.typingTimer) {
      clearTimeout(state.typingTimer);
    }

    // Stop typing after timeout
    if (input.value.length === 0) {
      state.isTyping = false;
      if (typeof ChatEngine !== 'undefined') {
        ChatEngine.sendTyping(false);
      }
    } else {
      state.typingTimer = setTimeout(function() {
        state.isTyping = false;
        if (typeof ChatEngine !== 'undefined') {
          ChatEngine.sendTyping(false);
        }
      }, CONFIG.typingTimeout);
    }
  }

  function onInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function onInputFocus() {
    // Close emoji picker when focusing input
    if (state.emojiPickerOpen) {
      toggleEmojiPicker();
    }
  }

  function onInputBlur() {
    // Stop typing when input loses focus
    if (state.isTyping) {
      state.isTyping = false;
      if (typeof ChatEngine !== 'undefined') {
        ChatEngine.sendTyping(false);
      }
    }
  }

  function onMessagesScroll() {
    // Could implement infinite scroll here
  }

  function onVolumeChange(e) {
    state.volume = parseInt(e.target.value);
    document.getElementById('vr-volume-value').textContent = state.volume + '%';

    // Update VoiceEngine volume if available
    if (typeof VoiceEngine !== 'undefined' && VoiceEngine.setVolume) {
      VoiceEngine.setVolume(state.volume / 100);
    }
  }

  function onContextMenuClick(e) {
    var action = e.target.closest('.vr-context-item');
    if (!action) return;

    var actionType = action.dataset.action;
    var messageId = state.selectedMessageId;

    switch (actionType) {
      case 'reply':
        state.replyToMessageId = messageId;
        elements.input.focus();
        showToast('Replying', 'Type your reply and press Enter');
        break;
      case 'copy':
        var message = state.messages.find(function(m) {
          return m.id === messageId;
        });
        if (message) {
          navigator.clipboard.writeText(message.content).then(function() {
            showToast('Copied', 'Message copied to clipboard');
          });
        }
        break;
      case 'delete':
        if (messageId) {
          var msgEl = document.querySelector('[data-message-id="' + messageId + '"]');
          if (msgEl) msgEl.remove();
          showToast('Deleted', 'Message removed from view');
        }
        break;
    }

    hideContextMenu();
  }

  /* ═══════ ACTIONS ═══════ */

  function toggleDrawer() {
    state.isOpen = !state.isOpen;
    elements.drawer.classList.toggle('open', state.isOpen);

    if (state.isOpen) {
      state.unreadCount = 0;
      updateUnreadBadge();
      scrollToBottom();
      elements.input.focus();
    }
  }

  function closeDrawer() {
    state.isOpen = false;
    state.isMinimized = false;
    elements.drawer.classList.remove('open', 'minimized');
  }

  function toggleMinimize() {
    state.isMinimized = !state.isMinimized;
    elements.drawer.classList.toggle('minimized', state.isMinimized);
  }

  function sendMessage() {
    var content = elements.input.value.trim();
    if (!content) return;

    var message = {
      id: generateId(),
      userId: state.userId,
      userName: state.userName,
      avatarUrl: state.avatarUrl,
      content: content,
      timestamp: Date.now(),
      type: 'chat'
    };

    // Send via ChatEngine
    if (typeof ChatEngine !== 'undefined') {
      ChatEngine.sendMessage(content, {
        replyTo: state.replyToMessageId
      });
    }

    // Add to UI immediately (optimistic)
    addMessage(message);

    // Clear input
    elements.input.value = '';
    elements.input.style.height = 'auto';

    // Clear reply
    state.replyToMessageId = null;

    // Stop typing
    state.isTyping = false;
    if (typeof ChatEngine !== 'undefined') {
      ChatEngine.sendTyping(false);
    }
  }

  function toggleEmojiPicker() {
    state.emojiPickerOpen = !state.emojiPickerOpen;
    elements.emojiPicker.classList.toggle('open', state.emojiPickerOpen);
  }

  function insertEmoji(emoji) {
    elements.input.value += emoji;
    elements.input.focus();
    toggleEmojiPicker();
  }

  function toggleMute() {
    state.voiceMuted = !state.voiceMuted;

    if (typeof VoiceEngine !== 'undefined') {
      VoiceEngine.setMute(state.voiceMuted);
    }

    updateVoiceUI();
    showToast(state.voiceMuted ? 'Muted' : 'Unmuted', 'Voice chat is now ' + (state.voiceMuted ? 'muted' : 'active'));
  }

  function startPTT() {
    if (!state.pushToTalkActive) {
      state.pushToTalkActive = true;
      elements.pttBtn.classList.add('active');

      if (typeof VoiceEngine !== 'undefined') {
        VoiceEngine.setPushToTalkActive(true);
      }

      // Temporarily unmute
      if (state.voiceMuted) {
        if (typeof VoiceEngine !== 'undefined') {
          VoiceEngine.setMute(false);
        }
      }
    }
  }

  function endPTT() {
    if (state.pushToTalkActive) {
      state.pushToTalkActive = false;
      elements.pttBtn.classList.remove('active');

      if (typeof VoiceEngine !== 'undefined') {
        VoiceEngine.setPushToTalkActive(false);
      }

      // Restore mute state
      if (typeof VoiceEngine !== 'undefined') {
        VoiceEngine.setMute(state.voiceMuted);
      }
    }
  }

  function showContextMenu(e, messageId) {
    state.selectedMessageId = messageId;
    state.contextMenuOpen = true;

    var menu = elements.contextMenu;
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.classList.add('open');
  }

  function hideContextMenu() {
    state.contextMenuOpen = false;
    state.selectedMessageId = null;
    elements.contextMenu.classList.remove('open');
  }

  function showToast(title, message) {
    var toast = elements.toast;
    document.getElementById('vr-toast-title').textContent = title;
    document.getElementById('vr-toast-message').textContent = message;

    toast.classList.add('show');

    setTimeout(function() {
      toast.classList.remove('show');
    }, 3000);
  }

  /* ═══════ KEYBOARD SHORTCUTS ═══════ */

  function onKeyDown(e) {
    // Don't trigger shortcuts when typing in input (except specific ones)
    var isInputFocused = document.activeElement === elements.input;

    switch (e.key.toLowerCase()) {
      case 't':
        if (!isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          if (!state.isOpen) toggleDrawer();
          elements.input.focus();
        }
        break;

      case 'v':
        if (!isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleMute();
        }
        break;

      case 'b':
        if (!isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          startPTT();
        }
        break;

      case 'escape':
        if (state.isOpen) {
          e.preventDefault();
          closeDrawer();
        }
        if (state.emojiPickerOpen) {
          toggleEmojiPicker();
        }
        break;
    }
  }

  function onKeyUp(e) {
    if (e.key.toLowerCase() === 'b') {
      endPTT();
    }
  }

  /* ═══════ CHAT ENGINE INTEGRATION ═══════ */

  function setupChatEngine() {
    if (typeof ChatEngine === 'undefined') {
      console.warn('[ChatUI2D] ChatEngine not available');
      return;
    }

    ChatEngine.on('onMessage', function(data) {
      addMessage({
        id: data.id || data.messageId || generateId(),
        userId: data.userId || data.user?.id,
        userName: data.userName || data.user?.name || 'Anonymous',
        avatarUrl: data.avatarUrl || data.user?.avatarUrl,
        content: data.content || data.message,
        timestamp: data.timestamp || Date.now(),
        type: data.type || 'chat'
      });
    });

    ChatEngine.on('onUserJoin', function(user) {
      state.users.set(user.id, user);
      updateUserList();
      addSystemMessage(user.name + ' joined the zone');
    });

    ChatEngine.on('onUserLeave', function(user) {
      state.users.delete(user.id);
      updateUserList();
      addSystemMessage(user.name + ' left the zone');
    });

    ChatEngine.on('onTyping', function(data) {
      if (data.isTyping) {
        state.typingUsers.add(data.userId);
      } else {
        state.typingUsers.delete(data.userId);
      }
      updateTypingIndicator();
    });

    ChatEngine.on('onConnect', function() {
      showToast('Connected', 'Chat server connected');
      if (state.currentZone) {
        joinZone(state.currentZone);
      }
    });

    ChatEngine.on('onDisconnect', function() {
      showToast('Disconnected', 'Chat server disconnected');
    });
  }

  /* ═══════ VOICE ENGINE INTEGRATION ═══════ */

  function setupVoiceEngine() {
    if (typeof VoiceEngine === 'undefined') {
      console.warn('[ChatUI2D] VoiceEngine not available');
      return;
    }

    VoiceEngine.onAudioLevel(function(data) {
      state.audioLevel = data.level;
      updateVoiceUI();
    });

    VoiceEngine.onPeerConnect(function(data) {
      state.voiceConnected = true;
      updateVoiceUI();

      // Add to user list
      var peerData = data.peerData;
      if (peerData) {
        state.users.set(peerData.userId, {
          id: peerData.userId,
          name: peerData.displayName,
          status: 'voice',
          muted: peerData.muted
        });
        updateUserList();
      }
    });

    VoiceEngine.onPeerDisconnect(function(data) {
      // Update user status
      var user = state.users.get(data.peerId);
      if (user) {
        user.status = 'online';
        updateUserList();
      }

      // Check if any peers remain
      if (VoiceEngine.getPeers && VoiceEngine.getPeers().length === 0) {
        state.voiceConnected = false;
        updateVoiceUI();
      }
    });
  }

  function joinZone(zoneId) {
    if (typeof ChatEngine !== 'undefined') {
      ChatEngine.joinRoom(zoneId, {
        id: state.userId,
        name: state.userName,
        avatarUrl: state.avatarUrl
      });
    }

    if (typeof VoiceEngine !== 'undefined') {
      VoiceEngine.joinZone(zoneId);
    }
  }

  /* ═══════ INITIALIZATION ═══════ */

  function init(options) {
    if (state.initialized) {
      console.warn('[ChatUI2D] Already initialized');
      return;
    }

    options = options || {};

    // Set user info
    state.userId = options.userId || 'user_' + Date.now();
    state.userName = options.userName || 'Anonymous';
    state.avatarUrl = options.avatarUrl || null;

    // Detect zone from URL
    state.currentZone = options.zone || detectZoneFromUrl();

    // Create DOM elements
    elements.drawer = createChatDrawer();
    elements.toggleBtn = createToggleButton();
    elements.contextMenu = createContextMenu();
    elements.toast = createToast();

    // Cache element references
    elements.zoneSelector = document.getElementById('vr-zone-selector');
    elements.messages = document.getElementById('vr-chat-messages');
    elements.input = document.getElementById('vr-chat-input');
    elements.userList = document.getElementById('vr-user-list');
    elements.typingIndicator = document.getElementById('vr-typing-indicator');
    elements.emojiPicker = document.getElementById('vr-emoji-picker');
    elements.muteBtn = document.getElementById('vr-mute-btn');
    elements.pttBtn = document.getElementById('vr-ptt-btn');

    // Set initial zone
    updateZoneSelector();
    document.getElementById('vr-chat-title').textContent = getZoneName(state.currentZone);

    // Add to DOM
    document.body.appendChild(elements.drawer);
    document.body.appendChild(elements.toggleBtn);
    document.body.appendChild(elements.contextMenu);
    document.body.appendChild(elements.toast);

    // Setup event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Setup engines
    setupChatEngine();
    setupVoiceEngine();

    // Join initial zone
    joinZone(state.currentZone);

    state.initialized = true;
    console.log('[ChatUI2D] Initialized for user:', state.userId);

    return ChatUI2D;
  }

  function destroy() {
    if (!state.initialized) return;

    // Leave zone
    if (state.currentZone) {
      if (typeof ChatEngine !== 'undefined') {
        ChatEngine.leaveRoom(state.currentZone);
      }
      if (typeof VoiceEngine !== 'undefined') {
        VoiceEngine.leaveZone(state.currentZone);
      }
    }

    // Remove event listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    // Remove DOM elements
    if (elements.drawer) elements.drawer.remove();
    if (elements.toggleBtn) elements.toggleBtn.remove();
    if (elements.contextMenu) elements.contextMenu.remove();
    if (elements.toast) elements.toast.remove();

    // Reset state
    state = {
      isOpen: false,
      isMinimized: false,
      currentZone: null,
      userId: null,
      userName: null,
      avatarUrl: null,
      messages: [],
      users: new Map(),
      typingUsers: new Set(),
      unreadCount: 0,
      isTyping: false,
      typingTimer: null,
      voiceMuted: true,
      voiceConnected: false,
      pushToTalkActive: false,
      audioLevel: 0,
      volume: 80,
      emojiPickerOpen: false,
      contextMenuOpen: false,
      selectedMessageId: null,
      replyToMessageId: null,
      initialized: false
    };

    elements = {};

    console.log('[ChatUI2D] Destroyed');
  }

  /* ═══════ PUBLIC API ═══════ */

  window.ChatUI2D = {
    init: init,
    destroy: destroy,
    open: function() {
      if (!state.isOpen) toggleDrawer();
    },
    close: function() {
      if (state.isOpen) closeDrawer();
    },
    toggle: toggleDrawer,
    sendMessage: sendMessage,
    setZone: function(zoneId) {
      if (elements.zoneSelector) {
        elements.zoneSelector.value = zoneId;
        onZoneChange({ target: elements.zoneSelector });
      }
    },
    getZone: function() {
      return state.currentZone;
    },
    setMute: function(muted) {
      state.voiceMuted = muted;
      updateVoiceUI();
    },
    isMuted: function() {
      return state.voiceMuted;
    },
    showToast: showToast,
    CONFIG: CONFIG,
    state: state // Expose for debugging
  };

})();
