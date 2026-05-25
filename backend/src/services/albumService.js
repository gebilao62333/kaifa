const path = require('path');

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

const uploadPhoto = async (userId, file, description, privacy) => {
  const photo = {
    id: photoIdCounter++,
    userId,
    url: `/uploads/${file.filename}`,
    thumbnail: `/uploads/${file.filename}`,
    description: description || '',
    privacy: privacy || 'public',
    likeCount: 0,
    likedBy: [],
    createTime: Date.now()
  }

  photos.unshift(photo)

  return { id: photo.id, url: photo.url }
}

const deletePhoto = async (userId, photoId) => {
  const index = photos.findIndex(p => p.id === photoId && p.userId === userId)

  if (index === -1) {
    throw new Error('照片不存在或无权删除')
  }

  photos.splice(index, 1)
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
