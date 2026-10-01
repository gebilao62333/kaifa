const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Withdraw = sequelize.define('xn_withdraw', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  money: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'money'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  pay_money: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'pay_money'
  },
  shouxufei: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'shouxufei'
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    field: 'type'
  },
  account: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bank: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'bank'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'name'
  },
  mobile: {
    type: DataTypes.STRING(16),
    allowNull: true,
    field: 'mobile'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'image'
  },
  is_check: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    field: 'is_check'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  state: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'state'
  },
  wx_ti_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'wx_ti_id'
  },
  lailu: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'lailu'
  },
  channel: {
    type: DataTypes.STRING(20),
    defaultValue: 'gift',
    field: 'channel'
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'currency'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  handle_admin_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  handle_time: {
    type: DataTypes.INTEGER(10),
    allowNull: true
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
