// Comprehensive network utilities with retry logic and error handling

// HTTP Client Class
export class HttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    this.timeout = options.timeout || 10000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.interceptors = {
      request: [],
      response: []
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  // Make HTTP request with retry logic
  async request(config) {
    const finalConfig = {
      method: 'GET',
      ...config,
      url: this.baseURL + config.url,
      headers: { ...this.headers, ...config.headers }
    };

    // Apply request interceptors
    for (const interceptor of this.interceptors.request) {
      finalConfig = interceptor(finalConfig) || finalConfig;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(finalConfig);
        
        // Apply response interceptors
        let processedResponse = response;
        for (const interceptor of this.interceptors.response) {
          processedResponse = interceptor(processedResponse) || processedResponse;
        }
        
        return processedResponse;
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  // Make actual HTTP request
  async makeRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        response
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Convenience methods
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  async post(url, data, config = {}) {
    return this.request({
      ...config,
      method: 'POST',
      url,
      body: JSON.stringify(data)
    });
  }

  async put(url, data, config = {}) {
    return this.request({
      ...config,
      method: 'PUT',
      url,
      body: JSON.stringify(data)
    });
  }

  async patch(url, data, config = {}) {
    return this.request({
      ...config,
      method: 'PATCH',
      url,
      body: JSON.stringify(data)
    });
  }

  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }

  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Request Queue Manager
export class RequestQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 5;
    this.queue = [];
    this.active = 0;
    this.paused = false;
  }

  // Add request to queue
  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.process();
    });
  }

  // Process queue
  async process() {
    if (this.paused || this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.active++;
    const { request, resolve, reject } = this.queue.shift();

    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.active--;
      this.process();
    }
  }

  // Pause queue processing
  pause() {
    this.paused = true;
  }

  // Resume queue processing
  resume() {
    this.paused = false;
    this.process();
  }

  // Clear queue
  clear() {
    this.queue.forEach(({ reject }) => {
      reject(new Error('Request cancelled'));
    });
    this.queue = [];
  }

  // Get queue statistics
  getStats() {
    return {
      queued: this.queue.length,
      active: this.active,
      maxConcurrent: this.maxConcurrent,
      paused: this.paused
    };
  }
}

// Network Status Monitor
export class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.setupEventListeners();
  }

  // Setup event listeners
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event, this.isOnline);
      } catch (error) {
        console.error('Network monitor listener error:', error);
      }
    });
  }

  // Get current status
  getStatus() {
    return {
      online: this.isOnline,
      connection: navigator.connection || {
        effectiveType: 'unknown',
        downlink: 'unknown',
        rtt: 'unknown'
      }
    };
  }
}

// Network Utilities
export const networkUtils = {
  // Create HTTP client
  createClient(options) {
    return new HttpClient(options);
  },

  // Create request queue
  createQueue(options) {
    return new RequestQueue(options);
  },

  // Create network monitor
  createMonitor() {
    return new NetworkMonitor();
  },

  // Check if URL is valid
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get URL parameters
  getUrlParams(url = window.location.href) {
    const urlObj = new URL(url);
    const params = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  },

  // Build URL with parameters
  buildUrl(base, params = {}) {
    const url = new URL(base);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
    
    return url.toString();
  },

  // Download file
  downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Upload file with progress
  async uploadFile(url, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (options.onProgress) {
          options.onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100
          });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', url);
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      
      xhr.send(formData);
    });
  },

  // Check network connectivity
  async checkConnectivity() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get connection type
  getConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return null;
  }
};

// Create global instances
export const httpClient = new HttpClient();
export const requestQueue = new RequestQueue();
export const networkMonitor = new NetworkMonitor();

// Export default
export default {
  HttpClient,
  RequestQueue,
  NetworkMonitor,
  networkUtils,
  httpClient,
  requestQueue,
  networkMonitor
};
