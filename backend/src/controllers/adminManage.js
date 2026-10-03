const bcrypt = require('bcryptjs');
const { signToken } = require('../config/jwt');
const config = require('../config');
const logger = require('../utils/logger');
const { Admin, AdminRole } = require('../models');
const { resolvePermissions } = require('../utils/permissions');

const getNowTime = () => Math.floor(Date.now() / 1000);

const DEFAULT_PERMISSIONS = [
  { id: 'dashboard', name: '控制台', icon: '📊' },
  { id: 'users', name: '用户管理', icon: '👥' },
  { id: 'orders', name: '订单管理', icon: '📦' },
  { id: 'withdraws', name: '提现管理', icon: '💰' },
  { id: 'posts', name: '帖子管理', icon: '📝' },
  { id: 'reports', name: '举报管理', icon: '⚠️' },
  { id: 'banners', name: 'Banner管理', icon: '🎪' },
  { id: 'downloads', name: '下载管理', icon: '📲' },
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

// --------------- 登录 ---------------
const adminLogin = async (req, res) => {
  // 审计 I-02：原实现把整个 req.body（含明文密码）打印到日志，属严重凭据泄露。
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    try {
      const admin = await Admin.findOne({ where: { username } });

      // 管理员账号不存在时，尝试角色账号（角色可配置独立登录账号密码）
      if (!admin) {
        const role = await AdminRole.findOne({ where: { username } });
        if (role && role.status === 1 && role.password) {
          const valid = await bcrypt.compare(password, role.password);
          if (valid) {
            const permissions = resolvePermissions(role.permissions, role);
            const token = signToken({ id: role.id, username: role.username, role: 'admin', role_id: role.id, roleId: role.id, permissions }, config.jwt.expiresIn);
            const refreshToken = signToken({ id: role.id }, config.jwt.refreshExpiresIn || '30d');
            return res.json({
              code: 200,
              message: '登录成功（角色账号）',
              data: {
                token,
                refreshToken,
                user: {
                  id: role.id,
                  username: role.username,
                  nickname: role.name || role.username,
                  avatar: '',
                  email: '',
                  phone: '',
                  role_id: role.id,
                  permissions,
                  status: role.status,
                  last_login_time: getNowTime(),
                  create_time: role.create_time || 0
                }
              }
            });
          }
        }
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      if (admin.status !== 1) {
        return res.status(403).json({ code: 403, message: '账号已被禁用' });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      // 更新最后登录时间和IP
      await admin.update({
        last_login_time: getNowTime(),
        last_login_ip: req.ip || req.connection?.remoteAddress || '127.0.0.1'
      });

      // 合并角色权限：角色权限 ∪ 账号自身权限（超级角色直接全权限）
      let role = null;
      if (admin.role_id) {
        role = await AdminRole.findByPk(admin.role_id);
      }
      const permissions = resolvePermissions(admin.permissions, role);

      const token = signToken({ id: admin.id, username: admin.username, role: 'admin', role_id: admin.role_id, roleId: admin.role_id, permissions }, config.jwt.expiresIn);
      const refreshToken = signToken({ id: admin.id }, config.jwt.refreshExpiresIn || '30d');

      return res.json({
        code: 200,
        message: '登录成功',
        data: {
          token,
          refreshToken,
          user: {
            id: admin.id,
            username: admin.username,
            nickname: admin.nickname,
            avatar: admin.avatar || '',
            email: admin.email || '',
            phone: admin.phone || '',
            role_id: admin.role_id,
            permissions,
            status: admin.status,
            last_login_time: admin.last_login_time,
            create_time: admin.create_time
          }
        }
      });
    } catch (dbError) {
      // 数据库不可用时的环境变量应急登录：必须显式开启 ADMIN_EMERGENCY_LOGIN=true，默认关闭
      logger.error('[adminManage] 数据库登录失败，尝试环境变量回退:', dbError.message);
      if (!config.admin.emergencyLogin) {
        return res.status(503).json({ code: 503, message: '数据库不可用，应急登录未开启' });
      }
      const envUser = process.env.ADMIN_USERNAME;
      const envPass = process.env.ADMIN_PASSWORD;
      if (!envUser || !envPass) {
        return res.status(500).json({ code: 500, message: '数据库连接失败，且未配置环境变量备用账号' });
      }
      if (username !== envUser || password !== envPass) {
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }
      logger.warn('[adminManage] ⚠️ 使用环境变量回退登录 — 生产环境应配置数据库！');
      const token = signToken({ id: 0, username: envUser, role: 'admin', role_id: 0, roleId: 0, permissions: ['all'] }, config.jwt.expiresIn);
      return res.json({
        code: 200,
        message: '登录成功（环境变量回退模式）',
        data: {
          token,
          refreshToken: token,
          user: {
            id: 0,
            username: envUser,
            nickname: '临时管理员',
            avatar: '',
            email: '',
            phone: '',
            role_id: 0,
            permissions: ['all'],
            status: 1,
            last_login_time: getNowTime(),
            create_time: getNowTime()
          }
        }
      });
    }
  } catch (error) {
    console.error('=== Admin login debug ===', error.stack || error.message || error);
    logger.error('Admin login error:', error);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// --------------- 管理员 CRUD ---------------
const getAdminList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', status = '' } = req.query;
    const where = {};
    if (status !== '') where.status = parseInt(status);

    let admins;
    if (keyword) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const { count, rows } = await Admin.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['id', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    logger.error('Get admin list error:', error);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { username, password, nickname, email, phone, role_id, permissions, status } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    const existing = await Admin.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // 权限由所选角色决定；未单独提交时存空数组（角色缺失且无自身权限即为空权限，需显式分配）
    const perms = permissions && permissions.length > 0
      ? JSON.stringify(permissions)
      : '[]';

    const admin = await Admin.create({
      username,
      password: passwordHash,
      nickname: nickname || username,
      email: email || '',
      phone: phone || '',
      role_id: role_id || 2,
      permissions: perms,
      status: status !== undefined ? status : 1,
      create_time: getNowTime()
    });

    return res.json({
      code: 200,
      message: '创建成功',
      data: { id: admin.id, username: admin.username, nickname: admin.nickname, email: admin.email, phone: admin.phone, role_id: admin.role_id, status: admin.status, create_time: admin.create_time }
    });
  } catch (error) {
    logger.error('Create admin error:', error);
    return res.status(500).json({ code: 500, message: '创建失败', error: error.message });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nickname, email, phone, role_id, permissions, status } = req.body;

    const admin = await Admin.findByPk(parseInt(id));
    if (!admin) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    if (username && username !== admin.username) {
      const existing = await Admin.findOne({ where: { username } });
      if (existing) {
        return res.status(400).json({ code: 400, message: '用户名已存在' });
      }
      admin.username = username;
    }

    if (nickname !== undefined) admin.nickname = nickname;
    if (email !== undefined) admin.email = email;
    if (phone !== undefined) admin.phone = phone;
    if (role_id !== undefined) admin.role_id = role_id;
    if (permissions !== undefined) admin.permissions = JSON.stringify(permissions);
    if (status !== undefined) admin.status = status;

    await admin.save();

    return res.json({
      code: 200,
      message: '更新成功',
      data: { id: admin.id, username: admin.username, nickname: admin.nickname, email: admin.email, phone: admin.phone, role_id: admin.role_id, permissions: admin.permissions, status: admin.status }
    });
  } catch (error) {
    logger.error('Update admin error:', error);
    return res.status(500).json({ code: 500, message: '更新失败', error: error.message });
  }
};

const updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, old_password } = req.body;

    if (!password) {
      return res.status(400).json({ code: 400, message: '新密码不能为空' });
    }

    const admin = await Admin.findByPk(parseInt(id));
    if (!admin) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    // 如果提供了旧密码，先验证
    if (old_password) {
      const valid = await bcrypt.compare(old_password, admin.password);
      if (!valid) {
        return res.status(400).json({ code: 400, message: '旧密码错误' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    admin.password = passwordHash;
    await admin.save();

    return res.json({ code: 200, message: '密码修改成功' });
  } catch (error) {
    logger.error('Update admin password error:', error);
    return res.status(500).json({ code: 500, message: '密码修改失败', error: error.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === 1) {
      return res.status(400).json({ code: 400, message: '超级管理员不能删除' });
    }

    const admin = await Admin.findByPk(parseInt(id));
    if (!admin) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    await admin.destroy();
    return res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    logger.error('Delete admin error:', error);
    return res.status(500).json({ code: 500, message: '删除失败', error: error.message });
  }
};

// --------------- 角色 CRUD ---------------
const getRoleList = async (req, res) => {
  try {
    const { status = '' } = req.query;
    const where = {};
    if (status !== '') where.status = parseInt(status);

    const roles = await AdminRole.findAll({ where, order: [['sort', 'ASC']] });
    const data = roles.map(r => {
      const item = r.toJSON();
      delete item.password; // 密码永不返回前端
      if (typeof item.permissions === 'string') {
        try { item.permissions = JSON.parse(item.permissions); } catch { item.permissions = []; }
      }
      return item;
    });
    return res.json({ code: 200, message: '获取成功', data });
  } catch (error) {
    logger.error('Get role list error:', error);
    return res.status(500).json({ code: 500, message: '获取角色列表失败', error: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, username, password, description, permissions, status, sort } = req.body;
    if (!name) {
      return res.status(400).json({ code: 400, message: '角色名称不能为空' });
    }

    const existing = await AdminRole.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ code: 400, message: '角色名称已存在' });
    }

    // 登录账号可选：填了用户名则必须填密码
    let roleUsername = null;
    let passwordHash = null;
    if (username) {
      const dup = await AdminRole.findOne({ where: { username } });
      if (dup) {
        return res.status(400).json({ code: 400, message: '登录账号已存在' });
      }
      if (!password) {
        return res.status(400).json({ code: 400, message: '填写了登录账号，请同时填写密码' });
      }
      roleUsername = username;
      passwordHash = await bcrypt.hash(password, 10);
    }

    const role = await AdminRole.create({
      name,
      username: roleUsername,
      password: passwordHash,
      description: description || '',
      permissions: JSON.stringify(permissions || []),
      status: status !== undefined ? status : 1,
      is_super: 0,
      sort: sort || 0,
      create_time: getNowTime()
    });

    return res.json({ code: 200, message: '创建成功', data: role });
  } catch (error) {
    logger.error('Create role error:', error);
    return res.status(500).json({ code: 500, message: '创建角色失败', error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, description, permissions, status, sort } = req.body;

    const role = await AdminRole.findByPk(parseInt(id));
    if (!role) {
      return res.status(404).json({ code: 404, message: '角色不存在' });
    }

    // 超级管理员角色：仅允许设置登录账号/密码，其余字段（名称/权限/状态等）锁定
    const isSuper = !!role.is_super;

    if (!isSuper && name && name !== role.name) {
      const existing = await AdminRole.findOne({ where: { name } });
      if (existing) {
        return res.status(400).json({ code: 400, message: '角色名称已存在' });
      }
      role.name = name;
    }

    // 登录账号：可新增/修改；改密码时密码留空表示不修改
    if (username !== undefined) {
      if (!username) {
        role.username = null;
        role.password = null;
      } else {
        if (username !== role.username) {
          const dup = await AdminRole.findOne({ where: { username } });
          if (dup) {
            return res.status(400).json({ code: 400, message: '登录账号已存在' });
          }
        }
        role.username = username;
        if (password) {
          role.password = await bcrypt.hash(password, 10);
        }
      }
    } else if (password) {
      // 仅改密码
      role.password = await bcrypt.hash(password, 10);
    }

    if (!isSuper) {
      if (description !== undefined) role.description = description;
      if (permissions !== undefined) role.permissions = JSON.stringify(permissions);
      if (status !== undefined) role.status = status;
      if (sort !== undefined) role.sort = sort;
    }

    await role.save();
    return res.json({ code: 200, message: '更新成功', data: role });
  } catch (error) {
    logger.error('Update role error:', error);
    return res.status(500).json({ code: 500, message: '更新角色失败', error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await AdminRole.findByPk(parseInt(id));
    if (!role) {
      return res.status(404).json({ code: 404, message: '角色不存在' });
    }
    if (role.is_super) {
      return res.status(400).json({ code: 400, message: '超级管理员角色不能删除' });
    }

    await role.destroy();
    return res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    logger.error('Delete role error:', error);
    return res.status(500).json({ code: 500, message: '删除角色失败', error: error.message });
  }
};

// --------------- 权限 / 当前用户 ---------------
const getPermissions = async (req, res) => {
  try {
    return res.json({ code: 200, message: '获取成功', data: DEFAULT_PERMISSIONS });
  } catch (error) {
    logger.error('Get permissions error:', error);
    return res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

const getCurrentAdmin = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }
    return res.json({ code: 200, message: '获取成功', data: admin });
  } catch (error) {
    logger.error('Get current admin error:', error);
    return res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 【已移除 initAdmin 接口】—— 该接口曾泄露明文 admin/admin123 密码，属于严重安全隐患。
// 如需初始化管理员，请运行: node seed-admins.js

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
  getCurrentAdmin
};
