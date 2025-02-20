const API_URL = `${import.meta.env.VITE_API_URL}/api`; 

export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'  
            },
            credentials: 'include', 
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        return data;
    } catch (error) {
        throw new Error(error.message || 'Login failed');
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