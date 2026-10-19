import { pnpmCommand, runStep } from './_utils.mjs'

console.log('\n=== 任务：单元测试（vitest） ===')
const res = await runStep('test', pnpmCommand(['test']))
if (res.code !== 0) console.log('\n单元测试失败，日志: ' + res.log)
process.exit(res.code)
