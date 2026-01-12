// Comprehensive user experience utility functions

// User Experience Manager Class
export class UserExperienceManager {
  constructor(options = {}) {
    this.options = {
      enableTooltips: true,
      enableToasts: true,
      enableLoadingStates: true,
      enableProgressIndicators: true,
      enableGuidedTours: true,
      enableUserPreferences: true,
      enableAnalytics: true,
      ...options
    };
    
    this.preferences = new Map();
    this.tours = new Map();
    this.tooltips = new Map();
    this.loadingStates = new Map();
    this.progressIndicators = new Map();
    this.analytics = new Map();
    
    this.initialize();
  }

  // Initialize UX features
  initialize() {
    if (this.options.enableUserPreferences) {
      this.loadUserPreferences();
    }
    
    if (this.options.enableAnalytics) {
      this.setupAnalytics();
    }
    
    this.setupGlobalEventListeners();
    this.setupPerformanceMonitoring();
  }

  // Load user preferences
  loadUserPreferences() {
    const saved = localStorage.getItem('user-preferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        Object.entries(prefs).forEach(([key, value]) => {
          this.preferences.set(key, value);
        });
        this.applyPreferences();
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    }
  }

  // Save user preferences
  saveUserPreferences() {
    const prefs = Object.fromEntries(this.preferences);
    localStorage.setItem('user-preferences', JSON.stringify(prefs));
  }

  // Set user preference
  setPreference(key, value) {
    this.preferences.set(key, value);
    this.saveUserPreferences();
    this.applyPreference(key, value);
  }

  // Get user preference
  getPreference(key, defaultValue = null) {
    return this.preferences.get(key) || defaultValue;
  }

  // Apply preferences
  applyPreferences() {
    this.preferences.forEach((value, key) => {
      this.applyPreference(key, value);
    });
  }

  // Apply individual preference
  applyPreference(key, value) {
    switch (key) {
      case 'theme':
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${value}`);
        break;
        
      case 'fontSize':
        document.documentElement.style.fontSize = `${value}px`;
        break;
        
      case 'language':
        document.documentElement.lang = value;
        break;
        
      case 'animations':
        document.body.classList.toggle('no-animations', !value);
        break;
        
      case 'highContrast':
        document.body.classList.toggle('high-contrast', value);
        break;
        
      case 'reducedMotion':
        document.body.classList.toggle('reduced-motion', value);
        break;
    }
  }

  // Setup analytics
  setupAnalytics() {
    // Track page views
    this.trackEvent('page_view', {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    });

    // Track user interactions
    document.addEventListener('click', (e) => {
      const target = e.target;
      const eventData = {
        elementType: target.tagName.toLowerCase(),
        elementId: target.id,
        elementClass: target.className,
        timestamp: Date.now()
      };
      
      this.trackEvent('click', eventData);
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      this.trackEvent('form_submit', {
        formId: e.target.id,
        formClass: e.target.className,
        timestamp: Date.now()
      });
    });
  }

  // Track analytics event
  trackEvent(eventName, data) {
    if (!this.options.enableAnalytics) return;
    
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };
    
    this.analytics.set(`${eventName}_${Date.now()}`, event);
    
    // Send to analytics service (mock implementation)
    console.log('Analytics Event:', event);
  }

  // Get session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  }

  // Get user ID
  getUserId() {
    return localStorage.getItem('user-id') || 'anonymous';
  }

  // Setup global event listeners
  setupGlobalEventListeners() {
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            this.showCommandPalette();
            break;
          case '/':
            e.preventDefault();
            this.showSearch();
            break;
          case '?':
            e.preventDefault();
            this.showHelp();
            break;
        }
      }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.showNotification('Connection restored', 'success');
      this.trackEvent('connection_restored');
    });

    window.addEventListener('offline', () => {
      this.showNotification('Connection lost', 'warning');
      this.trackEvent('connection_lost');
    });
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
      };
      
      this.trackEvent('performance_metrics', metrics);
    });

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            this.trackEvent('long_task', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Show tooltip
  showTooltip(element, content, options = {}) {
    if (!this.options.enableTooltips) return;
    
    const id = this.generateId('tooltip');
    const tooltip = document.createElement('div');
    tooltip.id = id;
    tooltip.className = 'tooltip';
    tooltip.textContent = content;
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.cssText = `
      position: absolute;
      top: ${rect.top - 10}px;
      left: ${rect.left + rect.width / 2}px;
      transform: translateX(-50%) translateY(-100%);
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    // Show tooltip
    setTimeout(() => {
      tooltip.style.opacity = '1';
    }, 10);
    
    // Store reference
    this.tooltips.set(id, { element, tooltip });
    
    // Hide on mouse leave
    const hideTooltip = () => {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        tooltip.remove();
        this.tooltips.delete(id);
      }, 200);
    };
    
    element.addEventListener('mouseleave', hideTooltip, { once: true });
    
    // Auto-hide after duration
    if (options.duration) {
      setTimeout(hideTooltip, options.duration);
    }
  }

  // Show toast notification
  showToast(message, type = 'info', options = {}) {
    if (!this.options.enableToasts) return;
    
    const id = this.generateId('toast');
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        ${options.action ? `<button class="toast-action">${options.action.label}</button>` : ''}
        <button class="toast-close">&times;</button>
      </div>
    `;
    
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${this.getToastColor(type)};
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Setup event listeners
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.hideToast(id));
    
    const actionBtn = toast.querySelector('.toast-action');
    if (actionBtn && options.action.handler) {
      actionBtn.addEventListener('click', () => {
        options.action.handler();
        this.hideToast(id);
      });
    }
    
    // Auto-hide
    const duration = options.duration || 5000;
    setTimeout(() => this.hideToast(id), duration);
    
    // Store reference
    this.tooltips.set(id, { toast, type });
    
    this.trackEvent('toast_shown', { type, message });
  }

  // Hide toast
  hideToast(id) {
    const toastData = this.tooltips.get(id);
    if (toastData) {
      const { toast } = toastData;
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        toast.remove();
        this.tooltips.delete(id);
      }, 300);
    }
  }

  // Get toast color by type
  getToastColor(type) {
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336'
    };
    return colors[type] || colors.info;
  }

  // Show loading state
  showLoading(element, options = {}) {
    if (!this.options.enableLoadingStates) return;
    
    const id = this.generateId('loading');
    const loading = document.createElement('div');
    loading.id = id;
    loading.className = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        ${options.message ? `<div class="loading-message">${options.message}</div>` : ''}
      </div>
    `;
    
    loading.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    
    // Add spinner styles
    const style = document.createElement('style');
    style.textContent = `
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-message {
        margin-top: 16px;
        font-size: 14px;
        color: #666;
      }
    `;
    document.head.appendChild(style);
    
    element.style.position = element.style.position || 'relative';
    element.appendChild(loading);
    
    // Show loading
    setTimeout(() => {
      loading.style.opacity = '1';
    }, 10);
    
    // Store reference
    this.loadingStates.set(id, { element, loading });
    
    return id;
  }

  // Hide loading state
  hideLoading(id) {
    const loadingData = this.loadingStates.get(id);
    if (loadingData) {
      const { loading } = loadingData;
      loading.style.opacity = '0';
      setTimeout(() => {
        loading.remove();
        this.loadingStates.delete(id);
      }, 200);
    }
  }

  // Show progress indicator
  showProgress(element, progress, options = {}) {
    if (!this.options.enableProgressIndicators) return;
    
    const id = this.generateId('progress');
    const progressBar = document.createElement('div');
    progressBar.id = id;
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
      <div class="progress-fill" style="width: ${progress}%"></div>
      ${options.showLabel ? `<div class="progress-label">${progress}%</div>` : ''}
    `;
    
    progressBar.style.cssText = `
      width: 100%;
      height: ${options.height || '8px'};
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    `;
    
    const fillStyle = document.createElement('style');
    fillStyle.textContent = `
      .progress-fill {
        height: 100%;
        background: ${options.color || '#3498db'};
        transition: width 0.3s ease;
        border-radius: 4px;
      }
      
      .progress-label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        font-weight: bold;
        color: white;
      }
    `;
    document.head.appendChild(fillStyle);
    
    element.appendChild(progressBar);
    
    // Store reference
    this.progressIndicators.set(id, { element, progressBar });
    
    return id;
  }

  // Update progress
  updateProgress(id, progress) {
    const progressData = this.progressIndicators.get(id);
    if (progressData) {
      const { progressBar } = progressData;
      const fill = progressBar.querySelector('.progress-fill');
      const label = progressBar.querySelector('.progress-label');
      
      fill.style.width = `${progress}%`;
      if (label) {
        label.textContent = `${progress}%`;
      }
    }
  }

  // Hide progress indicator
  hideProgress(id) {
    const progressData = this.progressIndicators.get(id);
    if (progressData) {
      const { progressBar } = progressData;
      progressBar.remove();
      this.progressIndicators.delete(id);
    }
  }

  // Create guided tour
  createTour(name, steps) {
    if (!this.options.enableGuidedTours) return;
    
    const tour = {
      name,
      steps,
      currentStep: 0,
      isActive: false
    };
    
    this.tours.set(name, tour);
    return tour;
  }

  // Start tour
  startTour(name) {
    const tour = this.tours.get(name);
    if (!tour) return;
    
    tour.isActive = true;
    tour.currentStep = 0;
    this.showTourStep(tour);
    
    this.trackEvent('tour_started', { tourName: name });
  }

  // Show tour step
  showTourStep(tour) {
    if (tour.currentStep >= tour.steps.length) {
      this.endTour(tour.name);
      return;
    }
    
    const step = tour.steps[tour.currentStep];
    const element = document.querySelector(step.selector);
    
    if (!element) {
      console.warn(`Tour step element not found: ${step.selector}`);
      tour.currentStep++;
      this.showTourStep(tour);
      return;
    }
    
    // Highlight element
    element.style.outline = '3px solid #3498db';
    element.style.outlineOffset = '2px';
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.innerHTML = `
      <div class="tour-content">
        <h3>${step.title}</h3>
        <p>${step.content}</p>
        <div class="tour-actions">
          ${tour.currentStep > 0 ? '<button class="tour-prev">Previous</button>' : ''}
          <button class="tour-next">${tour.currentStep === tour.steps.length - 1 ? 'Finish' : 'Next'}</button>
          <button class="tour-skip">Skip Tour</button>
        </div>
      </div>
    `;
    
    tooltip.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 20px;
      max-width: 300px;
      z-index: 10001;
    `;
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.left = `${rect.left}px`;
    
    document.body.appendChild(tooltip);
    
    // Setup event listeners
    const nextBtn = tooltip.querySelector('.tour-next');
    nextBtn.addEventListener('click', () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
      tooltip.remove();
      tour.currentStep++;
      this.showTourStep(tour);
    });
    
    const prevBtn = tooltip.querySelector('.tour-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        element.style.outline = '';
        element.style.outlineOffset = '';
        tooltip.remove();
        tour.currentStep--;
        this.showTourStep(tour);
      });
    }
    
    const skipBtn = tooltip.querySelector('.tour-skip');
    skipBtn.addEventListener('click', () => {
      this.endTour(tour.name);
    });
  }

  // End tour
  endTour(name) {
    const tour = this.tours.get(name);
    if (tour) {
      tour.isActive = false;
      
      // Remove any remaining highlights
      document.querySelectorAll('[style*="outline: 3px solid #3498db"]').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      });
      
      // Remove any remaining tooltips
      document.querySelectorAll('.tour-tooltip').forEach(el => el.remove());
      
      this.trackEvent('tour_completed', { tourName: name });
    }
  }

  // Show command palette
  showCommandPalette() {
    // Implementation for command palette
    this.showToast('Command palette coming soon!', 'info');
  }

  // Show search
  showSearch() {
    // Implementation for search interface
    this.showToast('Search coming soon!', 'info');
  }

  // Show help
  showHelp() {
    // Implementation for help system
    this.showToast('Help system coming soon!', 'info');
  }

  // Generate unique ID
  generateId(prefix = 'ux') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get user analytics
  getAnalytics() {
    return Array.from(this.analytics.values());
  }

  // Clear analytics
  clearAnalytics() {
    this.analytics.clear();
  }

  // Get UX settings
  getSettings() {
    return {
      enableTooltips: this.options.enableTooltips,
      enableToasts: this.options.enableToasts,
      enableLoadingStates: this.options.enableLoadingStates,
      enableProgressIndicators: this.options.enableProgressIndicators,
      enableGuidedTours: this.options.enableGuidedTours,
      enableUserPreferences: this.options.enableUserPreferences,
      enableAnalytics: this.options.enableAnalytics
    };
  }

  // Update UX settings
  updateSettings(settings) {
    Object.assign(this.options, settings);
  }
}

// Create global instance
export const uxManager = new UserExperienceManager();

// Initialize UX system
export const initializeUX = (options = {}) => {
  return new UserExperienceManager(options);
};
