const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas de mensajes requieren autenticación
router.use(authenticateToken);

// Enviar mensaje de texto
router.post('/send/text', messageController.sendText);

// Enviar mensaje con archivo
router.post('/send/media', 
  messageController.getUploadMiddleware(), 
  messageController.sendMedia
);

// Obtener historial de chat
router.get('/history/:chatId', messageController.getChatHistory);

// Buscar mensajes
router.get('/search', messageController.searchMessages);

// Marcar mensajes como leídos
router.post('/read/:chatId', messageController.markAsRead);

// Obtener estadísticas de mensajes
router.get('/stats', messageController.getStats);

// Obtener chats activos
router.get('/chats', messageController.getActiveChats);

module.exports = router;
