require('dotenv').config();
const app = require('./app');

const PORT = process.env.BACKEND_PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Stats:  http://localhost:${PORT}/api/stats`);
});

// Apagado limpio
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => process.exit(0));
});