const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

// 统一媒资登记表：所有上传（直传COS或本地兜底）都会登记一条记录，
// 用于审计留痕、定位归属、以及按业务级联删除文件本体。
const MediaAsset = sequelize.define('xn_media_asset', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false, comment: '上传用户ID' },
  biz_type: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'misc', comment: '业务类型 circle/album/chat/avatar/feedback' },
  biz_id: { type: DataTypes.BIGINT, allowNull: true, comment: '关联业务ID（如动态ID、相册照片ID、会话ID）' },
  url: { type: DataTypes.TEXT, allowNull: false, comment: '文件访问地址' },
  storage: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'cos', comment: '存储类型 cos/local' },
  file_type: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'file', comment: '文件类型 image/audio/video/file' },
  create_time: { type: DataTypes.INTEGER(10), defaultValue: () => Math.floor(Date.now() / 1000), comment: '创建时间' },
  status: { type: DataTypes.TINYINT(1), defaultValue: 1, comment: '状态 0-已删除 1-正常' }
}, {
  tableName: 'xn_media_asset',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['biz_type', 'biz_id'] },
    { fields: ['create_time'] }
  ]
});

module.exports = MediaAsset;
