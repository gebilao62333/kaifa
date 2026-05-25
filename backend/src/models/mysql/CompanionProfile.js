const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const CompanionProfile = sequelize.define('xn_companion_profile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  game_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tags: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  voice_intro: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  voice_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  order_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  income_total: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  pingjia_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  star: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.00
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
  tableName: 'xn_companion_profile',
  timestamps: false,
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['game_id', 'status'] },
    { fields: ['price'] }
  ]
});

module.exports = CompanionProfile;
