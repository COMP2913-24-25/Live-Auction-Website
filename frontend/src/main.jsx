import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './api/auth';
import { connectSocket } from './socket';

// 初始化Socket.io连接
connectSocket();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);