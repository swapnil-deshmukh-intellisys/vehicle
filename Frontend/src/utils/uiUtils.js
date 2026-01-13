// Comprehensive UI utility functions

// Theme Management Class
export class ThemeManager {
  constructor(options = {}) {
    this.themes = new Map();
    this.currentTheme = options.defaultTheme || 'light';
    this.storageKey = options.storageKey || 'app-theme';
    this.systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
    this.listeners = new Set();
    
    this.setupDefaultThemes();
    this.loadTheme();
    this.setupSystemPreferenceListener();
  }

  // Setup default themes
  setupDefaultThemes() {
    this.addTheme('light', {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
      shadow: 'rgba(0, 0, 0, 0.1)',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    });

    this.addTheme('dark', {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#333333',
      shadow: 'rgba(0, 0, 0, 0.3)',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    });

    this.addTheme('auto', {
      primary: 'var(--primary)',
      secondary: 'var(--secondary)',
      background: 'var(--background)',
      surface: 'var(--surface)',
      text: 'var(--text)',
      textSecondary: 'var(--text-secondary)',
      border: 'var(--border)',
      shadow: 'var(--shadow)',
      gradient: 'var(--gradient)'
    });
  }

  // Add custom theme
  addTheme(name, colors) {
    this.themes.set(name, colors);
  }

  // Set theme
  setTheme(themeName) {
    if (!this.themes.has(themeName)) {
      console.warn(`Theme '${themeName}' not found`);
      return;
    }

    const oldTheme = this.currentTheme;
    this.currentTheme = themeName;
    
    if (themeName === 'auto') {
      this.applySystemTheme();
    } else {
      this.applyTheme(this.themes.get(themeName));
    }

    this.saveTheme(themeName);
    this.notifyListeners(themeName, oldTheme);
  }

  // Apply theme colors
  applyTheme(colors) {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  // Apply system theme
  applySystemTheme() {
    const prefersDark = this.systemPreference.matches;
    const systemTheme = prefersDark ? 'dark' : 'light';
    const colors = this.themes.get(systemTheme);
    if (colors) {
      this.applyTheme(colors);
    }
  }

  // Setup system preference listener
  setupSystemPreferenceListener() {
    this.systemPreference.addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.applySystemTheme();
      }
    });
  }

  // Save theme to storage
  saveTheme(themeName) {
    localStorage.setItem(this.storageKey, themeName);
  }

  // Load theme from storage
  loadTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);
    if (savedTheme && this.themes.has(savedTheme)) {
      this.setTheme(savedTheme);
    }
  }

  // Add theme change listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(newTheme, oldTheme) {
    this.listeners.forEach(callback => {
      try {
        callback(newTheme, oldTheme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }

  // Get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Get available themes
  getAvailableThemes() {
    return Array.from(this.themes.keys());
  }

  // Get theme colors
  getThemeColors(themeName) {
    return this.themes.get(themeName);
  }
}

// Responsive Design Manager
export class ResponsiveManager {
  constructor(options = {}) {
    this.breakpoints = {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
      ...options.breakpoints
    };
    
    this.currentBreakpoint = null;
    this.listeners = new Set();
    this.mediaQueries = new Map();
    
    this.setupMediaQueries();
    this.updateCurrentBreakpoint();
  }

  // Setup media queries
  setupMediaQueries() {
    Object.entries(this.breakpoints).forEach(([name, minWidth]) => {
      const maxWidth = this.getNextBreakpoint(name);
      const query = maxWidth 
        ? `(min-width: ${minWidth}px) and (max-width: ${maxWidth - 1}px)`
        : `(min-width: ${minWidth}px)`;
      
      const mq = window.matchMedia(query);
      mq.addEventListener('change', () => this.updateCurrentBreakpoint());
      this.mediaQueries.set(name, mq);
    });
  }

  // Get next breakpoint
  getNextBreakpoint(current) {
    const breakpointNames = Object.keys(this.breakpoints).sort((a, b) => 
      this.breakpoints[a] - this.breakpoints[b]
    );
    const currentIndex = breakpointNames.indexOf(current);
    return currentIndex < breakpointNames.length - 1 
      ? this.breakpoints[breakpointNames[currentIndex + 1]]
      : null;
  }

  // Update current breakpoint
  updateCurrentBreakpoint() {
    const oldBreakpoint = this.currentBreakpoint;
    
    for (const [name, mq] of this.mediaQueries) {
      if (mq.matches) {
        this.currentBreakpoint = name;
        break;
      }
    }

    if (oldBreakpoint !== this.currentBreakpoint) {
      this.notifyListeners(this.currentBreakpoint, oldBreakpoint);
    }
  }

  // Add breakpoint change listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(newBreakpoint, oldBreakpoint) {
    this.listeners.forEach(callback => {
      try {
        callback(newBreakpoint, oldBreakpoint);
      } catch (error) {
        console.error('Responsive listener error:', error);
      }
    });
  }

  // Get current breakpoint
  getCurrentBreakpoint() {
    return this.currentBreakpoint;
  }

  // Check if breakpoint matches
  isBreakpoint(breakpointName) {
    return this.currentBreakpoint === breakpointName;
  }

  // Check if breakpoint is up (>=)
  isBreakpointUp(breakpointName) {
    const breakpointNames = Object.keys(this.breakpoints).sort((a, b) => 
      this.breakpoints[a] - this.breakpoints[b]
    );
    const currentIndex = breakpointNames.indexOf(this.currentBreakpoint);
    const targetIndex = breakpointNames.indexOf(breakpointName);
    return currentIndex >= targetIndex;
  }

  // Check if breakpoint is down (<=)
  isBreakpointDown(breakpointName) {
    const breakpointNames = Object.keys(this.breakpoints).sort((a, b) => 
      this.breakpoints[a] - this.breakpoints[b]
    );
    const currentIndex = breakpointNames.indexOf(this.currentBreakpoint);
    const targetIndex = breakpointNames.indexOf(breakpointName);
    return currentIndex <= targetIndex;
  }

  // Get breakpoint value
  getBreakpointValue(breakpointName) {
    return this.breakpoints[breakpointName];
  }
}

// Animation Manager
export class AnimationManager {
  constructor(options = {}) {
    this.animations = new Map();
    this.defaultDuration = options.defaultDuration || 300;
    this.defaultEasing = options.defaultEasing || 'ease';
    this.queue = [];
    this.isProcessing = false;
  }

  // Add animation preset
  addAnimation(name, config) {
    this.animations.set(name, {
      duration: config.duration || this.defaultDuration,
      easing: config.easing || this.defaultEasing,
      delay: config.delay || 0,
      fill: config.fill || 'forwards',
      ...config
    });
  }

  // Setup default animations
  setupDefaultAnimations() {
    this.addAnimation('fadeIn', {
      keyframes: [
        { opacity: 0 },
        { opacity: 1 }
      ]
    });

    this.addAnimation('fadeOut', {
      keyframes: [
        { opacity: 1 },
        { opacity: 0 }
      ]
    });

    this.addAnimation('slideUp', {
      keyframes: [
        { transform: 'translateY(20px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ]
    });

    this.addAnimation('slideDown', {
      keyframes: [
        { transform: 'translateY(-20px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ]
    });

    this.addAnimation('scaleIn', {
      keyframes: [
        { transform: 'scale(0.8)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ]
    });

    this.addAnimation('scaleOut', {
      keyframes: [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.8)', opacity: 0 }
      ]
    });

    this.addAnimation('rotateIn', {
      keyframes: [
        { transform: 'rotate(-180deg) scale(0.8)', opacity: 0 },
        { transform: 'rotate(0deg) scale(1)', opacity: 1 }
      ]
    });

    this.addAnimation('bounce', {
      keyframes: [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' }
      ],
      duration: 500,
      easing: 'ease-in-out'
    });
  }

  // Animate element
  animate(element, animationName, options = {}) {
    const animation = this.animations.get(animationName);
    if (!animation) {
      console.warn(`Animation '${animationName}' not found`);
      return Promise.reject(new Error(`Animation '${animationName}' not found`));
    }

    const config = {
      ...animation,
      ...options
    };

    return element.animate(config.keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      fill: config.fill
    }).finished;
  }

  // Queue animation
  queueAnimation(element, animationName, options = {}) {
    this.queue.push({ element, animationName, options });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process animation queue
  async processQueue() {
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const { element, animationName, options } = this.queue.shift();
      try {
        await this.animate(element, animationName, options);
      } catch (error) {
        console.error('Animation queue error:', error);
      }
    }
    
    this.isProcessing = false;
  }

  // Clear animation queue
  clearQueue() {
    this.queue = [];
  }

  // Get animation duration
  getAnimationDuration(animationName) {
    const animation = this.animations.get(animationName);
    return animation ? animation.duration : this.defaultDuration;
  }
}

// Notification Manager
export class NotificationManager {
  constructor(options = {}) {
    this.notifications = new Map();
    this.container = options.container || this.createContainer();
    this.maxNotifications = options.maxNotifications || 5;
    this.defaultDuration = options.defaultDuration || 5000;
    this.listeners = new Set();
    this.idCounter = 0;
  }

  // Create notification container
  createContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  // Show notification
  show(message, options = {}) {
    const id = ++this.idCounter;
    const notification = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      persistent: options.persistent || false,
      actions: options.actions || [],
      ...options
    };

    this.notifications.set(id, notification);
    this.renderNotification(notification);
    this.notifyListeners('show', notification);

    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => this.hide(id), notification.duration);
    }

    return id;
  }

  // Hide notification
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        element.remove();
        this.notifications.delete(id);
        this.notifyListeners('hide', notification);
      }, 300);
    }
  }

  // Render notification
  renderNotification(notification) {
    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = `notification notification-${notification.type}`;
    element.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
      pointer-events: auto;
      animation: slideInRight 0.3s ease-out;
    `;

    element.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${notification.message}</div>
        ${notification.actions.length > 0 ? `
          <div class="notification-actions">
            ${notification.actions.map(action => `
              <button class="notification-action" data-action="${action.id}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${!notification.persistent ? `
        <button class="notification-close">&times;</button>
      ` : ''}
    `;

    // Add event listeners
    const closeBtn = element.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide(notification.id));
    }

    const actionBtns = element.querySelectorAll('.notification-action');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.dataset.action;
        const action = notification.actions.find(a => a.id === actionId);
        if (action && action.handler) {
          action.handler(notification);
        }
        this.hide(notification.id);
      });
    });

    this.container.appendChild(element);

    // Remove oldest notifications if too many
    if (this.notifications.size > this.maxNotifications) {
      const oldestId = Math.min(...this.notifications.keys());
      this.hide(oldestId);
    }
  }

  // Add notification listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event, notification) {
    this.listeners.forEach(callback => {
      try {
        callback(event, notification);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  // Clear all notifications
  clear() {
    this.notifications.forEach((_, id) => this.hide(id));
  }

  // Get active notifications
  getActiveNotifications() {
    return Array.from(this.notifications.values());
  }
}

// Modal Manager
export class ModalManager {
  constructor(options = {}) {
    this.modals = new Map();
    this.stack = [];
    this.listeners = new Set();
    this.defaultOptions = {
      closeOnEscape: true,
      closeOnOverlay: true,
      preventBodyScroll: true,
      ...options
    };
    this.idCounter = 0;

    this.setupGlobalListeners();
  }

  // Setup global listeners
  setupGlobalListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.stack.length > 0) {
        const topModal = this.stack[this.stack.length - 1];
        if (topModal.closeOnEscape) {
          this.close(topModal.id);
        }
      }
    });
  }

  // Open modal
  open(content, options = {}) {
    const id = ++this.idCounter;
    const modal = {
      id,
      content,
      ...this.defaultOptions,
      ...options
    };

    this.modals.set(id, modal);
    this.stack.push(modal);
    this.renderModal(modal);
    this.notifyListeners('open', modal);

    if (modal.preventBodyScroll) {
      document.body.style.overflow = 'hidden';
    }

    return id;
  }

  // Close modal
  close(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    const element = document.getElementById(`modal-${id}`);
    if (element) {
      element.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        element.remove();
        this.modals.delete(id);
        this.stack = this.stack.filter(m => m.id !== id);
        this.notifyListeners('close', modal);

        if (this.stack.length === 0 && modal.preventBodyScroll) {
          document.body.style.overflow = '';
        }
      }, 300);
    }
  }

  // Render modal
  renderModal(modal) {
    const element = document.createElement('div');
    element.id = `modal-${modal.id}`;
    element.className = 'modal-overlay';
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    `;

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      animation: scaleIn 0.3s ease-out;
    `;

    if (typeof modal.content === 'string') {
      content.innerHTML = modal.content;
    } else if (modal.content instanceof HTMLElement) {
      content.appendChild(modal.content);
    }

    element.appendChild(content);

    // Add overlay click handler
    if (modal.closeOnOverlay) {
      element.addEventListener('click', (e) => {
        if (e.target === element) {
          this.close(modal.id);
        }
      });
    }

    document.body.appendChild(element);
  }

  // Add modal listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event, modal) {
    this.listeners.forEach(callback => {
      try {
        callback(event, modal);
      } catch (error) {
        console.error('Modal listener error:', error);
      }
    });
  }

  // Close all modals
  closeAll() {
    this.stack.forEach(modal => this.close(modal.id));
  }

  // Get active modals
  getActiveModals() {
    return [...this.stack];
  }

  // Get top modal
  getTopModal() {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }
}

// Create global instances
export const themeManager = new ThemeManager();
export const responsiveManager = new ResponsiveManager();
export const animationManager = new AnimationManager();
export const notificationManager = new NotificationManager();
export const modalManager = new ModalManager();

// Setup default animations
animationManager.setupDefaultAnimations();

// Initialize UI system
export const initializeUI = (options = {}) => {
  // Setup theme
  if (options.theme) {
    themeManager.setTheme(options.theme);
  }

  // Setup responsive breakpoints
  if (options.breakpoints) {
    responsiveManager.breakpoints = {
      ...responsiveManager.breakpoints,
      ...options.breakpoints
    };
  }

  // Setup animations
  if (options.animations) {
    Object.entries(options.animations).forEach(([name, config]) => {
      animationManager.addAnimation(name, config);
    });
  }

  return {
    theme: themeManager,
    responsive: responsiveManager,
    animation: animationManager,
    notification: notificationManager,
    modal: modalManager
  };
};
