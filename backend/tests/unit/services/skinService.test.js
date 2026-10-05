// 审计 H-6：装扮目录、价格、所有权、扣款金额全部由服务端决定后的行为锁定
jest.mock('../../../src/models', () => ({
  User: { findByPk: jest.fn(), decrement: jest.fn() },
  UserPref: { findOne: jest.fn(), create: jest.fn() }
}));
jest.mock('../../../src/config/mysql', () => ({ transaction: jest.fn() }));
jest.mock('../../../src/services/levelService', () => ({ requireLevel: jest.fn() }));

const skinService = require('../../../src/services/skinService');
const { User, UserPref } = require('../../../src/models');
const sequelize = require('../../../src/config/mysql');
const levelService = require('../../../src/services/levelService');

const txn = () => {
  const t = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true),
    finished: false,
    LOCK: { UPDATE: 'UPDATE' }
  };
  return t;
};

// 目录价：sf8 暗夜流光 8888 币 / VIP4；sf3 活力橙边 800 币；sf1 简约白边 免费
const userOf = (overrides = {}) => ({
  id: 100001, lv: 50, money: 20000, vip: 0, vip_lv: 0, vip_expire_time: 0, ...overrides
});
const prefRow = (state, extra = {}) => ({
  data: JSON.stringify({ skinShop: state, ...extra }),
  update: jest.fn().mockResolvedValue(true)
});

const findItem = (payload, id) => payload.items.find((item) => item.id === id);

describe('Service - skinService（装扮服务端化）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(txn());
    UserPref.findOne.mockResolvedValue(null);
    UserPref.create.mockResolvedValue({ id: 1 });
    User.findByPk.mockResolvedValue(userOf());
    User.decrement.mockResolvedValue([[null, 1]]);
    levelService.requireLevel.mockResolvedValue({ id: 100001 });
  });

  describe('listForUser', () => {
    it('目录与价格来自服务端，未购买项 owned=false', async () => {
      const payload = await skinService.listForUser(100001);
      expect(payload.items.length).toBe(26);
      expect(findItem(payload, 'sf8').price).toBe(8888);
      expect(findItem(payload, 'sf8').vipLevel).toBe(4);
      expect(findItem(payload, 'sf8').owned).toBe(false);
      expect(findItem(payload, 'sf1').owned).toBe(true);
      expect(payload.balance).toBe(20000);
    });

    it('等级不足时 unlocked=false 且给出所需等级', async () => {
      User.findByPk.mockResolvedValue(userOf({ lv: 12 }));
      const payload = await skinService.listForUser(100001);
      expect(payload.needLevel).toBe(45);
      expect(payload.unlocked).toBe(false);
    });

    it('用户不存在直接报错', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(skinService.listForUser(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('purchase', () => {
    it('扣款金额取服务端目录价，而不是客户端提交值', async () => {
      User.findByPk.mockResolvedValue(userOf({ vip: 1, vip_lv: 4 }));
      const result = await skinService.purchase(100001, 'sf8');
      expect(User.decrement).toHaveBeenCalledWith('money', expect.objectContaining({ by: 8888 }));
      expect(result.charged).toBe(8888);
      expect(result.skin.id).toBe('sf8');
    });

    it('购买事务内锁用户行，避免并发重复扣款', async () => {
      await skinService.purchase(100001, 'sf3');
      expect(User.findByPk).toHaveBeenCalledWith(100001, expect.objectContaining({ lock: 'UPDATE' }));
    });

    it('所有权由服务端写入偏好', async () => {
      const row = prefRow({ owned: {}, using: {} });
      UserPref.findOne.mockResolvedValue(row);
      await skinService.purchase(100001, 'sf3');
      const written = JSON.parse(row.update.mock.calls[0][0].data);
      expect(written.skinShop.owned.frame_sf3).toBe(true);
      expect(written.skinShop.using).toEqual({ frame_sf3: true });
    });

    it('任何购买都过 Lv.45 门槛（改造前 spend=0 会跳过）', async () => {
      levelService.requireLevel.mockRejectedValue(Object.assign(
        new Error('等级不足：解锁装扮商城需要 Lv.45（当前 Lv.3）'),
        { code: 'LEVEL_NOT_ENOUGH', needLevel: 45 }
      ));
      await expect(skinService.purchase(100001, 'sf3')).rejects.toThrow('Lv.45');
      expect(User.decrement).not.toHaveBeenCalled();
      expect(UserPref.findOne).not.toHaveBeenCalled();
    });

    it('目录外的 skinId 直接拒绝，不开事务', async () => {
      await expect(skinService.purchase(100001, 'admin_free_skin')).rejects.toThrow('装扮不存在或已下架');
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('VIP 门槛在扣款之前判定', async () => {
      User.findByPk.mockResolvedValue(userOf({ vip: 1, vip_lv: 2, vip_expire_time: 0 }));
      const error = await skinService.purchase(100001, 'sf8').catch((e) => e);
      expect(error.code).toBe('SKIN_VIP_REQUIRED');
      expect(User.decrement).not.toHaveBeenCalled();
    });

    it('VIP 到期后按非 VIP 处理', async () => {
      const expired = Math.floor(Date.now() / 1000) - 60;
      User.findByPk.mockResolvedValue(userOf({ vip: 1, vip_lv: 4, vip_expire_time: expired }));
      const error = await skinService.purchase(100001, 'sf8').catch((e) => e);
      expect(error.code).toBe('SKIN_VIP_REQUIRED');
    });

    it('余额不足：条件扣减未命中则整体回滚且不写所有权', async () => {
      User.decrement.mockResolvedValue([[null, 0]]);
      const row = prefRow({ owned: {}, using: {} });
      UserPref.findOne.mockResolvedValue(row);
      const error = await skinService.purchase(100001, 'sf8').catch((e) => e);
      expect(error.code).toBe('INSUFFICIENT_BALANCE');
      expect(row.update).not.toHaveBeenCalled();
      expect(UserPref.create).not.toHaveBeenCalled();
    });

    it('已拥有则幂等：不再扣款，只切换使用中', async () => {
      UserPref.findOne.mockResolvedValue(prefRow({ owned: { frame_sf8: true }, using: {} }, {}));
      User.findByPk.mockResolvedValue(userOf({ vip: 1, vip_lv: 4 }));
      const result = await skinService.purchase(100001, 'sf8');
      expect(result.charged).toBe(0);
      expect(result.alreadyOwned).toBe(true);
      expect(User.decrement).not.toHaveBeenCalled();
    });

    it('免费装扮：领取不扣款但仍需门槛', async () => {
      const result = await skinService.purchase(100001, 'sf1');
      expect(User.decrement).not.toHaveBeenCalled();
      expect(result.charged).toBe(0);
      expect(levelService.requireLevel).toHaveBeenCalledWith(100001, 'skin_shop');
    });
  });

  describe('use', () => {
    it('未拥有不能通过切换白拿', async () => {
      const error = await skinService.use(100001, 'sf8').catch((e) => e);
      expect(error.code).toBe('SKIN_NOT_OWNED');
      expect(User.decrement).not.toHaveBeenCalled();
    });

    it('切换已拥有的装扮：不扣款，使用中位唯一', async () => {
      const row = prefRow({ owned: { frame_sf2: true, frame_sf3: true }, using: { frame_sf2: true } });
      UserPref.findOne.mockResolvedValue(row);
      const result = await skinService.use(100001, 'sf3');
      expect(result.charged).toBe(0);
      expect(User.decrement).not.toHaveBeenCalled();
      expect(JSON.parse(row.update.mock.calls[0][0].data).skinShop.using).toEqual({ frame_sf3: true });
    });

    it('免费装扮无需购买记录即可使用', async () => {
      const result = await skinService.use(100001, 'sbbl1');
      expect(result.skin.key).toBe('bubble_sbbl1');
    });
  });

  describe('sanitizeState', () => {
    it('丢弃目录外的伪造键与非使用中归属', () => {
      const state = skinService.sanitizeState({
        owned: { frame_sf8: true, hacked_skin: true, badge_sb1: 1, frame_nope: true },
        using: { hacked_skin: true, frame_sf3: true }
      });
      expect(state.owned).toEqual({ frame_sf8: true, badge_sb1: true });
      // using 里的 frame_sf3 并未拥有 → 一并丢弃
      expect(state.using).toEqual({});
    });

    it('空值/坏结构返回干净状态', () => {
      expect(skinService.sanitizeState(undefined)).toEqual({ owned: {}, using: {} });
      expect(skinService.sanitizeState('string')).toEqual({ owned: {}, using: {} });
      expect(skinService.sanitizeState({ owned: null })).toEqual({ owned: {}, using: {} });
    });
  });
});
