import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 修改提交出价API，恢复原有的简单实现
export const submitBid = async (bidData) => {
  console.log('Start submitting bids, data:', bidData);
  
  // 获取token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No user token found');
    throw new Error('You need to be logged in to bid');
  }

  try {
    // 只使用/api/bids路径发送请求
    console.log('Sending request to API path: /api/bids');
    const response = await axios.post('/api/bids', bidData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Bid successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error during bid submission:', error);
    
    // 提供详细的错误信息
    if (error.response) {
      // 服务器返回错误状态码
      const errorMsg = error.response.data?.error || 
                       error.response.data?.message || 
                       `Server error (${error.response.status})`;
      console.error('Server response error:', errorMsg);
      throw new Error(errorMsg);
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('No server response');
      throw new Error('Unable to connect to the server, please check your network connection or server status');
    } else {
      // 请求设置过程中出错
      throw error;
    }
  }
};

// 保持获取拍卖最新状态的API不变
export const fetchAuctionById = async (auctionId) => {
  console.log('Fetching auction details, ID:', auctionId);
  
  try {
    const response = await axios.get(`/api/auctions/${auctionId}`);
    console.log('Fetched auction details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch auction information:', error);
    if (error.response) {
      throw new Error(error.response.data?.error || 'Failed to fetch auction information');
    }
    throw error;
  }
};

export const getAuctionBids = async (itemId) => {
  try {
    const response = await axios.get(`${API_URL}/bids/auction/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bid history:', error);
    throw error;
  }
};

export default { submitBid }; 