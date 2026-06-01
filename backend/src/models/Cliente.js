const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id_cliente: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  nombre: {
    type:      DataTypes.STRING(50),
    allowNull: false,
  },
  apellido: {
    type:      DataTypes.STRING(50),
    allowNull: false,
  },
  nit: {
    type:      DataTypes.STRING(20),
    allowNull: true,
  },
  telefono: {
    type:      DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName:  'cliente',
  timestamps: false,
});

module.exports = Cliente;
