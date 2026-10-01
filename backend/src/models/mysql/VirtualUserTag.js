const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUserTag = sequelize.define('xn_virtual_user_tag', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '标签名称'
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '标签图标'
  },
  category: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: '标签分类 personality/expertise/style/scenario'
  },
  is_default: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '是否默认标签：0-否，1-是'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用'
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
  tableName: 'xn_virtual_user_tag',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort_order'] }
  ]
});

module.exports = VirtualUserTag;
