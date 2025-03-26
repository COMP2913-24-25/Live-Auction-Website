import { io } from 'socket.io-client';

let socket = null;

// 创建并返回Socket.io连接
export const connectSocket = () => {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Connecting to socket.io server at:', socketUrl);
    
    socket = io(socketUrl);
    
    socket.on('connect', () => {
      console.log('Socket.io connected! ID:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err);
    });
  }
  
  return socket;
};

// 获取现有Socket.io实例或创建新的
export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

// 加入拍卖房间
export const joinAuctionRoom = (auctionId) => {
  const socket = getSocket();
  socket.emit('join_auction', auctionId);
};

// 离开拍卖房间
export const leaveAuctionRoom = (auctionId) => {
  if (socket) {
    socket.emit('leave_auction', auctionId);
  }
};

// 断开连接
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  connectSocket,
  getSocket,
  joinAuctionRoom,
  leaveAuctionRoom,
  disconnectSocket
}; 