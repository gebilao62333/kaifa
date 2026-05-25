const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Banner = sequelize.define('xn_banner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_banner',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort'] },
    { fields: ['type'] }
  ]
});

module.exports = Banner;
