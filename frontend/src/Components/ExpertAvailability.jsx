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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Working Hours (Current Week)</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Day</th>
            <th className="border p-2">Time Slot</th>
          </tr>
        </thead>
        <tbody>
          {currentWeekAvailability.map((slot, index) => (
            <tr key={index}>
              <td className="border p-2">{slot.date}</td>
              <td className="border p-2">{slot.day}</td>
              <td className="border p-2">
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

      <h2 className="text-xl font-bold my-4 flex justify-between">
        <span>Working Hours (Next Week)</span>
        <button
          className={`px-4 py-2 text-white rounded ${modified ? "bg-blue-500" : "bg-gray-400 cursor-not-allowed"}`}
          onClick={saveNextWeekAvailability}
          disabled={!modified}
        >
          Save
        </button>
      </h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Day</th>
            <th className="border p-2">Time Slot</th>
            <th className="border p-2">Unavailable</th>
          </tr>
        </thead>
        <tbody>
          {nextWeekAvailability.map((slot, index) => (
            <tr key={index}>
              <td className="border p-2">{slot.date}</td>
              <td className="border p-2">{slot.day}</td>
              <td className="border p-2">
                <select
                  value={slot.start_time ?? ""}
                  onChange={(e) => handleTimeChange(index, "start_time", e.target.value)}
                  className="border p-1"
                >
                  {renderTimeOptions()}
                </select>
                <span className="mx-2">to</span>
                <select
                  value={slot.end_time ?? ""}
                  onChange={(e) => handleTimeChange(index, "end_time", e.target.value)}
                  className="border p-1"
                >
                  {renderTimeOptions()}
                </select>
              </td>
              <td className="border p-2 text-center">
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
  );
};

export default ExpertAvailability;
