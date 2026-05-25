const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Game = sequelize.define('xn_game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image_bg: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_game',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort'] }
  ]
});

module.exports = Game;
