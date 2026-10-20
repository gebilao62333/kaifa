const adminManageController = require('../../../src/controllers/adminManage');

jest.mock('bcryptjs');
jest.mock('../../../src/config/jwt', () => ({
  signToken: jest.fn(() => 'tok'),
  verifyToken: jest.fn(),
  // 审计 H-4：控制器按用途签发令牌，mock 必须提供与 src/config/jwt.js 同名同值的常量
  TOKEN_TYPES: { ACCESS: 'access', REFRESH: 'refresh', ADMIN: 'admin', ADMIN_REFRESH: 'admin_refresh' }
}));
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    jwt: { expiresIn: '7d', refreshExpiresIn: '30d', adminExpiresIn: '12h' },
    admin: { emergencyLogin: false },
    nodeEnv: 'test',
    paths: { logs: path.join(os.tmpdir(), 'dsh-adminmanage-test-logs') }
  };
});
jest.mock('../../../src/models', () => ({
  Admin: { findOne: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() },
  AdminRole: { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn() }
}));

jest.mock('../../../src/services/adminLoginGuard', () => ({
  ADMIN_LOGIN_MAX_FAILS: 5,
  ADMIN_LOGIN_FAIL_WINDOW: 900,
  normalizeLoginName: jest.fn((username) => String(username || '').trim().toLowerCase()),
  getLoginLockState: jest.fn(),
  recordLoginFailure: jest.fn(),
  clearLoginFailures: jest.fn()
}));

const bcrypt = require('bcryptjs');
const config = require('../../../src/config');
const { signToken, verifyToken, TOKEN_TYPES } = require('../../../src/config/jwt');
const adminLoginGuard = require('../../../src/services/adminLoginGuard');
const { Admin, AdminRole } = require('../../../src/models');

// 审计 H-5：登出与「改密/禁用/删号」都要写吊销状态，默认给「可确认且成功」
jest.mock('../../../src/services/tokenRevocation', () => ({
  revokeToken: jest.fn(),
  revokeAllAdminTokens: jest.fn(),
  revocationFailMode: jest.fn()
}));
const tokenRevocation = require('../../../src/services/tokenRevocation');

// 审计 M-1：管理端写接口现在读取 req.admin 做权限边界判断，默认给一个超管身份；
// 需要验证「非超管」路径的用例用 overrides.admin 覆盖，验证「未登录」的显式传 admin: null。
const SUPER_ADMIN = { id: 1, username: 'admin', role: 'admin', role_id: 1, permissions: ['all'] };
const mockReq = (overrides = {}) => ({ userId: 100001, admin: SUPER_ADMIN, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - AdminManage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.admin.emergencyLogin = false;
    adminLoginGuard.getLoginLockState.mockResolvedValue({ verifiable: true, locked: false, fails: 0, retryAfterSec: 0 });
    adminLoginGuard.recordLoginFailure.mockResolvedValue(1);
    adminLoginGuard.clearLoginFailures.mockResolvedValue(undefined);
    tokenRevocation.revokeToken.mockResolvedValue({ ok: true, verifiable: true, revoked: true, reason: 'revoked', ttl: 60 });
    tokenRevocation.revokeAllAdminTokens.mockResolvedValue({ ok: true, verifiable: true, revoked: true, reason: 'revoked-all', issuedBefore: 1 });
    // 默认非生产 fail-open；需要验证「写不进就不改库」的用例各自覆盖成 closed
    tokenRevocation.revocationFailMode.mockReturnValue('open');
  });

  describe('adminLogin', () => {
    it('rejects missing credentials', async () => {
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when no admin and no role account', async () => {
      Admin.findOne.mockResolvedValue(null);
      AdminRole.findOne.mockResolvedValue(null);
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'x', password: 'y' } }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when admin is disabled', async () => {
      Admin.findOne.mockResolvedValue({ id: 1, status: 0, password: 'h' });
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'x', password: 'y' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 401 when password does not match', async () => {
      Admin.findOne.mockResolvedValue({ id: 1, status: 1, password: 'h' });
      bcrypt.compare.mockResolvedValue(false);
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'x', password: 'y' } }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('logs in successfully', async () => {
      const update = jest.fn().mockResolvedValue(true);
      Admin.findOne.mockResolvedValue({
        id: 1, username: 'admin', status: 1, password: 'h', role_id: 2,
        nickname: '超管', avatar: '', email: '', phone: '', permissions: '[]',
        create_time: 1, last_login_time: 2, update
      });
      bcrypt.compare.mockResolvedValue(true);
      AdminRole.findByPk.mockResolvedValue({ id: 2, is_super: 1, permissions: '[]' });
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'admin', password: 'y' }, ip: '1.2.3.4' }), res);

      expect(update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200, message: '登录成功' }));
      // 审计 H-4：管理端令牌必须带 type=admin，刷新令牌 type=admin_refresh
      // 审计 M-2：访问令牌时效改用专用 adminExpiresIn，并带 adminScope=account
      expect(signToken).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, role: 'admin', adminScope: 'account', role_id: 2 }),
        config.jwt.adminExpiresIn,
        TOKEN_TYPES.ADMIN
      );
      expect(signToken).toHaveBeenCalledWith(
        { id: 1 },
        config.jwt.refreshExpiresIn,
        TOKEN_TYPES.ADMIN_REFRESH
      );
    });

    it('logs in via role account', async () => {
      Admin.findOne.mockResolvedValue(null);
      AdminRole.findOne.mockResolvedValue({
        id: 7, username: 'roleuser', password: 'h', status: 1, name: '运营',
        permissions: '["user:read"]', is_super: 0, create_time: 3
      });
      bcrypt.compare.mockResolvedValue(true);
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'roleuser', password: 'y' } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '登录成功（角色账号）' }));
      // 审计 H-4：角色账号同样只能签发 admin 用途令牌；审计 M-2：adminScope=role 标明 id 指向 AdminRole
      expect(signToken).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin', adminScope: 'role', roleId: 7 }),
        config.jwt.adminExpiresIn,
        TOKEN_TYPES.ADMIN
      );
      expect(signToken).toHaveBeenCalledWith({ id: 7 }, config.jwt.refreshExpiresIn, TOKEN_TYPES.ADMIN_REFRESH);
    });

    it('ignores role account when disabled or has no password', async () => {
      Admin.findOne.mockResolvedValue(null);
      AdminRole.findOne.mockResolvedValue({ id: 7, username: 'r', status: 0, password: 'h' });
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'r', password: 'y' } }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 503 when database fails and emergency login disabled', async () => {
      Admin.findOne.mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'x', password: 'y' } }), res);
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('returns 500 when db fails and no env credentials', async () => {
      config.admin.emergencyLogin = true;
      delete process.env.ADMIN_USERNAME;
      delete process.env.ADMIN_PASSWORD;
      Admin.findOne.mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'x', password: 'y' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('supports env fallback login', async () => {
      config.admin.emergencyLogin = true;
      process.env.ADMIN_USERNAME = 'envuser';
      process.env.ADMIN_PASSWORD = 'envpass';
      Admin.findOne.mockRejectedValue(new Error('db down'));

      const wrong = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'envuser', password: 'nope' } }), wrong);
      expect(wrong.status).toHaveBeenCalledWith(401);

      const ok = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'envuser', password: 'envpass' } }), ok);
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ message: '登录成功（环境变量回退模式）' }));
      // 审计 H-4：应急回退令牌也只走 admin 用途，不能签成用户 access 令牌
      // 审计 M-2：adminScope=emergency 供中间件识别「无数据库主体」的应急令牌
      expect(signToken).toHaveBeenCalledWith(
        expect.objectContaining({ id: 0, role: 'admin', adminScope: 'emergency' }),
        config.jwt.adminExpiresIn,
        TOKEN_TYPES.ADMIN
      );
      expect(signToken).toHaveBeenCalledTimes(1);

      delete process.env.ADMIN_USERNAME;
      delete process.env.ADMIN_PASSWORD;
    });

    // 审计 M-3：应急回退的账号/口令比较改走常数时间实现。等长近似值必须同样被拒，
    // 否则「逐字符早退」的时长差会变成口令 oracle。
    it('rejects a same-length near-miss emergency password (constant-time compare)', async () => {
      config.admin.emergencyLogin = true;
      process.env.ADMIN_USERNAME = 'envuser';
      process.env.ADMIN_PASSWORD = 'envpass7';
      Admin.findOne.mockRejectedValue(new Error('db down'));

      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'envuser', password: 'envpass8' } }), res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(signToken).not.toHaveBeenCalled();

      delete process.env.ADMIN_USERNAME;
      delete process.env.ADMIN_PASSWORD;
    });

    // ===== 审计 H-3：后台登录失败锁定（与 /api/admin/login 共用同一个计数器）=====
    it('short-circuits a locked account with 429 before touching the database', async () => {
      adminLoginGuard.getLoginLockState.mockResolvedValue({ verifiable: true, locked: true, fails: 5, retryAfterSec: 90 });
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'admin', password: 'y' } }), res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 429,
        message: '登录失败次数过多，请 2 分钟后再试',
        data: { retryAfterSec: 90 }
      }));
      expect(Admin.findOne).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('returns 503 when the lock state is unverifiable', async () => {
      adminLoginGuard.getLoginLockState.mockResolvedValue({ verifiable: false, locked: false, fails: 0, retryAfterSec: 0 });
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'admin', password: 'y' } }), res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(Admin.findOne).not.toHaveBeenCalled();
    });

    it('counts each failed password and clears on success', async () => {
      Admin.findOne.mockResolvedValue({ id: 1, status: 1, password: 'h' });
      bcrypt.compare.mockResolvedValue(false);
      const wrong = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'admin', password: 'y' } }), wrong);
      expect(wrong.status).toHaveBeenCalledWith(401);
      expect(adminLoginGuard.recordLoginFailure).toHaveBeenCalledWith('admin');
      expect(adminLoginGuard.clearLoginFailures).not.toHaveBeenCalled();

      adminLoginGuard.recordLoginFailure.mockClear();
      const update = jest.fn().mockResolvedValue(true);
      Admin.findOne.mockResolvedValue({ id: 1, username: 'admin', status: 1, password: 'h', role_id: null, permissions: '[]', update });
      bcrypt.compare.mockResolvedValue(true);
      const ok = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'admin', password: 'y' }, ip: '1.2.3.4' }), ok);
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
      expect(adminLoginGuard.clearLoginFailures).toHaveBeenCalledWith('admin');
      expect(adminLoginGuard.recordLoginFailure).not.toHaveBeenCalled();
    });

    it('counts a wrong emergency password and an unknown username alike', async () => {
      // 不存在的用户名也计数，否则「会不会被锁」本身就成了账号存在性 oracle
      Admin.findOne.mockResolvedValue(null);
      AdminRole.findOne.mockResolvedValue(null);
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'ghost', password: 'y' } }), res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(adminLoginGuard.recordLoginFailure).toHaveBeenCalledWith('ghost');

      config.admin.emergencyLogin = true;
      process.env.ADMIN_USERNAME = 'envuser';
      process.env.ADMIN_PASSWORD = 'envpass';
      Admin.findOne.mockRejectedValue(new Error('db down'));
      const wrong = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { username: 'envuser', password: 'nope' } }), wrong);
      expect(wrong.status).toHaveBeenCalledWith(401);
      expect(adminLoginGuard.recordLoginFailure).toHaveBeenCalledWith('envuser');
      delete process.env.ADMIN_USERNAME;
      delete process.env.ADMIN_PASSWORD;
    });

    it('does not count requests that never reached credential checking', async () => {
      const res = mockRes();
      await adminManageController.adminLogin(mockReq({ body: { password: 'y' } }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(adminLoginGuard.getLoginLockState).not.toHaveBeenCalled();
      expect(adminLoginGuard.recordLoginFailure).not.toHaveBeenCalled();
    });
  });

  describe('admin CRUD', () => {
    it('getAdminList returns rows', async () => {
      Admin.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });
      const res = mockRes();
      await adminManageController.getAdminList(mockReq({ query: { page: '1', pageSize: '20' } }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
      expect(res.json.mock.calls[0][0].data.pagination.total).toBe(1);
    });

    it('getAdminList supports keyword and status filters', async () => {
      Admin.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      const res = mockRes();
      await adminManageController.getAdminList(mockReq({ query: { keyword: 'ad', status: '1' } }), res);
      expect(Admin.findAndCountAll).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it('getAdminList returns 500 on error', async () => {
      Admin.findAndCountAll.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await adminManageController.getAdminList(mockReq({ query: {} }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('createAdmin rejects missing credentials', async () => {
      const res = mockRes();
      await adminManageController.createAdmin(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('createAdmin rejects duplicate username', async () => {
      Admin.findOne.mockResolvedValue({ id: 1 });
      const res = mockRes();
      await adminManageController.createAdmin(mockReq({ body: { username: 'a', password: 'b' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('createAdmin succeeds', async () => {
      Admin.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      Admin.create.mockResolvedValue({ id: 5, username: 'a', nickname: 'n', email: '', phone: '', role_id: 2, status: 1, create_time: 1 });
      const res = mockRes();
      await adminManageController.createAdmin(mockReq({ body: { username: 'a', password: 'b', permissions: ['user:read'] } }), res);
      expect(Admin.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '创建成功' }));
    });

    it('createAdmin defaults permissions to empty', async () => {
      Admin.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      Admin.create.mockResolvedValue({ id: 6 });
      const res = mockRes();
      await adminManageController.createAdmin(mockReq({ body: { username: 'a', password: 'b' } }), res);
      expect(Admin.create.mock.calls[0][0].permissions).toBe('[]');
    });

    it('createAdmin returns 500 on error', async () => {
      Admin.findOne.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await adminManageController.createAdmin(mockReq({ body: { username: 'a', password: 'b' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('updateAdmin returns 404 when missing', async () => {
      Admin.findByPk.mockResolvedValue(null);
      const res = mockRes();
      await adminManageController.updateAdmin(mockReq({ params: { id: '9' }, body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updateAdmin rejects duplicate username', async () => {
      Admin.findByPk.mockResolvedValue({ id: 9, username: 'old' });
      Admin.findOne.mockResolvedValue({ id: 10 });
      const res = mockRes();
      await adminManageController.updateAdmin(mockReq({ params: { id: '9' }, body: { username: 'new' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('updateAdmin saves changes', async () => {
      const save = jest.fn().mockResolvedValue(true);
      const admin = { id: 9, username: 'old', nickname: 'n', permissions: '[]', save };
      Admin.findByPk.mockResolvedValue(admin);
      Admin.findOne.mockResolvedValue(null);
      // 审计 M-1：改 role_id 会先回查目标角色并过边界校验
      AdminRole.findByPk.mockResolvedValue({ id: 3, is_super: 0, permissions: '[]' });
      const res = mockRes();
      await adminManageController.updateAdmin(mockReq({
        params: { id: '9' },
        body: { username: 'new', nickname: 'nn', email: 'e', phone: 'p', role_id: 3, permissions: ['a'], status: 0 }
      }), res);

      expect(admin.username).toBe('new');
      expect(admin.permissions).toBe('["a"]');
      expect(save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '更新成功' }));
    });

    it('updateAdmin returns 500 on error', async () => {
      Admin.findByPk.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await adminManageController.updateAdmin(mockReq({ params: { id: '9' }, body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('updateAdminPassword validates and saves', async () => {
      const missing = mockRes();
      await adminManageController.updateAdminPassword(mockReq({ params: { id: '9' }, body: {} }), missing);
      expect(missing.status).toHaveBeenCalledWith(400);

      Admin.findByPk.mockResolvedValue(null);
      const notFound = mockRes();
      await adminManageController.updateAdminPassword(mockReq({ params: { id: '9' }, body: { password: 'x' } }), notFound);
      expect(notFound.status).toHaveBeenCalledWith(404);

      const admin = { id: 9, password: 'old', save: jest.fn().mockResolvedValue(true) };
      Admin.findByPk.mockResolvedValue(admin);
      bcrypt.compare.mockResolvedValue(false);
      const badOld = mockRes();
      await adminManageController.updateAdminPassword(mockReq({ params: { id: '9' }, body: { password: 'x', old_password: 'y' } }), badOld);
      expect(badOld.status).toHaveBeenCalledWith(400);

      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('newhash');
      const ok = mockRes();
      await adminManageController.updateAdminPassword(mockReq({ params: { id: '9' }, body: { password: 'x', old_password: 'y' } }), ok);
      expect(admin.password).toBe('newhash');
      // 审计 H-5：消息带上了会话吊销结果，这里只校验前缀
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('密码修改成功') }));
    });

    it('deleteAdmin blocks super admin, 404 and success', async () => {
      const superAdmin = mockRes();
      await adminManageController.deleteAdmin(mockReq({ params: { id: '1' } }), superAdmin);
      expect(superAdmin.status).toHaveBeenCalledWith(400);

      Admin.findByPk.mockResolvedValue(null);
      const notFound = mockRes();
      await adminManageController.deleteAdmin(mockReq({ params: { id: '9' } }), notFound);
      expect(notFound.status).toHaveBeenCalledWith(404);

      const destroy = jest.fn().mockResolvedValue(true);
      Admin.findByPk.mockResolvedValue({ id: 9, destroy });
      const ok = mockRes();
      await adminManageController.deleteAdmin(mockReq({ params: { id: '9' } }), ok);
      expect(destroy).toHaveBeenCalled();
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ message: '删除成功' }));

      Admin.findByPk.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await adminManageController.deleteAdmin(mockReq({ params: { id: '9' } }), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });
  });

  describe('role CRUD', () => {
    it('getRoleList parses permissions and hides password', async () => {
      AdminRole.findAll.mockResolvedValue([
        { toJSON: () => ({ id: 1, name: 'r1', password: 'secret', permissions: '["a"]' }) },
        { toJSON: () => ({ id: 2, name: 'r2', permissions: 'not-json' }) }
      ]);
      const res = mockRes();
      await adminManageController.getRoleList(mockReq({ query: { status: '1' } }), res);
      const data = res.json.mock.calls[0][0].data;
      expect(data[0].password).toBeUndefined();
      expect(data[0].permissions).toEqual(['a']);
      expect(data[1].permissions).toEqual([]);
    });

    it('getRoleList returns 500 on error', async () => {
      AdminRole.findAll.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await adminManageController.getRoleList(mockReq({ query: {} }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('createRole validates name, duplicates and account rules', async () => {
      const noName = mockRes();
      await adminManageController.createRole(mockReq({ body: {} }), noName);
      expect(noName.status).toHaveBeenCalledWith(400);

      AdminRole.findOne.mockResolvedValue({ id: 1 });
      const dupName = mockRes();
      await adminManageController.createRole(mockReq({ body: { name: 'x' } }), dupName);
      expect(dupName.status).toHaveBeenCalledWith(400);

      AdminRole.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2 });
      const dupAccount = mockRes();
      await adminManageController.createRole(mockReq({ body: { name: 'x', username: 'u' } }), dupAccount);
      expect(dupAccount.status).toHaveBeenCalledWith(400);

      AdminRole.findOne.mockResolvedValue(null);
      const noPassword = mockRes();
      await adminManageController.createRole(mockReq({ body: { name: 'x', username: 'u' } }), noPassword);
      expect(noPassword.status).toHaveBeenCalledWith(400);
    });

    it('createRole succeeds with and without account', async () => {
      AdminRole.findOne.mockResolvedValue(null);
      AdminRole.create.mockResolvedValue({ id: 1, name: 'r' });
      const withAccount = mockRes();
      await adminManageController.createRole(mockReq({ body: { name: 'r', username: 'u', password: 'p', permissions: ['a'] } }), withAccount);
      expect(withAccount.json).toHaveBeenCalledWith(expect.objectContaining({ message: '创建成功' }));

      const withoutAccount = mockRes();
      await adminManageController.createRole(mockReq({ body: { name: 'r2' } }), withoutAccount);
      expect(withoutAccount.json).toHaveBeenCalledWith(expect.objectContaining({ message: '创建成功' }));
    });

    it('createRole returns 500 on error', async () => {
      AdminRole.findOne.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await adminManageController.createRole(mockReq({ body: { name: 'r' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('updateRole returns 404 when missing', async () => {
      AdminRole.findByPk.mockResolvedValue(null);
      const res = mockRes();
      await adminManageController.updateRole(mockReq({ params: { id: '9' }, body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updateRole rejects duplicate name and account', async () => {
      AdminRole.findByPk.mockResolvedValue({ id: 9, name: 'old', is_super: 0 });
      AdminRole.findOne.mockResolvedValue({ id: 10 });
      const dupName = mockRes();
      await adminManageController.updateRole(mockReq({ params: { id: '9' }, body: { name: 'new' } }), dupName);
      expect(dupName.status).toHaveBeenCalledWith(400);

      AdminRole.findByPk.mockResolvedValue({ id: 9, name: 'old', username: 'olduser', is_super: 0 });
      AdminRole.findOne.mockResolvedValue({ id: 11 });
      const dupAccount = mockRes();
      await adminManageController.updateRole(mockReq({ params: { id: '9' }, body: { username: 'newuser' } }), dupAccount);
      expect(dupAccount.status).toHaveBeenCalledWith(400);
    });

    it('updateRole updates normal role fields', async () => {
      const save = jest.fn().mockResolvedValue(true);
      const role = { id: 9, name: 'old', username: null, is_super: 0, permissions: '[]', save };
      AdminRole.findByPk.mockResolvedValue(role);
      AdminRole.findOne.mockResolvedValue(null);
      const res = mockRes();
      await adminManageController.updateRole(mockReq({
        params: { id: '9' },
        body: { name: 'new', username: 'acct', password: 'p', description: 'd', permissions: ['x'], status: 0, sort: 3 }
      }), res);

      expect(role.name).toBe('new');
      expect(role.username).toBe('acct');
      expect(save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '更新成功' }));
    });

    it('updateRole clears account when username is empty', async () => {
      const role = { id: 9, name: 'old', username: 'u', password: 'h', is_super: 0, save: jest.fn() };
      AdminRole.findByPk.mockResolvedValue(role);
      const res = mockRes();
      await adminManageController.updateRole(mockReq({ params: { id: '9' }, body: { username: '' } }), res);
      expect(role.username).toBeNull();
      expect(role.password).toBeNull();
    });

    it('updateRole centers password change and locks super fields', async () => {
      const role = { id: 9, name: 'super', username: 'su', is_super: 1, save: jest.fn() };
      AdminRole.findByPk.mockResolvedValue(role);
      bcrypt.hash.mockResolvedValue('hashed');
      AdminRole.findOne.mockResolvedValue(null);
      const res = mockRes();
      await adminManageController.updateRole(mockReq({
        params: { id: '9' },
        body: { name: 'changed', password: 'newpass', permissions: ['x'], status: 0 }
      }), res);

      expect(role.name).toBe('super');
      expect(role.password).toBe('hashed');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '更新成功' }));
    });

    it('updateRole returns 500 on error', async () => {
      AdminRole.findByPk.mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await adminManageController.updateRole(mockReq({ params: { id: '9' }, body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('deleteRole handles missing, super and success', async () => {
      AdminRole.findByPk.mockResolvedValue(null);
      const notFound = mockRes();
      await adminManageController.deleteRole(mockReq({ params: { id: '9' } }), notFound);
      expect(notFound.status).toHaveBeenCalledWith(404);

      AdminRole.findByPk.mockResolvedValue({ id: 9, is_super: 1 });
      const superRole = mockRes();
      await adminManageController.deleteRole(mockReq({ params: { id: '9' } }), superRole);
      expect(superRole.status).toHaveBeenCalledWith(400);

      const destroy = jest.fn().mockResolvedValue(true);
      AdminRole.findByPk.mockResolvedValue({ id: 9, is_super: 0, destroy });
      const ok = mockRes();
      await adminManageController.deleteRole(mockReq({ params: { id: '9' } }), ok);
      expect(destroy).toHaveBeenCalled();
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ message: '删除成功' }));

      AdminRole.findByPk.mockRejectedValue(new Error('bad'));
      const err = mockRes();
      await adminManageController.deleteRole(mockReq({ params: { id: '9' } }), err);
      expect(err.status).toHaveBeenCalledWith(500);
    });
  });

  // ===== 审计 M-1：后台 RBAC 自提权边界 =====
  // 扫描事实：任何持 admin:write 的管理员都能给账号写 permissions:['all'] 或改 role_id 成为超管，
  // 既无「须超管」也无「授予集 ⊆ 自身集」校验。以下用例锁定修复后的边界行为。
  describe('后台 RBAC 自提权防护（审计 M-1）', () => {
    // 非超管操作者：只持有部分业务权限 + admin:write
    const opsAdmin = {
      id: 8, username: 'ops', role: 'admin', role_id: 8,
      permissions: ['user:read', 'user:write', 'admin:write']
    };

    it('非超管创建管理员不能授予超出自身范围的权限，也不能挂超管角色', async () => {
      Admin.findOne.mockResolvedValue(null);
      const beyondPerms = mockRes();
      await adminManageController.createAdmin(mockReq({
        admin: opsAdmin,
        body: { username: 'a', password: 'b', permissions: ['all'] }
      }), beyondPerms);
      expect(beyondPerms.status).toHaveBeenCalledWith(403);
      expect(beyondPerms.json.mock.calls[0][0].message).toContain('无权授予超出自身权限范围的权限');
      expect(Admin.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();

      AdminRole.findByPk.mockResolvedValue({ id: 1, is_super: 1, permissions: '["all"]' });
      const superRole = mockRes();
      await adminManageController.createAdmin(mockReq({
        admin: opsAdmin,
        body: { username: 'a', password: 'b', role_id: 1 }
      }), superRole);
      expect(superRole.status).toHaveBeenCalledWith(403);
      expect(Admin.create).not.toHaveBeenCalled();
    });

    it('非超管创建管理员不能挂权限超出自身的角色', async () => {
      Admin.findOne.mockResolvedValue(null);
      AdminRole.findByPk.mockResolvedValue({ id: 5, is_super: 0, permissions: '["finance:read"]' });
      const res = mockRes();
      await adminManageController.createAdmin(mockReq({
        admin: opsAdmin,
        body: { username: 'a', password: 'b', role_id: 5 }
      }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(Admin.create).not.toHaveBeenCalled();
    });

    it('非超管在自身范围内创建管理员成功', async () => {
      Admin.findOne.mockResolvedValue(null);
      AdminRole.findByPk.mockResolvedValue({ id: 5, is_super: 0, permissions: '["user:read"]' });
      bcrypt.hash.mockResolvedValue('hashed');
      Admin.create.mockResolvedValue({ id: 6, role_id: 5 });
      const res = mockRes();
      await adminManageController.createAdmin(mockReq({
        admin: opsAdmin,
        body: { username: 'a', password: 'b', role_id: 5, permissions: ['user:write'] }
      }), res);
      expect(Admin.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '创建成功' }));
    });

    it('非超管不能修改超管管理员、权限含 all 的账号', async () => {
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', role_id: 1 });
      const superTarget = mockRes();
      await adminManageController.updateAdmin(mockReq({
        admin: opsAdmin, params: { id: '1' }, body: { nickname: 'x' }
      }), superTarget);
      expect(superTarget.status).toHaveBeenCalledWith(403);

      Admin.findByPk.mockResolvedValue({ id: 9, username: 'peer', role_id: 0, permissions: '["all"]' });
      const allPermsTarget = mockRes();
      await adminManageController.updateAdmin(mockReq({
        admin: opsAdmin, params: { id: '9' }, body: { nickname: 'x' }
      }), allPermsTarget);
      expect(allPermsTarget.status).toHaveBeenCalledWith(403);
    });

    it('非超管不能给目标写入 all 权限', async () => {
      const save = jest.fn();
      Admin.findByPk.mockResolvedValue({ id: 9, username: 'peer', role_id: 8, permissions: '[]', save });
      AdminRole.findByPk.mockResolvedValue({ id: 8, is_super: 0, permissions: '[]' });
      const res = mockRes();
      await adminManageController.updateAdmin(mockReq({
        admin: opsAdmin, params: { id: '9' }, body: { permissions: ['user:read', 'all'] }
      }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(save).not.toHaveBeenCalled();
    });

    it('非超管不能把目标改成超管角色', async () => {
      const save = jest.fn();
      Admin.findByPk.mockResolvedValue({ id: 9, username: 'peer', role_id: 8, permissions: '[]', save });
      AdminRole.findByPk.mockImplementation(async (rid) => (
        Number(rid) === 1
          ? { id: 1, is_super: 1, permissions: '["all"]' }
          : { id: 8, is_super: 0, permissions: '[]' }
      ));
      const res = mockRes();
      await adminManageController.updateAdmin(mockReq({
        admin: opsAdmin, params: { id: '9' }, body: { role_id: 1 }
      }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(save).not.toHaveBeenCalled();
    });

    it('非超管不能重置超管密码', async () => {
      const save = jest.fn();
      Admin.findByPk.mockResolvedValue({ id: 1, username: 'admin', password: 'h', role_id: 1, save });
      const res = mockRes();
      await adminManageController.updateAdminPassword(mockReq({
        admin: opsAdmin, params: { id: '1' }, body: { password: 'new' }
      }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(tokenRevocation.revokeAllAdminTokens).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    });

    it('非超管不能删除权限超出自身的管理员', async () => {
      const destroy = jest.fn();
      Admin.findByPk.mockResolvedValue({ id: 9, username: 'boss', role_id: 5, permissions: '[]', destroy });
      AdminRole.findByPk.mockResolvedValue({ id: 5, is_super: 0, permissions: '["settings:read"]' });
      const res = mockRes();
      await adminManageController.deleteAdmin(mockReq({ admin: opsAdmin, params: { id: '9' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(destroy).not.toHaveBeenCalled();
      expect(tokenRevocation.revokeAllAdminTokens).not.toHaveBeenCalled();
    });

    it('非超管不能创建/改写权限超出自身的角色', async () => {
      AdminRole.findOne.mockResolvedValue(null);
      const create = mockRes();
      await adminManageController.createRole(mockReq({
        admin: opsAdmin, body: { name: 'r', permissions: ['settings:write'] }
      }), create);
      expect(create.status).toHaveBeenCalledWith(403);
      expect(AdminRole.create).not.toHaveBeenCalled();

      const save = jest.fn();
      AdminRole.findByPk.mockResolvedValue({ id: 9, name: 'r9', is_super: 0, permissions: '["user:read"]', save });
      const update = mockRes();
      await adminManageController.updateRole(mockReq({
        admin: opsAdmin, params: { id: '9' }, body: { permissions: ['order:write'] }
      }), update);
      expect(update.status).toHaveBeenCalledWith(403);
      expect(save).not.toHaveBeenCalled();
    });

    it('非超管不能改超管角色的登录账号（否则等于夺取超管）', async () => {
      const role = { id: 1, name: '超级管理员', username: null, is_super: 1, save: jest.fn() };
      AdminRole.findByPk.mockResolvedValue(role);
      const res = mockRes();
      await adminManageController.updateRole(mockReq({
        admin: opsAdmin, params: { id: '1' }, body: { username: 'ops-takeover', password: 'p' }
      }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(role.save).not.toHaveBeenCalled();
    });

    it('非超管不能删除权限超出自身的角色', async () => {
      const destroy = jest.fn();
      AdminRole.findByPk.mockResolvedValue({ id: 9, name: 'r9', is_super: 0, permissions: '["finance:read"]', destroy });
      const res = mockRes();
      await adminManageController.deleteRole(mockReq({ admin: opsAdmin, params: { id: '9' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(destroy).not.toHaveBeenCalled();
    });

    it('超管不受边界限制（回归）', async () => {
      Admin.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      Admin.create.mockResolvedValue({ id: 7 });
      const created = mockRes();
      await adminManageController.createAdmin(mockReq({
        body: { username: 'a', password: 'b', permissions: ['all'] }
      }), created);
      expect(created.json).toHaveBeenCalledWith(expect.objectContaining({ message: '创建成功' }));

      const role = { id: 1, name: '超级管理员', username: 'su', is_super: 1, save: jest.fn().mockResolvedValue(true) };
      AdminRole.findByPk.mockResolvedValue(role);
      bcrypt.hash.mockResolvedValue('hashed');
      const managed = mockRes();
      await adminManageController.updateRole(mockReq({ params: { id: '1' }, body: { password: 'np' } }), managed);
      expect(role.password).toBe('hashed');
      expect(managed.json).toHaveBeenCalledWith(expect.objectContaining({ message: '更新成功' }));
    });
  });

  describe('permissions / current admin', () => {
    it('getPermissions returns module ids + permission-key truth source', async () => {
      const res = mockRes();
      await adminManageController.getPermissions(mockReq(), res);
      const data = res.json.mock.calls[0][0].data;
      expect(Array.isArray(data.modules)).toBe(true);
      expect(data.modules.length).toBeGreaterThan(0);
      expect(Array.isArray(data.permissions)).toBe(true);
      expect(data.permissions.some((p) => p.key === 'user:read')).toBe(true);
      expect(data.permissions.some((p) => p.key === 'settings:write')).toBe(true);
    });

    it('getCurrentAdmin returns 401 without admin and data with admin', async () => {
      const noAuth = mockRes();
      await adminManageController.getCurrentAdmin(mockReq({ admin: null }), noAuth);
      expect(noAuth.status).toHaveBeenCalledWith(401);

      const ok = mockRes();
      await adminManageController.getCurrentAdmin(mockReq({ admin: { id: 1, username: 'a' } }), ok);
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
    });
  });

  describe('登出与会话吊销（审计 H-5）', () => {
    const adminRow = () => ({
      id: 3,
      username: 'ops',
      password: 'old-hash',
      status: 1,
      save: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true)
    });

    it('登出吊销的是本次请求命中的那一枚令牌', async () => {
      const res = mockRes();
      await adminManageController.adminLogout(mockReq({ adminToken: 'admin-t', adminTokenKind: 'jwt', admin: { id: 3 } }), res);

      expect(tokenRevocation.revokeToken).toHaveBeenCalledWith('admin-t');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
      expect(res.json.mock.calls[0][0].data).toEqual({ clientShouldClearToken: true, revocable: true, serverRevoked: true });
    });

    it('应急固定令牌走「不可吊销」分支，不会把环境变量密文写进 Redis', async () => {
      const res = mockRes();
      await adminManageController.adminLogout(
        mockReq({ adminToken: 'fixed-admin-token', adminTokenKind: 'emergency', admin: { id: 0 } }),
        res
      );

      expect(tokenRevocation.revokeToken).not.toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].data).toMatchObject({ clientShouldClearToken: true, revocable: false });
    });

    it('本人 admin_refresh 一并吊销；别人的直接忽略', async () => {
      verifyToken.mockReturnValue({ id: 3, type: 'admin_refresh' });
      const own = mockRes();
      await adminManageController.adminLogout(
        mockReq({ adminToken: 'admin-t', adminTokenKind: 'jwt', admin: { id: 3 }, body: { refreshToken: 'ar-t' } }),
        own
      );
      expect(verifyToken).toHaveBeenCalledWith('ar-t', [TOKEN_TYPES.ADMIN_REFRESH]);
      expect(tokenRevocation.revokeToken).toHaveBeenCalledWith('ar-t');

      tokenRevocation.revokeToken.mockClear();
      verifyToken.mockReturnValue({ id: 9, type: 'admin_refresh' });
      const other = mockRes();
      await adminManageController.adminLogout(
        mockReq({ adminToken: 'admin-t', adminTokenKind: 'jwt', admin: { id: 3 }, body: { refreshToken: 'someone-else' } }),
        other
      );
      expect(tokenRevocation.revokeToken).toHaveBeenCalledTimes(1);
    });

    it('生产（fail-closed）吊销写不进去时回 503，不假装已登出', async () => {
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      tokenRevocation.revokeToken.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });
      const res = mockRes();
      await adminManageController.adminLogout(mockReq({ adminToken: 'admin-t', adminTokenKind: 'jwt', admin: { id: 3 } }), res);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('非生产（fail-open）没有 Redis 也能退出后台，但 serverRevoked=false', async () => {
      tokenRevocation.revokeToken.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });
      const res = mockRes();
      await adminManageController.adminLogout(mockReq({ adminToken: 'admin-t', adminTokenKind: 'jwt', admin: { id: 3 } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
      expect(res.json.mock.calls[0][0].data.serverRevoked).toBe(false);
    });

    it('改管理员口令前先吊销该账号全部会话（adminAuth 不回查库，吊销是唯一收口）', async () => {
      const admin = adminRow();
      Admin.findByPk.mockResolvedValue(admin);
      const revokeBeforeSave = tokenRevocation.revokeAllAdminTokens.mock.invocationCallOrder;

      const res = mockRes();
      await adminManageController.updateAdminPassword(mockReq({ params: { id: '3' }, body: { password: 'newpass' } }), res);

      expect(tokenRevocation.revokeAllAdminTokens).toHaveBeenCalledWith(3);
      expect(revokeBeforeSave[0]).toBeLessThan(admin.save.mock.invocationCallOrder[0]);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
    });

    it('生产吊销无法确认时不改口令，回 503', async () => {
      const admin = adminRow();
      Admin.findByPk.mockResolvedValue(admin);
      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      tokenRevocation.revokeAllAdminTokens.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });

      const res = mockRes();
      await adminManageController.updateAdminPassword(mockReq({ params: { id: '3' }, body: { password: 'newpass' } }), res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(admin.save).not.toHaveBeenCalled();
    });

    it('非生产吊销失败仍完成改密，但如实回报 sessionsRevoked=false', async () => {
      const admin = adminRow();
      Admin.findByPk.mockResolvedValue(admin);
      tokenRevocation.revokeAllAdminTokens.mockResolvedValue({ ok: false, verifiable: false, reason: 'redis-unavailable' });

      const res = mockRes();
      await adminManageController.updateAdminPassword(mockReq({ params: { id: '3' }, body: { password: 'newpass' } }), res);

      expect(admin.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: '密码修改成功，但旧会话未能确认作废',
        data: { sessionsRevoked: false }
      }));
    });

    it('删除管理员前先吊销其会话，删不掉就不删', async () => {
      const admin = adminRow();
      Admin.findByPk.mockResolvedValue(admin);

      const res = mockRes();
      await adminManageController.deleteAdmin(mockReq({ params: { id: '3' } }), res);
      expect(tokenRevocation.revokeAllAdminTokens.mock.invocationCallOrder[0])
        .toBeLessThan(admin.destroy.mock.invocationCallOrder[0]);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));

      tokenRevocation.revocationFailMode.mockReturnValue('closed');
      tokenRevocation.revokeAllAdminTokens.mockResolvedValue({ ok: false, verifiable: false });
      const blocked = adminRow();
      Admin.findByPk.mockResolvedValue(blocked);
      const blockedRes = mockRes();
      await adminManageController.deleteAdmin(mockReq({ params: { id: '4' } }), blockedRes);
      expect(blockedRes.status).toHaveBeenCalledWith(503);
      expect(blocked.destroy).not.toHaveBeenCalled();
      tokenRevocation.revocationFailMode.mockReturnValue('open');
    });

    it('禁用管理员才吊销，普通字段编辑不动会话', async () => {
      const disabled = adminRow();
      Admin.findByPk.mockResolvedValue(disabled);
      await adminManageController.updateAdmin(mockReq({ params: { id: '3' }, body: { status: 0 } }), mockRes());
      expect(tokenRevocation.revokeAllAdminTokens).toHaveBeenCalledWith(3);

      tokenRevocation.revokeAllAdminTokens.mockClear();
      const renamed = adminRow();
      Admin.findByPk.mockResolvedValue(renamed);
      await adminManageController.updateAdmin(mockReq({ params: { id: '3' }, body: { nickname: '新昵称' } }), mockRes());
      expect(tokenRevocation.revokeAllAdminTokens).not.toHaveBeenCalled();
    });
  });
});
