/**
 * 真实数据端到端功能冒烟脚本（只读）
 * ------------------------------------------------------------------
 * 目的：用「真实 MySQL」跑通各业务接口，定位 Unknown column / 500 等
 *       在 mock 单测中无法暴露的问题。
 *
 * 安全约束：本脚本只做 **读取** 与「只读型 GET 接口」调用，
 *          不插入/更新/删除任何数据，不执行迁移。
 *
 * 运行（无 node/npm 环境，用 Qoder 的 Electron 作为 node 运行时）：
 *   cd backend
 *   NODE="/c/Users/Administrator/AppData/Local/Programs/Qoder CN/Qoder CN.exe"
 *   ELECTRON_RUN_AS_NODE=1 "$NODE" tests/e2e/real-data-smoke.js
 *
 * 输出：控制台表格 + tests/e2e/report.json + tests/e2e/report.md
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// 使用 development：authMiddleware 走真实 JWT 校验；loginLimiter 自动跳过
process.env.NODE_ENV = 'development';
process.env.AUTO_MIGRATE = 'false';

const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const config = require('../../src/config');
const sequelize = require('../../src/config/mysql');
const setupRoutes = require('../../src/routes');

// ------------------------------------------------------------------
// 构造应用：真实路由 + 真实 DB（不含 mock）
// ------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/api/health', (req, res) =>
  res.json({ code: 200, message: 'OK', data: { status: 'healthy', timestamp: Date.now() } })
);
app.get('/api/test', (req, res) =>
  res.json({ code: 200, message: 'API测试成功', data: { service: 'eu搭子' } })
);
setupRoutes(app);
app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在' }));
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars
  next;
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// ------------------------------------------------------------------
// 令牌：本地用配置中的密钥签发（只读，不改库）
// ------------------------------------------------------------------
const userToken = (uid) =>
  jwt.sign({ userId: uid }, config.jwt.secret, { expiresIn: '1h' });

const USER_A = 1; // 游戏达人小王
const USER_B = 2; // 玩家小美
const TOKEN_A = userToken(USER_A);
const TOKEN_B = userToken(USER_B);
const ADMIN_TOKEN = config.admin.token;

// ------------------------------------------------------------------
// 只读取样 id（供带路径参数的接口使用）
// ------------------------------------------------------------------
async function sampleIds() {
  const one = async (sql) => {
    try {
      const [rows] = await sequelize.query(sql);
      return rows[0] || {};
    } catch (e) {
      return { _err: e.message };
    }
  };
  return {
    postId: (await one('SELECT id FROM xn_post ORDER BY id DESC LIMIT 1')).id,
    companionId: (await one('SELECT user_id FROM xn_companion_profile ORDER BY id LIMIT 1')).user_id,
    orderId: (await one('SELECT id FROM xn_game_order ORDER BY id DESC LIMIT 1')).id,
    reserveId: (await one('SELECT id FROM xn_reserve ORDER BY id DESC LIMIT 1')).id,
    tagId: (await one('SELECT id FROM xn_virtual_user_tag ORDER BY id LIMIT 1')).id,
    demandId: (await one('SELECT id FROM xn_demand ORDER BY id DESC LIMIT 1')).id,
    userIdB: USER_B
  };
}

// ------------------------------------------------------------------
// 用例定义
// ------------------------------------------------------------------
function buildCases(id) {
  const U = { auth: 'user' };
  const N = { auth: 'none' };
  const A = { auth: 'admin' };
  // 依赖外部服务/密钥，未配置时不应算失败（环境项）
  const ENV = { auth: 'user', env: true };
  const today = new Date().toISOString().slice(0, 10);
  return [
    // ---- 公共/无需登录 ----
    ['health', 'GET', '/api/health', N],
    ['test', 'GET', '/api/test', N],
    ['banner/list', 'GET', '/api/banner/list', N],
    ['banner/all', 'GET', '/api/banner/all', N],
    ['splash/active', 'GET', '/api/splash/active', N],
    ['config/home', 'GET', '/api/config/home', N],
    ['notice/list', 'GET', '/api/notice/list', N],
    ['search/hot', 'GET', '/api/search/hot', N],
    ['download/platforms', 'GET', '/api/download/platforms', N],
    ['region/provinces', 'GET', '/api/region/provinces', N],
    ['region/search', 'GET', '/api/region/search?q=' + encodeURIComponent('北京'), N],
    ['games/categories', 'GET', '/api/games/categories', N],
    ['games/companions', 'GET', '/api/games/companions', N],
    ['gift/list', 'GET', '/api/gift/list', N],
    ['vip/packages', 'GET', '/api/vip/packages', N],
    ['pay/packages', 'GET', '/api/pay/packages', N],
    ['circle/tags', 'GET', '/api/circle/tags', N],
    ['circle/posts', 'GET', '/api/circle/posts', N],

    // ---- 需要用户登录 ----
    ['user/get', 'GET', '/api/user/get', U],
    ['user/fans', 'GET', '/api/user/fans', U],
    ['user/follows', 'GET', '/api/user/follows', U],
    ['user/check-follow', 'GET', `/api/user/check-follow?userId=${id.userIdB}`, U],
    ['user/likes', 'GET', '/api/user/likes', U],
    ['user/visitors', 'GET', '/api/user/visitors', U],
    ['user/pref', 'GET', '/api/user/pref', U],
    ['user/real-name', 'GET', '/api/user/real-name', U],
    ['chat/list', 'GET', '/api/chat/list', U],
    ['chat/messages', 'GET', `/api/chat/messages?targetUserId=${id.userIdB}`, U],
    ['games/search', 'GET', '/api/games/search?keyword=%E7%8E%8B', U],
    ['games/pool', 'GET', '/api/games/pool', U],
    ['games/my-services', 'GET', '/api/games/my-services', U],
    ['games/orders', 'GET', '/api/games/orders', U],
    ['games/statistics', 'GET', '/api/games/statistics', U],
    ['games/apply/status', 'GET', '/api/games/apply/status', U],
    ['games/companion-detail', 'GET', `/api/games/companions/${id.companionId}`, U],
    ['circle/my-posts', 'GET', '/api/circle/my-posts', U],
    ['circle/post-detail', 'GET', `/api/circle/post/${id.postId}`, U],
    ['circle/comments', 'GET', `/api/circle/comments?postId=${id.postId}`, U],
    ['circle/share-status', 'GET', `/api/circle/share-status?postId=${id.postId}`, U],
    ['search/posts', 'GET', '/api/search/posts?keyword=%E7%8E%8B', U],
    ['search/games', 'GET', '/api/search/games?keyword=%E7%8E%8B', U],
    ['reserve/list', 'GET', '/api/reserve/list', U],
    ['reserve/slots', 'GET', `/api/reserve/slots?companionId=${id.companionId}&date=${today}`, U],
    ['demand/list', 'GET', '/api/demand/list', U],
    ['wallet/overview', 'GET', '/api/wallet/overview', U],
    ['wallet/income-records', 'GET', '/api/wallet/income-records', U],
    ['wallet/income-breakdown', 'GET', '/api/wallet/income-breakdown', U],
    ['wallet/withdraw-records', 'GET', '/api/wallet/withdraw-records', U],
    ['wallet/expense-records', 'GET', '/api/wallet/expense-records', U],
    ['wallet/expense-overview', 'GET', '/api/wallet/expense-overview', U],
    ['vip/info', 'GET', '/api/vip/info', U],
    ['vip/orders', 'GET', '/api/vip/orders', U],
    ['album/photos', 'GET', '/api/album/photos', U],
    ['trtc/auth', 'GET', '/api/trtc/auth', ENV],
    ['trtc/history', 'GET', '/api/trtc/history', U],
    ['virtual-user/list', 'GET', '/api/virtual-user', U],
    ['tag/defaults', 'GET', '/api/tag/defaults', U],
    ['tag/recommend', 'GET', '/api/tag/recommend', U],
    ['tag/list', 'GET', '/api/tag', U],
    ['report/list', 'GET', '/api/report/list', U],
    ['feedback/my', 'GET', '/api/feedback/my', U],
    ['pay/recharge/list', 'GET', '/api/pay/recharge/list', U],
    ['pay/wallet/balance', 'GET', '/api/pay/wallet/balance', U],
    ['pay/payment/history', 'GET', '/api/pay/payment/history', U],
    ['gift/bag', 'GET', '/api/gift/bag', U],
    ['gift/redpacket/history', 'GET', '/api/gift/redpacket/history', U],
    ['upload/token', 'GET', '/api/upload/token?type=image', ENV],
    // ---- 管理端（只读） ----
    ['admin/dashboard', 'GET', '/api/admin/dashboard', A],
    ['admin/users', 'GET', '/api/admin/users', A],
    ['admin/orders', 'GET', '/api/admin/orders', A],
    ['admin/withdraws', 'GET', '/api/admin/withdraws', A],
    ['admin/posts', 'GET', '/api/admin/posts', A],
    ['admin/reports', 'GET', '/api/admin/reports', A],
    ['admin/banners', 'GET', '/api/admin/banners', A],
    ['admin/splashes', 'GET', '/api/admin/splashes', A],
    ['admin/downloads', 'GET', '/api/admin/downloads', A],
    ['admin/vip-packages', 'GET', '/api/admin/vip-packages', A],
    ['admin/recharge-packages', 'GET', '/api/admin/recharge-packages', A],
    ['admin/gifts', 'GET', '/api/admin/gifts', A],
    ['admin/gift-logs', 'GET', '/api/admin/gift-logs', A],
    ['admin/recharge-records', 'GET', '/api/admin/recharge-records', A],
    ['admin/games', 'GET', '/api/admin/games', A],
    ['admin/companion-applications', 'GET', '/api/admin/companion-applications', A],
    ['admin/virtual-users', 'GET', '/api/admin/virtual-users', A],
    ['admin/cards', 'GET', '/api/admin/cards', A],
    ['admin/card-admins', 'GET', '/api/admin/card-admins', A],
    ['admin/card-admin-stats', 'GET', '/api/admin/card-admin-stats', A],
    ['admin/settings', 'GET', '/api/admin/settings', A],
    ['admin/finance/stats', 'GET', '/api/admin/finance/stats', A],
    ['admin/statistics', 'GET', '/api/admin/statistics', A]
  ];
}

// ------------------------------------------------------------------
// 执行
// ------------------------------------------------------------------
function authHeaders(auth) {
  if (auth === 'user') return { Authorization: `Bearer ${TOKEN_A}` };
  if (auth === 'adminUser') return { Authorization: `Bearer ${TOKEN_B}` };
  if (auth === 'admin') return { 'x-admin-token': ADMIN_TOKEN };
  return {};
}

async function run() {
  console.log('\n=== 真实数据端到端冒烟（只读） ===');
  await sequelize.authenticate();
  console.log('✅ MySQL 已连接：', config.db.mysql.host, '/', config.db.mysql.name);

  const id = await sampleIds();
  console.log('取样 id：', JSON.stringify(id));

  const cases = buildCases(id);
  const results = [];
  let pass = 0, warn = 0, fail = 0, skip = 0;

  for (const [name, method, url, opts] of cases) {
    const started = Date.now();
    let status = 0, code = null, message = '', dataHint = '';
    try {
      const res = await request(app)[method.toLowerCase()](url).set(authHeaders(opts.auth));
      status = res.status;
      code = res.body && res.body.code;
      message = (res.body && res.body.message) || '';
      if (res.body && res.body.data && typeof res.body.data === 'object') {
        dataHint = Array.isArray(res.body.data)
          ? `array(${res.body.data.length})`
          : Object.keys(res.body.data).slice(0, 6).join(',');
      }
    } catch (e) {
      status = -1;
      message = e.message;
    }
    const ms = Date.now() - started;

    let verdict;
    if (status === 200 && (code === 200 || code === undefined)) { verdict = 'PASS'; pass++; }
    else if (opts.env) { verdict = 'SKIP'; skip++; } // 外部服务/密钥未配置，不算代码缺陷
    else if (status >= 500 || status === -1) { verdict = 'FAIL'; fail++; }
    else { verdict = 'WARN'; warn++; }

    results.push({ name, method, url, auth: opts.auth || 'none', status, code, message, dataHint, ms, verdict });
    const icon = verdict === 'PASS' ? '✅' : verdict === 'WARN' ? '⚠️ ' : verdict === 'SKIP' ? '⏭️ ' : '❌';
    console.log(`${icon} [${verdict}] ${name.padEnd(30)} ${status} ${String(code).padEnd(5)} ${String(ms).padStart(5)}ms  ${message}`);
  }

  console.log(`\n=== 汇总：PASS ${pass} / WARN ${warn} / SKIP ${skip} / FAIL ${fail}（共 ${results.length}） ===`);

  // 落盘
  const outDir = __dirname;
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), ids: id, pass, warn, skip, fail, results }, null, 2));
  const md = [
    '# 真实数据端到端冒烟报告（只读）',
    '',
    `- 生成时间：${new Date().toISOString()}`,
    `- MySQL：${config.db.mysql.host}/${config.db.mysql.name}`,
    `- 结果：PASS ${pass} / WARN ${warn} / SKIP ${skip} / FAIL ${fail}（共 ${results.length}）`,
    '',
    '| 结果 | 用例 | 方法 | 路径 | 状态码 | code | 备注 |',
    '|---|---|---|---|---|---|---|',
    ...results.map((r) => `| ${r.verdict} | ${r.name} | ${r.method} | \`${r.url}\` | ${r.status} | ${r.code} | ${r.message} |`),
    ''
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'report.md'), md);
  console.log('📄 报告：tests/e2e/report.json / report.md');

  await sequelize.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(async (e) => {
  console.error('❌ 运行失败：', e);
  try { await sequelize.close(); } catch (_) { /* ignore */ }
  process.exit(2);
});
