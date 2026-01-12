// Comprehensive API integration utility functions

// HTTP Client Class
export class HttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 10000;
    this.headers = options.headers || {};
    this.interceptors = {
      request: [],
      response: []
    };
    this.cache = options.cache || null;
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      retryCondition: (error) => {
        return !error.response || error.response.status >= 500;
      },
      ...options.retryConfig
    };
  }

  // Request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  // Response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  // Apply request interceptors
  async applyRequestInterceptors(config) {
    let processedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }
    
    return processedConfig;
  }

  // Apply response interceptors
  async applyResponseInterceptors(response) {
    let processedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  // Build request config
  buildRequestConfig(url, options = {}) {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    return {
      url: fullURL,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : null,
      timeout: options.timeout || this.timeout,
      ...options
    };
  }

  // Make HTTP request with retry logic
  async request(url, options = {}) {
    let config = this.buildRequestConfig(url, options);
    
    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);
    
    let lastError;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Check cache for GET requests
        if (config.method === 'GET' && this.cache) {
          const cachedResponse = await this.cache.get(config.url);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        const response = await this.makeRequest(config);
        
        // Apply response interceptors
        const processedResponse = await this.applyResponseInterceptors(response);
        
        // Cache GET responses
        if (config.method === 'GET' && this.cache && response.ok) {
          await this.cache.set(config.url, processedResponse, 300000); // 5 minutes
        }
        
        return processedResponse;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (!this.retryConfig.retryCondition(error) || attempt === this.retryConfig.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await this.delay(this.retryConfig.retryDelay * Math.pow(2, attempt));
      }
    }
    
    throw lastError;
  }

  // Make actual HTTP request
  async makeRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await this.parseResponse(response);
      
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data,
        url: response.url
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Parse response based on content type
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType?.includes('text/')) {
      return await response.text();
    }
    
    return await response.blob();
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP methods
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data = null, options = {}) {
    return this.request(url, { ...options, method: 'POST', body: data });
  }

  async put(url, data = null, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body: data });
  }

  async patch(url, data = null, options = {}) {
    return this.request(url, { ...options, method: 'PATCH', body: data });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // File upload
  async upload(url, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.additionalData) {
      Object.keys(options.additionalData).forEach(key => {
        formData.append(key, options.additionalData[key]);
      });
    }
    
    return this.request(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...options.headers,
        // Remove Content-Type to let browser set it with boundary
        'Content-Type': undefined
      }
    });
  }

  // Download file
  async download(url, filename = null, options = {}) {
    const response = await this.request(url, options);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const blob = response.data;
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || this.getFilenameFromResponse(response);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    
    return response;
  }

  // Extract filename from response headers
  getFilenameFromResponse(response) {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        return filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    return 'download';
  }
}

// API Service Class
export class ApiService {
  constructor(httpClient) {
    this.http = httpClient;
    this.endpoints = new Map();
    this.transformers = new Map();
  }

  // Register API endpoint
  registerEndpoint(name, config) {
    this.endpoints.set(name, {
      url: config.url,
      method: config.method || 'GET',
      transform: config.transform,
      cache: config.cache,
      ...config
    });
  }

  // Register data transformer
  registerTransformer(name, transformer) {
    this.transformers.set(name, transformer);
  }

  // Call API endpoint
  async call(endpointName, params = {}, options = {}) {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) {
      throw new Error(`Endpoint '${endpointName}' not found`);
    }
    
    // Build URL with parameters
    let url = endpoint.url;
    if (endpoint.method === 'GET' && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          searchParams.append(key, params[key]);
        }
      });
      url += `?${searchParams.toString()}`;
    }
    
    // Make request
    const response = await this.http.request(url, {
      ...options,
      method: endpoint.method,
      body: endpoint.method !== 'GET' ? params : null
    });
    
    // Apply transformation if configured
    if (endpoint.transform && response.data) {
      response.data = await this.applyTransform(endpoint.transform, response.data);
    }
    
    return response;
  }

  // Apply data transformation
  async applyTransform(transformerName, data) {
    const transformer = this.transformers.get(transformerName);
    if (!transformer) {
      return data;
    }
    
    if (typeof transformer === 'function') {
      return transformer(data);
    }
    
    return data;
  }

  // Batch requests
  async batch(requests) {
    const promises = requests.map(request => {
      if (request.endpoint) {
        return this.call(request.endpoint, request.params, request.options);
      } else {
        return this.http.request(request.url, request.options);
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      index,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // GraphQL request
  async graphql(query, variables = {}, options = {}) {
    return this.http.post('/graphql', {
      query,
      variables
    }, options);
  }
}

// Error Handler Class
export class ApiErrorHandler {
  constructor() {
    this.handlers = new Map();
    this.defaultHandler = this.defaultErrorHandler;
  }

  // Register error handler for specific status code
  registerHandler(statusCode, handler) {
    this.handlers.set(statusCode, handler);
  }

  // Register default error handler
  setDefaultHandler(handler) {
    this.defaultHandler = handler;
  }

  // Handle API error
  async handleError(error, context = {}) {
    const statusCode = error.response?.status;
    const handler = this.handlers.get(statusCode) || this.defaultHandler;
    
    return handler(error, context);
  }

  // Default error handler
  defaultErrorHandler(error, context) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    
    const apiError = new ApiError(message, statusCode, error.response?.data, context);
    
    // Log error
    console.error('API Error:', apiError);
    
    throw apiError;
  }

  // Common error handlers
  static unauthorizedHandler(error, context) {
    // Handle 401 Unauthorized
    if (context.logout) {
      context.logout();
    }
    
    throw new ApiError('Session expired. Please log in again.', 401, error.response?.data, context);
  }

  static forbiddenHandler(error, context) {
    // Handle 403 Forbidden
    throw new ApiError('Access denied. You do not have permission to perform this action.', 403, error.response?.data, context);
  }

  static notFoundHandler(error, context) {
    // Handle 404 Not Found
    throw new ApiError('The requested resource was not found.', 404, error.response?.data, context);
  }

  static serverErrorHandler(error, context) {
    // Handle 500 Internal Server Error
    throw new ApiError('An internal server error occurred. Please try again later.', 500, error.response?.data, context);
  }

  static networkErrorHandler(error, context) {
    // Handle network errors
    throw new ApiError('Network error. Please check your connection and try again.', 0, null, context);
  }
}

// Custom API Error Class
export class ApiError extends Error {
  constructor(message, statusCode = 0, data = null, context = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  // Check if error is client error (4xx)
  isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  // Check if error is server error (5xx)
  isServerError() {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  // Check if error is network error
  isNetworkError() {
    return this.statusCode === 0;
  }

  // Get error details
  getDetails() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      data: this.data,
      context: this.context,
      timestamp: this.timestamp,
      isClientError: this.isClientError(),
      isServerError: this.isServerError(),
      isNetworkError: this.isNetworkError()
    };
  }
}

// Request Queue Manager
export class RequestQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = options.maxConcurrent || 5;
    this.currentRequests = 0;
    this.retryFailed = options.retryFailed || true;
  }

  // Add request to queue
  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        request,
        resolve,
        reject,
        attempts: 0,
        maxAttempts: request.maxAttempts || 3
      });
      
      this.processQueue();
    });
  }

  // Process request queue
  async processQueue() {
    if (this.processing || this.currentRequests >= this.maxConcurrent) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0 && this.currentRequests < this.maxConcurrent) {
      const queueItem = this.queue.shift();
      this.currentRequests++;
      
      this.processRequest(queueItem);
    }
    
    this.processing = false;
  }

  // Process individual request
  async processRequest(queueItem) {
    try {
      const response = await queueItem.request();
      queueItem.resolve(response);
    } catch (error) {
      queueItem.attempts++;
      
      if (queueItem.attempts < queueItem.maxAttempts && this.retryFailed) {
        // Retry failed request
        setTimeout(() => {
          this.queue.push(queueItem);
          this.processQueue();
        }, 1000 * queueItem.attempts);
      } else {
        queueItem.reject(error);
      }
    } finally {
      this.currentRequests--;
      this.processQueue();
    }
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      currentRequests: this.currentRequests,
      maxConcurrent: this.maxConcurrent,
      processing: this.processing
    };
  }

  // Clear queue
  clear() {
    this.queue.forEach(item => {
      item.reject(new Error('Request cancelled'));
    });
    this.queue = [];
  }
}

// API Client Factory
export class ApiClientFactory {
  static createClient(options = {}) {
    const httpClient = new HttpClient(options);
    const apiService = new ApiService(httpClient);
    const errorHandler = new ApiErrorHandler();
    const requestQueue = new RequestQueue(options.queue);
    
    // Setup default error handlers
    errorHandler.registerHandler(401, ApiErrorHandler.unauthorizedHandler);
    errorHandler.registerHandler(403, ApiErrorHandler.forbiddenHandler);
    errorHandler.registerHandler(404, ApiErrorHandler.notFoundHandler);
    errorHandler.registerHandler(500, ApiErrorHandler.serverErrorHandler);
    
    // Add error interceptor
    httpClient.addResponseInterceptor(async (response) => {
      if (!response.ok) {
        await errorHandler.handleError(response, options.context);
      }
      return response;
    });
    
    // Add auth interceptor
    if (options.auth) {
      httpClient.addRequestInterceptor(async (config) => {
        const token = await options.auth.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
    }
    
    return {
      http: httpClient,
      api: apiService,
      error: errorHandler,
      queue: requestQueue
    };
  }
}

// Create default API client
export const defaultApiClient = ApiClientFactory.createClient({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 10000,
  context: {
    logout: () => {
      // Default logout handler
      console.log('Logging out due to authentication error');
    }
  }
});

// Initialize API integration
export const initializeAPI = (options = {}) => {
  const client = ApiClientFactory.createClient(options);
  
  // Setup global error handling
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof ApiError) {
      console.error('Unhandled API Error:', event.reason);
    }
  });
  
  return client;
};
