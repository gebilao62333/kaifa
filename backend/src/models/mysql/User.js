const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const User = sequelize.define('xn_user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(60),
    unique: true,
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING(16),
    unique: true,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  open_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  unionid: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  money: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  gift_money: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  gift_money_zong: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lv: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  vip: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  vip_lv: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  vip_expire_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: 'VIP到期时间戳'
  },
  sex: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  jinyan_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  is_dav: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  is_manage_normal: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  fans_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  last_login_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  ip: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  platform: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  dec: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'xn_user',
  timestamps: false,
  indexes: [
    { fields: ['mobile'] },
    { fields: ['open_id'] },
    { fields: ['lv'] },
    { fields: ['create_time'] }
  ]
});

module.exports = User;
