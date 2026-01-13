// UI system constants and configurations

// Theme configurations
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
  STORAGE_KEY: 'app-theme',
  TRANSITION_DURATION: 300
};

// Color palettes
export const COLOR_PALETTES = {
  PRIMARY: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1'
  },
  SECONDARY: {
    50: '#fce4ec',
    100: '#f8bbd9',
    200: '#f48fb1',
    300: '#f06292',
    400: '#ec407a',
    500: '#e91e63',
    600: '#d81b60',
    700: '#c2185b',
    800: '#ad1457',
    900: '#880e4f'
  },
  SUCCESS: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20'
  },
  WARNING: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100'
  },
  ERROR: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c'
  },
  NEUTRAL: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
};

// Typography configurations
export const TYPOGRAPHY = {
  FONT_FAMILIES: {
    PRIMARY: 'Inter, system-ui, -apple-system, sans-serif',
    MONOSPACE: 'Fira Code, Monaco, Consolas, monospace',
    DISPLAY: 'Inter Display, system-ui, -apple-system, sans-serif'
  },
  FONT_SIZES: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    BASE: '1rem',     // 16px
    LG: '1.125rem',   // 18px
    XL: '1.25rem',    // 20px
    '2XL': '1.5rem',  // 24px
    '3XL': '1.875rem', // 30px
    '4XL': '2.25rem', // 36px
    '5XL': '3rem',    // 48px
    '6XL': '3.75rem'  // 60px
  },
  FONT_WEIGHTS: {
    THIN: 100,
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
    EXTRABOLD: 800,
    BLACK: 900
  },
  LINE_HEIGHTS: {
    NONE: 1,
    TIGHT: 1.25,
    NORMAL: 1.5,
    RELAXED: 1.75,
    LOOSE: 2
  }
};

// Spacing configurations
export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem'     // 256px
};

// Breakpoint configurations
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1400,
  XXXL: 1600
};

// Container configurations
export const CONTAINERS = {
  FLUID: '100%',
  SM: '540px',
  MD: '720px',
  LG: '960px',
  XL: '1140px',
  XXL: '1320px'
};

// Animation configurations
export const ANIMATIONS = {
  DURATIONS: {
    FAST: '150ms',
    NORMAL: '300ms',
    SLOW: '500ms',
    SLOWER: '1000ms'
  },
  EASINGS: {
    LINEAR: 'linear',
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    EASE_IN_QUAD: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    EASE_IN_CUBIC: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    EASE_IN_QUART: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
    EASE_IN_QUINT: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
    EASE_IN_SINE: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
    EASE_IN_EXPO: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
    EASE_IN_CIRC: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
    EASE_IN_BACK: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
    EASE_OUT_QUAD: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    EASE_OUT_CUBIC: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    EASE_OUT_QUART: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    EASE_OUT_QUINT: 'cubic-bezier(0.23, 1, 0.32, 1)',
    EASE_OUT_SINE: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
    EASE_OUT_EXPO: 'cubic-bezier(0.19, 1, 0.22, 1)',
    EASE_OUT_CIRC: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
    EASE_OUT_BACK: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    EASE_IN_OUT_QUAD: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    EASE_IN_OUT_CUBIC: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    EASE_IN_OUT_QUART: 'cubic-bezier(0.77, 0, 0.175, 1)',
    EASE_IN_OUT_QUINT: 'cubic-bezier(0.86, 0, 0.07, 1)',
    EASE_IN_OUT_SINE: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
    EASE_IN_OUT_EXPO: 'cubic-bezier(1, 0, 0, 1)',
    EASE_IN_OUT_CIRC: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
    EASE_IN_OUT_BACK: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  KEYFRAMES: {
    FADE_IN: {
      from: { opacity: 0 },
      to: { opacity: 1 }
    },
    FADE_OUT: {
      from: { opacity: 1 },
      to: { opacity: 0 }
    },
    SLIDE_UP: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 }
    },
    SLIDE_DOWN: {
      from: { transform: 'translateY(-20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 }
    },
    SLIDE_LEFT: {
      from: { transform: 'translateX(20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 }
    },
    SLIDE_RIGHT: {
      from: { transform: 'translateX(-20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 }
    },
    SCALE_IN: {
      from: { transform: 'scale(0.8)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 }
    },
    SCALE_OUT: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.8)', opacity: 0 }
    },
    ROTATE_IN: {
      from: { transform: 'rotate(-180deg) scale(0.8)', opacity: 0 },
      to: { transform: 'rotate(0deg) scale(1)', opacity: 1 }
    },
    BOUNCE: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' }
    },
    PULSE: {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' }
    },
    SHAKE: {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
    }
  }
};

// Shadow configurations
export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  BASE: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2XL': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  INNER: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

// Border radius configurations
export const BORDER_RADIUS = {
  NONE: '0',
  SM: '0.125rem',   // 2px
  BASE: '0.25rem',  // 4px
  MD: '0.375rem',   // 6px
  LG: '0.5rem',     // 8px
  XL: '0.75rem',    // 12px
  '2XL': '1rem',    // 16px
  '3XL': '1.5rem',  // 24px
  FULL: '9999px'
};

// Z-index configurations
export const Z_INDEX = {
  AUTO: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  DROPDOWN: '1000',
  STICKY: '1020',
  FIXED: '1030',
  MODAL_BACKDROP: '1040',
  MODAL: '1050',
  POPOVER: '1060',
  TOOLTIP: '1070',
  TOAST: '1080'
};

// Component configurations
export const COMPONENTS = {
  BUTTON: {
    VARIANTS: {
      PRIMARY: 'primary',
      SECONDARY: 'secondary',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      GHOST: 'ghost',
      LINK: 'link'
    },
    SIZES: {
      XS: 'xs',
      SM: 'sm',
      MD: 'md',
      LG: 'lg',
      XL: 'xl'
    },
    STATES: {
      DEFAULT: 'default',
      HOVER: 'hover',
      ACTIVE: 'active',
      FOCUS: 'focus',
      DISABLED: 'disabled',
      LOADING: 'loading'
    }
  },
  INPUT: {
    TYPES: {
      TEXT: 'text',
      EMAIL: 'email',
      PASSWORD: 'password',
      NUMBER: 'number',
      TEL: 'tel',
      URL: 'url',
      SEARCH: 'search',
      DATE: 'date',
      TIME: 'time',
      DATETIME: 'datetime',
      FILE: 'file'
    },
    SIZES: {
      SM: 'sm',
      MD: 'md',
      LG: 'lg'
    },
    STATES: {
      DEFAULT: 'default',
      FOCUS: 'focus',
      ERROR: 'error',
      DISABLED: 'disabled'
    }
  },
  CARD: {
    VARIANTS: {
      DEFAULT: 'default',
      ELEVATED: 'elevated',
      OUTLINED: 'outlined',
      FLAT: 'flat'
    },
    SIZES: {
      SM: 'sm',
      MD: 'md',
      LG: 'lg'
    }
  },
  MODAL: {
    SIZES: {
      SM: 'sm',
      MD: 'md',
      LG: 'lg',
      XL: 'xl',
      FULLSCREEN: 'fullscreen'
    },
    POSITIONS: {
      CENTER: 'center',
      TOP: 'top',
      BOTTOM: 'bottom'
    }
  },
  TOAST: {
    TYPES: {
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error'
    },
    POSITIONS: {
      TOP_RIGHT: 'top-right',
      TOP_LEFT: 'top-left',
      TOP_CENTER: 'top-center',
      BOTTOM_RIGHT: 'bottom-right',
      BOTTOM_LEFT: 'bottom-left',
      BOTTOM_CENTER: 'bottom-center'
    }
  }
};

// Layout configurations
export const LAYOUT = {
  CONTAINER: {
    CENTER: 'center',
    START: 'start',
    END: 'end',
    BETWEEN: 'between',
    AROUND: 'around',
    EVENLY: 'evenly'
  },
  FLEX: {
    DIRECTIONS: {
      ROW: 'row',
      COLUMN: 'column',
      ROW_REVERSE: 'row-reverse',
      COLUMN_REVERSE: 'column-reverse'
    },
    WRAPS: {
      NOWRAP: 'nowrap',
      WRAP: 'wrap',
      WRAP_REVERSE: 'wrap-reverse'
    },
    JUSTIFIES: {
      START: 'flex-start',
      END: 'flex-end',
      CENTER: 'center',
      BETWEEN: 'space-between',
      AROUND: 'space-around',
      EVENLY: 'space-evenly'
    },
    ALIGNS: {
      START: 'flex-start',
      END: 'flex-end',
      CENTER: 'center',
      BASELINE: 'baseline',
      STRETCH: 'stretch'
    }
  },
  GRID: {
    COLS: {
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: '11',
      12: '12'
    },
    AUTO_COLS: {
      AUTO: 'auto',
      MIN: 'min',
      MAX: 'max',
      FR: 'fr'
    }
  }
};

// Interaction configurations
export const INTERACTION = {
  CURSORS: {
    AUTO: 'auto',
    DEFAULT: 'default',
    POINTER: 'pointer',
    WAIT: 'wait',
    TEXT: 'text',
    MOVE: 'move',
    HELP: 'help',
    NOT_ALLOWED: 'not-allowed',
    GRAB: 'grab',
    GRABBING: 'grabbing'
  },
  USER_SELECT: {
    AUTO: 'auto',
    NONE: 'none',
    TEXT: 'text',
    ALL: 'all'
  },
  POINTER_EVENTS: {
    AUTO: 'auto',
    NONE: 'none'
  }
};

// Responsive configurations
export const RESPONSIVE = {
  MEDIA_QUERIES: {
    XS: `(max-width: ${BREAKPOINTS.SM - 1}px)`,
    SM: `(min-width: ${BREAKPOINTS.SM}px) and (max-width: ${BREAKPOINTS.MD - 1}px)`,
    MD: `(min-width: ${BREAKPOINTS.MD}px) and (max-width: ${BREAKPOINTS.LG - 1}px)`,
    LG: `(min-width: ${BREAKPOINTS.LG}px) and (max-width: ${BREAKPOINTS.XL - 1}px)`,
    XL: `(min-width: ${BREAKPOINTS.XL}px) and (max-width: ${BREAKPOINTS.XXL - 1}px)`,
    XXL: `(min-width: ${BREAKPOINTS.XXL}px)`,
    SM_UP: `(min-width: ${BREAKPOINTS.SM}px)`,
    MD_UP: `(min-width: ${BREAKPOINTS.MD}px)`,
    LG_UP: `(min-width: ${BREAKPOINTS.LG}px)`,
    XL_UP: `(min-width: ${BREAKPOINTS.XL}px)`,
    XXL_UP: `(min-width: ${BREAKPOINTS.XXL}px)`,
    SM_DOWN: `(max-width: ${BREAKPOINTS.MD - 1}px)`,
    MD_DOWN: `(max-width: ${BREAKPOINTS.LG - 1}px)`,
    LG_DOWN: `(max-width: ${BREAKPOINTS.XL - 1}px)`,
    XL_DOWN: `(max-width: ${BREAKPOINTS.XXL - 1}px)`
  },
  DEVICE_TYPES: {
    MOBILE: '(max-width: 767px)',
    TABLET: '(min-width: 768px) and (max-width: 1023px)',
    DESKTOP: '(min-width: 1024px)',
    WIDESCREEN: '(min-width: 1440px)'
  }
};

// Accessibility configurations
export const ACCESSIBILITY = {
  FOCUS_VISIBLE: 'focus-visible',
  FOCUS_WITHIN: 'focus-within',
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
  HIGH_CONTRAST: '(prefers-contrast: high)',
  PREFER_DARK: '(prefers-color-scheme: dark)',
  PREFER_LIGHT: '(prefers-color-scheme: light)',
  SCREEN_READER_ONLY: 'sr-only',
  NOT_SCREEN_READER_ONLY: 'not-sr-only'
};
