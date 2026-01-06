import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ColorPalette, BackgroundGradients } from '../../constants/designSystem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck,
  faRocket,
  faUsers,
  faAward,
  faHeart
} from '@fortawesome/free-solid-svg-icons';

const HomeContent = () => {
  const { theme } = useTheme();

  const handleExploreClick = () => {
    const element = document.getElementById('services-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLearnMoreClick = () => {
    const missionSection = document.querySelector('[data-mission-section]');
    if (missionSection) {
      missionSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const handleGetStartedClick = () => {
    const servicesSection = document.getElementById('services-section');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    "Verified garage network for all vehicle types",
    "Transparent pricing with detailed cost breakdowns",
    "Real-time service tracking and updates",
    "Support for 2, 4, and 6 wheelers",
    "24/7 customer support and assistance",
    "Quality assured service guarantee"
  ];

  const stats = [
    { number: "50,000+", label: "Happy Customers", icon: faUsers },
    { number: "500+", label: "Verified Garages", icon: faAward },
    { number: "4.8/5", label: "Customer Rating", icon: faHeart },
    { number: "24/7", label: "Support Available", icon: faCheck }
  ];

  return (
    <>
      {/* Marketing Section */}
      <section className={`py-4 md:py-6 lg:py-8 px-4 relative ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-2 leading-tight ${
                theme === 'light' 
                  ? 'text-gray-900' 
                  : 'text-white'
              }`}>
                Your Vehicle,{' '}
                <span className={`bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>
                  Our Priority
                </span>
              </h2>
              <p className={`text-sm md:text-base leading-relaxed mb-6 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Whether you drive a bike, car, or commercial vehicle, we connect you with the best garages in your area. 
                Get transparent pricing, verified mechanics, and quality service for all vehicle types.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button 
                  onClick={handleExploreClick}
                  className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold text-xs md:text-base text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  aria-label="Explore our services"
                >
                  <span className="relative z-10">EXPLORE SERVICES</span>
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
                </button>
                <button 
                  onClick={handleLearnMoreClick}
                  className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold text-xs md:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl border-2 border-cyan-400 text-cyan-400 hover:text-white hover:bg-cyan-400"
                  aria-label="Learn more about our platform"
                >
                  <span className="relative z-10">LEARN MORE</span>
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <img
                  src="https://images.pexels.com/photos/13065690/pexels-photo-13065690.jpeg"
                  alt="Professional garage service with mechanics working on vehicles"
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Features Section */}
      <section className={`pt-4 pb-12 md:pt-6 md:pb-20 lg:pt-8 lg:pb-24 px-4 relative ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`} data-mission-section>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex flex-col md:flex-row items-center justify-center mb-4">
              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-r ${ColorPalette.primary.gradient} flex items-center justify-center mb-2 md:mb-0 md:mr-3`}>
                <FontAwesomeIcon icon={faRocket} className="text-white text-lg md:text-2xl" />
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Our Mission
              </h2>
            </div>
            
            <p className={`max-w-4xl mx-auto text-sm md:text-base leading-relaxed ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Revolutionizing how vehicle owners find and connect with trusted garages. 
              Transparent pricing, verified quality, and seamless service for all your vehicle needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
            <div className="space-y-4 md:space-y-6">
              <div className={`rounded-xl p-3 md:p-4 ${
                theme === 'light' 
                  ? 'bg-white shadow-xl border border-gray-200' 
                  : 'bg-gray-800 shadow-xl border border-gray-700'
              }`}>
                <div className="space-y-2 md:space-y-3">
                  <p className={`text-xs md:text-sm leading-relaxed ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    Whether you own a bike, car, or commercial vehicle, our platform makes it easy to find 
                    verified garages near you with transparent pricing and quality-assured service.
                  </p>
                  
                  <p className={`text-xs md:text-sm leading-relaxed ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    Our comprehensive verification system ensures every garage meets high standards for 
                    quality, reliability, and customer service. We understand that your vehicle is 
                    essential for your daily life and business.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 pt-3 md:pt-4 mt-3 md:mt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center`}>
                      <FontAwesomeIcon icon={faUsers} className="text-blue-600 dark:text-blue-400 text-sm md:text-lg" />
                    </div>
                    <div>
                      <div className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Trusted Community
                      </div>
                      <div className={`text-[10px] md:text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Thousands served
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center`}>
                      <FontAwesomeIcon icon={faAward} className="text-yellow-600 dark:text-yellow-400 text-sm md:text-lg" />
                    </div>
                    <div>
                      <div className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Quality Assured
                      </div>
                      <div className={`text-[10px] md:text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Verified excellence
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {stats.map((stat, index) => (
                  <div 
                    key={index}
                    className={`text-center p-3 md:p-4 rounded-xl transition-all duration-500 transform hover:scale-105 ${
                      theme === 'light' 
                        ? 'bg-white shadow-xl hover:shadow-2xl border border-gray-200' 
                        : 'bg-gray-800 shadow-xl hover:shadow-2xl border border-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r ${ColorPalette.primary.gradient} flex items-center justify-center mx-auto mb-2`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-white text-sm md:text-lg" />
                    </div>
                    <div className={`text-sm md:text-base font-bold mb-1 bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>
                      {stat.number}
                    </div>
                    <div className={`text-[10px] md:text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className={`relative rounded-xl p-4 md:p-6 h-full ${
                theme === 'light' 
                  ? 'bg-gradient-to-br from-white to-blue-50 shadow-xl border border-gray-200' 
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl border border-gray-700'
              }`}>
                <div className={`absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${ColorPalette.primary.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8 md:-translate-y-10 md:translate-x-10`}></div>
                <div className={`absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${ColorPalette.secondary.gradient} opacity-10 rounded-full translate-y-8 -translate-x-8 md:translate-y-10 md:-translate-x-10`}></div>
                
                <div className="flex items-center mb-4 md:mb-6">
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-r ${ColorPalette.secondary.gradient} flex items-center justify-center mr-2 md:mr-3`}>
                    <FontAwesomeIcon icon={faHeart} className="text-white text-lg md:text-2xl" />
                  </div>
                  <h3 className={`text-sm md:text-lg font-semibold ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    Why Choose Us
                  </h3>
                </div>
                
                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  {features.map((feature, index) => (
                    <li 
                      key={index}
                      className="flex items-start group"
                    >
                      <div className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-r ${ColorPalette.success.gradient} flex items-center justify-center mr-2 md:mr-3 mt-0.5 group-hover:scale-110 transition-transform duration-300`}>
                        <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
                      </div>
                      <span className={`text-xs md:text-sm pt-0.5 group-hover:translate-x-2 transition-transform duration-300 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="text-center pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={handleGetStartedClick}
                    className="group relative overflow-hidden w-full max-w-sm mx-auto focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 py-2 px-4 md:py-3 md:px-6 rounded-xl font-semibold text-xs md:text-base"
                    aria-label="Get started with our platform"
                  >
                    <span className="relative z-10">GET STARTED TODAY</span>
                    <div className={`absolute inset-0 bg-gradient-to-r ${ColorPalette.primary.gradient} group-hover:opacity-90 transition-all duration-300`}></div>
                  </button>
                  <p className={`mt-2 md:mt-3 text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Join thousands of satisfied vehicle owners
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomeContent;

