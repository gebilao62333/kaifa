const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: 'test-db1-mysql.ns-5ios4t6b.svc',
    port: 3306,
    user: 'root',
    password: 'fjbbsppp',
    multipleStatements: true
  });

  console.log('✅ MySQL 连接成功');

  await connection.query(`CREATE DATABASE IF NOT EXISTS duoke_peer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log('✅ 数据库 duoke_peer 创建成功');

  await connection.changeUser({ database: 'duoke_peer' });

  const sqlFiles = [
    'init_schema.sql',
    'init_data.sql',
    'init_admin_system.sql'
  ];

  for (const file of sqlFiles) {
    const filePath = path.join(__dirname, 'sql', file);
    if (fs.existsSync(filePath)) {
      console.log(`📄 执行: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await connection.query(sql);
      console.log(`✅ ${file} 执行成功`);
    } else {
      console.log(`⚠️  文件不存在: ${file}`);
    }
  }

  await connection.end();
  console.log('\n🎉 数据库初始化完成！');
}

initDatabase().catch(err => {
  console.error('❌ 初始化失败:', err.message);
  process.exit(1);
});
