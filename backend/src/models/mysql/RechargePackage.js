const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const RechargePackage = sequelize.define('xn_recharge_package', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  coins: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bonus_coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  hot: {
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
  },
  update_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_recharge_package',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort'] }
  ]
});

module.exports = RechargePackage;
