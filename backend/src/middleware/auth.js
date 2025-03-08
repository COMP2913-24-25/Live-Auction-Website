const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Authentication failed: No token was provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = user;
    console.log('Authentication successful:', user);
    next();
  } catch (error) {
    console.log('Authentication failed: Invalid token', error);
    return res.status(403).json({ error: 'Forbidden' });
  }
};

module.exports = { authenticateToken }; 