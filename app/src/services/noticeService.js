import { request } from '../common/common'
import { socketService } from './socketService'
import { toast } from '../composables/useToast'
import storage from '../common/storage'

// 平台公告（《未完成事项清单》B-3/B-4 的 C 端消费）
//
// B-3 提供 GET /api/notice/list（已发布且在有效期内的公告，置顶优先），
// B-4 在后台写操作后广播 notice_created / notice_updated / notice_deleted。
// 这里统一收口：列表拉取、未读计算、socket 实时刷新与「新公告」提示。
const SEEN_KEY = 'notice_seen_at'
const PAGE_SIZE = 20

const readSeenAt = () => {
  try {
    const n = Number(storage.getItem(SEEN_KEY))
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch (e) {
    return 0
  }
}

const writeSeenAt = (seconds) => {
  try {
    storage.setItem(SEEN_KEY, String(seconds))
  } catch (e) { /* storage 不可用时忽略 */ }
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

const computeUnread = (list) => {
  const seenAt = readSeenAt()
  return (list || []).filter((item) => Number(item && item.createTime) > seenAt).length
}

let state = { list: [], unread: 0, loading: false }
const listeners = new Set()
let inflight = null
let socketBound = false

const snapshot = () => ({ list: state.list.slice(), unread: state.unread, loading: state.loading })

const notify = () => {
  const snap = snapshot()
  listeners.forEach((cb) => {
    try { cb(snap) } catch (e) { /* 单个订阅方异常不影响其它订阅方 */ }
  })
}

const setList = (list) => {
  state.list = Array.isArray(list) ? list : []
  state.unread = computeUnread(state.list)
}

const load = async () => {
  if (inflight) return inflight
  state.loading = true
  notify()
  inflight = (async () => {
    try {
      const res = await request('/api/notice/list', 'GET', { page: 1, pageSize: PAGE_SIZE })
      const data = (res && res.data) || {}
      setList(data.list)
    } catch (e) {
      // 公告是可选展示内容：失败时保留上一次成功结果，不打断页面
    } finally {
      state.loading = false
      inflight = null
      notify()
    }
  })()
  return inflight
}

// 在 socket 连接建立后调用（socketService.on 在未连接时不会补挂，必须 connect 之后注册）
const bindRealtime = () => {
  if (socketBound) return
  socketBound = true

  socketService.on('notice_created', (payload) => {
    const notice = payload && payload.notice
    if (notice && notice.title) toast.info('新公告：' + notice.title)
    load()
  })
  socketService.on('notice_updated', () => { load() })
  socketService.on('notice_deleted', () => { load() })
}

// 打开公告详情（或用户点击「全部已读」）时调用：把当前时刻记为已读水位
const markAllRead = () => {
  if (!state.list.length) return
  writeSeenAt(nowSeconds())
  state.unread = 0
  notify()
}

const onChange = (cb) => {
  if (typeof cb !== 'function') return () => {}
  listeners.add(cb)
  cb(snapshot())
  return () => listeners.delete(cb)
}

export const noticeService = {
  load,
  bindRealtime,
  markAllRead,
  onChange,
  getSnapshot: snapshot,
  getList: () => state.list.slice(),
  getUnread: () => state.unread
}

export default noticeService
