const { verifyToken } = require('../middleware/auth');
const messageService = require('../services/messageService');

class SocketHandler {
  constructor() {
    this.connectedClients = new Map();
  }

  // Configurar manejadores de Socket.IO
  setupSocketHandlers(io) {
    io.use((socket, next) => {
      // Middleware de autenticación para WebSocket
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Token de autenticación requerido'));
      }

      const user = verifyToken(token);
      if (!user) {
        return next(new Error('Token inválido'));
      }

      socket.user = user;
      next();
    });

    io.on('connection', (socket) => {
      console.log(`🔗 Cliente conectado: ${socket.id} (Usuario: ${socket.user.id})`);
      
      // Guardar información del cliente conectado
      this.connectedClients.set(socket.id, {
        socket,
        user: socket.user,
        connectedAt: new Date()
      });

      // Enviar estado actual de WhatsApp al cliente recién conectado
      this.sendWhatsAppStatus(socket);

      // Configurar manejadores de eventos
      this.setupClientEventHandlers(socket);

      // Manejar desconexión
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado: ${socket.id} (Razón: ${reason})`);
        this.connectedClients.delete(socket.id);
      });
    });

    return io;
  }

  // Configurar manejadores de eventos del cliente
  setupClientEventHandlers(socket) {
    // Unirse a una sala de chat específica
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`📱 Cliente ${socket.id} se unió al chat: ${chatId}`);
      
      socket.emit('joined_chat', {
        chatId,
        message: `Te has unido al chat ${chatId}`
      });
    });

    // Salir de una sala de chat
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`📱 Cliente ${socket.id} salió del chat: ${chatId}`);
      
      socket.emit('left_chat', {
        chatId,
        message: `Has salido del chat ${chatId}`
      });
    });

    // Solicitar estado de WhatsApp
    socket.on('get_whatsapp_status', () => {
      this.sendWhatsAppStatus(socket);
    });

    // Solicitar lista de chats activos
    socket.on('get_active_chats', async () => {
      try {
        const result = await messageService.getActiveChats();
        socket.emit('active_chats', result);
      } catch (error) {
        socket.emit('error', {
          event: 'get_active_chats',
          error: error.message
        });
      }
    });

    // Marcar mensajes como leídos
    socket.on('mark_as_read', async (chatId) => {
      try {
        const result = await messageService.markAsRead(chatId);
        socket.emit('marked_as_read', result);
        
        // Notificar a otros clientes en el mismo chat
        socket.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          readBy: socket.user.id
        });
      } catch (error) {
        socket.emit('error', {
          event: 'mark_as_read',
          error: error.message
        });
      }
    });

    // Escribiendo... (typing indicator)
    socket.on('typing_start', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.user.id,
        userName: socket.user.name || 'Usuario',
        typing: true
      });
    });

    socket.on('typing_stop', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.user.id,
        userName: socket.user.name || 'Usuario',
        typing: false
      });
    });

    // Solicitar estadísticas en tiempo real
    socket.on('get_stats', async (data) => {
      try {
        const { chatId, period } = data || {};
        const result = await messageService.getMessageStats(chatId, period);
        socket.emit('stats_update', result);
      } catch (error) {
        socket.emit('error', {
          event: 'get_stats',
          error: error.message
        });
      }
    });
  }

  // Enviar estado actual de WhatsApp al cliente
  sendWhatsAppStatus(socket) {
    const whatsappService = require('../services/whatsappService');
    const status = whatsappService.getStatus();
    
    socket.emit('whatsapp:status', status);
    
    // Si hay QR disponible, enviarlo
    if (status.hasQrCode) {
      const qrCode = whatsappService.getQrCode();
      if (qrCode) {
        socket.emit('whatsapp:qr', { qrCode });
      }
    }
  }

  // Broadcast a todos los clientes conectados
  broadcastToAll(event, data) {
    for (const client of this.connectedClients.values()) {
      client.socket.emit(event, data);
    }
  }

  // Broadcast a clientes en un chat específico
  broadcastToChat(chatId, event, data) {
    for (const client of this.connectedClients.values()) {
      client.socket.to(`chat_${chatId}`).emit(event, data);
    }
  }

  // Obtener estadísticas de conexiones
  getConnectionStats() {
    const now = new Date();
    const connections = Array.from(this.connectedClients.values());
    
    return {
      totalConnections: connections.length,
      connections: connections.map(client => ({
        socketId: client.socket.id,
        userId: client.user.id,
        userName: client.user.name || 'Usuario',
        connectedAt: client.connectedAt,
        connectedFor: now - client.connectedAt
      }))
    };
  }

  // Desconectar todos los clientes
  disconnectAll(reason = 'Server shutdown') {
    for (const client of this.connectedClients.values()) {
      client.socket.emit('server_shutdown', { reason });
      client.socket.disconnect(true);
    }
    this.connectedClients.clear();
  }
}

// Función principal para configurar Socket.IO
function setupSocketIO(io) {
  const handler = new SocketHandler();
  return handler.setupSocketHandlers(io);
}

module.exports = setupSocketIO;
