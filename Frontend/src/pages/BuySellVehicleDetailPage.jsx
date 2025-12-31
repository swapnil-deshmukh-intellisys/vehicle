import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { 
  MapPinIcon, 
  PhoneIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapPin, 
  faPhone,
  faCalendar,
  faCheck,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../components/context/ThemeContext';

const BuySellVehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  // Get vehicle data from location state if available (from navigation)
  const vehicle = location.state?.vehicle;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Generate multiple images for the vehicle (using the same image for now, but can be expanded)
  const vehicleImages = [
    vehicle?.image,
    vehicle?.image,
    vehicle?.image,
    vehicle?.image
  ].filter(Boolean);

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
              Vehicle Details
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
                    {/* Partner Logo Overlay */}
                    {vehicle.partner && (
                      <div className="absolute top-4 left-4 bg-white bg-opacity-95 rounded-lg px-3 py-1.5 shadow-lg flex items-center border border-gray-200">
                        <img
                          src={vehicle.partner === 'Spinny' 
                            ? 'https://latestlogo.com/wp-content/uploads/2024/01/spinny-dark.svg'
                            : 'https://wp.logos-download.com/wp-content/uploads/2023/02/Cars24_Logo.png?dl'
                          }
                          alt={vehicle.partner}
                          className="max-h-6 w-auto object-contain"
                          style={{ aspectRatio: 'auto' }}
                        />
                      </div>
                    )}
                    {/* Condition Badge */}
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                      {vehicle.condition}
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
            {/* Title and Price */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {vehicle.year} • {vehicle.kmDriven?.toLocaleString()} km
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold text-red-600 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                    ₹{vehicle.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Key Features
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
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Owner</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.ownerType}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Condition</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.condition}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className={`text-sm mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Posted</div>
                  <div className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {vehicle.postedDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Description
              </h2>
              <p className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} leading-relaxed`}>
                This {vehicle.year} {vehicle.brand} {vehicle.model} is in {vehicle.condition.toLowerCase()} condition and has been driven {vehicle.kmDriven?.toLocaleString()} km. 
                It's a {vehicle.ownerType.toLowerCase()} vehicle running on {vehicle.fuelType.toLowerCase()}. 
                {vehicle.partner && ` This vehicle is listed through our authorized partner ${vehicle.partner}, ensuring quality and reliability.`}
                The vehicle is well-maintained and ready for immediate use. Contact the seller for more details and to schedule a viewing.
              </p>
            </div>

            {/* Location */}
            <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Location
              </h2>
              <div className="flex items-center">
                <MapPinIcon className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                <span className={`text-lg ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {vehicle.location}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar - Contact & Price */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl p-6 border sticky top-20 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className={`text-sm mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Price
                </div>
                <div className={`text-4xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  ₹{vehicle.price?.toLocaleString()}
                </div>
              </div>

              {/* Partner Badge */}
              {vehicle.partner && (
                <div className={`mb-6 p-4 rounded-lg ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900 bg-opacity-20 border border-blue-800'}`}>
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faShieldAlt} className={`text-blue-600 mr-2 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
                    <span className={`font-semibold ${theme === 'light' ? 'text-blue-900' : 'text-blue-300'}`}>
                      Authorized Partner
                    </span>
                  </div>
                  <div className="flex items-center">
                    <img
                      src={vehicle.partner === 'Spinny' 
                        ? 'https://latestlogo.com/wp-content/uploads/2024/01/spinny-dark.svg'
                        : 'https://wp.logos-download.com/wp-content/uploads/2023/02/Cars24_Logo.png?dl'
                      }
                      alt={vehicle.partner}
                      className="max-h-5 w-auto object-contain"
                      style={{ aspectRatio: 'auto' }}
                    />
                  </div>
                </div>
              )}

              {/* Contact Seller Button */}
              <button
                onClick={() => {
                  alert(`Contact seller for ${vehicle?.brand} ${vehicle?.model}. This feature will be implemented soon.`);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4"
              >
                Contact Seller
              </button>

              {/* Additional Info */}
              <div className={`space-y-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2 text-green-600" />
                  <span>Verified Listing</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2 text-green-600" />
                  <span>Quick Response</span>
                </div>
                {vehicle.partner && (
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2 text-green-600" />
                    <span>Partner Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuySellVehicleDetailPage;

