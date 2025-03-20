import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './api'; // 确保在其他导入前导入
import App from './App';
import './index.css';
import axios from 'axios';

// 设置请求拦截器
axios.interceptors.request.use(
  config => {
    // 尝试多种方式获取token
    let token = null;
    
    // 方式1：直接从localStorage获取token (如果是单独存储的)
    token = localStorage.getItem('token');
    
    // 方式2：从localStorage中的user对象获取token
    if (!token) {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.token) {
          token = userData.token;
        }
      } catch (e) {
        console.error('解析localStorage中的user数据失败:', e);
      }
    }
    
    if (token) {
      // 为所有请求添加Authorization头
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);