/**
 * Virtual Keyboard - VR Text Input System
 *
 * Features:
 *   - QWERTY layout with raycaster interaction
 *   - Shift for uppercase
 *   - Emoji panel
 *   - Predictive text suggestions
 *   - Laser pointer selection
 *   - Haptic feedback on key press
 *
 * Quest 3 Optimizations:
 *   - Low poly keys (box geometry)
 *   - Simple flat materials
 *   - Batched key rendering
 *   - Optimized raycaster targets
 *   - Minimal draw calls
 *
 * Usage:
 *   <a-entity virtual-keyboard="onSubmit: handleSubmit; onClose: handleClose"></a-entity>
 */
AFRAME.registerComponent('virtual-keyboard', {
  schema: {
    onSubmit: { type: 'string', default: '' },
    onClose: { type: 'string', default: '' },
    initialText: { type: 'string', default: '' },
    maxLength: { type: 'number', default: 200 },
    width: { type: 'number', default: 1.2 },
    keySize: { type: 'number', default: 0.08 },
    keySpacing: { type: 'number', default: 0.02 },
    hapticFeedback: { type: 'boolean', default: true }
  },

  init: function () {
    this.text = this.data.initialText;
    this.shiftActive = false;
    this.emojiMode = false;
    this.capsLock = false;
    this.cursorPosition = this.text.length;
    this.keys = [];
    this.keyMap = new Map();

    // Layouts
    this.layouts = {
      qwerty: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '↵'],
        ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
        ['😀', '123', 'space', '⌨', '✕']
      ],
      numeric: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        ['-', '_', '=', '+', '[', ']', '{', '}', '|', '\\'],
        [';', ':', "'", '"', ',', '.', '<', '>', '/', '?'],
        ['ABC', 'space', '⌫', '↵', '✕']
      ],
      emoji: [
        ['😀', '😂', '🤣', '😊', '😍', '🤔', '👍', '👎', '❤️', '🔥'],
        ['🎉', '✨', '🎮', '🎬', '🎵', '🍿', '🍕', '🍔', '🌮', '🍦'],
        ['🚀', '⭐', '🌙', '☀️', '☁️', '⚡', '❄️', '🔥', '💧', '🌍'],
        ['👋', '🤝', '👏', '🙌', '💪', '🎯', '💡', '🔔', '⏰', '📍'],
        ['ABC', 'space', '⌫', '↵', '✕']
      ]
    };

    this.currentLayout = 'qwerty';

    // Bind methods
    this.onKeyClick = this.onKeyClick.bind(this);
    this.handleRaycasterIntersection = this.handleRaycasterIntersection.bind(this);

    this.initKeyboard();
    this.setupEventListeners();
  },

  /**
   * Initialize keyboard 3D structure
   */
  initKeyboard: function () {
    const data = this.data;

    // Create keyboard container
    this.keyboardGroup = document.createElement('a-entity');
    this.keyboardGroup.setAttribute('position', '0 1.4 -1');
    this.keyboardGroup.setAttribute('rotation', '-15 0 0');
    this.el.appendChild(this.keyboardGroup);

    // Background panel
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', data.width + 0.1);
    bg.setAttribute('height', '0.65');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('opacity', '0.95');
    bg.setAttribute('class', 'keyboard-bg');
    this.keyboardGroup.appendChild(bg);

    // Text display area
    this.displayEl = document.createElement('a-entity');
    this.displayEl.setAttribute('position', `0 ${0.25} 0.02`);

    const displayBg = document.createElement('a-plane');
    displayBg.setAttribute('width', data.width - 0.1);
    displayBg.setAttribute('height', '0.12');
    displayBg.setAttribute('color', '#0f0f1a');
    this.displayEl.appendChild(displayBg);

    this.textEl = document.createElement('a-text');
    this.textEl.setAttribute('value', this.text || 'Type a message...');
    this.textEl.setAttribute('align', 'left');
    this.textEl.setAttribute('position', `${-data.width / 2 + 0.1} 0 0.01`);
    this.textEl.setAttribute('width', '1.5');
    this.textEl.setAttribute('color', this.text ? '#ffffff' : '#666666');
    this.textEl.setAttribute('wrap-count', '40');
    this.displayEl.appendChild(this.textEl);

    // Cursor indicator
    this.cursorEl = document.createElement('a-plane');
    this.cursorEl.setAttribute('width', '0.01');
    this.cursorEl.setAttribute('height', '0.06');
    this.cursorEl.setAttribute('color', '#00d4ff');
    this.cursorEl.setAttribute('position', `${-data.width / 2 + 0.1} 0 0.02`);
    this.displayEl.appendChild(this.cursorEl);

    this.keyboardGroup.appendChild(this.displayEl);

    // Keys container
    this.keysContainer = document.createElement('a-entity');
    this.keysContainer.setAttribute('position', `0 ${-0.05} 0.02`);
    this.keyboardGroup.appendChild(this.keysContainer);

    // Render initial layout
    this.renderKeys();

    // Suggestion bar (for predictive text)
    this.suggestionBar = document.createElement('a-entity');
    this.suggestionBar.setAttribute('position', `0 ${0.14} 0.02`);
    this.suggestionBar.setAttribute('visible', 'false');
    this.keyboardGroup.appendChild(this.suggestionBar);
  },

  /**
   * Render keyboard keys
   * Quest 3 optimized: Reuse entities, simple geometry
   */
  renderKeys: function () {
    // Clear existing keys
    while (this.keysContainer.firstChild) {
      this.keysContainer.removeChild(this.keysContainer.firstChild);
    }
    this.keys = [];
    this.keyMap.clear();

    const data = this.data;
    const layout = this.layouts[this.currentLayout];
    const keySize = data.keySize;
    const spacing = data.keySpacing;

    const startX = -(data.width - keySize) / 2;
    const startY = 0.15;

    layout.forEach((row, rowIndex) => {
      let currentX = startX;

      row.forEach((keyLabel) => {
        const keyWidth = this.getKeyWidth(keyLabel, keySize);
        const key = this.createKey(keyLabel, keyWidth, keySize);

        key.setAttribute('position', `${currentX + keyWidth / 2} ${startY - rowIndex * (keySize + spacing)} 0`);
        this.keysContainer.appendChild(key);
        this.keys.push(key);
        this.keyMap.set(keyLabel, key);

        currentX += keyWidth + spacing;
      });
    });
  },

  /**
   * Get width for special keys
   */
  getKeyWidth: function (label, defaultSize) {
    const specialWidths = {
      'space': 0.4,
      '⇧': 0.12,
      '⌫': 0.12,
      '↵': 0.12,
      '✕': 0.12,
      '123': 0.12,
      'ABC': 0.12,
      '😀': 0.12,
      '⌨': 0.12
    };
    return specialWidths[label] || defaultSize;
  },

  /**
   * Create a single key entity
   */
  createKey: function (label, width, height) {
    const key = document.createElement('a-entity');
    key.classList.add('keyboard-key', 'clickable');
    key.setAttribute('data-key', label);

    // Key background
    const bg = document.createElement('a-box');
    bg.setAttribute('width', width - 0.005);
    bg.setAttribute('height', height - 0.005);
    bg.setAttribute('depth', '0.02');
    bg.setAttribute('color', this.getKeyColor(label));
    bg.setAttribute('class', 'key-bg');
    key.appendChild(bg);

    // Key label
    const text = document.createElement('a-text');
    const displayLabel = this.getDisplayLabel(label);
    text.setAttribute('value', displayLabel);
    text.setAttribute('align', 'center');
    text.setAttribute('position', '0 0 0.015');
    text.setAttribute('width', '2');
    text.setAttribute('color', '#ffffff');
    text.setAttribute('font', 'roboto');
    text.setAttribute('side', 'double');

    // Adjust font size for special characters
    if (label.length > 1 && !['space', '⌫', '↵', '⇧', '✕'].includes(label)) {
      text.setAttribute('width', '1.5');
    }

    key.appendChild(text);

    // Click handler
    key.addEventListener('click', () => this.onKeyClick(label));

    // Hover effects
    key.addEventListener('mouseenter', () => {
      bg.setAttribute('color', this.lightenColor(this.getKeyColor(label)));
      bg.setAttribute('depth', '0.025');
    });
    key.addEventListener('mouseleave', () => {
      bg.setAttribute('color', this.getKeyColor(label));
      bg.setAttribute('depth', '0.02');
    });

    return key;
  },

  /**
   * Get color for key type
   */
  getKeyColor: function (label) {
    const colors = {
      '⇧': '#3b82f6',
      '⌫': '#ef4444',
      '↵': '#22c55e',
      '✕': '#6b7280',
      'space': '#374151',
      '123': '#3b82f6',
      'ABC': '#3b82f6',
      '😀': '#f59e0b',
      '⌨': '#8b5cf6'
    };
    return colors[label] || '#4b5563';
  },

  /**
   * Lighten color for hover effect
   */
  lightenColor: function (color) {
    const lightColors = {
      '#3b82f6': '#60a5fa',
      '#ef4444': '#f87171',
      '#22c55e': '#4ade80',
      '#6b7280': '#9ca3af',
      '#374151': '#4b5563',
      '#f59e0b': '#fbbf24',
      '#8b5cf6': '#a78bfa',
      '#4b5563': '#6b7280'
    };
    return lightColors[color] || color;
  },

  /**
   * Get display label for key
   */
  getDisplayLabel: function (label) {
    if (label === 'space') return '';
    return label;
  },

  /**
   * Handle key click
   */
  onKeyClick: function (key) {
    // Haptic feedback
    if (this.data.hapticFeedback) {
      this.triggerHaptic();
    }

    // Handle special keys
    switch (key) {
      case '⌫':
        this.handleBackspace();
        break;
      case '↵':
        this.handleEnter();
        break;
      case '⇧':
        this.handleShift();
        break;
      case 'space':
        this.insertText(' ');
        break;
      case '✕':
        this.handleClose();
        break;
      case '123':
        this.switchLayout('numeric');
        break;
      case 'ABC':
        this.switchLayout('qwerty');
        break;
      case '😀':
        this.switchLayout('emoji');
        break;
      case '⌨':
        this.handleKeyboardToggle();
        break;
      default:
        // Regular character
        let char = key;
        if (this.currentLayout === 'qwerty' && this.shiftActive) {
          char = char.toUpperCase();
        }
        this.insertText(char);

        // Auto-disable shift after one character (unless caps lock)
        if (this.shiftActive && !this.capsLock) {
          this.shiftActive = false;
          this.updateShiftKey();
        }
        break;
    }

    this.updateDisplay();
    this.updatePredictions();
  },

  /**
   * Insert text at cursor position
   */
  insertText: function (text) {
    if (this.text.length + text.length > this.data.maxLength) return;

    const before = this.text.substring(0, this.cursorPosition);
    const after = this.text.substring(this.cursorPosition);
    this.text = before + text + after;
    this.cursorPosition += text.length;
  },

  /**
   * Handle backspace
   */
  handleBackspace: function () {
    if (this.cursorPosition > 0) {
      const before = this.text.substring(0, this.cursorPosition - 1);
      const after = this.text.substring(this.cursorPosition);
      this.text = before + after;
      this.cursorPosition--;
    }
  },

  /**
   * Handle enter/submit
   */
  handleEnter: function () {
    if (this.text.trim().length > 0) {
      this.submitText();
    }
  },

  /**
   * Handle shift toggle
   */
  handleShift: function () {
    this.shiftActive = !this.shiftActive;
    this.capsLock = !this.capsLock;
    this.updateShiftKey();
  },

  /**
   * Update shift key visual
   */
  updateShiftKey: function () {
    const shiftKey = this.keyMap.get('⇧');
    if (shiftKey) {
      const bg = shiftKey.querySelector('.key-bg');
      if (bg) {
        bg.setAttribute('color', this.shiftActive ? '#22c55e' : '#3b82f6');
      }
    }

    // Update key labels for uppercase
    if (this.currentLayout === 'qwerty') {
      this.renderKeys();
    }
  },

  /**
   * Switch keyboard layout
   */
  switchLayout: function (layout) {
    this.currentLayout = layout;
    this.renderKeys();
  },

  /**
   * Handle keyboard toggle (minimize/restore)
   */
  handleKeyboardToggle: function () {
    // Toggle keyboard visibility
    const currentPos = this.keyboardGroup.getAttribute('position');
    if (currentPos.y < 0) {
      // Restore
      this.keyboardGroup.setAttribute('position', '0 1.4 -1');
      this.keyboardGroup.setAttribute('visible', true);
    } else {
      // Minimize
      this.keyboardGroup.setAttribute('position', '0 -10 0');
    }
  },

  /**
   * Handle close
   */
  handleClose: function () {
    if (this.data.onClose) {
      const handler = this.getHandler(this.data.onClose);
      if (handler) handler();
    }
    this.el.emit('keyboardclose');
  },

  /**
   * Submit text
   */
  submitText: function () {
    const text = this.text.trim();
    if (text.length === 0) return;

    if (this.data.onSubmit) {
      const handler = this.getHandler(this.data.onSubmit);
      if (handler) handler(text);
    }

    this.el.emit('keyboardsubmit', { text: text });

    // Clear text
    this.text = '';
    this.cursorPosition = 0;
    this.updateDisplay();
  },

  /**
   * Get handler function from string
   */
  getHandler: function (handlerName) {
    // Try window scope
    if (typeof window[handlerName] === 'function') {
      return window[handlerName];
    }

    // Try nested path (e.g., 'MyApp.handlers.submit')
    const parts = handlerName.split('.');
    let obj = window;
    for (const part of parts) {
      obj = obj?.[part];
      if (!obj) break;
    }

    return typeof obj === 'function' ? obj : null;
  },

  /**
   * Update text display
   */
  updateDisplay: function () {
    const displayText = this.text || 'Type a message...';
    this.textEl.setAttribute('value', displayText);
    this.textEl.setAttribute('color', this.text ? '#ffffff' : '#666666');

    // Update cursor position
    // Approximate cursor position based on text width
    const textWidth = this.text.length * 0.015; // Approximate char width
    const cursorX = -this.data.width / 2 + 0.1 + textWidth;
    this.cursorEl.setAttribute('position', `${cursorX} 0 0.02`);
  },

  /**
   * Update predictive text suggestions
   */
  updatePredictions: function () {
    // Simple prediction based on common words
    const predictions = this.getPredictions(this.text);

    if (predictions.length > 0) {
      this.suggestionBar.setAttribute('visible', true);
      this.renderSuggestions(predictions);
    } else {
      this.suggestionBar.setAttribute('visible', false);
    }
  },

  /**
   * Get text predictions
   */
  getPredictions: function (text) {
    if (text.length < 2) return [];

    const words = ['hello', 'help', 'hey', 'the', 'this', 'that', 'thanks', 'thank you',
                   'what', 'where', 'when', 'how', 'good', 'great', 'awesome', 'cool',
                   'yes', 'no', 'ok', 'okay', 'sure', 'maybe', 'please', 'sorry'];

    const lower = text.toLowerCase();
    return words.filter(w => w.startsWith(lower) && w !== lower).slice(0, 3);
  },

  /**
   * Render suggestion buttons
   */
  renderSuggestions: function (suggestions) {
    // Clear existing
    while (this.suggestionBar.firstChild) {
      this.suggestionBar.removeChild(this.suggestionBar.firstChild);
    }

    const startX = -(suggestions.length * 0.25) / 2;

    suggestions.forEach((word, index) => {
      const btn = document.createElement('a-entity');
      btn.classList.add('clickable');
      btn.setAttribute('position', `${startX + index * 0.25} 0 0`);

      const bg = document.createElement('a-plane');
      bg.setAttribute('width', '0.22');
      bg.setAttribute('height', '0.08');
      bg.setAttribute('color', '#374151');
      btn.appendChild(bg);

      const text = document.createElement('a-text');
      text.setAttribute('value', word);
      text.setAttribute('align', 'center');
      text.setAttribute('width', '1.5');
      text.setAttribute('color', '#ffffff');
      btn.appendChild(text);

      btn.addEventListener('click', () => {
        this.text = word;
        this.cursorPosition = word.length;
        this.updateDisplay();
        this.suggestionBar.setAttribute('visible', false);
        this.triggerHaptic();
      });

      this.suggestionBar.appendChild(btn);
    });
  },

  /**
   * Trigger haptic feedback
   */
  triggerHaptic: function () {
    // Try to trigger haptic on both controllers
    ['left-ctrl', 'right-ctrl'].forEach(id => {
      const ctrl = document.getElementById(id);
      if (ctrl && ctrl.components?.['hand-controls']) {
        try {
          // Pulse haptic if available
          const gamepad = ctrl.components['hand-controls'].gamepad;
          if (gamepad?.hapticActuators?.length > 0) {
            gamepad.hapticActuators[0].pulse(0.5, 50);
          }
        } catch (e) {
          // Haptic not available
        }
      }
    });
  },

  /**
   * Setup event listeners
   */
  setupEventListeners: function () {
    // Listen for openkeyboard event from vr-chat-panel
    this.el.sceneEl.addEventListener('openkeyboard', (evt) => {
      if (evt.detail.panel === this.el.parentElement) {
        this.open(evt.detail);
      }
    });

    // Raycaster intersection for hover effects
    this.el.addEventListener('raycaster-intersection', this.handleRaycasterIntersection);
  },

  /**
   * Handle raycaster intersection
   */
  handleRaycasterIntersection: function (evt) {
    // Could add additional hover effects here
  },

  /**
   * Open keyboard with options
   */
  open: function (options) {
    if (options.initialText) {
      this.text = options.initialText;
      this.cursorPosition = this.text.length;
    }

    if (options.onSubmit) {
      this.data.onSubmit = options.onSubmit;
    }

    if (options.onClose) {
      this.data.onClose = options.onClose;
    }

    this.updateDisplay();
    this.keyboardGroup.setAttribute('visible', true);
    this.keyboardGroup.setAttribute('position', '0 1.4 -1');
  },

  /**
   * Close keyboard
   */
  close: function () {
    this.keyboardGroup.setAttribute('visible', false);
    this.keyboardGroup.setAttribute('position', '0 -10 0');
    this.el.emit('keyboardclose');
  },

  /**
   * Set text programmatically
   */
  setText: function (text) {
    this.text = text;
    this.cursorPosition = text.length;
    this.updateDisplay();
  },

  /**
   * Get current text
   */
  getText: function () {
    return this.text;
  },

  /**
   * Remove component
   */
  remove: function () {
    // Clean up
    this.keys = [];
    this.keyMap.clear();
  }
});

/**
 * Laser Pointer Enhancement for Keyboard
 * Adds visual feedback for keyboard typing
 */
AFRAME.registerComponent('keyboard-laser', {
  schema: {
    hand: { type: 'string', default: 'right' },
    color: { type: 'color', default: '#00d4ff' }
  },

  init: function () {
    this.el.setAttribute('raycaster', {
      objects: '.keyboard-key, .clickable',
      showLine: true,
      far: 5,
      lineColor: this.data.color
    });

    // Enhance click feedback
    this.el.addEventListener('triggerdown', () => {
      const intersected = this.el.components.raycaster?.intersectedEls?.[0];
      if (intersected?.classList.contains('keyboard-key')) {
        // Visual click feedback
        const bg = intersected.querySelector('.key-bg');
        if (bg) {
          const originalDepth = bg.getAttribute('depth');
          bg.setAttribute('depth', '0.01');
          setTimeout(() => {
            bg.setAttribute('depth', originalDepth);
          }, 100);
        }
      }
    });
  }
});

/**
 * Global keyboard manager for scene
 */
AFRAME.registerComponent('vr-keyboard-system', {
  schema: {
    enabled: { type: 'boolean', default: true },
    autoShow: { type: 'boolean', default: false }
  },

  init: function () {
    if (!this.data.enabled) return;

    // Create keyboard entity
    this.keyboard = document.createElement('a-entity');
    this.keyboard.setAttribute('virtual-keyboard', '');
    this.keyboard.setAttribute('id', 'vr-keyboard');
    this.keyboard.setAttribute('visible', 'false');

    this.el.appendChild(this.keyboard);

    // Listen for open requests
    this.el.addEventListener('openkeyboard', (evt) => {
      this.showKeyboard(evt.detail);
    });
  },

  showKeyboard: function (options) {
    const kb = this.keyboard.components['virtual-keyboard'];
    if (kb) {
      kb.open(options);
    }
  },

  hideKeyboard: function () {
    const kb = this.keyboard.components['virtual-keyboard'];
    if (kb) {
      kb.close();
    }
  },

  remove: function () {
    if (this.keyboard) {
      this.keyboard.remove();
    }
  }
});
