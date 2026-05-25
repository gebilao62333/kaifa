const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Reserve = sequelize.define('xn_reserve', {
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
  },
  update_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_reserve',
  timestamps: false,
  indexes: [
    { fields: ['user_id', 'status'] },
    { fields: ['target_user_id', 'reserve_date'] },
    { fields: ['reserve_date'] },
    { fields: ['status'] }
  ]
});

module.exports = Reserve;
