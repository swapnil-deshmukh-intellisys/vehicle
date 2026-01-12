// Comprehensive data management utility functions

// Data Store Class
export class DataStore {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.data = new Map();
    this.subscribers = new Set();
    this.validators = new Map();
    this.transformers = new Map();
    this.middleware = [];
    this.persistence = options.persistence || null;
    this.history = options.history || false;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = options.maxHistorySize || 50;
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify subscribers of changes
  notify(change) {
    this.subscribers.forEach(callback => {
      try {
        callback(change);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }

  // Add middleware
  use(middleware) {
    this.middleware.push(middleware);
  }

  // Apply middleware
  async applyMiddleware(action, data) {
    let processedData = data;
    
    for (const middleware of this.middleware) {
      processedData = await middleware(action, processedData);
    }
    
    return processedData;
  }

  // Set data with validation and transformation
  async set(key, value, options = {}) {
    const action = 'set';
    
    // Validate data
    if (this.validators.has(key)) {
      const validator = this.validators.get(key);
      const isValid = await validator(value);
      if (!isValid) {
        throw new Error(`Validation failed for key: ${key}`);
      }
    }
    
    // Transform data
    if (this.transformers.has(key)) {
      const transformer = this.transformers.get(key);
      value = await transformer(value);
    }
    
    // Apply middleware
    value = await this.applyMiddleware(action, { key, value, options });
    
    // Save history if enabled
    if (this.history && !options.skipHistory) {
      this.saveHistory('set', key, this.data.get(key), value);
    }
    
    // Set data
    const oldValue = this.data.get(key);
    this.data.set(key, value);
    
    // Persist if configured
    if (this.persistence) {
      await this.persistence.save(key, value);
    }
    
    // Notify subscribers
    this.notify({
      type: 'set',
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now()
    });
    
    return value;
  }

  // Get data
  async get(key, defaultValue = null) {
    const value = this.data.get(key);
    return value !== undefined ? value : defaultValue;
  }

  // Delete data
  async delete(key, _options = {}) {
    const action = 'delete';
    
    const oldValue = this.data.get(key);
    if (oldValue === undefined) {
      return false;
    }
    
    // Apply middleware
    await this.applyMiddleware(action, { key, oldValue, options: _options });
    
    // Save history if enabled
    if (this.history && !_options.skipHistory) {
      this.saveHistory('delete', key, oldValue, null);
    }
    
    // Delete data
    this.data.delete(key);
    
    // Remove from persistence
    if (this.persistence) {
      await this.persistence.remove(key);
    }
    
    // Notify subscribers
    this.notify({
      type: 'delete',
      key,
      oldValue,
      newValue: null,
      timestamp: Date.now()
    });
    
    return true;
  }

  // Clear all data
  async clear(options = {}) {
    const action = 'clear';
    
    // Save history if enabled
    if (this.history && !options.skipHistory) {
      const oldData = new Map(this.data);
      this.saveHistory('clear', null, oldData, new Map());
    }
    
    // Apply middleware
    await this.applyMiddleware(action, { options });
    
    // Clear data
    this.data.clear();
    
    // Clear persistence
    if (this.persistence) {
      await this.persistence.clear();
    }
    
    // Notify subscribers
    this.notify({
      type: 'clear',
      key: null,
      oldValue: null,
      newValue: null,
      timestamp: Date.now()
    });
  }

  // Save history for undo/redo
  saveHistory(action, key, oldValue, newValue) {
    const historyItem = {
      action,
      key,
      oldValue,
      newValue,
      timestamp: Date.now()
    };
    
    this.undoStack.push(historyItem);
    
    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    this.redoStack = [];
  }

  // Undo last action
  async undo() {
    if (this.undoStack.length === 0) {
      return false;
    }
    
    const historyItem = this.undoStack.pop();
    this.redoStack.push(historyItem);
    
    switch (historyItem.action) {
      case 'set':
        await this.set(historyItem.key, historyItem.oldValue, { skipHistory: true });
        break;
      case 'delete':
        if (historyItem.oldValue !== null) {
          await this.set(historyItem.key, historyItem.oldValue, { skipHistory: true });
        }
        break;
      case 'clear':
        if (historyItem.oldValue instanceof Map) {
          for (const [key, value] of historyItem.oldValue) {
            await this.set(key, value, { skipHistory: true });
          }
        }
        break;
    }
    
    return true;
  }

  // Redo last undone action
  async redo() {
    if (this.redoStack.length === 0) {
      return false;
    }
    
    const historyItem = this.redoStack.pop();
    this.undoStack.push(historyItem);
    
    switch (historyItem.action) {
      case 'set':
        await this.set(historyItem.key, historyItem.newValue, { skipHistory: true });
        break;
      case 'delete':
        await this.delete(historyItem.key, { skipHistory: true });
        break;
      case 'clear':
        await this.clear({ skipHistory: true });
        break;
    }
    
    return true;
  }

  // Add validator for a key
  addValidator(key, validator) {
    this.validators.set(key, validator);
  }

  // Add transformer for a key
  addTransformer(key, transformer) {
    this.transformers.set(key, transformer);
  }

  // Get all keys
  getKeys() {
    return Array.from(this.data.keys());
  }

  // Get all values
  getValues() {
    return Array.from(this.data.values());
  }

  // Get all entries
  getEntries() {
    return Array.from(this.data.entries());
  }

  // Check if key exists
  has(key) {
    return this.data.has(key);
  }

  // Get store size
  size() {
    return this.data.size;
  }

  // Export data
  export() {
    return Object.fromEntries(this.data);
  }

  // Import data
  async import(data, options = {}) {
    if (options.clear) {
      await this.clear({ skipHistory: true });
    }
    
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value, { skipHistory: true });
    }
  }
}

// Data Synchronization Manager
export class DataSyncManager {
  constructor(options = {}) {
    this.stores = new Map();
    this.syncStrategies = new Map();
    this.conflictResolvers = new Map();
    this.syncQueue = [];
    this.syncing = false;
    this.syncInterval = options.syncInterval || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  // Register a data store
  registerStore(name, store, options = {}) {
    this.stores.set(name, {
      store,
      syncStrategy: options.syncStrategy || 'auto',
      priority: options.priority || 1,
      lastSync: null,
      pendingChanges: new Set()
    });
  }

  // Register sync strategy
  registerSyncStrategy(name, strategy) {
    this.syncStrategies.set(name, strategy);
  }

  // Register conflict resolver
  registerConflictResolver(name, resolver) {
    this.conflictResolvers.set(name, resolver);
  }

  // Add change to sync queue
  addChange(storeName, change) {
    const storeInfo = this.stores.get(storeName);
    if (storeInfo) {
      storeInfo.pendingChanges.add(change);
      
      // Auto sync if strategy is 'auto'
      if (storeInfo.syncStrategy === 'auto') {
        this.scheduleSync();
      }
    }
  }

  // Schedule sync
  scheduleSync() {
    if (this.syncing) {
      return;
    }
    
    setTimeout(() => {
      this.sync();
    }, 100);
  }

  // Sync all stores
  async sync() {
    if (this.syncing) {
      return;
    }
    
    this.syncing = true;
    
    try {
      // Sort stores by priority
      const sortedStores = Array.from(this.stores.entries())
        .sort(([, a], [, b]) => b.priority - a.priority);
      
      for (const [name, storeInfo] of sortedStores) {
        if (storeInfo.pendingChanges.size > 0) {
          await this.syncStore(name, storeInfo);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncing = false;
    }
  }

  // Sync individual store
  async syncStore(name, storeInfo) {
    const strategy = this.syncStrategies.get(storeInfo.syncStrategy);
    if (!strategy) {
      console.warn(`No sync strategy found for: ${storeInfo.syncStrategy}`);
      return;
    }
    
    const changes = Array.from(storeInfo.pendingChanges);
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      try {
        await strategy.sync(name, storeInfo.store, changes);
        
        // Clear pending changes on success
        storeInfo.pendingChanges.clear();
        storeInfo.lastSync = Date.now();
        
        break;
      } catch (error) {
        retryCount++;
        
        if (retryCount >= this.maxRetries) {
          console.error(`Sync failed for store ${name} after ${retryCount} attempts:`, error);
          break;
        }
        
        // Wait before retry
        await this.delay(this.retryDelay * retryCount);
      }
    }
  }

  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get sync status
  getSyncStatus() {
    const status = {};
    
    for (const [name, storeInfo] of this.stores) {
      status[name] = {
        pendingChanges: storeInfo.pendingChanges.size,
        lastSync: storeInfo.lastSync,
        syncStrategy: storeInfo.syncStrategy,
        priority: storeInfo.priority
      };
    }
    
    return status;
  }

  // Force sync all stores
  async forceSync() {
    await this.sync();
  }
}

// Data Validation System
export class DataValidator {
  constructor() {
    this.rules = new Map();
    this.schemas = new Map();
  }

  // Add validation rule
  addRule(name, rule) {
    this.rules.set(name, rule);
  }

  // Add validation schema
  addSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  // Validate data against rule
  async validateRule(ruleName, data) {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      throw new Error(`Validation rule not found: ${ruleName}`);
    }
    
    return rule(data);
  }

  // Validate data against schema
  async validateSchema(schemaName, data) {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new Error(`Validation schema not found: ${schemaName}`);
    }
    
    return this.validateAgainstSchema(schema, data);
  }

  // Validate against schema
  async validateAgainstSchema(schema, data) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      
      for (const rule of rules) {
        const result = await this.applyRule(rule, value, data);
        if (!result.valid) {
          errors.push({
            field: key,
            message: result.message,
            value
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Apply individual rule
  async applyRule(rule, value, data) {
    if (typeof rule === 'function') {
      return rule(value, data);
    }
    
    if (typeof rule === 'object' && rule.type) {
      switch (rule.type) {
        case 'required':
          return {
            valid: value !== null && value !== undefined && value !== '',
            message: rule.message || 'This field is required'
          };
        
        case 'string': {
          const isString = typeof value === 'string';
          let valid = isString;
          let message = rule.message || 'Must be a string';
          
          if (isString) {
            if (rule.minLength && value.length < rule.minLength) {
              valid = false;
              message = `Must be at least ${rule.minLength} characters`;
            } else if (rule.maxLength && value.length > rule.maxLength) {
              valid = false;
              message = `Must be at most ${rule.maxLength} characters`;
            } else if (rule.pattern && !rule.pattern.test(value)) {
              valid = false;
              message = rule.message || 'Invalid format';
            }
          }
          
          return { valid, message };
        }
        
        case 'number': {
          const isNumber = typeof value === 'number' && !isNaN(value);
          let numValid = isNumber;
          let numMessage = rule.message || 'Must be a number';
          
          if (isNumber) {
            if (rule.min !== undefined && value < rule.min) {
              numValid = false;
              numMessage = `Must be at least ${rule.min}`;
            } else if (rule.max !== undefined && value > rule.max) {
              numValid = false;
              numMessage = `Must be at most ${rule.max}`;
            }
          }
          
          return { valid: numValid, message: numMessage };
        }
        
        case 'email': {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return {
            valid: emailPattern.test(value),
            message: rule.message || 'Must be a valid email address'
          };
        }
        
        case 'custom':
          return rule.validator(value, data);
        
        default:
          return { valid: true, message: '' };
      }
    }
    
    return { valid: true, message: '' };
  }
}

// Data Transformer System
export class DataTransformer {
  constructor() {
    this.transformers = new Map();
  }

  // Add transformer
  addTransformer(name, transformer) {
    this.transformers.set(name, transformer);
  }

  // Transform data
  async transform(transformerName, data) {
    const transformer = this.transformers.get(transformerName);
    if (!transformer) {
      throw new Error(`Transformer not found: ${transformerName}`);
    }
    
    return transformer(data);
  }

  // Chain multiple transformers
  async chain(transformerNames, data) {
    let result = data;
    
    for (const name of transformerNames) {
      result = await this.transform(name, result);
    }
    
    return result;
  }
}

// Data Persistence Layer
export class DataPersistence {
  constructor(options = {}) {
    this.type = options.type || 'localStorage';
    this.prefix = options.prefix || 'data_';
    this.encryption = options.encryption || null;
  }

  // Save data
  async save(key, value) {
    const prefixedKey = this.prefix + key;
    
    let dataToSave = {
      value,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    // Encrypt if configured
    if (this.encryption) {
      dataToSave = await this.encryption.encrypt(JSON.stringify(dataToSave));
    } else {
      dataToSave = JSON.stringify(dataToSave);
    }
    
    switch (this.type) {
      case 'localStorage':
        localStorage.setItem(prefixedKey, dataToSave);
        break;
      
      case 'sessionStorage':
        sessionStorage.setItem(prefixedKey, dataToSave);
        break;
      
      case 'indexedDB':
        await this.saveToIndexedDB(prefixedKey, dataToSave);
        break;
      
      default:
        throw new Error(`Unsupported persistence type: ${this.type}`);
    }
  }

  // Load data
  async load(key) {
    const prefixedKey = this.prefix + key;
    
    let data;
    
    switch (this.type) {
      case 'localStorage':
        data = localStorage.getItem(prefixedKey);
        break;
      
      case 'sessionStorage':
        data = sessionStorage.getItem(prefixedKey);
        break;
      
      case 'indexedDB':
        data = await this.loadFromIndexedDB(prefixedKey);
        break;
      
      default:
        throw new Error(`Unsupported persistence type: ${this.type}`);
    }
    
    if (!data) {
      return null;
    }
    
    // Decrypt if configured
    if (this.encryption) {
      data = await this.encryption.decrypt(data);
    }
    
    try {
      const parsed = JSON.parse(data);
      return parsed.value;
    } catch (error) {
      console.error('Failed to parse persisted data:', error);
      return null;
    }
  }

  // Remove data
  async remove(key) {
    const prefixedKey = this.prefix + key;
    
    switch (this.type) {
      case 'localStorage':
        localStorage.removeItem(prefixedKey);
        break;
      
      case 'sessionStorage':
        sessionStorage.removeItem(prefixedKey);
        break;
      
      case 'indexedDB':
        await this.removeFromIndexedDB(prefixedKey);
        break;
      
      default:
        throw new Error(`Unsupported persistence type: ${this.type}`);
    }
  }

  // Clear all data
  async clear() {
    switch (this.type) {
      case 'localStorage': {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
        break;
      }
      
      case 'sessionStorage': {
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            sessionStorage.removeItem(key);
          }
        });
        break;
      }
      
      case 'indexedDB':
        await this.clearIndexedDB();
        break;
      
      default:
        throw new Error(`Unsupported persistence type: ${this.type}`);
    }
  }

  // IndexedDB helpers
  async saveToIndexedDB(key, data) {
    // Simplified IndexedDB implementation
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DataPersistenceDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        
        const putRequest = store.put({ key, data });
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }

  async loadFromIndexedDB(key) {
    // Simplified IndexedDB implementation
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DataPersistenceDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readonly');
        const store = transaction.objectStore('data');
        
        const getRequest = store.get(key);
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.data : null);
        };
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }

  async removeFromIndexedDB(key) {
    // Simplified IndexedDB implementation
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DataPersistenceDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        
        const deleteRequest = store.delete(key);
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onsuccess = () => resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }

  async clearIndexedDB() {
    // Simplified IndexedDB implementation
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DataPersistenceDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        
        const clearRequest = store.clear();
        clearRequest.onerror = () => reject(clearRequest.error);
        clearRequest.onsuccess = () => resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }
}

// Create global instances
export const dataValidator = new DataValidator();
export const dataTransformer = new DataTransformer();
export const dataSyncManager = new DataSyncManager();

// Initialize data management
export const initializeDataManagement = () => {
  // Setup default validation rules
  dataValidator.addRule('required', (value) => {
    return value !== null && value !== undefined && value !== '';
  });
  
  dataValidator.addRule('email', (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  });
  
  dataValidator.addRule('minLength', (value, data, minLength) => {
    return typeof value === 'string' && value.length >= minLength;
  });
  
  // Setup default transformers
  dataTransformer.addTransformer('trim', (data) => {
    if (typeof data === 'string') {
      return data.trim();
    }
    return data;
  });
  
  dataTransformer.addTransformer('toLowerCase', (data) => {
    if (typeof data === 'string') {
      return data.toLowerCase();
    }
    return data;
  });
  
  dataTransformer.addTransformer('toUpperCase', (data) => {
    if (typeof data === 'string') {
      return data.toUpperCase();
    }
    return data;
  });
  
  return {
    validator: dataValidator,
    transformer: dataTransformer,
    syncManager: dataSyncManager
  };
};
