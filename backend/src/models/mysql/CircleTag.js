const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const CircleTag = sequelize.define('circle_tag', {
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
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用'
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
  tableName: 'xn_circle_tag',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort_order'] }
  ]
});

module.exports = CircleTag;
