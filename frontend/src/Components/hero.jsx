import { Search } from "lucide-react";

function Hero() {
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Discover Unique Treasures</h2>
          <p className="text-xl mb-8 text-white/90">
            Find exclusive items and bid with confidence on our secure platform
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for items..."
              className="w-full px-4 py-3 rounded-lg text-text bg-white shadow-sm focus:ring-2 focus:ring-secondary focus:outline-none"
            />
            <button className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
