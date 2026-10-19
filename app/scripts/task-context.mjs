import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import zlib from 'node:zlib'
import { ROOT, LOG_DIR, ensureDirs, stamp } from './_utils.mjs'

const threshold = Number((process.argv.find((a) => a.startsWith('--threshold=')) || '--threshold=70').split('=')[1]) || 70
const workspaceDir = '--' + path.resolve(ROOT, '..').replace(/:/g, '').replace(/[\\/]/g, '-') + '--'
const sessionRoot = path.join(os.homedir(), '.dsh', 'sessions', workspaceDir)
const magic = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

function newestSession() {
  let best = null
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name === 'session.v4.jsonl.zstd') {
        const m = fs.statSync(p).mtimeMs
        if (!best || m > best.mtimeMs) best = { file: p, mtimeMs: m }
      }
    }
  }
  try { walk(sessionRoot) } catch (e) {}
  return best
}

function decode(file) {
  const buf = fs.readFileSync(file)
  const idxs = []
  let i = 0
  while ((i = buf.indexOf(magic, i)) !== -1) { idxs.push(i); i += 4 }
  let text = ''
  for (let k = 0; k < idxs.length; k++) {
    const start = idxs[k]
    const end = k + 1 < idxs.length ? idxs[k + 1] : buf.length
    try { text += zlib.zstdDecompressSync(buf.slice(start, end)).toString('utf8') } catch (e) {}
  }
  return text
}

const session = newestSession()
if (!session) { console.log('未找到会话文件，跳过上下文检查'); process.exit(0) }
let text = ''
try { text = decode(session.file) } catch (e) { console.log('读取会话失败: ' + e.message); process.exit(0) }
const lines = text.split('\n').filter(Boolean)
let contextWindow = 0
let usage = null
for (const line of lines) {
  try {
    const j = JSON.parse(line)
    if (j.type === 'request/context' && j.data && j.data.contextWindow) contextWindow = Number(j.data.contextWindow)
    if (j.type === 'assistant/message' && j.data && j.data.usage) usage = j.data.usage
  } catch (e) {}
}
if (!usage || !contextWindow) { console.log('会话里没有 usage/contextWindow，跳过'); process.exit(0) }
const used = Number(usage.totalTokens || 0) + Number(usage.inputTokens || 0) + Number(usage.outputTokens || 0)
// totalTokens 通常已包含 input+cache+output；取三者与 total 的最大值，避免重复计算
const tokens = Math.max(Number(usage.totalTokens || 0), Number(usage.inputTokens || 0) + Number(usage.cacheReadTokens || 0) + Number(usage.outputTokens || 0))
const percent = (tokens / contextWindow) * 100
const out = {
  at: new Date().toISOString(),
  session: session.file,
  contextWindow,
  tokens,
  percent: Number(percent.toFixed(2)),
  threshold,
  overThreshold: percent >= threshold
}
ensureDirs()
fs.writeFileSync(path.join(LOG_DIR, 'context-' + stamp() + '.json'), JSON.stringify(out, null, 2))
fs.writeFileSync(path.join(LOG_DIR, 'context-latest.json'), JSON.stringify(out, null, 2))
console.log('上下文: ' + out.tokens + ' / ' + contextWindow + ' = ' + out.percent + '%（阈值 ' + threshold + '%）')
if (percent >= threshold) {
  console.log('已达上下文阈值，建议暂停并新开对话')
  process.exit(2)
}
process.exit(0)
