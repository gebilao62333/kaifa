const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 收入流水表：所有收入先入账，再组成"总资产"，最后才能提现
const IncomeRecord = sequelize.define('xn_income_record', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '收入归属用户'
  },
  source_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '收入来源: order(接单) / voice(语音聊天) / video(视频聊天) / redpacket(红包) / gift(礼物) / invite(邀请返现) / album(相册付费查看)'
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
    comment: '收入金额'
  },
  rel_id: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '关联业务ID(订单/礼物日志/红包/相册解锁记录等)'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '收入说明'
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '入账时间(秒)'
  }
}, {
  tableName: 'xn_income_record',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['source_type'] },
    { fields: ['create_time'] }
  ]
});

module.exports = IncomeRecord;
