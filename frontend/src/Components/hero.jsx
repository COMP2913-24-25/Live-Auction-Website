import { useState, useRef, useEffect } from "react";
import { Search, Filter, X, ChevronDown, Check, ChevronUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

function Hero() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [authenticatedOnly, setAuthenticatedOnly] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(5);
  const [priceErrors, setPriceErrors] = useState({ min: '', max: '' });
  const [timeFilter, setTimeFilter] = useState({
    value: 5,
    unit: 'days'
  });
  
  // Available categories
  const categories = [
    { id: 1, name: "Art" },
    { id: 2, name: "Antiques" },
    { id: 3, name: "Jewelry" },
    { id: 4, name: "Clothing" },
    { id: 5, name: "Collectibles" },
    { id: 6, name: "Electronics" },
    { id: 7, name: "Home & Garden" },
    { id: 8, name: "Sports Equipment" },
    { id: 9, name: "Toys & Games" },
    { id: 10, name: "Vehicles" },
    { id: 11, name: "Books" },
    { id: 12, name: "Others" }
  ];
  
  useEffect(() => {
    // Close filters when clicking outside
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    // Parse URL search params on component mount
    const searchParams = new URLSearchParams(location.search);
    
    // Get search query
    const query = searchParams.get("search");
    if (query) setSearchQuery(query);
    
    // Get category filters
    const categoryParam = searchParams.get("categories");
    if (categoryParam) {
      setSelectedCategories(categoryParam.split(","));
    }
    
    // Get price range
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      setPriceRange({
        min: minPrice || "",
        max: maxPrice || ""
      });
    }
    
    // Get authenticated only
    const authOnly = searchParams.get("authenticatedOnly");
    if (authOnly === "true") {
      setAuthenticatedOnly(true);
    }
    
    // Get days remaining
    const days = searchParams.get("daysRemaining");
    if (days) {
      setDaysRemaining(parseInt(days));
    }
  }, [location.search]);
  
  useEffect(() => {
    if (showFilters) {
      const params = new URLSearchParams(location.search);
      
      // Only update filters if parameters exist
      if (params.has('categories')) {
        setSelectedCategories(params.get('categories').split(',').map(Number));
      }
      
      if (params.has('minPrice') || params.has('maxPrice')) {
        setPriceRange({
          min: params.get('minPrice') || '',
          max: params.get('maxPrice') || ''
        });
      }
      
      if (params.has('authenticatedOnly')) {
        setAuthenticatedOnly(params.get('authenticatedOnly') === 'true');
      }
      
      if (params.has('daysRemaining')) {
        const days = parseInt(params.get('daysRemaining'));
        setTimeFilter({
          value: days < 1 ? 24 : days,
          unit: days < 1 ? 'hours' : 'days'
        });
      }
    }
  }, [showFilters, location.search]);

  useEffect(() => {
    // Update selected categories when URL changes
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("categories");
    
    if (categoryParam) {
      const categories = categoryParam.split(",").map(Number);
      setSelectedCategories(categories);
    } else {
      setSelectedCategories([]);
    }
  }, [location.search]);
  
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const clearFilters = () => {
    // Reset all filters to default values
    setSelectedCategories([]);
    setPriceRange({ min: "", max: "" });
    setAuthenticatedOnly(false);
    setTimeFilter({
      value: 5,
      unit: 'days'
    });
    setPriceErrors({ min: '', max: '' });
    
    // Clear URL parameters
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('categories');
    searchParams.delete('minPrice');
    searchParams.delete('maxPrice');
    searchParams.delete('authenticatedOnly');
    searchParams.delete('daysRemaining');
    
    // Keep search query if exists
    const currentSearch = searchParams.get('search');
    searchParams.delete('search');
    if (currentSearch) {
      searchParams.set('search', currentSearch);
    }
    
    // Update URL without the cleared filters
    navigate(`/browse${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    const searchParams = new URLSearchParams();
    
    if (searchQuery.trim()) {
      searchParams.set("search", searchQuery);
    }
    
    if (selectedCategories.length > 0) {
      searchParams.set("categories", selectedCategories.join(","));
    }
    
    if (priceRange.min) {
      searchParams.set("minPrice", priceRange.min);
    }
    
    if (priceRange.max) {
      searchParams.set("maxPrice", priceRange.max);
    }
    
    if (authenticatedOnly) {
      searchParams.set("authenticatedOnly", "true");
    }
    
    // Convert hours to days for API
    const timeInDays = timeFilter.unit === 'hours' 
      ? (timeFilter.value === 24 ? 1 : timeFilter.value / 24)
      : timeFilter.value;
    searchParams.set("daysRemaining", timeInDays.toString());
    
    navigate(`/browse?${searchParams.toString()}`);
    setShowFilters(false);
  };
  
  // Count active filters
  const calculateActiveFilterCount = () => {
    let count = 0;
    
    if (selectedCategories && selectedCategories.length > 0) {
      count += selectedCategories.length; // Changed to count each category
    }
    
    // Count price filters
    if (priceRange.min && priceRange.min !== '0') count += 1;
    if (priceRange.max && priceRange.max !== '0') count += 1;
    
    // Count authenticated only if true
    if (authenticatedOnly) count += 1;
    
    // Count time filter if not default (5 days)
    if (timeFilter.unit === 'hours' || timeFilter.value !== 5) count += 1;
    
    return count;
  };

  const activeFilterCount = calculateActiveFilterCount();
  
  const validatePrice = (value, type) => {
    const num = parseFloat(value);
    if (value && (isNaN(num) || num < 0.01)) {
      setPriceErrors(prev => ({
        ...prev,
        [type]: 'Minimum price is £0.01'
      }));
      // Set minimum value
      setPriceRange(prev => ({
        ...prev,
        [type]: '0.01'
      }));
      return false;
    }
    if (value && num > 100000000000) {
      setPriceErrors(prev => ({
        ...prev,
        [type]: 'Maximum price is £100 billion'
      }));
      return false;
    }
    setPriceErrors(prev => ({
      ...prev,
      [type]: ''
    }));
    return true;
  };

  const adjustPrice = (value, adjustment) => {
    if (!value) return adjustment > 0 ? '0.01' : '0';
    const num = parseFloat(value);
    const newValue = Math.max(0, num + adjustment);
    return newValue.toFixed(2);
  };

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-white pt-16 w-full">
      <div className="py-16 px-10">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Discover Unique Treasures</h2>
          <p className="text-xl mb-8 text-white/90">
            Find exclusive items and bid with confidence on our secure platform
          </p>
          
          <div className="relative max-w-2xl mx-auto" ref={filterRef}>
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowFilters(true)}
                  className="w-full pl-4 pr-10 py-3 rounded-l-lg text-gray-800 bg-white shadow-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <button 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 border-l border-gray-200 bg-white text-gray-700 flex items-center ${activeFilterCount > 0 ? 'text-blue-600 font-medium' : ''}`}
              >
                <Filter className="h-5 w-5 mr-1" />
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              
              <button 
                type="submit"
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg flex items-center justify-center transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
            
            {/* Filters dropdown */}
            {showFilters && (
              <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 text-left max-h-[90vh] overflow-y-auto">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Filters</h3>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={clearFilters} 
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear all
                      </button>
                      <button 
                        onClick={() => setShowFilters(false)} 
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Categories section */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Categories</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(category => (
                        <div 
                          key={category.id}
                          className="flex items-center"
                        >
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className={`flex items-center text-sm rounded-md px-2 py-1 w-full ${
                              selectedCategories.includes(category.id) 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className={`h-4 w-4 mr-2 rounded border flex items-center justify-center ${
                              selectedCategories.includes(category.id)
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-400'
                            }`}>
                              {selectedCategories.includes(category.id) && <Check className="h-3 w-3" />}
                            </div>
                            {category.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price Range - WITH VALIDATION */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <span className="text-gray-500 bg-transparent">£</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Min"
                            value={priceRange.min}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              const parts = value.split('.');
                              const formatted = parts.length > 1 
                                ? `${parts[0]}.${parts[1].substring(0, 2)}`
                                : value;
                              
                              setPriceRange(prev => ({ ...prev, min: formatted }));
                              
                              if (formatted && parseFloat(formatted) < 0.01) {
                                setPriceErrors(prev => ({
                                  ...prev,
                                  min: 'Minimum price is £0.01'
                                }));
                              } else {
                                setPriceErrors(prev => ({
                                  ...prev,
                                  min: ''
                                }));
                              }
                            }}
                            className="pl-7 pr-12 py-2 bg-gray-50 border rounded-md w-full text-sm focus:ring-blue-500 focus:outline-none text-gray-900"
                          />
                          <div className="absolute inset-y-0 right-0 flex flex-col border-l border-gray-300">
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = adjustPrice(priceRange.min, 0.01);
                                setPriceRange(prev => ({ ...prev, min: newValue }));
                              }}
                              className="flex-1 px-2 hover:bg-gray-100 text-gray-600"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = adjustPrice(priceRange.min, -0.01);
                                setPriceRange(prev => ({ ...prev, min: newValue }));
                              }}
                              className="flex-1 px-2 hover:bg-gray-100 text-gray-600 border-t border-gray-300"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {priceErrors.min && (
                          <p className="mt-1 text-xs text-red-600">{priceErrors.min}</p>
                        )}
                      </div>
                      <span className="text-gray-500">to</span>
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <span className="text-gray-500 bg-transparent">£</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Max"
                            value={priceRange.max}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              const parts = value.split('.');
                              const formatted = parts.length > 1 
                                ? `${parts[0]}.${parts[1].substring(0, 2)}`
                                : value;
                              
                              const num = parseFloat(formatted);
                              if (num > 100000000000) {
                                setPriceErrors(prev => ({
                                  ...prev,
                                  max: 'Maximum price is £100 billion'
                                }));
                              } else {
                                setPriceRange(prev => ({ ...prev, max: formatted }));
                                setPriceErrors(prev => ({ ...prev, max: '' }));
                              }
                            }}
                            className="pl-7 pr-12 py-2 bg-gray-50 border rounded-md w-full text-sm focus:ring-blue-500 focus:outline-none text-gray-900"
                          />
                          <div className="absolute inset-y-0 right-0 flex flex-col border-l border-gray-300">
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = adjustPrice(priceRange.max, 0.01);
                                setPriceRange(prev => ({ ...prev, max: newValue }));
                              }}
                              className="flex-1 px-2 hover:bg-gray-100 text-gray-600"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = adjustPrice(priceRange.max, -0.01);
                                setPriceRange(prev => ({ ...prev, max: newValue }));
                              }}
                              className="flex-1 px-2 hover:bg-gray-100 text-gray-600 border-t border-gray-300"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {priceErrors.max && (
                          <p className="mt-1 text-xs text-red-600">{priceErrors.max}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Days Remaining */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Time Remaining</h4>
                    <div className="space-y-2">
                      <select
                        value={`${timeFilter.value}-${timeFilter.unit}`}
                        onChange={(e) => {
                          const [value, unit] = e.target.value.split('-');
                          console.log('Time filter changed:', { value, unit });
                          setTimeFilter({ value: parseInt(value), unit });
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="5-days">Default (5 days)</option>
                        <option value="24-hours">Less than 24 hours</option>
                        <option value="1-days">1 day or less</option>
                        <option value="2-days">2 days or less</option>
                        <option value="3-days">3 days or less</option>
                        <option value="4-days">4 days or less</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Authentication section with title */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
                    <button
                      type="button"
                      onClick={() => setAuthenticatedOnly(!authenticatedOnly)}
                      className="flex items-center text-sm py-2"
                    >
                      <div className={`h-5 w-5 mr-2 rounded border flex items-center justify-center ${
                        authenticatedOnly
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-400'
                      }`}>
                        {authenticatedOnly && <Check className="h-4 w-4" />}
                      </div>
                      <span className="text-gray-700">Authenticated sellers only</span>
                    </button>
                  </div>
                  
                  {/* Apply filters button */}
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors mt-2"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;