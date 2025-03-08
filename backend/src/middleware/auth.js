const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('认证失败: 没有提供令牌');
    return res.status(401).json({ error: '未授权' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = user;
    console.log('认证成功:', user);
    next();
  } catch (error) {
    console.log('认证失败: 无效令牌', error);
    return res.status(403).json({ error: '禁止访问' });
  }
};

module.exports = { authenticateToken }; 