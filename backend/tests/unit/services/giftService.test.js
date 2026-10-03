jest.mock('../../../src/models', () => {
  const model = () => ({
    findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), findAndCountAll: jest.fn(),
    create: jest.fn(), update: jest.fn(), destroy: jest.fn(), increment: jest.fn(), decrement: jest.fn(), count: jest.fn()
  });
  return {
    User: model(), Gift: model(), GiftLog: model(), GiftBag: model(),
    RedPacket: model(), RedPacketLog: model(), Withdraw: model()
  };
});
jest.mock('../../../src/config/mysql', () => ({ transaction: jest.fn(), literal: jest.fn((s) => s) }));

const giftService = require('../../../src/services/giftService');
const { User, Gift, GiftLog, GiftBag, RedPacket, RedPacketLog, Withdraw } = require('../../../src/models');
const sequelize = require('../../../src/config/mysql');

const txn = () => ({ commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) });
const gift = { id: 1, title: '爱心', image: 'i.png', svga: 'a.svga', money: 10, type: 0, is_vip: 0, tian: 0, status: 1 };

describe('Service - GiftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(txn());
  });

  describe('sendGift', () => {
    it('rejects missing or delisted gifts', async () => {
      Gift.findByPk.mockResolvedValue(null);
      await expect(giftService.sendGift(1, 2, 1)).rejects.toThrow('礼物不存在或已下架');

      Gift.findByPk.mockResolvedValue({ ...gift, status: 0 });
      await expect(giftService.sendGift(1, 2, 1)).rejects.toThrow('礼物不存在或已下架');
    });

    it('rejects missing users', async () => {
      Gift.findByPk.mockResolvedValue(gift);
      User.findByPk.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);
      await expect(giftService.sendGift(1, 2, 1)).rejects.toThrow('用户不存在');
    });

    it('rejects when the balance is insufficient', async () => {
      Gift.findByPk.mockResolvedValue(gift);
      User.findByPk.mockResolvedValue({ id: 1, nickname: 'n', avatar: 'a' });
      User.update.mockResolvedValue([0]);
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(giftService.sendGift(1, 2, 1)).rejects.toThrow('余额不足');
      expect(tx.rollback).toHaveBeenCalled();
    });

    it('sends a gift and splits the commission', async () => {
      Gift.findByPk.mockResolvedValue(gift);
      User.findByPk.mockResolvedValue({ id: 1, nickname: 'n', avatar: 'a' });
      User.update.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      GiftLog.create.mockResolvedValue({ id: 1 });
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);

      const result = await giftService.sendGift(1, 2, 1, 5, 3);
      expect(result.goldCoins).toBe(30);
      expect(result.num).toBe(3);
      expect(User.increment).toHaveBeenCalledTimes(3);
      expect(tx.commit).toHaveBeenCalled();
    });

    it('defaults the gift count to 1', async () => {
      Gift.findByPk.mockResolvedValue(gift);
      User.findByPk.mockResolvedValue({ id: 1, nickname: 'n', avatar: 'a' });
      User.update.mockResolvedValue([1]);
      GiftLog.create.mockResolvedValue({ id: 1 });
      const result = await giftService.sendGift(1, 2, 1, 0, 0);
      expect(result.num).toBe(1);
    });
  });

  it('getGiftList filters by type and maps assets', async () => {
    Gift.findAll.mockResolvedValue([gift]);
    const withType = await giftService.getGiftList(1);
    expect(withType[0].giftId).toBe(1);
    expect(Gift.findAll.mock.calls[0][0].where.type).toBe(1);

    await giftService.getGiftList();
    expect(Gift.findAll.mock.calls[1][0].where.type).toBeUndefined();
  });

  it('getGiftBag maps items', async () => {
    GiftBag.findAll.mockResolvedValue([{ id: 1, gift_id: 2, gift_name: 'g', gift_image: 'i', num: 3, type: 0, end_time: 1 }]);
    const list = await giftService.getGiftBag(2);
    expect(list[0]).toEqual({ id: 1, giftId: 2, giftName: 'g', giftImage: 'i', count: 3, type: 0, endTime: 1 });
  });

  describe('withdraw', () => {
    it('rejects missing users and low amounts', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(giftService.withdraw(2, 200, 1)).rejects.toThrow('用户不存在');

      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, mobile: '138' });
      await expect(giftService.withdraw(2, 50, 1)).rejects.toThrow('最低提现金额为 100 金币');
    });

    it('rejects insufficient gift money', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 10, mobile: '138' });
      await expect(giftService.withdraw(2, 200, 1)).rejects.toThrow('可提现余额不足');
    });

    it('creates a withdraw request with fee', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, mobile: '138' });
      User.decrement.mockResolvedValue([1]);
      Withdraw.create.mockResolvedValue({ id: 1 });
      const result = await giftService.withdraw(2, 200, 2, { bank: 'b', name: 'n', mobile: '139', image: 'i' });
      expect(result.success).toBe(true);
      expect(result.fee).toBe(10);
      expect(result.netAmount).toBe(190);
    });

    it('申请时在同一事务内扣减 gift_money（防重复提现）', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, mobile: '138' });
      User.decrement.mockResolvedValue([1]);
      Withdraw.create.mockResolvedValue({ id: 1 });
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);

      await giftService.withdraw(2, 200, 2, {});

      // 条件扣减：where 带余额判断，防止并发下超额提现
      expect(User.decrement).toHaveBeenCalledWith('gift_money', expect.objectContaining({
        by: 200,
        where: expect.objectContaining({ id: 2 }),
        transaction: tx
      }));
      expect(tx.commit).toHaveBeenCalled();
    });

    it('条件扣减未命中（余额被并发扣光）时回滚并报余额不足', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, mobile: '138' });
      User.decrement.mockResolvedValue([0]);
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);

      await expect(giftService.withdraw(2, 200, 2, {})).rejects.toThrow('可提现余额不足');
      expect(tx.rollback).toHaveBeenCalled();
      expect(Withdraw.create).not.toHaveBeenCalled();
    });

    it('rolls back on failure', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, mobile: '138' });
      User.decrement.mockResolvedValue([1]);
      Withdraw.create.mockRejectedValue(new Error('db'));
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(giftService.withdraw(2, 200, 1)).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  describe('receiveRedPacket', () => {
    const basePacket = { id: 1, status: 0, expire_time: Math.floor(Date.now() / 1000) + 3600, sender_id: 9, type: 0, total_amount: 10, total_num: 2, remain_amount: 10, remain_num: 2, update: jest.fn() };

    it('validates the packet state', async () => {
      RedPacket.findOne.mockResolvedValue(null);
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('红包不存在');

      RedPacket.findOne.mockResolvedValue({ ...basePacket, status: 1 });
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('红包已过期或已领完');

      RedPacket.findOne.mockResolvedValue({ ...basePacket, expire_time: 1 });
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('红包已过期');

      RedPacket.findOne.mockResolvedValue({ ...basePacket, sender_id: 2 });
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('不能领取自己的红包');

      RedPacket.findOne.mockResolvedValue(basePacket);
      RedPacketLog.findOne.mockResolvedValue({ id: 1 });
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('已领取过该红包');
    });

    it('receives a normal packet and decrements the remainder', async () => {
      RedPacket.findOne.mockResolvedValue({ ...basePacket, update: jest.fn().mockResolvedValue(true) });
      RedPacketLog.findOne.mockResolvedValue(null);
      RedPacketLog.create.mockResolvedValue({ id: 1 });
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n' });
      User.increment.mockResolvedValue([1]);
      // 审计 B-01：名额改为条件原子更新
      RedPacket.update.mockResolvedValue([1]);

      const result = await giftService.receiveRedPacket(2, 'P1');
      expect(result.amount).toBe(5);
      expect(RedPacket.update).toHaveBeenCalledWith(
        expect.objectContaining({ remain_num: expect.anything() }),
        expect.objectContaining({ where: expect.objectContaining({ remain_num: expect.anything() }) })
      );
    });

    it('receives a lucky packet and closes it when it is the last one', async () => {
      RedPacket.findOne.mockResolvedValue({ ...basePacket, type: 1, remain_num: 1, update: jest.fn() });
      RedPacketLog.findOne.mockResolvedValue(null);
      RedPacketLog.create.mockResolvedValue({ id: 1 });
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n' });
      User.increment.mockResolvedValue([1]);
      RedPacket.update.mockResolvedValue([1]);

      const result = await giftService.receiveRedPacket(2, 'P1');
      expect(result.amount).toBeGreaterThan(0);
      // 领完后按条件更新关闭红包
      expect(RedPacket.update).toHaveBeenCalledWith(
        expect.objectContaining({ remain_num: 0, remain_amount: 0, status: 1 }),
        expect.anything()
      );
    });

    it('rolls back on failure', async () => {
      RedPacket.findOne.mockResolvedValue({ ...basePacket, update: jest.fn() });
      RedPacketLog.findOne.mockResolvedValue(null);
      RedPacket.update.mockResolvedValue([1]);
      RedPacketLog.create.mockRejectedValue(new Error('db'));
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n' });
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  describe('getRedPacketHistory', () => {
    it('returns both sent and received records', async () => {
      RedPacket.findAll.mockResolvedValue([
        { id: 1, packet_no: 'P1', total_amount: 10, total_num: 2, type: 1, status: 0, create_time: 2 },
        { id: 2, packet_no: 'P2', total_amount: 5, total_num: 1, type: 0, status: 1, create_time: 1 }
      ]);
      RedPacketLog.findAll.mockResolvedValue([{ id: 1, packet_id: 1, amount: 5, create_time: 3 }]);
      RedPacket.findByPk.mockResolvedValue({ packet_no: 'P1', type: 1 });

      const all = await giftService.getRedPacketHistory(2, 'all');
      expect(all.length).toBe(3);
      expect(all[0].createTime).toBe(3);

      const sent = await giftService.getRedPacketHistory(2, 'sent');
      expect(sent.length).toBe(2);
      expect(sent[0].packetType).toBe('lucky');

      const received = await giftService.getRedPacketHistory(2, 'received');
      expect(received.length).toBe(1);
    });
  });
});
