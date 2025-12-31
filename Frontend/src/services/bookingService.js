// API services for booking flow with real API integration
import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/api';

// Fetch user's vehicles
export const fetchUserVehicles = async (subscriberId) => {
  console.log('Fetching user vehicles for subscriber:', subscriberId);
  
  try {
    // Use the same endpoint as old website
    const response = await apiGet(`/subscriber/vehicles/?subscriber_id=${subscriberId}`);
    return response.data || response;
  } catch (error) {
    console.error('API call failed for user vehicles:', error.message);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Fetch garage services
export const fetchGarageServices = async (payload) => {
  console.log('🔍 Fetching garage services with payload:', payload);
  
  try {
    // Try real API first - using correct endpoint from old website
    console.log('🔍 Attempting API call to /garage/services/ with POST');
    const response = await apiPost('/garage/services/', payload);
    console.log('🔍 API response for garage services:', response);
    
    // Handle response structure from API - match old website structure
    if (response.status === "success") {
      // The API returns data.data array, need to separate services and addons
      const allData = response.data || [];
      const services = allData.filter(item => item.service_type === 'Service');
      const addOns = allData.filter(item => item.service_type === 'Add-On');
      
      console.log('🔍 Separated services:', services);
      console.log('🔍 Separated addOns:', addOns);
      
      return {
        services: services,
        addOns: addOns
      };
    } else {
      console.log('🔍 API returned non-success status:', response.status);
      return {
        services: [],
        addOns: []
      };
    }
  } catch (error) {
    console.warn('🔍 API call failed for garage services:', error.message);
    // Return empty object if API fails
    return {
      services: [],
      addOns: []
    };
  }
};

// Fetch user addresses
export const fetchUserAddresses = async (subscriberId) => {
  console.log('🔍 Fetching user addresses for subscriber:', subscriberId);
  
  try {
    // Try real API first - using correct endpoint from old website
    const response = await apiGet(`/subscriber/addresses/?subscriber_id=${subscriberId}`);
    console.log('🔍 API response for user addresses:', response);
    
    if (response.status) {
      return response.data || [];
    } else {
      return [];
    }
  } catch (error) {
    console.warn('🔍 API call failed for user addresses:', error.message);
    // Return empty array if API fails
    return [];
  }
};

// Create new address
export const createAddress = async (payload) => {
  console.log('🔍 Creating new address with payload:', payload);
  
  try {
    // Try real API first - using correct endpoint from old website
    const response = await apiPost('/subscriber/address/', payload);
    console.log('🔍 API response for address creation:', response);
    
    // Handle different response structures
    if (response.status === "success" || response.success === true) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.message || "Failed to create address"
      };
    }
  } catch (error) {
    console.warn('🔍 API call failed for address creation:', error.message);
    console.warn('🔍 Full error details:', error);
    
    // Try to extract more details from the error
    if (error.response) {
      console.warn('🔍 Error response data:', error.response.data);
      console.warn('🔍 Error response status:', error.response.status);
    }
    
    // Return error response if API fails
    return {
      success: false,
      message: "Failed to create address"
    };
  }
};


// Fetch bike brands
export const fetchBikeBrands = async () => {
  console.log('🔍 Fetching bike brands from /brands/ endpoint');
  
  try {
    // Try real API first - using correct endpoint from old website
    const response = await apiGet('/brands/');
    console.log('🔍 API response for brands:', response);
    return response.data || response;
  } catch (error) {
    console.warn('🔍 API call failed for bike brands:', error.message);
    // Return empty array if API fails
    return [];
  }
};

// Fetch bike models by brand
export const fetchBikeModels = async (brandId) => {
  console.log('🔍 Fetching bike models for brand ID:', brandId);
  
  try {
    // Try real API first - using correct endpoint from old website
    console.log('🔍 Attempting API call to /models/?id=' + brandId);
    const response = await apiGet(`/models/?id=${brandId}`);
    console.log('🔍 API response received:', response);
    return response.data || response;
  } catch (error) {
    console.error('🔍 API call failed for bike models:', error.message);
    throw error; // Re-throw the error to be handled by the component
  }
};


// Fetch cities from landing page API (like old website)
export const fetchCities = async (cityName = 'Pune') => {
  console.log('🔍 Fetching cities from landing page API for city:', cityName);
  
  try {
    // Try real API first - using correct endpoint from old website
    const response = await apiGet(`/active-cities/?city=${cityName.toLowerCase()}`);
    console.log('🔍 API response for cities:', response);
    
    if (response.status === "success" && response.data) {
      return response.data.cities || [];
    } else {
      return [];
    }
  } catch (error) {
    console.warn('🔍 API call failed for cities:', error.message);
    // Return empty array if API fails
    return [];
  }
};

// Create user vehicle
export const createUserVehicle = async (payload) => {
  console.log('🔍 Creating user vehicle with payload:', payload);
  
  try {
    // Use the same endpoint as old website
    const response = await apiPost('/subscriber/vehicle/', payload);
    console.log('🔍 API response for vehicle creation:', response);
    return response;
  } catch (error) {
    console.error('🔍 API call failed for vehicle creation:', error.message);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Delete user vehicle
export const deleteUserVehicle = async (payload) => {
  console.log('🔍 Deleting user vehicle with payload:', payload);
  
  try {
    // Use DELETE method - backend only needs the ID in query parameter
    const vehicleId = payload.vehicleid;
    
    // Ensure vehicleId is a valid number
    if (!vehicleId || (isNaN(vehicleId) && isNaN(parseInt(vehicleId)))) {
      throw new Error('Invalid vehicle ID');
    }
    
    // DELETE method with ID in query parameter (backend accepts both path and query param)
    const response = await apiDelete(`/subscriber/vehicle/?id=${vehicleId}`);
    console.log('🔍 API response for vehicle deletion:', response);
    return response;
  } catch (error) {
    console.error('🔍 API call failed for vehicle deletion:', error.message);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Create booking (same as old website)
export const createBooking = async (payload) => {
  console.log('🔍 Creating booking with payload:', payload);
  
  try {
    // Use the same endpoint as old website
    const response = await apiPost('/subscriber/booking/', payload);
    console.log('🔍 API response for booking creation:', response);
    
    // Handle different response structures
    if (response.status === "success" || response.status === true || response.success === true) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.message || "Failed to create booking"
      };
    }
  } catch (error) {
    console.error('🔍 API call failed for booking creation:', error.message);
    console.error('🔍 Full error details:', error);
    
    // Try to extract more details from the error
    if (error.response) {
      console.error('🔍 Error response data:', error.response.data);
      console.error('🔍 Error response status:', error.response.status);
      console.error('🔍 Error response headers:', error.response.headers);
    }
    
    // Also log the original request details
    console.error('🔍 Original payload that failed:', payload);
    
    throw error; // Re-throw the error to be handled by the component
  }
};

// Fetch subscriber profile
export const fetchSubscriberProfile = async (subscriberId) => {
  console.log('🔍 Fetching subscriber profile for subscriber:', subscriberId);
  
  try {
    const response = await apiGet(`/subscriber/profile/?subscriber_id=${subscriberId}`);
    console.log('🔍 API response for subscriber profile:', response);
    
    if (response.status === true || response.status === "success") {
      return response.data || {};
    } else {
      return {};
    }
  } catch (error) {
    console.warn('🔍 API call failed for subscriber profile:', error.message);
    return {};
  }
};

// Update subscriber profile
export const updateSubscriberProfile = async (payload) => {
  console.log('🔍 Updating subscriber profile with payload:', payload);
  
  try {
    const response = await apiPatch('/subscriber/profile/', payload);
    console.log('🔍 API response for profile update:', response);
    
    if (response.status === true || response.status === "success") {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.message || "Failed to update profile"
      };
    }
  } catch (error) {
    console.error('🔍 API call failed for profile update:', error.message);
    throw error;
  }
};

// Fetch user bookings
export const fetchUserBookings = async (subscriberId) => {
  console.log('🔍 Fetching user bookings for subscriber:', subscriberId);
  
  try {
    const response = await apiGet(`/subscriber/booking/?subscriber_id=${subscriberId}`);
    console.log('🔍 API response for user bookings:', response);
    
    if (response.status === true || response.status === "success") {
      return response.data || [];
    } else {
      return [];
    }
  } catch (error) {
    console.warn('🔍 API call failed for user bookings:', error.message);
    return [];
  }
};

// Fetch single booking by ID
export const fetchBookingDetails = async (bookingId) => {
  console.log('🔍 Fetching booking details for booking:', bookingId);
  
  try {
    const response = await apiGet(`/subscriber/booking/?booking_id=${bookingId}`);
    console.log('🔍 API response for booking details:', response);
    
    if (response.status === true || response.status === "success") {
      return response.data || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error('🔍 API call failed for booking details:', error.message);
    return null;
  }
};

// Cancel booking
export const cancelBooking = async (bookingId) => {
  console.log('🔍 Cancelling booking:', bookingId);
  
  try {
    const response = await apiDelete(`/subscriber/booking/?booking_id=${bookingId}`);
    console.log('🔍 API response for booking cancellation:', response);
    
    if (response.status === true || response.status === "success") {
      return {
        success: true,
        message: response.message || "Booking cancelled successfully"
      };
    } else {
      return {
        success: false,
        message: response.message || "Failed to cancel booking"
      };
    }
  } catch (error) {
    console.error('🔍 API call failed for booking cancellation:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to cancel booking"
    };
  }
};
