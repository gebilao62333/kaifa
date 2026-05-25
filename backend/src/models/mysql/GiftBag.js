const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const GiftBag = sequelize.define('xn_gift_bag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gift_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gift_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  gift_image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  num: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  is_use: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  end_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_gift_bag',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['gift_id'] },
    { fields: ['is_use'] }
  ]
});

module.exports = GiftBag;
