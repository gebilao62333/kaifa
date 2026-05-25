const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'test-db1-mysql.ns-5ios4t6b.svc',
    port: 3306,
    user: 'root',
    password: 'fjbbsppp',
    database: 'duoke_peer'
  });

  console.log('✅ 数据库连接成功\n');

  try {
    const [users] = await connection.query('SELECT COUNT(*) as count FROM xn_user');
    console.log(`📊 用户总数: ${users[0].count}`);

    const [list] = await connection.query('SELECT id, username, nickname, mobile, status FROM xn_user ORDER BY id DESC LIMIT 25');
    console.log('\n📋 最新用户列表：');
    console.log('┌────┬─────────────┬────────────┬───────────────┬────────┐');
    console.log('│ ID │ 用户名      │ 昵称       │ 手机号        │ 状态   │');
    console.log('├────┼─────────────┼────────────┼───────────────┼────────┤');
    list.forEach(u => {
      console.log(`│ ${String(u.id).padEnd(2)} │ ${u.username.padEnd(11)} │ ${(u.nickname || '').padEnd(10)} │ ${u.mobile.padEnd(13)} │ ${u.status === 1 ? '正常' : '禁用'}   │`);
    });
    console.log('└────┴─────────────┴────────────┴───────────────┴────────┘');

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsers();
