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
    refreshToken: jest.fn(),
    changePassword: jest.fn()
  },
  smsService: {
    sendSMS: jest.fn(),
    verifyCode: jest.fn(),
    SMS_SCENES: ['login', 'register', 'reset']
  },
  levelService: {
    getInfo: jest.fn(),
    checkIn: jest.fn(),
    requireLevel: jest.fn(),
    canUse: jest.fn()
  },
  // 审计 H-6：装扮目录/所有权/扣款改由 skinService 负责，控制器只做参数与错误映射
  skinService: {
    STATE_KEY: 'skinShop',
    listForUser: jest.fn(),
    purchase: jest.fn(),
    use: jest.fn(),
    sanitizeState: jest.fn((state) => state),
    isBusinessError: jest.fn(() => false)
  }
}));

jest.mock('../../../src/models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), decrement: jest.fn(), findAndCountAll: jest.fn() },
  Post: { findAll: jest.fn() },
  PostLike: { findAll: jest.fn() },
  UserFollow: { findAndCountAll: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
  UserVisit: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  UserPref: { findOne: jest.fn(), create: jest.fn() }
}));

jest.mock('../../../src/config/mysql', () => ({
  transaction: jest.fn(() => Promise.resolve({ commit: jest.fn(), rollback: jest.fn(), finished: false })),
  literal: jest.fn((s) => s)
}));

// 审计 H-5：控制器现在会调用吊销服务，本文件统一给「可确认且成功」的默认值，
// 需要测失败分支的用例各自覆盖。
jest.mock('../../../src/services/tokenRevocation', () => ({
  revokeToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  revocationFailMode: jest.fn()
}));
// 登出接口要用 verifyToken + TOKEN_TYPES 判断 refresh 令牌的归属
jest.mock('../../../src/config/jwt', () => ({
  verifyToken: jest.fn(),
  TOKEN_TYPES: { ACCESS: 'access', REFRESH: 'refresh', ADMIN: 'admin', ADMIN_REFRESH: 'admin_refresh' }
}));

const { authService, smsService, levelService, skinService } = require('../../../src/services');
const sequelize = require('../../../src/config/mysql');
const { User, Post, PostLike, UserFollow, UserVisit, UserPref } = require('../../../src/models');
const tokenRevocation = require('../../../src/services/tokenRevocation');
const { verifyToken } = require('../../../src/config/jwt');

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
    // 审计 B-04/H-6：控制器层的偏好写仍在事务内做读-改-写；扣减已移入 skinService.purchase
    sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn(), finished: false });
    // 审计 H-5：吊销默认「可确认 + 写入成功」
    tokenRevocation.revokeToken.mockResolvedValue({ ok: true, verifiable: true, revoked: true, reason: 'revoked', ttl: 60 });
    tokenRevocation.revokeAllUserTokens.mockResolvedValue({ ok: true, verifiable: true, revoked: true, reason: 'revoked-all', issuedBefore: 1 });
    tokenRevocation.revocationFailMode.mockReturnValue('open');
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

    it.each(['用户不存在', '密码错误', '该用户未设置密码'])(
      '凭证类失败统一为同一 422 与同一文案（消除账号枚举）：%s',
      async (reason) => {
        authService.loginWithPassword.mockRejectedValue(new Error(reason));
        const res = mockRes();
        await userController.login(mockReq({ body: { username: 'u', password: 'p' } }), res);
        expect(res.status).toHaveBeenCalledWith(422);
        const body = res.json.mock.calls[0][0];
        expect(body.message).toBe('手机号或密码错误');
        // 不再按字段（phone/password）区分，否则仍能借字段定位枚举账号是否存在
        expect(body.errors).toEqual({});
      }
    );

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
      expect(authService.register).toHaveBeenCalledWith('13800000000', 'abcdef', '用户0000', '1');
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
      expect(smsService.verifyCode).toHaveBeenCalledWith('13800000000', '000000', 'reset');
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

    it('重置口令前先让旧会话全部作废（审计 H-5）', async () => {
      const update = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue({ id: 1, update });
      await userController.resetPassword(
        mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }),
        mockRes()
      );

      expect(tokenRevocation.revokeAllUserTokens).toHaveBeenCalledWith(1);
      expect(tokenRevocation.revokeAllUserTokens.mock.invocationCallOrder[0])
        .toBeLessThan(update.mock.invocationCallOrder[0]);
    });

    it('生产吊销状态无法确认时不改口令，回 503（避免「密码已换、旧令牌照常能用」的中间态）', async () => {
      const update = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue({ id: 1, update });
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      tokenRevocation.revokeAllUserTokens.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(update).not.toHaveBeenCalled();
    });

    // 本地/CI 常常没有 Redis：非生产按 fail-open 走完重置流程，否则「重置密码」在开发环境直接不可用
    it('非生产吊销失败仍完成重置，devicesRevoked=false', async () => {
      const update = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue({ id: 1, update });
      tokenRevocation.revokeAllUserTokens.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);

      expect(update).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].data).toEqual({ devicesRevoked: false });
    });

    it('returns 500 on unexpected error', async () => {
      User.findOne.mockRejectedValue(new Error('boom'));
      const res = mockRes();
      await userController.resetPassword(mockReq({ body: { phone: '13800000000', password: 'abcdef', code: '1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('changePassword（已登录改密）', () => {
    it('rejects missing fields', async () => {
      const res = mockRes();
      await userController.changePassword(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects bad new password length or same password', async () => {
      const short = mockRes();
      await userController.changePassword(mockReq({ body: { oldPassword: 'oldpwd1', newPassword: '123' } }), short);
      expect(short.status).toHaveBeenCalledWith(422);

      const same = mockRes();
      await userController.changePassword(mockReq({ body: { oldPassword: 'abcdef', newPassword: 'abcdef' } }), same);
      expect(same.status).toHaveBeenCalledWith(422);
    });

    it('changes password with the authenticated user id', async () => {
      authService.changePassword.mockResolvedValue({ devicesRevoked: true });
      const res = mockRes();
      await userController.changePassword(mockReq({ body: { oldPassword: 'oldpwd1', newPassword: 'newpwd1' } }), res);
      expect(authService.changePassword).toHaveBeenCalledWith(100001, 'oldpwd1', 'newpwd1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data).toEqual({ devicesRevoked: true });
    });

    it('maps wrong old password to 400', async () => {
      authService.changePassword.mockRejectedValue(new Error('原密码错误'));
      const res = mockRes();
      await userController.changePassword(mockReq({ body: { oldPassword: 'badpwd', newPassword: 'newpwd1' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toBe('原密码错误');
    });

    it('returns 503 when revocation state cannot be confirmed (fail-closed)', async () => {
      authService.changePassword.mockRejectedValue(new Error('REVOCATION_UNAVAILABLE'));
      const res = mockRes();
      await userController.changePassword(mockReq({ body: { oldPassword: 'oldpwd1', newPassword: 'newpwd1' } }), res);
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('returns 500 on unexpected error', async () => {
      authService.changePassword.mockRejectedValue(new Error('boom'));
      const res = mockRes();
      await userController.changePassword(mockReq({ body: { oldPassword: 'oldpwd1', newPassword: 'newpwd1' } }), res);
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
      expect(smsService.sendSMS).toHaveBeenCalledWith('13800000000', 'login');
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
      await userController.getFollows(mockReq({ query: { userId: '100001' } }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data.list[0]).toEqual({ userId: undefined, nickname: '', avatar: '', level: 1, isFollow: false });
    });

    it('getFollows maps error to 500', async () => {
      UserFollow.findAndCountAll.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await userController.getFollows(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('M-11：粉丝/关注列表拒绝跨用户读取（?userId=他人 → 403）', async () => {
      const fans = mockRes();
      await userController.getFans(mockReq({ query: { userId: '5' } }), fans);
      expect(fans.status).toHaveBeenCalledWith(403);
      expect(UserFollow.findAndCountAll).not.toHaveBeenCalled();

      const follows = mockRes();
      await userController.getFollows(mockReq({ query: { userId: '5' } }), follows);
      expect(follows.status).toHaveBeenCalledWith(403);
    });

    it('M-11：粉丝/关注列表拒绝非法 userId 格式（→ 400）', async () => {
      const fans = mockRes();
      await userController.getFans(mockReq({ query: { userId: '1e5' } }), fans);
      expect(fans.status).toHaveBeenCalledWith(400);

      const follows = mockRes();
      await userController.getFollows(mockReq({ query: { userId: 'abc' } }), follows);
      expect(follows.status).toHaveBeenCalledWith(400);
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

    it('刷新令牌已被吊销 → 401 重新登录；吊销服务不可用 → 503（审计 H-5）', async () => {
      authService.refreshToken.mockRejectedValue(new Error('REFRESH_REVOKED'));
      const revoked = mockRes();
      await userController.refreshToken(mockReq({ body: { refreshToken: 'r' } }), revoked);
      expect(revoked.status).toHaveBeenCalledWith(401);

      authService.refreshToken.mockRejectedValue(new Error('REVOCATION_UNAVAILABLE'));
      const unavailable = mockRes();
      await userController.refreshToken(mockReq({ body: { refreshToken: 'r' } }), unavailable);
      expect(unavailable.status).toHaveBeenCalledWith(503);
    });
  });

  describe('logout（审计 H-5）', () => {
    const access = { headers: { authorization: 'Bearer access-t' } };

    it('拉黑本次 access 令牌并回 200', async () => {
      const res = mockRes();
      await userController.logout(mockReq({ ...access, token: 'access-t', body: {} }), res);

      expect(tokenRevocation.revokeToken).toHaveBeenCalledWith('access-t');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data).toEqual({ clientShouldClearToken: true, serverRevoked: true });
    });

    it('本人 refresh 令牌一并拉黑', async () => {
      verifyToken.mockReturnValue({ userId: 100001, type: 'refresh' });
      const res = mockRes();
      await userController.logout(
        mockReq({ ...access, token: 'access-t', body: { refreshToken: 'refresh-t' } }),
        res
      );

      expect(verifyToken).toHaveBeenCalledWith('refresh-t', ['refresh']);
      expect(tokenRevocation.revokeToken).toHaveBeenCalledWith('access-t');
      expect(tokenRevocation.revokeToken).toHaveBeenCalledWith('refresh-t');
    });

    it('别人的 refresh 令牌一律忽略——这个口子不能变成定向替他人登出', async () => {
      verifyToken.mockReturnValue({ userId: 999999, type: 'refresh' });
      const res = mockRes();
      await userController.logout(
        mockReq({ ...access, token: 'access-t', body: { refreshToken: 'someone-else' } }),
        res
      );

      expect(tokenRevocation.revokeToken).toHaveBeenCalledTimes(1);
      expect(tokenRevocation.revokeToken).toHaveBeenCalledWith('access-t');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('logoutAllDevices：改走主体水位线（C 端不保存 refreshToken，只拉黑 access 会留下 30 天孤儿凭据）', async () => {
      const res = mockRes();
      await userController.logout(mockReq({ ...access, token: 'access-t', body: { logoutAllDevices: true } }), res);

      expect(tokenRevocation.revokeAllUserTokens).toHaveBeenCalledWith(100001);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // 写入侧与读取侧同一取向：生产 fail-closed 不假装已登出，非生产 fail-open 但如实回报 serverRevoked
    it('生产（fail-closed）吊销写不进 Redis 时回 503，不假装已登出', async () => {
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      tokenRevocation.revokeToken.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });
      const res = mockRes();
      await userController.logout(mockReq({ ...access, token: 'access-t', body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('非生产（fail-open）没有 Redis 也能登出，但 serverRevoked=false', async () => {
      tokenRevocation.revokeToken.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });
      const res = mockRes();
      await userController.logout(mockReq({ ...access, token: 'access-t', body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data.serverRevoked).toBe(false);
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
    beforeEach(() => {
      UserFollow.findAll.mockResolvedValue([]);
    });

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
        userId: 5, nickname: 'n', avatar: 'a', postId: 1, time: 9, isFollowed: false
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
      expect(ok.json.mock.calls[0][0].data.list[0]).toEqual({ userId: 5, nickname: 'n', avatar: 'a', time: 9, isFollowed: false });

      UserVisit.findAll.mockResolvedValue([]);
      const empty = mockRes();
      await userController.getVisitors(mockReq(), empty);
      expect(empty.json.mock.calls[0][0].data.total).toBe(0);

      UserVisit.findAll.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await userController.getVisitors(mockReq(), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });

    it('backfills isFollowed from the follow table with one batch query', async () => {
      UserVisit.findAll.mockResolvedValue([
        { visitor_id: 5, create_time: 9 },
        { visitor_id: 7, create_time: 8 },
        { visitor_id: 5, create_time: 7 }
      ]);
      User.findAll.mockResolvedValue([
        { id: 5, nickname: 'a', avatar: 'x' },
        { id: 7, nickname: 'b', avatar: 'y' }
      ]);
      UserFollow.findAll.mockResolvedValue([{ following_id: 7 }]);
      const res = mockRes();
      await userController.getVisitors(mockReq(), res);
      expect(UserFollow.findAll).toHaveBeenCalledTimes(1);
      expect(UserFollow.findAll.mock.calls[0][0].where.follower_id).toBe(100001);
      const list = res.json.mock.calls[0][0].data.list;
      expect(list.map(i => [i.userId, i.isFollowed])).toEqual([[5, false], [7, true], [5, false]]);
    });

    it('skips the follow query when the list is empty', async () => {
      UserVisit.findAll.mockResolvedValue([{ visitor_id: null, create_time: 9 }]);
      User.findAll.mockResolvedValue([]);
      const res = mockRes();
      await userController.getVisitors(mockReq(), res);
      expect(UserFollow.findAll).not.toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].data.list[0].isFollowed).toBe(false);
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

    // ===== 审计 H-6：扣款金额与装扮所有权不再来自客户端 =====

    it('savePref 拒绝客户端自报的扣款金额，不再扣费', async () => {
      const res = mockRes();
      await userController.savePref(mockReq({ body: { spend: 10 } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].errors.spend[0]).toContain('/api/user/skins/purchase');
      expect(User.decrement).not.toHaveBeenCalled();
      expect(UserPref.findOne).not.toHaveBeenCalled();
    });

    it('savePref 拒绝非法 spend（非数字 / 负数 / 字符串数字），未传视为 0', async () => {
      UserPref.findOne.mockResolvedValue(null);
      UserPref.create.mockResolvedValue({ id: 1 });
      for (const bad of ['abc', -100, '500']) {
        const res = mockRes();
        await userController.savePref(mockReq({ body: { spend: bad } }), res);
        expect(res.status).toHaveBeenCalledWith(422);
      }
      const okRes = mockRes();
      await userController.savePref(mockReq({ body: { data: { x: 1 } } }), okRes);
      expect(okRes.status).toHaveBeenCalledWith(200);
    });

    it('savePref 容忍旧客户端显式传 spend=0', async () => {
      UserPref.findOne.mockResolvedValue(null);
      UserPref.create.mockResolvedValue({ id: 1 });
      const res = mockRes();
      await userController.savePref(mockReq({ body: { data: { theme: 'dark' }, spend: 0 } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(User.decrement).not.toHaveBeenCalled();
    });

    it('savePref 丢弃客户端提交的 skinShop 快照', async () => {
      const update = jest.fn().mockResolvedValue(true);
      UserPref.findOne.mockResolvedValue({ data: '{"a":1}', update });
      const res = mockRes();
      await userController.savePref(
        mockReq({ body: { data: { b: 2, skinShop: { owned: { frame_sf8: true }, using: { frame_sf8: true } } } } }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(JSON.parse(update.mock.calls[0][0].data)).toEqual({ a: 1, b: 2 });
    });

    it('savePref 保留服务端已写入的 skinShop', async () => {
      const update = jest.fn().mockResolvedValue(true);
      UserPref.findOne.mockResolvedValue({ data: '{"skinShop":{"owned":{"frame_sf2":true},"using":{}}}', update });
      await userController.savePref(mockReq({ body: { data: { theme: 'dark' } } }), mockRes());
      expect(JSON.parse(update.mock.calls[0][0].data)).toEqual({
        skinShop: { owned: { frame_sf2: true }, using: {} },
        theme: 'dark'
      });
    });

    it('getPref 不再回传 skinShop', async () => {
      UserPref.findOne.mockResolvedValue({ data: '{"theme":"dark","skinShop":{"owned":{"frame_sf8":true}}}' });
      const res = mockRes();
      await userController.getPref(mockReq(), res);
      expect(res.json.mock.calls[0][0].data).toEqual({ data: { theme: 'dark' } });
    });

    it('savePref creates a new row without spend', async () => {
      UserPref.findOne.mockResolvedValue({ data: 'bad-json', update: jest.fn().mockResolvedValue(true) });
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

  describe('skin shop endpoints（审计 H-6）', () => {
    const skin = { id: 'sf8', type: 'frame', name: '暗夜流光', price: 8888, vipLevel: 4 };

    it('listSkins 返回服务端目录与用户状态', async () => {
      skinService.listForUser.mockResolvedValue({ balance: 500, items: [], unlocked: false, needLevel: 45 });
      const res = mockRes();
      await userController.listSkins(mockReq(), res);
      expect(skinService.listForUser).toHaveBeenCalledWith(100001);
      expect(res.json.mock.calls[0][0].data).toEqual({ balance: 500, items: [], unlocked: false, needLevel: 45 });
    });

    it('listSkins 异常回 500', async () => {
      skinService.listForUser.mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await userController.listSkins(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('purchaseSkin 缺少 skinId 回 400', async () => {
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(skinService.purchase).not.toHaveBeenCalled();
    });

    it('purchaseSkin 只提交 skinId，金额由服务端目录决定', async () => {
      skinService.purchase.mockResolvedValue({ skin, charged: 8888, alreadyOwned: false, balance: 112 });
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: { skinId: 'sf8' } }), res);
      expect(skinService.purchase).toHaveBeenCalledWith(100001, 'sf8');
      expect(res.json.mock.calls[0][0].data).toEqual({
        skin: { id: 'sf8', type: 'frame', name: '暗夜流光', price: 8888, vipLevel: 4 },
        charged: 8888,
        alreadyOwned: false,
        balance: 112
      });
      expect(res.json.mock.calls[0][0].message).toBe('购买成功');
    });

    it('purchaseSkin 免费装扮回「已获得」且 charged=0', async () => {
      skinService.purchase.mockResolvedValue({
        skin: { id: 'sf1', type: 'frame', name: '简约白边', price: 0, vipLevel: 0 },
        charged: 0,
        alreadyOwned: false,
        balance: 100
      });
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: { skinId: 'sf1' } }), res);
      expect(res.json.mock.calls[0][0].message).toBe('已获得');
    });

    it('purchaseSkin 把业务拒绝转 422 并带上原因码', async () => {
      skinService.purchase.mockRejectedValue(Object.assign(new Error('金币不足，请先充值'), { code: 'INSUFFICIENT_BALANCE' }));
      skinService.isBusinessError.mockReturnValueOnce(true);
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: { skinId: 'sf8' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].message).toBe('金币不足，请先充值');
      expect(res.json.mock.calls[0][0].errors.skin).toEqual(['INSUFFICIENT_BALANCE']);
    });

    it('purchaseSkin 把等级不足转 422 并保留 Lv 提示', async () => {
      skinService.purchase.mockRejectedValue(Object.assign(
        new Error('等级不足：解锁装扮商城需要 Lv.45（当前 Lv.3）'),
        { code: 'LEVEL_NOT_ENOUGH', needLevel: 45 }
      ));
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: { skinId: 'sf8' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].errors.level[0]).toContain('Lv.45');
    });

    it('purchaseSkin 未预期错误回 500 且不泄露内部信息', async () => {
      skinService.purchase.mockRejectedValue(new Error('SELECT * FROM xn_user failed'));
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: { skinId: 'sf8' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json.mock.calls[0][0].message).toBe('购买装扮失败');
    });

    it('useSkin 切换已拥有装扮，不产生扣款字段', async () => {
      skinService.use.mockResolvedValue({ skin, charged: 0, balance: 300 });
      const res = mockRes();
      await userController.useSkin(mockReq({ body: { skinId: 'sf8' } }), res);
      expect(skinService.use).toHaveBeenCalledWith(100001, 'sf8');
      expect(res.json.mock.calls[0][0].message).toBe('已切换');
      expect(res.json.mock.calls[0][0].data.balance).toBe(300);
    });

    it('useSkin 未拥有时 422（客户端无法再自行声明所有权）', async () => {
      skinService.use.mockRejectedValue(Object.assign(new Error('尚未拥有该装扮，请先购买'), { code: 'SKIN_NOT_OWNED' }));
      skinService.isBusinessError.mockReturnValueOnce(true);
      const res = mockRes();
      await userController.useSkin(mockReq({ body: { skinId: 'sf8' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].errors.skin).toEqual(['SKIN_NOT_OWNED']);
    });

    it('purchaseSkin 拒绝目录外的 skinId（客户端无法自造装扮）', async () => {
      skinService.purchase.mockRejectedValue(Object.assign(new Error('装扮不存在或已下架'), { code: 'SKIN_NOT_FOUND' }));
      skinService.isBusinessError.mockReturnValueOnce(true);
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: { skinId: 'admin_gift_9999' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].errors.skin).toEqual(['SKIN_NOT_FOUND']);
    });

    it('purchaseSkin 需要 VIP 时 422', async () => {
      skinService.purchase.mockRejectedValue(Object.assign(new Error('需要 VIP4 及以上才可购买'), { code: 'SKIN_VIP_REQUIRED' }));
      skinService.isBusinessError.mockReturnValueOnce(true);
      const res = mockRes();
      await userController.purchaseSkin(mockReq({ body: { skinId: 'sf8' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].errors.skin).toEqual(['SKIN_VIP_REQUIRED']);
    });
  });

  describe('level endpoints and benefit gates', () => {
    const gateError = () => Object.assign(
      new Error('等级不足：解锁在线状态隐身需要 Lv.10（当前 Lv.3）'),
      { code: 'LEVEL_NOT_ENOUGH', needLevel: 10 }
    );
    const gatedBenefits = () => levelService.requireLevel.mock.calls.map(c => c[1]);

    beforeEach(() => {
      // clearAllMocks 不会移除其他用例设过的 mockRejectedValue，门槛实现必须逐用例复位
      levelService.requireLevel.mockReset();
    });

    it('updateUserInfo only gates the signature when a value is written', async () => {
      await userController.updateUserInfo(mockReq({ body: { dec: '  ' } }), mockRes());
      expect(levelService.requireLevel).not.toHaveBeenCalled();

      await userController.updateUserInfo(mockReq({ body: { dec: '新人求带' } }), mockRes());
      expect(levelService.requireLevel).toHaveBeenCalledWith(100001, 'signature');
    });

    it('updateUserInfo maps a failed gate to 422', async () => {
      levelService.requireLevel.mockRejectedValue(gateError());
      const res = mockRes();
      await userController.updateUserInfo(mockReq({ body: { dec: '新人求带' } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].message).toContain('Lv.10');
    });

    it('savePref gates only the benefits the request actually turns on', async () => {
      await userController.savePref(mockReq({ body: { data: { stealthSettings: { stealth: false } } } }), mockRes());
      expect(levelService.requireLevel).not.toHaveBeenCalled();

      await userController.savePref(
        mockReq({ body: { data: { stealthSettings: { stealth: true }, selectedBadge: 'gold' } } }),
        mockRes()
      );
      expect(gatedBenefits()).toEqual(['stealth_visit', 'identity_badge']);

      levelService.requireLevel.mockClear();
      await userController.savePref(mockReq({ body: { data: { skinShop: { owned: {} } } } }), mockRes());
      expect(levelService.requireLevel).not.toHaveBeenCalled();

      // 审计 H-6：带 spend 的偏好请求直接被拒，门槛判定改由 /api/user/skins/purchase 负责
      levelService.requireLevel.mockClear();
      const rejected = mockRes();
      await userController.savePref(
        mockReq({ body: { data: { skinShop: { owned: {} }, priorityMatchingSettings: { priorityPush: true } }, spend: 10 } }),
        rejected
      );
      expect(rejected.status).toHaveBeenCalledWith(422);
      expect(levelService.requireLevel).not.toHaveBeenCalled();
    });

    it('savePref returns the server level reason on a failed gate', async () => {
      levelService.requireLevel.mockRejectedValue(gateError());
      const res = mockRes();
      await userController.savePref(mockReq({ body: { data: { priorityMatchingSettings: {} } } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].errors.level[0]).toContain('Lv.10');
    });

    it('getLevelInfo returns the level payload', async () => {
      levelService.getInfo.mockResolvedValue({ lv: 12, exp: 300 });
      const res = mockRes();
      await userController.getLevelInfo(mockReq(), res);
      expect(levelService.getInfo).toHaveBeenCalledWith(100001);
      expect(res.json.mock.calls[0][0].data).toEqual({ lv: 12, exp: 300 });
    });

    it('getLevelInfo maps errors to 500', async () => {
      levelService.getInfo.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await userController.getLevelInfo(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('checkIn maps 今日已签到 to 422 and other failures to 500', async () => {
      levelService.checkIn.mockRejectedValue(new Error('今日已签到'));
      const dup = mockRes();
      await userController.checkIn(mockReq(), dup);
      expect(dup.status).toHaveBeenCalledWith(422);

      levelService.checkIn.mockResolvedValue({ lv: 4, exp: 10 });
      const ok = mockRes();
      await userController.checkIn(mockReq(), ok);
      expect(ok.status).toHaveBeenCalledWith(200);

      levelService.checkIn.mockRejectedValue(new Error('db fail'));
      const bad = mockRes();
      await userController.checkIn(mockReq(), bad);
      expect(bad.status).toHaveBeenCalledWith(500);
    });
  });
});
