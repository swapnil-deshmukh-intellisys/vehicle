import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  StorageManager,
  CacheManager,
  storageUtils,
  localStorageManager,
  sessionStorageManager,
  memoryCache
} from '../storageUtils';

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('StorageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe('StorageManager', () => {
    // P2P Tests - Should pass consistently
    test('should create storage manager with localStorage', () => {
      const manager = new StorageManager('localStorage');
      expect(manager.storage).toBe(localStorageMock);
      expect(manager.prefix).toBe('app_');
    });

    test('should create storage manager with sessionStorage', () => {
      const manager = new StorageManager('sessionStorage');
      expect(manager.storage).toBe(sessionStorageMock);
    });

    test('should set and get items correctly', () => {
      const manager = new StorageManager('localStorage');
      
      manager.setItem('test', 'value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('app_test', expect.any(String));
      
      localStorageMock.getItem.mockReturnValue('{"value":"value","timestamp":123}');
      const result = manager.getItem('test');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('app_test');
    });

    test('should handle default values correctly', () => {
      const manager = new StorageManager('localStorage');
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = manager.getItem('nonexistent', 'default');
      expect(result).toBe('default');
    });

    test('should remove items correctly', () => {
      const manager = new StorageManager('localStorage');
      
      manager.removeItem('test');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('app_test');
    });

    test('should clear all items with prefix', () => {
      const manager = new StorageManager('localStorage');
      localStorageMock.key.mockReturnValue('app_test');
      Object.defineProperty(localStorageMock, 'length', { value: 1 });
      
      manager.clear();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('app_test');
    });

    // F2P Tests - Will fail before fix, pass after
    test('should handle TTL expiration correctly', () => {
      const manager = new StorageManager('localStorage');
      
      // Set item with TTL
      manager.setItem('test', 'value', { ttl: 1000 });
      
      // Mock expired item
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          value: 'value',
          timestamp: Date.now() - 2000,
          expires: Date.now() - 1000
        })
      );
      
      const result = manager.getItem('test', 'default');
      expect(result).toBe('default'); // Should return default due to expiration
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('app_test');
    });

    test('should handle encryption and decryption', () => {
      const manager = new StorageManager('localStorage');
      
      manager.setItem('test', 'value', { encrypt: true });
      
      // Mock encrypted value
      localStorageMock.getItem.mockReturnValue('encrypted:eyJ2YWx1ZSI6InZhbHVlIn0=');
      
      const result = manager.getItem('test');
      expect(result).toBe('value');
    });

    test('should track storage size correctly', () => {
      const manager = new StorageManager('localStorage');
      
      localStorageMock.getItem.mockReturnValue('test value');
      localStorageMock.key.mockReturnValue('app_test');
      Object.defineProperty(localStorageMock, 'length', { value: 1 });
      
      const size = manager.getSize();
      expect(size).toBeGreaterThan(0);
    });

    test('should get storage quota information', () => {
      const manager = new StorageManager('localStorage');
      
      localStorageMock.getItem.mockReturnValue('test value');
      localStorageMock.key.mockReturnValue('app_test');
      Object.defineProperty(localStorageMock, 'length', { value: 1 });
      
      const quota = manager.getQuota();
      expect(quota).toHaveProperty('used');
      expect(quota).toHaveProperty('total');
      expect(quota).toHaveProperty('percentage');
      expect(quota.total).toBe(5 * 1024 * 1024); // 5MB
    });

    test('should add and remove listeners', () => {
      const manager = new StorageManager('localStorage');
      const mockCallback = jest.fn();
      
      const removeListener = manager.addListener('test', mockCallback);
      expect(typeof removeListener).toBe('function');
      
      // Test listener removal
      removeListener();
      // Listener should be removed (no direct way to test this, but function should not throw)
    });
  });

  describe('CacheManager', () => {
    // P2P Tests
    test('should create cache manager with default options', () => {
      const cache = new CacheManager();
      expect(cache.maxSize).toBe(100);
      expect(cache.ttl).toBe(3600000); // 1 hour
    });

    test('should create cache manager with custom options', () => {
      const cache = new CacheManager({ maxSize: 50, ttl: 1800000 });
      expect(cache.maxSize).toBe(50);
      expect(cache.ttl).toBe(1800000);
    });

    test('should set and get items correctly', () => {
      const cache = new CacheManager();
      
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      expect(cache.size()).toBe(1);
    });

    test('should handle cache misses', () => {
      const cache = new CacheManager();
      
      expect(cache.get('nonexistent')).toBe(null);
    });

    test('should delete items correctly', () => {
      const cache = new CacheManager();
      
      cache.set('test', 'value');
      cache.delete('test');
      expect(cache.get('test')).toBe(null);
      expect(cache.size()).toBe(0);
    });

    test('should clear cache correctly', () => {
      const cache = new CacheManager();
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('test1')).toBe(null);
      expect(cache.get('test2')).toBe(null);
    });

    // F2P Tests
    test('should handle TTL expiration correctly', () => {
      const cache = new CacheManager({ ttl: 100 });
      
      cache.set('test', 'value');
      
      // Wait for expiration
      jest.advanceTimersByTime(150);
      
      expect(cache.get('test')).toBe(null);
    });

    test('should handle cache size limit correctly', () => {
      const cache = new CacheManager({ maxSize: 2 });
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      cache.set('test3', 'value3'); // Should remove oldest
      
      expect(cache.size()).toBe(2);
      expect(cache.get('test1')).toBe(null); // Should be removed
      expect(cache.get('test2')).toBe('value2');
      expect(cache.get('test3')).toBe('value3');
    });

    test('should update access order correctly', () => {
      const cache = new CacheManager({ maxSize: 3 });
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      cache.set('test3', 'value3');
      
      // Access test1 to make it most recently used
      cache.get('test1');
      
      // Add new item, should remove test2 (least recently used)
      cache.set('test4', 'value4');
      
      expect(cache.get('test1')).toBe('value1'); // Should still exist
      expect(cache.get('test2')).toBe(null); // Should be removed
      expect(cache.get('test3')).toBe('value3');
      expect(cache.get('test4')).toBe('value4');
    });

    test('should clean expired items', () => {
      const cache = new CacheManager({ ttl: 100 });
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      
      // Wait for partial expiration
      jest.advanceTimersByTime(150);
      
      cache.set('test3', 'value3'); // This won't expire
      
      const cleanedCount = cache.cleanExpired();
      expect(cleanedCount).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.get('test3')).toBe('value3');
    });

    test('should get cache statistics', () => {
      const cache = new CacheManager({ maxSize: 10 });
      
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      
      const stats = cache.getStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('expired');
      expect(stats).toHaveProperty('hitRate');
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(10);
    });
  });

  describe('storageUtils', () => {
    // P2P Tests
    test('should create storage manager', () => {
      const manager = storageUtils.createManager('localStorage');
      expect(manager).toBeInstanceOf(StorageManager);
    });

    test('should create cache manager', () => {
      const cache = storageUtils.createCache({ maxSize: 50 });
      expect(cache).toBeInstanceOf(CacheManager);
      expect(cache.maxSize).toBe(50);
    });

    test('should provide localStorage shortcuts', () => {
      expect(typeof storageUtils.local.set).toBe('function');
      expect(typeof storageUtils.local.get).toBe('function');
      expect(typeof storageUtils.local.remove).toBe('function');
      expect(typeof storageUtils.local.clear).toBe('function');
    });

    test('should provide sessionStorage shortcuts', () => {
      expect(typeof storageUtils.session.set).toBe('function');
      expect(typeof storageUtils.session.get).toBe('function');
      expect(typeof storageUtils.session.remove).toBe('function');
      expect(typeof storageUtils.session.clear).toBe('function');
    });

    // F2P Tests
    test('should detect storage availability', () => {
      expect(storageUtils.isAvailable('localStorage')).toBe(true);
      expect(storageUtils.isAvailable('sessionStorage')).toBe(true);
    });

    test('should get storage information', () => {
      localStorageMock.getItem.mockReturnValue('test');
      localStorageMock.key.mockReturnValue('app_test');
      Object.defineProperty(localStorageMock, 'length', { value: 1 });
      
      const info = storageUtils.getStorageInfo('localStorage');
      
      expect(info).toHaveProperty('available');
      expect(info).toHaveProperty('quota');
      expect(info).toHaveProperty('keys');
      expect(info).toHaveProperty('size');
      expect(info.available).toBe(true);
    });

    test('should handle unavailable storage', () => {
      // Mock unavailable storage
      Object.defineProperty(window, 'localStorage', {
        value: undefined
      });
      
      const info = storageUtils.getStorageInfo('localStorage');
      expect(info.available).toBe(false);
      
      // Restore mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });
    });

    test('should compress and decompress data', () => {
      const data = { name: 'John', age: 30 };
      
      const compressed = storageUtils.compress(data);
      expect(typeof compressed).toBe('string');
      
      const decompressed = storageUtils.decompress(compressed);
      expect(decompressed).toEqual(data);
    });

    test('should handle compression errors gracefully', () => {
      const invalidData = { circular: {} };
      invalidData.circular.self = invalidData;
      
      const compressed = storageUtils.compress(invalidData);
      expect(compressed).toBe(invalidData); // Should return original on error
      
      const decompressed = storageUtils.decompress(compressed);
      expect(decompressed).toBe(compressed);
    });
  });

  describe('Global Instances', () => {
    // P2P Tests
    test('should provide global localStorage manager', () => {
      expect(localStorageManager).toBeInstanceOf(StorageManager);
    });

    test('should provide global sessionStorage manager', () => {
      expect(sessionStorageManager).toBeInstanceOf(StorageManager);
    });

    test('should provide global memory cache', () => {
      expect(memoryCache).toBeInstanceOf(CacheManager);
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete storage workflow', () => {
      // Use localStorage shortcuts
      storageUtils.local.set('user', { name: 'John', age: 30 });
      
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          value: { name: 'John', age: 30 },
          timestamp: Date.now()
        })
      );
      
      const user = storageUtils.local.get('user');
      expect(user).toEqual({ name: 'John', age: 30 });
      
      // Use cache for temporary storage
      memoryCache.set('session', { token: 'abc123' });
      const session = memoryCache.get('session');
      expect(session).toEqual({ token: 'abc123' });
      
      // Clean up
      storageUtils.local.remove('user');
      memoryCache.delete('session');
    });
  });
});
