require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const knex = require('../db');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(express.json());

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // 验证输入
        if (!username || !email || !password) {
            console.log('Registration failed: Incomplete input');
            return res.status(400).json({ error: 'Please provide a username, email, and password' });
        }
        
        // 检查用户名是否已存在
        const existingUser = await knex('users').where({ username }).first();
        if (existingUser) {
            console.log(`Registration failed: Username ${username} already exists`);
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // 检查邮箱是否已存在
        const existingEmail = await knex('users').where({ email }).first();
        if (existingEmail) {
            console.log(`Registration failed: Email ${email} is already registered`);
            return res.status(400).json({ error: 'Email is already registered' });
        }
        
        // 哈希密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 准备用户数据，包含角色信息
        const userData = { 
            username, 
            email, 
            password_hash: hashedPassword 
        };
        
        // 如果提供了角色，按如下转换：
        // 'user' -> 1, 'expert' -> 2, 'manager' -> 3
        if (role) {
            if (role === 'expert') {
                userData.role = 2;
            } else if (role === 'manager') {
                userData.role = 3;
            } else {
                userData.role = 1; // 默认普通用户
            }
        }
        
        // 插入新用户
        const [userId] = await knex('users').insert(userData);
        
        // 生成JWT
        const token = jwt.sign(
            { id: userId, email: email },
            process.env.SECRET_KEY || 'JH7g5Ff9KmNp3Qz8Xw6RdC2Vb1At0Er4',
            { expiresIn: '7d' }
        );
        
        console.log(`New user registered successfully: ${username}`);
        
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: userId,
                username,
                email,
                role: userData.role || 1
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Register error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Received Login Request:', req.body);
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Search for user by email
        const user = await knex('users').where({ email }).first();
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Compare password hashes
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password Comparison Result:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        //  Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.SECRET_KEY || 'JH7g5Ff9KmNp3Qz8Xw6RdC2Vb1At0Er4',
            { expiresIn: '7d' }
        );
        
        // Send token and user data
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 添加刷新令牌路由
router.post('/refresh-token', authenticateUser, (req, res) => {
  try {
    // 用户已经通过authenticateUser中间件验证
    const user = req.user;
    
    // 生成新令牌，这次确保使用正确的密钥
    const newToken = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.SECRET_KEY || 'JH7g5Ff9KmNp3Qz8Xw6RdC2Vb1At0Er4', 
      { expiresIn: '7d' }
    );
    
    res.json({ token: newToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;