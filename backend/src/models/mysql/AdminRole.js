const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const AdminRole = sequelize.define('xn_admin_role', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(60),
    unique: true,
    allowNull: false,
    comment: '角色名称'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '角色描述'
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '权限列表（JSON字符串）'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '状态：0禁用 1正常'
  },
  is_super: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '是否超级管理员：0否 1是'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '创建时间'
  },
  create_admin_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '创建者ID'
  }
}, {
  tableName: 'xn_admin_role',
  timestamps: false,
  indexes: [
    { fields: ['name'] },
    { fields: ['status'] },
    { fields: ['sort'] },
    { fields: ['create_time'] }
  ]
});

module.exports = AdminRole;
