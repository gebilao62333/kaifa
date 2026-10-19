import path from 'node:path'
import { ROOT, runStep } from './_utils.mjs'

const node = process.execPath
const tasks = ['task-install.mjs', 'task-build.mjs', 'task-smoke.mjs']
console.log('\n=== 任务：全流程 ===')
for (const t of tasks) {
  const res = await runStep(t.replace('.mjs', ''), { cmd: node, args: [path.join(ROOT, 'scripts', t)], shell: false })
  if (res.code !== 0) {
    console.log('\n全流程中断于: ' + t + '，日志: ' + res.log)
    process.exit(res.code)
  }
}
console.log('\n全流程完成')
