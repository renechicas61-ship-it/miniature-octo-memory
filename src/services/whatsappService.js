const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.io = null;
    this.qrCode = null;
    this.isReady = false;
    this.isConnecting = false;
    this.status = 'disconnected';
  }

  // Inicializar el cliente de WhatsApp
  async initialize(io) {
    this.io = io;
    
    try {
      console.log('🔄 Inicializando cliente de WhatsApp...');
      this.status = 'initializing';
      this.isConnecting = true;

      this.client = new Client({
        authStrategy: new LocalAuth({
          name: config.whatsapp.sessionName
        }),
        puppeteer: config.whatsapp.puppeteerOptions
      });

      this.setupEventHandlers();
      await this.client.initialize();
      
    } catch (error) {
      console.error('❌ Error al inicializar WhatsApp:', error);
      this.status = 'error';
      this.isConnecting = false;
      this.emitToClients('whatsapp:error', { error: error.message });
    }
  }

  // Configurar manejadores de eventos
  setupEventHandlers() {
    // Evento QR Code
    this.client.on('qr', async (qr) => {
      console.log('📱 Código QR generado');
      this.status = 'qr_code';
      
      try {
        this.qrCode = await qrcode.toDataURL(qr);
        this.emitToClients('whatsapp:qr', { qrCode: this.qrCode });
      } catch (error) {
        console.error('❌ Error al generar QR:', error);
      }
    });

    // Cliente listo
    this.client.on('ready', () => {
      console.log('✅ Cliente de WhatsApp listo');
      this.isReady = true;
      this.isConnecting = false;
      this.status = 'ready';
      this.qrCode = null;
      this.emitToClients('whatsapp:ready', { message: 'WhatsApp conectado correctamente' });
    });

    // Cliente autenticado
    this.client.on('authenticated', () => {
      console.log('🔐 Cliente autenticado');
      this.status = 'authenticated';
      this.emitToClients('whatsapp:authenticated', { message: 'Autenticación exitosa' });
    });

    // Fallo de autenticación
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Fallo de autenticación:', msg);
      this.status = 'auth_failure';
      this.isConnecting = false;
      this.emitToClients('whatsapp:auth_failure', { error: msg });
    });

    // Cliente desconectado
    this.client.on('disconnected', (reason) => {
      console.log('🔌 Cliente desconectado:', reason);
      this.isReady = false;
      this.status = 'disconnected';
      this.emitToClients('whatsapp:disconnected', { reason });
    });

    // Mensaje recibido
    this.client.on('message', async (message) => {
      console.log('📨 Mensaje recibido:', message.from, message.body);
      
      const messageData = await this.formatMessage(message);
      this.emitToClients('whatsapp:message', messageData);
    });

    // Cambio de estado de mensaje
    this.client.on('message_ack', (message, ack) => {
      console.log('✅ Estado de mensaje actualizado:', message.id.id, ack);
      this.emitToClients('whatsapp:message_ack', {
        messageId: message.id.id,
        ack: ack
      });
    });
  }

  // Formatear mensaje para envío
  async formatMessage(message) {
    const contact = await message.getContact();
    const chat = await message.getChat();
    
    return {
      id: message.id.id,
      from: message.from,
      to: message.to,
      body: message.body,
      type: message.type,
      timestamp: message.timestamp,
      fromMe: message.fromMe,
      hasMedia: message.hasMedia,
      contact: {
        id: contact.id.user,
        name: contact.name || contact.pushname,
        isMyContact: contact.isMyContact
      },
      chat: {
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup
      }
    };
  }

  // Enviar mensaje de texto
  async sendMessage(to, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      const sentMessage = await this.client.sendMessage(to, message);
      return await this.formatMessage(sentMessage);
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      throw error;
    }
  }

  // Enviar mensaje con media
  async sendMediaMessage(to, media, caption = '') {
    if (!this.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      const messageMedia = MessageMedia.fromFilePath(media);
      const sentMessage = await this.client.sendMessage(to, messageMedia, { caption });
      return await this.formatMessage(sentMessage);
    } catch (error) {
      console.error('❌ Error al enviar media:', error);
      throw error;
    }
  }

  // Obtener chats
  async getChats() {
    if (!this.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      const chats = await this.client.getChats();
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        isReadOnly: chat.isReadOnly,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body,
          type: chat.lastMessage.type,
          timestamp: chat.lastMessage.timestamp,
          fromMe: chat.lastMessage.fromMe
        } : null
      }));
    } catch (error) {
      console.error('❌ Error al obtener chats:', error);
      throw error;
    }
  }

  // Obtener contactos
  async getContacts() {
    if (!this.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      const contacts = await this.client.getContacts();
      return contacts.map(contact => ({
        id: contact.id.user,
        name: contact.name || contact.pushname,
        number: contact.number,
        isMyContact: contact.isMyContact,
        isUser: contact.isUser,
        isGroup: contact.isGroup
      }));
    } catch (error) {
      console.error('❌ Error al obtener contactos:', error);
      throw error;
    }
  }

  // Obtener información del cliente
  async getClientInfo() {
    if (!this.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      const info = this.client.info;
      return {
        wid: info.wid,
        pushname: info.pushname,
        platform: info.platform
      };
    } catch (error) {
      console.error('❌ Error al obtener info del cliente:', error);
      throw error;
    }
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      status: this.status,
      isReady: this.isReady,
      isConnecting: this.isConnecting,
      hasQrCode: !!this.qrCode
    };
  }

  // Obtener código QR actual
  getQrCode() {
    return this.qrCode;
  }

  // Emitir evento a todos los clientes conectados
  emitToClients(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Destruir cliente
  async destroy() {
    if (this.client) {
      try {
        await this.client.destroy();
        console.log('🛑 Cliente de WhatsApp destruido');
      } catch (error) {
        console.error('❌ Error al destruir cliente:', error);
      }
    }
    
    this.client = null;
    this.isReady = false;
    this.isConnecting = false;
    this.status = 'disconnected';
    this.qrCode = null;
  }

  // Reiniciar cliente
  async restart() {
    console.log('🔄 Reiniciando cliente de WhatsApp...');
    await this.destroy();
    await this.initialize(this.io);
  }
}

// Exportar instancia singleton
module.exports = new WhatsAppService();
