import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import Categories from "../components/categories";
import TrustIndicators from "../components/TrustIndicators";
import AuctionList from "../components/AuctionList";

function Browse() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    categories: [],
    minPrice: "",
    maxPrice: "",
    authenticatedOnly: false,
    daysRemaining: 5
  });

  // Parse URL parameters when location changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    const newFilters = {
      search: searchParams.get("search") || "",
      categories: searchParams.get("categories") ? 
        searchParams.get("categories").split(",").map(Number) : [],
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      authenticatedOnly: searchParams.get("authenticatedOnly") === "true",
      daysRemaining: searchParams.get("daysRemaining") ? 
        parseInt(searchParams.get("daysRemaining")) : 5
    };
    
    setFilters(newFilters);
    
    // Set selected category from URL
    if (newFilters.categories.length === 1) {
      setSelectedCategory(newFilters.categories[0]);
    } else {
      setSelectedCategory(null);
    }
  }, [location.search]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    const searchParams = new URLSearchParams(location.search);
    
    if (categoryId) {
      searchParams.set('categories', categoryId.toString());
    } else {
      searchParams.delete('categories');
    }
    
    // Update URL without reloading the page
    navigate(`/browse?${searchParams.toString()}`, { replace: true });
    
    // Update filters
    setFilters(prev => ({
      ...prev,
      categories: categoryId ? [categoryId] : []
    }));
  };

  return (
    <div className="min-h-screen bg-background -mt-16">
      <Hero />
      <div className="container mx-auto px-4 py-6"> 
        <div className="space-y-4"> 
          <Categories 
            onCategorySelect={handleCategorySelect} 
            selectedCategory={selectedCategory}
            allSelectedCategories={filters.categories}
          />
          <AuctionList 
            filters={filters} 
          />
        </div>
      </div>
      <TrustIndicators />
    </div>
  );
}

export default Browse;