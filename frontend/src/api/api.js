import axios from 'axios';

// 创建专用实例，完全独立于全局axios
const api = axios.create({
  baseURL: 'http://localhost:5001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api; 