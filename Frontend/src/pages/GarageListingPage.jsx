import { faCar, faMotorcycle } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VehicleTypeSelectorModal from '../components/common/VehicleTypeSelectorModal';
import { useTheme } from '../components/context/ThemeContext';
import FourWheelerGarages from '../components/serviceListing/FourWheelerGarages';
import TwoWheelerGarages from '../components/serviceListing/TwoWheelerGarages';
import { fetchLandingPageData } from '../services/landingpage';

const GarageListingPage = () => {
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
  const [filterData, setFilterData] = useState({});
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
  }, []);

  // Get vehicle type from URL params
  useEffect(() => {
    const vehicleType = searchParams.get('vehicleType');
    if (vehicleType === 'two-wheeler' || vehicleType === 'four-wheeler') {
      setSelectedVehicleType(vehicleType);
      setIsVehicleModalOpen(false);
    } else {
      // Default to two-wheeler if no vehicle type selected, don't show modal
      setSelectedVehicleType('two-wheeler');
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('vehicleType', 'two-wheeler');
      navigate(`/garage?${newSearchParams.toString()}`, { replace: true });
      setIsVehicleModalOpen(false);
    }
  }, [searchParams, navigate]);

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const storedCity = selectedCity || sessionStorage.getItem("selectedCity");
        // Handle null, undefined, or string "null"
        const city = (storedCity && storedCity !== 'null' && storedCity.trim() !== '') 
          ? storedCity 
          : "Pune";
        const data = await fetchLandingPageData(city.toLowerCase());
        if (data && data.filter) {
          setFilterData(data.filter);
        }
      } catch (error) {
        console.error("Failed to load filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterData();
  }, [selectedCity]);

  // Session storage management
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "selectedCity") {
        setSelectedCity(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleVehicleTypeSelect = (vehicleType) => {
    if (vehicleType.available) {
      setSelectedVehicleType(vehicleType.type);
      setIsVehicleModalOpen(false);
      // Update URL without navigation
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('vehicleType', vehicleType.type);
      navigate(`/garage?${newSearchParams.toString()}`, { replace: true });
    }
  };

  const handleVehicleTypeChange = (vehicleType) => {
    setSelectedVehicleType(vehicleType);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('vehicleType', vehicleType);
    console.log(newSearchParams);
    navigate(`/garage?${newSearchParams.toString()}`, { replace: true });
  };

  const vehicleTypes = [
    {
      id: 1,
      title: "2 Wheeler",
      description: "Bikes, scooters, motorcycles",
      icon: faMotorcycle,
      type: 'two-wheeler',
      available: true
    },
    {
      id: 3,
      title: "4 Wheeler",
      description: "Cars, SUVs, passenger vehicles",
      icon: faCar,
      type: 'four-wheeler',
      available: true
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
      {selectedVehicleType === 'two-wheeler' && (
        <TwoWheelerGarages
          selectedCity={selectedCity}
          filterData={filterData}
          onVehicleTypeChange={handleVehicleTypeChange}
        />
      )}
      {selectedVehicleType === 'four-wheeler' && (
        <FourWheelerGarages
          selectedCity={selectedCity}
          filterData={filterData}
          onVehicleTypeChange={handleVehicleTypeChange}
        />
      )}

      {/* Vehicle Type Selection Modal */}
      <VehicleTypeSelectorModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          // Navigate back to home if user closes modal without selecting
          if (!selectedVehicleType) {
            navigate('/');
          }
        }}
        onSelectVehicleType={handleVehicleTypeSelect}
        title="Select Vehicle Type"
        description="Choose your vehicle type to find specialized garages"
        vehicleTypes={vehicleTypes}
        headerIcon={faMotorcycle}
        headerTitle="Garage Service"
        footerText="Click on any vehicle type to find specialized garages near you"
      />
    </div>
  );
};

export default GarageListingPage;

