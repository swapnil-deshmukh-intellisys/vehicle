import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import LoginPopup from '../components/common/LoginPopup';
import { useTheme } from '../components/context/ThemeContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [selectedCity, setSelectedCity] = useState(sessionStorage.getItem('selectedCity') || 'Pune');
  const [showLoginPopup, setShowLoginPopup] = useState(true);
  
  // Get returnTo path from location state or default to profile
  const returnTo = location.state?.returnTo || '/profile';

  const handleLoginSuccess = () => {
    // Navigate to the returnTo path or profile if not specified
    navigate(returnTo);
  };

  const handleClose = () => {
    // If there's a returnTo, go there, otherwise go home
    if (returnTo && returnTo !== '/profile') {
      navigate(returnTo);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'}`}>
      <Header 
        selectedCity={selectedCity} 
        onCityChange={setSelectedCity}
      />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoginPopup
          isOpen={showLoginPopup}
          onClose={handleClose}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>

      <Footer />
    </div>
  );
};

export default Login;

