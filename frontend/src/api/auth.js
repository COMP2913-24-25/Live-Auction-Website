import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`; 

// Add tokens to all API requests
axios.interceptors.request.use(
  config => {
    // Get the token from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post('/api/auth/login', credentials);
        console.log('Login response:', response.data);
        
        // Save the user information to localStorage
        if (response.data.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    } catch (error) {
        console.error('Login error:', error.response?.data || error);
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'  
            },
            credentials: 'include', 
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        return data;
    } catch (error) {
        throw new Error(error.message || 'Registration failed');
    }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', {
      email,
      password
    }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Adds a method to get information about the current user
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};