const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Post = sequelize.define('xn_post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  videos: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  thumb_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comment_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  share_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tag_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  is_private: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  private_password: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  private_price: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_post',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['tag_id', 'create_time'] },
    { fields: ['create_time'] },
    { fields: ['status'] }
  ]
});

module.exports = Post;
