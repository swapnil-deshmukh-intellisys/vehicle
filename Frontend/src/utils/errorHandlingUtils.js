// Comprehensive error handling utility functions

// Error types
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  CLIENT: 'client',
  TIMEOUT: 'timeout',
  PARSE: 'parse',
  UNKNOWN: 'unknown'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Custom error class
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.stack = (new Error()).stack;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Error handler class
export class ErrorHandler {
  constructor(options = {}) {
    this.loggers = [];
    this.notifiers = [];
    this.retryStrategies = new Map();
    this.errorCache = new Map();
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.enableGlobalHandling = options.enableGlobalHandling !== false;
    
    if (this.enableGlobalHandling) {
      this.setupGlobalHandlers();
    }
  }

  // Setup global error handlers
  setupGlobalHandlers() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(new AppError(
        event.message,
        ERROR_TYPES.CLIENT,
        ERROR_SEVERITY.HIGH,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      ));
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new AppError(
        event.reason?.message || 'Unhandled promise rejection',
        ERROR_TYPES.CLIENT,
        ERROR_SEVERITY.HIGH,
        {
          reason: event.reason,
          stack: event.reason?.stack
        }
      ));
    });
  }

  // Handle error
  handleError(error, context = {}) {
    const processedError = this.processError(error, context);
    
    // Log error
    this.logError(processedError);
    
    // Cache error
    this.cacheError(processedError);
    
    // Notify if critical
    if (processedError.severity === ERROR_SEVERITY.CRITICAL) {
      this.notifyError(processedError);
    }
    
    return processedError;
  }

  // Process error
  processError(error, context) {
    let processedError;
    
    if (error instanceof AppError) {
      processedError = error;
    } else if (error instanceof Error) {
      processedError = new AppError(
        error.message,
        ERROR_TYPES.UNKNOWN,
        ERROR_SEVERITY.MEDIUM,
        { originalError: error.name, stack: error.stack }
      );
    } else if (typeof error === 'string') {
      processedError = new AppError(error);
    } else {
      processedError = new AppError(
        'Unknown error occurred',
        ERROR_TYPES.UNKNOWN,
        ERROR_SEVERITY.MEDIUM,
        { originalError: error }
      );
    }
    
    // Add context
    processedError.context = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      ...context
    };
    
    return processedError;
  }

  // Log error
  logError(error) {
    this.loggers.forEach(logger => {
      try {
        logger.log(error);
      } catch (loggerError) {
        console.error('Logger error:', loggerError);
      }
    });
  }

  // Cache error
  cacheError(error) {
    const key = `${error.type}-${error.message}-${error.timestamp}`;
    
    if (this.errorCache.size >= this.maxCacheSize) {
      // Remove oldest error
      const firstKey = this.errorCache.keys().next().value;
      this.errorCache.delete(firstKey);
    }
    
    this.errorCache.set(key, error);
  }

  // Notify error
  notifyError(error) {
    this.notifiers.forEach(notifier => {
      try {
        notifier.notify(error);
      } catch (notifierError) {
        console.error('Notifier error:', notifierError);
      }
    });
  }

  // Add logger
  addLogger(logger) {
    this.loggers.push(logger);
  }

  // Remove logger
  removeLogger(logger) {
    const index = this.loggers.indexOf(logger);
    if (index > -1) {
      this.loggers.splice(index, 1);
    }
  }

  // Add notifier
  addNotifier(notifier) {
    this.notifiers.push(notifier);
  }

  // Remove notifier
  removeNotifier(notifier) {
    const index = this.notifiers.indexOf(notifier);
    if (index > -1) {
      this.notifiers.splice(index, 1);
    }
  }

  // Add retry strategy
  addRetryStrategy(errorType, strategy) {
    this.retryStrategies.set(errorType, strategy);
  }

  // Get cached errors
  getCachedErrors(type = null) {
    const errors = Array.from(this.errorCache.values());
    
    if (type) {
      return errors.filter(error => error.type === type);
    }
    
    return errors;
  }

  // Clear error cache
  clearCache() {
    this.errorCache.clear();
  }

  // Get error statistics
  getErrorStats() {
    const errors = Array.from(this.errorCache.values());
    const stats = {
      total: errors.length,
      byType: {},
      bySeverity: {},
      recent: errors.slice(-10)
    };
    
    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });
    
    return stats;
  }
}

// Logger implementations
export class ConsoleLogger {
  log(error) {
    const logMethod = this.getLogMethod(error.severity);
    logMethod.call(console, `[${error.type.toUpperCase()}] ${error.message}`, error);
  }

  getLogMethod(severity) {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return console.info;
      case ERROR_SEVERITY.MEDIUM:
        return console.warn;
      case ERROR_SEVERITY.HIGH:
      case ERROR_SEVERITY.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
}

export class StorageLogger {
  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
    this.storageKey = 'error_logs';
  }

  log(error) {
    try {
      const logs = this.getLogs();
      logs.push(error);
      
      // Keep only the most recent entries
      if (logs.length > this.maxEntries) {
        logs.splice(0, logs.length - this.maxEntries);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to log error to storage:', storageError);
    }
  }

  getLogs() {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  clearLogs() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }
}

export class RemoteLogger {
  constructor(endpoint, apiKey = null) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async log(error) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(error)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (networkError) {
      console.error('Failed to send error to remote service:', networkError);
    }
  }
}

// Notifier implementations
export class ConsoleNotifier {
  notify(error) {
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      alert(`Critical Error: ${error.message}`);
    }
  }
}

export class BrowserNotifier {
  notify(error) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Error Occurred', {
        body: error.message,
        icon: '/error-icon.png'
      });
    }
  }

  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

// Retry strategies
export class RetryStrategy {
  constructor(maxAttempts = 3, delay = 1000, backoff = 2) {
    this.maxAttempts = maxAttempts;
    this.delay = delay;
    this.backoff = backoff;
  }

  async execute(fn, errorHandler = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (errorHandler) {
          errorHandler(error, attempt);
        }
        
        if (attempt < this.maxAttempts) {
          const waitTime = this.delay * Math.pow(this.backoff, attempt - 1);
          await this.delay(waitTime);
        }
      }
    }
    
    throw lastError;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Network error handling
export const handleNetworkError = (error) => {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 400:
        return new AppError(
          'Bad request',
          ERROR_TYPES.VALIDATION,
          ERROR_SEVERITY.MEDIUM,
          { status: error.response.status }
        );
      case 401:
        return new AppError(
          'Authentication required',
          ERROR_TYPES.AUTHENTICATION,
          ERROR_SEVERITY.HIGH,
          { status: error.response.status }
        );
      case 403:
        return new AppError(
          'Access denied',
          ERROR_TYPES.AUTHORIZATION,
          ERROR_SEVERITY.HIGH,
          { status: error.response.status }
        );
      case 404:
        return new AppError(
          'Resource not found',
          ERROR_TYPES.NOT_FOUND,
          ERROR_SEVERITY.MEDIUM,
          { status: error.response.status }
        );
      case 500:
        return new AppError(
          'Server error',
          ERROR_TYPES.SERVER,
          ERROR_SEVERITY.HIGH,
          { status: error.response.status }
        );
      default:
        return new AppError(
          `HTTP ${error.response.status}: ${error.response.statusText}`,
          ERROR_TYPES.SERVER,
          ERROR_SEVERITY.HIGH,
          { status: error.response.status }
        );
    }
  } else if (error.request) {
    // Network error
    return new AppError(
      'Network connection failed',
      ERROR_TYPES.NETWORK,
      ERROR_SEVERITY.HIGH,
      { originalError: error.message }
    );
  } else {
    // Other error
    return new AppError(
      error.message || 'Unknown error occurred',
      ERROR_TYPES.UNKNOWN,
      ERROR_SEVERITY.MEDIUM
    );
  }
};

// Error boundary for React
export class ErrorBoundary {
  constructor() {
    this.hasError = false;
    this.error = null;
    this.errorInfo = null;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.error = error;
    this.errorInfo = errorInfo;
    
    // Log the error
    if (window.errorHandler) {
      window.errorHandler.handleError(this.error, { errorInfo });
    }
  }

  reset() {
    this.hasError = false;
    this.error = null;
    this.errorInfo = null;
  }
}

// Utility functions
export const createError = (message, type, severity, details) => {
  return new AppError(message, type, severity, details);
};

export const isNetworkError = (error) => {
  return error.type === ERROR_TYPES.NETWORK;
};

export const isAuthenticationError = (error) => {
  return error.type === ERROR_TYPES.AUTHENTICATION;
};

export const isServerError = (error) => {
  return error.type === ERROR_TYPES.SERVER;
};

export const isCriticalError = (error) => {
  return error.severity === ERROR_SEVERITY.CRITICAL;
};

// Create global error handler
export const globalErrorHandler = new ErrorHandler({
  enableGlobalHandling: true
});

// Add default logger
globalErrorHandler.addLogger(new ConsoleLogger());

// Make error handler globally available
if (typeof window !== 'undefined') {
  window.errorHandler = globalErrorHandler;
  window.AppError = AppError;
}
