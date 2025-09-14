const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

// Public routes
router.post('/login', validateLogin, AuthController.login);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.get('/validate', authenticateToken, AuthController.validateToken);

module.exports = router;
