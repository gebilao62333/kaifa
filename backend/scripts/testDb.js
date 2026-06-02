const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法打开数据库:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到SQLite数据库');
});

const tables = [
  { name: 'xn_user', expected: 50 },
  { name: 'xn_virtual_user', expected: 50 },
  { name: 'xn_post', expected: 50 },
  { name: 'xn_game_order', expected: 50 },
  { name: 'xn_companion_profile', expected: 30 },
  { name: 'xn_chat_log', expected: 100 },
  { name: 'xn_circle_tag', expected: 5 },
  { name: 'xn_game', expected: 5 },
  { name: 'xn_virtual_user_tag', expected: 5 },
  { name: 'xn_gift', expected: 6 }
];

let completed = 0;
let success = 0;
let failed = 0;

console.log('\n📊 开始验证数据库数据...\n');

tables.forEach(table => {
  db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
    completed++;
    if (err) {
      console.error(`❌ ${table.name}: 查询失败 - ${err.message}`);
      failed++;
    } else {
      const count = row.count;
      if (count === table.expected) {
        console.log(`✅ ${table.name}: ${count} 条记录 (预期: ${table.expected}) ✓`);
        success++;
      } else {
        console.log(`⚠️ ${table.name}: ${count} 条记录 (预期: ${table.expected})`);
        failed++;
      }
    }

    if (completed === tables.length) {
      db.close();
      console.log('\n' + '='.repeat(50));
      console.log(`📝 验证完成: ${success} 成功, ${failed} 失败`);
      console.log('='.repeat(50));
    }
  });
});
