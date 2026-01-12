// Enhanced accessibility utility functions

// Accessibility Manager Class
export class AccessibilityManager {
  constructor(options = {}) {
    this.options = {
      enableAriaLabels: true,
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableFocusManagement: true,
      enableHighContrast: false,
      enableReducedMotion: false,
      ...options
    };
    
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    this.currentFocus = null;
    this.trap = null;
    this.listeners = new Map();
    
    this.initialize();
  }

  // Initialize accessibility features
  initialize() {
    if (this.options.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }
    
    if (this.options.enableFocusManagement) {
      this.setupFocusManagement();
    }
    
    if (this.options.enableScreenReaderSupport) {
      this.setupScreenReaderSupport();
    }
    
    this.setupReducedMotion();
    this.setupHighContrast();
  }

  // Setup keyboard navigation
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      try {
        switch (e.key) {
          case 'Tab':
            this.handleTabNavigation(e);
            break;
          case 'Enter':
          case ' ':
            this.handleActivation(e);
            break;
          case 'Escape':
            this.handleEscape(e);
            break;
          case 'ArrowUp':
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
            this.handleArrowNavigation(e);
            break;
        }
      } catch {
        // Handle any errors in keyboard navigation
        console.error('Keyboard navigation error:', e);
      }
    });
  }

  // Handle tab navigation
  handleTabNavigation(e) {
    if (!this.options.enableKeyboardNavigation) return;
    
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    let nextIndex;
    if (e.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
    }
    
    if (focusableElements[nextIndex]) {
      e.preventDefault();
      focusableElements[nextIndex].focus();
    }
  }

  // Handle activation
  handleActivation(e) {
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.role === 'button') {
      e.preventDefault();
      target.click();
    }
  }

  // Handle escape key
  handleEscape(e) {
    if (this.trap && this.trap.contains(document.activeElement)) {
      this.releaseFocusTrap();
    }
  }

  // Handle arrow navigation
  handleArrowNavigation(e) {
    const target = e.target;
    const isMenu = target.getAttribute('role') === 'menu' || target.closest('[role="menu"]');
    
    if (isMenu) {
      e.preventDefault();
      const menuItems = target.querySelectorAll('[role="menuitem"]');
      const currentIndex = Array.from(menuItems).indexOf(target);
      
      let nextIndex;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % menuItems.length;
      } else {
        nextIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
      }
      
      if (menuItems[nextIndex]) {
        menuItems[nextIndex].focus();
      }
    }
  }

  // Setup focus management
  setupFocusManagement() {
    // Add focus indicators
    const style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      *:focus:not(:focus-visible) {
        outline: none;
      }
      
      *:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 10000;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup screen reader support
  setupScreenReaderSupport() {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Setup reduced motion
  setupReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.options.enableReducedMotion = true;
      
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Setup high contrast
  setupHighContrast() {
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.options.enableHighContrast = true;
      document.body.classList.add('high-contrast');
    }
  }

  // Get focusable elements
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableElements))
      .filter(element => {
        return !element.disabled && 
               !element.hidden && 
               element.offsetParent !== null &&
               element.tabIndex !== -1;
      });
  }

  // Trap focus within container
  trapFocus(container) {
    if (!this.options.enableFocusManagement) return;
    
    this.trap = container;
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    
    // Prevent focus from leaving container
    const handleFocusTrap = (e) => {
      if (!container.contains(e.target)) {
        e.preventDefault();
        focusableElements[0].focus();
      }
    };
    
    document.addEventListener('focusin', handleFocusTrap);
    this.listeners.set('focusTrap', handleFocusTrap);
  }

  // Release focus trap
  releaseFocusTrap() {
    if (this.listeners.has('focusTrap')) {
      document.removeEventListener('focusin', this.listeners.get('focusTrap'));
      this.listeners.delete('focusTrap');
    }
    this.trap = null;
  }

  // Announce to screen readers
  announce(message, priority = 'polite') {
    if (!this.options.enableScreenReaderSupport) return;
    
    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  // Add ARIA attributes
  addAriaAttributes(element, attributes) {
    if (!this.options.enableAriaLabels) return;
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('aria-') || key === 'role') {
        element.setAttribute(key, value);
      }
    });
  }

  // Remove ARIA attributes
  removeAriaAttributes(element, attributes) {
    attributes.forEach(attr => {
      element.removeAttribute(attr);
    });
  }

  // Check if element is accessible
  isAccessible(element) {
    const checks = {
      hasLabel: this.hasAccessibleLabel(element),
      hasRole: element.hasAttribute('role'),
      isKeyboardAccessible: this.isKeyboardAccessible(element),
      hasContrast: this.hasSufficientContrast(element),
      isFocusable: this.isFocusable(element)
    };
    
    return Object.values(checks).every(check => check);
  }

  // Check if element has accessible label
  hasAccessibleLabel(element) {
    return (
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent.trim() ||
      (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) ||
      (element.tagName === 'IMG' && element.hasAttribute('alt'))
    );
  }

  // Check if element is keyboard accessible
  isKeyboardAccessible(element) {
    return this.isFocusable(element) || 
           element.getAttribute('tabindex') === '0' ||
           element.onclick;
  }

  // Check if element is focusable
  isFocusable(element) {
    return element.matches(this.focusableElements);
  }

  // Check if element has sufficient contrast
  hasSufficientContrast(element) {
    // This is a simplified check - in practice, you'd want to calculate actual contrast ratios
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    return color !== backgroundColor && 
           color !== 'rgba(0, 0, 0, 0)' && 
           backgroundColor !== 'rgba(0, 0, 0, 0)';
  }

  // Generate unique ID
  generateId(prefix = 'a11y') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create accessible button
  createAccessibleButton(text, options = {}) {
    const button = document.createElement('button');
    button.textContent = text;
    
    this.addAriaAttributes(button, {
      'aria-label': options.ariaLabel || text,
      'aria-describedby': options.ariaDescribedBy,
      'aria-expanded': options.ariaExpanded,
      'aria-pressed': options.ariaPressed
    });
    
    if (options.disabled) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }
    
    return button;
  }

  // Create accessible link
  createAccessibleLink(text, href, options = {}) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    
    this.addAriaAttributes(link, {
      'aria-label': options.ariaLabel || text,
      'aria-describedby': options.ariaDescribedBy,
      'aria-current': options.ariaCurrent
    });
    
    if (options.external) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      this.addAriaAttributes(link, {
        'aria-label': `${text} (opens in new window)`
      });
    }
    
    return link;
  }

  // Create accessible form field
  createAccessibleField(label, inputType, options = {}) {
    const container = document.createElement('div');
    container.className = 'form-field';
    
    const id = this.generateId('field');
    
    const labelElement = document.createElement('label');
    labelElement.setAttribute('for', id);
    labelElement.textContent = label;
    
    if (options.required) {
      labelElement.setAttribute('aria-required', 'true');
      const requiredIndicator = document.createElement('span');
      requiredIndicator.setAttribute('aria-hidden', 'true');
      requiredIndicator.textContent = ' *';
      requiredIndicator.className = 'required-indicator';
      labelElement.appendChild(requiredIndicator);
    }
    
    const input = document.createElement('input');
    input.type = inputType;
    input.id = id;
    input.name = options.name || id;
    
    if (options.required) {
      input.required = true;
      input.setAttribute('aria-required', 'true');
    }
    
    if (options.placeholder) {
      input.placeholder = options.placeholder;
    }
    
    if (options.description) {
      const descriptionId = this.generateId('desc');
      input.setAttribute('aria-describedby', descriptionId);
      
      const description = document.createElement('div');
      description.id = descriptionId;
      description.className = 'field-description';
      description.textContent = options.description;
      
      container.appendChild(description);
    }
    
    if (options.errorMessage) {
      const errorId = this.generateId('error');
      input.setAttribute('aria-describedby', 
        input.getAttribute('aria-describedby') ? 
        `${input.getAttribute('aria-describedby')} ${errorId}` : 
        errorId
      );
      input.setAttribute('aria-invalid', 'true');
      
      const error = document.createElement('div');
      error.id = errorId;
      error.className = 'field-error';
      error.setAttribute('role', 'alert');
      error.textContent = options.errorMessage;
      
      container.appendChild(error);
    }
    
    container.appendChild(labelElement);
    container.appendChild(input);
    
    return container;
  }

  // Create accessible modal
  createAccessibleModal(title, content, _options = {}) {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', this.generateId('modal-title'));
    modal.setAttribute('aria-describedby', this.generateId('modal-content'));
    
    const titleElement = document.createElement('h2');
    titleElement.id = modal.getAttribute('aria-labelledby');
    titleElement.textContent = title;
    
    const contentElement = document.createElement('div');
    contentElement.id = modal.getAttribute('aria-describedby');
    contentElement.innerHTML = content;
    
    modal.appendChild(titleElement);
    modal.appendChild(contentElement);
    
    return modal;
  }

  // Create accessible navigation
  createAccessibleNavigation(items, options = {}) {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', options.label || 'Main navigation');
    
    const list = document.createElement('ul');
    list.setAttribute('role', 'menubar');
    
    items.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.setAttribute('role', 'none');
      
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      link.setAttribute('role', 'menuitem');
      link.setAttribute('aria-current', item.current ? 'page' : null);
      
      if (index === 0) {
        link.setAttribute('aria-setsize', items.length);
        link.setAttribute('aria-posinset', index + 1);
      }
      
      listItem.appendChild(link);
      list.appendChild(listItem);
    });
    
    nav.appendChild(list);
    return nav;
  }

  // Run accessibility audit
  runAudit() {
    const issues = [];
    
    // Check for missing alt text on images
    document.querySelectorAll('img').forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push({
          type: 'missing-alt',
          element: img,
          message: `Image ${index + 1} is missing alt text or aria-label`
        });
      }
    });
    
    // Check for missing labels on form inputs
    document.querySelectorAll('input, select, textarea').forEach((input, index) => {
      if (!this.hasAccessibleLabel(input)) {
        issues.push({
          type: 'missing-label',
          element: input,
          message: `Form input ${index + 1} is missing accessible label`
        });
      }
    });
    
    // Check for missing headings
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index) => {
      if (!heading.textContent.trim()) {
        issues.push({
          type: 'empty-heading',
          element: heading,
          message: `Heading ${index + 1} is empty`
        });
      }
    });
    
    // Check for focus management
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) {
      issues.push({
        type: 'no-focusable-elements',
        element: document.body,
        message: 'Page has no focusable elements'
      });
    }
    
    return issues;
  }

  // Fix common accessibility issues
  fixIssues(issues) {
    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing-alt':
          if (issue.element.tagName === 'IMG') {
            issue.element.alt = issue.element.alt || 'Decorative image';
          }
          break;
          
        case 'missing-label':
          const id = this.generateId('label');
          const label = document.createElement('label');
          label.setAttribute('for', id);
          label.textContent = issue.element.placeholder || 'Label';
          label.className = 'sr-only';
          
          issue.element.id = issue.element.id || id;
          issue.element.parentNode.insertBefore(label, issue.element);
          break;
          
        case 'empty-heading':
          issue.element.textContent = 'Section heading';
          break;
      }
    });
  }

  // Get accessibility settings
  getSettings() {
    return {
      enableAriaLabels: this.options.enableAriaLabels,
      enableKeyboardNavigation: this.options.enableKeyboardNavigation,
      enableScreenReaderSupport: this.options.enableScreenReaderSupport,
      enableFocusManagement: this.options.enableFocusManagement,
      enableHighContrast: this.options.enableHighContrast,
      enableReducedMotion: this.options.enableReducedMotion
    };
  }

  // Update accessibility settings
  updateSettings(settings) {
    Object.assign(this.options, settings);
    
    if (settings.enableHighContrast !== undefined) {
      document.body.classList.toggle('high-contrast', settings.enableHighContrast);
    }
  }
}

// Create global instance
export const accessibilityManager = new AccessibilityManager();

// Initialize accessibility system
export const initializeAccessibility = (options = {}) => {
  return new AccessibilityManager(options);
};
