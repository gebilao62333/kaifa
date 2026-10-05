// C-1 回归锁：验证码登录与注册必须在签发 token 之前真正校验短信验证码。
jest.mock('../../../src/services/smsService', () => ({
  SMS_SCENES: ['login', 'register', 'reset'],
  verifyCode: jest.fn(),
  sendSMS: jest.fn()
}));

jest.mock('../../../src/models', () => ({
  User: { findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  UserFollow: { findOne: jest.fn() }
}));

jest.mock('../../../src/config/jwt', () => ({
  generateToken: jest.fn(() => 'access'),
  generateTokenPair: jest.fn(() => ({ accessToken: 'access', refreshToken: 'refresh' })),
  verifyToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  // 审计 H-4：authService 以 ACCESS 白名单复校刷新结果
  TOKEN_TYPES: { ACCESS: 'access', REFRESH: 'refresh', ADMIN: 'admin', ADMIN_REFRESH: 'admin_refresh' }
}));

// 审计 H-5：刷新链路会先查吊销状态（水位线必须能拦下 30 天期的被盗 refresh）
jest.mock('../../../src/services/tokenRevocation', () => ({
  checkRevocation: jest.fn(),
  revocationFailMode: jest.fn()
}));

const smsService = require('../../../src/services/smsService');
const { User } = require('../../../src/models');
const authService = require('../../../src/services/authService');

const freshUser = () => ({
  id: 12000,
  mobile: '13800000000',
  nickname: '用户0000',
  password: null,
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true)
});

describe('authService 验证码强制校验', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    smsService.verifyCode.mockResolvedValue(true);
  });

  it('验证码不通过时不签发任何 token（历史缺陷：code 形参从未使用）', async () => {
    smsService.verifyCode.mockRejectedValue(new Error('验证码错误'));
    const user = freshUser();
    User.findOne.mockResolvedValue(user);

    await expect(authService.loginWithMobile('13800000000', '000000')).rejects.toThrow('验证码错误');
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  it('验证码通过才登录，并按 login 场景校验', async () => {
    User.findOne.mockResolvedValue(freshUser());
    const result = await authService.loginWithMobile('13800000000', '123456');

    expect(smsService.verifyCode).toHaveBeenCalledWith('13800000000', '123456', 'login');
    expect(result.accessToken).toBe('access');
  });

  it('手机号未注册时也必须先过验证码才建号', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(freshUser());

    await authService.loginWithMobile('13900000000', '654321');
    expect(smsService.verifyCode).toHaveBeenCalledWith('13900000000', '654321', 'login');
    expect(User.create).toHaveBeenCalledTimes(1);
  });

  it('注册按 register 场景校验，未通过则不建号', async () => {
    User.create.mockResolvedValue(freshUser());

    await authService.register('13800000000', 'abcdef', '用户0000', '111111');
    expect(smsService.verifyCode).toHaveBeenCalledWith('13800000000', '111111', 'register');

    smsService.verifyCode.mockRejectedValue(new Error('验证码已过期'));
    await expect(
      authService.register('13800000000', 'abcdef', '用户0000', '111111')
    ).rejects.toThrow('验证码已过期');
  });
});

// ===== 审计 H-4：刷新链路只认 access 用途 =====
describe('authService 刷新令牌的用途绑定与吊销闸门', () => {
  const jwtMock = require('../../../src/config/jwt');
  const revocationMock = require('../../../src/services/tokenRevocation');

  // 真实实现里两次验签的白名单不同：入参走 REFRESH、重签出的新令牌走 ACCESS。
  // 用一个不区分入参的 mock 会让「refresh 无效」和「新令牌无效」两种失败混成一条。
  const verifyByToken = ({ refreshOk = true, accessOk = true } = {}) => (token, allowed) => {
    if (token === 'refresh-str') {
      return refreshOk && allowed && allowed.includes('refresh')
        ? { userId: 12000, iat: 1000, type: 'refresh' }
        : null;
    }
    return accessOk && allowed && allowed.includes('access')
      ? { userId: 12000, type: 'access' }
      : null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jwtMock.refreshAccessToken.mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' });
    jwtMock.verifyToken.mockImplementation(verifyByToken());
    revocationMock.checkRevocation.mockResolvedValue({ verifiable: true, revoked: false, reason: null });
    revocationMock.revocationFailMode.mockReturnValue('open');
  });

  it('刷新后复校新 access token 时带上 ACCESS 白名单', async () => {
    User.findByPk.mockResolvedValue(freshUser());

    const result = await authService.refreshToken('refresh-str');

    expect(jwtMock.verifyToken).toHaveBeenCalledWith('refresh-str', [jwtMock.TOKEN_TYPES.REFRESH]);
    expect(jwtMock.refreshAccessToken).toHaveBeenCalledWith('refresh-str');
    expect(jwtMock.verifyToken).toHaveBeenCalledWith('access', [jwtMock.TOKEN_TYPES.ACCESS]);
    expect(result.accessToken).toBe('access');
  });

  it('新令牌无法通过 access 白名单校验时拒绝返回会话', async () => {
    jwtMock.verifyToken.mockImplementation(verifyByToken({ accessOk: false }));

    await expect(authService.refreshToken('refresh-str')).rejects.toThrow('生成的token无效');
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('refresh 令牌用途不符或已失效时直接拒绝，不查吊销也不重签', async () => {
    jwtMock.verifyToken.mockImplementation(verifyByToken({ refreshOk: false }));

    await expect(authService.refreshToken('refresh-str')).rejects.toThrow('无效的refresh token');
    expect(revocationMock.checkRevocation).not.toHaveBeenCalled();
    expect(jwtMock.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('refresh 令牌已被拉黑 → REFRESH_REVOKED，且不签发新令牌（审计 H-5）', async () => {
    revocationMock.checkRevocation.mockResolvedValue({ verifiable: true, revoked: true, reason: 'token-logged-out' });

    await expect(authService.refreshToken('refresh-str')).rejects.toThrow('REFRESH_REVOKED');
    expect(jwtMock.refreshAccessToken).not.toHaveBeenCalled();
    expect(revocationMock.checkRevocation).toHaveBeenCalledWith('refresh-str', { userId: 12000, iat: 1000, type: 'refresh' });
  });

  it('命中「全端下线」水位线同样拒绝', async () => {
    revocationMock.checkRevocation.mockResolvedValue({ verifiable: true, revoked: true, reason: 'logged-out-everywhere' });

    await expect(authService.refreshToken('refresh-str')).rejects.toThrow('REFRESH_REVOKED');
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('吊销状态无法确认 + fail-closed → REVOCATION_UNAVAILABLE（控制器据此回 503）', async () => {
    revocationMock.checkRevocation.mockResolvedValue({ verifiable: false, revoked: false });
    revocationMock.revocationFailMode.mockReturnValue('closed');

    await expect(authService.refreshToken('refresh-str')).rejects.toThrow('REVOCATION_UNAVAILABLE');
    expect(jwtMock.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('fail-open（非生产没有 Redis）时仍可正常刷新', async () => {
    revocationMock.checkRevocation.mockResolvedValue({ verifiable: false, revoked: false });
    User.findByPk.mockResolvedValue(freshUser());

    await expect(authService.refreshToken('refresh-str')).resolves.toMatchObject({ accessToken: 'access' });
  });
});
