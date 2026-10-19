const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUser = sequelize.define('xn_virtual_user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '姓名'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '头像'
  },
  gender: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '性别：0-保密，1-男，2-女'
  },
  age: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '年龄'
  },
  region: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '地区'
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '标签（逗号分隔或JSON）'
  },
  intro: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '简介'
  },
  price_per_hour: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '每小时价格'
  },
  online_status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '在线状态：0-离线，1-在线'
  },
  random_online: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '随机在线开关：0-关闭（手动管理在线状态），1-开启（按在线时段与时长随机上下线）'
  },
  online_time_start: {
    type: DataTypes.STRING(5),
    defaultValue: '09:00',
    comment: '允许在线时段开始（HH:mm）'
  },
  online_time_end: {
    type: DataTypes.STRING(5),
    defaultValue: '23:00',
    comment: '允许在线时段结束（HH:mm），可跨天如 22:00-02:00'
  },
  online_duration_min: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: '每次随机在线最短时长（分钟）'
  },
  online_duration_max: {
    type: DataTypes.INTEGER,
    defaultValue: 90,
    comment: '每次随机在线最长时长（分钟）'
  },
  online_until: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '本次在线到期时间戳，0-未设置'
  },
  is_recommend: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '是否推荐：0-否，1-是'
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
  tableName: 'xn_virtual_user',
  timestamps: false,
  indexes: [
    { fields: ['online_status'] },
    { fields: ['is_recommend'] },
    { fields: ['status'] }
  ]
});

module.exports = VirtualUser;
