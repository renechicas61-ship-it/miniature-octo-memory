const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// En producción, esto debería estar en una base de datos
const users = new Map();

// Usuario por defecto para pruebas
users.set('admin', {
  id: 'admin',
  username: 'admin',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  name: 'Administrador',
  role: 'admin',
  createdAt: new Date()
});

class AuthController {
  // Iniciar sesión
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Credenciales requeridas',
          message: 'Username y password son obligatorios'
        });
      }

      // Buscar usuario
      const user = users.get(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Usuario o contraseña incorrectos'
        });
      }

      // Generar token
      const token = generateToken({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      });

      // Actualizar último login
      user.lastLogin = new Date();

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            lastLogin: user.lastLogin
          }
        }
      });

    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // Registrar nuevo usuario
  async register(req, res) {
    try {
      const { username, password, name, role = 'user' } = req.body;

      if (!username || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Datos requeridos',
          message: 'Username, password y name son obligatorios'
        });
      }

      // Verificar si el usuario ya existe
      if (users.has(username)) {
        return res.status(409).json({
          success: false,
          error: 'Usuario existente',
          message: 'El username ya está en uso'
        });
      }

      // Validar contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Contraseña débil',
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = {
        id: username, // En producción usar UUID
        username,
        password: hashedPassword,
        name,
        role,
        createdAt: new Date(),
        lastLogin: null
      };

      users.set(username, newUser);

      // Generar token
      const token = generateToken({
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            createdAt: newUser.createdAt
          }
        }
      });

    } catch (error) {
      console.error('❌ Error en registro:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // Obtener perfil del usuario actual
  async getProfile(req, res) {
    try {
      const user = users.get(req.user.username);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          message: 'El usuario no existe'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      });

    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // Actualizar perfil
  async updateProfile(req, res) {
    try {
      const { name, currentPassword, newPassword } = req.body;
      const user = users.get(req.user.username);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          message: 'El usuario no existe'
        });
      }

      // Si se quiere cambiar la contraseña
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            error: 'Contraseña actual requerida',
            message: 'Debe proporcionar la contraseña actual para cambiarla'
          });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            error: 'Contraseña incorrecta',
            message: 'La contraseña actual es incorrecta'
          });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            error: 'Contraseña débil',
            message: 'La nueva contraseña debe tener al menos 6 caracteres'
          });
        }

        user.password = await bcrypt.hash(newPassword, 10);
      }

      // Actualizar nombre si se proporciona
      if (name) {
        user.name = name;
      }

      user.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // Cerrar sesión (invalidar token - en producción usar blacklist)
  async logout(req, res) {
    try {
      // En una implementación real, aquí se agregaría el token a una blacklist
      // o se invalidaría en la base de datos
      
      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en logout:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }

  // Listar usuarios (solo admin)
  async getUsers(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado',
          message: 'Solo los administradores pueden ver la lista de usuarios'
        });
      }

      const userList = Array.from(users.values()).map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }));

      res.json({
        success: true,
        data: userList,
        total: userList.length
      });

    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
