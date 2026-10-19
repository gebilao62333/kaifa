import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { ROOT, DEV_URL, SHOTS_DIR, startDevServer, startStaticServer, waitForHttp, wait, killTree, findChrome, writeReport } from './_utils.mjs'
import { ROUTES } from '../src/common/routes.js'

const chrome = findChrome()
if (!chrome) {
  console.log('未找到 Chrome/Edge，请设置 CHROME_PATH')
  process.exit(2)
}

const SKIP = new Set([])
const PAGES = ROUTES.filter((r) => !SKIP.has(r.view)).map((r) => {
  const params = (r.path.match(/:([^/]+)/g) || []).map((k) => k.slice(1))
  const qs = params.map((k) => k + '=1').join('&')
  return { name: r.name, view: r.view, path: r.page.slice(1) + (qs ? '?' + qs : ''), requiresAuth: !!r.requiresAuth }
})
PAGES.push({ name: 'NotFound', view: 'NotFound', path: 'pages/NotFound', requiresAuth: false })

console.log('\n=== 任务：H5 全页面冒烟 ===')
console.log('浏览器: ' + chrome + '，页面数: ' + PAGES.length)
const useDev = process.argv.includes('--dev')
let child = null
let staticInfo = null
let log = ''
let browser = null
const errors = { pageErrors: [], consoleErrors: [], failedRequests: [] }
const ignoredConsole = /(Failed to load resource|ERR_CONNECTION_REFUSED|NetworkError|net::ERR|Request failed|timeout|favicon|RequestError|服务器繁忙|加载.*失败|网络错误|请求失败|socket|websocket|WebSocket|NotAllowedError|Permission|麦克风|摄像头|play\(\)|autoplay|AudioContext|Unable to connect)/i

async function screenshot(page, name) {
  const file = path.join(SHOTS_DIR, name + '.png')
  try { await page.screenshot({ path: file, fullPage: false }) } catch (e) {}
  return file
}

async function snapshot(page, name) {
  const info = { name, url: page.url(), title: await page.title().catch(() => ''), text: '', appLength: 0, globalUiLength: 0, bottomNav: 0 }
  try { info.text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200) } catch (e) {}
  try { info.appLength = await page.locator('#app').evaluate((el) => el.innerHTML.length) } catch (e) {}
  try { info.globalUiLength = await page.locator('#__global_ui__').evaluate((el) => el.innerHTML.length) } catch (e) {}
  try { info.bottomNav = await page.locator('.bottom-nav').count() } catch (e) {}
  info.screenshot = await screenshot(page, name)
  return info
}

try {
  if (!useDev && fs.existsSync(path.join(ROOT, 'dist', 'build', 'h5', 'index.html'))) {
    staticInfo = await startStaticServer(5174)
    log = 'static:' + staticInfo.root
    console.log('使用静态预览: ' + staticInfo.root)
  } else {
    const dev = startDevServer()
    child = dev.child
    log = dev.log
  }
  const up = await waitForHttp(DEV_URL)
  if (!up) throw new Error('开发服务器启动超时: ' + log)
  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] })
  // 注入测试 token，绕过登录守卫，让受保护页面也能渲染并暴露运行时错误
  await context.addInitScript(() => {
    try { localStorage.setItem('token', 'e2e-smoke-token') } catch (e) {}
  })
  const page = await context.newPage()

  page.on('pageerror', (e) => errors.pageErrors.push({ url: page.url(), message: e.message || String(e) }))
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const text = m.text()
      if (!ignoredConsole.test(text)) errors.consoleErrors.push({ url: page.url(), message: text })
    }
  })
  page.on('requestfailed', (r) => {
    const u = r.url()
    if (/\/api(\/|$)/.test(u) || /favicon/.test(u) || /socket\.io/.test(u)) return
    errors.failedRequests.push({ url: u, error: r.failure() ? r.failure().errorText : '' })
  })

  // 旧路径兼容
  await page.goto(DEV_URL + 'login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await wait(2000)
  const legacyLogin = await snapshot(page, 'legacy-login')
  const LEGACY_CHECKS = [
    { path: 'post-detail/1', expect: '/pages/PostDetail' },
    { path: 'chat-room/1', expect: '/pages/ChatRoom' },
    { path: 'user/1', expect: '/pages/UserProfile' },
    { path: 'call/1/audio?incoming=1&mode=webrtc', expect: '/pages/AudioCall' }
  ]
  const legacyResults = []
  // 未知路径应落到 NotFound
  await page.goto(DEV_URL + 'this-path-does-not-exist', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await wait(1500)
  const notFoundSnap = await snapshot(page, 'not-found')
  const notFoundOk = notFoundSnap.url.includes('/pages/NotFound') && notFoundSnap.appLength > 100
  for (const c of LEGACY_CHECKS) {
    await page.goto(DEV_URL + c.path, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await wait(1200)
    const snap = await snapshot(page, 'legacy-' + c.path.replace(/[^a-z0-9]+/gi, '-'))
    legacyResults.push({ path: c.path, expect: c.expect, url: snap.url, ok: snap.url.includes(c.expect), appLength: snap.appLength })
  }

  const results = []
  for (const item of PAGES) {
    const beforeErrors = errors.pageErrors.length
    await page.goto(DEV_URL + item.path, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await wait(1200)
    const shot = await snapshot(page, item.name)
    shot.view = item.view
    shot.pageErrors = errors.pageErrors.length - beforeErrors
    shot.requiresAuth = item.requiresAuth
    results.push(shot)
  }

  // 首页 -> 底部导航“广场”
  await page.goto(DEV_URL + 'pages/Home', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await wait(1500)
  let navJump = null
  try {
    const items = page.locator('.bottom-nav .nav-item')
    if (await items.count() >= 2) {
      await items.nth(1).click()
      await wait(1200)
      navJump = await snapshot(page, 'nav-square')
    }
  } catch (e) { navJump = { error: e.message } }

  // 登录 + 首页数据（拦截 /api，验证端到端流程，不依赖后端）
  let loginFlow = null
  try {
    const apiContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
    await apiContext.route('**/api/**', async (route) => {
      const url = route.request().url()
      const json = (body) => route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) })
      if (url.includes('/api/user/login')) return json({ code: 200, data: { token: 'mock-token', userId: 1, nickname: '测试用户' } })
      if (url.includes('/api/pay/redeem-key')) return json({ code: 200, data: { amount: 1000 } })
      if (url.includes('/api/wallet/overview')) return json({ code: 200, data: { totalAssets: 1234, grossIncome: 5678, todayIncome: 12, todayExpense: 3, totalWithdraw: 100 } })
      if (url.includes('/api/wallet/income-breakdown')) return json({ code: 200, data: { list: [{ name: '礼物', amount: 100 }] } })
      if (url.includes('/api/pay/wallet/balance')) return json({ code: 200, data: { balance: 1000 } })
      if (url.includes('/api/wallet/withdraw')) return json({ code: 200, data: {} })
      if (url.includes('/api/wallet/withdraw-records')) return json({ code: 200, data: { list: [], total: 0 } })
      if (url.includes('/api/banner/list')) return json({ code: 200, data: { list: [{ id: 1, image: '', title: '测试Banner', link: '' }] } })
      if (url.includes('/api/games/companions')) return json({ code: 200, data: { list: [{ userId: 9, nickname: '测试陪玩', avatar: '', level: 5, servicePrice: 30, city: '北京', tags: ['王者'], online: true }], total: 1 } })
      return json({ code: 200, data: { list: [], total: 0 } })
    })
    const lp = await apiContext.newPage()
    lp.on('pageerror', (e) => errors.pageErrors.push({ url: lp.url(), message: 'login-flow: ' + (e.message || String(e)) }))
    await lp.goto(DEV_URL + 'pages/Login', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await wait(800)
    await lp.fill('input[type=tel]', '13800138000')
    await lp.fill('input[type=password]', '123456')
    await lp.click('.login-btn')
    await wait(2200)
    const token = await lp.evaluate(() => localStorage.getItem('token'))
    const text = (await lp.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300)
    let cardRecharge = null
    try {
      await lp.goto(DEV_URL + 'pages/CardRecharge', { waitUntil: 'domcontentloaded', timeout: 60000 })
      await lp.waitForSelector('.key-input input', { timeout: 15000 })
      await lp.fill('.key-input input', '12345-67890-12345-67890-12345')
      await wait(200)
      await lp.click('.submit-btn')
      await wait(1200)
      const cardText = (await lp.locator('body').innerText()).replace(/\s+/g, ' ')
      cardRecharge = { text: cardText.slice(0, 240), success: cardText.includes('充值成功') && cardText.includes('1000') }
    } catch (e) { cardRecharge = { error: e.message } }
    let withdraw = null
    try {
      await lp.goto(DEV_URL + 'pages/Withdraw', { waitUntil: 'domcontentloaded', timeout: 60000 })
      await lp.waitForSelector('.amount-input input', { timeout: 15000 })
      await lp.fill('.amount-input input', '100')
      const receiverInputs = lp.locator('.receiver-input input')
      await receiverInputs.nth(0).fill('张三')
      await receiverInputs.nth(1).fill('test@alipay.com')
      await wait(200)
      await lp.click('.withdraw-btn')
      await wait(2000)
      const wText = (await lp.locator('body').innerText()).replace(/\s+/g, ' ')
      withdraw = { url: lp.url(), text: wText.slice(0, 220), success: wText.includes('提现申请已提交') || lp.url().includes('/pages/WithdrawRecords') }
    } catch (e) { withdraw = { error: e.message } }
    let wallet = null
    try {
      await lp.goto(DEV_URL + 'pages/Wallet', { waitUntil: 'domcontentloaded', timeout: 60000 })
      await wait(1000)
      const walletText = (await lp.locator('body').innerText()).replace(/\s+/g, ' ')
      wallet = { text: walletText.slice(0, 260), success: walletText.includes('我的钱包') && walletText.includes('1234.00') }
    } catch (e) { wallet = { error: e.message } }
    loginFlow = { url: lp.url(), token, text, homeHasMockData: text.includes('测试陪玩'), cardRecharge, wallet, withdraw }
    await apiContext.close()
  } catch (e) {
    loginFlow = { error: e.message }
  }

  const okPages = results.every((r) => r.appLength > 100 || r.pageErrors > 0) && legacyResults.every((r) => r.ok) && notFoundOk && !!loginFlow && loginFlow.token === 'mock-token' && !loginFlow.error && !!loginFlow.cardRecharge && loginFlow.cardRecharge.success && !!loginFlow.wallet && loginFlow.wallet.success && !!loginFlow.withdraw && loginFlow.withdraw.success
  const report = {
    ok: errors.pageErrors.length === 0 && okPages,
    baseUrl: DEV_URL,
    chrome,
    devLog: log,
    legacyLogin,
    legacyResults,
    notFound: { url: notFoundSnap.url, appLength: notFoundSnap.appLength, ok: notFoundOk },
    loginFlow,
    pages: results,
    navJump,
    errors
  }
  const reportFile = writeReport('smoke', report)
  console.log('\n旧路径 /login -> ' + legacyLogin.url)
  for (const r of results) console.log((r.pageErrors ? '[JS错] ' : '[ok] ') + String(r.view || r.name).padEnd(20) + ' app=' + String(r.appLength).padEnd(6) + ' nav=' + r.bottomNav + (r.pageErrors ? ' errors=' + r.pageErrors : ''))
  if (navJump && !navJump.error) console.log('导航跳转: ' + navJump.url)
  console.log((notFoundOk ? '[404 ok] ' : '[404错] ') + notFoundSnap.url)
  console.log('[login] ' + JSON.stringify(loginFlow))
  for (const r of legacyResults) console.log((r.ok ? '[legacy ok] ' : '[legacy错] ') + r.path + ' -> ' + r.url)
  console.log('\npageErrors=' + errors.pageErrors.length + ' consoleErrors=' + errors.consoleErrors.length + ' failedRequests=' + errors.failedRequests.length)
  if (errors.pageErrors.length) console.log('pageErrors: ' + JSON.stringify(errors.pageErrors.slice(0, 10), null, 2))
  if (errors.consoleErrors.length) console.log('consoleErrors: ' + JSON.stringify(errors.consoleErrors.slice(0, 10), null, 2))
  console.log('截图: ' + SHOTS_DIR)
  console.log('报告: ' + reportFile)
  if (!report.ok) process.exitCode = 1
} catch (e) {
  console.error('\n冒烟测试异常: ' + (e && e.message ? e.message : e))
  process.exitCode = 1
} finally {
  if (browser) { try { await browser.close() } catch (e) {} }
  if (staticInfo) { try { staticInfo.server.close() } catch (e) {} }
  if (child) killTree(child)
}
