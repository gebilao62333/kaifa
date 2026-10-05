jest.mock('../../../src/models', () => {
  const model = () => ({
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  });
  const User = model();
  User.sequelize = { transaction: jest.fn() };
  return { User, Post: model(), GameOrder: model() };
});
jest.mock('../../../src/config/mysql', () => ({ transaction: jest.fn(), literal: jest.fn((s) => s) }));

const levelService = require('../../../src/services/levelService');
const { User, Post, GameOrder } = require('../../../src/models');
const { getTimestamp } = require('../../../src/utils/helper');
const { EXP_SOURCES, BENEFITS } = require('../../../src/utils/level');

const txn = () => ({
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true),
  finished: false
});

const fakeUser = (overrides = {}) => ({
  id: 2,
  lv: 1,
  exp: 0,
  vip: 0,
  vip_lv: 0,
  vip_expire_time: 0,
  last_check_in_time: 0,
  update: jest.fn().mockResolvedValue(true),
  ...overrides
});

describe('Service - LevelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.sequelize.transaction.mockResolvedValue(txn());
  });

  describe('addExp', () => {
    it('applies the VIP boost and stores the in-level progress', async () => {
      const user = fakeUser({ lv: 1, exp: 1400, vip_lv: 2 });
      User.findByPk.mockResolvedValue(user);

      const result = await levelService.addExp(2, 'order_completed');

      // 50 × 1.5 = 75 → 1475，Lv.1 需 1500，尚未升级
      expect(result).toEqual({ lv: 1, exp: 1475, added: 75, leveledUp: false, boost: 1.5 });
      expect(user.update).toHaveBeenCalledWith({ lv: 1, exp: 1475 }, expect.anything());
    });

    it('carries the overflow when leveling up', async () => {
      User.findByPk.mockResolvedValue(fakeUser({ lv: 1, exp: 1490, vip_lv: 0 }));

      const result = await levelService.addExp(2, 'order_completed');

      expect(result).toEqual({ lv: 2, exp: 40, added: 50, leveledUp: true, boost: 1 });
    });

    it('accepts an explicit base override', async () => {
      User.findByPk.mockResolvedValue(fakeUser());

      const result = await levelService.addExp(2, 'manual_reward', 300);

      expect(result.added).toBe(300);
    });

    it('rejects unknown sources and non-positive overrides', async () => {
      await expect(levelService.addExp(2, 'no_such_source')).rejects.toThrow('无效的经验来源');
      await expect(levelService.addExp(2, 'manual', 0)).rejects.toThrow('无效的经验来源');
      expect(User.sequelize.transaction).not.toHaveBeenCalled();
    });

    it('rolls back and rethrows when the user is gone', async () => {
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);
      User.findByPk.mockResolvedValue(null);

      await expect(levelService.addExp(2, 'post_created')).rejects.toThrow('用户不存在');
      expect(tx.rollback).toHaveBeenCalled();
      expect(tx.commit).not.toHaveBeenCalled();
    });

    it('rolls back when the update fails', async () => {
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);
      User.findByPk.mockResolvedValue(fakeUser({ update: jest.fn().mockRejectedValue(new Error('db')) }));

      await expect(levelService.addExp(2, 'post_created')).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });

    it('never loses the boost rounding below 1 point', async () => {
      User.findByPk.mockResolvedValue(fakeUser({ vip_lv: 1 }));

      const result = await levelService.addExp(2, 'manual', 0.4);

      expect(result.added).toBe(1);
    });
  });

  describe('checkIn', () => {
    it('claims the day atomically before awarding exp', async () => {
      User.findByPk.mockResolvedValue(fakeUser({ last_check_in_time: 0 }));
      User.update.mockResolvedValue([1]);

      const result = await levelService.checkIn(2);

      expect(User.update).toHaveBeenCalledWith(
        { last_check_in_time: expect.any(Number) },
        expect.objectContaining({ where: { id: 2, last_check_in_time: expect.anything() } })
      );
      expect(result.alreadyCheckedIn).toBe(false);
      expect(result.added).toBe(EXP_SOURCES.daily_check_in);
    });

    it('refuses a second check-in in the same day', async () => {
      User.findByPk.mockResolvedValue(fakeUser({ last_check_in_time: getTimestamp() }));
      User.update.mockResolvedValue([0]);

      await expect(levelService.checkIn(2)).rejects.toThrow('今日已签到');
      expect(User.sequelize.transaction).not.toHaveBeenCalled();
    });

    it('throws when the user does not exist', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(levelService.checkIn(2)).rejects.toThrow('用户不存在');
      expect(User.update).not.toHaveBeenCalled();
    });
  });

  describe('getInfo', () => {
    it('returns progress, boost, check-in state and benefit unlock flags', async () => {
      User.findByPk.mockResolvedValue(fakeUser({
        lv: 12,
        exp: 3000,
        vip: 1,
        vip_lv: 3,
        vip_expire_time: 0,
        last_check_in_time: getTimestamp()
      }));

      const info = await levelService.getInfo(2);

      expect(info.lv).toBe(12);
      expect(info.nextLevelExp).toBe(12500);
      expect(info.remainExp).toBe(9500);
      expect(info.percent).toBe(24);
      expect(info.vip).toBe(true);
      expect(info.boost).toBe(1.8);
      expect(info.checkedInToday).toBe(true);
      expect(info.expSources).toEqual(EXP_SOURCES);
      expect(info.boostTable).toEqual({ 0: 1, 1: 1.2, 2: 1.5, 3: 1.8, 4: 2 });
      expect(info.benefits).toHaveLength(7);
      expect(info.benefits.find(b => b.key === 'signature').unlocked).toBe(true);
      expect(info.benefits.find(b => b.key === 'skin_shop').unlocked).toBe(false);
      expect(info.benefits.find(b => b.key === 'identity_badge')).toEqual({
        key: 'identity_badge',
        name: '解锁专属身份标识',
        level: 20,
        unlocked: false
      });
      info.benefits.forEach(b => {
        expect(Object.keys(b).sort()).toEqual(['key', 'level', 'name', 'unlocked']);
      });
    });

    it('treats an expired VIP as no boost and clamps negative exp', async () => {
      User.findByPk.mockResolvedValue(fakeUser({
        lv: 3,
        exp: -10,
        vip: 1,
        vip_lv: 4,
        vip_expire_time: getTimestamp() - 10,
        last_check_in_time: getTimestamp() - 86400 * 2
      }));

      const info = await levelService.getInfo(2);

      expect(info.vip).toBe(false);
      expect(info.boost).toBe(2);
      expect(info.exp).toBe(0);
      expect(info.percent).toBe(0);
      expect(info.checkedInToday).toBe(false);
    });

    it('throws for a missing user', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(levelService.getInfo(2)).rejects.toThrow('用户不存在');
    });
  });

  describe('requireLevel / canUse / getLevelOf', () => {
    it('throws a level error carrying the needed level', async () => {
      User.findByPk.mockResolvedValue({ id: 2, lv: 9 });

      await expect(levelService.requireLevel(2, 'stealth_visit')).rejects.toMatchObject({
        code: 'LEVEL_NOT_ENOUGH',
        needLevel: 10
      });
      await expect(levelService.requireLevel(2, 'stealth_visit')).rejects.toThrow('需要 Lv.10（当前 Lv.9）');
    });

    it('passes once the level is reached', async () => {
      User.findByPk.mockResolvedValue({ id: 2, lv: 10 });
      await expect(levelService.requireLevel(2, 'stealth_visit')).resolves.toBeDefined();
    });

    it('gates every benefit in the table', async () => {
      User.findByPk.mockResolvedValue({ id: 2, lv: 1 });
      for (const benefit of BENEFITS) {
        await expect(levelService.requireLevel(2, benefit.key)).rejects.toMatchObject({
          code: 'LEVEL_NOT_ENOUGH',
          needLevel: benefit.level
        });
      }
    });

    it('rejects unknown benefit keys and missing users', async () => {
      await expect(levelService.requireLevel(2, 'nope')).rejects.toThrow('未知的权益项');

      User.findByPk.mockResolvedValue(null);
      await expect(levelService.requireLevel(2, 'skin_shop')).rejects.toThrow('用户不存在');
    });

    it('canUse answers without throwing', async () => {
      User.findByPk.mockResolvedValue({ id: 2, lv: 24 });
      expect(await levelService.canUse(2, 'album_expand')).toBe(false);

      User.findByPk.mockResolvedValue({ id: 2, lv: 25 });
      expect(await levelService.canUse(2, 'album_expand')).toBe(true);

      expect(await levelService.canUse(2, 'not_a_benefit')).toBe(true);
    });

    it('getLevelOf falls back to Lv.1', async () => {
      User.findByPk.mockResolvedValue({ id: 2, lv: 7 });
      expect(await levelService.getLevelOf(2)).toBe(7);

      User.findByPk.mockResolvedValue(null);
      expect(await levelService.getLevelOf(2)).toBe(1);
    });

    it('keeps the shared gate helper working for controller error mapping', async () => {
      const { isLevelGateError, handleLevelGate } = require('../../../src/utils/levelGate');

      expect(isLevelGateError({ code: 'LEVEL_NOT_ENOUGH', needLevel: 3 })).toBe(true);
      expect(isLevelGateError(new Error('db'))).toBe(false);
      expect(isLevelGateError(undefined)).toBe(false);

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
      handleLevelGate(res, { message: '等级不足', needLevel: 10 });
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].errors.level[0]).toContain('Lv.10');
    });
  });

  describe('backfillExperience', () => {
    it('converts historical behaviour into a baseline level', async () => {
      const user = fakeUser();
      User.findAll.mockResolvedValue([user]);
      GameOrder.count.mockResolvedValue(40);
      Post.count.mockResolvedValue(5);

      const result = await levelService.backfillExperience({ batchSize: 200 });

      // 40×50 + 5×20 = 2100 → Lv.2 剩 600（Lv.1 需 1500）
      expect(result).toEqual({ processed: 1, changed: 1, remaining: false });
      expect(user.update).toHaveBeenCalledWith({ lv: 2, exp: 600, level_backfill_time: expect.any(Number) });
    });

    it('adds the real-name bonus and still marks behaviour-free users as backfilled', async () => {
      const verified = fakeUser({ id: 3, real_name_status: 2 });
      const silent = fakeUser({ id: 4, real_name_status: 0 });
      User.findAll.mockResolvedValue([verified, silent]);
      GameOrder.count.mockResolvedValue(0);
      Post.count.mockResolvedValue(0);

      const result = await levelService.backfillExperience({});

      expect(verified.update).toHaveBeenCalledWith({ lv: 1, exp: 100, level_backfill_time: expect.any(Number) });
      expect(silent.update).toHaveBeenCalledWith({ lv: 1, exp: 0, level_backfill_time: expect.any(Number) });
      expect(result).toEqual({ processed: 2, changed: 1, remaining: false });
    });

    it('reports remaining batches and supports dryRun', async () => {
      const users = [fakeUser(), fakeUser()];
      User.findAll.mockResolvedValue(users);
      GameOrder.count.mockResolvedValue(10);
      Post.count.mockResolvedValue(0);

      const result = await levelService.backfillExperience({ batchSize: 2, dryRun: true });

      expect(result).toEqual({ processed: 2, changed: 2, remaining: true });
      expect(users[0].update).not.toHaveBeenCalled();
    });
  });
});
