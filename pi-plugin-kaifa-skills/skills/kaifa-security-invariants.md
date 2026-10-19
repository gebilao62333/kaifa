---
name: kaifa-security-invariants
description: "kaifa 已收口安全不变量回归清单（31 项 + 未收口 S-1）：改鉴权/回包/上传/加密/限流前的必查表与复核命令。"
whenToUse: "改动涉及鉴权、回包结构、错误文案、上传、加密、限流、跨用户读，或要给安全类改动下结论之前。"
tags: ["自习"]
---

# kaifa 安全不变量回归

工作区根：`C:\Users\admin\Desktop\kaifa`。本仓库做过 31 项安全收口（C-1~C-4 / H-1~H-9 / M-1~M-13 / 低危+依赖），**逐项都有代码与测试**。后续改动最常见的风险不是新漏洞，而是**无声回退**这些已收口的口径。

## When to Use

- 改动触及：`middlewares/auth.js`、`config/jwt.js`、`utils/response.js`、`utils/pii.js`、`utils/uploadFileNaming.js`、`middlewares/rateLimit.js`、`middlewares/validation.js`、`utils/socialPrivacy.js`、`utils/p2pRelay.js`、`utils/secureCompare.js`、`controllers/user.js`、`controllers/adminManage.js`。
- 要给「安全项已收口 / 已修复」下结论前。

## Procedure

### 1. 先看唯一未收口项（S-1 / M-4）

**封禁口径两入口不一致**：`authMiddleware` 判 `status !== 1` → 403「账号已被禁用」；`optionalAuth` **不判** `status`，只要用户存在就挂 `req.user` / `req.userId`。

- 真源：`backend/src/middlewares/auth.js:63-68`（authMiddleware，另 :71 判禁言）对比 `backend/src/middlewares/auth.js:115-120`（optionalAuth 仅 `findByPk` + 挂载）。
- 后果：被封禁用户持有效 access 令牌，在走 `optionalAuth` 的公开页仍被识别为登录态。
- 复核：`Select-String -Path backend\src\middlewares\auth.js -Pattern "status !== 1"`
- 处置约定：**未被用户排期批准前不要顺手改**（`未完成事项清单.md` §1 明确列为排期外）。新增 `optionalAuth` 路由时必须在报告里显式提示这一点。

### 2. 回包信封（改动最密集的不变量）

`backend/src/utils/response.js` 导出：`success / created / badRequest / unauthorized / forbidden / notFound / unprocessableEntity / tooManyRequests / error / dbError / serviceUnavailable / custom`。

- 信封固定 `{ code, message, data }`；**禁止手写 `res.json(...)`**（一致性测试会较真格式与错误码）。
- `error()` 的内部信息抹除：`_isSafeMessage` 要求 message 是 string、长度 ≤ 80、且不匹配 `SYSTEM_ERROR_PATTERN`（含 `SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|TABLE|sequelize|ECONNREFUSED|ENOENT|TypeError|ReferenceError|SyntaxError|at xxx (|.sql|node_modules` 等），否则回退固定文案「服务器内部错误」。**依赖未配置用 503 `serviceUnavailable`，不要混进 500。**
- 低危项口径：`/api/health` 不健康分支**不回显 `error: e.message`**；管理员登录 catch 不 `console.error(error.stack)`。

### 3. 逐项不变量与复核命令

| 编号 | 不变量 | 真源 | 复核命令（仓库根执行） |
|---|---|---|---|
| C-1 | 验证码登录/自动注册前必须真校验短信码 | `src/services/smsService.js:128`、`src/services/authService.js:23,56` | `cd backend; npx jest tests/unit/services/authSmsCode.test.js` |
| H-1 | register/resetPassword 同样强制校验码，场景键隔离 | `src/services/smsService.js:13,18`、`src/controllers/user.js:78,147` | `cd backend; npx jest tests/unit/services/smsScene.test.js` |
| C-2 | 提现在事务内条件扣减 money，未命中即回滚 | `src/services/walletService.js:357,387` | `cd backend; npx jest tests/unit/services/walletService.test.js` |
| C-3 | 卡密卡号+密码时序安全比对；卡密口需登录+限流 | `src/services/payService.js:218`、`src/routes/pay.js` | `cd backend; npx jest tests/unit/services/payServiceCard.test.js` |
| C-4 | 进房票据先校验请求者是通话成员且在可进状态 | `src/services/trtcService.js:230,255`、`src/services/callBillingService.js:14` | `cd backend; npx jest tests/unit/services/trtc.test.js tests/unit/controllers/trtc.test.js` |
| H-2 | 充值入账唯一入口，原子占用订单+金额核对同事务 | `src/services/payService.js:105,166` | `cd backend; npx jest tests/unit/services/payServiceSettle.test.js tests/unit/services/wechatPayNotify.test.js` |
| H-3 | 后台两登录入口 IP 限流(15m/5)+账号失败锁定(5) | `src/middlewares/rateLimit.js:46`、`src/routes/admin.js:116`、`src/routes/adminManage.js:7` | `cd backend; npx jest tests/unit/services/adminLoginGuard.test.js` |
| H-4 | 四类令牌带 type 用途声明，校验按白名单选密钥 | `src/config/jwt.js:9,41,68` | `cd backend; npx jest tests/unit/config/jwt.test.js` |
| H-5 | 登出/改密/禁用/删号写服务端吊销状态 | `src/services/tokenRevocation.js`、`src/middlewares/auth.js:38,110,215` | `cd backend; npx jest tests/unit/services/tokenRevocation.test.js` |
| H-6 | 装扮所有权与扣款金额由服务端目录决定 | `src/services/skinService.js`、`src/utils/skinCatalog.js` | `cd backend; npx jest tests/unit/services/skinService.test.js tests/unit/utils/skinCatalog.test.js` |
| H-7 | 预约/游戏订单状态迁移改条件更新+影响行数判定 | `src/services/reserveService.js:180,212,276,348`、`src/services/gamesService.js:210,246,286,366,407` | `cd backend; npx jest tests/unit/services/reserveService.test.js tests/unit/services/gamesService.test.js` |
| H-8 | trust proxy 取真实 IP；限流仅由显式开关关闭 | `src/config/trustProxy.js:84`、`src/config/index.js:29,39`、`src/middlewares/rateLimit.js:9` | `cd backend; npx jest tests/unit/config/trustProxy.test.js tests/unit/middlewares/rateLimit.test.js` |
| H-9 | 删除弱口令兜底（DB_PASSWORD 不再回退默认值） | `src/config/index.js:70` | `cd backend; npx jest tests/unit/config/envHygiene.test.js` |
| M-1 | 后台授出权限/目标主体不得越界 | `src/utils/permissions.js:67,74,82`、`src/controllers/adminManage.js:261,316,501` | `cd backend; npx jest tests/unit/utils/permissions.test.js tests/unit/controllers/adminManage.test.js` |
| M-2 | adminAuth 每请求回读库主体（禁用/删除/改权限即生效） | `src/middlewares/auth.js:134,183`、`src/controllers/adminManage.js:76,130,171` | `cd backend; npx jest tests/unit/middlewares/auth.test.js` |
| M-3 | 管理端令牌独立签名密钥；固定令牌常量时间比对 | `src/config/jwt.js:27`、`src/middlewares/auth.js:200`、`src/controllers/adminManage.js:166` | `cd backend; npx jest tests/unit/utils/secureCompare.test.js` |
| **S-1** | **未收口**：optionalAuth 须与 authMiddleware 一致拒绝封禁用户 | `src/middlewares/auth.js:115-120` vs `:63` | `Select-String -Path backend\src\middlewares\auth.js -Pattern "status !== 1"` |
| M-5 | 验证码只在显式声明 NODE_ENV 的非生产回传 | `src/config/index.js:146` | `cd backend; npx jest tests/unit/services/smsDevReturn.test.js` |
| M-6 | 写接口入参严格十进制强转+上下限（10 条路由挂载） | `src/middlewares/validation.js:22,31` | `cd backend; npx jest tests/unit/middlewares/validation.test.js` |
| M-7 | 红包领取单事务内 FOR UPDATE 锁定后算金额 | `src/services/giftService.js:290` | `cd backend; npx jest tests/unit/services/giftService.test.js` |
| M-8 | 实名 PII 静态加密；password 默认查询剔除 | `src/utils/pii.js:28,45`、`src/controllers/user.js:406-409`、`src/models/mysql/User.js` | `Select-String -Path backend\src\utils\pii.js -Pattern "encryptField"` |
| M-9 | nginx 自带 add_header 的块须重新引入安全头片段 | `nginx/conf.d/security-headers.inc` | `cd backend; npx jest tests/unit/consistency/nginx-security-headers.test.js` |
| M-10 | P2P 信令媒体 URL 限白名单主机+目标/体积校验 | `src/utils/p2pRelay.js:50,68` | `cd backend; npx jest tests/unit/utils/p2pRelay.test.js` |
| M-11 | 粉丝/关注跨用户读 403；在线探测须有社交关系 | `src/utils/socialPrivacy.js:26,37`、`src/controllers/user.js:219,266`、`src/controllers/p2pController.js:15` | `cd backend; npx jest tests/unit/utils/socialPrivacy.test.js tests/unit/controllers/p2p.test.js` |
| M-12 | 上传落盘后缀走白名单/mimetype 兜底；multer 2.x | `src/utils/uploadFileNaming.js:26`、`backend/package.json` | `cd backend; npx jest tests/unit/utils/uploadFileNaming.test.js` |
| M-13 | ALLOW_INSECURE_CONFIG 按项豁免，非整体跳过 | `src/utils/startupConfigGuard.js:35` | `cd backend; npx jest tests/unit/utils/startupConfigGuard.test.js` |
| 低危+依赖 | 验签固定 HS256；登录三类凭证失败统一 422 同文案；health 不回显 error；无堆栈；Node≥20；mysql/mongo 固定补丁版 | `src/config/jwt.js:68`、`backend/Dockerfile`、`docker-compose.yml` | `cd backend; npx jest tests/unit/consistency/docker-images.test.js tests/unit/consistency/error-response-hygiene.test.js` |

### 4. 一致性测试（改回包/命名/WebSocket 必跑）

`backend/tests/unit/consistency/`：
- `docker-images.test.js` — Node major≥20、mysql 固定 `8.0.x`、mongo 固定 `6.0.x`。
- `error-response-hygiene.test.js` — `server.js` 不含 `error: e.message`；`adminManage.js` 无调试堆栈。
- `nginx-security-headers.test.js` — 自带 `add_header` 的块必须重新 include 安全头片段。
- `field-consistency.test.js` — 字段名用 `nickname`（非 `nickName`）、响应/错误码格式、事件命名下划线。
- `websocket-consistency.test.js` — 前后端事件名与载荷一致、重连与 Bearer 认证配置。

## Verification

```powershell
cd backend; npx jest tests/unit/consistency
cd backend; npx jest tests/unit/middlewares tests/unit/utils
cd backend; npm test
```

- 每项改动命中的不变量都要有**对应测试执行结果**（退出码 + 输出）。环境：`node v24.21.0` / `npm 11.19.0` 可用，**不要再沿用「本机无 node，仅静态复核」的旧口径**。
- 结论里区分「已复核通过 / 未复核（原因）」。

## Pitfalls

- 只跑 `npm test` 全量通过就断言安全无回归 → 一致性测试与鉴权用例才是关键，先跑定向。
- 把 `optionalAuth` 当 `authMiddleware` 用（以为它也会拒封禁用户）→ S-1 现状下不成立。
- 为了让测试通过而 mock 掉整条鉴权链路 → 断言失去意义。
- 新增权限键后只改后端、忘了管理端第二份键表副本 → 见 `kaifa-permission-key`。
- 已核实的文档漂移：`未完成事项清单` 中 H-3 遗留①称应急口令仍用 `!==`，实读 `adminManage.js:166` 已用 `safeEqual` —— 该遗留**代码层已消除**，以代码为准。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：安全不变量审查员（只读对抗审查，不改代码）。仓库 C:\Users\admin\Desktop\kaifa。
任务：本次改动 <文件清单> 是否回退了《未完成事项清单》中已收口的 31 项安全不变量？
逐项核对：① 回包是否仍只用 utils/response.js（禁止手写 res.json，信封 {code,message,data}）；
② 鉴权类型与吊销检查（access 令牌、fail-closed）；③ 登录类失败是否仍统一 422 同一文案（无账号枚举）；
④ 错误响应是否仍抹除内部信息（≤80 字符 + SYSTEM_ERROR_PATTERN）；⑤ 上传后缀是否仍走 uploadFileNaming 白名单；
⑥ 跨用户读是否仍 403；⑦ 入参是否仍走 validate/validateQuery 与限流桶。
必跑：cd backend; npx jest tests/unit/consistency 及改动面定向用例。
硬约束：只读，不修改文件；发现的疑点必须给 file:line，不允许推测性结论；S-1（optionalAuth 不判封禁）
是已知未收口项，若改动扩大其影响面要显式指出，但不要顺手改。
报告：编号 → 结论(未回退/疑似回退/未验证) → 证据(file:line 或命令输出) → 建议（若需改动指出最小面）。
```
