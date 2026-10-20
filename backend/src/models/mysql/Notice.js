const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 平台公告（B-3）：GET /api/notice/list 的数据源，后台 /api/admin/notices 维护。
const Notice = sequelize.define('xn_notice', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'notice'
  },
  status: {
    // 1=已发布（C 端可见） 0=已下线
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  pinned: {
    // 1=置顶（C 端排序优先）
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  start_time: {
    // 0=立即生效；否则为生效时间戳（秒）
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  end_time: {
    // 0=长期有效；否则为失效时间戳（秒）
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  creator_id: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
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
  tableName: 'xn_notice',
  timestamps: false,
  indexes: [
    { fields: ['status', 'start_time', 'end_time'] },
    { fields: ['pinned', 'create_time'] }
  ]
});

module.exports = Notice;
