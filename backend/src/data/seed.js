/**
 * 本地数据源种子数据生成器
 * 
 * 基于 generateMockData.js 的数据池和生成函数，
 * 适配 LocalSequelize 本地存储，生成具有真实业务特征的种子数据。
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

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
  '这个陪玩师技术太好了，带飞全场！'
];

const COMMENT_CONTENTS = [
  '厉害厉害！带我一起吧','恭喜上分！','加油！一起冲！','新赛季一起玩啊','666','太强了','好厉害',
  '求带飞','我也想去','大佬牛批','点赞支持','学到了学到了','期待下一条','好看！','羡慕了',
  '一起开黑啊','位置给我','我也可以','私聊你了','加个好友吧','关注你了','有空一起','66666',
  '这是什么段位呀','打得不错','队友给力'
];

const TAG_NAMES = ['技术流','声音好听','幽默风趣','温柔体贴','游戏高手','聊天达人','唱歌好听','颜值主播','专业陪玩','耐心细致'];
const CIRCLE_TAG_NAMES = ['游戏','闲聊','技术','娱乐','情感','音乐','电影','美食','旅行','宠物','运动','动漫','阅读','摄影','穿搭','美妆','健身','学习','职场','校园','亲子','居家','搞笑','才艺','交友','星座','数码','汽车','财经','公益'];
const GIFT_NAMES = ['爱心','玫瑰花','蛋糕','钻戒','跑车','火箭','皇冠','城堡','飞机','游艇'];

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
  return `${uname || 'user' + seq}@${rpick(ds)}`;
}

function genIP() { return `${ri(1,255)}.${ri(0,255)}.${ri(0,255)}.${ri(1,254)}`; }
function genAvatar(seed) { return `https://api.dicebear.com/7.x/avataaars/svg?seed=mock_${seed}`; }

// ===================== 数据生成函数 =====================

function generateUsers(count = 50) {
  const users = [];
  const usedMobiles = new Set();
  const usedUsernames = new Set();

  for (let i = 0; i < count; i++) {
    const gender = ri(0, 2);
    const isVip = Math.random() < 0.25;
    const ct = past(365);
    let mobile;
    do { mobile = genMobile(); } while (usedMobiles.has(mobile));
    usedMobiles.add(mobile);
    const uname = `mock_user_${i + 1}`;
    const nick = genNick();
    users.push({
      id: 20001 + i,
      username: uname,
      nickname: nick,
      avatar: genAvatar(i + 1000),
      mobile,
      password: DEF_PWD,
      email: genEmail(uname, 20001 + i),
      open_id: Math.random() < 0.7 ? `wx_oid_${ri(100000, 999999)}_${i + 1}` : null,
      unionid: Math.random() < 0.5 ? `wx_uid_${ri(100000, 999999)}_${i + 1}` : null,
      money: rf(0, 10000),
      gift_money: rf(0, 2000),
      gift_money_zong: rf(0, 5000),
      score: ri(0, 50000),
      lv: ri(1, 60),
      vip: isVip ? 1 : 0,
      vip_lv: isVip ? ri(1, 5) : 0,
      vip_expire_time: isVip ? ct + ri(30, 365) * 86400 : 0,
      sex: gender,
      city: rpick(CITIES),
      status: Math.random() < 0.05 ? 1 : 0,
      jinyan_time: 0,
      is_dav: Math.random() < 0.08 ? 1 : 0,
      is_manage_normal: 0,
      fans_num: ri(0, 8000),
      create_time: ct,
      last_login_time: ct + ri(0, Math.min(365, nowTs() - ct) / 86400) * 86400,
      ip: genIP(),
      platform: rpick(PLATFORMS),
      dec: `热爱${rpick(GAMES)}，欢迎一起开黑。`,
      birthday: null,
      wechat: null,
      alipay: null,
      voice_intro: null,
      is_online: Math.random() < 0.6 ? 1 : 0,
      login_ip: genIP(),
      token: null,
      device_id: null
    });
  }
  return users;
}

function generateGames() {
  return GAMES.map((name, i) => ({
    id: i + 1,
    name,
    image: `game_icon_${i + 1}.png`,
    image_bg: null,
    status: 1,
    sort: i + 1,
    create_time: past(365)
  }));
}

function generateCircleTags() {
  return CIRCLE_TAG_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    icon: null,
    sort_order: i + 1,
    status: 1,
    create_time: nowTs(),
    update_time: nowTs()
  }));
}

function generateVirtualUserTags() {
  return TAG_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    code: `tag_${name}`,
    description: `${name}标签`,
    category: 'general',
    icon: `icon_${i + 1}`,
    color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    personality: null,
    expertise: null,
    communication_style: null,
    knowledge_scope: null,
    response_strategy: null,
    prompt_template: null,
    temperature: 0.7,
    max_tokens: 2048,
    priority: i + 1,
    is_default: i === 0 ? 1 : 0,
    status: 1,
    usage_count: 0,
    create_time: nowTs(),
    update_time: nowTs()
  }));
}

function generateVirtualUsers(count = 30) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const gender = ri(0, 1);
    const vname = genName(gender === 0 ? 2 : 1);
    const nickname = vname;
    const username = 'bot_' + (i + 1) + '_' + vname;
    users.push({
      id: 30001 + i,
      name: vname,
      username,
      nickname,
      avatar: genAvatar(i + 2000),
      gender,
      age: ri(18, 32),
      region: rpick(CITIES),
      tags: JSON.stringify(rpickN(TAG_NAMES, ri(1, 4))),
      intro: `${rpick(['性格开朗','温柔体贴','幽默风趣','技术过硬','耐心细致'])}，${rpick(GAMES)}${rpick(['段位王者','技术一流','带你上分','娱乐局也OK'])}，${rpick(['声音甜美','声音磁性','聊天氛围轻松','认真负责'])}`,
      price_per_hour: rf(20, 200),
      online_status: Math.random() < 0.7 ? 1 : 0,
      is_recommend: Math.random() < 0.3 ? 1 : 0,
      status: 1,
      create_time: past(180),
      update_time: past(7)
    });
  }
  return users;
}

function generateGifts() {
  return [
    { id: 1, title: '爱心', image: 'gift_heart.png', money: 1.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 1, create_time: nowTs() },
    { id: 2, title: '玫瑰花', image: 'gift_rose.png', money: 10.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 2, create_time: nowTs() },
    { id: 3, title: '蛋糕', image: 'gift_cake.png', money: 50.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 3, create_time: nowTs() },
    { id: 4, title: '钻戒', image: 'gift_ring.png', money: 999.00, type: 0, is_vip: 1, tian: 0, status: 1, sort: 4, create_time: nowTs() },
    { id: 5, title: '跑车', image: 'gift_car.png', money: 1500.00, type: 0, is_vip: 1, tian: 0, status: 1, sort: 5, create_time: nowTs() },
    { id: 6, title: '火箭', image: 'gift_rocket.png', money: 500.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 6, create_time: nowTs() },
    { id: 7, title: '皇冠', image: 'gift_crown.png', money: 2000.00, type: 1, is_vip: 1, tian: 0, status: 1, sort: 7, create_time: nowTs() },
    { id: 8, title: '城堡', image: 'gift_castle.png', money: 5000.00, type: 1, is_vip: 1, tian: 0, status: 1, sort: 8, create_time: nowTs() },
    { id: 9, title: '飞机', image: 'gift_plane.png', money: 300.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 9, create_time: nowTs() },
    { id: 10, title: '游艇', image: 'gift_yacht.png', money: 3000.00, type: 1, is_vip: 1, tian: 0, status: 1, sort: 10, create_time: nowTs() }
  ];
}

function generateRechargePackages() {
  return [
    { id: 1, title: '6元', money: 6.00, coin: 60, coin_zeng: 0, is_zeng: 0, status: 1, sort: 1, create_time: nowTs() },
    { id: 2, title: '30元', money: 30.00, coin: 300, coin_zeng: 30, is_zeng: 1, status: 1, sort: 2, create_time: nowTs() },
    { id: 3, title: '68元', money: 68.00, coin: 680, coin_zeng: 100, is_zeng: 1, status: 1, sort: 3, create_time: nowTs() },
    { id: 4, title: '128元', money: 128.00, coin: 1280, coin_zeng: 250, is_zeng: 1, status: 1, sort: 4, create_time: nowTs() },
    { id: 5, title: '328元', money: 328.00, coin: 3280, coin_zeng: 800, is_zeng: 1, status: 1, sort: 5, create_time: nowTs() },
    { id: 6, title: '648元', money: 648.00, coin: 6480, coin_zeng: 2000, is_zeng: 1, status: 1, sort: 6, create_time: nowTs() }
  ];
}

function generateVipPackages() {
  return [
    { id: 1, name: 'VIP月卡', price: 18.00, original_price: 30.00, duration: 30, level: 1, hot: 1, sort: 1, status: 1, create_time: nowTs() },
    { id: 2, name: 'VIP季卡', price: 48.00, original_price: 90.00, duration: 90, level: 1, hot: 0, sort: 2, status: 1, create_time: nowTs() },
    { id: 3, name: 'VIP年卡', price: 128.00, original_price: 360.00, duration: 365, level: 2, hot: 1, sort: 3, status: 1, create_time: nowTs() }
  ];
}

function generateCards(count = 30) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    card_no: `MOCK_CARD_${String(i + 1).padStart(6, '0')}`,
    card_pwd: Math.random().toString(36).slice(2, 10).toUpperCase(),
    face_value: rf(10, 500),
    coin_amount: ri(100, 5000),
    status: ri(0, 2),
    use_time: 0,
    use_user_id: 0,
    expire_time: future(365),
    create_time: nowTs(),
    category: rpick(['vip', 'newbie', 'activity', 'general']),
    tag: null,
    batch_no: `BATCH_MOCK_${ri(1000, 9999)}`,
    remark: '自动生成的测试卡密'
  }));
}

function generateGameOrders(userIds, gameIds, count = 50) {
  const usedNos = new Set();
  return Array.from({ length: count }, (_, i) => {
    const gameId = rpick(gameIds);
    const gName = GAMES[gameId - 1] || '王者荣耀';
    const status = rpick([0, 1, 2, 3, 4]);
    const price = rf(20, 200);
    const num = ri(1, 3);
    const ct = past(90);
    let orderNo;
    do {
      const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      orderNo = `MOCK${d}${ri(10000, 99999)}`;
    } while (usedNos.has(orderNo));
    usedNos.add(orderNo);
    return {
      id: i + 1,
      order_no: orderNo,
      user_id: rpick(userIds),
      target_user_id: ri(51, 80),
      companion_id: ri(51, 80),
      game_id: gameId,
      game_name: gName,
      type: ri(0, 1),
      price,
      num,
      total_price: rf(price * num, price * num, 2),
      status,
      status_zong: status === 2 ? 1 : 0,
      user_time: 0,
      add_time: status >= 1 ? past(30) : 0,
      end_time: status >= 2 ? past(7) : 0,
      start_time: status >= 1 ? past(30) : 0,
      cancel_time: status === 0 ? past(7) : 0,
      create_time: ct,
      pingjia_status: status >= 4 ? 1 : 0,
      pingjia_time: status >= 4 ? past(3) : 0,
      games_server_id: 0,
      games_server_name: null,
      game_role_id: null,
      game_role_name: null,
      voice_url: null
    };
  });
}

function generatePosts(userIds, tagIds, count = 40) {
  return Array.from({ length: count }, (_, i) => {
    const hasImg = Math.random() < 0.6;
    const imgs = hasImg ? JSON.stringify(Array.from({ length: ri(1, 4) }, (_, j) => `https://picsum.photos/400/300?random=mock_p${i}_${j}`)) : null;
    return {
      id: i + 1,
      user_id: rpick(userIds),
      content: rpick(POST_CONTENTS),
      images: imgs,
      videos: null,
      thumb_num: ri(5, 2000),
      comment_num: ri(0, 300),
      share_num: ri(0, 100),
      tag_id: rpick(tagIds),
      type: 0,
      status: 1,
      is_private: Math.random() < 0.1 ? 1 : 0,
      private_password: null,
      private_price: 0,
      create_time: past(180)
    };
  }).sort((a, b) => b.create_time - a.create_time);
}

function generatePostLikes(postIds, userIds, count = 80) {
  const set = new Set();
  const likes = [];
  const max = postIds.length * userIds.length;
  for (let i = 0; i < count && set.size < max; i++) {
    let k;
    let attempts = 0;
    do {
      k = `${rpick(postIds)}_${rpick(userIds)}`;
      attempts++;
    } while (set.has(k) && attempts < 300);
    if (set.has(k)) continue;
    set.add(k);
    const [pid, uid] = k.split('_');
    likes.push({
      id: likes.length + 1,
      post_id: parseInt(pid),
      user_id: parseInt(uid),
      create_time: past(30)
    });
  }
  return likes;
}

function generatePostComments(postIds, userIds, count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    post_id: rpick(postIds),
    user_id: rpick(userIds),
    content: rpick(COMMENT_CONTENTS),
    create_time: past(30)
  }));
}

function generateUserFollows(userIds, count = 60) {
  const set = new Set();
  const fws = [];
  for (let i = 0; i < count; i++) {
    let k;
    let attempts = 0;
    do {
      k = `${rpick(userIds)}_${rpick(userIds)}`;
      attempts++;
    } while ((k.split('_')[0] === k.split('_')[1] || set.has(k)) && attempts < 300);
    if (set.has(k)) continue;
    set.add(k);
    const [fid, tid] = k.split('_');
    fws.push({
      id: fws.length + 1,
      user_id: parseInt(fid),
      target_user_id: parseInt(tid),
      create_time: past(180)
    });
  }
  return fws;
}

function generateReserves(userIds, vUserIds, gameIds, count = 30) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    target_user_id: rpick(vUserIds),
    game_id: rpick(gameIds),
    reserve_date: new Date(Date.now() + ri(1, 30) * 86400000).toISOString().slice(0, 10),
    reserve_time: `${String(ri(8, 22)).padStart(2, '0')}:${String(ri(0, 59)).padStart(2, '0')}:00`,
    status: ri(0, 2),
    create_time: past(7),
    update_time: past(1)
  }));
}

function generateGiftLogs(userIds, giftIds, vUserIds, count = 50) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    user_nickname: null,
    user_avatar: null,
    song_user_id: rpick(vUserIds),
    song_user_nickname: null,
    song_user_avatar: null,
    gift_id: rpick(giftIds),
    gift_name: rpick(GIFT_NAMES),
    gift_image: null,
    gift_num: ri(1, 5),
    totalmoney: rf(10, 5000),
    create_time: past(90)
  }));
}

function generateRechargeOrders(userIds, count = 30) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    order_no: `RECHARGE${Date.now()}_${i + 1}_${ri(10000, 99999)}`,
    money: rpick([6, 30, 68, 128, 328, 648]),
    coin: ri(60, 6480),
    status: ri(0, 2),
    pay_type: rpick(['wechat', 'alipay']),
    create_time: past(60)
  }));
}

function generateCompanionProfiles(userIds, gameIds, count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    game_ids: JSON.stringify(rpickN(gameIds, ri(1, 3))),
    skill_level: rpick(SKILL_LEVELS),
    price_per_hour: rf(20, 200),
    intro: `${rpick(GAMES)}${rpick(['上分','娱乐','教学','聊天'])}陪玩，${rpick(['全天在线','技术过硬','聊天有趣','耐心负责'])}`,
    online_status: ri(0, 1),
    online_service: ri(0, 1),
    offline_service: ri(0, 1),
    status: 1,
    create_time: past(30),
    update_time: past(1)
  }));
}

function generateVirtualUserTagRelations(vUserIds, tagIds, count = 20) {
  const set = new Set();
  const relations = [];
  for (let i = 0; i < count; i++) {
    let k;
    let attempts = 0;
    do {
      k = `${rpick(vUserIds)}_${rpick(tagIds)}`;
      attempts++;
    } while (set.has(k) && attempts < 200);
    if (set.has(k)) continue;
    set.add(k);
    const [vid, tid] = k.split('_');
    relations.push({
      id: relations.length + 1,
      virtual_user_id: parseInt(vid),
      tag_id: parseInt(tid),
      create_time: nowTs()
    });
  }
  return relations;
}

function generateBanners() {
  return [
    { id: 1, title: '新用户专享优惠', image: 'https://picsum.photos/800/300?random=banner1', link: '/pages/home/index', type: 1, sort: 1, status: 1, create_time: nowTs() },
    { id: 2, title: '王者荣耀上分季', image: 'https://picsum.photos/800/300?random=banner2', link: '/pages/game/detail?id=1', type: 2, sort: 2, status: 1, create_time: nowTs() },
    { id: 3, title: 'VIP会员限时折扣', image: 'https://picsum.photos/800/300?random=banner3', link: '/pages/vip/index', type: 1, sort: 3, status: 1, create_time: nowTs() }
  ];
}

function generateReports(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: ri(1, 50),
    target_user_id: ri(51, 80),
    type: rpick(['fraud', 'harassment', 'spam', 'inappropriate', 'other']),
    content: rpick(['发送骚扰信息', '虚假宣传', '刷屏广告', '不文明用语', '其他违规行为']),
    status: ri(0, 2),
    images: Math.random() < 0.3 ? JSON.stringify([`https://picsum.photos/200/200?random=rpt${i}`]) : null,
    remark: null,
    create_time: past(30),
    update_time: past(7)
  }));
}

function generateChatRooms(userIds, count = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    target_user_id: rpick([...userIds, ...Array.from({ length: 30 }, (_, j) => j + 51)]),
    last_message: rpick(['好的，没问题', '我们开始吧', '谢谢', '哈哈，太有意思了', '稍等一下']),
    last_message_time: past(7),
    unread_count: ri(0, 10),
    status: 1,
    create_time: past(30),
    update_time: past(1)
  }));
}

function generateChatLogs(userIds, count = 50) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    room_id: ri(1, 10),
    sender_id: rpick(userIds),
    receiver_id: ri(51, 80),
    content: rpick(COMMENT_CONTENTS),
    type: rpick(['text', 'image']),
    status: 1,
    create_time: past(30)
  }));
}

function generateDemands(userIds, count = 15) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    game_id: ri(1, 10),
    title: rpick(['求带飞王者', '找个陪玩聊聊天', '周末上分车队', '约会陪玩', '游戏教学', '深夜陪玩']),
    description: rpick(POST_CONTENTS),
    price_min: rf(20, 100),
    price_max: rf(100, 300),
    gender_prefer: ri(0, 2),
    age_min: 18,
    age_max: ri(25, 35),
    status: ri(0, 2),
    create_time: past(14),
    update_time: past(1)
  }));
}

function generateWithdraws(userIds, count = 20) {
  return Array.from({ length: count }, (_, i) => {
    const type = rpick(['alipay', 'wechat', 'bank']);
    const money = rf(50, 5000);
    return {
      id: i + 1,
      user_id: rpick(userIds),
      money,
      pay_money: money,
      shouxufei: rf(0, money * 0.1, 2),
      type: type === 'alipay' ? 1 : (type === 'wechat' ? 2 : 3),
      bank: type === 'bank' ? '6222****' + ri(1000, 9999) : null,
      name: type === 'bank' ? genName(ri(0, 2)) : null,
      mobile: genMobile(),
      image: null,
      is_check: ri(0, 2),
      state: rpick(['pending', 'approved', 'rejected', 'processing']),
      wx_ti_id: null,
      lailu: null,
      create_time: Math.floor(Date.now() / 1000) - ri(0, 30) * 86400,
      update_time: Math.floor(Date.now() / 1000) - ri(0, 7) * 86400
    };
  });
}

function generateCallRecords(userIds, count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    call_no: `CALL${Date.now()}_${i + 1}_${ri(10000, 99999)}`,
    caller_id: rpick(userIds),
    callee_id: ri(51, 80),
    type: rpick(['audio', 'video']),
    status: rpick([0, 1, 2, 3]),
    duration: ri(0, 3600),
    start_time: past(30),
    end_time: past(30) + ri(0, 3600),
    create_time: past(30)
  }));
}

function generateCallBillings(callIds, userIds, count = 20) {
  return Array.from({ length: Math.min(count, callIds.length) }, (_, i) => ({
    id: i + 1,
    call_id: rpick(callIds),
    user_id: rpick(userIds),
    companion_id: ri(51, 80),
    duration: ri(60, 3600),
    unit_price: rf(0.5, 5),
    total_amount: rf(1, 100),
    status: 1,
    settle_time: past(7),
    create_time: past(30)
  }));
}

function generateVipOrders(userIds, count = 15) {
  const months = [1, 3, 12];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    package_id: ri(1, 3),
    order_no: `VIP${Date.now()}_${i + 1}_${ri(10000, 99999)}`,
    price: rpick([18, 48, 128]),
    duration: months[ri(0, 2)] * 30,
    status: ri(0, 1),
    create_time: past(90)
  }));
}

function generateAlbumPhotos(userIds, count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    image_url: `https://picsum.photos/600/400?random=album${i}`,
    description: rpick(['游戏截图留念', '今日份快乐', '和好友开黑', '胜利时刻', '我的皮肤收藏']),
    privacy: rpick(['public', 'public', 'public', 'password', 'paid']),
    password: Math.random() < 0.2 ? '1234' : null,
    price: Math.random() < 0.2 ? ri(10, 100) : 0,
    likes: ri(0, 500),
    create_time: past(60),
    status: 1
  }));
}

function generatePostUnlocks(postIds, userIds, count = 10) {
  const set = new Set();
  const list = [];
  for (let i = 0; i < count; i++) {
    let k;
    let attempts = 0;
    do {
      k = `${rpick(postIds)}_${rpick(userIds)}`;
      attempts++;
    } while (set.has(k) && attempts < 100);
    if (set.has(k)) continue;
    set.add(k);
    const [pid, uid] = k.split('_');
    list.push({
      id: list.length + 1,
      post_id: parseInt(pid),
      user_id: parseInt(uid),
      price: rf(1, 50),
      create_time: past(30)
    });
  }
  return list;
}

function generateRedPackets(senderIds, count = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    sender_id: rpick(senderIds),
    room_id: ri(1, 10),
    total_amount: rf(10, 200),
    total_count: ri(1, 10),
    remaining_amount: rf(0, 50),
    remaining_count: ri(0, 5),
    message: rpick(['恭喜发财', '大吉大利', '谢谢大家', '开黑快乐', '节日快乐']),
    status: ri(0, 1),
    expire_time: future(1),
    create_time: past(7)
  }));
}

function generateRedPacketLogs(redPacketIds, userIds, count = 30) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    red_packet_id: rpick(redPacketIds),
    user_id: rpick(userIds),
    amount: rf(0.5, 20),
    create_time: past(7)
  }));
}

function generateReserveSlots(vUserIds, count = 40) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.now() + ri(0, 14) * 86400000);
    return {
      id: i + 1,
      virtual_user_id: rpick(vUserIds),
      date: d.toISOString().slice(0, 10),
      start_time: `${String(ri(8, 21)).padStart(2, '0')}:00:00`,
      end_time: `${String(ri(9, 22)).padStart(2, '0')}:00:00`,
      status: ri(0, 1),
      create_time: past(7)
    };
  });
}

function generateGiftBags(count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: rpick(['新手礼包', '豪华礼包', '节日礼包', '春节大礼包', '周年庆礼包']),
    gifts: JSON.stringify(rpickN([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ri(2, 5))),
    price: rf(50, 500),
    status: 1,
    create_time: nowTs()
  }));
}

function generateSettings() {
  return [{
    id: 1,
    site_name: '多客陪玩',
    site_logo: null,
    customer_service_phone: '400-000-0000',
    customer_service_wechat: 'duoke_peer',
    about_us: '多客陪玩是一个专业的游戏陪玩平台，提供游戏陪玩、语音聊天、社交互动等服务。',
    privacy_policy: '我们重视您的隐私...',
    user_agreement: '请仔细阅读用户协议...',
    third_party_login_enabled: 1,
    create_time: nowTs(),
    update_time: nowTs()
  }];
}

function generateRecommendations(userIds, vUserIds, count = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    virtual_user_id: rpick(vUserIds),
    score: rf(0.5, 1),
    create_time: nowTs()
  }));
}

function generateVirtualChatHistory(userIds, vUserIds, count = 30) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: rpick(userIds),
    virtual_user_id: rpick(vUserIds),
    content: rpick([
      '你好呀，请问有什么需要帮助的吗？',
      '今天想玩什么游戏呢？',
      '好的，没问题！我带你上分～',
      '哈哈，你真有趣！',
      '稍等，我马上来',
      '这一把我们肯定能赢！'
    ]),
    role: ri(0, 1) ? 'user' : 'assistant',
    create_time: past(14)
  }));
}

// ===================== 主生成函数 =====================
async function generateAllSeedData() {
  const pwdHash = await bcrypt.hash('123456', 10);

  const users = generateUsers(50);
  // 给用户设置真实密码hash
  for (const u of users) {
    u.password = pwdHash;
  }
  const userIds = users.map(u => u.id);

  const games = generateGames();
  const gameIds = games.map(g => g.id);

  const circleTags = generateCircleTags();
  const tagIds = circleTags.map(c => c.id);

  const virtualUserTags = generateVirtualUserTags();
  const vuTagIds = virtualUserTags.map(t => t.id);

  const virtualUsers = generateVirtualUsers(30);
  const vUserIds = virtualUsers.map(v => v.id);

  const gifts = generateGifts();
  const giftIds = gifts.map(g => g.id);

  const rechargePackages = generateRechargePackages();
  const vipPackages = generateVipPackages();
  const cards = generateCards(30);
  const banners = generateBanners();
  const settings = generateSettings();

  // 关联数据
  const gameOrders = generateGameOrders(userIds, gameIds, 50);
  const posts = generatePosts(userIds, tagIds, 40);
  const postIds = posts.map(p => p.id);

  const postLikes = generatePostLikes(postIds, userIds, 80);
  const postComments = generatePostComments(postIds, userIds, 60);
  const userFollows = generateUserFollows(userIds, 60);
  const reserves = generateReserves(userIds, vUserIds, gameIds, 30);
  const giftLogs = generateGiftLogs(userIds, giftIds, vUserIds, 50);
  const rechargeOrders = generateRechargeOrders(userIds, 30);
  const companionProfiles = generateCompanionProfiles(userIds, gameIds, 20);
  const vuTagRelations = generateVirtualUserTagRelations(vUserIds, vuTagIds, 20);
  const reports = generateReports(20);
  const chatRooms = generateChatRooms(userIds, 10);
  const chatLogs = generateChatLogs(userIds, 50);
  const demands = generateDemands(userIds, 15);
  const withdraws = generateWithdraws(userIds, 20);
  const callRecords = generateCallRecords(userIds, 20);
  const callRecordIds = callRecords.map(c => c.id);
  const callBillings = generateCallBillings(callRecordIds, userIds, 20);
  const vipOrders = generateVipOrders(userIds, 15);
  const albumPhotos = generateAlbumPhotos(userIds, 20);
  const postUnlocks = generatePostUnlocks(postIds, userIds, 10);
  const redPackets = generateRedPackets(userIds, 10);
  const rpIds = redPackets.map(r => r.id);
  const redPacketLogs = generateRedPacketLogs(rpIds, userIds, 30);
  const reserveSlots = generateReserveSlots(vUserIds, 40);
  const giftBags = generateGiftBags(5);
  const recommendations = generateRecommendations(userIds, vUserIds, 10);
  const virtualChatHistory = generateVirtualChatHistory(userIds, vUserIds, 30);

  // Admin & Roles
  const adminRoles = [
    { id: 1, name: '超级管理员', description: '拥有全部权限', permissions: JSON.stringify(['*']), status: 1, is_super: 1, sort: 1, create_time: nowTs(), create_admin_id: 0 }
  ];
  const admins = [
    { id: 1, username: 'admin', password: await bcrypt.hash('admin123', 10), nickname: '系统管理员', avatar: null, email: 'admin@duoke.com', phone: '13800000000', role_id: 1, permissions: JSON.stringify(['*']), status: 1, last_login_time: nowTs(), last_login_ip: '127.0.0.1', create_time: nowTs(), create_admin_id: 0 }
  ];

  // CustomerService
  const customerServices = [
    { id: 1, name: '客服小美', avatar: genAvatar(9001), intro: '很高兴为您服务', status: 1, sort: 1, create_time: nowTs(), update_time: nowTs() },
    { id: 2, name: '客服小明', avatar: genAvatar(9002), intro: '24小时在线', status: 1, sort: 2, create_time: nowTs(), update_time: nowTs() }
  ];

  return {
    xn_admin: admins,
    xn_admin_role: adminRoles,
    xn_user: users,
    xn_virtual_user: virtualUsers,
    xn_game: games,
    xn_circle_tag: circleTags,
    virtual_user_tag: virtualUserTags,
    xn_gift: gifts,
    xn_recharge_package: rechargePackages,
    xn_vip_package: vipPackages,
    xn_card: cards,
    xn_banner: banners,
    xn_setting: settings,
    xn_game_order: gameOrders,
    xn_post: posts,
    xn_post_like: postLikes,
    xn_post_comment: postComments,
    xn_user_follow: userFollows,
    xn_reserve: reserves,
    xn_gift_log: giftLogs,
    xn_order_chong: rechargeOrders,
    xn_companion_profile: companionProfiles,
    xn_virtual_user_tag_relation: vuTagRelations,
    xn_report: reports,
    xn_chat_room: chatRooms,
    xn_chat_log: chatLogs,
    xn_demand: demands,
    xn_withdraw: withdraws,
    xn_call_record: callRecords,
    xn_call_billing: callBillings,
    xn_vip_order: vipOrders,
    xn_album_photo: albumPhotos,
    xn_post_unlock: postUnlocks,
    xn_red_packet: redPackets,
    xn_red_packet_log: redPacketLogs,
    xn_reserve_slot: reserveSlots,
    xn_gift_bag: giftBags,
    xn_recommend: recommendations,
    xn_virtual_chat_history: virtualChatHistory,
    xn_customer_service: customerServices
  };
}

module.exports = { generateAllSeedData };
