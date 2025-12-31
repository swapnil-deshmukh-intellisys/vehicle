import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import VehicleTypeSelector from '../components/common/VehicleTypeSelector';
import { useTheme } from '../components/context/ThemeContext';
import { BackgroundGradients } from '../constants/designSystem';

const BuySellPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState(() => {
    const city = sessionStorage.getItem("selectedCity") || "Pune";
    if (city === "Mulshi" || city === "Hinjewadi" || city === "Wakad" || city === "Baner") {
      sessionStorage.setItem("selectedCity", "Pune");
      return "Pune";
    }
    return city;
  });
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
  const [ownerType, setOwnerType] = useState('all');
  const [condition, setCondition] = useState('all');

  // Dummy vehicle listings data
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
      navigate(`/buy-sell?${newSearchParams.toString()}`, { replace: true });
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
    navigate(`/buy-sell?${newSearchParams.toString()}`, { replace: true });
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
    return vehicleImageMap[key] || (selectedVehicleType === 'two-wheeler' 
      ? 'https://quickinsure.s3.ap-south-1.amazonaws.com/uploads/static_page/a83d207a-a933-41ac-a446-db9d23682693/Ktm%20Upcoming%20Bikes%20In%20India%202023%20New%20Launches%20And%20Bike%20Insurance.png'
      : 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400');
  };

  // Generate dummy vehicle listings based on selected vehicle type
  useEffect(() => {
    if (!selectedVehicleType) {
      setVehicleListings([]);
      return;
    }

    // Dummy data generator
    const generateDummyListings = () => {
      const listings = [];
      
      if (selectedVehicleType === 'two-wheeler') {
        // Real two-wheeler vehicles with brand-model pairs and realistic price ranges (9 models)
        const vehicles = [
          { brand: 'Honda', model: 'Activa 6G', basePrice: 75000, priceRange: [45000, 85000] },
          { brand: 'Hero', model: 'Splendor Plus', basePrice: 70000, priceRange: [40000, 75000] },
          { brand: 'Honda', model: 'Shine', basePrice: 70000, priceRange: [40000, 75000] },
          { brand: 'Bajaj', model: 'Pulsar 150', basePrice: 110000, priceRange: [65000, 120000] },
          { brand: 'TVS', model: 'Apache RTR 160', basePrice: 110000, priceRange: [65000, 120000] },
          { brand: 'Yamaha', model: 'FZ-S', basePrice: 120000, priceRange: [70000, 130000] },
          { brand: 'Royal Enfield', model: 'Classic 350', basePrice: 200000, priceRange: [140000, 210000] },
          { brand: 'KTM', model: 'Duke 200', basePrice: 200000, priceRange: [140000, 210000] },
          { brand: 'Ola', model: 'S1 Pro', basePrice: 140000, priceRange: [90000, 150000] },
        ];
        
        const years = [2020, 2021, 2022, 2023, 2024];
        const cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'];
        
        // Generate 15-18 listings with real vehicle data
        const numListings = 16;
        for (let i = 1; i <= numListings; i++) {
          const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
          const year = years[Math.floor(Math.random() * years.length)];
          const age = 2024 - year;
          
          // Calculate realistic price based on year and base price
          // Price decreases by ~15-20% per year
          const depreciation = Math.pow(0.85, age);
          const basePrice = vehicle.basePrice * depreciation;
          const priceVariation = (vehicle.priceRange[1] - vehicle.priceRange[0]) * 0.3;
          const price = Math.floor(basePrice + (Math.random() - 0.5) * priceVariation);
          
          // Realistic km driven based on year (average 10k-15k km per year)
          const avgKmPerYear = 10000 + Math.floor(Math.random() * 5000);
          const kmDriven = Math.floor(avgKmPerYear * age + (Math.random() - 0.5) * 5000);
          
          // Randomly assign partner to ~35% of listings
          const hasPartner = Math.random() < 0.35;
          const partner = hasPartner ? (Math.random() > 0.5 ? 'Spinny' : 'Cars24') : null;
          
          // Determine fuel type (most are petrol, some electric)
          const fuelType = vehicle.brand === 'Ola' ? 'Electric' : 'Petrol';
          
          listings.push({
            id: i,
            brand: vehicle.brand,
            model: vehicle.model,
            year: year,
            price: Math.max(price, vehicle.priceRange[0]), // Ensure price is within range
            kmDriven: Math.max(kmDriven, 1000), // Minimum 1k km
            location: cities[Math.floor(Math.random() * cities.length)],
            image: getVehicleImage(vehicle.brand, vehicle.model),
            ownerType: age <= 2 ? (Math.random() > 0.3 ? 'First Owner' : 'Second Owner') : (Math.random() > 0.5 ? 'Second Owner' : 'Third Owner'),
            fuelType: fuelType,
            condition: age <= 1 ? 'Excellent' : age <= 3 ? (Math.random() > 0.3 ? 'Excellent' : 'Good') : (Math.random() > 0.5 ? 'Good' : 'Fair'),
            postedDate: `${Math.floor(Math.random() * 7) + 1} days ago`,
            partner: partner
          });
        }
      } else if (selectedVehicleType === 'four-wheeler') {
        // Real four-wheeler vehicles with brand-model pairs and realistic price ranges (9 models)
        const vehicles = [
          { brand: 'Maruti Suzuki', model: 'Swift', basePrice: 600000, priceRange: [300000, 700000], fuelTypes: ['Petrol', 'CNG'] },
          { brand: 'Hyundai', model: 'i20', basePrice: 700000, priceRange: [400000, 800000], fuelTypes: ['Petrol', 'Diesel'] },
          { brand: 'Honda', model: 'City', basePrice: 1200000, priceRange: [800000, 1300000], fuelTypes: ['Petrol', 'Hybrid'] },
          { brand: 'Hyundai', model: 'Creta', basePrice: 1200000, priceRange: [800000, 1300000], fuelTypes: ['Petrol', 'Diesel'] },
          { brand: 'Tata', model: 'Nexon', basePrice: 800000, priceRange: [500000, 900000], fuelTypes: ['Petrol', 'Diesel', 'Electric'] },
          { brand: 'Mahindra', model: 'XUV700', basePrice: 1600000, priceRange: [1100000, 1700000], fuelTypes: ['Petrol', 'Diesel'] },
          { brand: 'Toyota', model: 'Fortuner', basePrice: 3500000, priceRange: [2800000, 3600000], fuelTypes: ['Petrol', 'Diesel'] },
          { brand: 'Maruti Suzuki', model: 'Ertiga', basePrice: 1000000, priceRange: [600000, 1100000], fuelTypes: ['Petrol', 'CNG'] },
          { brand: 'Tata', model: 'Nexon EV', basePrice: 1500000, priceRange: [1100000, 1600000], fuelTypes: ['Electric'] },
        ];
        
        const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
        const cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'];
        
        // Generate 15-18 listings with real vehicle data
        const numListings = 16;
        for (let i = 1; i <= numListings; i++) {
          const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
          const year = years[Math.floor(Math.random() * years.length)];
          const age = 2024 - year;
          
          // Calculate realistic price based on year and base price
          // Price decreases by ~12-18% per year for cars
          const depreciation = Math.pow(0.86, age);
          const basePrice = vehicle.basePrice * depreciation;
          const priceVariation = (vehicle.priceRange[1] - vehicle.priceRange[0]) * 0.3;
          const price = Math.floor(basePrice + (Math.random() - 0.5) * priceVariation);
          
          // Realistic km driven based on year (average 10k-12k km per year)
          const avgKmPerYear = 10000 + Math.floor(Math.random() * 2000);
          const kmDriven = Math.floor(avgKmPerYear * age + (Math.random() - 0.5) * 5000);
          
          // Randomly assign partner to ~35% of listings
          const hasPartner = Math.random() < 0.35;
          const partner = hasPartner ? (Math.random() > 0.5 ? 'Spinny' : 'Cars24') : null;
          
          // Select fuel type from vehicle's available options
          const fuelType = vehicle.fuelTypes[Math.floor(Math.random() * vehicle.fuelTypes.length)];
          
          listings.push({
            id: i,
            brand: vehicle.brand,
            model: vehicle.model,
            year: year,
            price: Math.max(price, vehicle.priceRange[0]), // Ensure price is within range
            kmDriven: Math.max(kmDriven, 5000), // Minimum 5k km
            location: cities[Math.floor(Math.random() * cities.length)],
            image: getVehicleImage(vehicle.brand, vehicle.model),
            ownerType: age <= 2 ? (Math.random() > 0.3 ? 'First Owner' : 'Second Owner') : (Math.random() > 0.5 ? 'Second Owner' : 'Third Owner'),
            fuelType: fuelType,
            condition: age <= 1 ? 'Excellent' : age <= 3 ? (Math.random() > 0.3 ? 'Excellent' : 'Good') : (Math.random() > 0.5 ? 'Good' : 'Fair'),
            postedDate: `${Math.floor(Math.random() * 7) + 1} days ago`,
            partner: partner
          });
        }
      } else if (selectedVehicleType === 'commercial') {
        const brands = ['Tata', 'Mahindra', 'Ashok Leyland', 'Eicher'];
        const models = ['Ace', 'Bolero Pickup', 'Dost', '407'];
        const years = [2019, 2020, 2021, 2022, 2023];
        const cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore'];
        
        for (let i = 1; i <= 8; i++) {
          // Randomly assign partner to ~35% of listings
          const hasPartner = Math.random() < 0.35;
          const partner = hasPartner ? (Math.random() > 0.5 ? 'Spinny' : 'Cars24') : null;
          
          listings.push({
            id: i,
            brand: brands[Math.floor(Math.random() * brands.length)],
            model: models[Math.floor(Math.random() * models.length)],
            year: years[Math.floor(Math.random() * years.length)],
            price: Math.floor(Math.random() * 2000000) + 500000, // ₹5L - ₹25L
            kmDriven: Math.floor(Math.random() * 150000) + 20000, // 20k - 170k km
            location: cities[Math.floor(Math.random() * cities.length)],
            image: 'https://images.news18.com/ibnlive/uploads/2022/09/tata-truck-1.jpg',
            ownerType: Math.random() > 0.5 ? 'First Owner' : 'Second Owner',
            fuelType: Math.random() > 0.5 ? 'Diesel' : 'CNG',
            condition: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
            postedDate: `${Math.floor(Math.random() * 7) + 1} days ago`,
            partner: partner
          });
        }
      }
      
      return listings;
    };

    const listings = generateDummyListings();
    setVehicleListings(listings);
  }, [selectedVehicleType]);


  // Apply filters to listings
  useEffect(() => {
    let filtered = [...vehicleListings];

    // Price filter
    if (minPrice) {
      const min = parseInt(minPrice);
      filtered = filtered.filter(vehicle => vehicle.price >= min);
    }
    if (maxPrice) {
      const max = parseInt(maxPrice);
      filtered = filtered.filter(vehicle => vehicle.price <= max);
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

    // Owner type filter
    if (ownerType !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.ownerType === ownerType);
    }

    // Condition filter
    if (condition !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.condition === condition);
    }

    setFilteredListings(filtered);
  }, [vehicleListings, minPrice, maxPrice, minYear, maxYear, maxKm, location, fuelType, ownerType, condition]);

  // Sort filtered listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price') {
      return a.price - b.price;
    } else if (sortBy === 'price-desc') {
      return b.price - a.price;
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
    setOwnerType('all');
    setCondition('all');
  };

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
      {/* Buy/Sell Vehicles Section */}
      <section className={`pt-4 pb-12 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20 px-4 relative overflow-x-hidden ${theme === 'light' ? BackgroundGradients.light.secondary : BackgroundGradients.dark.secondary}`}>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Buy/Sell Vehicles
            </h2>
            <p className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Browse available vehicles in your area
            </p>
          </div>

          {/* Vehicle Type Selector at Top */}
          <div className="flex justify-center mb-6">
            <VehicleTypeSelector 
              currentVehicleType={selectedVehicleType || 'two-wheeler'}
              onVehicleTypeChange={handleVehicleTypeChange}
            />
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
                      Price Range (₹)
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light'
                            ? 'bg-white text-gray-900 border-gray-300'
                            : 'bg-gray-800 text-white border-gray-600'
                        }`}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light'
                            ? 'bg-white text-gray-900 border-gray-300'
                            : 'bg-gray-800 text-white border-gray-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Year Range */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Year Range
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minYear}
                        onChange={(e) => setMinYear(e.target.value)}
                        min="2010"
                        max="2024"
                        className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light'
                            ? 'bg-white text-gray-900 border-gray-300'
                            : 'bg-gray-800 text-white border-gray-600'
                        }`}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxYear}
                        onChange={(e) => setMaxYear(e.target.value)}
                        min="2010"
                        max="2024"
                        className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'light'
                            ? 'bg-white text-gray-900 border-gray-300'
                            : 'bg-gray-800 text-white border-gray-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* KM Driven */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Maximum KM Driven
                    </h3>
                    <select
                      value={maxKm}
                      onChange={(e) => setMaxKm(e.target.value)}
                      className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light'
                          ? 'bg-white text-gray-900 border-gray-300'
                          : 'bg-gray-800 text-white border-gray-600'
                      }`}
                    >
                      <option value="all">All</option>
                      <option value="10000">Under 10,000 km</option>
                      <option value="20000">Under 20,000 km</option>
                      <option value="30000">Under 30,000 km</option>
                      <option value="50000">Under 50,000 km</option>
                      <option value="100000">Under 1,00,000 km</option>
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
                      className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light'
                          ? 'bg-white text-gray-900 border-gray-300'
                          : 'bg-gray-800 text-white border-gray-600'
                      }`}
                    >
                      <option value="all">All Locations</option>
                      {availableLocations.map((loc) => (
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
                      className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light'
                          ? 'bg-white text-gray-900 border-gray-300'
                          : 'bg-gray-800 text-white border-gray-600'
                      }`}
                    >
                      <option value="all">All Fuel Types</option>
                      {availableFuelTypes.map((fuel) => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
                    </select>
                  </div>

                  {/* Owner Type */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Owner Type
                    </h3>
                    <select
                      value={ownerType}
                      onChange={(e) => setOwnerType(e.target.value)}
                      className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light'
                          ? 'bg-white text-gray-900 border-gray-300'
                          : 'bg-gray-800 text-white border-gray-600'
                      }`}
                    >
                      <option value="all">All</option>
                      <option value="First Owner">First Owner</option>
                      <option value="Second Owner">Second Owner</option>
                    </select>
                  </div>

                  {/* Condition */}
                  <div className="mb-4 md:mb-6">
                    <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
                      Condition
                    </h3>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className={`w-full rounded-lg px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        theme === 'light'
                          ? 'bg-white text-gray-900 border-gray-300'
                          : 'bg-gray-800 text-white border-gray-600'
                      }`}
                    >
                      <option value="all">All Conditions</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={clearFilters}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    Clear All Filters
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
                  {sortedListings.length} {sortedListings.length === 1 ? 'vehicle' : 'vehicles'} found
                </div>
                
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className={`inline-flex items-center justify-center font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 border ${
                      theme === 'light'
                        ? 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <span className="mr-2">
                      Sort: {sortBy === 'price' ? 'Price (Low to High)' : sortBy === 'price-desc' ? 'Price (High to Low)' : sortBy === 'year' ? 'Year (Newest)' : 'KM (Lowest)'}
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Sort Dropdown Menu */}
                  {isSortOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-56 border rounded-lg shadow-lg z-50 ${
                      theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600'
                    }`}>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setSortBy('price');
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            sortBy === 'price'
                              ? theme === 'light' ? 'text-red-600 bg-gray-100' : 'text-red-400 bg-gray-700'
                              : theme === 'light'
                              ? 'text-gray-700 hover:bg-gray-50'
                              : 'text-white hover:bg-gray-700'
                          }`}
                        >
                          Price: Low to High
                        </button>
                        <button
                          onClick={() => {
                            setSortBy('price-desc');
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            sortBy === 'price-desc'
                              ? theme === 'light' ? 'text-red-600 bg-gray-100' : 'text-red-400 bg-gray-700'
                              : theme === 'light'
                              ? 'text-gray-700 hover:bg-gray-50'
                              : 'text-white hover:bg-gray-700'
                          }`}
                        >
                          Price: High to Low
                        </button>
                        <button
                          onClick={() => {
                            setSortBy('year');
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            sortBy === 'year'
                              ? theme === 'light' ? 'text-red-600 bg-gray-100' : 'text-red-400 bg-gray-700'
                              : theme === 'light'
                              ? 'text-gray-700 hover:bg-gray-50'
                              : 'text-white hover:bg-gray-700'
                          }`}
                        >
                          Year: Newest First
                        </button>
                        <button
                          onClick={() => {
                            setSortBy('km');
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            sortBy === 'km'
                              ? theme === 'light' ? 'text-red-600 bg-gray-100' : 'text-red-400 bg-gray-700'
                              : theme === 'light'
                              ? 'text-gray-700 hover:bg-gray-50'
                              : 'text-white hover:bg-gray-700'
                          }`}
                        >
                          KM Driven: Lowest First
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Listings Grid */}
              {sortedListings.length === 0 ? (
                <div className="text-center py-12">
                  <FontAwesomeIcon icon={faShoppingCart} className={`text-6xl mb-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'}`} />
                  <p className={`text-lg mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    No vehicles found for this category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedListings.map((vehicle, index) => (
                    <div
                      key={vehicle.id}
                      className={`rounded-xl overflow-hidden transition-all cursor-pointer ${
                        theme === 'light' 
                          ? 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md' 
                          : 'bg-gray-800 border border-gray-700 hover:border-gray-600 hover:shadow-lg'
                      }`}
                      onClick={() => {
                        navigate(`/buy-sell/${vehicle.id}`, { state: { vehicle } });
                      }}
                    >
                      <div className="relative bg-white">
                        <img
                          src={vehicle.image}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-48 object-contain p-2"
                          onError={(e) => {
                            e.target.src = selectedVehicleType === 'two-wheeler' 
                              ? 'https://quickinsure.s3.ap-south-1.amazonaws.com/uploads/static_page/a83d207a-a933-41ac-a446-db9d23682693/Ktm%20Upcoming%20Bikes%20In%20India%202023%20New%20Launches%20And%20Bike%20Insurance.png'
                              : selectedVehicleType === 'four-wheeler'
                              ? 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400'
                              : 'https://images.news18.com/ibnlive/uploads/2022/09/tata-truck-1.jpg';
                          }}
                        />
                        {/* Partner Logo - Left Side */}
                        {vehicle.partner && (
                          <div className="absolute top-2 left-2 bg-white bg-opacity-95 rounded-lg px-1.5 py-1  shadow-lg flex items-center border border-gray-200">
                            <img
                              src={vehicle.partner === 'Spinny' 
                                ? 'https://latestlogo.com/wp-content/uploads/2024/01/spinny-dark.svg'
                                : 'https://wp.logos-download.com/wp-content/uploads/2023/02/Cars24_Logo.png?dl'
                              }
                              alt={vehicle.partner}
                              className="max-h-4 w-auto object-contain"
                              style={{ aspectRatio: 'auto' }}
                              onError={(e) => {
                                // Fallback to text if image fails to load
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                if (parent && !parent.querySelector('.fallback-text')) {
                                  const fallback = document.createElement('span');
                                  fallback.className = `fallback-text text-xs font-bold ${
                                    vehicle.partner === 'Spinny' 
                                      ? 'text-blue-700' 
                                      : 'text-orange-700'
                                  }`;
                                  fallback.textContent = vehicle.partner;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          </div>
                        )}
                        {/* Condition Badge - Right Side */}
                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          {vehicle.condition}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {vehicle.year} • {vehicle.kmDriven.toLocaleString()} km
                          </p>
                        </div>
                        
                        <div className={`flex items-center text-sm mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{vehicle.location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {vehicle.ownerType} • {vehicle.fuelType}
                          </span>
                          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                            {vehicle.postedDate}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div>
                            <span className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              ₹{vehicle.price.toLocaleString()}
                            </span>
                          </div>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle view details - will be handled by parent component
                          if (onVehicleClick) {
                            onVehicleClick(vehicle);
                          }
                        }}
                      >
                        View Details
                      </button>
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

export default BuySellPage;

