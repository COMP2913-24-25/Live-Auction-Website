import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ExpertAvailability = () => {
  const { user } = useAuth();
  const [currentWeekAvailability, setCurrentWeekAvailability] = useState([]);
  const [nextWeekAvailability, setNextWeekAvailability] = useState([]);
  const [modified, setModified] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/expert-availability/${user.id}`);
      console.log("Current week data:", response.data.currentWeek);
      console.log("Next week data:", response.data.nextWeek);
      setCurrentWeekAvailability(response.data.currentWeek);
      setNextWeekAvailability(response.data.nextWeek);
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleCheckboxChange = (week, index) => {
    if (week === "current") {
      const updatedAvailability = [...currentWeekAvailability];
      updatedAvailability[index].unavailable = !updatedAvailability[index].unavailable;
      setCurrentWeekAvailability(updatedAvailability);
    } else {
      const updatedAvailability = [...nextWeekAvailability];
      updatedAvailability[index].unavailable = !updatedAvailability[index].unavailable;
      setNextWeekAvailability(updatedAvailability);
      setModified(true);
    }
  };

  const handleTimeChange = (index, type, value) => {
    const updatedAvailability = [...nextWeekAvailability];
    updatedAvailability[index][type] = value;
    setNextWeekAvailability(updatedAvailability);
    setModified(true);
  };

  const saveNextWeekAvailability = async () => {
    if (!user || !modified) return;
    try {
      await axios.put(`/api/expert-availability/${user.id}`, {
        workingHours: nextWeekAvailability.map(slot => ({
          date: slot.date,
          start_time: slot.unavailable ? null : slot.start_time || "08:00",
          end_time: slot.unavailable ? null : slot.end_time || "20:00",
          unavailable: slot.unavailable,
        })),
      });
      setModified(false);
      fetchAvailability();
    } catch (error) {
      console.error("Error saving availability:", error);
    }
  };  

  const renderTimeOptions = () => {
    const times = [];
    for (let i = 8; i <= 20; i++) {
      const hour = i < 10 ? `0${i}` : i;
      times.push(`${hour}:00`);
    }
    return times.map((time) => <option key={time} value={time}>{time}</option>);
  };

  return (
    <div className="p-4 md:p-6 sm:space-y-6 pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Current Week Section */}
      <h3 className="mb-4 font-semibold text-xl md:text-2xl text-center md:text-left">Working Hours (Current Week)</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border border-gray-300 border-b-3 border-b-gray-400">
          <thead>
            <tr className="bg-navy text-off-white font-light">
              <th className="p-2">Date</th>
              <th className="p-2">Day</th>
              <th className="p-2">Time Slot</th>
            </tr>
          </thead>
          <tbody>
            {currentWeekAvailability.map((slot, index) => (
              <tr key={index} className="odd:bg-white even:bg-gray-200">
                <td className="p-2 text-center">{slot.date}</td>
                <td className="p-2 text-center">{slot.day}</td>
                <td className="p-2 text-center">
                  {(slot.start_time && slot.end_time) || !slot.unavailable ? (
                    `${slot.start_time} - ${slot.end_time}`
                  ) : (
                    "Unavailable"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next Week Section */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-2">
        <h3 className="font-semibold text-xl md:text-2xl mb-2 sm:mb-0">Working Hours (Next Week)</h3>
        <button
          className={`px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto shrink-0 ${
            modified ? "cursor-pointer" : "disabled:opacity-50"
          }`}
          onClick={saveNextWeekAvailability}
          disabled={!modified}
        >
          Save
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border border-gray-300 border-b-3 border-b-gray-400">
          <thead>
            <tr className="bg-navy text-off-white font-light">
              <th className="p-2">Date</th>
              <th className="p-2">Day</th>
              <th className="p-2">Time Slot</th>
              <th className="p-2">Unavailable</th>
            </tr>
          </thead>
          <tbody>
            {nextWeekAvailability.map((slot, index) => (
              <tr key={index} className="odd:bg-white even:bg-gray-200">
                <td className="p-2 text-center">{slot.date}</td>
                <td className="p-2 text-center">{slot.day}</td>
                <td className="p-2 text-center">
                  <select
                    value={slot.start_time ?? ""}
                    onChange={(e) => handleTimeChange(index, "start_time", e.target.value)}
                    className="border p-1 border-teal rounded"
                  >
                    {renderTimeOptions()}
                  </select>
                  <span className="mx-2">to</span>
                  <select
                    value={slot.end_time ?? ""}
                    onChange={(e) => handleTimeChange(index, "end_time", e.target.value)}
                    className="border p-1 border-teal rounded"
                  >
                    {renderTimeOptions()}
                  </select>
                </td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={slot.unavailable}
                    onChange={() => handleCheckboxChange("next", index)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpertAvailability;
