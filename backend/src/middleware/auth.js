const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Authentication Header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted Token:', token ? `${token.substring(0, 10)}...` : 'none');
    
    if (!token) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 确保使用与路由相同的SECRET_KEY
    const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
    console.log('Using secret key:', SECRET_KEY ? 'Secret key is set' : 'Using default key');
    
    try {
      const user = jwt.verify(token, SECRET_KEY);
      console.log('Token verified successfully for user:', user.id);
      req.user = user;
      next();
    } catch (jwtError) {
      console.log('Token verification failed:', jwtError.message);
      
      // 创建一个降级处理，仅用于开发环境
      if (process.env.NODE_ENV !== 'production' && req.body && req.body.user_id) {
        console.log('Development environment: Token verification failed, using the user ID from the request body:', req.body.user_id);
        req.user = { id: req.body.user_id };
        next();
        return;
      }
      
      return res.status(403).json({ error: 'Forbidden', details: jwtError.message });
    }
  } catch (error) {
    console.log('Authentication processing error:', error);
    return res.status(500).json({ error: 'Authentication processing error', details: error.message });
  }
};

module.exports = { authenticateToken }; 