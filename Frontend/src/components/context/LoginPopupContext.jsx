/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPopup from '../common/LoginPopup';

const LoginPopupContext = createContext(null);

export const LoginPopupProvider = ({ children }) => {
  const navigate = useNavigate();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [returnTo, setReturnTo] = useState(null);

  const showLogin = (garageId = null, returnPath = null) => {
    setReturnTo(returnPath || (garageId ? `/booking?garageId=${garageId}` : '/profile'));
    setShowLoginPopup(true);
  };

  const hideLogin = () => {
    setShowLoginPopup(false);
    setReturnTo(null);
  };

  const handleLoginSuccess = () => {
    hideLogin();
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/profile');
    }
  };

  const value = {
    showLogin,
    hideLogin,
    isOpen: showLoginPopup
  };

  return (
    <LoginPopupContext.Provider value={value}>
      {children}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={hideLogin}
        onLoginSuccess={handleLoginSuccess}
      />
    </LoginPopupContext.Provider>
  );
};

export const useLoginPopup = () => {
  const context = useContext(LoginPopupContext);
  if (!context) {
    throw new Error('useLoginPopup must be used within a LoginPopupProvider');
  }
  return context;
};

