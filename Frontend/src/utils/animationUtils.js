// Comprehensive animation utility functions

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800
};

// Animation easing functions
export const EASING_FUNCTIONS = {
  LINEAR: 'linear',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  CUBIC_BEZIER: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

// Animation types
export const ANIMATION_TYPES = {
  FADE: 'fade',
  SLIDE: 'slide',
  ZOOM: 'zoom',
  ROTATE: 'rotate',
  BOUNCE: 'bounce',
  FLIP: 'flip',
  PULSE: 'pulse'
};

// Slide directions
export const SLIDE_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
};

// Create CSS animation string
export const createAnimationString = (properties) => {
  const {
    type = ANIMATION_TYPES.FADE,
    duration = ANIMATION_DURATIONS.NORMAL,
    easing = EASING_FUNCTIONS.EASE_IN_OUT,
    delay = 0,
    fillMode = 'forwards'
  } = properties;

  const keyframes = getKeyframes(type);
  const animation = `${keyframes} ${duration}ms ${easing} ${delay}ms ${fillMode}`;
  
  return animation;
};

// Get keyframes for different animation types
export const getKeyframes = (type, direction = null) => {
  switch (type) {
    case ANIMATION_TYPES.FADE:
      return 'fadeIn';
    
    case ANIMATION_TYPES.SLIDE:
      return `slide${direction ? capitalize(direction) : 'Up'}`;
    
    case ANIMATION_TYPES.ZOOM:
      return 'zoomIn';
    
    case ANIMATION_TYPES.ROTATE:
      return 'rotateIn';
    
    case ANIMATION_TYPES.BOUNCE:
      return 'bounceIn';
    
    case ANIMATION_TYPES.FLIP:
      return 'flipIn';
    
    case ANIMATION_TYPES.PULSE:
      return 'pulse';
    
    default:
      return 'fadeIn';
  }
};

// Capitalize helper
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Animate element with CSS transitions
export const animateElement = (element, properties, options = {}) => {
  if (!element) return Promise.reject(new Error('Element is required'));

  const {
    duration = ANIMATION_DURATIONS.NORMAL,
    easing = EASING_FUNCTIONS.EASE_IN_OUT,
    delay = 0
  } = options;

  return new Promise((resolve) => {
    // Set transition properties
    element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;
    
    // Apply animation properties
    Object.keys(properties).forEach(property => {
      element.style[property] = properties[property];
    });

    // Listen for transition end
    const handleTransitionEnd = (event) => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve(event);
    };

    element.addEventListener('transitionend', handleTransitionEnd);
  });
};

// Fade in animation
export const fadeIn = (element, duration = ANIMATION_DURATIONS.NORMAL) => {
  return animateElement(element, { opacity: 1 }, { duration });
};

// Fade out animation
export const fadeOut = (element, duration = ANIMATION_DURATIONS.NORMAL) => {
  return animateElement(element, { opacity: 0 }, { duration });
};

// Slide animation
export const slideIn = (element, direction = SLIDE_DIRECTIONS.UP, duration = ANIMATION_DURATIONS.NORMAL) => {
  const transforms = {
    [SLIDE_DIRECTIONS.UP]: { transform: 'translateY(0)' },
    [SLIDE_DIRECTIONS.DOWN]: { transform: 'translateY(0)' },
    [SLIDE_DIRECTIONS.LEFT]: { transform: 'translateX(0)' },
    [SLIDE_DIRECTIONS.RIGHT]: { transform: 'translateX(0)' }
  };

  // Set initial position
  const initialTransforms = {
    [SLIDE_DIRECTIONS.UP]: { transform: 'translateY(-100%)' },
    [SLIDE_DIRECTIONS.DOWN]: { transform: 'translateY(100%)' },
    [SLIDE_DIRECTIONS.LEFT]: { transform: 'translateX(-100%)' },
    [SLIDE_DIRECTIONS.RIGHT]: { transform: 'translateX(100%)' }
  };

  element.style.transform = initialTransforms[direction].transform;
  
  return animateElement(element, transforms[direction], { duration });
};

// Zoom animation
export const zoomIn = (element, duration = ANIMATION_DURATIONS.NORMAL) => {
  element.style.transform = 'scale(0)';
  element.style.opacity = '0';
  
  return animateElement(element, { 
    transform: 'scale(1)', 
    opacity: 1 
  }, { duration });
};

// Stagger animation for multiple elements
export const staggerAnimation = (elements, animationFunction, staggerDelay = 100) => {
  const animations = elements.map((element, index) => {
    return new Promise(resolve => {
      setTimeout(() => {
        animationFunction(element).then(resolve);
      }, index * staggerDelay);
    });
  });

  return Promise.all(animations);
};

// Create scroll-triggered animation
export const createScrollAnimation = (element, animationFunction, options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    once = true
  } = options;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animationFunction(entry.target);
        
        if (once) {
          observer.unobserve(entry.target);
        }
      }
    });
  }, { threshold, rootMargin });

  observer.observe(element);
  
  return observer;
};

// Animate on scroll helper
export const animateOnScroll = (elements, animationFunction, options = {}) => {
  const observers = elements.map(element => 
    createScrollAnimation(element, animationFunction, options)
  );
  
  return observers;
};

// Create loading animation
export const createLoadingAnimation = (element, options = {}) => {
  const {
    type = 'spinner',
    duration = 1000,
    size = 40
  } = options;

  switch (type) {
    case 'spinner':
      return createSpinnerAnimation(element, duration, size);
    
    case 'pulse':
      return createPulseAnimation(element, duration);
    
    case 'bounce':
      return createBounceAnimation(element, duration);
    
    default:
      return createSpinnerAnimation(element, duration, size);
  }
};

// Spinner animation
export const createSpinnerAnimation = (element, duration = 1000, size = 40) => {
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.border = '3px solid #f3f3f3';
  element.style.borderTop = '3px solid #3498db';
  element.style.borderRadius = '50%';
  element.style.animation = `spin ${duration}ms linear infinite`;
  
  // Add spin keyframes if not already present
  if (!document.querySelector('#spin-keyframes')) {
    const style = document.createElement('style');
    style.id = 'spin-keyframes';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
};

// Pulse animation
export const createPulseAnimation = (element, duration = 1000) => {
  element.style.animation = `pulse ${duration}ms ease-in-out infinite`;
  
  // Add pulse keyframes if not already present
  if (!document.querySelector('#pulse-keyframes')) {
    const style = document.createElement('style');
    style.id = 'pulse-keyframes';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }
};

// Bounce animation
export const createBounceAnimation = (element, duration = 1000) => {
  element.style.animation = `bounce ${duration}ms ease-in-out infinite`;
  
  // Add bounce keyframes if not already present
  if (!document.querySelector('#bounce-keyframes')) {
    const style = document.createElement('style');
    style.id = 'bounce-keyframes';
    style.textContent = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-30px); }
        60% { transform: translateY(-15px); }
      }
    `;
    document.head.appendChild(style);
  }
};

// Stop animation
export const stopAnimation = (element) => {
  if (element) {
    element.style.animation = '';
    element.style.transition = '';
  }
};

// Check if element is animating
export const isAnimating = (element) => {
  if (!element) return false;
  
  const computedStyle = window.getComputedStyle(element);
  const animation = computedStyle.animation || computedStyle.transition;
  
  return animation !== 'none' && animation !== '';
};

// Animation performance monitoring
export const measureAnimationPerformance = (animationFunction) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await animationFunction(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Animation completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`Animation failed after ${duration.toFixed(2)}ms:`, error);
      
      throw error;
    }
  };
};

// Create animation queue
export class AnimationQueue {
  constructor() {
    this.queue = [];
    this.isRunning = false;
  }

  add(animationFunction, options = {}) {
    this.queue.push({ animationFunction, options });
    return this;
  }

  async run() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    while (this.queue.length > 0) {
      const { animationFunction, options } = this.queue.shift();
      
      try {
        await animationFunction(options);
        
        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }
      } catch (error) {
        console.error('Animation queue error:', error);
      }
    }
    
    this.isRunning = false;
  }

  clear() {
    this.queue = [];
    this.isRunning = false;
  }
}

// Create staggered entrance animation
export const createStaggeredEntrance = (elements, options = {}) => {
  const {
    animationType = ANIMATION_TYPES.FADE,
    direction = SLIDE_DIRECTIONS.UP,
    staggerDelay = 100,
    duration = ANIMATION_DURATIONS.NORMAL
  } = options;

  const animations = {
    [ANIMATION_TYPES.FADE]: fadeIn,
    [ANIMATION_TYPES.SLIDE]: (el) => slideIn(el, direction, duration),
    [ANIMATION_TYPES.ZOOM]: zoomIn
  };

  return staggerAnimation(elements, animations[animationType], staggerDelay);
};
