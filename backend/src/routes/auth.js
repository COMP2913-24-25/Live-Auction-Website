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
        const { email, password } = req.body;
        console.log('Received Login Request:', { email, password }); // Debugging log

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await knex('users').where({ email }).first();
        console.log('Fetched User from DB:', user); // Debugging log

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.password_hash) {
            console.error('User password is missing from the database:', user);
            return res.status(500).json({ message: 'Server error: Password missing from database' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password Comparison Result:', validPassword); // Debugging log

        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log(`Secret Key: ${process.env.SECRET_KEY}`); // Debugging log
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '1h' });
        res.json({ id: user.id, token, username: user.username, role: user.role });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;