const { verifyToken, TOKEN_TYPES } = require('../config/jwt');
const { User, Admin, AdminRole } = require('../models');
const tokenRevocation = require('../services/tokenRevocation');
const { resolvePermissions } = require('../utils/permissions');
const { safeEqual } = require('../utils/secureCompare');
const config = require('../config');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }
    
    // 审计 H-4：只接受 access 用途的令牌。此前 refresh token（30 天）与 access 令牌同密钥同结构，
    // 拿一枚长效 refresh 就能当 Bearer 访问所有业务接口，泄漏面从 7 天放大到 30 天。
    const decoded = verifyToken(token, [TOKEN_TYPES.ACCESS]);

    if (!decoded) {
      return res.status(401).json({
        code: 401,
        message: '令牌无效或已过期'
      });
    }
    
    const userId = decoded.userId;

    // 审计 H-5：吊销校验统一收进 tokenRevocation。三种结果分别对应三种响应——
    //   - 已拉黑 / 早于「全端下线」水位线 → 401（客户端据此清本地态并跳登录）
    //   - 无法确认（Redis 没连上、命令报错、2 秒超时）→ 按 AUTH_BLACKLIST_FAIL_MODE 处理，
    //     生产默认 fail-closed 503。此前「Redis 客户端为空」是整段跳过检查直接放行，
    //     等于打挂 Redis 就能让已登出的令牌全部复活，现按用户确认的口径一并收紧。
    const revocation = await tokenRevocation.checkRevocation(token, decoded);
    if (!revocation.verifiable && tokenRevocation.revocationFailMode() === 'closed') {
      return res.status(503).json({
        code: 503,
        message: '认证服务暂时不可用，请稍后重试'
      });
    }

    if (revocation.revoked) {
      return res.status(401).json({
        code: 401,
        message: '令牌已失效'
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }
    
    // status: 1=正常，其余=禁用；jinyan_time: 禁言截止时间戳，大于当前时间说明仍在禁言
    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      });
    }

    const now = Math.floor(Date.now() / 1000);
    if (user.jinyan_time && user.jinyan_time > now) {
      return res.status(403).json({
        code: 403,
        message: '用户已被禁言'
      });
    }
    
    req.user = user;
    req.userId = userId;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }
    
    // 可选认证同样只认 access 令牌：refresh / 管理员令牌不能在这里洗成 req.userId
    const decoded = verifyToken(token, [TOKEN_TYPES.ACCESS]);
    
    if (!decoded) {
      return next();
    }
    
    // 审计 H-5：可选认证同样要查吊销——已登出的令牌不能在这里换回 req.userId。
    // 但这里的失败取向和 authMiddleware 相反：无法确认时按「匿名」处理而不是 503，
    // 因为它守的是公开页面，拒绝整站可读性换不到任何安全收益（身份本来就可有可无）。
    const revocation = await tokenRevocation.checkRevocation(token, decoded);
    if (revocation.revoked || !revocation.verifiable) {
      return next();
    }

    const user = await User.findByPk(decoded.userId);
    
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
    next();
  }
};

// 审计 M-2：令牌里的状态与权限只是签发时刻的快照。这里按 adminScope 回读数据库主体，
// 拼出「当下」的管理员对象——删号 → missing(401)、禁用 → disabled(403)、改权限/换角色当场生效。
// adminScope 是 M-2 起才有的字段：旧令牌没有它就分不清 id 指向 Admin 还是 AdminRole
// （两张表 id 独立自增、可以碰撞），一律按 legacy 处理强制重登（与 H-4 移除无 type 令牌的取舍一致）。
// outcome 取值：'ok'（admin 字段为实时主体）/ 'legacy' / 'missing' / 'disabled'
const resolveLiveAdmin = async (decoded) => {
  if (decoded.adminScope === 'emergency') {
    // 环境变量应急令牌没有数据库主体：仅当应急通道仍开启时有效，关闭即全量作废
    if (!config.admin || !config.admin.emergencyLogin) {
      return { outcome: 'missing' };
    }
    return { outcome: 'ok', admin: { ...decoded, role: 'admin', permissions: ['all'] } };
  }

  if (decoded.adminScope === 'account') {
    const admin = await Admin.findByPk(decoded.id);
    if (!admin) return { outcome: 'missing' };
    if (admin.status !== 1) return { outcome: 'disabled' };
    const role = admin.role_id ? await AdminRole.findByPk(admin.role_id) : null;
    return {
      outcome: 'ok',
      admin: {
        ...decoded,
        id: admin.id,
        username: admin.username,
        role: 'admin',
        role_id: admin.role_id,
        roleId: admin.role_id,
        permissions: resolvePermissions(admin.permissions, role)
      }
    };
  }

  if (decoded.adminScope === 'role') {
    const role = await AdminRole.findByPk(decoded.id);
    if (!role) return { outcome: 'missing' };
    if (role.status !== 1) return { outcome: 'disabled' };
    return {
      outcome: 'ok',
      admin: {
        ...decoded,
        id: role.id,
        username: role.username || decoded.username,
        role: 'admin',
        role_id: role.id,
        roleId: role.id,
        permissions: resolvePermissions(role.permissions, role)
      }
    };
  }

  return { outcome: 'legacy' };
};

const adminAuth = async (req, res, next) => {
  // 收集所有候选管理员令牌：Authorization: Bearer <token> 或 x-admin-token
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const adminToken = req.headers['x-admin-token'];
  const candidates = [bearerToken, adminToken].filter(Boolean);

  // 两道防线分工：
  //   H-5 吊销名单 —— 登出 / 改密码这类「令牌本身作废」的场景；
  //   M-2 实时回读 —— 禁用 / 删除 / 改权限 / 换角色这类「主体状态变了」的场景，每次请求以库为准。
  let sawRevoked = false;
  let sawInvalid = false;
  let sawDisabled = false;

  for (const token of candidates) {
    // 应急固定管理员令牌：仅当通过 ADMIN_TOKEN 环境变量显式配置强随机密文时生效
    // 它是环境变量里的固定字符串、无 exp、无签名，吊销名单管不到它（已在文档记为遗留）
    // 审计 M-3：改用常数时间比较，避免 `===` 的逐字符早退泄露密文前缀
    if (config.admin && config.admin.token && safeEqual(token, config.admin.token)) {
      req.admin = { id: 0, username: 'admin', role: 'admin', role_id: 1, permissions: ['all'] };
      req.adminToken = token;
      req.adminTokenKind = 'emergency';
      return next();
    }

    try {
      // 审计 H-4：只接受 admin 用途的令牌——用户端 access/refresh 与管理员刷新令牌都不算数
      const decoded = verifyToken(token, [TOKEN_TYPES.ADMIN]);
      // 审计 M-3：不再凭 payload 里可伪造的 role/role_id 声明放行。令牌是否属于管理端由
      // 「独立签名密钥（config.jwt.adminSecret，与用户端分离）+ type=admin 白名单」共同保证；
      // 这里只要 payload 可解析即可，具体主体合法性交给 resolveLiveAdmin 按 adminScope 回读
      // （无 adminScope 的历史令牌 → legacy → 401 强制重登，口径与 M-2 一致）。
      if (decoded) {
        const revocation = await tokenRevocation.checkRevocation(token, decoded);

        if (!revocation.verifiable) {
          if (tokenRevocation.revocationFailMode() === 'closed') {
            return res.status(503).json({
              code: 503,
              message: '认证服务暂时不可用，请稍后重试'
            });
          }
          // 非生产 fail-open：继续回读数据库并放行，但留一行日志，避免「吊销静默失效」无从追查
          logger.warn('[adminAuth] 吊销状态无法确认，按 fail-open 放行');
        } else if (revocation.revoked) {
          sawRevoked = true;
          continue;
        }

        // 审计 M-2：不再信任令牌里的状态/权限快照，回读数据库实时主体。
        // Redis 挂了不影响这段——吊销与权限回读是两条独立的防线。
        let live;
        try {
          live = await resolveLiveAdmin(decoded);
        } catch (dbErr) {
          logger.warn('[adminAuth] 管理员实时权限回读失败:', dbErr.message);
          if (tokenRevocation.revocationFailMode() === 'closed') {
            return res.status(503).json({
              code: 503,
              message: '认证服务暂时不可用，请稍后重试'
            });
          }
          // 非生产 fail-open：按令牌内快照放行（DB 不可用时后台接口本身也大多不可用）
          logger.warn('[adminAuth] 非生产环境按会话快照放行');
          req.admin = decoded;
          req.adminToken = token;
          req.adminTokenKind = 'jwt';
          return next();
        }

        if (live.outcome === 'legacy' || live.outcome === 'missing') {
          sawInvalid = true;
          continue;
        }
        if (live.outcome === 'disabled') {
          sawDisabled = true;
          continue;
        }

        req.admin = live.admin;
        // 登出接口要知道该把哪一枚字符串写进吊销名单（两个候选头并存时不能猜）
        req.adminToken = token;
        req.adminTokenKind = 'jwt';
        return next();
      }
    } catch (err) {
      // 令牌无效或依赖异常，尝试下一个候选
      logger.warn('[adminAuth] 令牌校验异常:', err.message);
    }
  }

  // 明确被吊销 / 主体已删除 / 旧格式令牌 → 401，客户端据此清本地态并跳登录
  if (sawRevoked || sawInvalid) {
    return res.status(401).json({
      code: 401,
      message: '令牌已失效'
    });
  }

  // 主体被禁用：身份仍可识别，语义上 403 更准（前端对 401/403 都是清态跳登录）
  if (sawDisabled) {
    return res.status(403).json({
      code: 403,
      message: '账号已被禁用'
    });
  }

  // 只是令牌格式不对/用途不符 → 维持 403
  return res.status(403).json({
    code: 403,
    message: '无管理员权限'
  });
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth
};
