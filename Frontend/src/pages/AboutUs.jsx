import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAuthenticated } from '../services/authService';
import { useLoginPopup } from '../components/context/LoginPopupContext';
import { useTheme } from '../components/context/ThemeContext';
import { ColorPalette, BackgroundGradients } from '../constants/designSystem';
import { 
  faUsers,
  faMapMarkerAlt,
  faCalendarAlt,
  faTools,
  faSearch,
  faCog,
  faStar,
  faCheck,
  faShieldAlt,
  faClock,
  faMedal,
  faRocket,
  faHeart,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

const AboutUs = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showLogin } = useLoginPopup();
  const [selectedCity, setSelectedCity] = useState(sessionStorage.getItem('selectedCity') || 'Pune');

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
  }, []);

  const handleBookNow = () => {
    if (isAuthenticated()) {
      navigate('/');
    } else {
      showLogin();
    }
  };

  const stats = [
    { number: '25,000+', label: 'Happy Customers', icon: faUsers },
    { number: '150+', label: 'Cities Served', icon: faMapMarkerAlt },
    { number: '8+', label: 'Years Experience', icon: faCalendarAlt },
    { number: '500+', label: 'Partner Garages', icon: faTools }
  ];

  const services = [
    {
      name: "Inspection Service",
      description: "Comprehensive vehicle inspection to identify issues and maintenance needs",
      icon: faSearch,
      image: "https://images.unsplash.com/photo-1570129476815-ba368ac77013?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1350&q=80",
      features: ["Full diagnostic check", "Safety assessment", "Performance evaluation", "Detailed report"]
    },
    {
      name: "General Service",
      description: "Basic maintenance service to keep your vehicle in optimal condition",
      icon: faCog,
      image: "https://plus.unsplash.com/premium_photo-1661779071501-629999b46de0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1350&q=80",
      features: ["Oil change", "Brake inspection", "Tire pressure check", "Engine tuning"]
    },
    {
      name: "Combo Service",
      description: "Complete premium service package for thorough vehicle maintenance",
      icon: faStar,
      image: "https://plus.unsplash.com/premium_photo-1661750362435-00f8fef16292?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1350&q=80",
      features: ["Full cleaning", "Component replacement", "Advanced tuning", "1 month warranty"]
    }
  ];

  const values = [
    {
      title: "Reliability",
      description: "We connect you with verified, trusted garages that deliver consistent, high-quality automotive services.",
      icon: faShieldAlt,
      gradient: ColorPalette.benefits.verified.gradient
    },
    {
      title: "Transparency",
      description: "Clear pricing, detailed service breakdowns, and honest communication throughout your vehicle service journey.",
      icon: faCheckCircle,
      gradient: ColorPalette.benefits.pricing.gradient
    },
    {
      title: "Convenience",
      description: "Book services online, track progress in real-time, and get your vehicle serviced at your preferred location.",
      icon: faClock,
      gradient: ColorPalette.benefits.updates.gradient
    },
    {
      title: "Quality",
      description: "We partner only with certified garages that meet our strict standards for service quality and customer satisfaction.",
      icon: faMedal,
      gradient: ColorPalette.benefits.reviews.gradient
    }
  ];

  const benefits = [
    {
      title: "Verified Garages",
      description: "All garages are verified and quality-checked",
      icon: faShieldAlt,
      gradient: ColorPalette.benefits.verified.gradient,
      stats: "500+ Verified"
    },
    {
      title: "Transparent Pricing",
      description: "No hidden costs, clear service breakdowns",
      icon: faCheckCircle,
      gradient: ColorPalette.benefits.pricing.gradient,
      stats: "0 Hidden Fees"
    },
    {
      title: "All Vehicle Types",
      description: "2 wheelers, 4 wheelers, and commercial vehicles",
      icon: faTools,
      gradient: ColorPalette.benefits.vehicleTypes.gradient,
      stats: "4 Vehicle Types"
    },
    {
      title: "Real-time Updates",
      description: "Track your service progress live",
      icon: faClock,
      gradient: ColorPalette.benefits.updates.gradient,
      stats: "Live Tracking"
    },
    {
      title: "Customer Reviews",
      description: "Read genuine reviews from other customers",
      icon: faStar,
      gradient: ColorPalette.benefits.reviews.gradient,
      stats: "10K+ Reviews"
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock customer assistance",
      icon: faHeart,
      gradient: ColorPalette.benefits.support.gradient,
      stats: "24/7 Available"
    }
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
      <Header 
        selectedCity={selectedCity} 
        onCityChange={setSelectedCity}
      />

      {/* Hero Section */}
      <section className={`relative -mt-16 py-12 md:py-16 lg:py-20 px-4 flex items-center justify-center overflow-hidden ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            <span className={`bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>
              REDEFINING
            </span>
            <br />
            <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>VEHICLE CARE</span>
          </h1>
          <p className={`text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            At ServX24, we make vehicle ownership simpler with online garages, roadside assistance, trusted servicing, and EV support—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button 
              onClick={handleBookNow}
              className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
            >
              <span className="relative z-10">EXPLORE OUR SERVICES</span>
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
            </button>
            <button 
              onClick={() => navigate('/')}
              className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl border-2 border-cyan-400 text-cyan-400 hover:text-white hover:bg-cyan-400"
            >
              <span className="relative z-10">FIND A GARAGE</span>
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.neutral : BackgroundGradients.dark.neutral}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Why Choose Our Platform
            </h2>
            <p className={`text-sm md:text-base lg:text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Trusted by thousands of vehicle owners across India
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group relative flex"
              >
                <div className={`relative rounded-xl p-4 md:p-6 text-center transition-all duration-500 transform group-hover:scale-105 w-full flex flex-col h-full ${
                  theme === 'light'
                    ? 'bg-transparent border border-gray-200 hover:border-gray-300'
                    : 'bg-transparent border border-gray-700 hover:border-gray-600'
                }`}>
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                  <div className="flex justify-center mb-2 md:mb-4 flex-shrink-0">
                    <div className={`relative inline-flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} shadow-lg transition-all duration-500`}>
                      <FontAwesomeIcon icon={benefit.icon} className="text-lg md:text-2xl text-white" />
                    </div>
                  </div>

                  <h3 className={`text-sm md:text-lg font-semibold mb-1 md:mb-2 flex-shrink-0 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {benefit.title}
                  </h3>
                  <p className={`text-xs md:text-sm mb-3 md:mb-4 flex-grow ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {benefit.description}
                  </p>

                  <div className="mt-auto flex-shrink-0">
                    <div className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-semibold inline-block ${
                      theme === 'light' ? 'bg-gray-100 text-gray-700' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {benefit.stats}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.neutral : BackgroundGradients.dark.neutral}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Top Quality Services at the Best Prices
            </h2>
            <p className={`text-sm md:text-base lg:text-lg ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Powered by Our Trusted Partners
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className={`group relative rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                  theme === 'light' 
                    ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl' 
                    : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl'
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${ColorPalette.primary.gradient} flex items-center justify-center shadow-lg`}>
                      <FontAwesomeIcon icon={service.icon} className="text-white text-2xl" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {service.name}
                  </h3>
                  <p className={`mb-4 text-sm md:text-base ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className={`flex items-center text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={handleBookNow}
                    className="w-full group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 py-3 px-6 rounded-xl font-semibold text-sm md:text-base text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
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

      {/* Stats Section */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center"
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${ColorPalette.primary.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <FontAwesomeIcon icon={stat.icon} className="text-white text-lg md:text-2xl" />
                </div>
                <div className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>
                  {stat.number}
                </div>
                <div className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center mb-4 md:mb-6">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-r ${ColorPalette.primary.gradient} flex items-center justify-center mr-3 md:mr-4`}>
                  <FontAwesomeIcon icon={faRocket} className="text-white text-lg md:text-2xl" />
                </div>
                <h2 className={`text-2xl md:text-4xl lg:text-5xl font-bold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Our <span className={`bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>Mission</span>
                </h2>
              </div>
              <div className={`space-y-4 md:space-y-6 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed">
                  At ServX24, we're redefining how people take care of their vehicles with our online garage platform.
                </p>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed">
                  Our mission is to make it easy for users to find the nearest garage, access trusted partner garages, get reliable roadside assistance, and book all types of vehicle servicing, including EV maintenance.
                </p>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed">
                  We also provide a safe and convenient space to buy and sell vehicles—making ServX24 your one-stop solution for smarter, hassle-free vehicle care.
                </p>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="mt-6 md:mt-8 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
              >
                <span className="relative z-10">Learn More</span>
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
              </button>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <img 
                  src="https://images.pexels.com/photos/13065690/pexels-photo-13065690.jpeg" 
                  alt="ServX24 Mission"
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.neutral : BackgroundGradients.dark.neutral}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Our Values
            </h2>
            <p className={`text-sm md:text-base lg:text-lg ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value, index) => (
              <div 
                key={index} 
                className={`group relative rounded-2xl p-6 text-center transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                  theme === 'light' 
                    ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl' 
                    : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl'
                }`}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className="flex justify-center mb-4 flex-shrink-0 relative z-10">
                  <div className={`relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${value.gradient} shadow-lg group-hover:shadow-xl transition-all duration-500`}>
                    <FontAwesomeIcon 
                      icon={value.icon} 
                      className="text-2xl text-white" 
                    />
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-3 flex-shrink-0 relative z-10 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {value.title}
                </h3>
                <p className={`text-sm md:text-base leading-relaxed relative z-10 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Join the ServX24 Revolution
          </h2>
          <p className={`text-base md:text-lg mb-6 md:mb-8 max-w-3xl mx-auto ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Experience the difference of professional automotive service with ServX24. Find trusted garages, book services, or become a partner today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button 
              onClick={() => navigate('/')}
              className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
            >
              <span className="relative z-10">Explore</span>
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl border-2 border-cyan-400 text-cyan-400 hover:text-white hover:bg-cyan-400"
            >
              <span className="relative z-10">Contact Us</span>
            </button>
          </div>
        </div>
      </section>

      

    </div>
  );
};

export default AboutUs;
