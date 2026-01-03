import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  HomeIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { fetchBookingDetails } from '../services/bookingService';
import { fetchGarageById } from '../services/garageDetailService';
import { useTheme } from '../components/context/ThemeContext';

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [booking, setBooking] = useState(null);
  const [garageDetails, setGarageDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBookingDetails = async () => {
      if (!bookingId) {
        setError('Booking ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const bookingData = await fetchBookingDetails(bookingId);
        
        if (bookingData) {
          setBooking(bookingData);
          
          // Check if garage_details exists, otherwise fetch garage details separately
          if (bookingData.garage_details) {
            // Garage details already included in booking data
            setGarageDetails(bookingData.garage_details);
          } else if (bookingData.garage) {
            // Garage is just an ID, fetch full garage details
            try {
              console.log('🔍 Fetching garage details for garage ID:', bookingData.garage);
              const garageData = await fetchGarageById(bookingData.garage);
              
              if (garageData) {
                // Map garage API response to expected format
                setGarageDetails({
                  name: garageData.name || '',
                  owner: garageData.owner || garageData.contact_person || '',
                  phone: garageData.phone || '',
                  email: garageData.email || '',
                  address: garageData.address || ''
                });
                console.log('✅ Garage details loaded:', garageData);
              } else {
                console.warn('⚠️ Garage details not found for garage ID:', bookingData.garage);
              }
            } catch (garageError) {
              console.error('Error fetching garage details:', garageError);
              // Continue without garage details rather than failing the whole page
            }
          }
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        console.error('Error loading booking details:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              // If we came from profile page, navigate back to profile with bookings tab active
              if (location.state?.fromProfile) {
                navigate('/profile', { state: { activeTab: 'bookings' } });
              } else {
                navigate(-1);
              }
            }}
            className={`mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-900'} rounded-lg p-6 border ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
            <p className={`${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
              {error || 'Booking not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusDisplay = booking.current_status?.displayname || 'Work Completed';
  const timeline = booking.timeline || [];

  const bookingDate = booking.booking_date ? formatDate(booking.booking_date) : '';
  const bookingTime = booking.booking_slot || '';

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              // If we came from profile page, navigate back to profile with bookings tab active
              if (location.state?.fromProfile) {
                navigate('/profile', { state: { activeTab: 'bookings' } });
              } else {
                navigate(-1);
              }
            }}
            className={`mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {statusDisplay}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Details Card */}
            <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-900'} rounded-lg p-6 border ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Booking Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Booking ID</p>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{booking.id}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Date</p>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{bookingDate}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Time Slot</p>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{bookingTime}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Amount</p>
                  <p className={`font-semibold text-red-500`}>
                    ₹{parseFloat(booking.total_amount || booking.booking_amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Garage Details Card */}
            {garageDetails && (
              <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-900'} rounded-lg p-6 border ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Garage Details
                </h2>
                <div className="space-y-3">
                  {garageDetails.name && (
                    <div className="flex items-center gap-3">
                      <HomeIcon className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{garageDetails.name}</p>
                    </div>
                  )}
                  {garageDetails.owner && (
                    <div className="flex items-center gap-3">
                      <UserIcon className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{garageDetails.owner}</p>
                    </div>
                  )}
                  {garageDetails.email && (
                    <div className="flex items-center gap-3">
                      <EnvelopeIcon className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{garageDetails.email}</p>
                    </div>
                  )}
                  {garageDetails.address && (
                    <div className="flex items-start gap-3">
                      <MapPinIcon className={`w-5 h-5 mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{garageDetails.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-1">
            <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-900'} rounded-lg p-6 border ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'} sticky top-6`}>
              <h2 className={`text-lg font-semibold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Timeline
              </h2>
              {timeline.length > 0 ? (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
                  
                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {timeline.map((entry, index) => {
                      const isFirst = index === 0;
                      const entryDate = entry.created_at ? formatDateTime(entry.created_at) : '';
                      const displayName = entry.status?.displayname || entry.displayname || entry.status || 'Status Update';
                      
                      return (
                        <div key={index} className="relative flex items-start gap-4">
                          {/* Timeline Dot */}
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                            isFirst 
                              ? 'bg-purple-500' 
                              : 'bg-green-500'
                          }`}>
                            {!isFirst && (
                              <CheckCircleIcon className="w-5 h-5 text-white" />
                            )}
                          </div>
                          
                          {/* Timeline Content */}
                          <div className="flex-1 pt-1">
                            <p className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              {displayName}
                            </p>
                            {entry.remark && (
                              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                {entry.remark}
                              </p>
                            )}
                            {entryDate && (
                              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                {entryDate}
                              </p>
                            )}
                            {entry.jobcard_number && (
                              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                {entry.jobcard_number}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                  No timeline entries available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;

