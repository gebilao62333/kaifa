import fs from 'node:fs'
import path from 'node:path'
import { ROOT, findChrome } from './_utils.mjs'

console.log('\n=== 任务：环境检查 ===')
const checks = []
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail: detail || '' })
  console.log((ok ? '✓ ' : '✗ ') + name + (detail ? '  ' + detail : ''))
}
const major = Number(process.versions.node.split('.')[0])
check('Node >= 22', major >= 22, process.version)
check('node_modules 已安装', fs.existsSync(path.join(ROOT, 'node_modules')))
for (const pkg of ['@dcloudio/vite-plugin-uni', '@dcloudio/uni-h5', 'vue', 'pinia', 'socket.io-client', 'playwright-core']) {
  const f = path.join(ROOT, 'node_modules', pkg, 'package.json')
  let version = ''
  try { version = JSON.parse(fs.readFileSync(f, 'utf8')).version } catch (e) {}
  check('依赖 ' + pkg, !!version, version)
}
const chrome = findChrome()
check('Chrome/Edge', !!chrome, chrome || '可用 CHROME_PATH 指定')
check('manifest.json', fs.existsSync(path.join(ROOT, 'src', 'manifest.json')))
check('pages.json', fs.existsSync(path.join(ROOT, 'src', 'pages.json')))
check('Legacy 跳转脚本', fs.existsSync(path.join(ROOT, 'src', 'static', 'legacy-redirect.js')))
const failed = checks.filter((c) => !c.ok)
console.log('\n检查结果: ' + (failed.length ? failed.length + ' 项未通过' : '全部通过'))
process.exit(failed.length ? 1 : 0)
