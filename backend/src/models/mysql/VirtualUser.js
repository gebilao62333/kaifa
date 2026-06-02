const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUser = sequelize.define('xn_virtual_user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gender: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  age: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  region: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  intro: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price_per_hour: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  online_status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  is_recommend: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
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
  tableName: 'xn_virtual_user',
  timestamps: false,
  indexes: [
    { fields: ['online_status'] },
    { fields: ['is_recommend'] }
  ]
});

module.exports = VirtualUser;
