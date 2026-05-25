const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Admin = sequelize.define('xn_admin', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(60),
    unique: true,
    allowNull: false,
    comment: '管理员用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密）'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱'
  },
  phone: {
    type: DataTypes.STRING(16),
    allowNull: true,
    comment: '手机号'
  },
  role_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: '角色ID'
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
  last_login_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '最后登录时间'
  },
  last_login_ip: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: '最后登录IP'
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
  tableName: 'xn_admin',
  timestamps: false,
  indexes: [
    { fields: ['username'] },
    { fields: ['role_id'] },
    { fields: ['status'] },
    { fields: ['create_time'] }
  ]
});

module.exports = Admin;
