const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Withdraw = sequelize.define('xn_withdraw', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  money: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  pay_money: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shouxufei: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  bank: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING(16),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_check: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  state: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  wx_ti_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lailu: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  channel: {
    type: DataTypes.STRING(20),
    defaultValue: 'gift',
    comment: '提现渠道: gift(礼物金币) / wallet(钱包总资产)'
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'xn_withdraw',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_check'] },
    { fields: ['create_time'] }
  ]
});

const User = require('./User');
Withdraw.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

module.exports = Withdraw;
