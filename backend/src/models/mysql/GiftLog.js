const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const GiftLog = sequelize.define('xn_gift_log', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  user_avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  song_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  song_user_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  song_user_avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gift_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gift_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  gift_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gift_num: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalmoney: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_gift_log',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['song_user_id'] },
    { fields: ['create_time'] }
  ]
});

module.exports = GiftLog;
