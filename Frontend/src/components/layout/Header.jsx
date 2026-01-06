import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ServXLogo from '../../assets/ServXLogo-removebg-preview.png';
import { ChevronDownIcon, MagnifyingGlassIcon, UserIcon, MapPinIcon, ArrowRightOnRectangleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import CitySelectionPopup from '../common/CitySelectionPopup';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const Header = ({ selectedCity, onCityChange, isDetectingLocation }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCityPopupOpen, setIsCityPopupOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Theme and Auth
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, logout } = useAuth();

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close logout confirmation when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLogoutConfirm && !event.target.closest('.logout-confirm-modal')) {
        setShowLogoutConfirm(false);
      }
    };

    if (showLogoutConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutConfirm]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/');
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for storage changes (city selection)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "selectedCity") {
        onCityChange(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [onCityChange]);

  // Poll session storage every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const cityFromStorage = sessionStorage.getItem("selectedCity");
      if (cityFromStorage !== selectedCity) {
        // Convert localities to main cities
        let correctedCity = cityFromStorage;
        if (cityFromStorage === "Mulshi" || cityFromStorage === "Hinjewadi" || cityFromStorage === "Wakad" || cityFromStorage === "Baner") {
          correctedCity = "Pune";
          sessionStorage.setItem("selectedCity", "Pune");
        }
        onCityChange(correctedCity);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedCity, onCityChange]);

  const handleCitySelect = (cityName) => {
    sessionStorage.setItem("selectedCity", cityName);
    onCityChange(cityName);
    setIsCityPopupOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <header className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-black border-gray-800'} shadow-lg border-b fixed w-full top-0 z-50 mobile-menu-container overflow-x-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16">
          {/* Left Group: Logo + Search Bar */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex flex-col items-center">
              <img
                src={ServXLogo}
                alt="ServX24 logo"
                className="h-6 md:h-6 sm:h-6 w-auto cursor-pointer"
                onClick={handleHomeClick}
              />
              <div className={`${theme === 'light' ? 'text-gray-800' : 'text-white'} text-xs md:text-sm sm:text-xs font-medium mt-1 cursor-pointer text-center`}>
                Search.Compare.Book
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex w-60 lg:w-80">
              <div className="relative w-full">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search for garages, services..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-600 text-sm ${theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-800 text-white border-gray-700'}`}
                />
              </div>
            </div>
          </div>

          {/* Right Group: Navigation + City Selection + Login */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <button 
                onClick={handleHomeClick}
                className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} transition-colors duration-200 font-medium text-sm lg:text-base ${location.pathname === '/' ? 'text-red-600' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => navigate('/about')}
                className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} transition-colors duration-200 font-medium text-sm lg:text-base ${location.pathname === '/about' ? 'text-red-600' : ''}`}
              >
                About
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} transition-colors duration-200 font-medium text-sm lg:text-base ${location.pathname === '/contact' ? 'text-red-600' : ''}`}
              >
                Contact
              </button>
            </div>

            {/* City Selection */}
            <div className="hidden md:flex">
              <button
                onClick={() => setIsCityPopupOpen(true)}
                disabled={isDetectingLocation}
                className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              >
                <MapPinIcon className="w-3 h-3 lg:w-4 lg:h-4" style={{ background: 'linear-gradient(135deg, #ff3864, #cc1e3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                <span className="hidden lg:inline">
                  {isDetectingLocation ? 'Detecting...' : (selectedCity || 'Select City')}
                </span>
                <span className="lg:hidden">
                  {isDetectingLocation ? '...' : (selectedCity || 'City')}
                </span>
                {isDetectingLocation ? (
                  <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-b-2" style={{ borderColor: '#ff3864', borderTopColor: '#cc1e3a' }}></div>
                ) : (
                  <ChevronDownIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                )}
              </button>
            </div>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/profile')}
                  className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} transition-colors duration-200`}
                  title="Profile"
                >
                  <UserIcon className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleLogout}
                  className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} transition-colors duration-200`}
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm lg:text-base"
              >
                Sign In
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} p-2 rounded-md transition-colors`}
              title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} p-2 transition-colors`}
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className={`fixed inset-0 z-[60] md:hidden ${theme === 'light' ? 'bg-white' : 'bg-black'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="h-full w-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-4 py-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
              <div className="flex items-center space-x-3">
                <img
                  src={ServXLogo}
                  alt="ServX24 logo"
                  className="h-6 w-auto cursor-pointer"
                  onClick={() => {
                    handleHomeClick();
                    setIsMobileMenuOpen(false);
                  }}
                />
                <span className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} text-sm font-semibold`}>Menu</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${theme === 'light' ? 'text-gray-900 hover:text-red-600' : 'text-white hover:text-red-500'} p-2 transition-colors`}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-4 pt-4">
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search for garages, services..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-600 ${theme === 'light' ? 'bg-gray-50 text-gray-900 border-gray-200' : 'bg-gray-900 text-white border-gray-800'}`}
                />
              </div>
            </div>

            <div className="px-4 py-6 space-y-3 overflow-y-auto flex-1 min-h-0">
              <button
                onClick={() => handleMobileNavClick('/')}
                className={`w-full text-left px-4 py-4 rounded-2xl border transition-colors ${theme === 'light' ? 'border-gray-200 text-gray-900 hover:bg-gray-50' : 'border-gray-800 text-white hover:bg-gray-900'}`}
              >
                <span className="text-lg font-semibold">Home</span>
              </button>
              <button
                onClick={() => handleMobileNavClick('/about')}
                className={`w-full text-left px-4 py-4 rounded-2xl border transition-colors ${theme === 'light' ? 'border-gray-200 text-gray-900 hover:bg-gray-50' : 'border-gray-800 text-white hover:bg-gray-900'}`}
              >
                <span className="text-lg font-semibold">About</span>
              </button>
              <button
                onClick={() => handleMobileNavClick('/contact')}
                className={`w-full text-left px-4 py-4 rounded-2xl border transition-colors ${theme === 'light' ? 'border-gray-200 text-gray-900 hover:bg-gray-50' : 'border-gray-800 text-white hover:bg-gray-900'}`}
              >
                <span className="text-lg font-semibold">Contact</span>
              </button>

              <div className={`mt-4 rounded-2xl border ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800 bg-gray-900'}`}>
                <div className="px-4 pt-4 pb-2">
                  <div className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Location</div>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => {
                      setIsCityPopupOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors duration-200 ${theme === 'light' ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200' : 'bg-black hover:bg-gray-800 text-white border-gray-800'}`}
                  >
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-4 h-4 text-red-500" />
                      <span className="font-medium">{selectedCity || 'Select City'}</span>
                    </div>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl border ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800 bg-gray-900'}`}>
                <div className="px-4 pt-4 pb-2">
                  <div className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Account</div>
                </div>
                <div className="px-4 pb-4">
                  {isLoggedIn ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center w-full text-left px-4 py-3 rounded-xl border transition-colors ${theme === 'light' ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200' : 'bg-black hover:bg-gray-800 text-white border-gray-800'}`}
                      >
                        <UserIcon className="w-5 h-5 mr-3" />
                        <span className="font-semibold">Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className={`flex items-center w-full text-left px-4 py-3 rounded-xl border transition-colors ${theme === 'light' ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200' : 'bg-black hover:bg-gray-800 text-white border-gray-800'}`}
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                        <span className="font-semibold">Logout</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-colors duration-200 font-semibold"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className={`w-full text-left px-4 py-4 rounded-2xl border transition-colors ${theme === 'light' ? 'border-gray-200 text-gray-900 hover:bg-gray-50' : 'border-gray-800 text-white hover:bg-gray-900'}`}
              >
                <span className="text-lg font-semibold">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-16"></div>

      {/* City Selection Popup */}
      <CitySelectionPopup
        isOpen={isCityPopupOpen}
        onClose={() => setIsCityPopupOpen(false)}
        onCitySelect={handleCitySelect}
        selectedCity={selectedCity}
      />

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className={`logout-confirm-modal ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-xl max-w-md w-full mx-4 p-6`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Confirm Logout
                </h3>
                <div className="mt-2">
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                    Are you sure you want to logout? You will need to sign in again to access your profile and bookings.
                  </p>
                </div>
              </div>
              <button
                onClick={cancelLogout}
                className={`ml-4 flex-shrink-0 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'light' 
                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;

