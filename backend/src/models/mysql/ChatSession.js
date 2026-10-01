const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 聊天会话表（真实表结构）：user_id(用户) <-> virtual_user_id(虚拟用户) 的一对一会话
const ChatSession = sequelize.define('chat_session', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  virtual_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  last_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_message_time: {
    type: DataTypes.INTEGER(10),
    allowNull: true
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'xn_chat_room',
  timestamps: false,
  indexes: [
    { fields: ['user_id', 'virtual_user_id'] },
    { fields: ['update_time'] }
  ]
});

module.exports = ChatSession;
