import axios from 'axios';

// 设置默认的baseURL
axios.defaults.baseURL = 'http://localhost:5000';

// 添加一个通用请求拦截器，处理所有API请求
axios.interceptors.request.use(
  (config) => {
    // 添加认证头（如果有令牌）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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