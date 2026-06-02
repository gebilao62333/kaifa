const { Sequelize, DataTypes } = require('sequelize');
const config = require('../src/config');

const sequelize = new Sequelize(
  config.db.mysql.name,
  config.db.mysql.user,
  config.db.mysql.password,
  {
    host: config.db.mysql.host,
    port: config.db.mysql.port,
    dialect: 'mysql',
    charset: config.db.mysql.charset,
    logging: false
  }
);

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

const tags = [
  ['温柔', '甜音', '技术好'], ['打野', '带飞', '幽默'], ['娱乐', '聊天', '唱歌'],
  ['技术陪', '上分', '教学'], ['活泼开朗', '会拍照', '穿搭达人'],
  ['健身教练', '篮球健将', '阳光开朗'], ['逻辑思维强', '幽默搞笑', '团队协作'],
  ['专业羽毛球', '耐心指导', '运动达人'], ['美食达人', '会拍照', '开朗健谈'],
  ['电影爱好者', '影评达人', '温和有礼'], ['技术流', '幽默', '上分快'],
  ['声音甜', '可爱', '娱乐'], ['职业选手', '带飞', '高效'],
  ['全能', '颜值高', '互动好'], ['野王', '节奏大师', '意识流'],
  ['中单', 'Carry', '支援'], ['狙击手', '战术', '苟王'],
  ['刺客', '爆发', '收割'], ['辅助', '保护', '开团'],
  ['法师', '控制', '输出'], ['上单', '抗压', '团战'],
  ['软辅', '治疗', '护盾'], ['硬辅', '开团', '坦度'],
  ['ADC', '后期', '输出'], ['打野', '节奏', '反蹲'],
  ['游走', 'Gank', '入侵'], ['运营', '视野', '控图'],
  ['操作秀', '极限', '反应快'], ['意识流', '预判', '决策']
];

const games = ['王者荣耀', '和平精英', '英雄联盟', '永劫无间', '原神', 'CS2', 'DOTA2', 'PUBG', 'Apex英雄', 'Valorant'];

const offlineServices = ['逛街购物', '看电影', '美食探店', '运动健身', '篮球', '跑步陪练', '密室逃脱', '羽毛球', '桌游', 'KTV'];

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

const generateMockUsers = (count = 50) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    const isVip = randomInt(0, 3) > 0;
    users.push({
      id: i,
      userId: i,
      username: `user${String(i).padStart(3, '0')}`,
      nickname: randomItem(names),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
      mobile: `1${randomInt(3, 9)}${String(randomInt(0, 999999999)).padStart(9, '0')}`,
      password: '$2a$10$defaultPasswordHash',
      money: randomInt(0, 20000),
      gift_money: randomInt(0, 500),
      score: randomInt(0, 10000),
      lv: randomInt(1, 50),
      vip: isVip ? 1 : 0,
      vip_lv: isVip ? randomInt(1, 5) : 0,
      vip_expire_time: isVip ? Math.floor(Date.now() / 1000) + randomInt(30, 365) * 86400 : 0,
      sex: randomInt(0, 1),
      city: randomItem(locations),
      status: randomInt(0, 1) === 1 ? 0 : 1,
      fans_num: randomInt(0, 5000),
      create_time: Math.floor(Date.now() / 1000) - randomInt(0, 365) * 86400,
      last_login_time: Math.floor(Date.now() / 1000) - randomInt(0, 24) * 3600,
      dec: ['喜欢玩游戏', '新人报道', '资深玩家', '', '热爱生活'][randomInt(0, 4)]
    });
  }
  return users;
};

const generateMockVirtualUsers = (count = 50) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      id: i,
      name: randomItem(names),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=virtual${i}`,
      gender: randomInt(0, 1),
      age: randomInt(18, 35),
      region: randomItem(locations),
      tags: JSON.stringify([randomInt(1, 5), randomInt(1, 5), randomInt(1, 5)]),
      intro: `${randomItem(['性格开朗', '温柔体贴', '幽默风趣', '技术过硬'])}, ${randomItem(games)}${randomItem(['段位王者', '技术一流', '带你上分'])}, ${randomItem(['声音甜美', '声音磁性', '聊天氛围轻松'])}`,
      price_per_hour: randomInt(30, 200),
      online_status: randomInt(0, 1),
      is_recommend: randomInt(0, 1),
      status: 1,
      create_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000)
    });
  }
  return users;
};

const generateMockPosts = (count = 50) => {
  const posts = [];
  for (let i = 1; i <= count; i++) {
    const hasImages = randomInt(0, 1) === 1;
    const imageCount = hasImages ? randomInt(1, 3) : 0;
    const images = imageCount > 0 ? JSON.stringify(Array(imageCount).fill(null).map((_, idx) => `https://picsum.photos/400/300?random=${i * 100 + idx}`)) : null;
    
    posts.push({
      id: i,
      user_id: randomInt(1, 50),
      content: randomItem(postContents),
      images: images,
      videos: null,
      thumb_num: randomInt(10, 1000),
      comment_num: randomInt(5, 200),
      share_num: randomInt(0, 50),
      tag_id: randomInt(1, 5),
      type: 0,
      status: 1,
      is_private: 0,
      private_password: null,
      private_price: 0,
      create_time: Math.floor(Date.now() / 1000) - randomInt(0, 7) * 86400 - randomInt(0, 24) * 3600,
      update_time: Math.floor(Date.now() / 1000)
    });
  }
  return posts;
};

const generateMockGameOrders = (count = 50) => {
  const statuses = ['pending', 'ongoing', 'completed', 'cancelled'];
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const status = randomItem(statuses);
    const duration = randomInt(30, 180);
    const price = randomInt(30, 200);
    const amount = Math.round(price * duration / 60 * 100) / 100;
    
    orders.push({
      id: i,
      order_no: `ORD${Date.now().toString().slice(-8)}${String(i).padStart(3, '0')}`,
      user_id: randomInt(1, 50),
      game_id: randomInt(1, 5),
      game_name: randomItem(games),
      companion_id: randomInt(1, 50),
      companion_name: randomItem(names),
      duration: duration,
      price: price,
      amount: amount,
      status: status,
      remark: randomInt(0, 2) === 0 ? '' : randomItem(['希望能赢', '技术好一点', '聊天开心']),
      create_time: Math.floor(Date.now() / 1000) - randomInt(0, 7) * 86400,
      start_time: status !== 'pending' && status !== 'cancelled' ? Math.floor(Date.now() / 1000) - randomInt(0, 24) * 3600 : null,
      end_time: status === 'completed' ? Math.floor(Date.now() / 1000) : null,
      cancel_time: status === 'cancelled' ? Math.floor(Date.now() / 1000) - randomInt(0, 24) * 3600 : null
    });
  }
  return orders;
};

const generateMockCompanionProfiles = (count = 30) => {
  const profiles = [];
  for (let i = 1; i <= count; i++) {
    profiles.push({
      id: i,
      user_id: randomInt(1, 50),
      game_ids: JSON.stringify([randomInt(1, 5), randomInt(1, 5)]),
      skill_level: randomItem(['王者', '钻石', '大师', '白金', '黄金']),
      price_per_hour: randomInt(30, 200),
      intro: `${randomItem(games)}${randomItem(['上分', '娱乐', '教学'])}陪玩，${randomItem(['全天在线', '技术过硬', '聊天有趣'])}`,
      online_status: randomInt(0, 1),
      status: randomInt(1, 2),
      create_time: Math.floor(Date.now() / 1000) - randomInt(0, 30) * 86400,
      update_time: Math.floor(Date.now() / 1000)
    });
  }
  return profiles;
};

const generateMockChatLogs = (count = 100) => {
  const logs = [];
  for (let i = 1; i <= count; i++) {
    logs.push({
      id: i,
      fromid: randomInt(1, 50),
      toid: randomInt(1000, 1050),
      content: randomItem(['你好', '在吗', '一起玩游戏吗', '好的', '没问题', '明天见', '今晚有空吗', 'OK', '可以', '太棒了']),
      type: 0,
      vod_url: null,
      sec: 0,
      time: Math.floor(Date.now() / 1000) - randomInt(0, 24) * 3600,
      isread: randomInt(0, 1),
      is_del: 0,
      is_revoked: 0
    });
  }
  return logs;
};

async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    const User = sequelize.define('User', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      userId: DataTypes.BIGINT,
      username: DataTypes.STRING(60),
      nickname: { type: DataTypes.STRING(50), allowNull: false },
      avatar: DataTypes.STRING(255),
      mobile: DataTypes.STRING(16),
      password: DataTypes.STRING(255),
      money: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      gift_money: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      score: { type: DataTypes.INTEGER, defaultValue: 0 },
      lv: { type: DataTypes.INTEGER, defaultValue: 1 },
      vip: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      vip_lv: { type: DataTypes.INTEGER, defaultValue: 0 },
      vip_expire_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      sex: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      city: DataTypes.STRING(50),
      status: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      fans_num: { type: DataTypes.INTEGER, defaultValue: 0 },
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      last_login_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      dec: DataTypes.STRING(255)
    }, { tableName: 'xn_user', timestamps: false });

    const VirtualUser = sequelize.define('VirtualUser', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      avatar: { type: DataTypes.STRING(255), allowNull: false },
      gender: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      age: { type: DataTypes.INTEGER, defaultValue: 0 },
      region: DataTypes.STRING(50),
      tags: DataTypes.TEXT,
      intro: DataTypes.TEXT,
      price_per_hour: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      online_status: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      is_recommend: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      status: { type: DataTypes.TINYINT(1), defaultValue: 1 },
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      update_time: { type: DataTypes.INTEGER(10), defaultValue: 0 }
    }, { tableName: 'xn_virtual_user', timestamps: false });

    const Post = sequelize.define('Post', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      user_id: { type: DataTypes.BIGINT, allowNull: false },
      content: DataTypes.TEXT,
      images: DataTypes.TEXT,
      videos: DataTypes.TEXT,
      thumb_num: { type: DataTypes.INTEGER, defaultValue: 0 },
      comment_num: { type: DataTypes.INTEGER, defaultValue: 0 },
      share_num: { type: DataTypes.INTEGER, defaultValue: 0 },
      tag_id: DataTypes.BIGINT,
      type: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      status: { type: DataTypes.TINYINT(1), defaultValue: 1 },
      is_private: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      private_password: DataTypes.STRING(50),
      private_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      update_time: { type: DataTypes.INTEGER(10), defaultValue: 0 }
    }, { tableName: 'xn_post', timestamps: false });

    const GameOrder = sequelize.define('GameOrder', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      order_no: { type: DataTypes.STRING(50), allowNull: false },
      user_id: { type: DataTypes.BIGINT, allowNull: false },
      game_id: { type: DataTypes.BIGINT, allowNull: false },
      game_name: DataTypes.STRING(50),
      companion_id: { type: DataTypes.BIGINT, allowNull: false },
      companion_name: DataTypes.STRING(50),
      duration: { type: DataTypes.INTEGER, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
      remark: DataTypes.TEXT,
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      start_time: DataTypes.INTEGER(10),
      end_time: DataTypes.INTEGER(10),
      cancel_time: DataTypes.INTEGER(10)
    }, { tableName: 'xn_game_order', timestamps: false });

    const CompanionProfile = sequelize.define('CompanionProfile', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      user_id: { type: DataTypes.BIGINT, allowNull: false },
      game_ids: DataTypes.TEXT,
      skill_level: DataTypes.STRING(50),
      price_per_hour: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      intro: DataTypes.TEXT,
      online_status: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      status: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      update_time: { type: DataTypes.INTEGER(10), defaultValue: 0 }
    }, { tableName: 'xn_companion_profile', timestamps: false });

    const ChatLog = sequelize.define('ChatLog', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      fromid: { type: DataTypes.BIGINT, allowNull: false },
      toid: { type: DataTypes.BIGINT, allowNull: false },
      content: DataTypes.TEXT,
      type: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      vod_url: DataTypes.STRING(255),
      sec: { type: DataTypes.INTEGER, defaultValue: 0 },
      time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      isread: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      is_del: { type: DataTypes.TINYINT(1), defaultValue: 0 },
      is_revoked: { type: DataTypes.TINYINT(1), defaultValue: 0 }
    }, { tableName: 'xn_chat_log', timestamps: false });

    const CircleTag = sequelize.define('CircleTag', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      icon: DataTypes.STRING(255),
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      status: { type: DataTypes.TINYINT(1), defaultValue: 1 },
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      update_time: { type: DataTypes.INTEGER(10), defaultValue: 0 }
    }, { tableName: 'xn_circle_tag', timestamps: false });

    const VirtualUserTag = sequelize.define('VirtualUserTag', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      icon: DataTypes.STRING(255),
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      status: { type: DataTypes.TINYINT(1), defaultValue: 1 },
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      update_time: { type: DataTypes.INTEGER(10), defaultValue: 0 }
    }, { tableName: 'xn_virtual_user_tag', timestamps: false });

    const Game = sequelize.define('Game', {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      icon: DataTypes.STRING(255),
      description: DataTypes.TEXT,
      status: { type: DataTypes.TINYINT(1), defaultValue: 1 },
      sort: { type: DataTypes.INTEGER, defaultValue: 0 },
      create_time: { type: DataTypes.INTEGER(10), defaultValue: 0 },
      update_time: { type: DataTypes.INTEGER(10), defaultValue: 0 }
    }, { tableName: 'xn_game', timestamps: false });

    console.log('📥 开始导入数据...');

    await User.bulkCreate(generateMockUsers(50), { ignoreDuplicates: true });
    console.log('✅ 已导入 50 条用户数据');

    await VirtualUserTag.bulkCreate([
      { id: 1, name: '王者荣耀', icon: 'icon1', sort_order: 1, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 2, name: '英雄联盟', icon: 'icon2', sort_order: 2, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 3, name: '和平精英', icon: 'icon3', sort_order: 3, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 4, name: '原神', icon: 'icon4', sort_order: 4, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 5, name: '永劫无间', icon: 'icon5', sort_order: 5, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) }
    ], { ignoreDuplicates: true });
    console.log('✅ 已导入虚拟用户标签数据');

    await VirtualUser.bulkCreate(generateMockVirtualUsers(50), { ignoreDuplicates: true });
    console.log('✅ 已导入 50 条虚拟用户数据');

    await CircleTag.bulkCreate([
      { id: 1, name: '游戏', icon: '🎮', sort_order: 1, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 2, name: '情感', icon: '💝', sort_order: 2, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 3, name: '技术', icon: '💻', sort_order: 3, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 4, name: '生活', icon: '🌄', sort_order: 4, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 5, name: '娱乐', icon: '🎉', sort_order: 5, status: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) }
    ], { ignoreDuplicates: true });
    console.log('✅ 已导入圈子标签数据');

    await Game.bulkCreate([
      { id: 1, name: '王者荣耀', icon: 'game1.jpg', description: '5V5公平竞技手游', status: 1, sort: 1, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 2, name: '英雄联盟', icon: 'game2.jpg', description: 'MOBA竞技网游', status: 1, sort: 2, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 3, name: '和平精英', icon: 'game3.jpg', description: '战术竞技手游', status: 1, sort: 3, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 4, name: '原神', icon: 'game4.jpg', description: '开放世界冒险游戏', status: 1, sort: 4, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) },
      { id: 5, name: '永劫无间', icon: 'game5.jpg', description: '动作竞技游戏', status: 1, sort: 5, create_time: Math.floor(Date.now() / 1000), update_time: Math.floor(Date.now() / 1000) }
    ], { ignoreDuplicates: true });
    console.log('✅ 已导入游戏数据');

    await Post.bulkCreate(generateMockPosts(50), { ignoreDuplicates: true });
    console.log('✅ 已导入 50 条动态数据');

    await GameOrder.bulkCreate(generateMockGameOrders(50), { ignoreDuplicates: true });
    console.log('✅ 已导入 50 条游戏订单数据');

    await CompanionProfile.bulkCreate(generateMockCompanionProfiles(30), { ignoreDuplicates: true });
    console.log('✅ 已导入 30 条陪玩师资料数据');

    await ChatLog.bulkCreate(generateMockChatLogs(100), { ignoreDuplicates: true });
    console.log('✅ 已导入 100 条聊天记录数据');

    console.log('\n🎉 所有数据导入完成！');

  } catch (error) {
    console.error('❌ 数据导入失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
