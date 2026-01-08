// Security constants and configurations

// Security levels
export const SECURITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Authentication methods
export const AUTH_METHODS = {
  PASSWORD: 'password',
  JWT: 'jwt',
  OAUTH: 'oauth',
  SAML: 'saml',
  LDAP: 'ldap',
  MFA: 'mfa'
};

// Session configurations
export const SESSION_CONFIG = {
  DEFAULT_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REMEMBER_ME_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_CONCURRENT_SESSIONS: 3
};

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  NO_SPACES: true,
  NO_REPEATED_CHARS: true,
  NO_SEQUENTIAL_NUMBERS: true
};

// Token configurations
export const TOKEN_CONFIG = {
  ALGORITHM: 'HS256',
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days
  ISSUER: 'vehicle-app',
  AUDIENCE: 'vehicle-users'
};

// Rate limiting
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 30 * 60 * 1000 // 30 minutes
  },
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000 // 1 hour
  },
  API_REQUESTS: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000 // 15 minutes
  }
};

// Security headers
export const SECURITY_HEADERS = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
  X_FRAME_OPTIONS: 'DENY',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  X_XSS_PROTECTION: '1; mode=block',
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
  PERMISSIONS_POLICY: 'geolocation=(), microphone=(), camera=(), payment=()'
};

// CORS configurations
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: ['http://localhost:3000', 'https://vehicle-app.com'],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  CREDENTIALS: true,
  MAX_AGE: 86400 // 24 hours
};

// Encryption settings
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-256-GCM',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  ITERATIONS: 100000
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  URL: /^https?:\/\/.+\..+/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD_STRENGTH: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
  CREDIT_CARD: /^\d{13,19}$/,
  POSTAL_CODE_US: /^\d{5}(-\d{4})?$/,
  POSTAL_CODE_CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
  POSTAL_CODE_UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/
};

// Error messages
export const SECURITY_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  ACCOUNT_LOCKED: 'Account has been locked due to too many failed attempts',
  TOKEN_EXPIRED: 'Authentication token has expired',
  TOKEN_INVALID: 'Invalid authentication token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to access this resource',
  SESSION_EXPIRED: 'Your session has expired, please log in again',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  VALIDATION_FAILED: 'Validation failed',
  SECURITY_VIOLATION: 'Security violation detected',
  UNAUTHORIZED_ACCESS: 'Unauthorized access attempt'
};

// Success messages
export const SECURITY_SUCCESS = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  ACCOUNT_CREATED: 'Account created successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET: 'Password reset instructions sent',
  MFA_ENABLED: 'Multi-factor authentication enabled',
  SESSION_EXTENDED: 'Session extended successfully'
};

// User roles
export const USER_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Permissions
export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  MANAGE_USERS: 'manage_users',
  MANAGE_CONTENT: 'manage_content',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SECURITY: 'manage_security'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.GUEST]: [PERMISSIONS.READ],
  [USER_ROLES.USER]: [PERMISSIONS.READ, PERMISSIONS.WRITE],
  [USER_ROLES.MODERATOR]: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.MANAGE_CONTENT],
  [USER_ROLES.ADMIN]: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_ANALYTICS],
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS)
};

// Audit events
export const AUDIT_EVENTS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_DELETED: 'account_deleted',
  ROLE_CHANGED: 'role_changed',
  PERMISSION_GRANTED: 'permission_granted',
  PERMISSION_REVOKED: 'permission_revoked',
  SECURITY_VIOLATION: 'security_violation',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification'
};

// Security policies
export const SECURITY_POLICIES = {
  PASSWORD_EXPIRY_DAYS: 90,
  PASSWORD_HISTORY_COUNT: 5,
  ACCOUNT_LOCKOUT_THRESHOLD: 5,
  ACCOUNT_LOCKOUT_DURATION: 30,
  MFA_REQUIRED_FOR_ADMIN: true,
  SESSION_TIMEOUT_MINUTES: 30,
  IDLE_TIMEOUT_MINUTES: 15,
  FORCE_LOGOUT_ON_PASSWORD_CHANGE: true
};
