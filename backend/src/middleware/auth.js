// -------------------------------------------------------------------
// Middleware para proteger rutas que requieren login
// -------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'No autenticado' });
}

// -------------------------------------------------------------------
// Middleware para proteger rutas según rol
// Ejemplo: requireRole('admin', 'gerente')
// -------------------------------------------------------------------
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.session.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta accion' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };