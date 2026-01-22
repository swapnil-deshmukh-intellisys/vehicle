import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  HttpClient,
  RequestQueue,
  NetworkMonitor,
  networkUtils,
  httpClient,
  requestQueue,
  networkMonitor
} from '../networkUtils';

// Mock fetch
global.fetch = jest.fn();

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    }
  },
  writable: true
});

describe('NetworkUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('HttpClient', () => {
    // P2P Tests - Should pass consistently
    test('should create HTTP client with default options', () => {
      const client = new HttpClient();
      expect(client.baseURL).toBe('');
      expect(client.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(client.timeout).toBe(10000);
      expect(client.retryAttempts).toBe(3);
    });

    test('should create HTTP client with custom options', () => {
      const options = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        retryAttempts: 2,
        headers: { 'Authorization': 'Bearer token' }
      };
      
      const client = new HttpClient(options);
      expect(client.baseURL).toBe('https://api.example.com');
      expect(client.timeout).toBe(5000);
      expect(client.retryAttempts).toBe(2);
      expect(client.headers.Authorization).toBe('Bearer token');
    });

    test('should add request interceptors', () => {
      const client = new HttpClient();
      const interceptor = jest.fn((config) => ({ ...config, headers: { ...config.headers, 'X-Custom': 'value' } }));
      
      client.addRequestInterceptor(interceptor);
      expect(client.interceptors.request).toContain(interceptor);
    });

    test('should add response interceptors', () => {
      const client = new HttpClient();
      const interceptor = jest.fn((response) => ({ ...response, custom: true }));
      
      client.addResponseInterceptor(interceptor);
      expect(client.interceptors.response).toContain(interceptor);
    });

    test('should make GET request', async () => {
      const mockResponse = { data: 'test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      });
      
      const client = new HttpClient();
      const result = await client.get('/test');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.data).toBe(mockResponse);
    });

    test('should make POST request', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      });
      
      const client = new HttpClient();
      const result = await client.post('/test', { name: 'John' });
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'John' })
        })
      );
      expect(result.data).toBe(mockResponse);
    });

    // F2P Tests - Will fail before fix, pass after
    test('should handle request timeout', async () => {
      fetch.mockImplementationOnce(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new DOMException('AbortError')), 15000);
        });
      });
      
      const client = new HttpClient({ timeout: 1000 });
      
      await expect(client.get('/test')).rejects.toThrow('Request timeout');
    });

    test('should retry failed requests', async () => {
      // First two attempts fail
      fetch.mockRejectedValueOnce(new Error('Network error'));
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Third attempt succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      });
      
      const client = new HttpClient({ retryAttempts: 3, retryDelay: 100 });
      const result = await client.get('/test');
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result.data).toEqual({ success: true });
    });

    test('should not retry on client errors (4xx)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      const client = new HttpClient({ retryAttempts: 3 });
      
      await expect(client.get('/test')).rejects.toThrow('HTTP 404: Not Found');
      expect(fetch).toHaveBeenCalledTimes(1); // Should not retry
    });

    test('should apply request interceptors', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      });
      
      const client = new HttpClient();
      const interceptor = jest.fn((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Intercepted': 'true' }
      }));
      
      client.addRequestInterceptor(interceptor);
      await client.get('/test');
      
      expect(interceptor).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Intercepted': 'true' })
        })
      );
    });

    test('should apply response interceptors', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'original' }),
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      });
      
      const client = new HttpClient();
      const interceptor = jest.fn((response) => ({
        ...response,
        data: { ...response.data, modified: true }
      }));
      
      client.addResponseInterceptor(interceptor);
      const result = await client.get('/test');
      
      expect(interceptor).toHaveBeenCalled();
      expect(result.data).toEqual({ data: 'original', modified: true });
    });

    test('should handle different response content types', async () => {
      // JSON response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'json' }),
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' })
      });
      
      const client = new HttpClient();
      const jsonResult = await client.get('/json');
      expect(jsonResult.data).toEqual({ data: 'json' });
      
      // Text response
      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'plain text',
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' })
      });
      
      const textResult = await client.get('/text');
      expect(textResult.data).toBe('plain text');
    });
  });

  describe('RequestQueue', () => {
    // P2P Tests
    test('should create request queue with default options', () => {
      const queue = new RequestQueue();
      expect(queue.maxConcurrent).toBe(5);
      expect(queue.active).toBe(0);
      expect(queue.paused).toBe(false);
    });

    test('should create request queue with custom options', () => {
      const queue = new RequestQueue({ maxConcurrent: 3 });
      expect(queue.maxConcurrent).toBe(3);
    });

    test('should add request to queue', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1 });
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      const promise = queue.add(mockRequest);
      expect(queue.getStats().queued).toBe(0); // Should start processing immediately
      expect(queue.getStats().active).toBe(1);
      
      const result = await promise;
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalled();
    });

    test('should handle queue statistics', () => {
      const queue = new RequestQueue({ maxConcurrent: 2 });
      
      const stats = queue.getStats();
      expect(stats).toHaveProperty('queued');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('maxConcurrent');
      expect(stats).toHaveProperty('paused');
      
      expect(stats.queued).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.maxConcurrent).toBe(2);
      expect(stats.paused).toBe(false);
    });

    // F2P Tests
    test('should limit concurrent requests', async () => {
      const queue = new RequestQueue({ maxConcurrent: 2 });
      const mockRequest = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 100))
      );
      
      const promises = [
        queue.add(mockRequest),
        queue.add(mockRequest),
        queue.add(mockRequest),
        queue.add(mockRequest)
      ];
      
      // Should have 2 active, 2 queued
      expect(queue.getStats().active).toBe(2);
      expect(queue.getStats().queued).toBe(2);
      
      // Wait for all to complete
      await Promise.all(promises);
      expect(mockRequest).toHaveBeenCalledTimes(4);
    });

    test('should pause and resume queue processing', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1 });
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      queue.pause();
      
      const promise = queue.add(mockRequest);
      expect(queue.getStats().paused).toBe(true);
      expect(queue.getStats().queued).toBe(1);
      expect(queue.getStats().active).toBe(0);
      
      queue.resume();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalled();
    });

    test('should clear queue and reject pending requests', async () => {
      const queue = new RequestQueue({ maxConcurrent: 0 }); // Prevent processing
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      const promises = [
        queue.add(mockRequest),
        queue.add(mockRequest),
        queue.add(mockRequest)
      ];
      
      expect(queue.getStats().queued).toBe(3);
      
      queue.clear();
      
      // All promises should be rejected
      await expect(Promise.all(promises)).rejects.toThrow();
      expect(queue.getStats().queued).toBe(0);
    });
  });

  describe('NetworkMonitor', () => {
    // P2P Tests
    test('should create network monitor', () => {
      const monitor = new NetworkMonitor();
      expect(monitor.isOnline).toBe(true);
      expect(monitor.listeners).toBeInstanceOf(Set);
    });

    test('should add and remove listeners', () => {
      const monitor = new NetworkMonitor();
      const mockCallback = jest.fn();
      
      const removeListener = monitor.addListener(mockCallback);
      expect(typeof removeListener).toBe('function');
      expect(monitor.listeners.size).toBe(1);
      
      removeListener();
      expect(monitor.listeners.size).toBe(0);
    });

    test('should get network status', () => {
      const monitor = new NetworkMonitor();
      const status = monitor.getStatus();
      
      expect(status).toHaveProperty('online');
      expect(status).toHaveProperty('connection');
      expect(status.online).toBe(true);
      expect(status.connection).toHaveProperty('effectiveType');
    });

    // F2P Tests
    test('should handle online/offline events', () => {
      const monitor = new NetworkMonitor();
      const mockCallback = jest.fn();
      
      monitor.addListener(mockCallback);
      
      // Simulate offline event
      monitor.isOnline = false;
      monitor.notifyListeners('offline');
      
      expect(mockCallback).toHaveBeenCalledWith('offline', false);
      
      // Simulate online event
      monitor.isOnline = true;
      monitor.notifyListeners('online');
      
      expect(mockCallback).toHaveBeenCalledWith('online', true);
    });

    test('should handle listener errors gracefully', () => {
      const monitor = new NetworkMonitor();
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      monitor.addListener(errorCallback);
      
      // Should not throw error
      expect(() => {
        monitor.notifyListeners('online');
      }).not.toThrow();
    });
  });

  describe('networkUtils', () => {
    // P2P Tests
    test('should create HTTP client', () => {
      const client = networkUtils.createClient({ timeout: 5000 });
      expect(client).toBeInstanceOf(HttpClient);
      expect(client.timeout).toBe(5000);
    });

    test('should create request queue', () => {
      const queue = networkUtils.createQueue({ maxConcurrent: 3 });
      expect(queue).toBeInstanceOf(RequestQueue);
      expect(queue.maxConcurrent).toBe(3);
    });

    test('should create network monitor', () => {
      const monitor = networkUtils.createMonitor();
      expect(monitor).toBeInstanceOf(NetworkMonitor);
    });

    test('should validate URLs', () => {
      expect(networkUtils.isValidUrl('https://example.com')).toBe(true);
      expect(networkUtils.isValidUrl('http://localhost:3000')).toBe(true);
      expect(networkUtils.isValidUrl('invalid-url')).toBe(false);
      expect(networkUtils.isValidUrl('ftp://example.com')).toBe(true);
    });

    test('should get URL parameters', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com?name=John&age=30',
          search: '?name=John&age=30'
        },
        writable: true
      });
      
      const params = networkUtils.getUrlParams();
      expect(params).toEqual({ name: 'John', age: '30' });
    });

    test('should build URLs with parameters', () => {
      const url = networkUtils.buildUrl('https://example.com', {
        name: 'John',
        age: 30
      });
      
      expect(url).toBe('https://example.com/?name=John&age=30');
    });

    // F2P Tests
    test('should handle file download', () => {
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      const mockCreateElement = jest.fn(() => mockLink);
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild
      });
      
      networkUtils.downloadFile('https://example.com/file.pdf', 'file.pdf');
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('https://example.com/file.pdf');
      expect(mockLink.download).toBe('file.pdf');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });

    test('should handle file upload with progress', async () => {
      const mockXHR = {
        upload: {
          addEventListener: jest.fn()
        },
        addEventListener: jest.fn(),
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn()
      };
      
      global.XMLHttpRequest = jest.fn(() => mockXHR);
      
      const mockFile = new Blob(['test'], { type: 'text/plain' });
      const mockProgress = jest.fn();
      
      const uploadPromise = networkUtils.uploadFile(
        'https://example.com/upload',
        mockFile,
        { onProgress: mockProgress }
      );
      
      // Simulate progress event
      const progressCallback = mockXHR.upload.addEventListener.mock.calls[0][1];
      progressCallback({ loaded: 50, total: 100 });
      
      // Simulate load event
      const loadCallback = mockXHR.addEventListener.mock.calls[0][1];
      mockXHR.status = 200;
      mockXHR.responseText = '{"success": true}';
      loadCallback();
      
      const result = await uploadPromise;
      expect(result).toEqual({ success: true });
      expect(mockProgress).toHaveBeenCalledWith({
        loaded: 50,
        total: 100,
        percentage: 50
      });
    });

    test('should check network connectivity', async () => {
      // Mock successful connectivity check
      global.fetch = jest.fn().mockResolvedValue({
        ok: true
      });
      
      const isConnected = await networkUtils.checkConnectivity();
      expect(isConnected).toBe(true);
      
      // Mock failed connectivity check
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const isConnected2 = await networkUtils.checkConnectivity();
      expect(isConnected2).toBe(false);
    });

    test('should get connection type', () => {
      const connection = networkUtils.getConnectionType();
      
      if (connection) {
        expect(connection).toHaveProperty('effectiveType');
        expect(connection).toHaveProperty('downlink');
        expect(connection).toHaveProperty('rtt');
        expect(connection).toHaveProperty('saveData');
      } else {
        expect(connection).toBe(null);
      }
    });
  });

  describe('Global Instances', () => {
    // P2P Tests
    test('should provide global HTTP client', () => {
      expect(httpClient).toBeInstanceOf(HttpClient);
    });

    test('should provide global request queue', () => {
      expect(requestQueue).toBeInstanceOf(RequestQueue);
    });

    test('should provide global network monitor', () => {
      expect(networkMonitor).toBeInstanceOf(NetworkMonitor);
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete network workflow', async () => {
      // Mock successful API call
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      });
      
      // Use global HTTP client
      const result = await httpClient.get('/api/test');
      expect(result.data).toEqual({ data: 'test' });
      
      // Use request queue for multiple requests
      const mockRequest = jest.fn().mockResolvedValue('queued');
      const queueResult = await requestQueue.add(mockRequest);
      expect(queueResult).toBe('queued');
      
      // Check network status
      const status = networkMonitor.getStatus();
      expect(status.online).toBe(true);
    });
  });
});
