jest.mock('../../../src/models', () => {
  const model = () => ({
    findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), findAndCountAll: jest.fn(),
    create: jest.fn(), update: jest.fn(), decrement: jest.fn()
  });
  const VipPackage = model();
  const VipOrder = model();
  const User = model();
  User.sequelize = { transaction: jest.fn() };
  return { VipPackage, VipOrder, User };
});

const vipService = require('../../../src/services/vipService');
const { VipPackage, VipOrder, User } = require('../../../src/models');
const { Op } = require('sequelize');

const txn = () => ({
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true),
  finished: false
});

const packageRow = { id: 2, status: 1, name: 'VIP季卡', price: '48.00', duration: 90, level: 1, hot: 0, sort: 2, original_price: '90.00' };
const orderRow = (overrides = {}) => ({
  id: 11,
  order_no: 'V20261004001',
  user_id: 7,
  price: 100,
  duration: 30,
  level: 2,
  status: 0,
  update: jest.fn().mockResolvedValue(true),
  ...overrides
});

describe('Service - vipService', () => {
  let transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    transaction = txn();
    User.sequelize.transaction.mockResolvedValue(transaction);
  });

  describe('getVipPackages', () => {
    it('下发按天计价的单档位，避免前端自造时长价格', async () => {
      VipPackage.findAll.mockResolvedValue([packageRow]);
      const [pkg] = await vipService.getVipPackages();
      expect(pkg.price).toBe(48);
      expect(pkg.duration).toBe(90);
      expect(pkg.durations).toEqual([{ label: '90天', months: 1, price: 48, original: 90 }]);
    });
  });

  describe('createVipOrder', () => {
    it('价格与时长一律取服务端套餐，不接受前端传入值', async () => {
      VipPackage.findByPk.mockResolvedValue(packageRow);
      VipOrder.create.mockResolvedValue({ id: 11, order_no: 'V1', name: 'VIP季卡' });

      const result = await vipService.createVipOrder(7, 2);

      const created = VipOrder.create.mock.calls[0][0];
      expect(created.price).toBe(48);
      expect(created.duration).toBe(90);
      expect(created.level).toBe(1);
      expect(result.amount).toBe(48);
    });

    it('下架套餐不可下单', async () => {
      VipPackage.findByPk.mockResolvedValue({ ...packageRow, status: 0 });
      await expect(vipService.createVipOrder(7, 2)).rejects.toThrow('VIP套餐不存在');
      expect(VipOrder.create).not.toHaveBeenCalled();
    });
  });

  describe('completeVipOrder', () => {
    it('同一事务内条件扣币后续期会员', async () => {
      const order = orderRow();
      VipOrder.findOne.mockResolvedValue(order);
      User.decrement.mockResolvedValue([[null, 1]]);
      User.findByPk.mockResolvedValue({ vip_expire_time: 0, vip_lv: 1 });

      const result = await vipService.completeVipOrder(order.order_no, 't1', 7);

      expect(VipOrder.findOne.mock.calls[0][0].where).toMatchObject({ order_no: order.order_no, status: 0, user_id: 7 });
      const decrementArgs = User.decrement.mock.calls[0][1];
      expect(decrementArgs.by).toBe(100);
      expect(decrementArgs.where.money[Op.gte]).toBe(100);
      expect(decrementArgs.transaction).toBe(transaction);
      expect(order.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 1, pay_no: 't1' }),
        { transaction }
      );
      const renewed = User.update.mock.calls[0][0];
      expect(renewed.vip).toBe(1);
      expect(renewed.vip_lv).toBe(2);
      expect(result.amount).toBe(100);
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('余额不足时回滚且不置订单为已支付', async () => {
      const order = orderRow();
      VipOrder.findOne.mockResolvedValue(order);
      User.decrement.mockResolvedValue([[null, 0]]);

      await expect(vipService.completeVipOrder(order.order_no, null, 7)).rejects.toThrow('余额不足');
      expect(transaction.rollback).toHaveBeenCalled();
      expect(order.update).not.toHaveBeenCalled();
      expect(User.update).not.toHaveBeenCalled();
      expect(transaction.commit).not.toHaveBeenCalled();
    });

    it('免费套餐不扣币', async () => {
      const order = orderRow({ price: 0 });
      VipOrder.findOne.mockResolvedValue(order);
      User.findByPk.mockResolvedValue({ vip_expire_time: 0, vip_lv: 0 });

      await vipService.completeVipOrder(order.order_no, null, 7);
      expect(User.decrement).not.toHaveBeenCalled();
      expect(order.update).toHaveBeenCalled();
    });

    it('只允许订单归属人完成，他人订单查不到', async () => {
      VipOrder.findOne.mockResolvedValue(null);
      await expect(vipService.completeVipOrder('V-other', null, 99)).rejects.toThrow('订单不存在或已处理');
      expect(VipOrder.findOne.mock.calls[0][0].where).toMatchObject({ user_id: 99 });
      expect(User.sequelize.transaction).not.toHaveBeenCalled();
    });

    it('未过期会员按剩余时长叠加续期', async () => {
      const order = orderRow({ duration: 30 });
      const base = Math.floor(Date.now() / 1000) + 10 * 24 * 3600;
      VipOrder.findOne.mockResolvedValue(order);
      User.decrement.mockResolvedValue([[null, 1]]);
      User.findByPk.mockResolvedValue({ vip_expire_time: base, vip_lv: 2 });

      const result = await vipService.completeVipOrder(order.order_no, null, 7);
      expect(result.expireTime).toBe(base + 30 * 86400);
    });
  });
});
