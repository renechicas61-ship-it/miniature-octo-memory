const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.post('/login', authController.login);
router.post('/register', authController.register);

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/logout', authenticateToken, authController.logout);
router.get('/users', authenticateToken, authController.getUsers);

module.exports = router;
