const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VipOrder = sequelize.define('xn_vip_order', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  order_no: {
    type: DataTypes.STRING(32),
    unique: true,
    allowNull: false
  },
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  pay_type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '0-待支付 1-已支付 2-已取消'
  },
  pay_no: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  pay_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_vip_order',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_no'] },
    { fields: ['status'] },
    { fields: ['create_time'] }
  ]
});

module.exports = VipOrder;