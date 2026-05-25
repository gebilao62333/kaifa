const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Withdraw = sequelize.define('xn_withdraw', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
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

module.exports = Withdraw;
