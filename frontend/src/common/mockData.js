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

export const generateMockCompanions = (count = 20) => {
  const companions = [];
  for (let i = 1; i <= count; i++) {
    const isOnline = randomInt(0, 1) === 1;
    const serviceType = randomItem(['online', 'offline', 'both']);
    const isVip = randomInt(0, 3) > 0;
    
    companions.push({
      userId: 1000 + i,
      nickName: randomItem(names),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=companion${i}`,
      location: randomItem(locations),
      level: randomInt(1, 50),
      fansCount: randomInt(500, 15000),
      price: randomInt(30, 200),
      tags: randomItem(tags),
      totalOrders: randomInt(10, 5000),
      rating: Number((randomInt(40, 50) / 10).toFixed(1)),
      ratingCount: randomInt(10, 1000),
      online: isOnline,
      serviceType: serviceType,
      vip: isVip,
      vipLevel: isVip ? randomInt(1, 5) : 0,
      games: serviceType !== 'offline' ? Array(randomInt(1, 3)).fill(null).map(() => randomItem(games)) : undefined,
      offlineServices: serviceType !== 'online' ? Array(randomInt(1, 3)).fill(null).map(() => randomItem(offlineServices)) : undefined
    });
  }
  return companions;
};

export const generateMockOnlineCompanions = (count = 15) => {
  return generateMockCompanions(count).filter(c => c.serviceType !== 'offline');
};

export const generateMockOfflineCompanions = (count = 15) => {
  return generateMockCompanions(count).filter(c => c.serviceType !== 'online');
};

export const generateMockPosts = (count = 20) => {
  const posts = [];
  for (let i = 1; i <= count; i++) {
    const hasImages = randomInt(0, 1) === 1;
    const imageCount = hasImages ? randomInt(1, 3) : 0;
    
    posts.push({
      postId: i,
      userId: randomInt(1, 50),
      nickName: randomItem(names),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=post${i}`,
      level: randomInt(1, 50),
      vip: randomInt(0, 3) > 0,
      gameName: randomItem(games),
      content: randomItem(postContents),
      images: Array(imageCount).fill(null).map((_, idx) => `https://api.dicebear.com/7.x/bottts/svg?seed=img${i}${idx}`),
      tagName: randomItem(tagNames),
      likes: randomInt(10, 1000),
      comments: randomInt(5, 200),
      isLike: randomInt(0, 1) === 1,
      isFollow: randomInt(0, 1) === 1,
      createTime: Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000 - randomInt(0, 24) * 60 * 60 * 1000,
      onlineService: randomInt(0, 1) === 1,
      offlineService: randomInt(0, 1) === 1,
      offlineLocation: randomInt(0, 1) === 1 ? `${randomItem(locations)}市${randomItem(['朝阳区', '海淀区', '天河区', '浦东新区', '武侯区'])}XX${randomItem(['电竞馆', '网咖', '桌游吧'])}` : undefined
    });
  }
  return posts.sort((a, b) => b.createTime - a.createTime);
};

export const generateMockChatUsers = (count = 10) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      userId: i,
      nickName: randomItem(names),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=chat${i}`,
      gender: randomItem(['male', 'female']),
      level: randomInt(1, 50),
      online: randomInt(0, 1) === 1,
      isVip: randomInt(0, 3) > 0,
      isNewbie: randomInt(0, 5) === 0,
      activityScore: randomInt(10, 100),
      tags: randomItem(tags),
      region: randomItem(locations)
    });
  }
  return users;
};

export const generateMockOrders = (count = 10) => {
  const statuses = ['待接单', '已接单', '进行中', '已完成', '已取消'];
  const types = ['游戏陪玩', '语音聊天', '线下约会', '技能教学'];
  
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const status = randomItem(statuses);
    orders.push({
      orderId: `PK${Date.now().toString().slice(-8)}${i.toString().padStart(3, '0')}`,
      type: randomItem(types),
      gameName: randomItem(games),
      companionName: randomItem(names),
      companionAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=order${i}`,
      companionId: randomInt(1000, 1050),
      price: randomInt(30, 300),
      duration: randomInt(1, 8),
      status: status,
      statusText: status,
      createTime: Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000,
      tags: Array(randomInt(1, 3)).fill(null).map(() => randomItem(['打野', '上分', '聊天', '娱乐', '教学', 'Carry'])),
      payType: randomItem(['余额支付', '微信支付', '支付宝']),
      cancelReason: status === '已取消' ? randomItem(['临时有事', '不想玩了', '找不到人']) : undefined
    });
  }
  return orders;
};

export const generateMockWalletRecords = (count = 10) => {
  const types = ['充值', '消费', '提现', '退款', '奖励'];
  const descriptions = {
    '充值': ['微信充值', '支付宝充值', '银行卡充值'],
    '消费': ['陪玩订单消费', '礼物消费', 'VIP会员续费'],
    '提现': ['微信提现', '银行卡提现'],
    '退款': ['订单退款', '礼物退款'],
    '奖励': ['签到奖励', '邀请奖励', '活动奖励']
  };
  
  const records = [];
  for (let i = 1; i <= count; i++) {
    const type = randomItem(types);
    const amount = type === '充值' || type === '奖励' ? randomInt(10, 500) : randomInt(10, 200);
    records.push({
      id: i,
      type: type,
      description: randomItem(descriptions[type]),
      amount: type === '充值' || type === '奖励' ? amount : -amount,
      balance: randomInt(0, 5000),
      createTime: Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000
    });
  }
  return records.sort((a, b) => b.createTime - a.createTime);
};

export const generateMockServices = (count = 10) => {
  const services = [];
  for (let i = 1; i <= count; i++) {
    services.push({
      id: i,
      name: `${randomItem(games)}${randomItem(['上分', '娱乐', '教学', '陪练'])}`,
      description: `专业${randomItem(games)}${randomItem(['上分服务', '娱乐陪玩', '技术教学'])}，${randomItem(['全天在线', '随叫随到', '技术过硬'])}`,
      price: randomInt(30, 200),
      originalPrice: randomInt(50, 250),
      tags: Array(randomInt(1, 3)).fill(null).map(() => randomItem(['高效', '专业', '耐心', '幽默', '技术流'])),
      status: randomInt(0, 1),
      createTime: Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000,
      orderCount: randomInt(0, 500)
    });
  }
  return services;
};

export const generateMockVipPackages = (count = 5) => {
  const packages = [];
  const names = ['月卡', '季卡', '半年卡', '年卡', '至尊卡'];
  const durations = [30, 90, 180, 365, 365];
  const levels = [1, 2, 3, 4, 5];
  
  for (let i = 0; i < count; i++) {
    packages.push({
      id: i + 1,
      name: `VIP${levels[i]}${names[i]}`,
      price: randomInt(30, 500),
      originalPrice: randomInt(50, 600),
      duration: durations[i],
      level: levels[i],
      hot: i === 1 || i === 2,
      sort: i + 1,
      status: 1,
      description: [
        '专属客服',
        '优先匹配',
        '免费道具',
        '经验加成',
        '专属标识'
      ].slice(0, levels[i])
    });
  }
  return packages;
};

export const generateMockBanners = (count = 5) => {
  const banners = [];
  const titles = ['新用户专享', '限时特惠', '热门活动', 'VIP特权', '新手礼包'];
  const links = ['/vip-center', '/recharge', '/online-companion', '/offline-companion', '/preferred'];
  
  for (let i = 1; i <= count; i++) {
    banners.push({
      id: i,
      title: titles[i - 1],
      image: `https://picsum.photos/600/300?random=b${i}`,
      link: links[i - 1],
      sort: i,
      status: 1
    });
  }
  return banners;
};

export const generateMockTags = (count = 20) => {
  const allTags = [
    { name: '游戏', icon: '🎮' }, { name: '情感', icon: '💝' },
    { name: '技术', icon: '💻' }, { name: '生活', icon: '🌄' },
    { name: '娱乐', icon: '🎉' }, { name: '上分', icon: '📈' },
    { name: '聊天', icon: '💬' }, { name: '教学', icon: '📚' },
    { name: '开黑', icon: '🎯' }, { name: 'carry', icon: '⚡' },
    { name: '打野', icon: '🌿' }, { name: '中单', icon: '🔮' },
    { name: '辅助', icon: '🛡️' }, { name: 'ADC', icon: '🏹' },
    { name: '上单', icon: '🛡️' }, { name: '刺客', icon: '🗡️' },
    { name: '法师', icon: '🔮' }, { name: '坦克', icon: '🛡️' },
    { name: '射手', icon: '🏹' }, { name: '辅助', icon: '🔧' }
  ];
  
  return allTags.slice(0, count).map((tag, idx) => ({
    id: idx + 1,
    name: tag.name,
    icon: tag.icon,
    sortOrder: idx + 1
  }));
};