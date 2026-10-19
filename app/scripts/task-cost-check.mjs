import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT } from './_utils.mjs'

// 余额来源约定（任选其一）：
// 1) 环境变量 API_BALANCE_CNY
// 2) 文件 app/automation/api-balance.txt（只写数字，例如 0.42）
// 没有数据源时不做任何动作，避免误判关机。
function readBalance() {
  if (process.env.API_BALANCE_CNY) return Number(process.env.API_BALANCE_CNY)
  const f = path.join(ROOT, 'automation', 'api-balance.txt')
  try { return Number(fs.readFileSync(f, 'utf8').trim()) } catch (e) { return NaN }
}
const balance = readBalance()
if (!Number.isFinite(balance)) {
  console.log('没有 API 余额数据源（API_BALANCE_CNY 或 automation/api-balance.txt），跳过检查')
  process.exit(0)
}
console.log('API 余额：' + balance + ' 元')
if (balance < 0.5) {
  console.log('余额低于 0.5 元，暂停并关机')
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'task-shutdown.mjs'), '--reason=api-balance-low', '--confirm'], { cwd: ROOT, stdio: 'inherit' })
  process.exit(r.status || 0)
}
console.log('余额充足，继续')
