jest.mock('../../../src/config/jwt', () => ({
  verifyToken: jest.fn(),
  // 审计 H-4：中间件按用途白名单校验，mock 必须提供与 src/config/jwt.js 同名同值的常量
  TOKEN_TYPES: { ACCESS: 'access', REFRESH: 'refresh', ADMIN: 'admin', ADMIN_REFRESH: 'admin_refresh' }
}));
jest.mock('../../../src/models', () => ({
  User: { findByPk: jest.fn() },
  // 审计 M-2：adminAuth 按 adminScope 回读实时主体（Admin 账号 / AdminRole 角色账号）
  Admin: { findByPk: jest.fn() },
  AdminRole: { findByPk: jest.fn() }
}));
jest.mock('../../../src/config/redis', () => ({ getRedisClient: jest.fn() }));
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    admin: { token: 'fixed-admin-token', emergencyLogin: false },
    paths: { logs: path.join(os.tmpdir(), 'dsh-auth-mw-logs') }
  };
});
// 审计 H-5：吊销校验从中间件里抽到 services/tokenRevocation，这里只测「中间件如何依据其结论响应」
jest.mock('../../../src/services/tokenRevocation', () => ({
  checkRevocation: jest.fn(),
  revocationFailMode: jest.fn(() => 'open')
}));

const { authMiddleware, optionalAuth, adminAuth } = require('../../../src/middlewares/auth');
const { verifyToken, TOKEN_TYPES } = require('../../../src/config/jwt');
const { User, Admin, AdminRole } = require('../../../src/models');
const { getRedisClient } = require('../../../src/config/redis');
const tokenRevocation = require('../../../src/services/tokenRevocation');
const config = require('../../../src/config');

const mockReq = (overrides = {}) => ({ headers: {}, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Middleware - Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRedisClient.mockReturnValue(null);
    tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: true, revoked: false, reason: null });
    tokenRevocation.revocationFailMode.mockReturnValue('open');
    config.admin.emergencyLogin = false;
    // jest.clearAllMocks 不会清掉 mockResolvedValue 实现——显式重置默认值，
    // 避免上个用例设置的主体行泄漏到下一个用例
    Admin.findByPk.mockResolvedValue(null);
    AdminRole.findByPk.mockResolvedValue(null);
  });

  describe('authMiddleware', () => {
    it('rejects requests without token', async () => {
      const res = mockRes();
      await authMiddleware(mockReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects invalid token', async () => {
      verifyToken.mockReturnValue(null);
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer bad' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('令牌已被吊销时拒绝（登出 / 全端下线）', async () => {
      verifyToken.mockReturnValue({ userId: 1, type: TOKEN_TYPES.ACCESS });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: true, revoked: true, reason: 'token-logged-out' });
      const res = mockRes();
      const next = jest.fn();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ code: 401, message: '令牌已失效' });
      expect(next).not.toHaveBeenCalled();
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it('吊销状态无法确认 + fail-open：照常放行（非生产没有 Redis 也能联调）', async () => {
      verifyToken.mockReturnValue({ userId: 1, type: TOKEN_TYPES.ACCESS });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: false, revoked: false, reason: 'redis-unavailable' });
      User.findByPk.mockResolvedValue({ id: 1, status: 1 });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await authMiddleware(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBe(1);
      expect(req.token).toBe('t');
    });

    it('吊销状态无法确认 + fail-closed：503，绝不放行（打挂 Redis 不能复活已登出的令牌）', async () => {
      verifyToken.mockReturnValue({ userId: 1, type: TOKEN_TYPES.ACCESS });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: false, revoked: false, reason: 'redis-unavailable' });
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      const next = jest.fn();
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it('吊销查询带的是本次令牌的用途白名单结论，不重复验签', async () => {
      const decoded = { userId: 1, type: TOKEN_TYPES.ACCESS };
      verifyToken.mockReturnValue(decoded);
      User.findByPk.mockResolvedValue({ id: 1, status: 1 });
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), mockRes(), jest.fn());

      expect(tokenRevocation.checkRevocation).toHaveBeenCalledWith('t', decoded);
    });

    it('rejects when user does not exist', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      User.findByPk.mockResolvedValue(null);
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects disabled or muted users', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      User.findByPk.mockResolvedValue({ id: 1, status: 0 });
      const disabled = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), disabled, jest.fn());
      expect(disabled.status).toHaveBeenCalledWith(403);

      User.findByPk.mockResolvedValue({ id: 1, status: 1, jinyan_time: Math.floor(Date.now() / 1000) + 9999 });
      const muted = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), muted, jest.fn());
      expect(muted.status).toHaveBeenCalledWith(403);
    });

    it('returns 500 on unexpected error', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      User.findByPk.mockRejectedValue(new Error('db'));
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('optionalAuth', () => {
    it('calls next without token', async () => {
      const next = jest.fn();
      await optionalAuth(mockReq(), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next when token invalid', async () => {
      verifyToken.mockReturnValue(null);
      const next = jest.fn();
      await optionalAuth(mockReq({ headers: { authorization: 'Bearer t' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('attaches user when found', async () => {
      verifyToken.mockReturnValue({ userId: 5 });
      User.findByPk.mockResolvedValue({ id: 5 });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await optionalAuth(req, mockRes(), next);
      expect(req.userId).toBe(5);
      expect(next).toHaveBeenCalled();
    });

    it('已登出的令牌在这里换不到身份，但页面照常可访问（审计 H-5）', async () => {
      verifyToken.mockReturnValue({ userId: 5, type: TOKEN_TYPES.ACCESS });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: true, revoked: true, reason: 'token-logged-out' });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await optionalAuth(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it('吊销状态无法确认时按匿名处理，而不是 503（公开页可读性优先，审计 H-5）', async () => {
      verifyToken.mockReturnValue({ userId: 5, type: TOKEN_TYPES.ACCESS });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: false, revoked: false });
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      const next = jest.fn();
      const res = mockRes();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next when user missing', async () => {
      verifyToken.mockReturnValue({ userId: 5 });
      User.findByPk.mockResolvedValue(null);
      const next = jest.fn();
      await optionalAuth(mockReq({ headers: { authorization: 'Bearer t' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('swallows errors and calls next', async () => {
      verifyToken.mockReturnValue({ userId: 5 });
      User.findByPk.mockRejectedValue(new Error('db'));
      const next = jest.fn();
      await optionalAuth(mockReq({ headers: { authorization: 'Bearer t' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('adminAuth', () => {
    it('rejects when no token candidates', async () => {
      const res = mockRes();
      await adminAuth(mockReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('accepts the fixed emergency admin token', async () => {
      const next = jest.fn();
      const req = mockReq({ headers: { 'x-admin-token': 'fixed-admin-token' } });
      await adminAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.admin.permissions).toEqual(['all']);
      // 登出接口据此走「应急令牌不可吊销」分支，不会误把固定密文写进吊销名单
      expect(req.adminTokenKind).toBe('emergency');
      expect(tokenRevocation.checkRevocation).not.toHaveBeenCalled();
    });

    it('accepts a verified admin JWT', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', status: 1, role_id: null, permissions: '[]' });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer admin-token' } });
      await adminAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.adminToken).toBe('admin-token');
      expect(req.adminTokenKind).toBe('jwt');
    });

    it('令牌里的权限/角色只是快照，实时值以数据库为准（审计 M-2）', async () => {
      verifyToken.mockReturnValue({
        id: 1, role: 'admin', adminScope: 'account', role_id: 2,
        permissions: ['user:read'], type: TOKEN_TYPES.ADMIN
      });
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', status: 1, role_id: 5, permissions: '["post:read"]' });
      AdminRole.findByPk.mockResolvedValue({ id: 5, status: 1, is_super: 0, permissions: '["order:write"]' });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer admin-token' } });
      await adminAuth(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
      expect(req.admin.role_id).toBe(5);
      expect(req.admin.permissions.sort()).toEqual(['order:write', 'post:read']);
    });

    it('旧格式令牌（无 adminScope）一律 401 强制重登，且不查库（审计 M-2）', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin', type: TOKEN_TYPES.ADMIN });
      const res = mockRes();
      const next = jest.fn();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer old-token' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ code: 401, message: '令牌已失效' });
      expect(Admin.findByPk).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('管理员被删除后令牌立即失效（401）', async () => {
      verifyToken.mockReturnValue({ id: 9, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      const res = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('管理员被禁用后令牌立即被拒（403 账号已被禁用）', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'a', status: 0 });
      const res = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ code: 403, message: '账号已被禁用' });
    });

    it('角色账号被禁用后令牌立即被拒（403）', async () => {
      verifyToken.mockReturnValue({ id: 7, role: 'admin', adminScope: 'role', type: TOKEN_TYPES.ADMIN });
      AdminRole.findByPk.mockResolvedValue({ id: 7, status: 0 });
      const res = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('应急 JWT 在应急通道关闭后立即失效，开启时可正常使用（审计 M-2）', async () => {
      verifyToken.mockReturnValue({ id: 0, role: 'admin', adminScope: 'emergency', type: TOKEN_TYPES.ADMIN });
      const closed = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), closed, jest.fn());
      expect(closed.status).toHaveBeenCalledWith(401);

      config.admin.emergencyLogin = true;
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await adminAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.admin.permissions).toEqual(['all']);
    });

    it('数据库回读失败 + fail-closed → 503（生产默认）', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      Admin.findByPk.mockRejectedValue(new Error('db down'));
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      const res = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('数据库回读失败 + 非生产 fail-open → 按令牌快照放行', async () => {
      verifyToken.mockReturnValue({
        id: 1, role: 'admin', adminScope: 'account', permissions: ['user:read'], type: TOKEN_TYPES.ADMIN
      });
      Admin.findByPk.mockRejectedValue(new Error('db down'));
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await adminAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.admin.permissions).toEqual(['user:read']);
    });

    it('accepts a role_id=1 JWT', async () => {
      verifyToken.mockReturnValue({ id: 2, role_id: 1, adminScope: 'role', type: TOKEN_TYPES.ADMIN });
      AdminRole.findByPk.mockResolvedValue({ id: 2, username: 'r', status: 1, is_super: 0, permissions: '[]' });
      const next = jest.fn();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer admin-token' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    // 审计 M-3：门禁不再采信 payload 里的 role/role_id 声明（可伪造）。是否属于管理端
    // 只由「独立签名密钥 + type=admin 白名单」保证；因此 role:'user' 不再直接 403，
    // 而是继续走 resolveLiveAdmin——无 adminScope 的历史令牌按 legacy → 401 强制重登。
    it('ignores the role declaration: role=user stops at legacy 401, not 403', async () => {
      verifyToken.mockReturnValue({ id: 3, role: 'user', type: TOKEN_TYPES.ADMIN });
      const res = mockRes();
      const next = jest.fn();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ code: 401, message: '令牌已失效' });
      expect(next).not.toHaveBeenCalled();
    });

    it('role=user 声明被忽略：带合法 adminScope 且主体存在时以库为准放行', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'user', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', status: 1, role_id: null, permissions: '[]' });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await adminAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.admin.role).toBe('admin');
    });

    // 审计 M-3：固定 ADMIN_TOKEN 的比较改常数时间实现后，近似值（少一个字符）仍必须被拒
    it('rejects a near-miss x-admin-token', async () => {
      verifyToken.mockReturnValue(null);
      const res = mockRes();
      await adminAuth(mockReq({ headers: { 'x-admin-token': 'fixed-admin-toke' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ code: 403, message: '无管理员权限' });
    });

    it('rejects when verifyToken throws', async () => {
      verifyToken.mockImplementation(() => { throw new Error('bad'); });
      const res = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('已登出的后台令牌回 401 而不是 403（客户端据此清态重登，审计 H-5）', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: true, revoked: true, reason: 'token-logged-out' });
      const next = jest.fn();
      const res = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer admin-token' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ code: 401, message: '令牌已失效' });
      expect(next).not.toHaveBeenCalled();
      // 已吊销的令牌在回读数据库之前就被拦下
      expect(Admin.findByPk).not.toHaveBeenCalled();
    });

    it('吊销状态无法确认 + fail-closed：503，绝不放行', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: false, revoked: false });
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      const next = jest.fn();
      const res = mockRes();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer admin-token' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('fail-open 时仍然放行但留下警告痕迹（并按数据库实时值放行）', async () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN });
      tokenRevocation.checkRevocation.mockResolvedValue({ verifiable: false, revoked: false });
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', status: 1, role_id: null, permissions: '[]' });
      const next = jest.fn();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer admin-token' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('两个令牌头并存时只吊销真正通过校验的那一枚', async () => {
      verifyToken.mockImplementation((token) => (token === 'good'
        ? { id: 1, role: 'admin', adminScope: 'account', type: TOKEN_TYPES.ADMIN }
        : null));
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', status: 1, role_id: null, permissions: '[]' });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer bad', 'x-admin-token': 'good' } });
      await adminAuth(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
      expect(req.adminToken).toBe('good');
    });
  });

  describe('令牌用途白名单（审计 H-4）', () => {
    // 让 mock 复刻真实 verifyToken 的白名单语义：payload.type 不在白名单内即返回 null
    const verifyWith = (type) => (token, allowed) =>
      !allowed || allowed.includes(type)
        ? {
            userId: 1,
            id: 1,
            role: type === TOKEN_TYPES.ADMIN ? 'admin' : 'user',
            role_id: type === TOKEN_TYPES.ADMIN ? 1 : 0,
            adminScope: type === TOKEN_TYPES.ADMIN ? 'account' : undefined,
            type
          }
        : null;

    it('authMiddleware 只按 access 用途校验', async () => {
      verifyToken.mockImplementation(verifyWith(TOKEN_TYPES.ACCESS));
      User.findByPk.mockResolvedValue({ id: 1, status: 1 });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer access-t' } });
      await authMiddleware(req, mockRes(), next);
      expect(verifyToken).toHaveBeenCalledWith('access-t', [TOKEN_TYPES.ACCESS]);
      expect(req.userId).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    it('refresh 令牌在校验层就被判为无效，不会去查用户', async () => {
      verifyToken.mockImplementation(verifyWith(TOKEN_TYPES.REFRESH));
      const res = mockRes();
      const next = jest.fn();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer refresh-t' } }), res, next);
      expect(verifyToken).toHaveBeenCalledWith('refresh-t', [TOKEN_TYPES.ACCESS]);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(User.findByPk).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('optionalAuth 同样只认 access 用途', async () => {
      verifyToken.mockImplementation(verifyWith(TOKEN_TYPES.REFRESH));
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer refresh-t' } });
      await optionalAuth(req, mockRes(), next);
      expect(verifyToken).toHaveBeenCalledWith('refresh-t', [TOKEN_TYPES.ACCESS]);
      expect(req.userId).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('adminAuth 只按 admin 用途校验', async () => {
      verifyToken.mockImplementation(verifyWith(TOKEN_TYPES.ADMIN));
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', status: 1, role_id: null, permissions: '[]' });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer admin-t' } });
      await adminAuth(req, mockRes(), next);
      expect(verifyToken).toHaveBeenCalledWith('admin-t', [TOKEN_TYPES.ADMIN]);
      expect(next).toHaveBeenCalled();
      expect(req.admin.type).toBe(TOKEN_TYPES.ADMIN);
      expect(req.admin.role).toBe('admin');
    });

    it('管理员刷新令牌进不了管理端门禁', async () => {
      verifyToken.mockImplementation(verifyWith(TOKEN_TYPES.ADMIN_REFRESH));
      const res = mockRes();
      const next = jest.fn();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer admin-refresh-t' } }), res, next);
      expect(verifyToken).toHaveBeenCalledWith('admin-refresh-t', [TOKEN_TYPES.ADMIN]);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
      expect(tokenRevocation.checkRevocation).not.toHaveBeenCalled();
    });

    it('用户端 access 令牌进不了管理端', async () => {
      verifyToken.mockImplementation(verifyWith(TOKEN_TYPES.ACCESS));
      const res = mockRes();
      const next = jest.fn();
      await adminAuth(mockReq({ headers: { authorization: 'Bearer user-access-t' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
