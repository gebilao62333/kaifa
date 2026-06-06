const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const CustomerService = sequelize.define('xn_customer_service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'normal'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  online: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  update_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_customer_service',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] }
  ]
});

module.exports = CustomerService;
