import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import TrustIndicators from "../components/TrustIndicators";
import AuctionList from "../components/AuctionList";

function Browse() {
  const location = useLocation();
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
      categories: searchParams.get("categories") ? searchParams.get("categories").split(",") : [],
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      authenticatedOnly: searchParams.get("authenticatedOnly") === "true",
      daysRemaining: searchParams.get("daysRemaining") ? parseInt(searchParams.get("daysRemaining")) : 5
    };
    
    setFilters(newFilters);
    
    // If categories are selected from URL, update the selectedCategory state
    if (newFilters.categories.length === 1) {
      setSelectedCategory(newFilters.categories[0]);
    } else if (newFilters.categories.length > 1) {
      // If multiple categories, set to null so the filter will handle it
      setSelectedCategory(null);
    }
  }, [location.search]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    
    // Update URL with the selected category
    const searchParams = new URLSearchParams(location.search);
    
    if (category) {
      searchParams.set("categories", category);
    } else {
      searchParams.delete("categories");
    }
    
    // Replace current URL to avoid creating new history entries
    window.history.replaceState(
      null, 
      "", 
      `${location.pathname}?${searchParams.toString()}`
    );
  };

  return (
    <div className="min-h-screen bg-background -mt-16">
      <Hero />
      <div className="container mx-auto px-4 py-6"> {/* Adjusted padding */}
        <div className="space-y-4"> {/* Reduced space between components */}
          <Categories 
            onCategorySelect={handleCategorySelect} 
            selectedCategory={selectedCategory}
            allSelectedCategories={filters.categories}
          />
          <AuctionList 
            category={selectedCategory} 
            filters={filters} 
          />
        </div>
      </div>
      <TrustIndicators />
    </div>
  );
}

export default Browse;