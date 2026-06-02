const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const names = [
  '小雪', '阿杰', '小美', '大飞', '小明', '小红', '小刚', '小丽', 
  '小华', '小芳', '小强', '小敏', '小磊', '小婷', '小峰', '小娜',
  '小涛', '小燕', '小伟', '小琳', '小杰', '小琪', '小龙', '小雯',
  '小鹏', '小莹', '小波', '小琴', '小涛', '小萍', '小勇', '小霞',
  '小辉', '小艳', '小军', '小妮', '小涛', '小燕', '小超', '小颖',
  '小峰', '小婷', '小鹏', '小琳', '小磊', '小芳', '小伟', '小红',
  '小明', '小丽'
];

const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
const games = ['王者荣耀', '英雄联盟', '和平精英', '永劫无间', '原神', 'CS2', 'DOTA2', 'PUBG', 'Apex英雄', 'Valorant'];

const postContents = [
  '今天玩王者太开心了，连胜五把！有没有大神带我上分呀～🎮✨',
  '新赛季更新了，感觉打野位又加强了！有没有一起开黑的小伙伴？',
  '今天心情不好，有人陪我聊聊天吗？🥺',
  '技术教学：如何在团战中打出最高伤害？学会这些技巧轻松上王者！',
  '刚抽到了心仪的皮肤，开心！有没有人来一起玩？',
  '周末有空一起打游戏吗？在线等队友～',
  '分享一下我的上分心得，希望对大家有帮助！',
  '有没有小姐姐小哥哥一起组队呀？',
  '今天手感超好，carry全场！',
  '新英雄太厉害了，推荐大家试试！',
  '排位赛遇到坑队友，心态崩了😤',
  '终于上王者了！感谢一路陪伴的队友们！',
  '有没有人一起练英雄？互相学习互相进步！',
  '深夜上分中，有没有夜猫子一起？',
  '求带飞！我可以当挂件～',
  '刚学会一个新技巧，来秀一波！',
  '游戏而已，开心最重要！',
  '有没有车队缺人？我可以补位！',
  '今天战绩不错，纪念一下！',
  '有没有人一起玩新模式？'
];

const tagNames = ['游戏', '情感', '技术', '生活', '娱乐'];

async function main() {
  const fs = require('fs');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ 无法打开数据库:', err.message);
      process.exit(1);
    }
    console.log('✅ 已连接到SQLite数据库');
  });

  db.serialize(async () => {
    console.log('\n📥 创建数据表...');

    db.run(`CREATE TABLE IF NOT EXISTS xn_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      nickname TEXT NOT NULL,
      avatar TEXT,
      mobile TEXT,
      password TEXT,
      email TEXT,
      open_id TEXT,
      unionid TEXT,
      money REAL DEFAULT 0,
      gift_money REAL DEFAULT 0,
      gift_money_zong REAL DEFAULT 0,
      score INTEGER DEFAULT 0,
      lv INTEGER DEFAULT 1,
      vip INTEGER DEFAULT 0,
      vip_lv INTEGER DEFAULT 0,
      vip_expire_time INTEGER DEFAULT 0,
      sex INTEGER DEFAULT 0,
      city TEXT,
      status INTEGER DEFAULT 0,
      jinyan_time INTEGER DEFAULT 0,
      is_dav INTEGER DEFAULT 0,
      is_manage_normal INTEGER DEFAULT 0,
      fans_num INTEGER DEFAULT 0,
      follow_num INTEGER DEFAULT 0,
      dec TEXT,
      create_time INTEGER DEFAULT 0,
      last_login_time INTEGER DEFAULT 0,
      ip TEXT,
      platform TEXT,
      update_time INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_virtual_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      gender INTEGER DEFAULT 0,
      age INTEGER DEFAULT 0,
      region TEXT,
      tags TEXT,
      intro TEXT,
      price_per_hour REAL DEFAULT 0,
      online_status INTEGER DEFAULT 0,
      is_recommend INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      create_time INTEGER DEFAULT 0,
      update_time INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_virtual_user_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      create_time INTEGER DEFAULT 0,
      update_time INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_post (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT,
      images TEXT,
      videos TEXT,
      thumb_num INTEGER DEFAULT 0,
      comment_num INTEGER DEFAULT 0,
      share_num INTEGER DEFAULT 0,
      tag_id INTEGER,
      tag_name TEXT,
      type INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      is_private INTEGER DEFAULT 0,
      create_time INTEGER DEFAULT 0,
      update_time INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_game_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      game_name TEXT,
      companion_id INTEGER NOT NULL,
      companion_name TEXT,
      duration INTEGER NOT NULL,
      price REAL NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      create_time INTEGER DEFAULT 0,
      start_time INTEGER,
      end_time INTEGER,
      cancel_time INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_companion_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_ids TEXT,
      skill_level TEXT,
      price_per_hour REAL DEFAULT 0,
      intro TEXT,
      online_status INTEGER DEFAULT 0,
      online_service INTEGER DEFAULT 0,
      offline_service INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      create_time INTEGER DEFAULT 0,
      update_time INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_chat_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromid INTEGER NOT NULL,
      toid INTEGER NOT NULL,
      content TEXT,
      type INTEGER DEFAULT 0,
      vod_url TEXT,
      sec INTEGER DEFAULT 0,
      time INTEGER DEFAULT 0,
      isread INTEGER DEFAULT 0,
      is_del INTEGER DEFAULT 0,
      is_revoked INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_circle_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      create_time INTEGER DEFAULT 0,
      update_time INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_game (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      status INTEGER DEFAULT 1,
      sort INTEGER DEFAULT 0,
      create_time INTEGER DEFAULT 0,
      update_time INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS xn_gift (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT,
      svga TEXT,
      money REAL DEFAULT 0,
      type INTEGER DEFAULT 0,
      is_vip INTEGER DEFAULT 0,
      tian INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      sort INTEGER DEFAULT 0,
      create_time INTEGER DEFAULT 0
    )`);

    console.log('✅ 数据表创建完成');

    console.log('\n📥 插入用户数据...');
    const userStmt = db.prepare(`INSERT INTO xn_user 
      (user_id, username, nickname, avatar, mobile, password, money, gift_money, score, lv, vip, vip_lv, vip_expire_time, sex, city, status, fans_num, follow_num, dec, create_time, update_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    for (let i = 1; i <= 50; i++) {
      const isVip = randomInt(0, 3) > 0;
      userStmt.run(
        i,
        `user${String(i).padStart(3, '0')}`,
        randomItem(names),
        `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
        `1${randomInt(3, 9)}${String(randomInt(0, 999999999)).padStart(9, '0')}`,
        '$2a$10$defaultPasswordHash',
        randomInt(0, 20000),
        randomInt(0, 500),
        randomInt(0, 10000),
        randomInt(1, 50),
        isVip ? 1 : 0,
        isVip ? randomInt(1, 5) : 0,
        isVip ? Math.floor(Date.now() / 1000) + randomInt(30, 365) * 86400 : 0,
        randomInt(0, 1),
        randomItem(locations),
        randomInt(0, 1),
        randomInt(0, 5000),
        randomInt(0, 500),
        ['喜欢玩游戏', '新人报道', '资深玩家', '', '热爱生活'][randomInt(0, 4)],
        Math.floor(Date.now() / 1000) - randomInt(0, 365) * 86400,
        Math.floor(Date.now() / 1000)
      );
    }
    userStmt.finalize();
    console.log('✅ 已插入50条用户数据');

    console.log('\n📥 插入虚拟用户标签...');
    const virtualTagStmt = db.prepare(`INSERT INTO xn_virtual_user_tag (id, name, icon, sort_order, status, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const virtualTags = [
      { id: 1, name: '王者荣耀', icon: 'icon1' },
      { id: 2, name: '英雄联盟', icon: 'icon2' },
      { id: 3, name: '和平精英', icon: 'icon3' },
      { id: 4, name: '原神', icon: 'icon4' },
      { id: 5, name: '永劫无间', icon: 'icon5' }
    ];
    virtualTags.forEach((tag, idx) => {
      virtualTagStmt.run(tag.id, tag.name, tag.icon, idx + 1, 1, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000));
    });
    virtualTagStmt.finalize();
    console.log('✅ 已插入虚拟用户标签');

    console.log('\n📥 插入虚拟用户数据...');
    const virtualUserStmt = db.prepare(`INSERT INTO xn_virtual_user 
      (name, avatar, gender, age, region, tags, intro, price_per_hour, online_status, is_recommend, status, create_time, update_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    for (let i = 1; i <= 50; i++) {
      const tags = [randomInt(1, 5), randomInt(1, 5), randomInt(1, 5)];
      virtualUserStmt.run(
        randomItem(names),
        `https://api.dicebear.com/7.x/avataaars/svg?seed=virtual${i}`,
        randomInt(0, 1),
        randomInt(18, 35),
        randomItem(locations),
        JSON.stringify(tags),
        `${randomItem(['性格开朗', '温柔体贴', '幽默风趣', '技术过硬'])}, ${randomItem(games)}${randomItem(['段位王者', '技术一流', '带你上分'])}, ${randomItem(['声音甜美', '声音磁性', '聊天氛围轻松'])}`,
        randomInt(30, 200),
        randomInt(0, 1),
        randomInt(0, 1),
        1,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      );
    }
    virtualUserStmt.finalize();
    console.log('✅ 已插入50条虚拟用户数据');

    console.log('\n📥 插入圈子标签...');
    const circleTagStmt = db.prepare(`INSERT INTO xn_circle_tag (id, name, icon, sort_order, status, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const circleTags = [
      { id: 1, name: '最热', icon: '🔥' },
      { id: 2, name: '新手报到', icon: '👋' },
      { id: 3, name: '技术', icon: '💻' },
      { id: 4, name: '生活', icon: '🌄' },
      { id: 5, name: '娱乐', icon: '🎉' }
    ];
    circleTags.forEach((tag, idx) => {
      circleTagStmt.run(tag.id, tag.name, tag.icon, idx + 1, 1, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000));
    });
    circleTagStmt.finalize();
    console.log('✅ 已插入圈子标签');

    console.log('\n📥 插入游戏数据...');
    const gameStmt = db.prepare(`INSERT INTO xn_game (id, name, icon, description, status, sort, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const gameData = [
      { id: 1, name: '王者荣耀', icon: 'game1.jpg', desc: '5V5公平竞技手游' },
      { id: 2, name: '英雄联盟', icon: 'game2.jpg', desc: 'MOBA竞技网游' },
      { id: 3, name: '和平精英', icon: 'game3.jpg', desc: '战术竞技手游' },
      { id: 4, name: '原神', icon: 'game4.jpg', desc: '开放世界冒险游戏' },
      { id: 5, name: '永劫无间', icon: 'game5.jpg', desc: '动作竞技游戏' }
    ];
    gameData.forEach((game, idx) => {
      gameStmt.run(game.id, game.name, game.icon, game.desc, 1, idx + 1, Math.floor(Date.now() / 1000) - (100 - idx * 10) * 86400, Math.floor(Date.now() / 1000));
    });
    gameStmt.finalize();
    console.log('✅ 已插入游戏数据');

    console.log('\n📥 插入动态数据...');
    const postStmt = db.prepare(`INSERT INTO xn_post 
      (user_id, content, images, thumb_num, comment_num, share_num, tag_id, tag_name, type, status, is_private, create_time, update_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    for (let i = 1; i <= 50; i++) {
      const hasImages = randomInt(0, 1) === 1;
      const imageCount = hasImages ? randomInt(1, 3) : 0;
      const images = imageCount > 0 ? JSON.stringify(Array(imageCount).fill(null).map((_, idx) => `https://picsum.photos/400/300?random=${i * 100 + idx}`)) : null;
      const tagIdx = randomInt(0, 4);
      
      postStmt.run(
        randomInt(1, 50),
        randomItem(postContents),
        images,
        randomInt(10, 1000),
        randomInt(5, 200),
        randomInt(0, 50),
        tagIdx + 1,
        tagNames[tagIdx],
        0,
        1,
        0,
        Math.floor(Date.now() / 1000) - randomInt(0, 7) * 86400 - randomInt(0, 24) * 3600,
        Math.floor(Date.now() / 1000)
      );
    }
    postStmt.finalize();
    console.log('✅ 已插入50条动态数据');

    console.log('\n📥 插入游戏订单...');
    const orderStmt = db.prepare(`INSERT INTO xn_game_order 
      (order_no, user_id, game_id, game_name, companion_id, companion_name, duration, price, amount, status, remark, create_time, start_time, end_time, cancel_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    const statuses = ['pending', 'ongoing', 'completed', 'cancelled'];
    for (let i = 1; i <= 50; i++) {
      const status = randomItem(statuses);
      const duration = randomInt(30, 180);
      const price = randomInt(30, 200);
      const amount = Math.round(price * duration / 60 * 100) / 100;
      const now = Math.floor(Date.now() / 1000);
      
      orderStmt.run(
        `ORD${Date.now().toString().slice(-8)}${String(i).padStart(3, '0')}`,
        randomInt(1, 50),
        randomInt(1, 5),
        randomItem(games),
        randomInt(1, 50),
        randomItem(names),
        duration,
        price,
        amount,
        status,
        randomInt(0, 2) === 0 ? '' : randomItem(['希望能赢', '技术好一点', '聊天开心']),
        now - randomInt(0, 7) * 86400,
        status !== 'pending' && status !== 'cancelled' ? now - randomInt(0, 24) * 3600 : null,
        status === 'completed' ? now : null,
        status === 'cancelled' ? now - randomInt(0, 24) * 3600 : null
      );
    }
    orderStmt.finalize();
    console.log('✅ 已插入50条游戏订单');

    console.log('\n📥 插入陪玩师资料...');
    const profileStmt = db.prepare(`INSERT INTO xn_companion_profile 
      (user_id, game_ids, skill_level, price_per_hour, intro, online_status, online_service, offline_service, status, create_time, update_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    for (let i = 1; i <= 30; i++) {
      let onlineService, offlineService;
      if (i <= 10) {
        onlineService = 1;
        offlineService = 1;
      } else if (i <= 20) {
        onlineService = 1;
        offlineService = 0;
      } else {
        onlineService = 0;
        offlineService = 1;
      }
      profileStmt.run(
        randomInt(1, 50),
        JSON.stringify([randomInt(1, 5), randomInt(1, 5)]),
        randomItem(['王者', '钻石', '大师', '白金', '黄金']),
        randomInt(30, 200),
        `${randomItem(games)}${randomItem(['上分', '娱乐', '教学'])}陪玩，${randomItem(['全天在线', '技术过硬', '聊天有趣'])}`,
        1,
        onlineService,
        offlineService,
        1,
        Math.floor(Date.now() / 1000) - randomInt(0, 30) * 86400,
        Math.floor(Date.now() / 1000)
      );
    }
    profileStmt.finalize();
    console.log('✅ 已插入30条陪玩师资料');

    console.log('\n📥 插入聊天记录...');
    const chatStmt = db.prepare(`INSERT INTO xn_chat_log (fromid, toid, content, type, time, isread, is_del, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const messages = ['你好', '在吗', '一起玩游戏吗', '好的', '没问题', '明天见', '今晚有空吗', 'OK', '可以', '太棒了', '等你', '马上来', '准备好了'];
    
    for (let i = 1; i <= 100; i++) {
      chatStmt.run(
        randomInt(1, 50),
        randomInt(1000, 1050),
        randomItem(messages),
        0,
        Math.floor(Date.now() / 1000) - randomInt(0, 24) * 3600,
        randomInt(0, 1),
        0,
        0
      );
    }
    chatStmt.finalize();
    console.log('✅ 已插入100条聊天记录');

    console.log('\n📥 插入礼物数据...');
    const giftStmt = db.prepare(`INSERT INTO xn_gift (title, image, svga, money, type, is_vip, tian, status, sort, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const gifts = [
      { title: '爱心', money: 1.00, sort: 1 },
      { title: '玫瑰花', money: 10.00, sort: 2 },
      { title: '蛋糕', money: 50.00, sort: 3 },
      { title: '钻戒', money: 999.00, is_vip: 1, sort: 4 },
      { title: '跑车', money: 1500.00, is_vip: 1, sort: 5 },
      { title: '火箭', money: 500.00, sort: 6 }
    ];
    gifts.forEach((gift, idx) => {
      giftStmt.run(gift.title, `https://picsum.photos/100/100?random=gift${idx + 1}`, '', gift.money, 0, gift.is_vip || 0, 0, 1, gift.sort, Math.floor(Date.now() / 1000));
    });
    giftStmt.finalize();
    console.log('✅ 已插入礼物数据');

    console.log('\n🎉 所有数据导入完成！');
    console.log(`📁 数据库文件位置: ${dbPath}`);

    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库失败:', err.message);
      }
    });
  });
}

main();
