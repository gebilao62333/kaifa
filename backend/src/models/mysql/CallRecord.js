const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const CallRecord = sequelize.define('xn_call_record', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  call_no: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  caller_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  callee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  call_type: {
    type: DataTypes.TINYINT(1),
    allowNull: false
  },
  trtc_room_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  connect_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  end_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  end_reason: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  is_companion_call: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  order_id: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_call_record',
  timestamps: false,
  indexes: [
    { fields: ['call_no'], unique: true },
    { fields: ['caller_id', 'create_time'] },
    { fields: ['callee_id', 'create_time'] },
    { fields: ['status', 'create_time'] },
    { fields: ['order_id'] },
    { fields: ['trtc_room_id'] }
  ]
});

module.exports = CallRecord;
