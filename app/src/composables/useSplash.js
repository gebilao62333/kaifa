import { ref } from 'vue'
import { pickSplash } from '../utils/splashScreen'
import { router } from '../common/route'
import { isApp } from '../common/platform'

const splash = ref(null)

export function useSplash() { return splash }

export async function loadSplash() {
  try { splash.value = await pickSplash() } catch (e) { splash.value = null }
}

export function closeSplash() { splash.value = null }

// App 端没有 window.location：外链交给 plus.runtime.openURL 打开系统浏览器；
// plus 不可用时降级为复制链接，至少让用户能自己粘贴打开
function openExternalLink(url) {
  const copyLink = () => {
    try {
      uni.setClipboardData({ data: url, showToast: false })
    } catch (e) { /* 复制失败则静默，不阻断开屏弹窗关闭 */ }
  }
  try {
    const plusRuntime = typeof plus !== 'undefined' && plus ? plus.runtime : null
    if (plusRuntime && typeof plusRuntime.openURL === 'function') {
      plusRuntime.openURL(url, copyLink)
      return
    }
  } catch (e) { /* plus 调用异常时归到复制兜底 */ }
  copyLink()
}

export function navigateSplash(link) {
  const target = String(link || '')
  splash.value = null
  if (/^https?:\/\//i.test(target)) {
    if (isApp) {
      openExternalLink(target)
      return
    }
    try { window.location.href = target } catch (e) {}
    return
  }
  // 站内路径：route 兼容层在 App 端内部走 uni.navigateTo/redirectTo
  router.push(target.indexOf('/') === 0 ? target : '/' + target)
}
