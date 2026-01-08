// Performance optimization constants and configurations

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  FPS: {
    EXCELLENT: 60,
    GOOD: 45,
    FAIR: 30,
    POOR: 15
  },
  LOAD_TIME: {
    EXCELLENT: 1000,  // 1 second
    GOOD: 2000,       // 2 seconds
    FAIR: 3000,       // 3 seconds
    POOR: 5000        // 5 seconds
  },
  MEMORY: {
    WARNING_THRESHOLD: 0.8,  // 80% of available memory
    CRITICAL_THRESHOLD: 0.9, // 90% of available memory
    CLEANUP_THRESHOLD: 0.85  // 85% triggers cleanup
  },
  BUNDLE_SIZE: {
    EXCELLENT: 250 * 1024,   // 250KB
    GOOD: 500 * 1024,        // 500KB
    FAIR: 1024 * 1024,       // 1MB
    POOR: 2048 * 1024        // 2MB
  }
};

// Cache configurations
export const CACHE_CONFIG = {
  MEMORY: {
    MAX_SIZE: 100,
    DEFAULT_TTL: 5 * 60 * 1000,  // 5 minutes
    CLEANUP_INTERVAL: 60 * 1000  // 1 minute
  },
  LOCAL_STORAGE: {
    PREFIX: 'cache_',
    DEFAULT_TTL: 60 * 60 * 1000,  // 1 hour
    CLEANUP_INTERVAL: 5 * 60 * 1000 // 5 minutes
  },
  INDEXED_DB: {
    DB_NAME: 'CacheDB',
    STORE_NAME: 'cache',
    VERSION: 1,
    DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 hours
    CLEANUP_INTERVAL: 30 * 60 * 1000    // 30 minutes
  },
  MULTI_LEVEL: {
    DEFAULT_TTL: 30 * 60 * 1000, // 30 minutes
    CLEANUP_INTERVAL: 5 * 60 * 1000 // 5 minutes
  }
};

// Performance monitoring settings
export const MONITORING_CONFIG = {
  FPS: {
    SAMPLE_INTERVAL: 1000,  // 1 second
    HISTORY_SIZE: 60,       // Keep 60 samples (1 minute)
    REPORT_INTERVAL: 5000   // Report every 5 seconds
  },
  MEMORY: {
    SAMPLE_INTERVAL: 5000,  // 5 seconds
    HISTORY_SIZE: 12,       // Keep 12 samples (1 minute)
    REPORT_INTERVAL: 30000  // Report every 30 seconds
  },
  NETWORK: {
    SAMPLE_INTERVAL: 10000, // 10 seconds
    HISTORY_SIZE: 6,        // Keep 6 samples (1 minute)
    REPORT_INTERVAL: 60000  // Report every minute
  },
  NAVIGATION: {
    AUTO_COLLECT: true,
    REPORT_ON_LOAD: true,
    THRESHOLD_WARNING: 3000, // 3 seconds
    THRESHOLD_CRITICAL: 5000 // 5 seconds
  }
};

// Lazy loading configurations
export const LAZY_LOADING_CONFIG = {
  COMPONENTS: {
    DEFAULT_TIMEOUT: 10000,    // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,        // 1 second
    PRELOAD_DISTANCE: 2,      // Preload 2 components ahead
    CACHE_SIZE: 50           // Cache 50 loaded components
  },
  IMAGES: {
    ROOT_MARGIN: '50px',
    THRESHOLD: 0.1,
    LOADING_STRATEGY: 'lazy',
    PLACEHOLDER_COLOR: '#f0f0f0'
  },
  ROUTES: {
    DEFAULT_TIMEOUT: 5000,   // 5 seconds
    PRELOAD_ON_IDLE: true,
    PRELOAD_ON_HOVER: true,
    HOVER_DELAY: 200          // 200ms
  }
};

// Bundle optimization settings
export const BUNDLE_OPTIMIZATION = {
  CHUNKS: {
    MAX_SIZE: 244 * 1024,     // 244KB (gzip limit)
    MIN_SIZE: 30 * 1024,      // 30KB
    MAX_ASYNC_REQUESTS: 6,
    MAX_INITIAL_REQUESTS: 3
  },
  COMPRESSION: {
    ENABLED: true,
    ALGORITHM: 'gzip',
    LEVEL: 6,
    THRESHOLD: 1024          // Only compress files > 1KB
  },
  TREE_SHAKING: {
    ENABLED: true,
    MODE: 'sideEffects',
    PRESERVE_MODULES: true
  },
  MINIFICATION: {
    ENABLED: true,
    REMOVE_COMMENTS: true,
    REMOVE_CONSOLE: false,   // Keep console in development
    REMOVE_DEBUG: true
  }
};

// Resource optimization settings
export const RESOURCE_OPTIMIZATION = {
  IMAGES: {
    FORMATS: ['webp', 'avif', 'jpg', 'png'],
    DEFAULT_FORMAT: 'webp',
    QUALITY: {
      WEBP: 80,
      AVIF: 75,
      JPG: 85,
      PNG: 90
    },
    SIZES: {
      THUMBNAIL: { width: 150, height: 150 },
      SMALL: { width: 400, height: 300 },
      MEDIUM: { width: 800, height: 600 },
      LARGE: { width: 1200, height: 900 },
      EXTRA_LARGE: { width: 1920, height: 1080 }
    },
    LAZY_LOADING: true,
    PLACEHOLDER: {
      ENABLED: true,
      BLUR_RADIUS: 10,
      COLOR: '#e0e0e0'
    }
  },
  FONTS: {
    PRELOAD: true,
    DISPLAY: 'swap',
    FORMATS: ['woff2', 'woff'],
    SUBSET: true,
    CRITICAL_FONTS: ['Inter', 'Roboto']
  },
  SCRIPTS: {
    DEFER_NON_CRITICAL: true,
    ASYNC_NON_ESSENTIAL: true,
    PRELOAD_CRITICAL: true,
    MINIFY: true
  },
  STYLES: {
    MINIFY: true,
    INLINE_CRITICAL: true,
    PRELOAD_NON_CRITICAL: true,
    PURGE_UNUSED: true
  }
};

// Performance metrics
export const PERFORMANCE_METRICS = {
  CORE_WEB_VITALS: {
    LCP: 'largest-contentful-paint',
    FID: 'first-input-delay',
    CLS: 'cumulative-layout-shift'
  },
  CUSTOM_METRICS: {
    TTFB: 'time-to-first-byte',
    FCP: 'first-contentful-paint',
    TTI: 'time-to-interactive',
    SI: 'speed-index',
    FMP: 'first-meaningful-paint'
  },
  BUSINESS_METRICS: {
    CONVERSION_RATE: 'conversion-rate',
    BOUNCE_RATE: 'bounce-rate',
    USER_ENGAGEMENT: 'user-engagement',
    ERROR_RATE: 'error-rate'
  }
};

// Performance events
export const PERFORMANCE_EVENTS = {
  METRIC_RECORDED: 'performance:metric-recorded',
  THRESHOLD_EXCEEDED: 'performance:threshold-exceeded',
  BUNDLE_LOADED: 'performance:bundle-loaded',
  COMPONENT_LOADED: 'performance:component-loaded',
  CACHE_HIT: 'performance:cache-hit',
  CACHE_MISS: 'performance:cache-miss',
  MEMORY_WARNING: 'performance:memory-warning',
  FPS_DROP: 'performance:fps-drop',
  NETWORK_SLOW: 'performance:network-slow'
};

// Performance levels
export const PERFORMANCE_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  CRITICAL: 'critical'
};

// Optimization strategies
export const OPTIMIZATION_STRATEGIES = {
  LAZY_LOADING: 'lazy-loading',
  CODE_SPLITTING: 'code-splitting',
  TREE_SHAKING: 'tree-shaking',
  MINIFICATION: 'minification',
  COMPRESSION: 'compression',
  CACHING: 'caching',
  BUNDLING: 'bundling',
  PRELOADING: 'preloading',
  PREFETCHING: 'prefetching',
  IMAGE_OPTIMIZATION: 'image-optimization',
  FONT_OPTIMIZATION: 'font-optimization',
  CSS_OPTIMIZATION: 'css-optimization',
  JS_OPTIMIZATION: 'js-optimization'
};

// Performance budgets
export const PERFORMANCE_BUDGETS = {
  BUNDLE_SIZE: {
    TOTAL: 1024 * 1024,      // 1MB total
    VENDOR: 244 * 1024,       // 244KB vendor
    COMMON: 100 * 1024,       // 100KB common
    INITIAL: 500 * 1024       // 500KB initial
  },
  LOAD_TIME: {
    FIRST_PAINT: 1000,        // 1 second
    FIRST_CONTENTFUL_PAINT: 1500, // 1.5 seconds
    LARGEST_CONTENTFUL_PAINT: 2500, // 2.5 seconds
    TIME_TO_INTERACTIVE: 3000 // 3 seconds
  },
  REQUESTS: {
    TOTAL: 20,
    CSS: 3,
    JS: 5,
    IMAGES: 10,
    FONTS: 2
  }
};

// Performance alerts
export const PERFORMANCE_ALERTS = {
  FPS_LOW: {
    THRESHOLD: 30,
    SEVERITY: 'warning',
    MESSAGE: 'FPS is below optimal threshold'
  },
  LOAD_TIME_HIGH: {
    THRESHOLD: 3000,
    SEVERITY: 'warning',
    MESSAGE: 'Load time is exceeding acceptable limits'
  },
  MEMORY_HIGH: {
    THRESHOLD: 0.85,
    SEVERITY: 'critical',
    MESSAGE: 'Memory usage is critically high'
  },
  BUNDLE_SIZE_LARGE: {
    THRESHOLD: 1024 * 1024,
    SEVERITY: 'warning',
    MESSAGE: 'Bundle size is larger than recommended'
  },
  CACHE_HIT_RATE_LOW: {
    THRESHOLD: 0.5,
    SEVERITY: 'info',
    MESSAGE: 'Cache hit rate is below optimal'
  }
};

// Performance optimization presets
export const OPTIMIZATION_PRESETS = {
  PRODUCTION: {
    MINIFICATION: true,
    COMPRESSION: true,
    TREE_SHAKING: true,
    BUNDLE_ANALYSIS: true,
    SOURCE_MAPS: false,
    DEVTOOLS: false
  },
  DEVELOPMENT: {
    MINIFICATION: false,
    COMPRESSION: false,
    TREE_SHAKING: true,
    BUNDLE_ANALYSIS: true,
    SOURCE_MAPS: true,
    DEVTOOLS: true
  },
  TESTING: {
    MINIFICATION: false,
    COMPRESSION: false,
    TREE_SHAKING: true,
    BUNDLE_ANALYSIS: false,
    SOURCE_MAPS: true,
    DEVTOOLS: false
  },
  STAGING: {
    MINIFICATION: true,
    COMPRESSION: true,
    TREE_SHAKING: true,
    BUNDLE_ANALYSIS: true,
    SOURCE_MAPS: true,
    DEVTOOLS: true
  }
};
