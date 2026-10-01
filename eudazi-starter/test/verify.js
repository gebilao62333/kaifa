// 启动与逻辑验证：纯逻辑单测 + HTTP 冒烟测试，无需安装额外依赖。
// 运行：node test/verify.js
const assert = require('assert');
const createApp = require('../src/app');
const downloadService = require('../src/services/downloadService');

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;

let passed = 0;
const ok = (name) => { passed++; console.log(`  ✅ ${name}`); };

async function logicTests() {
  console.log('\n[1] 业务逻辑层（Service）单测');
  const initial = downloadService.list().list;
  const initialCount = initial.length;
  ok(`初始下载项数量 = ${initialCount}`);

  // create：验证 XSS 转义后的链接在输出时被正确解码
  const created = downloadService.create({
    platform: 'ios', version: '2.0.0',
    url: 'https://apps.apple.com/cn/app/eudazi', size: '45MB', sort: 10, status: 1,
  });
  assert.strictEqual(created.platform, 'ios');
  assert.strictEqual(created.url, 'https://apps.apple.com/cn/app/eudazi');
  ok('create 返回解码后的真实下载地址');

  assert.strictEqual(downloadService.list().list.length, initialCount + 1);
  ok('create 后列表数量 +1');

  // update
  const updated = downloadService.update(created.id, { status: 0 });
  assert.strictEqual(updated.status, 0);
  ok('update 修改状态生效');

  // publicPlatforms：停用项被排除（种子项 url 为空本就被过滤，此处 created 已停用）
  assert.strictEqual(downloadService.publicPlatforms().length, 0);
  ok('停用的项不会出现在公开下载列表');

  // getRedirectUrl：为种子 ios 项（id=1）配置地址后验证（避免与新建项平台冲突）
  const seedIos = downloadService.detail(1);
  downloadService.update(1, { url: 'https://apps.apple.com/cn/app/seed', status: 1 });
  assert.strictEqual(downloadService.getRedirectUrl('ios'), 'https://apps.apple.com/cn/app/seed');
  ok('getRedirectUrl 返回解码地址');
  downloadService.update(1, { url: seedIos.url, status: seedIos.status }); // 还原种子项

  // 非法平台拦截
  assert.throws(() => downloadService.create({ platform: 'wp', url: 'x' }), /平台不合法/);
  ok('非法平台被拒绝（code=400）');

  // remove 恢复初始数量
  downloadService.remove(created.id);
  assert.strictEqual(downloadService.list().list.length, initialCount);
  ok('remove 后列表恢复初始数量');
}

async function httpTests() {
  console.log('\n[2] HTTP 冒烟测试');
  const app = createApp();
  const server = app.listen(PORT);
  await new Promise((r) => server.once('listening', r));

  const health = await fetch(`${BASE}/api/health`).then(r => r.json());
  assert.strictEqual(health.code, 200);
  ok('GET /api/health 正常');

  const login = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  }).then(r => r.json());
  assert.strictEqual(login.code, 200);
  assert.ok(login.data.token);
  ok('POST /api/admin/login 返回 token');
  const token = login.data.token;

  const noAuth = await fetch(`${BASE}/api/admin/downloads`).then(r => r.json());
  assert.strictEqual(noAuth.code, 403);
  ok('未带 token 访问后台接口被拒(403)');

  const list = await fetch(`${BASE}/api/admin/downloads`, { headers: { 'x-admin-token': token } }).then(r => r.json());
  assert.strictEqual(list.code, 200);
  ok('带 token 获取下载列表成功');

  const created = await fetch(`${BASE}/api/admin/downloads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ platform: 'android', version: '3.1.0', url: 'https://eudazi.com/apk/eudazi.apk', status: 1 }),
  }).then(r => r.json());
  assert.strictEqual(created.code, 201);
  ok('POST 新增下载项成功(201)');

  const pub = await fetch(`${BASE}/api/download/platforms`).then(r => r.json());
  assert.strictEqual(pub.code, 200);
  const android = pub.data.find(d => d.platform === 'android');
  assert.strictEqual(android.url, 'https://eudazi.com/apk/eudazi.apk');
  ok('公开接口返回解码后的安卓下载地址');

  const del = await fetch(`${BASE}/api/admin/downloads/${created.data.id}`, { method: 'DELETE', headers: { 'x-admin-token': token } }).then(r => r.json());
  assert.strictEqual(del.code, 200);
  ok('DELETE 删除下载项成功');

  server.close();
}

(async () => {
  try {
    await logicTests();
    await httpTests();
    console.log(`\n🎉 全部 ${passed} 项验证通过！项目可正常启动与运行。\n`);
    process.exit(0);
  } catch (e) {
    console.error('\n❌ 验证失败:', e.message);
    process.exit(1);
  }
})();
