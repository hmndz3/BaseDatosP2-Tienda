const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host:    process.env.DB_HOST || 'db',
    port:    process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (sql) => console.log('[ORM]', sql),
    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000,
    },
  }
);

module.exports = sequelize;
