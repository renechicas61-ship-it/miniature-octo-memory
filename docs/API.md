# 📚 Documentación completa de la API

## Índice
- [Autenticación](#autenticación)
- [Endpoints de WhatsApp](#endpoints-de-whatsapp)
- [Endpoints de Mensajes](#endpoints-de-mensajes)
- [WebSocket Events](#websocket-events)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Respuesta](#ejemplos-de-respuesta)

## Autenticación

Todos los endpoints protegidos requieren un token JWT en el header `Authorization`:

```
Authorization: Bearer <token>
```

### POST /api/auth/login

Iniciar sesión y obtener token de acceso.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin",
      "username": "admin",
      "name": "Administrador",
      "role": "admin",
      "lastLogin": "2023-11-13T21:44:09.000Z"
    }
  }
}
```

### POST /api/auth/register

Registrar nuevo usuario.

**Request Body:**
```json
{
  "username": "nuevo_usuario",
  "password": "mi_password",
  "name": "Mi Nombre",
  "role": "user"
}
```

### GET /api/auth/profile

Obtener perfil del usuario actual. Requiere autenticación.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "admin",
    "username": "admin",
    "name": "Administrador",
    "role": "admin",
    "createdAt": "2023-11-13T21:44:09.000Z",
    "lastLogin": "2023-11-13T21:44:09.000Z"
  }
}
```

## Endpoints de WhatsApp

### GET /api/whatsapp/status

Obtener estado actual de la conexión con WhatsApp.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "isReady": true,
    "isConnecting": false,
    "hasQrCode": false
  }
}
```

**Estados posibles:**
- `disconnected` - Desconectado
- `initializing` - Inicializando
- `qr_code` - Esperando escaneo de QR
- `authenticated` - Autenticado
- `ready` - Listo para usar
- `auth_failure` - Fallo de autenticación
- `error` - Error

### GET /api/whatsapp/qr

Obtener código QR para conectar WhatsApp.

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

### GET /api/whatsapp/info

Obtener información del cliente WhatsApp conectado. Requiere autenticación.

**Response:**
```json
{
  "success": true,
  "data": {
    "wid": "5215551234567@c.us",
    "pushname": "Mi Nombre",
    "platform": "android"
  }
}
```

### GET /api/whatsapp/chats

Obtener lista de chats. Requiere autenticación.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "5215551234567@c.us",
      "name": "Juan Pérez",
      "isGroup": false,
      "isReadOnly": false,
      "unreadCount": 2,
      "timestamp": 1699908249,
      "lastMessage": {
        "body": "Hola, ¿cómo estás?",
        "type": "chat",
        "timestamp": 1699908249,
        "fromMe": false
      }
    }
  ],
  "count": 1
}
```

### GET /api/whatsapp/contacts

Obtener lista de contactos. Requiere autenticación.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "5215551234567",
      "name": "Juan Pérez",
      "number": "5215551234567",
      "isMyContact": true,
      "isUser": true,
      "isGroup": false
    }
  ],
  "count": 1
}
```

## Endpoints de Mensajes

### POST /api/messages/send/text

Enviar mensaje de texto. Requiere autenticación.

**Request Body:**
```json
{
  "to": "5215551234567",
  "message": "¡Hola desde la API!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "3EB0C767D26A1B2E3F4A5C6D",
    "from": "5215551234567@c.us",
    "to": "5215551234567@c.us",
    "body": "¡Hola desde la API!",
    "type": "chat",
    "timestamp": 1699908249,
    "fromMe": true,
    "hasMedia": false,
    "contact": {
      "id": "5215551234567",
      "name": "Juan Pérez",
      "isMyContact": true
    },
    "chat": {
      "id": "5215551234567@c.us",
      "name": "Juan Pérez",
      "isGroup": false
    }
  },
  "messageId": "3EB0C767D26A1B2E3F4A5C6D"
}
```

### POST /api/messages/send/media

Enviar archivo (imagen, video, documento). Requiere autenticación.

**Request (multipart/form-data):**
- `to`: Número de teléfono destino
- `caption`: Texto opcional para acompañar el archivo
- `file`: Archivo a enviar

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/messages/send/media \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "to=5215551234567" \
  -F "caption=Mi imagen" \
  -F "file=@/ruta/a/imagen.jpg"
```

### GET /api/messages/history/:chatId

Obtener historial de mensajes de un chat. Requiere autenticación.

**Parámetros de URL:**
- `chatId`: ID del chat (ej: `5215551234567@c.us`)

**Query Parameters:**
- `limit`: Número de mensajes a obtener (default: 50)
- `offset`: Número de mensajes a omitir (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "3EB0C767D26A1B2E3F4A5C6D",
      "from": "5215551234567@c.us",
      "body": "Hola",
      "timestamp": 1699908249,
      "fromMe": false,
      "hasMedia": false
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### GET /api/messages/search

Buscar mensajes por texto. Requiere autenticación.

**Query Parameters:**
- `query`: Texto a buscar (requerido)
- `chatId`: ID del chat específico (opcional)
- `limit`: Número de resultados (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "3EB0C767D26A1B2E3F4A5C6D",
      "body": "Hola, ¿cómo estás?",
      "timestamp": 1699908249,
      "chat": {
        "id": "5215551234567@c.us",
        "name": "Juan Pérez"
      }
    }
  ],
  "query": "hola",
  "total": 1
}
```

### GET /api/messages/stats

Obtener estadísticas de mensajes. Requiere autenticación.

**Query Parameters:**
- `chatId`: ID del chat específico (opcional)
- `period`: Período de tiempo (`1h`, `24h`, `7d`, `30d`) (default: `24h`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "total": 45,
    "sent": 20,
    "received": 25,
    "mediaMessages": 8,
    "textMessages": 37
  }
}
```

### GET /api/messages/chats

Obtener chats activos con último mensaje. Requiere autenticación.

**Query Parameters:**
- `limit`: Número de chats a obtener (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "chatId": "5215551234567@c.us",
      "lastMessage": {
        "body": "Hola",
        "timestamp": 1699908249,
        "fromMe": false,
        "type": "chat"
      },
      "messageCount": 150,
      "unreadCount": 2,
      "contact": {
        "id": "5215551234567",
        "name": "Juan Pérez",
        "isMyContact": true
      }
    }
  ],
  "total": 1
}
```

## WebSocket Events

### Conexión

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'TU_TOKEN_JWT'
  }
});
```

### Eventos del servidor

#### whatsapp:qr
Se emite cuando se genera un nuevo código QR.

```javascript
socket.on('whatsapp:qr', (data) => {
  console.log('QR Code:', data.qrCode);
});
```

#### whatsapp:ready
Se emite cuando WhatsApp está listo para usar.

```javascript
socket.on('whatsapp:ready', (data) => {
  console.log('WhatsApp ready:', data.message);
});
```

#### whatsapp:message
Se emite cuando se recibe un nuevo mensaje.

```javascript
socket.on('whatsapp:message', (message) => {
  console.log('Nuevo mensaje:', message);
});
```

#### whatsapp:message_ack
Se emite cuando cambia el estado de un mensaje enviado.

```javascript
socket.on('whatsapp:message_ack', (data) => {
  console.log('Estado del mensaje:', data.messageId, data.ack);
});
```

### Eventos del cliente

#### join_chat
Unirse a una sala de chat específica.

```javascript
socket.emit('join_chat', 'chatId');
```

#### leave_chat
Salir de una sala de chat.

```javascript
socket.emit('leave_chat', 'chatId');
```

#### typing_start / typing_stop
Indicar que se está escribiendo.

```javascript
socket.emit('typing_start', 'chatId');
socket.emit('typing_stop', 'chatId');
```

## Códigos de Error

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

### Estructura de Error

```json
{
  "success": false,
  "error": "Tipo de error",
  "message": "Descripción detallada del error"
}
```

### Errores Comunes

#### Token inválido o expirado
```json
{
  "success": false,
  "error": "Token inválido",
  "message": "El token proporcionado no es válido o ha expirado"
}
```

#### WhatsApp no conectado
```json
{
  "success": false,
  "error": "WhatsApp no conectado",
  "message": "WhatsApp no está conectado"
}
```

#### Rate limit excedido
```json
{
  "success": false,
  "error": "Rate limit excedido",
  "message": "Demasiadas peticiones, intenta más tarde"
}
```

## Ejemplos de Respuesta

### Respuesta exitosa típica
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación completada exitosamente"
}
```

### Respuesta con paginación
```json
{
  "success": true,
  "data": [ ... ],
  "total": 150,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### Respuesta de error
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "El campo 'to' es obligatorio",
  "details": {
    "field": "to",
    "code": "REQUIRED"
  }
}
```

## Notas Importantes

1. **Formato de números**: Los números de teléfono deben incluir el código de país sin el signo `+`. Ejemplo: `5215551234567` para México.

2. **IDs de chat**: Los IDs de chat siempre terminan en `@c.us` para chats individuales y `@g.us` para grupos.

3. **Rate limiting**: La API tiene límites de velocidad configurados. Respeta los headers `X-RateLimit-*` en las respuestas.

4. **Archivos**: Los archivos subidos se eliminan automáticamente después de ser enviados por WhatsApp.

5. **Sesión**: La sesión de WhatsApp se mantiene entre reinicios del servidor usando `LocalAuth`.

6. **WebSocket**: Las conexiones WebSocket requieren autenticación JWT y se desconectan automáticamente si el token expira.
