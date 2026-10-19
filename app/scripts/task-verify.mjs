import path from 'node:path'
import { ROOT, runStep } from './_utils.mjs'

const node = process.execPath
console.log('\n=== 任务：构建 + 冒烟 ===')
let res = await runStep('verify-build', { cmd: node, args: [path.join(ROOT, 'scripts', 'task-build.mjs')], shell: false })
if (res.code !== 0) process.exit(res.code)
res = await runStep('verify-smoke', { cmd: node, args: [path.join(ROOT, 'scripts', 'task-smoke.mjs')], shell: false })
process.exit(res.code)
