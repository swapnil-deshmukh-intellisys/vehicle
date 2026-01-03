import React, { useState, useEffect } from 'react';
import { fetchGarageServices } from '../../../services/bookingService';
import { useTheme } from '../../context/ThemeContext';
import { ColorPalette } from '../../../constants/designSystem';

const SelectServiceStep = ({ 
  bikeData, 
  setSelectedService, 
  garageId,
  loading, 
  setLoading, 
  errors, 
  setErrors 
}) => {
  const { theme } = useTheme();
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  
  // Load services when bike data is available
  useEffect(() => {
    const loadServices = async () => {
      if (!bikeData || !garageId) return;
      
      setLoading(true);
      try {
        // Get ccid from bike data - must be present
        const ccid = bikeData.cc_id || bikeData.model?.cc_id || bikeData.cc;
        
        if (!ccid) {
          setErrors({ services: 'Vehicle CC information is missing. Please select a valid vehicle.' });
          setLoading(false);
          return;
        }
        
        const payload = {
          garageid: garageId,
          ccid: ccid
        };
        
        const serviceData = await fetchGarageServices(payload);
        console.log('🔍 Complete service data structure:', serviceData);
        
        setServices(serviceData.services);
        setAddOns(serviceData.addOns);
      } catch (error) {
        console.error('Error loading services:', error);
        setErrors({ services: 'Failed to load services. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    
    loadServices();
  }, [bikeData, garageId, setLoading, setErrors]);
  
  // Update parent component when selections change
  useEffect(() => {
    const totalServices = [...selectedServices, ...selectedAddOns];
    setSelectedService(totalServices.length > 0 ? totalServices : null);
    setErrors({});
  }, [selectedServices, selectedAddOns, setSelectedService, setErrors]);
  
  const toggleService = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };
  
  const toggleAddOn = (addOn) => {
    setSelectedAddOns(prev => {
      const isSelected = prev.find(a => a.id === addOn.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };
  
  const isServiceSelected = (service) => {
    return selectedServices.find(s => s.id === service.id);
  };
  
  const isAddOnSelected = (addOn) => {
    return selectedAddOns.find(a => a.id === addOn.id);
  };
  
  const calculateTotal = () => {
    const serviceTotal = selectedServices.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    const addOnTotal = selectedAddOns.reduce((sum, addOn) => sum + parseFloat(addOn.price || 0), 0);
    return serviceTotal + addOnTotal;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-400'}>Loading services...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 overflow-x-hidden w-full">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Select Services</h2>
        <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Choose the services you need for your {bikeData?.brand || bikeData?.model?.name || 'vehicle'}</p>
      </div>
      
      {/* Error Display */}
      {errors.service && (
        <div className={`${theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-500/50'} text-red-600 p-4 rounded-xl backdrop-blur-sm`}>
          <p className="text-sm font-medium">{errors.service}</p>
        </div>
      )}
      
      {errors.services && (
        <div className={`${theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-500/50'} text-red-600 p-4 rounded-xl backdrop-blur-sm`}>
          <p className="text-sm font-medium">{errors.services}</p>
        </div>
      )}
      
      {/* Services Section */}
      <div className="space-y-4">
        <h3 className={`text-base md:text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Services</h3>
        <div className="space-y-4">
          {(services || []).map((service) => {
            console.log('🔍 Rendering service:', service.name, 'Full object:', service);
            const isSelected = isServiceSelected(service);
            return (
            <div
              key={service.id}
              className={`group relative rounded-2xl border overflow-hidden transition-all duration-500 transform hover:scale-[1.01] hover:-translate-y-1 ${
                theme === 'light' 
                  ? isSelected
                    ? 'bg-white/80 backdrop-blur-xl border-red-500/50 shadow-xl shadow-red-500/20'
                    : 'bg-white/80 backdrop-blur-xl border-gray-200/50 hover:border-red-300/50 shadow-lg hover:shadow-xl'
                  : isSelected
                    ? 'bg-gray-800/80 backdrop-blur-xl border-red-500/50 shadow-xl shadow-red-500/20'
                    : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 hover:border-red-500/50 shadow-xl hover:shadow-2xl'
              }`}
            >
              {/* Premium gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/3 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none ${isSelected ? 'from-red-500/10 via-red-500/5 to-red-500/10' : ''}`}></div>
              
              <div className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-base md:text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {service.name}
                  </h4>
                  <button
                    onClick={() => toggleService(service)}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg ${
                      isSelected
                        ? `bg-gradient-to-r ${ColorPalette.primary.button.gradient} text-white`
                        : theme === 'light'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                        : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                    }`}
                  >
                    {isSelected ? 'Remove' : 'Add'}
                  </button>
                </div>
                
                <div className={`flex items-center space-x-4 text-xs md:text-sm mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span>Duration: {service.duration}</span>
                  <span>•</span>
                  <span className={`font-bold bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>
                    ₹{parseFloat(service.price || 0).toFixed(0)}
                  </span>
                </div>
                
                {/* Service Details - Always Visible */}
                  <div className={`mt-4 pt-4 border-t ${theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'}`}>
                    <h5 className={`text-xs md:text-sm font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Includes:</h5>
                  {console.log('🔍 Service details for:', service.name, 'Includes:', service.includes)}
                  <ul className="space-y-2">
                    {(() => {
                      // Handle multiple possible field names and formats
                      let includesList = [];
                      const includesData = service.includes || service.details || service.description || service.features || '';
                      console.log('🔍 Service includes data:', includesData, 'Type:', typeof includesData);
                      console.log('🔍 Service object keys:', Object.keys(service));
                      
                      if (Array.isArray(includesData)) {
                        includesList = includesData;
                      } else if (typeof includesData === 'string' && includesData.trim()) {
                        // Split by multiple bullet point formats and clean up
                        includesList = includesData
                          .split(/[•·\-\*]/) // Split by bullet, middle dot, dash, or asterisk
                          .map(item => item.trim())
                          .filter(item => item.length > 0 && item !== '');
                        
                        // If no items found with bullet points, try splitting by newlines
                        if (includesList.length === 0) {
                          includesList = includesData
                            .split('\n')
                            .map(item => item.trim())
                            .filter(item => item.length > 0);
                        }
                        
                        // If still no items, try splitting by periods
                        if (includesList.length === 0) {
                          includesList = includesData
                            .split('.')
                            .map(item => item.trim())
                            .filter(item => item.length > 0);
                        }
                      }
                      
                      console.log('🔍 Processed includes list:', includesList);
                      
                      // If no includes found, don't show the includes section
                      if (includesList.length === 0) {
                        return null;
                      }
                      
                      return includesList.map((item, index) => (
                        <li key={index} className={`text-xs md:text-sm flex items-start ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 bg-gradient-to-r ${ColorPalette.primary.gradient} rounded-full mr-3 mt-1.5 flex-shrink-0`}></span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ));
                    })()}
                    </ul>
                  </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
      
      {/* Add-ons Section */}
      {addOns && addOns.length > 0 && (
        <div className="space-y-4">
          <h3 className={`text-base md:text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Add-ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(addOns || []).map((addOn) => {
              const isSelected = isAddOnSelected(addOn);
              return (
              <div
                key={addOn.id}
                className={`group relative rounded-2xl border p-5 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 ${
                  theme === 'light' 
                    ? isSelected
                      ? 'bg-white/80 backdrop-blur-xl border-red-500/50 shadow-xl shadow-red-500/20'
                      : 'bg-white/80 backdrop-blur-xl border-gray-200/50 hover:border-red-300/50 shadow-lg hover:shadow-xl'
                    : isSelected
                      ? 'bg-gray-800/80 backdrop-blur-xl border-red-500/50 shadow-xl shadow-red-500/20'
                      : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 hover:border-red-500/50 shadow-xl hover:shadow-2xl'
                }`}
              >
                {/* Premium gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/3 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none rounded-2xl ${isSelected ? 'from-red-500/10 via-red-500/5 to-red-500/10' : ''}`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-base md:text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {addOn.name}
                    </h4>
                    <span className={`font-bold bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>
                      ₹{parseFloat(addOn.price || 0).toFixed(0)}
                    </span>
                  </div>
                  
                  <p className={`text-xs md:text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {addOn.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                      Duration: {addOn.duration}
                    </span>
                    
                    <button
                      onClick={() => toggleAddOn(addOn)}
                      className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        isSelected
                          ? `bg-gradient-to-r ${ColorPalette.primary.button.gradient} text-white`
                          : theme === 'light'
                          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                          : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
      
      {/* Selected Services Summary */}
      {(selectedServices.length > 0 || selectedAddOns.length > 0) && (
        <div className={`rounded-2xl p-6 border transition-all duration-500 transform hover:scale-[1.01] ${
          theme === 'light' 
            ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
            : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
        }`}>
          <h3 className={`text-base md:text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Selected Services</h3>
          
          {selectedServices.length > 0 && (
            <div className="mb-4">
              <h4 className={`text-xs md:text-sm font-semibold mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Services:</h4>
              <div className="space-y-2">
                {(selectedServices || []).map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <span className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{service.name}</span>
                    <span className={`font-bold bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>₹{parseFloat(service.price || 0).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedAddOns.length > 0 && (
            <div className="mb-4">
              <h4 className={`text-xs md:text-sm font-semibold mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>Add-ons:</h4>
              <div className="space-y-2">
                {(selectedAddOns || []).map((addOn) => (
                  <div key={addOn.id} className="flex justify-between items-center">
                    <span className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{addOn.name}</span>
                    <span className={`font-bold bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>₹{parseFloat(addOn.price || 0).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={`border-t pt-4 ${theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-base md:text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Total:</span>
              <span className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>₹{calculateTotal().toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectServiceStep;

