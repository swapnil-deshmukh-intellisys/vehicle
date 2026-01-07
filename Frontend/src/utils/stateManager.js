// Comprehensive state management utility

// State manager class
export class StateManager {
  constructor(initialState = {}, options = {}) {
    this.state = { ...initialState };
    this.listeners = new Map();
    this.history = [];
    this.maxHistorySize = options.maxHistorySize || 50;
    this.persistKey = options.persistKey || null;
    this.persistTo = options.persistTo || null; // 'localStorage', 'sessionStorage', or null
    this.middleware = options.middleware || [];
    
    // Load persisted state if available
    this.loadPersistedState();
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Get specific state value
  get(key) {
    return this.state[key];
  }

  // Set state
  setState(updates, options = {}) {
    const { merge = true, persist = true, history = true } = options;
    
    const prevState = { ...this.state };
    
    // Apply middleware
    let processedUpdates = updates;
    for (const middleware of this.middleware) {
      processedUpdates = middleware(processedUpdates, prevState);
    }
    
    // Update state
    if (merge) {
      this.state = { ...this.state, ...processedUpdates };
    } else {
      this.state = { ...processedUpdates };
    }
    
    // Add to history
    if (history) {
      this.addToHistory(prevState, this.state);
    }
    
    // Persist state
    if (persist && this.persistTo) {
      this.persistState();
    }
    
    // Notify listeners
    this.notifyListeners(prevState, this.state);
    
    return this.state;
  }

  // Reset state to initial or provided state
  resetState(newState = {}) {
    const prevState = { ...this.state };
    this.state = { ...newState };
    
    this.addToHistory(prevState, this.state);
    this.persistState();
    this.notifyListeners(prevState, this.state);
    
    return this.state;
  }

  // Add state change listener
  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key).add(listener);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Add global listener (listens to all changes)
  subscribeAll(listener) {
    return this.subscribe('*', listener);
  }

  // Notify listeners of state change
  notifyListeners(prevState, newState) {
    // Notify global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener(newState, prevState);
        } catch (error) {
          console.error('State listener error:', error);
        }
      });
    }
    
    // Notify specific key listeners
    Object.keys(newState).forEach(key => {
      if (prevState[key] !== newState[key]) {
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
          keyListeners.forEach(listener => {
            try {
              listener(newState[key], prevState[key], newState);
            } catch (error) {
              console.error('State listener error:', error);
            }
          });
        }
      }
    });
  }

  // Add state to history
  addToHistory(prevState, newState) {
    this.history.push({
      timestamp: Date.now(),
      prevState: { ...prevState },
      newState: { ...newState }
    });
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // Get state history
  getHistory() {
    return [...this.history];
  }

  // Undo last state change
  undo() {
    if (this.history.length === 0) {
      return this.state;
    }
    
    const lastChange = this.history.pop();
    this.state = { ...lastChange.prevState };
    this.persistState();
    this.notifyListeners(lastChange.newState, this.state);
    
    return this.state;
  }

  // Redo state change (if we implement redo stack)
  redo() {
    // This would require a redo stack implementation
    console.warn('Redo functionality not implemented');
    return this.state;
  }

  // Persist state to storage
  persistState() {
    if (!this.persistTo || !this.persistKey) return;
    
    try {
      const storage = this.persistTo === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem(this.persistKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  // Load persisted state from storage
  loadPersistedState() {
    if (!this.persistTo || !this.persistKey) return;
    
    try {
      const storage = this.persistTo === 'localStorage' ? localStorage : sessionStorage;
      const persistedState = storage.getItem(this.persistKey);
      
      if (persistedState) {
        this.state = { ...this.state, ...JSON.parse(persistedState) };
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  // Clear persisted state
  clearPersistedState() {
    if (!this.persistTo || !this.persistKey) return;
    
    try {
      const storage = this.persistTo === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(this.persistKey);
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
    }
  }

  // Add middleware
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  // Remove middleware
  removeMiddleware(middleware) {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
    }
  }

  // Get state size (number of properties)
  getStateSize() {
    return Object.keys(this.state).length;
  }

  // Check if state has specific key
  has(key) {
    return key in this.state;
  }

  // Delete state property
  delete(key) {
    if (!(key in this.state)) return this.state;
    
    const prevState = { ...this.state };
    delete this.state[key];
    
    this.addToHistory(prevState, this.state);
    this.persistState();
    this.notifyListeners(prevState, this.state);
    
    return this.state;
  }

  // Clear all state
  clear() {
    return this.resetState({});
  }

  // Merge state with object
  merge(obj) {
    return this.setState(obj, { merge: true });
  }

  // Replace state entirely
  replace(obj) {
    return this.setState(obj, { merge: false });
  }

  // Get state snapshot
  getSnapshot() {
    return {
      state: { ...this.state },
      timestamp: Date.now(),
      historySize: this.history.length
    };
  }
}

// Create global state manager instance
export const globalStateManager = new StateManager();

// State manager factory function
export const createStateManager = (initialState = {}, options = {}) => {
  return new StateManager(initialState, options);
};

// Hook-like function for React components
export const useStateManager = (stateManager, key = null) => {
  // This would be used with React's useState and useEffect
  // Implementation would depend on React integration
  return {
    state: key ? stateManager.get(key) : stateManager.getState(),
    setState: (updates) => stateManager.setState(updates),
    subscribe: (listener) => stateManager.subscribe(key || '*', listener)
  };
};

// Middleware examples
export const loggingMiddleware = (updates, prevState) => {
  console.log('State update:', { updates, prevState });
  return updates;
};

export const validationMiddleware = (schema) => (updates) => {
  // Simple validation - in real app, use a validation library
  Object.keys(updates).forEach(key => {
    if (schema[key] && typeof updates[key] !== schema[key]) {
      console.warn(`Invalid type for ${key}: expected ${schema[key]}, got ${typeof updates[key]}`);
    }
  });
  return updates;
};

export const timestampMiddleware = (updates) => {
  return {
    ...updates,
    _lastUpdated: Date.now()
  };
};

// Utility functions
export const createPersistedStateManager = (key, initialState = {}, storage = 'localStorage') => {
  return new StateManager(initialState, {
    persistKey: key,
    persistTo: storage
  });
};

export const createUndoRedoManager = (initialState = {}, maxHistory = 50) => {
  return new StateManager(initialState, {
    maxHistorySize: maxHistory
  });
};
