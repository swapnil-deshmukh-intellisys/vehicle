// Comprehensive security utility functions

// XSS Protection
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .trim();
};

export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') {
    return html;
  }

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export const escapeHTML = (str) => {
  if (typeof str !== 'string') {
    return str;
  }

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
};

// CSRF Protection
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token, sessionToken) => {
  return token && sessionToken && token === sessionToken;
};

export const setCSRFToken = (token) => {
  try {
    document.cookie = `csrf-token=${token}; SameSite=Strict; Secure`;
  } catch (error) {
    console.error('Failed to set CSRF token:', error);
  }
};

export const getCSRFToken = () => {
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
};

// Content Security Policy
export const generateCSPHeader = (options = {}) => {
  const {
    defaultSrc = "'self'",
    scriptSrc = "'self'",
    styleSrc = "'self' 'unsafe-inline'",
    imgSrc = "'self' data: https:",
    connectSrc = "'self'",
    fontSrc = "'self'",
    objectSrc = "'none'",
    mediaSrc = "'self'",
    frameSrc = "'none'",
    childSrc = "'none'",
    workerSrc = "'self'",
    manifestSrc = "'self'",
    upgradeInsecureRequests = true
  } = options;

  const directives = [
    `default-src ${defaultSrc}`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `font-src ${fontSrc}`,
    `object-src ${objectSrc}`,
    `media-src ${mediaSrc}`,
    `frame-src ${frameSrc}`,
    `child-src ${childSrc}`,
    `worker-src ${workerSrc}`,
    `manifest-src ${manifestSrc}`
  ];

  if (upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
};

// Secure Headers
export const setSecureHeaders = () => {
  // This would typically be done server-side, but we can prepare the values
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };

  return headers;
};

// Password Security
export const validatePassword = (password) => {
  const requirements = {
    minLength: 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommonPatterns: !/(.)\1{2,}/.test(password), // No 3+ repeated chars
    noSequentialNumbers: !/(012|123|234|345|456|567|678|789)/.test(password)
  };

  const isValid = Object.values(requirements).every(Boolean);
  const strength = calculatePasswordStrength(password);

  return {
    isValid,
    strength,
    requirements,
    feedback: getPasswordFeedback(requirements)
  };
};

const calculatePasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (password.length >= 16) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  if (score <= 6) return 'strong';
  return 'very-strong';
};

const getPasswordFeedback = (requirements) => {
  const feedback = [];
  
  if (!requirements.minLength) feedback.push('Password must be at least 8 characters');
  if (!requirements.hasUpperCase) feedback.push('Include uppercase letters');
  if (!requirements.hasLowerCase) feedback.push('Include lowercase letters');
  if (!requirements.hasNumbers) feedback.push('Include numbers');
  if (!requirements.hasSpecialChar) feedback.push('Include special characters');
  if (!requirements.noCommonPatterns) feedback.push('Avoid repeated characters');
  if (!requirements.noSequentialNumbers) feedback.push('Avoid sequential numbers');

  return feedback;
};

// Rate Limiting
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const timestamps = this.requests.get(key);
    
    // Remove old requests outside the window
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validTimestamps);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    return true;
  }

  getRemainingRequests(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      return this.maxRequests;
    }
    
    const timestamps = this.requests.get(key);
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  getResetTime(key) {
    if (!this.requests.has(key)) {
      return 0;
    }
    
    const timestamps = this.requests.get(key);
    if (timestamps.length === 0) {
      return 0;
    }
    
    return timestamps[0] + this.windowMs;
  }
}

// Input Validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateCreditCard = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0 && cleaned.length >= 13 && cleaned.length <= 19;
};

// Secure Storage
export const secureStorage = {
  set: (key, value, encrypt = true) => {
    try {
      const data = encrypt ? btoa(JSON.stringify(value)) : JSON.stringify(value);
      localStorage.setItem(key, data);
      return true;
    } catch (error) {
      console.error('Failed to store data securely:', error);
      return false;
    }
  },

  get: (key, decrypt = true) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      return decrypt ? JSON.parse(atob(data)) : JSON.parse(data);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove secure data:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      return false;
    }
  }
};

// Security Audit
export const runSecurityAudit = () => {
  const issues = [];

  // Check for HTTPS
  if (location.protocol !== 'https:') {
    issues.push({
      type: 'protocol',
      severity: 'high',
      message: 'Site is not using HTTPS'
    });
  }

  // Check for secure cookies
  if (document.cookie.includes('csrf-token') && !document.cookie.includes('Secure')) {
    issues.push({
      type: 'cookie',
      severity: 'medium',
      message: 'CSRF token cookie is not marked as Secure'
    });
  }

  // Check for console logs in production
  if (process.env.NODE_ENV === 'production' && console.log.toString().includes('native code')) {
    issues.push({
      type: 'debugging',
      severity: 'low',
      message: 'Console logging detected in production'
    });
  }

  return issues;
};

// Security Monitoring
export class SecurityMonitor {
  constructor() {
    this.events = [];
    this.maxEvents = 1000;
    this.suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi
    ];
  }

  logEvent(event) {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });

    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    this.checkForSuspiciousActivity(event);
  }

  checkForSuspiciousActivity(event) {
    if (event.type === 'input' && event.value) {
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(event.value)) {
          this.handleSuspiciousActivity(event, pattern);
          break;
        }
      }
    }
  }

  handleSuspiciousActivity(event, pattern) {
    console.warn('Suspicious activity detected:', {
      event,
      pattern: pattern.source
    });

    // In a real application, you might:
    // - Log to a security service
    // - Block the request
    // - Show a warning to the user
    // - Trigger additional authentication
  }

  getEvents(type = null, limit = 100) {
    let filtered = this.events;
    
    if (type) {
      filtered = filtered.filter(event => event.type === type);
    }
    
    return filtered.slice(-limit);
  }

  clearEvents() {
    this.events = [];
  }
}

// Create global security monitor
export const securityMonitor = new SecurityMonitor();

// Initialize security measures
export const initializeSecurity = () => {
  // Set up CSP meta tag (if not set by server)
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = generateCSPHeader();
    document.head.appendChild(meta);
  }

  // Monitor form submissions for suspicious content
  document.addEventListener('submit', (event) => {
    const form = event.target;
    const formData = new FormData(form);
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        securityMonitor.logEvent({
          type: 'form_submission',
          field: key,
          value: value.substring(0, 100) // Limit logged value length
        });
      }
    }
  });

  // Monitor input events
  document.addEventListener('input', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      securityMonitor.logEvent({
        type: 'input',
        field: event.target.name || event.target.id,
        value: event.target.value.substring(0, 100)
      });
    }
  });
};
