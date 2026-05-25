const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const PostUnlock = sequelize.define('xn_post_unlock', {
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
  unlock_type: {
    type: DataTypes.TINYINT(1),
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_post_unlock',
  timestamps: false,
  indexes: [
    { fields: ['post_id', 'user_id'], unique: true },
    { fields: ['post_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = PostUnlock;
