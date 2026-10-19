import fs from 'node:fs'
import path from 'node:path'
import { ROOT, pnpmCommand, runStep, findChrome } from './_utils.mjs'

console.log('\n=== 任务：安装依赖 ===')
let code = 0
let res = await runStep('install', pnpmCommand(['install', '--reporter=append-only']))
code = code || (res.code === 0 ? 0 : 1)
res = await runStep('rebuild', pnpmCommand(['rebuild']))
code = code || (res.code === 0 ? 0 : 1)

let playwrightOk = false
try {
  const pkg = fs.readFileSync(path.join(ROOT, 'node_modules', 'playwright-core', 'package.json'), 'utf8')
  playwrightOk = true
  console.log('✓ playwright-core ' + JSON.parse(pkg).version)
} catch (e) {
  console.log('✗ playwright-core 未安装')
  code = 1
}

const chrome = findChrome()
if (chrome) console.log('✓ 浏览器: ' + chrome)
else console.log('✗ 未找到 Chrome/Edge；请设置 CHROME_PATH 环境变量')

console.log(code === 0 ? '\n安装完成' : '\n安装失败，请查看 .automation/ 日志')
process.exit(code)
