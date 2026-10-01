const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualChatHistory = sequelize.define('xn_virtual_chat_history', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  virtual_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '虚拟用户ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false,
    comment: '真实用户ID，0-未知/历史数据'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '内容'
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '消息类型：0-文本，1-图片，2-语音'
  },
  sender: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '发送方：0-用户，1-虚拟人'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_virtual_chat_history',
  timestamps: false,
  indexes: [
    { fields: ['virtual_user_id'] },
    { fields: ['user_id'] },
    { fields: ['virtual_user_id', 'user_id'] },
    { fields: ['create_time'] }
  ]
});

module.exports = VirtualChatHistory;
