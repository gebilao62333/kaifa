const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const UserFollow = sequelize.define('xn_user_follow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  target_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_user_follow',
  timestamps: false,
  indexes: [
    { fields: ['user_id', 'target_user_id'], unique: true },
    { fields: ['target_user_id'] }
  ]
});

module.exports = UserFollow;
