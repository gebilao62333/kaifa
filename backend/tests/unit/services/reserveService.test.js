jest.mock('../../../src/models', () => {
  const model = () => ({
    findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), findOrCreate: jest.fn(),
    findAndCountAll: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn(), increment: jest.fn()
  });
  return { Reserve: model(), ReserveSlot: model(), User: model(), Game: model() };
});
jest.mock('../../../src/config/mysql', () => ({ transaction: jest.fn(), literal: jest.fn((s) => s) }));
jest.mock('../../../src/services/settingsService', () => ({ getCommissionRate: jest.fn() }));

const reserveService = require('../../../src/services/reserveService');
const { Reserve, ReserveSlot, User, Game } = require('../../../src/models');
const { Op } = require('sequelize');
const sequelize = require('../../../src/config/mysql');
const { getCommissionRate } = require('../../../src/services/settingsService');

const txn = () => ({ commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) });
const pad = (n) => String(n).padStart(2, '0');
const futureDate = (hours) => {
  const d = new Date(Date.now() + hours * 3600 * 1000);
  return { reserve_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, reserve_time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

describe('Service - ReserveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(txn());
    getCommissionRate.mockResolvedValue(1);
  });

  it('getAvailableSlots maps open slots', async () => {
    ReserveSlot.findAll.mockResolvedValue([{ id: 1, reserve_time: '10:00', status: 0 }]);
    const list = await reserveService.getAvailableSlots(2, '2026-01-01', 1);
    expect(list[0]).toEqual({ slotId: 1, time: '10:00', status: 0 });
    // 用户侧默认只查可约（status=0）
    expect(ReserveSlot.findAll.mock.calls[0][0].where.status).toBe(0);
  });

  it('getAvailableSlots includes disabled slots when includeDisabled=true', async () => {
    ReserveSlot.findAll.mockResolvedValue([
      { id: 1, reserve_time: '10:00', status: 0 },
      { id: 2, reserve_time: '11:00', status: 2 }
    ]);
    const list = await reserveService.getAvailableSlots(2, '2026-01-01', 1, true);
    expect(list.map(item => item.status)).toEqual([0, 2]);
    // 管理侧查询条件不再是 status:0，而是 {[Op.in]:[0,2]}
    expect(ReserveSlot.findAll.mock.calls[0][0].where.status).not.toBe(0);
  });

  it('batchCreateSlots creates each slot', async () => {
    ReserveSlot.findOrCreate.mockResolvedValue([{}, true]);
    await expect(reserveService.batchCreateSlots(2, 1, [{ date: '2026-01-01', time: '10:00' }])).resolves.toBe(true);
    expect(ReserveSlot.findOrCreate).toHaveBeenCalled();
  });

  it('toggleSlot flips the status', async () => {
    ReserveSlot.findOne.mockResolvedValue(null);
    await expect(reserveService.toggleSlot(2, 1)).rejects.toThrow('时间槽不存在');

    ReserveSlot.findOne.mockResolvedValue({ id: 1, status: 0 });
    ReserveSlot.update.mockResolvedValue([1]);
    expect(await reserveService.toggleSlot(2, 1)).toEqual({ status: 2 });
    expect(ReserveSlot.update.mock.calls[0][1].where.status).toBe(0);

    ReserveSlot.findOne.mockResolvedValue({ id: 1, status: 2 });
    expect(await reserveService.toggleSlot(2, 1)).toEqual({ status: 0 });
    expect(ReserveSlot.update.mock.calls[1][1].where.status).toBe(2);
  });

  // 审计 H-7：已成交时段不可再切换，否则等于释放一个已占用时段 → 同一时段被重复预约
  it('toggleSlot refuses a booked slot', async () => {
    ReserveSlot.findOne.mockResolvedValue({ id: 1, status: 1 });
    await expect(reserveService.toggleSlot(2, 1)).rejects.toThrow('该时间段已被预约，不可修改');
    expect(ReserveSlot.update).not.toHaveBeenCalled();
  });

  it('toggleSlot refuses when the slot changed under it', async () => {
    ReserveSlot.findOne.mockResolvedValue({ id: 1, status: 0 });
    ReserveSlot.update.mockResolvedValue([0]);
    await expect(reserveService.toggleSlot(2, 1)).rejects.toThrow('时间槽状态已变更');
  });

  describe('createReserve', () => {
    it('rejects unavailable slots and invalid prices', async () => {
      ReserveSlot.findOne.mockResolvedValue(null);
      await expect(reserveService.createReserve(2, 3, 1, 'd', 't')).rejects.toThrow('该时间段不可预约');

      ReserveSlot.findOne.mockResolvedValue({ id: 1 });
      await expect(reserveService.createReserve(2, 3, 1, 'd', 't', { price: -1 })).rejects.toThrow('预约金额不正确');
    });

    it('rejects a slot claimed concurrently', async () => {
      ReserveSlot.findOne.mockResolvedValue({ id: 1 });
      ReserveSlot.update.mockResolvedValue([0]);
      await expect(reserveService.createReserve(2, 3, 1, 'd', 't')).rejects.toThrow('该时间段不可预约');
    });

    it('rejects an already booked slot', async () => {
      ReserveSlot.findOne.mockResolvedValue({ id: 1 });
      ReserveSlot.update.mockResolvedValue([1]);
      Reserve.findOne.mockResolvedValue({ id: 9 });
      await expect(reserveService.createReserve(2, 3, 1, 'd', 't')).rejects.toThrow('该时间段已被预约');
    });

    it('rejects insufficient balance for paid reservations', async () => {
      ReserveSlot.findOne.mockResolvedValue({ id: 1 });
      ReserveSlot.update.mockResolvedValue([1]);
      Reserve.findOne.mockResolvedValue(null);
      User.update.mockResolvedValue([0]);
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(reserveService.createReserve(2, 3, 1, 'd', 't', { price: 100 })).rejects.toThrow('余额不足');
      expect(tx.rollback).toHaveBeenCalled();
    });

    it('creates a free reservation', async () => {
      ReserveSlot.findOne.mockResolvedValue({ id: 1 });
      ReserveSlot.update.mockResolvedValue([1]);
      Reserve.findOne.mockResolvedValue(null);
      Reserve.create.mockResolvedValue({ id: 5 });
      const result = await reserveService.createReserve(2, 3, 1, 'd', 't', { duration: '2', remark: 'r', serviceType: 'offline' });
      expect(result).toEqual({ reserveId: 5, price: 0 });
      expect(User.update).not.toHaveBeenCalled();
    });

    it('creates a paid reservation and charges the user', async () => {
      ReserveSlot.findOne.mockResolvedValue({ id: 1 });
      ReserveSlot.update.mockResolvedValue([1]);
      Reserve.findOne.mockResolvedValue(null);
      User.update.mockResolvedValue([1]);
      Reserve.create.mockResolvedValue({ id: 6 });
      const result = await reserveService.createReserve(2, 3, 1, 'd', 't', { price: '50' });
      expect(result).toEqual({ reserveId: 6, price: 50 });
      expect(User.update).toHaveBeenCalled();
    });
  });

  describe('confirmReserve / rejectReserve', () => {
    it('validates ownership and status', async () => {
      Reserve.findByPk.mockResolvedValue(null);
      await expect(reserveService.confirmReserve(2, 1)).rejects.toThrow('预约不存在');

      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 3, status: 0 });
      await expect(reserveService.confirmReserve(2, 1)).rejects.toThrow('无权操作此预约');

      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 1 });
      await expect(reserveService.confirmReserve(2, 1)).rejects.toThrow('预约状态不正确');
    });

    it('confirms a reservation', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 0 });
      Reserve.update.mockResolvedValue([1]);
      await expect(reserveService.confirmReserve(2, 1)).resolves.toBe(true);
      expect(Reserve.update.mock.calls[0][0].status).toBe(1);
      expect(Reserve.update.mock.calls[0][1].where).toEqual({ id: 1, target_user_id: 2, status: 0 });
    });

    // 审计 H-7：并发确认只有一个条件更新能命中，落败方不得改写状态
    it('refuses to confirm when the status moved concurrently', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 0 });
      Reserve.update.mockResolvedValue([0]);
      await expect(reserveService.confirmReserve(2, 1)).rejects.toThrow('预约状态不正确');
    });

    it('rejects a reservation and frees the slot', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 0, reserve_date: 'd', reserve_time: 't' });
      Reserve.update.mockResolvedValue([1]);
      ReserveSlot.update.mockResolvedValue([1]);
      await expect(reserveService.rejectReserve(2, 1)).resolves.toBe(true);
      expect(ReserveSlot.update).toHaveBeenCalled();
      // 只释放仍处于占用状态的槽位
      expect(ReserveSlot.update.mock.calls[0][1].where.status).toBe(1);
    });

    it('rolls back the slot release when the reject claim is lost', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 0, reserve_date: 'd', reserve_time: 't' });
      Reserve.update.mockResolvedValue([0]);
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(reserveService.rejectReserve(2, 1)).rejects.toThrow('预约状态不正确');
      expect(ReserveSlot.update).not.toHaveBeenCalled();
      expect(tx.rollback).toHaveBeenCalled();
    });

    it('validates reject ownership and status', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 3, status: 0 });
      await expect(reserveService.rejectReserve(2, 1)).rejects.toThrow('无权操作此预约');

      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 2 });
      await expect(reserveService.rejectReserve(2, 1)).rejects.toThrow('预约状态不正确');
    });
  });

  describe('cancelReserve', () => {
    it('validates existence, ownership and status', async () => {
      Reserve.findByPk.mockResolvedValue(null);
      await expect(reserveService.cancelReserve(2, 1)).rejects.toThrow('预约不存在');

      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 3, status: 0 });
      await expect(reserveService.cancelReserve(2, 1)).rejects.toThrow('无权操作此预约');

      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 3 });
      await expect(reserveService.cancelReserve(2, 1)).rejects.toThrow('预约无法取消');
    });

    it('refunds fully when far in the future', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 0, price: '100', ...futureDate(72) });
      Reserve.update.mockResolvedValue([1]);
      ReserveSlot.update.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      const result = await reserveService.cancelReserve(2, 1);
      expect(result.refundRate).toBe(1);
      expect(result.refundAmount).toBe(100);
      expect(User.increment).toHaveBeenCalled();
      // 抢占式状态迁移：退款只可能由命中 WHERE status IN (0,1) 的那一次请求执行
      expect(Reserve.update.mock.calls[0][1].where.status[Op.in]).toEqual([0, 1]);
    });

    it('refunds half when within 24h and nothing when under 12h', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 1, price: '100', ...futureDate(20) });
      Reserve.update.mockResolvedValue([1]);
      ReserveSlot.update.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      const half = await reserveService.cancelReserve(2, 1);
      expect(half.refundRate).toBe(0.5);
      expect(half.refundAmount).toBe(50);

      User.increment.mockClear();
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 0, price: '100', ...futureDate(1) });
      const none = await reserveService.cancelReserve(2, 1);
      expect(none.refundRate).toBe(0);
      expect(User.increment).not.toHaveBeenCalled();
    });

    // 审计 H-7：两个并发取消只有一个能命中条件更新，落败方必须整体回滚、不得退款
    it('refuses to refund when the cancel claim is lost', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 0, price: '100', ...futureDate(72) });
      Reserve.update.mockResolvedValue([0]);
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(reserveService.cancelReserve(2, 1)).rejects.toThrow('预约无法取消');
      expect(User.increment).not.toHaveBeenCalled();
      expect(ReserveSlot.update).not.toHaveBeenCalled();
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  describe('completeReserve', () => {
    it('validates permission and status', async () => {
      Reserve.findByPk.mockResolvedValue(null);
      await expect(reserveService.completeReserve(2, 1)).rejects.toThrow('预约不存在');

      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 3, target_user_id: 4, status: 1 });
      await expect(reserveService.completeReserve(2, 1)).rejects.toThrow('无权操作此预约');

      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 0 });
      await expect(reserveService.completeReserve(2, 1)).rejects.toThrow('预约状态不正确，仅可完成已确认的预约');
    });

    it('pays the companion on completion', async () => {
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 1, price: '100' });
      Reserve.update.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      await expect(reserveService.completeReserve(2, 1)).resolves.toBe(true);
      expect(User.increment).toHaveBeenCalledTimes(2);
      // 分成比例在事务内读取（第三个参数就是本次事务）
      expect(getCommissionRate).toHaveBeenCalledWith('reserve_commission_rate', 1, tx);
      // 先抢占 status=1 → 3，命中方才分账
      expect(Reserve.update.mock.calls[0][0].status).toBe(3);
      expect(Reserve.update.mock.calls[0][1].where.status).toBe(1);
      expect(tx.commit).toHaveBeenCalled();
    });

    it('skips payment when there is no income', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: null, status: 1, price: '0' });
      Reserve.update.mockResolvedValue([1]);
      await expect(reserveService.completeReserve(2, 1)).resolves.toBe(true);
      expect(User.increment).not.toHaveBeenCalled();
    });

    // 审计 H-7：两个并发完成只有一个能命中条件更新，落败方不得再次分账
    it('refuses to pay twice when the complete claim is lost', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 1, price: '100' });
      Reserve.update.mockResolvedValue([0]);
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(reserveService.completeReserve(2, 1)).rejects.toThrow('预约状态不正确，仅可完成已确认的预约');
      expect(User.increment).not.toHaveBeenCalled();
      expect(tx.rollback).toHaveBeenCalled();
    });

    it('rolls back on failure', async () => {
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 1, price: '10' });
      Reserve.update.mockRejectedValue(new Error('db'));
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(reserveService.completeReserve(2, 1)).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  it('getReserveList filters by role and status', async () => {
    Reserve.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 1, user_id: 2, target_user_id: 3, game_id: 1, reserve_date: 'd', reserve_time: 't', status: 0, create_time: 1 }]
    });
    User.findByPk.mockResolvedValue({ id: 3, nickname: 'n', avatar: 'a' });
    Game.findByPk.mockResolvedValue({ id: 1, name: 'g' });

    const result = await reserveService.getReserveList(2, 'companion', '1', 1, 10);
    expect(result.list[0].companionName).toBe('n');
    expect(Reserve.findAndCountAll.mock.calls[0][0].where.target_user_id).toBe(2);
    expect(Reserve.findAndCountAll.mock.calls[0][0].where.status).toBe(1);

    await reserveService.getReserveList(2, 'user', '', 1, 10);
    expect(Reserve.findAndCountAll.mock.calls[1][0].where.user_id).toBe(2);
    expect(Reserve.findAndCountAll.mock.calls[1][0].where.status).toBeUndefined();
  });

  it('getReserveDetail throws and maps details', async () => {
    Reserve.findByPk.mockResolvedValue(null);
    await expect(reserveService.getReserveDetail(1)).rejects.toThrow('预约不存在');

    Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, game_id: 1, reserve_date: 'd', reserve_time: 't', status: 0, create_time: 1 });
    User.findByPk.mockResolvedValueOnce({ id: 2, nickname: 'u' }).mockResolvedValueOnce({ id: 3, nickname: 'c' });
    Game.findByPk.mockResolvedValue({ id: 1, name: 'g' });
    const detail = await reserveService.getReserveDetail(1);
    expect(detail.user.nickname).toBe('u');
    expect(detail.companion.nickname).toBe('c');
    expect(detail.gameName).toBe('g');
  });
});
