const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const CompanionProfile = sequelize.define('xn_companion_profile', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  game_ids: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skill_level: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  price_per_hour: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  intro: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  online_status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  online_service: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  offline_service: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
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
    { fields: ['user_id'], unique: true }
  ]
});

module.exports = CompanionProfile;
