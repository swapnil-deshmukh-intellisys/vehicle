// Comprehensive accessibility utility functions

// ARIA attributes management
export const setAriaAttribute = (element, attribute, value) => {
  if (element && attribute && value !== undefined) {
    element.setAttribute(`aria-${attribute}`, value);
  }
};

export const removeAriaAttribute = (element, attribute) => {
  if (element && attribute) {
    element.removeAttribute(`aria-${attribute}`);
  }
};

export const getAriaAttribute = (element, attribute) => {
  if (element && attribute) {
    return element.getAttribute(`aria-${attribute}`);
  }
  return null;
};

// Focus management
export const trapFocus = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

export const setFocusToElement = (element) => {
  if (element) {
    setTimeout(() => {
      element.focus();
    }, 100);
  }
};

export const getFocusableElements = (container) => {
  return container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
};

// Screen reader announcements
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const createScreenReaderRegion = (id, priority = 'polite') => {
  let region = document.getElementById(id);
  
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);
  }
  
  return region;
};

// Keyboard navigation
export const handleKeyboardNavigation = (element, handlers) => {
  const handleKeyDown = (e) => {
    const { key } = e;
    
    if (handlers[key]) {
      e.preventDefault();
      handlers[key](e);
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

export const createKeyboardHandler = (keyMap) => {
  return (e) => {
    const handler = keyMap[e.key];
    if (handler) {
      e.preventDefault();
      handler(e);
    }
  };
};

// Color contrast checking
export const getLuminance = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  const { r, g, b } = rgb;
  
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

export const getContrastRatio = (color1, color2) => {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsWCAGAA = (contrastRatio) => {
  return contrastRatio >= 4.5;
};

export const meetsWCAGAAA = (contrastRatio) => {
  return contrastRatio >= 7;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Skip links
export const createSkipLink = (targetId, text = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.style.position = 'absolute';
  skipLink.style.top = '-40px';
  skipLink.style.left = '6px';
  skipLink.style.background = '#000';
  skipLink.style.color = '#fff';
  skipLink.style.padding = '8px';
  skipLink.style.textDecoration = 'none';
  skipLink.style.zIndex = '10000';
  skipLink.style.transition = 'top 0.3s';
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  return skipLink;
};

export const addSkipLinks = () => {
  const mainContent = document.querySelector('main, [role="main"], #main');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content';
  }
  
  if (mainContent) {
    const skipLink = createSkipLink(mainContent.id);
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
};

// Heading structure validation
export const validateHeadingStructure = () => {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const issues = [];
  let lastLevel = 0;
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    
    if (index === 0 && level !== 1) {
      issues.push({
        element: heading,
        message: 'First heading should be h1'
      });
    }
    
    if (level > lastLevel + 1) {
      issues.push({
        element: heading,
        message: `Heading level skipped: h${lastLevel} to h${level}`
      });
    }
    
    lastLevel = level;
  });
  
  return issues;
};

// Image accessibility
export const addImageAccessibility = (img, altText) => {
  if (!img.alt && altText) {
    img.alt = altText;
  }
  
  if (img.alt === '' && !img.getAttribute('role')) {
    img.setAttribute('role', 'presentation');
  }
};

export const validateImageAccessibility = () => {
  const images = document.querySelectorAll('img');
  const issues = [];
  
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        element: img,
        message: 'Image missing alt attribute'
      });
    }
  });
  
  return issues;
};

// Form accessibility
export const enhanceFormAccessibility = (form) => {
  const inputs = form.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    // Ensure each input has a label
    if (!input.id) {
      input.id = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const label = form.querySelector(`label[for="${input.id}"]`);
    if (!label) {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        input.setAttribute('aria-label', placeholder);
      }
    }
    
    // Add required attribute validation
    if (input.hasAttribute('required')) {
      input.setAttribute('aria-required', 'true');
    }
    
    // Add invalid state
    if (input.hasAttribute('aria-invalid')) {
      input.setAttribute('aria-describedby', `${input.id}-error`);
    }
  });
};

export const validateFormAccessibility = () => {
  const forms = document.querySelectorAll('form');
  const issues = [];
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (!input.id) {
        issues.push({
          element: input,
          message: 'Input missing id attribute'
        });
      }
      
      const label = form.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.getAttribute('aria-label')) {
        issues.push({
          element: input,
          message: 'Input missing label or aria-label'
        });
      }
    });
  });
  
  return issues;
};

// Link accessibility
export const enhanceLinkAccessibility = (link) => {
  if (!link.getAttribute('aria-label') && !link.textContent.trim()) {
    const img = link.querySelector('img');
    if (img && img.alt) {
      link.setAttribute('aria-label', img.alt);
    }
  }
  
  if (link.getAttribute('href') === '#') {
    link.setAttribute('role', 'button');
  }
};

export const validateLinkAccessibility = () => {
  const links = document.querySelectorAll('a');
  const issues = [];
  
  links.forEach(link => {
    if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
      issues.push({
        element: link,
        message: 'Link missing text or aria-label'
      });
    }
    
    if (link.getAttribute('href') === '#' && !link.getAttribute('role')) {
      issues.push({
        element: link,
        message: 'Link with href="#" should have role="button"'
      });
    }
  });
  
  return issues;
};

// Table accessibility
export const enhanceTableAccessibility = (table) => {
  if (!table.caption) {
    const caption = document.createElement('caption');
    caption.textContent = 'Table description';
    table.appendChild(caption);
  }
  
  const headers = table.querySelectorAll('th');
  headers.forEach(header => {
    if (!header.getAttribute('scope')) {
      const isRowHeader = header.parentElement.tagName === 'TR';
      header.setAttribute('scope', isRowHeader ? 'row' : 'col');
    }
  });
};

export const validateTableAccessibility = () => {
  const tables = document.querySelectorAll('table');
  const issues = [];
  
  tables.forEach(table => {
    if (!table.caption) {
      issues.push({
        element: table,
        message: 'Table missing caption'
      });
    }
    
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
      if (!header.getAttribute('scope')) {
        issues.push({
          element: header,
          message: 'Table header missing scope attribute'
        });
      }
    });
  });
  
  return issues;
};

// Comprehensive accessibility audit
export const runAccessibilityAudit = () => {
  const issues = [
    ...validateHeadingStructure(),
    ...validateImageAccessibility(),
    ...validateFormAccessibility(),
    ...validateLinkAccessibility(),
    ...validateTableAccessibility()
  ];
  
  return {
    totalIssues: issues.length,
    issues,
    summary: {
      headings: issues.filter(i => i.message.includes('heading')).length,
      images: issues.filter(i => i.message.includes('Image')).length,
      forms: issues.filter(i => i.message.includes('Input')).length,
      links: issues.filter(i => i.message.includes('Link')).length,
      tables: issues.filter(i => i.message.includes('Table')).length
    }
  };
};

// Accessibility preferences detection
export const detectAccessibilityPreferences = () => {
  const preferences = {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
    screenReaderActive: false // This would need more complex detection
  };
  
  return preferences;
};

// Apply accessibility preferences
export const applyAccessibilityPreferences = (preferences) => {
  if (preferences.prefersReducedMotion) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
  }
  
  if (preferences.prefersHighContrast) {
    document.documentElement.classList.add('high-contrast');
  }
  
  if (preferences.prefersDarkMode) {
    document.documentElement.classList.add('dark-mode');
  }
  
  if (preferences.prefersReducedData) {
    document.documentElement.classList.add('reduced-data');
  }
};
