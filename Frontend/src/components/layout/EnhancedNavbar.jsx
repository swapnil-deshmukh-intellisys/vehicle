import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  MapPinIcon, 
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { SunIcon as SunIconSolid, MoonIcon as MoonIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const EnhancedNavbar = ({ 
  selectedCity, 
  onCityChange, 
  isDetectingLocation = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, logout, user } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navbarClasses = `
    sticky top-0 z-50 transition-all duration-300
    ${isScrolled 
      ? theme === 'light' 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-700'
      : theme === 'light'
        ? 'bg-white border-b border-gray-200'
        : 'bg-gray-900 border-b border-gray-700'
    }
  `;

  return (
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleNavigation('/')}
            >
              <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                ServX
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`
                  px-3 py-2 text-sm font-medium transition-colors duration-200
                  ${isActivePath(item.path)
                    ? theme === 'light'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-blue-400 border-b-2 border-blue-400'
                    : theme === 'light'
                      ? 'text-gray-700 hover:text-blue-600'
                      : 'text-gray-300 hover:text-blue-400'
                  }
                `}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* City Selector */}
            <div className="flex items-center space-x-2">
              <MapPinIcon className={`h-4 w-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
              <select
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                className={`text-sm font-medium bg-transparent border-none focus:outline-none cursor-pointer
                  ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}
                `}
                disabled={isDetectingLocation}
              >
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
              </select>
              {isDetectingLocation && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={`
                  w-48 lg:w-64 pl-10 pr-4 py-2 text-sm rounded-full border transition-all duration-200
                  ${theme === 'light'
                    ? 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-500'
                    : 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:bg-gray-700 focus:border-blue-400'
                  }
                `}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors duration-200
                ${theme === 'light'
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-400 hover:bg-gray-800'
                }
              `}
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIconSolid className="h-5 w-5" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`p-2 rounded-full transition-colors duration-200 flex items-center space-x-2
                  ${theme === 'light'
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-gray-400 hover:bg-gray-800'
                  }
                `}
              >
                <UserIcon className="h-5 w-5" />
                {isLoggedIn && (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className={`
                  absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50
                  ${theme === 'light'
                    ? 'bg-white ring-1 ring-black ring-opacity-5'
                    : 'bg-gray-800 ring-1 ring-white ring-opacity-10'
                  }
                `}>
                  {isLoggedIn ? (
                    <>
                      <div className={`px-4 py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        {user?.name || 'User'}
                      </div>
                      <button
                        onClick={() => { handleNavigation('/profile'); setShowUserDropdown(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10
                          ${theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-700'
                          }
                        `}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => { handleNavigation('/bookings'); setShowUserDropdown(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10
                          ${theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-700'
                          }
                        `}
                      >
                        My Bookings
                      </button>
                      <hr className={`my-1 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`} />
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10
                          ${theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-700'
                          }
                        `}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { handleNavigation('/login'); setShowUserDropdown(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10
                          ${theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-700'
                          }
                        `}
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => { handleNavigation('/register'); setShowUserDropdown(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10
                          ${theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-700'
                          }
                        `}
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md transition-colors duration-200
                ${theme === 'light'
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-400 hover:bg-gray-800'
                }
              `}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className={`
            md:hidden transition-all duration-300
            ${theme === 'light' ? 'bg-white border-t border-gray-200' : 'bg-gray-900 border-t border-gray-700'}
          `}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Navigation */}
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors duration-200
                    ${isActivePath(item.path)
                      ? theme === 'light'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-blue-400 bg-blue-900/20'
                      : theme === 'light'
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  {item.name}
                </button>
              ))}

              {/* Mobile City Selector */}
              <div className="px-3 py-2">
                <div className="flex items-center space-x-2">
                  <MapPinIcon className={`h-4 w-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <select
                    value={selectedCity}
                    onChange={(e) => onCityChange(e.target.value)}
                    className={`text-sm font-medium bg-transparent border-none focus:outline-none cursor-pointer
                      ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}
                    `}
                    disabled={isDetectingLocation}
                  >
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bangalore">Bangalore</option>
                  </select>
                </div>
              </div>

              {/* Mobile Search */}
              <div className="px-3 py-2">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className={`
                      w-full pl-10 pr-4 py-2 text-sm rounded-full border
                      ${theme === 'light'
                        ? 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                        : 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                      }
                    `}
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </form>
              </div>

              {/* Mobile User Actions */}
              <div className="px-3 py-2 border-t border-gray-200">
                {isLoggedIn ? (
                  <>
                    <div className={`px-3 py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      {user?.name || 'User'}
                    </div>
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md
                        ${theme === 'light'
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-300 hover:bg-gray-800'
                        }
                      `}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleNavigation('/bookings')}
                      className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md
                        ${theme === 'light'
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-300 hover:bg-gray-800'
                        }
                      `}
                    >
                      My Bookings
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md
                        ${theme === 'light'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-red-400 hover:bg-red-900/20'
                        }
                      `}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleNavigation('/login')}
                      className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md
                        ${theme === 'light'
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-300 hover:bg-gray-800'
                        }
                      `}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleNavigation('/register')}
                      className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md
                        ${theme === 'light'
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-300 hover:bg-gray-800'
                        }
                      `}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default EnhancedNavbar;
