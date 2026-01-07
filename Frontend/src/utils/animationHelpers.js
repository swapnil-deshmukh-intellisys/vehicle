// Animation helper functions and utilities

// Check if reduced motion is preferred
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get responsive animation duration
export const getResponsiveDuration = (baseDuration) => {
  if (typeof window === 'undefined') return baseDuration;
  
  const width = window.innerWidth;
  
  if (width < 768) return Math.max(baseDuration * 0.7, 100);
  if (width < 1024) return baseDuration;
  return Math.min(baseDuration * 1.2, 1000);
};

// Create intersection observer for scroll animations
export const createIntersectionObserver = (callback, options = {}) => {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return null;
  }
  
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Animate elements when they come into view
export const animateOnView = (elements, animationFunction, options = {}) => {
  const observer = createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animationFunction(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, options);
  
  elements.forEach(element => observer.observe(element));
  
  return observer;
};

// Debounce animation events
export const debounceAnimation = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle scroll events for performance
export const throttleScroll = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Check if element is in viewport
export const isInViewport = (element, threshold = 0) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = (rect.top <= windowHeight * (1 - threshold)) && ((rect.top + rect.height) >= windowHeight * threshold);
  const horInView = (rect.left <= windowWidth * (1 - threshold)) && ((rect.left + rect.width) >= windowWidth * threshold);
  
  return (vertInView && horInView);
};

// Get element's computed style
export const getComputedStyle = (element, property) => {
  if (typeof window === 'undefined') return null;
  
  return window.getComputedStyle(element)[property];
};

// Wait for CSS transition to complete
export const waitForTransition = (element) => {
  return new Promise(resolve => {
    const handleTransitionEnd = () => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    };
    
    element.addEventListener('transitionend', handleTransitionEnd);
  });
};

// Wait for CSS animation to complete
export const waitForAnimation = (element) => {
  return new Promise(resolve => {
    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
  });
};

// Add CSS keyframes dynamically
export const addKeyframes = (name, keyframes) => {
  if (typeof document === 'undefined') return;
  
  const styleId = `keyframes-${name}`;
  
  // Remove existing keyframes if present
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new style element
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes ${name} {
      ${keyframes}
    }
  `;
  
  document.head.appendChild(style);
};

// Remove CSS keyframes
export const removeKeyframes = (name) => {
  if (typeof document === 'undefined') return;
  
  const styleId = `keyframes-${name}`;
  const style = document.getElementById(styleId);
  
  if (style) {
    style.remove();
  }
};

// Get animation duration from computed style
export const getAnimationDuration = (element) => {
  const duration = getComputedStyle(element, 'animationDuration');
  return duration ? parseFloat(duration) * 1000 : 0;
};

// Get transition duration from computed style
export const getTransitionDuration = (element) => {
  const duration = getComputedStyle(element, 'transitionDuration');
  return duration ? parseFloat(duration) * 1000 : 0;
};

// Set CSS custom properties for animations
export const setAnimationProperties = (element, properties) => {
  Object.entries(properties).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
};

// Get CSS custom properties for animations
export const getAnimationProperties = (element, properties) => {
  const result = {};
  
  properties.forEach(property => {
    const value = getComputedStyle(element, property);
    result[property] = value;
  });
  
  return result;
};
