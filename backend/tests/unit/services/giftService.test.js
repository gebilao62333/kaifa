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

const txn = () => ({ commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true), finished: false, LOCK: { UPDATE: 'UPDATE' } });
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

    // 审计 C-2：礼物收益入账时 money 与 gift_money 同时增加，只扣 gift_money 会让同一笔钱
    // 既能消费又能提现，故申请时两笔一起条件扣减。
    it('申请时同时条件扣减真实余额 money', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, money: 500, mobile: '138' });
      User.decrement.mockResolvedValue([1]);
      Withdraw.create.mockResolvedValue({ id: 1 });
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);

      await giftService.withdraw(2, 200, 2, {});

      const calls = User.decrement.mock.calls.map((c) => c[0]);
      expect(calls).toEqual(['gift_money', 'money']);
      expect(User.decrement).toHaveBeenCalledWith('money', expect.objectContaining({
        by: 200,
        where: expect.objectContaining({ id: 2 }),
        transaction: tx
      }));
    });

    it('rejects non-numeric amounts (NaN 不再穿透到 SQL)', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, money: 500, mobile: '138' });
      await expect(giftService.withdraw(2, 'abc', 1)).rejects.toThrow('提现金额必须为有限数字');
      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(User.decrement).not.toHaveBeenCalled();
    });

    it('gift_money 足够但 money 已被消费时整单回滚', async () => {
      User.findByPk.mockResolvedValue({ id: 2, gift_money: 500, money: 120, mobile: '138' });
      User.decrement
        .mockResolvedValueOnce([1])   // gift_money 扣减成功
        .mockResolvedValueOnce([0]);  // money 不足，条件扣减未命中
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);

      await expect(giftService.withdraw(2, 200, 2, {})).rejects.toThrow('金币余额不足');
      expect(tx.rollback).toHaveBeenCalled();
      expect(Withdraw.create).not.toHaveBeenCalled();
    });
  });

  describe('receiveRedPacket', () => {
    const basePacket = { id: 1, status: 0, expire_time: Math.floor(Date.now() / 1000) + 3600, sender_id: 9, type: 0, total_amount: 10, total_num: 2, remain_amount: 10, remain_num: 2 };

    const stubReceive = (packet) => {
      RedPacket.findOne.mockResolvedValue(packet);
      RedPacketLog.findOne.mockResolvedValue(null);
      RedPacketLog.create.mockResolvedValue({ id: 1 });
      RedPacket.update.mockResolvedValue([1]);
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n' });
      User.increment.mockResolvedValue([1]);
    };

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

    // 审计 M-7：领取必须在事务内先锁定红包行，再基于最新余额计算金额。
    // 原实现用事务外读到的过期 remain_amount 取拼手气随机数，并发下累计入账可超 total_amount。
    it('锁定红包行后再计算金额（SELECT ... FOR UPDATE 在事务内）', async () => {
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      stubReceive(basePacket);

      await giftService.receiveRedPacket(2, 'P1');

      expect(RedPacket.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { packet_no: 'P1' },
        transaction: tx,
        lock: 'UPDATE'
      }));
    });

    it('receives a normal packet and decrements the remainder', async () => {
      stubReceive({ ...basePacket });

      const result = await giftService.receiveRedPacket(2, 'P1');
      expect(result.amount).toBe(5);
      expect(RedPacket.update).toHaveBeenCalledWith(
        expect.objectContaining({ remain_num: expect.anything() }),
        expect.objectContaining({ where: expect.objectContaining({ remain_num: expect.anything() }) })
      );
    });

    it('普通红包最后一人领取剩余零头（累计=total_amount）', async () => {
      // 3 人均分 10 元：前两人各 3.33，最后一人拿 3.34
      stubReceive({ ...basePacket, remain_num: 1, remain_amount: 3.34 });

      const result = await giftService.receiveRedPacket(2, 'P1');
      expect(result.amount).toBe(3.34);
    });

    it('拼手气金额为其余人各留至少 1 分（不超过 remain-(n-1) 分）', async () => {
      stubReceive({ ...basePacket, type: 1, remain_num: 2, remain_amount: 10 });

      const result = await giftService.receiveRedPacket(2, 'P1');
      expect(result.amount).toBeGreaterThanOrEqual(0.01);
      expect(result.amount).toBeLessThanOrEqual(9.99);
    });

    it('拼手气最后一人拿走剩余全部', async () => {
      stubReceive({ ...basePacket, type: 1, remain_num: 1, remain_amount: 6.66 });

      const result = await giftService.receiveRedPacket(2, 'P1');
      expect(result.amount).toBe(6.66);
    });

    it('remain_amount 用递减更新（不再用 GREATEST 夹值掩盖超额）', async () => {
      stubReceive({ ...basePacket });

      await giftService.receiveRedPacket(2, 'P1');

      const literals = sequelize.literal.mock.calls.map((c) => c[0]);
      expect(literals).toContain('remain_amount - 5');
      expect(literals.some((s) => typeof s === 'string' && s.includes('GREATEST'))).toBe(false);
    });

    it('名额为 0 时拒绝（即使 status 仍为 0）', async () => {
      RedPacket.findOne.mockResolvedValue({ ...basePacket, remain_num: 0 });
      RedPacketLog.findOne.mockResolvedValue(null);
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('红包已被抢完');
      expect(User.increment).not.toHaveBeenCalled();
    });

    it('receives a lucky packet and closes it when it is the last one', async () => {
      stubReceive({ ...basePacket, type: 1, remain_num: 1 });

      const result = await giftService.receiveRedPacket(2, 'P1');
      expect(result.amount).toBeGreaterThan(0);
      // 领完后按条件更新关闭红包
      expect(RedPacket.update).toHaveBeenCalledWith(
        expect.objectContaining({ remain_num: 0, remain_amount: 0, status: 1 }),
        expect.anything()
      );
    });

    it('rolls back on failure', async () => {
      stubReceive({ ...basePacket });
      RedPacketLog.create.mockRejectedValue(new Error('db'));
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });

    it('唯一索引冲突（并发重复领）转为已领取过', async () => {
      stubReceive({ ...basePacket });
      RedPacketLog.create.mockRejectedValue(new Error('ER_DUP_ENTRY: Duplicate entry'));
      await expect(giftService.receiveRedPacket(2, 'P1')).rejects.toThrow('已领取过该红包');
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
