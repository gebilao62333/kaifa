---
name: kaifa-backend-feature
description: "在 kaifa（eu搭子）后端新增或修改接口功能：routes → controllers → services → models/迁移，并配 jest 单元测试。当任务落在 backend/ 下、要加接口、改业务逻辑或加字段时使用。"
whenToUse: "改动点位于 backend/src 或 backend/tests，目标是新增或调整 HTTP 接口、服务层、模型或数据库字段。"
tags: ["自习"]
---

# kaifa 后端功能开发

工作区根：`C:\Users\admin\Desktop\kaifa`。技术栈：Express 4 + Sequelize(MySQL) + Mongoose(Mongo) + Redis + Socket.IO；测试 jest + supertest。

## When to Use

- 改动点在 `backend/src/**` 或 `backend/tests/**`：加/改 HTTP 接口、服务层逻辑、模型或数据库字段。
- 不适用：只改前端 → `kaifa-vue-page`；只跑验证 → `kaifa-verify-change`；只改文档 → `kaifa-doc-sync`；只动迁移 → `kaifa-db-migration`。

## 环境口径（PI-Desktop 本机实测，覆盖各文档里过期的「本机无 node」说法）

- 宿主 shell 是 **Windows PowerShell**（本机 `Bash` 工具即 PowerShell）。命令分隔用 `;`，不要用 `&&`（PS 5.1 不支持）。
- `node v24.21.0` / `npm 11.19.0` **可用** → 测试直接跑，禁止再写「本机无 node，仅静态复核」。
- `docker` / `git` **不在 PATH** → 容器构建、提交动作交用户执行。
- 仓库文件是 UTF-8：PowerShell 读中文文档必须 `Get-Content -Encoding UTF8`，默认 ANSI 会把中文读成乱码。

## Procedure

### 1. 先确认事实（别凭记忆改）

- 入口 `backend/server.js`：dotenv 读 `backend/.env`；生产环境核心模块加载失败直接 `process.exit(1)`。
- 路由总表 `backend/src/routes/index.js`：新增路由文件后必须把 `{ path: './xxx', name: '中文名', prefix: '/api/xxx' }` 加进 `routesToLoad`。该表用 `safeRequire` 包装，**加载失败只打一行日志、不报错**——"加了路由却 404"先看日志里的 `加载 xx 路由失败`。
- 服务出口 `backend/src/services/index.js`：控制器统一 `const { xxxService } = require('../services')`。新服务不在这里导出 → 控制器拿到 undefined。
- 模型出口 `backend/src/models/index.js`；表名沿用历史 `xn_` 前缀（`sequelize.define('xn_user', ...)`）。
- 中间件出口 `backend/src/middlewares/index.js`：`authMiddleware / optionalAuth / adminAuth / requirePermission / validate / validateQuery / apiLimiter / loginLimiter / cardLimiter / uploadLimiter / xssProtection`。

### 2. 分层落点

| 层 | 位置 | 约定 |
|---|---|---|
| 路由 | `src/routes/<mod>.js` | 只写路径 + 中间件 + 转发，业务不进路由 |
| 控制器 | `src/controllers/<mod>.js` | 取 `req.userId`/`req.body`/`req.query`，调 service，用 response 回包 |
| 服务 | `src/services/<mod>Service.js` | 业务与数据访问；写完在 `services/index.js` 导出 |
| 模型 | `src/models/mysql/<Name>.js` | `sequelize.define`；写完在 `models/index.js` 导出 |
| 迁移 | `src/migrations/<timestamp>_<snake>.js` | 导出 `up()`，必须幂等（详见 `kaifa-db-migration`） |
| 测试 | `tests/unit/{controllers,services,utils}/` | 见第 7 步 |

### 3. 回包与错误（强约束）

统一用 `require('../utils/response')`：`success / created / badRequest / unauthorized / forbidden / notFound / unprocessableEntity(res,msg,errors) / tooManyRequests / dbError(res,'操作名') / serviceUnavailable`。

- 信封固定 `{ code, message, data }` 且强制 `charset=utf-8`。**不要手写 `res.json(...)`**。
- `response.error` 会按 `SYSTEM_ERROR_PATTERN` 和 >80 字符把内部信息抹成「服务器内部错误」，别指望把 SQL/堆栈透给前端；对外文案自己写明白。
- 依赖未配置（缺密钥、外部服务未启用）用 503 `serviceUnavailable`，不要和 500 混同。

### 4. 鉴权与权限

- 需登录 `authMiddleware`；可选登录 `optionalAuth`；管理端 `adminAuth`。
- 权限键是 `<模块>:<动作>`，真源 `backend/src/utils/permissions.js`（管理端前端 AdminRoles 共用同一套 key）；接口上挂 `requirePermission('模块:动作')`，细节见 `kaifa-permission-key`。
- 只接受 access 用途令牌；吊销检查 fail-closed（Redis 不可用返回 503）。写测试时不要 mock 掉整条鉴权链路就断言 200。
- ⚠️ 已知不一致：`authMiddleware` 判 `status !== 1` 拒绝封禁用户，`optionalAuth` 不判（未完成事项清单 S-1）。新增 `optionalAuth` 路由前先确认这个口径是否可接受。

### 5. 校验与限流

- 入参用 `validate(schema)` / `validateQuery(schema)`，形如 `{ required: ['packageId'], fields: { packageId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } } }`（参考 `src/routes/vip.js`）。
- 登录、短信、卡密、上传各有独立限流桶，敏感接口挂对应 limiter。

### 6. 数据与迁移

新字段/新表一律走迁移，完整规矩见 `kaifa-db-migration`。要点：写 `src/migrations/<YYYYMMDDHHmmss>_<描述>.js` 导出幂等 `up()`，并**挂进 `src/migrations/runMigrations.js`**（不改这个文件，`npm run migrate` 永远不跑你的迁移）。

### 7. 写测试（jest）

配置 `backend/jest.config.js`：`roots: ['<rootDir>/tests']`，setup `tests/setup.js`（30s 超时、每个用例后 clearAllMocks/restoreAllMocks）。

控制器测试模板：

```js
jest.mock('../../../src/services', () => ({ xxxService: { fn: jest.fn() } }));
const { xxxService } = require('../../../src/services');
const mockReq = (o = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...o });
const mockRes = () => { const r = {}; r.setHeader = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
```

服务逻辑放 `tests/unit/services/<name>.test.js`，工具放 `tests/unit/utils/`。

## Verification

```powershell
cd backend; npx jest tests/unit/controllers/<mod>.test.js
cd backend; npx jest tests/unit/services/<mod>Service.test.js
cd backend; npm test                       # 全量
cd backend; npm test -- --coverage         # 闸门 branches 60 / functions 70 / lines 75 / statements 75
cd backend; npm run lint
```

证据 = 命令 + 退出码 + 关键输出尾部；失败贴首个失败断言原文，不要转述成结论。

## Pitfalls

- 忘了在 `services/index.js` / `models/index.js` 导出 → 运行时 undefined；单元测试因为整段 mock 了 services 反而发现不了，必须补一条真实 require 的断言或跑集成测试。
- 忘了注册路由 → 404，且只有一行 warn。
- 迁移不幂等 → 二次启动报 Duplicate column。
- 改了返回结构没同步 `backend/后端API接口文档.md` → 用 `kaifa-doc-sync`。
- 涉及用户隐私字段：走 `src/utils/pii.js`；上传文件名走 `src/utils/uploadFileNaming.js`，别自己拼路径。
- 在 PowerShell 里用 `&&` 串命令 → 语法错误；用 `;`。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
目标：在 C:\Users\admin\Desktop\kaifa 的 backend 中实现 <接口/字段>，遵循仓库分层约定。
硬约束：路由必须注册进 src/routes/index.js 的 routesToLoad；新 service/model 必须在 services/index.js、
models/index.js 导出；回包只用 utils/response.js（禁止手写 res.json）；权限键取自 utils/permissions.js；
入参用 validate/validateQuery；新字段必须写幂等迁移并挂进 migrations/runMigrations.js。
环境：Windows PowerShell（用 ; 不用 &&），node/npm 可用，docker/git 不可用，中文文件读用 -Encoding UTF8。
验证：cd backend; npx jest tests/unit/<改动面>.test.js，再 npm test；贴退出码与首个失败断言原文。
报告：改了哪些文件、验证命令与结果、未验证项及原因。
```
