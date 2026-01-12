// Comprehensive WebSocket utility functions

// WebSocket Client Class
export class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      protocols: [],
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,
      ...options
    };
    
    this.ws = null;
    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.eventHandlers = new Map();
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.lastPingTime = null;
    this.connectionId = this.generateConnectionId();
  }

  // Generate unique connection ID
  generateConnectionId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Connect to WebSocket
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.options.protocols);
        
        this.ws.onopen = (event) => {
          this.isConnected = true;
          this.isReconnecting = false;
          this.reconnectAttempts = 0;
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Send queued messages
          this.flushMessageQueue();
          
          // Emit connect event
          this.emit('connect', event);
          
          resolve(event);
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
        
        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.stopHeartbeat();
          
          // Emit disconnect event
          this.emit('disconnect', event);
          
          // Attempt reconnection if not manual disconnect
          if (!event.wasClean && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
        
        this.ws.onerror = (event) => {
          this.emit('error', event);
          
          if (!this.isConnected) {
            reject(new Error('WebSocket connection failed'));
          }
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    this.isReconnecting = false;
    this.reconnectAttempts = this.options.maxReconnectAttempts; // Prevent reconnection
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.stopHeartbeat();
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.isReconnecting) {
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    this.emit('reconnect_attempt', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.options.maxReconnectAttempts
    });
    
    setTimeout(() => {
      if (this.isReconnecting) {
        this.connect();
      }
    }, this.options.reconnectInterval);
  }

  // Send message
  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  // Send message with acknowledgment
  sendWithAck(data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const message = {
        id: messageId,
        type: 'request',
        data: data,
        timestamp: Date.now()
      };
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.removeEventHandler(messageId, ackHandler);
        reject(new Error('Message acknowledgment timeout'));
      }, timeout);
      
      // Set up acknowledgment handler
      const ackHandler = (event) => {
        const response = JSON.parse(event.data);
        if (response.id === messageId && response.type === 'ack') {
          clearTimeout(timeoutId);
          this.removeEventHandler(messageId, ackHandler);
          resolve(response);
        }
      };
      
      this.addEventListener(messageId, ackHandler);
      this.send(message);
    });
  }

  // Generate message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Handle incoming message
  handleMessage(event) {
    try {
      let data;
      
      // Try to parse as JSON
      try {
        data = JSON.parse(event.data);
      } catch {
        data = event.data;
      }
      
      // Handle heartbeat
      if (data.type === 'pong') {
        this.handlePong(data);
        return;
      }
      
      // Emit message event
      this.emit('message', data);
      
      // Emit specific message type if present
      if (data.type) {
        this.emit(data.type, data);
      }
      
    } catch {
      this.emit('error', new Error('Failed to parse WebSocket message'));
    }
  }

  // Start heartbeat
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });
        this.lastPingTime = Date.now();
        
        // Set timeout for pong response
        this.heartbeatTimeoutTimer = setTimeout(() => {
          this.emit('heartbeat_timeout');
          this.ws.close(1000, 'Heartbeat timeout');
        }, this.options.heartbeatTimeout);
      }
    }, this.options.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  // Handle pong response
  handlePong(data) {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
    
    const latency = Date.now() - this.lastPingTime;
    this.emit('pong', { ...data, latency });
  }

  // Flush message queue
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  // Add event listener
  addEventListener(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  // Remove event listener
  removeEventListener(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  // Remove event handler (alias for removeEventListener)
  removeEventHandler(event, handler) {
    this.removeEventListener(event, handler);
  }

  // Emit event
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('WebSocket event handler error:', error);
        }
      });
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      reconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
      connectionId: this.connectionId,
      queuedMessages: this.messageQueue.length
    };
  }

  // Get connection info
  getConnectionInfo() {
    return {
      url: this.url,
      protocols: this.options.protocols,
      connectionId: this.connectionId,
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastPingTime: this.lastPingTime
    };
  }
}

// WebSocket Manager Class
export class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.globalHandlers = new Map();
    this.defaultOptions = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000
    };
  }

  // Create WebSocket connection
  create(name, url, options = {}) {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const ws = new WebSocketClient(url, mergedOptions);
    
    // Add global handlers
    for (const [event, handlers] of this.globalHandlers) {
      for (const handler of handlers) {
        ws.addEventListener(event, handler);
      }
    }
    
    this.connections.set(name, ws);
    return ws;
  }

  // Get WebSocket connection
  get(name) {
    return this.connections.get(name);
  }

  // Remove WebSocket connection
  remove(name) {
    const ws = this.connections.get(name);
    if (ws) {
      ws.disconnect();
      this.connections.delete(name);
    }
  }

  // Connect all WebSocket connections
  async connectAll() {
    const promises = Array.from(this.connections.values()).map(ws => ws.connect());
    return Promise.allSettled(promises);
  }

  // Disconnect all WebSocket connections
  disconnectAll() {
    for (const ws of this.connections.values()) {
      ws.disconnect();
    }
  }

  // Add global event handler
  addGlobalHandler(event, handler) {
    if (!this.globalHandlers.has(event)) {
      this.globalHandlers.set(event, new Set());
    }
    this.globalHandlers.get(event).add(handler);
    
    // Add to existing connections
    for (const ws of this.connections.values()) {
      ws.addEventListener(event, handler);
    }
  }

  // Remove global event handler
  removeGlobalHandler(event, handler) {
    const handlers = this.globalHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.globalHandlers.delete(event);
      }
    }
    
    // Remove from existing connections
    for (const ws of this.connections.values()) {
      ws.removeEventListener(event, handler);
    }
  }

  // Get status of all connections
  getAllStatus() {
    const status = {};
    for (const [name, ws] of this.connections) {
      status[name] = ws.getStatus();
    }
    return status;
  }

  // Get connection count
  getConnectionCount() {
    return this.connections.size;
  }

  // Get connected count
  getConnectedCount() {
    let count = 0;
    for (const ws of this.connections.values()) {
      if (ws.isConnected) {
        count++;
      }
    }
    return count;
  }
}

// WebSocket Message Router
export class WebSocketMessageRouter {
  constructor() {
    this.routes = new Map();
    this.middleware = [];
    this.defaultHandler = null;
  }

  // Add route
  addRoute(PATTERN, handler) {
    const route = {
      pattern: typeof PATTERN === 'string' ? new RegExp(`^${PATTERN}$`) : PATTERN,
      handler
    };
    this.routes.set(PATTERN, route);
  }

  // Add middleware
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  // Set default handler
  setDefaultHandler(handler) {
    this.defaultHandler = handler;
  }

  // Route message
  async route(message, ws) {
    // Apply middleware
    let processedMessage = message;
    for (const middleware of this.middleware) {
      processedMessage = await middleware(processedMessage, ws);
    }
    
    // Find matching route
    const messageType = processedMessage.type || processedMessage;
    
    for (const [_pattern, route] of this.routes) {
      if (route.pattern.test(messageType)) {
        try {
          await route.handler(processedMessage, ws);
          return;
        } catch (error) {
          console.error('WebSocket route handler error:', error);
        }
      }
    }
    
    // Use default handler if no route matched
    if (this.defaultHandler) {
      try {
        await this.defaultHandler(processedMessage, ws);
      } catch (error) {
        console.error('WebSocket default handler error:', error);
      }
    }
  }
}

// WebSocket Room Manager
export class WebSocketRoomManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.rooms = new Map(); // room -> Set of connection names
    this.connections = new Map(); // connection name -> Set of room names
  }

  // Join room
  join(connectionName, roomName) {
    // Add connection to room
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(connectionName);
    
    // Add room to connection
    if (!this.connections.has(connectionName)) {
      this.connections.set(connectionName, new Set());
    }
    this.connections.get(connectionName).add(roomName);
  }

  // Leave room
  leave(connectionName, roomName) {
    // Remove connection from room
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(connectionName);
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }
    
    // Remove room from connection
    const connectionRooms = this.connections.get(connectionName);
    if (connectionRooms) {
      connectionRooms.delete(roomName);
      if (connectionRooms.size === 0) {
        this.connections.delete(connectionName);
      }
    }
  }

  // Leave all rooms
  leaveAll(connectionName) {
    const connectionRooms = this.connections.get(connectionName);
    if (connectionRooms) {
      for (const roomName of connectionRooms) {
        this.leave(connectionName, roomName);
      }
    }
  }

  // Broadcast to room
  broadcast(roomName, message, excludeConnection = null) {
    const room = this.rooms.get(roomName);
    if (!room) {
      return;
    }
    
    for (const connectionName of room) {
      if (connectionName !== excludeConnection) {
        const connection = this.wsManager.get(connectionName);
        if (connection && connection.isConnected) {
          connection.send(message);
        }
      }
    }
  }

  // Get room members
  getRoomMembers(roomName) {
    const room = this.rooms.get(roomName);
    return room ? Array.from(room) : [];
  }

  // Get connection rooms
  getConnectionRooms(connectionName) {
    const connectionRooms = this.connections.get(connectionName);
    return connectionRooms ? Array.from(connectionRooms) : [];
  }

  // Get all rooms
  getAllRooms() {
    return Array.from(this.rooms.keys());
  }

  // Get room count
  getRoomCount(roomName) {
    const room = this.rooms.get(roomName);
    return room ? room.size : 0;
  }

  // Get connection count in room
  getConnectionCount(roomName) {
    return this.getRoomCount(roomName);
  }
}

// WebSocket Authentication Manager
export class WebSocketAuthManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.authenticatedConnections = new Map();
    this.tokenRefreshInterval = null;
  }

  // Authenticate connection
  async authenticate(connectionName, token, authOptions = {}) {
    const connection = this.wsManager.get(connectionName);
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    try {
      // Send authentication message
      const authMessage = {
        type: 'auth',
        token,
        options: authOptions
      };
      
      const response = await connection.sendWithAck(authMessage, authOptions.timeout || 10000);
      
      if (response.success) {
        this.authenticatedConnections.set(connectionName, {
          token,
          user: response.user,
          permissions: response.permissions,
          authenticatedAt: Date.now()
        });
        
        return response;
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
  }

  // Check if connection is authenticated
  isAuthenticated(connectionName) {
    return this.authenticatedConnections.has(connectionName);
  }

  // Get authentication info
  getAuthInfo(connectionName) {
    return this.authenticatedConnections.get(connectionName);
  }

  // Deauthenticate connection
  deauthenticate(connectionName) {
    this.authenticatedConnections.delete(connectionName);
    
    const connection = this.wsManager.get(connectionName);
    if (connection) {
      connection.send({ type: 'deauth' });
    }
  }

  // Refresh token
  async refreshToken(connectionName, newToken) {
    const authInfo = this.authenticatedConnections.get(connectionName);
    if (!authInfo) {
      throw new Error('Connection not authenticated');
    }
    
    const connection = this.wsManager.get(connectionName);
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    try {
      const response = await connection.sendWithAck({
        type: 'refresh_token',
        token: newToken
      });
      
      if (response.success) {
        authInfo.token = newToken;
        authInfo.user = response.user;
        authInfo.permissions = response.permissions;
        authInfo.authenticatedAt = Date.now();
      }
      
      return response;
    } catch (refreshError) {
      throw new Error(`Token refresh failed: ${refreshError.message}`);
    }
  }

  // Setup automatic token refresh
  setupTokenRefresh(refreshInterval, refreshCallback) {
    this.stopTokenRefresh();
    
    this.tokenRefreshInterval = setInterval(async () => {
      for (const [connectionName, authInfo] of this.authenticatedConnections) {
        try {
          const newToken = await refreshCallback(connectionName, authInfo);
          await this.refreshToken(connectionName, newToken);
        } catch {
          console.error(`Token refresh failed for ${connectionName}`);
        }
      }
    }, refreshInterval);
  }

  // Stop token refresh
  stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  // Check permissions
  hasPermission(connectionName, permission) {
    const authInfo = this.authenticatedConnections.get(connectionName);
    if (!authInfo || !authInfo.permissions) {
      return false;
    }
    
    return authInfo.permissions.includes(permission) || 
           authInfo.permissions.includes('*');
  }

  // Get all authenticated connections
  getAuthenticatedConnections() {
    return Array.from(this.authenticatedConnections.keys());
  }

  // Get authentication count
  getAuthenticatedCount() {
    return this.authenticatedConnections.size;
  }
}

// Create global instances
export const wsManager = new WebSocketManager();
export const messageRouter = new WebSocketMessageRouter();
export const roomManager = new WebSocketRoomManager(wsManager);
export const authManager = new WebSocketAuthManager(wsManager);

// Initialize WebSocket system
export const initializeWebSocket = () => {
  // Setup default message routes
  messageRouter.addRoute('chat', async (message) => {
    // Handle chat messages
    console.log('Chat message:', message);
  });
  
  messageRouter.addRoute('notification', async (message) => {
    // Handle notifications
    console.log('Notification:', message);
  });
  
  messageRouter.addRoute('data_update', async (message) => {
    // Handle data updates
    console.log('Data update:', message);
  });
  
  // Setup default middleware
  messageRouter.addMiddleware(async (message) => {
    // Log all messages
    console.log('WebSocket message:', message);
    return message;
  });
  
  // Setup global handlers
  wsManager.addGlobalHandler('connect', (event) => {
    console.log('WebSocket connected:', event);
  });
  
  wsManager.addGlobalHandler('disconnect', (event) => {
    console.log('WebSocket disconnected:', event);
    roomManager.leaveAll(event.target.connectionId);
    authManager.deauthenticate(event.target.connectionId);
  });
  
  wsManager.addGlobalHandler('error', (event) => {
    console.error('WebSocket error:', event);
  });
  
  return {
    manager: wsManager,
    router: messageRouter,
    rooms: roomManager,
    auth: authManager
  };
};
