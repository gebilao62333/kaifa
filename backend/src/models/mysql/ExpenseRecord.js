const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 支出流水表：记录用户所有的花费（送礼/置顶/解锁勋章/相册付费/通话/发红包等）
const ExpenseRecord = sequelize.define('xn_expense_record', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '支出归属用户'
  },
  source_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '支出来源: gift(礼物) / top(置顶帖子) / medal(解锁勋章) / album(相册付费查看) / call(语音视频通话) / redpacket(发红包) / vip(开通会员)'
  },
  source_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  bg_color: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '支出金额'
  },
  rel_id: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '关联业务ID(礼物日志/红包/相册解锁记录等)'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '支出说明'
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '支出时间(秒)'
  }
}, {
  tableName: 'xn_expense_record',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['source_type'] },
    { fields: ['create_time'] }
  ]
});

module.exports = ExpenseRecord;
