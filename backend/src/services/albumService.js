const path = require('path');
const mediaAssetService = require('./mediaAssetService');
const logger = require('../utils/logger');

let photos = []
let photoIdCounter = 1

const getPhotos = async (userId, page = 1, pageSize = 12) => {
  const userPhotos = photos.filter(p => p.userId === userId)
  const total = userPhotos.length
  const start = (page - 1) * pageSize
  const list = userPhotos.slice(start, start + pageSize)

  return {
    total,
    page,
    pageSize,
    list: list.map(p => ({
      id: p.id,
      url: p.url,
      thumbnail: p.thumbnail || p.url,
      description: p.description,
      privacy: p.privacy,
      likeCount: p.likeCount,
      isLiked: p.likedBy.includes(userId),
      createTime: p.createTime
    }))
  }
}

const uploadPhoto = async (userId, url, description, privacy, password, price) => {
  const photo = {
    id: photoIdCounter++,
    userId,
    url,
    thumbnail: url,
    description: description || '',
    privacy: privacy || 'public',
    password: password || '',
    price: price ? parseFloat(price) : 0,
    likeCount: 0,
    likedBy: [],
    createTime: Date.now()
  }

  photos.unshift(photo)

  // 登记媒资，便于审计与级联删除
  try {
    await mediaAssetService.register({
      userId,
      url,
      fileType: 'image',
      bizType: 'album',
      bizId: photo.id,
      storage: url.includes('.myqcloud.com') ? 'cos' : 'local'
    })
  } catch (e) {
    logger.error('[相册] 登记媒资失败:', e.message)
  }

  return { id: photo.id, url: photo.url }
}

const deletePhoto = async (userId, photoId) => {
  const photo = photos.find(p => p.id === photoId && p.userId === userId)

  if (!photo) {
    throw new Error('照片不存在或无权删除')
  }

  // 同步清理底层存储（COS或本地）与媒资登记表，避免孤儿文件
  try {
    await mediaAssetService.removeByBiz('album', photoId)
  } catch (e) {
    logger.error('[相册] 清理媒资失败:', e.message)
  }

  photos = photos.filter(p => p.id !== photoId)
  return true
}

const likePhoto = async (userId, photoId) => {
  const photo = photos.find(p => p.id === photoId)

  if (!photo) {
    throw new Error('照片不存在')
  }

  const likedIndex = photo.likedBy.indexOf(userId)

  if (likedIndex > -1) {
    photo.likedBy.splice(likedIndex, 1)
    photo.likeCount = Math.max(0, photo.likeCount - 1)
    return { isLiked: false, likeCount: photo.likeCount }
  } else {
    photo.likedBy.push(userId)
    photo.likeCount += 1
    return { isLiked: true, likeCount: photo.likeCount }
  }
}

module.exports = {
  getPhotos,
  uploadPhoto,
  deletePhoto,
  likePhoto
}
