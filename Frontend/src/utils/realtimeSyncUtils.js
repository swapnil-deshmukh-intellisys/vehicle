// Comprehensive real-time synchronization utility functions

// Real-time Sync Manager Class
export class RealtimeSyncManager {
  constructor(options = {}) {
    this.options = {
      wsUrl: 'ws://localhost:8080/sync',
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      enableOfflineMode: true,
      enableConflictResolution: true,
      conflictStrategy: 'merge', // 'client_wins', 'server_wins', 'merge', 'manual'
      syncInterval: 5000,
      batchSize: 100,
      ...options
    };
    
    this.ws = null;
    this.isConnected = false;
    this.reconnectCount = 0;
    this.heartbeatTimer = null;
    this.syncTimer = null;
    this.listeners = new Set();
    this.pendingChanges = [];
    this.conflicts = [];
    this.lastSyncTime = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    
    this.setupEventListeners();
  }

  // Setup event listeners
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  // Connect to WebSocket
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.wsUrl);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectCount = 0;
          this.startHeartbeat();
          this.startSync();
          this.processOfflineQueue();
          this.notifyListeners('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.stopSync();
          this.notifyListeners('disconnected');
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyListeners('error', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.stopSync();
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectCount >= this.options.reconnectAttempts) {
      this.notifyListeners('reconnectFailed');
      return;
    }

    this.reconnectCount++;
    this.notifyListeners('reconnecting', { attempt: this.reconnectCount });

    setTimeout(() => {
      this.connect().catch(() => {
        this.attemptReconnect();
      });
    }, this.options.reconnectDelay * this.reconnectCount);
  }

  // Handle incoming message
  handleMessage(message) {
    switch (message.type) {
      case 'sync':
        this.handleSyncMessage(message.data);
        break;
      case 'conflict':
        this.handleConflictMessage(message.data);
        break;
      case 'heartbeat':
        this.handleHeartbeat();
        break;
      case 'error':
        this.handleErrorMessage(message.data);
        break;
      default:
        this.notifyListeners('message', message);
    }
  }

  // Handle sync message
  handleSyncMessage(data) {
    this.lastSyncTime = Date.now();
    
    // Apply server changes
    data.changes.forEach(change => {
      this.applyChange(change);
    });
    
    // Acknowledge receipt
    this.send({
      type: 'sync_ack',
      timestamp: Date.now(),
      receivedChanges: data.changes.length
    });
    
    this.notifyListeners('synced', data);
  }

  // Handle conflict message
  handleConflictMessage(data) {
    const conflict = {
      id: this.generateConflictId(),
      clientChange: data.clientChange,
      serverChange: data.serverChange,
      timestamp: Date.now(),
      resolved: false
    };
    
    this.conflicts.push(conflict);
    
    if (this.options.enableConflictResolution) {
      this.resolveConflict(conflict);
    }
    
    this.notifyListeners('conflict', conflict);
  }

  // Handle heartbeat
  handleHeartbeat() {
    // Respond to server heartbeat
    this.send({
      type: 'heartbeat_response',
      timestamp: Date.now()
    });
  }

  // Handle error message
  handleErrorMessage(data) {
    console.error('Server error:', data);
    this.notifyListeners('serverError', data);
  }

  // Handle online event
  handleOnline() {
    this.notifyListeners('online');
    if (!this.isConnected) {
      this.connect();
    }
  }

  // Handle offline event
  handleOffline() {
    this.notifyListeners('offline');
    this.disconnect();
  }

  // Send message to server
  send(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    
    if (this.options.enableOfflineMode) {
      this.offlineQueue.push(message);
      return false;
    }
    
    return false;
  }

  // Add change to sync queue
  addChange(change) {
    const syncChange = {
      id: this.generateChangeId(),
      type: change.type,
      data: change.data,
      timestamp: Date.now(),
      clientId: this.getClientId(),
      version: change.version || 1
    };
    
    if (this.isConnected) {
      this.send({
        type: 'change',
        data: syncChange
      });
    } else {
      this.pendingChanges.push(syncChange);
    }
    
    this.notifyListeners('changeAdded', syncChange);
    return syncChange.id;
  }

  // Apply change from server
  applyChange(change) {
    // Check for conflicts
    const localChange = this.pendingChanges.find(c => c.id === change.id);
    
    if (localChange) {
      // Conflict detected
      this.handleConflict({
        clientChange: localChange,
        serverChange: change
      });
    } else {
      // Apply change
      this.notifyListeners('changeApplied', change);
    }
  }

  // Resolve conflict
  resolveConflict(conflict) {
    let resolvedChange;
    
    switch (this.options.conflictStrategy) {
      case 'client_wins':
        resolvedChange = conflict.clientChange;
        break;
      case 'server_wins':
        resolvedChange = conflict.serverChange;
        break;
      case 'merge':
        resolvedChange = this.mergeChanges(conflict.clientChange, conflict.serverChange);
        break;
      case 'manual':
        this.notifyListeners('manualConflict', conflict);
        return;
      default:
        resolvedChange = conflict.serverChange;
    }
    
    // Mark as resolved
    conflict.resolved = true;
    conflict.resolvedChange = resolvedChange;
    conflict.resolvedAt = Date.now();
    
    // Send resolution
    this.send({
      type: 'conflict_resolved',
      data: {
        conflictId: conflict.id,
        resolvedChange
      }
    });
    
    this.notifyListeners('conflictResolved', conflict);
  }

  // Merge two changes
  mergeChanges(clientChange, serverChange) {
    // Simple merge strategy - in practice, this would be more sophisticated
    const merged = {
      ...serverChange,
      ...clientChange,
      id: this.generateChangeId(),
      timestamp: Date.now(),
      merged: true,
      originalClientChange: clientChange,
      originalServerChange: serverChange
    };
    
    return merged;
  }

  // Process offline queue
  processOfflineQueue() {
    while (this.offlineQueue.length > 0) {
      const message = this.offlineQueue.shift();
      this.send(message);
    }
  }

  // Start heartbeat
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now()
        });
      }
    }, this.options.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Start sync
  startSync() {
    this.syncTimer = setInterval(() => {
      if (this.isConnected) {
        this.requestSync();
      }
    }, this.options.syncInterval);
  }

  // Stop sync
  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Request sync from server
  requestSync() {
    this.send({
      type: 'sync_request',
      timestamp: Date.now(),
      lastSyncTime: this.lastSyncTime
    });
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Sync manager listener error:', error);
      }
    });
  }

  // Get sync statistics
  getStats() {
    return {
      isConnected: this.isConnected,
      isOnline: this.isOnline,
      reconnectCount: this.reconnectCount,
      lastSyncTime: this.lastSyncTime,
      pendingChanges: this.pendingChanges.length,
      conflicts: this.conflicts.length,
      offlineQueue: this.offlineQueue.length,
      uptime: this.isConnected ? Date.now() - (this.connectTime || Date.now()) : 0
    };
  }

  // Get pending changes
  getPendingChanges() {
    return [...this.pendingChanges];
  }

  // Get conflicts
  getConflicts() {
    return [...this.conflicts];
  }

  // Clear conflicts
  clearConflicts() {
    this.conflicts = [];
    this.notifyListeners('conflictsCleared');
  }

  // Generate unique change ID
  generateChangeId() {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique conflict ID
  generateConflictId() {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get client ID
  getClientId() {
    if (!this.clientId) {
      this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.clientId;
  }

  // Force sync
  async forceSync() {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Sync timeout'));
      }, 10000);

      const cleanup = this.addListener((event, data) => {
        if (event === 'synced') {
          clearTimeout(timeout);
          cleanup();
          resolve(data);
        } else if (event === 'error') {
          clearTimeout(timeout);
          cleanup();
          reject(data);
        }
      });

      this.requestSync();
    });
  }

  // Set conflict strategy
  setConflictStrategy(strategy) {
    this.options.conflictStrategy = strategy;
    this.notifyListeners('conflictStrategyChanged', strategy);
  }

  // Enable/disable offline mode
  setOfflineMode(enabled) {
    this.options.enableOfflineMode = enabled;
    this.notifyListeners('offlineModeChanged', enabled);
  }
}

// Conflict Resolver Class
export class ConflictResolver {
  constructor() {
    this.strategies = new Map();
    this.setupDefaultStrategies();
  }

  // Setup default conflict resolution strategies
  setupDefaultStrategies() {
    // Timestamp strategy - newest wins
    this.strategies.set('timestamp', (clientChange, serverChange) => {
      return clientChange.timestamp > serverChange.timestamp ? clientChange : serverChange;
    });

    // Priority strategy - based on change type priority
    this.strategies.set('priority', (clientChange, serverChange) => {
      const priorities = {
        'delete': 3,
        'create': 2,
        'update': 1
      };
      
      const clientPriority = priorities[clientChange.type] || 0;
      const serverPriority = priorities[serverChange.type] || 0;
      
      return clientPriority > serverPriority ? clientChange : serverChange;
    });

    // Field-level merge strategy
    this.strategies.set('field_merge', (clientChange, serverChange) => {
      if (clientChange.type === 'update' && serverChange.type === 'update') {
        return {
          ...serverChange,
          data: { ...serverChange.data, ...clientChange.data },
          merged: true,
          mergeStrategy: 'field_merge'
        };
      }
      
      return serverChange;
    });

    // User choice strategy
    this.strategies.set('user_choice', (clientChange, serverChange, userChoice) => {
      return userChoice === 'client' ? clientChange : serverChange;
    });
  }

  // Register custom strategy
  registerStrategy(name, resolver) {
    this.strategies.set(name, resolver);
  }

  // Resolve conflict using strategy
  resolveConflict(clientChange, serverChange, strategy = 'timestamp', userChoice) {
    const resolver = this.strategies.get(strategy);
    
    if (!resolver) {
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }

    return resolver(clientChange, serverChange, userChoice);
  }

  // Get available strategies
  getStrategies() {
    return Array.from(this.strategies.keys());
  }
}

// Sync Queue Manager
export class SyncQueueManager {
  constructor(options = {}) {
    this.options = {
      maxQueueSize: 1000,
      batchSize: 50,
      batchTimeout: 1000,
      enablePrioritization: true,
      ...options
    };
    
    this.queue = [];
    this.processing = false;
    this.listeners = new Set();
    this.batchTimer = null;
  }

  // Add item to queue
  addItem(item, priority = 'normal') {
    const queueItem = {
      id: this.generateItemId(),
      item,
      priority,
      addedAt: Date.now(),
      attempts: 0
    };

    if (this.options.enablePrioritization) {
      this.insertByPriority(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    // Limit queue size
    if (this.queue.length > this.options.maxQueueSize) {
      this.queue.shift();
    }

    this.notifyListeners('itemAdded', queueItem);
    this.scheduleProcessing();

    return queueItem.id;
  }

  // Insert item by priority
  insertByPriority(queueItem) {
    const priorities = { high: 3, normal: 2, low: 1 };
    const itemPriority = priorities[queueItem.priority] || 2;

    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const existingPriority = priorities[this.queue[i].priority] || 2;
      if (itemPriority > existingPriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, queueItem);
  }

  // Process queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const batch = this.queue.splice(0, this.options.batchSize);
      
      for (const queueItem of batch) {
        try {
          await this.processItem(queueItem);
          this.notifyListeners('itemProcessed', queueItem);
        } catch (error) {
          queueItem.attempts++;
          queueItem.error = error;
          
          if (queueItem.attempts < 3) {
            // Re-queue for retry
            this.queue.unshift(queueItem);
          } else {
            this.notifyListeners('itemFailed', queueItem);
          }
        }
      }
    } finally {
      this.processing = false;
      
      if (this.queue.length > 0) {
        this.scheduleProcessing();
      }
    }
  }

  // Process individual item
  async processItem(queueItem) {
    // Override this method in subclasses
    return Promise.resolve(queueItem.item);
  }

  // Schedule processing
  scheduleProcessing() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processQueue();
    }, this.options.batchTimeout);
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Sync queue listener error:', error);
      }
    });
  }

  // Get queue statistics
  getStats() {
    const priorityCounts = this.queue.reduce((counts, item) => {
      counts[item.priority] = (counts[item.priority] || 0) + 1;
      return counts;
    }, {});

    return {
      queueSize: this.queue.length,
      processing: this.processing,
      priorityCounts,
      maxQueueSize: this.options.maxQueueSize,
      batchSize: this.options.batchSize
    };
  }

  // Clear queue
  clearQueue() {
    this.queue = [];
    this.notifyListeners('queueCleared');
  }

  // Generate unique item ID
  generateItemId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create global instances
export const realtimeSyncManager = new RealtimeSyncManager();
export const conflictResolver = new ConflictResolver();
export const syncQueueManager = new SyncQueueManager();

// Initialize real-time sync system
export const initializeRealtimeSync = (options = {}) => {
  const syncManager = new RealtimeSyncManager(options.sync || {});
  const resolver = new ConflictResolver();
  const queueManager = new SyncQueueManager(options.queue || {});

  return {
    syncManager,
    resolver,
    queueManager
  };
};
