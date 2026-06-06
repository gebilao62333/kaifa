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

// 客服相关数据
const customerServiceNames = ['小雪', '阿杰', '小美', '大飞', '小鹿'];
const customerServiceRoles = ['senior', 'normal', 'normal', 'senior', 'normal'];
const customerServiceDescriptions = [
  '资深客服，专为您解答各类问题',
  '活泼开朗，耐心解答您的疑问',
  '温柔体贴，为您提供优质服务',
  '经验丰富，快速解决各类问题',
  '热情友好，随时为您服务'
];

const chatMessages = [
  '您好，请问有什么可以帮到您？',
  '感谢您的咨询，我会尽快为您解答。',
  '请问您遇到什么问题了呢？',
  '好的，我明白了，请稍等。',
  '这个问题我这边正在处理中，请耐心等待。',
  '请问还有其他问题吗？',
  '好的，祝您生活愉快！',
  '如有其他问题，欢迎随时咨询。'
];

const userMessages = [
  '你好，我想咨询一下',
  '请问充值不到账怎么办？',
  '订单取消后什么时候退款？',
  '客服MM好，请问...',
  '谢谢你的帮助',
  '好的，我知道了',
  '好的，麻烦你了',
  '请问这个功能怎么使用？'
];

const generateMockUsers = (count = 50) => {
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('123456', 10);
  
  const users = [];
  for (let i = 1; i <= count; i++) {
    const isVip = randomInt(0, 3) > 0;
    users.push({
      id: i,
      userId: i,
      username: i === 1 ? 'admin' : `user${i}`,
      password: i === 1 ? hashedPassword : hashedPassword,
      nickname: i === 1 ? '管理员' : randomItem(names),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
      mobile: `1${randomInt(3, 9)}${String(randomInt(0, 999999999)).padStart(9, '0')}`,
      phone: `1${randomInt(3, 9)}${String(randomInt(0, 999999999)).padStart(9, '0')}`,
      status: 1,
      vip: isVip ? 1 : 0,
      vip_lv: isVip ? randomInt(1, 5) : 0,
      money: randomInt(0, 20000),
      gift_money: randomInt(0, 500),
      score: randomInt(0, 10000),
      fans_num: randomInt(0, 5000),
      follow_num: randomInt(0, 500),
      dec: ['喜欢玩游戏', '新人报道', '资深玩家', '', '热爱生活'][randomInt(0, 4)],
      sex: randomInt(0, 1),
      city: randomItem(locations),
      invite_code: `INV${String(i).padStart(5, '0')}`,
      create_time: Date.now() - randomInt(0, 365) * 86400000,
      update_time: Date.now()
    });
  }
  return users;
};

const generateMockVirtualUsers = (count = 50) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    const tags = [randomInt(1, 5), randomInt(1, 5), randomInt(1, 5)];
    users.push({
      id: i,
      name: randomItem(names),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=virtual${i}`,
      gender: randomInt(0, 1),
      age: randomInt(18, 35),
      region: randomItem(locations),
      tags: JSON.stringify(tags),
      intro: `${randomItem(['性格开朗', '温柔体贴', '幽默风趣', '技术过硬'])}, ${randomItem(games)}${randomItem(['段位王者', '技术一流', '带你上分'])}, ${randomItem(['声音甜美', '声音磁性', '聊天氛围轻松'])}`,
      price_per_hour: randomInt(30, 200),
      online_status: randomInt(0, 1),
      is_recommend: randomInt(0, 1),
      status: 1,
      create_time: Date.now(),
      update_time: Date.now()
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
      tagName: tagNames[randomInt(0, 4)],
      type: 0,
      status: 1,
      is_private: 0,
      create_time: Date.now() - randomInt(0, 7) * 86400000 - randomInt(0, 24) * 3600000,
      update_time: Date.now()
    });
  }
  return posts.sort((a, b) => b.create_time - a.create_time);
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
      create_time: Date.now() - randomInt(0, 7) * 86400000,
      start_time: status !== 'pending' && status !== 'cancelled' ? Date.now() - randomInt(0, 24) * 3600000 : null,
      end_time: status === 'completed' ? Date.now() : null,
      cancel_time: status === 'cancelled' ? Date.now() - randomInt(0, 24) * 3600000 : null
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
      create_time: Date.now() - randomInt(0, 30) * 86400000,
      update_time: Date.now()
    });
  }
  return profiles;
};

const generateMockChatLogs = (count = 100) => {
  const messages = ['你好', '在吗', '一起玩游戏吗', '好的', '没问题', '明天见', '今晚有空吗', 'OK', '可以', '太棒了', '等你', '马上来', '准备好了'];
  const logs = [];
  for (let i = 1; i <= count; i++) {
    logs.push({
      id: i,
      fromid: randomInt(1, 50),
      toid: randomInt(1000, 1050),
      content: randomItem(messages),
      type: 0,
      vod_url: '',
      sec: 0,
      time: Math.floor(Date.now() / 1000) - randomInt(0, 24) * 3600,
      isread: randomInt(0, 1),
      is_del: 0,
      is_revoked: 0
    });
  }
  return logs;
};

const generateMockCircleTags = () => [
  { id: 1, name: '游戏', icon: '🎮', sort_order: 1, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 2, name: '情感', icon: '💝', sort_order: 2, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 3, name: '技术', icon: '💻', sort_order: 3, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 4, name: '生活', icon: '🌄', sort_order: 4, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 5, name: '娱乐', icon: '🎉', sort_order: 5, status: 1, create_time: Date.now(), update_time: Date.now() }
];

const generateMockGames = () => [
  { id: 1, name: '王者荣耀', icon: 'game1.jpg', image_bg: 'https://picsum.photos/800/400?random=1', type: 'mobile', status: 1, sort: 1, create_time: Date.now() - 86400000 * 100 },
  { id: 2, name: '英雄联盟', icon: 'game2.jpg', image_bg: 'https://picsum.photos/800/400?random=2', type: 'pc', status: 1, sort: 2, create_time: Date.now() - 86400000 * 90 },
  { id: 3, name: '和平精英', icon: 'game3.jpg', image_bg: 'https://picsum.photos/800/400?random=3', type: 'both', status: 1, sort: 3, create_time: Date.now() - 86400000 * 80 },
  { id: 4, name: '原神', icon: 'game4.jpg', image_bg: 'https://picsum.photos/800/400?random=4', type: 'both', status: 1, sort: 4, create_time: Date.now() - 86400000 * 70 },
  { id: 5, name: '永劫无间', icon: 'game5.jpg', image_bg: 'https://picsum.photos/800/400?random=5', type: 'pc', status: 1, sort: 5, create_time: Date.now() - 86400000 * 60 }
];

const generateMockVirtualUserTags = () => [
  { id: 1, name: '王者荣耀', icon: 'icon1', sort_order: 1, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 2, name: '英雄联盟', icon: 'icon2', sort_order: 2, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 3, name: '和平精英', icon: 'icon3', sort_order: 3, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 4, name: '原神', icon: 'icon4', sort_order: 4, status: 1, create_time: Date.now(), update_time: Date.now() },
  { id: 5, name: '永劫无间', icon: 'icon5', sort_order: 5, status: 1, create_time: Date.now(), update_time: Date.now() }
];

const generateMockGifts = () => [
  { id: 1, title: '爱心', image: 'https://picsum.photos/100/100?random=gift1', svga: '', money: 1.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 1 },
  { id: 2, title: '玫瑰花', image: 'https://picsum.photos/100/100?random=gift2', svga: '', money: 10.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 2 },
  { id: 3, title: '蛋糕', image: 'https://picsum.photos/100/100?random=gift3', svga: '', money: 50.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 3 },
  { id: 4, title: '钻戒', image: 'https://picsum.photos/100/100?random=gift4', svga: '', money: 999.00, type: 0, is_vip: 1, tian: 0, status: 1, sort: 4 },
  { id: 5, title: '跑车', image: 'https://picsum.photos/100/100?random=gift5', svga: '', money: 1500.00, type: 0, is_vip: 1, tian: 0, status: 1, sort: 5 },
  { id: 6, title: '火箭', image: 'https://picsum.photos/100/100?random=gift6', svga: '', money: 500.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 6 }
];

const generateMockWithdraws = (count = 20) => {
  const types = ['alipay', 'wechat', 'bank'];
  const statuses = ['pending', 'approved', 'rejected'];
  const withdraws = [];
  for (let i = 1; i <= count; i++) {
    const type = randomItem(types);
    withdraws.push({
      id: i,
      user_id: randomInt(1, 50),
      amount: randomInt(100, 5000),
      type: type,
      account: type === 'alipay' ? `1${randomInt(3, 9)}****${randomInt(0, 9999)}` : 
               type === 'wechat' ? `wx${randomInt(100000, 999999)}` : 
               `6222****${randomInt(0, 9999)}`,
      status: randomItem(statuses),
      remark: '',
      create_time: Date.now() - randomInt(0, 30) * 86400000,
      handle_time: null
    });
  }
  return withdraws;
};

// 生成客服列表
const generateMockCustomerServices = () => {
  const customerServices = [];
  for (let i = 0; i < customerServiceNames.length; i++) {
    customerServices.push({
      id: i + 1,
      userId: 9000 + i + 1,
      name: customerServiceNames[i],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=customer${i + 1}`,
      role: customerServiceRoles[i],
      description: customerServiceDescriptions[i],
      online: i % 2 === 0, // 交替在线离线
      status: 1,
      create_time: Date.now(),
      update_time: Date.now()
    });
  }
  return customerServices;
};

// 生成聊天记录
const generateMockChatMessages = (count = 100) => {
  const messages = [];
  const customerServices = generateMockCustomerServices();
  
  for (let i = 1; i <= count; i++) {
    const isFromCustomer = randomInt(0, 1) === 0;
    const cs = randomItem(customerServices);
    
    messages.push({
      id: i,
      user_id: randomInt(1, 50),
      customer_service_id: cs.userId,
      customer_service_name: cs.name,
      sender_type: isFromCustomer ? 'customer_service' : 'user',
      sender_id: isFromCustomer ? cs.userId : randomInt(1, 50),
      sender_name: isFromCustomer ? cs.name : '用户',
      sender_avatar: isFromCustomer ? cs.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=user${randomInt(1, 50)}`,
      message: isFromCustomer ? randomItem(chatMessages) : randomItem(userMessages),
      message_type: 'text',
      status: 'read',
      create_time: Date.now() - randomInt(0, 30) * 86400000
    });
  }
  return messages;
};

module.exports = {
  generateMockUsers,
  generateMockVirtualUsers,
  generateMockPosts,
  generateMockGameOrders,
  generateMockCompanionProfiles,
  generateMockChatLogs,
  generateMockCircleTags,
  generateMockGames,
  generateMockVirtualUserTags,
  generateMockGifts,
  generateMockWithdraws,
  generateMockCustomerServices,
  generateMockChatMessages
};
