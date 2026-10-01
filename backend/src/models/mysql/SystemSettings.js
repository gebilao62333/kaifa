const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const SystemSettings = sequelize.define('xn_system_settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  group: {
    type: DataTypes.STRING(32),
    allowNull: true,
    defaultValue: 'general'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'xn_system_settings',
  timestamps: false,
  indexes: [
    { fields: ['key'], unique: true },
    { fields: ['group'] }
  ]
});

module.exports = SystemSettings;
