import axios from 'axios';

// 设置基础URL指向后端服务器
axios.defaults.baseURL = 'http://localhost:5001'; // 或使用环境变量 

// 添加请求拦截器确保所有请求都带有认证令牌
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // 使用Authorization头而不是cookie
    config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
}); 