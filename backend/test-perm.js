require('dotenv').config();
const { signToken } = require('./src/config/jwt');
// 模拟一个只拥有 order:write 权限的普通角色管理员
const token = signToken({ id: 99, username: 'test', role: 'admin', role_id: 2, roleId: 2, permissions: ['order:write'] }, '7d');

(async () => {
  const base = 'http://localhost:3000';
  const cases = [
    ['settings(GET,需settings:read → 期望403)', '/api/admin/settings', 'GET'],
    ['orders(GET,需order:read → 期望403)', '/api/admin/orders', 'GET'],
    ['orders(POST,需order:write → 期望200)', '/api/admin/orders', 'POST'],
    ['users(GET,需user:read → 期望403)', '/api/admin/users', 'GET']
  ];
  for (const [name, path, method] of cases) {
    const r = await fetch(base + path, {
      method,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify({ title: 't', userId: 1, amount: 1 }) : undefined
    });
    const body = await r.json().catch(() => ({}));
    console.log(name, '→', r.status, (body.message || ''));
  }
})();
