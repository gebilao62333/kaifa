const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/example_db.sqlite');

db.serialize(() => {
  db.run("UPDATE xn_circle_tag SET name = '最热' WHERE id = 1", (err) => {
    if (err) {
      console.error('更新标签1失败:', err);
    } else {
      console.log('✅ 标签1已更新为"最热"');
    }
  });
  
  db.run("UPDATE xn_circle_tag SET name = '新手报到' WHERE id = 2", (err) => {
    if (err) {
      console.error('更新标签2失败:', err);
    } else {
      console.log('✅ 标签2已更新为"新手报到"');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库失败:', err);
  } else {
    console.log('\n📊 数据库更新完成');
  }
});