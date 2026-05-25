const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '重庆', '天津', '长沙', '郑州', '青岛'];
const games = ['王者荣耀', '和平精英', '原神', '英雄联盟', 'CSGO', '永劫无间', '绝地求生', '第五人格', '阴阳师', '明日方舟', '蛋仔派对', '金铲铲之战', '梦幻西游', 'DNF', '永劫无间'];
const tags = ['技术流', '声音好听', '幽默风趣', '温柔体贴', '游戏高手', '聊天达人', '唱歌好听', '颜值主播', '专业陪玩', '耐心细致'];
const names = ['小明', '小红', '小华', '小丽', '小强', '小美', '小龙', '小凤', '小虎', '小燕', '阿杰', '阿婷', '阿辉', '阿敏', '阿伟', '阿芳', '阿强', '阿珍', '阿明', '阿花'];
const platforms = ['wechat', 'qq', 'apple', 'android'];
const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomItem(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomMobile() {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '186', '187', '188'];
  return randomItem(prefixes) + randomInt(10000000, 99999999);
}

function generateTime() {
  return Math.floor(Date.now() / 1000) - randomInt(0, 365 * 24 * 3600);
}

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: 'test-db1-mysql.ns-5ios4t6b.svc',
    port: 3306,
    user: 'root',
    password: 'fjbbsppp',
    database: 'duoke_peer'
  });

  console.log('✅ 数据库连接成功');
  console.log('📦 开始注入测试数据...\n');

  const hashedPassword = await bcrypt.hash('123456', 10);
  const now = Math.floor(Date.now() / 1000);

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('📝 插入用户数据...');
    for (let i = 1; i <= 100; i++) {
      const mobile = `13800${String(i).padStart(6, '0')}`;
      await connection.query(`
        INSERT IGNORE INTO xn_user 
        (username, nickname, avatar, mobile, password, email, money, gift_money, score, lv, vip, sex, city, status, fans_num, create_time, last_login_time, platform, \`dec\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `user_${i}`,
        `用户${i}`,
        randomItem(avatars),
        mobile,
        hashedPassword,
        `user${i}@test.com`,
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
        `这是用户${i}的个性签名`
      ]);
    }
    console.log('✅ 用户数据插入完成 (100条)');

    console.log('📝 插入虚拟用户数据...');
    for (let i = 1; i <= 100; i++) {
      await connection.query(`
        INSERT IGNORE INTO xn_virtual_user 
        (name, avatar, gender, age, region, tags, intro, price_per_hour, online_status, is_recommend, status, create_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `陪玩师${i}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 100}`,
        randomInt(0, 1),
        randomInt(18, 30),
        randomItem(cities),
        JSON.stringify([randomItem(tags), randomItem(tags)]),
        `我是陪玩师${i}，擅长${randomItem(games)}，欢迎来找我一起玩~`,
        randomFloat(10, 100),
        randomInt(0, 1),
        randomInt(0, 1),
        1,
        now,
        now
      ]);
    }
    console.log('✅ 虚拟用户数据插入完成 (100条)');

    console.log('📝 插入游戏数据...');
    for (let i = 0; i < games.length; i++) {
      await connection.query(`
        INSERT IGNORE INTO xn_game 
        (name, icon, description, status, sort, create_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        games[i],
        `https://api.dicebear.com/7.x/icons/svg?seed=${i}`,
        `${games[i]}是一款热门游戏`,
        1,
        i,
        now,
        now
      ]);
    }
    console.log(`✅ 游戏数据插入完成 (${games.length}条)`);

    console.log('📝 插入礼物数据...');
    const giftNames = ['玫瑰', '爱心', '蛋糕', '跑车', '火箭', '皇冠', '钻戒', '城堡', '飞机', '游艇'];
    for (let i = 0; i < giftNames.length; i++) {
      await connection.query(`
        INSERT IGNORE INTO xn_gift 
        (title, image, money, type, is_vip, status, sort, create_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        giftNames[i],
        `https://api.dicebear.com/7.x/icons/svg?seed=gift${i}`,
        randomFloat(1, 100),
        randomInt(0, 2),
        randomInt(0, 1),
        1,
        i,
        now
      ]);
    }
    console.log(`✅ 礼物数据插入完成 (${giftNames.length}条)`);

    console.log('📝 插入VIP套餐数据...');
    const vipPackages = [
      { name: '月卡VIP', price: 30, duration: 30, level: 1 },
      { name: '季卡VIP', price: 80, duration: 90, level: 2 },
      { name: '年卡VIP', price: 298, duration: 365, level: 3 }
    ];
    for (let i = 0; i < vipPackages.length; i++) {
      await connection.query(`
        INSERT IGNORE INTO xn_vip_package 
        (name, price, original_price, duration, level, hot, sort, status, create_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        vipPackages[i].name,
        vipPackages[i].price,
        vipPackages[i].price * 1.5,
        vipPackages[i].duration,
        vipPackages[i].level,
        i === 1 ? 1 : 0,
        i,
        1,
        now,
        now
      ]);
    }
    console.log('✅ VIP套餐数据插入完成 (3条)');

    console.log('📝 插入标签数据...');
    for (let i = 0; i < tags.length; i++) {
      await connection.query(`
        INSERT IGNORE INTO xn_virtual_user_tag 
        (name, icon, sort_order, status, create_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        tags[i],
        `https://api.dicebear.com/7.x/icons/svg?seed=tag${i}`,
        i,
        1,
        now,
        now
      ]);
    }
    console.log(`✅ 标签数据插入完成 (${tags.length}条)`);

    console.log('📝 插入充值套餐数据...');
    const rechargePackages = [
      { name: '6元', amount: 6, bonus: 0 },
      { name: '30元', amount: 30, bonus: 3 },
      { name: '68元', amount: 68, bonus: 10 },
      { name: '128元', amount: 128, bonus: 25 },
      { name: '328元', amount: 328, bonus: 80 },
      { name: '648元', amount: 648, bonus: 200 }
    ];
    for (let i = 0; i < rechargePackages.length; i++) {
      await connection.query(`
        INSERT IGNORE INTO xn_recharge_package 
        (name, amount, bonus, status, sort, create_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `, [
        rechargePackages[i].name,
        rechargePackages[i].amount,
        rechargePackages[i].bonus,
        1,
        i,
        now,
        now
      ]);
    }
    console.log(`✅ 充值套餐数据插入完成 (${rechargePackages.length}条)`);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n🎉 数据注入完成！');
    console.log('\n📊 数据统计：');
    console.log('   - 用户: 100条');
    console.log('   - 虚拟用户: 100条');
    console.log('   - 游戏: ' + games.length + '条');
    console.log('   - 礼物: 10条');
    console.log('   - VIP套餐: 3条');
    console.log('   - 标签: ' + tags.length + '条');
    console.log('   - 充值套餐: 6条');
    console.log('\n💡 测试账号: user_1 ~ user_100, 密码: 123456');

  } catch (error) {
    console.error('❌ 数据注入失败:', error.message);
  } finally {
    await connection.end();
  }
}

seedDatabase();
