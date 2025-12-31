import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './BannerCarousel.css';
import { ColorPalette } from '../../constants/designSystem';

const BannerCarousel = ({ banners, onFindGaragesClick }) => {
  // Ensure banners is an array
  const bannerList = Array.isArray(banners) ? banners : [];
  const hasMultipleBanners = bannerList.length >= 2;

  // Handle VIEW PRICES button click - scroll to pricing section or services
  const handleViewPricesClick = () => {
    const servicesSection = document.getElementById('services-section');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If no banners, show a default banner
  if (bannerList.length === 0) {
    return (
      <section className="relative w-full overflow-hidden aspect-[21/9] md:aspect-auto md:h-[50vh]">
        <div className="relative h-full w-full">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'url(https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg)',
              width: '100%',
              height: '100%'
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          </div>
          <div className="relative z-10 flex items-center justify-center h-full px-4 sm:px-6 md:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight drop-shadow-lg">
                <span className="text-white">Find Your</span>
                <span className="text-cyan-400"> Perfect</span>
                <span className="text-white"> Garage</span>
              </h1>
              <p className="text-sm md:text-base text-gray-200 mb-6 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                Professional vehicle service and maintenance at your fingertips
              </p>
              <div className="flex flex-row gap-2 sm:gap-3 justify-center">
                <button 
                  onClick={onFindGaragesClick}
                  className={`bg-gradient-to-r ${ColorPalette.primary.button.gradient} hover:${ColorPalette.primary.button.hover.gradient} text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-xs md:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black/50`}
                  aria-label="Find garages near you"
                >
                  FIND GARAGES
                </button>
                <button 
                  onClick={handleViewPricesClick}
                  className="border-cyan-400 text-white hover:bg-cyan-400 hover:text-black font-semibold py-2 px-4 rounded-xl transition-colors duration-200 border-2 text-xs md:text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black/50"
                  aria-label="View service prices"
                >
                  VIEW PRICES
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden aspect-[21/9] md:aspect-auto md:h-[50vh]">
      <Swiper
        key={`banner-carousel-${bannerList.length}`}
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={hasMultipleBanners ? {
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        } : false}
        pagination={hasMultipleBanners ? {
          clickable: true,
          dynamicBullets: false,
        } : false}
        navigation={hasMultipleBanners}
        loop={hasMultipleBanners}
        speed={600}
        allowTouchMove={true}
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
        aria-label="Banner carousel"
      >
        {bannerList.map((banner, index) => (
          <SwiperSlide key={banner.id || banner._id || index} style={{ width: '100%', height: '100%' }}>
            <div className="relative h-full w-full" style={{ width: '100%', height: '100%' }}>
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: `url(${banner.image || banner.banner_image || 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg'})`,
                  width: '100%',
                  height: '100%',
                  zIndex: 0
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default BannerCarousel;
