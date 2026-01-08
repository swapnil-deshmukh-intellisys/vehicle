// Advanced caching utility functions

// Multi-Level Cache System
export class AdvancedCache {
  constructor(options = {}) {
    this.levels = new Map();
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.maxSize = options.maxSize || 1000;
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute
    
    this.setupCleanupTimer();
  }

  setupCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  addLevel(name, implementation) {
    this.levels.set(name, {
      implementation,
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    });
  }

  async get(key, options = {}) {
    const { useLevels = Array.from(this.levels.keys()).reverse() } = options;
    
    for (const levelName of useLevels) {
      const level = this.levels.get(levelName);
      if (!level) continue;

      try {
        const value = await level.implementation.get(key);
        if (value !== null && value !== undefined) {
          level.hits++;
          
          // Promote to higher levels
          if (useLevels.length > 1) {
            await this.promoteToHigherLevels(key, value, levelName, useLevels);
          }
          
          return value;
        }
      } catch (error) {
        console.error(`Cache level ${levelName} get error:`, error);
      }
      
      level.misses++;
    }

    return null;
  }

  async promoteToHigherLevels(key, value, currentLevel, allLevels) {
    const currentIndex = allLevels.indexOf(currentLevel);
    const higherLevels = allLevels.slice(0, currentIndex);
    
    for (const levelName of higherLevels) {
      const level = this.levels.get(levelName);
      if (!level) continue;
      
      try {
        await level.implementation.set(key, value, this.defaultTTL);
      } catch (error) {
        console.error(`Cache promotion to ${levelName} failed:`, error);
      }
    }
  }

  async set(key, value, ttl = this.defaultTTL, options = {}) {
    const { useLevels = Array.from(this.levels.keys()) } = options;
    
    const results = [];
    
    for (const levelName of useLevels) {
      const level = this.levels.get(levelName);
      if (!level) continue;

      try {
        await level.implementation.set(key, value, ttl);
        level.sets++;
        results.push({ level: levelName, success: true });
      } catch (error) {
        console.error(`Cache level ${levelName} set error:`, error);
        results.push({ level: levelName, success: false, error });
      }
    }

    return results;
  }

  async delete(key, options = {}) {
    const { useLevels = Array.from(this.levels.keys()) } = options;
    
    const results = [];
    
    for (const levelName of useLevels) {
      const level = this.levels.get(levelName);
      if (!level) continue;

      try {
        await level.implementation.delete(key);
        level.deletes++;
        results.push({ level: levelName, success: true });
      } catch (error) {
        console.error(`Cache level ${levelName} delete error:`, error);
        results.push({ level: levelName, success: false, error });
      }
    }

    return results;
  }

  async clear(levelName = null) {
    if (levelName) {
      const level = this.levels.get(levelName);
      if (level) {
        await level.implementation.clear();
      }
    } else {
      // Clear all levels
      for (const [name, level] of this.levels) {
        try {
          await level.implementation.clear();
        } catch (error) {
          console.error(`Cache level ${name} clear error:`, error);
        }
      }
    }
  }

  async cleanup() {
    for (const [name, level] of this.levels) {
      try {
        await level.implementation.cleanup();
      } catch (error) {
        console.error(`Cache level ${name} cleanup error:`, error);
      }
    }
  }

  getStats() {
    const stats = {};
    
    for (const [name, level] of this.levels) {
      stats[name] = {
        hits: level.hits,
        misses: level.misses,
        sets: level.sets,
        deletes: level.deletes,
        hitRate: level.hits / (level.hits + level.misses) || 0
      };
    }
    
    return stats;
  }
}

// Memory Cache Implementation
export class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
  }

  async get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access time for LRU
    item.accessedAt = Date.now();
    
    return item.value;
  }

  async set(key, value, ttl = this.defaultTTL) {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    const item = {
      value,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : null
    };
    
    this.cache.set(key, item);
  }

  async delete(key) {
    return this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }

  async cleanup() {
    const now = Date.now();
    const toDelete = [];
    
    for (const [key, item] of this.cache) {
      if (item.expiresAt && now > item.expiresAt) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache) {
      if (item.accessedAt < oldestTime) {
        oldestTime = item.accessedAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }
}

// Local Storage Cache Implementation
export class LocalStorageCache {
  constructor(options = {}) {
    this.prefix = options.prefix || 'cache_';
    this.defaultTTL = options.defaultTTL || 60 * 60 * 1000; // 1 hour
  }

  async get(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      
      if (!item) {
        return null;
      }
      
      const parsed = JSON.parse(item);
      
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    const item = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : null
    };
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('LocalStorage set error:', error);
      
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        this.cleanupExpired();
        // Retry once
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (retryError) {
          console.error('LocalStorage retry failed:', retryError);
        }
      }
    }
  }

  async delete(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('LocalStorage delete error:', error);
    }
  }

  async clear() {
    try {
      const keys = Object.keys(localStorage);
      const toRemove = keys.filter(key => key.startsWith(this.prefix));
      
      toRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }

  async cleanup() {
    this.cleanupExpired();
  }

  cleanupExpired() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            
            if (item.expiresAt && now > item.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch {
            // Remove corrupted items
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('LocalStorage cleanup error:', error);
    }
  }

  getUsage() {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          used += item.length + key.length;
        }
      });
      
      // Estimate 5MB localStorage limit
      const total = 5 * 1024 * 1024;
      
      return {
        used,
        total,
        percentage: (used / total) * 100,
        itemCount: keys.filter(key => key.startsWith(this.prefix)).length
      };
    } catch (error) {
      console.error('LocalStorage usage calculation error:', error);
      return { used: 0, total: 0, percentage: 0, itemCount: 0 };
    }
  }
}

// IndexedDB Cache Implementation
export class IndexedDBCache {
  constructor(options = {}) {
    this.dbName = options.dbName || 'CacheDB';
    this.storeName = options.storeName || 'cache';
    this.version = options.version || 1;
    this.defaultTTL = options.defaultTTL || 24 * 60 * 60 * 1000; // 24 hours
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  async get(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve(null);
          return;
        }
        
        if (result.expiresAt && Date.now() > result.expiresAt) {
          this.delete(key).catch(() => {}); // Don't wait for cleanup
          resolve(null);
          return;
        }
        
        resolve(result.value);
      };
    });
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const item = {
        key,
        value,
        createdAt: Date.now(),
        expiresAt: ttl > 0 ? Date.now() + ttl : null
      };
      
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async cleanup() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      const now = Date.now();
      
      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  async getUsage() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve({
          itemCount: request.result,
          estimatedSize: request.result * 1024 // Rough estimate
        });
      };
    });
  }
}

// Cache Decorator
export function cacheable(options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    keyGenerator = (...args) => JSON.stringify(args),
    cacheInstance = null
  } = options;

  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const cache = cacheInstance || new AdvancedCache();

    descriptor.value = async function(...args) {
      const cacheKey = `${propertyKey}_${keyGenerator(...args)}`;
      
      // Try to get from cache
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cache.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

// Cache Manager
export class CacheManager {
  constructor() {
    this.caches = new Map();
    this.setupDefaultCaches();
  }

  setupDefaultCaches() {
    // Memory cache for fast access
    const memoryCache = new AdvancedCache({ defaultTTL: 5 * 60 * 1000 });
    memoryCache.addLevel('memory', new MemoryCache({ maxSize: 100 }));
    this.caches.set('memory', memoryCache);

    // Local storage cache for persistence
    const localStorageCache = new AdvancedCache({ defaultTTL: 60 * 60 * 1000 });
    localStorageCache.addLevel('localStorage', new LocalStorageCache());
    this.caches.set('localStorage', localStorageCache);

    // IndexedDB cache for large data
    const indexedDBCache = new AdvancedCache({ defaultTTL: 24 * 60 * 60 * 1000 });
    indexedDBCache.addLevel('indexedDB', new IndexedDBCache());
    this.caches.set('indexedDB', indexedDBCache);

    // Multi-level cache combining all
    const multiLevelCache = new AdvancedCache({ defaultTTL: 30 * 60 * 1000 });
    multiLevelCache.addLevel('memory', new MemoryCache({ maxSize: 50 }));
    multiLevelCache.addLevel('localStorage', new LocalStorageCache());
    multiLevelCache.addLevel('indexedDB', new IndexedDBCache());
    this.caches.set('multiLevel', multiLevelCache);
  }

  getCache(name) {
    return this.caches.get(name);
  }

  async get(cacheName, key, options = {}) {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      throw new Error(`Cache '${cacheName}' not found`);
    }
    
    return await cache.get(key, options);
  }

  async set(cacheName, key, value, ttl, options = {}) {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      throw new Error(`Cache '${cacheName}' not found`);
    }
    
    return await cache.set(key, value, ttl, options);
  }

  async delete(cacheName, key, options = {}) {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      throw new Error(`Cache '${cacheName}' not found`);
    }
    
    return await cache.delete(key, options);
  }

  async clear(cacheName) {
    if (cacheName) {
      const cache = this.caches.get(cacheName);
      if (cache) {
        await cache.clear();
      }
    } else {
      // Clear all caches
      for (const cache of this.caches.values()) {
        await cache.clear();
      }
    }
  }

  getAllStats() {
    const stats = {};
    
    for (const [name, cache] of this.caches) {
      stats[name] = cache.getStats();
    }
    
    return stats;
  }

  async cleanupAll() {
    for (const cache of this.caches.values()) {
      await cache.cleanup();
    }
  }
}

// Create global cache manager
export const cacheManager = new CacheManager();

// Initialize caching system
export const initializeCaching = () => {
  // Set up periodic cleanup
  setInterval(() => {
    cacheManager.cleanupAll();
  }, 5 * 60 * 1000); // Every 5 minutes

  // Handle storage events for cross-tab synchronization
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('cache_')) {
      // Invalidate local cache when storage changes
      const cache = cacheManager.getCache('localStorage');
      if (cache) {
        const key = event.key.replace('cache_', '');
        cache.delete(key);
      }
    }
  });

  // Handle page unload to clean up resources
  window.addEventListener('beforeunload', () => {
    // Perform final cleanup
    cacheManager.cleanupAll();
  });
};
