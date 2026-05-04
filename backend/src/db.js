const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'db',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 10,                       // máximo de conexiones simultáneas
  idleTimeoutMillis: 30000,      // cierra conexiones inactivas tras 30s
  connectionTimeoutMillis: 5000, // falla si no conecta en 5s
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

// Helper para queries simples
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('[SQL]', { text, duration: `${duration}ms`, rows: res.rowCount });
  return res;
}

// Helper para transacciones (lo usaremos en el commit 7)
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };