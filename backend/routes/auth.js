const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-health-secret-key-12345';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'No authorization token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Session expired or invalid token' });
    req.user = user;
    next();
  });
};

// Admin Auth Middleware
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin permissions required' });
    }
    next();
  });
};

// User Registration
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = db.insert('users', {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      status: 'active'
    });

    // Clean sensitive password field
    delete newUser.password;

    // Generate JWT
    const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// User & Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Default Seed Admin Account
    if (email.toLowerCase() === 'admin@health.com' && password === 'admin123') {
      const token = jwt.sign({ id: 'admin-1', name: 'System Administrator', email: 'admin@health.com', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        user: { id: 'admin-1', name: 'System Administrator', email: 'admin@health.com', role: 'admin' },
        token
      });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    delete user.password;
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Profile fetching
router.get('/profile', authenticateToken, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User profile not found' });
  delete user.password;
  res.json(user);
});

module.exports = {
  router,
  authenticateToken,
  authenticateAdmin
};
