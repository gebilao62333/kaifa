const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const OrderChong = sequelize.define('xn_order_chong', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  order_no: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  pay_no: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  money: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  money_zeng: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  pay_type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  pay_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_order_chong',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_no'] },
    { fields: ['pay_no'] },
    { fields: ['status'] }
  ]
});

module.exports = OrderChong;
