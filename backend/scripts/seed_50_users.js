/**
 * Seed 50 test users into MySQL with bcrypt passwords
 * Run: docker exec -i duoke-backend node scripts/seed_50_users.js
 */
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const DB_HOST = process.env.DB_HOST || 'mysql';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'duoke';
const DB_PASSWORD = process.env.DB_PASSWORD || 'duoke123';
const DB_NAME = process.env.DB_NAME || 'duoke';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false
});

const nicknames = [
  '暗夜猎手', '风行者', '冰霜女巫', '烈焰战神', '星辰大海',
  '灵魂猎手', '追风少年', '寂静岭', '极光之光', '深海巨兽',
  '雷霆万钧', '破晓之剑', '夜幕降临', '月光公主', '风暴之眼',
  '暗影刺客', '光明骑士', '赤焰红狐', '蓝海深蓝', '紫霞仙子',
  '剑圣无名', '魔导师', '神枪手', '盾山堡垒', '疾风剑豪',
  '九尾狐仙', '青龙偃月', '白虎咆哮', '朱雀涅槃', '玄武长生',
  '不灭之握', '王者归来', '浪子回头', '大小姐', '小仙女',
  '乖宝宝', '龙行天下', '凤舞九天', '麒麟降世', '鲲鹏展翅',
  '一笑倾城', '二爷威武', '三生有幸', '四海为家', '五毒俱全',
  '六道轮回', '七星高照', '八仙过海', '九牛一毛', '十步一杀'
];

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安'];
const sexOptions = [0, 1, 1, 2]; // 0=未知 1=男 2=女

async function seed() {
  console.log('🔧 开始生成50个测试用户...');

  let count = 0;
  for (let i = 0; i < 50; i++) {
    const idx = i + 100; // offset from seed data
    const nickname = nicknames[i % nicknames.length];
    const mobile = `138${String(10000000 + idx).padStart(8, '0')}`;
    const username = `testuser_${String(idx).padStart(3, '0')}`;
    const password = await bcrypt.hash('123456', 10);
    const sex = sexOptions[i % sexOptions.length];
    const city = cities[i % cities.length];
    const vip = i < 10 ? 1 : 0;
    const vipLv = vip ? (i % 3) + 1 : 0;
    const money = (Math.random() * 5000).toFixed(2);
    const score = Math.floor(Math.random() * 500);
    const now = Math.floor(Date.now() / 1000);

    try {
      const [results] = await sequelize.query(
        `INSERT IGNORE INTO xn_user 
         (username, nickname, mobile, password, sex, city, vip, vip_lv, money, score, lv, status, create_time, last_login_time, fans_num, \`dec\`) 
         VALUES (:username, :nickname, :mobile, :password, :sex, :city, :vip, :vipLv, :money, :score, :lv, :status, :createTime, :lastLogin, :fans, :dec)`,
        {
          replacements: {
            username,
            nickname,
            mobile,
            password,
            sex,
            city,
            vip,
            vipLv,
            money,
            score,
            lv: Math.floor(Math.random() * 10) + 1,
            status: 0,
            createTime: now - Math.floor(Math.random() * 86400 * 30),
            lastLogin: now - Math.floor(Math.random() * 86400 * 7),
            fans: Math.floor(Math.random() * 200),
            dec: `我是${nickname}，爱游戏爱生活~`
          }
        }
      );
      count++;
      if ((i + 1) % 10 === 0) console.log(`  ✓ 已创建 ${i + 1}/50 个用户`);
    } catch (err) {
      if (err.original && err.original.code === 'ER_DUP_ENTRY') {
        console.log(`  ⚠ 用户 ${username} 已存在，跳过`);
      } else {
        console.error(`  ✗ 创建用户 ${username} 失败:`, err.message);
      }
    }
  }

  console.log(`\n✅ 完成！成功创建 ${count} 个测试用户`);
  console.log('   所有用户密码统一为: 123456');

  const [total] = await sequelize.query('SELECT COUNT(*) AS cnt FROM xn_user');
  console.log(`   数据库总用户数: ${total[0].cnt}`);
}

seed()
  .then(() => {
    sequelize.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ 种子脚本失败:', err.message);
    sequelize.close();
    process.exit(1);
  });
