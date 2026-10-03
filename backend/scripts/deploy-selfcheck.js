#!/usr/bin/env node
/**
 * 部署自检（在 Sealos 的 backend 容器/宿主机里执行）
 *
 *   node scripts/deploy-selfcheck.js
 *   node scripts/deploy-selfcheck.js --base http://127.0.0.1:3000   # 指定后端地址
 *
 * 覆盖：环境变量完整性 → 弱密钥 → MySQL/Redis/Mongo 连通与结构 → 存储可用性
 *      → HTTP 健康检查 → 管理员登录（可选，需 --admin-pass）
 * 只读为主，不修改任何数据；不会打印任何密钥明文。
 * 退出码：存在 FAIL 为 1。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const http = require('http');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://127.0.0.1:' + (process.env.PORT || 3000));

const results = [];
const add = (level, area, msg) => results.push({ level, area, msg });
const ok = (a, m) => add('PASS', a, m);
const warn = (a, m) => add('WARN', a, m);
const fail = (a, m) => add('FAIL', a, m);

const get = (url, headers) => new Promise((resolve) => {
  const req = http.get(url, { headers: headers || {}, timeout: 8000 }, (res) => {
    let b = '';
    res.on('data', (d) => (b += d));
    res.on('end', () => resolve({ status: res.statusCode, body: b }));
  });
  req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
  req.on('error', () => resolve({ status: 0, body: '' }));
});

(async () => {
  // ---------- 1. 环境变量 ----------
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'JWT_SECRET', 'ADMIN_TOKEN', 'REDIS_HOST', 'REDIS_PORT', 'MONGO_URI'];
  const missing = required.filter((k) => !process.env[k]);
  missing.length ? fail('env', '缺少必需变量: ' + missing.join(', ')) : ok('env', '必需变量齐全（' + required.length + ' 项）');
  if (!process.env.LOGS_PATH) warn('env', '未设置 LOGS_PATH，日志将落在容器内相对路径（建议设为 /var/log/eudazi）');
  if (!process.env.STORAGE_PROVIDER) warn('env', '未设置 STORAGE_PROVIDER，默认 local');

  // ---------- 2. 弱密钥 ----------
  const weak = ['DB_PASSWORD', 'JWT_SECRET', 'ADMIN_TOKEN', 'REDIS_PASSWORD'].filter((k) => {
    const v = String(process.env[k] || '');
    return v && (v.length < 24 || /(changeme|change-me|admin-secret|your-|123456|admin123|eudazi)/i.test(v));
  });
  weak.length ? fail('secret', '仍为弱值/占位值: ' + weak.join(', ')) : ok('secret', '未检测到弱密钥');

  // ---------- 3. 数据库 ----------
  let sequelize = null;
  try {
    sequelize = require('../src/config/mysql');
    await sequelize.authenticate();
    ok('mysql', '连接成功 ' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME);
    const [tables] = await sequelize.query('SHOW TABLES');
    tables.length >= 40 ? ok('mysql', '表数量 ' + tables.length) : warn('mysql', '表数量偏少: ' + tables.length + '（是否漏跑迁移/初始化 SQL？）');
    const [cardKey] = await sequelize.query("SHOW COLUMNS FROM xn_card LIKE 'card_key'");
    cardKey.length ? ok('mysql', 'xn_card.card_key 存在（密卡充值可用）') : fail('mysql', 'xn_card.card_key 缺失 → 请执行 node src/migrations/runMigrations.js');
    const [ipCol] = await sequelize.query("SHOW COLUMNS FROM xn_user LIKE 'ip'");
    if (ipCol.length && /varchar\((\d+)\)/i.test(ipCol[0].Type) && Number(RegExp.$1) >= 45) ok('mysql', 'xn_user.ip 已放宽为 VARCHAR(45)');
    else warn('mysql', 'xn_user.ip 类型为 ' + (ipCol[0] ? ipCol[0].Type : '?') + '（手动迁移 20261003000002 可能未执行）');
  } catch (e) {
    fail('mysql', '连接/查询失败: ' + e.message);
  }

  // Redis
  try {
    const redisConfig = require('../src/config/redis');
    if (!redisConfig.getRedisClient || !redisConfig.getRedisClient()) {
      // 独立运行脚本时连接尚未建立，这里显式建立一次再校验
      if (typeof redisConfig.connectRedis === 'function') await redisConfig.connectRedis();
    }
    const client = redisConfig.getRedisClient ? redisConfig.getRedisClient() : null;
    if (client) { const pong = await client.ping(); pong ? ok('redis', '连接成功') : warn('redis', 'ping 返回 ' + pong); }
    else warn('redis', '未取得客户端实例（Mock 模式？）');
  } catch (e) { fail('redis', '检查失败: ' + e.message); }

  // Mongo
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      const connectMongo = require('../src/config/mongo');
      if (typeof connectMongo === 'function') await connectMongo();
    }
    const state = mongoose.connection.readyState;
    state === 1 ? ok('mongo', '连接成功') : warn('mongo', 'readyState=' + state + '（0=未连接）');
  } catch (e) { warn('mongo', '检查跳过: ' + e.message); }

  // ---------- 4. 存储 ----------
  try {
    const config = require('../src/config');
    const uploadService = require('../src/services/uploadService');
    const chain = uploadService.getStorageProviderChain();
    ok('storage', 'provider 链: ' + chain.join(' → '));
    const dir = config.paths.uploads;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, '.selfcheck.tmp');
    fs.writeFileSync(probe, 'x');
    fs.unlinkSync(probe);
    ok('storage', '上传目录可写: ' + dir);
    const configured = String(process.env.STORAGE_PROVIDER || '');
    if (configured && !chain.includes('local')) ok('storage', '未使用本地存储（全部走远端 provider）');
    else if (configured && !configured.includes('local')) warn('storage', '配置未显式包含 local，已作为兜底注入: ' + chain.join(' → '));
  } catch (e) { fail('storage', '检查失败: ' + e.message); }

  // ---------- 5. HTTP ----------
  const health = await get(BASE + '/api/health');
  if (health.status === 200) {
    let deps = {};
    try { deps = JSON.parse(health.body).data.dependencies || {}; } catch (e) {}
    const down = Object.keys(deps).filter((k) => deps[k] !== 'up' && k !== 'timestamp');
    down.length ? fail('http', '/api/health 依赖异常: ' + down.map((k) => k + '=' + deps[k]).join(', ')) : ok('http', '/api/health 正常，依赖 ' + Object.keys(deps).filter((k) => k !== 'timestamp').join('/') + ' 均 up');
  } else {
    fail('http', BASE + '/api/health 不可用（status=' + health.status + '）');
  }

  const anon = await get(BASE + '/api/admin/users');
  anon.status === 403 ? ok('http', '管理接口匿名访问被拒（403）') : fail('http', '管理接口匿名访问返回 ' + anon.status + '，应为 403');

  // ---------- 6. 管理员登录（可选） ----------
  const adminUser = arg('admin-user', 'admin');
  const adminPass = arg('admin-pass', '');
  if (adminPass) {
    const body = JSON.stringify({ username: adminUser, password: adminPass });
    const res = await new Promise((resolve) => {
      const req = http.request(BASE + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 8000 }, (r) => {
        let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => resolve({ status: r.statusCode, body: b }));
      });
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
      req.on('error', () => resolve({ status: 0, body: '' }));
      req.write(body); req.end();
    });
    if (res.status === 200) ok('admin', '管理员登录成功: ' + adminUser);
    else fail('admin', '管理员登录失败（status=' + res.status + '）');
  } else {
    warn('admin', '未提供 --admin-pass，跳过登录校验');
  }

  if (sequelize) { try { await sequelize.close(); } catch (e) {} }

  // ---------- 汇总 ----------
  const counts = { PASS: 0, WARN: 0, FAIL: 0 };
  for (const r of results) counts[r.level]++;
  for (const r of results) console.log('[' + r.level + '] ' + r.area.padEnd(9) + r.msg);
  console.log('\n===== 自检汇总: PASS ' + counts.PASS + ' / WARN ' + counts.WARN + ' / FAIL ' + counts.FAIL + ' =====');
  process.exit(counts.FAIL > 0 ? 1 : 0);
})().catch((e) => { console.error('自检异常:', e.message); process.exit(2); });
