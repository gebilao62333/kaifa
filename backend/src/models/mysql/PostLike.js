const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const PostLike = sequelize.define('xn_post_like', {
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
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_post_like',
  timestamps: false,
  indexes: [
    { fields: ['post_id', 'user_id'], unique: true },
    { fields: ['post_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = PostLike;
