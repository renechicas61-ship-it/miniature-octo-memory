const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.get('/status', whatsappController.getStatus);
router.get('/qr', whatsappController.getQrCode);

// Rutas protegidas (requieren autenticación)
router.get('/info', authenticateToken, whatsappController.getClientInfo);
router.get('/chats', authenticateToken, whatsappController.getChats);
router.get('/contacts', authenticateToken, whatsappController.getContacts);
router.post('/restart', authenticateToken, whatsappController.restart);
router.post('/disconnect', authenticateToken, whatsappController.disconnect);

module.exports = router;
