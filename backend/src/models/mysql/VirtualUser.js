const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUser = sequelize.define('xn_virtual_user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gender: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  age: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  region: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  intro: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price_per_hour: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  online_status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  is_recommend: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  update_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  },
  // === AI 虚拟用户扩展字段 ===
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'username'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'nickname'
  },
  role: {
    type: DataTypes.STRING(30),
    defaultValue: 'default',
    field: 'role'
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'personality'
  },
  dialogue_style: {
    type: DataTypes.STRING(30),
    defaultValue: 'friendly',
    field: 'dialogue_style'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description'
  },
  model_config: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'model_config',
    get() {
      const raw = this.getDataValue('model_config');
      try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); }
      catch { return {}; }
    },
    set(val) {
      this.setDataValue('model_config', typeof val === 'string' ? val : JSON.stringify(val || {}));
    }
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'permissions',
    get() {
      const raw = this.getDataValue('permissions');
      try { return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); }
      catch { return []; }
    },
    set(val) {
      this.setDataValue('permissions', typeof val === 'string' ? val : JSON.stringify(Array.isArray(val) ? val : []));
    }
  },
  context_expire_time: {
    type: DataTypes.INTEGER,
    defaultValue: 3600,
    field: 'context_expire_time'
  },
  max_context_length: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    field: 'max_context_length'
  }
}, {
  tableName: 'xn_virtual_user',
  timestamps: false,
  indexes: [
    { fields: ['online_status'] },
    { fields: ['is_recommend'] }
  ],
  // Virtual getters for backward compatibility with camelCase service code
  getterMethods: {
    isOnline() { return this.online_status; },
    isRecommend() { return this.is_recommend; },
    dialogueStyle() { return this.dialogue_style; },
    modelConfig() { return this.model_config ? (typeof this.model_config === 'string' ? JSON.parse(this.model_config) : this.model_config) : {}; },
    contextExpireTime() { return this.context_expire_time; },
    maxContextLength() { return this.max_context_length; }
  },
  setterMethods: {
    isOnline(val) { this.setDataValue('online_status', val); },
    isRecommend(val) { this.setDataValue('is_recommend', val); },
    dialogueStyle(val) { this.setDataValue('dialogue_style', val); },
    modelConfig(val) { this.setDataValue('model_config', typeof val === 'string' ? val : JSON.stringify(val || {})); },
    contextExpireTime(val) { this.setDataValue('context_expire_time', val); },
    maxContextLength(val) { this.setDataValue('max_context_length', val); }
  }
});

module.exports = VirtualUser;
