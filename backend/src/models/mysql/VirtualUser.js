const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUser = sequelize.define('virtual_user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(60),
    unique: true,
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(30),
    defaultValue: 'default',
    comment: '角色设定：default/companion/guide/assistant'
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '性格描述'
  },
  dialogueStyle: {
    type: DataTypes.STRING(50),
    defaultValue: 'friendly',
    comment: '对话风格：friendly/professional/humorous/cute'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '角色描述'
  },
  modelConfig: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '大模型配置（JSON格式）'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用'
  },
  isOnline: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '在线状态：0-离线，1-在线'
  },
  contextExpireTime: {
    type: DataTypes.INTEGER(10),
    defaultValue: 3600,
    comment: '上下文过期时间（秒）'
  },
  maxContextLength: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: '最大上下文消息数'
  },
  permissions: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    comment: '权限列表（JSON格式）'
  },
  createTime: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  updateTime: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'virtual_user',
  timestamps: false,
  indexes: [
    { fields: ['username'] },
    { fields: ['status'] },
    { fields: ['isOnline'] },
    { fields: ['createTime'] }
  ]
});

module.exports = VirtualUser;
