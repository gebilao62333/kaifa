const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const VirtualUserTagRelation = sequelize.define('xn_virtual_user_tag_relation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  virtual_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '虚拟用户ID'
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '标签ID'
  },
  is_primary: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: '是否主要标签：0-否，1-是'
  },
  create_time: {
    type: DataTypes.INTEGER(10),
    defaultValue: 0
  }
}, {
  tableName: 'xn_virtual_user_tag_relation',
  timestamps: false,
  indexes: [
    { fields: ['virtual_user_id'] },
    { fields: ['tag_id'] }
  ]
});

module.exports = VirtualUserTagRelation;
