import { useState, useEffect } from "react";
import axios from "axios";

export default function ManagerDashboard() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [assignedRequests, setAssignedRequests] = useState([]);
    const [completedRequests, setCompletedRequests] = useState([]);
    const [experts, setExperts] = useState({});
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

    const assignExpert = async (requestId, expertId) => {
        try {
            await axios.put("/api/manager/authentication-requests/assign", { request_id: requestId, expert_id: expertId });
            fetchPendingRequests();
            fetchAssignedRequests();
        } catch (error) {
            console.error("Error assigning expert", error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Manager Dashboard</h2>

            {/* Pending Authentication Requests */}
            <div>
                <h3 className="font-semibold">Pending Requests (Unassigned)</h3>
                <table className="w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2">Item</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Assign Expert</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingRequests.map((req) => (
                            <tr key={req.item_id} className="border-t">
                                <td className="p-2">{req.item_name}</td>
                                <td className="p-2">{req.category_name}</td>
                                <td className="p-2">
                                    <select
                                        onFocus={() => fetchExperts(req.category_id)}
                                        onChange={(e) => assignExpert(req.item_id, e.target.value)}
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
            <div>
                <h3 className="font-semibold">Pending Requests (Assigned)</h3>
                <ul>
                    {assignedRequests.map((req) => (
                        <li key={req.id}>{req.item_name} - Assigned to {req.assigned_expert}</li>
                    ))}
                </ul>
            </div>

            {/* Completed Requests */}
            <div>
                <h3 className="font-semibold">Completed Requests</h3>
                <ul>
                    {completedRequests.map((req) => (
                        <li key={req.id}>{req.item_name} - {req.status} by {req.expert_name}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
