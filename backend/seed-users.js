const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '重庆', '天津', '长沙', '郑州', '青岛'];
const platforms = ['wechat', 'qq', 'apple', 'android'];
const names = ['张伟', '王芳', '李明', '刘洋', '陈静', '杨帆', '赵磊', '黄丽', '周杰', '吴敏', 
               '徐强', '孙婷', '马超', '朱红', '胡军', '郭燕', '林峰', '何雪', '高飞', '罗琳'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomItem(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function generateTime() {
  return Math.floor(Date.now() / 1000) - randomInt(0, 365 * 24 * 3600);
}

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: 'test-db1-mysql.ns-5ios4t6b.svc',
    port: 3306,
    user: 'root',
    password: 'fjbbsppp',
    database: 'duoke_peer'
  });

  console.log('✅ 数据库连接成功');
  console.log('📦 开始注入普通用户数据...\n');

  const hashedPassword = await bcrypt.hash('123456', 10);

  try {
    console.log('📝 插入普通用户数据...');
    
    for (let i = 101; i <= 120; i++) {
      const mobile = `13900${String(i).padStart(6, '0')}`;
      const name = names[(i - 101) % names.length];
      
      await connection.query(`
        INSERT IGNORE INTO xn_user 
        (username, nickname, avatar, mobile, password, email, money, gift_money, score, lv, vip, sex, city, status, fans_num, create_time, last_login_time, platform, \`dec\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `user_${i}`,
        name,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 200}`,
        mobile,
        hashedPassword,
        `user${i}@duoke.com`,
        randomFloat(0, 1000),
        randomFloat(0, 500),
        randomInt(0, 10000),
        randomInt(1, 50),
        randomInt(0, 1),
        randomInt(0, 2),
        randomItem(cities),
        1,
        randomInt(0, 1000),
        generateTime(),
        generateTime(),
        randomItem(platforms),
        `我是${name}，很高兴认识大家！`
      ]);
    }
    
    console.log('✅ 普通用户数据插入完成 (20条)');

    console.log('\n🎉 数据注入完成！');
    console.log('\n📊 新增用户账号：');
    console.log('   用户名: user_101 ~ user_120');
    console.log('   密码: 123456');

  } catch (error) {
    console.error('❌ 数据注入失败:', error.message);
  } finally {
    await connection.end();
  }
}

seedUsers();
