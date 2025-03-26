require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');

const PORT = process.env.PORT || 5000;

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // 用户加入拍卖房间
  socket.on('join_auction', (auctionId) => {
    const roomName = `auction_${auctionId}`;
    socket.join(roomName);
    console.log(`Client ${socket.id} joined room: ${roomName}`);
  });
  
  // 用户离开拍卖房间
  socket.on('leave_auction', (auctionId) => {
    const roomName = `auction_${auctionId}`;
    socket.leave(roomName);
    console.log(`Client ${socket.id} left room: ${roomName}`);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 使io对象可在其他文件中访问
global.io = io;

// 使用server而不是app来监听
server.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    return;
  }
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.io initialized');
});
