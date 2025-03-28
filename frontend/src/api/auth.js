import axios from 'axios';

//Intercept /api/auth/* requests and redirect to the backend
axios.interceptors.request.use(
  (config) => {
    // manage the authentication requests
    if (config.url && config.url.startsWith('/api/auth/')) {
      // setup the correct base URL
      config.baseURL = 'http://localhost:5000';
      
      // add the authentication header (if token exists)
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('The authentication request was intercepted:', config.url);
      console.log('Full request URL:', config.baseURL + config.url);
      console.log('Request data:', config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept /api/payment/* requests and redirect to the backend
axios.interceptors.request.use(
  (config) => {
    // manage the payment requests
    if (config.url && config.url.startsWith('/api/payment/')) {
      // setup the correct base URL
      config.baseURL = 'http://localhost:5000';
      
      // add the authentication header (if token exists)
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('The authentication request was intercepted:', config.url);
      console.log('Full request URL:', config.baseURL + config.url);
      console.log('Request data:', config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios; 