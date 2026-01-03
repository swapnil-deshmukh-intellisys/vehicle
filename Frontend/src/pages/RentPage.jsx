import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VehicleTypeSelector from '../components/common/VehicleTypeSelector';
import { useTheme } from '../components/context/ThemeContext';
import { BackgroundGradients } from '../constants/designSystem';

const RentPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [sortBy, setSortBy] = useState('price');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Filter states
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [maxKm, setMaxKm] = useState('all');
  const [location, setLocation] = useState('all');
  const [fuelType, setFuelType] = useState('all');
  const [rentalType, setRentalType] = useState('all'); // daily, weekly, monthly
  const [transmission, setTransmission] = useState('all'); // manual, automatic

  // Dummy vehicle rental listings data
  const [vehicleListings, setVehicleListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);

  // Get vehicle type from URL params
  useEffect(() => {
    const vehicleType = searchParams.get('vehicleType');
    if (vehicleType === 'two-wheeler' || vehicleType === 'four-wheeler') {
      setSelectedVehicleType(vehicleType);
      sessionStorage.setItem('selectedVehicleType', vehicleType);
    } else {
      // Default to two-wheeler if no vehicle type selected, don't show modal
      setSelectedVehicleType('two-wheeler');
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('vehicleType', 'two-wheeler');
      navigate(`/rent?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleVehicleTypeChange = (vehicleType) => {
    setSelectedVehicleType(vehicleType);
    sessionStorage.setItem('selectedVehicleType', vehicleType);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('vehicleType', vehicleType);
    navigate(`/rent?${newSearchParams.toString()}`, { replace: true });
  };

  // Vehicle model image mapping (strictly 9 bikes and 9 four-wheelers)
  const vehicleImageMap = {
    // Two-wheelers (9 models only)
    'Honda Activa 6G': 'https://cdn.bikedekho.com/processedimages/honda/activa-6g/source/activa-6g68a6fb7b20bd3.jpg',
    'Hero Splendor Plus': 'https://www.heromotocorp.com/content/dam/hero-aem-website/brand/hero-homepage/bike/motorcycles/splendor-plus-nav.png',
    'Honda Shine': 'https://assets.otocapital.in/prod/matt-sangria-red-metallic-honda-cbshine-image.jpeg',
    'Bajaj Pulsar 150': 'https://www.carandbike.com/_next/image?url=https%3A%2F%2Fimages.carandbike.com%2Fbike-images%2Flarge%2Fbajaj%2Fpulsar-150%2Fbajaj-pulsar-150.jpg%3Fv%3D71&w=1600&q=75',
    'TVS Apache RTR 160': 'https://cdn.bikedekho.com/processedimages/tvs/tvs-apache/source/tvs-apache68d3da60ecae8.jpg',
    'Yamaha FZ-S': 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/111153/fz-s-right-front-three-quarter-2.png?isig=0',
    'Royal Enfield Classic 350': 'https://cdn.bikedekho.com/processedimages/royal-enfield/classic350/source/classic35068b6db31f3948.jpg?imwidth=412&impolicy=resize',
    'KTM Duke 200': 'https://media.zigcdn.com/media/model/2024/Oct/front-right-view-1888583955_600x400.jpg',
    'Ola S1 Pro': 'https://cdn.olaelectric.com/sites/evdp/pages/gen3/s1_pro_plus_scooter_image.webp',
    
    // Four-wheelers (9 models only)
    'Maruti Suzuki Swift': 'https://www.varunmaruti.com/uploads/products/colors/new-swift-pearl-arctic-white.png',
    'Hyundai i20': 'https://trident-group.s3.ap-south-1.amazonaws.com/hyundai/models/colors/1698929224.png',
    'Honda City': 'https://stimg.cardekho.com/images/carexteriorimages/930x620/Honda/City/12093/1755764990493/front-left-side-47.jpg',
    'Hyundai Creta': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/106815/creta-exterior-right-front-three-quarter-6.png?isig=0&q=80',
    'Tata Nexon': 'https://images.91wheels.com/assets/b_images/main/models/profile/profile1747633078.jpg?w=840&q=50',
    'Mahindra XUV700': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/42355/xuv700-exterior-right-front-three-quarter-2.png?isig=0&q=80',
    'Toyota Fortuner': 'https://images.91wheels.com/assets/b_images/main/models/profile/profile1701778977.jpg?w=840&q=50',
    'Maruti Suzuki Ertiga': 'https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Ertiga/10288/1755776579514/front-left-side-47.jpg?imwidth=420&impolicy=resize',
    'Tata Nexon EV': 'https://stimg.cardekho.com/images/carexteriorimages/930x620/Tata/Nexon-EV/11024/1755845297648/front-left-side-47.jpg',
  };

  // Helper function to get vehicle image
  const getVehicleImage = (brand, model) => {
    const key = `${brand} ${model}`;
    return vehicleImageMap[key] || 'https://quickinsure.s3.ap-south-1.amazonaws.com/uploads/static_page/a83d207a-a933-41ac-a446-db9d23682693/Ktm%20Upcoming%20Bikes%20In%20India%202023%20New%20Launches%20And%20Bike%20Insurance.png';
  };

  // Generate dummy vehicle rental listings based on selected vehicle type
  useEffect(() => {
    if (!selectedVehicleType) {
      setVehicleListings([]);
      return;
    }

    // Dummy data generator
    const generateDummyListings = () => {
      const listings = [];
      
      if (selectedVehicleType === 'two-wheeler') {
        // Real two-wheeler vehicles with realistic rental prices (9 models)
        const vehicles = [
          { brand: 'Honda', model: 'Activa 6G', dailyPrice: 300, weeklyPrice: 1800, monthlyPrice: 6000, fuelType: 'Petrol', transmission: 'Automatic' },
          { brand: 'Hero', model: 'Splendor Plus', dailyPrice: 250, weeklyPrice: 1400, monthlyPrice: 4800, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Honda', model: 'Shine', dailyPrice: 280, weeklyPrice: 1600, monthlyPrice: 5500, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Bajaj', model: 'Pulsar 150', dailyPrice: 400, weeklyPrice: 2400, monthlyPrice: 8500, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'TVS', model: 'Apache RTR 160', dailyPrice: 450, weeklyPrice: 2700, monthlyPrice: 9500, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Yamaha', model: 'FZ-S', dailyPrice: 450, weeklyPrice: 2700, monthlyPrice: 9500, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Royal Enfield', model: 'Classic 350', dailyPrice: 800, weeklyPrice: 4800, monthlyPrice: 16000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'KTM', model: 'Duke 200', dailyPrice: 700, weeklyPrice: 4200, monthlyPrice: 14000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Ola', model: 'S1 Pro', dailyPrice: 400, weeklyPrice: 2400, monthlyPrice: 8500, fuelType: 'Electric', transmission: 'Automatic' },
        ];
        
        const years = [2020, 2021, 2022, 2023, 2024];
        const cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'];
        const rentalTypes = ['Daily', 'Weekly', 'Monthly'];
        
        // Generate 15-18 listings
        const numListings = 16;
        for (let i = 1; i <= numListings; i++) {
          const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
          const year = years[Math.floor(Math.random() * years.length)];
          const age = 2024 - year;
          
          // Adjust rental prices slightly based on vehicle age (newer = slightly higher)
          const ageFactor = 1 - (age * 0.05); // 5% reduction per year
          const dailyPrice = Math.floor(vehicle.dailyPrice * ageFactor);
          const weeklyPrice = Math.floor(vehicle.weeklyPrice * ageFactor);
          const monthlyPrice = Math.floor(vehicle.monthlyPrice * ageFactor);
          
          // Realistic km driven based on year
          const avgKmPerYear = 10000 + Math.floor(Math.random() * 5000);
          const kmDriven = Math.floor(avgKmPerYear * age + (Math.random() - 0.5) * 5000);
          
          listings.push({
            id: i,
            brand: vehicle.brand,
            model: vehicle.model,
            year: year,
            dailyPrice: Math.max(dailyPrice, Math.floor(vehicle.dailyPrice * 0.7)),
            weeklyPrice: Math.max(weeklyPrice, Math.floor(vehicle.weeklyPrice * 0.7)),
            monthlyPrice: Math.max(monthlyPrice, Math.floor(vehicle.monthlyPrice * 0.7)),
            kmDriven: Math.max(kmDriven, 1000),
            location: cities[Math.floor(Math.random() * cities.length)],
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            rentalType: rentalTypes[Math.floor(Math.random() * rentalTypes.length)],
            image: getVehicleImage(vehicle.brand, vehicle.model),
            available: Math.random() > 0.2, // 80% available
            rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 - 5.0
            reviews: Math.floor(Math.random() * 50) + 10
          });
        }
      } else if (selectedVehicleType === 'four-wheeler') {
        // Real four-wheeler vehicles with realistic rental prices (9 models)
        const vehicles = [
          { brand: 'Maruti Suzuki', model: 'Swift', dailyPrice: 1200, weeklyPrice: 7000, monthlyPrice: 25000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Hyundai', model: 'i20', dailyPrice: 1400, weeklyPrice: 8000, monthlyPrice: 28000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Honda', model: 'City', dailyPrice: 2000, weeklyPrice: 12000, monthlyPrice: 42000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Hyundai', model: 'Creta', dailyPrice: 2500, weeklyPrice: 15000, monthlyPrice: 52000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Tata', model: 'Nexon', dailyPrice: 1700, weeklyPrice: 10000, monthlyPrice: 36000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Mahindra', model: 'XUV700', dailyPrice: 4000, weeklyPrice: 24000, monthlyPrice: 82000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Toyota', model: 'Fortuner', dailyPrice: 6000, weeklyPrice: 36000, monthlyPrice: 120000, fuelType: 'Diesel', transmission: 'Automatic' },
          { brand: 'Maruti Suzuki', model: 'Ertiga', dailyPrice: 2000, weeklyPrice: 12000, monthlyPrice: 42000, fuelType: 'Petrol', transmission: 'Manual' },
          { brand: 'Tata', model: 'Nexon EV', dailyPrice: 2500, weeklyPrice: 15000, monthlyPrice: 52000, fuelType: 'Electric', transmission: 'Automatic' },
        ];
        
        const years = [2020, 2021, 2022, 2023, 2024];
        const cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'];
        const rentalTypes = ['Daily', 'Weekly', 'Monthly'];
        
        // Generate 15-18 listings
        const numListings = 16;
        for (let i = 1; i <= numListings; i++) {
          const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
          const year = years[Math.floor(Math.random() * years.length)];
          const age = 2024 - year;
          
          // Adjust rental prices slightly based on vehicle age
          const ageFactor = 1 - (age * 0.04); // 4% reduction per year
          const dailyPrice = Math.floor(vehicle.dailyPrice * ageFactor);
          const weeklyPrice = Math.floor(vehicle.weeklyPrice * ageFactor);
          const monthlyPrice = Math.floor(vehicle.monthlyPrice * ageFactor);
          
          // Realistic km driven based on year
          const avgKmPerYear = 10000 + Math.floor(Math.random() * 2000);
          const kmDriven = Math.floor(avgKmPerYear * age + (Math.random() - 0.5) * 5000);
          
          // Some vehicles have automatic transmission option
          const transmission = vehicle.transmission === 'Automatic' ? 'Automatic' : 
                             (Math.random() > 0.5 ? 'Manual' : 'Automatic');
          
          listings.push({
            id: i,
            brand: vehicle.brand,
            model: vehicle.model,
            year: year,
            dailyPrice: Math.max(dailyPrice, Math.floor(vehicle.dailyPrice * 0.7)),
            weeklyPrice: Math.max(weeklyPrice, Math.floor(vehicle.weeklyPrice * 0.7)),
            monthlyPrice: Math.max(monthlyPrice, Math.floor(vehicle.monthlyPrice * 0.7)),
            kmDriven: Math.max(kmDriven, 5000),
            location: cities[Math.floor(Math.random() * cities.length)],
            fuelType: vehicle.fuelType,
            transmission: transmission,
            rentalType: rentalTypes[Math.floor(Math.random() * rentalTypes.length)],
            image: getVehicleImage(vehicle.brand, vehicle.model),
            available: Math.random() > 0.2, // 80% available
            rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 - 5.0
            reviews: Math.floor(Math.random() * 50) + 10
          });
        }
      } else if (selectedVehicleType === 'commercial') {
        const brands = ['Tata', 'Mahindra', 'Ashok Leyland', 'Eicher'];
        const models = ['Ace', 'Bolero', '407', 'Pro'];
        const years = [2020, 2021, 2022, 2023];
        const cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore'];
        const fuelTypes = ['Diesel', 'CNG'];
        const transmissions = ['Manual'];
        const rentalTypes = ['Daily', 'Weekly', 'Monthly'];
        
        for (let i = 1; i <= 8; i++) {
          listings.push({
            id: i,
            brand: brands[Math.floor(Math.random() * brands.length)],
            model: models[Math.floor(Math.random() * models.length)],
            year: years[Math.floor(Math.random() * years.length)],
            dailyPrice: Math.floor(Math.random() * 3000) + 1500, // ₹1500 - ₹4500/day
            weeklyPrice: Math.floor(Math.random() * 18000) + 9000, // ₹9000 - ₹27000/week
            monthlyPrice: Math.floor(Math.random() * 60000) + 30000, // ₹30000 - ₹90000/month
            kmDriven: Math.floor(Math.random() * 100000) + 20000, // 20k - 120k km
            location: cities[Math.floor(Math.random() * cities.length)],
            fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
            transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
            rentalType: rentalTypes[Math.floor(Math.random() * rentalTypes.length)],
            image: 'https://images.news18.com/ibnlive/uploads/2022/09/tata-truck-1.jpg',
            available: Math.random() > 0.3, // 70% available
            rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 - 5.0
            reviews: Math.floor(Math.random() * 30) + 5
          });
        }
      }
      
      return listings;
    };

    const listings = generateDummyListings();
    setVehicleListings(listings);
    setFilteredListings(listings);
  }, [selectedVehicleType]);


  // Apply filters
  useEffect(() => {
    let filtered = [...vehicleListings];

    // Price filter (daily price)
    if (minPrice) {
      const min = parseInt(minPrice);
      filtered = filtered.filter(vehicle => vehicle.dailyPrice >= min);
    }
    if (maxPrice) {
      const max = parseInt(maxPrice);
      filtered = filtered.filter(vehicle => vehicle.dailyPrice <= max);
    }

    // Year filter
    if (minYear) {
      const min = parseInt(minYear);
      filtered = filtered.filter(vehicle => vehicle.year >= min);
    }
    if (maxYear) {
      const max = parseInt(maxYear);
      filtered = filtered.filter(vehicle => vehicle.year <= max);
    }

    // KM driven filter
    if (maxKm !== 'all') {
      const max = parseInt(maxKm);
      filtered = filtered.filter(vehicle => vehicle.kmDriven <= max);
    }

    // Location filter
    if (location !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.location === location);
    }

    // Fuel type filter
    if (fuelType !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.fuelType === fuelType);
    }

    // Rental type filter
    if (rentalType !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.rentalType === rentalType);
    }

    // Transmission filter
    if (transmission !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.transmission === transmission);
    }

    setFilteredListings(filtered);
  }, [vehicleListings, minPrice, maxPrice, minYear, maxYear, maxKm, location, fuelType, rentalType, transmission]);

  // Sort filtered listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price') {
      return a.dailyPrice - b.dailyPrice;
    } else if (sortBy === 'price-desc') {
      return b.dailyPrice - a.dailyPrice;
    } else if (sortBy === 'year') {
      return b.year - a.year;
    } else if (sortBy === 'km') {
      return a.kmDriven - b.kmDriven;
    }
    return 0;
  });

  // Get unique locations from listings
  const availableLocations = [...new Set(vehicleListings.map(v => v.location))];
  const availableFuelTypes = [...new Set(vehicleListings.map(v => v.fuelType))];

  // Clear all filters
  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinYear('');
    setMaxYear('');
    setMaxKm('all');
    setLocation('all');
    setFuelType('all');
    setRentalType('all');
    setTransmission('all');
  };

  const handleVehicleClick = (vehicle) => {
    navigate(`/rent/${vehicle.id}`, { state: { vehicle } });
  };

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
      {/* Rent Vehicles Section */}
      <section className={`pt-4 pb-12 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20 px-4 relative overflow-x-hidden ${theme === 'light' ? BackgroundGradients.light.secondary : BackgroundGradients.dark.secondary}`}>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Rent Vehicles
            </h2>
            <p className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Browse available vehicles for rent in your area
            </p>
          </div>

          {/* Vehicle Type Selector at Top */}
          <div className="flex justify-center mb-6">
            <VehicleTypeSelector 
              currentVehicleType={selectedVehicleType || 'two-wheeler'}
              onVehicleTypeChange={handleVehicleTypeChange}
            />
          </div>

          {/* Mobile Filter Button - Outside of sidebar */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center justify-center font-semibold py-2 px-4 rounded-xl transition-all duration-200 border-2 ${
                theme === 'light' 
                  ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg' 
                  : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500 shadow-md hover:shadow-lg'
              }`}
            >
              <span className="mr-2 text-xs md:text-sm">Filters</span>
              <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <div className={`lg:col-span-1 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
              <div className={`rounded-2xl mb-6 backdrop-blur-xl transition-all duration-300 sticky top-4 ${
                theme === 'light' 
                  ? 'bg-white/90 border border-gray-200/50 shadow-xl' 
                  : 'bg-gray-800/90 border border-gray-700/50 shadow-2xl'
              }`}>
                {/* Premium header */}
                <div className={`flex items-center justify-between p-4 md:p-6 border-b ${
                  theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'
                }`}>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg`}>
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className={`text-base md:text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Filters</h2>
                      <p className={`text-[10px] md:text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        Refine your search
                      </p>
                    </div>
                  </div>
                  {isMobile && (
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className={`text-gray-500 hover:text-gray-700 ${theme === 'light' ? 'hover:text-gray-700' : 'hover:text-gray-300'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Filter content */}
                <div className="space-y-4 md:space-y-6 p-4 md:p-6">
                  {/* Price Range */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Daily Price (₹)
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                        }`}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Year Range */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Year
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minYear}
                        onChange={(e) => setMinYear(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                        }`}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxYear}
                        onChange={(e) => setMaxYear(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* KM Driven */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Max KM Driven
                    </h3>
                    <select
                      value={maxKm}
                      onChange={(e) => setMaxKm(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                      }`}
                    >
                      <option value="all">All</option>
                      <option value="10000">Up to 10,000 km</option>
                      <option value="25000">Up to 25,000 km</option>
                      <option value="50000">Up to 50,000 km</option>
                      <option value="100000">Up to 100,000 km</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Location
                    </h3>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                      }`}
                    >
                      <option value="all">All Locations</option>
                      {availableLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuel Type */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Fuel Type
                    </h3>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                      }`}
                    >
                      <option value="all">All</option>
                      {availableFuelTypes.map(fuel => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rental Type */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Rental Type
                    </h3>
                    <select
                      value={rentalType}
                      onChange={(e) => setRentalType(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                      }`}
                    >
                      <option value="all">All</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Transmission
                    </h3>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-600 text-white'
                      }`}
                    >
                      <option value="all">All</option>
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  <button
                    onClick={clearFilters}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`${isFilterOpen ? 'lg:col-span-3' : 'col-span-1 lg:col-span-3'}`}>
              {/* Sort and Results Count */}
              <div className="mb-6 flex justify-between items-center gap-4">
                {/* Results Count */}
                <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {sortedListings.length} {sortedListings.length === 1 ? 'vehicle' : 'vehicles'} available
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                        : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    <span className="text-sm font-medium">Sort: </span>
                    <span className="text-sm">
                      {sortBy === 'price' ? 'Price: Low to High' :
                       sortBy === 'price-desc' ? 'Price: High to Low' :
                       sortBy === 'year' ? 'Year: Newest' :
                       sortBy === 'km' ? 'KM: Low to High' : 'Default'}
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSortOpen && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg border shadow-lg z-10 ${
                      theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
                    }`}>
                      <button
                        onClick={() => { setSortBy('price'); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          theme === 'light' ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-gray-700 text-white'
                        }`}
                      >
                        Price: Low to High
                      </button>
                      <button
                        onClick={() => { setSortBy('price-desc'); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          theme === 'light' ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-gray-700 text-white'
                        }`}
                      >
                        Price: High to Low
                      </button>
                      <button
                        onClick={() => { setSortBy('year'); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          theme === 'light' ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-gray-700 text-white'
                        }`}
                      >
                        Year: Newest
                      </button>
                      <button
                        onClick={() => { setSortBy('km'); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          theme === 'light' ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-gray-700 text-white'
                        }`}
                      >
                        KM: Low to High
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Cards */}
              {sortedListings.length === 0 ? (
                <div className={`text-center py-12 rounded-lg border ${
                  theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-700'
                }`}>
                  <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    No vehicles found matching your criteria
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedListings.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => handleVehicleClick(vehicle)}
                      className={`rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-xl transform hover:scale-105 ${
                        theme === 'light'
                          ? 'bg-white border-gray-200 hover:border-red-500'
                          : 'bg-gray-800 border-gray-700 hover:border-red-500'
                      } ${!vehicle.available ? 'opacity-60' : ''}`}
                    >
                      {/* Vehicle Image */}
                      <div className="relative h-48 overflow-hidden bg-white">
                        <img
                          src={vehicle.image}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-contain p-2"
                        />
                        {!vehicle.available && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                              Not Available
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            vehicle.rentalType === 'Daily' ? 'bg-green-500 text-white' :
                            vehicle.rentalType === 'Weekly' ? 'bg-blue-500 text-white' :
                            'bg-purple-500 text-white'
                          }`}>
                            {vehicle.rentalType}
                          </span>
                        </div>
                      </div>

                      {/* Vehicle Details */}
                      <div className="p-4">
                        <h3 className={`text-lg font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {vehicle.year} • {vehicle.kmDriven.toLocaleString()} km • {vehicle.fuelType} • {vehicle.transmission}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Daily</p>
                            <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              ₹{vehicle.dailyPrice}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Weekly</p>
                            <p className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              ₹{vehicle.weeklyPrice}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Monthly</p>
                            <p className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              ₹{vehicle.monthlyPrice}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                              {vehicle.rating}
                            </span>
                            <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                              ({vehicle.reviews})
                            </span>
                          </div>
                          <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {vehicle.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RentPage;

