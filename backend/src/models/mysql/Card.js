const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Card = sequelize.define('xn_card', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_no: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  card_pwd: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  face_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  coin_amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  use_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  use_user_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expire_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_card',
  timestamps: false,
  indexes: [
    { fields: ['card_no'], unique: true },
    { fields: ['status'] }
  ]
});

module.exports = Card;
