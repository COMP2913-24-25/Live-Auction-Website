import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { AuthContext } from '../context/authContext';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await loginUser(form);
            if (data.token) {
                login({ id: data.id, token: data.token, username: data.username });
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
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
                        Login
                    </button>
                </form>
                <p className="mt-6 text-center text-sm">
                    Do not have an account?
                    <Link to="/register" className="ml-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)]">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;