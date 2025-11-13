const whatsappService = require('../services/whatsappService');

class WhatsAppController {
  // Obtener estado de WhatsApp
  async getStatus(req, res) {
    try {
      const status = whatsappService.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener estado',
        message: error.message
      });
    }
  }

  // Obtener código QR
  async getQrCode(req, res) {
    try {
      const qrCode = whatsappService.getQrCode();
      
      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'QR no disponible',
          message: 'No hay código QR disponible en este momento'
        });
      }

      res.json({
        success: true,
        data: {
          qrCode: qrCode
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener QR',
        message: error.message
      });
    }
  }

  // Obtener información del cliente
  async getClientInfo(req, res) {
    try {
      const info = await whatsappService.getClientInfo();
      res.json({
        success: true,
        data: info
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener información del cliente',
        message: error.message
      });
    }
  }

  // Obtener chats
  async getChats(req, res) {
    try {
      const chats = await whatsappService.getChats();
      res.json({
        success: true,
        data: chats,
        count: chats.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener chats',
        message: error.message
      });
    }
  }

  // Obtener contactos
  async getContacts(req, res) {
    try {
      const contacts = await whatsappService.getContacts();
      res.json({
        success: true,
        data: contacts,
        count: contacts.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener contactos',
        message: error.message
      });
    }
  }

  // Reiniciar cliente
  async restart(req, res) {
    try {
      await whatsappService.restart();
      res.json({
        success: true,
        message: 'Cliente reiniciado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al reiniciar cliente',
        message: error.message
      });
    }
  }

  // Desconectar cliente
  async disconnect(req, res) {
    try {
      await whatsappService.destroy();
      res.json({
        success: true,
        message: 'Cliente desconectado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al desconectar cliente',
        message: error.message
      });
    }
  }
}

module.exports = new WhatsAppController();
