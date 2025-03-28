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
    
    // 调试日志
    if (config.url && (config.url.startsWith('/api/auth/') || config.url.startsWith('/api/payment/'))) {
      console.log('The request was intercepted:', config.url);
      console.log('Full request URL:', config.baseURL + config.url);
      
      // 只在开发环境打印请求数据
      if (process.env.NODE_ENV === 'development') {
        console.log('Request data:', config.data);
      }
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

// 添加响应拦截器处理令牌过期情况
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果收到 401 错误，可能是令牌过期
    if (error.response && error.response.status === 401) {
      console.log('Received 401 Unauthorized response, token may be expired');
      
      // 清除本地存储的令牌
      localStorage.removeItem('token');
      
      // 重定向到登录页面
      window.location.href = '/login?expired=true';
    }
    
    return Promise.reject(error);
  }
);

export default axios;

// 登录函数
export const login = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    
    // 保存令牌和用户信息
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 添加令牌刷新函数
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await axios.post('/api/auth/refresh-token', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 更新本地存储
    localStorage.setItem('token', response.data.token);
    return response.data.token;
  } catch (error) {
    // 令牌刷新失败，清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
}; 