import fs from 'node:fs'
import path from 'node:path'
import { ROOT, pnpmCommand, runStep } from './_utils.mjs'

console.log('\n=== 任务：构建 App 资源（CLI） ===')
const res = await runStep('build-app', pnpmCommand(['build:app']))
const out = path.join(ROOT, 'dist', 'build', 'app')
if (res.code !== 0) {
  console.log('\nApp 资源构建失败（可选任务，不阻塞 H5）。日志: ' + res.log)
  process.exit(res.code)
}
const exists = fs.existsSync(out)
let manifestOk = false
let serviceSize = 0
if (exists) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'))
    const permissions = JSON.stringify(manifest.plus && manifest.plus.distribute && manifest.plus.distribute.google && manifest.plus.distribute.google.permissions || [])
    manifestOk = permissions.includes('CAMERA') && permissions.includes('RECORD_AUDIO')
    serviceSize = fs.statSync(path.join(out, 'app-service.js')).size
  } catch (e) {}
}
console.log('\n' + (exists ? '构建成功: ' + out : '命令成功但未找到 ' + out))
console.log('manifest 权限: ' + (manifestOk ? 'OK（相机/麦克风）' : '未校验通过') + '，app-service.js=' + serviceSize + ' bytes')
console.log('日志: ' + res.log)
process.exit(exists && manifestOk && serviceSize > 0 ? 0 : 1)
