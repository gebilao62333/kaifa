const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const departments = ['运营部', '技术部', '客服部', '市场部', '财务部', '产品部', '人事部', '行政部'];
const names = ['张伟', '王芳', '李明', '刘洋', '陈静', '杨帆', '赵磊', '黄丽', '周杰', '吴敏', 
               '徐强', '孙婷', '马超', '朱红', '胡军', '郭燕', '林峰', '何雪', '高飞', '罗琳'];

function generatePhone() {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '186', '187', '188'];
  return prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(Math.random() * 90000000 + 10000000);
}

async function seedAdmins() {
  const connection = await mysql.createConnection({
    host: 'test-db1-mysql.ns-5ios4t6b.svc',
    port: 3306,
    user: 'root',
    password: 'fjbbsppp',
    database: 'duoke_peer'
  });

  console.log('✅ 数据库连接成功');
  console.log('📦 开始注入管理员数据...\n');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const now = Math.floor(Date.now() / 1000);

  try {
    console.log('📝 插入管理员数据...');
    
    for (let i = 1; i <= 20; i++) {
      const username = `admin_${i}`;
      const nickname = names[i - 1];
      const email = `admin${i}@duoke.com`;
      const phone = generatePhone();
      const department = departments[(i - 1) % departments.length];
      
      await connection.query(`
        INSERT IGNORE INTO xn_admin 
        (username, password, nickname, avatar, email, phone, role_id, permissions, status, create_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        username,
        hashedPassword,
        nickname,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=admin${i}`,
        email,
        phone,
        i <= 3 ? 1 : 2,
        JSON.stringify(['user:read', 'user:list', 'order:read', 'report:read']),
        1,
        now
      ]);
    }
    
    console.log('✅ 管理员数据插入完成 (20条)');

    console.log('\n🎉 数据注入完成！');
    console.log('\n📊 管理员账号列表：');
    console.log('┌─────────────┬────────────┬─────────────────┐');
    console.log('│ 用户名      │ 密码       │ 角色           │');
    console.log('├─────────────┼────────────┼─────────────────┤');
    for (let i = 1; i <= 20; i++) {
      const role = i <= 3 ? '超级管理员' : '普通管理员';
      console.log(`│ admin_${String(i).padEnd(7)} │ admin123   │ ${role.padEnd(11)} │`);
    }
    console.log('└─────────────┴────────────┴─────────────────┘');

  } catch (error) {
    console.error('❌ 数据注入失败:', error.message);
  } finally {
    await connection.end();
  }
}

seedAdmins();
