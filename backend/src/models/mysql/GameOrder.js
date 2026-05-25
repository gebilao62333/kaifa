const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const GameOrder = sequelize.define('xn_game_order', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  order_no: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
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
  game_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  num: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  status_zong: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  user_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  add_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  end_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  pingjia_status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  pingjia_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  games_server_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  games_server_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  game_role_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  game_role_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  voice_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'xn_game_order',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['target_user_id', 'status'] },
    { fields: ['order_no'] },
    { fields: ['status', 'create_time'] }
  ]
});

module.exports = GameOrder;
