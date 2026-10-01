// 统一权限定义：管理端前端（AdminRoles.vue）与后端接口鉴权共用
// key 规则：<模块>:<动作>，read=查看，write=管理/写操作
const ALL_PERMISSIONS = [
  { key: 'dashboard:read', label: '查看控制台' },
  { key: 'user:read', label: '查看用户' }, { key: 'user:write', label: '管理用户' },
  { key: 'order:read', label: '查看订单' }, { key: 'order:write', label: '管理订单' },
  { key: 'finance:read', label: '查看财务' },
  { key: 'withdraw:read', label: '查看提现' }, { key: 'withdraw:write', label: '审核提现' },
  { key: 'post:read', label: '查看帖子' }, { key: 'post:write', label: '管理帖子' },
  { key: 'report:read', label: '查看举报' }, { key: 'report:write', label: '处理举报' },
  { key: 'splash:read', label: '查看开屏&轮播' }, { key: 'splash:write', label: '管理开屏&轮播' },
  { key: 'download:read', label: '查看下载管理' }, { key: 'download:write', label: '管理下载管理' },
  { key: 'vip:read', label: '查看VIP套餐' }, { key: 'vip:write', label: '管理VIP套餐' },
  { key: 'gift:read', label: '查看礼物' }, { key: 'gift:write', label: '管理礼物' },
  { key: 'recharge:read', label: '查看充值记录' }, { key: 'recharge:write', label: '管理充值记录' },
  { key: 'card:read', label: '查看卡密' }, { key: 'card:write', label: '管理卡密' },
  { key: 'game:read', label: '查看服务分类' }, { key: 'game:write', label: '管理服务分类' },
  { key: 'recommend:read', label: '查看热门推荐' }, { key: 'recommend:write', label: '管理热门推荐' },
  { key: 'companion:read', label: '查看服务申请' }, { key: 'companion:write', label: '管理服务申请' },
  { key: 'virtual:read', label: '查看虚拟机器人' }, { key: 'virtual:write', label: '管理虚拟机器人' },
  { key: 'admin:write', label: '管理管理员与角色' },
  { key: 'settings:read', label: '查看系统设置' }, { key: 'settings:write', label: '修改系统设置' },
  { key: 'api:read', label: '查看接口管理' }
];

const ALL_PERMISSION_KEYS = ALL_PERMISSIONS.map(p => p.key);

// 解析权限字段（支持数组 / JSON字符串 / 逗号分隔字符串）
const parsePerms = (p) => {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  if (typeof p === 'string') {
    try {
      const arr = JSON.parse(p);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return p.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

// 计算管理员有效权限：角色权限 ∪ 账号自身权限
// role: { is_super, permissions } 或 null（无角色）
const resolvePermissions = (adminPerms, role) => {
  if (role && role.is_super) return ['all'];
  const perms = [...new Set([...parsePerms(role ? role.permissions : null), ...parsePerms(adminPerms)])];
  // 未绑定角色且账号未配置任何权限 → 兜底全权限（兼容历史环境变量账号 admin/admin123）
  if (!role && perms.length === 0) return ['all'];
  return perms;
};

// 是否为超级管理员（直接放行所有接口）
const isSuperAdmin = (admin) => {
  if (!admin) return false;
  if (admin.id === 1 || admin.role_id === 1 || admin.role === 'super_admin') return true;
  return parsePerms(admin.permissions).includes('all');
};

// 校验某权限 key 是否命中
const hasPermission = (perms, key) => {
  const arr = parsePerms(perms);
  if (arr.includes('all')) return true;
  return arr.includes(key);
};

module.exports = {
  ALL_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  parsePerms,
  resolvePermissions,
  isSuperAdmin,
  hasPermission
};
