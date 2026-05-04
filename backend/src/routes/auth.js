const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// -----------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validacion basica
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    // Buscar usuario activo con datos del empleado (JOIN explicito)
    const result = await query(
      `SELECT u.id_usuario, u.username, u.password_hash, u.rol, u.activo,
              e.id_empleado, e.nombre, e.apellido
         FROM usuario u
         INNER JOIN empleado e ON u.id_empleado = e.id_empleado
        WHERE u.username = $1 AND u.activo = TRUE`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const usuario = result.rows[0];

    // Comparar password con hash
    const passwordOk = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    // Guardar usuario en la sesion (sin el hash de la contraseña)
    req.session.user = {
      id_usuario:  usuario.id_usuario,
      username:    usuario.username,
      rol:         usuario.rol,
      id_empleado: usuario.id_empleado,
      nombre:      usuario.nombre,
      apellido:    usuario.apellido,
    };

    res.json({
      message: 'Login exitoso',
      user: req.session.user,
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
});

// -----------------------------------------------------------------
// POST /api/auth/logout
// -----------------------------------------------------------------
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesion:', err);
      return res.status(500).json({ error: 'Error al cerrar sesion' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesion cerrada' });
  });
});

// -----------------------------------------------------------------
// GET /api/auth/me - quien soy?
// -----------------------------------------------------------------
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

module.exports = router;