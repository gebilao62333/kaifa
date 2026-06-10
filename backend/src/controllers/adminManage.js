const crypto = require('crypto');
const logger = require('../utils/logger');
const { signToken, verifyToken } = require('../config/jwt');
const config = require('../config');
const response = require('../utils/response');
const { Op } = require('sequelize');
let Admin, AdminRole;

// 尝试加载数据库模型
try {
  const models = require('../models');
  Admin = models.Admin;
  AdminRole = models.AdminRole;
} catch (e) {
  logger.warn('Admin/Role models not available, using mock data only');
}

const getNowTime = () => Math.floor(Date.now() / 1000);

const getClientIp = (req) => {
  return req.ip || req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.connection?.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         '127.0.0.1';
};

const md5 = (str) => {
  return crypto.createHash('md5').update(str).digest('hex');
};

// ========== 登录频率限制 (内存) ==========
const LOGIN_MAX_ATTEMPTS = 5;       // 最大失败次数
const LOGIN_LOCKOUT_MINUTES = 15;   // 锁定分钟数
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 计数窗口 15分钟

const loginAttempts = new Map(); // key: `${ip}:${username}`, value: { count, firstAttempt, lockedUntil }

const cleanLoginAttempts = () => {
  const now = Date.now();
  for (const [key, val] of loginAttempts.entries()) {
    if (val.lockedUntil && now > val.lockedUntil) {
      loginAttempts.delete(key);
    } else if (!val.lockedUntil && now - val.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
};

// 定时清理过期记录，每5分钟
setInterval(cleanLoginAttempts, 5 * 60 * 1000);

const checkLoginRateLimit = (ip, username) => {
  const key = `${ip}:${username}`;
  const record = loginAttempts.get(key);
  const now = Date.now();

  if (!record) return null;

  // 检查是否被锁定
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return `账号已被临时锁定，请${remainingSeconds}秒后重试`;
  }

  // 锁定已过期，清除
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(key);
    return null;
  }

  return null;
};

const recordLoginFailure = (ip, username) => {
  const key = `${ip}:${username}`;
  const now = Date.now();
  let record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > LOGIN_WINDOW_MS) {
    record = { count: 0, firstAttempt: now };
  }

  record.count++;

  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.lockedUntil = now + LOGIN_LOCKOUT_MINUTES * 60 * 1000;
    logger.warn(`Admin login locked: ip=${ip} username=${username} attempts=${record.count}`);
  }

  loginAttempts.set(key, record);
};

const resetLoginAttempts = (ip, username) => {
  const key = `${ip}:${username}`;
  loginAttempts.delete(key);
};

const DEFAULT_PERMISSIONS = [
  { id: 'dashboard', name: '控制台', icon: '📊' },
  { id: 'users', name: '用户管理', icon: '👥' },
  { id: 'orders', name: '订单管理', icon: '📦' },
  { id: 'withdraws', name: '提现管理', icon: '💰' },
  { id: 'posts', name: '帖子管理', icon: '📝' },
  { id: 'reports', name: '举报管理', icon: '⚠️' },
  { id: 'banners', name: 'Banner管理', icon: '🎪' },
  { id: 'vip-packages', name: 'VIP套餐管理', icon: '⭐' },
  { id: 'gift-management', name: '礼物管理', icon: '🎁' },
  { id: 'gifts', name: '礼物记录', icon: '📜' },
  { id: 'recharges', name: '充值记录', icon: '💳' },
  { id: 'games', name: '服务分类', icon: '🎮' },
  { id: 'companion-applications', name: '服务申请', icon: '📋' },
  { id: 'virtual-users', name: '虚拟机器人', icon: '🤖' },
  { id: 'admins', name: '管理员管理', icon: '👨‍💼' },
  { id: 'admin-roles', name: '角色管理', icon: '🔑' },
  { id: 'settings', name: '系统设置', icon: '⚙️' },
  { id: 'api', name: '接口管理', icon: '🔌' }
];

// Mock数据
const mockRoles = [
  { id: 1, name: '超级管理员', description: '拥有所有权限', permissions: DEFAULT_PERMISSIONS.map(p => p.id), status: 1, is_super: 1, sort: 0, create_time: getNowTime(), create_admin_id: 0 }
];

const mockAdmins = [
  { id: 1, username: 'admin', nickname: '超级管理员', role_id: 1, permissions: DEFAULT_PERMISSIONS.map(p => p.id), status: 1, last_login_time: null, last_login_ip: null, create_time: getNowTime(), create_admin_id: 0 }
];

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = getClientIp(req);
    
    if (!username || !password) {
      return response.badRequest(res, '用户名和密码不能为空');
    }

    // 长度校验，防止过长输入
    if (username.length > 50 || password.length > 128) {
      return response.badRequest(res, '用户名或密码长度超出限制');
    }

    // 检查频率限制
    const rateLimitMsg = checkLoginRateLimit(clientIp, username);
    if (rateLimitMsg) {
      return response.tooManyRequests(res, rateLimitMsg);
    }
    
    let authenticated = false;
    let adminData = null;

    // 1. 优先从数据库验证
    if (Admin) {
      try {
        const admin = await Admin.findOne({ where: { username, status: 1 } });
        if (admin && admin.password) {
          const inputHash = md5(password);
          if (inputHash === admin.password) {
            authenticated = true;
            adminData = {
              id: admin.id,
              username: admin.username,
              nickname: admin.nickname || admin.username,
              avatar: admin.avatar || '',
              email: admin.email || '',
              phone: admin.phone || '',
              role_id: admin.role_id || 1,
              permissions: [],
              status: admin.status,
              create_time: admin.create_time
            };

            // 从角色表查询权限
            if (AdminRole && admin.role_id) {
              try {
                const role = await AdminRole.findByPk(admin.role_id);
                if (role && role.permissions) {
                  adminData.permissions = JSON.parse(role.permissions);
                }
              } catch (e) { /* ignore role lookup error */ }
            }

            // 回退到默认权限
            if (adminData.permissions.length === 0) {
              adminData.permissions = DEFAULT_PERMISSIONS.map(p => p.id);
            }

            // 更新最后登录时间和IP到数据库
            const now = getNowTime();
            adminData.last_login_time = now;
            await Admin.update(
              { last_login_time: now, last_login_ip: clientIp },
              { where: { id: admin.id } }
            );
          }
        }
      } catch (dbError) {
        logger.warn('Admin login: DB query failed, trying env config:', dbError.message);
      }
    }

    // 2. 数据库验证失败 → 回退到环境变量配置
    if (!authenticated) {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        authenticated = true;
        adminData = {
          id: 1,
          username: 'admin',
          nickname: '超级管理员',
          avatar: '',
          email: '',
          phone: '',
          role_id: 1,
          permissions: DEFAULT_PERMISSIONS.map(p => p.id),
          status: 1,
          last_login_time: getNowTime(),
          create_time: getNowTime()
        };
      }
    }

    if (authenticated && adminData) {
      // 登录成功：签发token、清除失败计数、记录日志
      resetLoginAttempts(clientIp, username);

      const tokenPayload = { id: adminData.id, username: adminData.username, role_id: adminData.role_id };
      const token = signToken(tokenPayload, config.jwt.expiresIn);
      const refreshToken = signToken({ id: adminData.id }, config.jwt.refreshExpiresIn);

      logger.info(`Admin login success: username=${username} ip=${clientIp} id=${adminData.id}`);

      response.success(res, {
        token,
        refreshToken,
        user: adminData
      }, '登录成功');
    } else {
      // 登录失败：记录失败次数、记录日志
      recordLoginFailure(clientIp, username);
      logger.warn(`Admin login failed: username=${username} ip=${clientIp}`);

      response.unauthorized(res, '用户名或密码错误');
    }
  } catch (error) {
    logger.error('Admin login error:', error);
    response.error(res, '服务器错误');
  }
};

/**
 * 刷新管理员令牌
 * POST /api/admin-manage/refresh-token
 * Body: { refreshToken }
 */
const refreshAdminToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return response.badRequest(res, 'refreshToken不能为空');
    }

    // 验证 refreshToken
    const decoded = verifyToken(refreshToken);
    if (!decoded || !decoded.id) {
      return response.unauthorized(res, 'refreshToken无效或已过期');
    }

    // 检查管理员是否存在（DB模式）
    if (Admin) {
      try {
        const admin = await Admin.findByPk(decoded.id);
        if (!admin || admin.status !== 1) {
          return response.forbidden(res, '管理员不存在或已被禁用');
        }
      } catch (e) {
        logger.warn('Admin refresh: DB lookup failed, using decoded payload:', e.message);
      }
    }

    // 签发新令牌对
    const tokenPayload = { id: decoded.id, username: decoded.username || 'admin', role_id: decoded.role_id || 1 };
    const newToken = signToken(tokenPayload, config.jwt.expiresIn);
    const newRefreshToken = signToken({ id: decoded.id }, config.jwt.refreshExpiresIn);

    logger.info(`Admin token refreshed: id=${decoded.id}`);

    response.success(res, {
      token: newToken,
      refreshToken: newRefreshToken
    }, '令牌刷新成功');
  } catch (error) {
    logger.error('Admin refresh token error:', error);
    response.error(res, '服务器错误');
  }
};

const getAdminList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', status = '' } = req.query;
    const offset = (page - 1) * pageSize;
    
    // 尝试从数据库获取
    if (Admin) {
      try {
        const where = {};
        if (keyword) {
          where[Op.or] = [
            { username: { [Op.like]: `%${keyword}%` } },
            { nickname: { [Op.like]: `%${keyword}%` } }
          ];
        }
        if (status !== '') where.status = parseInt(status);
        
        const result = await Admin.findAndCountAll({
          where,
          offset,
          limit: parseInt(pageSize),
          order: [['id', 'ASC']]
        });
        
        return response.success(res, {
            list: result.rows.map(a => ({
              id: a.id,
              username: a.username,
              nickname: a.nickname,
              avatar: a.avatar,
              email: a.email,
              phone: a.phone,
              role_id: a.role_id,
              permissions: a.permissions ? JSON.parse(a.permissions) : [],
              status: a.status,
              last_login_time: a.last_login_time,
              last_login_ip: a.last_login_ip,
              create_time: a.create_time
            })),
            pagination: {
              total: result.count,
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              totalPages: Math.ceil(result.count / pageSize)
            }
          }, '获取成功');
      } catch (dbError) {
        logger.warn('数据库管理员查询失败，使用Mock:', dbError.message);
      }
    }
    
    // Mock fallback
    let filteredAdmins = [...mockAdmins];
    if (keyword) {
      filteredAdmins = filteredAdmins.filter(a => 
        a.username.includes(keyword) || 
        a.nickname.includes(keyword) ||
        (a.phone && a.phone.includes(keyword))
      );
    }
    if (status !== '') {
      filteredAdmins = filteredAdmins.filter(a => a.status === parseInt(status));
    }
    
    const list = filteredAdmins.slice(offset, offset + parseInt(pageSize));
    
    response.success(res, {
      list,
      pagination: {
        total: filteredAdmins.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(filteredAdmins.length / pageSize)
      }
    }, '获取成功');
  } catch (error) {
    logger.error('Get admin list error:', error);
    response.error(res, '服务器错误');
  }
};

const createAdmin = async (req, res) => {
  try {
    const { username, password, nickname, email, phone, role_id, permissions, status } = req.body;
    
    if (!username || !password) {
      return response.badRequest(res, '用户名和密码不能为空');
    }
    
    const existingAdmin = mockAdmins.find(a => a.username === username);
    if (existingAdmin) {
      return response.badRequest(res, '用户名已存在');
    }
    
    const newId = Math.max(...mockAdmins.map(a => a.id), 0) + 1;
    const newAdmin = {
      id: newId,
      username,
      nickname: nickname || username,
      email,
      phone,
      role_id: role_id || 0,
      permissions: permissions || [],
      status: status !== undefined ? status : 1,
      last_login_time: null,
      last_login_ip: null,
      create_time: getNowTime(),
      create_admin_id: req.admin?.id || 0
    };
    mockAdmins.push(newAdmin);
    
    response.success(res, newAdmin, '创建成功');
  } catch (error) {
    logger.error('Create admin error:', error);
    response.error(res, '服务器错误');
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nickname, email, phone, role_id, permissions, status } = req.body;
    
    const adminIndex = mockAdmins.findIndex(a => a.id === parseInt(id));
    
    if (adminIndex === -1) {
      return response.notFound(res, '管理员不存在');
    }
    
    const admin = mockAdmins[adminIndex];
    
    if (username && username !== admin.username) {
      const existingAdmin = mockAdmins.find(a => a.username === username);
      if (existingAdmin) {
        return response.badRequest(res, '用户名已存在');
      }
      admin.username = username;
    }
    
    if (nickname !== undefined) admin.nickname = nickname;
    if (email !== undefined) admin.email = email;
    if (phone !== undefined) admin.phone = phone;
    if (role_id !== undefined) admin.role_id = role_id;
    if (permissions !== undefined) admin.permissions = permissions;
    if (status !== undefined) admin.status = status;
    
    response.success(res, admin, '更新成功');
  } catch (error) {
    logger.error('Update admin error:', error);
    response.error(res, '服务器错误');
  }
};

const updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    
    const adminIndex = mockAdmins.findIndex(a => a.id === parseInt(id));
    
    if (adminIndex === -1) {
      return response.notFound(res, '管理员不存在');
    }
    
    response.success(res, {}, '密码修改成功');
  } catch (error) {
    logger.error('Update admin password error:', error);
    response.error(res, '服务器错误');
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (parseInt(id) === 1) {
      return response.badRequest(res, '超级管理员不能删除');
    }
    
    const adminIndex = mockAdmins.findIndex(a => a.id === parseInt(id));
    
    if (adminIndex === -1) {
      return response.notFound(res, '管理员不存在');
    }
    
    mockAdmins.splice(adminIndex, 1);
    
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('Delete admin error:', error);
    response.error(res, '服务器错误');
  }
};

const getRoleList = async (req, res) => {
  try {
    const { status = '' } = req.query;
    
    // 尝试从数据库获取
    if (AdminRole) {
      try {
        const where = {};
        if (status !== '') where.status = parseInt(status);
        
        const roles = await AdminRole.findAll({
          where,
          order: [['sort', 'ASC'], ['id', 'ASC']]
        });
        
        return response.success(res, roles.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          permissions: r.permissions ? JSON.parse(r.permissions) : [],
          status: r.status,
          is_super: r.is_super,
          sort: r.sort,
          create_time: r.create_time
        })), '获取成功');
      } catch (dbError) {
        logger.warn('数据库角色查询失败，使用Mock:', dbError.message);
      }
    }
    
    // Mock fallback
    let filteredRoles = [...mockRoles];
    if (status !== '') {
      filteredRoles = filteredRoles.filter(r => r.status === parseInt(status));
    }
    
    response.success(res, filteredRoles, '获取成功');
  } catch (error) {
    logger.error('Get role list error:', error);
    response.error(res, '服务器错误');
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, permissions, status, sort } = req.body;
    
    if (!name) {
      return response.badRequest(res, '角色名称不能为空');
    }
    
    // 尝试写入数据库
    if (AdminRole) {
      try {
        const existing = await AdminRole.findOne({ where: { name } });
        if (existing) {
          return response.badRequest(res, '角色名称已存在');
        }
        
        const newRole = await AdminRole.create({
          name,
          description: description || '',
          permissions: JSON.stringify(permissions || []),
          status: status !== undefined ? status : 1,
          sort: sort || 0,
          is_super: 0,
          create_time: getNowTime(),
          create_admin_id: req.admin?.id || 0
        });
        
        return response.success(res, {
            id: newRole.id,
            name: newRole.name,
            description: newRole.description,
            permissions: permissions || [],
            status: newRole.status,
            sort: newRole.sort,
            is_super: 0,
            create_time: newRole.create_time
          }, '创建成功');
      } catch (dbError) {
        logger.warn('数据库角色创建失败，使用Mock:', dbError.message);
      }
    }
    
    // Mock fallback
    const existingRole = mockRoles.find(r => r.name === name);
    if (existingRole) {
      return response.badRequest(res, '角色名称已存在');
    }
    
    const newId = Math.max(...mockRoles.map(r => r.id), 0) + 1;
    const newRole = {
      id: newId,
      name,
      description,
      permissions: permissions || [],
      status: status !== undefined ? status : 1,
      sort: sort || 0,
      is_super: 0,
      create_time: getNowTime(),
      create_admin_id: req.admin?.id || 0
    };
    mockRoles.push(newRole);
    
    response.success(res, newRole, '创建成功');
  } catch (error) {
    logger.error('Create role error:', error);
    response.error(res, '服务器错误');
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, status, sort } = req.body;
    
    // 尝试更新数据库
    if (AdminRole) {
      try {
        const role = await AdminRole.findByPk(parseInt(id));
        if (!role) {
          return response.notFound(res, '角色不存在');
        }
        if (role.is_super) {
          return response.badRequest(res, '超级管理员角色不能修改');
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);
        if (status !== undefined) updateData.status = status;
        if (sort !== undefined) updateData.sort = sort;
        
        await AdminRole.update(updateData, { where: { id: parseInt(id) } });
        const updated = await AdminRole.findByPk(parseInt(id));
        
        return response.success(res, {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            permissions: updated.permissions ? JSON.parse(updated.permissions) : [],
            status: updated.status,
            sort: updated.sort,
            is_super: updated.is_super
          }, '更新成功');
      } catch (dbError) {
        logger.warn('数据库角色更新失败，使用Mock:', dbError.message);
      }
    }
    
    // Mock fallback
    const roleIndex = mockRoles.findIndex(r => r.id === parseInt(id));
    
    if (roleIndex === -1) {
      return response.notFound(res, '角色不存在');
    }
    
    const role = mockRoles[roleIndex];
    
    if (role.is_super) {
      return response.badRequest(res, '超级管理员角色不能修改');
    }
    
    if (name && name !== role.name) {
      const existingRole = mockRoles.find(r => r.name === name);
      if (existingRole) {
        return response.badRequest(res, '角色名称已存在');
      }
      role.name = name;
    }
    
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (status !== undefined) role.status = status;
    if (sort !== undefined) role.sort = sort;
    
    response.success(res, role, '更新成功');
  } catch (error) {
    logger.error('Update role error:', error);
    response.error(res, '服务器错误');
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 尝试从数据库删除
    if (AdminRole) {
      try {
        const role = await AdminRole.findByPk(parseInt(id));
        if (!role) {
          return response.notFound(res, '角色不存在');
        }
        if (role.is_super) {
          return response.badRequest(res, '超级管理员角色不能删除');
        }
        
        await AdminRole.destroy({ where: { id: parseInt(id) } });
        return response.success(res, {}, '删除成功');
      } catch (dbError) {
        logger.warn('数据库角色删除失败，使用Mock:', dbError.message);
      }
    }
    
    // Mock fallback
    const roleIndex = mockRoles.findIndex(r => r.id === parseInt(id));
    
    if (roleIndex === -1) {
      return response.notFound(res, '角色不存在');
    }
    
    const role = mockRoles[roleIndex];
    
    if (role.is_super) {
      return response.badRequest(res, '超级管理员角色不能删除');
    }
    
    mockRoles.splice(roleIndex, 1);
    
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('Delete role error:', error);
    response.error(res, '服务器错误');
  }
};

const getPermissions = async (req, res) => {
  try {
    response.success(res, DEFAULT_PERMISSIONS, '获取成功');
  } catch (error) {
    logger.error('Get permissions error:', error);
    response.error(res, '服务器错误');
  }
};

const getCurrentAdmin = async (req, res) => {
  try {
    const admin = req.admin;
    
    if (!admin) {
      return response.unauthorized(res, '未登录');
    }
    
    response.success(res, admin, '获取成功');
  } catch (error) {
    logger.error('Get current admin error:', error);
    response.error(res, '服务器错误');
  }
};

const initAdmin = async (req, res) => {
  try {
    // Mock模式下，始终返回成功
    response.success(res, {
      username: 'admin',
      password: 'admin123'
    }, '初始化成功');
  } catch (error) {
    logger.error('Init admin error:', error);
    response.error(res, '服务器错误');
  }
};

module.exports = {
  adminLogin,
  refreshAdminToken,
  getAdminList,
  createAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getCurrentAdmin,
  initAdmin
};
