import { request } from '../common/common'

const PAGE_SIZE = 12

export const albumService = {
  async getPhotos(page = 1) {
    return request('/api/album/photos', 'GET', { page, pageSize: PAGE_SIZE })
  },

  async uploadPhoto(file, description = '', privacy = 'public', password = '', price = 0) {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('image', file)
    formData.append('description', description)
    formData.append('privacy', privacy)
    if (password) formData.append('password', password)
    if (price) formData.append('price', String(price))

    try {
      const res = await fetch('/api/album/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || '上传失败')
      }
      return await res.json()
    } catch (error) {
      throw error
    }
  },

  async deletePhoto(id) {
    return request('/api/album/delete', 'POST', { id })
  },

  async likePhoto(id) {
    return request('/api/album/like', 'POST', { id })
  }
}
