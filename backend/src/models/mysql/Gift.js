const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Gift = sequelize.define('xn_gift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  svga: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  money: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  is_vip: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  tian: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'xn_gift',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort'] },
    { fields: ['type'] }
  ]
});

module.exports = Gift;
