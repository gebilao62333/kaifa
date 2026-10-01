const { AlbumPhoto, AlbumLike } = require('../models');
const mediaAssetService = require('./mediaAssetService');
const { getTimestamp, parseQuery } = require('../utils/helper');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// 相册照片列表（当前用户的相册），带点赞数与"我是否点过赞"
const getPhotos = async (userId, page = 1, pageSize = 12) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const { count, rows } = await AlbumPhoto.findAndCountAll({
    where: { user_id: userId, status: 1 },
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });

  // 批量查询当前用户对这批照片的点赞，避免逐条 N+1
  const likedSet = new Set();
  if (userId && rows.length > 0) {
    const likes = await AlbumLike.findAll({
      where: { user_id: userId, photo_id: { [Op.in]: rows.map(r => r.id) } },
      attributes: ['photo_id']
    });
    likes.forEach(l => likedSet.add(Number(l.photo_id)));
  }

  return {
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    list: rows.map(p => ({
      id: p.id,
      url: p.image_url,
      thumbnail: p.image_url,
      description: p.description || '',
      privacy: p.privacy,
      likeCount: p.likes || 0,
      isLiked: likedSet.has(Number(p.id)),
      createTime: p.create_time
    }))
  };
};

const uploadPhoto = async (userId, url, description, privacy, password, price) => {
  const photo = await AlbumPhoto.create({
    user_id: userId,
    image_url: url,
    description: description || '',
    privacy: privacy || 'public',
    password: password || null,
    price: price ? parseFloat(price) : 0,
    likes: 0,
    status: 1,
    create_time: getTimestamp()
  });

  // 登记媒资，便于审计与级联删除
  try {
    await mediaAssetService.register({
      userId,
      url,
      fileType: 'image',
      bizType: 'album',
      bizId: photo.id,
      storage: url.includes('.myqcloud.com') ? 'cos' : 'local'
    });
  } catch (e) {
    logger.error('[相册] 登记媒资失败:', e.message);
  }

  return { id: photo.id, url: photo.image_url };
};

const deletePhoto = async (userId, photoId) => {
  const photo = await AlbumPhoto.findOne({ where: { id: photoId, user_id: userId } });

  if (!photo) {
    throw new Error('照片不存在或无权删除');
  }

  // 同步清理底层存储（COS或本地）与媒资登记表，避免孤儿文件
  try {
    await mediaAssetService.removeByBiz('album', photoId);
  } catch (e) {
    logger.error('[相册] 清理媒资失败:', e.message);
  }

  await AlbumLike.destroy({ where: { photo_id: photoId } });
  await photo.destroy();
  return true;
};

const likePhoto = async (userId, photoId) => {
  const photo = await AlbumPhoto.findByPk(photoId);

  if (!photo) {
    throw new Error('照片不存在');
  }

  const existing = await AlbumLike.findOne({
    where: { photo_id: photoId, user_id: userId }
  });

  if (existing) {
    await existing.destroy();
    await photo.decrement('likes');
  } else {
    await AlbumLike.create({
      photo_id: photoId,
      user_id: userId,
      create_time: getTimestamp()
    });
    await photo.increment('likes');
  }

  await photo.reload();
  return { isLiked: !existing, likeCount: photo.likes || 0 };
};

module.exports = {
  getPhotos,
  uploadPhoto,
  deletePhoto,
  likePhoto
};
