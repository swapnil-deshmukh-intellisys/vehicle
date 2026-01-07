// Theme utility functions for consistent theming across the application

// Available themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Theme colors configuration
export const THEME_COLORS = {
  [THEMES.LIGHT]: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6'
  },
  [THEMES.DARK]: {
    primary: '#60A5FA',
    secondary: '#34D399',
    accent: '#FBBF24',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    info: '#60A5FA'
  }
};

// Default theme
export const DEFAULT_THEME = THEMES.LIGHT;

// Theme storage key
export const THEME_STORAGE_KEY = 'app_theme';

// Get current theme from localStorage or system preference
export const getCurrentTheme = () => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  
  if (storedTheme && Object.values(THEMES).includes(storedTheme)) {
    return storedTheme;
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEMES.DARK;
  }
  
  return DEFAULT_THEME;
};

// Set theme
export const setTheme = (theme) => {
  if (!Object.values(THEMES).includes(theme)) {
    console.warn(`Invalid theme: ${theme}. Using default theme.`);
    theme = DEFAULT_THEME;
  }
  
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  
  // Dispatch custom event for theme change
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
};

// Apply theme to document
export const applyTheme = (theme) => {
  const colors = THEME_COLORS[theme] || THEME_COLORS[DEFAULT_THEME];
  
  // Apply CSS custom properties
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply theme class to body
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${theme}`);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = colors.background;
  }
};

// Toggle between light and dark themes
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  setTheme(newTheme);
  return newTheme;
};

// Get theme colors for current theme
export const getThemeColors = (theme = null) => {
  const currentTheme = theme || getCurrentTheme();
  return THEME_COLORS[currentTheme] || THEME_COLORS[DEFAULT_THEME];
};

// Check if theme is dark
export const isDarkTheme = (theme = null) => {
  const currentTheme = theme || getCurrentTheme();
  return currentTheme === THEMES.DARK;
};

// Get CSS class for theme
export const getThemeClass = (theme = null) => {
  const currentTheme = theme || getCurrentTheme();
  return `theme-${currentTheme}`;
};

// Initialize theme on app load
export const initializeTheme = () => {
  const theme = getCurrentTheme();
  applyTheme(theme);
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === THEMES.AUTO || !storedTheme) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        applyTheme(newTheme);
      }
    });
  }
};

// Generate theme-aware styles
export const getThemeStyle = (property, theme = null) => {
  const colors = getThemeColors(theme);
  return colors[property] || '';
};

// Create theme-aware CSS string
export const createThemeCSS = (theme = null) => {
  const colors = getThemeColors(theme);
  
  return Object.entries(colors)
    .map(([key, value]) => `  --color-${key}: ${value};`)
    .join('\n');
};

// Animation support for theme transitions
export const enableThemeTransitions = (duration = 300) => {
  const style = document.createElement('style');
  style.id = 'theme-transitions';
  style.textContent = `
    * {
      transition: color ${duration}ms ease-in-out,
                  background-color ${duration}ms ease-in-out,
                  border-color ${duration}ms ease-in-out,
                  box-shadow ${duration}ms ease-in-out !important;
    }
  `;
  document.head.appendChild(style);
};

// Disable theme transitions
export const disableThemeTransitions = () => {
  const style = document.querySelector('#theme-transitions');
  if (style) {
    style.remove();
  }
};

// Smooth theme change with transitions
export const smoothThemeChange = (newTheme, duration = 300) => {
  // Disable transitions temporarily for instant change
  disableThemeTransitions();
  
  // Apply new theme
  setTheme(newTheme);
  
  // Re-enable transitions after a brief delay
  setTimeout(() => {
    enableThemeTransitions(duration);
  }, 50);
};
