const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualChatHistory = sequelize.define('virtual_chat_history', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  virtualUserId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '虚拟用户ID'
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '真实用户ID'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '角色：user/assistant/system'
  },
  contextId: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '上下文会话ID'
  },
  createTime: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'virtual_chat_history',
  timestamps: false,
  indexes: [
    { fields: ['virtualUserId'] },
    { fields: ['userId'] },
    { fields: ['contextId'] },
    { fields: ['createTime'] }
  ]
});

module.exports = VirtualChatHistory;
