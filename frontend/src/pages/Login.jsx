import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext, useAuth } from '../context/AuthContext';
import axios from 'axios';

const loginUser = async (credentials) => {
    try {
        const { data } = await axios.post(
            '/api/auth/login', 
            credentials, 
            { withCredentials: true } // Ensures cookies (if any) are included
        );
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

const Login = () => {
    const { user, login } = useContext(AuthContext);
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 1) {
                navigate('/browse');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 确保发送正确的凭据
            console.log("Sending login request:", credentials);
            
            // 使用 axios 直接发送请求
            const response = await axios.post('/api/auth/login', credentials);
            
            // 处理登录成功
            const { token, user } = response.data;
            
            // 保存到 localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // 更新 auth context
            authLogin(response.data);
            
            // 导航到适当的页面
            if (user.role === 1) {
                navigate('/browse');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8">
                <h2 className="text-2xl font-bold text-center text-[var(--color-primary)] mb-8">Login</h2>
                {error && <p className="mb-4 text-center text-[var(--color-error)]">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input 
                            type="email" 
                            name="email" 
                            value={credentials.email}
                            placeholder="Email" 
                            onChange={handleChange} 
                            className="input"
                            required 
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            name="password" 
                            value={credentials.password}
                            placeholder="Password" 
                            onChange={handleChange} 
                            className="input"
                            required 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary w-full"
                    >
                        Login
                    </button>
                </form>
                <p className="mt-6 text-center text-sm">
                    Don't have an account?
                    <Link to="/register" className="ml-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)]">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;