import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import React from "react";

export default function ExpertAvailability() {
    const { user } = useAuth();
    const expertId = user.id;
    const [currentWeek, setCurrentWeek] = useState([]);
    const [nextWeek, setNextWeek] = useState([]);
    const [isFullyUnavailableCurrent, setIsFullyUnavailableCurrent] = useState(false);
    const [isFullyUnavailableNext, setIsFullyUnavailableNext] = useState(false);
    const [loading, setLoading] = useState(true);

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM - 8PM
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    useEffect(() => {
        fetchAvailability();
    }, []);

    async function fetchAvailability() {
        try {
            const { data } = await axios.get(`/api/expertAvailability/availability/${expertId}`);
        
            // Ensure availability is filtered correctly for the current and next week
            const currentWeekStart = getDateForWeek(0, 0); // Get Sunday of current week
            const nextWeekStart = getDateForWeek(1, 0); // Get Sunday of next week
        
            console.log("Expected current week start:", currentWeekStart);
            console.log("Available data dates:", data.availability.map(slot => slot.week_start_date));

            const currentWeekAvailability = data.availability.filter(slot => new Date(slot.week_start_date).toISOString().slice(0, 10) === currentWeekStart);
            const nextWeekAvailability = data.availability.filter(slot => new Date(slot.week_start_date).toISOString().slice(0, 10) === nextWeekStart);

            setCurrentWeek(currentWeekAvailability);
            setNextWeek(nextWeekAvailability);
        
            setIsFullyUnavailableCurrent(data.is_fully_unavailable_current);
            setIsFullyUnavailableNext(data.is_fully_unavailable_next);
        } catch (error) {
            console.error("Error fetching availability", error);
        } finally {
            setLoading(false);
        }
    }

    function getDateForWeek(weekOffset, dayIndex) {
        const today = new Date();
        const firstDayOfWeek = new Date();
        firstDayOfWeek.setDate(today.getDate() - today.getDay() + 7 * weekOffset); // Move back to the most recent Sunday
        firstDayOfWeek.setHours(0, 0, 0, 0); // Ensure midnight time

        const targetDate = new Date(firstDayOfWeek);
        targetDate.setDate(targetDate.getDate() + dayIndex);
        
        return targetDate.toISOString().split("T")[0];
    }

    async function toggleAvailability(week, setWeek, date, hour) {
        const isFullyUnavailable = week === currentWeek ? isFullyUnavailableCurrent : isFullyUnavailableNext;
        if (isFullyUnavailable) return;

        const existingSlot = Array.isArray(week) ? week.find(slot => slot.date === date && slot.start_time === `${hour}:00:00`) : null;

        try {
        if (existingSlot) {
            await axios.patch(`/api/expertAvailability/availability/${existingSlot.id}`, { is_available: false });
            setWeek(prev => prev ? prev.filter(slot => slot.id !== existingSlot.id) : []);
        } else {
            const newSlot = { expert_id: expertId, date, start_time: `${hour}:00:00`, end_time: `${hour + 1}:00:00` };
            await axios.post("/api/expertAvailability/availability", { expert_id: expertId, slots: [newSlot] });
            setWeek(prev => [...(prev || []), { ...newSlot, id: Date.now(), is_available: true }]);
        }
        } catch (error) {
        console.error("Error updating availability", error);
        }
    }

  async function toggleFullWeek(isNextWeek) {
        try {
            const endpoint = "/api/expertAvailability/availability/unavailable";
            const isCurrentlyUnavailable = isNextWeek ? isFullyUnavailableNext : isFullyUnavailableCurrent;

            await axios.post(endpoint, { expert_id: expertId, is_fully_unavailable: !isCurrentlyUnavailable, is_next_week: isNextWeek });

            if (isNextWeek) {
                setIsFullyUnavailableNext(!isFullyUnavailableNext);
                if (!isFullyUnavailableNext) setNextWeek([]);
            } else {
                setIsFullyUnavailableCurrent(!isFullyUnavailableCurrent);
                if (!isFullyUnavailableCurrent) setCurrentWeek([]);
            }
        } catch (error) {
            console.error("Error toggling full week availability", error);
        }
  }

  if (loading) return <p>Loading availability...</p>;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center">Manage Your Availability</h2>

      {/* Current Week Section */}
      <div className="border p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Current Week</h3>
        <label className="flex items-center mb-4 cursor-pointer">
          <input type="checkbox" className="mr-2" checked={isFullyUnavailableCurrent} onChange={() => toggleFullWeek(false)} />
          Mark entire current week as unavailable
        </label>
        {renderAvailabilityGrid(currentWeek, setCurrentWeek, 0, isFullyUnavailableCurrent)}
      </div>

      {/* Next Week Section */}
      <div className="border p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Next Week</h3>
        <label className="flex items-center mb-4 cursor-pointer">
          <input type="checkbox" className="mr-2" checked={isFullyUnavailableNext} onChange={() => toggleFullWeek(true)} />
          Mark entire next week as unavailable
        </label>
        {renderAvailabilityGrid(nextWeek, setNextWeek, 1, isFullyUnavailableNext)}
      </div>
    </div>
  );

  function renderAvailabilityGrid(week, setWeek, weekOffset, isFullyUnavailable) {
    return (
      <div className="grid grid-cols-8 gap-2 border p-2 overflow-x-auto">
        <div className="font-bold text-center">Time</div>
        {days.map(day => <div key={day} className="font-bold text-center">{day}</div>)}

        {hours.map(hour => (
          <React.Fragment key={`row-${hour}`}>
            <div key={`hour-${hour}`} className="font-bold text-center">{hour}:00</div>
            {days.map((day, dayIndex) => {
              const date = getDateForWeek(weekOffset, dayIndex);
              const isAvailable = Array.isArray(week) && week.some(slot => slot.date === date && slot.start_time === `${hour}:00:00`);

              return (
                <div
                  key={`${dayIndex}-${hour}-${weekOffset}`}
                  className={`p-2 text-center cursor-pointer rounded-md ${
                    isAvailable ? "bg-green-400" : "bg-gray-300"
                  } ${isFullyUnavailable ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => toggleAvailability(week, setWeek, date, hour)}
                >
                  {isAvailable ? "✔" : "✖"}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  }
}
