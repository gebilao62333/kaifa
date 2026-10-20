jest.mock('../../../src/models', () => ({
  Notification: {
    create: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn()
  }
}));

const { Notification } = require('../../../src/models');
const service = require('../../../src/services/notificationCenterService');

describe('notificationCenterService（U-12 互动通知）', () => {
  beforeEach(() => jest.clearAllMocks());

  it('创建通知映射类型并写 Mongo', async () => {
    Notification.create.mockResolvedValue({ _id: 'n1' });
    await service.create(2, 'like', '收到赞', '有人赞了你', { postId: 1 });
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 2, type: 1, title: '收到赞', read: false
    }));
    await service.create(0, 'like', '', '');
    expect(Notification.create).toHaveBeenCalledTimes(1);
  });

  it('列表返回 typeName 与分页信息', async () => {
    Notification.countDocuments.mockResolvedValue(1);
    Notification.find.mockReturnValue({
      sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [{
        _id: 'n1', userId: 2, type: 2, title: '收到评论', content: 'c', read: false, createTime: 123
      }] }) }) })
    });
    const result = await service.list(2, 1, 20);
    expect(result.total).toBe(1);
    expect(result.list[0].typeName).toBe('comment');
    expect(result.list[0].isRead).toBe(false);
  });

  it('未读统计异常返回 0；标记已读/全部已读调用 update', async () => {
    Notification.countDocuments.mockRejectedValue(new Error('mongo down'));
    await expect(service.unreadCount(2)).resolves.toBe(0);
    await service.markRead(2, 'n1');
    expect(Notification.updateOne).toHaveBeenCalledWith({ _id: 'n1', userId: 2 }, { $set: { read: true } });
    await service.markAllRead(2);
    expect(Notification.updateMany).toHaveBeenCalled();
  });
});
