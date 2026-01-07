// Animation constants and configuration

// Animation preset configurations
export const ANIMATION_PRESETS = {
  // Fast animations
  FAST_FADE_IN: {
    type: 'fade',
    duration: 200,
    easing: 'ease-out'
  },
  
  FAST_SLIDE_UP: {
    type: 'slide',
    direction: 'up',
    duration: 250,
    easing: 'ease-out'
  },
  
  // Normal animations
  NORMAL_ZOOM_IN: {
    type: 'zoom',
    duration: 300,
    easing: 'ease-in-out'
  },
  
  NORMAL_BOUNCE_IN: {
    type: 'bounce',
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Slow animations
  SLOW_FADE_IN: {
    type: 'fade',
    duration: 500,
    easing: 'ease-in-out'
  },
  
  SLOW_SLIDE_LEFT: {
    type: 'slide',
    direction: 'left',
    duration: 600,
    easing: 'ease-in-out'
  }
};

// Stagger animation presets
export const STAGGER_PRESETS = {
  QUICK: { delay: 50, duration: 200 },
  NORMAL: { delay: 100, duration: 300 },
  SLOW: { delay: 150, duration: 400 }
};

// Loading animation presets
export const LOADING_PRESETS = {
  SPINNER_SMALL: { type: 'spinner', size: 20, duration: 800 },
  SPINNER_MEDIUM: { type: 'spinner', size: 40, duration: 1000 },
  SPINNER_LARGE: { type: 'spinner', size: 60, duration: 1200 },
  
  PULSE_SLOW: { type: 'pulse', duration: 1500 },
  PULSE_NORMAL: { type: 'pulse', duration: 1000 },
  PULSE_FAST: { type: 'pulse', duration: 500 },
  
  BOUNCE_GENTLE: { type: 'bounce', duration: 800 },
  BOUNCE_NORMAL: { type: 'bounce', duration: 600 },
  BOUNCE_ENERGETIC: { type: 'bounce', duration: 400 }
};

// Responsive animation durations
export const RESPONSIVE_DURATIONS = {
  mobile: {
    fast: 150,
    normal: 200,
    slow: 300
  },
  tablet: {
    fast: 200,
    normal: 300,
    slow: 400
  },
  desktop: {
    fast: 250,
    normal: 350,
    slow: 500
  }
};

// Animation breakpoints
export const ANIMATION_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
};
