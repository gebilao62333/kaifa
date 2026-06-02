const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法打开数据库:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到SQLite数据库\n');
});

console.log('=== 数据验证报告 ===\n');

db.serialize(() => {
  db.get('SELECT COUNT(*) as count FROM xn_user', (err, row) => {
    console.log(`👥 用户表 (xn_user): ${row?.count || 0} 条记录`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_companion_profile', (err, row) => {
    console.log(`🎮 陪玩师资料表 (xn_companion_profile): ${row?.count || 0} 条记录`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_companion_profile WHERE status = 1', (err, row) => {
    console.log(`   └─ 状态为1(可见)的陪玩师: ${row?.count || 0} 条`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_companion_profile WHERE online_service = 1 AND offline_service = 1', (err, row) => {
    console.log(`   └─ 同时开通线上+线下服务: ${row?.count || 0} 条`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_companion_profile WHERE online_service = 1 AND offline_service = 0', (err, row) => {
    console.log(`   └─ 仅开通线上服务: ${row?.count || 0} 条`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_companion_profile WHERE online_service = 0 AND offline_service = 1', (err, row) => {
    console.log(`   └─ 仅开通线下服务: ${row?.count || 0} 条`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_post', (err, row) => {
    console.log(`📝 动态表 (xn_post): ${row?.count || 0} 条记录`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_game_order', (err, row) => {
    console.log(`📋 订单表 (xn_game_order): ${row?.count || 0} 条记录`);
  });

  db.get('SELECT COUNT(*) as count FROM xn_game', (err, row) => {
    console.log(`🎲 游戏表 (xn_game): ${row?.count || 0} 条记录`);
  });
});

setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库失败:', err.message);
    } else {
      console.log('\n✅ 数据验证完成！');
    }
  });
}, 1000);