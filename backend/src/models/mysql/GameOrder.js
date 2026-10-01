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
    type: DataTypes.BIGINT,
    allowNull: false
  },
  target_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'target_user_id'
  },
  companion_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  companion_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  game_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  game_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  num: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'num'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price'
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    field: 'status'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  add_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    field: 'add_time'
  },
  start_time: {
    type: DataTypes.INTEGER(10),
    allowNull: true
  },
  end_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  user_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    field: 'user_time'
  },
  star: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    field: 'star'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'content'
  },
  status_zong: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    field: 'status_zong'
  },
  pingjia_status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    field: 'pingjia_status'
  },
  pingjia_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0,
    field: 'pingjia_time'
  },
  games_server_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'games_server_id'
  },
  games_server_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'games_server_name'
  },
  game_role_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'game_role_id'
  },
  game_role_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'game_role_name'
  },
  voice_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'voice_url'
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

const User = require('./User');
GameOrder.belongsTo(User, { as: 'buyer', foreignKey: 'user_id' });
GameOrder.belongsTo(User, { as: 'seller', foreignKey: 'target_user_id' });

module.exports = GameOrder;
