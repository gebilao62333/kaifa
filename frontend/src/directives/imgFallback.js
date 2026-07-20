import { genAvatar } from '../utils/placeholder'

// 全局指令 v-img-fallback：当图片加载失败时，自动回退到本地生成的 SVG 头像。
// 用法：<img v-img-fallback="userName" :src="url" :alt="userName" />
// 可兜底后端返回的真实头像 URL 失效、以及任何意外破图场景。
export default {
  mounted(el, binding) {
    el.addEventListener('error', () => {
      if (el.dataset.fallbackApplied) return
      el.dataset.fallbackApplied = '1'
      el.src = genAvatar(binding.value || el.alt || 'user')
    })
  }
}
