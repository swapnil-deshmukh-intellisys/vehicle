import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const FilterSystem = ({ filterData, onApplyFilters, isMobile, onSortChange, onClearAll }) => {
  const { theme } = useTheme();
  const [brandSearch, setBrandSearch] = useState('');
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isServiceCategoryOpen, setIsServiceCategoryOpen] = useState({});
  
  const brandDropdownRef = useRef(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    brands: [],
    distance: 5, // Default to 5km
    services: [],
    sort: 'distance' // Default sort by distance
  });

  // Mock brands data - in production, this would come from API
  const brands = [
    'Honda', 'Yamaha', 'Bajaj', 'TVS', 'Hero', 'Royal Enfield', 
    'KTM', 'Suzuki', 'Kawasaki', 'Ducati', 'BMW', 'Harley Davidson',
    'Aprilia', 'Triumph', 'Kawasaki', 'Benelli', 'Jawa', 'Mahindra'
  ];

  // Service categories with services
  const serviceCategories = {
    'Basic Maintenance': [
      'General Service',
      'Engine Oil Change', 
      'Bike Wash',
      'Chain Lubrication'
    ],
    'Mechanical Repairs': [
      'Brake Pad Replacement',
      'Clutch Service',
      'Chain & Sprocket',
      'Engine Repair',
      'Transmission Service'
    ],
    'Tyres & Battery': [
      'Tyre Replacement',
      'Battery Replacement',
      'Tyre Puncture Repair',
      'Wheel Alignment'
    ],
    'Other Services': [
      'Performance Tuning',
      'Roadside Assistance',
      'Insurance Claim',
      'Custom Modifications'
    ]
  };

  // Filtered brands based on search
  const filteredBrands = brands.filter(brand =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Handle brand selection
  const handleBrandToggle = (brand) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }));
  };

  // Handle distance slider change
  const handleDistanceChange = (distance) => {
    setFilters(prev => ({
      ...prev,
      distance: parseInt(distance)
    }));
  };

  // Handle service selection
  const handleServiceToggle = (service) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  // Handle sort change
  const handleSortChange = (sortValue) => {
    setFilters(prev => ({
      ...prev,
      sort: sortValue
    }));
    if (onSortChange) {
      onSortChange(sortValue);
    }
  };

  // Toggle service category
  const toggleServiceCategory = (category) => {
    setIsServiceCategoryOpen(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      brands: [],
      distance: 5,
      services: [],
      sort: 'distance'
    });
    setBrandSearch('');
    onApplyFilters({});
    // Also clear garage type and brand selection if callback provided
    if (onClearAll) {
      onClearAll();
    }
  };

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setIsBrandDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Brand Selector Component
  const BrandSelector = () => (
    <div className="mb-4 md:mb-6">
      <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
        <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
        Brand
      </h3>
      <div className="relative" ref={brandDropdownRef}>
        <button
          onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
          className={`group w-full border-2 rounded-xl px-3 py-2.5 md:px-4 md:py-3.5 text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
            theme === 'light' 
              ? 'bg-white/80 backdrop-blur-sm border-gray-300 hover:border-red-400 text-gray-900 shadow-md hover:shadow-lg' 
              : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 hover:border-red-500 text-white shadow-md hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs md:text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {filters.brands.length === 0 
                ? 'Select brands...' 
                : `${filters.brands.length} brand${filters.brands.length > 1 ? 's' : ''} selected`
              }
            </span>
            <ChevronDownIcon className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isBrandDropdownOpen && (
          <div className={`absolute z-50 w-fit min-w-full top-full left-0 mt-2 md:mt-3 border-2 rounded-xl md:rounded-2xl shadow-2xl max-h-60 overflow-hidden backdrop-blur-xl ${
            theme === 'light' 
              ? 'bg-white/95 border-gray-200' 
              : 'bg-gray-800/95 border-gray-700'
          }`}>
            <div className={`p-3 md:p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className={`w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 text-xs md:text-sm rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                    theme === 'light' 
                      ? 'bg-gray-50 text-gray-900 border-gray-300' 
                      : 'bg-gray-900 text-white border-gray-600'
                  }`}
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto pt-2 pb-2">
              {filteredBrands.map((brand) => (
                <label
                  key={brand}
                  className={`flex items-center px-3 md:px-4 py-2 md:py-3 cursor-pointer transition-all duration-150 ${
                    theme === 'light' 
                      ? 'hover:bg-red-50 hover:text-red-600' 
                      : 'hover:bg-gray-700 hover:text-red-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className={`w-4 h-4 md:w-5 md:h-5 text-red-600 rounded-md focus:ring-red-500 focus:ring-2 transition-all ${
                      theme === 'light' 
                        ? 'bg-white border-2 border-gray-300 checked:border-red-500' 
                        : 'bg-gray-800 border-2 border-gray-600 checked:border-red-500'
                    }`}
                    style={{ accentColor: '#dc2626' }}
                  />
                  <span className={`ml-2 md:ml-3 text-xs md:text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Distance Range Slider Component
  const DistanceSlider = () => (
    <div className="mb-4 md:mb-6">
      <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
        <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
        Distance: <span className="text-red-600">{filters.distance} km</span>
      </h3>
      <div className="px-2">
        <div className="relative">
          <input
            type="range"
            min="1"
            max="15"
            value={filters.distance}
            onChange={(e) => handleDistanceChange(e.target.value)}
            className={`w-full h-2 md:h-3 rounded-full appearance-none cursor-pointer slider ${
              theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
            }`}
            style={{
              background: theme === 'light'
                ? `linear-gradient(to right, #dc2626 0%, #dc2626 ${(filters.distance - 1) / 14 * 100}%, #e5e7eb ${(filters.distance - 1) / 14 * 100}%, #e5e7eb 100%)`
                : `linear-gradient(to right, #dc2626 0%, #dc2626 ${(filters.distance - 1) / 14 * 100}%, #374151 ${(filters.distance - 1) / 14 * 100}%, #374151 100%)`
            }}
          />
          <div className={`absolute top-1/2 left-0 right-0 h-2 md:h-3 rounded-full pointer-events-none ${
            theme === 'light' ? 'bg-red-600/20' : 'bg-red-600/30'
          }`} style={{
            width: `${(filters.distance - 1) / 14 * 100}%`
          }}></div>
        </div>
        <div className={`flex justify-between text-[10px] md:text-xs font-semibold mt-2 md:mt-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
          <span>1 km</span>
          <span>15 km</span>
        </div>
      </div>
    </div>
  );

  // Services Filter Component
  const ServicesFilter = () => (
    <div className="mb-4 md:mb-6">
      <h3 className={`text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
        <span className="w-0.5 md:w-1 h-4 md:h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></span>
        Services
      </h3>
      <div className="space-y-2 md:space-y-3">
        {Object.entries(serviceCategories).map(([category, services]) => (
          <div key={category} className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
            theme === 'light' 
              ? 'border-gray-200 bg-white/50 hover:border-red-300' 
              : 'border-gray-700 bg-gray-700/50 hover:border-red-500'
          }`}>
            <button
              onClick={() => toggleServiceCategory(category)}
              className={`w-full px-3 py-2.5 md:px-5 md:py-4 text-left transition-all duration-200 ${
                theme === 'light' 
                  ? 'text-gray-900 hover:bg-red-50 focus:outline-none focus:bg-red-50' 
                  : 'text-white hover:bg-gray-600 focus:outline-none focus:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs md:text-sm">{category}</span>
                <ChevronDownIcon 
                  className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  } ${
                    isServiceCategoryOpen[category] ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isServiceCategoryOpen[category] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className={`px-3 md:px-5 pt-3 md:pt-4 pb-3 md:pb-4 space-y-2 md:space-y-3 border-t ${
                theme === 'light' ? 'border-gray-200 bg-gray-50/50' : 'border-gray-700 bg-gray-800/50'
              }`}>
                {services.map((service) => (
                  <label key={service} className={`flex items-center cursor-pointer p-1.5 md:p-2 rounded-lg transition-all duration-150 ${
                    theme === 'light' 
                      ? 'hover:bg-white hover:text-red-600' 
                      : 'hover:bg-gray-700 hover:text-red-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={filters.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className={`w-4 h-4 md:w-5 md:h-5 text-red-600 rounded-md focus:ring-red-500 focus:ring-2 transition-all ${
                        theme === 'light' 
                          ? 'bg-white border-2 border-gray-300 checked:border-red-500' 
                          : 'bg-gray-800 border-2 border-gray-600 checked:border-red-500'
                      }`}
                      style={{ accentColor: '#dc2626' }}
                    />
                    <span className={`ml-2 md:ml-3 text-xs md:text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>{service}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`rounded-2xl mb-6 backdrop-blur-xl transition-all duration-300 ${
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
      </div>

      {/* Filter content - always visible when FilterSystem is shown */}
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <BrandSelector />
        <DistanceSlider />
        <ServicesFilter />

          {/* Premium action buttons */}
          <div className={`flex gap-2 md:gap-3 pt-3 md:pt-4 border-t ${
            theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'
          }`}>
            <button
              onClick={handleApplyFilters}
              className="group/btn flex-1 relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2.5 px-4 md:py-3 md:px-5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/30 text-xs md:text-sm"
            >
              <span className="relative z-10">Apply Filters</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
            </button>
            <button
              onClick={handleClearFilters}
              className={`flex-1 font-bold py-2.5 px-4 md:py-3 md:px-5 rounded-xl transition-all duration-300 border-2 text-xs md:text-sm ${
                theme === 'light' 
                  ? 'bg-white border-gray-300 hover:border-gray-400 text-gray-900 hover:bg-gray-50 shadow-md hover:shadow-lg' 
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500 text-white hover:bg-gray-700 shadow-md hover:shadow-lg'
              }`}
            >
              Clear All
            </button>
          </div>
      </div>
    </div>
  );
};

// Sort By Dropdown Component (to be used in garage listing area)
export const SortByDropdown = ({ currentSort, onSortChange }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { value: 'distance', label: 'Distance (Nearest First)' },
    { value: 'rating-high', label: 'Rating (High → Low)' },
    { value: 'rating-low', label: 'Rating (Low → High)' },
    { value: 'price-low', label: 'Price (Low → High)' },
    { value: 'price-high', label: 'Price (High → Low)' },
    { value: 'service-time', label: 'Service Time (Fastest First)' }
  ];

  const currentOption = sortOptions.find(option => option.value === currentSort) || sortOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative isolate z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center space-x-2 border-2 rounded-xl px-3 py-2 md:px-4 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
          theme === 'light' 
            ? 'bg-white/80 backdrop-blur-sm border-gray-300 text-gray-900 hover:bg-white hover:border-red-400 shadow-md hover:shadow-lg' 
            : 'bg-gray-800/80 backdrop-blur-sm border-gray-600 text-white hover:bg-gray-800 hover:border-red-500 shadow-md hover:shadow-lg'
        }`}
      >
        <span className="text-xs md:text-sm font-bold">{currentOption.label}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-200 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 right-0 mt-2 md:mt-3 w-fit min-w-56 md:min-w-64 border-2 rounded-xl md:rounded-2xl shadow-2xl ${
          theme === 'light' 
            ? 'bg-white border-gray-200' 
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="py-2 pt-2 md:pt-3">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium transition-all duration-150 ${
                  currentSort === option.value 
                    ? theme === 'light'
                      ? 'text-red-600 bg-red-50 border-l-4 border-red-600' 
                      : 'text-red-400 bg-gray-700 border-l-4 border-red-500'
                    : theme === 'light' 
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-red-600' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-red-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSystem;