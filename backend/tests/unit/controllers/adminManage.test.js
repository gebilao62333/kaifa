const adminManageController = require('../../../src/controllers/adminManage');

jest.mock('bcryptjs');
jest.mock('../../../src/config/jwt', () => ({ signToken: jest.fn(() => 'tok') }));
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    jwt: { expiresIn: '7d', refreshExpiresIn: '30d' },
    admin: { emergencyLogin: false },
    nodeEnv: 'test',
    paths: { logs: path.join(os.tmpdir(), 'dsh-adminmanage-test-logs') }
  };
});
jest.mock('../../../src/models', () => ({
  Admin: { findOne: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() },
  AdminRole: { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn() }
}));

const bcrypt = require('bcryptjs');
const config = require('../../../src/config');
const { Admin, AdminRole } = require('../../../src/models');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
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

      delete process.env.ADMIN_USERNAME;
      delete process.env.ADMIN_PASSWORD;
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
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ message: '密码修改成功' }));
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

  describe('permissions / current admin', () => {
    it('getPermissions returns permission list', async () => {
      const res = mockRes();
      await adminManageController.getPermissions(mockReq(), res);
      const data = res.json.mock.calls[0][0].data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('getCurrentAdmin returns 401 without admin and data with admin', async () => {
      const noAuth = mockRes();
      await adminManageController.getCurrentAdmin(mockReq(), noAuth);
      expect(noAuth.status).toHaveBeenCalledWith(401);

      const ok = mockRes();
      await adminManageController.getCurrentAdmin(mockReq({ admin: { id: 1, username: 'a' } }), ok);
      expect(ok.json).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
    });
  });
});
