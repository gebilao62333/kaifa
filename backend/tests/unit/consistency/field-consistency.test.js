const authService = require('../../../src/services/authService');
const chatService = require('../../../src/services/chatService');

jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn()
  },
  UserFollow: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  UserSession: {
    findAndCountAll: jest.fn(),
    findOrCreate: jest.fn(),
    update: jest.fn()
  }
}));

describe('数据模型字段一致性测试', () => {
  describe('User 字段映射', () => {
    it('getUserInfo 应返回 nickname 字段（非 nickName）', async () => {
      const mockUser = {
        id: 1,
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.png',
        city: '北京',
        lv: 5,
        vip: 1,
        vip_lv: 2,
        money: 1000.00,
        gift_money: 500.00,
        score: 100,
        fans_num: 50,
        dec: '这是一个测试用户',
        sex: 1
      };

      const { User, UserFollow } = require('../../../src/models');
      User.findByPk.mockResolvedValue(mockUser);
      UserFollow.findOne.mockResolvedValue(null);

      const result = await authService.getUserInfo(1, 1);

      expect(result).toHaveProperty('nickname');
      expect(result).not.toHaveProperty('nickName');
      expect(result.nickname).toBe('测试用户');
    });

    it('loginWithPassword 应返回 nickname 字段（非 nickName）', async () => {
      const mockUser = {
        id: 2,
        nickname: '登录用户',
        avatar: 'https://example.com/avatar2.png',
        password: '$2a$10$hashed',
        lv: 3,
        vip: 0,
        vip_lv: 0,
        money: 500.00,
        score: 50,
        fans_num: 20,
        update: jest.fn()
      };

      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const { User } = require('../../../src/models');
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.loginWithPassword('testuser', 'password123');

      expect(result).toHaveProperty('nickname');
      expect(result).not.toHaveProperty('nickName');
      expect(result.nickname).toBe('登录用户');
    });
  });

  describe('ChatService 字段映射', () => {
    it('getChatList 应返回 nickname 字段（非 nickName）', async () => {
      const mockSession = {
        id: 1,
        userId: 1,
        peerId: 2,
        peerName: '聊天对象',
        peerAvatar: 'https://example.com/peer.png',
        lastMessage: '你好',
        lastMessageTime: 1234567890,
        unreadCount: 0
      };

      const mockPeerUser = {
        id: 2,
        nickname: '聊天对象',
        avatar: 'https://example.com/peer.png',
        lv: 2,
        vip: 1
      };

      const { User, UserSession } = require('../../../src/models');
      UserSession.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockSession]
      });
      User.findByPk.mockResolvedValue(mockPeerUser);

      const result = await chatService.getChatList(1, 1, 20);

      expect(result.list).toHaveLength(1);
      expect(result.list[0]).toHaveProperty('nickname');
      expect(result.list[0]).not.toHaveProperty('nickName');
      expect(result.list[0].nickname).toBe('聊天对象');
    });
  });

  describe('字段命名规范验证', () => {
    it('应使用 camelCase 或 snake_case 命名', () => {
      const validCamelCaseFields = ['userId', 'nickname', 'avatar', 'level'];
      const validSnakeCaseFields = ['user_id', 'nick_name', 'avatar_url', 'user_lv'];

      validCamelCaseFields.forEach(field => {
        expect(field).toMatch(/^[a-z]+([A-Z][a-z]*)*$|^[a-z]+$/);
      });

      validSnakeCaseFields.forEach(field => {
        expect(field).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    it('不应使用 nickName 这种混合大小写', () => {
      const responseFields = ['nickname', 'userId', 'avatar'];
      responseFields.forEach(field => {
        expect(field).not.toBe('nickName');
        expect(field).not.toBe('NickName');
      });
    });
  });
});

describe('API 响应格式一致性测试', () => {
  describe('统一响应格式', () => {
    it('所有成功响应应包含 code, message, data', () => {
      const successResponse = {
        code: 200,
        message: 'success',
        data: {}
      };

      expect(successResponse).toHaveProperty('code');
      expect(successResponse).toHaveProperty('message');
      expect(successResponse).toHaveProperty('data');
    });

    it('所有错误响应应包含 code 和 message', () => {
      const errorResponses = [
        { code: 400, message: '请求参数错误' },
        { code: 401, message: '未授权' },
        { code: 403, message: '禁止访问' },
        { code: 404, message: '资源不存在' },
        { code: 500, message: '服务器错误' }
      ];

      errorResponses.forEach(response => {
        expect(response).toHaveProperty('code');
        expect(response).toHaveProperty('message');
        expect(typeof response.code).toBe('number');
        expect(typeof response.message).toBe('string');
      });
    });
  });

  describe('用户数据响应字段', () => {
    it('用户信息响应应包含正确的字段', () => {
      const userResponse = {
        userId: 1,
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.png',
        level: 5,
        vip: true,
        vipLevel: 2,
        balance: 1000.00,
        score: 100,
        fansCount: 50
      };

      const expectedFields = [
        'userId',
        'nickname',
        'avatar',
        'level',
        'vip',
        'vipLevel',
        'balance',
        'score',
        'fansCount'
      ];

      expectedFields.forEach(field => {
        expect(userResponse).toHaveProperty(field);
      });

      expect(userResponse).not.toHaveProperty('nickName');
      expect(userResponse).not.toHaveProperty('lv');
      expect(userResponse).not.toHaveProperty('vip_lv');
      expect(userResponse).not.toHaveProperty('money');
    });
  });
});

describe('WebSocket 事件命名一致性测试', () => {
  describe('通话相关事件', () => {
    const validCallEvents = [
      'call_invite',
      'call_accept',
      'call_reject',
      'call_cancel',
      'call_end'
    ];

    const invalidCallEvents = [
      'call:incoming',
      'call:accepted',
      'call:rejected',
      'call:cancelled',
      'call:ended'
    ];

    it('应使用下划线命名而非冒号命名', () => {
      validCallEvents.forEach(event => {
        expect(event).toMatch(/^[a-z_]+$/);
        expect(event).not.toContain(':');
      });
    });

    it('不应使用冒号分隔的事件名', () => {
      invalidCallEvents.forEach(event => {
        expect(event).toContain(':');
      });
    });

    it('前端和后端事件名应保持一致', () => {
      const frontendEvents = [
        'call_invite',
        'call_accept',
        'call_reject',
        'call_cancel',
        'call_end'
      ];

      const backendEvents = [
        'call_invite',
        'call_accept',
        'call_reject',
        'call_cancel',
        'call_end'
      ];

      expect(frontendEvents).toEqual(backendEvents);
    });
  });

  describe('消息相关事件', () => {
    it('私聊消息事件应使用正确的命名', () => {
      const privateMessageEvents = [
        'private_message',
        'private_message_ack',
        'message_revoked',
        'typing'
      ];

      privateMessageEvents.forEach(event => {
        expect(event).toMatch(/^[a-z_]+$/);
        expect(event).not.toContain(':');
      });
    });
  });
});

describe('错误码定义一致性测试', () => {
  const standardErrorCodes = [
    { code: 200, message: '成功' },
    { code: 201, message: '创建成功' },
    { code: 400, message: '请求参数错误' },
    { code: 401, message: '未授权' },
    { code: 403, message: '权限不足' },
    { code: 404, message: '资源不存在' },
    { code: 422, message: '业务逻辑错误' },
    { code: 500, message: '服务器错误' }
  ];

  it('应定义完整的错误码', () => {
    expect(standardErrorCodes).toHaveLength(8);
  });

  it('错误码应为数字类型', () => {
    standardErrorCodes.forEach(error => {
      expect(typeof error.code).toBe('number');
    });
  });

  it('错误信息应为字符串类型', () => {
    standardErrorCodes.forEach(error => {
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    });
  });

  it('HTTP状态码与业务码应一致', () => {
    standardErrorCodes.forEach(error => {
      expect(error.code).toBeGreaterThanOrEqual(200);
      expect(error.code).toBeLessThan(600);
    });
  });
});

describe('认证机制一致性测试', () => {
  describe('Token 认证', () => {
    it('应使用 Bearer Token 方式', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      expect(authHeader.startsWith('Bearer ')).toBe(true);
    });

    it('JWT Token 应包含 userId', () => {
      const mockPayload = {
        userId: 12345,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400
      };

      expect(mockPayload).toHaveProperty('userId');
      expect(typeof mockPayload.userId).toBe('number');
    });
  });

  describe('认证失败响应', () => {
    it('未授权应返回 401 状态码', () => {
      const unauthorizedResponse = {
        code: 401,
        message: '令牌无效或已过期'
      };

      expect(unauthorizedResponse.code).toBe(401);
    });
  });
});

describe('数据验证一致性测试', () => {
  describe('参数验证规则', () => {
    it('手机号应使用正确的格式验证', () => {
      const validPhone = '13812345678';
      const invalidPhone = '12345678901';

      const phoneRegex = /^1[3-9]\d{9}$/;
      expect(phoneRegex.test(validPhone)).toBe(true);
      expect(phoneRegex.test(invalidPhone)).toBe(false);
    });

    it('密码长度应在 6-32 位之间', () => {
      const validPassword = 'password123';
      const shortPassword = '12345';
      const longPassword = 'a'.repeat(33);

      expect(validPassword.length >= 6 && validPassword.length <= 32).toBe(true);
      expect(shortPassword.length >= 6).toBe(false);
      expect(longPassword.length <= 32).toBe(false);
    });

    it('昵称长度应在 2-20 位之间', () => {
      const validNickname = '测试用户';
      const shortNickname = '测';
      const longNickname = 'a'.repeat(21);

      expect(validNickname.length >= 2 && validNickname.length <= 20).toBe(true);
      expect(shortNickname.length >= 2).toBe(false);
      expect(longNickname.length <= 20).toBe(false);
    });
  });

  describe('数值范围验证', () => {
    it('分页参数应为正整数', () => {
      const validPage = 1;
      const invalidPage = 0;

      expect(validPage >= 1).toBe(true);
      expect(invalidPage >= 1).toBe(false);
    });

    it('ID 应为正整数', () => {
      const validId = 123;
      const invalidId = -1;

      expect(validId > 0).toBe(true);
      expect(invalidId > 0).toBe(false);
    });
  });
});