// Caching system constants and configurations

// Cache types
export const CACHE_TYPES = {
  MEMORY: 'memory',
  LOCAL_STORAGE: 'localStorage',
  INDEXED_DB: 'indexedDB',
  SESSION_STORAGE: 'sessionStorage',
  SERVICE_WORKER: 'serviceWorker',
  MULTI_LEVEL: 'multiLevel'
};

// Cache strategies
export const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  STALE_IF_ERROR: 'stale-if-error'
};

// Cache levels
export const CACHE_LEVELS = {
  L1_MEMORY: 'l1-memory',
  L2_LOCAL_STORAGE: 'l2-localStorage',
  L3_INDEXED_DB: 'l3-indexedDB',
  L4_SERVICE_WORKER: 'l4-serviceWorker'
};

// Cache priorities
export const CACHE_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
  BACKGROUND: 'background'
};

// Cache TTL (Time To Live) settings
export const CACHE_TTL = {
  IMMEDIATE: 0,
  SHORT: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 30 * 60 * 1000,       // 30 minutes
  LONG: 60 * 60 * 1000,         // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  WEEK: 7 * 24 * 60 * 60 * 1000,  // 1 week
  MONTH: 30 * 24 * 60 * 60 * 1000 // 1 month
};

// Cache storage limits
export const CACHE_LIMITS = {
  MEMORY: {
    MAX_ITEMS: 100,
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    CLEANUP_THRESHOLD: 0.8
  },
  LOCAL_STORAGE: {
    MAX_SIZE: 5 * 1024 * 1024,  // 5MB (typical browser limit)
    CLEANUP_THRESHOLD: 0.9,
    QUOTA_EXCEEDED_RETRY: 3
  },
  INDEXED_DB: {
    MAX_SIZE: 2 * 1024 * 1024 * 1024, // 2GB (typical limit)
    CLEANUP_THRESHOLD: 0.85,
    BATCH_SIZE: 100
  },
  SERVICE_WORKER: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    CLEANUP_THRESHOLD: 0.8,
    MAX_ENTRIES: 1000
  }
};

// Cache key patterns
export const CACHE_KEY_PATTERNS = {
  API_RESPONSE: 'api_response_{endpoint}_{method}',
  USER_DATA: 'user_data_{userId}_{type}',
  COMPONENT: 'component_{name}_{version}',
  IMAGE: 'image_{url}_{size}_{format}',
  STATIC_ASSET: 'static_{path}_{version}',
  CONFIG: 'config_{environment}_{key}',
  SESSION: 'session_{sessionId}_{type}',
  TEMPORARY: 'temp_{timestamp}_{id}'
};

// Cache events
export const CACHE_EVENTS = {
  HIT: 'cache:hit',
  MISS: 'cache:miss',
  SET: 'cache:set',
  DELETE: 'cache:delete',
  CLEAR: 'cache:clear',
  EXPIRED: 'cache:expired',
  EVICTED: 'cache:evicted',
  ERROR: 'cache:error',
  CLEANUP: 'cache:cleanup',
  SYNC: 'cache:sync'
};

// Cache error types
export const CACHE_ERRORS = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  STORAGE_DISABLED: 'STORAGE_DISABLED',
  INVALID_KEY: 'INVALID_KEY',
  SERIALIZATION_ERROR: 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR: 'DESERIALIZATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CORS_ERROR: 'CORS_ERROR'
};

// Cache compression settings
export const CACHE_COMPRESSION = {
  ENABLED: true,
  ALGORITHM: 'gzip',
  THRESHOLD: 1024, // Only compress items > 1KB
  LEVEL: 6,
  DICTIONARY_SIZE: 32768
};

// Cache encryption settings
export const CACHE_ENCRYPTION = {
  ENABLED: false,
  ALGORITHM: 'AES-256-GCM',
  KEY_DERIVATION: 'PBKDF2',
  ITERATIONS: 100000,
  SALT_LENGTH: 16,
  IV_LENGTH: 12,
  TAG_LENGTH: 16
};

// Cache synchronization settings
export const CACHE_SYNC = {
  ENABLED: true,
  STRATEGY: 'broadcast-channel',
  CHANNEL_NAME: 'cache-sync',
  DEBOUNCE_TIME: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// Cache validation settings
export const CACHE_VALIDATION = {
  ENABLED: true,
  STRATEGY: 'etag-last-modified',
  MAX_AGE: 3600, // 1 hour
  MUST_REVALIDATE: false,
  NO_CACHE: false,
  NO_STORE: false,
  NO_TRANSFORM: true
};

// Cache warming strategies
export const CACHE_WARMING = {
  ENABLED: true,
  STRATEGIES: {
    ON_APP_LOAD: 'on-app-load',
    ON_USER_IDLE: 'on-user-idle',
    ON_NETWORK_ONLINE: 'on-network-online',
    ON_SCHEDULE: 'on-schedule'
  },
  SCHEDULE: {
    INTERVAL: 30 * 60 * 1000, // 30 minutes
    MAX_CONCURRENT: 3
  }
};

// Cache analytics settings
export const CACHE_ANALYTICS = {
  ENABLED: true,
  SAMPLE_RATE: 1.0, // 100% sampling
  METRICS: [
    'hit_rate',
    'miss_rate',
    'eviction_rate',
    'size_usage',
    'latency',
    'error_rate'
  ],
  REPORTING: {
    INTERVAL: 60 * 1000, // 1 minute
    BATCH_SIZE: 100,
    MAX_BATCHES: 10
  }
};

// Cache debugging settings
export const CACHE_DEBUGGING = {
  ENABLED: false,
  LOG_LEVEL: 'info',
  LOG_CACHE_OPERATIONS: false,
  LOG_PERFORMANCE: false,
  LOG_ERRORS: true,
  LOG_STATISTICS: false
};

// Cache presets for different use cases
export const CACHE_PRESETS = {
  API_RESPONSES: {
    TTL: CACHE_TTL.MEDIUM,
    STRATEGY: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    PRIORITY: CACHE_PRIORITIES.HIGH,
    COMPRESSION: true,
    ENCRYPTION: false
  },
  USER_PREFERENCES: {
    TTL: CACHE_TTL.VERY_LONG,
    STRATEGY: CACHE_STRATEGIES.CACHE_FIRST,
    PRIORITY: CACHE_PRIORITIES.HIGH,
    COMPRESSION: false,
    ENCRYPTION: true
  },
  STATIC_ASSETS: {
    TTL: CACHE_TTL.WEEK,
    STRATEGY: CACHE_STRATEGIES.CACHE_FIRST,
    PRIORITY: CACHE_PRIORITIES.NORMAL,
    COMPRESSION: true,
    ENCRYPTION: false
  },
  TEMPORARY_DATA: {
    TTL: CACHE_TTL.SHORT,
    STRATEGY: CACHE_STRATEGIES.MEMORY_ONLY,
    PRIORITY: CACHE_PRIORITIES.LOW,
    COMPRESSION: false,
    ENCRYPTION: false
  },
  CRITICAL_DATA: {
    TTL: CACHE_TTL.LONG,
    STRATEGY: CACHE_STRATEGIES.NETWORK_FIRST,
    PRIORITY: CACHE_PRIORITIES.CRITICAL,
    COMPRESSION: true,
    ENCRYPTION: true
  }
};

// Cache health check settings
export const CACHE_HEALTH_CHECK = {
  ENABLED: true,
  INTERVAL: 5 * 60 * 1000, // 5 minutes
  CHECKS: [
    'storage_availability',
    'quota_usage',
    'data_integrity',
    'performance_metrics'
  ],
  THRESHOLDS: {
    HIT_RATE_MIN: 0.7,      // 70%
    ERROR_RATE_MAX: 0.05,   // 5%
    LATENCY_MAX: 100,       // 100ms
    QUOTA_USAGE_MAX: 0.9    // 90%
  }
};

// Cache migration settings
export const CACHE_MIGRATION = {
  ENABLED: true,
  VERSION_KEY: 'cache_version',
  CURRENT_VERSION: '1.0.0',
  MIGRATION_STRATEGIES: {
    INCREMENTAL: 'incremental',
    FULL_REBUILD: 'full-rebuild',
    SELECTIVE: 'selective'
  },
  BACKUP_ENABLED: true,
  ROLLBACK_ENABLED: true
};

// Cache performance optimization settings
export const CACHE_PERFORMANCE = {
  BATCH_OPERATIONS: {
    ENABLED: true,
    BATCH_SIZE: 50,
    FLUSH_INTERVAL: 100
  },
  LAZY_LOADING: {
    ENABLED: true,
    THRESHOLD: 100,
    STRATEGY: 'on-demand'
  },
  PRELOADING: {
    ENABLED: true,
    STRATEGY: 'predictive',
    MAX_CONCURRENT: 3
  },
  COMPRESSION: {
    ENABLED: true,
    THRESHOLD: 1024,
    ALGORITHM: 'gzip'
  }
};

// Cache security settings
export const CACHE_SECURITY = {
  SANITIZE_KEYS: true,
  VALIDATE_DATA: true,
  ENCRYPT_SENSITIVE: false,
  ACCESS_CONTROL: {
    ENABLED: false,
    ROLES: ['admin', 'user'],
    PERMISSIONS: ['read', 'write', 'delete']
  },
  AUDIT_LOG: {
    ENABLED: true,
    EVENTS: ['set', 'delete', 'clear'],
    RETENTION: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};
