const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Recommend = sequelize.define('xn_recommend', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  recommend_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'home',
    comment: 'home=首页推荐, square=广场推荐'
  },
  start_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '推荐开始时间（Unix秒）'
  },
  end_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    comment: '推荐结束时间（Unix秒）'
  },
  is_top: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,
    comment: '1=进行中, 0=已过期'
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
  tableName: 'xn_recommend',
  timestamps: false,
  indexes: [
    { fields: ['recommend_type'] },
    { fields: ['status'] },
    { fields: ['user_id'] }
  ]
});

module.exports = Recommend;
