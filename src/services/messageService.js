const whatsappService = require('./whatsappService');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class MessageService {
  constructor() {
    this.messageHistory = new Map(); // En producción, usar base de datos
  }

  // Enviar mensaje de texto
  async sendTextMessage(to, message, options = {}) {
    try {
      // Validar número de teléfono
      const formattedNumber = this.formatPhoneNumber(to);
      
      const sentMessage = await whatsappService.sendMessage(formattedNumber, message);
      
      // Guardar en historial
      this.saveMessageToHistory(sentMessage);
      
      return {
        success: true,
        data: sentMessage,
        messageId: sentMessage.id
      };
    } catch (error) {
      console.error('❌ Error al enviar mensaje de texto:', error);
      throw new Error(`Error al enviar mensaje: ${error.message}`);
    }
  }

  // Enviar mensaje con archivo
  async sendMediaMessage(to, filePath, caption = '', options = {}) {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error('El archivo especificado no existe');
      }

      const sentMessage = await whatsappService.sendMediaMessage(formattedNumber, filePath, caption);
      
      // Guardar en historial
      this.saveMessageToHistory(sentMessage);
      
      return {
        success: true,
        data: sentMessage,
        messageId: sentMessage.id
      };
    } catch (error) {
      console.error('❌ Error al enviar mensaje con media:', error);
      throw new Error(`Error al enviar archivo: ${error.message}`);
    }
  }

  // Obtener historial de mensajes de un chat
  async getChatHistory(chatId, limit = 50, offset = 0) {
    try {
      const messages = this.messageHistory.get(chatId) || [];
      
      // Aplicar paginación
      const paginatedMessages = messages
        .slice(offset, offset + limit)
        .sort((a, b) => b.timestamp - a.timestamp);

      return {
        success: true,
        data: paginatedMessages,
        total: messages.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }

  // Buscar mensajes
  async searchMessages(query, chatId = null, limit = 20) {
    try {
      let allMessages = [];
      
      if (chatId) {
        allMessages = this.messageHistory.get(chatId) || [];
      } else {
        // Buscar en todos los chats
        for (const messages of this.messageHistory.values()) {
          allMessages = allMessages.concat(messages);
        }
      }

      const filteredMessages = allMessages
        .filter(message => 
          message.body && 
          message.body.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)
        .sort((a, b) => b.timestamp - a.timestamp);

      return {
        success: true,
        data: filteredMessages,
        query,
        total: filteredMessages.length
      };
    } catch (error) {
      console.error('❌ Error al buscar mensajes:', error);
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }

  // Marcar mensajes como leídos
  async markAsRead(chatId) {
    try {
      // En una implementación real, esto interactuaría con WhatsApp Web
      // Por ahora, solo actualizamos nuestro registro local
      const messages = this.messageHistory.get(chatId) || [];
      const unreadMessages = messages.filter(msg => !msg.fromMe && !msg.read);
      
      unreadMessages.forEach(msg => {
        msg.read = true;
        msg.readTimestamp = Date.now();
      });

      return {
        success: true,
        markedCount: unreadMessages.length,
        message: `${unreadMessages.length} mensajes marcados como leídos`
      };
    } catch (error) {
      console.error('❌ Error al marcar como leído:', error);
      throw new Error(`Error al marcar como leído: ${error.message}`);
    }
  }

  // Obtener estadísticas de mensajes
  async getMessageStats(chatId = null, period = '24h') {
    try {
      const now = Date.now();
      let periodMs;

      switch (period) {
        case '1h':
          periodMs = 60 * 60 * 1000;
          break;
        case '24h':
          periodMs = 24 * 60 * 60 * 1000;
          break;
        case '7d':
          periodMs = 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          periodMs = 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          periodMs = 24 * 60 * 60 * 1000;
      }

      const cutoffTime = now - periodMs;
      let allMessages = [];

      if (chatId) {
        allMessages = this.messageHistory.get(chatId) || [];
      } else {
        for (const messages of this.messageHistory.values()) {
          allMessages = allMessages.concat(messages);
        }
      }

      const recentMessages = allMessages.filter(msg => msg.timestamp >= cutoffTime);
      const sentMessages = recentMessages.filter(msg => msg.fromMe);
      const receivedMessages = recentMessages.filter(msg => !msg.fromMe);

      return {
        success: true,
        data: {
          period,
          total: recentMessages.length,
          sent: sentMessages.length,
          received: receivedMessages.length,
          mediaMessages: recentMessages.filter(msg => msg.hasMedia).length,
          textMessages: recentMessages.filter(msg => !msg.hasMedia).length
        }
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Formatear número de teléfono
  formatPhoneNumber(phoneNumber) {
    // Remover caracteres no numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Si no tiene código de país, asumir que es de México (+52)
    if (cleaned.length === 10) {
      cleaned = '52' + cleaned;
    }
    
    // Agregar @c.us para WhatsApp
    return cleaned + '@c.us';
  }

  // Guardar mensaje en historial (en producción usar base de datos)
  saveMessageToHistory(message) {
    const chatId = message.chat.id;
    
    if (!this.messageHistory.has(chatId)) {
      this.messageHistory.set(chatId, []);
    }
    
    const messages = this.messageHistory.get(chatId);
    messages.push({
      ...message,
      saved: true,
      savedTimestamp: Date.now()
    });
    
    // Mantener solo los últimos 1000 mensajes por chat
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }
  }

  // Procesar mensaje entrante
  processIncomingMessage(message) {
    this.saveMessageToHistory(message);
    
    // Aquí se pueden agregar reglas de procesamiento automático
    // Por ejemplo, respuestas automáticas, webhooks, etc.
    
    return message;
  }

  // Obtener resumen de chats activos
  async getActiveChats(limit = 20) {
    try {
      const chats = [];
      
      for (const [chatId, messages] of this.messageHistory.entries()) {
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const unreadCount = messages.filter(msg => !msg.fromMe && !msg.read).length;
          
          chats.push({
            chatId,
            lastMessage: {
              body: lastMessage.body,
              timestamp: lastMessage.timestamp,
              fromMe: lastMessage.fromMe,
              type: lastMessage.type
            },
            messageCount: messages.length,
            unreadCount,
            contact: lastMessage.contact
          });
        }
      }

      // Ordenar por último mensaje
      chats.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

      return {
        success: true,
        data: chats.slice(0, limit),
        total: chats.length
      };
    } catch (error) {
      console.error('❌ Error al obtener chats activos:', error);
      throw new Error(`Error al obtener chats activos: ${error.message}`);
    }
  }
}

module.exports = new MessageService();
