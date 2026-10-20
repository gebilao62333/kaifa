// 管理端本地权限/角色预判（仅用于 UI 前置显隐，服务端 403 仍是最终边界）
// 判定口径对齐 backend/src/utils/permissions.js，权限键唯一真源也在后端。
// 注意：这里只是把「当前管理员能做什么」算给界面看，不构成权限边界。

// 权限字段兼容数组 / JSON 字符串 / 逗号分隔字符串
export const parsePermissions = (p) => {
  if (!p) return []
  if (Array.isArray(p)) return p
  if (typeof p === 'string') {
    try {
      const arr = JSON.parse(p)
      return Array.isArray(arr) ? arr : []
    } catch (e) {
      return p.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

// 是否超级管理员：与后端 isSuperAdmin 同口径（id/role_id=1、role=super_admin 或含 all）
export const isSuperAdmin = (admin) => {
  if (!admin) return false
  if (Number(admin.id) === 1 || Number(admin.role_id) === 1 || admin.role === 'super_admin') return true
  return parsePermissions(admin.permissions).includes('all')
}

export const hasPermission = (perms, key) => {
  const arr = parsePermissions(perms)
  return arr.includes('all') || arr.includes(key)
}

// 有效权限 = 角色权限 ∪ 账号自身权限；超级角色直接全权限
export const resolvePermissions = (adminPerms, role) => {
  if (role && role.is_super) return ['all']
  return [...new Set([...parsePermissions(role ? role.permissions : null), ...parsePermissions(adminPerms)])]
}

const permissionsBeyondActor = (actor, requested) => {
  if (isSuperAdmin(actor)) return []
  const own = new Set(parsePermissions(actor && actor.permissions))
  return parsePermissions(requested).filter((key) => !own.has(key))
}

// 非超管只能分配「权限 ⊆ 自身且非超管」的角色
export const canManageRole = (actor, role) => {
  if (!actor || !role) return false
  if (isSuperAdmin(actor)) return true
  if (Number(role.id) === 1 || role.is_super) return false
  return permissionsBeyondActor(actor, role.permissions).length === 0
}

// 非超管只能管理「有效权限 ⊆ 自身且非超管」的管理员
export const canManageAdmin = (actor, target, targetRole) => {
  if (!actor || !target) return false
  if (isSuperAdmin(actor)) return true
  if (Number(target.id) === 1 || Number(target.role_id) === 1) return false
  const effective = resolvePermissions(target.permissions, targetRole || null)
  if (effective.includes('all')) return false
  return permissionsBeyondActor(actor, effective).length === 0
}

// 角色下拉可选项：actor 权限信息未知时按保守策略只保留非超管角色
export const filterAssignableRoles = (actor, roles) => {
  const list = Array.isArray(roles) ? roles : []
  if (!actor || !Array.isArray(actor.permissions)) {
    return list.filter(r => r && Number(r.id) !== 1 && !r.is_super)
  }
  return list.filter(r => canManageRole(actor, r))
}

// 读取登录时写入（或本次挂载后刷新）的本地管理员快照
export const readStoredAdmin = () => {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem('admin_user')
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

// 把实时刷新的管理员主体写回快照，供路由守卫（localStorage 兜底）与下次加载使用
export const writeStoredAdmin = (admin) => {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem('admin_user', JSON.stringify(admin || {}))
  } catch (e) { /* 快照写不进去不影响功能，只是下次仍需重新拉取 */ }
}
