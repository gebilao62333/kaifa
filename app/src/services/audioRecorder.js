import { isApp } from '../common/platform'

// App 端录音统一封装。
// 为什么需要它：uni.getRecorderManager() 拿到的是全局唯一录音器，页面各自持有会在
// 「切页/重录/连点」时互相抢麦；且录音产物只有临时路径，uploadService 的 App 分支
// 需要 { path, ... } 形态。这里做单例 + 串行门闩 + 结果归一化。
// H5 端页面继续用 MediaRecorder + navigator.mediaDevices，本模块只返回 supported:false
// 交回页面原有逻辑，保证 H5 行为不变。

const MAX_DURATION = 60000
const DEFAULT_DURATION = 1

let manager = null
let recording = false
let starting = false
let cancelling = false
let pendingStart = null
let pendingStop = null
let stopTimer = null

// 仅 App 端且运行时存在原生录音器时才认为支持；特性判断兜底，
// 避免 H5 / webview 里直接访问 uni.getRecorderManager 抛错。
export function isRecordSupported() {
  return isApp && typeof uni !== 'undefined' && typeof uni.getRecorderManager === 'function'
}

const isPermissionError = (err) => {
  const text = String((err && (err.errMsg || err.message)) || '')
  return /auth|deny|denied|permission|not authorized/i.test(text)
}

const errorMessage = (err) => {
  const text = String((err && (err.errMsg || err.message)) || '')
  if (isPermissionError(err)) return '麦克风权限被拒绝，请在系统设置中开启录音权限'
  if (/busy|occupy|in use/i.test(text)) return '麦克风被其他应用占用，请稍后重试'
  return text ? '录音失败：' + text : '录音失败，请重试'
}

const settleStart = (error) => {
  const pending = pendingStart
  pendingStart = null
  starting = false
  if (!pending) return
  if (error) pending.reject(error)
  else pending.resolve()
}

const settleStop = (value) => {
  const pending = pendingStop
  pendingStop = null
  recording = false
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  if (pending) pending.resolve(value)
}

// 部分机型 onStop 不回 fileSize，而 uploadService.validateFile 会拒绝 size=0；
// 这里用 getFileInfo 补一次查询，仍拿不到时给 1 —— uni.uploadFile 只认 filePath，
// size 只参与前端校验，真实大小由传输文件本身与服务端决定。
const getFileSize = (path) => new Promise((resolve) => {
  if (typeof uni === 'undefined' || typeof uni.getFileInfo !== 'function') return resolve(0)
  uni.getFileInfo({
    filePath: path,
    success: (info) => resolve(Number(info && info.size) || 0),
    fail: () => resolve(0)
  })
})

const buildRecordResult = async (res) => {
  const path = (res && (res.tempFilePath || res.tempFile)) || ''
  if (!path) return null
  const durationMs = Number(res && res.duration) || 0
  const duration = Math.max(DEFAULT_DURATION, Math.round(durationMs / 1000) || 0)
  let size = Number(res && res.fileSize) || 0
  if (!size) size = await getFileSize(path)
  return {
    path,
    name: 'voice_' + Date.now() + '.mp3',
    type: 'audio/mpeg',
    size: size > 0 ? size : 1,
    duration
  }
}

// 监听只在首次创建时注册，避免反复 getRecorderManager 后事件叠加触发
const getManager = () => {
  if (manager) return manager
  manager = uni.getRecorderManager()
  const bind = (name, handler) => {
    if (manager && typeof manager[name] === 'function') manager[name](handler)
  }
  bind('onStart', () => {
    recording = true
    settleStart(null)
  })
  bind('onStop', async (res) => {
    recording = false
    if (cancelling) {
      cancelling = false
      settleStop(null)
      return
    }
    let result = null
    try {
      result = await buildRecordResult(res)
    } catch (e) {
      result = null
    }
    settleStop(result)
  })
  bind('onError', (err) => {
    const cancelled = cancelling
    const denied = isPermissionError(err)
    recording = false
    starting = false
    cancelling = false
    // 权限拒绝 / 录音中途出错都只回传结果，不抛未捕获异常；取消不算失败
    settleStart(Object.assign(new Error(errorMessage(err)), { denied, cancelled }))
    if (pendingStop) settleStop(null)
  })
  return manager
}

// 启动录音。返回 { supported, started }；isApp 之外的平台 supported:false，交给页面原逻辑。
// 权限拒绝/设备不可用返回 started:false + message，不抛错（页面据此提示，不产生未处理拒绝）。
export async function startRecord() {
  if (!isRecordSupported()) return { supported: false, started: false }
  // 串行防重入：上一轮 start/stop 还没收尾时再点会抢同一个全局录音器
  if (recording || starting) return { supported: true, started: false, busy: true }
  starting = true
  cancelling = false
  const mgr = getManager()
  try {
    await new Promise((resolve, reject) => {
      pendingStart = { resolve, reject }
      try {
        mgr.start({
          duration: MAX_DURATION,
          sampleRate: 44100,
          numberOfChannels: 1,
          encodeBitRate: 96000,
          format: 'mp3'
        })
      } catch (e) {
        settleStart(e)
      }
    })
  } catch (error) {
    recording = false
    starting = false
    return {
      supported: true,
      started: false,
      denied: !!error.denied,
      message: error.message || '录音启动失败'
    }
  }
  return { supported: true, started: true }
}

// 停止并返回可直接喂 uploadService.uploadFile(file, 'audio') 的文件对象；取消/失败返回 null。
export function stopRecord() {
  if (!isRecordSupported() || !recording) return Promise.resolve(null)
  if (pendingStop) return pendingStop.promise
  // 同时存 promise 与 resolve：settleStop 只负责 resolve，调用方拿到的必须是可 then 的 promise
  let resolveFn = null
  const promise = new Promise((resolve) => { resolveFn = resolve })
  pendingStop = { promise, resolve: resolveFn }
  // 兜底看门狗：个别机型 stop 回调可能丢失（录音器被系统回收），
  // 超时后按「本次录音作废」返回 null，避免页面永远等不到结果
  stopTimer = setTimeout(() => { settleStop(null) }, 3000)
  try {
    getManager().stop()
  } catch (e) {
    settleStop(null)
  }
  return promise
}

// 放弃本次录音（切页/关闭弹窗）：产物丢弃，不进入上传流程，也不让状态卡住
export function cancelRecord() {
  if (!isRecordSupported()) return
  if (!recording && !starting) return
  cancelling = true
  try {
    if (manager && typeof manager.stop === 'function') manager.stop()
  } catch (e) {
    /* 录音器未就绪时 stop 可能报错，忽略即可 */
  }
  if (!recording && starting) {
    // start 的回调可能不会再来，兜底释放门闩，避免后续录音一直被 busy 挡住
    starting = false
    settleStart(Object.assign(new Error('已取消录音'), { denied: false, cancelled: true }))
  }
}

export default { isRecordSupported, startRecord, stopRecord, cancelRecord }
