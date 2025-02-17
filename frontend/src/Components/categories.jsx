import { Link } from "react-router-dom";

function Categories() {
  const categories = [
    { name: "Electronics", path: "/category/electronics" },
    { name: "Collectibles", path: "/category/collectibles" },
    { name: "Art", path: "/category/art" },
    { name: "Jewelry", path: "/category/jewelry" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h3 className="text-2xl font-semibold mb-6 text-text">Popular Categories</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link 
            key={category.name} 
            to={category.path}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h4 className="text-lg font-medium text-text">{category.name}</h4>
            <p className="text-sm text-text/70 mt-1">Browse items →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Categories;