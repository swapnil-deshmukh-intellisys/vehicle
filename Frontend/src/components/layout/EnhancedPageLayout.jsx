import React, { useState, useEffect, useRef } from 'react';
import EnhancedNavbar from './EnhancedNavbar';
import EnhancedFooter from './EnhancedFooter';
import { getCityFromCoordinates, getCurrentLocation, storeLocationData } from '../../utils/geolocation';
import { useTheme } from '../context/ThemeContext';

const EnhancedPageLayout = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(() => {
    const city = sessionStorage.getItem("selectedCity") || "Pune";
    // Convert localities to main cities
    if (city === "Mulshi" || city === "Hinjewadi" || city === "Wakad" || city === "Baner") {
      sessionStorage.setItem("selectedCity", "Pune");
      return "Pune";
    }
    return city;
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme } = useTheme();
  const layoutRef = useRef(null);

  // Geolocation setup
  useEffect(() => {
    // Check if we already have location data
    if (sessionStorage.getItem("latitude") && sessionStorage.getItem("longitude")) {
      console.log("📍 Using existing location data");
      setIsLoading(false);
      return;
    }

    // Simple geolocation approach
    const initializeLocation = async () => {
      setIsDetectingLocation(true);
      setIsLoading(true);
      try {
        console.log("📍 Attempting to get current location...");
        const { latitude, longitude } = await getCurrentLocation();
        
        console.log("📍 Coordinates obtained:", { latitude, longitude });
        
        // Get city information from coordinates
        const cityData = await getCityFromCoordinates(latitude, longitude);
        console.log("📍 City data:", cityData);
        
        // Store location data with city information
        storeLocationData(latitude, longitude, cityData);
        
        // Update selected city if we got a valid city
        if (cityData.city) {
          setSelectedCity(cityData.city);
          console.log("📍 Updated selected city to:", cityData.city);
        }
      } catch (error) {
        console.error("📍 Geolocation failed:", error);
        
        // Set fallback coordinates (Pune)
        const fallbackLat = 18.5204;
        const fallbackLng = 73.8567;
        sessionStorage.setItem("latitude", fallbackLat.toString());
        sessionStorage.setItem("longitude", fallbackLng.toString());
        sessionStorage.setItem("selectedCity", "Pune");
        
        console.log("📍 Using fallback location: Pune");
      } finally {
        setIsDetectingLocation(false);
        setIsLoading(false);
      }
    };

    initializeLocation();
  }, []);

  // Session storage management
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "selectedCity") {
        setSelectedCity(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const cityFromStorage = sessionStorage.getItem("selectedCity");
      if (cityFromStorage !== selectedCity) {
        setSelectedCity(cityFromStorage);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedCity]);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    sessionStorage.setItem("selectedCity", city);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className={`
        min-h-screen flex items-center justify-center
        ${theme === 'light' ? 'bg-white' : 'bg-black'}
      `}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className={`text-lg ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {isDetectingLocation ? 'Detecting your location...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={layoutRef}
      className={`
        min-h-screen flex flex-col overflow-x-hidden w-full max-w-full
        ${theme === 'light' ? 'bg-white' : 'bg-black'}
      `}
    >
      {/* Scroll Progress Bar */}
      <div 
        className={`
          fixed top-0 left-0 h-1 z-50 transition-all duration-150
          ${theme === 'light' ? 'bg-blue-600' : 'bg-blue-500'}
        `}
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Skip to main content for accessibility */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Enhanced Navbar */}
      <EnhancedNavbar 
        selectedCity={selectedCity} 
        onCityChange={handleCityChange}
        isDetectingLocation={isDetectingLocation}
      />

      {/* Main Content */}
      <main 
        id="main-content"
        className="flex-1 overflow-x-hidden w-full max-w-full"
        role="main"
      >
        {/* Page transitions and animations could be added here */}
        <div className="animate-fadeIn">
          {children}
        </div>
      </main>

      {/* Enhanced Footer */}
      <EnhancedFooter />

      {/* Back to top button */}
      {scrollProgress > 20 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`
            fixed bottom-6 right-6 p-3 rounded-full shadow-lg transition-all duration-200 z-40
            ${theme === 'light'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-500 text-white hover:bg-blue-600'
            }
          `}
          aria-label="Back to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnhancedPageLayout;
