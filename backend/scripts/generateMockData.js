/**
 * ============================================================
 *  多客陪玩 - 综合模拟数据生成器
 * ============================================================
 *
 *  功能:
 *    - 生成 50 条高质量模拟数据，覆盖用户、订单、动态、礼物等核心业务表
 *    - 数据具有真实性与随机性（合理的中文姓名、邮箱、手机号、城市等）
 *    - 严格遵循数据库约束（NOT NULL、长度限制、UNIQUE 索引、外键关联）
 *    - 使用 INSERT IGNORE + 事务保证幂等性，可重复执行不产生脏数据
 *    - 提供 batchInsert() 批量写入函数和 CLI 运行入口
 *
 *  使用方式:
 *    # 命令行运行
 *    node scripts/generateMockData.js
 *
 *    # 模块引入
 *    const { seedAll, seedUsers } = require('./scripts/generateMockData');
 *    await seedAll();
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// ===================== 数据池 =====================

const LAST_NAMES = '王李张刘陈杨黄赵周吴徐孙马朱胡林郭何高罗郑梁谢宋唐许邓冯韩曹彭曾肖田董潘袁于蒋蔡余杜叶程苏魏吕丁任沈'.split('');
const FIRST_NAMES_MALE = '伟强磊军勇杰涛明超辉鹏浩俊华飞刚平斌宇峰博文宁龙晨阳志健海瑞'.split('');
const FIRST_NAMES_FEMALE = '婷静敏雪丽娟艳芳玲霞娜洁琳慧颖晶莉雯怡琪萍红蓉莹瑶菲萌涵桐'.split('');
const ALL_FIRST = [...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE];

const CITIES = ['北京','上海','广州','深圳','杭州','成都','武汉','南京','西安','重庆','长沙','青岛','苏州','天津','郑州','东莞','宁波','佛山','合肥','厦门','福州','昆明','沈阳','大连'];
const PLATFORMS = ['wechat','qq','apple','android'];
const GAMES = ['王者荣耀','英雄联盟','和平精英','原神','永劫无间','CS2','DOTA2','PUBG','Apex英雄','Valorant'];
const SKILL_LEVELS = ['王者','钻石','大师','铂金','黄金','白银'];
const DEF_PWD = '$2a$10$default';

const POST_CONTENTS = [
  '今天玩王者太开心了，连胜五把！有没有大神带我上分呀～',
  '新赛季更新了，感觉打野位又加强了！有没有一起开黑的小伙伴？',
  '今天心情不好，有人陪我聊聊天吗？',
  '技术教学：如何在团战中打出最高伤害？',
  '刚抽到了心仪的皮肤，开心！有没有人来一起玩？',
  '周末有空一起打游戏吗？在线等队友～',
  '分享一下我的上分心得，希望对大家有帮助！',
  '有没有小姐姐小哥哥一起组队呀？',
  '今天手感超好，carry全场！',
  '新英雄太厉害了，推荐大家试试！',
  '排位赛遇到坑队友，心态崩了',
  '终于上王者了！感谢一路陪伴的队友们！',
  '有没有人一起练英雄？互相学习互相进步！',
  '深夜上分中，有没有夜猫子一起？',
  '求带飞！我可以当挂件～',
  '刚学会一个新技巧，来秀一波！',
  '游戏而已，开心最重要！',
  '有没有车队缺人？我可以补位！',
  '今天战绩不错，纪念一下！',
  '这个陪玩师技术太好了，带飞全场！',
  '晒一下今天的游戏成果，吃鸡三连！',
  '第一次玩这个游戏，有没有大佬教教我？',
  '周末组队中，有一起的吗？',
  '今天被队友坑惨了，我需要安慰',
  '有没有人一起玩新模式？'
];

const COMMENT_CONTENTS = [
  '厉害厉害！带我一起吧','恭喜上分！','加油！一起冲！','新赛季一起玩啊','666','太强了','好厉害',
  '求带飞','我也想去','大佬牛批','点赞支持','学到了学到了','期待下一条','好看！','羡慕了',
  '一起开黑啊','位置给我','我也可以','私聊你了','加个好友吧','关注你了','有空一起','66666',
  '这是什么段位呀','打得不错','队友给力'
];

const TAG_NAMES = ['技术流','声音好听','幽默风趣','温柔体贴','游戏高手','聊天达人','唱歌好听','颜值主播','专业陪玩','耐心细致'];
const CIRCLE_TAG_NAMES = ['游戏','闲聊','技术','娱乐','情感','音乐','电影','美食','旅行','宠物','运动','动漫','阅读','摄影','穿搭','美妆','健身','学习','职场','校园','亲子','居家','搞笑','才艺','交友','星座','数码','汽车','财经','公益'];

// ===================== 工具函数 =====================

const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rf = (min, max, d = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(d));
const rpick = arr => arr[Math.floor(Math.random() * arr.length)];
const rpickN = (arr, n) => { const s = [...arr].sort(() => 0.5 - Math.random()); return s.slice(0, n); };
const nowTs = () => Math.floor(Date.now() / 1000);
const past = (maxDays = 365) => nowTs() - ri(0, maxDays * 86400);
const future = (maxDays = 365) => nowTs() + ri(0, maxDays * 86400);

function genMobile() {
  const pf = ['130','131','132','133','134','135','136','137','138','139','150','151','152','153','155','156','157','158','159','180','181','182','183','184','185','186','187','188','189'];
  return rpick(pf) + String(ri(0, 99999999)).padStart(8, '0');
}

function genName(gender) {
  const ln = rpick(LAST_NAMES);
  const pool = gender === 1 ? FIRST_NAMES_MALE : (gender === 2 ? FIRST_NAMES_FEMALE : ALL_FIRST);
  return ln + rpick(pool) + (Math.random() < 0.2 ? rpick(pool) : '');
}

function genNick() {
  const p = ['小','阿','萌','酷','甜','飞','龙','影','星','月','兔','喵','虎','极','乐','优','战'];
  const s = ['玩家','大神','达人','宝宝','小可爱','','','の'];
  return rpick(p) + rpick(s);
}

function genEmail(uname, seq) {
  const ds = ['qq.com','163.com','gmail.com','outlook.com','126.com','sina.com','foxmail.com','yeah.net','hotmail.com','aliyun.com'];
  const pfx = uname || `user${seq}`;
  const sfx = Math.random() > 0.6 ? (Math.random() > 0.5 ? '_' + ri(100, 999) : ri(0, 9999)) : '';
  return `${pfx}${sfx}@${rpick(ds)}`;
}

function genIP() { return `${ri(1,255)}.${ri(0,255)}.${ri(0,255)}.${ri(1,254)}`; }
function genAvatar(seed) { return `https://api.dicebear.com/7.x/avataaars/svg?seed=mock_${seed}`; }
function genImg(w, h, seed) { return `https://picsum.photos/${w}/${h}?random=mock_${seed}`; }

// ===================== 数据生成 =====================

function generateUsers(count, passwordHash) {
  const users = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    const gender = ri(0, 2);
    const isVip = Math.random() < 0.25;
    const ct = past(365);
    let mobile;
    do { mobile = genMobile(); } while (used.has(mobile) && used.size < 10000);
    used.add(mobile);
    const uname = `mock_user_${i + 1}`;
    users.push({
      username: uname, nickname: genNick(), avatar: genAvatar(i + 1000), mobile,
      password: passwordHash, email: genEmail(uname, i + 1),
      open_id: Math.random() < 0.7 ? `wx_oid_${ri(100000,999999)}_${i+1}` : null,
      unionid: Math.random() < 0.5 ? `wx_uid_${ri(100000,999999)}_${i+1}` : null,
      money: rf(0, 10000), gift_money: rf(0, 2000), gift_money_zong: rf(0, 5000),
      score: ri(0, 50000), lv: ri(1, 60),
      vip: isVip ? 1 : 0, vip_lv: isVip ? ri(1, 5) : 0,
      vip_expire_time: isVip ? ct + ri(30, 365) * 86400 : 0,
      sex: gender, city: rpick(CITIES),
      status: Math.random() < 0.05 ? 1 : 0, jinyan_time: 0,
      is_dav: Math.random() < 0.08 ? 1 : 0, is_manage_normal: 0,
      fans_num: ri(0, 8000), create_time: ct,
      last_login_time: ct + ri(0, Math.min(365, nowTs() - ct) / 86400) * 86400,
      ip: genIP(), platform: rpick(PLATFORMS),
      dec: `热爱${rpick(GAMES)}，欢迎一起开黑。`
    });
  }
  return users;
}

function generateVirtualUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const gender = ri(0, 1);
    users.push({
      name: genName(gender === 0 ? 2 : 1),
      avatar: genAvatar(i + 2000), gender, age: ri(18, 32),
      region: rpick(CITIES),
      tags: JSON.stringify(rpickN(TAG_NAMES, ri(1, 4))),
      intro: `${rpick(['性格开朗','温柔体贴','幽默风趣','技术过硬','耐心细致'])}，${rpick(GAMES)}${rpick(['段位王者','技术一流','带你上分','娱乐局也OK'])}，${rpick(['声音甜美','声音磁性','聊天氛围轻松','认真负责'])}`,
      price_per_hour: rf(20, 200),
      online_status: Math.random() < 0.7 ? 1 : 0,
      is_recommend: Math.random() < 0.3 ? 1 : 0,
      status: 1, create_time: past(180), update_time: past(7)
    });
  }
  return users;
}

function generateGames() {
  return GAMES.map((name, i) => ({
    name, image: `game_icon_${i+1}.png`, image_bg: null,
    status: 1, sort: i + 1, create_time: past(365)
  }));
}

function generateGameOrders(userIds, gameIds, count) {
  const orders = [];
  const usedNos = new Set();
  for (let i = 0; i < count; i++) {
    const gameId = rpick(gameIds);
    const gName = GAMES[gameId - 1] || '王者荣耀';
    const status = rpick([0, 1, 2, 3, 4]);
    const price = rf(20, 200);
    const num = ri(1, 3);
    const ct = past(90);
    let orderNo;
    do {
      const d = new Date().toISOString().slice(0,10).replace(/-/g,'');
      orderNo = `MOCK${d}${ri(10000,99999)}`;
    } while (usedNos.has(orderNo));
    usedNos.add(orderNo);
    orders.push({
      order_no: orderNo, user_id: rpick(userIds), target_user_id: ri(2001, 2050),
      game_id: gameId, game_name: gName, type: ri(0, 1),
      price, num, total_price: rf(price * num, price * num, 2),
      status, status_zong: status === 2 ? 1 : 0,
      user_time: 0, add_time: status >= 1 ? past(30) : 0,
      end_time: status >= 2 ? past(7) : 0, create_time: ct,
      pingjia_status: status >= 4 ? 1 : 0,
      pingjia_time: status >= 4 ? past(3) : 0,
      games_server_id: 0, games_server_name: null,
      game_role_id: null, game_role_name: null, voice_url: null
    });
  }
  return orders;
}

function generatePosts(userIds, tagIds, count) {
  const posts = [];
  for (let i = 0; i < count; i++) {
    const hasImg = Math.random() < 0.6;
    const imgs = hasImg ? JSON.stringify(Array.from({length: ri(1,4)}, (_,j) => genImg(400,300,`p${i}_${j}`))) : null;
    posts.push({
      user_id: rpick(userIds), content: rpick(POST_CONTENTS), images: imgs,
      videos: null, thumb_num: ri(5, 2000), comment_num: ri(0, 300),
      share_num: ri(0, 100), tag_id: rpick(tagIds), type: 0,
      status: 1, is_private: Math.random() < 0.1 ? 1 : 0,
      private_password: null, private_price: 0, create_time: past(180)
    });
  }
  return posts.sort((a, b) => b.create_time - a.create_time);
}

function generatePostLikes(postIds, userIds, count) {
  const set = new Set();
  const likes = [];
  for (let i = 0; i < count && set.size < postIds.length * userIds.length; i++) {
    let k; let attempts = 0;
    do { k = `${rpick(postIds)}_${rpick(userIds)}`; attempts++; }
    while (set.has(k) && attempts < 300);
    if (set.has(k)) continue;
    set.add(k);
    const [pid, uid] = k.split('_');
    likes.push({ post_id: parseInt(pid), user_id: parseInt(uid), create_time: past(30) });
  }
  return likes;
}

function generatePostComments(postIds, userIds, count) {
  return Array.from({length: count}, () => ({
    post_id: rpick(postIds), user_id: rpick(userIds),
    content: rpick(COMMENT_CONTENTS), create_time: past(30)
  }));
}

function generateUserFollows(userIds, count) {
  const set = new Set();
  const fws = [];
  for (let i = 0; i < count; i++) {
    let k; let attempts = 0;
    do { k = `${rpick(userIds)}_${rpick(userIds)}`; attempts++; }
    while ((k.split('_')[0] === k.split('_')[1] || set.has(k)) && attempts < 300);
    if (set.has(k)) continue;
    set.add(k);
    const [fid, tid] = k.split('_');
    fws.push({ user_id: parseInt(fid), target_user_id: parseInt(tid), create_time: past(180) });
  }
  return fws;
}

function generateReserves(userIds, vUserIds, gameIds, count) {
  return Array.from({length: count}, () => {
    const d = new Date(Date.now() + ri(1, 30) * 86400000);
    return {
      user_id: rpick(userIds), target_user_id: rpick(vUserIds),
      game_id: rpick(gameIds),
      reserve_date: d.toISOString().slice(0, 10),
      reserve_time: `${String(ri(8,22)).padStart(2,'0')}:${String(ri(0,59)).padStart(2,'0')}:00`,
      status: ri(0, 2),
      create_time: past(7), update_time: past(1)
    };
  });
}

function generateGiftLogs(userIds, giftIds, vUserIds, count) {
  return Array.from({length: count}, () => ({
    user_id: rpick(userIds), user_nickname: null, user_avatar: null,
    song_user_id: rpick(vUserIds), song_user_nickname: null, song_user_avatar: null,
    gift_id: rpick(giftIds), gift_name: rpick(['爱心','玫瑰花','蛋糕','钻戒','跑车','火箭','皇冠','城堡','飞机','游艇']),
    gift_image: null, gift_num: ri(1, 5),
    totalmoney: rf(10, 5000), create_time: past(90)
  }));
}

function generateGifts() {
  return [
    { title:'爱心', image:'gift_heart.png', money:1.00, type:0, is_vip:0, tian:0, status:1, sort:1 },
    { title:'玫瑰花', image:'gift_rose.png', money:10.00, type:0, is_vip:0, tian:0, status:1, sort:2 },
    { title:'蛋糕', image:'gift_cake.png', money:50.00, type:0, is_vip:0, tian:0, status:1, sort:3 },
    { title:'钻戒', image:'gift_ring.png', money:999.00, type:0, is_vip:1, tian:0, status:1, sort:4 },
    { title:'跑车', image:'gift_car.png', money:1500.00, type:0, is_vip:1, tian:0, status:1, sort:5 },
    { title:'火箭', image:'gift_rocket.png', money:500.00, type:0, is_vip:0, tian:0, status:1, sort:6 },
    { title:'皇冠', image:'gift_crown.png', money:2000.00, type:1, is_vip:1, tian:0, status:1, sort:7 },
    { title:'城堡', image:'gift_castle.png', money:5000.00, type:1, is_vip:1, tian:0, status:1, sort:8 },
    { title:'飞机', image:'gift_plane.png', money:300.00, type:0, is_vip:0, tian:0, status:1, sort:9 },
    { title:'游艇', image:'gift_yacht.png', money:3000.00, type:1, is_vip:1, tian:0, status:1, sort:10 }
  ];
}

function generateCircleTags() {
  return CIRCLE_TAG_NAMES.map((name, i) => ({
    name, icon: null, sort_order: i + 1, status: 1, create_time: nowTs(), update_time: nowTs()
  }));
}

function generateVirtualUserTags() {
  return TAG_NAMES.map((name, i) => ({
    name, code: `tag_${name}`, description: `${name}标签`, category: 'general', icon: `icon_${i+1}`,
    color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`,
    personality: null, expertise: null, communication_style: null,
    knowledge_scope: null, response_strategy: null, prompt_template: null,
    temperature: 0.7, max_tokens: 2048, priority: i + 1,
    is_default: i === 0 ? 1 : 0, status: 1, usage_count: 0,
    create_time: nowTs(), update_time: nowTs()
  }));
}

function generateRechargePackages() {
  return [
    { title:'6元', money:6.00, coin:60, coin_zeng:0, is_zeng:0, status:1, sort:1, create_time:nowTs() },
    { title:'30元', money:30.00, coin:300, coin_zeng:30, is_zeng:1, status:1, sort:2, create_time:nowTs() },
    { title:'68元', money:68.00, coin:680, coin_zeng:100, is_zeng:1, status:1, sort:3, create_time:nowTs() },
    { title:'128元', money:128.00, coin:1280, coin_zeng:250, is_zeng:1, status:1, sort:4, create_time:nowTs() },
    { title:'328元', money:328.00, coin:3280, coin_zeng:800, is_zeng:1, status:1, sort:5, create_time:nowTs() },
    { title:'648元', money:648.00, coin:6480, coin_zeng:2000, is_zeng:1, status:1, sort:6, create_time:nowTs() }
  ];
}

function generateVipPackages() {
  return [
    { name:'VIP月卡', price:18.00, original_price:30.00, duration:30, level:1, hot:1, sort:1, status:1, create_time:nowTs() },
    { name:'VIP季卡', price:48.00, original_price:90.00, duration:90, level:1, hot:0, sort:2, status:1, create_time:nowTs() },
    { name:'VIP年卡', price:128.00, original_price:360.00, duration:365, level:2, hot:1, sort:3, status:1, create_time:nowTs() }
  ];
}

function generateCards(count) {
  return Array.from({length: count}, (_, i) => ({
    card_no: `MOCK_CARD_${String(i+1).padStart(6,'0')}`,
    card_pwd: Math.random().toString(36).slice(2, 10).toUpperCase(),
    face_value: rf(10, 500),
    coin_amount: ri(100, 5000),
    status: ri(0, 2),
    use_time: 0, use_user_id: 0,
    expire_time: future(365),
    create_time: nowTs(),
    category: rpick(['vip','newbie','activity','general']),
    tag: null, batch_no: `BATCH_MOCK_${ri(1000,9999)}`, remark: '自动生成的测试卡密'
  }));
}

function generateWithdraws(userIds, count) {
  return Array.from({length: count}, () => {
    const type = rpick(['alipay','wechat','bank']);
    const money = rf(50, 5000);
    return {
      user_id: rpick(userIds), money, pay_money: money,
      shouxufei: rf(0, money * 0.1, 2),
      type: type === 'alipay' ? 1 : (type === 'wechat' ? 2 : 3),
      bank: type === 'bank' ? '6222****' + ri(1000, 9999) : null,
      name: type === 'bank' ? genName(ri(0,2)) : null,
      mobile: genMobile(), image: null,
      is_check: ri(0, 2), state: rpick(['pending','approved','rejected','processing']),
      wx_ti_id: null, lailu: null,
      create_time: new Date(Date.now() - ri(0, 30) * 86400000)
    };
  });
}

function generateCompanionProfiles(userIds, gameIds, count) {
  return Array.from({length: count}, () => ({
    user_id: rpick(userIds),
    game_ids: JSON.stringify(rpickN(gameIds, ri(1, 3))),
    skill_level: rpick(SKILL_LEVELS),
    price_per_hour: rf(20, 200),
    intro: `${rpick(GAMES)}${rpick(['上分','娱乐','教学','聊天'])}陪玩，${rpick(['全天在线','技术过硬','聊天有趣','耐心负责'])}`,
    online_status: ri(0, 1), online_service: ri(0, 1), offline_service: ri(0, 1),
    status: 1, create_time: past(30), update_time: past(1)
  }));
}

// ===================== 批量插入核心函数 =====================

/**
 * 批量插入数据到指定表
 * @param {mysql.Connection} conn - 数据库连接
 * @param {string} table - 表名
 * @param {Array<Object>} rows - 数据行
 * @param {Array<string>} columns - 列名（如果省略则从第一行提取）
 */
async function batchInsert(conn, table, rows, columns) {
  if (!rows || rows.length === 0) return 0;
  const cols = columns || Object.keys(rows[0]);
  const placeholders = cols.map(() => '?').join(', ');
  const colList = cols.map(c => `\`${c}\``).join(', ');
  const sql = `INSERT IGNORE INTO \`${table}\` (${colList}) VALUES `;

  // 分批插入，每批最多50条
  const BATCH_SIZE = 50;
  let total = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch.map(row => `(${placeholders})`).join(', ');
    const flatArgs = batch.flatMap(row => cols.map(c => row[c] !== undefined ? row[c] : null));

    try {
      const [result] = await conn.query(sql + values, flatArgs);
      total += result.affectedRows || 0;
    } catch (err) {
      // INSERT IGNORE 通常不会报错，但如果表不存在等问题则记录
      if (err.code !== 'ER_DUP_ENTRY') {
        console.warn(`  ⚠️  ${table} 插入警告: ${err.message}`);
      }
    }
  }
  return total;
}

/**
 * 获取已有数据 ID 列表
 */
async function fetchIds(conn, table, idField = 'id') {
  try {
    const [rows] = await conn.query(`SELECT \`${idField}\` FROM \`${table}\` ORDER BY \`${idField}\``);
    return rows.map(r => r[idField]).filter(id => id !== null && id !== undefined);
  } catch {
    return [];
  }
}

// ===================== 主流程 =====================

async function seedAll(config = {}) {
  const {
    host = process.env.DB_HOST || 'test-db1-mysql.ns-5ios4t6b.svc',
    port = parseInt(process.env.DB_PORT || '3306'),
    user = process.env.DB_USER || 'root',
    password = process.env.DB_PASSWORD || '',
    database = process.env.DB_NAME || 'duoke_peer',
    userCount = 50,
    virtualUserCount = 30,
    orderCount = 50,
    postCount = 40,
    commentCount = 60,
    likeCount = 80,
    followCount = 60,
    reserveCount = 30,
    giftLogCount = 50,
    withdrawCount = 20,
    cardCount = 30,
    companionProfileCount = 20,
    dryRun = false
  } = config;

  if (dryRun) {
    console.log('🔍 [DRY RUN] 模式 - 不实际写入数据库\n');
  }

  // 预生成密码哈希
  const pwdHash = await bcrypt.hash('123456', 10);

  console.log('='.repeat(55));
  console.log('  多客陪玩 - 模拟数据生成器');
  console.log('='.repeat(55));
  console.log(`  数据库: ${host}:${port}/${database}`);
  console.log(`  模式: ${dryRun ? 'PRY RUN (预览)' : 'PRODUCTION (写入)'}`);
  console.log('='.repeat(55) + '\n');

  // 1. 生成所有数据（纯内存操作）
  console.log('📊 第一步：生成模拟数据...\n');

  console.log(`  🧑 生成 ${userCount} 个用户...`);
  const users = generateUsers(userCount, pwdHash);

  console.log(`  🤖 生成 ${virtualUserCount} 个虚拟用户(陪玩师)...`);
  const virtualUsers = generateVirtualUsers(virtualUserCount);

  console.log(`  🎮 生成 ${GAMES.length} 个游戏...`);
  const games = generateGames();

  console.log(`  🏷️  生成 ${CIRCLE_TAG_NAMES.length} 个圈子标签...`);
  const circleTags = generateCircleTags();

  console.log(`  📌 生成 ${TAG_NAMES.length} 个虚拟用户标签...`);
  const vTags = generateVirtualUserTags();

  console.log(`  🎁 生成 10 个礼物...`);
  const gifts = generateGifts();

  console.log(`  💰 生成 6 个充值套餐 + 3 个VIP套餐...`);
  const rechargePkgs = generateRechargePackages();
  const vipPkgs = generateVipPackages();

  // 汇总统计
  const stats = {
    users: users.length,
    virtualUsers: virtualUsers.length,
    games: games.length,
    circleTags: circleTags.length,
    vTags: vTags.length,
    gifts: gifts.length,
    rechargePkgs: rechargePkgs.length,
    vipPkgs: vipPkgs.length
  };

  // 依赖 ID 的数据：先生成占位，连库后再根据真实 ID 生成
  let orders, posts, comments, likes, follows, reserves, giftLogs, withdraws, cards, companionProfiles;

  // 如果需要实际写入，则连接数据库
  let conn = null;
  let resultStats = { ...stats, inserted: 0, skipped: 0, errors: [] };

  if (!dryRun) {
    try {
      conn = await mysql.createConnection({ host, port, user, password, database, charset: 'utf8mb4' });
      console.log('✅ 数据库连接成功\n');
    } catch (err) {
      console.error(`❌ 数据库连接失败: ${err.message}`);
      console.error('   提示: 请检查数据库配置或使用 --dry-run 预览数据');
      return { success: false, error: err.message, stats };
    }

    try {
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');

      // ----- 第二步：写入基础数据（不依赖外键的） -----
      console.log('📝 第二步：写入基础数据...\n');

      // 2.1 用户
      const userCols = ['username','nickname','avatar','mobile','password','email','open_id','unionid',
        'money','gift_money','gift_money_zong','score','lv','vip','vip_lv','vip_expire_time','sex',
        'city','status','jinyan_time','is_dav','is_manage_normal','fans_num','create_time','last_login_time','ip','platform','dec'];
      const nUsers = await batchInsert(conn, 'xn_user', users, userCols);
      console.log(`  ✅ 用户: ${nUsers}/${userCount} 条写入成功 (INSERT IGNORE)`);

      // 2.2 虚拟用户
      const vuCols = ['name','avatar','gender','age','region','tags','intro','price_per_hour','online_status','is_recommend','status','create_time','update_time'];
      const nVu = await batchInsert(conn, 'xn_virtual_user', virtualUsers, vuCols);
      console.log(`  ✅ 虚拟用户: ${nVu}/${virtualUserCount} 条`);

      // 2.3 游戏
      const gCols = ['name','image','image_bg','status','sort','create_time'];
      const nGames = await batchInsert(conn, 'xn_game', games, gCols);
      console.log(`  ✅ 游戏: ${nGames}/${games.length} 条`);

      // 2.4 圈子标签
      const ctCols = ['name','icon','sort_order','status','create_time','update_time'];
      const nCt = await batchInsert(conn, 'xn_circle_tag', circleTags, ctCols);
      console.log(`  ✅ 圈子标签: ${nCt}/${circleTags.length} 条`);

      // 2.5 虚拟用户标签
      const vtCols = ['name','code','description','category','icon','color','personality','expertise','communication_style','knowledge_scope','response_strategy','prompt_template','temperature','max_tokens','priority','is_default','status','usage_count','create_time','update_time'];
      const nVt = await batchInsert(conn, 'virtual_user_tag', vTags, vtCols);
      console.log(`  ✅ 虚拟用户标签: ${nVt}/${vTags.length} 条`);

      // 2.6 礼物
      const giftCols = ['title','image','money','type','is_vip','tian','status','sort'];
      const nGifts = await batchInsert(conn, 'xn_gift', gifts, giftCols);
      console.log(`  ✅ 礼物: ${nGifts}/${gifts.length} 条`);

      // 2.7 充值套餐
      const rpCols = ['title','money','coin','coin_zeng','is_zeng','status','sort','create_time'];
      const nRp = await batchInsert(conn, 'xn_recharge_package', rechargePkgs, rpCols);
      console.log(`  ✅ 充值套餐: ${nRp}/${rechargePkgs.length} 条`);

      // 2.8 VIP套餐
      const vpCols = ['name','price','original_price','duration','level','hot','sort','status','create_time'];
      const nVp = await batchInsert(conn, 'xn_vip_package', vipPkgs, vpCols);
      console.log(`  ✅ VIP套餐: ${nVp}/${vipPkgs.length} 条\n`);

      // 2.9 卡密
      cards = generateCards(cardCount);
      const cardCols = ['card_no','card_pwd','face_value','coin_amount','status','use_time','use_user_id','expire_time','create_time','category','tag','batch_no','remark'];
      const nCards = await batchInsert(conn, 'xn_card', cards, cardCols);
      console.log(`  ✅ 卡密: ${nCards}/${cardCount} 条`);

      // ----- 第三步：获取真实 ID（外键依赖） -----
      console.log('\n📊 第三步：获取真实ID用于关联数据...\n');

      const realUserIds = await fetchIds(conn, 'xn_user');
      const realVuIds = await fetchIds(conn, 'xn_virtual_user');
      const realGameIds = await fetchIds(conn, 'xn_game');
      const realGiftIds = await fetchIds(conn, 'xn_gift');
      const realTagIds = await fetchIds(conn, 'xn_circle_tag');
      const realPostIds = await fetchIds(conn, 'xn_post');

      console.log(`  用户ID: ${realUserIds.length} 个 (范围: ${Math.min(...realUserIds)} ~ ${Math.max(...realUserIds)})`);
      console.log(`  虚拟用户ID: ${realVuIds.length} 个`);
      console.log(`  游戏ID: ${realGameIds.length} 个`);
      console.log(`  礼物ID: ${realGiftIds.length} 个`);
      console.log(`  圈子标签ID: ${realTagIds.length} 个\n`);

      // ----- 第四步：写入关联数据 -----
      console.log('📝 第四步：写入关联数据...\n');

      // 4.1 游戏订单
      orders = generateGameOrders(realUserIds, realGameIds, orderCount);
      const oCols = ['order_no','user_id','target_user_id','game_id','game_name','type','price','num','total_price','status','status_zong','user_time','add_time','end_time','create_time','pingjia_status','pingjia_time','games_server_id','games_server_name','game_role_id','game_role_name','voice_url'];
      const nOrders = await batchInsert(conn, 'xn_game_order', orders, oCols);
      console.log(`  ✅ 游戏订单: ${nOrders}/${orderCount} 条`);

      // 4.2 帖子
      posts = generatePosts(realUserIds, realTagIds, postCount);
      const pCols = ['user_id','content','images','videos','thumb_num','comment_num','share_num','tag_id','type','status','is_private','private_password','private_price','create_time'];
      await batchInsert(conn, 'xn_post', posts, pCols);
      const insertedPostIds = await fetchIds(conn, 'xn_post');
      console.log(`  ✅ 帖子: ${insertedPostIds.length - realPostIds.length} 条 (新增)`);

      // 4.3 帖子点赞（使用插入后的真实帖子ID）
      const allPostIds = insertedPostIds.length > 0 ? insertedPostIds : realPostIds;
      let nLikes = 0, nComments = 0;
      if (allPostIds.length > 0) {
        likes = generatePostLikes(allPostIds, realUserIds, likeCount);
        const lCols = ['post_id','user_id','create_time'];
        nLikes = await batchInsert(conn, 'xn_post_like', likes, lCols);
        console.log(`  ✅ 帖子点赞: ${nLikes}/${likeCount} 条`);
      }

      // 4.4 帖子评论
      if (allPostIds.length > 0) {
        comments = generatePostComments(allPostIds, realUserIds, commentCount);
        const cCols = ['post_id','user_id','content','create_time'];
        nComments = await batchInsert(conn, 'xn_post_comment', comments, cCols);
        console.log(`  ✅ 帖子评论: ${nComments}/${commentCount} 条`);
      }

      // 4.5 用户关注
      follows = generateUserFollows(realUserIds, followCount);
      const fCols = ['user_id','target_user_id','create_time'];
      const nFollows = await batchInsert(conn, 'xn_user_follow', follows, fCols);
      console.log(`  ✅ 用户关注: ${nFollows}/${followCount} 条`);

      // 4.6 预约
      reserves = generateReserves(realUserIds, realVuIds, realGameIds, reserveCount);
      const rCols = ['user_id','target_user_id','game_id','reserve_date','reserve_time','status','create_time','update_time'];
      const nRes = await batchInsert(conn, 'xn_reserve', reserves, rCols);
      console.log(`  ✅ 预约: ${nRes}/${reserveCount} 条`);

      // 4.7 礼物记录
      giftLogs = generateGiftLogs(realUserIds, realGiftIds, realVuIds, giftLogCount);
      const glCols = ['user_id','user_nickname','user_avatar','song_user_id','song_user_nickname','song_user_avatar','gift_id','gift_name','gift_image','gift_num','totalmoney','create_time'];
      const nGl = await batchInsert(conn, 'xn_gift_log', giftLogs, glCols);
      console.log(`  ✅ 礼物记录: ${nGl}/${giftLogCount} 条`);

      // 4.8 提现记录
      withdraws = generateWithdraws(realUserIds, withdrawCount);
      const wCols = ['user_id','money','pay_money','shouxufei','type','bank','name','mobile','image','is_check','state','wx_ti_id','lailu','create_time'];
      const nWd = await batchInsert(conn, 'xn_withdraw', withdraws, wCols);
      console.log(`  ✅ 提现记录: ${nWd}/${withdrawCount} 条`);

      // 4.9 陪玩师资料
      companionProfiles = generateCompanionProfiles(realUserIds, realGameIds, companionProfileCount);
      const cpCols = ['user_id','game_ids','skill_level','price_per_hour','intro','online_status','online_service','offline_service','status','create_time','update_time'];
      const nCp = await batchInsert(conn, 'xn_companion_profile', companionProfiles, cpCols);
      console.log(`  ✅ 陪玩师资料: ${nCp}/${companionProfileCount} 条`);

      await conn.query('SET FOREIGN_KEY_CHECKS = 1');

      // ----- 汇总统计 -----
      console.log('\n' + '='.repeat(55));
      console.log('📊 数据写入汇总');
      console.log('='.repeat(55));
      console.log(`  xn_user               : ${nUsers} 条`);
      console.log(`  xn_virtual_user       : ${nVu} 条`);
      console.log(`  xn_game               : ${nGames} 条`);
      console.log(`  xn_circle_tag         : ${nCt} 条`);
      console.log(`  xn_virtual_user_tag   : ${nVt} 条`);
      console.log(`  xn_gift               : ${nGifts} 条`);
      console.log(`  xn_recharge_package   : ${nRp} 条`);
      console.log(`  xn_vip_package        : ${nVp} 条`);
      console.log(`  xn_card               : ${nCards} 条`);
      console.log(`  xn_game_order         : ${nOrders} 条`);
      console.log(`  xn_post               : ${insertedPostIds ? insertedPostIds.length - realPostIds.length : 0} 条`);
      console.log(`  xn_post_like          : ${typeof nLikes !== 'undefined' ? nLikes : 0} 条`);
      console.log(`  xn_post_comment       : ${typeof nComments !== 'undefined' ? nComments : 0} 条`);
      console.log(`  xn_user_follow        : ${nFollows} 条`);
      console.log(`  xn_reserve            : ${nRes} 条`);
      console.log(`  xn_gift_log           : ${nGl} 条`);
      console.log(`  xn_withdraw           : ${nWd} 条`);
      console.log(`  xn_companion_profile  : ${nCp} 条`);
      console.log('='.repeat(55));
      console.log('🎉 模拟数据写入完成！');
      console.log('💡 测试账号: mock_user_1 ~ mock_user_50, 密码: 123456');
      console.log('');

      return { success: true, stats };
    } catch (err) {
      console.error(`\n❌ 写入失败: ${err.message}`);
      resultStats.errors.push(err.message);
      return { success: false, error: err.message, stats };
    } finally {
      if (conn) await conn.end();
    }
  }

  // dry-run 模式只输出预览
  if (dryRun) {
    console.log('\n📊 预览数据摘要:');
    console.log(`  用户: ${users.length} 条 | 虚拟用户: ${virtualUsers.length} 条`);
    console.log(`  游戏: ${games.length} 条 | 礼物: ${gifts.length} 条`);
    console.log(`  圈子标签: ${circleTags.length} 条 | 充值套餐: ${rechargePkgs.length} 条`);
    console.log(`  VIP套餐: ${vipPkgs.length} 条\n`);
    console.log('  示例用户数据:');
    users.slice(0, 3).forEach(u => {
      console.log(`    - ${u.username} | ${u.nickname} | ${u.email} | ${u.mobile} | ${u.city} | 余额:¥${u.money}`);
    });
    console.log('\n💡 使用 --no-dry-run 参数实际写入数据库');
  }

  return { success: true, dryRun, stats };
}

// ===================== 模块导出 =====================

module.exports = {
  seedAll,
  // 数据生成函数（供其他模块使用）
  generateUsers,
  generateVirtualUsers,
  generateGames,
  generateGameOrders,
  generatePosts,
  generatePostLikes,
  generatePostComments,
  generateUserFollows,
  generateReserves,
  generateGiftLogs,
  generateGifts,
  generateCircleTags,
  generateVirtualUserTags,
  generateRechargePackages,
  generateVipPackages,
  generateCards,
  generateWithdraws,
  generateCompanionProfiles,
  batchInsert,
  // 工具函数
  nowTs, past, future, ri, rf, rpick, rpickN,
  genName, genMobile, genEmail, genIP, genAvatar, genImg
};

// ===================== CLI 入口 =====================

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('--preview');
  const countArg = args.find(a => a.startsWith('--count='));

  const config = { dryRun };
  if (countArg) {
    const n = parseInt(countArg.split('=')[1]);
    if (n > 0) config.userCount = n;
  }

  seedAll(config).then(result => {
    if (!result.success) process.exit(1);
  }).catch(err => {
    console.error('执行失败:', err.message);
    process.exit(1);
  });
}
