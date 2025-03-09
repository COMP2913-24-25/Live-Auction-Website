const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Authentication Header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted Token:', token);
    
    if (!token) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = jwt.verify(token, process.env.SECRET_KEY || 'your-secret-key');
    console.log('Token verified successfully:', user);
    req.user = user;
    next();
  } catch (error) {
    console.log('Authentication failed: Invalid token', error);
    return res.status(403).json({ error: 'Forbidden', details: error.message });
  }
};

module.exports = { authenticateToken }; 