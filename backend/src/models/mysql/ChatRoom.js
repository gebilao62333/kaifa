const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const ChatRoom = sequelize.define('xn_chat_room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  title_sub: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image_bg: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  manage_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  open: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_chat_room',
  timestamps: false,
  indexes: [
    { fields: ['manage_id'] },
    { fields: ['status'] },
    { fields: ['create_time'] }
  ]
});

module.exports = ChatRoom;
