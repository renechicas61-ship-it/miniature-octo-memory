const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de acceso requerido',
      message: 'Debe proporcionar un token de autorización válido'
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido o ha expirado'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware opcional para verificar JWT (no falla si no hay token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Generar token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Verificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken
};
