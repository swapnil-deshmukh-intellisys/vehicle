// WebSocket system constants and configurations

// WebSocket connection states
export const WS_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

// WebSocket ready states
export const WS_READY_STATES = {
  CONNECTING: 'CONNECTING',
  OPEN: 'OPEN',
  CLOSING: 'CLOSING',
  CLOSED: 'CLOSED'
};

// WebSocket protocols
export const WS_PROTOCOLS = {
  WS: 'ws',
  WSS: 'wss',
  HTTP: 'http',
  HTTPS: 'https'
};

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  // Connection management
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  PING: 'ping',
  PONG: 'pong',
  HEARTBEAT: 'heartbeat',
  
  // Authentication
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  DEAUTH: 'deauth',
  TOKEN_REFRESH: 'token_refresh',
  
  // Room management
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ROOM_USERS: 'room_users',
  ROOM_MESSAGE: 'room_message',
  
  // Messaging
  MESSAGE: 'message',
  BROADCAST: 'broadcast',
  PRIVATE_MESSAGE: 'private_message',
  SYSTEM_MESSAGE: 'system_message',
  
  // Data operations
  DATA_UPDATE: 'data_update',
  DATA_SYNC: 'data_sync',
  DATA_CREATE: 'data_create',
  DATA_DELETE: 'data_delete',
  DATA_PATCH: 'data_patch',
  
  // Notifications
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_DELETE: 'notification_delete',
  
  // Events
  EVENT: 'event',
  EVENT_EMIT: 'event_emit',
  EVENT_LISTEN: 'event_listen',
  EVENT_UNLISTEN: 'event_unlisten',
  
  // Errors
  ERROR: 'error',
  ERROR_CLIENT: 'error_client',
  ERROR_SERVER: 'error_server',
  ERROR_NETWORK: 'error_network',
  ERROR_TIMEOUT: 'error_timeout',
  
  // Status
  STATUS: 'status',
  STATUS_ONLINE: 'status_online',
  STATUS_OFFLINE: 'status_offline',
  STATUS_AWAY: 'status_away',
  STATUS_BUSY: 'status_busy',
  
  // File operations
  FILE_UPLOAD: 'file_upload',
  FILE_DOWNLOAD: 'file_download',
  FILE_PROGRESS: 'file_progress',
  FILE_COMPLETE: 'file_complete',
  FILE_ERROR: 'file_error',
  
  // Streaming
  STREAM_START: 'stream_start',
  STREAM_DATA: 'stream_data',
  STREAM_END: 'stream_end',
  STREAM_ERROR: 'stream_error',
  STREAM_PAUSE: 'stream_pause',
  STREAM_RESUME: 'stream_resume'
};

// WebSocket error codes
export const WS_ERROR_CODES = {
  // Standard close codes
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS_RECEIVED: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME_PAYLOAD_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_SERVER_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015,
  
  // Custom error codes
  AUTHENTICATION_FAILED: 4000,
  AUTHORIZATION_FAILED: 4001,
  ROOM_NOT_FOUND: 4002,
  ROOM_ACCESS_DENIED: 4003,
  ROOM_FULL: 4004,
  INVALID_MESSAGE_FORMAT: 4005,
  MESSAGE_TOO_LARGE: 4006,
  RATE_LIMIT_EXCEEDED: 4007,
  CONNECTION_TIMEOUT: 4008,
  HEARTBEAT_TIMEOUT: 4009,
  SERVER_OVERLOAD: 4010,
  MAINTENANCE_MODE: 4011,
  VERSION_MISMATCH: 4012,
  INVALID_TOKEN: 4013,
  TOKEN_EXPIRED: 4014
};

// WebSocket connection configurations
export const WS_CONNECTION_CONFIG = {
  // Connection settings
  DEFAULT_PROTOCOL: WS_PROTOCOLS.WS,
  SECURE_PROTOCOL: WS_PROTOCOLS.WSS,
  DEFAULT_PORT: 80,
  SECURE_PORT: 443,
  
  // Timeout settings
  CONNECTION_TIMEOUT: 10000,
  RESPONSE_TIMEOUT: 5000,
  HEARTBEAT_INTERVAL: 30000,
  HEARTBEAT_TIMEOUT: 5000,
  RECONNECT_DELAY: 3000,
  MAX_RECONNECT_DELAY: 30000,
  
  // Retry settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_BACKOFF_MULTIPLIER: 1.5,
  RECONNECT_JITTER: true,
  
  // Queue settings
  MESSAGE_QUEUE_SIZE: 100,
  MESSAGE_QUEUE_FLUSH_INTERVAL: 100,
  
  // Buffer settings
  BUFFER_SIZE: 1024 * 1024, // 1MB
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  FRAGMENT_SIZE: 16 * 1024 // 16KB
};

// WebSocket room configurations
export const WS_ROOM_CONFIG = {
  // Room limits
  MAX_ROOMS_PER_CONNECTION: 50,
  MAX_USERS_PER_ROOM: 1000,
  MAX_ROOM_NAME_LENGTH: 100,
  
  // Room management
  AUTO_LEAVE_ON_DISCONNECT: true,
  AUTO_REJOIN_ON_RECONNECT: true,
  ROOM_HISTORY_SIZE: 100,
  
  // Room permissions
  PUBLIC_ROOM_PREFIX: 'public:',
  PRIVATE_ROOM_PREFIX: 'private:',
  TEMPORARY_ROOM_PREFIX: 'temp:',
  SYSTEM_ROOM_PREFIX: 'system:'
};

// WebSocket authentication configurations
export const WS_AUTH_CONFIG = {
  // Token settings
  TOKEN_HEADER: 'Authorization',
  TOKEN_PREFIX: 'Bearer',
  TOKEN_REFRESH_INTERVAL: 300000, // 5 minutes
  TOKEN_EXPIRY_BUFFER: 60000, // 1 minute
  
  // Authentication methods
  AUTH_METHODS: {
    TOKEN: 'token',
    API_KEY: 'api_key',
    BASIC_AUTH: 'basic_auth',
    CUSTOM: 'custom'
  },
  
  // Permission levels
  PERMISSION_LEVELS: {
    GUEST: 'guest',
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
    SYSTEM: 'system'
  },
  
  // Role-based access
  ROLES: {
    READ_ONLY: 'read_only',
    READ_WRITE: 'read_write',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
  }
};

// WebSocket message routing configurations
export const WS_ROUTING_CONFIG = {
  // Route patterns
  ROUTE_PATTERN_SEPARATOR: ':',
  ROUTE_WILDCARD: '*',
  ROUTE_PARAM_PREFIX: ':',
  
  // Middleware settings
  MIDDLEWARE_ORDER: ['auth', 'validation', 'transform', 'logging', 'rate_limit'],
  MIDDLEWARE_TIMEOUT: 5000,
  
  // Route matching
  CASE_SENSITIVE: false,
  STRICT_MATCHING: true,
  ALLOW_DUPLICATE_ROUTES: false
};

// WebSocket rate limiting configurations
export const WS_RATE_LIMIT_CONFIG = {
  // General limits
  MESSAGES_PER_MINUTE: 100,
  CONNECTIONS_PER_MINUTE: 10,
  ROOM_JOINS_PER_MINUTE: 20,
  
  // Size limits
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Rate limit headers
  RATE_LIMIT_HEADERS: {
    LIMIT: 'X-RateLimit-Limit',
    REMAINING: 'X-RateLimit-Remaining',
    RESET: 'X-RateLimit-Reset',
    RETRY_AFTER: 'Retry-After'
  },
  
  // Rate limit strategies
  STRATEGIES: {
    FIXED_WINDOW: 'fixed_window',
    SLIDING_WINDOW: 'sliding_window',
    TOKEN_BUCKET: 'token_bucket',
    LEAKY_BUCKET: 'leaky_bucket'
  }
};

// WebSocket monitoring configurations
export const WS_MONITORING_CONFIG = {
  // Metrics collection
  ENABLE_METRICS: true,
  METRICS_INTERVAL: 60000, // 1 minute
  METRICS_RETENTION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Metrics types
  METRICS_TYPES: {
    CONNECTION_COUNT: 'connection_count',
    MESSAGE_COUNT: 'message_count',
    ERROR_COUNT: 'error_count',
    LATENCY: 'latency',
    THROUGHPUT: 'throughput',
  },
  
  // Logging configuration
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'json',
  LOG_BUFFER_SIZE: 1000,
  
  // Health check
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  HEALTH_CHECK_TIMEOUT: 5000,
  HEALTH_CHECK_ENDPOINT: '/ws/health'
};

// WebSocket compression configurations
export const WS_COMPRESSION_CONFIG = {
  // Compression settings
  ENABLE_COMPRESSION: true,
  COMPRESSION_THRESHOLD: 1024, // 1KB
  COMPRESSION_LEVEL: 6,
  
  // Compression algorithms
  ALGORITHMS: {
    DEFLATE: 'deflate',
    GZIP: 'gzip',
    BROTLI: 'brotli',
    LZ4: 'lz4'
  },
  
  // Window bits
  WINDOW_BITS: 15,
  MEM_LEVEL: 8
};

// WebSocket security configurations
export const WS_SECURITY_CONFIG = {
  // Security headers
  SECURITY_HEADERS: {
    ORIGIN: 'Origin',
    SEC_WEBSOCKET_KEY: 'Sec-WebSocket-Key',
    SEC_WEBSOCKET_VERSION: 'Sec-WebSocket-Version',
    SEC_WEBSOCKET_PROTOCOL: 'Sec-WebSocket-Protocol',
    SEC_WEBSOCKET_EXTENSIONS: 'Sec-WebSocket-Extensions'
  },
  
  // Origin validation
  ALLOWED_ORIGINS: ['*'],
  STRICT_ORIGIN_CHECK: false,
  
  // Subprotocol validation
  ALLOWED_SUBPROTOCOLS: [],
  REQUIRE_SUBPROTOCOL: false,
  
  // Extension validation
  ALLOWED_EXTENSIONS: ['permessage-deflate'],
  BLOCKED_EXTENSIONS: [],
  
  // Rate limiting
  ENABLE_RATE_LIMITING: true,
  RATE_LIMIT_PER_IP: true,
  RATE_LIMIT_PER_USER: true
};

// WebSocket event configurations
export const WS_EVENT_CONFIG = {
  // Event types
  EVENT_TYPES: {
    CONNECTION: 'connection',
    DISCONNECTION: 'disconnection',
    MESSAGE: 'message',
    ERROR: 'error',
    ROOM_JOIN: 'room_join',
    ROOM_LEAVE: 'room_leave',
    AUTH_SUCCESS: 'auth_success',
    AUTH_FAILURE: 'auth_failure'
  },
  
  // Event handling
  MAX_EVENT_LISTENERS: 100,
  EVENT_BUFFER_SIZE: 1000,
  EVENT_TIMEOUT: 5000,
  
  // Event priorities
  EVENT_PRIORITIES: {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
  }
};

// WebSocket debugging configurations
export const WS_DEBUG_CONFIG = {
  // Debug settings
  ENABLE_DEBUG: false,
  DEBUG_LEVEL: 'info',
  DEBUG_PREFIX: '[WS]',
  
  // Debug output
  DEBUG_TO_CONSOLE: true,
  DEBUG_TO_FILE: false,
  DEBUG_FILE_PATH: './websocket-debug.log',
  
  // Debug filters
  DEBUG_FILTER_EVENTS: [],
  DEBUG_FILTER_ROOMS: [],
  DEBUG_FILTER_USERS: [],
  
  // Performance debugging
  ENABLE_PERFORMANCE_DEBUG: false,
  PERFORMANCE_SAMPLE_RATE: 0.1,
  PERFORMANCE_THRESHOLD: 100 // milliseconds
};

// WebSocket environment configurations
export const WS_ENV_CONFIG = {
  // Development
  development: {
    ENABLE_DEBUG: true,
    LOG_LEVEL: 'debug',
    RECONNECT_DELAY: 1000,
    HEARTBEAT_INTERVAL: 15000,
    ALLOWED_ORIGINS: ['localhost', '127.0.0.1']
  },
  
  // Staging
  staging: {
    ENABLE_DEBUG: true,
    LOG_LEVEL: 'info',
    RECONNECT_DELAY: 2000,
    HEARTBEAT_INTERVAL: 30000,
    ALLOWED_ORIGINS: ['staging.example.com']
  },
  
  // Production
  production: {
    ENABLE_DEBUG: false,
    LOG_LEVEL: 'error',
    RECONNECT_DELAY: 3000,
    HEARTBEAT_INTERVAL: 30000,
    ALLOWED_ORIGINS: ['app.example.com']
  },
  
  // Testing
  testing: {
    ENABLE_DEBUG: true,
    LOG_LEVEL: 'debug',
    RECONNECT_DELAY: 100,
    HEARTBEAT_INTERVAL: 5000,
    ALLOWED_ORIGINS: ['*']
  }
};

// WebSocket client states
export const WS_CLIENT_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTING: 'disconnecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

// WebSocket room states
export const WS_ROOM_STATES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

// WebSocket message priorities
export const WS_MESSAGE_PRIORITIES = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
  SYSTEM: 4
};
