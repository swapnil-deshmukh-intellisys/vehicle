// State management and persistence helper utilities

// Validation helpers
export const validateDataType = (value, expectedType) => {
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  return actualType === expectedType;
};

export const validateStateKey = (key) => {
  return typeof key === 'string' && key.length > 0 && !key.includes('.');
};

export const validateStorageKey = (key) => {
  return typeof key === 'string' && key.length > 0 && key.length < 256;
};

// Serialization helpers
export const safeSerialize = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('Serialization error:', error);
    return null;
  }
};

export const safeDeserialize = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Deserialization error:', error);
    return null;
  }
};

// Storage availability helpers
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const isSessionStorageAvailable = () => {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const isIndexedDBAvailable = () => {
  return 'indexedDB' in window && indexedDB !== null;
};

// Data size helpers
export const getDataSize = (data) => {
  if (typeof data === 'string') {
    return data.length * 2; // UTF-16 characters
  }
  
  if (data instanceof Blob) {
    return data.size;
  }
  
  // For objects, estimate size
  const serialized = safeSerialize(data);
  return serialized ? serialized.length * 2 : 0;
};

export const formatDataSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Expiration helpers
export const isExpired = (timestamp, expiration) => {
  if (!expiration) return false;
  
  if (expiration === 'session') {
    return !window.sessionStorage;
  }
  
  return Date.now() > expiration;
};

export const createExpiration = (strategy, value) => {
  switch (strategy) {
    case 'never':
      return null;
    case 'session':
      return 'session';
    case 'time':
      return Date.now() + (value || 24 * 60 * 60 * 1000); // Default 24 hours
    case 'version':
      return value || 1;
    default:
      return null;
  }
};

// Key generation helpers
export const generateStorageKey = (prefix, key, version = 1) => {
  return `${prefix}:${key}:${version}`;
};

export const parseStorageKey = (storageKey) => {
  const parts = storageKey.split(':');
  return {
    prefix: parts[0] || '',
    key: parts[1] || '',
    version: parseInt(parts[2]) || 1
  };
};

// Migration helpers
export const migrateData = (oldData, migrationMap) => {
  const newData = { ...oldData };
  
  Object.keys(migrationMap).forEach(oldKey => {
    const newKey = migrationMap[oldKey];
    if (oldData.hasOwnProperty(oldKey)) {
      newData[newKey] = oldData[oldKey];
      delete newData[oldKey];
    }
  });
  
  return newData;
};

export const versionCheck = (dataVersion, currentVersion) => {
  if (dataVersion < currentVersion) {
    return 'needs_upgrade';
  } else if (dataVersion > currentVersion) {
    return 'needs_downgrade';
  }
  return 'compatible';
};

// Compression helpers (placeholder - use real compression in production)
export const compressData = (data) => {
  const serialized = safeSerialize(data);
  return serialized ? btoa(serialized) : null;
};

export const decompressData = (compressed) => {
  try {
    const serialized = atob(compressed);
    return safeDeserialize(serialized);
  } catch {
    return null;
  }
};

// Encryption helpers (placeholder - use real encryption in production)
export const encryptData = (data, key = 'default') => {
  const serialized = safeSerialize(data);
  if (!serialized) return null;
  
  // Simple XOR encryption (use proper encryption in production)
  const encrypted = serialized.split('').map(char => {
    return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(0));
  }).join('');
  
  return btoa(encrypted);
};

export const decryptData = (encrypted, key = 'default') => {
  try {
    const decoded = atob(encrypted);
    const decrypted = decoded.split('').map(char => {
      return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(0));
    }).join('');
    
    return safeDeserialize(decrypted);
  } catch {
    return null;
  }
};

// Cleanup helpers
export const cleanupExpiredData = (storage, keyPrefix = '') => {
  const keysToRemove = [];
  
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith(keyPrefix)) {
      try {
        const data = safeDeserialize(storage.getItem(key));
        if (data && data.expiration && isExpired(data.timestamp, data.expiration)) {
          keysToRemove.push(key);
        }
      } catch {
        // Remove corrupted data
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => storage.removeItem(key));
  return keysToRemove.length;
};

export const cleanupCorruptedData = (storage, keyPrefix = '') => {
  const keysToRemove = [];
  
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith(keyPrefix)) {
      try {
        const data = storage.getItem(key);
        safeDeserialize(data); // Test if it's valid JSON
      } catch {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => storage.removeItem(key));
  return keysToRemove.length;
};

// Performance helpers
export const measureStorageOperation = (operation) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await operation(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        result,
        duration,
        success: true
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        error,
        duration,
        success: false
      };
    }
  };
};

// Batch operations helpers
export const batchStorageOperations = async (operations) => {
  const results = [];
  
  for (const operation of operations) {
    try {
      const result = await operation();
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error });
    }
  }
  
  return results;
};

// Storage quota helpers
export const checkStorageQuota = (storage, data) => {
  const dataSize = getDataSize(data);
  const usage = getStorageUsage(storage);
  
  return {
    canStore: usage.used + dataSize <= usage.available,
    required: dataSize,
    available: usage.available - usage.used,
    percentage: ((usage.used + dataSize) / usage.available) * 100
  };
};

export const getStorageUsage = (storage) => {
  let used = 0;
  
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) {
      const value = storage.getItem(key);
      used += key.length + (value ? value.length : 0);
    }
  }
  
  // Estimate available space
  const available = storage === localStorage ? 5 * 1024 * 1024 : 5 * 1024 * 1024;
  
  return {
    used,
    available,
    percentage: (used / available) * 100
  };
};
