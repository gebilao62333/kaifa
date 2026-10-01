const { VirtualUser, VirtualChatHistory, VirtualUserTag, VirtualUserTagRelation } = require('../../../src/models');
const virtualUserService = require('../../../src/services/virtualUserService');

jest.mock('../../../src/models');
jest.mock('../../../src/services/llmService');
// 保留真实 Sequelize 实例原型（define 等方法，避免 models 加载失败），仅将 transaction 替换为直通实现
jest.mock('../../../src/config/mysql', () => {
  const actual = jest.requireActual('../../../src/config/mysql');
  const mock = Object.create(Object.getPrototypeOf(actual));
  Object.assign(mock, actual);
  mock.transaction = jest.fn(async (fn) => fn({}));
  return mock;
});
const llmService = require('../../../src/services/llmService');
const config = require('../../../src/config');

describe('Service - Virtual User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVirtualUser = {
    id: 1,
    name: '虚拟助手',
    avatar: 'avatar.png',
    gender: 1,
    age: 25,
    region: '上海',
    tags: null,
    intro: '一位虚拟助手',
    price_per_hour: 0,
    online_status: 1,
    is_recommend: 0,
    status: 1,
    create_time: 1234567890,
    update_time: 1234567890
  };

  describe('createVirtualUser', () => {
    it('should create virtual user successfully', async () => {
      VirtualUser.create.mockResolvedValue({ ...mockVirtualUser });
      VirtualUser.findByPk.mockResolvedValue(mockVirtualUser);
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.createVirtualUser({
        name: '虚拟助手',
        avatar: 'avatar.png',
        gender: 1,
        age: 25,
        region: '上海'
      });

      expect(result.name).toBe('虚拟助手');
      expect(VirtualUser.create).toHaveBeenCalled();
    });

    it('should throw error when name is empty', async () => {
      await expect(
        virtualUserService.createVirtualUser({
          name: '',
          avatar: 'avatar.png'
        })
      ).rejects.toThrow('姓名不能为空');
    });
  });

  describe('getVirtualUserById', () => {
    it('should return virtual user by id', async () => {
      VirtualUser.findByPk.mockResolvedValue(mockVirtualUser);
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.getVirtualUserById(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('虚拟助手');
      expect(VirtualUser.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw error when user not found', async () => {
      VirtualUser.findByPk.mockResolvedValue(null);

      await expect(
        virtualUserService.getVirtualUserById(999)
      ).rejects.toThrow('虚拟用户不存在');
    });
  });

  describe('getAllVirtualUsers', () => {
    it('should return paginated virtual users', async () => {
      VirtualUser.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockVirtualUser]
      });
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.getAllVirtualUsers({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should load tags in batch without N+1 queries', async () => {
      VirtualUser.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { ...mockVirtualUser, id: 1 },
          { ...mockVirtualUser, id: 2, name: '虚拟助手二号' }
        ]
      });
      // 注：Jest 自动 mock 下 Sequelize 模型的同名静态方法（findAll）共享同一 mock，
      // 因此通过调用参数区分两次查询：先查关系（where.virtual_user_id），再查标签（where.id）
      VirtualUserTag.findAll.mockImplementation((opts) => {
        const where = opts && opts.where;
        if (where && where.virtual_user_id) {
          // 模拟 order: [['create_time', 'DESC']]
          return Promise.resolve([
            { virtual_user_id: 1, tag_id: 10, create_time: 100 },
            { virtual_user_id: 1, tag_id: 11, create_time: 200 },
            { virtual_user_id: 2, tag_id: 11, create_time: 300 }
          ].sort((a, b) => b.create_time - a.create_time));
        }
        return Promise.resolve([
          { id: 10, name: '温柔', icon: 'icon-1', sort_order: 0, status: 1 },
          { id: 11, name: '幽默', icon: 'icon-2', sort_order: 1, status: 1 }
        ]);
      });

      const result = await virtualUserService.getAllVirtualUsers({ page: 1, pageSize: 10 });

      // 标签按 create_time 倒序
      expect(result.list[0].tags.map(t => t.name)).toEqual(['幽默', '温柔']);
      expect(result.list[1].tags.map(t => t.name)).toEqual(['幽默']);
      // 标签查询收敛为 2 次（关系 + 标签），不再逐用户循环查询
      expect(VirtualUserTag.findAll).toHaveBeenCalledTimes(2);
      expect(VirtualUserTag.findByPk).not.toHaveBeenCalled();
    });
  });

  describe('updateVirtualUser', () => {
    it('should update virtual user successfully', async () => {
      VirtualUser.findByPk.mockResolvedValue({
        ...mockVirtualUser,
        update: jest.fn().mockResolvedValue({})
      });
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.updateVirtualUser(1, {
        name: '新名字'
      });

      expect(result.name).toBe('虚拟助手');
    });
  });

  describe('deleteVirtualUser', () => {
    it('should delete virtual user successfully', async () => {
      VirtualUser.findByPk.mockResolvedValue({
        ...mockVirtualUser,
        destroy: jest.fn().mockResolvedValue({})
      });
      VirtualChatHistory.destroy.mockResolvedValue(1);
      VirtualUserTagRelation.destroy.mockResolvedValue(1);

      const result = await virtualUserService.deleteVirtualUser(1);

      expect(result).toBe(true);
    });
  });

  describe('toggleOnlineStatus', () => {
    it('should update online status', async () => {
      const mockUser = {
        ...mockVirtualUser,
        update: jest.fn().mockResolvedValue({})
      };
      VirtualUser.findByPk.mockResolvedValue(mockUser);
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.toggleOnlineStatus(1, true);

      expect(result.online_status).toBe(1);
    });
  });

  describe('getChatHistory', () => {
    it('should return chat history filtered by virtual user id and user id', async () => {
      VirtualChatHistory.findAll.mockResolvedValue([
        { id: 1, virtual_user_id: 1, user_id: 100, content: '你好', type: 0, sender: 0, sort_order: 0, create_time: 1234567890 }
      ]);

      const result = await virtualUserService.getChatHistory(1, 100);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('你好');
      expect(result[0].sender).toBe(0);
      expect(VirtualChatHistory.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { virtual_user_id: 1, user_id: 100 } })
      );
    });

    it('should support context id filter', async () => {
      VirtualChatHistory.findAll.mockResolvedValue([]);

      await virtualUserService.getChatHistory(1, 100, 50);

      expect(VirtualChatHistory.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { virtual_user_id: 1, user_id: 100, id: 50 } })
      );
    });
  });

  describe('clearContext', () => {
    it('should clear chat history scoped by virtual user id and user id', async () => {
      VirtualChatHistory.destroy.mockResolvedValue(1);

      const result = await virtualUserService.clearContext(1, 100);

      expect(result).toBe(true);
      expect(VirtualChatHistory.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { virtual_user_id: 1, user_id: 100 } })
      );
    });
  });

  describe('chatWithVirtualUser', () => {
    const mockOnlineUser = {
      ...mockVirtualUser,
      online_status: 1,
      status: 1
    };

    const mockHistory = [
      { id: 1, virtual_user_id: 1, user_id: 100, content: '你好', type: 0, sender: 0, sort_order: 0, create_time: 100 },
      { id: 2, virtual_user_id: 1, user_id: 100, content: '你好呀！', type: 0, sender: 1, sort_order: 0, create_time: 101 },
      { id: 3, virtual_user_id: 1, user_id: 100, content: '最近怎么样？', type: 0, sender: 0, sort_order: 0, create_time: 102 }
    ];

    beforeEach(() => {
      VirtualChatHistory.create.mockImplementation(({ content, sender, type }) => ({
        id: Math.floor(Math.random() * 1000) + 10,
        virtual_user_id: 1,
        user_id: 100,
        content,
        type,
        sender,
        create_time: 1234567890
      }));
    });

    it('should use LLM reply when LLM succeeds', async () => {
      VirtualUser.findByPk.mockResolvedValue(mockOnlineUser);
      VirtualChatHistory.findAll.mockResolvedValue([
        ...mockHistory,
        { id: 4, virtual_user_id: 1, user_id: 100, content: '今天天气真好', type: 0, sender: 0, sort_order: 0, create_time: 103 }
      ]);
      llmService.generateReply.mockResolvedValue('LLM 生成的回复内容');

      const result = await virtualUserService.chatWithVirtualUser(1, 100, '今天天气真好');

      expect(llmService.generateReply).toHaveBeenCalledTimes(1);
      expect(llmService.generateReply).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('虚拟助手'),
          messages: expect.any(Array)
        })
      );
      expect(result.content).toBe('LLM 生成的回复内容');
      expect(result.sender).toBe(1);
    });

    it('should build context messages from history with correct roles', async () => {
      VirtualUser.findByPk.mockResolvedValue(mockOnlineUser);
      VirtualChatHistory.findAll.mockResolvedValue([
        ...mockHistory,
        { id: 4, virtual_user_id: 1, user_id: 100, content: '今天天气真好', type: 0, sender: 0, sort_order: 0, create_time: 103 }
      ]);
      llmService.generateReply.mockResolvedValue('回复');

      await virtualUserService.chatWithVirtualUser(1, 100, '今天天气真好');

      const { messages } = llmService.generateReply.mock.calls[0][0];
      const senders = messages.map(m => m.role);
      expect(senders).toEqual(['user', 'assistant', 'user', 'user']);
      expect(messages.map(m => m.content)).toContain('今天天气真好');
    });

    it('should fall back to rule reply when LLM returns null', async () => {
      VirtualUser.findByPk.mockResolvedValue(mockOnlineUser);
      VirtualChatHistory.findAll.mockResolvedValue([
        ...mockHistory,
        { id: 4, virtual_user_id: 1, user_id: 100, content: '你好', type: 0, sender: 0, sort_order: 0, create_time: 103 }
      ]);
      llmService.generateReply.mockResolvedValue(null);

      const result = await virtualUserService.chatWithVirtualUser(1, 100, '你好');

      expect(llmService.generateReply).toHaveBeenCalledTimes(1);
      expect(result.content).toContain('你好');
      expect(result.content).toContain('虚拟助手');
      expect(result.sender).toBe(1);
    });

    it('should reject when virtual user is offline', async () => {
      VirtualUser.findByPk.mockResolvedValue({ ...mockOnlineUser, online_status: 0 });

      await expect(
        virtualUserService.chatWithVirtualUser(1, 100, '你好')
      ).rejects.toThrow('离线');

      expect(VirtualChatHistory.create).not.toHaveBeenCalled();
    });

    it('should reject when virtual user is disabled', async () => {
      VirtualUser.findByPk.mockResolvedValue({ ...mockOnlineUser, status: 0 });

      await expect(
        virtualUserService.chatWithVirtualUser(1, 100, '你好')
      ).rejects.toThrow('禁用');
    });

    it('should trim oldest chat history beyond the limit', async () => {
      const { Op } = require('sequelize');
      VirtualUser.findByPk.mockResolvedValue(mockOnlineUser);
      VirtualChatHistory.findAll.mockResolvedValue([
        ...mockHistory,
        { id: 4, virtual_user_id: 1, user_id: 100, content: '今天天气真好', type: 0, sender: 0, sort_order: 0, create_time: 103 }
      ]);
      llmService.generateReply.mockResolvedValue('回复');
      VirtualChatHistory.destroy.mockResolvedValue(1);

      const originalLimit = config.virtualUser.chatHistoryLimit;
      config.virtualUser.chatHistoryLimit = 3;
      try {
        await virtualUserService.chatWithVirtualUser(1, 100, '今天天气真好');
      } finally {
        config.virtualUser.chatHistoryLimit = originalLimit;
      }

      // 4 条记录超过 3 条上限，应删除最旧的 1 条（id=1）
      expect(VirtualChatHistory.destroy).toHaveBeenCalledTimes(1);
      const destroyArg = VirtualChatHistory.destroy.mock.calls[0][0];
      expect(destroyArg.where.id[Op.in]).toEqual([1]);
    });

    it('should roll back user message when AI reply write fails', async () => {
      VirtualUser.findByPk.mockResolvedValue(mockOnlineUser);
      VirtualChatHistory.findAll.mockResolvedValue([
        ...mockHistory,
        { id: 4, virtual_user_id: 1, user_id: 100, content: '今天天气真好', type: 0, sender: 0, sort_order: 0, create_time: 103 }
      ]);
      llmService.generateReply.mockResolvedValue('回复');
      VirtualChatHistory.destroy.mockResolvedValue(1);
      // 第一次 create：用户消息写入成功；第二次 create：AI 回复写入失败
      VirtualChatHistory.create
        .mockResolvedValueOnce({ id: 99, virtual_user_id: 1, user_id: 100, content: '今天天气真好', type: 0, sender: 0, create_time: 1234567890 })
        .mockRejectedValueOnce(new Error('数据库写入失败'));

      await expect(
        virtualUserService.chatWithVirtualUser(1, 100, '今天天气真好')
      ).rejects.toThrow('数据库写入失败');

      // 补偿：删除孤立的用户消息（id=99），避免留下"有问无答"的半截记录
      expect(VirtualChatHistory.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 99 } })
      );
    });
  });
});
