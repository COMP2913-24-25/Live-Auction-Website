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
        
        // 生成 JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
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

module.exports = router;