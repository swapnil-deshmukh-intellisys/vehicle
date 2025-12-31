import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { getCityFromCoordinates, getCurrentLocation, storeLocationData } from '../../utils/geolocation';

const PageLayout = ({ children }) => {
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

  // Geolocation setup
  useEffect(() => {
    // Check if we already have location data
    if (sessionStorage.getItem("latitude") && sessionStorage.getItem("longitude")) {
      console.log("📍 Using existing location data");
      return;
    }

    // Simple geolocation approach
    const initializeLocation = async () => {
      setIsDetectingLocation(true);
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

  const handleCityChange = (city) => {
    setSelectedCity(city);
    sessionStorage.setItem("selectedCity", city);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-full">
      <Header 
        selectedCity={selectedCity} 
        onCityChange={handleCityChange}
        isDetectingLocation={isDetectingLocation}
      />
      <main className="flex-1 overflow-x-hidden w-full max-w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;

