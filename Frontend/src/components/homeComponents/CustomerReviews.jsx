import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { BackgroundGradients } from '../../constants/designSystem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCheck, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';

const CustomerReviews = () => {
  const { theme } = useTheme();

  const reviews = [
    {
      name: "Rahul Sharma",
      location: "Mumbai",
      rating: 5,
      comment: "Found a great garage for my bike service. Transparent pricing and quality work. Highly recommended!",
      verified: true,
      timestamp: "2 days ago",
      vehicle: "Yamaha MT-15",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Priya Patel",
      location: "Delhi",
      rating: 5,
      comment: "Excellent service for my car. The garage was professional and completed work on time. Will use again!",
      verified: true,
      timestamp: "1 week ago",
      vehicle: "Hyundai Creta",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Amit Kumar",
      location: "Bangalore",
      rating: 4,
      comment: "Good platform for comparing garage prices. Saved money on my truck service. Very satisfied!",
      verified: false,
      timestamp: "2 weeks ago",
      vehicle: "Tata Truck",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const renderStars = (rating, size = "text-sm md:text-lg") => {
    return Array.from({ length: 5 }, (_, i) => (
      <FontAwesomeIcon 
        key={i}
        icon={faStar} 
        className={`${size} ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <section className={`pt-4 pb-12 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.neutral : BackgroundGradients.dark.neutral}`} data-reviews-section>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            What Our Customers Say
          </h2>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center">
            <div className="flex items-center space-x-1 md:space-x-2 mb-2">
              {renderStars(5, "text-sm md:text-lg")}
              <span className={`text-sm md:text-lg font-bold ml-1 md:ml-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                4.8/5
              </span>
            </div>
            <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Based on 2,500+ customer reviews
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {reviews.map((review, index) => (
            <div 
              key={index}
              className="group relative flex"
            >
              <div className={`relative  p-4 md:p-6 transition-all duration-500 transform group-hover:scale-105 w-full flex flex-col h-full ${
                theme === 'light' 
                  ? 'bg-transparent ' 
                  : 'bg-transparent border border-gray-700 hover:border-gray-600'
              }`}>
                <div className="absolute top-1 left-1 md:top-4 md:left-4 opacity-10">
                  <FontAwesomeIcon 
                    icon={faQuoteLeft} 
                    className="text-2xl md:text-4xl text-gray-400"
                  />
                </div>

                <div className="flex items-center justify-between mb-2 md:mb-3 flex-shrink-0">
                  <div className="flex items-center space-x-0.5 md:space-x-1">
                    {renderStars(review.rating, "text-xs md:text-sm")}
                  </div>
                  {review.verified && (
                    <span className="flex items-center text-green-500 text-xs font-semibold">
                      <FontAwesomeIcon icon={faCheck} className="mr-1 text-xs" />
                      Verified
                    </span>
                  )}
                </div>

                <p className={`text-xs md:text-sm leading-relaxed mb-3 md:mb-4 relative z-10 flex-grow ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  "{review.comment}"
                </p>

                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm md:text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {review.name}
                      </h4>
                      <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {review.timestamp}
                      </span>
                    </div>
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {review.location} • {review.vehicle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;

