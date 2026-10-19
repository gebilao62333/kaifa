import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, LOG_DIR, ensureDirs, stamp } from './_utils.mjs'

const args = process.argv.slice(2)
const reason = (args.find((a) => a.startsWith('--reason=')) || '--reason=unknown').split('=')[1]
const confirm = args.includes('--confirm')
ensureDirs()
const marker = path.join(ROOT, 'automation', 'allow-shutdown')
if (!fs.existsSync(marker)) {
  console.log('未找到 automation/allow-shutdown，拒绝自动关机')
  process.exit(2)
}
if (!confirm) {
  console.log('缺少 --confirm，拒绝自动关机。用法: node scripts/task-shutdown.mjs --reason=tasks-complete --confirm')
  process.exit(2)
}

const logFile = path.join(LOG_DIR, 'shutdown-' + stamp() + '.log')
const lines = []
function log(s) { console.log(s); lines.push(s) }
log('自动关机关机请求：' + reason)
log('时间：' + new Date().toISOString())

// 1) 先落报告/进度
try {
  const report = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'task-report.mjs')], { cwd: ROOT, stdio: 'inherit' })
  log('task-report exit=' + report.status)
} catch (e) { log('task-report error: ' + e.message) }

// 2) 只清理 5174 端口的 dev server，绝不 taskkill 所有 node（避免杀掉 agent）
try {
  const net = spawnSync('netstat', ['-ano'], { encoding: 'utf8', timeout: 10000 })
  const pids = new Set()
  ;(net.stdout || '').split(/\r?\n/).forEach((line) => {
    if (!/:5174\b/.test(line)) return
    const m = line.trim().match(/(\d+)$/)
    if (m && m[1] !== '0') pids.add(m[1])
  })
  for (const pid of pids) {
    log('结束 5174 端口进程 pid=' + pid)
    spawnSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' })
  }
} catch (e) { log('清理 dev server 失败: ' + e.message) }

// 3) 写关机记录
fs.writeFileSync(logFile, lines.join('\n') + '\n')

// 4) 关机（60 秒延迟，可 shutdown /a 取消）
if (process.platform === 'win32') {
  log('执行 shutdown /s /t 60')
  const r = spawnSync('shutdown', ['/s', '/t', '60', '/c', 'kaifa automation finished: ' + reason], { stdio: 'ignore' })
  log('shutdown exit=' + r.status)
} else {
  log('非 Windows 平台，跳过自动关机，请手动处理')
}
