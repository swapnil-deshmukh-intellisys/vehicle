import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { 
  MapPinIcon, 
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapPin, 
  faCalendar,
  faCheck,
  faShieldAlt,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../components/context/ThemeContext';

const RentVehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  // Get vehicle data from location state if available (from navigation)
  const vehicle = location.state?.vehicle;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedRentalType, setSelectedRentalType] = useState(vehicle?.rentalType || 'Daily');
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');

  // Generate multiple images for the vehicle (using the same image for now, but can be expanded)
  const vehicleImages = [
    vehicle?.image,
    vehicle?.image,
    vehicle?.image,
    vehicle?.image
  ].filter(Boolean);

  // Calculate rental price based on selected type
  const getRentalPrice = () => {
    if (!vehicle) return 0;
    switch (selectedRentalType) {
      case 'Daily':
        return vehicle.dailyPrice;
      case 'Weekly':
        return vehicle.weeklyPrice;
      case 'Monthly':
        return vehicle.monthlyPrice;
      default:
        return vehicle.dailyPrice;
    }
  };

  if (!vehicle) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
        <div className="text-center py-12">
          <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            No vehicle information available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'}`}>
      {/* Header */}
      <div className={`${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-800'} border-b sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-red-600' : 'text-white hover:text-red-500'}`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Rental Details
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Image Gallery */}
        <div className="mb-6">
          {vehicleImages.length > 0 ? (
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={10}
              slidesPerView={1}
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              className="rounded-xl overflow-hidden"
            >
              {vehicleImages.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="relative w-full" style={{ height: '400px' }}>
                    <img
                      src={img}
                      alt={`${vehicle.brand} ${vehicle.model} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800';
                      }}
                    />
                    {/* Availability Badge */}
                    {!vehicle.available && (
                      <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        Not Available
                      </div>
                    )}
                    {vehicle.available && (
                      <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        Available Now
                      </div>
                    )}
                    {/* Rental Type Badge */}
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-sm font-semibold ${
                      vehicle.rentalType === 'Daily' ? 'bg-green-500 text-white' :
                      vehicle.rentalType === 'Weekly' ? 'bg-blue-500 text-white' :
                      'bg-purple-500 text-white'
                    }`}>
                      {vehicle.rentalType} Rental
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-xl flex items-center justify-center">
              <p className={`text-gray-500 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                No images available
              </p>
            </div>
          )}
        </div>

        {/* Vehicle Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Rating */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {vehicle.year} • {vehicle.kmDriven?.toLocaleString()} km • {vehicle.fuelType} • {vehicle.transmission}
                  </p>
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon
                          key={i}
                          icon={faStar}
                          className={`w-4 h-4 ${
                            i < Math.floor(parseFloat(vehicle.rating || 4.5))
                              ? 'text-yellow-400'
                              : theme === 'light' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {vehicle.rating || '4.5'}
                    </span>
                    <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      ({vehicle.reviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Pricing Options */}
            <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Rental Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedRentalType('Daily')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRentalType === 'Daily'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : theme === 'light'
                      ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Daily</div>
                  <div className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    ₹{vehicle.dailyPrice?.toLocaleString()}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>per day</div>
                </button>
                <button
                  onClick={() => setSelectedRentalType('Weekly')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRentalType === 'Weekly'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : theme === 'light'
                      ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Weekly</div>
                  <div className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    ₹{vehicle.weeklyPrice?.toLocaleString()}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>per week</div>
                </button>
                <button
                  onClick={() => setSelectedRentalType('Monthly')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRentalType === 'Monthly'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : theme === 'light'
                      ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Monthly</div>
                  <div className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    ₹{vehicle.monthlyPrice?.toLocaleString()}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>per month</div>
                </button>
              </div>
            </div>

            {/* Key Features */}
            <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Vehicle Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Year</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.year}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>KM Driven</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.kmDriven?.toLocaleString()} km
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Fuel Type</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.fuelType}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Transmission</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.transmission}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Rental Type</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.rentalType}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Availability</div>
                  <div className={`text-lg font-semibold ${vehicle.available ? 'text-green-600' : 'text-red-600'}`}>
                    {vehicle.available ? 'Available' : 'Not Available'}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                About This Vehicle
              </h2>
              <p className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} leading-relaxed`}>
                This {vehicle.year} {vehicle.brand} {vehicle.model} is available for rent and has been driven {vehicle.kmDriven?.toLocaleString()} km. 
                It features a {vehicle.transmission.toLowerCase()} transmission and runs on {vehicle.fuelType.toLowerCase()}. 
                The vehicle is well-maintained and ready for immediate rental. Perfect for {selectedRentalType.toLowerCase()} rentals, 
                this vehicle offers great value and reliability. Contact us to book your rental period and enjoy a hassle-free experience.
              </p>
            </div>

            {/* Location */}
            <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Pickup Location
              </h2>
              <div className="flex items-center">
                <MapPinIcon className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                <span className={`text-lg ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {vehicle.location}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar - Booking & Price */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl p-6 border sticky top-20 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              {/* Selected Rental Price */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className={`text-sm mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {selectedRentalType} Rental Price
                </div>
                <div className={`text-4xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  ₹{getRentalPrice()?.toLocaleString()}
                </div>
                <div className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {selectedRentalType === 'Daily' ? 'per day' : selectedRentalType === 'Weekly' ? 'per week' : 'per month'}
                </div>
              </div>

              {/* Availability Status */}
              <div className={`mb-6 p-4 rounded-lg ${
                vehicle.available 
                  ? theme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-900 bg-opacity-20 border border-green-800'
                  : theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900 bg-opacity-20 border border-red-800'
              }`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${vehicle.available ? 'bg-green-600' : 'bg-red-600'}`}></div>
                  <span className={`font-semibold ${vehicle.available ? (theme === 'light' ? 'text-green-900' : 'text-green-300') : (theme === 'light' ? 'text-red-900' : 'text-red-300')}`}>
                    {vehicle.available ? 'Available for Rent' : 'Currently Unavailable'}
                  </span>
                </div>
              </div>

              {/* Rental Period Selection */}
              {vehicle.available && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={selectedStartDate}
                      onChange={(e) => setSelectedStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={selectedEndDate}
                      onChange={(e) => setSelectedEndDate(e.target.value)}
                      min={selectedStartDate || new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Rent Now Button */}
              <button
                onClick={() => {
                  alert(`Rent ${vehicle?.brand} ${vehicle?.model} for ${selectedRentalType.toLowerCase()} rental (${selectedStartDate} to ${selectedEndDate}). Total: ₹${getRentalPrice().toLocaleString()}. This feature will be implemented soon.`);
                }}
                disabled={!vehicle.available || !selectedStartDate || !selectedEndDate}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors mb-4 ${
                  vehicle.available && selectedStartDate && selectedEndDate
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {vehicle.available ? 'Rent Now' : 'Not Available'}
              </button>

              {/* Additional Info */}
              <div className={`space-y-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2 text-green-600" />
                  <span>Verified Listing</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2 text-green-600" />
                  <span>Flexible Rental Periods</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2 text-green-600" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2 text-green-600" />
                  <span>Insurance Included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentVehicleDetailPage;

