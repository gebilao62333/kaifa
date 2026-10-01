const response = require('../utils/response')

// 支持的平台
const PLATFORMS = {
  ios: '苹果',
  android: '安卓',
  harmony: '鸿蒙'
}

// 全局 xssProtection 中间件会把输入中的 '/' 转义成 '&#x2F;'，导致下载链接失效。
// 在对外输出/跳转前将 HTML 实体还原为正常字符。
const decodeEntities = (str) => {
  if (typeof str !== 'string') return str
  return str
    .replace(/&#x2F;/g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

// ===== 下载配置存储 =====
// 说明：下载管理无独立数据表，使用内存数组存储。
// 重启服务器后数据丢失，需在 SystemSettings 中创建 download_config 记录以持久化。
// TODO: 将下载配置迁移至 SystemSettings.download_config = JSON
let downloadStore = [
  { id: 1, platform: 'ios', version: '1.0.0', url: '', size: '', sort: 1, status: 1, createTime: Date.now(), updateTime: Date.now() },
  { id: 2, platform: 'android', version: '1.0.0', url: '', size: '', sort: 2, status: 1, createTime: Date.now(), updateTime: Date.now() },
  { id: 3, platform: 'harmony', version: '1.0.0', url: '', size: '', sort: 3, status: 1, createTime: Date.now(), updateTime: Date.now() }
]
let nextId = 4

// ===== 后台管理：下载管理（/api/admin/downloads）=====
const getDownloadList = async (req, res) => {
  try {
    const { platform, status, keyword, page = 1, pageSize = 20 } = req.query
    let list = [...downloadStore]
    if (platform) list = list.filter(d => d.platform === platform)
    if (status !== undefined && status !== '') list = list.filter(d => d.status === Number(status))
    if (keyword) list = list.filter(d => (d.version || '').includes(keyword) || (d.url || '').includes(keyword))
    list.sort((a, b) => a.sort - b.sort)
    const total = list.length
    const start = (Number(page) - 1) * Number(pageSize)
    const paged = list.slice(start, start + Number(pageSize))
    return response.success(res, { list: paged.map(d => ({ ...d, url: decodeEntities(d.url) })), total, page: Number(page), pageSize: Number(pageSize) })
  } catch (e) {
    return response.error(res, '获取下载列表失败: ' + e.message)
  }
}

const getDownloadDetail = async (req, res) => {
  try {
    const item = downloadStore.find(d => d.id === Number(req.params.id))
    if (!item) return response.notFound(res, '下载项不存在')
    return response.success(res, { ...item, url: decodeEntities(item.url) })
  } catch (e) {
    return response.error(res, '获取下载详情失败: ' + e.message)
  }
}

const createDownload = async (req, res) => {
  try {
    const { platform, version, url, size, sort = 99, status = 1 } = req.body
    if (!platform || !PLATFORMS[platform]) return response.badRequest(res, '平台不合法，仅支持 ios/android/harmony')
    if (!url) return response.badRequest(res, '下载地址不能为空')
    const item = {
      id: nextId++,
      platform,
      version: version || '',
      url,
      size: size || '',
      sort: Number(sort),
      status: Number(status),
      createTime: Date.now(),
      updateTime: Date.now()
    }
    downloadStore.push(item)
    return response.created(res, { ...item, url: decodeEntities(item.url) }, '创建成功')
  } catch (e) {
    return response.error(res, '创建下载项失败: ' + e.message)
  }
}

const updateDownload = async (req, res) => {
  try {
    const item = downloadStore.find(d => d.id === Number(req.params.id))
    if (!item) return response.notFound(res, '下载项不存在')
    const { platform, version, url, size, sort, status } = req.body
    if (platform !== undefined) {
      if (!PLATFORMS[platform]) return response.badRequest(res, '平台不合法，仅支持 ios/android/harmony')
      item.platform = platform
    }
    if (version !== undefined) item.version = version
    if (url !== undefined) item.url = url
    if (size !== undefined) item.size = size
    if (sort !== undefined) item.sort = Number(sort)
    if (status !== undefined) item.status = Number(status)
    item.updateTime = Date.now()
    return response.success(res, { ...item, url: decodeEntities(item.url) }, '更新成功')
  } catch (e) {
    return response.error(res, '更新下载项失败: ' + e.message)
  }
}

const updateDownloadStatus = async (req, res) => {
  try {
    const item = downloadStore.find(d => d.id === Number(req.params.id))
    if (!item) return response.notFound(res, '下载项不存在')
    const { status } = req.body
    if (status === undefined) return response.badRequest(res, '状态不能为空')
    item.status = Number(status)
    item.updateTime = Date.now()
    return response.success(res, item, '状态更新成功')
  } catch (e) {
    return response.error(res, '更新状态失败: ' + e.message)
  }
}

const deleteDownload = async (req, res) => {
  try {
    const idx = downloadStore.findIndex(d => d.id === Number(req.params.id))
    if (idx === -1) return response.notFound(res, '下载项不存在')
    downloadStore.splice(idx, 1)
    return response.success(res, null, '删除成功')
  } catch (e) {
    return response.error(res, '删除下载项失败: ' + e.message)
  }
}

// ===== 公开下载功能（/api/download，供官网/落地页使用）=====
const getPublicPlatforms = async (req, res) => {
  try {
    const list = downloadStore
      .filter(d => d.status === 1 && d.url)
      .sort((a, b) => a.sort - b.sort)
      .map(d => ({ platform: d.platform, name: PLATFORMS[d.platform], version: d.version, url: decodeEntities(d.url), size: d.size }))
    return response.success(res, list)
  } catch (e) {
    return response.error(res, '获取下载信息失败: ' + e.message)
  }
}

const redirectDownload = async (req, res) => {
  try {
    const item = downloadStore.find(d => d.platform === req.params.platform && d.status === 1 && d.url)
    if (!item) return response.notFound(res, '暂无可用的下载地址')
    return res.redirect(decodeEntities(item.url))
  } catch (e) {
    return response.error(res, '下载失败: ' + e.message)
  }
}

module.exports = {
  getDownloadList,
  getDownloadDetail,
  createDownload,
  updateDownload,
  updateDownloadStatus,
  deleteDownload,
  getPublicPlatforms,
  redirectDownload
}
