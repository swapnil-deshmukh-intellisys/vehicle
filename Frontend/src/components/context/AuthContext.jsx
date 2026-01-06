/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  isAuthenticated, 
  getSubscriberId, 
  getBusinessId, 
  initializeSession,
  clearAuthData 
} from '../../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscriberId, setSubscriberId] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session and check auth status
  useEffect(() => {
    // Initialize session management
    const cleanup = initializeSession();
    
    // Check authentication status
    checkAuthStatus();
    
    // Listen for authentication state changes
    const handleAuthStateChange = (e) => {
      console.log('🔍 AuthContext: Auth state changed:', e.detail);
      checkAuthStatus();
    };

    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    return () => {
      cleanup();
      window.removeEventListener('authStateChanged', handleAuthStateChange);
    };
  }, []);

  const checkAuthStatus = () => {
    const authenticated = isAuthenticated();
    const subId = getSubscriberId();
    const busId = getBusinessId();
    
    setIsLoggedIn(authenticated);
    setSubscriberId(subId);
    setBusinessId(busId);
    setIsLoading(false);
  };

  const logout = () => {
    clearAuthData();
    checkAuthStatus();
  };

  const value = {
    isLoggedIn,
    subscriberId,
    businessId,
    isLoading,
    checkAuthStatus,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

