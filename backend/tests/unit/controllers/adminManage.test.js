/**
 * adminManage Controller 单元测试
 * 覆盖：adminLogin, getAdminList, createAdmin, updateAdmin,
 *       updateAdminPassword, deleteAdmin, getRoleList, createRole,
 *       updateRole, deleteRole, getPermissions, getCurrentAdmin, initAdmin
 */

// Mock 环境变量
process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
jest.mock('../../../src/utils/logger', () => mockLogger);

let mockSignToken = jest.fn(() => 'mock-jwt-token');
jest.mock('../../../src/config/jwt', () => ({
  signToken: mockSignToken
}));

jest.mock('../../../src/config', () => ({
  jwt: { expiresIn: '7d', refreshExpiresIn: '30d' },
  nodeEnv: 'development'
}));

jest.mock('../../../src/utils/response', () => ({
  success: jest.fn((res, data, msg) => res.status(200).json({ code: 200, message: msg, data })),
  created: jest.fn((res, data, msg) => res.status(201).json({ code: 201, message: msg, data })),
  badRequest: jest.fn((res, msg) => res.status(400).json({ code: 400, message: msg })),
  unauthorized: jest.fn((res, msg) => res.status(401).json({ code: 401, message: msg })),
  forbidden: jest.fn((res, msg) => res.status(403).json({ code: 403, message: msg })),
  notFound: jest.fn((res, msg) => res.status(404).json({ code: 404, message: msg })),
  error: jest.fn((res, msg) => res.status(500).json({ code: 500, message: msg }))
}));

const controller = require('../../../src/controllers/adminManage');

describe('Controller - adminManage', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      admin: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ==================== adminLogin ====================
  describe('adminLogin', () => {
    it('应拒绝缺少用户名和密码的请求', async () => {
      req.body = {};
      await controller.adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应正确验证管理员凭据', async () => {
      req.body = { username: 'admin', password: 'admin123' };
      await controller.adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const calls = res.json.mock.calls[0][0];
      expect(calls.code).toBe(200);
      expect(calls.data.token).toBe('mock-jwt-token');
      expect(calls.message).toBe('登录成功');
    });

    it('应拒绝错误的密码', async () => {
      req.body = { username: 'admin', password: 'wrong' };
      await controller.adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('应拒绝不存在的用户名', async () => {
      req.body = { username: 'nonexistent', password: 'admin123' };
      await controller.adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ==================== getAdminList ====================
  describe('getAdminList', () => {
    it('应返回管理员列表', async () => {
      await controller.getAdminList(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const calls = res.json.mock.calls[0][0];
      expect(calls.data.list).toBeDefined();
      expect(calls.data.pagination).toBeDefined();
    });

    it('应支持分页参数', async () => {
      req.query = { page: '1', pageSize: '10' };
      await controller.getAdminList(req, res);
      const calls = res.json.mock.calls[0][0];
      expect(calls.data.pagination.page).toBe(1);
      expect(calls.data.pagination.pageSize).toBe(10);
    });

    it('应支持关键词搜索', async () => {
      req.query = { keyword: 'admin' };
      await controller.getAdminList(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== createAdmin ====================
  describe('createAdmin', () => {
    it('应拒绝缺少用户名或密码的创建请求', async () => {
      req.body = { nickname: 'test' };
      await controller.createAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应创建新管理员', async () => {
      req.body = { username: 'testadmin', password: 'test123', nickname: '测试' };
      await controller.createAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('应拒绝重复用户名', async () => {
      req.body = { username: 'admin', password: 'test123' };
      await controller.createAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==================== updateAdmin ====================
  describe('updateAdmin', () => {
    it('应拒绝更新不存在的管理员', async () => {
      req.params = { id: '9999' };
      req.body = { nickname: 'newname' };
      await controller.updateAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('应更新管理员信息', async () => {
      req.params = { id: '1' };
      req.body = { nickname: '新昵称' };
      await controller.updateAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== updateAdminPassword ====================
  describe('updateAdminPassword', () => {
    it('应拒绝修改不存在管理员的密码', async () => {
      req.params = { id: '9999' };
      req.body = { newPassword: 'newpass123' };
      await controller.updateAdminPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('应成功修改密码', async () => {
      req.params = { id: '1' };
      req.body = { newPassword: 'newpass123' };
      await controller.updateAdminPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== deleteAdmin ====================
  describe('deleteAdmin', () => {
    it('应拒绝删除超级管理员(id=1)', async () => {
      req.params = { id: '1' };
      await controller.deleteAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应拒绝删除不存在的管理员', async () => {
      req.params = { id: '9999' };
      await controller.deleteAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ==================== getRoleList ====================
  describe('getRoleList', () => {
    it('应返回角色列表', async () => {
      await controller.getRoleList(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== createRole ====================
  describe('createRole', () => {
    it('应拒绝缺少名称的创建请求', async () => {
      req.body = { description: 'test' };
      await controller.createRole(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应创建新角色', async () => {
      req.body = { name: '测试角色', description: '测试描述' };
      await controller.createRole(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== updateRole ====================
  describe('updateRole', () => {
    it('应拒绝更新不存在的角色', async () => {
      req.params = { id: '9999' };
      req.body = { name: 'newname' };
      await controller.updateRole(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('应更新角色信息', async () => {
      // Mock 中 id=1 的角色 is_super=1，不可修改，先创建一个非超管角色再更新
      await controller.createRole({ body: { name: '可修改角色', description: 'test' } }, res);
      jest.clearAllMocks();
      // 新角色 id=2，is_super=0
      req.params = { id: '2' };
      req.body = { name: '更新角色' };
      await controller.updateRole(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== deleteRole ====================
  describe('deleteRole', () => {
    it('应拒绝删除不存在的角色', async () => {
      req.params = { id: '9999' };
      await controller.deleteRole(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ==================== getPermissions ====================
  describe('getPermissions', () => {
    it('应返回权限列表', async () => {
      await controller.getPermissions(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const calls = res.json.mock.calls[0][0];
      expect(Array.isArray(calls.data)).toBe(true);
      expect(calls.data.length).toBeGreaterThan(0);
    });
  });

  // ==================== getCurrentAdmin ====================
  describe('getCurrentAdmin', () => {
    it('未登录时应返回401', async () => {
      await controller.getCurrentAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('已登录时应返回管理员信息', async () => {
      req.admin = { id: 1, username: 'admin', nickname: '超级管理员' };
      await controller.getCurrentAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== initAdmin ====================
  describe('initAdmin', () => {
    it('应返回初始化信息', async () => {
      await controller.initAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const calls = res.json.mock.calls[0][0];
      expect(calls.data.username).toBeDefined();
    });
  });
});
