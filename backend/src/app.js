const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool, query } = require('./db');
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const app = express();

// -----------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------
app.use(cors({
  origin: true,        // permite cualquier origen en desarrollo
  credentials: true,   // necesario para cookies de sesion
}));
app.use(express.json());

// Configuracion de sesiones (persistidas en PostgreSQL)
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET || 'cambiar-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,                  // true solo si usas HTTPS
    maxAge: 1000 * 60 * 60 * 8,     // 8 horas
  },
}));

// Logging
app.use((req, res, next) => {
  const userInfo = req.session?.user ? `[${req.session.user.username}]` : '[anon]';
  console.log(`[${new Date().toISOString()}] ${userInfo} ${req.method} ${req.path}`);
  next();
});

// -----------------------------------------------------------------
// Rutas
// -----------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);

// Health check (publico)
app.get('/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW() AS server_time, version() AS pg_version');
    res.json({
      status: 'ok',
      database: 'connected',
      server_time: result.rows[0].server_time,
      pg_version: result.rows[0].pg_version,
    });
  } catch (err) {
    console.error('Health check fallo:', err);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
    });
  }
});

// Stats (publico, lo dejamos abierto para monitoreo)
app.get('/api/stats', async (req, res) => {
  try {
    const result = await query(`
      SELECT 'categoria'  AS tabla, COUNT(*)::int AS total FROM categoria
      UNION ALL SELECT 'producto',  COUNT(*)::int FROM producto
      UNION ALL SELECT 'cliente',   COUNT(*)::int FROM cliente
      UNION ALL SELECT 'empleado',  COUNT(*)::int FROM empleado
      UNION ALL SELECT 'venta',     COUNT(*)::int FROM venta
      UNION ALL SELECT 'compra',    COUNT(*)::int FROM compra
      ORDER BY tabla
    `);
    res.json({ stats: result.rows });
  } catch (err) {
    console.error('Error en /api/stats:', err);
    res.status(500).json({ error: 'Error al consultar estadisticas' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;