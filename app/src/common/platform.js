// 运行环境判断：H5（浏览器）与 App（uni-app App-vue WebView / plus 运行时）
export const isApp = typeof plus !== 'undefined' || (typeof window !== 'undefined' && !!window.plus)
export const isH5 = !isApp
