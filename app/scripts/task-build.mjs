import fs from 'node:fs'
import path from 'node:path'
import { ROOT, pnpmCommand, runStep } from './_utils.mjs'

console.log('\n=== 任务：构建 H5 ===')
const res = await runStep('build-h5', pnpmCommand(['build:h5']))
const dist = path.join(ROOT, 'dist', 'build', 'h5')
const index = path.join(dist, 'index.html')
if (res.code !== 0) {
  console.log('\n构建失败，日志: ' + res.log)
  process.exit(res.code)
}
if (!fs.existsSync(index)) {
  console.log('\n构建命令成功，但未找到产物: ' + index)
  process.exit(1)
}
const files = fs.readdirSync(path.join(dist, 'assets')).length
const size = fs.readdirSync(path.join(dist, 'assets')).reduce((sum, f) => {
  try { return sum + fs.statSync(path.join(dist, 'assets', f)).size } catch (e) { return sum }
}, 0)
console.log('\n构建成功: ' + dist)
console.log('assets: ' + files + ' 个，约 ' + (size / 1024 / 1024).toFixed(2) + ' MB')
console.log('日志: ' + res.log)
