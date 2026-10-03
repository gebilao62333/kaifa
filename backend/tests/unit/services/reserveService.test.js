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
  });

  it('batchCreateSlots creates each slot', async () => {
    ReserveSlot.findOrCreate.mockResolvedValue([{}, true]);
    await expect(reserveService.batchCreateSlots(2, 1, [{ date: '2026-01-01', time: '10:00' }])).resolves.toBe(true);
    expect(ReserveSlot.findOrCreate).toHaveBeenCalled();
  });

  it('toggleSlot flips the status', async () => {
    ReserveSlot.findOne.mockResolvedValue(null);
    await expect(reserveService.toggleSlot(2, 1)).rejects.toThrow('时间槽不存在');

    const update = jest.fn().mockResolvedValue(true);
    ReserveSlot.findOne.mockResolvedValue({ status: 0, update });
    expect(await reserveService.toggleSlot(2, 1)).toEqual({ status: 2 });

    ReserveSlot.findOne.mockResolvedValue({ status: 2, update });
    expect(await reserveService.toggleSlot(2, 1)).toEqual({ status: 0 });
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
      const update = jest.fn().mockResolvedValue(true);
      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 0, update });
      await expect(reserveService.confirmReserve(2, 1)).resolves.toBe(true);
      expect(update).toHaveBeenCalled();
    });

    it('rejects a reservation and frees the slot', async () => {
      const update = jest.fn().mockResolvedValue(true);
      Reserve.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 0, reserve_date: 'd', reserve_time: 't', update });
      ReserveSlot.update.mockResolvedValue([1]);
      await expect(reserveService.rejectReserve(2, 1)).resolves.toBe(true);
      expect(ReserveSlot.update).toHaveBeenCalled();
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
      const update = jest.fn().mockResolvedValue(true);
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 0, price: '100', update, ...futureDate(72) });
      ReserveSlot.update.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      const result = await reserveService.cancelReserve(2, 1);
      expect(result.refundRate).toBe(1);
      expect(result.refundAmount).toBe(100);
      expect(User.increment).toHaveBeenCalled();
    });

    it('refunds half when within 24h and nothing when under 12h', async () => {
      const update = jest.fn().mockResolvedValue(true);
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 1, price: '100', update, ...futureDate(20) });
      ReserveSlot.update.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      const half = await reserveService.cancelReserve(2, 1);
      expect(half.refundRate).toBe(0.5);
      expect(half.refundAmount).toBe(50);

      User.increment.mockClear();
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 0, price: '100', update, ...futureDate(1) });
      const none = await reserveService.cancelReserve(2, 1);
      expect(none.refundRate).toBe(0);
      expect(User.increment).not.toHaveBeenCalled();
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
      const update = jest.fn().mockResolvedValue(true);
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 1, price: '100', update });
      User.increment.mockResolvedValue([1]);
      await expect(reserveService.completeReserve(2, 1)).resolves.toBe(true);
      expect(User.increment).toHaveBeenCalledTimes(2);
    });

    it('skips payment when there is no income', async () => {
      const update = jest.fn().mockResolvedValue(true);
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: null, status: 1, price: '0', update });
      await expect(reserveService.completeReserve(2, 1)).resolves.toBe(true);
      expect(User.increment).not.toHaveBeenCalled();
    });

    it('rolls back on failure', async () => {
      const update = jest.fn().mockRejectedValue(new Error('db'));
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 1, price: '10', update });
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
