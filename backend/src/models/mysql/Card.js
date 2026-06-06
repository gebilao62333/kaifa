const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Card = sequelize.define('xn_card', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_no: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  card_pwd: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  face_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  coin_amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  use_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  use_user_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expire_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: '',
    comment: '分类：vip/newbie/activity/general'
  },
  tag: {
    type: DataTypes.STRING(100),
    defaultValue: '',
    comment: '标签，逗号分隔'
  },
  batch_no: {
    type: DataTypes.STRING(64),
    defaultValue: '',
    comment: '批次号'
  },
  remark: {
    type: DataTypes.STRING(255),
    defaultValue: '',
    comment: '备注'
  }
}, {
  tableName: 'xn_card',
  timestamps: false,
  indexes: [
    { fields: ['card_no'], unique: true },
    { fields: ['status'] },
    { fields: ['category'] },
    { fields: ['batch_no'] }
  ]
});

module.exports = Card;
