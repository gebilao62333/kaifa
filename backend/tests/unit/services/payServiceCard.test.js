jest.mock('../../../src/models', () => ({
  Card: { findOne: jest.fn(), update: jest.fn() },
  User: {
    sequelize: { transaction: jest.fn() },
    increment: jest.fn(),
    findByPk: jest.fn()
  },
  OrderChong: { findOne: jest.fn(), findAndCountAll: jest.fn() },
  RechargePackage: { findAll: jest.fn(), findByPk: jest.fn() }
}));

// B-10：卡密密码加密后，读取侧要用 decryptField；这里默认透传，单测按需覆盖
jest.mock('../../../src/utils/pii', () => ({
  decryptField: jest.fn((v) => v),
  encryptField: jest.fn((v) => v),
  looksEncrypted: jest.fn(() => false),
  isConfigured: jest.fn(() => false)
}));

const { Card, User } = require('../../../src/models');
const pii = require('../../../src/utils/pii');
const payService = require('../../../src/services/payService');

const makeCard = (over = {}) => Object.assign({
  id: 1,
  card_no: 'DK1',
  card_password: 'PW1',
  card_key: '1234567890123456789012345',
  value: '6.00',
  coin_amount: 60,
  status: 0
}, over);

describe('Service - payService 卡密充值（25 位密钥链路回归）', () => {
  let tx;

  beforeEach(() => {
    tx = { commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) };
    // 受管事务：sequelize.transaction(async (t) => { ... })
    User.sequelize.transaction.mockReset();
    User.sequelize.transaction.mockImplementation(async (cb) => cb(tx));
    User.increment.mockReset();
    User.increment.mockResolvedValue([1]);
    Card.findOne.mockReset();
    Card.update.mockReset();
    Card.update.mockResolvedValue([1]); // 默认：原子占用成功（影响 1 行）
  });

  it('validateCard 校验卡号+密码后返回金币数而非面值', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    const r = await payService.validateCard('DK1', 'PW1');
    expect(r).toEqual({ cardId: 1, faceValue: 6, coinAmount: 60 });
  });

  it('validateCard 未设置金币数时回落到面值', async () => {
    Card.findOne.mockResolvedValue(makeCard({ value: '10.00', coin_amount: 0 }));
    const r = await payService.validateCard('DK1', 'PW1');
    expect(r.coinAmount).toBe(10);
  });

  // 审计 C-3：原先只比卡号、密码从不校验，拿到卡号即可入账。
  it('validateCard 缺少密码时直接拒绝且不查库', async () => {
    await expect(payService.validateCard('DK1')).rejects.toThrow('请输入卡号和密码');
    await expect(payService.validateCard('DK1', '   ')).rejects.toThrow('请输入卡号和密码');
    expect(Card.findOne).not.toHaveBeenCalled();
  });

  it('validateCard 密码错误与卡号不存在回同一文案（不泄露存在性）', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    await expect(payService.validateCard('DK1', 'WRONG')).rejects.toThrow('卡号或密码错误');
    Card.findOne.mockResolvedValue(null);
    await expect(payService.validateCard('NOPE', 'PW1')).rejects.toThrow('卡号或密码错误');
  });

  // B-10：库里存的是密文时，必须先解密再比对；密文解不出（密钥缺失）按密码错误拒绝
  it('validateCard 对加密存储的密码先解密再校验', async () => {
    Card.findOne.mockResolvedValue(makeCard({ card_password: 'CIPHER_TEXT' }));
    pii.decryptField.mockReturnValueOnce('PW1');
    const r = await payService.validateCard('DK1', 'PW1');
    expect(pii.decryptField).toHaveBeenCalledWith('CIPHER_TEXT');
    expect(r.cardId).toBe(1);

    pii.decryptField.mockReturnValueOnce('');
    await expect(payService.validateCard('DK1', 'PW1')).rejects.toThrow('卡号或密码错误');
  });

  it('validateCard 拒绝已使用或已禁用的卡', async () => {
    Card.findOne.mockResolvedValue(makeCard({ status: 1 }));
    await expect(payService.validateCard('DK1', 'PW1')).rejects.toThrow('该卡密已被使用或已禁用');
  });

  it('useCard 按金币数入账（不是面值）', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    const r = await payService.useCard(1, 'DK1', 'PW1');
    expect(r).toEqual({ amount: 60 });
    expect(User.increment).toHaveBeenCalledWith('money', expect.objectContaining({ by: 60 }));
  });

  it('useCard 以 status=0 为条件原子占用卡密', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    await payService.useCard(1, 'DK1', 'PW1');
    expect(Card.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 1, use_user_id: 1 }),
      expect.objectContaining({ where: { id: 1, status: 0 } })
    );
  });

  it('useCard 密码错误时不占用卡密也不入账', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    await expect(payService.useCard(1, 'DK1', 'WRONG')).rejects.toThrow('卡号或密码错误');
    expect(Card.update).not.toHaveBeenCalled();
    expect(User.increment).not.toHaveBeenCalled();
  });

  it('useCard 缺少密码时直接拒绝且不查库', async () => {
    await expect(payService.useCard(1, 'DK1')).rejects.toThrow('请输入卡号和密码');
    expect(Card.findOne).not.toHaveBeenCalled();
  });

  it('redeemCardByKey 按 card_key 查找并按金币数入账', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    const r = await payService.redeemCardByKey(1, '1234567890123456789012345');
    expect(Card.findOne).toHaveBeenCalledWith({ where: { card_key: '1234567890123456789012345' } });
    expect(r).toEqual({ amount: 60 });
    expect(User.increment).toHaveBeenCalledWith('money', expect.objectContaining({ by: 60 }));
  });

  it('redeemCardByKey 拒绝不存在的密钥', async () => {
    Card.findOne.mockResolvedValue(null);
    await expect(payService.redeemCardByKey(1, 'nope')).rejects.toThrow('密钥无效');
  });

  it('redeemCardByKey 拒绝已被使用的密钥', async () => {
    Card.findOne.mockResolvedValue(makeCard({ status: 1 }));
    await expect(payService.redeemCardByKey(1, '1234567890123456789012345')).rejects.toThrow('该密钥已被使用');
  });

  // 并发防刷回归：两个并发请求都读到 status=0（findOne 都返回可用卡），
  // 但只有真正把 status 从 0 改成 1 的那个请求能入账，另一个 affected=0 必须失败。
  it('redeemCardByKey 并发下只有一个请求入账（防重复刷币）', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    Card.update
      .mockResolvedValueOnce([1]) // 第一个请求抢到卡
      .mockResolvedValueOnce([0]); // 第二个请求抢占失败

    const [first, second] = await Promise.allSettled([
      payService.redeemCardByKey(1, '1234567890123456789012345'),
      payService.redeemCardByKey(1, '1234567890123456789012345')
    ]);

    const fulfilled = [first, second].filter((r) => r.status === 'fulfilled');
    const rejected = [first, second].filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.message).toMatch(/已被使用/);
    // 关键：只入账一次
    expect(User.increment).toHaveBeenCalledTimes(1);
  });

  it('useCard 抢占失败时拒绝且不入账', async () => {
    Card.findOne.mockResolvedValue(makeCard());
    Card.update.mockResolvedValue([0]);
    await expect(payService.useCard(1, 'DK1', 'PW1')).rejects.toThrow('该卡密已被使用或已禁用');
    expect(User.increment).not.toHaveBeenCalled();
  });
});
