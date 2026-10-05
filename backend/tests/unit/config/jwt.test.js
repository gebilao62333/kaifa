const jwt = require('jsonwebtoken');
const config = require('../../../src/config');
const {
  TOKEN_TYPES,
  generateToken,
  generateTokenPair,
  verifyToken,
  refreshAccessToken,
  decodeToken,
  signToken
} = require('../../../src/config/jwt');

describe('Config - JWT', () => {
  const payload = { userId: 100001, username: 'tester' };

  it('generates and verifies an access token', () => {
    const token = generateToken(payload, 'access');
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(100001);
    expect(decoded.username).toBe('tester');
  });

  it('generates a refresh token too', () => {
    expect(typeof generateToken(payload, 'refresh')).toBe('string');
  });

  it('generates a token pair', () => {
    const pair = generateTokenPair(payload);
    expect(typeof pair.accessToken).toBe('string');
    expect(typeof pair.refreshToken).toBe('string');
    expect(pair.expiresIn).toBeDefined();
    expect(pair.refreshExpiresIn).toBeDefined();
  });

  it('returns null for invalid tokens', () => {
    expect(verifyToken('not-a-token')).toBe(null);
  });

  it('refreshes a valid refresh token', () => {
    const { refreshToken } = generateTokenPair(payload);
    const refreshed = refreshAccessToken(refreshToken);
    expect(typeof refreshed.accessToken).toBe('string');
    expect(typeof refreshed.refreshToken).toBe('string');
    expect(verifyToken(refreshed.accessToken).userId).toBe(100001);
  });

  it('throws when refreshing an invalid token', () => {
    expect(() => refreshAccessToken('bad')).toThrow('无效的refresh token');
  });

  it('decodes a token without verifying', () => {
    const token = signToken(payload, '1h', TOKEN_TYPES.ACCESS);
    expect(decodeToken(token).userId).toBe(100001);
    expect(decodeToken('garbage')).toBe(null);
  });

  describe('令牌用途声明（审计 H-4）', () => {
    it('签发一律带 type，且 pair 的两枚各自不同用途', () => {
      const pair = generateTokenPair(payload);
      expect(decodeToken(pair.accessToken).type).toBe(TOKEN_TYPES.ACCESS);
      expect(decodeToken(pair.refreshToken).type).toBe(TOKEN_TYPES.REFRESH);
    });

    it('refresh 令牌不能通过 access 白名单', () => {
      const pair = generateTokenPair(payload);
      expect(verifyToken(pair.refreshToken, [TOKEN_TYPES.ACCESS])).toBe(null);
      expect(verifyToken(pair.accessToken, [TOKEN_TYPES.ACCESS])).not.toBe(null);
    });

    it('管理员 access 令牌不能当用户 access，也不能当 admin_refresh', () => {
      const adminToken = signToken({ id: 7, role: 'admin' }, '7d', TOKEN_TYPES.ADMIN);
      expect(verifyToken(adminToken, [TOKEN_TYPES.ACCESS])).toBe(null);
      expect(verifyToken(adminToken, [TOKEN_TYPES.ADMIN])).not.toBe(null);
      expect(verifyToken(adminToken, [TOKEN_TYPES.ADMIN_REFRESH])).toBe(null);
    });

    it('省略白名单时只验签（不改变原有调用方语义）', () => {
      const pair = generateTokenPair(payload);
      expect(verifyToken(pair.refreshToken)).not.toBe(null);
    });

    it('没有 type 的历史令牌在白名单下一律失效', () => {
      const legacy = jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
      expect(verifyToken(legacy)).not.toBe(null);
      expect(verifyToken(legacy, [TOKEN_TYPES.ACCESS])).toBe(null);
    });

    it('refreshAccessToken 只接受 refresh 用途', () => {
      const pair = generateTokenPair(payload);
      expect(() => refreshAccessToken(pair.accessToken)).toThrow('无效的refresh token');
    });

    it('重签只结转 userId，refresh 令牌上的角色声明不会被带进新 access 令牌', () => {
      const forged = generateToken({ userId: 100001, role: 'admin', permissions: ['all'] }, 'refresh');
      const refreshed = refreshAccessToken(forged);
      const decoded = decodeToken(refreshed.accessToken);
      expect(decoded.userId).toBe(100001);
      expect(decoded.role).toBeUndefined();
      expect(decoded.permissions).toBeUndefined();
      expect(decoded.type).toBe(TOKEN_TYPES.ACCESS);
    });

    it('未知 type 拒绝签发', () => {
      expect(() => generateToken(payload, 'whatever')).toThrow('必须指定合法 type');
      expect(() => signToken(payload, '1h', undefined)).toThrow('必须指定合法 type');
      expect(() => signToken(payload, '1h')).toThrow('必须指定合法 type');
    });
  });

  // 审计 M-3：管理端令牌改用独立签名密钥（config.jwt.adminSecret），与用户端 secret 分离。
  // 此前两者同密钥，令牌是不是管理端只靠 payload 里可伪造的 role/role_id 声明——
  // 一旦用户令牌被改成带这些声明即可越权。分离后，用错密钥的令牌在验签阶段就失败。
  describe('管理端独立签名密钥（审计 M-3）', () => {
    it('默认由 JWT_SECRET 派生：与用户端密钥不同且为定长摘要', () => {
      // 测试环境未设置 ADMIN_JWT_SECRET，走派生分支
      expect(config.jwt.adminSecretSource).toBe('derived');
      expect(config.jwt.adminSecret).not.toBe(config.jwt.secret);
      expect(config.jwt.adminSecret).toHaveLength(64);
    });

    it('用用户端密钥伪造的管理端令牌验不过（这正是 M-3 要堵的越权路径）', () => {
      const forged = jwt.sign(
        { id: 1, role: 'admin', role_id: 1, adminScope: 'account', type: TOKEN_TYPES.ADMIN },
        config.jwt.secret,
        { expiresIn: '7d' }
      );
      // 白名单命中 admin 用途 → 采用 adminSecret 验签，用用户端密钥签的同名令牌直接失败
      expect(verifyToken(forged, [TOKEN_TYPES.ADMIN])).toBe(null);
    });

    it('无 type 的历史管理端令牌（用户密钥所签）一律失效，强制重登', () => {
      const legacy = jwt.sign({ id: 1, role: 'admin' }, config.jwt.secret, { expiresIn: '7d' });
      expect(verifyToken(legacy, [TOKEN_TYPES.ADMIN])).toBe(null);
    });

    it('反向：管理端令牌进不了用户端白名单', () => {
      const adminToken = signToken({ id: 1, adminScope: 'account' }, '12h', TOKEN_TYPES.ADMIN);
      expect(verifyToken(adminToken, [TOKEN_TYPES.ACCESS])).toBe(null);
      expect(verifyToken(adminToken, [TOKEN_TYPES.ADMIN])).not.toBe(null);
    });

    it('管理员刷新令牌用同一把管理端密钥，但仍进不了 admin access 白名单', () => {
      const adminRefresh = signToken({ id: 1, adminScope: 'account' }, '30d', TOKEN_TYPES.ADMIN_REFRESH);
      expect(verifyToken(adminRefresh, [TOKEN_TYPES.ADMIN_REFRESH])).not.toBe(null);
      expect(verifyToken(adminRefresh, [TOKEN_TYPES.ADMIN])).toBe(null);
    });
  });

  // 审计低危项：verify() 未限定 algorithms，会接受令牌头里声明的任意算法。
  // 固定为 HS256 后，用同一密钥但换算法签的令牌（alg 混淆/降级）一律验不过。
  describe('签发算法固定为 HS256（低危项）', () => {
    it('本系统签发的 HS256 令牌正常验签', () => {
      expect(verifyToken(generateToken(payload, 'access'))).not.toBe(null);
    });

    it('同密钥但 HS384 / HS512 签的令牌一律拒绝', () => {
      const hs384 = jwt.sign(payload, config.jwt.secret, { algorithm: 'HS384', expiresIn: '1h' });
      const hs512 = jwt.sign(payload, config.jwt.secret, { algorithm: 'HS512', expiresIn: '1h' });
      expect(verifyToken(hs384)).toBe(null);
      expect(verifyToken(hs512)).toBe(null);
    });
  });
});
