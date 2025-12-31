import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, MapPinIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/solid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { isAuthenticated } from '../../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useLoginPopup } from '../context/LoginPopupContext';

const GarageCard = ({ garage, onClick, isExpanded = false, setCurrentPage }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showLogin } = useLoginPopup();
  
  const handleBookNow = (e) => {
    e.stopPropagation(); // Prevent card click event
    console.log("Book Now clicked for garage:", garage.id, garage.name);
    
    // Check if user is authenticated
    if (isAuthenticated()) {
      console.log("✅ User is authenticated, navigating to booking with garageId:", garage.id);
      navigate("/booking", { 
        state: { garageId: garage.id } 
      });
    } else {
      console.log("❌ User not authenticated, showing login popup");
      showLogin(garage.id, `/booking?garageId=${garage.id}`);
    }
  };
  
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400' : theme === 'light' ? 'text-gray-300' : 'text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer flex flex-col h-full ${
        theme === 'light' 
          ? 'bg-white/80 backdrop-blur-xl border border-gray-200/50 hover:border-red-300/50 shadow-lg hover:shadow-2xl' 
          : 'bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 hover:border-red-500/50 shadow-xl hover:shadow-2xl'
      } ${
        isExpanded ? 'ring-2 ring-red-500/50 shadow-2xl' : ''
      } transform hover:scale-[1.02] hover:-translate-y-1`}
      onClick={() => onClick(garage)}
    >
      {/* Premium gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/3 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none z-0`}></div>
      
      {/* Image section with premium overlay */}
      <div className="relative overflow-hidden h-56 md:h-64 bg-gray-100 dark:bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 z-10"></div>
        <img
          src={garage.image}
          alt={garage.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Premium distance badge */}
        <div className="absolute bottom-3 left-3 z-20 backdrop-blur-md bg-black/60 border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl">
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5" />
          {garage.distance}km away
          </span>
        </div>
        {/* Premium verified badge overlay */}
        {garage.is_verified && (
          <div className="absolute top-3 right-3 z-20 group/badge">
            <div className="relative backdrop-blur-lg bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 border border-white/40 text-white px-2 py-1 rounded-lg flex items-center gap-1 transform transition-all duration-300 hover:scale-105 overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-1000 rounded-lg"></div>
              {/* Icon */}
              <div className="relative z-10">
                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4" />
              </div>
              {/* Text */}
              <span className="relative z-10 text-[10px] font-extrabold tracking-wide">VERIFIED</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-2.5 py-2 md:px-3 md:py-2 flex flex-col relative z-10">
        {/* Header section */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h3 className={`text-base md:text-lg font-bold mb-0.5 line-clamp-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {garage.name}
            </h3>
            {/* Rating with premium styling */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {renderStars(garage.rating)}
              </div>
              <span className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                {garage.rating}
              </span>
              <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                • Excellent
              </span>
          </div>
          </div>
        </div>
        
        {/* Fixed height content section */}
        <div className="flex flex-col">
          <div className={`flex items-start gap-1.5 text-xs md:text-sm mb-0.5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            <MapPinIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
            <span className="line-clamp-1 font-medium">{garage.location}</span>
        </div>
        
          <p className={`text-xs md:text-sm mb-1 line-clamp-2 flex-grow leading-tight ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {garage.address}
          </p>
        
        {isExpanded && (
            <div className={`border-t pt-4 mt-3 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
              <div className={`flex items-center gap-2 text-sm mb-2.5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                <PhoneIcon className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span className="font-medium">{garage.phone}</span>
            </div>
            
              <div className={`flex items-center gap-2 text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                <ClockIcon className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span className="font-medium">{garage.operatingHours}</span>
            </div>
            
              <div className="mb-4">
                <h4 className={`text-sm font-bold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Services:</h4>
              <div className="flex flex-wrap gap-2">
                {garage.services.slice(0, 3).map((service) => (
                  <span
                    key={service.id}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm ${
                        theme === 'light' 
                          ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200' 
                          : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 border border-gray-600'
                      }`}
                  >
                    {service.name} - {service.price}
                  </span>
                ))}
                {garage.services.length > 3 && (
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${theme === 'light' ? 'text-gray-500 bg-gray-100' : 'text-gray-500 bg-gray-700'}`}>
                    +{garage.services.length - 3} more
                  </span>
                )}
              </div>
            </div>
            
              <p className={`text-sm line-clamp-2 leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {garage.description}
              </p>
          </div>
        )}
        </div>
        
        {/* Premium buttons container */}
        <div className="flex gap-2 mt-auto pt-1">
                        <button 
          onClick={isExpanded ? handleBookNow : undefined}
            className="group/btn flex-1 relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/30"
        >
            <span className="relative z-10 text-sm">{isExpanded ? 'Book Now' : 'View Details'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
        </button>
        
        {!isExpanded && (
          <button 
            onClick={handleBookNow}
              className="group/btn flex-1 relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/30"
          >
              <span className="relative z-10 text-sm">Book Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

export default GarageCard;
