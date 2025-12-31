import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  UserIcon, 
  PencilIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  HomeIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { fetchUserVehicles, fetchUserAddresses, createAddress, deleteUserVehicle, fetchCities, fetchSubscriberProfile, updateSubscriberProfile, fetchUserBookings, cancelBooking } from '../services/bookingService';
import { getSubscriberId, getBusinessId } from '../services/authService';
import { fetchLandingPageData } from '../services/landingpage';
import AddVehicleModal from '../components/profileComponents/AddVehicleModal';
import AddAddressModal from '../components/profileComponents/AddAddressModal';
import { useTheme } from '../components/context/ThemeContext';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    joinDate: ''
  });
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    joinDate: ''
  });
  
  // Real data from API
  const [vehicles, setVehicles] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const dataLoadedRef = useRef(false);

  // Initialize edit data when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditData({ ...userData });
    }
  }, [isEditing, userData]);

  // Check location state for active tab when component mounts or location changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the location state to prevent re-triggering on subsequent navigations
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load user data from APIs (matching old website implementation)
  useEffect(() => {
    const loadUserData = async () => {
      // Don't reload if data has already been loaded (prevents re-authentication check on navigation)
      if (dataLoadedRef.current) {
        return;
      }
      
      setLoading(true);
      try {
        const subscriberId = getSubscriberId();
        const businessId = getBusinessId();
        
        if (!subscriberId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        // Get selected city from sessionStorage (like old website)
        const selectedCity = sessionStorage.getItem('selectedCity') || 'Pune';

        // Load user vehicles, addresses, and bookings in parallel
        const [vehiclesData, addressesData, bookingsData] = await Promise.all([
          fetchUserVehicles(subscriberId),
          fetchUserAddresses(subscriberId),
          fetchUserBookings(subscriberId)
        ]);

        // Load cities from landing page API (like old website)
        try {
          // Ensure selectedCity is valid (handle null, undefined, or string "null")
          const validCity = (selectedCity && selectedCity !== 'null' && selectedCity.trim() !== '') 
            ? selectedCity 
            : 'Pune';
          const landingPageData = await fetchLandingPageData(validCity.toLowerCase());
          if (landingPageData && Array.isArray(landingPageData.cities) && landingPageData.cities.length > 0) {
            setCities(landingPageData.cities);
          } else {
            // Fallback to active-cities API if landing page doesn't have cities
            const citiesData = await fetchCities(selectedCity);
            setCities(citiesData || []);
          }
        } catch (cityError) {
          console.error('Error loading cities:', cityError);
          // Try fallback API
          try {
            const citiesData = await fetchCities(selectedCity);
            setCities(citiesData || []);
          } catch (fallbackError) {
            console.error('Fallback cities API also failed:', fallbackError);
            setCities([]);
          }
        }

        // Fetch subscriber profile data from API
        try {
          const profileData = await fetchSubscriberProfile(subscriberId);
          const mobileNumber = localStorage.getItem('mobileNumber') || profileData.phone || '';
          
          setUserData({
            name: profileData.name || 'User',
            email: profileData.email || '',
            phone: mobileNumber,
            city: selectedCity,
            joinDate: 'Recently'
          });
        } catch (profileError) {
          console.error('Error loading profile data:', profileError);
          // Fallback to localStorage data
          const mobileNumber = localStorage.getItem('mobileNumber') || '';
          setUserData({
            name: 'User',
            email: '',
            phone: mobileNumber,
            city: selectedCity,
            joinDate: 'Recently'
          });
        }

        setVehicles(vehiclesData || []);
        setAddresses(addressesData || []);
        setBookings(bookingsData || []);
        
        // Mark data as loaded
        dataLoadedRef.current = true;
        
        // Debug: Log booking data structure
        if (bookingsData && bookingsData.length > 0) {
          console.log('🔍 Booking data structure:', bookingsData[0]);
          console.log('🔍 Available booking fields:', Object.keys(bookingsData[0]));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []); // Only run once on mount

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const subscriberId = getSubscriberId();
      const businessId = getBusinessId();
      
      if (!subscriberId || !businessId) {
        setError('User not authenticated');
        return;
      }

      // Update profile via API
      const payload = {
        subscriber_id: parseInt(subscriberId),
        name: editData.name,
        email: editData.email
      };

      const response = await updateSubscriberProfile(payload);
      
      if (response.success) {
        // Update local state
        setUserData({ ...editData });
        setIsEditing(false);
        setError('');
        
        // Store mobile number in localStorage for future reference
        if (editData.phone) {
          localStorage.setItem('mobileNumber', editData.phone);
        }
        
        // Update city in sessionStorage
        if (editData.city) {
          sessionStorage.setItem('selectedCity', editData.city);
        }
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      const subscriberId = getSubscriberId();
      const businessId = getBusinessId();
      
      if (!subscriberId || !businessId) {
        setError('User not authenticated');
        return;
      }

      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        setError('Vehicle not found');
        return;
      }

      // Get model ID - check multiple possible fields
      const modelId = vehicle.model?.id || vehicle.model_id || vehicle.model;
      
      if (!modelId) {
        console.error('🔍 Vehicle data:', vehicle);
        setError('Vehicle model ID is missing. Cannot delete vehicle.');
        return;
      }

      const payload = {
        businessid: parseInt(businessId),
        subscriberid: parseInt(subscriberId),
        model: parseInt(modelId),
        vehicleid: parseInt(vehicleId)
      };

      console.log('🔍 Delete vehicle payload:', payload);
      const response = await deleteUserVehicle(payload);
      
      if (response.success !== false && response.status !== false) {
        // Refresh vehicles list from API (like old website)
        try {
          const vehiclesData = await fetchUserVehicles(subscriberId);
          setVehicles(vehiclesData || []);
        } catch (refreshError) {
          console.error('Error refreshing vehicles after delete:', refreshError);
          // Fallback to local update
          setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        }
        setError('');
      } else {
        // Parse error message - it might be an array string
        let errorMessage = response.message || 'Failed to delete vehicle';
        if (typeof errorMessage === 'string' && errorMessage.startsWith('[') && errorMessage.endsWith(']')) {
          try {
            const parsed = JSON.parse(errorMessage);
            errorMessage = Array.isArray(parsed) ? parsed[0] : parsed;
          } catch (e) {
            // If parsing fails, try to extract message from string
            errorMessage = errorMessage.replace(/[\[\]']/g, '');
          }
        }
        // Replace specific error message with user-friendly one
        if (errorMessage.includes('Associated with subscriber booking') || errorMessage.includes('booking')) {
          errorMessage = "Can't delete vehicle with booking history";
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      // Check if error response has a message
      let errorMessage = 'Failed to delete vehicle';
      if (err.response?.data?.message) {
        let msg = err.response.data.message;
        if (typeof msg === 'string' && msg.startsWith('[') && msg.endsWith(']')) {
          try {
            const parsed = JSON.parse(msg);
            msg = Array.isArray(parsed) ? parsed[0] : parsed;
          } catch (e) {
            msg = msg.replace(/[\[\]']/g, '');
          }
        }
        // Replace specific error message with user-friendly one
        if (msg.includes('Associated with subscriber booking') || msg.includes('booking')) {
          msg = "Can't delete vehicle with booking history";
        }
        errorMessage = msg;
      }
      setError(errorMessage);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      // Note: The old website doesn't have delete address functionality
      // This would need to be implemented in the backend
      setAddresses(prev => prev.filter(address => address.id !== addressId));
      setError('');
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Failed to delete address');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const subscriberId = getSubscriberId();
      if (!subscriberId) {
        setError('User not authenticated');
        return;
      }

      const response = await cancelBooking(bookingId);
      
      if (response.success) {
        // Refresh bookings list from API
        try {
          const bookingsData = await fetchUserBookings(subscriberId);
          if (bookingsData && Array.isArray(bookingsData)) {
            setBookings(bookingsData);
            setError('');
          } else {
            setError('Failed to refresh bookings. Please reload the page.');
          }
        } catch (refreshError) {
          console.error('Error refreshing bookings after cancel:', refreshError);
          setError('Booking cancelled but failed to refresh list. Please reload the page.');
        }
      } else {
        setError(response.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    }
  };

  const handleAddVehicleSuccess = async (newVehicle) => {
    // Refresh vehicles list from API (like old website)
    try {
      const subscriberId = getSubscriberId();
      if (!subscriberId) {
        setError('User not authenticated');
        setIsAddVehicleModalOpen(false);
        return;
      }
      const vehiclesData = await fetchUserVehicles(subscriberId);
      if (vehiclesData && Array.isArray(vehiclesData)) {
        setVehicles(vehiclesData);
        setError('');
      } else {
        setError('Failed to refresh vehicles. Please reload the page.');
      }
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      setError('Failed to refresh vehicles. Please reload the page.');
    }
    setIsAddVehicleModalOpen(false);
  };

  const handleAddAddressSuccess = async (newAddress) => {
    // Refresh addresses list from API (like old website)
    try {
      const subscriberId = getSubscriberId();
      if (!subscriberId) {
        setError('User not authenticated');
        setIsAddAddressModalOpen(false);
        return;
      }
      const addressesData = await fetchUserAddresses(subscriberId);
      if (addressesData && Array.isArray(addressesData)) {
        setAddresses(addressesData);
        setError('');
      } else {
        setError('Failed to refresh addresses. Please reload the page.');
      }
    } catch (error) {
      console.error('Error refreshing addresses:', error);
      setError('Failed to refresh addresses. Please reload the page.');
    }
    setIsAddAddressModalOpen(false);
  };

  const handleBookingClick = (bookingId) => {
    navigate(`/booking/${bookingId}`, {
      state: { fromProfile: true, activeTab: 'bookings' }
    });
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'}`}>
      {/* Header */}
      <div className={`${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-900 border-gray-800'} border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>My Profile</h1>
                <p className={`mt-1 text-sm sm:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-900 border-gray-800'} border-b`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto space-x-2 sm:space-x-8">
            {[
              { id: 'bookings', label: 'My Bookings', icon: CalendarDaysIcon, shortLabel: 'Bookings' },
              { id: 'profile', label: 'My Profile', icon: UserIcon, shortLabel: 'Profile' },
              { id: 'vehicles', label: 'My Vehicles', icon: TruckIcon, shortLabel: 'Vehicles' },
              { id: 'addresses', label: 'My Addresses', icon: HomeIcon, shortLabel: 'Addresses' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-500'
                    : theme === 'light' 
                      ? 'border-transparent text-gray-600 hover:text-gray-900' 
                      : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading your data...</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* My Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4 sm:space-y-6">
            <div className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} rounded-lg p-4 sm:p-6 border`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Personal Information</h3>
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Name */}
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-600 w-full mt-1 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-800 text-white border-gray-700'}`}
                    />
                  ) : (
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{userData.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-600 w-full mt-1 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-800 text-white border-gray-700'}`}
                    />
                  ) : (
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{userData.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-600 w-full mt-1 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-800 text-white border-gray-700'}`}
                    />
                  ) : (
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{userData.phone}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>City</label>
                  {isEditing ? (
                    <select
                      value={editData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-600 w-full mt-1 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-800 text-white border-gray-700'}`}
                    >
                      {cities.length > 0 ? (
                        cities.map(city => (
                          <option key={city.id} value={city.name}>{city.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="Pune">Pune</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Bangalore">Bangalore</option>
                          <option value="Chennai">Chennai</option>
                          <option value="Hyderabad">Hyderabad</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{userData.city}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                  <button
                    onClick={handleSave}
                    className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6 sm:space-y-8">
            <div className={`${theme === 'light' ? 'bg-white/80 backdrop-blur-xl border-gray-200/50' : 'bg-gray-900/80 backdrop-blur-xl border-gray-800/50'} rounded-2xl p-6 sm:p-8 border shadow-xl`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                <div>
                  <h3 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>My Vehicles</h3>
                  <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Manage your registered vehicles</p>
                </div>
                <button 
                  onClick={() => setIsAddVehicleModalOpen(true)}
                  className="group relative overflow-hidden flex items-center justify-center space-x-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Add Vehicle</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
                </button>
              </div>
              
              {vehicles.length === 0 ? (
                <div className={`text-center py-16 sm:py-20 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} flex items-center justify-center`}>
                    <TruckIcon className="w-12 h-12 opacity-50" />
                  </div>
                  <p className="text-base md:text-lg font-semibold mb-2">No vehicles added yet</p>
                  <p className="text-xs md:text-sm">Click "Add Vehicle" to add your first vehicle</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {vehicles.map(vehicle => (
                    <div 
                      key={vehicle.id} 
                      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 flex flex-col h-full ${
                        theme === 'light' 
                          ? 'bg-white/80 backdrop-blur-xl border border-gray-200/50 hover:border-red-300/50 shadow-lg hover:shadow-2xl' 
                          : 'bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 hover:border-red-500/50 shadow-xl hover:shadow-2xl'
                      } transform hover:scale-[1.02] hover:-translate-y-1`}
                    >
                      {/* Premium gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/3 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none z-0`}></div>
                      
                      {/* Premium delete button */}
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-red-500/90 hover:bg-red-600 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:scale-110"
                        title="Delete vehicle"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Vehicle Image with premium styling */}
                      <div className="relative overflow-hidden h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
                        {vehicle.model?.image ? (
                          <>
                            <img
                              src={vehicle.model.image}
                              alt={vehicle.model?.name || 'Vehicle'}
                              className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement.querySelector('.vehicle-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div 
                              className="vehicle-fallback w-full h-full hidden items-center justify-center"
                            >
                              <TruckIcon className={`w-20 h-20 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <TruckIcon className={`w-20 h-20 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle Details with premium styling */}
                      <div className="px-4 py-4 sm:px-5 sm:py-5 flex flex-col flex-1 relative z-10">
                        <h4 className={`font-bold text-base md:text-lg mb-2 line-clamp-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {vehicle.model?.name || 'Vehicle'}
                        </h4>
                        {vehicle.model?.cc_id && (
                          <p className={`text-xs md:text-sm mb-3 font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {vehicle.model.cc_id}
                          </p>
                        )}
                        <div className="mt-auto pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                          <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                            <TruckIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">Registered Vehicle</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-4 sm:space-y-6">
            <div className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} rounded-lg p-4 sm:p-6 border`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>My Addresses</h3>
                <button 
                  onClick={() => setIsAddAddressModalOpen(true)}
                  className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Address</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {addresses.map(address => (
                  <div key={address.id} className={`${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-lg p-4 border relative group`}>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-start space-x-3">
                      <HomeIcon className="w-6 h-6 text-red-500 mt-1" />
                      <div className="flex-1">
                        <h4 className={`font-medium mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {cities.find(city => city.id === address.city_id)?.name || address.city || 'City'}
                        </h4>
                        <p className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Pincode: {address.pincode}</p>
                        <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{address.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 sm:space-y-8">
            <div className={`${theme === 'light' ? 'bg-white/80 backdrop-blur-xl border-gray-200/50' : 'bg-gray-900/80 backdrop-blur-xl border-gray-800/50'} rounded-2xl p-6 sm:p-8 border shadow-xl`}>
              <div className="mb-6 sm:mb-8">
                <h3 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>My Bookings</h3>
                <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>View and manage your service bookings</p>
              </div>
              
              {bookings.length === 0 ? (
                <div className={`text-center py-16 sm:py-20 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} flex items-center justify-center`}>
                    <CalendarDaysIcon className="w-12 h-12 opacity-50" />
                  </div>
                  <p className="text-base md:text-lg font-semibold mb-2">No bookings yet</p>
                  <p className="text-xs md:text-sm">Your booking history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {bookings.map(booking => {
                    const status = booking.current_status?.status || '';
                    const statusDisplay = booking.current_status?.displayname || '';
                    const isCancelled = status === 'cancelled';
                    
                    const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : '';
                    
                    const bookingTime = booking.booking_slot || '';
                    const bookingDateTime = bookingDate && bookingTime ? `${bookingDate} at ${bookingTime}` : bookingDate || bookingTime;
                    
                    const vehicleDetails = booking.vehicle_details;
                    const garageDetails = booking.garage_details;

                    // Try to resolve the exact vehicle from the user's saved vehicles list
                    const matchedVehicle =
                      vehicles.find(v => 
                        v.id === vehicleDetails?.id ||
                        v.id === vehicleDetails?.vehicleid ||
                        v.id === vehicleDetails?.vehicle_id
                      ) || null;

                    // Prefer the real vehicle image used in the booking, with multiple fallbacks
                    const vehicleImage =
                      vehicleDetails?.model?.image ||
                      vehicleDetails?.image ||
                      vehicleDetails?.model_image ||
                      vehicleDetails?.vehicle?.image ||
                      // Common alternative field names from APIs
                      vehicleDetails?.bike_image ||
                      vehicleDetails?.bikeimage ||
                      vehicleDetails?.imageUrl ||
                      vehicleDetails?.image_url ||
                      (Array.isArray(vehicleDetails?.images) ? vehicleDetails.images[0] : null) ||
                      matchedVehicle?.model?.image ||
                      null;

                    const vehicleName =
                      vehicleDetails?.model?.name ||
                      vehicleDetails?.name ||
                      vehicleDetails?.vehicle_name ||
                      matchedVehicle?.model?.name ||
                      'Vehicle';
                    
                    return (
                      <button
                        key={booking.id}
                        onClick={() => handleBookingClick(booking.id)}
                        className={`group relative w-full rounded-2xl overflow-hidden transition-all duration-500 text-left ${
                          theme === 'light' 
                            ? 'bg-white/80 backdrop-blur-xl border border-gray-200/50 hover:border-red-300/50 shadow-lg hover:shadow-2xl' 
                            : 'bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 hover:border-red-500/50 shadow-xl hover:shadow-2xl'
                        } transform hover:scale-[1.01] hover:-translate-y-1`}
                      >
                        {/* Premium gradient overlay on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/3 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none z-0`}></div>
                        
                        {/* Status Badge in top right corner */}
                        {statusDisplay && (
                          <div className="absolute top-4 right-4 z-20">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${
                              isCancelled 
                                ? theme === 'light'
                                  ? 'bg-red-100/80 text-red-800 border-red-200/50'
                                  : 'bg-red-900/80 text-red-200 border-red-700/50'
                                : status === 'booking_confirmed'
                                ? theme === 'light'
                                  ? 'bg-green-100/80 text-green-800 border-green-200/50'
                                  : 'bg-green-900/80 text-green-200 border-green-700/50'
                                : theme === 'light'
                                ? 'bg-blue-100/80 text-blue-800 border-blue-200/50'
                                : 'bg-blue-900/80 text-blue-200 border-blue-700/50'
                            } shadow-md`}>
                              {statusDisplay}
                            </span>
                          </div>
                        )}
                        
                        <div className="p-5 sm:p-6 relative z-10">
                          <div className="flex items-center gap-4 sm:gap-6">
                            {/* Booking Info with premium styling */}
                            <div className="flex-1 text-left min-w-0 pr-20">
                              <div className="mb-3">
                                <h4 className={`text-base md:text-lg font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                  Booking #{booking.id}
                                </h4>
                                {vehicleName && (
                                  <p className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} truncate mb-3`}>
                                    {vehicleName}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs md:text-sm">
                                {bookingDateTime && (
                                  <div className="flex items-center gap-2">
                                    <CalendarDaysIcon className={`w-4 h-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                      {bookingDateTime}
                                    </span>
                                  </div>
                                )}
                                
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20`}>
                                  <span className={`font-bold text-lg bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent`}>
                                    ₹{parseFloat(booking.total_amount || booking.booking_amount || 0).toFixed(2)}
                                  </span>
                                </div>
                                
                                {garageDetails?.name && (
                                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                                    theme === 'light' ? 'bg-gray-100/80' : 'bg-gray-700/80'
                                  } backdrop-blur-sm`}>
                                    <HomeIcon className={`w-4 h-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <span className={`truncate font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                      {garageDetails.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Arrow Icon with premium styling */}
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                theme === 'light' ? 'bg-gray-100/80' : 'bg-gray-700/80'
                              } backdrop-blur-sm group-hover:bg-red-500/10 transition-colors duration-300`}>
                                <ChevronRightIcon className={`w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 ${
                                  theme === 'light' ? 'text-gray-600 group-hover:text-red-600' : 'text-gray-400 group-hover:text-red-400'
                                }`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        onSuccess={handleAddVehicleSuccess}
      />

      {/* Add Address Modal */}
      <AddAddressModal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        onSuccess={handleAddAddressSuccess}
      />
    </div>
  );
};

export default Profile;
