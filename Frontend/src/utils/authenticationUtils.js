// Comprehensive authentication utility functions

// JWT Token Management
export const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
};

export const validateJWT = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    const payload = parseJWT(token);
    if (!payload) {
      return false;
    }

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('JWT validation failed:', error);
    return false;
  }
};

export const isTokenExpired = (token) => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }
  return Date.now() >= payload.exp * 1000;
};

export const getTokenExpirationTime = (token) => {
  const payload = parseJWT(token);
  return payload ? payload.exp * 1000 : null;
};

// Session Management
export class SessionManager {
  constructor() {
    this.sessionKey = 'auth_session';
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
  }

  setSession(sessionData) {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Failed to set session:', error);
      return false;
    }
  }

  getSession() {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  setToken(token) {
    try {
      localStorage.setItem(this.tokenKey, token);
      return true;
    } catch (error) {
      console.error('Failed to set token:', error);
      return false;
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setRefreshToken(refreshToken) {
    try {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
      return true;
    } catch (error) {
      console.error('Failed to set refresh token:', error);
      return false;
    }
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearSession() {
    try {
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      return true;
    } catch (error) {
      console.error('Failed to clear session:', error);
      return false;
    }
  }

  isAuthenticated() {
    const token = this.getToken();
    return token && validateJWT(token);
  }

  getSessionInfo() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const payload = parseJWT(token);
    const session = this.getSession();

    return {
      user: session?.user || null,
      roles: payload?.roles || [],
      permissions: payload?.permissions || [],
      expiresAt: payload?.exp * 1000 || null,
      isExpired: isTokenExpired(token)
    };
  }
}

// Password Security
export const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    maxLength: password.length <= 128,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noSpaces: !/\s/.test(password),
    noCommonPatterns: !/(.)\1{2,}/.test(password), // No 3+ repeated chars
    noSequentialNumbers: !/(012|123|234|345|456|567|678|789)/.test(password)
  };

  const isValid = Object.values(requirements).every(Boolean);
  const strength = calculatePasswordStrength(password);

  return {
    isValid,
    strength,
    requirements,
    feedback: getPasswordFeedback(requirements)
  };
};

const calculatePasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (!/(.)\1{2,}/.test(password)) score++; // No repeated chars
  if (!/(012|123|234|345|456|567|678|789)/.test(password)) score++; // No sequential

  if (score <= 3) return 'weak';
  if (score <= 5) return 'medium';
  if (score <= 7) return 'strong';
  return 'very-strong';
};

const getPasswordFeedback = (requirements) => {
  const feedback = [];
  
  if (!requirements.minLength) feedback.push('Password must be at least 8 characters');
  if (!requirements.maxLength) feedback.push('Password must be less than 128 characters');
  if (!requirements.hasUpperCase) feedback.push('Include uppercase letters');
  if (!requirements.hasLowerCase) feedback.push('Include lowercase letters');
  if (!requirements.hasNumbers) feedback.push('Include numbers');
  if (!requirements.hasSpecialChar) feedback.push('Include special characters');
  if (!requirements.noSpaces) feedback.push('Password cannot contain spaces');
  if (!requirements.noCommonPatterns) feedback.push('Avoid repeated characters');
  if (!requirements.noSequentialNumbers) feedback.push('Avoid sequential numbers');

  return feedback;
};

export const generateSecurePassword = (length = 16) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*(),.?":{}|<>';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Role-Based Access Control (RBAC)
export class RBAC {
  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
  }

  defineRole(roleName, permissions = []) {
    this.roles.set(roleName, permissions);
  }

  definePermission(permissionName, description = '') {
    this.permissions.set(permissionName, description);
  }

  assignRoleToUser(userId, role) {
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    this.userRoles.get(userId).add(role);
  }

  removeRoleFromUser(userId, role) {
    if (this.userRoles.has(userId)) {
      this.userRoles.get(userId).delete(role);
    }
  }

  getUserRoles(userId) {
    return Array.from(this.userRoles.get(userId) || []);
  }

  getUserPermissions(userId) {
    const userRoles = this.getUserRoles(userId);
    const permissions = new Set();

    userRoles.forEach(role => {
      const rolePermissions = this.roles.get(role) || [];
      rolePermissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  }

  hasPermission(userId, permission) {
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions.includes(permission);
  }

  hasRole(userId, role) {
    const userRoles = this.getUserRoles(userId);
    return userRoles.includes(role);
  }

  canAccess(userId, requiredPermissions) {
    if (typeof requiredPermissions === 'string') {
      requiredPermissions = [requiredPermissions];
    }

    const userPermissions = this.getUserPermissions(userId);
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }
}

// Authentication State Management
export class AuthStateManager {
  constructor() {
    this.listeners = new Set();
    this.sessionManager = new SessionManager();
    this.rbac = new RBAC();
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        currentUser: this.currentUser,
        isAuthenticated: this.isAuthenticated,
        sessionInfo: this.sessionManager.getSessionInfo()
      });
    });
  }

  async login(credentials) {
    try {
      // This would typically make an API call
      const response = await this.authenticateUser(credentials);
      
      if (response.success) {
        this.sessionManager.setToken(response.token);
        this.sessionManager.setRefreshToken(response.refreshToken);
        this.sessionManager.setSession(response.session);
        
        this.currentUser = response.user;
        this.isAuthenticated = true;
        
        this.notifyListeners();
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async logout() {
    try {
      // Clear session
      this.sessionManager.clearSession();
      
      this.currentUser = null;
      this.isAuthenticated = false;
      
      this.notifyListeners();
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async refreshSession() {
    try {
      const token = this.sessionManager.getRefreshToken();
      if (!token) {
        return { success: false, error: 'No refresh token' };
      }

      const response = await this.refreshAuthToken(token);
      
      if (response.success) {
        this.sessionManager.setToken(response.token);
        this.sessionManager.setRefreshToken(response.refreshToken);
        
        this.notifyListeners();
        return { success: true };
      } else {
        await this.logout();
        return { success: false, error: 'Session expired' };
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      await this.logout();
      return { success: false, error: 'Session refresh failed' };
    }
  }

  // Mock authentication methods - replace with actual API calls
  async authenticateUser(credentials) {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        if (credentials.username === 'admin' && credentials.password === 'password') {
          resolve({
            success: true,
            token: 'mock.jwt.token',
            refreshToken: 'mock.refresh.token',
            session: { user: { id: 1, username: 'admin' } },
            user: { id: 1, username: 'admin', roles: ['admin'] }
          });
        } else {
          resolve({ success: false, error: 'Invalid credentials' });
        }
      }, 1000);
    });
  }

  async refreshAuthToken() {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          token: 'new.mock.jwt.token',
          refreshToken: 'new.mock.refresh.token'
        });
      }, 500);
    });
  }
}

// Create global instances
export const sessionManager = new SessionManager();
export const rbac = new RBAC();
export const authStateManager = new AuthStateManager();

// Initialize default roles and permissions
rbac.definePermission('read', 'Read access to resources');
rbac.definePermission('write', 'Write access to resources');
rbac.definePermission('delete', 'Delete access to resources');
rbac.definePermission('admin', 'Administrative access');

rbac.defineRole('user', ['read']);
rbac.defineRole('moderator', ['read', 'write']);
rbac.defineRole('admin', ['read', 'write', 'delete', 'admin']);
