// API integration constants and configurations

// HTTP methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URLENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  BINARY: 'application/octet-stream',
  PDF: 'application/pdf',
  IMAGE: 'image/*',
  VIDEO: 'video/*',
  AUDIO: 'audio/*'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  USER: {
    PROFILE: '/user/profile',
    SETTINGS: '/user/settings',
    PREFERENCES: '/user/preferences',
    AVATAR: '/user/avatar',
    NOTIFICATIONS: '/user/notifications',
    ACTIVITY: '/user/activity'
  },
  DATA: {
    LIST: '/data',
    CREATE: '/data/create',
    UPDATE: '/data/update',
    DELETE: '/data/delete',
    SEARCH: '/data/search',
    EXPORT: '/data/export',
    IMPORT: '/data/import'
  },
  ADMIN: {
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    PERMISSIONS: '/admin/permissions',
    AUDIT: '/admin/audit',
    SYSTEM: '/admin/system'
  }
};

// Request configurations
export const REQUEST_CONFIG = {
  DEFAULT_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_DELAY_MULTIPLIER: 2,
  MAX_RETRY_DELAY: 10000,
  BATCH_SIZE: 10,
  CONCURRENT_LIMIT: 5,
  CACHE_TTL: 300000, // 5 minutes
  QUEUE_MAX_SIZE: 100
};

// Error types
export const API_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  PARSE_ERROR: 'Failed to parse server response.',
  VALIDATION_ERROR: 'Invalid data provided.',
  AUTHENTICATION_ERROR: 'Authentication required.',
  AUTHORIZATION_ERROR: 'Access denied.',
  NOT_FOUND_ERROR: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMIT_ERROR: 'Too many requests. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred.'
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

// Request interceptors
export const INTERCEPTOR_TYPES = {
  REQUEST: 'request',
  RESPONSE: 'response',
  ERROR: 'error'
};

// Authentication types
export const AUTH_TYPES = {
  BEARER: 'Bearer',
  BASIC: 'Basic',
  API_KEY: 'ApiKey',
  CUSTOM: 'Custom'
};

// Rate limiting
export const RATE_LIMITING = {
  DEFAULT_LIMIT: 100,
  DEFAULT_WINDOW: 60000, // 1 minute
  BURST_LIMIT: 10,
  RETRY_AFTER_HEADER: 'Retry-After',
  RATE_LIMIT_HEADERS: {
    LIMIT: 'X-RateLimit-Limit',
    REMAINING: 'X-RateLimit-Remaining',
    RESET: 'X-RateLimit-Reset'
  }
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
  PAGE_PARAM: 'page',
  SIZE_PARAM: 'size',
  SORT_PARAM: 'sort',
  FILTER_PARAM: 'filter'
};

// Sorting
export const SORTING = {
  ASC: 'asc',
  DESC: 'desc',
  DEFAULT_SORT: 'id',
  DIRECTIONS: ['asc', 'desc']
};

// Filtering
export const FILTERING = {
  OPERATORS: {
    EQUALS: 'eq',
    NOT_EQUALS: 'ne',
    GREATER_THAN: 'gt',
    GREATER_THAN_OR_EQUAL: 'gte',
    LESS_THAN: 'lt',
    LESS_THAN_OR_EQUAL: 'lte',
    IN: 'in',
    NOT_IN: 'nin',
    CONTAINS: 'contains',
    STARTS_WITH: 'startsWith',
    ENDS_WITH: 'endsWith'
  },
  LOGICAL_OPERATORS: {
    AND: 'and',
    OR: 'or',
    NOT: 'not'
  }
};

// Response formats
export const RESPONSE_FORMATS = {
  JSON: 'json',
  TEXT: 'text',
  BLOB: 'blob',
  ARRAY_BUFFER: 'arrayBuffer',
  STREAM: 'stream'
};

// Request headers
export const HEADERS = {
  ACCEPT: 'Accept',
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  USER_AGENT: 'User-Agent',
  X_REQUESTED_WITH: 'X-Requested-With',
  X_API_VERSION: 'X-API-Version',
  X_CLIENT_ID: 'X-Client-ID',
  X_REQUEST_ID: 'X-Request-ID',
  IF_NONE_MATCH: 'If-None-Match',
  IF_MODIFIED_SINCE: 'If-Modified-Since'
};

// CORS headers
export const CORS_HEADERS = {
  ORIGIN: 'Access-Control-Allow-Origin',
  METHODS: 'Access-Control-Allow-Methods',
  HEADERS: 'Access-Control-Allow-Headers',
  CREDENTIALS: 'Access-Control-Allow-Credentials',
  MAX_AGE: 'Access-Control-Max-Age',
  EXPOSE_HEADERS: 'Access-Control-Expose-Headers'
};

// Security headers
export const SECURITY_HEADERS = {
  X_FRAME_OPTIONS: 'X-Frame-Options',
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  X_XSS_PROTECTION: 'X-XSS-Protection',
  STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security',
  CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
  REFERRER_POLICY: 'Referrer-Policy'
};

// API versions
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
  V3: 'v3',
  DEFAULT: 'v1'
};

// Environment configurations
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TESTING: 'testing'
};

// Base URLs for different environments
export const BASE_URLS = {
  [ENVIRONMENTS.DEVELOPMENT]: 'http://localhost:3001/api',
  [ENVIRONMENTS.STAGING]: 'https://staging-api.example.com/api',
  [ENVIRONMENTS.PRODUCTION]: 'https://api.example.com/api',
  [ENVIRONMENTS.TESTING]: 'http://localhost:3001/api/test'
};

// WebSocket configurations
export const WEBSOCKET_CONFIG = {
  PROTOCOLS: ['ws', 'wss'],
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,
  HEARTBEAT_TIMEOUT: 5000,
  MESSAGE_QUEUE_SIZE: 100,
  CONNECTION_TIMEOUT: 10000
};

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
  AUTH: 'auth',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_MESSAGE: 'room_message',
  BROADCAST: 'broadcast',
  NOTIFICATION: 'notification',
  DATA_UPDATE: 'data_update'
};

// File upload configurations
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
    'application/xml'
  ],
  CHUNK_SIZE: 1024 * 1024, // 1MB
  MAX_CONCURRENT_UPLOADS: 3,
  TIMEOUT: 300000 // 5 minutes
};

// Download configurations
export const DOWNLOAD = {
  TIMEOUT: 300000, // 5 minutes
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/json',
    'application/zip',
    'application/x-zip-compressed'
  ]
};

// Monitoring and logging
export const MONITORING = {
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  },
  METRICS: {
    REQUEST_COUNT: 'request_count',
    RESPONSE_TIME: 'response_time',
    ERROR_RATE: 'error_rate',
    CACHE_HIT_RATE: 'cache_hit_rate'
  },
  SAMPLING_RATE: 1.0
};

// Health check
export const HEALTH_CHECK = {
  ENDPOINT: '/health',
  INTERVAL: 30000, // 30 seconds
  TIMEOUT: 5000,
  STATUS: {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    DEGRADED: 'degraded'
  }
};
