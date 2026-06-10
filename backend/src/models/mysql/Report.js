const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Report = sequelize.define('xn_report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reporter_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  reporter_avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  target_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  target_user_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  target_user_avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  target_type: {
    type: DataTypes.TINYINT(1),
    allowNull: false
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  target_content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  images: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  handle_result: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reject_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  handle_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  handler_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  handler_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_report',
  timestamps: false,
  indexes: [
    { fields: ['target_type', 'target_id'] },
    { fields: ['status', 'create_time'] },
    { fields: ['user_id'] }
  ]
});

module.exports = Report;
