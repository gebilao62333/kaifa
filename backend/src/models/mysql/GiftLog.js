const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const GiftLog = sequelize.define('xn_gift_log', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  user_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'user_nickname'
  },
  user_avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'user_avatar'
  },
  song_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'song_user_id'
  },
  song_user_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'song_user_nickname'
  },
  song_user_avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'song_user_avatar'
  },
  gift_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  gift_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'gift_name'
  },
  gift_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'gift_image'
  },
  gift_num: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'gift_num'
  },
  totalmoney: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'totalmoney'
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'currency'
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
