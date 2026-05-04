const express = require('express');
const cors = require('cors');
const { query } = require('./db');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Logging básico de cada request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// -----------------------------------------------------------------
// Endpoint de health check: verifica que la BD responde
// -----------------------------------------------------------------
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
    console.error('Health check falló:', err);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
    });
  }
});

// -----------------------------------------------------------------
// Endpoint de prueba: cuenta registros en las tablas principales
// -----------------------------------------------------------------
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
    res.status(500).json({ error: 'Error al consultar estadísticas' });
  }
});

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;