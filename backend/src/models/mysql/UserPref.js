const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 用户偏好/装扮数据：以 JSON 存放（已购与在用的头像框/标识/气泡/主题、隐身与优先匹配等设置）
const UserPref = sequelize.define('xn_user_pref', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  update_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_user_pref',
  timestamps: false,
  indexes: [
    { fields: ['user_id'], unique: true }
  ]
});

module.exports = UserPref;
