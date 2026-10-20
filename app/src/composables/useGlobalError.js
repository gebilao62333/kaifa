import { ref } from 'vue'

// 全局错误兜底：旧版 App.vue 用 ErrorBoundary 包住路由树，出错时展示
// 「页面加载出错 / 重新加载」。uni-app 的页面由框架渲染、无法统一包一层
// ErrorBoundary，因此改为：
//   1) 页面内部错误由 PageLayout 内的 ErrorBoundary 捕获（局部兜底）
//   2) 全屏页/边界外错误由 main.js 的 app.config.errorHandler 写入本状态，
//      GlobalUI 渲染全局兜底层
const globalError = ref(null)

export function useGlobalError() {
  return globalError
}

export function captureGlobalError(err, info = '') {
  if (!err) return
  const message = (err && (err.message || String(err))) || '未知错误'
  globalError.value = { message, info: info || '' }
}

export function clearGlobalError() {
  globalError.value = null
}
