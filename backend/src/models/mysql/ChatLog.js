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
  toid: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  // 时间自动撤回：到期的绝对时间戳（秒），0 = 不自动撤回。
  // 撤回事实以服务端为准（读侧按它兜底 + 清理器落库），不依赖客户端定时器。
  expire_at: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  // 已读自动销毁：read_at=首次被读时间；destroy_at=销毁时间（read_at + 发送方期限）；
  // destroyed_at=实际落库销毁时间（审计用）。三列 0 表示未发生。
  read_at: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  destroy_at: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  destroyed_at: {
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
    { fields: ['is_revoked'] },
    { fields: ['is_revoked', 'expire_at'] },
    { fields: ['is_del', 'destroy_at'] }
  ]
});

module.exports = ChatLog;
