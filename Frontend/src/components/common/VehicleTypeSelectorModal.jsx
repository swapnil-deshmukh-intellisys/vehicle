import React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

const VehicleTypeSelectorModal = ({
  isOpen,
  onClose,
  onSelectVehicleType,
  title = "Select Vehicle Type",
  description = "Choose your vehicle type",
  vehicleTypes = [],
  headerIcon,
  headerTitle,
  onBack,
  footerText
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleVehicleTypeClick = (vehicleType) => {
    if (vehicleType.available) {
      onSelectVehicleType(vehicleType);
    } else {
      alert(`${vehicleType.title} service - Coming Soon!`);
    }
  };

  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // Don't allow closing by clicking backdrop - user must select a vehicle type
      // onClose();
    }
  };

  // If onBack is provided, render as full-page component with header
  // Otherwise, render just the modal overlay (for use within sections)
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: '1rem'
      }}
      onClick={handleModalBackdropClick}
    >
      <div 
        className={`${theme === 'light' ? 'bg-white' : 'bg-gray-900'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden mx-auto`}
        style={{ 
          maxHeight: '85vh',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {(onClose || onBack) && (
          <button
            onClick={onClose || onBack}
            className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            aria-label="Close vehicle type selection"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        )}

        {/* Modal Header */}
        <div className="relative p-4 sm:p-6 text-center border-b border-white/10">
          <h2 className={`text-xl sm:text-2xl font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            {title}
          </h2>
          <p className={`text-sm sm:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {description}
          </p>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-h-[calc(85vh-120px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicleTypes.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`relative group rounded-xl p-4 sm:p-6 text-center transition-all duration-500 border-2 ${
                  vehicle.available 
                    ? `cursor-pointer transform hover:scale-105 hover:shadow-xl ${
                        theme === 'light' 
                          ? 'border-gray-200 hover:border-transparent bg-white/80' 
                          : 'border-gray-700 hover:border-transparent bg-gray-800/80'
                      }` 
                    : `opacity-50 cursor-not-allowed ${
                        theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
                      }`
                }`}
                onClick={() => handleVehicleTypeClick(vehicle)}
                onKeyDown={(e) => {
                  if (vehicle.available && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleVehicleTypeClick(vehicle);
                  }
                }}
                tabIndex={vehicle.available ? 0 : -1}
                role="button"
                aria-label={`${vehicle.title} - ${vehicle.description}`}
                aria-disabled={!vehicle.available}
              >
                {/* Background Gradient on Hover */}
                {vehicle.available && vehicle.gradient && (
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${vehicle.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                )}

                {/* Icon */}
                <div className={`relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-3 sm:mb-4 ${
                  vehicle.available 
                    ? vehicle.gradient 
                      ? `bg-gradient-to-br ${vehicle.gradient} shadow-lg group-hover:shadow-xl`
                      : 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg group-hover:shadow-xl'
                    : 'bg-gray-500'
                } transition-all duration-500`}>
                  <FontAwesomeIcon 
                    icon={vehicle.icon} 
                    className="text-2xl sm:text-3xl text-white" 
                  />
                </div>

                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${
                  vehicle.available 
                    ? (theme === 'light' ? 'text-gray-900' : 'text-white') 
                    : 'text-gray-500'
                }`}>
                  {vehicle.title}
                </h3>
                <p className={`text-sm sm:text-base ${
                  vehicle.available 
                    ? (theme === 'light' ? 'text-gray-600' : 'text-gray-400') 
                    : 'text-gray-600'
                }`}>
                  {vehicle.description}
                </p>
                {!vehicle.available && (
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-lg text-xs ${
                      theme === 'light' ? 'bg-gray-200 text-gray-500' : 'bg-gray-700 text-gray-400'
                    }`}>
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        {footerText && (
          <div className={`${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-800 border-gray-700'} px-4 sm:px-6 py-3 border-t flex-shrink-0`}>
            <p className={`text-center text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              {footerText}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // If onBack is provided, wrap in full-page layout with header
  if (onBack) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'}`}>
        {/* Header with Back Button */}
        <div className={`${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-800'} border-b py-4 px-4`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className={`flex items-center transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-red-600' : 'text-white hover:text-red-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {headerTitle && (
              <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {headerIcon && <FontAwesomeIcon icon={headerIcon} className="mr-2" />}
                {headerTitle}
              </h1>
            )}
            <div className="w-5"></div> {/* Spacer for centering */}
          </div>
        </div>
        {modalContent}
      </div>
    );
  }

  // Otherwise, return just the modal (for use within sections)
  // Use portal to render at document body level to avoid positioning issues
  return createPortal(modalContent, document.body);
};

export default VehicleTypeSelectorModal;

