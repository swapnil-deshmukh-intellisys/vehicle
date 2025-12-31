import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import GarageCard from '../components/homeComponents/GarageCard';
import VehicleTypeSelector from '../components/common/VehicleTypeSelector';
import { getGaragesByServiceCategory } from '../services/garageService';
import { apiGet } from '../utils/api';
import { getStoredLocationData } from '../utils/geolocation';
import { useTheme } from '../components/context/ThemeContext';
import { BackgroundGradients } from '../constants/designSystem';

const FALLBACK_EV_SERVICE_ID = 6;

const EVServicePage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState(() => {
    const city = sessionStorage.getItem("selectedCity") || "Pune";
    if (city === "Mulshi" || city === "Hinjewadi" || city === "Wakad" || city === "Baner") {
      sessionStorage.setItem("selectedCity", "Pune");
      return "Pune";
    }
    return city;
  });
  const [evGarages, setEvGarages] = useState([]);
  const [filteredGarages, setFilteredGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [rating, setRating] = useState('all');
  const [distance, setDistance] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [evServiceCategoryId, setEvServiceCategoryId] = useState(null);
  const [error, setError] = useState(null);

  // Get vehicle type from URL params
  useEffect(() => {
    const vehicleType = searchParams.get('vehicleType');
    if (vehicleType === 'two-wheeler' || vehicleType === 'four-wheeler') {
      setSelectedVehicleType(vehicleType);
      sessionStorage.setItem('selectedVehicleType', vehicleType);
    } else {
      // Default to two-wheeler if no vehicle type selected, don't show modal
      setSelectedVehicleType('two-wheeler');
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('vehicleType', 'two-wheeler');
      navigate(`/ev-service?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("latitude") && sessionStorage.getItem("longitude")) {
      setLocationReady(true);
    } else {
      const fallbackLat = 18.5204;
      const fallbackLng = 73.8567;
      sessionStorage.setItem("latitude", fallbackLat.toString());
      sessionStorage.setItem("longitude", fallbackLng.toString());
      setLocationReady(true);
    }
  }, []);

  useEffect(() => {
    const fetchEVServiceCategory = async () => {
      try {
        const city = selectedCity || sessionStorage.getItem("selectedCity") || 'Pune';
        const cityParam = city.toLowerCase();
        const response = await apiGet(`/active-cities/?city=${cityParam}`);
        
        if (response.status === "success" && response.data?.filter?.services) {
          const services = response.data.filter.services;
          const evService = services.find(
            service => {
              const name = service.name.toLowerCase();
              return name.includes('ev') || 
                     name.includes('electric') ||
                     name === 'ev service' ||
                     name === 'ev servicing';
            }
          );
          
          if (evService) {
            setEvServiceCategoryId(evService.id);
          } else {
            setEvServiceCategoryId(FALLBACK_EV_SERVICE_ID);
          }
        } else {
          setEvServiceCategoryId(FALLBACK_EV_SERVICE_ID);
        }
      } catch (error) {
        console.error('Error fetching EV service category:', error);
        setEvServiceCategoryId(FALLBACK_EV_SERVICE_ID);
      }
    };

    if (selectedCity || locationReady) {
      fetchEVServiceCategory();
    }
  }, [selectedCity, locationReady]);

  useEffect(() => {
    if (!locationReady || !evServiceCategoryId) return;

    const fetchEVGarages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { latitude, longitude } = getStoredLocationData();
        const lat = latitude || 18.5204;
        const lng = longitude || 73.8567;

        let location = selectedCity || sessionStorage.getItem("selectedCity") || 'Pune';
        if (location === 'Bangalore') {
          location = 'Bangalore ';
        }

        const requestData = {
          location: location,
          latitude: lat,
          longitude: lng,
          filter: {
            sort: [],
            ratings: [],
            distence: [],
            service: [evServiceCategoryId],
          },
        };

        const response = await getGaragesByServiceCategory(requestData);

        if (response && response.data && response.data.length > 0) {
          setEvGarages(response.data);
          setFilteredGarages(response.data);
        } else {
          setEvGarages([]);
          setFilteredGarages([]);
        }
      } catch (error) {
        console.error("Failed to fetch EV garages:", error);
        setError('Failed to load EV service garages');
        setEvGarages([]);
        setFilteredGarages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEVGarages();
  }, [locationReady, selectedCity, evServiceCategoryId]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSortOpen && !event.target.closest('.sort-dropdown')) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const handleVehicleTypeChange = (vehicleType) => {
    setSelectedVehicleType(vehicleType);
    sessionStorage.setItem('selectedVehicleType', vehicleType);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('vehicleType', vehicleType);
    navigate(`/ev-service?${newSearchParams.toString()}`, { replace: true });
  };

  useEffect(() => {
    let filtered = [...evGarages];

    if (rating !== 'all') {
      const minRating = parseFloat(rating);
      filtered = filtered.filter(garage => (garage.rating || 0) >= minRating);
    }

    if (distance !== 'all') {
      const maxDistance = parseFloat(distance);
      filtered = filtered.filter(garage => {
        if (garage.distance === null || garage.distance === undefined) return false;
        return garage.distance <= maxDistance;
      });
    }

    if (sortBy === 'distance') {
      filtered.sort((a, b) => {
        const distA = a.distance !== null && a.distance !== undefined ? a.distance : Infinity;
        const distB = b.distance !== null && b.distance !== undefined ? b.distance : Infinity;
        return distA - distB;
      });
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredGarages(filtered);
  }, [evGarages, rating, distance, sortBy]);

  const handleGarageClick = (garage) => {
    navigate(`/ev-service/${garage.id}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            Loading EV Service centers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
      {/* EV Service Centers Section */}
      <section className={`pt-4 pb-12 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20 px-4 relative overflow-x-hidden ${theme === 'light' ? BackgroundGradients.light.secondary : BackgroundGradients.dark.secondary}`}>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              EV Service Centers
            </h2>
            <p className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Find professional electric vehicle service centers
            </p>
          </div>

          {/* Vehicle Type Selector at Top */}
          <div className="flex justify-center mb-6">
            <VehicleTypeSelector 
              currentVehicleType={selectedVehicleType || 'two-wheeler'}
              onVehicleTypeChange={handleVehicleTypeChange}
            />
          </div>

          {/* Mobile Filter Button - Outside of sidebar */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center justify-center font-semibold py-2 px-4 rounded-xl transition-all duration-200 border-2 ${
                theme === 'light' 
                  ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg' 
                  : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500 shadow-md hover:shadow-lg'
              }`}
            >
              <span className="mr-2 text-xs md:text-sm">Filters</span>
              <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:col-span-1 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
              <div className={`rounded-2xl mb-6 backdrop-blur-xl transition-all duration-300 ${
                theme === 'light' 
                  ? 'bg-white/90 border border-gray-200/50 shadow-xl' 
                  : 'bg-gray-800/90 border border-gray-700/50 shadow-2xl'
              }`}>
                {/* Premium header */}
                <div className={`flex items-center justify-between p-4 md:p-6 border-b ${
                  theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'
                }`}>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg`}>
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className={`text-base md:text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Filters</h2>
                      <p className={`text-[10px] md:text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        Refine your search
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter content */}
                <div className="space-y-4 md:space-y-6 p-4 md:p-6">
                  {/* Rating Filter */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Rating
                    </h3>
                    <div className="relative">
                      <select
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className={`w-full border-2 rounded-xl px-3 py-2.5 md:px-4 md:py-3.5 text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                          theme === 'light' 
                            ? 'bg-white/80 backdrop-blur-sm border-gray-300 hover:border-red-400 text-gray-900 shadow-md hover:shadow-lg' 
                            : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 hover:border-red-500 text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        <option value="all">All Ratings</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                      </select>
                    </div>
                  </div>

                  {/* Distance Filter */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Distance
                    </h3>
                    <div className="relative">
                      <select
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        className={`w-full border-2 rounded-xl px-3 py-2.5 md:px-4 md:py-3.5 text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                          theme === 'light' 
                            ? 'bg-white/80 backdrop-blur-sm border-gray-300 hover:border-red-400 text-gray-900 shadow-md hover:shadow-lg' 
                            : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 hover:border-red-500 text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        <option value="all">All Distances</option>
                        <option value="5">Within 5 km</option>
                        <option value="10">Within 10 km</option>
                        <option value="20">Within 20 km</option>
                      </select>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Sort By
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className={`w-full group flex items-center justify-between border-2 rounded-xl px-3 py-2.5 md:px-4 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                          theme === 'light' 
                            ? 'bg-white/80 backdrop-blur-sm border-gray-300 hover:border-red-400 text-gray-900 shadow-md hover:shadow-lg' 
                            : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 hover:border-red-500 text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        <span className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                          {sortBy === 'distance' ? 'Distance' : sortBy === 'rating' ? 'Rating' : 'Name'}
                        </span>
                        <ChevronDownIcon className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} ${isSortOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isSortOpen && (
                        <div className={`absolute z-50 w-full top-full left-0 mt-2 md:mt-3 border-2 rounded-xl md:rounded-2xl shadow-2xl backdrop-blur-xl ${
                          theme === 'light' 
                            ? 'bg-white/95 border-gray-200' 
                            : 'bg-gray-800/95 border-gray-700'
                        }`}>
                          <div className="py-2 pt-2 md:pt-3">
                            <button
                              onClick={() => { setSortBy('distance'); setIsSortOpen(false); }}
                              className={`w-full text-left px-4 py-2 md:py-3 text-xs md:text-sm transition-colors ${
                                theme === 'light' 
                                  ? 'hover:bg-red-50 hover:text-red-600 text-gray-700' 
                                  : 'hover:bg-gray-700 hover:text-red-400 text-gray-300'
                              }`}
                            >
                              Distance
                            </button>
                            <button
                              onClick={() => { setSortBy('rating'); setIsSortOpen(false); }}
                              className={`w-full text-left px-4 py-2 md:py-3 text-xs md:text-sm transition-colors ${
                                theme === 'light' 
                                  ? 'hover:bg-red-50 hover:text-red-600 text-gray-700' 
                                  : 'hover:bg-gray-700 hover:text-red-400 text-gray-300'
                              }`}
                            >
                              Rating
                            </button>
                            <button
                              onClick={() => { setSortBy('name'); setIsSortOpen(false); }}
                              className={`w-full text-left px-4 py-2 md:py-3 text-xs md:text-sm transition-colors ${
                                theme === 'light' 
                                  ? 'hover:bg-red-50 hover:text-red-600 text-gray-700' 
                                  : 'hover:bg-gray-700 hover:text-red-400 text-gray-300'
                              }`}
                            >
                              Name
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Garage Grid */}
            <div className={`${isFilterOpen ? 'lg:col-span-3' : 'col-span-1 lg:col-span-3'}`}>
              {filteredGarages.length === 0 ? (
                <div className="text-center py-12">
                  <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    No EV service centers found matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredGarages.map((garage, index) => (
                    <div key={garage.id}>
                      <GarageCard
                        garage={garage}
                        onClick={handleGarageClick}
                        serviceType="ev-service"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EVServicePage;

