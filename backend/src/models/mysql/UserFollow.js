const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const UserFollow = sequelize.define('xn_user_follow', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  follower_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'follower_id'
  },
  following_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'following_id'
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_user_follow',
  timestamps: false,
  indexes: [
    { fields: ['follower_id', 'following_id'], unique: true },
    { fields: ['following_id'] }
  ]
});

module.exports = UserFollow;
