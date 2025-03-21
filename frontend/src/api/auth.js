import axios from 'axios';

// 拦截 /api/auth/* 请求并重定向到后端
axios.interceptors.request.use(
  (config) => {
    // 只处理认证相关请求
    if (config.url && config.url.startsWith('/api/auth/')) {
      // 设置正确的基础 URL
      config.baseURL = 'http://localhost:5000';
      
      // 添加认证头（如果有令牌）
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

// 拦截 /api/payment/* 请求
axios.interceptors.request.use(
  (config) => {
    // 只处理支付相关请求
    if (config.url && config.url.startsWith('/api/payment/')) {
      // 设置正确的基础 URL
      config.baseURL = 'http://localhost:5000';
      
      // 添加认证头（如果有令牌）
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