const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const RedPacket = sequelize.define('xn_red_packet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  packet_no: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  type: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  total_num: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  remain_num: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  remain_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  expire_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_red_packet',
  timestamps: false,
  indexes: [
    { fields: ['packet_no'], unique: true },
    { fields: ['sender_id'] },
    { fields: ['expire_time', 'status'] }
  ]
});

module.exports = RedPacket;
