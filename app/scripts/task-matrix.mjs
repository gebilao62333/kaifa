import fs from 'node:fs'
import path from 'node:path'
import { ROOT, LOG_DIR } from './_utils.mjs'

const files = fs.readdirSync(LOG_DIR).filter((f) => f.startsWith('smoke-') && f.endsWith('.json'))
if (!files.length) { console.log('没有冒烟报告'); process.exit(0) }
files.sort((a, b) => fs.statSync(path.join(LOG_DIR, b)).mtimeMs - fs.statSync(path.join(LOG_DIR, a)).mtimeMs)
const latest = JSON.parse(fs.readFileSync(path.join(LOG_DIR, files[0]), 'utf8'))
const routesTxt = fs.readFileSync(path.join(ROOT, 'src', 'common', 'routes.js'), 'utf8')
const m = routesTxt.match(/export const ROUTES = (\[[\s\S]*?\])\n\nexport/)
const routes = m ? JSON.parse(m[1]) : []
const byView = {}
for (const r of routes) byView[r.view] = r
const lines = ['# 页面迁移矩阵（自动生成）', '', '- 生成时间：' + new Date().toISOString(), '- 冒烟报告：' + files[0], '', '| 页面 | 原路径 | 鉴权 | H5 冒烟 | 截图 |', '|---|---|---|---|---|']
for (const p of latest.pages || []) {
  const r = byView[p.name] || byView[p.view] || {}
  const ok = p.pageErrors ? 'JS错误' : (p.appLength > 100 ? 'OK' : '空白')
  lines.push('| ' + p.name + ' | ' + (r.path || '-') + ' | ' + (r.requiresAuth ? '是' : '否') + ' | ' + ok + ' | ' + path.basename(p.screenshot || '') + ' |')
}
lines.push('', '## 旧路径兼容')
for (const l of latest.legacyResults || []) lines.push('- ' + l.path + ' → ' + l.url + '（' + (l.ok ? 'OK' : '失败') + '）')
lines.push('', '## 404')
lines.push('- ' + (latest.notFound && latest.notFound.ok ? 'OK' : '失败') + '：' + ((latest.notFound && latest.notFound.url) || ''))
lines.push('')
fs.writeFileSync(path.join(ROOT, 'automation', 'page-matrix.md'), lines.join('\n'))
console.log('页面矩阵: ' + (latest.pages || []).length + ' 页；报告 ' + files[0])
