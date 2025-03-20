require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
console.log('Auth Route JWT_SECRET:', process.env.JWT_SECRET);

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const knex = require('../db');

const router = express.Router();

router.use(express.json());

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await knex('users').insert({ username, email, password_hash: hashedPassword });
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(400).json({ message: 'User already exists' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await knex('users')
            .where({ email })
            .first();
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        // 设置cookie以持久保存令牌
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none', // 修改为 none 以允许跨站点请求
            maxAge: 24 * 60 * 60 * 1000 // 24小时
        });

        // 统一返回格式
        res.json({
            id: user.id,
            token,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

// 添加用户信息检查路由
router.get('/check-user', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  
  try {
    // 检查用户是否存在于数据库
    const user = await knex('users')
      .where({ id: req.user.id })
      .first();
      
    res.json({
      authenticated: true,
      userExists: !!user,
      user: user ? {
        id: user.id,
        username: user.username,
        // 其他非敏感字段
      } : null
    });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;