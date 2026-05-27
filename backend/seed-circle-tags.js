const mysql = require('mysql2/promise');

const tagNames = [
  '游戏', '闲聊', '技术', '娱乐', '情感',
  '音乐', '电影', '美食', '旅行', '宠物',
  '运动', '动漫', '阅读', '摄影', '穿搭',
  '美妆', '健身', '学习', '职场', '校园',
  '亲子', '居家', '搞笑', '才艺', '交友',
  '星座', '数码', '汽车', '财经', '公益'
];

async function seedCircleTags() {
  const connection = await mysql.createConnection({
    host: 'test-db1-mysql.ns-5ios4t6b.svc',
    port: 3306,
    user: 'root',
    password: 'fjbbsppp',
    database: 'duoke_peer'
  });

  console.log('✅ 数据库连接成功');
  console.log('📦 开始注入圈子标签数据...\n');

  const now = Math.floor(Date.now() / 1000);

  try {
    for (let i = 0; i < tagNames.length; i++) {
      await connection.query(`
        INSERT IGNORE INTO xn_circle_tag
        (name, icon, sort_order, status, create_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        tagNames[i],
        null,
        i + 1,
        1,
        now,
        now
      ]);
    }

    console.log(`✅ 圈子标签数据插入完成 (${tagNames.length}条)`);
    console.log('\n📊 标签列表：');
    tagNames.forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });

  } catch (error) {
    console.error('❌ 数据注入失败:', error.message);
  } finally {
    await connection.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

seedCircleTags();
