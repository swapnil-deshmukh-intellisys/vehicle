// Comprehensive data persistence utility

// Storage types
export const STORAGE_TYPES = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  MEMORY: 'memory',
  INDEXED_DB: 'indexedDB',
  CUSTOM: 'custom'
};

// Data expiration strategies
export const EXPIRATION_STRATEGIES = {
  NEVER: 'never',
  SESSION: 'session',
  TIME_BASED: 'time_based',
  VERSION_BASED: 'version_based'
};

// Data persistence manager class
export class DataPersistenceManager {
  constructor(options = {}) {
    this.defaultStorage = options.defaultStorage || STORAGE_TYPES.LOCAL;
    this.defaultExpiration = options.defaultExpiration || EXPIRATION_STRATEGIES.NEVER;
    this.encryptionEnabled = options.encryptionEnabled || false;
    this.compressionEnabled = options.compressionEnabled || false;
    this.memoryStore = new Map();
    this.indexedDB = null;
    this.customStorage = options.customStorage || null;
    
    this.initializeIndexedDB();
  }

  // Initialize IndexedDB
  async initializeIndexedDB() {
    if (!window.indexedDB) return;
    
    try {
      this.indexedDB = await this.openIndexedDB();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  // Open IndexedDB database
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AppDataPersistence', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }

  // Set data with options
  async set(key, value, options = {}) {
    const {
      storage = this.defaultStorage,
      expiration = this.defaultExpiration,
      encrypt = this.encryptionEnabled,
      compress = this.compressionEnabled,
      version = null
    } = options;

    const data = {
      key,
      value,
      timestamp: Date.now(),
      expiration: this.calculateExpiration(expiration),
      version,
      encrypted: encrypt,
      compressed: compress
    };

    // Process data
    let processedValue = value;
    if (compress) {
      processedValue = this.compressData(processedValue);
    }
    if (encrypt) {
      processedValue = this.encryptData(processedValue);
    }

    data.processedValue = processedValue;

    // Store in appropriate storage
    switch (storage) {
      case STORAGE_TYPES.LOCAL:
        return this.setLocalStorage(key, data);
      case STORAGE_TYPES.SESSION:
        return this.setSessionStorage(key, data);
      case STORAGE_TYPES.MEMORY:
        return this.setMemoryStorage(key, data);
      case STORAGE_TYPES.INDEXED_DB:
        return this.setIndexedDB(key, data);
      case STORAGE_TYPES.CUSTOM:
        return this.setCustomStorage(key, data);
      default:
        throw new Error(`Unknown storage type: ${storage}`);
    }
  }

  // Get data with validation
  async get(key, options = {}) {
    const {
      storage = this.defaultStorage,
      checkExpiration = true
    } = options;

    let data;
    switch (storage) {
      case STORAGE_TYPES.LOCAL:
        data = this.getLocalStorage(key);
        break;
      case STORAGE_TYPES.SESSION:
        data = this.getSessionStorage(key);
        break;
      case STORAGE_TYPES.MEMORY:
        data = this.getMemoryStorage(key);
        break;
      case STORAGE_TYPES.INDEXED_DB:
        data = await this.getIndexedDB(key);
        break;
      case STORAGE_TYPES.CUSTOM:
        data = await this.getCustomStorage(key);
        break;
      default:
        throw new Error(`Unknown storage type: ${storage}`);
    }

    if (!data) return null;

    // Check expiration
    if (checkExpiration && this.isExpired(data)) {
      await this.remove(key, { storage });
      return null;
    }

    // Reverse processing
    let value = data.processedValue;
    if (data.encrypted) {
      value = this.decryptData(value);
    }
    if (data.compressed) {
      value = this.decompressData(value);
    }

    return value;
  }

  // Remove data
  async remove(key, options = {}) {
    const { storage = this.defaultStorage } = options;

    switch (storage) {
      case STORAGE_TYPES.LOCAL:
        return this.removeLocalStorage(key);
      case STORAGE_TYPES.SESSION:
        return this.removeSessionStorage(key);
      case STORAGE_TYPES.MEMORY:
        return this.removeMemoryStorage(key);
      case STORAGE_TYPES.INDEXED_DB:
        return this.removeIndexedDB(key);
      case STORAGE_TYPES.CUSTOM:
        return this.removeCustomStorage(key);
      default:
        throw new Error(`Unknown storage type: ${storage}`);
    }
  }

  // Clear all data
  async clear(options = {}) {
    const { storage = this.defaultStorage } = options;

    switch (storage) {
      case STORAGE_TYPES.LOCAL:
        return this.clearLocalStorage();
      case STORAGE_TYPES.SESSION:
        return this.clearSessionStorage();
      case STORAGE_TYPES.MEMORY:
        return this.clearMemoryStorage();
      case STORAGE_TYPES.INDEXED_DB:
        return this.clearIndexedDB();
      case STORAGE_TYPES.CUSTOM:
        return this.clearCustomStorage();
      default:
        throw new Error(`Unknown storage type: ${storage}`);
    }
  }

  // Local storage methods
  setLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  }

  getLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  }

  clearLocalStorage() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }

  // Session storage methods
  setSessionStorage(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('SessionStorage set error:', error);
      return false;
    }
  }

  getSessionStorage(key) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return null;
    }
  }

  removeSessionStorage(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('SessionStorage remove error:', error);
      return false;
    }
  }

  clearSessionStorage() {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('SessionStorage clear error:', error);
      return false;
    }
  }

  // Memory storage methods
  setMemoryStorage(key, data) {
    this.memoryStore.set(key, data);
    return true;
  }

  getMemoryStorage(key) {
    return this.memoryStore.get(key) || null;
  }

  removeMemoryStorage(key) {
    return this.memoryStore.delete(key);
  }

  clearMemoryStorage() {
    this.memoryStore.clear();
    return true;
  }

  // IndexedDB methods
  async setIndexedDB(key, data) {
    if (!this.indexedDB) return false;
    
    try {
      const transaction = this.indexedDB.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      await store.put(data);
      return true;
    } catch (error) {
      console.error('IndexedDB set error:', error);
      return false;
    }
  }

  async getIndexedDB(key) {
    if (!this.indexedDB) return null;
    
    try {
      const transaction = this.indexedDB.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const result = await store.get(key);
      return result || null;
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  async removeIndexedDB(key) {
    if (!this.indexedDB) return false;
    
    try {
      const transaction = this.indexedDB.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      await store.delete(key);
      return true;
    } catch (error) {
      console.error('IndexedDB remove error:', error);
      return false;
    }
  }

  async clearIndexedDB() {
    if (!this.indexedDB) return false;
    
    try {
      const transaction = this.indexedDB.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      await store.clear();
      return true;
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      return false;
    }
  }

  // Custom storage methods
  async setCustomStorage(key, data) {
    if (!this.customStorage) return false;
    
    try {
      return await this.customStorage.set(key, data);
    } catch (error) {
      console.error('Custom storage set error:', error);
      return false;
    }
  }

  async getCustomStorage(key) {
    if (!this.customStorage) return null;
    
    try {
      return await this.customStorage.get(key);
    } catch (error) {
      console.error('Custom storage get error:', error);
      return null;
    }
  }

  async removeCustomStorage(key) {
    if (!this.customStorage) return false;
    
    try {
      return await this.customStorage.remove(key);
    } catch (error) {
      console.error('Custom storage remove error:', error);
      return false;
    }
  }

  async clearCustomStorage() {
    if (!this.customStorage) return false;
    
    try {
      return await this.customStorage.clear();
    } catch (error) {
      console.error('Custom storage clear error:', error);
      return false;
    }
  }

  // Utility methods
  calculateExpiration(strategy) {
    switch (strategy) {
      case EXPIRATION_STRATEGIES.NEVER:
        return null;
      case EXPIRATION_STRATEGIES.SESSION:
        return 'session';
      case EXPIRATION_STRATEGIES.TIME_BASED:
        return Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      case EXPIRATION_STRATEGIES.VERSION_BASED:
        return 'version';
      default:
        return null;
    }
  }

  isExpired(data) {
    if (!data.expiration) return false;
    
    if (data.expiration === 'session') {
      return !window.sessionStorage; // Session ended
    }
    
    if (typeof data.expiration === 'number') {
      return Date.now() > data.expiration;
    }
    
    return false;
  }

  // Simple compression (placeholder - use real compression library in production)
  compressData(data) {
    return JSON.stringify(data);
  }

  decompressData(data) {
    return JSON.parse(data);
  }

  // Simple encryption (placeholder - use real encryption in production)
  encryptData(data) {
    return btoa(JSON.stringify(data));
  }

  decryptData(data) {
    return JSON.parse(atob(data));
  }

  // Get storage usage
  async getStorageUsage(storage = this.defaultStorage) {
    switch (storage) {
      case STORAGE_TYPES.LOCAL:
        return this.getLocalStorageUsage();
      case STORAGE_TYPES.SESSION:
        return this.getSessionStorageUsage();
      case STORAGE_TYPES.MEMORY:
        return this.getMemoryStorageUsage();
      default:
        return { used: 0, available: 0, percentage: 0 };
    }
  }

  getLocalStorageUsage() {
    let used = 0;
    for (let key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage[key].length + key.length;
      }
    }
    // 5MB typical limit
    const available = 5 * 1024 * 1024;
    return { used, available, percentage: (used / available) * 100 };
  }

  getSessionStorageUsage() {
    let used = 0;
    for (let key in sessionStorage) {
      if (Object.prototype.hasOwnProperty.call(sessionStorage, key)) {
        used += sessionStorage[key].length + key.length;
      }
    }
    // 5MB typical limit
    const available = 5 * 1024 * 1024;
    return { used, available, percentage: (used / available) * 100 };
  }

  getMemoryStorageUsage() {
    let used = 0;
    for (let [key, value] of this.memoryStore) {
      used += JSON.stringify(value).length + key.length;
    }
    // Estimate available memory
    const available = 100 * 1024 * 1024; // 100MB estimate
    return { used, available, percentage: (used / available) * 100 };
  }
}

// Create global persistence manager
export const dataPersistenceManager = new DataPersistenceManager();

// Utility functions
export const persistData = async (key, value, options = {}) => {
  return await dataPersistenceManager.set(key, value, options);
};

export const retrieveData = async (key, options = {}) => {
  return await dataPersistenceManager.get(key, options);
};

export const removeData = async (key, options = {}) => {
  return await dataPersistenceManager.remove(key, options);
};

export const clearData = async (options = {}) => {
  return await dataPersistenceManager.clear(options);
};

// React-like hooks (would need React integration)
export const usePersistedState = (key, initialValue, options = {}) => {
  // This would integrate with React's useState and useEffect
  return {
    value: initialValue,
    setValue: (value) => persistData(key, value, options),
    removeValue: () => removeData(key, options)
  };
};
