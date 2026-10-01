const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 用户意见反馈表
const Feedback = sequelize.define('xn_feedback', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false, comment: '提交用户ID' },
  type: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'other', comment: '反馈类型 bug/suggestion/complaint/other' },
  content: { type: DataTypes.TEXT, allowNull: false, comment: '反馈内容' },
  images: { type: DataTypes.TEXT, allowNull: true, comment: '截图URL，逗号分隔' },
  contact: { type: DataTypes.STRING(64), allowNull: true, comment: '联系方式' },
  status: { type: DataTypes.TINYINT(1), defaultValue: 0, comment: '状态 0-处理中 1-已处理 2-已关闭' },
  reply: { type: DataTypes.TEXT, allowNull: true, comment: '管理员回复' },
  create_time: { type: DataTypes.INTEGER(10), defaultValue: () => Math.floor(Date.now() / 1000), comment: '创建时间' },
  update_time: { type: DataTypes.INTEGER(10), defaultValue: 0, comment: '更新时间' }
}, {
  tableName: 'xn_feedback',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['create_time'] }
  ]
});

module.exports = Feedback;
