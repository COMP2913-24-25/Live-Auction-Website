import { useState, useEffect } from "react";
import axios from "axios";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const usersPerPage = 10; // Matches the backend limit

  // Fetch paginated users
  useEffect(() => {
    axios
      .get(`/api/manager/users?page=${currentPage}&limit=${usersPerPage}`)
      .then((res) => {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages);
        setLoading(false);
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, [currentPage]);

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`/api/manager/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    } catch (error) {
      console.error("Failed to update role", error);
    }
  };

  return (
    <div className="p-6 md:p-6 space-y-6 pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
            <p>Loading...</p>
        ) : (
            <>
                <div className="border border-gray-300 p-4 rounded-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <h3 className="font-semibold text-xl md:text-2xl text-center md:text-left">All Users</h3>
                    </div>

                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border p-2 mb-4 w-full"
                    />

                    {/* User Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] border border-gray-300 border-b-3 border-b-gray-400">
                            <thead>
                                <tr className="bg-navy text-off-white font-light">
                                    <th className="p-2">User ID</th>
                                    <th className="p-2">Username</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Created At</th>
                                    <th className="p-2">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                    <td colSpan="5" className="py-3 px-4 text-center">No users available.</td>
                                    </tr>
                                ) : (
                                    users.filter(user => user.username.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-3 px-4 text-center">No matching users found.</td>
                                    </tr>
                                    ) : (
                                    users
                                        .filter(user => user.username.toLowerCase().includes(search.toLowerCase()))
                                        .map((user) => (
                                        <tr key={user.id} className="odd:bg-white even:bg-gray-200">
                                            <td className="p-2 text-center">{user.id}</td>
                                            <td className="p-2 text-center">{user.username}</td>
                                            <td className="p-2 text-center">{user.email}</td>
                                            <td className="p-2 text-center">
                                            {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-2 text-center">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, Number(e.target.value))}
                                                className="border p-1 rounded"
                                            >
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                            </select>
                                            </td>
                                        </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded border bg-gray-300 disabled:opacity-50"
                        >
                            Previous
                        </button>

                        <span>Page {currentPage} of {totalPages}</span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded border bg-gray-300 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
  );
}
