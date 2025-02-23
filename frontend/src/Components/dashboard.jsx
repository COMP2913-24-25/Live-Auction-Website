import { useState, useEffect } from "react";
import axios from "axios";

export default function ManagerDashboard() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [assignedRequests, setAssignedRequests] = useState([]);
    const [completedRequests, setCompletedRequests] = useState([]);
    const [experts, setExperts] = useState({});
    const [selectedPendingRequests, setSelectedPendingRequests] = useState({});
    const [selectedAssignedRequests, setSelectedAssignedRequests] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingRequests();
        fetchAssignedRequests();
        fetchCompletedRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const res = await axios.get("/api/manager/authentication-requests/pending-unassigned");
            setPendingRequests(res.data);
        } catch (error) {
            console.error("Error fetching pending requests", error);
        }
    };

    const fetchAssignedRequests = async () => {
        try {
            const res = await axios.get("/api/manager/authentication-requests/pending-assigned");
            setAssignedRequests(res.data);
        } catch (error) {
            console.error("Error fetching assigned requests", error);
        }
    };

    const fetchCompletedRequests = async () => {
        try {
            const res = await axios.get("/api/manager/authentication-requests/completed");
            setCompletedRequests(res.data);
        } catch (error) {
            console.error("Error fetching completed requests", error);
        }
    };

    const fetchExperts = async (categoryId) => {
        if (experts[categoryId]) return;
        try {
            const res = await axios.get(`/api/manager/experts/${categoryId}`);
            setExperts((prev) => ({ ...prev, [categoryId]: res.data }));
        } catch (error) {
            console.error("Error fetching experts", error);
        }
    };

    const fetchReassignmentExperts = async (categoryId, currentExpertId) => {
        if (experts[`${categoryId}-${currentExpertId}`]) return; 
        try {
            const res = await axios.get(`/api/manager/experts/${categoryId}/${currentExpertId}`);
            setExperts((prev) => ({ ...prev, [`${categoryId}-${currentExpertId}`]: res.data }));
        } catch (error) {
            console.error("Error fetching reassignment experts", error);
        }
    };

    const handlePendingCheckboxChange = (itemId, categoryId) => {
        setSelectedPendingRequests((prev) => ({
            ...prev,
            [itemId]: prev[itemId] ? undefined : { expertId: "", categoryId }
        }));
    };

    const handleAssignedCheckboxChange = (itemId, categoryId) => {
        setSelectedAssignedRequests((prev) => ({
            ...prev,
            [itemId]: prev[itemId] ? undefined : { expertId: "", categoryId }
        }));
    };

    const handlePendingExpertChange = (itemId, expertId) => {
        setSelectedPendingRequests((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], expertId }
        }));
    };

    const handleAssignedExpertChange = (itemId, expertId) => {
        setSelectedAssignedRequests((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], expertId }
        }));
    };

    const bulkAssignExperts = async () => {
        const requestsToAssign = Object.entries(selectedPendingRequests)
            .filter(([_, value]) => value && value.expertId)
            .map(([itemId, value]) => ({
                item_id: itemId,
                expert_id: value.expertId
            }));

        if (requestsToAssign.length === 0) {
            alert("Please select at least one request and assign an expert.");
            return;
        }

        try {
            await Promise.all(requestsToAssign.map(req =>
                axios.put("/api/manager/authentication-requests/assign", req)
            ));
            fetchPendingRequests();
            fetchAssignedRequests();
            setSelectedPendingRequests({});
        } catch (error) {
            console.error("Error assigning experts", error);
        }
    };

    const bulkReassignExperts = async () => {
        const requestsToReassign = Object.entries(selectedAssignedRequests)
            .filter(([_, value]) => value && value.expertId)
            .map(([itemId, value]) => ({
                item_id: itemId,
                expert_id: value.expertId
            }));

        if (requestsToReassign.length === 0) {
            alert("Please select at least one request and reassign an expert.");
            return;
        }

        try {
            await Promise.all(requestsToReassign.map(req =>
                axios.put("/api/manager/authentication-requests/reassign", req)
            ));
            fetchPendingRequests();
            fetchAssignedRequests();
            setSelectedAssignedRequests({});
        } catch (error) {
            console.error("Error assigning experts", error);
        }
    };

    return (
        <div className="p-6 space-y-6 pt-0">
            <h2 className="text-4xl font-bold">Manager Dashboard</h2>

            {/* Pending Unassigned Authentication Requests */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-2xl">Pending Requests (Unassigned)</h3>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        onClick={bulkAssignExperts}
                        disabled={Object.values(selectedPendingRequests).every(req => !req || !req.expertId)}
                    >
                        Assign Selected
                    </button>
                </div>
                <table className="w-full border border-gray-300 border-b-3 border-b-gray-400">
                    <thead>
                        <tr className="bg-navy text-off-white font-light">
                            <th className="p-2">Select</th>
                            <th className="p-2">Item ID</th>
                            <th className="p-2">Item Name</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Assign Expert</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingRequests.map((req) => (
                            <tr key={req.item_id} className="border-t">
                                <td className="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedPendingRequests[req.item_id]}
                                        onChange={() => handlePendingCheckboxChange(req.item_id)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500"
                                    />
                                </td>
                                <td className="p-2 text-center">{req.item_id}</td>
                                <td className="p-2 text-center">{req.item_name}</td>
                                <td className="p-2 text-center">{req.category_name}</td>
                                <td className="p-2 text-center">
                                    <select
                                        onFocus={() => fetchExperts(req.category_id)}
                                        onChange={(e) => handlePendingExpertChange(req.item_id, e.target.value)}
                                        className="border p-1"
                                    >
                                        <option value="">Select Expert</option>
                                        {experts[req.category_id]?.map((exp) => (
                                            <option key={exp.id} value={exp.id}>{exp.username}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pending Assigned Requests */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-2xl">Pending Requests (Assigned)</h3>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        onClick={bulkReassignExperts}
                        disabled={Object.values(selectedAssignedRequests).every(req => !req || !req.expertId)}
                    >
                        Reassign Selected
                    </button>
                </div>
                <table className="w-full border border-gray-300 border-b-3 border-b-gray-400">
                    <thead>
                        <tr className="bg-navy text-off-white font-light">
                            <th className="p-2">Select</th>
                            <th className="p-2">Item ID</th>
                            <th className="p-2">Item Name</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Assigned Expert</th>
                            <th className="p-2">Assign New Expert</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignedRequests.map((req) => (
                            <tr key={req.item_id} className="border-t">
                                <td className="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedAssignedRequests[req.item_id]}
                                        onChange={() => handleAssignedCheckboxChange(req.item_id)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500"
                                    />
                                </td>
                                <td className="p-2 text-center">{req.item_id}</td>
                                <td className="p-2 text-center">{req.item_name}</td>
                                <td className="p-2 text-center">{req.category_name}</td>
                                <td className="p-2 text-center">{req.assigned_expert_username}</td>
                                <td className="p-2 text-center">
                                    <select
                                        onFocus={() => fetchReassignmentExperts(req.category_id, req.assigned_expert_id)}
                                        onChange={(e) => handleAssignedExpertChange(req.item_id, e.target.value)}
                                        className="border p-1"
                                    >
                                        <option value="">Select New Expert</option>
                                        {experts[req.category_id]?.map((exp) => (
                                            <option key={exp.id} value={exp.id}>{exp.username}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Completed Requests */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Completed Requests</h3>
                <ul>
                    {completedRequests.map((req) => (
                        <li key={req.id}>{req.item_name} - {req.status} by {req.expert_name}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
