import fs from 'node:fs'
import path from 'node:path'
import { ROOT, pnpmCommand, runStep, findChrome } from './_utils.mjs'

console.log('\n=== 任务：安装依赖 ===')
let code = 0
let res = await runStep('install', pnpmCommand(['install', '--reporter=append-only']))
code = code || (res.code === 0 ? 0 : 1)
// rebuild 是「重跑依赖的 postinstall」的最佳努力步骤：
// 在 npx/corepack 调用的 pnpm 下，Windows 生命周期脚本可能找不到 node（PATH 被 pnpm 重置），
// 但依赖在 install 阶段已经完成安装/构建，后续 test/build/smoke 会验证依赖是否可用。
res = await runStep('rebuild', pnpmCommand(['rebuild']))
if (res.code !== 0) {
  console.log('⚠ pnpm rebuild 未成功（不影响已安装依赖，继续验证 test/build/smoke）')
}

// App 构建（含 uni_modules UTS 插件）需要 uni-uts-v1 编译器
try {
  const pkg = fs.readFileSync(path.join(ROOT, 'node_modules', '@dcloudio', 'uni-uts-v1', 'package.json'), 'utf8')
  console.log('✓ @dcloudio/uni-uts-v1 ' + JSON.parse(pkg).version)
} catch (e) {
  console.log('✗ @dcloudio/uni-uts-v1 未安装（App 构建会失败）')
  code = 1
}

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
