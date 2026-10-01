const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const UserVisit = sequelize.define('xn_user_visit', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '被访问者ID'
  },
  visitor_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '访问者ID'
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_user_visit',
  timestamps: false,
  indexes: [
    { fields: ['user_id', 'visitor_id'], unique: true },
    { fields: ['user_id', 'create_time'] }
  ]
});

module.exports = UserVisit;
