// Cache utility functions for better performance

// Simple in-memory cache
const cache = new Map();

// Cache with TTL (time to live)
const cacheWithTTL = new Map();

// Set cache with expiration
export const setCacheWithTTL = (key, value, ttlMs = 300000) => { // 5 minutes default
  const expiry = Date.now() + ttlMs;
  cacheWithTTL.set(key, { value, expiry });
};

// Get cached value with TTL check
export const getCacheWithTTL = (key) => {
  const item = cacheWithTTL.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cacheWithTTL.delete(key);
    return null;
  }
  
  return item.value;
};

// Simple cache operations
export const setCache = (key, value) => {
  cache.set(key, value);
};

export const getCache = (key) => {
  return cache.get(key) || null;
};

export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
    cacheWithTTL.delete(key);
  } else {
    cache.clear();
    cacheWithTTL.clear();
  }
};

// Debounce function for performance
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
