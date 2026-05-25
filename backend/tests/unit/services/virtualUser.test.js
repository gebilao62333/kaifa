const { VirtualUser, VirtualChatHistory, VirtualUserTag, VirtualUserTagRelation } = require('../../../src/models');
const virtualUserService = require('../../../src/services/virtualUserService');

jest.mock('../../../src/models');

describe('Service - Virtual User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVirtualUser = {
    id: 1,
    username: 'virtual-assistant',
    nickname: '虚拟助手',
    avatar: 'avatar.png',
    role: 'default',
    personality: '友好、热情',
    dialogueStyle: 'friendly',
    description: '一位智能助手',
    modelConfig: '{"type": "openai", "model": "gpt-3.5-turbo"}',
    status: 1,
    isOnline: 1,
    contextExpireTime: 3600,
    maxContextLength: 50,
    permissions: '["chat"]',
    createTime: 1234567890,
    updateTime: 1234567890
  };

  describe('createVirtualUser', () => {
    it('should create virtual user successfully', async () => {
      VirtualUser.findOne.mockResolvedValue(null);
      VirtualUser.create.mockResolvedValue(mockVirtualUser);
      VirtualUser.findByPk.mockResolvedValue(mockVirtualUser);
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.createVirtualUser({
        username: 'virtual-assistant',
        nickname: '虚拟助手',
        role: 'default',
        dialogueStyle: 'friendly'
      });

      expect(result.username).toBe('virtual-assistant');
      expect(result.nickname).toBe('虚拟助手');
      expect(VirtualUser.create).toHaveBeenCalled();
    });

    it('should throw error when username already exists', async () => {
      VirtualUser.findOne.mockResolvedValue(mockVirtualUser);

      await expect(
        virtualUserService.createVirtualUser({
          username: 'virtual-assistant',
          nickname: '虚拟助手'
        })
      ).rejects.toThrow('用户名已存在');
    });

    it('should throw error when username is empty', async () => {
      await expect(
        virtualUserService.createVirtualUser({
          username: '',
          nickname: '虚拟助手'
        })
      ).rejects.toThrow('用户名和昵称不能为空');
    });
  });

  describe('getVirtualUserById', () => {
    it('should return virtual user by id', async () => {
      VirtualUser.findByPk.mockResolvedValue(mockVirtualUser);
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.getVirtualUserById(1);

      expect(result.id).toBe(1);
      expect(result.username).toBe('virtual-assistant');
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
      const mockUsers = [mockVirtualUser];
      VirtualUser.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockUsers
      });
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.getAllVirtualUsers({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('updateVirtualUser', () => {
    it('should update virtual user successfully', async () => {
      VirtualUser.findByPk.mockResolvedValue({
        ...mockVirtualUser,
        update: jest.fn().mockResolvedValue({})
      });
      VirtualUser.findOne.mockResolvedValue(null);
      VirtualUserTagRelation.findAll.mockResolvedValue([]);

      const result = await virtualUserService.updateVirtualUser(1, {
        nickname: '新昵称'
      });

      expect(result.username).toBe('virtual-assistant');
    });
  });

  describe('deleteVirtualUser', () => {
    it('should delete virtual user successfully', async () => {
      VirtualUser.findByPk.mockResolvedValue({
        ...mockVirtualUser,
        destroy: jest.fn().mockResolvedValue({})
      });
      VirtualChatHistory.destroy.mockResolvedValue(1);

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

      expect(result.isOnline).toBe(1);
    });
  });
});