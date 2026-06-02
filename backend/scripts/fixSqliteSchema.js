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

db.serialize(() => {
  console.log('\n🔧 修复数据表结构...');

  // 检查并添加 xn_game 表的 image 和 image_bg 字段
  db.all("PRAGMA table_info(xn_game)", (err, columns) => {
    if (err) {
      console.error('❌ 检查 xn_game 表失败:', err.message);
      return;
    }
    
    const columnNames = columns.map(c => c.name);
    
    if (!columnNames.includes('image')) {
      db.run("ALTER TABLE xn_game ADD COLUMN image TEXT", (err) => {
        if (err) console.error('❌ 添加 image 字段失败:', err.message);
        else console.log('✅ 已添加 xn_game.image 字段');
      });
    }
    
    if (!columnNames.includes('image_bg')) {
      db.run("ALTER TABLE xn_game ADD COLUMN image_bg TEXT", (err) => {
        if (err) console.error('❌ 添加 image_bg 字段失败:', err.message);
        else console.log('✅ 已添加 xn_game.image_bg 字段');
      });
    }
  });

  // 检查并添加 xn_user 表的 email 字段
  db.all("PRAGMA table_info(xn_user)", (err, columns) => {
    if (err) {
      console.error('❌ 检查 xn_user 表失败:', err.message);
      return;
    }
    
    const columnNames = columns.map(c => c.name);
    
    if (!columnNames.includes('email')) {
      db.run("ALTER TABLE xn_user ADD COLUMN email TEXT", (err) => {
        if (err) console.error('❌ 添加 email 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.email 字段');
      });
    }
    
    if (!columnNames.includes('open_id')) {
      db.run("ALTER TABLE xn_user ADD COLUMN open_id TEXT", (err) => {
        if (err) console.error('❌ 添加 open_id 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.open_id 字段');
      });
    }
    
    if (!columnNames.includes('unionid')) {
      db.run("ALTER TABLE xn_user ADD COLUMN unionid TEXT", (err) => {
        if (err) console.error('❌ 添加 unionid 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.unionid 字段');
      });
    }
    
    if (!columnNames.includes('gift_money_zong')) {
      db.run("ALTER TABLE xn_user ADD COLUMN gift_money_zong REAL DEFAULT 0", (err) => {
        if (err) console.error('❌ 添加 gift_money_zong 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.gift_money_zong 字段');
      });
    }
    
    if (!columnNames.includes('jinyan_time')) {
      db.run("ALTER TABLE xn_user ADD COLUMN jinyan_time INTEGER DEFAULT 0", (err) => {
        if (err) console.error('❌ 添加 jinyan_time 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.jinyan_time 字段');
      });
    }
    
    if (!columnNames.includes('is_dav')) {
      db.run("ALTER TABLE xn_user ADD COLUMN is_dav INTEGER DEFAULT 0", (err) => {
        if (err) console.error('❌ 添加 is_dav 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.is_dav 字段');
      });
    }
    
    if (!columnNames.includes('is_manage_normal')) {
      db.run("ALTER TABLE xn_user ADD COLUMN is_manage_normal INTEGER DEFAULT 0", (err) => {
        if (err) console.error('❌ 添加 is_manage_normal 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.is_manage_normal 字段');
      });
    }
    
    if (!columnNames.includes('last_login_time')) {
      db.run("ALTER TABLE xn_user ADD COLUMN last_login_time INTEGER DEFAULT 0", (err) => {
        if (err) console.error('❌ 添加 last_login_time 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.last_login_time 字段');
      });
    }
    
    if (!columnNames.includes('ip')) {
      db.run("ALTER TABLE xn_user ADD COLUMN ip TEXT", (err) => {
        if (err) console.error('❌ 添加 ip 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.ip 字段');
      });
    }
    
    if (!columnNames.includes('platform')) {
      db.run("ALTER TABLE xn_user ADD COLUMN platform TEXT", (err) => {
        if (err) console.error('❌ 添加 platform 字段失败:', err.message);
        else console.log('✅ 已添加 xn_user.platform 字段');
      });
    }
  });

  // 检查并添加 xn_companion_profile 表的字段
  db.all("PRAGMA table_info(xn_companion_profile)", (err, columns) => {
    if (err) {
      console.error('❌ 检查 xn_companion_profile 表失败:', err.message);
      return;
    }
    
    const columnNames = columns.map(c => c.name);
    
    if (!columnNames.includes('user_id')) {
      console.log('⚠️ xn_companion_profile 表缺少 user_id 字段，需要重新创建表');
    }
  });

  setTimeout(() => {
    console.log('\n✅ 数据表结构修复完成！');
    db.close();
  }, 1000);
});
