const sequelize = require('../config/database');
const Categoria = require('./Categoria');
const Producto  = require('./Producto');
const Cliente   = require('./Cliente');
const Empleado  = require('./Empleado');
const Usuario   = require('./Usuario');

Producto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });
Categoria.hasMany(Producto,   { foreignKey: 'id_categoria', as: 'productos' });

module.exports = { sequelize, Categoria, Producto, Cliente, Empleado, Usuario };
