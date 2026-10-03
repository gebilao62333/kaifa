const userController = require('../../../src/controllers/user');

jest.mock('../../../src/services', () => ({
  authService: {
    loginWithPassword: jest.fn(),
    register: jest.fn(),
    loginWithMobile: jest.fn(),
    loginWithThird: jest.fn(),
    getUserInfo: jest.fn(),
    updateUserInfo: jest.fn(),
    followUser: jest.fn(),
    refreshToken: jest.fn()
  },
  smsService: { sendSMS: jest.fn(), verifyCode: jest.fn() }
}));

jest.mock('../../../src/models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), decrement: jest.fn(), findAndCountAll: jest.fn() },
  Post: { findAll: jest.fn() },
  PostLike: { findAll: jest.fn() },
  UserFollow: { findAndCountAll: jest.fn(), findOne: jest.fn() },
  UserVisit: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  UserPref: { findOne: jest.fn(), create: jest.fn() }
}));

jest.mock('../../../src/config/jwt', () => ({ generateToken: jest.fn(() => 'token') }));
jest.mock('../../../src/config/mysql', () => ({
  transaction: jest.fn(() => Promise.resolve({ commit: jest.fn(), rollback: jest.fn(), finished: false })),
  literal: jest.fn((s) => s)
}));

const { authService, smsService } = require('../../../src/services');
const sequelize = require('../../../src/config/mysql');
const { User, Post, PostLike, UserFollow, UserVisit, UserPref } = require('../../../src/models');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - User', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 审计 B-04：savePref 改为事务内条件扣减
    sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn(), finished: false });
  });

  describe('login', () => {
    it('rejects missing account/password', async () => {
      const res = mockRes();
      await userController.login(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('accepts mobile alias', async () => {
      authService.loginWithPassword.mockResolvedValue({ token: 't' });
      const res = mockRes();
      await userController.login(mockReq({ body: { mobile: '13800000000', password: 'p' } }), res);
      expect(authService.loginWithPassword).toHaveBeenCalledWith('13800000000', 'p');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('maps 用户不存在 to 422', async () => {
      authService.loginWithPassword.mockRejectedValue(new Error('用户不存在'));
      const res = mockRes();
      await userController.login(mockReq({ body: { username: 'u', password: 'p' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('maps 密码错误 to 422', async () => {
      authService.loginWithPassword.mockRejectedValue(new Error('密码错误'));
      const res = mockRes();
      await userController.login(mockReq({ body: { username: 'u', password: 'p' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('maps 该用户未设置密码 to 422', async () => {
      authService.loginWithPassword.mockRejectedValue(new Error('该用户未设置密码'));
      const res = mockRes();
      await userController.login(mockReq({ body: { username: 'u', password: 'p' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('maps unknown error to 500', async () => {
      authService.loginWithPassword.mockRejectedValue(new Error('boom'));
      const res = mockRes();
      await userController.login(mockReq({ body: { username: 'u', password: 'p' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('register', () => {
    it('rejects missing fields', async () => {
      const res = mockRes();
      await userController.register(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid phone', async () => {
      const res = mockRes();
      await userController.register(mockReq({ body: { phone: '123', password: 'abcdef', code: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid password length', async () => {
      const res = mockRes();
      await userController.register(mockReq({ body: { phone: '13800000000', password: 'abc', code: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);

      const res2 = mockRes();
      await userController.register(mockReq({ body: { phone: '13800000000', password: 'abcdefghijklmnopq', code: '1' } }), res2);
      expect(res2.status).toHaveBeenCalledWith(400);
    });

    it('registers successfully', async () => {
      authService.register.mockResolvedValue({ token: 't' });
      const res = mockRes();
      await userController.register(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);
      expect(authService.register).toHaveBeenCalledWith('13800000000', 'abcdef', '用户0000');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('maps error to 422', async () => {
      authService.register.mockRejectedValue(new Error('已注册'));
      const res = mockRes();
      await userController.register(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      smsService.verifyCode.mockResolvedValue(true);
    });

    it('rejects missing fields and bad length', async () => {
      const missing = mockRes();
      await userController.resetPassword(mockReq({ body: {} }), missing);
      expect(missing.status).toHaveBeenCalledWith(400);

      const short = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'a', code: '1' } }), short);
      expect(short.status).toHaveBeenCalledWith(400);
    });

    it('拒绝未通过短信验证码的重置（账户接管防护）', async () => {
      smsService.verifyCode.mockRejectedValue(new Error('验证码错误'));
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '000000' } }), res);
      expect(smsService.verifyCode).toHaveBeenCalledWith('13800000000', '000000');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('验证码服务不可用时返回 503 而不是放行', async () => {
      smsService.verifyCode.mockRejectedValue(new Error('短信服务不可用'));
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '000000' } }), res);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('returns 404 when user missing', async () => {
      User.findOne.mockResolvedValue(null);
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('resets password successfully', async () => {
      const update = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue({ id: 1, update });
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);
      expect(update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on unexpected error', async () => {
      User.findOne.mockRejectedValue(new Error('boom'));
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserInfo / updateUserInfo', () => {
    it('getUserInfo uses query userId when present', async () => {
      authService.getUserInfo.mockResolvedValue({ id: 2 });
      const res = mockRes();
      await userController.getUserInfo(mockReq({ query: { userId: '2' } }), res);
      expect(authService.getUserInfo).toHaveBeenCalledWith(100001, '2');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getUserInfo defaults to own id and maps error', async () => {
      authService.getUserInfo.mockResolvedValue({});
      const ok = mockRes();
      await userController.getUserInfo(mockReq(), ok);
      expect(authService.getUserInfo).toHaveBeenCalledWith(100001, 100001);

      authService.getUserInfo.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.getUserInfo(mockReq(), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });

    it('updateUserInfo succeeds and maps error', async () => {
      authService.updateUserInfo.mockResolvedValue(true);
      const ok = mockRes();
      await userController.updateUserInfo(mockReq({ body: { nickname: 'n' } }), ok);
      expect(authService.updateUserInfo).toHaveBeenCalledWith(100001, { nickname: 'n' });
      expect(ok.status).toHaveBeenCalledWith(200);

      authService.updateUserInfo.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.updateUserInfo(mockReq(), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });
  });

  describe('sendSms', () => {
    it('rejects invalid phone', async () => {
      const res = mockRes();
      await userController.sendSms(mockReq({ body: { phone: '123' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns code when service returns one', async () => {
      smsService.sendSMS.mockResolvedValue({ code: '1234' });
      const res = mockRes();
      await userController.sendSms(mockReq({ body: { mobile: '13800000000' } }), res);
      expect(smsService.sendSMS).toHaveBeenCalledWith('13800000000');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data).toEqual({ code: '1234' });
    });

    it('returns empty data when service returns no code', async () => {
      smsService.sendSMS.mockResolvedValue({});
      const res = mockRes();
      await userController.sendSms(mockReq({ body: { phone: '13800000000' } }), res);
      expect(res.json.mock.calls[0][0].data).toEqual({});
    });

    it('maps error to 422', async () => {
      smsService.sendSMS.mockRejectedValue(new Error('sms down'));
      const res = mockRes();
      await userController.sendSms(mockReq({ body: { phone: '13800000000' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('loginMobile / loginThird', () => {
    it('loginMobile rejects missing fields', async () => {
      const res = mockRes();
      await userController.loginMobile(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('loginMobile succeeds', async () => {
      authService.loginWithMobile.mockResolvedValue({ token: 't' });
      const res = mockRes();
      await userController.loginMobile(mockReq({ body: { phone: '13800000000', code: '1', deviceId: 'd', platform: 'ios' } }), res);
      expect(authService.loginWithMobile).toHaveBeenCalledWith('13800000000', '1', 'd', 'ios');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('loginMobile maps error to 422', async () => {
      authService.loginWithMobile.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await userController.loginMobile(mockReq({ body: { mobile: '13800000000', code: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('loginThird rejects missing fields', async () => {
      const res = mockRes();
      await userController.loginThird(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('loginThird succeeds and maps error', async () => {
      authService.loginWithThird.mockResolvedValue({ token: 't' });
      const ok = mockRes();
      await userController.loginThird(mockReq({ body: { type: 'wx', code: 'c' } }), ok);
      expect(authService.loginWithThird).toHaveBeenCalledWith('wx', 'c', undefined, undefined);
      expect(ok.status).toHaveBeenCalledWith(200);

      authService.loginWithThird.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.loginThird(mockReq({ body: { type: 'wx', code: 'c' } }), err);
      expect(err.status).toHaveBeenCalledWith(422);
    });
  });

  describe('follow / list endpoints', () => {
    it('follow rejects missing target and succeeds both actions', async () => {
      const bad = mockRes();
      await userController.follow(mockReq({ body: {} }), bad);
      expect(bad.status).toHaveBeenCalledWith(400);

      authService.followUser.mockResolvedValue(true);
      const on = mockRes();
      await userController.follow(mockReq({ body: { targetUserId: 2 } }), on);
      expect(authService.followUser).toHaveBeenCalledWith(100001, 2, 1);
      expect(on.json).toHaveBeenCalledWith(expect.objectContaining({ message: '关注成功' }));

      const off = mockRes();
      await userController.follow(mockReq({ body: { targetUserId: 2, action: 0 } }), off);
      expect(authService.followUser).toHaveBeenCalledWith(100001, 2, 0);
      expect(off.json).toHaveBeenCalledWith(expect.objectContaining({ message: '取消关注成功' }));
    });

    it('follow maps error to 422', async () => {
      authService.followUser.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await userController.follow(mockReq({ body: { targetUserId: 2 } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('getFans maps followers', async () => {
      UserFollow.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ follower_id: 5 }] });
      User.findByPk.mockResolvedValue({ id: 5, nickname: 'n', avatar: 'a', lv: 3 });
      UserFollow.findOne.mockResolvedValue({ id: 1 });
      const res = mockRes();
      await userController.getFans(mockReq({ query: { page: '1', pageSize: '10' } }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data.total).toBe(1);
      expect(data.list[0]).toEqual({ userId: 5, nickname: 'n', avatar: 'a', level: 3, isFollow: true });
    });

    it('getFans handles missing users and errors', async () => {
      UserFollow.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      const ok = mockRes();
      await userController.getFans(mockReq({ query: {} }), ok);
      expect(ok.status).toHaveBeenCalledWith(200);

      UserFollow.findAndCountAll.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.getFans(mockReq({ query: {} }), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });

    it('getFollows maps following users', async () => {
      UserFollow.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ following_id: 7 }] });
      User.findByPk.mockResolvedValue(null);
      UserFollow.findOne.mockResolvedValue(null);
      const res = mockRes();
      await userController.getFollows(mockReq({ query: { userId: '5' } }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data.list[0]).toEqual({ userId: undefined, nickname: '', avatar: '', level: 1, isFollow: false });
    });

    it('getFollows maps error to 500', async () => {
      UserFollow.findAndCountAll.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await userController.getFollows(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('checkFollow handles missing, found, not found and error', async () => {
      const bad = mockRes();
      await userController.checkFollow(mockReq({ query: {} }), bad);
      expect(bad.status).toHaveBeenCalledWith(400);

      UserFollow.findOne.mockResolvedValue({ id: 1 });
      const found = mockRes();
      await userController.checkFollow(mockReq({ query: { userId: '5' } }), found);
      expect(found.json.mock.calls[0][0].data).toEqual({ isFollowing: true });

      UserFollow.findOne.mockResolvedValue(null);
      const notFound = mockRes();
      await userController.checkFollow(mockReq({ query: { userId: '5' } }), notFound);
      expect(notFound.json.mock.calls[0][0].data).toEqual({ isFollowing: false });

      UserFollow.findOne.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.checkFollow(mockReq({ query: { userId: '5' } }), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });
  });

  describe('refreshToken', () => {
    it('rejects missing token', async () => {
      const res = mockRes();
      await userController.refreshToken(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('refreshes successfully', async () => {
      authService.refreshToken.mockResolvedValue({ accessToken: 'a' });
      const res = mockRes();
      await userController.refreshToken(mockReq({ body: { refreshToken: 'r' } }), res);
      expect(authService.refreshToken).toHaveBeenCalledWith('r');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('maps invalid token to 422 and other errors to 500', async () => {
      authService.refreshToken.mockRejectedValue(new Error('无效的refresh token'));
      const invalid = mockRes();
      await userController.refreshToken(mockReq({ body: { refreshToken: 'r' } }), invalid);
      expect(invalid.status).toHaveBeenCalledWith(422);

      authService.refreshToken.mockRejectedValue(new Error('boom'));
      const err = mockRes();
      await userController.refreshToken(mockReq({ body: { refreshToken: 'r' } }), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });
  });

  describe('real name', () => {
    it('submitRealName rejects missing fields and invalid id card', async () => {
      const missing = mockRes();
      await userController.submitRealName(mockReq({ body: {} }), missing);
      expect(missing.status).toHaveBeenCalledWith(400);

      const invalid = mockRes();
      await userController.submitRealName(mockReq({ body: { realName: '张三', idCard: '123', front: 'f', back: 'b' } }), invalid);
      expect(invalid.status).toHaveBeenCalledWith(400);
    });

    it('submitRealName returns 500 when user missing', async () => {
      User.findByPk.mockResolvedValue(null);
      const res = mockRes();
      await userController.submitRealName(mockReq({ body: { realName: '张三', idCard: '110101199001011234', front: 'f', back: 'b' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('submitRealName updates the user', async () => {
      const update = jest.fn().mockResolvedValue(true);
      User.findByPk.mockResolvedValue({ id: 100001, update });
      const res = mockRes();
      await userController.submitRealName(mockReq({ body: { realName: '张三', idCard: '110101199001011234', front: 'f', back: 'b' } }), res);
      expect(update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getRealNameStatus masks data and handles missing user', async () => {
      User.findByPk.mockResolvedValue({
        real_name_status: 1, real_name: '张三丰', id_card: '110101199001011234', real_name_time: 123
      });
      const ok = mockRes();
      await userController.getRealNameStatus(mockReq(), ok);
      const data = ok.json.mock.calls[0][0].data;
      expect(data.status).toBe(1);
      expect(data.realName).toBe('**丰');
      expect(data.idCard).toBe('110***********1234');
      expect(data.time).toBe(123);

      User.findByPk.mockResolvedValue(null);
      const missing = mockRes();
      await userController.getRealNameStatus(mockReq(), missing);
      expect(missing.status).toHaveBeenCalledWith(500);
    });

    it('getRealNameStatus handles empty fields and errors', async () => {
      User.findByPk.mockResolvedValue({});
      const ok = mockRes();
      await userController.getRealNameStatus(mockReq(), ok);
      const data = ok.json.mock.calls[0][0].data;
      expect(data).toEqual({ status: 0, realName: '', idCard: '', time: 0 });

      User.findByPk.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.getRealNameStatus(mockReq(), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getLikes / getVisitors', () => {
    it('getLikes returns empty when no posts', async () => {
      Post.findAll.mockResolvedValue([]);
      const res = mockRes();
      await userController.getLikes(mockReq(), res);
      expect(res.json.mock.calls[0][0].data).toEqual({ list: [], total: 0 });
    });

    it('getLikes maps likes with users', async () => {
      Post.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      PostLike.findAll.mockResolvedValue([{ user_id: 5, post_id: 1, create_time: 9 }]);
      User.findAll.mockResolvedValue([{ id: 5, nickname: 'n', avatar: 'a' }]);
      const res = mockRes();
      await userController.getLikes(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data.list[0]).toEqual({
        userId: 5, nickname: 'n', avatar: 'a', postId: 1, time: 9
      });
    });

    it('getLikes maps error to 500', async () => {
      Post.findAll.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await userController.getLikes(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('getVisitors maps visits and handles empty', async () => {
      UserVisit.findAll.mockResolvedValue([{ visitor_id: 5, create_time: 9 }]);
      User.findAll.mockResolvedValue([{ id: 5, nickname: 'n', avatar: 'a' }]);
      const ok = mockRes();
      await userController.getVisitors(mockReq(), ok);
      expect(ok.json.mock.calls[0][0].data.list[0]).toEqual({ userId: 5, nickname: 'n', avatar: 'a', time: 9 });

      UserVisit.findAll.mockResolvedValue([]);
      const empty = mockRes();
      await userController.getVisitors(mockReq(), empty);
      expect(empty.json.mock.calls[0][0].data.total).toBe(0);

      UserVisit.findAll.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.getVisitors(mockReq(), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });

    it('recordVisit rejects missing target', async () => {
      const res = mockRes();
      await userController.recordVisit(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('recordVisit no-ops for self', async () => {
      const res = mockRes();
      await userController.recordVisit(mockReq({ body: { targetUserId: 100001 } }), res);
      expect(UserVisit.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('recordVisit updates existing visit', async () => {
      const update = jest.fn().mockResolvedValue(true);
      UserVisit.findOne.mockResolvedValue({ id: 1, update });
      const res = mockRes();
      await userController.recordVisit(mockReq({ body: { targetUserId: '2' } }), res);
      expect(update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('recordVisit creates new visit and maps error', async () => {
      UserVisit.findOne.mockResolvedValue(null);
      UserVisit.create.mockResolvedValue({ id: 1 });
      const ok = mockRes();
      await userController.recordVisit(mockReq({ body: { targetUserId: 2 } }), ok);
      expect(UserVisit.create).toHaveBeenCalled();

      UserVisit.findOne.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.recordVisit(mockReq({ body: { targetUserId: 2 } }), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });
  });

  describe('preferences', () => {
    it('getPref handles no row, valid json and invalid json', async () => {
      UserPref.findOne.mockResolvedValue(null);
      const none = mockRes();
      await userController.getPref(mockReq(), none);
      expect(none.json.mock.calls[0][0].data).toEqual({ data: {} });

      UserPref.findOne.mockResolvedValue({ data: '{"theme":"dark"}' });
      const valid = mockRes();
      await userController.getPref(mockReq(), valid);
      expect(valid.json.mock.calls[0][0].data).toEqual({ data: { theme: 'dark' } });

      UserPref.findOne.mockResolvedValue({ data: 'not-json' });
      const invalid = mockRes();
      await userController.getPref(mockReq(), invalid);
      expect(invalid.json.mock.calls[0][0].data).toEqual({ data: {} });

      UserPref.findOne.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.getPref(mockReq(), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });

    it('savePref 条件扣减未命中（余额不足/用户不存在）返回 422', async () => {
      User.decrement.mockResolvedValue([0]);
      const res = mockRes();
      await userController.savePref(mockReq({ body: { spend: 10 } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('savePref 扣款使用原子条件更新（审计 B-04）', async () => {
      User.decrement.mockResolvedValue([1]);
      const res = mockRes();
      await userController.savePref(mockReq({ body: { spend: 10 } }), res);
      expect(User.decrement).toHaveBeenCalledWith('money', expect.objectContaining({
        by: 10,
        where: expect.objectContaining({ money: expect.anything() })
      }));
    });

    it('savePref deducts and updates existing row', async () => {
      User.decrement.mockResolvedValue([1]);
      const update = jest.fn().mockResolvedValue(true);
      User.findByPk.mockResolvedValue({ money: 90 });
      UserPref.findOne.mockResolvedValue({ data: '{"a":1}', update });
      const res = mockRes();
      await userController.savePref(mockReq({ body: { data: { b: 2 }, spend: 10 } }), res);

      expect(update).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].data).toEqual({ balance: 90 });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('savePref creates a new row without spend', async () => {
      UserPref.findOne.mockResolvedValue({ data: 'bad-json', update: jest.fn().mockResolvedValue(true) });
      User.findByPk.mockResolvedValue({ money: 1 });
      const res = mockRes();
      await userController.savePref(mockReq({ body: { data: { c: 3 } } }), res);
      // 坏 JSON 被忽略，行已存在则走 update
      expect(res.status).toHaveBeenCalledWith(200);

      UserPref.findOne.mockResolvedValue(null);
      UserPref.create.mockResolvedValue({ id: 1 });
      const created = mockRes();
      await userController.savePref(mockReq({ body: { data: { d: 4 } } }), created);
      expect(UserPref.create).toHaveBeenCalled();
      expect(created.status).toHaveBeenCalledWith(200);
    });

    it('savePref maps error to 500', async () => {
      UserPref.findOne.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await userController.savePref(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
