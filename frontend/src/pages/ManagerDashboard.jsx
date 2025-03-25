import { useState, useEffect } from "react";
import axios from "../api/axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ManagerDashboard() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [assignedRequests, setAssignedRequests] = useState([]);
    const [completedRequests, setCompletedRequests] = useState([]);
    const [experts, setExperts] = useState({});
    const [selectedPendingRequests, setSelectedPendingRequests] = useState({});
    const [selectedAssignedRequests, setSelectedAssignedRequests] = useState({});
    const [loading, setLoading] = useState(true);
    const [postingFees, setPostingFees] = useState({
        fixedFee: 2,
        tier1Percentage: 5,
        tier2Percentage: 4,
        tier3Percentage: 3,
        tier1Max: 50,
        tier2Max: 200,
        tier3Max: 500
    });
    const [isEditingFees, setIsEditingFees] = useState(false);
    const [feesLoading, setFeesLoading] = useState(true);
    const [incomeData, setIncomeData] = useState({
        weekly: [],
        total: 0,
        startDate: '',
        endDate: '',
        breakdown: []
    });
    const [incomeLoading, setIncomeLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPendingRequests();
        fetchAssignedRequests();
        fetchCompletedRequests();
        fetchPostingFees();
        fetchWeeklyIncome();
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

    const fetchPostingFees = async () => {
        try {
            setFeesLoading(true);
            const res = await axios.get("/api/manager/posting-fees");
            if (res.data) {
                setPostingFees({
                    fixedFee: Number(res.data.fixedFee) || 2,
                    tier1Percentage: Number(res.data.tier1Percentage) || 5,
                    tier2Percentage: Number(res.data.tier2Percentage) || 4,
                    tier3Percentage: Number(res.data.tier3Percentage) || 3,
                    tier1Max: Number(res.data.tier1Max) || 50,
                    tier2Max: Number(res.data.tier2Max) || 200,
                    tier3Max: Number(res.data.tier3Max) || 500
                });
            }
        } catch (error) {
            console.error("Error fetching posting fees", error);
            // Set default values if fetch fails
            setPostingFees({
                fixedFee: 2,
                tier1Percentage: 5,
                tier2Percentage: 4,
                tier3Percentage: 3,
                tier1Max: 50,
                tier2Max: 200,
                tier3Max: 500
            });
        } finally {
            setFeesLoading(false);
        }
    };

    const fetchWeeklyIncome = async () => {
        try {
            setIncomeLoading(true);
            const response = await axios.get('/api/manager/weekly-income');
            
            if (!response.data) {
                throw new Error('No data received');
            }

            setIncomeData({
                weekly: Array.isArray(response.data.weekly) ? response.data.weekly : [],
                total: Number(response.data.total || 0),
                startDate: response.data.startDate || '',
                endDate: response.data.endDate || '',
                breakdown: Array.isArray(response.data.breakdown) ? response.data.breakdown : []
            });
            setError(null);
        } catch (error) {
            console.error('Error fetching weekly income:', error);
            setError('Failed to load income data');
        } finally {
            setIncomeLoading(false);
        }
    };

    const handleSavePostingFees = async () => {
        try {
            await axios.put("/api/manager/posting-fees", postingFees);
            setIsEditingFees(false);
            await fetchPostingFees(); // Refresh the data
        } catch (error) {
            console.error("Error updating posting fees", error);
            alert("Failed to update posting fees");
        }
    };

    const getChartData = () => {
        if (!Array.isArray(incomeData.weekly) || incomeData.weekly.length === 0) {
            return {
                labels: [],
                datasets: [{
                    label: 'Weekly Income',
                    data: [],
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    borderColor: 'rgb(53, 162, 235)',
                    borderWidth: 1
                }]
            };
        }

        return {
            labels: incomeData.weekly.map(week => `Week ${week.week?.split('-')[1] || '0'}`),
            datasets: [{
                label: 'Weekly Income (£)',
                data: incomeData.weekly.map(week => Number(week.total || 0)),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                borderColor: 'rgb(53, 162, 235)',
                borderWidth: 1
            }]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Weekly Income'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => {
                        if (value === null || value === undefined) return '£0.00';
                        return `£${Number(value).toFixed(2)}`;
                    }
                }
            }
        }
    };

    const renderWeeklyIncome = () => {
        if (incomeLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-500 py-4">
                    {error}
                </div>
            );
        }

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-center mb-4">
                            <h4 className="text-lg font-medium text-gray-900">Total Income</h4>
                            <p className="text-3xl font-bold text-green-600">
                                £{Number(incomeData.total || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {incomeData.startDate || 'N/A'} - {incomeData.endDate || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Breakdown</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 border border-gray-200 text-left">Category</th>
                                        <th className="px-4 py-2 border border-gray-200 text-right">Amount</th>
                                        <th className="px-4 py-2 border border-gray-200 text-right">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomeData.breakdown.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 border border-gray-200">
                                                {item.category || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 border border-gray-200 text-right">
                                                £{Number(item.amount || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 border border-gray-200 text-right">
                                                {incomeData.total > 0 
                                                    ? ((item.amount || 0) / incomeData.total * 100).toFixed(1)
                                                    : '0.0'}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div style={{ height: '400px' }}>
                        <Bar data={getChartData()} options={chartOptions} />
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="p-4 md:p-6 space-y-6 pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-4xl font-bold text-center md:text-left">Manager Dashboard</h2>

            {/* Pending Unassigned Authentication Requests */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left">Unassigned Authentication Requests</h3>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full md:w-auto mt-2 md:mt-0"
                        onClick={bulkAssignExperts}
                        disabled={Object.values(selectedPendingRequests).every(req => !req || !req.expertId)}
                    >
                        Assign Selected
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border border-gray-300 border-b-3 border-b-gray-400">
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
                                <tr key={req.item_id} className="odd:bg-white even:bg-gray-200">
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
                                            className="border p-1 w-full md:w-auto"
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
            </div>

            {/* Pending Assigned Requests */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left">Expert Reallocation Requests</h3>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full md:w-auto mt-2 md:mt-0"
                        onClick={bulkReassignExperts}
                        disabled={Object.values(selectedAssignedRequests).every(req => !req || !req.expertId)}
                    >
                        Reassign Selected
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border border-gray-300 border-b-3 border-b-gray-400">
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
                                <tr key={req.item_id} className="odd:bg-white even:bg-gray-200">
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
                                            className="border p-1 w-full md:w-auto"
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
            </div>

            {/* Completed Requests */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left mb-2">Completed Requests</h3>
                <div className="overflow-x-auto">
                    <table className="w-full w-min-[500px] border border-gray-300 border-b-3 border-b-gray-400">
                        <thead>
                            <tr className="bg-navy text-off-white font-light">
                                <th className="p-2">Item ID</th>
                                <th className="p-2">Item Name</th>
                                <th className="p-2">Assigned Expert</th>
                                <th className="p-2">Reallocated?</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Comments</th>
                                <th className="p-2">Decision Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedRequests.map((req) => (
                                <tr key={req.item_id} className="odd:bg-white even:bg-gray-200">
                                    <td className="p-2 text-center">{req.item_id}</td>
                                    <td className="p-2 text-center">{req.item_name}</td>
                                    <td className="p-2 text-center">{req.assigned_expert_username}</td>
                                    <td className="p-2 text-center">{req.second_opinion_requested ? "Yes" : "No"}</td>
                                    <td className="p-2 text-center">{req.status}</td>
                                    <td className="p-2 text-center">{req.comments}</td>
                                    <td className="p-2 text-center">{req.decision_timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Posting Fees Configuration */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left">Posting Fees Configuration</h3>
                    <button
                        className={`${
                            isEditingFees ? 'bg-green-600' : 'bg-blue-600'
                        } text-white px-4 py-2 rounded w-full md:w-auto mt-2 md:mt-0`}
                        onClick={() => {
                            if (isEditingFees) {
                                handleSavePostingFees();
                            } else {
                                setIsEditingFees(true);
                            }
                        }}
                    >
                        {isEditingFees ? 'Save Changes' : 'Edit Fees'}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fixed Fee (Up to £{postingFees.tier1Max})</label>
                            <div className="mt-1 flex items-center">
                                <span className="text-gray-500">£</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={postingFees.fixedFee}
                                    onChange={(e) => setPostingFees(prev => ({
                                        ...prev,
                                        fixedFee: Number(e.target.value) || 0
                                    }))}
                                    disabled={!isEditingFees}
                                    className="ml-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tier 1 Percentage (£{postingFees.tier1Max + 1} - £{postingFees.tier2Max})
                            </label>
                            <div className="mt-1 flex items-center">
                                <input
                                    type="number"
                                    value={postingFees.tier1Percentage}
                                    onChange={(e) => setPostingFees(prev => ({
                                        ...prev,
                                        tier1Percentage: parseFloat(e.target.value)
                                    }))}
                                    disabled={!isEditingFees}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                                <span className="ml-2">%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tier 2 Percentage (£{postingFees.tier2Max + 1} - £{postingFees.tier3Max})
                            </label>
                            <div className="mt-1 flex items-center">
                                <input
                                    type="number"
                                    value={postingFees.tier2Percentage}
                                    onChange={(e) => setPostingFees(prev => ({
                                        ...prev,
                                        tier2Percentage: parseFloat(e.target.value)
                                    }))}
                                    disabled={!isEditingFees}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                                <span className="ml-2">%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tier 3 Percentage (Above £{postingFees.tier3Max})
                            </label>
                            <div className="mt-1 flex items-center">
                                <input
                                    type="number"
                                    value={postingFees.tier3Percentage}
                                    onChange={(e) => setPostingFees(prev => ({
                                        ...prev,
                                        tier3Percentage: parseFloat(e.target.value)
                                    }))}
                                    disabled={!isEditingFees}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                                <span className="ml-2">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-lg mb-4">Current Fee Structure:</h4>
                        {feesLoading ? (
                            <div className="text-gray-500">Loading fee structure...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 px-4 py-2 text-left">Price Range</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Fee Structure</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2">Up to £{postingFees.tier1Max}</td>
                                            <td className="border border-gray-300 px-4 py-2">£{postingFees.fixedFee} fixed fee</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2">
                                                £{postingFees.tier1Max + 1} - £{postingFees.tier2Max}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {postingFees.tier1Percentage}% of sale price
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2">
                                                £{postingFees.tier2Max + 1} - £{postingFees.tier3Max}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {postingFees.tier2Percentage}% of sale price
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2">
                                                Above £{postingFees.tier3Max}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {postingFees.tier3Percentage}% of sale price
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Weekly Income Report */}
            <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left">Weekly Income Report</h3>
                    <button
                        onClick={fetchWeeklyIncome}
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full md:w-auto mt-2 md:mt-0"
                    >
                        Refresh Report
                    </button>
                </div>
                
                {renderWeeklyIncome()}
            </div>
        </div>
    );
}
