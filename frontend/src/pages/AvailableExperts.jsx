import { useState, useEffect } from "react";
import axios from "axios";

const AvailableExpertsTable = () => {
  const [experts, setExperts] = useState([]);
  const [soonAvailableExperts, setSoonAvailableExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryAvailable, setSelectedCategoryAvailable] = useState("All Categories");
  const [selectedCategorySoon, setSelectedCategorySoon] = useState("All Categories");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/expertAvailability/available-experts")
      .then(response => {
        setExperts(response.data.experts);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching experts:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios.get("/api/expertAvailability/soon-available-experts")
      .then(response => {
        setSoonAvailableExperts(response.data.experts);
      })
      .catch(error => {
        console.error("Error fetching soon-available experts:", error);
      });
  }, []);

  useEffect(() => {
    axios.get("/api/categories")
      .then(response => {
        setCategories(response.data);
      })
      .catch(error => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  const formatTimeDifference = (nextAvailable) => {
    if (!nextAvailable) return "N/A";
    
    const now = new Date();
    const availableTime = new Date(nextAvailable);
    const diffMs = availableTime - now;

    if (diffMs <= 0) return "Available";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours === 1 ? "1 hour" : `${diffHours} hours`;
  };

  const filteredExperts = selectedCategoryAvailable === "All Categories"
    ? experts
    : experts.filter(expert => expert.category.includes(selectedCategoryAvailable));

  const filteredSoonExperts = selectedCategorySoon === "All Categories"
    ? soonAvailableExperts
    : soonAvailableExperts.filter(expert => expert.category.includes(selectedCategorySoon));

  return (
    <div className="p-6 md:p-6 space-y-6 pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="border border-gray-300 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left">Available Experts (Next 48 Hours)</h3>
              <select
                value={selectedCategoryAvailable}
                onChange={(e) => setSelectedCategoryAvailable(e.target.value)}
                className="border p-2 rounded"
              >
                <option>All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border border-gray-300 border-b-3 border-b-gray-400">
                <thead>
                  <tr className="bg-navy text-off-white font-light">
                    <th className="p-2">Expert ID</th>
                    <th className="p-2">Username</th>
                    <th className="p-2">Category Expertise</th>
                    <th className="p-2">Current Workload</th>
                    <th className="p-2">Next Available</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExperts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-3 px-4 text-center">No available experts</td>
                    </tr>
                  ) : (
                    filteredExperts.map((expert) => (
                      <tr key={expert.id} className="odd:bg-white even:bg-gray-200">
                        <td className="p-2 text-center">{expert.id}</td>
                        <td className="p-2 text-center">{expert.username}</td>
                        <td className="p-2 text-center">{expert.category.join(", ")}</td>
                        <td className="p-2 text-center">{expert.workload} request(s)</td>
                        <td className="p-2 text-center">
                          {expert.available_now ? (
                            <span className="text-green-600 font-bold">● Available</span>
                          ) : (
                            formatTimeDifference(expert.next_available)
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-gray-300 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left">Soon-to-be Available Experts (3-7 days)</h3>
              <select
                value={selectedCategorySoon}
                onChange={(e) => setSelectedCategorySoon(e.target.value)}
                className="border p-2 rounded"
              >
                <option>All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border border-gray-300 border-b-3 border-b-gray-400">
                <thead>
                  <tr className="bg-navy text-off-white font-light">
                    <th className="p-2">Expert ID</th>
                    <th className="p-2">Username</th>
                    <th className="p-2">Category Expertise</th>
                    <th className="p-2">Current Workload</th>
                    <th className="p-2">Next Available</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSoonExperts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-3 px-4 text-center">No soon-to-be available experts</td>
                    </tr>
                  ) : (
                    filteredSoonExperts.map((expert) => (
                      <tr key={expert.id} className="odd:bg-white even:bg-gray-200">
                        <td className="p-2 text-center">{expert.id}</td>
                        <td className="p-2 text-center">{expert.username}</td>
                        <td className="p-2 text-center">{expert.category.join(", ")}</td>
                        <td className="p-2 text-center">{expert.workload} request(s)</td>
                        <td className="p-2 text-center">
                          {expert.available_now ? (
                            <span className="text-green-600 font-bold">● Available</span>
                          ) : (
                            formatTimeDifference(expert.next_available)
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AvailableExpertsTable;
