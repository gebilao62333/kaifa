const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AlbumPhoto = sequelize.define('xn_album_photo', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false, comment: '用户ID' },
    image_url: { type: DataTypes.STRING(255), allowNull: false, comment: '图片URL' },
    description: { type: DataTypes.STRING(255), allowNull: true, comment: '图片描述' },
    privacy: { type: DataTypes.STRING(20), defaultValue: 'public', comment: '可见性 public/private/password/paid' },
    password: { type: DataTypes.STRING(50), allowNull: true, comment: '访问密码' },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, comment: '解锁价格（金币）' },
    likes: { type: DataTypes.INTEGER, defaultValue: 0, comment: '点赞数' },
    create_time: { type: DataTypes.INTEGER(10), defaultValue: () => Math.floor(Date.now() / 1000), comment: '创建时间' },
    status: { type: DataTypes.TINYINT(1), defaultValue: 1, comment: '状态 0-禁用 1-正常' }
  }, {
    tableName: 'xn_album_photo',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['create_time'] },
      { fields: ['status'] }
    ]
  });

  return AlbumPhoto;
};
