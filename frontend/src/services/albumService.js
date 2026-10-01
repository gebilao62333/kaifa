import { request } from '../common/common'
import { uploadFile } from './uploadService'

const PAGE_SIZE = 12

export const albumService = {
  async getPhotos(page = 1) {
    return request('/api/album/photos', 'GET', { page, pageSize: PAGE_SIZE })
  },

  // 前端直传 COS：先拿到真实访问 URL，再交给后端登记入库（只存 URL，不占服务器带宽）
  async uploadPhoto(file, description = '', privacy = 'public', password = '', price = 0) {
    const result = await uploadFile(file, 'image')
    const url = result?.data?.url
    if (!url) {
      throw new Error('上传失败，未获取到文件地址')
    }
    return request('/api/album/upload', 'POST', {
      url,
      description,
      privacy,
      password,
      price: String(price)
    })
  },

  async deletePhoto(id) {
    return request('/api/album/delete', 'POST', { id })
  },

  async likePhoto(id) {
    return request('/api/album/like', 'POST', { id })
  }
}
