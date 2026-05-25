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

  module.exports = {
    User: {
      ...createMockModel('User'),
      _users: [
        { id: 1, userId: 1, nickname: '用户小明', avatar: 'https://picsum.photos/100/100?random=1', phone: '13800138001', status: 0, vip: 1, vip_lv: 2, money: 5000, gift_money: 200, score: 1500, fans_num: 120, follow_num: 45, dec: '喜欢玩游戏', sex: 1, city: '北京', create_time: Date.now() - 86400000 * 30, update_time: Date.now() },
        { id: 2, userId: 2, nickname: '用户小红', avatar: 'https://picsum.photos/100/100?random=2', phone: '13800138002', status: 0, vip: 0, vip_lv: 0, money: 1200, gift_money: 50, score: 300, fans_num: 35, follow_num: 20, dec: '', sex: 0, city: '上海', create_time: Date.now() - 86400000 * 20, update_time: Date.now() },
        { id: 3, userId: 3, nickname: '用户小刚', avatar: 'https://picsum.photos/100/100?random=3', phone: '13800138003', status: 1, vip: 1, vip_lv: 1, money: 0, gift_money: 0, score: 0, fans_num: 0, follow_num: 0, dec: '已被禁用', sex: 1, city: '广州', create_time: Date.now() - 86400000 * 10, update_time: Date.now() },
        { id: 4, userId: 4, nickname: '用户小丽', avatar: 'https://picsum.photos/100/100?random=4', phone: '13800138004', status: 0, vip: 0, vip_lv: 0, money: 800, gift_money: 100, score: 200, fans_num: 15, follow_num: 30, dec: '新人报道', sex: 0, city: '深圳', create_time: Date.now() - 86400000 * 5, update_time: Date.now() },
        { id: 5, userId: 5, nickname: '用户阿杰', avatar: 'https://picsum.photos/100/100?random=5', phone: '13800138005', status: 0, vip: 1, vip_lv: 3, money: 15000, gift_money: 500, score: 5000, fans_num: 500, follow_num: 100, dec: '资深玩家', sex: 1, city: '杭州', create_time: Date.now() - 86400000 * 60, update_time: Date.now() }
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
        const rows = users.slice(offset, offset + limit);
        
        return { count, rows };
      },
      findByPk: async (id) => {
        return User._users.find(u => u.id === parseInt(id)) || null;
      },
      create: async (data) => {
        const newUser = {
          id: User._nextId++,
          userId: User._nextId - 1,
          nickname: data.nickname || '新用户',
          avatar: data.avatar || 'https://picsum.photos/100/100',
          phone: data.phone || '',
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
        return newUser;
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
    },
    ChatLog: {
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
    },
    ChatRoom: createMockModel('ChatRoom'),
    Gift: {
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
    },
    GiftBag: createMockModel('GiftBag'),
    GiftLog: createMockModel('GiftLog'),
    OrderChong: createMockModel('OrderChong'),
    Game: createMockModel('Gift'),
    GameOrder: {
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
    },
    CompanionProfile: createMockModel('CompanionProfile'),
    Post: {
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
    },
    PostLike: createMockModel('PostLike'),
    PostComment: createMockModel('PostComment'),
    PostUnlock: createMockModel('PostUnlock'),
    UserFollow: createMockModel('UserFollow'),
    RedPacket: createMockModel('RedPacket'),
    RedPacketLog: createMockModel('RedPacketLog'),
    Report: createMockModel('Report'),
    Reserve: createMockModel('Reserve'),
    ReserveSlot: createMockModel('ReserveSlot'),
    Demand: createMockModel('Demand'),
    CallRecord: createMockModel('CallRecord'),
    CallBilling: createMockModel('CallBilling'),
    Banner: createMockModel('Banner'),
    RechargePackage: createMockModel('RechargePackage'),
    Card: createMockModel('Card'),
    
    Withdraw: {
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
    },
    VirtualUser: createMockModel('VirtualUser'),
    VirtualChatHistory: createMockModel('VirtualChatHistory'),
    VirtualUserTag: createMockModel('VirtualUserTag'),
    VirtualUserTagRelation: createMockModel('VirtualUserTagRelation'),
    ChatMessage: createMockModel('ChatMessage'),
    UserSession: createMockModel('UserSession'),
    Notification: createMockModel('Notification'),
    AlbumPhoto: createMockModel('AlbumPhoto'),
    VipPackage: {
      ...createMockModel('VipPackage'),
      findAll: async () => [
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
      ],
      findByPk: async (id) => {
        const packages = [
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
        return packages.find(p => p.id === parseInt(id)) || null;
      }
    },
    VipOrder: createMockModel('VipOrder')
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
