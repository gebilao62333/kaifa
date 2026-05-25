const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const ChatLog = sequelize.define('xn_chat_log', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  fromid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fromname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  toid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  toname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  vod_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sec: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  time: {
    type: DataTypes.INTEGER(10),
    allowNull: false
  },
  isread: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  is_del: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_revoked: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  revoke_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_chat_log',
  timestamps: false,
  indexes: [
    { fields: ['fromid', 'toid'] },
    { fields: ['time'] },
    { fields: ['toid', 'isread'] },
    { fields: ['is_revoked', 'revoke_time'] }
  ]
});

module.exports = ChatLog;
