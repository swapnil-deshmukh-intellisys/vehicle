import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { 
  StarIcon, 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon, 
  ChevronDownIcon,
  CalendarDaysIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTools, 
  faStar, 
  faMapPin, 
  faClock,
  faCheck,
  faShieldAlt,
  faWrench
} from '@fortawesome/free-solid-svg-icons';
import { fetchGarageById } from '../services/garageDetailService';
import { useTheme } from '../components/context/ThemeContext';
import { isAuthenticated } from '../services/authService';

const WashingCenterInfoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  // Get garage data from location state if available (from navigation)
  const garageFromState = location.state?.garage;
  const [selectedTab, setSelectedTab] = useState('about');
  const [selectedTime, setSelectedTime] = useState('9:00 AM');
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [garageData, setGarageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fallback images for garage cover images
  const fallbackImages = [
    'https://s3.ap-south-1.amazonaws.com/awsimages.imagesbazaar.com/1200x1800-old/19250/SM909715.jpg?date=Thu%20Oct%2002%202025%2021:08:06%20GMT+0530%20(India%20Standard%20Time)',
    'https://s3.ap-south-1.amazonaws.com/awsimages.imagesbazaar.com/1200x1800-old/16979/SM738559.jpg?date=Thu%20Oct%2002%202025%2021:09:38%20GMT+0530%20(India%20Standard%20Time)',
    'https://s3.ap-south-1.amazonaws.com/awsimages.imagesbazaar.com/1200x1800-old/16979/SM738531.jpg?date=Thu%20Oct%2002%202025%2021:10:16%20GMT+0530%20(India%20Standard%20Time)',
    'https://s3.ap-south-1.amazonaws.com/awsimages.imagesbazaar.com/1200x1800-old/16979/SM738539.jpg?date=Thu%20Oct%2002%202025%2021:10:54%20GMT+0530%20(India%20Standard%20Time)'
  ];

  // Get fallback image based on garage ID
  const getFallbackImage = (garageId) => {
    if (!garageId) return fallbackImages[0];
    const index = (garageId - 1) % fallbackImages.length;
    return fallbackImages[index];
  };

  // Default fallback image for when all else fails
  const defaultFallbackImage = "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg";
  
  // Refs for smooth scrolling
  const aboutRef = useRef(null);
  const servicesRef = useRef(null);
  const reviewsRef = useRef(null);

  // Fetch garage details from API
  useEffect(() => {
    const loadGarageDetails = async () => {
      const garageId = id || garageFromState?.id;
      
      if (!garageId) {
        setError('No garage ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchGarageById(garageId);
        if (data) {
          console.log('🔍 Full Garage Data from API:', data);
          setGarageData(data);
        } else {
          setError('Failed to fetch garage details');
        }
      } catch (err) {
        console.error('Error fetching garage details:', err);
        setError('Failed to load garage details');
      } finally {
        setLoading(false);
      }
    };

    loadGarageDetails();
  }, [id, garageFromState?.id]);

  // Use only real API data for operating hours
  const operatingHours = garageData?.operatingHours || [];

  // Check if garage is currently open based on operating hours
  const garageIsOpen = useMemo(() => {
    if (!operatingHours || operatingHours.length === 0) {
      return false; // Default to closed if no operating hours
    }

    const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTimeStr = currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Find today's operating hours
    const todayHours = operatingHours.find(hours => 
      hours.day?.toLowerCase() === currentDay.toLowerCase()
    );

    if (!todayHours || !todayHours.time) {
      return false;
    }

    // Parse time range (e.g., "9:00 AM - 6:00 PM")
    const timeRange = todayHours.time.split('-').map(t => t.trim());
    if (timeRange.length !== 2) {
      return false;
    }

    const [openTime, closeTime] = timeRange;

    // Convert times to 24-hour format for comparison
    const timeToMinutes = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let totalMinutes = hours * 60 + (minutes || 0);
      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        totalMinutes += 12 * 60;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        totalMinutes -= 12 * 60;
      }
      return totalMinutes;
    };

    const currentMinutes = timeToMinutes(currentTimeStr);
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }, [operatingHours, currentTime]);

  // Mock time slots
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', 
    '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
  ];

  // Update current time every minute to refresh open/closed status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    // Scroll to top of content area when tab changes
    const scrollToTop = () => {
      const contentArea = document.querySelector('.content-sections-container');
      if (contentArea) {
        contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Small delay to ensure smooth transition
    setTimeout(scrollToTop, 100);
  }, [selectedTab]);

  const handleDirectionClick = () => {
    // Prefer API data, then prop fallback
    const apiLoc = garageData?.location;
    const propLoc = garageFromState?.location;
    const lat = apiLoc?.latitude || apiLoc?.lat || garageData?.latitude || propLoc?.latitude || propLoc?.lat || garageFromState?.latitude;
    const lng = apiLoc?.longitude || apiLoc?.lng || garageData?.longitude || propLoc?.longitude || propLoc?.lng || garageFromState?.longitude;
    if (lat && lng) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
      window.open(mapsUrl, '_blank');
      return;
    }
    // Fallback: open by address if available
    const address = garageData?.address || garageFromState?.address || '';
    if (address) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const getSanitizedPhone = () => {
    const rawPhone = garageData?.phone || garageFromState?.phone;
    if (!rawPhone) return '';
    return String(rawPhone).replace(/[^+\d]/g, '');
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-black'} flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Loading garage details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-black'} flex items-center justify-center`}>
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Error Loading Garage</h2>
          <p className={`mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{error}</p>
            <button
              onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white px-6 py-2 rounded-lg"
            >
            ←
            </button>
          </div>
      </div>
    );
  }

  // Use only API data - no fallback to passed garage data
  const displayGarage = garageData;

  // Show error if no garage data available
  if (!displayGarage) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-black'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Garage Not Found</h2>
          <p className={`mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>This garage information is not available.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white px-6 py-2 rounded-lg"
          >
            ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
        {/* Header */}
        <div className={`${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-900 border-gray-800'} shadow-sm border-b`}>
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className={`flex items-center transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-4">
                <img
                  src={displayGarage?.image || getFallbackImage(displayGarage?.id)}
                  alt={displayGarage?.name || 'Garage'}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    if (e.target.src !== getFallbackImage(displayGarage?.id)) {
                      e.target.src = getFallbackImage(displayGarage?.id);
                    } else {
                      e.target.src = defaultFallbackImage;
                    }
                  }}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className={`text-xl md:text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{displayGarage?.name}</h1>
                    {(displayGarage?.is_verified || garageFromState?.is_verified) && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                        Verified <FontAwesomeIcon icon={faCheck} className="ml-1" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(displayGarage?.rating || 4.5) 
                              ? 'text-yellow-400 fill-current' 
                              : theme === 'light' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm md:text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{displayGarage?.rating || 4.5} ({displayGarage?.reviewCount || 0} reviews)</span>
                  </div>
                  {displayGarage?.verified && (
                    <span className="inline-block bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full mt-1">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'} border-b`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex space-x-8">
              {[
                { id: 'about', label: 'About' },
                { id: 'services', label: 'Services' },
                { id: 'reviews', label: 'Reviews' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm md:text-sm ${
                    selectedTab === tab.id
                      ? 'border-red-500 text-red-500'
                      : theme === 'light' 
                        ? 'border-transparent text-gray-600 hover:text-gray-900' 
                        : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Carousel */}
        <div className="relative z-10">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={displayGarage?.banners && displayGarage.banners.length > 1 ? { clickable: true } : false}
            autoplay={displayGarage?.banners && displayGarage.banners.length > 1 ? { delay: 3000 } : false}
            loop={displayGarage?.banners && displayGarage.banners.length > 1}
            className="h-80"
          >
            {displayGarage?.banners && displayGarage.banners.length > 0 ? (
              displayGarage.banners.map((banner, index) => (
              <SwiperSlide key={index}>
                  <div className="relative w-full h-80">
                <img
                      src={banner.image || displayGarage?.image || getFallbackImage(displayGarage?.id)}
                  alt="Garage Banner"
                  className="w-full h-80 object-cover"
                      onError={(e) => {
                        if (e.target.src !== getFallbackImage(displayGarage?.id)) {
                          e.target.src = getFallbackImage(displayGarage?.id);
                        } else {
                          e.target.src = defaultFallbackImage;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  </div>
              </SwiperSlide>
              ))
            ) : (
              <SwiperSlide>
                <div className="relative w-full h-80">
                <img
                    src={displayGarage?.image || getFallbackImage(displayGarage?.id)}
                  alt="Garage Banner"
                  className="w-full h-80 object-cover"
                    onError={(e) => {
                      if (e.target.src !== getFallbackImage(displayGarage?.id)) {
                        e.target.src = getFallbackImage(displayGarage?.id);
                      } else {
                        e.target.src = defaultFallbackImage;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                </div>
              </SwiperSlide>
            )}
          </Swiper>

          {/* Mobile Information Card - Below Banner */}
          <div className="block sm:hidden p-4">
            <div className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'} rounded-lg shadow-xl p-4 border`}>
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-green-600 text-white w-5 h-5 rounded flex items-center justify-center">
                  <StarIcon className="w-3 h-3" />
                </div>
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>4.5k+ in Google</span>
              </div>
              
              <div className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{displayGarage?.address}</span>
                </div>
                {displayGarage?.distance && (
                  <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {displayGarage.distance} km away
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={`font-semibold ${garageIsOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {garageIsOpen ? 'Open Now' : 'Closed'}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowTimeMenu(!showTimeMenu)}
                    className={`flex items-center space-x-1 ${theme === 'light' ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}
                  >
                    <span>{selectedTime}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  
                  {showTimeMenu && (
                    <div className={`absolute top-full right-0 mt-1 ${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'} border rounded-lg shadow-lg z-30 min-w-32`}>
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setSelectedTime(time);
                            setShowTimeMenu(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${theme === 'light' ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-gray-700 text-white'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`border-t pt-3 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (isAuthenticated()) {
                        navigate(`/booking?garageId=${id || garageFromState?.id}&serviceType=washing-detailing`);
                      } else {
                        navigate('/login', { state: { returnTo: `/washing-detailing/${id || garageFromState?.id}` } });
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-1"
                  >
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>Book Now</span>
                  </button>
                  
                  <a
                    href={`tel:${getSanitizedPhone()}`}
                    className={`flex-1 border py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100 text-gray-700' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                  >
                    <PhoneIcon className="w-4 h-4" />
                    <span>Call</span>
                  </a>
                  
                  <button
                    onClick={handleDirectionClick}
                    className={`flex-1 border py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100 text-gray-700' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                  >
                    <MapPinIcon className="w-4 h-4" />
                    <span>Direction</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Overlay Card */}
          <div className="hidden sm:block absolute bottom-4 left-4 right-4 lg:right-auto lg:w-96 z-20">
            <div className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'} rounded-lg shadow-xl p-4 border backdrop-blur-sm ${theme === 'light' ? 'bg-opacity-95' : 'bg-opacity-95'}`}>
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-green-600 text-white w-5 h-5 rounded flex items-center justify-center">
                  <StarIcon className="w-3 h-3" />
                </div>
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>4.5k+ in Google</span>
              </div>
              
              <div className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{displayGarage?.address}</span>
                </div>
                {displayGarage?.distance && (
                  <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {displayGarage.distance} km away
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={`font-semibold ${garageIsOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {garageIsOpen ? 'Open Now' : 'Closed'}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowTimeMenu(!showTimeMenu)}
                    className={`flex items-center space-x-1 ${theme === 'light' ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}
                  >
                    <span>{selectedTime}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  
                  {showTimeMenu && (
                    <div className={`absolute top-full right-0 mt-1 ${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'} border rounded-lg shadow-lg z-30 min-w-32`}>
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setSelectedTime(time);
                            setShowTimeMenu(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${theme === 'light' ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-gray-700 text-white'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`border-t pt-3 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (isAuthenticated()) {
                        navigate(`/booking?garageId=${id || garageFromState?.id}&serviceType=washing-detailing`);
                      } else {
                        navigate('/login', { state: { returnTo: `/washing-detailing/${id || garageFromState?.id}` } });
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-1"
                  >
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>Book Now</span>
                  </button>
                  
                  <a
                    href={`tel:${getSanitizedPhone()}`}
                    className={`flex-1 border py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100 text-gray-700' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                  >
                    <PhoneIcon className="w-4 h-4" />
                    <span>Call</span>
                  </a>
                  
                  <button
                    onClick={handleDirectionClick}
                    className={`flex-1 border py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100 text-gray-700' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                  >
                    <MapPinIcon className="w-4 h-4" />
                    <span>Direction</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Desktop Call Modal */}
          {isCallModalOpen && (
            <div className="hidden lg:flex fixed inset-0 z-30 items-center justify-center">
              <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setIsCallModalOpen(false)}></div>
              <div className={`relative ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'} border rounded-xl shadow-2xl p-6 w-80`}>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Call Garage</h3>
                <p className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Phone number</p>
                <div className={`${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-800 text-white'} px-3 py-2 rounded-md font-mono text-sm mb-4 select-all`}>
                  {getSanitizedPhone()}
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium"
                    onClick={() => {
                      const num = getSanitizedPhone();
                      if (num) {
                        window.location.href = `tel:${num}`;
                      }
                      setIsCallModalOpen(false);
                    }}
                  >
                    Call
                  </button>
                  <button
                    className={`flex-1 border py-2 rounded-lg font-medium ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100 text-gray-700' : 'border-gray-600 hover:bg-gray-800 text-gray-200'}`}
                    onClick={() => setIsCallModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Sections */}
        <div className="content-sections-container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* About Section */}
          {selectedTab === 'about' && (
            <div ref={aboutRef} className="space-y-4 sm:space-y-6 md:space-y-8">
              {/* Hero Section */}
              <div className={`rounded-xl p-4 sm:p-6 md:p-8 border ${
                theme === 'light' 
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' 
                  : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700'
              }`}>
                <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faTools} className="text-lg sm:text-xl md:text-2xl text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1 sm:mb-2">
                      <h3 className={`text-lg sm:text-xl md:text-xl font-bold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{displayGarage?.name}</h3>
                      {(displayGarage?.is_verified || garageFromState?.is_verified) && (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          Verified <FontAwesomeIcon icon={faCheck} className="ml-1" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(displayGarage?.rating || 4.5) 
                                ? 'text-yellow-400 fill-current' 
                                : theme === 'light' ? 'text-gray-300' : 'text-gray-600'
                            }`}
                          />
                        ))}
                        <span className={`ml-2 text-xs sm:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>({displayGarage?.reviewCount || 0} reviews)</span>
                      </div>
                      {displayGarage?.verified && (
                        <span className={`text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
                          theme === 'light' ? 'bg-green-100 text-green-800' : 'bg-green-900 text-green-300'
                        }`}>
                          ✓ Verified Partner
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className={`text-sm sm:text-base md:text-base leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {displayGarage?.description || "Professional automotive service center providing comprehensive maintenance and repair services for all types of vehicles. Our experienced technicians ensure quality service and customer satisfaction."}
                </p>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className={`rounded-lg p-4 sm:p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                      <FontAwesomeIcon icon={faShieldAlt} className="text-white text-sm sm:text-base" />
                    </div>
                    <h4 className={`font-semibold text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Quality Service</h4>
                  </div>
                  <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Professional-grade equipment and certified technicians for superior results</p>
                </div>
                
                <div className={`rounded-lg p-4 sm:p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                      <FontAwesomeIcon icon={faClock} className="text-white text-sm sm:text-base" />
                    </div>
                    <h4 className={`font-semibold text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Quick Service</h4>
                  </div>
                  <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Fast turnaround times with same-day service options available</p>
                </div>
                
                <div className={`rounded-lg p-4 sm:p-6 border sm:col-span-2 md:col-span-1 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                      <FontAwesomeIcon icon={faWrench} className="text-white text-sm sm:text-base" />
                    </div>
                    <h4 className={`font-semibold text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Expert Team</h4>
                  </div>
                  <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Certified professionals with years of experience in automotive repair</p>
                </div>
              </div>

              {/* Contact & Location Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <h4 className={`text-lg sm:text-xl md:text-xl font-semibold mb-3 sm:mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Contact Information</h4>
                  
                  <div className={`rounded-lg p-4 sm:p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <FontAwesomeIcon icon={faMapPin} className="text-red-500 w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold mb-1 text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Location</p>
                        <p className={`text-xs sm:text-sm md:text-sm break-words ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{displayGarage?.address || 'Address not available'}</p>
                        {displayGarage?.distance && (
                          <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>{displayGarage.distance}km from your location</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {operatingHours && operatingHours.length > 0 && (
                    <div className={`rounded-lg p-4 sm:p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <FontAwesomeIcon icon={faClock} className="text-red-500 w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold mb-1 text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Operating Hours</p>
                          <div className="space-y-1">
                            {operatingHours.map((hours, index) => (
                              <div key={index} className={`flex justify-between text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                <span>{hours.day}</span>
                                <span>{hours.time}</span>
                              </div>
                            ))}
                          </div>
                          <p className={`text-xs mt-1 ${garageIsOpen ? 'text-green-600' : 'text-red-600'}`}>
                            ● {garageIsOpen ? 'Currently Open' : 'Currently Closed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <h4 className={`text-lg sm:text-xl md:text-xl font-semibold mb-3 sm:mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Garage Details</h4>
                  
                  {displayGarage?.brands && displayGarage.brands.length > 0 && (
                    <div className={`rounded-lg p-4 sm:p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                      <div className="mb-3 sm:mb-4">
                        <span className={`font-semibold text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Supported Brands</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {displayGarage.brands.map((brand, index) => (
                          <span
                            key={index}
                            className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm md:text-sm ${
                              theme === 'light' ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-300'
                            }`}
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className={`rounded-lg p-4 sm:p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                    <div className="mb-3 sm:mb-4">
                      <span className={`font-semibold text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Service Types</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                      <div className={`flex items-center text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <FontAwesomeIcon icon={faCheck} className="text-green-600 w-3 h-3 mr-2" />
                        General Service
                      </div>
                      <div className={`flex items-center text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <FontAwesomeIcon icon={faCheck} className="text-green-600 w-3 h-3 mr-2" />
                        Engine Repair
                      </div>
                      <div className={`flex items-center text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <FontAwesomeIcon icon={faCheck} className="text-green-600 w-3 h-3 mr-2" />
                        Tire Service
                      </div>
                      <div className={`flex items-center text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <FontAwesomeIcon icon={faCheck} className="text-green-600 w-3 h-3 mr-2" />
                        Battery Service
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Section */}
          {selectedTab === 'services' && (
            <div ref={servicesRef} className="space-y-4 sm:space-y-6 md:space-y-8">
              <div className="mb-4 sm:mb-6">
                <h3 className={`text-lg sm:text-xl md:text-xl font-bold mb-1 sm:mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Available Services</h3>
                <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Explore our comprehensive range of vehicle services</p>
              </div>
              
              {/* Regular Services from API - Only show if data exists */}
              {displayGarage?.services?.service && displayGarage.services.service.length > 0 ? (
                displayGarage.services.service.map((serviceType, index) => {
                const [engineType] = Object.keys(serviceType);
                const serviceList = serviceType[engineType];

                return (
                  <div key={index} className="mb-6 sm:mb-8">
                    <div className="flex items-center mb-4 sm:mb-5 pb-2 sm:pb-3 border-b-2 border-red-500/20">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-red-500/30">
                        <FontAwesomeIcon icon={faTools} className="text-white text-base sm:text-xl md:text-2xl" />
                      </div>
                      <div>
                        <h3 className={`text-base sm:text-lg md:text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{engineType}</h3>
                        <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{serviceList?.length || 0} services available</p>
                    </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                      {serviceList?.map((item, idx) => (
                        <div
                          key={idx}
                          className={`group rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                            theme === 'light'
                              ? 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-red-400 hover:shadow-red-100'
                              : 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700 hover:border-red-500 hover:shadow-red-900/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                              <div className="min-w-0 flex-1">
                              <h4 className={`font-bold text-sm sm:text-base md:text-base mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{item.name}</h4>
                                {item.description && (
                                <p className={`text-xs sm:text-sm md:text-sm leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{item.description}</p>
                                )}
                              </div>
                            </div>
                          <div className={`flex items-center justify-between pt-2 sm:pt-3 border-t ${
                            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                          }`}>
                            <span className={`text-xs sm:text-sm md:text-sm font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Starting from</span>
                            <div className="flex items-baseline space-x-1">
                              <span className={`text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r ${
                                theme === 'light'
                                  ? 'from-red-600 to-red-700 bg-clip-text text-transparent'
                                  : 'from-red-400 to-red-500 text-red-400'
                              }`}>₹{item.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
                })
              ) : (
                <div className={`rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 text-center border-2 ${theme === 'light' ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200' : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'}`}>
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center ${
                    theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'
                  }`}>
                    <FontAwesomeIcon icon={faTools} className={`text-3xl sm:text-4xl md:text-5xl ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <h4 className={`text-base sm:text-lg md:text-lg font-bold mb-1 sm:mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>No Services Available</h4>
                  <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Services for this garage will be available soon.</p>
                </div>
              )}

              {/* Add-on Services from API */}
              {displayGarage?.services?.addon && displayGarage.services.addon.length > 0 && (
                <div className={`border-t-2 pt-6 sm:pt-8 md:pt-10 mt-6 sm:mt-8 md:mt-10 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                  <div className="flex items-center mb-4 sm:mb-6 md:mb-8 pb-2 sm:pb-3 border-b-2 border-purple-500/20">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-purple-500/30">
                      <FontAwesomeIcon icon={faStar} className="text-white text-base sm:text-xl md:text-2xl" />
                    </div>
                    <div>
                      <h3 className={`text-base sm:text-lg md:text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Premium Add-on Services</h3>
                      <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Enhance your service experience</p>
                    </div>
                  </div>
                  {displayGarage.services.addon.map((serviceType, index) => {
                    const [engineType] = Object.keys(serviceType);
                    const serviceList = serviceType[engineType];

                    return (
                      <div key={index} className="mb-6 sm:mb-8">
                        <h4 className={`text-sm sm:text-base md:text-base font-semibold mb-3 sm:mb-4 md:mb-5 ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}>{engineType}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                          {serviceList?.map((item, idx) => (
                            <div
                              key={idx}
                              className={`group rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                                theme === 'light'
                                  ? 'bg-gradient-to-br from-purple-50 via-purple-50/50 to-white border-purple-200 hover:border-purple-400 hover:shadow-purple-100'
                                  : 'bg-gradient-to-br from-purple-900/40 via-purple-900/20 to-gray-800 border-purple-600/50 hover:border-purple-500 hover:shadow-purple-900/20'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2 sm:mb-3">
                                  <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className={`font-bold text-sm sm:text-base md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{item.name}</h4>
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      theme === 'light'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-purple-900/50 text-purple-300'
                                    }`}>Premium</span>
                                  </div>
                                  <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Enhance your service experience</p>
                                </div>
                                </div>
                              <div className={`flex items-center justify-between pt-2 sm:pt-3 border-t ${
                                theme === 'light' ? 'border-purple-200' : 'border-purple-700/50'
                              }`}>
                              <div className="flex items-center space-x-2">
                                  <FontAwesomeIcon icon={faCheck} className={`w-3 h-3 sm:w-4 sm:h-4 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
                                  <span className={`text-xs sm:text-sm md:text-sm font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Add-on price</span>
                                </div>
                                <div className="flex items-baseline space-x-1">
                                  <span className={`text-lg sm:text-xl md:text-2xl font-bold ${
                                    theme === 'light'
                                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent'
                                      : 'text-purple-400'
                                  }`}>₹{item.price}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reviews Section */}
          {selectedTab === 'reviews' && (
            <div ref={reviewsRef} className="space-y-4 sm:space-y-6 md:space-y-8">
              {/* Review Summary */}
              <div className={`rounded-xl p-4 sm:p-6 md:p-8 border ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                  : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                  <div>
                    <h3 className={`text-lg sm:text-xl md:text-xl font-bold mb-1 sm:mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Customer Reviews</h3>
                    <p className={`text-sm sm:text-base md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>What our customers say about us</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex items-center mb-1 sm:mb-2">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            i < Math.floor(displayGarage?.rating || 4.5) 
                              ? 'text-yellow-400 fill-current' 
                              : theme === 'light' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className={`ml-2 font-bold text-lg sm:text-xl md:text-xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{displayGarage?.rating || 4.5}</span>
                    </div>
                    <p className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{displayGarage?.reviews?.length || displayGarage?.reviewCount || 0} reviews</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-2xl font-bold text-green-600 mb-1">98%</div>
                    <div className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Satisfaction Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-2xl font-bold text-blue-600 mb-1">{displayGarage?.rating || 4.5}</div>
                    <div className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-2xl font-bold text-purple-600 mb-1">2.5k+</div>
                    <div className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Happy Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-2xl font-bold text-red-600 mb-1">95%</div>
                    <div className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Return Customers</div>
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div>
                <h4 className={`text-lg sm:text-xl md:text-xl font-semibold mb-4 sm:mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Recent Reviews</h4>
                {displayGarage?.reviews?.length === 0 || !displayGarage?.reviews ? (
                  <div className={`rounded-xl p-8 sm:p-12 text-center border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                    <FontAwesomeIcon icon={faStar} className={`text-4xl sm:text-5xl mb-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'}`} />
                    <p className={`text-base sm:text-base md:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>No reviews available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {displayGarage.reviews.map((review, index) => {
                      const reviewName = review.name || 'Anonymous';
                      const initials = reviewName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      
                      return (
                        <div key={index} className={`rounded-xl p-4 sm:p-6 border transition-all ${
                          theme === 'light'
                            ? 'bg-white border-gray-200 hover:border-red-500'
                            : 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 hover:border-red-500'
                        }`}>
                          <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                <h5 className={`font-semibold text-sm sm:text-base md:text-base truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{reviewName}</h5>
                                <span className={`text-xs sm:text-sm md:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>{review.date || 'Recently'}</span>
                              </div>
                              <div className="flex items-center mb-2 sm:mb-3">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < (review.rating || 5) 
                                        ? 'text-yellow-400 fill-current' 
                                        : theme === 'light' ? 'text-gray-300' : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className={`leading-relaxed text-sm sm:text-base md:text-sm mb-3 sm:mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                            {review.comment || review.review || 'No comment provided'}
                          </p>
                          
                          <div className={`pt-3 sm:pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <button className={`flex items-center space-x-1 transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-red-600' : 'text-gray-400 hover:text-red-400'}`}>
                                  <FontAwesomeIcon icon={faStar} className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="text-xs sm:text-sm">Helpful</span>
                                </button>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Verified Customer</span>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-600 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default WashingCenterInfoPage;
