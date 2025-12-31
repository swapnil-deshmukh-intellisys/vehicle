import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMotorcycle, faCar, faTools } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';
import { ColorPalette } from '../../constants/designSystem';
import VehicleTypeSelectorModal from './VehicleTypeSelectorModal';

const VehicleTypeSelector = ({ currentVehicleType, onVehicleTypeChange }) => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const vehicleTypes = [
    {
      id: 1,
      title: "2 Wheeler",
      description: "Bikes, scooters, motorcycles",
      icon: faMotorcycle,
      type: 'two-wheeler',
      available: true,
      gradient: ColorPalette.vehicleTypes.twoWheeler.gradient
    },
    {
      id: 3,
      title: "4 Wheeler",
      description: "Cars, SUVs, passenger vehicles",
      icon: faCar,
      type: 'four-wheeler',
      available: true,
      gradient: ColorPalette.vehicleTypes.fourWheeler.gradient
    }
  ];

  const currentType = vehicleTypes.find(type => type.type === currentVehicleType);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    if (isModalOpen) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [isModalOpen]);

  const handleVehicleTypeSelect = (vehicleType) => {
    if (vehicleType.available) {
      onVehicleTypeChange(vehicleType.type);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center space-x-1.5 sm:space-x-2 border-2 rounded-xl px-2.5 py-2 sm:px-4 sm:py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
          theme === 'light'
            ? 'bg-white/80 backdrop-blur-sm border-gray-300 text-gray-900 hover:bg-white hover:border-red-400 shadow-md hover:shadow-lg'
            : 'bg-gray-800/80 backdrop-blur-sm border-gray-600 text-white hover:bg-gray-800 hover:border-red-500 shadow-md hover:shadow-lg'
        }`}
      >
        {currentType && (
          <>
            <FontAwesomeIcon 
              icon={currentType.icon} 
              className="text-base sm:text-lg"
            />
            <span className="text-xs sm:text-sm font-bold">{currentType.title}</span>
          </>
        )}
        <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" />
      </button>

      <VehicleTypeSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectVehicleType={handleVehicleTypeSelect}
        title="Select Vehicle Type"
        description="Choose your vehicle type to find specialized garages"
        vehicleTypes={vehicleTypes}
        headerIcon={faTools}
        headerTitle="Garage Service"
        footerText="Click on any vehicle type to find specialized garages near you"
      />
    </>
  );
};

export default VehicleTypeSelector;
