/**
 * 全量接口覆盖矩阵（对真实运行中的后端逐一调用）
 * - GET        ：user -> admin -> 匿名 依次探测，取最优结果
 * - 非 GET     ：仅匿名调用，验证「路由已挂载 + 鉴权守卫生效」，不触发任何写入
 * 用法：先启动后端（3000），再 cd backend && node tests/e2e/api-matrix.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
process.env.NODE_ENV = 'development';
process.env.AUTO_MIGRATE = 'false';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const sequelize = require('../../src/config/mysql');

const BASE = process.env.MATRIX_BASE || 'http://127.0.0.1:3000';

// 前置：后端未运行则自动拉起（AUTO_MIGRATE=false，避免测试期间改结构）
const { spawn } = require('child_process');
const http = require('http');
const healthCheck = () => new Promise((resolve) => {
  const req = http.get(BASE + '/api/health', { timeout: 3000 }, (r) => { r.resume(); resolve(r.statusCode === 200); });
  req.on('error', () => resolve(false));
  req.on('timeout', () => { req.destroy(); resolve(false); });
});
const ensureBackend = async () => {
  if (await healthCheck()) return;
  console.log('后端未运行，正在自动拉起 server.js ...');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '../..'),
    env: Object.assign({}, process.env, { AUTO_MIGRATE: 'false' }),
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1200));
    if (await healthCheck()) { console.log('后端已就绪'); return; }
  }
  throw new Error('后端启动失败，请先手动运行: cd backend && node server.js');
};

// ---------- 1. 枚举全部路由 ----------
const indexSrc = fs.readFileSync(path.resolve(__dirname, '../../src/routes/index.js'), 'utf8');
const pairs = [];
const re = /path:\s*'\.\/([A-Za-z0-9_]+)'[\s\S]{0,60}?prefix:\s*'([^']+)'/g;
let m;
while ((m = re.exec(indexSrc))) pairs.push({ mod: m[1], prefix: m[2] });

const routes = [];
for (const p of pairs) {
  let router;
  try { router = require('../../src/routes/' + p.mod); } catch (e) { console.log('LOADFAIL ' + p.mod + ': ' + e.message); continue; }
  for (const layer of (router && router.stack) || []) {
    if (!layer.route) continue;
    for (const meth of Object.keys(layer.route.methods)) {
      if (meth === '_all') continue;
      routes.push({ method: meth.toUpperCase(), path: p.prefix + layer.route.path, module: p.mod });
    }
  }
}
routes.sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)));

// ---------- 2. 真实 id 取样 ----------
async function one(sql) {
  try { const rows = (await sequelize.query(sql))[0]; return rows[0] ? Object.values(rows[0])[0] : null; } catch (e) { return null; }
}
async function sampleIds() {
  const t = {};
  t.userId = await one('SELECT id FROM xn_user ORDER BY id LIMIT 1');
  t.postId = await one('SELECT id FROM xn_post ORDER BY id DESC LIMIT 1');
  t.commentId = await one('SELECT id FROM xn_post_comment ORDER BY id DESC LIMIT 1');
  t.bannerId = await one('SELECT id FROM xn_banner ORDER BY id LIMIT 1');
  t.splashId = await one('SELECT id FROM xn_splash_screen ORDER BY id LIMIT 1');
  t.giftId = await one('SELECT id FROM xn_gift ORDER BY id LIMIT 1');
  t.giftBagId = await one('SELECT id FROM xn_gift_bag ORDER BY id LIMIT 1');
  t.redPacketId = await one('SELECT id FROM xn_red_packet ORDER BY id LIMIT 1');
  t.vipPackageId = await one('SELECT id FROM xn_vip_package ORDER BY id LIMIT 1');
  t.rechargePackageId = await one('SELECT id FROM xn_recharge_package ORDER BY id LIMIT 1');
  t.gameId = await one('SELECT id FROM xn_game ORDER BY id LIMIT 1');
  t.orderId = await one('SELECT id FROM xn_game_order ORDER BY id DESC LIMIT 1');
  t.reserveId = await one('SELECT id FROM xn_reserve ORDER BY id DESC LIMIT 1');
  t.slotId = await one('SELECT id FROM xn_reserve_slot ORDER BY id LIMIT 1');
  t.reportId = await one('SELECT id FROM xn_report ORDER BY id DESC LIMIT 1');
  t.feedbackId = await one('SELECT id FROM xn_feedback ORDER BY id DESC LIMIT 1');
  t.demandId = await one('SELECT id FROM xn_demand ORDER BY id DESC LIMIT 1');
  t.photoId = await one('SELECT id FROM xn_album_photo ORDER BY id LIMIT 1');
  t.virtualUserId = await one('SELECT id FROM xn_virtual_user ORDER BY id LIMIT 1');
  t.tagId = await one('SELECT id FROM xn_virtual_user_tag ORDER BY id LIMIT 1');
  t.cardId = await one('SELECT id FROM xn_card ORDER BY id LIMIT 1');
  t.adminId = await one('SELECT id FROM xn_admin ORDER BY id LIMIT 1');
  t.roleId = await one('SELECT id FROM xn_admin_role ORDER BY id LIMIT 1');
  t.withdrawId = await one('SELECT id FROM xn_withdraw ORDER BY id DESC LIMIT 1');
  t.chatRoomId = await one('SELECT id FROM xn_chat_room ORDER BY id DESC LIMIT 1');
  t.companionUserId = await one('SELECT user_id FROM xn_companion_profile ORDER BY id LIMIT 1');
  t.companionProfileId = await one('SELECT id FROM xn_companion_profile ORDER BY id LIMIT 1');
  t.mediaAssetId = await one('SELECT id FROM xn_media_asset ORDER BY id LIMIT 1');
  t.id = t.userId || 1;
  return t;
}

const PREFIX_ID = [
  ['/api/admin-manage/roles', 'roleId'], ['/api/admin-manage/admins', 'adminId'],
  ['/api/admin/banners', 'bannerId'], ['/api/admin/splashes', 'splashId'],
  ['/api/admin/cards', 'cardId'], ['/api/admin/games', 'gameId'], ['/api/admin/gifts', 'giftId'],
  ['/api/admin/posts', 'postId'], ['/api/admin/recharge-packages', 'rechargePackageId'],
  ['/api/admin/reports', 'reportId'], ['/api/admin/users', 'userId'],
  ['/api/admin/vip-packages', 'vipPackageId'], ['/api/admin/withdraws', 'withdrawId'],
  ['/api/admin/companion-applications', 'companionProfileId'],
  ['/api/admin/virtual-users', 'virtualUserId'],
  ['/api/admin/gift-logs', 'giftId'], ['/api/admin/orders', 'orderId'],
  ['/api/circle/post', 'postId'], ['/api/circle/comments', 'postId'],
  ['/api/games/companions', 'companionUserId'], ['/api/games/orders', 'orderId'],
  ['/api/reserve/slots', 'companionUserId'], ['/api/reserve', 'reserveId'],
  ['/api/report', 'reportId'], ['/api/feedback', 'feedbackId'], ['/api/demand', 'demandId'],
  ['/api/album', 'photoId'], ['/api/virtual-user', 'virtualUserId'], ['/api/tag', 'tagId'],
  ['/api/vip', 'vipPackageId'], ['/api/chat', 'chatRoomId'], ['/api/wallet', 'withdrawId'],
  ['/api/upload', 'mediaAssetId']
];
function pickId(routePath) {
  for (const item of PREFIX_ID) if (routePath.indexOf(item[0]) === 0) return item[1];
  return 'id';
}
function fillPath(p, ids) {
  return p.replace(/:([A-Za-z0-9_]+)/g, function (all, name) {
    const key = pickId(p);
    const v = ids[key];
    return (v === null || v === undefined) ? '1' : String(v);
  });
}
function queryFor(p) {
  if (p.indexOf('search') >= 0) return '?keyword=' + encodeURIComponent('王');
  if (p.indexOf('/comments') >= 0) return '?postId=1';
  return '';
}

// ---------- 3. HTTP ----------
async function call(method, url, headers) {
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + url, { method: method, headers: headers || {}, signal: AbortSignal.timeout(20000) });
    const txt = await res.text();
    let body = null;
    try { body = JSON.parse(txt); } catch (e) { body = null; }
    return { status: res.status, code: body ? body.code : null, message: ((body && body.message) || txt || '').toString().slice(0, 140), ms: Date.now() - t0 };
  } catch (e) {
    return { status: -1, code: null, message: String((e && e.message) || e), ms: Date.now() - t0 };
  }
}
function rank(r) {
  if (r.status === 200) return 0;
  if (r.status >= 200 && r.status < 300) return 1;
  if (r.status === 404) return 3;
  if (r.status === 400 || r.status === 422) return 4;
  if (r.status === 401 || r.status === 403) return 5;
  if (r.status >= 500 || r.status === -1) return 9;
  return 6;
}

(async function run() {
  await ensureBackend();
  await sequelize.authenticate();
  const ids = await sampleIds();
  const TOKEN_USER = jwt.sign({ userId: ids.userId }, config.jwt.secret, { expiresIn: '2h' });
  const H_USER = { Authorization: 'Bearer ' + TOKEN_USER };
  const H_ADMIN = { 'x-admin-token': config.admin.token };
  const H_NONE = {};

  console.log('路由总数: ' + routes.length + '   取样 id: ' + JSON.stringify(ids).slice(0, 300));

  const results = [];
  let pass = 0, warn = 0, fail = 0, security = 0;
  for (const rt of routes) {
    const url = fillPath(rt.path, ids) + queryFor(rt.path);
    if (rt.method === 'GET') {
      const attempts = [];
      attempts.push({ auth: 'user', r: await call('GET', url, H_USER) });
      if (rank(attempts[0].r) !== 0) attempts.push({ auth: 'admin', r: await call('GET', url, H_ADMIN) });
      if (rank(attempts[0].r) !== 0 && (!attempts[1] || rank(attempts[1].r) !== 0)) attempts.push({ auth: 'none', r: await call('GET', url, H_NONE) });
      let best = attempts[0];
      for (const a of attempts) if (rank(a.r) < rank(best.r)) best = a;
      const r = best.r;
      let verdict;
      if (rank(r) <= 1) { verdict = 'PASS'; pass++; }
      else if (rank(r) >= 9) { verdict = 'FAIL'; fail++; }
      else { verdict = 'WARN'; warn++; }
      results.push({ method: 'GET', path: rt.path, url: url, module: rt.module, auth: best.auth, status: r.status, code: r.code, message: r.message, ms: r.ms, verdict: verdict });
    } else {
      const r = await call(rt.method, url, H_NONE);
      let verdict;
      if (r.status === 401 || r.status === 403) { verdict = 'GUARD'; pass++; }
      else if (r.status >= 200 && r.status < 300) { verdict = 'NO-AUTH-WRITE'; security++; fail++; }
      else if (r.status >= 500 || r.status === -1) { verdict = 'FAIL'; fail++; }
      else { verdict = 'WARN'; warn++; }
      results.push({ method: rt.method, path: rt.path, url: url, module: rt.module, auth: 'none', status: r.status, code: r.code, message: r.message, ms: r.ms, verdict: verdict });
    }
  }

  const fails = results.filter(function (x) { return x.verdict === 'FAIL' || x.verdict === 'NO-AUTH-WRITE'; });
  const warns = results.filter(function (x) { return x.verdict === 'WARN'; });
  console.log('\n=== 汇总: PASS/GUARD ' + pass + ' / WARN ' + warn + ' / FAIL ' + fail + '（共 ' + results.length + '） ===');
  console.log('FAIL 明细:');
  for (const f of fails) console.log('  [' + f.verdict + '] ' + f.method + ' ' + f.url + ' -> ' + f.status + ' ' + f.code + ' ' + f.message);

  const out = { generatedAt: new Date().toISOString(), base: BASE, ids: ids, total: results.length, pass: pass, warn: warn, fail: fail, security: security, results: results };
  fs.writeFileSync(path.resolve(__dirname, 'api-matrix-report.json'), JSON.stringify(out, null, 1));
  const md = ['# 全量接口覆盖矩阵', '', '- 生成时间: ' + out.generatedAt, '- 目标: ' + BASE + '（真实后端进程 + 真实云库）',
    '- 汇总: PASS/GUARD ' + pass + ' / WARN ' + warn + ' / FAIL ' + fail + '（共 ' + results.length + '）', '',
    '| 结果 | 方法 | 路径 | 鉴权 | 状态码 | code | 备注 |', '|---|---|---|---|---|---|---|']
    .concat(results.map(function (x) { return '| ' + x.verdict + ' | ' + x.method + ' | ' + x.path + ' | ' + x.auth + ' | ' + x.status + ' | ' + x.code + ' | ' + String(x.message).replace(/\|/g, '/') + ' |'; })).join('\n');
  fs.writeFileSync(path.resolve(__dirname, 'api-matrix-report.md'), md);
  await sequelize.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch(function (e) { console.error('运行失败: ' + e.stack); process.exit(2); });
