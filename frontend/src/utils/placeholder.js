// 本地占位图生成工具：完全基于 SVG data URI，不依赖任何外部网络。
// 用于替代 picsum.photos / dicebear 等外部占位图，
// 避免弱网 / 离线 / 域名被拦截时页面出现破图。

const palettes = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
  ['#5ee7df', '#b490ca'],
  ['#c79081', '#dfa579'],
]

const hashStr = (str = '') => {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

const firstChar = (name = '') => {
  const s = String(name).trim()
  return s ? s[0].toUpperCase() : '?'
}

// 生成头像 data URI（渐变背景 + 首字母）
export const genAvatar = (seed = 'user') => {
  const [c1, c2] = palettes[hashStr(String(seed)) % palettes.length]
  const ch = firstChar(seed)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>` +
    `</linearGradient></defs>` +
    `<rect width="200" height="200" fill="url(#g)"/>` +
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" ` +
    `font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="96" ` +
    `fill="#ffffff" font-weight="600">${ch}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// 生成封面 / 横幅 data URI（纯渐变）
export const genCover = (seed = 'cover') => {
  const [c1, c2] = palettes[hashStr(String(seed)) % palettes.length]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>` +
    `</linearGradient></defs>` +
    `<rect width="800" height="400" fill="url(#g)"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
