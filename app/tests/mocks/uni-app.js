// 测试环境用无副作用的 uni-app 生命周期替身。
// 原因：vitest 只用 @vitejs/plugin-vue（标准 vue），而 @dcloudio/uni-app 的 onShow 内部依赖
// uni 版 vue 才导出的 vue.injectHook；页面一旦静态 import 它，setup 阶段会抛
// "vue.injectHook is not a function"。真实 uni 构建（vite-plugin-uni 会把 vue 指到 uni 版）不受影响，
// 所以只在 vitest.config.mjs 里把 '@dcloudio/uni-app' alias 到本文件，让页面测试继续可跑。
const noop = () => {}

export const onShow = noop
export const onLoad = noop
export const onReady = noop
export const onHide = noop
export const onUnload = noop
export const onReachBottom = noop
export const onPullDownRefresh = noop
export const onPageScroll = noop
export const onTabItemTap = noop
export const onShareAppMessage = noop
export const onNavigationBarButtonTap = noop

export default {
  onShow: noop,
  onLoad: noop,
  onReady: noop,
  onHide: noop,
  onUnload: noop,
  onReachBottom: noop,
  onPullDownRefresh: noop,
  onPageScroll: noop,
  onTabItemTap: noop,
  onShareAppMessage: noop,
  onNavigationBarButtonTap: noop
}
