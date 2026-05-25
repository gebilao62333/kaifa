const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const PostComment = sequelize.define('xn_post_comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reply_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reply_user_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_post_comment',
  timestamps: false,
  indexes: [
    { fields: ['post_id'] },
    { fields: ['user_id'] },
    { fields: ['reply_id'] }
  ]
});

module.exports = PostComment;
