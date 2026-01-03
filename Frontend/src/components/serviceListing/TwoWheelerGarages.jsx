import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterSystem, { SortByDropdown } from '../homeComponents/FilterSystem';
import GarageCard from '../homeComponents/GarageCard';
import ScrollToTop from '../common/ScrollToTop';
import VehicleTypeSelector from '../common/VehicleTypeSelector';
import { getGaragesByServiceCategory } from '../../services/garageService';
import { getStoredLocationData, hasLocationData, getCurrentLocation, getCityFromCoordinates, storeLocationData } from '../../utils/geolocation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import { ColorPalette, BackgroundGradients } from '../../constants/designSystem';

const TwoWheelerGarages = ({ selectedCity, filterData, onVehicleTypeChange }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [garages, setGarages] = useState([]);
  const [filteredGarages, setFilteredGarages] = useState([]);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [garageType, setGarageType] = useState('all'); // 'all' or 'authorized'
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState(null);
  const brandDropdownRef = useRef(null);

  // Two-wheeler brands for authorized service centers
  const twoWheelerBrands = [
    'Honda', 'Yamaha', 'Bajaj', 'TVS', 'Hero', 'Royal Enfield', 
    'KTM', 'Suzuki', 'Kawasaki', 'Ducati', 'BMW', 'Harley Davidson',
    'Aprilia', 'Triumph', 'Benelli', 'Jawa', 'Mahindra'
  ];

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setIsBrandDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Geolocation setup with improved handling
  useEffect(() => {
    const initializeLocation = async () => {
      // Check if we already have location data
      if (hasLocationData()) {
        console.log("📍 Using existing location data in garage component");
        setLocationReady(true);
        return;
      }

      // Try to get fresh location data
      try {
        console.log("📍 No location data found, attempting to get current location...");
        const { latitude, longitude } = await getCurrentLocation();
        
        // Try to get city information
        try {
          const cityData = await getCityFromCoordinates(latitude, longitude);
          storeLocationData(latitude, longitude, cityData);
          console.log("📍 Location and city data stored:", { latitude, longitude, city: cityData.city });
        } catch (cityError) {
          console.warn("📍 Failed to get city data, storing coordinates only:", cityError);
          sessionStorage.setItem("latitude", latitude.toString());
          sessionStorage.setItem("longitude", longitude.toString());
        }
        
        setLocationReady(true);
      } catch (error) {
        console.error("📍 Failed to get location, using fallback:", error);
        // Set fallback coordinates
        sessionStorage.setItem("latitude", "18.5204");
        sessionStorage.setItem("longitude", "73.8567");
        sessionStorage.setItem("selectedCity", "Pune");
        setLocationReady(true);
      }
    };

    initializeLocation();
  }, []);

  // Fetch garages when filters or location change
  useEffect(() => {
    if (!locationReady) return;

    const fetchGarages = async () => {
      setLoading(true);
      try {
        const { latitude, longitude } = getStoredLocationData();
        const lat = latitude || 17.74162;
        const lng = longitude || 73.8567;

        const requestData = {
          location: selectedCity,
          latitude: lat,
          longitude: lng,
          vehicleType: 'two-wheeler', // Keep for new website logic
          garageType: garageType || 'all', // Keep for new website logic
          selectedBrand: selectedBrand || '', // Keep for new website logic
          filter: {
            sort: filters?.sort || [],
            ratings: filters?.ratings || [],
            distence: filters?.distance || [], // Use old spelling like old website
            services: filters?.services || [],
            brands: filters?.brands || [],
          },
        };

        const response = await getGaragesByServiceCategory(requestData);
        console.log('🔍 Full API response:', response);
        console.log('🔍 Response data:', response?.data);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Response keys:', Object.keys(response || {}));
        
        // Handle different response structures
        let garagesData = [];
        if (response?.data) {
          garagesData = response.data;
        } else if (Array.isArray(response)) {
          garagesData = response;
        } else if (response?.garages) {
          garagesData = response.garages;
        }
        
        console.log('🔍 Processed garages data:', garagesData);
        setGarages(garagesData);
        setFilteredGarages(garagesData);
        
        // Only set noResultsMessage if there are actually no garages
        if (garagesData.length === 0) {
          setNoResultsMessage(response?.message || "No garages found in your area");
        } else {
          setNoResultsMessage(null);
        }
      } catch (error) {
        console.error("Failed to fetch two-wheeler garages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGarages();
  }, [filters, locationReady, selectedCity, garageType, selectedBrand]);

  // Sort garages when sortBy changes
  useEffect(() => {
    if (!garages.length) return;

    const sortedGarages = [...garages].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'rating-high':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating-low':
          return (a.rating || 0) - (b.rating || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'service-time':
          return (a.serviceTime || 0) - (b.serviceTime || 0);
        default:
          return 0;
      }
    });

    setFilteredGarages(sortedGarages);
  }, [garages, sortBy]);

  const handleFilterApply = (newFilters) => {
    console.log("Filters received from child:", newFilters);
    setFilters(newFilters);
    
    // If brands are selected from FilterSystem, automatically switch to authorized mode
    if (newFilters && newFilters.brands && newFilters.brands.length > 0) {
      setGarageType('authorized');
      setSelectedBrand(''); // Clear the garage component's brand selection
    }
  };

  const handleClearFilters = () => {
    setFilters(null);
    setGarageType('all');
    setSelectedBrand('');
    setIsBrandDropdownOpen(false);
  };

  const handleGarageClick = (garage) => {
    navigate(`/garage/${garage.id}`);
  };

  const handleGarageTypeChange = (type) => {
    setGarageType(type);
    if (type === 'all') {
      setSelectedBrand('');
    }
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setIsBrandDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className={`py-12 px-4 ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 border-t-red-700 mx-auto"></div>
            <p className={`mt-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Loading two-wheeler garages...</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('🔍 Component render - garages:', garages.length, 'filteredGarages:', filteredGarages.length, 'loading:', loading, 'noResultsMessage:', noResultsMessage);

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>

      {/* Two Wheeler Garages Section */}
      <section className={`pt-4 pb-12 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20 px-4 relative overflow-x-hidden ${theme === 'light' ? BackgroundGradients.light.secondary : BackgroundGradients.dark.secondary}`}>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Two Wheeler Garages
            </h2>
            <p className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Find specialized garages for bikes and scooters</p>
          </div>

          {/* Vehicle Type Selector at Top */}
          <div className="flex justify-center mb-6">
            <VehicleTypeSelector 
              currentVehicleType="two-wheeler"
              onVehicleTypeChange={onVehicleTypeChange}
            />
          </div>

          {/* Mobile Filter Button - Outside of sidebar */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center justify-center font-semibold py-2 px-4 rounded-xl transition-all duration-200 border-2 ${theme === 'light' ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500 shadow-md hover:shadow-lg'}`}
            >
              <span className="mr-2 inline-flex items-center gap-2 text-xs md:text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </span>
              <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:col-span-1 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
              <FilterSystem
                filterData={filterData}
                onApplyFilters={handleFilterApply}
                isMobile={isMobile}
                onClearAll={handleClearFilters}
              />
            </div>

            {/* Garage Grid */}
            <div className={`${isFilterOpen ? 'lg:col-span-3' : 'col-span-1 lg:col-span-3'}`}>
              {/* Garage Type Toggle and Controls */}
              <div className="flex flex-row sm:flex-row justify-between items-end sm:items-center gap-4 mb-6  relative z-20">
                {/* Left Group: Garage Type Toggle + Brand Dropdown */}
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  {/* Garage Type Toggle */}
                  <div className={`flex ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'} rounded-xl p-1 shadow-md`}>
                    <button
                      onClick={() => handleGarageTypeChange('all')}
                      className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                        garageType === 'all'
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg'
                          : theme === 'light' ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleGarageTypeChange('authorized')}
                      className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                        garageType === 'authorized'
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg'
                          : theme === 'light' ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      Authorized
                    </button>
                  </div>

                  {/* Brand Dropdown (only for authorized) */}
                  {garageType === 'authorized' && (
                    <div className="relative" ref={brandDropdownRef}>
                      <button
                        onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                        className={`flex items-center space-x-2 border-2 rounded-xl px-3 md:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-md hover:shadow-lg ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400' : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500'}`}
                      >
                        <span className="text-xs md:text-sm font-semibold">
                          {selectedBrand || 'Select Brand'}
                        </span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isBrandDropdownOpen && (
                        <div className={`absolute z-50 right-0 mt-2 w-48 border rounded-lg shadow-lg ${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600'}`}>
                          <div className="py-2 pt-3">
                            {twoWheelerBrands.map((brand) => (
                              <button
                                key={brand}
                                onClick={() => handleBrandSelect(brand)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  selectedBrand === brand 
                                    ? theme === 'light'
                                      ? 'text-red-600 bg-red-50 font-semibold'
                                      : 'text-red-400 bg-gray-700 font-semibold'
                                    : theme === 'light' 
                                      ? 'text-gray-700 hover:bg-gray-100' 
                                      : 'text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {brand}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Group: Sort By Dropdown */}
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:w-auto">
                  <SortByDropdown 
                    currentSort={sortBy} 
                    onSortChange={setSortBy} 
                  />
                </div>
              </div>

              {filteredGarages.length === 0 ? (
                <div className="text-center py-12">
                  <p className={`text-sm md:text-base mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {garageType === 'authorized'
                      ? 'Authorised garages coming soon.'
                      : 'No two-wheeler garages found matching your criteria.'}
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-xs md:text-base"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  {noResultsMessage ? (
                    <div className="text-center py-12">
                      <div className={`rounded-xl p-6 md:p-8 max-w-md mx-auto ${theme === 'light' ? 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl' : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700 shadow-xl'}`}>
                        <div className="text-4xl md:text-6xl mb-4 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                          🔧
                        </div>
                        <h3 className={`text-xl md:text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {garageType === 'authorized' ? 'Authorised Garages Coming Soon' : 'No Garages Found'}
                        </h3>
                        <p className={`text-sm md:text-base mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {garageType === 'authorized' ? 'Authorised garages coming soon.' : noResultsMessage}
                        </p>
                        <button
                          onClick={handleClearFilters}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 md:py-2.5 md:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-xs md:text-base"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {filteredGarages.map((garage) => (
                        <div key={garage.id}>
                          <GarageCard
                            garage={garage}
                            onClick={handleGarageClick}
                            serviceType="garage"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default TwoWheelerGarages;
