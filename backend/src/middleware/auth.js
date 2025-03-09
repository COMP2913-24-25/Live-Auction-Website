// 认证中间件
const jwt = require('jsonwebtoken');
const knex = require('../database/knex');

const authenticateToken = async (req, res, next) => {
  try {
    // 在测试模式下允许通过请求头设置测试用户
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-user']) {
      req.user = JSON.parse(req.headers['x-test-user']);
      return next();
    }
    
    // 获取请求中的token
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(); // 允许匿名访问，但req.user将为undefined
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 从数据库获取用户信息
    const user = await knex('users').where('id', decoded.id).first();
    
    if (!user) {
      return next(); // 允许继续，但req.user将为undefined
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(); // 错误时允许继续，但req.user将为undefined
  }
};

module.exports = { authenticateToken }; 