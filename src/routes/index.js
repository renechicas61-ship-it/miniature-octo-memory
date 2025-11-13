const express = require('express');
const router = express.Router();

// Importar rutas específicas
const whatsappRoutes = require('./whatsapp');
const messageRoutes = require('./messages');
const authRoutes = require('./auth');

// Usar las rutas
router.use('/whatsapp', whatsappRoutes);
router.use('/messages', messageRoutes);
router.use('/auth', authRoutes);

// Ruta raíz de la API
router.get('/', (req, res) => {
  res.json({
    message: '🚀 WhatsApp Chat API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      whatsapp: '/api/whatsapp',
      messages: '/api/messages'
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

module.exports = router;
