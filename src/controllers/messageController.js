const messageService = require('../services/messageService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = config.upload.directory;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    // Permitir imágenes, videos, audios y documentos
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|wav|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

class MessageController {
  // Enviar mensaje de texto
  async sendText(req, res) {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros requeridos',
          message: 'Los campos "to" y "message" son obligatorios'
        });
      }

      const result = await messageService.sendTextMessage(to, message);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al enviar mensaje',
        message: error.message
      });
    }
  }

  // Enviar mensaje con archivo
  async sendMedia(req, res) {
    try {
      const { to, caption } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro requerido',
          message: 'El campo "to" es obligatorio'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Archivo requerido',
          message: 'Debe subir un archivo'
        });
      }

      const filePath = req.file.path;
      const result = await messageService.sendMediaMessage(to, filePath, caption || '');
      
      // Eliminar archivo temporal después de enviarlo
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);

      res.json(result);
    } catch (error) {
      // Limpiar archivo en caso de error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'Error al enviar archivo',
        message: error.message
      });
    }
  }

  // Obtener historial de chat
  async getChatHistory(req, res) {
    try {
      const { chatId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro requerido',
          message: 'El chatId es obligatorio'
        });
      }

      const result = await messageService.getChatHistory(
        chatId, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener historial',
        message: error.message
      });
    }
  }

  // Buscar mensajes
  async searchMessages(req, res) {
    try {
      const { query, chatId, limit = 20 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro requerido',
          message: 'El parámetro "query" es obligatorio'
        });
      }

      const result = await messageService.searchMessages(
        query, 
        chatId, 
        parseInt(limit)
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error en búsqueda',
        message: error.message
      });
    }
  }

  // Marcar mensajes como leídos
  async markAsRead(req, res) {
    try {
      const { chatId } = req.params;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro requerido',
          message: 'El chatId es obligatorio'
        });
      }

      const result = await messageService.markAsRead(chatId);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al marcar como leído',
        message: error.message
      });
    }
  }

  // Obtener estadísticas de mensajes
  async getStats(req, res) {
    try {
      const { chatId, period = '24h' } = req.query;

      const result = await messageService.getMessageStats(chatId, period);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas',
        message: error.message
      });
    }
  }

  // Obtener chats activos
  async getActiveChats(req, res) {
    try {
      const { limit = 20 } = req.query;

      const result = await messageService.getActiveChats(parseInt(limit));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener chats activos',
        message: error.message
      });
    }
  }

  // Middleware para subida de archivos
  getUploadMiddleware() {
    return upload.single('file');
  }
}

module.exports = new MessageController();
