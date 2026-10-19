import { DEV_URL, startDevServer, waitForHttp, killTree } from './_utils.mjs'

console.log('\n=== 任务：启动 H5 开发服务器 ===')
const { child, log } = startDevServer()
const ok = await waitForHttp(DEV_URL)
if (!ok) {
  console.log('启动超时，日志: ' + log)
  killTree(child)
  process.exit(1)
}
console.log('\n✓ H5 已启动: ' + DEV_URL)
console.log('日志: ' + log)
console.log('按 Ctrl+C 停止')

const stop = () => { killTree(child); process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
