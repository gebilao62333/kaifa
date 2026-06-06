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
    generateMockWithdraws,
    generateMockCustomerServices,
    generateMockChatMessages
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
  const mockCustomerServices = generateMockCustomerServices();
  const mockChatMessages = generateMockChatMessages(100);

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
      findAll: async (options = {}) => {
        let users = [...mockUsers];
        const { where = {}, order, limit, offset } = options;
        if (where.status !== undefined) {
          users = users.filter(u => u.status === parseInt(where.status));
        }
        if (where.id) {
          const ids = Array.isArray(where.id) ? where.id : [where.id];
          users = users.filter(u => ids.includes(u.id));
        }
        if (order) {
          const [field, dir] = order[0];
          users.sort((a, b) => dir === 'DESC' ? (b[field] || 0) - (a[field] || 0) : (a[field] || 0) - (b[field] || 0));
        }
        const start = offset || 0;
        const end = limit ? start + limit : users.length;
        return users.slice(start, end);
      },
      findOne: async (options) => {
        const { where = {} } = options;
        let user = null;
        
        if (where[Op.or]) {
          const conditions = where[Op.or];
          for (const cond of conditions) {
            if (cond.username) {
              user = mockUsers.find(u => u.username === cond.username);
            } else if (cond.mobile) {
              user = mockUsers.find(u => u.mobile === cond.mobile);
            }
            if (user) break;
          }
        } else if (where.username) {
          user = mockUsers.find(u => u.username === where.username);
        } else if (where.mobile) {
          user = mockUsers.find(u => u.mobile === where.mobile);
        } else if (where.id) {
          user = mockUsers.find(u => u.id === parseInt(where.id));
        }
        
        if (user) {
          // 给返回的mock对象添加update方法以兼容Sequelize实例的用法
          return {
            ...user,
            update: async (data) => {
              const index = mockUsers.findIndex(u => u.id === user.id);
              if (index !== -1) {
                mockUsers[index] = { ...mockUsers[index], ...data, update_time: Date.now() };
              }
              return user;
            },
            destroy: async () => {
              const index = mockUsers.findIndex(u => u.id === user.id);
              if (index !== -1) {
                mockUsers.splice(index, 1);
              }
              return 1;
            }
          };
        }
        return null;
      },
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
        const user = mockUsers.find(u => u.id === parseInt(id));
        if (user) {
          return {
            ...user,
            update: async (data) => {
              const index = mockUsers.findIndex(u => u.id === user.id);
              if (index !== -1) {
                mockUsers[index] = { ...mockUsers[index], ...data, update_time: Date.now() };
              }
              return user;
            },
            destroy: async () => {
              const index = mockUsers.findIndex(u => u.id === user.id);
              if (index !== -1) {
                mockUsers.splice(index, 1);
              }
              return 1;
            }
          };
        }
        return null;
      },
      create: async (data) => {
        const newUser = {
          id: User._nextId++,
          userId: User._nextId - 1,
          username: data.username || `user${User._nextId}`,
          password: data.password,
          nickname: data.nickname || '新用户',
          avatar: data.avatar || 'https://picsum.photos/100/100',
          phone: data.phone || '',
          mobile: data.phone || '',
          status: data.status || 1,
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
      increment: async (field, options) => {
        const { where = {} } = options;
        if (where.id) {
          const index = User._users.findIndex(u => u.id === where.id);
          if (index !== -1) {
            const dbField = typeof field === 'string' ? field : Object.keys(field)[0];
            User._users[index][dbField] = (User._users[index][dbField] || 0) + 1;
          }
        }
      },
      decrement: async (field, options) => {
        const { where = {} } = options;
        if (where.id) {
          const index = User._users.findIndex(u => u.id === where.id);
          if (index !== -1) {
            const dbField = typeof field === 'string' ? field : Object.keys(field)[0];
            User._users[index][dbField] = Math.max(0, (User._users[index][dbField] || 0) - 1);
          }
        }
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
        
        // 内容关键词搜索
        if (where.content) {
          posts = posts.filter(p => p.content.includes(where.content));
        }
        if (where.user_id) {
          posts = posts.filter(p => p.user_id === where.user_id);
        }
        if (where.tag_id) {
          posts = posts.filter(p => p.tag_id === where.tag_id);
        }
        if (where.status !== undefined && where.status !== '') {
          posts = posts.filter(p => p.status === parseInt(where.status));
        }
        if (where.type !== undefined && where.type !== '') {
          posts = posts.filter(p => p.type === parseInt(where.type));
        }
        if (where.is_private !== undefined && where.is_private !== '') {
          posts = posts.filter(p => p.is_private === parseInt(where.is_private));
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
      },
      findAll: async (options = {}) => {
        let posts = [...mockPosts];
        const { where = {} } = options;
        if (where.id) {
          const ids = Array.isArray(where.id) ? where.id : [where.id];
          posts = posts.filter(p => ids.includes(p.id));
        }
        return posts;
      },
      destroy: async (options) => {
        const { where = {} } = options;
        if (where.id) {
          const ids = Array.isArray(where.id) ? where.id : [where.id];
          const initialLength = Post._posts ? Post._posts.length : mockPosts.length;
          if (Post._posts) {
            Post._posts = Post._posts.filter(p => !ids.includes(p.id));
          }
          return Array.isArray(where.id) ? ids.length : 1;
        }
        return 0;
      },
      update: async (data, options) => {
        const { where = {} } = options;
        let affected = 0;
        if (where.id) {
          const ids = Array.isArray(where.id) ? where.id : [where.id];
          if (Post._posts) {
            Post._posts.forEach((p, idx) => {
              if (ids.includes(p.id)) {
                Post._posts[idx] = { ...Post._posts[idx], ...data };
                affected++;
              }
            });
          }
        }
        return [affected];
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
    ChatMessage: {
      ...createMockModel('ChatMessage'),
      _messages: mockChatMessages,
      _nextId: mockChatMessages.length + 1,
      findAll: async (options = {}) => {
        let messages = [...mockChatMessages];
        const { where = {}, order = [['create_time', 'DESC']], limit = 50, offset = 0 } = options;
        
        if (where.user_id) {
          messages = messages.filter(m => m.user_id === parseInt(where.user_id));
        }
        if (where.customer_service_id) {
          messages = messages.filter(m => m.customer_service_id === parseInt(where.customer_service_id));
        }
        if (where.sender_type) {
          messages = messages.filter(m => m.sender_type === where.sender_type);
        }
        
        const orderField = order[0][0];
        const orderDirection = order[0][1];
        messages.sort((a, b) => orderDirection === 'DESC' ? b[orderField] - a[orderField] : a[orderField] - b[orderField]);
        
        return messages.slice(offset, offset + limit);
      },
      create: async (data) => {
        const newMessage = {
          id: ChatMessage._nextId++,
          ...data,
          create_time: Date.now()
        };
        ChatMessage._messages.push(newMessage);
        return newMessage;
      },
      findByPk: async (id) => {
        return mockChatMessages.find(m => m.id === parseInt(id)) || null;
      }
    },
    CustomerService: {
      ...createMockModel('CustomerService'),
      _services: mockCustomerServices,
      _nextId: mockCustomerServices.length + 1,
      findAll: async (options = {}) => {
        let services = [...mockCustomerServices];
        const { where = {} } = options;
        
        if (where.status !== undefined) {
          services = services.filter(s => s.status === parseInt(where.status));
        }
        if (where.online !== undefined) {
          services = services.filter(s => s.online === !!where.online);
        }
        
        return services;
      },
      findOne: async (options = {}) => {
        const { where = {} } = options;
        if (where.userId) {
          return mockCustomerServices.find(s => s.userId === parseInt(where.userId)) || null;
        }
        return null;
      },
      findByPk: async (id) => {
        return mockCustomerServices.find(s => s.userId === parseInt(id)) || null;
      },
      update: async (data, options) => {
        const { where = {} } = options;
        if (where.userId) {
          const index = mockCustomerServices.findIndex(s => s.userId === parseInt(where.userId));
          if (index !== -1) {
            mockCustomerServices[index] = { ...mockCustomerServices[index], ...data, update_time: Date.now() };
            return [1];
          }
        }
        return [0];
      },
      create: async (data) => {
        const newId = CustomerService._nextId++;
        const newService = {
          id: newId,
          userId: 9000 + newId,
          ...data,
          create_time: Date.now(),
          update_time: Date.now()
        };
        mockCustomerServices.push(newService);
        return newService;
      }
    },
    UserSession: createMockModel('UserSession'),
    Notification: {
      ...createMockModel('Notification'),
      _notifications: [],
      _nextId: 1,
      mockData: [
        { id: 1, userId: 0, type: 3, title: '系统维护通知', content: '系统将于今晚凌晨2:00-5:00进行维护升级，届时部分服务将暂时不可用', isRead: false, createTime: Date.now() - 86400000 * 2 },
        { id: 2, userId: 0, type: 3, title: 'VIP会员活动', content: 'VIP会员限时特惠，购买年卡享8折优惠', isRead: false, createTime: Date.now() - 86400000 },
        { id: 3, userId: 0, type: 3, title: '新功能上线', content: '新增语音聊天功能，快来体验吧', isRead: false, createTime: Date.now() - 43200000 },
        { id: 4, userId: 0, type: 3, title: '安全提醒', content: '请勿向他人泄露您的账号密码，谨防诈骗', isRead: false, createTime: Date.now() - 21600000 }
      ],
      findAndCountAll: async (options = {}) => {
        let list = [...Notification._notifications.length > 0 ? Notification._notifications : Notification.mockData];
        const { where = {}, offset = 0, limit = 20, order = [['createTime', 'DESC']] } = options;
        if (where.title) {
          list = list.filter(n => n.title.includes(where.title));
        }
        if (where.type !== undefined && where.type !== '') {
          list = list.filter(n => n.type === parseInt(where.type));
        }
        if (where.userId !== undefined && where.userId !== '') {
          list = list.filter(n => n.userId === parseInt(where.userId));
        }
        list.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
        const count = list.length;
        const rows = list.slice(offset, offset + limit);
        return { count, rows };
      },
      findAll: async (options = {}) => {
        let list = [...Notification._notifications.length > 0 ? Notification._notifications : Notification.mockData];
        const { where = {} } = options;
        if (where.userId !== undefined && where.userId !== '') {
          list = list.filter(n => {
            const uid = parseInt(where.userId);
            return n.userId === uid || n.userId === 0;
          });
        }
        if (where[Op.or]) {
          const ors = where[Op.or];
          for (const cond of ors) {
            if (cond.userId) {
              const uid = parseInt(cond.userId);
              list = list.filter(n => n.userId === uid || n.userId === 0);
            }
          }
        }
        list.sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
        return list;
      },
      findByPk: async (id) => {
        const list = Notification._notifications.length > 0 ? Notification._notifications : Notification.mockData;
        return list.find(n => n.id === parseInt(id)) || null;
      },
      findOne: async (options = {}) => {
        const { where = {} } = options;
        const list = Notification._notifications.length > 0 ? Notification._notifications : Notification.mockData;
        if (where.id) {
          return list.find(n => n.id === parseInt(where.id)) || null;
        }
        return null;
      },
      create: async (data) => {
        const newItem = {
          id: Notification._nextId++,
          ...data,
          createTime: data.createTime || Date.now(),
          isRead: data.isRead !== undefined ? data.isRead : false
        };
        Notification._notifications.unshift(newItem);
        return newItem;
      },
      update: async (data, options) => {
        const { where = {} } = options;
        if (where.id) {
          const list = Notification._notifications.length > 0 ? Notification._notifications : Notification.mockData;
          const idx = list.findIndex(n => n.id === parseInt(where.id));
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...data };
            return [1];
          }
        }
        return [0];
      },
      destroy: async (options) => {
        const { where = {} } = options;
        if (where.id) {
          const list = Notification._notifications.length > 0 ? Notification._notifications : Notification.mockData;
          const initialLen = list.length;
          if (where.id) {
            Notification._notifications = list.filter(n => n.id !== parseInt(where.id));
            return 1;
          }
        }
        return 0;
      },
      count: async (options = {}) => {
        const list = Notification._notifications.length > 0 ? Notification._notifications : Notification.mockData;
        const { where = {} } = options;
        if (where.isRead !== undefined) {
          return list.filter(n => n.isRead === where.isRead).length;
        }
        return list.length;
      }
    },
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
    // Sequelize Op 操作符 Mock 工具
    Recommend: {
      ...createMockModel('Recommend'),
      _records: [],
      _nextId: 1,
      // 将字段值 val 与 Op 条件对象做比较
      _matchFieldCond: function(val, cond) {
        if (cond === null || cond === undefined) return true;
        if (typeof cond !== 'object') return val === cond;
        if (Array.isArray(cond)) return true;
        if (cond[Op.gt] !== undefined && !(val > cond[Op.gt])) return false;
        if (cond[Op.gte] !== undefined && !(val >= cond[Op.gte])) return false;
        if (cond[Op.lt] !== undefined && !(val < cond[Op.lt])) return false;
        if (cond[Op.lte] !== undefined && !(val <= cond[Op.lte])) return false;
        if (cond[Op.ne] !== undefined && val === cond[Op.ne]) return false;
        if (cond[Op.eq] !== undefined && val !== cond[Op.eq]) return false;
        if (cond[Op.in] !== undefined && !cond[Op.in].includes(val)) return false;
        if (cond[Op.notIn] !== undefined && cond[Op.notIn].includes(val)) return false;
        // 嵌套 and/or — 子条件作用于同一字段值
        if (cond[Op.and] !== undefined) {
          const nested = Array.isArray(cond[Op.and]) ? cond[Op.and] : [cond[Op.and]];
          if (!nested.every(c => this._matchFieldCond(val, c))) return false;
        }
        if (cond[Op.or] !== undefined) {
          const nested = Array.isArray(cond[Op.or]) ? cond[Op.or] : [cond[Op.or]];
          if (!nested.some(c => this._matchFieldCond(val, c))) return false;
        }
        return true;
      },
      _matchWhere: function(record, where) {
        const self = this;
        if (!where) return true;
        for (const key of Object.keys(where)) {
          const cond = where[key];
          if (cond === null || cond === undefined) continue;
          // 顶层 Op.and / Op.or：每个子条件都是一个完整的 where 对象，作用于整条记录
          if (key === Op.and && Array.isArray(cond)) {
            if (!cond.every(c => self._matchWhere(record, c))) return false;
          } else if (key === Op.or && Array.isArray(cond)) {
            if (!cond.some(c => self._matchWhere(record, c))) return false;
          } else {
            // 普通字段：key 是字段名，cond 可能是普通值或 Op 对象
            const val = record[key];
            if (!self._matchFieldCond(val, cond)) return false;
          }
        }
        return true;
      },
      findAll: async function(options = {}) {
        const self = this;
        let records = [...self._records];
        const { where = {}, order = [['sort_order', 'ASC']] } = options;
        if (Object.keys(where).length > 0) {
          records = records.filter(r => self._matchWhere(r, where));
        }
        records.sort((a, b) => {
          if (a.is_top && !b.is_top) return -1;
          if (!a.is_top && b.is_top) return 1;
          return a.sort_order - b.sort_order;
        });
        return records;
      },
      findOne: async function(options = {}) {
        const self = this;
        const { where = {} } = options;
        if (where.id) {
          return self._records.find(r => r.id === parseInt(where.id)) || null;
        }
        if (where.user_id && where.recommend_type) {
          return self._records.find(r => r.user_id === where.user_id && r.recommend_type === where.recommend_type) || null;
        }
        return null;
      },
      findByPk: async function(id) {
        return this._records.find(r => r.id === parseInt(id)) || null;
      },
      create: async function(data) {
        const self = this;
        const now = Math.floor(Date.now() / 1000);
        const record = {
          id: self._nextId++,
          user_id: data.user_id,
          nickname: data.nickname || '',
          avatar: data.avatar || '',
          recommend_type: data.recommend_type || 'home',
          start_time: data.start_time || 0,
          end_time: data.end_time || 0,
          is_top: data.is_top || 0,
          sort_order: data.sort_order || self._records.length,
          status: data.status !== undefined ? data.status : 1,
          create_time: now,
          update_time: now
        };
        self._records.push(record);
        return record;
      },
      update: async function(data, options) {
        const self = this;
        const { where = {} } = options;
        let affected = 0;
        if (where.id) {
          const idx = self._records.findIndex(r => r.id === parseInt(where.id));
          if (idx !== -1) {
            self._records[idx] = { ...self._records[idx], ...data, update_time: Math.floor(Date.now() / 1000) };
            affected = 1;
          }
        }
        return [affected];
      },
      destroy: async function(options) {
        const self = this;
        const { where = {} } = options;
        if (where.id) {
          const initialLen = self._records.length;
          self._records = self._records.filter(r => r.id !== parseInt(where.id));
          return initialLen - self._records.length;
        }
        return 0;
      }
    },
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
const Admin = require('./mysql/Admin');
const AdminRole = require('./mysql/AdminRole');
const CustomerService = require('./mysql/CustomerService');
const Recommend = require('./mysql/Recommend');

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
    CustomerService,
    UserSession,
    Notification,
    AlbumPhoto,
    VipPackage,
    VipOrder,
    CircleTag,
    Admin,
    AdminRole,
    Recommend
  };
}
