import fs from 'node:fs'
import path from 'node:path'
import { ROOT, LOG_DIR, ensureDirs } from './_utils.mjs'

ensureDirs()
try {
  const { spawnSync } = await import('node:child_process')
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'task-context.mjs'), '--threshold=70'], { cwd: ROOT, stdio: 'ignore', timeout: 60000 })
} catch (e) {}
function latest(pattern) {
  const files = fs.readdirSync(LOG_DIR).filter((f) => f.startsWith(pattern))
  if (!files.length) return null
  files.sort((a, b) => fs.statSync(path.join(LOG_DIR, b)).mtimeMs - fs.statSync(path.join(LOG_DIR, a)).mtimeMs)
  return path.join(LOG_DIR, files[0])
}
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { return null } }
function tail(f, n) { try { return fs.readFileSync(f, 'utf8').slice(-n) } catch (e) { return '' } }

const smokeFile = latest('smoke-')
const smoke = smokeFile ? readJson(smokeFile) : null
const buildFile = latest('build-h5-')
const appFile = latest('build-app-')
const lines = []
lines.push('# 自动化汇总报告')
lines.push('')
lines.push('时间：' + new Date().toISOString())
lines.push('')
lines.push('## H5 构建')
lines.push(buildFile ? '日志：' + buildFile : '未找到构建日志')
lines.push('')
lines.push('## H5 冒烟')
if (smoke) {
  lines.push('- 结果：' + (smoke.ok ? '通过' : '失败'))
  lines.push('- 地址：' + smoke.baseUrl)
  lines.push('- pageErrors：' + (smoke.errors && smoke.errors.pageErrors.length || 0))
  lines.push('- consoleErrors：' + (smoke.errors && smoke.errors.consoleErrors.length || 0))
  for (const p of smoke.pages || []) lines.push('- ' + p.name + '：' + p.url + '（app=' + p.appLength + '，bottomNav=' + p.bottomNav + '）')
  lines.push('- 报告：' + smokeFile)
  lines.push('- 截图：' + path.join(LOG_DIR, 'shots'))
} else lines.push('未找到冒烟报告')
lines.push('')
lines.push('## App 资源构建（可选）')
lines.push(appFile ? '日志：' + appFile : '未执行')
lines.push('')
try {
  const c = JSON.parse(fs.readFileSync(path.join(LOG_DIR, 'context-latest.json'), 'utf8'))
  lines.push('## 上下文')
  lines.push('- ' + c.tokens + ' / ' + c.contextWindow + ' = ' + c.percent + '%（阈值 ' + c.threshold + '%）')
  lines.push('')
} catch (e) {}
lines.push('## 说明')
lines.push('- 后端未部署时，接口请求失败属于预期；冒烟只拦截真实 JS 错误。')
lines.push('- 通过标准：pageErrors=0，且所有页面有内容或按预期跳登录。')
const md = lines.join('\n')
const out = path.join(ROOT, 'automation', 'report.md')
fs.writeFileSync(out, md + '\n')
console.log(md)
console.log('\n报告: ' + out)
try {
  const { spawnSync } = await import('node:child_process')
  const m = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'task-matrix.mjs')], { cwd: ROOT, encoding: 'utf8' })
  if (m.stdout) console.log(m.stdout.trim())
} catch (e) {}
process.exit(smoke && smoke.ok === false ? 1 : 0)
