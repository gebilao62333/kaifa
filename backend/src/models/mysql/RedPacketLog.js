const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const RedPacketLog = sequelize.define('xn_red_packet_log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  packet_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_red_packet_log',
  timestamps: false,
  indexes: [
    { fields: ['packet_id'] },
    { fields: ['packet_id', 'user_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = RedPacketLog;
