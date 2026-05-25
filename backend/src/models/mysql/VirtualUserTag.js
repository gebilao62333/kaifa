const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUserTag = sequelize.define('virtual_user_tag', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: '标签名称'
  },
  code: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
    comment: '标签代码'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '标签描述'
  },
  category: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: '标签分类：personality/personality/skill/style'
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '标签图标'
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '标签颜色'
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '性格特征（JSON格式）'
  },
  expertise: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '专业领域（JSON格式数组）'
  },
  communicationStyle: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '沟通风格：friendly/professional/humorous/cute/formal'
  },
  knowledgeScope: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '知识范围（JSON格式数组）'
  },
  responseStrategy: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '响应策略配置（JSON格式）'
  },
  promptTemplate: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '系统提示词模板'
  },
  temperature: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.7,
    comment: '默认温度参数'
  },
  maxTokens: {
    type: DataTypes.INTEGER,
    defaultValue: 1024,
    comment: '默认最大token数'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '优先级（用于推荐排序）'
  },
  isDefault: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '是否为默认标签'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
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
  tableName: 'virtual_user_tag',
  timestamps: false,
  indexes: [
    { fields: ['code'] },
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['isDefault'] }
  ]
});

module.exports = VirtualUserTag;
