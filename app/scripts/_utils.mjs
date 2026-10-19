import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const LOG_DIR = path.join(ROOT, '.automation')
export const SHOTS_DIR = path.join(LOG_DIR, 'shots')
export const DEV_URL = 'http://127.0.0.1:5174/'

export function ensureDirs() {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.mkdirSync(SHOTS_DIR, { recursive: true })
}

export function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())
}

export function logPath(name) {
  ensureDirs()
  return path.join(LOG_DIR, name + '-' + stamp() + '.log')
}

export function pnpmCommand(args) {
  let execpath = process.env.npm_execpath
  if (execpath && execpath.endsWith('pnpm.mjs')) {
    const cjs = execpath.replace(/pnpm\.mjs$/, 'pnpm.cjs')
    try { if (fs.existsSync(cjs)) execpath = cjs } catch (e) {}
  }
  if (execpath) {
    if (execpath.endsWith('.mjs') || execpath.endsWith('.js') || execpath.endsWith('.cjs')) {
      return { cmd: process.execPath, args: [execpath, ...args], shell: false }
    }
    return { cmd: execpath, args, shell: process.platform === 'win32' }
  }
  return { cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, shell: true }
}

export function runStep(label, command, { timeout = 10 * 60 * 1000 } = {}) {
  ensureDirs()
  const file = logPath(label)
  const out = fs.createWriteStream(file, { flags: 'a' })
  out.write('\n$ ' + command.cmd + ' ' + command.args.join(' ') + '\n')
  console.log('\n▶ ' + label + ': ' + command.cmd + ' ' + command.args.join(' '))
  return new Promise((resolve) => {
    const child = spawn(command.cmd, command.args, {
      cwd: ROOT,
      shell: !!command.shell,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    })
    let timer = null
    const finish = (code, reason) => {
      if (timer) clearTimeout(timer)
      out.write('\n' + (reason || 'exit') + ': ' + code + '\n')
      out.end()
      resolve({ code, log: file })
    }
    child.stdout.on('data', (d) => { process.stdout.write(d); out.write(d) })
    child.stderr.on('data', (d) => { process.stderr.write(d); out.write(d) })
    child.on('error', (e) => { out.write(String(e)); finish(1, 'error') })
    child.on('close', (code) => finish(code == null ? 1 : code))
    timer = setTimeout(() => {
      out.write('\nTIMEOUT\n')
      try { child.kill('SIGTERM') } catch (e) {}
      finish(124, 'timeout')
    }, timeout)
  })
}

export function wait(ms) { return new Promise((r) => setTimeout(r, ms)) }

export async function waitForHttp(url, timeout = 90000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (res.ok) return true
    } catch (e) {}
    await wait(1000)
  }
  return false
}

export function startDevServer() {
  ensureDirs()
  const file = logPath('dev-server')
  const out = fs.createWriteStream(file, { flags: 'a' })
  const cmd = pnpmCommand(['dev:h5'])
  console.log('\n▶ dev server: ' + cmd.cmd + ' ' + cmd.args.join(' '))
  const child = spawn(cmd.cmd, cmd.args, {
    cwd: ROOT,
    shell: !!cmd.shell,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env
  })
  child.stdout.on('data', (d) => { process.stdout.write(d); out.write(d) })
  child.stderr.on('data', (d) => { process.stderr.write(d); out.write(d) })
  child.on('close', (code) => out.end('\nexit: ' + code + '\n'))
  return { child, log: file }
}

export function killTree(child) {
  if (!child || !child.pid) return
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', shell: true })
    } else {
      child.kill('SIGTERM')
    }
  } catch (e) {}
}

export function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean)
  for (const p of candidates) { try { if (fs.existsSync(p)) return p } catch (e) {} }
  return null
}

export function writeReport(name, data) {
  ensureDirs()
  const file = path.join(LOG_DIR, name + '-' + stamp() + '.json')
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  return file
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8'
}

export function killPort(port) {
  try {
    const net = spawnSync('netstat', ['-ano'], { encoding: 'utf8', timeout: 15000 })
    const pids = new Set()
    ;(net.stdout || '').split(/\r?\n/).forEach((line) => {
      if (!new RegExp(':' + port + '\\b').test(line)) return
      const m = line.trim().match(/(\d+)$/)
      if (m && m[1] !== '0') pids.add(m[1])
    })
    for (const pid of pids) spawnSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' })
  } catch (e) {}
}

export function startStaticServer(port = 5174) {
  killPort(port)
  const root = path.join(ROOT, 'dist', 'build', 'h5')
  const index = path.join(root, 'index.html')
  if (!fs.existsSync(index)) throw new Error('未找到 H5 产物，请先 pnpm build:h5: ' + index)
  const server = http.createServer((req, res) => {
    let pathname = '/'
    try { pathname = decodeURIComponent((req.url || '/').split('?')[0]) } catch (e) {}
    if (pathname === '/') pathname = '/index.html'
    const file = path.join(root, pathname)
    if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return }
    fs.readFile(file, (err, data) => {
      if (!err) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' })
        res.end(data)
        return
      }
      fs.readFile(index, (e2, html) => {
        if (e2) { res.writeHead(404); res.end('not found'); return }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
      })
    })
  })
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, '127.0.0.1', () => resolve({ server, root, port }))
  })
}
