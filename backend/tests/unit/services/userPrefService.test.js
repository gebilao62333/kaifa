// P2-7：编辑资料扩展字段（xn_user_pref.data.profileExtra）读写的边界与可见性回归
jest.mock('../../../src/models', () => ({
  UserPref: { findOne: jest.fn(), create: jest.fn() }
}));
jest.mock('../../../src/config/mysql', () => ({
  transaction: jest.fn()
}));
jest.mock('../../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

const { UserPref } = require('../../../src/models');
const sequelize = require('../../../src/config/mysql');
const service = require('../../../src/services/userPrefService');

const makeTx = () => ({ commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) });
const rowWith = (data) => ({ data: JSON.stringify(data), update: jest.fn().mockResolvedValue(true) });

describe('userPrefService（P2-7 profileExtra）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(makeTx());
  });

  describe('normalizeProfileExtra 边界夹取', () => {
    it('空/非对象输入返回全部字段的默认值', () => {
      const expected = {
        birthday: '', height: null, profession: '', hobbies: [], games: [], price: null,
        bgImage: '', tags: [], wechat: '', email: ''
      };
      expect(service.normalizeProfileExtra(null)).toEqual(expected);
      expect(service.normalizeProfileExtra('bad')).toEqual(expected);
      expect(service.normalizeProfileExtra([])).toEqual(expected);
    });

    it('生日只接受合法 YYYY-MM-DD，身高/价格越界一律置空', () => {
      const extra = service.normalizeProfileExtra({
        birthday: '1999/01/02',
        height: 999,
        price: 12.345
      });
      expect(extra.birthday).toBe('');
      expect(extra.height).toBeNull();
      expect(extra.price).toBe(12.35);
      expect(service.normalizeProfileExtra({ birthday: '1999-01-02' }).birthday).toBe('1999-01-02');
      expect(service.normalizeProfileExtra({ height: 172 }).height).toBe(172);
      expect(service.normalizeProfileExtra({ height: 'abc' }).height).toBeNull();
    });

    it('数组字段去重/去空/截断，标签只保留正整数', () => {
      const extra = service.normalizeProfileExtra({
        hobbies: ['游戏', '游戏', '  ', '音乐', 123],
        games: '王者荣耀',
        tags: [1, '2', 2, -1, 0, 'x', 3.5]
      });
      expect(extra.hobbies).toEqual(['游戏', '音乐']);
      expect(extra.games).toEqual([]);
      expect(extra.tags).toEqual([1, 2]);
    });

    it('字符串字段去空格并截断到上限，同时丢弃未知字段', () => {
      const extra = service.normalizeProfileExtra({
        profession: '  ' + 'x'.repeat(80),
        wechat: '  wx_abc  ',
        email: '  a@b.com ',
        unknown: 'should-not-pass'
      });
      expect(extra.profession).toHaveLength(service.LIMITS.profession);
      expect(extra.wechat).toBe('wx_abc');
      expect(extra.email).toBe('a@b.com');
      expect(extra.unknown).toBeUndefined();
      expect(Object.keys(extra).sort()).toEqual([...service.PROFILE_EXTRA_FIELDS].sort());
    });
  });

  describe('profileExtraForViewer 可见性分级', () => {
    const extra = { birthday: '1999-01-02', wechat: 'wx1', email: 'e@x.com', hobbies: ['游戏'] };

    it('本人可见 wechat/email', () => {
      const result = service.profileExtraForViewer(extra, true);
      expect(result.wechat).toBe('wx1');
      expect(result.email).toBe('e@x.com');
      expect(result.birthday).toBe('1999-01-02');
    });

    it('他人只能拿到公开字段（不含 wechat/email）', () => {
      const result = service.profileExtraForViewer(extra, false);
      expect(result).not.toHaveProperty('wechat');
      expect(result).not.toHaveProperty('email');
      expect(result.birthday).toBe('1999-01-02');
      expect(result.hobbies).toEqual(['游戏']);
    });
  });

  describe('读取 <-> 保存', () => {
    it('读取解析 profileExtra，坏 JSON/异常降级为空默认值', async () => {
      UserPref.findOne.mockResolvedValue(rowWith({ profileExtra: { birthday: '1999-01-02', wechat: 'wx1' } }));
      const extra = await service.getProfileExtra(9);
      expect(extra.birthday).toBe('1999-01-02');
      expect(extra.wechat).toBe('wx1');

      UserPref.findOne.mockResolvedValue({ data: '{bad json' });
      await expect(service.getProfileExtra(9)).resolves.toMatchObject({ birthday: '', hobbies: [] });

      UserPref.findOne.mockRejectedValue(new Error('db down'));
      await expect(service.getProfileExtra(9)).resolves.toMatchObject({ birthday: '', wechat: '' });
    });

    it('保存只合并显式提交的字段，保留既有 profileExtra 与同一 JSON 中的其他偏好', async () => {
      const row = rowWith({
        skinShop: { using: { badge: 'sb1' } },
        profileExtra: { birthday: '1999-01-02', profession: '工程师' }
      });
      UserPref.findOne.mockResolvedValue(row);

      const merged = await service.saveProfileExtra(9, { height: 172 });

      expect(merged.birthday).toBe('1999-01-02');
      expect(merged.profession).toBe('工程师');
      expect(merged.height).toBe(172);
      expect(row.update).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(row.update.mock.calls[0][0].data);
      expect(payload.skinShop).toEqual({ using: { badge: 'sb1' } });
      expect(payload.profileExtra.height).toBe(172);
      expect(payload.profileExtra.birthday).toBe('1999-01-02');
    });

    it('无偏好行时建新行（不覆盖其他偏好键）', async () => {
      UserPref.findOne.mockResolvedValue(null);
      UserPref.create.mockResolvedValue({});
      await service.saveProfileExtra(9, { email: 'a@b.com' });
      expect(UserPref.create).toHaveBeenCalledTimes(1);
      const created = UserPref.create.mock.calls[0][0];
      expect(created.user_id).toBe(9);
      expect(JSON.parse(created.data).profileExtra.email).toBe('a@b.com');
    });

    it('事务失败时回滚并抛出，不吞错', async () => {
      const tx = makeTx();
      sequelize.transaction.mockResolvedValue(tx);
      UserPref.findOne.mockRejectedValue(new Error('write failed'));
      await expect(service.saveProfileExtra(9, { height: 170 })).rejects.toThrow('write failed');
      expect(tx.rollback).toHaveBeenCalled();
      expect(tx.commit).not.toHaveBeenCalled();
    });
  });
});
