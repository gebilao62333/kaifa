const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const OrderChong = sequelize.define('xn_order_chong', {
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
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  coins: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pay_type: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  pay_time: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  create_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  update_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'xn_order_chong',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_no'] },
    { fields: ['status'] }
  ]
});

// 关联下单用户：供充值记录列表 include user 使用
const User = require('./User');
OrderChong.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

module.exports = OrderChong;
