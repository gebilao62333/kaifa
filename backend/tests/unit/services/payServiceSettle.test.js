// 审计 H-2：支付入账的幂等与归属回归
//
// 原实现的两处缺陷：
//   1) wxPayCallback / handleNotify 都是「findOne 读 status → update status=1 → 加币」，
//      微信对同一笔订单会并发重发通知，两笔都能在对方提交前读到 status=0，于是同一单加两次币；
//   2) 入账与查状态都只按 order_no 定位，不看订单属于谁，/wx-callback 甚至不要求登录，
//      任何人拿到（或猜到）订单号就能替别人确认支付、读别人的支付状态。
jest.mock('../../../src/models', () => ({
  OrderChong: { findOne: jest.fn(), update: jest.fn(), create: jest.fn() },
  RechargePackage: { findAll: jest.fn(), findByPk: jest.fn() },
  Card: { findOne: jest.fn(), update: jest.fn() },
  User: {
    findByPk: jest.fn(),
    increment: jest.fn(),
    sequelize: { transaction: jest.fn() }
  }
}));

const { OrderChong, User } = require('../../../src/models');
const payService = require('../../../src/services/payService');

const { PAY_ERRORS, settleRechargeOrder, wxPayCallback, requireOwnedOrder, getOrderStatus } = payService;

const makeOrder = (over = {}) => Object.assign({
  id: 9,
  order_no: 'DKTEST0001',
  user_id: 1001,
  amount: '10.50', // DECIMAL 读回来是字符串
  coins: 1050,
  status: 0,
  pay_time: null
}, over);

const bizCode = (fn, args) => fn(...args).catch((e) => e.code);

describe('Service - payService 支付入账幂等与归属（H-2）', () => {
  let tx;

  beforeEach(() => {
    tx = { commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) };
    User.sequelize.transaction.mockReset();
    User.sequelize.transaction.mockImplementation(async (cb) => cb(tx));
    OrderChong.findOne.mockReset();
    OrderChong.update.mockReset();
    OrderChong.update.mockResolvedValue([1]); // 默认：原子占用成功
    User.increment.mockReset();
    User.increment.mockResolvedValue([1]);
  });

  it('未通过服务端校验的回执一律拒绝，且不开事务', async () => {
    const order = makeOrder();
    await expect(settleRechargeOrder(order, {})).rejects.toMatchObject({
      code: PAY_ERRORS.UNVERIFIED
    });
    await expect(settleRechargeOrder(order, { verified: false, paidCents: 1050 })).rejects.toMatchObject({
      code: PAY_ERRORS.UNVERIFIED
    });
    expect(User.sequelize.transaction).not.toHaveBeenCalled();
    expect(OrderChong.update).not.toHaveBeenCalled();
    expect(User.increment).not.toHaveBeenCalled();
  });

  it('以 status=0 为条件原子占用订单后才加币，金币只取订单记录的 coins', async () => {
    const order = makeOrder();
    const result = await settleRechargeOrder(order, { verified: true, source: 'wechat-notify', paidCents: 1050 });

    expect(result).toEqual({ orderNo: 'DKTEST0001', coins: 1050, duplicated: false });
    expect(OrderChong.update).toHaveBeenCalledWith(
      { status: 1, pay_time: expect.any(Number), update_time: expect.any(Number) },
      { where: { id: 9, status: 0 }, transaction: tx }
    );
    expect(User.increment).toHaveBeenCalledWith(
      'money',
      expect.objectContaining({ by: 1050, where: { id: 1001 } })
    );
  });

  it('实付分值与订单应付分值不一致时拒绝入账，不开事务', async () => {
    const order = makeOrder(); // amount 10.50 → 应付 1050 分
    await expect(settleRechargeOrder(order, { verified: true, paidCents: 1 })).rejects.toMatchObject({
      code: PAY_ERRORS.AMOUNT_MISMATCH
    });
    expect(User.sequelize.transaction).not.toHaveBeenCalled();
    expect(User.increment).not.toHaveBeenCalled();
  });

  it('本地联调路径不传 paidCents 时跳过金额比对（仍走原子占用）', async () => {
    const order = makeOrder();
    const result = await settleRechargeOrder(order, { verified: true, source: 'local-unverified' });
    expect(result.coins).toBe(1050);
    expect(OrderChong.update).toHaveBeenCalled();
  });

  // 并发防刷核心回归：两笔通知都读到 status=0，但只有抢到原子 UPDATE 的那笔能加币
  it('并发通知只入账一次，抢输的一方按幂等错误退出', async () => {
    OrderChong.update
      .mockResolvedValueOnce([1])
      .mockResolvedValueOnce([0]);

    const order = makeOrder();
    const verification = { verified: true, source: 'wechat-notify', paidCents: 1050 };
    const [first, second] = await Promise.allSettled([
      settleRechargeOrder(order, verification),
      settleRechargeOrder(order, verification)
    ]);

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect(second.reason.code).toBe(PAY_ERRORS.SETTLED);
    expect(User.increment).toHaveBeenCalledTimes(1);
  });

  // 审计 H-2 归属：/order-status 只按 (order_no, user_id) 查，查不到就报「订单不存在」，
  // 不给「存在但不属于你」这种可枚举的差异化信息。
  it('getOrderStatus 用他人订单号查不到，且不区分“不存在”和“不属于你”', async () => {
    OrderChong.findOne.mockResolvedValue(makeOrder());
    const err = await bizCode(getOrderStatus, [2002, 'DKTEST0001']);
    expect(err).toBe(PAY_ERRORS.NOT_FOUND);
    expect(OrderChong.findOne).toHaveBeenLastCalledWith({
      where: { order_no: 'DKTEST0001', user_id: 2002 }
    });
  });

  it('事务内加币失败时把错误原样抛出（不吞掉、不返回成功）', async () => {
    User.increment.mockRejectedValue(new Error('db down'));
    await expect(
      settleRechargeOrder(makeOrder(), { verified: true, paidCents: 1050 })
    ).rejects.toThrow('db down');
  });

  it('wxPayCallback 拒绝非下单用户触发的入账', async () => {
    OrderChong.findOne.mockResolvedValue(makeOrder());
    const err = await bizCode(wxPayCallback, [2002, 'DKTEST0001', { verified: true, paidCents: 1050 }]);
    expect(err).toBe(PAY_ERRORS.FORBIDDEN);
    expect(OrderChong.update).not.toHaveBeenCalled();
    expect(User.increment).not.toHaveBeenCalled();
  });

  it('wxPayCallback 订单不存在回 NOT_FOUND，已入账的回 SETTLED（幂等成功而非 404）', async () => {
    OrderChong.findOne.mockResolvedValue(null);
    expect(await bizCode(wxPayCallback, [1001, 'NOPE', { verified: true, paidCents: 1 }]))
      .toBe(PAY_ERRORS.NOT_FOUND);

    OrderChong.findOne.mockResolvedValue(makeOrder({ status: 1, pay_time: 1700000000 }));
    OrderChong.update.mockResolvedValue([0]); // 已被上一次通知入账
    expect(await bizCode(wxPayCallback, [1001, 'DKTEST0001', { verified: true, paidCents: 1050 }]))
      .toBe(PAY_ERRORS.SETTLED);
  });

  it('wxPayCallback 本人订单 + 校验通过后正常入账', async () => {
    OrderChong.findOne.mockResolvedValue(makeOrder());
    const result = await wxPayCallback(1001, 'DKTEST0001', {
      verified: true,
      source: 'wechat-query',
      paidCents: 1050
    });
    expect(result.duplicated).toBe(false);
    expect(User.increment).toHaveBeenCalledTimes(1);
  });

  it('requireOwnedOrder 只放行订单归属人', async () => {
    OrderChong.findOne.mockResolvedValue(makeOrder());
    await expect(requireOwnedOrder(1001, 'DKTEST0001')).resolves.toMatchObject({ id: 9 });

    const denied = await bizCode(requireOwnedOrder, [2002, 'DKTEST0001']);
    expect(denied).toBe(PAY_ERRORS.FORBIDDEN);

    OrderChong.findOne.mockResolvedValue(null);
    expect(await bizCode(requireOwnedOrder, [1001, 'NOPE'])).toBe(PAY_ERRORS.NOT_FOUND);
  });

  it('getOrderStatus 查询条件带上 user_id，他人订单查不到', async () => {
    OrderChong.findOne.mockResolvedValue(makeOrder({ status: 1, pay_time: 1700000000 }));
    const r = await getOrderStatus(1001, 'DKTEST0001');
    expect(OrderChong.findOne).toHaveBeenCalledWith({
      where: { order_no: 'DKTEST0001', user_id: 1001 }
    });
    expect(r).toEqual({ orderNo: 'DKTEST0001', status: 1, payTime: 1700000000 });

    OrderChong.findOne.mockResolvedValue(null); // 按 (order_no, user_id) 查不到即视为不存在
    expect(await bizCode(getOrderStatus, [2002, 'DKTEST0001'])).toBe(PAY_ERRORS.NOT_FOUND);
  });
});
