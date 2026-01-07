// Geolocation utility functions - Enhanced with caching and error handling
import { getCacheWithTTL, setCacheWithTTL } from './cacheUtils.js';

// Location cache key
const LOCATION_CACHE_KEY = 'user_location';
const LOCATION_CACHE_TTL = 300000; // 5 minutes

// Enhanced error messages
const GEOLOCATION_ERRORS = {
  PERMISSION_DENIED: 'Location access denied. Please enable location services.',
  POSITION_UNAVAILABLE: 'Location information is unavailable.',
  TIMEOUT: 'Location request timed out. Please try again.',
  NOT_SUPPORTED: 'Geolocation is not supported by this browser.',
  NETWORK_ERROR: 'Network error occurred while getting location.'
};

// Get cached location
export const getCachedLocation = () => {
  return getCacheWithTTL(LOCATION_CACHE_KEY);
};

// Set cached location
export const setCachedLocation = (location) => {
  setCacheWithTTL(LOCATION_CACHE_KEY, location, LOCATION_CACHE_TTL);
};

// Enhanced getCurrentLocation with caching and better error handling
export const getCurrentLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cachedLocation = getCachedLocation();
    if (cachedLocation && !options.forceRefresh) {
      resolve(cachedLocation);
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error(GEOLOCATION_ERRORS.NOT_SUPPORTED));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000 // 1 minute
    };

    const finalOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
        const location = { 
          latitude, 
          longitude, 
          accuracy, 
          altitude, 
          altitudeAccuracy, 
          heading, 
          speed,
          timestamp: position.timestamp
        };
        
        // Cache the location
        setCachedLocation(location);
        
        resolve(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
        const errorMessage = GEOLOCATION_ERRORS[error.code] || GEOLOCATION_ERRORS.NETWORK_ERROR;
        reject(new Error(errorMessage));
      },
      finalOptions
    );
  });
};

// Watch location changes
export const watchLocation = (callback, options = {}) => {
  if (!navigator.geolocation) {
    throw new Error(GEOLOCATION_ERRORS.NOT_SUPPORTED);
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 5000 // 5 seconds for watching
  };

  const finalOptions = { ...defaultOptions, ...options };

  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
      const location = { 
        latitude, 
        longitude, 
        accuracy, 
        altitude, 
        altitudeAccuracy, 
        heading, 
        speed,
        timestamp: position.timestamp
      };
      
      // Cache the latest location
      setCachedLocation(location);
      
      callback(null, location);
    },
    (error) => {
      console.error('Location watch error:', error);
      const errorMessage = GEOLOCATION_ERRORS[error.code] || GEOLOCATION_ERRORS.NETWORK_ERROR;
      callback(new Error(errorMessage));
    },
    finalOptions
  );
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Check if user is within a certain radius
export const isWithinRadius = (userLat, userLon, targetLat, targetLon, radiusKm) => {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusKm;
};

// Simple city detection using Haversine distance calculation (from old website)
export const getCityFromCoordinates = async (latitude, longitude) => {
  try {
    // Use the same approach as old website - find nearest city
    const citiesWithCoords = [
      { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
      { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
      { name: "Pune", lat: 18.5204, lon: 73.8567 },
      { name: "Delhi", lat: 28.7041, lon: 77.1025 },
      { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
      { name: "Chennai", lat: 13.0827, lon: 80.2707 },
      { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
      { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
      { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 }
    ];

    let nearestCity = null;
    let minDistance = Infinity;

    citiesWithCoords.forEach(city => {
      const dist = calculateDistance(latitude, longitude, city.lat, city.lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestCity = city.name;
      }
    });

    console.log("Nearest city:", nearestCity, "Distance:", minDistance.toFixed(2), "km");

    return {
      city: nearestCity,
      state: getStateFromCity(nearestCity),
      country: 'India',
      fullAddress: nearestCity
    };
  } catch (error) {
    console.error('City detection error:', error);
    // Fallback to Pune if detection fails
    return {
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      fullAddress: 'Pune'
    };
  }
};

// Haversine distance calculation (from old website)
function GET_DISTANCE_FROM_LAT_LON_IN_KM(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const getStateFromCity = (cityName) => {
  const cityStateMap = {
    'Mumbai': 'Maharashtra',
    'Delhi': 'NCR',
    'Bangalore': 'Karnataka',
    'Chennai': 'Tamil Nadu',
    'Pune': 'Maharashtra',
    'Hyderabad': 'Telangana',
    'Kolkata': 'West Bengal',
    'Ahmedabad': 'Gujarat',
    'Nagpur': 'Maharashtra'
  };
  return cityStateMap[cityName] || 'Unknown';
};

// Store location data in session storage (simplified approach)
export const storeLocationData = (latitude, longitude, cityData) => {
  sessionStorage.setItem('latitude', latitude.toString());
  sessionStorage.setItem('longitude', longitude.toString());
  sessionStorage.setItem('selectedCity', cityData.city);
  sessionStorage.setItem('locationData', JSON.stringify(cityData));
};

// Get stored location data
export const getStoredLocationData = () => {
  const latitude = sessionStorage.getItem('latitude');
  const longitude = sessionStorage.getItem('longitude');
  const selectedCity = sessionStorage.getItem('selectedCity');
  const locationData = sessionStorage.getItem('locationData');

  return {
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    selectedCity,
    locationData: locationData ? JSON.parse(locationData) : null
  };
};

// Check if location data is available
export const hasLocationData = () => {
  const { latitude, longitude } = getStoredLocationData();
  return latitude !== null && longitude !== null;
};

// Simple location initialization (based on old website approach)
export const initializeLocation = async () => {
  try {
    // Check if coordinates are already stored
    const storedLat = sessionStorage.getItem("latitude");
    const storedLng = sessionStorage.getItem("longitude");

    if (storedLat && storedLng) {
      console.log("📍 Using stored location:", storedLat, storedLng);
      return { latitude: parseFloat(storedLat), longitude: parseFloat(storedLng) };
    }

    // Get current location
    const { latitude, longitude } = await getCurrentLocation();
    
    // Store coordinates
    sessionStorage.setItem("latitude", latitude.toString());
    sessionStorage.setItem("longitude", longitude.toString());
    
    console.log("📍 Latitude:", latitude);
    console.log("📍 Longitude:", longitude);
    
    return { latitude, longitude };
  } catch (error) {
    console.error("📍 Geolocation failed:", error);
    
    // Set fallback coordinates (Pune)
    const fallbackLat = 18.5204;
    const fallbackLng = 73.8567;
    sessionStorage.setItem("latitude", fallbackLat.toString());
    sessionStorage.setItem("longitude", fallbackLng.toString());
    sessionStorage.setItem("selectedCity", "Pune");
    
    console.log("📍 Using fallback location: Pune");
    return { latitude: fallbackLat, longitude: fallbackLng };
  }
};

