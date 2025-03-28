import { useState } from "react";
import { 
  Book, 
  Clock, 
  Diamond, 
  ShoppingBag, 
  Smartphone, 
  Bookmark, 
  Car, 
  Home, 
  Palette, 
  Gamepad2, 
  Dumbbell, 
  Package 
} from "lucide-react";

function Categories({ onCategorySelect, selectedCategory, allSelectedCategories }) {
  const [showMore, setShowMore] = useState(false);

  const categories = [
    { id: 1, name: "Art", icon: <Palette className="h-6 w-6" /> },
    { id: 2, name: "Antiques", icon: <Clock className="h-6 w-6" /> },
    { id: 3, name: "Jewelry", icon: <Diamond className="h-6 w-6" /> },
    { id: 4, name: "Clothing", icon: <ShoppingBag className="h-6 w-6" /> },
    { id: 5, name: "Collectibles", icon: <Bookmark className="h-6 w-6" /> },
    { id: 6, name: "Electronics", icon: <Smartphone className="h-6 w-6" /> },
    { id: 7, name: "Home & Garden", icon: <Home className="h-6 w-6" /> },
    { id: 8, name: "Sports Equipment", icon: <Dumbbell className="h-6 w-6" /> },
    { id: 9, name: "Toys & Games", icon: <Gamepad2 className="h-6 w-6" /> },
    { id: 10, name: "Vehicles", icon: <Car className="h-6 w-6" /> },
    { id: 11, name: "Books", icon: <Book className="h-6 w-6" /> },
    { id: 12, name: "Others", icon: <Package className="h-6 w-6" /> }
  ];

  const displayedCategories = showMore ? categories : categories.slice(0, 4);

  const handleCategoryClick = (categoryId) => {
    onCategorySelect(categoryId === selectedCategory ? null : categoryId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Popular Categories</h2>
        <button
          onClick={() => setShowMore(!showMore)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showMore ? 'Show Less' : 'Show More'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedCategories.map(category => (
          <div 
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`cursor-pointer rounded-lg border p-4 text-center transition-all hover:shadow-md ${
              selectedCategory === category.id || allSelectedCategories?.includes(category.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
          >
            <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
              selectedCategory === category.id || allSelectedCategories?.includes(category.id)
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {category.icon}
            </div>
            <h3 className={`text-sm font-medium ${
              selectedCategory === category.id || allSelectedCategories?.includes(category.id)
                ? 'text-blue-700'
                : 'text-gray-700'
            }`}>
              {category.name}
            </h3>
            <p className="mt-1 text-xs text-gray-500">Browse items →</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Categories;