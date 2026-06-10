const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Setting = sequelize.define('xn_setting', {
  setting_key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
    comment: '设置键'
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '设置值（JSON字符串）'
  }
}, {
  tableName: 'xn_setting',
  timestamps: false
});

module.exports = Setting;
