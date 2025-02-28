import { useState } from "react";
import { Search } from "lucide-react";
import Categories from "./categories";

function Hero() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-white pt-16 w-full">
      <div className="py-16 px-10">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Discover Unique Treasures</h2>
          <p className="text-xl mb-8 text-white/90">
            Find exclusive items and bid with confidence on our secure platform
          </p>
          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-text bg-white shadow-sm focus:ring-2 focus:ring-secondary focus:outline-none"
            />
            <button className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {/* Pass search term to Categories component */}
      <Categories searchTerm={searchTerm} />
    </div>
  );
}

export default Hero;