---
name: kaifa-permission-key
description: "kaifa 前后端权限键同步：permissions.js 唯一真源、管理端菜单/守卫消费、两份键表副本与 A-1/A-3 已知坑。"
whenToUse: "新增后台功能页、新增/改动权限点、调整菜单显隐或角色授权，或排查管理端 403 与菜单显示滞后时。"
tags: ["自习"]
---

# kaifa 权限键同步（前后端）

工作区根：`C:\Users\admin\Desktop\kaifa`。权限键形如 `<模块>:<动作>`，**后端 `backend/src/utils/permissions.js` 是唯一权威真源**；但前端存在**第二份硬编码副本**，这是本模块最主要的坑。

## When to Use

- 新增后台功能页 / 新增权限点 / 调整角色授权。
- 管理端出现 403、菜单项不显示、或权限改了要重登才生效。

## Procedure

### 1. 真源键表（36 个，改动时逐字对齐）

| 分组 | 键 |
|---|---|
| 控制台 | `dashboard:read` |
| 用户 | `user:read` `user:write` |
| 订单 | `order:read` `order:write` |
| 财务 | `finance:read` |
| 提现 | `withdraw:read` `withdraw:write` |
| 帖子 | `post:read` `post:write` |
| 举报 | `report:read` `report:write` |
| 开屏&轮播 | `splash:read` `splash:write` |
| 下载管理 | `download:read` `download:write` |
| VIP 套餐 | `vip:read` `vip:write` |
| 礼物 | `gift:read` `gift:write` |
| 充值记录 | `recharge:read` `recharge:write` |
| 卡密 | `card:read` `card:write` |
| 服务分类 | `game:read` `game:write` |
| 热门推荐 | `recommend:read` `recommend:write` |
| 服务申请 | `companion:read` `companion:write` |
| 虚拟机器人 | `virtual:read` `virtual:write` |
| 管理员与角色 | `admin:write` |
| 系统设置 | `settings:read` `settings:write` |
| 接口管理 | `api:read` |

`backend/src/utils/permissions.js` 导出：`ALL_PERMISSIONS`、`ALL_PERMISSION_KEYS`、`parsePerms(p)`、`resolvePermissions(adminPerms, role)`（`role.is_super` → `['all']`；否则角色权限 ∪ 管理员自有权限）、`isSuperAdmin(admin)`（id/role_id=1 或 role 为 `super_admin` 或含 `'all'`）、`hasPermission(perms, key)`、`permissionsBeyondActor(actor, requested)`、`canManageRole(actor, role)`、`canManageAdmin(actor, target, targetRole)`。

### 2. 后端挂载与判定

- `backend/src/middlewares/permission.js` 的 `requirePermission(perm)`：权限来源是**上游 `adminAuth` 写入的 `req.admin.permissions`**（不查库）。无 `req.admin` → 401；`isSuperAdmin` 直接放行；否则 `hasPermission` 不过 → 403 `无权限操作，需要权限: <key>`。
- `adminAuth`（`src/middlewares/auth.js:134,183`）**每请求回读库主体**重建权限 → 后端侧权限变更是**实时**的。
- 挂载点共 116 处：`src/routes/admin.js` 103、`src/routes/adminManage.js` 11、`src/routes/banner.js:32`（`splash:read`）、`src/routes/pay.js:47`（`recharge:write`）。
- **已核实的键表与路由不一致**：`recommend:read` / `recommend:write` / `api:read` 有定义但**无任何路由挂载**（`AdminRecommend.vue` 实际打 `/api/admin/users`，受 `user:read` 管；`AdminApi.vue` 是静态清单无请求）。改动这些页面时不要以为权限键已生效。

### 3. 管理端消费（三处，全部读 localStorage 快照）

- 菜单项注册**唯一位置** = 路由表 `admin-frontend/src/router/index.js:19-35`，每条 `meta:{title,icon,perm}`（`admins` / `roles` 两条 `hidden:true`）；**没有独立菜单配置文件**。共 17 条菜单路由，`views/admin/` 下 22 个 `.vue`（其中 5 个是 `AdminFinance.vue` 页内 tab 子组件，不注册菜单）。
- `admin-frontend/src/components/AdminLayout.vue:40-65`：`hasPerm(perm)` 读 `JSON.parse(localStorage.getItem('admin_user')).permissions`，菜单由路由表过滤 `!meta.hidden && hasPerm(meta.perm)` 生成。
- `admin-frontend/src/router/index.js:73-115`：守卫同样从 localStorage 取权限，`to.meta.perm` 不过 → 跳 `/403`。
- **按钮级权限预判：不存在**（全前端 `hasPerm` 只出现在上述两处），越权拦截完全靠服务端 403。
- **键表真源**：后端 `backend/src/utils/permissions.js` 的 `ALL_PERMISSIONS`（`模块:动作` 键 + 中文 label）。`AdminRoles.vue` 已改为启动时调 `GET /api/admin-manage/permissions` 的 `data.permissions` 渲染勾选项；文件内仍保留一份 `DEFAULT_PERMISSION_OPTIONS` 兜底（接口不可用时不至于无法编辑）。新增权限键只需改后端真源 + 该兜底副本。
- `GET /api/admin-manage/permissions` 的 `data` 为 `{ modules, permissions }`：`modules` 是 19 个模块 id（旧结构兼容），`permissions` 才是权限键；`GET /api/admin-manage/current` 返回实时 `req.admin`（前端仍未调用，A-3 遗留）。

### 4. 已知坑（编号与《未完成事项清单》一致）

- **A-1（已修复）**：`AdminAdmins.vue` 的角色默认值改为空、保存必选，下拉只列 `filterAssignableRoles` 可分配角色（权限未知时保守只给非超管）；新建/编辑/保存有二次守卫。新增角色下拉/默认值时不要退回 `role_id: 1`。
- **A-3（已修复，注意新页面）**：`AdminLayout.vue` 挂载即调 `GET /api/admin-manage/current` 刷新 `admin_user` 快照，菜单/守卫用响应式权限；当前页失权自动 `/403`。**新页面不要直接读 `localStorage.admin_user` 做权限判断**，应走 `adminPermission.js` 的 `hasPermission/readStoredAdmin`。
- 菜单 `finance:read` 的粒度与页内 tab 实际调用的键（`vip:*` / `withdraw:*` / `recharge:*` / `gift:read`）不完全对齐。

### 5. 改动步骤（新增一个权限点）

1. 后端 `src/utils/permissions.js` 加键（键 + label），保持 `<模块>:<动作>` 命名。
2. 目标路由挂 `requirePermission('<模块>:<动作>')`。
3. 管理端 `AdminRoles.vue` 已改为启动时拉 `GET /api/admin-manage/permissions` 的 `data.permissions` 渲染；文件内 `DEFAULT_PERMISSION_OPTIONS` 只是接口不可用时的兜底，仍要同步加同一键。
4. 新页面的菜单项写进 `admin-frontend/src/router/index.js` 的 `meta.perm`。
5. 角色默认权限模板（若有）与 `controllers/adminManage.js` 的 `DEFAULT_PERMISSIONS` 是否需同步——注意它用的是模块 id 而非 `模块:动作`，别混。
6. 文档：`backend/后端API接口文档.md` + `前端功能差异清单.md`（用 `kaifa-doc-sync`）。

## Verification

```powershell
cd backend; npx jest tests/unit/utils/permissions.test.js tests/unit/controllers/adminManage.test.js tests/unit/middlewares/permission.test.js
cd admin-frontend; npx vitest run; npm run build
# 键表一致性核对（新增键必须两处都命中）
Select-String -Path backend\src\utils\permissions.js,admin-frontend\src\views\admin\AdminRoles.vue -Pattern '<新键>' -Encoding UTF8
Select-String -Path backend\src\routes\*.js -Pattern "requirePermission\('<新键>'\)"
```

## Pitfalls

- 只改 `permissions.js` 不改 `AdminRoles.vue` → 角色编辑器里键缺失（最常见的「新增权限点没生效」）。
- 以为菜单/守卫能拦按钮操作：前端**没有**按钮级预判，越权只能靠服务端 403。
- 权限改完不重登就断言「不生效」→ 后端已实时，是前端快照滞后（A-3）。
- 非超管管理员创建账号时保留默认 `role_id: 1` → 必撞 403（A-1）。
- 把 `DEFAULT_PERMISSIONS` 的模块 id 当权限键写进 `requirePermission`。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：权限一致性审查员（只读）。仓库 C:\Users\admin\Desktop\kaifa。
任务：核对权限键 <新增/改动的键> 在以下 4 处是否一致并全部落地：
  ① backend/src/utils/permissions.js 的 ALL_PERMISSIONS；
  ② 目标路由的 requirePermission('<键>')（backend/src/routes/*.js）；
  ③ admin-frontend/src/views/admin/AdminRoles.vue 的 allPermissions 硬编码副本；
  ④ admin-frontend/src/router/index.js 的菜单 meta.perm。
另需检查：新建管理员表单是否仍默认 role_id: 1（A-1）；菜单显隐是否仍只读 localStorage 快照（A-3）。
环境：Windows PowerShell，读中文文件用 -Encoding UTF8。
硬约束：只读不改；每处结论给 file:line；无法判定的写「未验证 + 原因」。
报告：4 处逐项 → 命中(行号) / 缺失；A-1、A-3 现状一句话；本次改动是否引入新的键表不一致。
```
