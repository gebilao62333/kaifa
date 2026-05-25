const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUserTagRelation = sequelize.define('virtual_user_tag_relation', {
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
  tagId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '标签ID'
  },
  isPrimary: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '是否为主要标签'
  },
  customConfig: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '自定义配置（JSON格式，可覆盖标签默认配置）'
  },
  createTime: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'virtual_user_tag_relation',
  timestamps: false,
  indexes: [
    { fields: ['virtualUserId'] },
    { fields: ['tagId'] },
    { fields: ['virtualUserId', 'tagId'], unique: true }
  ]
});

module.exports = VirtualUserTagRelation;
