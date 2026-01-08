// Comprehensive authentication utility functions

// JWT Token Management
export class TokenManager {
  constructor(storageKey = 'auth_token', refreshKey = 'refresh_token') {
    this.storageKey = storageKey;
    this.refreshKey = refreshKey;
  }

  setTokens(accessToken, refreshToken) {
    try {
      localStorage.setItem(this.storageKey, accessToken);
      if (refreshToken) {
        localStorage.setItem(this.refreshKey, refreshToken);
      }
      return true;
    } catch (error) {
      console.error('Failed to store tokens:', error);
      return false;
    }
  }

  getAccessToken() {
    return localStorage.getItem(this.storageKey);
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshKey);
  }

  removeTokens() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.refreshKey);
  }

  isTokenExpired(token) {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  getTokenPayload(token) {
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  willExpireSoon(token, bufferMinutes = 5) {
    if (!token) return true;

    const payload = this.getTokenPayload(token);
    if (!payload || !payload.exp) return true;

    const currentTime = Date.now() / 1000;
    const bufferSeconds = bufferMinutes * 60;
    return payload.exp < (currentTime + bufferSeconds);
  }
}

// User Management
export class UserManager {
  constructor(storageKey = 'user_data') {
    this.storageKey = storageKey;
    this.currentUser = null;
    this.loadUser();
  }

  setUser(userData) {
    this.currentUser = userData;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Failed to store user data:', error);
      return false;
    }
  }

  getUser() {
    return this.currentUser;
  }

  updateUser(updates) {
    if (!this.currentUser) return false;

    this.currentUser = { ...this.currentUser, ...updates };
    return this.setUser(this.currentUser);
  }

  removeUser() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
  }

  loadUser() {
    try {
      const userData = localStorage.getItem(this.storageKey);
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      this.removeUser();
    }
  }

  hasRole(role) {
    return this.currentUser?.roles?.includes(role) || false;
  }

  hasPermission(permission) {
    return this.currentUser?.permissions?.includes(permission) || false;
  }

  isAdmin() {
    return this.hasRole('admin') || this.hasRole('super_admin');
  }

  isLoggedIn() {
    return !!this.currentUser;
  }
}

// Session Management
export class SessionManager {
  constructor(timeoutMinutes = 30) {
    this.timeoutMinutes = timeoutMinutes;
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.sessionExpiredCallback = null;
    this.warningCallback = null;
    this.setupActivityTracking();
  }

  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true);
    });

    // Check session status every minute
    setInterval(() => this.checkSession(), 60000);
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.warningShown = false;
  }

  checkSession() {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    const warningTime = timeoutMs - (5 * 60 * 1000); // 5 minutes before timeout

    if (inactiveTime >= timeoutMs) {
      this.handleSessionExpired();
    } else if (inactiveTime >= warningTime && !this.warningShown) {
      this.handleSessionWarning();
    }
  }

  handleSessionExpired() {
    if (this.sessionExpiredCallback) {
      this.sessionExpiredCallback();
    }
  }

  handleSessionWarning() {
    this.warningShown = true;
    if (this.warningCallback) {
      this.warningCallback();
    }
  }

  onSessionExpired(callback) {
    this.sessionExpiredCallback = callback;
  }

  onSessionWarning(callback) {
    this.warningCallback = callback;
  }

  extendSession() {
    this.updateActivity();
  }

  getRemainingTime() {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - inactiveTime);
  }

  isSessionActive() {
    return this.getRemainingTime() > 0;
  }
}

// Authentication Service
export class AuthService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.tokenManager = new TokenManager();
    this.userManager = new UserManager();
    this.sessionManager = new SessionManager();
    this.isAuthenticated = false;
    this.authCallbacks = [];
  }

  async login(credentials) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Store tokens
      this.tokenManager.setTokens(data.accessToken, data.refreshToken);
      
      // Store user data
      this.userManager.setUser(data.user);
      
      // Update authentication state
      this.isAuthenticated = true;
      
      // Notify callbacks
      this.notifyAuthChange(true, data.user);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      // Call logout endpoint
      await fetch(`${this.apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokenManager.getAccessToken()}`,
          'X-CSRF-Token': this.getCSRFToken()
        }
      });
    } catch {
      console.error('Logout error occurred');
    } finally {
      // Clear local data regardless of API call success
      this.tokenManager.removeTokens();
      this.userManager.removeUser();
      this.isAuthenticated = false;
      
      // Notify callbacks
      this.notifyAuthChange(false, null);
    }
  }

  async refreshToken() {
    try {
      const refreshToken = this.tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      this.tokenManager.setTokens(data.accessToken, data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`Password reset failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  getCSRFToken() {
    const match = document.cookie.match(/csrf-token=([^;]+)/);
    return match ? match[1] : '';
  }

  checkAuthStatus() {
    const token = this.tokenManager.getAccessToken();
    const user = this.userManager.getUser();
    
    if (token && user && !this.tokenManager.isTokenExpired(token)) {
      this.isAuthenticated = true;
      return true;
    }

    this.isAuthenticated = false;
    return false;
  }

  onAuthChange(callback) {
    this.authCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }

  notifyAuthChange(isAuthenticated, user) {
    this.authCallbacks.forEach(callback => {
      try {
        callback(isAuthenticated, user);
      } catch (error) {
        console.error('Auth callback error:', error);
      }
    });
  }

  // Middleware for API calls
  createAuthMiddleware() {
    return async (url, options = {}) => {
      const token = this.tokenManager.getAccessToken();
      
      // Check if token needs refresh
      if (token && this.tokenManager.willExpireSoon(token)) {
        try {
          await this.refreshToken();
        } catch {
          // Refresh failed, user needs to login again
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      // Add auth headers
      const authOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.tokenManager.getAccessToken()}`,
          'X-CSRF-Token': this.getCSRFToken()
        }
      };

      return authOptions;
    };
  }

  // Role-based access control
  requireRole(role) {
    return (req, res, next) => {
      if (!this.isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!this.userManager.hasRole(role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }

  requirePermission(permission) {
    return (req, res, next) => {
      if (!this.isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!this.userManager.hasPermission(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }
}

// Create global auth service
export const authService = new AuthService('/api/auth');

// Utility functions
export const isAuthenticated = () => {
  return authService.checkAuthStatus();
};

export const getCurrentUser = () => {
  return authService.userManager.getUser();
};

export const hasRole = (role) => {
  return authService.userManager.hasRole(role);
};

export const hasPermission = (permission) => {
  return authService.userManager.hasPermission(permission);
};

export const requireAuth = (callback) => {
  if (isAuthenticated()) {
    callback();
  } else {
    // Redirect to login or show login modal
    console.warn('Authentication required');
  }
};

// Initialize authentication
export const initializeAuth = () => {
  // Check existing auth status
  authService.checkAuthStatus();

  // Set up session management
  authService.sessionManager.onSessionExpired(() => {
    console.warn('Session expired due to inactivity');
    authService.logout();
  });

  authService.sessionManager.onSessionWarning(() => {
    console.warn('Session will expire soon');
    // Show warning to user
  });

  return authService;
};
