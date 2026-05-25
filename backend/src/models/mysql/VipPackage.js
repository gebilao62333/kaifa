const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VipPackage = sequelize.define('xn_vip_package', {
  id: {
    type: DataTypes.INTEGER,
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
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '有效期天数'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'VIP等级'
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
  }
}, {
  tableName: 'xn_vip_package',
  timestamps: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['sort'] }
  ]
});

module.exports = VipPackage;