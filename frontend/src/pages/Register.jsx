import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/authContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const registerUser = async (userData) => {
    try {
        const { data } = await axios.post(
            `api/auth/register`, 
            userData, 
            { withCredentials: true } // Ensures cookies are included
        );
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

const Register = () => {
    const { user } = useContext(AuthContext);
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

    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const result = await registerUser(form);
            
            // 保存一个成功消息到sessionStorage
            sessionStorage.setItem('registrationSuccess', 'Registration successful! Please login to your account.');
            
            // 跳转到登录页面
            navigate('/login');
            
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8">
                <h2 className="text-2xl font-bold text-center text-[var(--color-primary)] mb-8">Register</h2>
                {error && <p className="mb-4 text-center text-[var(--color-error)]">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input 
                            type="text" 
                            name="username" 
                            value={form.username}
                            placeholder="Username" 
                            onChange={handleChange} 
                            className="input"
                            required 
                        />
                    </div>
                    <div>
                        <input 
                            type="email" 
                            name="email" 
                            value={form.email}
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
                            value={form.password}
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
                        Register
                    </button>
                </form>
                <p className="mt-6 text-center text-sm">
                    Already have an account? 
                    <Link to="/login" className="ml-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)]">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;