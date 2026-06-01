const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Empleado = sequelize.define('Empleado', {
  id_empleado: {
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
  dpi: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    unique:    true,
  },
  telefono: {
    type:      DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
  puesto: {
    type:      DataTypes.STRING(50),
    allowNull: false,
  },
  fecha_contratacion: {
    type:         DataTypes.DATEONLY,
    allowNull:    false,
    defaultValue: DataTypes.NOW,
  },
  salario: {
    type:      DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  activo: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
}, {
  tableName:  'empleado',
  timestamps: false,
});

module.exports = Empleado;
