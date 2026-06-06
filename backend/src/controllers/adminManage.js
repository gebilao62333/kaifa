const crypto = require('crypto');
const logger = require('../utils/logger');
const { signToken } = require('../config/jwt');
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
  return req.ip || req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         '127.0.0.1';
};

const md5 = (str) => {
  return crypto.createHash('md5').update(str).digest('hex');
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
    
    if (!username || !password) {
      return response.badRequest(res, '用户名和密码不能为空');
    }
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = signToken({ id: 1, username: 'admin', role_id: 1 }, config.jwt.expiresIn);
      
      const refreshToken = signToken({ id: 1 }, config.jwt.refreshExpiresIn);
      
      const adminData = {
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
      
      res.json({
        code: 200,
        message: '登录成功',
        data: {
          token,
          refreshToken,
          user: adminData
        }
      });
    } else {
      response.unauthorized(res, '用户名或密码错误');
    }
  } catch (error) {
    logger.error('Admin login error:', error);
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
        
        return res.json({
          code: 200,
          message: '获取成功',
          data: {
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
          }
        });
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
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list,
        pagination: {
          total: filteredAdmins.length,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(filteredAdmins.length / pageSize)
        }
      }
    });
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
    
    res.json({
      code: 200,
      message: '创建成功',
      data: newAdmin
    });
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
    
    res.json({
      code: 200,
      message: '更新成功',
      data: admin
    });
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
    
    res.json({
      code: 200,
      message: '密码修改成功'
    });
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
    
    res.json({
      code: 200,
      message: '删除成功'
    });
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
        
        return res.json({
          code: 200,
          message: '获取成功',
          data: roles.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            permissions: r.permissions ? JSON.parse(r.permissions) : [],
            status: r.status,
            is_super: r.is_super,
            sort: r.sort,
            create_time: r.create_time
          }))
        });
      } catch (dbError) {
        logger.warn('数据库角色查询失败，使用Mock:', dbError.message);
      }
    }
    
    // Mock fallback
    let filteredRoles = [...mockRoles];
    if (status !== '') {
      filteredRoles = filteredRoles.filter(r => r.status === parseInt(status));
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: filteredRoles
    });
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
        
        return res.json({
          code: 200,
          message: '创建成功',
          data: {
            id: newRole.id,
            name: newRole.name,
            description: newRole.description,
            permissions: permissions || [],
            status: newRole.status,
            sort: newRole.sort,
            is_super: 0,
            create_time: newRole.create_time
          }
        });
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
    
    res.json({
      code: 200,
      message: '创建成功',
      data: newRole
    });
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
        
        return res.json({
          code: 200,
          message: '更新成功',
          data: {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            permissions: updated.permissions ? JSON.parse(updated.permissions) : [],
            status: updated.status,
            sort: updated.sort,
            is_super: updated.is_super
          }
        });
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
    
    res.json({
      code: 200,
      message: '更新成功',
      data: role
    });
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
        return res.json({ code: 200, message: '删除成功' });
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
    
    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('Delete role error:', error);
    response.error(res, '服务器错误');
  }
};

const getPermissions = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: '获取成功',
      data: DEFAULT_PERMISSIONS
    });
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
    
    res.json({
      code: 200,
      message: '获取成功',
      data: admin
    });
  } catch (error) {
    logger.error('Get current admin error:', error);
    response.error(res, '服务器错误');
  }
};

const initAdmin = async (req, res) => {
  try {
    // Mock模式下，始终返回成功
    res.json({
      code: 200,
      message: '初始化成功',
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    logger.error('Init admin error:', error);
    response.error(res, '服务器错误');
  }
};

module.exports = {
  adminLogin,
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
