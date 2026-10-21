// P2-7：authService 对 profileExtra 的写入与「公开/私密字段」分级下发回归
jest.mock('../../../src/services/smsService', () => ({
  SMS_SCENES: ['login', 'register', 'reset'],
  verifyCode: jest.fn(),
  sendSMS: jest.fn()
}));
jest.mock('../../../src/models', () => ({
  User: { findByPk: jest.fn(), update: jest.fn() },
  UserFollow: { findOne: jest.fn() },
  UserPref: { findOne: jest.fn(), create: jest.fn() }
}));
jest.mock('../../../src/config/jwt', () => ({
  generateToken: jest.fn(),
  generateTokenPair: jest.fn(() => ({ accessToken: 'access', refreshToken: 'refresh' })),
  verifyToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  TOKEN_TYPES: { ACCESS: 'access', REFRESH: 'refresh', ADMIN: 'admin', ADMIN_REFRESH: 'admin_refresh' }
}));
jest.mock('../../../src/services/tokenRevocation', () => ({
  checkRevocation: jest.fn(),
  revocationFailMode: jest.fn()
}));
jest.mock('../../../src/config/mysql', () => ({
  transaction: jest.fn()
}));

const { User, UserFollow, UserPref } = require('../../../src/models');
const sequelize = require('../../../src/config/mysql');
const authService = require('../../../src/services/authService');

const makeTx = () => ({ commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) });
const makeUser = (overrides = {}) => ({
  id: 1,
  nickname: '老王',
  avatar: 'https://cdn/avatar.png',
  city: '杭州',
  lv: 6,
  vip: 1,
  vip_lv: 2,
  score: 10,
  fans_num: 3,
  sex: 1,
  dec: '签名',
  money: 100,
  gift_money: 5,
  mobile: '',
  ...overrides
});
const prefRow = (profileExtra) => ({
  data: JSON.stringify({ profileExtra }),
  update: jest.fn().mockResolvedValue(true)
});

describe('authService profileExtra（P2-7）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(makeTx());
    UserFollow.findOne.mockResolvedValue(null);
    User.update.mockResolvedValue([1]);
  });

  describe('getUserInfo 可见性分级', () => {
    const extra = {
      birthday: '1999-01-02',
      height: 172,
      profession: '工程师',
      hobbies: ['游戏', '音乐'],
      games: ['王者荣耀'],
      bgImage: 'https://cdn/bg.png',
      tags: [1, 3],
      wechat: 'wx_abc',
      email: 'a@b.com'
    };

    it('本人查看自己：公开字段 + wechat/email 全部下发', async () => {
      User.findByPk.mockResolvedValue(makeUser());
      UserPref.findOne.mockResolvedValue(prefRow(extra));

      const info = await authService.getUserInfo(1, 1);

      expect(info.profileExtra.birthday).toBe('1999-01-02');
      expect(info.profileExtra.hobbies).toEqual(['游戏', '音乐']);
      expect(info.profileExtra.wechat).toBe('wx_abc');
      expect(info.profileExtra.email).toBe('a@b.com');
      // 余额只对本人可见（既有口径不被破坏）
      expect(info.balance).toBe(100);
    });

    it('查看他人：公开字段可见，wechat/email 不下发', async () => {
      User.findByPk.mockResolvedValue(makeUser());
      UserPref.findOne.mockResolvedValue(prefRow(extra));

      const info = await authService.getUserInfo(2, 1);

      expect(info.profileExtra.birthday).toBe('1999-01-02');
      expect(info.profileExtra.games).toEqual(['王者荣耀']);
      expect(info.profileExtra).not.toHaveProperty('wechat');
      expect(info.profileExtra).not.toHaveProperty('email');
      expect(info.balance).toBeUndefined();
    });

    it('用户没有偏好行时下发空默认值，不抛错', async () => {
      User.findByPk.mockResolvedValue(makeUser());
      UserPref.findOne.mockResolvedValue(null);

      const info = await authService.getUserInfo(1, 1);

      expect(info.profileExtra).toMatchObject({ birthday: '', height: null, hobbies: [], tags: [], wechat: '' });
    });

    it('偏好读取异常时降级为空默认值，不影响资料主流程', async () => {
      User.findByPk.mockResolvedValue(makeUser());
      UserPref.findOne.mockRejectedValue(new Error('db down'));

      const info = await authService.getUserInfo(2, 1);
      expect(info.profileExtra).toMatchObject({ birthday: '', hobbies: [] });
      expect(info.nickname).toBe('老王');
    });
  });

  describe('updateUserInfo 写入 profileExtra', () => {
    it('基础字段仍走 xn_user 白名单，扩展字段写入偏好 JSON', async () => {
      UserPref.findOne.mockResolvedValue(null);
      UserPref.create.mockResolvedValue({});

      await authService.updateUserInfo(1, {
        nickname: ' 新昵称 ',
        city: '上海',
        sex: 2,
        profileExtra: {
          birthday: '2000-02-03',
          height: 180,
          hobbies: ['旅行'],
          tags: [2, 4],
          wechat: 'wx_new',
          email: 'new@b.com'
        }
      });

      expect(User.update).toHaveBeenCalledWith(
        { nickname: ' 新昵称 ', city: '上海', sex: 2 },
        { where: { id: 1 } }
      );
      expect(UserPref.create).toHaveBeenCalledTimes(1);
      const created = UserPref.create.mock.calls[0][0];
      const payload = JSON.parse(created.data);
      expect(payload.profileExtra.birthday).toBe('2000-02-03');
      expect(payload.profileExtra.height).toBe(180);
      expect(payload.profileExtra.tags).toEqual([2, 4]);
      expect(payload.profileExtra.wechat).toBe('wx_new');
      // 未知顶层字段不会漏进 xn_user
      expect(User.update.mock.calls[0][0].profileExtra).toBeUndefined();
    });

    it('兼容 JSON 字符串形式的 profileExtra', async () => {
      UserPref.findOne.mockResolvedValue(null);
      UserPref.create.mockResolvedValue({});

      await authService.updateUserInfo(1, {
        nickname: '老王',
        profileExtra: JSON.stringify({ profession: '设计师' })
      });

      const payload = JSON.parse(UserPref.create.mock.calls[0][0].data);
      expect(payload.profileExtra.profession).toBe('设计师');
    });

    it('未提交/非法 profileExtra 时不写偏好，只更新基础字段', async () => {
      await authService.updateUserInfo(1, { nickname: '老王' });
      expect(UserPref.findOne).not.toHaveBeenCalled();
      expect(UserPref.create).not.toHaveBeenCalled();

      await authService.updateUserInfo(1, { nickname: '老王', profileExtra: 'not-json' });
      expect(UserPref.create).not.toHaveBeenCalled();

      await authService.updateUserInfo(1, { nickname: '老王', profileExtra: [1, 2, 3] });
      expect(UserPref.create).not.toHaveBeenCalled();
    });

    it('只提交 profileExtra 时不执行空的基础字段 UPDATE', async () => {
      UserPref.findOne.mockResolvedValue(null);
      UserPref.create.mockResolvedValue({});

      await authService.updateUserInfo(1, { profileExtra: { profession: '设计师' } });

      expect(User.update).not.toHaveBeenCalled();
      expect(UserPref.create).toHaveBeenCalledTimes(1);
    });

    it('只提交部分扩展字段时保留已有值（不清空其他字段）', async () => {
      const row = prefRow({ birthday: '1999-01-02', profession: '工程师' });
      UserPref.findOne.mockResolvedValue(row);

      await authService.updateUserInfo(1, { profileExtra: { height: 175 } });

      const payload = JSON.parse(row.update.mock.calls[0][0].data);
      expect(payload.profileExtra.height).toBe(175);
      expect(payload.profileExtra.birthday).toBe('1999-01-02');
      expect(payload.profileExtra.profession).toBe('工程师');
    });
  });
});
