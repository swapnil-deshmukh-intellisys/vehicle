import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { fetchUserVehicles } from '../../../services/bookingService';
import AddBikeModal from './AddBikeModal';
import { useTheme } from '../../context/ThemeContext';
import { getSubscriberId } from '../../../services/authService';
import { ColorPalette } from '../../../constants/designSystem';

const SelectBikeStep = ({ 
  bikeData, 
  setBikeData, 
  loading, 
  setLoading, 
  errors, 
  setErrors 
}) => {
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [isAddBikeModalOpen, setIsAddBikeModalOpen] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState(null);
  
  // Fetch user vehicles on component mount
  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      try {
        const subscriberId = getSubscriberId();
        if (!subscriberId) {
          setErrors({ vehicles: 'Authentication error. Please log in again.' });
          setLoading(false);
          return;
        }
        const userVehicles = await fetchUserVehicles(subscriberId);
        console.log('🔍 User vehicles data structure:', userVehicles);
        if (userVehicles.length > 0) {
          console.log('🔍 First vehicle structure:', userVehicles[0]);
          console.log('🔍 Vehicle properties:', Object.keys(userVehicles[0]));
        }
        setVehicles(userVehicles);
        
        // Auto-select first vehicle if none selected
        if (userVehicles.length > 0 && !bikeData) {
          setSelectedBikeId(userVehicles[0].id);
          setBikeData(userVehicles[0]);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setErrors({ vehicles: 'Failed to load vehicles. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    
    loadVehicles();
  }, [setBikeData, setLoading, setErrors]);
  
  const handleBikeSelect = (vehicle) => {
    setSelectedBikeId(vehicle.id);
    setBikeData(vehicle);
    setErrors({});
  };
  
  const handleAddBikeSuccess = async (newVehicle) => {
    // Refresh the vehicles list to include the newly added vehicle
    try {
      const subscriberId = getSubscriberId();
      if (!subscriberId) {
        setErrors({ vehicles: 'Authentication error. Please log in again.' });
        setIsAddBikeModalOpen(false);
        return;
      }
      const userVehicles = await fetchUserVehicles(subscriberId);
      setVehicles(userVehicles);
      
      // Find the newly added vehicle in the updated list
      const addedVehicle = userVehicles.find(v => v.id === newVehicle.id || v.vehicle_id === newVehicle.vehicle_id);
      if (addedVehicle) {
        setSelectedBikeId(addedVehicle.id);
        setBikeData(addedVehicle);
      } else if (newVehicle && newVehicle.id) {
        // Use the new vehicle data from API response
        setSelectedBikeId(newVehicle.id);
        setBikeData(newVehicle);
      }
    } catch (error) {
      console.error('Error refreshing vehicles list:', error);
      setErrors({ vehicles: 'Failed to refresh vehicle list. Please try again.' });
    }
    
    setIsAddBikeModalOpen(false);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-400'}>Loading your vehicles...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 overflow-x-hidden w-full">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Select Your Bike</h2>
        <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Choose the bike you want to service</p>
      </div>
      
      {/* Error Display */}
      {errors.bike && (
        <div className={`${theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-500/50'} text-red-600 p-4 rounded-xl backdrop-blur-sm`}>
          <p className="text-sm font-medium">{errors.bike}</p>
        </div>
      )}
      
      {/* Vehicles Grid */}
      <div className="grid grid-cols-2 gap-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => handleBikeSelect(vehicle)}
            className={`group relative rounded-2xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
              theme === 'light'
                ? selectedBikeId === vehicle.id
                  ? 'bg-white/80 backdrop-blur-xl border-2 border-red-500 shadow-xl shadow-red-500/20'
                  : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 hover:border-red-300/50 shadow-lg hover:shadow-xl'
                : selectedBikeId === vehicle.id
                  ? 'bg-gray-800/80 backdrop-blur-xl border-2 border-red-500 shadow-xl shadow-red-500/20'
                  : 'bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 hover:border-red-500/50 shadow-xl hover:shadow-2xl'
            }`}
          >
            {/* Premium gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/3 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none rounded-2xl`}></div>
            
            <div className="text-center relative z-10">
              {vehicle.image || vehicle.model?.image ? (
                <div className="relative w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden bg-white">
                  <img
                    src={vehicle.image || vehicle.model.image}
                    alt={vehicle.brand || vehicle.model?.name || vehicle.name || 'Vehicle'}
                    className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className={`w-20 h-20 mx-auto mb-3 flex items-center justify-center rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}>
                  <span className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>No Image</span>
                </div>
              )}
              <h3 className={`text-sm md:text-base font-semibold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {vehicle.brand || vehicle.model?.name || vehicle.name || 'Vehicle'}
              </h3>
              {selectedBikeId === vehicle.id && (
                <div className="mt-2">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${ColorPalette.primary.button.gradient} text-white shadow-lg`}>
                    Selected
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Add New Bike Card */}
        <div
          onClick={() => setIsAddBikeModalOpen(true)}
          className={`group border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 flex flex-col items-center justify-center min-h-[140px] ${
            theme === 'light'
              ? 'bg-white/80 backdrop-blur-xl border-gray-300 hover:border-red-400 hover:bg-gray-50/50 shadow-lg hover:shadow-xl'
              : 'bg-gray-800/80 backdrop-blur-xl border-gray-600 hover:border-red-500 hover:bg-gray-700/50 shadow-xl hover:shadow-2xl'
          }`}
        >
          <PlusIcon className={`w-8 h-8 mb-2 transition-transform duration-300 group-hover:scale-110 ${theme === 'light' ? 'text-gray-600 group-hover:text-red-500' : 'text-gray-400 group-hover:text-red-400'}`} />
          <h3 className={`text-sm md:text-base font-semibold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Add New Bike</h3>
          <p className={`text-xs text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            Don't see your bike? Add it to your profile
          </p>
        </div>
      </div>
      
      {/* Selected Bike Summary */}
      {bikeData && (
        <div className={`rounded-2xl p-6 border transition-all duration-500 transform hover:scale-[1.01] ${
          theme === 'light' 
            ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
            : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
        }`}>
          <h3 className={`text-base md:text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Selected Bike</h3>
          <div className="flex items-center space-x-4">
            {bikeData.image || bikeData.model?.image ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white">
                <img
                  src={bikeData.image || bikeData.model.image}
                  alt={bikeData.brand || bikeData.model?.name || 'Vehicle'}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className={`w-20 h-20 flex items-center justify-center rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}>
                <span className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>No Image</span>
              </div>
            )}
            <div>
              <h4 className={`font-semibold text-base md:text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {bikeData.brand || bikeData.model?.name || 'Vehicle'}
              </h4>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Bike Modal */}
      {isAddBikeModalOpen && (
        <AddBikeModal
          isOpen={isAddBikeModalOpen}
          onClose={() => setIsAddBikeModalOpen(false)}
          onSuccess={handleAddBikeSuccess}
        />
      )}
    </div>
  );
};

export default SelectBikeStep;

