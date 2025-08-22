const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const api_logs = require('../middleware/api');

const router = express.Router();

// Register
router.post('/register', api_logs,[body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')], register);

// Login
router.post('/login', api_logs,[body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),body('password').exists().withMessage('Password is required')], login);

// Get current user
router.get('/me', auth, getMe);

module.exports = router;