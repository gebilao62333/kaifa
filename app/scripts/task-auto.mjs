import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { ROOT, LOG_DIR, ensureDirs, stamp } from './_utils.mjs'

const manifestFile = path.join(ROOT, 'automation', 'tasks.json')
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
const tasks = manifest.tasks
const args = process.argv.slice(2)
const only = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1]
const listOnly = args.includes('--list')

if (listOnly) {
  console.log('任务列表：')
  for (const t of tasks) console.log('  ' + t.id.padEnd(12) + ' ' + (t.required ? '[必需]' : '[可选]') + ' ' + t.label + (t.dependsOn ? '  ← ' + t.dependsOn.join(',') : ''))
  process.exit(0)
}

ensureDirs()
const runLog = path.join(LOG_DIR, 'runner-' + stamp() + '.log')
const logStream = fs.createWriteStream(runLog, { flags: 'a' })
function log(line) { console.log(line); logStream.write(line + '\n') }

function ordered() {
  const done = new Set()
  const result = []
  const byId = new Map(tasks.map((t) => [t.id, t]))
  let guard = 0
  while (result.length < tasks.length && guard++ < 100) {
    for (const t of tasks) {
      if (done.has(t.id)) continue
      const deps = t.dependsOn || []
      if (deps.every((d) => done.has(d))) { result.push(t); done.add(t.id) }
    }
  }
  for (const t of tasks) if (!done.has(t.id)) result.push(t)
  return result
}

function runTask(t) {
  return new Promise((resolve) => {
    const started = Date.now()
    log('\n━━━ [' + t.id + '] ' + t.label + ' ━━━')
    const child = spawn(process.execPath, [path.join(ROOT, t.script)], {
      cwd: ROOT,
      env: Object.assign({}, process.env, { AUTOMATION_TASK: t.id }),
      stdio: 'inherit'
    })
    let timer = null
    const finish = (status, extra) => {
      if (timer) clearTimeout(timer)
      const duration = Date.now() - started
      log('━━━ [' + t.id + '] ' + status + ' (' + duration + 'ms)' + (extra && extra.exitCode !== undefined ? ' exit=' + extra.exitCode : '') + ' ━━━')
      resolve({ id: t.id, status, duration, ...extra })
    }
    child.on('error', (e) => finish('fail', { error: e.message }))
    child.on('close', (code) => finish(code === 0 ? 'pass' : 'fail', { exitCode: code }))
    timer = setTimeout(() => {
      log('[' + t.id + '] 超时，终止')
      try { child.kill('SIGTERM') } catch (e) {}
      finish('fail', { error: 'timeout' })
    }, t.timeout || 600000)
  })
}

const results = []
const statusById = new Map()
for (const t of ordered()) {
  if (only && t.id !== only) { statusById.set(t.id, 'skip'); results.push({ id: t.id, status: 'skip' }); continue }
  const deps = t.dependsOn || []
  const depFailed = deps.some((d) => statusById.get(d) === 'fail' || statusById.get(d) === 'skip')
  if (depFailed && !t.alwaysRun) {
    log('\n━━━ [' + t.id + '] skip（依赖未通过: ' + deps.join(',') + '）━━━')
    statusById.set(t.id, 'skip')
    results.push({ id: t.id, status: 'skip' })
    continue
  }
  const r = await runTask(t)
  let status = r.status
  if (status === 'fail' && !t.required) { status = 'warn'; log('[' + t.id + '] 可选任务失败，继续') }
  statusById.set(t.id, status)
  results.push({ id: t.id, status, duration: r.duration, exitCode: r.exitCode, error: r.error })
}

const failed = results.filter((r) => r.status === 'fail')
const summary = {
  at: new Date().toISOString(),
  runLog,
  overall: failed.length ? 'fail' : 'pass',
  results
}
const summaryFile = path.join(ROOT, 'automation', 'run-summary.json')
const md = [
  '# 自动化任务结果',
  '',
  '时间：' + summary.at,
  '总体：' + (summary.overall === 'pass' ? '✅ 通过' : '❌ 失败'),
  '运行日志：' + runLog,
  '',
  '| 任务 | 状态 | 耗时(ms) |',
  '|---|---|---|'
].concat(results.map((r) => '| ' + r.id + ' | ' + r.status + ' | ' + (r.duration || '') + ' |')).join('\n')
fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
fs.writeFileSync(path.join(ROOT, 'automation', 'run-summary.md'), md + '\n')
log('\n总体: ' + summary.overall + '；汇总: ' + summaryFile)
logStream.end()
process.exit(failed.length ? 1 : 0)
