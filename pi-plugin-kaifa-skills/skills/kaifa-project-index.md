---
name: kaifa-project-index
description: "kaifa（eu搭子）项目技能包索引：按改动面选择要加载的技能，并给出仓库根、环境口径与统一硬约束。"
---

# kaifa 项目技能包（索引）

仓库根：`C:\Users\admin\Desktop\kaifa`（后端 `backend/`、用户端 `app/`（uni-app）、管理端 `admin-frontend/`、`nginx/`、`docker-compose*.yml`）。旧站 `frontend/` 已于 2026-10-21 删除（备份 `.e2e-run/legacy-frontend-backup-2026-10-21/`）。

## When to Use

- 任何改动落在 kaifa 仓库时：先读本索引，再按改动面加载下面对应的技能（每个技能都含 `When to Use / Procedure / Verification / Pitfalls`）。

## 环境口径（PI-Desktop 本机实测，覆盖项目文档里过期的「本机无 node」说法）

- 宿主 shell 是 **Windows PowerShell**（`Bash` 工具即 PowerShell）：串联用 `;`，不要用 `&&`；读中文文件必须 `Get-Content -Encoding UTF8`。
- `node v24.21.0` / `npm 11.19.0` **可用** → 测试与构建必须真跑，禁止沿用「未执行、仅静态复核」。
- `docker` / `git` **不在 PATH** → 容器、提交动作只能静态核对或交用户执行。

## 按改动面选择技能

| 改动面 | 加载技能（`kaifa.skills/<name>`） |
|---|---|
| `backend/src/**` 加接口/服务/模型 | `kaifa-backend-feature` |
| 迁移、字段/索引、PII 加密 | `kaifa-db-migration` |
| 鉴权、回包、上传、加密、限流、跨用户读 | `kaifa-security-invariants` |
| 支付/钱包/提现/卡密/红包/VIP | `kaifa-money-path` |
| TRTC/P2P/TURN/通话计费 | `kaifa-call-chain` |
| 后台功能页、权限点、菜单显隐 | `kaifa-permission-key` |
| `app/`（uni-app 用户端）、`admin-frontend/` 页面与路由 | `kaifa-vue-page` |
| 改完要跑测试/构建、要给结论 | `kaifa-verify-change` |
| 真实服务联调、UI 走查、接口矩阵 | `kaifa-e2e-probe` |
| 环境变量、镜像、nginx、上线核对 | `kaifa-deploy-check` |
| 接口/字段/文档版本历史同步 | `kaifa-doc-sync` |

## 跨技能硬约束（每个技能的 Procedure 都假定你已知道这些）

- 新路由必须注册进 `backend/src/routes/index.js` 的 `routesToLoad`（`safeRequire` 加载失败**只打一行日志**，症状是 404）。
- 新 service / model 必须在 `backend/src/services/index.js`、`backend/src/models/index.js` 导出，否则控制器拿到 `undefined`。
- 回包只用 `backend/src/utils/response.js`（信封 `{code,message,data}`），**禁止手写 `res.json`**。
- 表名沿用 `xn_` 前缀；迁移必须幂等，且必须挂进 `migrations/runMigrations.js`（当前 16 个文件全接线；宽列迁移受 `AUTO_MIGRATE_WIDEN_COLUMNS` 控制）。
- 权限键唯一真源 `backend/src/utils/permissions.js`，但管理端 `AdminRoles.vue` 有第二份硬编码副本。
- 未收口项：`optionalAuth` 不拒绝封禁用户（未完成事项清单 S-1），不要顺手改。

## Pitfalls

- 只加载一个技能就动手：跨面改动（例如加接口 + 改前端 + 改文档）需要各自对应的技能。
- 技能有三处拷贝：本包（真源）、`kaifa\.dsh\skills\`（DSH 会话实际加载源，内容旧时会**遮蔽**本包）、用户级 `~/.agents/skills/`（旧副本）。改技能后：①同步本包并重新 PluginPack 出 `dist`；②确认加载源未遮蔽（改前用 `skill` 工具看返回内容是否为本包版本）。
