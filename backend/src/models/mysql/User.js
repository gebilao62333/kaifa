const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const User = sequelize.define('xn_user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(60),
    unique: true,
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING(16),
    unique: true,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  open_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  unionid: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  money: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  gift_money: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  gift_money_zong: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lv: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  exp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '当前等级内已积累的经验值'
  },
  last_check_in_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '最近一次每日签到时间戳（按自然日去重）'
  },
  level_backfill_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '历史经验回填完成时间戳，0 表示尚未回填'
  },
  vip: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  vip_lv: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  vip_expire_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: 'VIP到期时间戳'
  },
  sex: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT(1),
    // 1=正常 0=禁用（与 authMiddleware 及管理后台一致）
    defaultValue: 1
  },
  jinyan_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  is_dav: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  is_manage_normal: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  fans_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  last_login_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  ip: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  platform: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  dec: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  real_name: {
    // 审计 M-8：敏感个人信息静态加密存储（utils/pii.js，AES-256-GCM 密文为十六进制串，
    // 长度约 192 + 明文字节数×2），故列宽需容纳密文；存量明文行仍可读（读取侧按密文特征判定）。
    type: DataTypes.STRING(255),
    allowNull: true
  },
  id_card: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  real_name_front: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  real_name_back: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  real_name_status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '实名状态 0未认证 1审核中 2已认证 3已拒绝'
  },
  real_name_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_user',
  timestamps: false,
  // 审计 M-8：口令哈希默认不出现在任何查询结果里（防止顺手 res.json(user) 之类把哈希带出去）；
  // 仅认证链路上显式 User.scope('withPassword') 才取回（见 services/authService.js）。
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: { attributes: { include: ['password'] } }
  },
  indexes: [
    { fields: ['mobile'] },
    { fields: ['open_id'] },
    { fields: ['lv'] },
    { fields: ['create_time'] }
  ]
});

module.exports = User;
