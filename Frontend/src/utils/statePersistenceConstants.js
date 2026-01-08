// State management and persistence constants

// State management constants
export const STATE_ACTIONS = {
  SET: 'SET',
  RESET: 'RESET',
  MERGE: 'MERGE',
  DELETE: 'DELETE',
  CLEAR: 'CLEAR'
};

// Persistence strategies
export const PERSISTENCE_STRATEGIES = {
  IMMEDIATE: 'immediate',
  DEBOUNCED: 'debounced',
  THROTTLED: 'throttled',
  MANUAL: 'manual'
};

// Storage priorities
export const STORAGE_PRIORITIES = {
  MEMORY: 1,
  SESSION: 2,
  LOCAL: 3,
  INDEXED_DB: 4,
  CUSTOM: 5
};

// Data types for validation
export const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array',
  FUNCTION: 'function',
  NULL: 'null',
  UNDEFINED: 'undefined'
};

// Event names for state management
export const STATE_EVENTS = {
  BEFORE_UPDATE: 'state:before_update',
  AFTER_UPDATE: 'state:after_update',
  BEFORE_RESET: 'state:before_reset',
  AFTER_RESET: 'state:after_reset',
  PERSIST_START: 'state:persist_start',
  PERSIST_SUCCESS: 'state:persist_success',
  PERSIST_ERROR: 'state:persist_error'
};

// Storage limits (in bytes)
export const STORAGE_LIMITS = {
  LOCAL_STORAGE: 5 * 1024 * 1024, // 5MB
  SESSION_STORAGE: 5 * 1024 * 1024, // 5MB
  INDEXED_DB: 50 * 1024 * 1024, // 50MB (varies by browser)
  MEMORY: 100 * 1024 * 1024 // 100MB (estimated)
};

// Default configurations
export const DEFAULT_STATE_CONFIG = {
  persist: true,
  history: true,
  middleware: [],
  maxHistorySize: 50,
  persistenceStrategy: PERSISTENCE_STRATEGIES.IMMEDIATE
};

export const DEFAULT_PERSISTENCE_CONFIG = {
  storage: 'localStorage',
  expiration: null,
  encrypt: false,
  compress: false,
  version: 1
};

// Error messages
export const ERROR_MESSAGES = {
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded',
  STORAGE_ACCESS_DENIED: 'Storage access denied',
  INVALID_DATA_TYPE: 'Invalid data type',
  PERSISTENCE_FAILED: 'Persistence failed',
  STATE_NOT_FOUND: 'State not found',
  INVALID_KEY: 'Invalid key provided'
};
