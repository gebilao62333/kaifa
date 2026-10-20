jest.mock('../../../src/models', () => ({
  User: { findByPk: jest.fn(), findAll: jest.fn() },
  UserBlock: {
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn()
  }
}));

const { User, UserBlock } = require('../../../src/models');
const blockService = require('../../../src/services/blockService');

describe('blockService（U-22 黑名单）', () => {
  beforeEach(() => jest.clearAllMocks());

  it('拉黑：写 upsert，禁止拉黑自己/不存在的用户', async () => {
    User.findByPk.mockResolvedValue({ id: 2 });
    await blockService.block(1, 2);
    expect(UserBlock.updateOne).toHaveBeenCalledWith(
      { userId: 1, blockedUserId: 2 },
      expect.objectContaining({ $setOnInsert: expect.objectContaining({ createTime: expect.any(Number) }) }),
      { upsert: true }
    );
    await expect(blockService.block(1, 1)).rejects.toThrow('不能拉黑自己');
    User.findByPk.mockResolvedValue(null);
    await expect(blockService.block(1, 2)).rejects.toThrow('用户不存在');
  });

  it('双向判定：任一方向存在即视为拉黑', async () => {
    UserBlock.findOne.mockReturnValue({ lean: async () => ({ _id: 'x' }) });
    await expect(blockService.isBlockedEither(1, 2)).resolves.toBe(true);
    expect(UserBlock.findOne.mock.calls[0][0].$or).toEqual([
      { userId: 1, blockedUserId: 2 },
      { userId: 2, blockedUserId: 1 }
    ]);
  });

});
