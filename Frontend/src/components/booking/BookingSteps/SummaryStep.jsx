import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { createBooking } from '../../../services/bookingService';
import { useTheme } from '../../context/ThemeContext';
import { getSubscriberId, getBusinessId } from '../../../services/authService';
import { ColorPalette } from '../../../constants/designSystem';

const SummaryStep = ({ 
  bikeData, 
  selectedService, 
  slotAndAddress, 
  suggestion, 
  setSuggestion,
  garageId,
  garageInfo,
  loading, 
  setLoading, 
  errors, 
  setErrors 
}) => {
  const { theme } = useTheme();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [serviceType, setServiceType] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!bookingSuccess || !bookingData) return;

    const handlePopState = () => {
      window.location.href = '/profile';
    };

    try {
      window.history.pushState({ bookingSuccess: true }, document.title);
    } catch {
      // ignore
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [bookingSuccess, bookingData]);
  
  // Map service category names to booking service type IDs
  // Only considers these 3 specific service categories:
  // 1. "Service at Garage" (or "Bike Service at Garage") -> garage_servicing
  // 2. "Pick & Drop Service" (or "Pick & Drop Bike Service") -> pickup_drop
  // 3. "Service at Doorstep" (or "Bike Service at Doorstep") -> doorstep_servicing
  const mapServiceCategoryToType = (categoryName) => {
    if (!categoryName) return null;
    
    const name = categoryName.toLowerCase().trim();
    
    // Only match the 3 specific service categories
    // 1. "Pick & Drop Service" - must have both "pick" and "drop" keywords
    if (name.includes('pick') && name.includes('drop')) {
      return 'pickup_drop';
    }
    // 2. "Service at Doorstep" - must have both "service" and "doorstep" keywords
    else if (name.includes('service') && name.includes('doorstep')) {
      return 'doorstep_servicing';
    }
    // 3. "Service at Garage" - must have both "service" and "garage" keywords
    else if (name.includes('service') && name.includes('garage')) {
      return 'garage_servicing';
    }
    
    // If it doesn't match any of the 3 specific categories, return null
    // This filters out other categories like "Roadside Assistant (RSA)", "EV Service", etc.
    return null;
  };
  
  // Get service types from garage's service_provided categories
  const availableServiceTypes = useMemo(() => {
    console.log('🔍 SummaryStep - Full garageInfo:', garageInfo);
    console.log('🔍 SummaryStep - Garage service_provided:', garageInfo?.service_provided);
    console.log('🔍 SummaryStep - service_provided type:', typeof garageInfo?.service_provided);
    console.log('🔍 SummaryStep - service_provided is array?', Array.isArray(garageInfo?.service_provided));
    
    // Check if service_provided exists and is a valid array
    if (!garageInfo || !garageInfo.service_provided) {
      console.warn('⚠️ No garageInfo or service_provided field found');
      console.warn('⚠️ GarageInfo keys:', garageInfo ? Object.keys(garageInfo) : 'garageInfo is null');
      return [];
    }
    
    if (!Array.isArray(garageInfo.service_provided)) {
      console.warn('⚠️ service_provided is not an array:', typeof garageInfo.service_provided);
      return [];
    }
    
    if (garageInfo.service_provided.length === 0) {
      console.warn('⚠️ service_provided array is empty');
      return [];
    }
    
    // Map real service categories to service types
    const serviceTypesMap = new Map();
    
    garageInfo.service_provided.forEach((category, index) => {
      console.log(`🔍 [${index}] Processing service category:`, category);
      const categoryName = category?.name || category;
      console.log(`🔍 [${index}] Category name: "${categoryName}"`);
      
      const typeId = mapServiceCategoryToType(categoryName);
      if (typeId && !serviceTypesMap.has(typeId)) {
        // Create a user-friendly label from the category name
        // Standardize labels for the 3 specific categories
        let label = categoryName;
        const nameLower = label.toLowerCase();
        
        if (nameLower.includes('pick') && nameLower.includes('drop')) {
          label = 'Pick & Drop Service';
        } else if (nameLower.includes('doorstep')) {
          label = 'Service at Doorstep';
        } else if (nameLower.includes('garage')) {
          label = 'Service at Garage';
        }
        
        serviceTypesMap.set(typeId, {
          id: typeId,
          label: label,
          originalName: categoryName
        });
        console.log(`✅ [${index}] Mapped "${categoryName}" → service type: ${typeId} (${label})`);
      } else if (!typeId) {
        // Only log if it's not one of the 3 specific categories we're looking for
        // This filters out other categories like "Roadside Assistant (RSA)", "EV Service", etc.
        console.log(`ℹ️ [${index}] Skipping service category: "${categoryName}" (not one of the 3 required categories)`);
      } else {
        console.log(`ℹ️ [${index}] Service type ${typeId} already mapped, skipping "${categoryName}"`);
      }
    });
    
    // Convert map to array
    const serviceTypes = Array.from(serviceTypesMap.values());
    
    console.log('🔍 Final available service types:', serviceTypes);
    console.log('🔍 Total service types found:', serviceTypes.length);
    
    // Return the mapped service types (empty array if none found)
    return serviceTypes;
  }, [garageInfo]);
  
  const calculateTotal = () => {
    if (!selectedService) return 0;
    return selectedService.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
  };
  
  const applyPromoCode = () => {
    const total = calculateTotal();
    // Dummy implementation - no discount applied until backend is ready
    // TODO: Enable discount calculation when backend coupon API is implemented
    let discount = 0;
    if (appliedCoupon) {
      // For now, coupon is UI-only, no actual discount
      // discount = appliedCoupon.discount; // Uncomment when backend is ready
      discount = 0;
    }
    return {
      originalTotal: total,
      discount: discount,
      finalTotal: total - discount
    };
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    setCouponError('');
    
    // Dummy implementation - coupon codes not available yet
    // TODO: Replace with real API call when backend coupon validation is ready
    setTimeout(() => {
      // For now, all coupon codes are invalid since backend is not ready
      setCouponError('Invalid coupon code. Please try again.');
      setAppliedCoupon(null);
      setCouponLoading(false);
    }, 500);
  };
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };
  
  const handleBooking = async () => {
    setLoading(true);
    setErrors({});
    
    try {
      // Validate and format date - ensure it's in YYYY-MM-DD format
      let formattedDate = '';
      if (slotAndAddress?.date) {
        console.log("🔍 Original date from slotAndAddress:", slotAndAddress.date);
        // Extract date part from "2025-11-17 (Mon)" format
        const datePart = slotAndAddress.date.split(' ')[0];
        console.log("🔍 Extracted date part:", datePart);
        // Validate it's in YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(datePart)) {
          formattedDate = datePart;
          console.log("🔍 Date validated successfully:", formattedDate);
        } else {
          // Try to parse and reformat if needed (using local timezone)
          try {
            const dateObj = new Date(datePart);
            if (!isNaN(dateObj.getTime())) {
              // Use local date methods to avoid timezone issues
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              formattedDate = `${year}-${month}-${day}`;
            } else {
              throw new Error('Invalid date format');
            }
          } catch {
            setErrors({ booking: 'Invalid date format. Please select a date again.' });
            setLoading(false);
            return;
          }
        }
      } else {
        setErrors({ booking: 'Please select a booking date.' });
        setLoading(false);
        return;
      }
      
      // Validate and format slot - ensure it's a valid time string
      let formattedSlot = '';
      if (slotAndAddress?.slot) {
        // Ensure slot is a non-empty string
        formattedSlot = slotAndAddress.slot.trim();
        if (!formattedSlot) {
          setErrors({ booking: 'Please select a time slot.' });
          setLoading(false);
          return;
        }
      } else {
        setErrors({ booking: 'Please select a time slot.' });
        setLoading(false);
        return;
      }
      
      // Validate required data from backend/auth
      const businessId = getBusinessId();
      const subscriberId = getSubscriberId();
      
      if (!businessId || !subscriberId) {
        setErrors({ booking: 'Authentication error. Please log in again.' });
        setLoading(false);
        return;
      }
      
      if (!bikeData || (!bikeData.vehicle_id && !bikeData.id)) {
        setErrors({ booking: 'Please select a vehicle.' });
        setLoading(false);
        return;
      }
      
      if (!slotAndAddress?.address?.id) {
        setErrors({ booking: 'Please select an address.' });
        setLoading(false);
        return;
      }
      
      if (!garageId) {
        setErrors({ booking: 'Garage information is missing.' });
        setLoading(false);
        return;
      }
      
      const payload = {
        businessid: parseInt(businessId),
        subscriberid: parseInt(subscriberId),
        subscribervehicleid: bikeData.vehicle_id || bikeData.id,
        subscriberaddressid: slotAndAddress.address.id,
        garageid: garageId,
        bookingdate: formattedDate, // YYYY-MM-DD format
        bookingslot: formattedSlot, // e.g., "10:00 AM"
        suggestion: suggestion.trim(),
        bookingamount: calculateTotal().toFixed(2),
        promocode: appliedCoupon?.code || "", // Send coupon code if applied, empty string otherwise
        requiredestimate: slotAndAddress.estimate === "yes",
        servicetype: serviceType || undefined
      };
      
      console.log("🔍 Creating booking with payload:", payload);
      console.log("🔍 Debug values:");
      console.log("  - businessid:", parseInt(businessId));
      console.log("  - subscriberid:", parseInt(subscriberId));
      console.log("  - subscribervehicleid:", bikeData.vehicle_id || bikeData.id);
      console.log("  - subscriberaddressid:", slotAndAddress.address.id);
      console.log("  - garageid:", garageId);
      console.log("  - bookingdate:", formattedDate, "(format: YYYY-MM-DD)");
      console.log("  - bookingslot:", formattedSlot, "(format: HH:MM AM/PM)");
      console.log("  - suggestion:", suggestion.trim());
      console.log("  - bookingamount:", calculateTotal().toFixed(2));
      console.log("  - promocode:", appliedCoupon?.code || "");
      console.log("  - requiredestimate:", slotAndAddress.estimate === "yes");
      console.log("  - servicetype:", serviceType);
      
      const response = await createBooking(payload);
      
      if (response.success) {
        console.log("🔍 Booking response data:", response.data);
        console.log("🔍 Booking ID from response:", response.data?.id || response.data?.booking_id);
        setBookingData(response.data);
        setBookingSuccess(true);
      } else {
        setErrors({ booking: 'Failed to create booking. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Check if it's a duplicate booking error
      if (error.response?.data?.errors?.non_field_errors?.includes('A booking already exists with these details.')) {
        setErrors({ booking: 'A booking with these details already exists. Please try with different date, time, or service selection.' });
      } else {
        setErrors({ booking: 'Failed to create booking. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Handle "2025-11-17 (Mon)" format from slotAndAddress.date
    let dateToFormat = dateString;
    if (dateString.includes(' (')) {
      dateToFormat = dateString.split(' ')[0];
    }
    
    try {
      const dateObj = new Date(dateToFormat);
      if (isNaN(dateObj.getTime())) {
        return dateString; // Return original if parsing fails
      }
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString; // Return original if error
    }
  };
  
  const formatTime = (timeString) => {
    const [hour] = timeString.split(':');
    const hourNum = parseInt(hour);
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum;
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    return `${displayHour}:00 ${ampm}`;
  };
  
  if (bookingSuccess && bookingData) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className={`text-3xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Booking Confirmed!</h2>
          <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            Your service has been successfully booked. You will receive a confirmation SMS shortly.
          </p>
          
          <div className={`rounded-xl p-6 border mb-6 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Booking Details</h3>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Booking ID:</span>
                <span className={`font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {bookingData?.id || bookingData?.booking_id || ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Date:</span>
                <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{formatDate(bookingData.booking_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Time:</span>
                <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{formatTime(bookingData.booking_slot)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Total Amount:</span>
                <span className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>₹{bookingData.total_amount}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              window.location.href = '/profile';
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            See Booking
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 overflow-x-hidden w-full">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Review Your Booking</h2>
        <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Please review all details before confirming</p>
      </div>
      
      {/* Error Display */}
      {errors.booking && (
        <div className={`${theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-500/50'} text-red-600 p-4 rounded-xl backdrop-blur-sm`}>
          <p className="text-sm font-medium">{errors.booking}</p>
        </div>
      )}
      
      {/* Bike Details - Card Format like old website */}
      <div className="flex justify-center">
        <div className={`rounded-2xl p-6 border max-w-xs w-full transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 ${
          theme === 'light' 
            ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
            : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
        }`}>
          <h3 className={`text-base md:text-lg font-bold mb-4 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Selected Bike</h3>
          <div className="flex flex-col items-center space-y-3">
            <div className={`w-32 h-20 rounded-xl overflow-hidden flex items-center justify-center bg-white ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}>
              {bikeData?.image || bikeData?.model?.image ? (
                <img
                  src={bikeData.image || bikeData.model.image}
                  alt={bikeData.brand || bikeData.model?.name || 'Vehicle'}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>No Image</div>
              )}
            </div>
            <h4 className={`font-semibold text-center text-sm md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {bikeData?.brand || bikeData?.model?.name || 'Vehicle'}
            </h4>
          </div>
        </div>
      </div>
      
      {/* Services - Card Format like old website */}
      <div className="flex justify-center">
        <div className={`rounded-2xl p-6 border max-w-lg w-full transition-all duration-500 transform hover:scale-[1.01] ${
          theme === 'light' 
            ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
            : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
        }`}>
          <h3 className={`text-base md:text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Selected Service</h3>
          {selectedService && selectedService.length > 0 ? (
            <div className="space-y-3">
              {selectedService.map((service) => (
                <div key={service.id}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-semibold text-base md:text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{service.name}</h4>
                    <span className={`font-bold bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent text-base md:text-lg`}>₹{parseFloat(service.price || 0).toFixed(0)}</span>
                  </div>
                  {service.description && (
                    <p className={`text-xs md:text-sm whitespace-pre-line ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>No service selected</p>
          )}
        </div>
      </div>
      
      {/* Schedule - Card Format like old website */}
      {slotAndAddress?.date && slotAndAddress?.slot && (
        <div className="flex justify-center">
          <div className={`rounded-2xl p-6 border max-w-lg w-full transition-all duration-500 transform hover:scale-[1.01] ${
            theme === 'light' 
              ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
              : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
          }`}>
            <h3 className={`text-base md:text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Selected Schedule</h3>
            <p className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {formatDate(slotAndAddress.date)} at {formatTime(slotAndAddress.slot)}
            </p>
          </div>
        </div>
      )}

      {/* Address - Card Format like old website */}
      {slotAndAddress?.address && (
        <div className="flex justify-center">
          <div className={`rounded-2xl p-6 border max-w-lg w-full transition-all duration-500 transform hover:scale-[1.01] ${
            theme === 'light' 
              ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
              : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
          }`}>
            <h3 className={`text-base md:text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Selected Address</h3>
            <div className="space-y-2">
              {slotAndAddress.address.city && (
                <div className="flex justify-between">
                  <span className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>City:</span>
                  <span className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{slotAndAddress.address.city}</span>
                </div>
              )}
              {slotAndAddress.address.address && (
                <div className="flex justify-between">
                  <span className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Locality:</span>
                  <span className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{slotAndAddress.address.address}</span>
                </div>
              )}
              {slotAndAddress.address.pincode && (
                <div className="flex justify-between">
                  <span className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Pincode:</span>
                  <span className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{slotAndAddress.address.pincode}</span>
                </div>
              )}
              {slotAndAddress.address.landmark && (
                <div className="flex justify-between">
                  <span className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Landmark:</span>
                  <span className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{slotAndAddress.address.landmark}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Additional Details - Card Format like old website */}
      <div className="flex justify-center">
        <div className={`rounded-2xl p-6 border max-w-lg w-full transition-all duration-500 transform hover:scale-[1.01] ${
          theme === 'light' 
            ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
            : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
        }`}>
          <h3 className={`text-base md:text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Additional Details</h3>
          <div className="space-y-3">
             {slotAndAddress?.estimate && (
               <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                 <strong>Estimate Required:</strong> {slotAndAddress.estimate === "yes" ? 'Yes' : 'No'}
               </p>
             )}
            {suggestion && suggestion.trim() !== "" && (
              <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                <strong>Suggestion:</strong> {suggestion}
              </p>
            )}
            {(!slotAndAddress?.estimate && (!suggestion || suggestion.trim() === "")) && (
              <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>No additional details</p>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Input */}
      <div className="flex justify-center">
        <div className={`rounded-2xl p-6 border max-w-lg w-full transition-all duration-500 transform hover:scale-[1.01] ${
          theme === 'light' 
            ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-lg hover:shadow-xl' 
            : 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 shadow-xl hover:shadow-2xl'
        }`}>
          <h3 className={`text-base md:text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Special Instructions (Optional)</h3>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Any special instructions or requests for the mechanic..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${
              theme === 'light'
                ? 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300'
                : 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
            }`}
          />
        </div>
      </div>
      
      {/* Coupon Code Section */}
      <div className="flex justify-center">
        <div className={`rounded-xl p-6 border max-w-lg w-full ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Apply Coupon Code</h3>
          
          {appliedCoupon ? (
            <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900 bg-opacity-20 border-green-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className={`font-semibold ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>
                      Coupon Applied: {appliedCoupon.code}
                    </p>
                    <p className={`text-sm ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                      Coupon code applied (discount will be calculated by backend)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'text-green-700 hover:bg-green-100'
                      : 'text-green-400 hover:bg-green-900'
                  }`}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                  }}
                  placeholder="Enter coupon code"
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    theme === 'light'
                      ? 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                      : 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyCoupon();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className={`text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                  {couponError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Final Price - Simple format like old website */}
      {selectedService && selectedService.length > 0 && (
        <div className="flex justify-center">
          <div className={`rounded-xl p-6 border max-w-lg w-full ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <h3 className={`text-lg font-semibold mb-4 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Price Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Subtotal:</span>
                <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>₹{calculateTotal().toFixed(0)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center">
                  <span className={`flex items-center space-x-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    <span>Coupon Code ({appliedCoupon.code}):</span>
                  </span>
                  <span className={`text-sm italic ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Discount will be applied by backend
                  </span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Total:</span>
                  <span className="text-2xl font-bold text-red-400">₹{applyPromoCode().finalTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Service Type Selection - Using real service categories from garage */}
      <div className="flex justify-center">
        <div className={`rounded-xl p-6 border max-w-lg w-full ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Select Service Type</h3>
          {availableServiceTypes.length > 0 ? (
            <>
              <div className={`grid grid-cols-1 ${availableServiceTypes.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
                {availableServiceTypes.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setServiceType(opt.id)}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      serviceType === opt.id
                        ? 'bg-red-600 border-red-600 text-white'
                        : theme === 'light'
                        ? 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                        : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                    }`}
                    title={opt.originalName || opt.label}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {!serviceType && (
                <p className={`text-sm mt-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Please choose a service type. You can change this later.</p>
              )}
            </>
          ) : (
            <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              <p className="mb-2">No service types available for this garage.</p>
              <p className="text-xs italic">
                Service types are determined by the garage's available service categories. 
                If you don't see any options, the garage may not have service categories configured.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Booking Button */}
      <div className="text-center">
        <button
          onClick={handleBooking}
          disabled={loading}
          className={`w-full bg-gradient-to-r ${ColorPalette.primary.button.gradient} hover:${ColorPalette.primary.button.hover.gradient} text-white px-6 py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {loading ? 'Confirming Booking...' : 'Confirm Booking'}
        </button>
        <p className={`text-xs md:text-sm mt-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
          By confirming, you agree to our terms and conditions
        </p>
      </div>
    </div>
  );
};

export default SummaryStep;

