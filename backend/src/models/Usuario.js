const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Empleado = require('./Empleado');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  username: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    unique:    true,
  },
  password_hash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type:         DataTypes.STRING(20),
    allowNull:    false,
    defaultValue: 'vendedor',
  },
  id_empleado: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    unique:    true,
  },
  activo: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
}, {
  tableName:  'usuario',
  timestamps: false,
});

Usuario.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });
Empleado.hasOne(Usuario,    { foreignKey: 'id_empleado', as: 'usuario' });

module.exports = Usuario;
