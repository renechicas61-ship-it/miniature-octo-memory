const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./config/config');
const routes = require('./routes');
const socketHandler = require('./socket/socketHandler');
const whatsappService = require('./services/whatsappService');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: config.cors
});

// Crear directorio de uploads si no existe
if (!fs.existsSync(config.upload.directory)) {
  fs.mkdirSync(config.upload.directory, { recursive: true });
}

// Middleware de seguridad
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(config.upload.directory));

// Rutas
app.use('/api', routes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    whatsappStatus: whatsappService.getStatus()
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'production' ? 'Error interno del servidor' : err.message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack })
  });
});

// Configurar Socket.IO
socketHandler(io);

// Inicializar WhatsApp
whatsappService.initialize(io);

// Iniciar servidor
server.listen(config.port, () => {
  console.log(`🚀 Servidor iniciado en puerto ${config.port}`);
  console.log(`📱 WhatsApp API disponible en http://localhost:${config.port}/api`);
  console.log(`🔗 WebSocket disponible en http://localhost:${config.port}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  whatsappService.destroy();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  whatsappService.destroy();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;
