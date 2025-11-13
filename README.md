# 📱 WhatsApp Chat API

Una API REST completa para integrar WhatsApp Web con funcionalidades en tiempo real usando Node.js, Express y Socket.IO.

## 🚀 Características

- ✅ **Conexión con WhatsApp Web** usando whatsapp-web.js
- ✅ **API REST completa** para envío y recepción de mensajes
- ✅ **WebSocket en tiempo real** para notificaciones instantáneas
- ✅ **Autenticación JWT** para seguridad
- ✅ **Subida de archivos** (imágenes, videos, documentos)
- ✅ **Historial de mensajes** con búsqueda y paginación
- ✅ **Estadísticas de mensajes** y análisis
- ✅ **Rate limiting** y middleware de seguridad
- ✅ **Manejo de errores** robusto
- ✅ **Documentación completa** de la API

## 📋 Requisitos

- Node.js >= 16.0.0
- npm o yarn
- Google Chrome (para Puppeteer)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/whatsapp-chat-api.git
cd whatsapp-chat-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
WHATSAPP_SESSION_NAME=whatsapp-session
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

4. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📱 Conexión con WhatsApp

1. **Iniciar el servidor** y visitar `http://localhost:3000/api/whatsapp/qr`
2. **Escanear el código QR** con tu WhatsApp móvil
3. **¡Listo!** La API estará conectada a tu WhatsApp

## 🔐 Autenticación

### Credenciales por defecto
- **Usuario:** `admin`
- **Contraseña:** `password`

### Obtener token de acceso
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### Usar el token en las peticiones
```bash
curl -H "Authorization: Bearer TU_TOKEN_AQUI" \
  http://localhost:3000/api/whatsapp/status
```

## 📚 Endpoints de la API

### 🔐 Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/logout` - Cerrar sesión

### 📱 WhatsApp
- `GET /api/whatsapp/status` - Estado de conexión
- `GET /api/whatsapp/qr` - Código QR para conectar
- `GET /api/whatsapp/info` - Información del cliente
- `GET /api/whatsapp/chats` - Lista de chats
- `GET /api/whatsapp/contacts` - Lista de contactos
- `POST /api/whatsapp/restart` - Reiniciar conexión

### 💬 Mensajes
- `POST /api/messages/send/text` - Enviar mensaje de texto
- `POST /api/messages/send/media` - Enviar archivo
- `GET /api/messages/history/:chatId` - Historial de chat
- `GET /api/messages/search` - Buscar mensajes
- `POST /api/messages/read/:chatId` - Marcar como leído
- `GET /api/messages/stats` - Estadísticas
- `GET /api/messages/chats` - Chats activos

## 💡 Ejemplos de uso

### Enviar mensaje de texto
```bash
curl -X POST http://localhost:3000/api/messages/send/text \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5215551234567",
    "message": "¡Hola desde la API!"
  }'
```

### Enviar imagen
```bash
curl -X POST http://localhost:3000/api/messages/send/media \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "to=5215551234567" \
  -F "caption=Mi imagen" \
  -F "file=@/ruta/a/imagen.jpg"
```

### Obtener historial de chat
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  "http://localhost:3000/api/messages/history/5215551234567@c.us?limit=20"
```

## 🔌 WebSocket en tiempo real

### Conectar al WebSocket
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'TU_TOKEN_JWT'
  }
});

// Escuchar mensajes entrantes
socket.on('whatsapp:message', (message) => {
  console.log('Nuevo mensaje:', message);
});

// Escuchar cambios de estado
socket.on('whatsapp:status', (status) => {
  console.log('Estado WhatsApp:', status);
});
```

### Eventos disponibles
- `whatsapp:qr` - Código QR generado
- `whatsapp:ready` - WhatsApp conectado
- `whatsapp:message` - Mensaje recibido
- `whatsapp:message_ack` - Estado de mensaje actualizado
- `whatsapp:disconnected` - WhatsApp desconectado

## 📊 Monitoreo

### Endpoint de salud
```bash
curl http://localhost:3000/health
```

### Estadísticas de mensajes
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  "http://localhost:3000/api/messages/stats?period=24h"
```

## 🛡️ Seguridad

- **JWT Authentication** para todas las rutas protegidas
- **Rate limiting** para prevenir abuso
- **CORS** configurado para dominios específicos
- **Helmet** para headers de seguridad
- **Validación de archivos** en uploads
- **Sanitización de inputs**

## 🚀 Despliegue

### Docker (Recomendado)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2
```bash
npm install -g pm2
pm2 start src/app.js --name whatsapp-api
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## ⚠️ Disclaimer

Esta API utiliza whatsapp-web.js que no es una biblioteca oficial de WhatsApp. El uso de esta API puede violar los términos de servicio de WhatsApp. Úsala bajo tu propio riesgo.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la [documentación completa](docs/API.md)
2. Busca en los [issues existentes](https://github.com/tu-usuario/whatsapp-chat-api/issues)
3. Crea un [nuevo issue](https://github.com/tu-usuario/whatsapp-chat-api/issues/new)

---

⭐ **¡Si te gusta este proyecto, dale una estrella!** ⭐
