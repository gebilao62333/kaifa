const config = require('../config');
const { Op } = require('sequelize');

if (config.useMockDb) {
  console.log('📦 使用 Mock 数据模型');

  const {
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
    generateMockWithdraws
  } = require('./mockDataGenerator');

  const mockUsers = generateMockUsers(50);
  const mockVirtualUsers = generateMockVirtualUsers(50);
  const mockPosts = generateMockPosts(50);
  const mockGameOrders = generateMockGameOrders(50);
  const mockCompanionProfiles = generateMockCompanionProfiles(30);
  const mockChatLogs = generateMockChatLogs(100);
  const mockCircleTags = generateMockCircleTags();
  const mockGames = generateMockGames();
  const mockVirtualUserTags = generateMockVirtualUserTags();
  const mockGifts = generateMockGifts();
  const mockWithdraws = generateMockWithdraws(20);

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
      _users: mockUsers,
      _nextId: 51,
      findAndCountAll: async (options) => {
        let users = [...mockUsers];
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
        return mockUsers.find(u => u.id === parseInt(id)) || null;
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
        const filteredLogs = mockChatLogs.filter(log => {
          if (options.where && options.where[Op.or]) {
            const conditions = options.where[Op.or];
            return conditions.some(cond => {
              if (cond.fromid && cond.toid) {
                return (log.fromid === cond.fromid && log.toid === cond.toid) ||
                       (log.fromid === cond.toid && log.toid === cond.fromid);
              }
              return true;
            });
          }
          return true;
        });
        
        return {
          count: filteredLogs.length,
          rows: filteredLogs.sort((a, b) => b.time - a.time)
        };
      }
    },
    ChatRoom: createMockModel('ChatRoom'),
    Gift: {
      ...createMockModel('Gift'),
      _gifts: mockGifts,
      findAndCountAll: async (options) => {
        let gifts = [...mockGifts];
        const { where = {}, offset = 0, limit = 20, order = [['sort', 'ASC']] } = options;
        
        if (where.title) {
          gifts = gifts.filter(g => g.title.includes(where.title));
        }
        if (where.status !== undefined && where.status !== '') {
          gifts = gifts.filter(g => g.status === parseInt(where.status));
        }
        
        const count = gifts.length;
        const rows = gifts.slice(offset, offset + limit);
        
        return { count, rows };
      },
      findByPk: async (id) => {
        return mockGifts.find(g => g.id === parseInt(id)) || null;
      }
    },
    GiftBag: createMockModel('GiftBag'),
    GiftLog: createMockModel('GiftLog'),
    OrderChong: createMockModel('OrderChong'),
    Game: {
      ...createMockModel('Game'),
      _games: mockGames,
      findAll: async (options = {}) => {
        let games = [...mockGames];
        if (options.where && options.where.status !== undefined) {
          games = games.filter(g => g.status === options.where.status);
        }
        return games;
      },
      findByPk: async (id) => {
        return mockGames.find(g => g.id === parseInt(id)) || null;
      }
    },
    GameOrder: {
      ...createMockModel('GameOrder'),
      _orders: mockGameOrders,
      findAndCountAll: async (options) => {
        let orders = [...mockGameOrders];
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
        return mockGameOrders.find(o => o.id === parseInt(id)) || null;
      }
    },
    CompanionProfile: {
      ...createMockModel('CompanionProfile'),
      _profiles: mockCompanionProfiles,
      findAndCountAll: async (options) => {
        let profiles = [...mockCompanionProfiles];
        const { where = {}, offset = 0, limit = 20, order = [['create_time', 'DESC']] } = options;
        
        if (where.status !== undefined) {
          profiles = profiles.filter(p => p.status === where.status);
        }
        if (where.game_id !== undefined && where.game_id !== null) {
          profiles = profiles.filter(p => {
            const gameIds = JSON.parse(p.game_ids || '[]');
            return gameIds.includes(where.game_id);
          });
        }
        
        const orderField = order[0][0];
        const orderDirection = order[0][1];
        profiles.sort((a, b) => {
          const aVal = a[orderField];
          const bVal = b[orderField];
          return orderDirection === 'DESC' ? (bVal - aVal) : (aVal - bVal);
        });
        
        const count = profiles.length;
        const rows = profiles.slice(offset, offset + limit);
        
        return { count, rows };
      }
    },
    Post: {
      ...createMockModel('Post'),
      _posts: mockPosts,
      findAndCountAll: async (options) => {
        let posts = [...mockPosts];
        const { where = {}, offset = 0, limit = 20, order = [['create_time', 'DESC']] } = options;
        
        if (where.content) {
          posts = posts.filter(p => p.content.includes(where.content));
        }
        if (where.user_id) {
          posts = posts.filter(p => p.user_id === where.user_id);
        }
        if (where.tag_id) {
          posts = posts.filter(p => p.tag_id === where.tag_id);
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
        return mockPosts.find(p => p.id === parseInt(id)) || null;
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
      _withdraws: mockWithdraws,
      findAndCountAll: async (options) => {
        let withdraws = [...mockWithdraws];
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
      }
    },
    VirtualUser: {
      ...createMockModel('VirtualUser'),
      _users: mockVirtualUsers,
      findAndCountAll: async (options) => {
        let users = [...mockVirtualUsers];
        const { where = {}, offset = 0, limit = 20, order = [['create_time', 'DESC']] } = options;
        
        if (where.online_status !== undefined) {
          users = users.filter(u => u.online_status === where.online_status);
        }
        if (where.gender !== undefined) {
          users = users.filter(u => u.gender === where.gender);
        }
        if (where.region) {
          users = users.filter(u => u.region.includes(where.region));
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
        return mockVirtualUsers.find(u => u.id === parseInt(id)) || null;
      }
    },
    VirtualChatHistory: createMockModel('VirtualChatHistory'),
    VirtualUserTag: {
      ...createMockModel('VirtualUserTag'),
      _tags: mockVirtualUserTags,
      findAll: async (options = {}) => {
        let tags = [...mockVirtualUserTags];
        if (options.where && options.where.status !== undefined) {
          tags = tags.filter(t => t.status === options.where.status);
        }
        return tags;
      }
    },
    VirtualUserTagRelation: createMockModel('VirtualUserTagRelation'),
    ChatMessage: createMockModel('ChatMessage'),
    UserSession: createMockModel('UserSession'),
    Notification: createMockModel('Notification'),
    AlbumPhoto: createMockModel('AlbumPhoto'),
    VipPackage: {
      ...createMockModel('VipPackage'),
      findAll: async () => [
        { id: 1, name: 'VIP月卡', price: 18.00, original_price: 30.00, duration: 30, level: 1, hot: 1, sort: 1, status: 1, create_time: Math.floor(Date.now() / 1000) },
        { id: 2, name: 'VIP季卡', price: 48.00, original_price: 90.00, duration: 90, level: 1, hot: 0, sort: 2, status: 1, create_time: Math.floor(Date.now() / 1000) },
        { id: 3, name: 'VIP年卡', price: 128.00, original_price: 360.00, duration: 365, level: 2, hot: 1, sort: 3, status: 1, create_time: Math.floor(Date.now() / 1000) },
        { id: 4, name: 'VIP永久', price: 298.00, original_price: null, duration: 3650, level: 3, hot: 0, sort: 4, status: 1, create_time: Math.floor(Date.now() / 1000) }
      ],
      findByPk: async (id) => {
        const packages = [
          { id: 1, name: 'VIP月卡', price: 18.00, original_price: 30.00, duration: 30, level: 1, hot: 1, sort: 1, status: 1, create_time: Math.floor(Date.now() / 1000) },
          { id: 2, name: 'VIP季卡', price: 48.00, original_price: 90.00, duration: 90, level: 1, hot: 0, sort: 2, status: 1, create_time: Math.floor(Date.now() / 1000) },
          { id: 3, name: 'VIP年卡', price: 128.00, original_price: 360.00, duration: 365, level: 2, hot: 1, sort: 3, status: 1, create_time: Math.floor(Date.now() / 1000) },
          { id: 4, name: 'VIP永久', price: 298.00, original_price: null, duration: 3650, level: 3, hot: 0, sort: 4, status: 1, create_time: Math.floor(Date.now() / 1000) }
        ];
        return packages.find(p => p.id === parseInt(id)) || null;
      }
    },
    VipOrder: createMockModel('VipOrder'),
    CircleTag: {
      ...createMockModel('CircleTag'),
      _tags: mockCircleTags,
      findAll: async (options = {}) => {
        let tags = [...mockCircleTags];
        if (options.where && options.where.status !== undefined) {
          tags = tags.filter(t => t.status === options.where.status);
        }
        return tags.sort((a, b) => a.sort_order - b.sort_order);
      },
      findByPk: async (id) => {
        return mockCircleTags.find(t => t.id === parseInt(id)) || null;
      }
    }
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
  const CircleTag = require('./mysql/CircleTag');

  const ChatMessage = require('./mongo/ChatMessage');
  const UserSession = require('./mongo/UserSession');
  const Notification = require('./mongo/Notification');

  CompanionProfile.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    targetKey: 'id'
  });

  User.hasMany(CompanionProfile, {
    foreignKey: 'user_id',
    as: 'companion_profiles'
  });

  GameOrder.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    targetKey: 'id'
  });

  GameOrder.belongsTo(User, {
    foreignKey: 'companion_id',
    as: 'companion',
    targetKey: 'id'
  });

  GameOrder.belongsTo(Game, {
    foreignKey: 'game_id',
    as: 'game',
    targetKey: 'id'
  });

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
    VipOrder,
    CircleTag
  };
}
