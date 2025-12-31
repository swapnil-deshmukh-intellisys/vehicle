import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import StepperNavigation from '../components/booking/StepperNavigation';
import SelectBikeStep from '../components/booking/BookingSteps/SelectBikeStep';
import SelectServiceStep from '../components/booking/BookingSteps/SelectServiceStep';
import SlotAndAddressStep from '../components/booking/BookingSteps/SlotAndAddressStep';
import SummaryStep from '../components/booking/BookingSteps/SummaryStep';
import { fetchGarageById } from '../services/garageDetailService';
import { useTheme } from '../components/context/ThemeContext';
import { ColorPalette, BackgroundGradients } from '../constants/designSystem';

const BookingPage = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get garageId and serviceType from URL params or navigation state
  const garageId = searchParams.get('garageId') || location.state?.garageId;
  const serviceType = searchParams.get('serviceType') || location.state?.serviceType || 'garage';
  const returnTo = searchParams.get('returnTo') || location.state?.returnTo;
  const vehicleType = searchParams.get('vehicleType') || location.state?.vehicleType;
  
  // Main booking state
  const [activeStep, setActiveStep] = useState(0);
  const [bikeData, setBikeData] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [slotAndAddress, setSlotAndAddress] = useState(null);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [garageInfo, setGarageInfo] = useState(null);
  
  const steps = ["Select Bike", "Service", "Slot & Address", "Summary"];
  
  // Check authentication and fetch garage info
  useEffect(() => {
    try {
      console.log("BookingPage mounted with garageId:", garageId, "serviceType:", serviceType);
      console.log("Location state:", location.state);
      
      // Authentication is handled by ProtectedRoute, so we can skip that check here
      if (!garageId) {
        console.log("No garageId, redirecting to home");
        navigate("/");
        return;
      }
      
      // Fetch garage information
      const fetchGarageInfo = async () => {
        try {
          const garageData = await fetchGarageById(garageId);
          if (garageData) {
            setGarageInfo(garageData);
            console.log("Garage info loaded:", garageData);
          } else {
            console.error("Failed to load garage information");
            navigate("/");
          }
        } catch (error) {
          console.error("Error fetching garage info:", error);
          navigate("/");
        }
      };
      
      fetchGarageInfo();
      console.log("BookingPage ready with garageId:", garageId);
    } catch (error) {
      console.error("Error in BookingPage useEffect:", error);
      navigate("/");
    }
  }, [garageId, navigate, location.state, location.pathname, location.search]);
  
  // Navigation logic with validation
  const handleNext = () => {
    setErrors({});
    
    if (activeStep === 0 && !bikeData) {
      setErrors({ bike: "Please select a bike to continue" });
      return;
    }
    if (activeStep === 1 && !selectedService) {
      setErrors({ service: "Please select at least one service to continue" });
      return;
    }
    if (activeStep === 2 && !slotAndAddress) {
      setErrors({ slot: "Please select date, time, and address to continue" });
      return;
    }
    
    setActiveStep(prev => prev + 1);
  };
  
  const handlePrevious = () => {
    setActiveStep(prev => prev - 1);
    setErrors({});
  };
  
  const handleStepClick = (stepIndex) => {
    // Allow navigation to previous steps only
    if (stepIndex < activeStep) {
      setActiveStep(stepIndex);
      setErrors({});
    }
  };

  const getReturnPath = () => {
    if (returnTo) {
      if (returnTo === 'garage-list' && vehicleType) {
        return `/garage?vehicleType=${vehicleType}`;
      }
      // Add more return paths as needed
    }
    
    // Default return based on service type
    if (serviceType === 'garage') {
      return garageId ? `/garage/${garageId}` : '/garage';
    } else if (serviceType === 'washing-detailing') {
      return garageId ? `/washing-detailing/${garageId}` : '/washing-detailing';
    } else if (serviceType === 'ev-service') {
      return garageId ? `/ev-service/${garageId}` : '/ev-service';
    } else if (serviceType === 'roadside-assistance') {
      return garageId ? `/roadside-assistance/${garageId}` : '/roadside-assistance';
    }
    
    return '/';
  };
  
  // Render current step component
  const renderStep = () => {
    const commonProps = {
      garageId,
      garageInfo,
      bikeData,
      selectedService,
      slotAndAddress,
      suggestion,
      setBikeData,
      setSelectedService,
      setSlotAndAddress,
      setSuggestion,
      loading,
      setLoading,
      errors,
      setErrors
    };
    
    switch(activeStep) {
      case 0:
        return <SelectBikeStep {...commonProps} />;
      case 1:
        return <SelectServiceStep {...commonProps} />;
      case 2:
        return <SlotAndAddressStep {...commonProps} />;
      case 3:
        return <SummaryStep {...commonProps} />;
      default:
        return <SelectBikeStep {...commonProps} />;
    }
  };
  
  if (!garageId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className={`text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Invalid Booking Request</h2>
          <p className={`text-xs md:text-sm mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Please select a garage first to start booking.</p>
          <button
            onClick={() => navigate(getReturnPath())}
            className={`bg-gradient-to-r ${ColorPalette.primary.button.gradient} hover:${ColorPalette.primary.button.hover.gradient} text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl`}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while garage info is being fetched
  if (!garageInfo) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Loading garage information...</p>
        </div>
      </div>
    );
  }
  
  try {
    return (
      <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
      {/* Header */}
      <div className={`${theme === 'light' ? 'bg-white/80 backdrop-blur-xl border-gray-200/50' : 'bg-gray-900/80 backdrop-blur-xl border-gray-800/50'} border-b shadow-lg`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Book Service</h1>
              <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Complete your booking in 4 simple steps</p>
            </div>
            <button
              onClick={() => navigate(getReturnPath())}
              className={`p-2 rounded-full transition-all duration-300 ${theme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Stepper Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 overflow-x-hidden w-full">
        <StepperNavigation
          steps={steps}
          activeStep={activeStep}
          onStepClick={handleStepClick}
        />
      </div>
      
      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 overflow-x-hidden w-full">
        {renderStep()}
      </div>
      
      {/* Navigation Buttons */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 overflow-x-hidden w-full">
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={activeStep === 0}
            className={`px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
              activeStep === 0
                ? theme === 'light' 
                  ? 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                : theme === 'light'
                  ? 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-900 hover:bg-gray-50 hover:shadow-lg'
                  : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-white hover:bg-gray-700 hover:shadow-lg'
            }`}
          >
            Previous
          </button>
          
          {activeStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className={`bg-gradient-to-r ${ColorPalette.primary.button.gradient} hover:${ColorPalette.primary.button.hover.gradient} text-white px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl`}
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
      
      {/* Error Display */}
      {Object.keys(errors).length > 0 && Object.values(errors).some(error => error && error.trim()) && (
        <div className="fixed bottom-4 right-4 max-w-sm z-50">
          <div className={`${theme === 'light' ? 'bg-white/95 backdrop-blur-xl border border-red-200' : 'bg-gray-800/95 backdrop-blur-xl border border-red-500/50'} text-red-600 p-4 rounded-xl shadow-2xl`}>
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Please complete the following:</span>
            </div>
            <ul className={`text-xs md:text-sm space-y-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {Object.values(errors)
                .filter(error => error && error.trim())
                .map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error("Error rendering BookingPage:", error);
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Booking</h1>
          <p className={`mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Something went wrong. Please try again.</p>
          <button 
            onClick={() => navigate(getReturnPath())}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
};

export default BookingPage;

