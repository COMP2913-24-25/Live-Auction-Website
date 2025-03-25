require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

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
        const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
        const token = jwt.sign(
            { id: userId, email: email },
            SECRET_KEY,
            { expiresIn: '24h' }
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
        
        // 查询用户
        const user = await knex('users').where({ email }).first();
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password Comparison Result:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // 生成 JWT - 使用SECRET_KEY而不是JWT_SECRET
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.SECRET_KEY || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // 返回用户信息和令牌
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

// 临时路由 - 仅用于开发调试，生产环境请移除
router.delete('/cleanup/:username', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Production environment does not allow this operation' });
        }
        
        const username = req.params.username;
        console.log(`Attempting to delete user: ${username}`);
        
        // 检查用户是否存在
        const existingUser = await knex('users')
            .where(knex.raw('LOWER(username)'), username.toLowerCase())
            .first();
            
        if (!existingUser) {
            return res.status(404).json({ error: 'User does not exist' });
        }
        
        // 删除用户
        await knex('users').where('id', existingUser.id).delete();
        
        console.log(`Deleted user: ${username} (ID: ${existingUser.id})`);
        return res.json({ message: `Deleted user: ${username}` });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Delete user error', details: error.message });
    }
});

// 新增一个路由来查看是否有大小写不敏感的用户名匹配
router.get('/check/:username', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Production environment does not allow this operation' });
        }
        
        const username = req.params.username;
        console.log(`Check username: ${username}`);
        
        // 查询所有用户
        const allUsers = await knex('users').select('id', 'username', 'email');
        
        // 查找可能的匹配（不区分大小写）
        const possibleMatches = allUsers.filter(
            user => user.username.toLowerCase() === username.toLowerCase()
        );
        
        return res.json({
            searched: username,
            exactMatch: allUsers.find(u => u.username === username) || null,
            caseInsensitiveMatches: possibleMatches,
            allUsers: allUsers
        });
    } catch (error) {
        console.error('Check username error:', error);
        return res.status(500).json({ error: 'Check username error', details: error.message });
    }
});

module.exports = router;