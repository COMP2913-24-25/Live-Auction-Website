import { useContext } from 'react';
import { AuthContext } from '../context/authContext';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p className="mb-4">Welcome, {user?.username || user?.email}</p>
            <button 
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>
        </div>
    );
};

export default Dashboard;