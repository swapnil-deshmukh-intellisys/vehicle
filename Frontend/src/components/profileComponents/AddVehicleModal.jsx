import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { fetchBikeBrands, fetchBikeModels, createUserVehicle } from '../../services/bookingService';
import { getSubscriberId, getBusinessId } from '../../services/authService';
import { useTheme } from '../context/ThemeContext';

const AddVehicleModal = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState('brand');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBrands();
    }
  }, [isOpen, loadBrands]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Custom sorting function to prioritize popular brands
  const sortBrandsByPopularity = (brands) => {
    const popularBrands = [
      'Honda', 'Bajaj', 'TVS', 'Hero', 'Yamaha', 'Royal Enfield', 'KTM', 'Suzuki',
      'Kawasaki', 'Ducati', 'BMW', 'Harley-Davidson', 'Aprilia', 'Triumph', 'Benelli'
    ];
    
    return brands.sort((a, b) => {
      const aIndex = popularBrands.findIndex(brand => 
        brand.toLowerCase() === a.name.toLowerCase()
      );
      const bIndex = popularBrands.findIndex(brand => 
        brand.toLowerCase() === b.name.toLowerCase()
      );
      
      // If both brands are in the popular list, sort by their position in the list
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is popular, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // If neither is popular, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const brandsData = await fetchBikeBrands();
      // Sort brands by popularity (famous brands first)
      const sortedBrands = sortBrandsByPopularity(brandsData || []);
      setBrands(sortedBrands);
    } catch (error) {
      console.error('Error loading brands:', error);
      setError('Failed to load bike brands');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBrandSelect = async (brand) => {
    setSelectedBrand(brand);
    setLoading(true);
    try {
      const modelsData = await fetchBikeModels(brand.id);
      setModels(modelsData || []);
      setCurrentStep('model');
    } catch (error) {
      console.error('Error loading models:', error);
      setError('Failed to load bike models');
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = async (model) => {
    setLoading(true);
    setError('');
    
    try {
      const subscriberId = getSubscriberId();
      const businessId = getBusinessId();
      
      if (!subscriberId || !businessId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const vehiclePayload = {
        businessid: parseInt(businessId),
        subscriberid: parseInt(subscriberId),
        model: model.id
      };

      try {
        const createResponse = await createUserVehicle(vehiclePayload);
        
        if (createResponse && (createResponse.status === true || createResponse.success === true)) {
          const vehicleData = {
            id: createResponse.data?.id || model.id,
            name: model.name,
            brand: selectedBrand.name,
            model: model.name,
            cc: model.cc || "110cc",
            year: new Date().getFullYear(),
            image: model.image || "https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg"
          };
          
          onSuccess(vehicleData);
          handleClose();
          return;
        } else {
          setError(createResponse?.message || 'Failed to add vehicle');
        }
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || '';
        
        if (errorMessage.includes('already exists') || errorMessage.includes('This vehicle model already exists')) {
          console.log('✅ Vehicle already exists, using existing vehicle');
          const vehicleData = {
            id: model.id,
            name: model.name,
            brand: selectedBrand.name,
            model: model.name,
            cc: model.cc || "110cc",
            year: new Date().getFullYear(),
            image: model.image || "https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg"
          };
          
          onSuccess(vehicleData);
          handleClose();
          return;
        } else {
          console.error('Error creating vehicle:', error);
          setError(errorMessage || 'Failed to add vehicle. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('brand');
    setSelectedBrand(null);
    setModels([]);
    setError('');
    onClose();
  };

  const handleBackToBrands = () => {
    setCurrentStep('brand');
    setSelectedBrand(null);
    setModels([]);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className={`w-full h-full overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
          <div>
            <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {currentStep === 'brand' ? 'Select Bike Brand' : 'Select Bike Model'}
            </h2>
            {selectedBrand && (
              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {selectedBrand.name} Models
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className={`transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto h-[calc(100vh-88px)] sm:h-[calc(100vh-96px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                {currentStep === 'brand' ? 'Loading brands...' : 'Loading models...'}
              </p>
            </div>
          ) : (
            <>
              {currentStep === 'brand' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      onClick={() => handleBrandSelect(brand)}
                      className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border hover:scale-105 hover:shadow-lg flex flex-col items-stretch min-h-[120px] ${
                        theme === 'light'
                          ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <div className="w-full h-20 mb-3 flex items-center justify-center bg-white rounded-lg">
                        <img
                          src={brand.image || `https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg`}
                          alt={brand.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.target.src = 'https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg';
                          }}
                        />
                      </div>
                      <p className={`text-sm font-medium text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {brand.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => handleModelSelect(model)}
                      className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border hover:scale-105 hover:shadow-lg flex flex-col items-stretch min-h-[160px] ${
                        theme === 'light'
                          ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <div className="w-full h-24 mb-3 flex items-center justify-center bg-white rounded-lg">
                        <img
                          src={model.image || `https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg`}
                          alt={model.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.target.src = 'https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg';
                          }}
                        />
                      </div>
                      <p className={`text-sm font-medium text-center mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {model.name}
                      </p>
                      <p className={`text-xs text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {model.cc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-600 text-white rounded-lg text-sm">
              {error}
            </div>
          )}

          {currentStep === 'model' && (
            <div className="mt-6 text-center">
              <button
                onClick={handleBackToBrands}
                className={`transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
              >
                ← Back to Brands
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;

