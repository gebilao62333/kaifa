const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Card = sequelize.define('xn_card', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  card_no: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  card_password: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  // 25 位充值密钥 —— 卡密充值（无需卡号密码）使用，必须全局唯一
  card_key: {
    type: DataTypes.STRING(25),
    allowNull: true,
    comment: '25位充值密钥'
  },
  type: {
    type: DataTypes.TINYINT(1),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  coin_amount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '金币数'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  use_user_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  use_time: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  admin_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '负责管理员ID'
  },
  admin_name: {
    type: DataTypes.STRING(60),
    allowNull: true,
    comment: '负责管理员名称'
  },
  create_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'xn_card',
  timestamps: false,
  indexes: [
    { fields: ['card_no'] },
    { fields: ['card_key'] },
    { fields: ['status'] }
  ]
});

module.exports = Card;
