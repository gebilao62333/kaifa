const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const SplashScreen = sequelize.define('xn_splash_screen', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '标题'
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '弹窗图片URL'
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '点击跳转链接'
  },
  frequency: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '展示频率: 1-每次打开 2-每天一次 3-每周一次 4-仅一次'
  },
  start_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '开始展示时间（Unix时间戳）'
  },
  end_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '结束展示时间（Unix时间戳）'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序（数字越大越靠前）'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '状态: 0-禁用 1-启用'
  },
  created_at: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_splash_screen',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort'] },
    { fields: ['frequency'] }
  ]
});

module.exports = SplashScreen;
