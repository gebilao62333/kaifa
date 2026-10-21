const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const CompanionProfile = sequelize.define('xn_companion_profile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  game_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tags: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  voice_intro: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  voice_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  service_type: {
    type: DataTypes.STRING(16),
    allowNull: true,
    defaultValue: 'online',
    comment: '服务类型 online/offline'
  },
  // P1-9：入驻表单收集的 5 个资料字段（迁移 20261021120000_add_companion_apply_fields）
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '入驻填写的所在城市'
  },
  skill_level: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '技能等级'
  },
  zone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '接单大区'
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '擅长位置'
  },
  play_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '陪玩类型'
  },
  order_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  income_total: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  pingjia_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  star: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.00
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  update_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  // P1-9 入驻资料扩展字段
  city: { type: DataTypes.STRING(50), allowNull: true },
  skill_level: { type: DataTypes.STRING(20), allowNull: true },
  zone: { type: DataTypes.STRING(50), allowNull: true },
  position: { type: DataTypes.STRING(50), allowNull: true },
  play_type: { type: DataTypes.STRING(20), allowNull: true },
  // 管理端审核结果
  approve_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
  reject_reason: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'xn_companion_profile',
  timestamps: false,
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['game_id', 'status'] },
    { fields: ['price'] }
  ]
});

const User = require('./User');
CompanionProfile.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

module.exports = CompanionProfile;
