const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  id_producto: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  codigo: {
    type:      DataTypes.STRING(30),
    allowNull: false,
    unique:    true,
  },
  nombre: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  descripcion: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  precio_venta: {
    type:      DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stock: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
  },
  stock_minimo: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
  },
  activo: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  id_categoria: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName:  'producto',
  timestamps: false,
});

module.exports = Producto;
