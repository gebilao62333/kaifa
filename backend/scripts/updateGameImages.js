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

const gameImages = [
  { id: 1, image: 'https://picsum.photos/200/200?random=game1', image_bg: 'https://picsum.photos/800/400?random=bg1' },
  { id: 2, image: 'https://picsum.photos/200/200?random=game2', image_bg: 'https://picsum.photos/800/400?random=bg2' },
  { id: 3, image: 'https://picsum.photos/200/200?random=game3', image_bg: 'https://picsum.photos/800/400?random=bg3' },
  { id: 4, image: 'https://picsum.photos/200/200?random=game4', image_bg: 'https://picsum.photos/800/400?random=bg4' },
  { id: 5, image: 'https://picsum.photos/200/200?random=game5', image_bg: 'https://picsum.photos/800/400?random=bg5' }
];

db.serialize(() => {
  console.log('\n🖼️ 更新游戏图片数据...');
  
  const stmt = db.prepare('UPDATE xn_game SET image = ?, image_bg = ? WHERE id = ?');
  
  gameImages.forEach(game => {
    stmt.run(game.image, game.image_bg, game.id, (err) => {
      if (err) {
        console.error(`❌ 更新游戏 ${game.id} 失败:`, err.message);
      } else {
        console.log(`✅ 已更新游戏 ${game.id} 图片`);
      }
    });
  });
  
  stmt.finalize();
  
  setTimeout(() => {
    console.log('\n✅ 游戏图片更新完成！');
    db.close();
  }, 500);
});
