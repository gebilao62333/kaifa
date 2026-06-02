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

const tableFields = {
  xn_post: [
    { name: 'private_password', type: 'TEXT' },
    { name: 'private_price', type: 'REAL DEFAULT 0' },
    { name: 'is_private', type: 'INTEGER DEFAULT 0' },
    { name: 'visibility', type: 'INTEGER DEFAULT 0' },
    { name: 'password', type: 'TEXT' },
    { name: 'share_num', type: 'INTEGER DEFAULT 0' },
    { name: 'type', type: 'INTEGER DEFAULT 0' },
    { name: 'videos', type: 'TEXT' },
    { name: 'tag_ids', type: 'TEXT' }
  ],
  xn_user: [
    { name: 'email', type: 'TEXT' },
    { name: 'open_id', type: 'TEXT' },
    { name: 'unionid', type: 'TEXT' },
    { name: 'gift_money_zong', type: 'REAL DEFAULT 0' },
    { name: 'jinyan_time', type: 'INTEGER DEFAULT 0' },
    { name: 'is_dav', type: 'INTEGER DEFAULT 0' },
    { name: 'is_manage_normal', type: 'INTEGER DEFAULT 0' },
    { name: 'last_login_time', type: 'INTEGER DEFAULT 0' },
    { name: 'ip', type: 'TEXT' },
    { name: 'platform', type: 'TEXT' }
  ],
  xn_game: [
    { name: 'image', type: 'TEXT' },
    { name: 'image_bg', type: 'TEXT' },
    { name: 'icon', type: 'TEXT' }
  ],
  xn_companion_profile: [
    { name: 'user_id', type: 'INTEGER' },
    { name: 'intro', type: 'TEXT' },
    { name: 'online_status', type: 'INTEGER DEFAULT 0' },
    { name: 'game_ids', type: 'TEXT' },
    { name: 'price_per_hour', type: 'REAL DEFAULT 0' }
  ]
};

let completedTables = 0;
const totalTables = Object.keys(tableFields).length;

const checkAndAddFields = (tableName, fields) => {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`❌ 检查 ${tableName} 表失败:`, err.message);
      completedTables++;
      checkDone();
      return;
    }
    
    const columnNames = columns.map(c => c.name);
    
    fields.forEach(field => {
      if (!columnNames.includes(field.name)) {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${field.name} ${field.type}`, (err) => {
          if (err) {
            console.error(`❌ ${tableName} 添加 ${field.name} 字段失败:`, err.message);
          } else {
            console.log(`✅ ${tableName}.${field.name} 字段已添加`);
          }
        });
      }
    });
    
    setTimeout(() => {
      completedTables++;
      checkDone();
    }, 300);
  });
};

const checkDone = () => {
  if (completedTables >= totalTables) {
    console.log('\n✅ 所有数据表结构修复完成！');
    db.close();
  }
};

console.log('\n🔧 修复所有数据表结构...');

Object.entries(tableFields).forEach(([tableName, fields]) => {
  checkAndAddFields(tableName, fields);
});
