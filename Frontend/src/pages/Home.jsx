import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerCarousel from '../components/homeComponents/BannerCarousel';
import ServiceCategories from '../components/homeComponents/ServiceCategories';
import CustomerReviews from '../components/homeComponents/CustomerReviews';
import HomeContent from '../components/homeComponents/HomeContent';
import { fetchLandingPageData } from '../services/landingpage';
import { useTheme } from '../components/context/ThemeContext';
import { ColorPalette, BackgroundGradients } from '../constants/designSystem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faCog, 
  faStar, 
  faCheck,
  faWrench
} from '@fortawesome/free-solid-svg-icons';
import { isAuthenticated } from '../services/authService';
import { useLoginPopup } from '../components/context/LoginPopupContext';

const Home = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showLogin } = useLoginPopup();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const servicesRef = useRef(null);

  useEffect(() => {
    // Fetch landing page data
    const loadLandingPageData = async () => {
      try {
        const storedCity = sessionStorage.getItem('selectedCity');
        // Handle null, undefined, or string "null"
        const selectedCity = (storedCity && storedCity !== 'null' && storedCity.trim() !== '') 
          ? storedCity 
          : 'Pune';
        const data = await fetchLandingPageData(selectedCity);
        
        if (data && data.banners) {
          setBanners(data.banners);
        }
      } catch (error) {
        console.error('Error loading landing page data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLandingPageData();
  }, []);

  const handleFindGaragesClick = () => {
    if (servicesRef.current && servicesRef.current.openVehicleModal) {
      servicesRef.current.openVehicleModal();
    } else {
      // Fallback: scroll to services section
      const servicesSection = document.getElementById('services-section');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBookNow = () => {
    if (isAuthenticated()) {
      navigate('/');
    } else {
      showLogin();
    }
  };

  const handleScrollToServices = () => {
    const servicesSection = document.getElementById('services-section');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookNowToGarage = () => {
    // Set vehicle type to two-wheeler in sessionStorage
    sessionStorage.setItem('selectedVehicleType', 'two-wheeler');
    // Navigate to garage listing page with two-wheeler selected
    navigate('/garage?vehicleType=two-wheeler');
  };

  const services = [
    {
      name: "Inspection Service",
      description: "Comprehensive vehicle inspection to identify issues and maintenance needs",
      icon: faSearch,
      image: "https://images.unsplash.com/photo-1570129476815-ba368ac77013?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1350&q=80",
      features: ["Full diagnostic check", "Safety assessment"]
    },
    {
      name: "General Service",
      description: "Basic maintenance service to keep your vehicle in optimal condition",
      icon: faCog,
      image: "https://plus.unsplash.com/premium_photo-1661779071501-629999b46de0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1350&q=80",
      features: ["Oil change", "Brake inspection"]
    },
    {
      name: "Combo Service",
      description: "Complete premium service package for thorough vehicle maintenance",
      icon: faStar,
      image: "https://plus.unsplash.com/premium_photo-1661750362435-00f8fef16292?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1350&q=80",
      features: ["Full cleaning", "Advanced tuning"]
    },
    {
      name: "Repair Service",
      description: "Expert repair services for all vehicle types and issues",
      icon: faWrench,
      image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1350&q=80",
      features: ["Expert mechanics", "Quality parts"]
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
      <BannerCarousel banners={banners} onFindGaragesClick={handleFindGaragesClick} />
      <ServiceCategories ref={servicesRef} />
      <CustomerReviews />
      
      {/* Top Quality Services Section */}
      <section className={`py-8 md:py-12 lg:py-16 px-4 relative ${theme === 'light' ? BackgroundGradients.light.neutral : BackgroundGradients.dark.neutral}`}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Top Quality Services at the Best Prices
            </h2>
            <p className={`text-xs md:text-sm lg:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Powered by Our Trusted Partners
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {services.map((service, index) => (
              <div 
                key={index} 
                className={`group relative rounded-xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:shadow-xl flex flex-col ${
                  theme === 'light' 
                    ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg' 
                    : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-lg'
                }`}
              >
                <div className="relative h-24 overflow-hidden flex-shrink-0">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ColorPalette.primary.gradient} flex items-center justify-center shadow-lg`}>
                      <FontAwesomeIcon icon={service.icon} className="text-white text-xs" />
                    </div>
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className={`text-sm font-bold mb-1.5 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {service.name}
                  </h3>
                  <p className={`mb-2 text-xs leading-tight ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    {service.description}
                  </p>
                  <ul className="space-y-1 mb-3 flex-grow">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className={`flex items-center text-xs ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-1.5 flex-shrink-0 text-xs" />
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={handleBookNowToGarage}
                    className="w-full mt-auto group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 py-1.5 px-3 rounded-lg font-semibold text-xs text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
                  >
                    <span className="relative z-10">Book Now</span>
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeContent />
    </div>
  );
};

export default Home;

