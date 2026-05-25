const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const ReserveSlot = sequelize.define('xn_reserve_slot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reserve_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reserve_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_reserve_slot',
  timestamps: false,
  indexes: [
    { fields: ['user_id', 'reserve_date', 'reserve_time'], unique: true },
    { fields: ['user_id'] },
    { fields: ['reserve_date'] }
  ]
});

module.exports = ReserveSlot;
