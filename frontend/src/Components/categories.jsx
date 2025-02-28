// categories.jsx
import { Link } from "react-router-dom";

function Categories({ searchTerm = "" }) {  // ✅ Ensure searchTerm has a default value
  const categories = [
    { name: "Electronics", path: "/category/electronics" },
    { name: "Collectibles", path: "/category/collectibles" },
    { name: "Art", path: "/category/art" },
    { name: "Jewelry", path: "/category/jewelry" },
  ];

  // ✅ Ensure searchTerm is always a string
  const safeSearchTerm = typeof searchTerm === "string" ? searchTerm.toLowerCase() : "";

  // ✅ Filter categories safely
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(safeSearchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h3 className="text-2xl font-semibold mb-6 text-text">Popular Categories</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <Link 
              key={category.name} 
              to={category.path}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h4 className="text-lg font-medium text-text">{category.name}</h4>
              <p className="text-sm text-text/70 mt-1">Browse items →</p>
            </Link>
          ))
        ) : (
          <p className="text-gray-600 col-span-full text-center">No matching categories found</p>
        )}
      </div>
    </div>
  );
}

export default Categories;
