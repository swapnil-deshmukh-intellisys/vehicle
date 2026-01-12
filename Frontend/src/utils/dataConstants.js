// Data management constants and configurations

// Data types
export const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  DATE: 'date',
  NULL: 'null',
  UNDEFINED: 'undefined',
  FUNCTION: 'function',
  SYMBOL: 'symbol',
  BIGINT: 'bigint'
};

// Validation rules
export const VALIDATION_RULES = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  MIN_VALUE: 'minValue',
  MAX_VALUE: 'maxValue',
  PATTERN: 'pattern',
  EMAIL: 'email',
  URL: 'url',
  PHONE: 'phone',
  CREDIT_CARD: 'creditCard',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  CUSTOM: 'custom'
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  CREDIT_CARD: /^[\d\s\-]{13,19}$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  SLUG: /^[a-z0-9-]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
};

// Error types
export const DATA_ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  PERSISTENCE_ERROR: 'PERSISTENCE_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages
export const DATA_ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Data validation failed',
  TRANSFORMATION_ERROR: 'Data transformation failed',
  PERSISTENCE_ERROR: 'Data persistence failed',
  SYNC_ERROR: 'Data synchronization failed',
  CONFLICT_ERROR: 'Data conflict detected',
  NOT_FOUND_ERROR: 'Data not found',
  PERMISSION_ERROR: 'Permission denied',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Operation timeout',
  UNKNOWN_ERROR: 'Unknown error occurred',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_URL: 'Invalid URL',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_DATE: 'Invalid date format',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_TOO_WEAK: 'Password must contain uppercase, lowercase, number, and special character',
  USERNAME_INVALID: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
};

// Data store types
export const STORE_TYPES = {
  MEMORY: 'memory',
  LOCAL_STORAGE: 'localStorage',
  SESSION_STORAGE: 'sessionStorage',
  INDEXED_DB: 'indexedDB',
  WEB_SQL: 'webSQL',
  REMOTE: 'remote',
  HYBRID: 'hybrid'
};

// Persistence strategies
export const PERSISTENCE_STRATEGIES = {
  IMMEDIATE: 'immediate',
  DEBOUNCED: 'debounced',
  THROTTLED: 'throttled',
  BATCHED: 'batched',
  MANUAL: 'manual'
};

// Sync strategies
export const SYNC_STRATEGIES = {
  AUTO: 'auto',
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  EVENT_DRIVEN: 'event-driven',
  CONFLICT_FIRST: 'conflict-first',
  CONFLICT_LAST: 'conflict-last'
};

// Conflict resolution strategies
export const CONFLICT_RESOLUTION = {
  CLIENT_WINS: 'client-wins',
  SERVER_WINS: 'server-wins',
  LAST_WRITE_WINS: 'last-write-wins',
  FIRST_WRITE_WINS: 'first-write-wins',
  MERGE: 'merge',
  MANUAL: 'manual',
  TIMESTAMP: 'timestamp'
};

// Data transformation types
export const TRANSFORMATION_TYPES = {
  TRIM: 'trim',
  LOWERCASE: 'lowercase',
  UPPERCASE: 'uppercase',
  CAPITALIZE: 'capitalize',
  CAMEL_CASE: 'camelCase',
  SNAKE_CASE: 'snakeCase',
  KEBAB_CASE: 'kebabCase',
  PASCAL_CASE: 'pascalCase',
  NORMALIZE: 'normalize',
  SANITIZE: 'sanitize',
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  COMPRESS: 'compress',
  DECOMPRESS: 'decompress',
  SERIALIZE: 'serialize',
  DESERIALIZE: 'deserialize'
};

// Data formats
export const DATA_FORMATS = {
  JSON: 'json',
  XML: 'xml',
  CSV: 'csv',
  YAML: 'yaml',
  TOML: 'toml',
  INI: 'ini',
  BINARY: 'binary',
  TEXT: 'text',
  HTML: 'html',
  MARKDOWN: 'markdown'
};

// Encoding types
export const ENCODING_TYPES = {
  UTF8: 'utf8',
  UTF16: 'utf16',
  ASCII: 'ascii',
  BASE64: 'base64',
  HEX: 'hex',
  BINARY: 'binary'
};

// Compression types
export const COMPRESSION_TYPES = {
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  BROTLI: 'brotli',
  LZ4: 'lz4',
  SNAPPY: 'snappy'
};

// Encryption types
export const ENCRYPTION_TYPES = {
  AES: 'aes',
  RSA: 'rsa',
  DES: 'des',
  BLOWFISH: 'blowfish',
  CHACHA20: 'chacha20'
};

// Storage limits
export const STORAGE_LIMITS = {
  LOCAL_STORAGE: 5 * 1024 * 1024, // 5MB
  SESSION_STORAGE: 5 * 1024 * 1024, // 5MB
  INDEXED_DB: 50 * 1024 * 1024, // 50MB (varies by browser)
  WEB_SQL: 50 * 1024 * 1024, // 50MB
  QUOTA: 2 * 1024 * 1024 * 1024 // 2GB (total quota)
};

// Cache configurations
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000, // 5 minutes
  MAX_SIZE: 1000, // Maximum number of items
  CLEANUP_INTERVAL: 60000, // 1 minute
  EVICTION_POLICY: 'lru', // Least Recently Used
  COMPRESSION_THRESHOLD: 1024 // Compress items larger than 1KB
};

// Sync configurations
export const SYNC_CONFIG = {
  INTERVAL: 30000, // 30 seconds
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 10000,
  CONFLICT_TIMEOUT: 5000
};

// Validation configurations
export const VALIDATION_CONFIG = {
  STRICT_MODE: true,
  AUTO_FIX: false,
  SANITIZE_INPUT: true,
  VALIDATE_ON_CHANGE: true,
  VALIDATE_ON_SUBMIT: true,
  SHOW_ERRORS: true,
  ERROR_DELAY: 300
};

// Data schemas
export const DATA_SCHEMAS = {
  USER: {
    id: { type: DATA_TYPES.STRING, required: true },
    username: { type: DATA_TYPES.STRING, required: true, pattern: VALIDATION_PATTERNS.USERNAME },
    email: { type: DATA_TYPES.STRING, required: true, pattern: VALIDATION_PATTERNS.EMAIL },
    password: { type: DATA_TYPES.STRING, required: true, minLength: 8, pattern: VALIDATION_PATTERNS.PASSWORD },
    firstName: { type: DATA_TYPES.STRING, required: true, maxLength: 50 },
    lastName: { type: DATA_TYPES.STRING, required: true, maxLength: 50 },
    avatar: { type: DATA_TYPES.STRING, required: false },
    role: { type: DATA_TYPES.STRING, required: true },
    permissions: { type: DATA_TYPES.ARRAY, required: false },
    createdAt: { type: DATA_TYPES.DATE, required: true },
    updatedAt: { type: DATA_TYPES.DATE, required: true }
  },
  PRODUCT: {
    id: { type: DATA_TYPES.STRING, required: true },
    name: { type: DATA_TYPES.STRING, required: true, maxLength: 100 },
    description: { type: DATA_TYPES.STRING, required: false, maxLength: 1000 },
    price: { type: DATA_TYPES.NUMBER, required: true, minValue: 0 },
    category: { type: DATA_TYPES.STRING, required: true },
    tags: { type: DATA_TYPES.ARRAY, required: false },
    images: { type: DATA_TYPES.ARRAY, required: false },
    inventory: { type: DATA_TYPES.NUMBER, required: true, minValue: 0 },
    active: { type: DATA_TYPES.BOOLEAN, required: true },
    createdAt: { type: DATA_TYPES.DATE, required: true },
    updatedAt: { type: DATA_TYPES.DATE, required: true }
  },
  ORDER: {
    id: { type: DATA_TYPES.STRING, required: true },
    userId: { type: DATA_TYPES.STRING, required: true },
    items: { type: DATA_TYPES.ARRAY, required: true },
    total: { type: DATA_TYPES.NUMBER, required: true, minValue: 0 },
    status: { type: DATA_TYPES.STRING, required: true },
    paymentMethod: { type: DATA_TYPES.STRING, required: true },
    shippingAddress: { type: DATA_TYPES.OBJECT, required: true },
    billingAddress: { type: DATA_TYPES.OBJECT, required: false },
    createdAt: { type: DATA_TYPES.DATE, required: true },
    updatedAt: { type: DATA_TYPES.DATE, required: true }
  }
};

// Data presets
export const DATA_PRESETS = {
  USER_ROLES: ['admin', 'moderator', 'user', 'guest'],
  ORDER_STATUSES: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  PAYMENT_METHODS: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash'],
  PRODUCT_CATEGORIES: ['electronics', 'clothing', 'books', 'home', 'sports', 'toys'],
  NOTIFICATION_TYPES: ['info', 'success', 'warning', 'error'],
  LOG_LEVELS: ['debug', 'info', 'warn', 'error', 'fatal']
};

// Data events
export const DATA_EVENTS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  READ: 'read',
  SYNC: 'sync',
  SYNC_START: 'sync:start',
  SYNC_SUCCESS: 'sync:success',
  SYNC_ERROR: 'sync:error',
  VALIDATION_START: 'validation:start',
  VALIDATION_SUCCESS: 'validation:success',
  VALIDATION_ERROR: 'validation:error',
  TRANSFORMATION_START: 'transformation:start',
  TRANSFORMATION_SUCCESS: 'transformation:success',
  TRANSFORMATION_ERROR: 'transformation:error',
  PERSISTENCE_START: 'persistence:start',
  PERSISTENCE_SUCCESS: 'persistence:success',
  PERSISTENCE_ERROR: 'persistence:error',
  CONFLICT: 'conflict',
  CONFLICT_RESOLVED: 'conflict:resolved'
};

// Data states
export const DATA_STATES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  SAVING: 'saving',
  SAVED: 'saved',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error',
  CONFLICT: 'conflict',
  DIRTY: 'dirty',
  CLEAN: 'clean'
};

// Performance metrics
export const PERFORMANCE_METRICS = {
  OPERATION_TIME: 'operation_time',
  SYNC_TIME: 'sync_time',
  VALIDATION_TIME: 'validation_time',
  TRANSFORMATION_TIME: 'transformation_time',
  PERSISTENCE_TIME: 'persistence_time',
  CACHE_HIT_RATE: 'cache_hit_rate',
  ERROR_RATE: 'error_rate',
  THROUGHPUT: 'throughput',
  LATENCY: 'latency'
};

// Monitoring configurations
export const MONITORING_CONFIG = {
  ENABLE_METRICS: true,
  METRICS_INTERVAL: 60000, // 1 minute
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'info',
  ENABLE_TRACING: true,
  TRACING_SAMPLE_RATE: 0.1,
  ENABLE_PROFILING: false,
  PROFILING_SAMPLE_RATE: 0.01
};
