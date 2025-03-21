import { useState, useEffect } from "react";
import axios from "axios";

const AvailableExpertsTable = () => {
  const [experts, setExperts] = useState([]);
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

  const formatTimeDifference = (nextAvailable) => {
    if (!nextAvailable) return "N/A";
    
    const now = new Date();
    const availableTime = new Date(nextAvailable);
    const diffMs = availableTime - now;

    if (diffMs <= 0) return "Available";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours === 1 ? "1 hour" : `${diffHours} hours`;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Available Experts (Next 48 Hours)</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead>
                <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Expert ID</th>
                <th className="py-2 px-4 border">Username</th>
                <th className="py-2 px-4 border">Category Expertise</th>
                <th className="py-2 px-4 border">Current Workload</th>
                <th className="py-2 px-4 border">Next Available</th>
                </tr>
            </thead>
            <tbody>
                {experts.length === 0 ? (
                <tr>
                    <td colSpan="5" className="py-3 px-4 text-center">No available experts</td>
                </tr>
                ) : (
                experts.map((expert) => (
                    <tr key={expert.id} className="text-center border-b">
                    <td className="py-2 px-4 border">{expert.id}</td>
                    <td className="py-2 px-4 border">{expert.username}</td>
                    <td className="py-2 px-4 border">{expert.category.join(", ")}</td>
                    <td className="py-2 px-4 border">{expert.workload} request(s)</td>
                    <td className="py-2 px-4 border">
                        {expert.available_now ? (
                        <span className="text-green-600 font-bold">
                            ● Available
                        </span>
                        ) : (
                        formatTimeDifference(expert.next_available)
                        )}
                    </td>
                    </tr>
                ))
                )}
            </tbody>
        </table>
      )}
    </div>
  );
};

export default AvailableExpertsTable;
