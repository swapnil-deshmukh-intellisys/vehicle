// Comprehensive storage utilities for local and session storage

// Storage Manager Class
export class StorageManager {
  constructor(storageType = 'localStorage') {
    this.storage = storageType === 'sessionStorage' ? 
      window.sessionStorage : window.localStorage;
    this.prefix = 'app_';
    this.listeners = new Map();
    this.setupStorageListener();
  }

  // Setup storage event listener
  setupStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith(this.prefix)) {
          const key = event.key.replace(this.prefix, '');
          const listeners = this.listeners.get(key);
          
          if (listeners) {
            listeners.forEach(callback => {
              try {
                callback({
                  key,
                  oldValue: event.oldValue,
                  newValue: event.newValue,
                  storageArea: event.storageArea
                });
              } catch (error) {
                console.error('Storage listener error:', error);
              }
            });
          }
        }
      });
    }
  }

  // Set item with serialization
  setItem(key, value, options = {}) {
    const { ttl, encrypt = false } = options;
    const fullKey = this.prefix + key;
    
    let item = {
      value,
      timestamp: Date.now(),
      ...(ttl && { expires: Date.now() + ttl })
    };
    
    if (encrypt) {
      item = this.encrypt(JSON.stringify(item));
    } else {
      item = JSON.stringify(item);
    }
    
    try {
      this.storage.setItem(fullKey, item);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  // Get item with deserialization
  getItem(key, defaultValue = null) {
    const fullKey = this.prefix + key;
    
    try {
      let item = this.storage.getItem(fullKey);
      
      if (!item) {
        return defaultValue;
      }
      
      // Try to decrypt if it's encrypted
      if (item.startsWith('encrypted:')) {
        item = this.decrypt(item);
      }
      
      const parsed = JSON.parse(item);
      
      // Check if item has expired
      if (parsed.expires && Date.now() > parsed.expires) {
        this.removeItem(key);
        return defaultValue;
      }
      
      return parsed.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  // Remove item
  removeItem(key) {
    const fullKey = this.prefix + key;
    this.storage.removeItem(fullKey);
  }

  // Clear all items with prefix
  clear() {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }

  // Get all keys with prefix
  getKeys() {
    const keys = Object.keys(this.storage);
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }

  // Check if key exists
  hasKey(key) {
    const fullKey = this.prefix + key;
    return this.storage.getItem(fullKey) !== null;
  }

  // Get storage size in bytes
  getSize() {
    let size = 0;
    const keys = Object.keys(this.storage);
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        size += this.storage.getItem(key).length + key.length;
      }
    });
    
    return size;
  }

  // Get storage quota
  getQuota() {
    if (this.storage === localStorage) {
      return {
        used: this.getSize(),
        total: 5 * 1024 * 1024, // 5MB typical limit
        percentage: (this.getSize() / (5 * 1024 * 1024)) * 100
      };
    } else {
      return {
        used: this.getSize(),
        total: 5 * 1024 * 1024, // 5MB typical limit
        percentage: (this.getSize() / (5 * 1024 * 1024)) * 100
      };
    }
  }

  // Add change listener
  addListener(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Simple encryption (for demo purposes - use proper encryption in production)
  encrypt(data) {
    return 'encrypted:' + btoa(data);
  }

  // Simple decryption
  decrypt(encryptedData) {
    return atob(encryptedData.replace('encrypted:', ''));
  }
}

// Cache Manager Class
export class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.cache = new Map();
    this.accessOrder = [];
  }

  // Set cache item
  set(key, value, options = {}) {
    const ttl = options.ttl || this.ttl;
    
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
    }
    
    const item = {
      value,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    };
    
    this.cache.set(key, item);
    
    // Update access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  // Get cache item
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item has expired
    if (Date.now() > item.expires) {
      this.delete(key);
      return null;
    }
    
    // Update access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
    
    return item.value;
  }

  // Delete cache item
  delete(key) {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const expired = Array.from(this.cache.entries()).filter(
      ([key, item]) => Date.now() > item.expires
    );
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired: expired.length,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }

  // Clean expired items
  cleanExpired() {
    const expired = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expires) {
        expired.push(key);
      }
    }
    
    expired.forEach(key => this.delete(key));
    return expired.length;
  }
}

// Storage Utilities
export const storageUtils = {
  // Create storage manager
  createManager(type = 'localStorage') {
    return new StorageManager(type);
  },

  // Create cache manager
  createCache(options = {}) {
    return new CacheManager(options);
  },

  // Local storage shortcuts
  local: {
    set(key, value, options) {
      return new StorageManager('localStorage').setItem(key, value, options);
    },
    get(key, defaultValue) {
      return new StorageManager('localStorage').getItem(key, defaultValue);
    },
    remove(key) {
      return new StorageManager('localStorage').removeItem(key);
    },
    clear() {
      return new StorageManager('localStorage').clear();
    }
  },

  // Session storage shortcuts
  session: {
    set(key, value, options) {
      return new StorageManager('sessionStorage').setItem(key, value, options);
    },
    get(key, defaultValue) {
      return new StorageManager('sessionStorage').getItem(key, defaultValue);
    },
    remove(key) {
      return new StorageManager('sessionStorage').removeItem(key);
    },
    clear() {
      return new StorageManager('sessionStorage').clear();
    }
  },

  // Browser storage detection
  isAvailable(type = 'localStorage') {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get storage information
  getStorageInfo(type = 'localStorage') {
    if (!this.isAvailable(type)) {
      return { available: false };
    }

    const manager = new StorageManager(type);
    return {
      available: true,
      quota: manager.getQuota(),
      keys: manager.getKeys(),
      size: manager.getSize()
    };
  },

  // Compress data for storage
  compress(data) {
    try {
      return JSON.stringify(data).replace(/([a-zA-Z0-9])\1+/g, '$1');
    } catch (error) {
      return data;
    }
  },

  // Decompress data from storage
  decompress(compressedData) {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      return compressedData;
    }
  }
};

// Create global instances
export const localStorageManager = new StorageManager('localStorage');
export const sessionStorageManager = new StorageManager('sessionStorage');
export const memoryCache = new CacheManager();

// Export default
export default {
  StorageManager,
  CacheManager,
  storageUtils,
  localStorageManager,
  sessionStorageManager,
  memoryCache
};
