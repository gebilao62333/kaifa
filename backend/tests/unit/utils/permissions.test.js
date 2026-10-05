const { permissionsBeyondActor, canManageRole, canManageAdmin } = require('../../../src/utils/permissions');

// 审计 M-1：后台 RBAC 边界的纯函数单测（无 mock 依赖）
describe('Utils - Permissions 权限边界（审计 M-1）', () => {
  const superAdmin = { id: 1, role_id: 1, role: 'admin', permissions: ['all'] };
  const opsAdmin = { id: 8, role_id: 8, role: 'admin', permissions: ['user:read', 'user:write', 'admin:write'] };

  describe('permissionsBeyondActor', () => {
    it('超管（id=1 或权限含 all）对任何授予集都没有"超出"的部分', () => {
      expect(permissionsBeyondActor(superAdmin, ['all', 'settings:write'])).toEqual([]);
      expect(permissionsBeyondActor({ id: 5, role_id: 5, role: 'admin', permissions: ['all'] }, ['settings:write'])).toEqual([]);
    });

    it('非超管返回超出自身集合的 key', () => {
      expect(permissionsBeyondActor(opsAdmin, ['user:read', 'finance:read'])).toEqual(['finance:read']);
      expect(permissionsBeyondActor(opsAdmin, ['all'])).toEqual(['all']);
      expect(permissionsBeyondActor(opsAdmin, [])).toEqual([]);
      expect(permissionsBeyondActor(opsAdmin, undefined)).toEqual([]);
    });

    it('缺失操作者时视作无任何权限（授予集全部超出）', () => {
      expect(permissionsBeyondActor(null, ['user:read'])).toEqual(['user:read']);
    });
  });

  describe('canManageRole', () => {
    it('超管可管理任何角色', () => {
      expect(canManageRole(superAdmin, { id: 1, is_super: 1 })).toBe(true);
      expect(canManageRole(superAdmin, { id: 5, is_super: 0, permissions: '["all"]' })).toBe(true);
    });

    it('超管角色只有超管能动（含 id=1 兜底，is_super 缺失也拦）', () => {
      expect(canManageRole(opsAdmin, { id: 9, is_super: 1, permissions: '[]' })).toBe(false);
      expect(canManageRole(opsAdmin, { id: 1, is_super: 0, permissions: '[]' })).toBe(false);
    });

    it('非超管只能管理权限 ⊆ 自身的角色', () => {
      expect(canManageRole(opsAdmin, { id: 9, is_super: 0, permissions: '["user:read"]' })).toBe(true);
      expect(canManageRole(opsAdmin, { id: 9, is_super: 0, permissions: '["finance:read"]' })).toBe(false);
    });

    it('角色或操作者缺失时拒绝', () => {
      expect(canManageRole(null, { id: 9, is_super: 0 })).toBe(false);
      expect(canManageRole(opsAdmin, null)).toBe(false);
    });
  });

  describe('canManageAdmin', () => {
    it('超管可管理任何管理员', () => {
      expect(canManageAdmin(superAdmin, { id: 9, role_id: 5 }, null)).toBe(true);
    });

    it('id=1 / role_id=1 / 有效权限含 all 的目标都拒绝', () => {
      expect(canManageAdmin(opsAdmin, { id: 1, role_id: 9, permissions: '[]' }, null)).toBe(false);
      expect(canManageAdmin(opsAdmin, { id: 9, role_id: 1, permissions: '[]' }, null)).toBe(false);
      expect(canManageAdmin(opsAdmin, { id: 9, role_id: 5, permissions: '["all"]' }, null)).toBe(false);
      expect(canManageAdmin(opsAdmin, { id: 9, role_id: 5, permissions: '[]' }, { id: 5, is_super: 1 })).toBe(false);
    });

    it('非超管只能管理有效权限（角色 ∪ 自身）⊆ 自身的账号', () => {
      expect(canManageAdmin(
        opsAdmin,
        { id: 9, role_id: 5, permissions: '["user:write"]' },
        { id: 5, is_super: 0, permissions: '["user:read"]' }
      )).toBe(true);
      expect(canManageAdmin(
        opsAdmin,
        { id: 9, role_id: 5, permissions: '[]' },
        { id: 5, is_super: 0, permissions: '["finance:read"]' }
      )).toBe(false);
    });

    it('无角色账号按自身权限判定；缺失目标或操作者拒绝', () => {
      expect(canManageAdmin(opsAdmin, { id: 9, role_id: 0, permissions: '["user:read"]' }, null)).toBe(true);
      expect(canManageAdmin(opsAdmin, null, null)).toBe(false);
      expect(canManageAdmin(null, { id: 9, role_id: 0, permissions: '[]' }, null)).toBe(false);
    });
  });
});
