const config = require('../config');
const { Op } = require('sequelize');

if (config.useMockDb) {
  console.log('📦 使用 Mock 数据模型');

  const createMockModel = (name) => ({
    findAll: async () => [],
    findOne: async () => null,
    findByPk: async () => null,
    create: async (data) => ({ id: 1, ...data }),
    update: async () => [1],
    destroy: async () => 1,
    count: async () => 0,
    increment: async () => {},
    decrement: async () => {},
    belongsTo: () => {},
    hasMany: () => {},
    sync: async () => {}
  });

  const User = {
    ...createMockModel('User'),
    _wrapUser: (user) => {
      if (!user) return null;
      return {
        ...user,
        update: async (data) => {
          const index = User._users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            User._users[index] = { ...User._users[index], ...data, update_time: Date.now() };
            Object.assign(user, User._users[index]);
            return [1];
          }
          return [0];
        },
        destroy: async () => {
          const initialLength = User._users.length;
          User._users = User._users.filter(u => u.id !== user.id);
          return initialLength - User._users.length;
        }
      };
    },
    _users: [
      { id: 1, userId: 1, username: 'user1', nickname: '用户小明', avatar: 'https://picsum.photos/100/100?random=1', mobile: '13800138001', phone: '13800138001', password: '$2a$10$f0Wo5ViKrVz0E1.T3xp9ouagPznn53ZAs2Oqhei8hb9EPhYh7iB.6', status: 0, vip: 1, vip_lv: 2, money: 5000, gift_money: 200, score: 1500, fans_num: 120, follow_num: 45, dec: '喜欢玩游戏', sex: 1, city: '北京', create_time: Date.now() - 86400000 * 30, update_time: Date.now() },
      { id: 2, userId: 2, username: 'user2', nickname: '用户小红', avatar: 'https://picsum.photos/100/100?random=2', mobile: '13800138002', phone: '13800138002', password: '$2a$10$f0Wo5ViKrVz0E1.T3xp9ouagPznn53ZAs2Oqhei8hb9EPhYh7iB.6', status: 0, vip: 0, vip_lv: 0, money: 1200, gift_money: 50, score: 300, fans_num: 35, follow_num: 20, dec: '', sex: 0, city: '上海', create_time: Date.now() - 86400000 * 20, update_time: Date.now() },
      { id: 3, userId: 3, username: 'user3', nickname: '用户小刚', avatar: 'https://picsum.photos/100/100?random=3', mobile: '13800138003', phone: '13800138003', password: '$2a$10$f0Wo5ViKrVz0E1.T3xp9ouagPznn53ZAs2Oqhei8hb9EPhYh7iB.6', status: 1, vip: 1, vip_lv: 1, money: 0, gift_money: 0, score: 0, fans_num: 0, follow_num: 0, dec: '已被禁用', sex: 1, city: '广州', create_time: Date.now() - 86400000 * 10, update_time: Date.now() },
      { id: 4, userId: 4, username: 'user4', nickname: '用户小丽', avatar: 'https://picsum.photos/100/100?random=4', mobile: '13800138004', phone: '13800138004', password: '$2a$10$f0Wo5ViKrVz0E1.T3xp9ouagPznn53ZAs2Oqhei8hb9EPhYh7iB.6', status: 0, vip: 0, vip_lv: 0, money: 800, gift_money: 100, score: 200, fans_num: 15, follow_num: 30, dec: '新人报道', sex: 0, city: '深圳', create_time: Date.now() - 86400000 * 5, update_time: Date.now() },
      { id: 5, userId: 5, username: 'user5', nickname: '用户阿杰', avatar: 'https://picsum.photos/100/100?random=5', mobile: '13800138005', phone: '13800138005', password: '$2a$10$f0Wo5ViKrVz0E1.T3xp9ouagPznn53ZAs2Oqhei8hb9EPhYh7iB.6', status: 0, vip: 1, vip_lv: 3, money: 15000, gift_money: 500, score: 5000, fans_num: 500, follow_num: 100, dec: '资深玩家', sex: 1, city: '杭州', create_time: Date.now() - 86400000 * 60, update_time: Date.now() }
    ],
    _nextId: 6,
    findAndCountAll: async (options) => {
      let users = [...User._users];
      const { where = {}, offset = 0, limit = 20, order = [['create_time', 'DESC']] } = options;

      if (where.nickname) {
        users = users.filter(u => u.nickname.includes(where.nickname));
      }
      if (where.phone) {
        users = users.filter(u => u.phone.includes(where.phone));
      }
      if (where.status !== undefined && where.status !== '') {
        users = users.filter(u => u.status === parseInt(where.status));
      }

      const orderField = order[0][0];
      const orderDirection = order[0][1];
      users.sort((a, b) => {
        const aVal = a[orderField];
        const bVal = b[orderField];
        return orderDirection === 'DESC' ? (bVal - aVal) : (aVal - bVal);
      });

      const count = users.length;
      const rows = users.slice(offset, offset + limit).map(u => User._wrapUser(u));

      return { count, rows };
    },
    findByPk: async (id) => {
      const user = User._users.find(u => u.id === parseInt(id));
      return User._wrapUser(user) || null;
    },
    findOne: async (options) => {
      const { where = {} } = options || {};
      let result = null;
      
      if (where[Op.or]) {
        result = User._users.find(user => {
          return where[Op.or].some(condition => {
            for (const [key, value] of Object.entries(condition)) {
              if (user[key] !== value) return false;
            }
            return true;
          });
        }) || null;
      } else if (where.mobile) {
        result = User._users.find(u => u.mobile === where.mobile) || null;
      } else if (where.username) {
        result = User._users.find(u => u.username === where.username) || null;
      } else if (where.open_id) {
        result = User._users.find(u => u.open_id === where.open_id) || null;
      } else if (where.unionid) {
        result = User._users.find(u => u.unionid === where.unionid) || null;
      } else if (where.id) {
        result = User._users.find(u => u.id === parseInt(where.id)) || null;
      }
      return User._wrapUser(result);
    },
    create: async (data) => {
      const newUser = {
        id: User._nextId++,
        userId: User._nextId - 1,
        nickname: data.nickname || '新用户',
        avatar: data.avatar || 'https://picsum.photos/100/100',
        phone: data.phone || '',
        mobile: data.mobile || '',
        password: data.password || '',
        username: data.username || '',
        open_id: data.open_id || '',
        unionid: data.unionid || '',
        platform: data.platform || 'app',
        status: data.status || 0,
        vip: data.vip || 0,
        vip_lv: data.vip_lv || 0,
        money: data.money || 0,
        gift_money: data.gift_money || 0,
        score: data.score || 0,
        fans_num: 0,
        follow_num: 0,
        dec: data.dec || '',
        sex: data.sex || 0,
        city: data.city || '',
        create_time: Date.now(),
        update_time: Date.now()
      };
      User._users.push(newUser);
      return User._wrapUser(newUser);
    },
    update: async (data, options) => {
      const { where = {} } = options;
      if (where.id) {
        const index = User._users.findIndex(u => u.id === where.id);
        if (index !== -1) {
          User._users[index] = { ...User._users[index], ...data, update_time: Date.now() };
          return [1];
        }
      }
      return [0];
    },
    destroy: async (options) => {
      const { where = {} } = options;
      if (where.id) {
        const initialLength = User._users.length;
        User._users = User._users.filter(u => u.id !== where.id);
        return initialLength - User._users.length;
      }
      return 0;
    }
  };

  const ChatLog = {
    ...createMockModel('ChatLog'),
    findAndCountAll: async (options) => {
      const mockMessages = [
        {
          id: 1,
          fromid: options.where[Op.or][0].fromid,
          toid: options.where[Op.or][0].toid,
          content: '你好呀！',
          type: 0,
          vod_url: '',
          sec: 0,
          time: Math.floor(Date.now() / 1000) - 3600,
          isread: 1,
          is_del: 0,
          is_revoked: 0
        },
        {
          id: 2,
          fromid: options.where[Op.or][1].fromid,
          toid: options.where[Op.or][1].toid,
          content: '你好！很高兴认识你',
          type: 0,
          vod_url: '',
          sec: 0,
          time: Math.floor(Date.now() / 1000) - 3500,
          isread: 1,
          is_del: 0,
          is_revoked: 0
        },
        {
          id: 3,
          fromid: options.where[Op.or][0].fromid,
          toid: options.where[Op.or][0].toid,
          content: '今天天气真好！',
          type: 0,
          vod_url: '',
          sec: 0,
          time: Math.floor(Date.now() / 1000) - 3400,
          isread: 1,
          is_del: 0,
          is_revoked: 0
        },
        {
          id: 4,
          fromid: options.where[Op.or][1].fromid,
          toid: options.where[Op.or][1].toid,
          content: '是的呢，很适合出去玩',
          type: 0,
          vod_url: '',
          sec: 0,
          time: Math.floor(Date.now() / 1000) - 3300,
          isread: 0,
          is_del: 0,
          is_revoked: 0
        },
        {
          id: 5,
          fromid: options.where[Op.or][0].fromid,
          toid: options.where[Op.or][0].toid,
          content: 'https://picsum.photos/200/200?random=1',
          type: 2,
          vod_url: 'https://picsum.photos/200/200?random=1',
          sec: 0,
          time: Math.floor(Date.now() / 1000) - 3200,
          isread: 0,
          is_del: 0,
          is_revoked: 0
        }
      ];

      return {
        count: mockMessages.length,
        rows: mockMessages
      };
    }
  };

  const ChatRoom = createMockModel('ChatRoom');

  const Gift = {
    ...createMockModel('Gift'),
    _gifts: [
      { id: 1, title: '玫瑰花', image: 'https://picsum.photos/100/100?random=gift1', svga: '', money: 10.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 1 },
      { id: 2, title: '蛋糕', image: 'https://picsum.photos/100/100?random=gift2', svga: '', money: 50.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 2 },
      { id: 3, title: '钻戒', image: 'https://picsum.photos/100/100?random=gift3', svga: '', money: 999.00, type: 0, is_vip: 1, tian: 0, status: 1, sort: 3 },
      { id: 4, title: '火箭', image: 'https://picsum.photos/100/100?random=gift4', svga: '', money: 500.00, type: 0, is_vip: 0, tian: 0, status: 1, sort: 4 },
      { id: 5, title: '跑车', image: 'https://picsum.photos/100/100?random=gift5', svga: '', money: 1500.00, type: 0, is_vip: 1, tian: 0, status: 1, sort: 5 },
      { id: 6, title: '爱心', image: 'https://picsum.photos/100/100?random=gift6', svga: '', money: 1.00, type: 0, is_vip: 0, tian: 0, status: 0, sort: 6 }
    ],
    _nextId: 7,
    findAndCountAll: async (options) => {
      let gifts = [...Gift._gifts];
      const { where = {}, offset = 0, limit = 20, order = [['sort', 'ASC']] } = options;

      if (where.title) {
        gifts = gifts.filter(g => g.title.includes(where.title));
      }
      if (where.status !== undefined && where.status !== '') {
        gifts = gifts.filter(g => g.status === parseInt(where.status));
      }

      const orderField = order[0][0];
      const orderDirection = order[0][1];
      gifts.sort((a, b) => {
        const aVal = a[orderField];
        const bVal = b[orderField];
        return orderDirection === 'DESC' ? (bVal - aVal) : (aVal - bVal);
      });

      const count = gifts.length;
      const rows = gifts.slice(offset, offset + limit);

      return { count, rows };
    },
    findByPk: async (id) => {
      return Gift._gifts.find(g => g.id === parseInt(id)) || null;
    },
    create: async (data) => {
      const newGift = {
        id: Gift._nextId++,
        title: data.title || '新礼物',
        image: data.image || 'https://picsum.photos/100/100',
        svga: data.svga || '',
        money: parseFloat(data.money) || 0,
        type: data.type || 0,
        is_vip: data.is_vip || 0,
        tian: data.tian || 0,
        status: data.status !== undefined ? data.status : 1,
        sort: data.sort || 0
      };
      Gift._gifts.push(newGift);
      return newGift;
    },
    update: async (data, options) => {
      const { where = {} } = options;
      if (where.id) {
        const index = Gift._gifts.findIndex(g => g.id === where.id);
        if (index !== -1) {
          Gift._gifts[index] = { ...Gift._gifts[index], ...data };
          return [1];
        }
      }
      return [0];
    },
    destroy: async (options) => {
      const { where = {} } = options;
      if (where.id) {
        const initialLength = Gift._gifts.length;
        Gift._gifts = Gift._gifts.filter(g => g.id !== where.id);
        return initialLength - Gift._gifts.length;
      }
      return 0;
    }
  };

  const GiftBag = createMockModel('GiftBag');
  const GiftLog = createMockModel('GiftLog');
  const OrderChong = createMockModel('OrderChong');
  const Game = createMockModel('Gift');

  const GameOrder = {
    ...createMockModel('GameOrder'),
    _orders: [
      { id: 1, order_no: 'ORD202605230001', user_id: 1, game_id: 1, game_name: '王者荣耀', companion_id: 2, companion_name: '陪玩师小王', duration: 60, price: 100, amount: 100, status: 'pending', remark: '希望能赢', create_time: Date.now() - 3600000, start_time: null, end_time: null, cancel_time: null },
      { id: 2, order_no: 'ORD202605230002', user_id: 2, game_id: 2, game_name: '英雄联盟', companion_id: 3, companion_name: '陪玩师小李', duration: 90, price: 150, amount: 150, status: 'ongoing', remark: '', create_time: Date.now() - 7200000, start_time: Date.now() - 3600000, end_time: null, cancel_time: null },
      { id: 3, order_no: 'ORD202605230003', user_id: 3, game_id: 1, game_name: '王者荣耀', companion_id: 4, companion_name: '陪玩师小张', duration: 120, price: 200, amount: 200, status: 'completed', remark: '玩得很开心', create_time: Date.now() - 10800000, start_time: Date.now() - 10700000, end_time: Date.now() - 9500000, cancel_time: null },
      { id: 4, order_no: 'ORD202605230004', user_id: 4, game_id: 3, game_name: '绝地求生', companion_id: 5, companion_name: '陪玩师小陈', duration: 60, price: 120, amount: 120, status: 'cancelled', remark: '临时有事', create_time: Date.now() - 14400000, start_time: null, end_time: null, cancel_time: Date.now() - 14000000 },
      { id: 5, order_no: 'ORD202605230005', user_id: 5, game_id: 2, game_name: '英雄联盟', companion_id: 1, companion_name: '陪玩师阿杰', duration: 90, price: 180, amount: 180, status: 'pending', remark: '', create_time: Date.now() - 18000000, start_time: null, end_time: null, cancel_time: null }
    ],
    _nextId: 6,
    findAndCountAll: async (options) => {
      let orders = [...GameOrder._orders];
      const { where = {}, offset = 0, limit = 20, order = [['create_time', 'DESC']] } = options;

      if (where.order_no) {
        orders = orders.filter(o => o.order_no.includes(where.order_no));
      }
      if (where.user_id) {
        orders = orders.filter(o => o.user_id === where.user_id);
      }
      if (where.status) {
        orders = orders.filter(o => o.status === where.status);
      }

      const orderField = order[0][0];
      const orderDirection = order[0][1];
      orders.sort((a, b) => {
        const aVal = a[orderField];
        const bVal = b[orderField];
        return orderDirection === 'DESC' ? (bVal - aVal) : (aVal - bVal);
      });

      const count = orders.length;
      const rows = orders.slice(offset, offset + limit);

      return { count, rows };
    },
    findByPk: async (id) => {
      return GameOrder._orders.find(o => o.id === parseInt(id)) || null;
    },
    create: async (data) => {
      const newOrder = {
        id: GameOrder._nextId++,
        order_no: `ORD${Date.now().toString().slice(-12)}`,
        user_id: data.user_id || 0,
        game_id: data.game_id || 0,
        game_name: data.game_name || '未知游戏',
        companion_id: data.companion_id || 0,
        companion_name: data.companion_name || '',
        duration: data.duration || 60,
        price: data.price || 0,
        amount: data.amount || data.price || 0,
        status: 'pending',
        remark: data.remark || '',
        create_time: Date.now(),
        start_time: null,
        end_time: null,
        cancel_time: null
      };
      GameOrder._orders.push(newOrder);
      return newOrder;
    },
    update: async (data, options) => {
      const { where = {} } = options;
      if (where.id) {
        const index = GameOrder._orders.findIndex(o => o.id === where.id);
        if (index !== -1) {
          GameOrder._orders[index] = { ...GameOrder._orders[index], ...data };
          return [1];
        }
      }
      return [0];
    },
    destroy: async (options) => {
      const { where = {} } = options;
      if (where.id) {
        const initialLength = GameOrder._orders.length;
        GameOrder._orders = GameOrder._orders.filter(o => o.id !== where.id);
        return initialLength - GameOrder._orders.length;
      }
      return 0;
    }
  };

  const CompanionProfile = {
    ...createMockModel('CompanionProfile'),
    // 种子数据：status=2 表示已认证陪玩师，user_id 关联 User._users（1~5）
    _profiles: [
      { id: 1, user_id: 5, game_id: 1, status: 2, price: 30.0, tags: '王者荣耀,国服打野,声音好听', voice_intro: '', voice_time: 12, order_num: 320, star: 4.9, pingjia_num: 210 },
      { id: 2, user_id: 1, game_id: 1, status: 2, price: 25.0, tags: '王者荣耀,上分快,陪练', voice_intro: '', voice_time: 8, order_num: 180, star: 4.8, pingjia_num: 130 },
      { id: 3, user_id: 2, game_id: 2, status: 2, price: 20.0, tags: '英雄联盟,温柔,妹子', voice_intro: '', voice_time: 15, order_num: 95, star: 4.7, pingjia_num: 76 },
      { id: 4, user_id: 4, game_id: 2, status: 2, price: 18.0, tags: '英雄联盟,新人,活泼', voice_intro: '', voice_time: 6, order_num: 40, star: 4.6, pingjia_num: 28 },
      { id: 5, user_id: 1, game_id: 3, status: 2, price: 22.0, tags: '和平精英,枪法准,带吃鸡', voice_intro: '', voice_time: 10, order_num: 60, star: 4.5, pingjia_num: 45 },
      { id: 6, user_id: 5, game_id: 3, status: 2, price: 35.0, tags: '和平精英,主播,技术流', voice_intro: '', voice_time: 20, order_num: 150, star: 4.9, pingjia_num: 120 }
    ],
    findAndCountAll: async (options = {}) => {
      let profiles = [...CompanionProfile._profiles];
      const { where = {}, offset = 0, limit = 20, order = [['star', 'DESC'], ['order_num', 'DESC']] } = options;

      if (where.status !== undefined) {
        profiles = profiles.filter(p => p.status === where.status);
      }
      if (where.game_id !== undefined) {
        profiles = profiles.filter(p => p.game_id === where.game_id);
      }

      profiles.sort((a, b) => {
        for (const [field, dir] of order) {
          const av = a[field];
          const bv = b[field];
          if (av === bv) continue;
          return dir === 'DESC' ? (bv - av) : (av - bv);
        }
        return 0;
      });

      const count = profiles.length;
      const rows = profiles.slice(offset, offset + limit);
      return { count, rows };
    },
    findByPk: async (id) => CompanionProfile._profiles.find(p => p.id === parseInt(id)) || null,
    findOne: async (options = {}) => {
      const { where = {} } = options;
      return CompanionProfile._profiles.find(p => {
        if (where.user_id !== undefined && p.user_id !== where.user_id) return false;
        if (where.status !== undefined && p.status !== where.status) return false;
        return true;
      }) || null;
    }
  };

  const Post = {
    ...createMockModel('Post'),
    _posts: [
      { id: 1, user_id: 1, content: '今天和陪玩师一起打王者荣耀，太开心了！配合默契，连赢五把，强烈推荐！', images: 'https://picsum.photos/400/300?random=1', videos: '', thumb_num: 42, comment_num: 8, share_num: 3, tag_id: 1, type: 0, status: 1, is_private: 0, private_password: '', private_price: 0, create_time: Math.floor(Date.now() / 1000) - 3600 },
      { id: 2, user_id: 2, content: '晒一下今天的游戏成果，吃鸡三连！', images: 'https://picsum.photos/400/300?random=2', videos: '', thumb_num: 28, comment_num: 5, share_num: 1, tag_id: 2, type: 0, status: 1, is_private: 0, private_password: '', private_price: 0, create_time: Math.floor(Date.now() / 1000) - 7200 },
      { id: 3, user_id: 3, content: '有没有一起玩原神的小伙伴？周末可以组队！', images: '', videos: '', thumb_num: 15, comment_num: 12, share_num: 0, tag_id: 3, type: 0, status: 1, is_private: 0, private_password: '', private_price: 0, create_time: Math.floor(Date.now() / 1000) - 10800 },
      { id: 4, user_id: 4, content: '这个陪玩师技术太好了，带飞全场，必须五星好评！', images: 'https://picsum.photos/400/300?random=4', videos: '', thumb_num: 56, comment_num: 15, share_num: 5, tag_id: 1, type: 0, status: 1, is_private: 0, private_password: '', private_price: 0, create_time: Math.floor(Date.now() / 1000) - 14400 },
      { id: 5, user_id: 1, content: '招募战队成员，要求段位钻石以上，有兴趣的私聊！', images: '', videos: '', thumb_num: 8, comment_num: 6, share_num: 2, tag_id: 4, type: 0, status: 1, is_private: 0, private_password: '', private_price: 0, create_time: Math.floor(Date.now() / 1000) - 18000 }
    ],
    _nextId: 6,
    findAndCountAll: async (options) => {
      let posts = [...Post._posts];
      const { where = {}, offset = 0, limit = 20, order = [['create_time', 'DESC']] } = options;

      if (where.content) {
        posts = posts.filter(p => p.content.includes(where.content));
      }
      if (where.user_id) {
        posts = posts.filter(p => p.user_id === where.user_id);
      }

      const orderField = order[0][0];
      const orderDirection = order[0][1];
      posts.sort((a, b) => {
        const aVal = a[orderField];
        const bVal = b[orderField];
        return orderDirection === 'DESC' ? (bVal - aVal) : (aVal - bVal);
      });

      const count = posts.length;
      const rows = posts.slice(offset, offset + limit);

      return { count, rows };
    },
    findByPk: async (id) => {
      return Post._posts.find(p => p.id === parseInt(id)) || null;
    },
    create: async (data) => {
      const newPost = {
        id: Post._nextId++,
        user_id: data.user_id || 0,
        content: data.content || '',
        images: data.images || '',
        videos: data.videos || '',
        thumb_num: 0,
        comment_num: 0,
        share_num: 0,
        tag_id: data.tag_id || 0,
        type: 0,
        status: 1,
        is_private: 0,
        private_password: '',
        private_price: 0,
        create_time: Math.floor(Date.now() / 1000)
      };
      Post._posts.push(newPost);
      return newPost;
    },
    update: async (data, options) => {
      const { where = {} } = options;
      if (where.id) {
        const index = Post._posts.findIndex(p => p.id === where.id);
        if (index !== -1) {
          Post._posts[index] = { ...Post._posts[index], ...data };
          return [1];
        }
      }
      return [0];
    },
    destroy: async (options) => {
      const { where = {} } = options;
      if (where.id) {
        const initialLength = Post._posts.length;
        Post._posts = Post._posts.filter(p => p.id !== where.id);
        return initialLength - Post._posts.length;
      }
      return 0;
    }
  };

  const PostLike = createMockModel('PostLike');
  const PostComment = createMockModel('PostComment');
  const PostUnlock = createMockModel('PostUnlock');
  const UserFollow = createMockModel('UserFollow');
  const RedPacket = createMockModel('RedPacket');
  const RedPacketLog = createMockModel('RedPacketLog');
  const Report = createMockModel('Report');
  const Reserve = createMockModel('Reserve');
  const ReserveSlot = createMockModel('ReserveSlot');
  const Demand = createMockModel('Demand');
  const CallRecord = createMockModel('CallRecord');
  const CallBilling = createMockModel('CallBilling');
  const Banner = createMockModel('Banner');
  const RechargePackage = createMockModel('RechargePackage');
  const Card = createMockModel('Card');

  const Withdraw = {
    ...createMockModel('Withdraw'),
    _withdraws: [
      { id: 1, user_id: 1, amount: 500, type: 'alipay', account: '138****1234', status: 'pending', remark: '', create_time: Date.now() - 3600000, handle_time: null },
      { id: 2, user_id: 2, amount: 1200, type: 'wechat', account: '139****5678', status: 'pending', remark: '', create_time: Date.now() - 7200000, handle_time: null },
      { id: 3, user_id: 3, amount: 800, type: 'alipay', account: '137****9012', status: 'approved', remark: '审核通过', create_time: Date.now() - 10800000, handle_time: Date.now() - 3600000 },
      { id: 4, user_id: 4, amount: 2000, type: 'bank', account: '6222****8888', status: 'pending', remark: '', create_time: Date.now() - 14400000, handle_time: null },
      { id: 5, user_id: 5, amount: 300, type: 'wechat', account: '135****7890', status: 'rejected', remark: '账户信息错误', create_time: Date.now() - 18000000, handle_time: Date.now() - 7200000 }
    ],
    _nextId: 6,
    findAndCountAll: async (options) => {
      let withdraws = [...Withdraw._withdraws];
      const { where = {}, offset = 0, limit = 20, order = [['create_time', 'DESC']] } = options;

      if (where.user_id) {
        withdraws = withdraws.filter(w => w.user_id === where.user_id);
      }
      if (where.status) {
        withdraws = withdraws.filter(w => w.status === where.status);
      }

      const orderField = order[0][0];
      const orderDirection = order[0][1];
      withdraws.sort((a, b) => {
        const aVal = a[orderField];
        const bVal = b[orderField];
        return orderDirection === 'DESC' ? (bVal - aVal) : (aVal - bVal);
      });

      const count = withdraws.length;
      const rows = withdraws.slice(offset, offset + limit);

      return { count, rows };
    },
    findByPk: async (id) => {
      return Withdraw._withdraws.find(w => w.id === parseInt(id)) || null;
    },
    create: async (data) => {
      const newWithdraw = {
        id: Withdraw._nextId++,
        user_id: data.user_id || 0,
        amount: data.amount || 0,
        type: data.type || 'alipay',
        account: data.account || '',
        channel: data.channel || 'gift',
        status: 'pending',
        remark: '',
        create_time: Date.now(),
        handle_time: null
      };
      Withdraw._withdraws.push(newWithdraw);
      return newWithdraw;
    },
    update: async (data, options) => {
      const { where = {} } = options;
      if (where.id) {
        const index = Withdraw._withdraws.findIndex(w => w.id === where.id);
        if (index !== -1) {
          Withdraw._withdraws[index] = { ...Withdraw._withdraws[index], ...data };
          return [1];
        }
      }
      return [0];
    },
    destroy: async (options) => {
      const { where = {} } = options;
      if (where.id) {
        const initialLength = Withdraw._withdraws.length;
        Withdraw._withdraws = Withdraw._withdraws.filter(w => w.id !== where.id);
        return initialLength - Withdraw._withdraws.length;
      }
      return 0;
    }
  };

  const VirtualUser = createMockModel('VirtualUser');
  const VirtualChatHistory = createMockModel('VirtualChatHistory');
  const VirtualUserTag = createMockModel('VirtualUserTag');
  const VirtualUserTagRelation = createMockModel('VirtualUserTagRelation');
  const ChatMessage = createMockModel('ChatMessage');
  const UserSession = createMockModel('UserSession');
  const Notification = createMockModel('Notification');
  const AlbumPhoto = createMockModel('AlbumPhoto');

  const vipPackages = [
    {
      id: 1,
      name: 'VIP月卡',
      price: 18.00,
      original_price: 30.00,
      duration: 30,
      level: 1,
      hot: 1,
      sort: 1,
      status: 1,
      create_time: Math.floor(Date.now() / 1000)
    },
    {
      id: 2,
      name: 'VIP季卡',
      price: 48.00,
      original_price: 90.00,
      duration: 90,
      level: 1,
      hot: 0,
      sort: 2,
      status: 1,
      create_time: Math.floor(Date.now() / 1000)
    },
    {
      id: 3,
      name: 'VIP年卡',
      price: 128.00,
      original_price: 360.00,
      duration: 365,
      level: 2,
      hot: 1,
      sort: 3,
      status: 1,
      create_time: Math.floor(Date.now() / 1000)
    },
    {
      id: 4,
      name: 'VIP永久',
      price: 298.00,
      original_price: null,
      duration: 3650,
      level: 3,
      hot: 0,
      sort: 4,
      status: 1,
      create_time: Math.floor(Date.now() / 1000)
    }
  ];

  const VipPackage = {
    ...createMockModel('VipPackage'),
    findAll: async () => vipPackages,
    findByPk: async (id) => vipPackages.find(p => p.id === parseInt(id)) || null
  };

  const VipOrder = createMockModel('VipOrder');

  // ==================== 收入流水（钱包总资产来源） ====================
  const _incomeRecords = [
    { id: 1, user_id: 1, source_type: 'order', source_name: '接单', icon: '🎮', bg_color: 'linear-gradient(135deg, #667eea, #764ba2)', amount: 50.00, rel_id: 1001, remark: '王者荣耀 · 2小时', create_time: Date.now() - 30 * 60 * 1000 },
    { id: 2, user_id: 1, source_type: 'voice', source_name: '语音聊天', icon: '💬', bg_color: 'linear-gradient(135deg, #4facfe, #00f2fe)', amount: 18.50, rel_id: 0, remark: '语音聊天 · 30分钟', create_time: Date.now() - 50 * 60 * 1000 },
    { id: 3, user_id: 1, source_type: 'video', source_name: '视频聊天', icon: '📹', bg_color: 'linear-gradient(135deg, #43e97b, #38f9d7)', amount: 12.00, rel_id: 0, remark: '视频聊天 · 20分钟', create_time: Date.now() - 70 * 60 * 1000 },
    { id: 4, user_id: 1, source_type: 'gift', source_name: '礼物', icon: '🎁', bg_color: 'linear-gradient(135deg, #f093fb, #f5576c)', amount: 8.00, rel_id: 2001, remark: '用户"小可爱"送出礼物', create_time: Date.now() - 90 * 60 * 1000 },
    { id: 5, user_id: 1, source_type: 'redpacket', source_name: '红包', icon: '🧧', bg_color: 'linear-gradient(135deg, #ff6b6b, #ff8e53)', amount: 6.00, rel_id: 0, remark: '用户"小明"发来红包', create_time: Date.now() - 110 * 60 * 1000 },
    { id: 6, user_id: 1, source_type: 'invite', source_name: '邀请返现', icon: '🤝', bg_color: 'linear-gradient(135deg, #43e97b, #38f9d7)', amount: 5.00, rel_id: 0, remark: '邀请好友注册返现', create_time: Date.now() - 120 * 60 * 1000 },
    { id: 7, user_id: 1, source_type: 'album', source_name: '相册付费查看', icon: '📷', bg_color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', amount: 7.00, rel_id: 3001, remark: '用户付费解锁相册', create_time: Date.now() - 130 * 60 * 1000 }
  ];
  let _incomeRecordId = 7;

  const IncomeRecord = {
    create(data = {}) {
      const record = {
        id: data.id || (++_incomeRecordId),
        user_id: data.user_id,
        source_type: data.source_type,
        source_name: data.source_name,
        icon: data.icon,
        bg_color: data.bg_color,
        amount: data.amount || 0,
        rel_id: data.rel_id || 0,
        remark: data.remark || '',
        create_time: data.create_time || Date.now()
      };
      _incomeRecords.push(record);
      return Promise.resolve(record);
    },
    findAll(options = {}) {
      let list = [..._incomeRecords];
      if (options.where && options.where.user_id) {
        list = list.filter((r) => r.user_id === options.where.user_id);
      }
      if (options.order && options.order[0]) {
        const [field, dir] = options.order[0];
        list.sort((a, b) => (dir === 'DESC' ? b[field] - a[field] : a[field] - b[field]));
      }
      return Promise.resolve(list);
    },
    findByPk(id) {
      const found = _incomeRecords.find((r) => r.id === id);
      return Promise.resolve(found || null);
    },
    update(id, data) {
      const idx = _incomeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return Promise.resolve([0]);
      _incomeRecords[idx] = { ..._incomeRecords[idx], ...data };
      return Promise.resolve([1]);
    },
    destroy(id) {
      const idx = _incomeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return Promise.resolve(0);
      _incomeRecords.splice(idx, 1);
      return Promise.resolve(1);
    }
  };

  // ==================== 支出流水（钱包支出明细） ====================
  const _expenseRecords = [
    { id: 1, user_id: 1, source_type: 'gift', source_name: '购买礼物', icon: '🎁', bg_color: 'linear-gradient(135deg, #fa709a, #fee140)', amount: 6.00, rel_id: 2001, remark: '赠送"小雪"礼物', create_time: Date.now() - 26 * 60 * 1000 },
    { id: 2, user_id: 1, source_type: 'top', source_name: '置顶帖子', icon: '📢', bg_color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', amount: 3.00, rel_id: 0, remark: '帖子置顶消耗', create_time: Date.now() - 40 * 60 * 1000 },
    { id: 3, user_id: 1, source_type: 'medal', source_name: '解锁勋章', icon: '🔒', bg_color: 'linear-gradient(135deg, #ffecd2, #fcb69f)', amount: 3.00, rel_id: 0, remark: '开通月度勋章', create_time: Date.now() - 60 * 60 * 1000 }
  ];
  let _expenseRecordId = 3;

  const ExpenseRecord = {
    create(data = {}) {
      const record = {
        id: data.id || (++_expenseRecordId),
        user_id: data.user_id,
        source_type: data.source_type,
        source_name: data.source_name,
        icon: data.icon,
        bg_color: data.bg_color,
        amount: data.amount || 0,
        rel_id: data.rel_id || 0,
        remark: data.remark || '',
        create_time: data.create_time || Date.now()
      };
      _expenseRecords.push(record);
      return Promise.resolve(record);
    },
    findAll(options = {}) {
      let list = [..._expenseRecords];
      if (options.where && options.where.user_id) {
        list = list.filter((r) => r.user_id === options.where.user_id);
      }
      if (options.order && options.order[0]) {
        const [field, dir] = options.order[0];
        list.sort((a, b) => (dir === 'DESC' ? b[field] - a[field] : a[field] - b[field]));
      }
      return Promise.resolve(list);
    },
    findByPk(id) {
      const found = _expenseRecords.find((r) => r.id === id);
      return Promise.resolve(found || null);
    },
    update(id, data) {
      const idx = _expenseRecords.findIndex((r) => r.id === id);
      if (idx === -1) return Promise.resolve([0]);
      _expenseRecords[idx] = { ..._expenseRecords[idx], ...data };
      return Promise.resolve([1]);
    },
    destroy(id) {
      const idx = _expenseRecords.findIndex((r) => r.id === id);
      if (idx === -1) return Promise.resolve(0);
      _expenseRecords.splice(idx, 1);
      return Promise.resolve(1);
    }
  };

  module.exports = {
    User,
    ChatLog,
    ChatRoom,
    Gift,
    GiftBag,
    GiftLog,
    OrderChong,
    Game,
    GameOrder,
    CompanionProfile,
    Post,
    PostLike,
    PostComment,
    PostUnlock,
    UserFollow,
    RedPacket,
    RedPacketLog,
    Report,
    Reserve,
    ReserveSlot,
    Demand,
    CallRecord,
    CallBilling,
    Banner,
    RechargePackage,
    Card,
    Withdraw,
    IncomeRecord,
    ExpenseRecord,
    VirtualUser,
    VirtualChatHistory,
    VirtualUserTag,
    VirtualUserTagRelation,
    ChatMessage,
    UserSession,
    Notification,
    AlbumPhoto,
    VipPackage,
    VipOrder
  };
} else {
  const User = require('./mysql/User');
  const ChatLog = require('./mysql/ChatLog');
  const ChatRoom = require('./mysql/ChatRoom');
  const Gift = require('./mysql/Gift');
  const GiftBag = require('./mysql/GiftBag');
  const GiftLog = require('./mysql/GiftLog');
  const OrderChong = require('./mysql/OrderChong');
  const Game = require('./mysql/Game');
  const GameOrder = require('./mysql/GameOrder');
  const CompanionProfile = require('./mysql/CompanionProfile');
  const Post = require('./mysql/Post');
  const PostLike = require('./mysql/PostLike');
  const PostComment = require('./mysql/PostComment');
  const PostUnlock = require('./mysql/PostUnlock');
  const UserFollow = require('./mysql/UserFollow');
  const RedPacket = require('./mysql/RedPacket');
  const RedPacketLog = require('./mysql/RedPacketLog');
  const Report = require('./mysql/Report');
  const Reserve = require('./mysql/Reserve');
  const ReserveSlot = require('./mysql/ReserveSlot');
  const Demand = require('./mysql/Demand');
  const CallRecord = require('./mysql/CallRecord');
  const CallBilling = require('./mysql/CallBilling');
  const Banner = require('./mysql/Banner');
  const RechargePackage = require('./mysql/RechargePackage');
  const Card = require('./mysql/Card');
  const Withdraw = require('./mysql/Withdraw');
  const IncomeRecord = require('./mysql/IncomeRecord');
  const ExpenseRecord = require('./mysql/ExpenseRecord');
  const VirtualUser = require('./mysql/VirtualUser');
  const VirtualChatHistory = require('./mysql/VirtualChatHistory');
  const VirtualUserTag = require('./mysql/VirtualUserTag');
  const VirtualUserTagRelation = require('./mysql/VirtualUserTagRelation');
  const VipPackage = require('./mysql/VipPackage');
  const VipOrder = require('./mysql/VipOrder');
  const AlbumPhoto = require('./mysql/AlbumPhoto');

  const ChatMessage = require('./mongo/ChatMessage');
  const UserSession = require('./mongo/UserSession');
  const Notification = require('./mongo/Notification');

  module.exports = {
    User,
    ChatLog,
    ChatRoom,
    Gift,
    GiftBag,
    GiftLog,
    OrderChong,
    Game,
    GameOrder,
    CompanionProfile,
    Post,
    PostLike,
    PostComment,
    PostUnlock,
    UserFollow,
    RedPacket,
    RedPacketLog,
    Report,
    Reserve,
    ReserveSlot,
    Demand,
    CallRecord,
    CallBilling,
    Banner,
    RechargePackage,
    Card,
    Withdraw,
    IncomeRecord,
    ExpenseRecord,
    VirtualUser,
    VirtualChatHistory,
    VirtualUserTag,
    VirtualUserTagRelation,
    ChatMessage,
    UserSession,
    Notification,
    AlbumPhoto,
    VipPackage,
    VipOrder
  };
}
