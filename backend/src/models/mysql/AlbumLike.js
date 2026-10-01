const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 相册点赞表：用于判定"我是否点过赞"并支持点赞去重
const AlbumLike = sequelize.define('xn_album_like', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  photo_id: { type: DataTypes.BIGINT, allowNull: false, comment: '照片ID' },
  user_id: { type: DataTypes.BIGINT, allowNull: false, comment: '点赞用户ID' },
  create_time: { type: DataTypes.INTEGER(10), defaultValue: 0, comment: '点赞时间' }
}, {
  tableName: 'xn_album_like',
  timestamps: false,
  indexes: [
    { fields: ['photo_id', 'user_id'], unique: true },
    { fields: ['user_id'] }
  ]
});

module.exports = AlbumLike;
