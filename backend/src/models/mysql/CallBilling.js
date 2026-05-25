const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const CallBilling = sequelize.define('xn_call_billing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  call_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  companion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  settle_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_call_billing',
  timestamps: false,
  indexes: [
    { fields: ['call_id'], unique: true },
    { fields: ['user_id', 'create_time'] },
    { fields: ['companion_id'] },
    { fields: ['status'] }
  ]
});

module.exports = CallBilling;
