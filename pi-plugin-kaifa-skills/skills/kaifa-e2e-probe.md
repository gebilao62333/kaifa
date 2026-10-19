---
name: kaifa-e2e-probe
description: "kaifa 联调探针：在 .e2e-run/ 用 Node + playwright-core 驱动本机后端(3000)/用户端(5174)/管理端(5175)，产出 JSON 报告与截图并清理。"
whenToUse: "需要用真实服务验证（HTTP 探针、UI 截图、双端联调）而不是单元测试；产物落在 .e2e-run/ 且可丢弃。"
tags: ["自习"]
---

# kaifa 联调探针

工作区根：`C:\Users\admin\Desktop\kaifa`。

## When to Use

- 需要真实服务的行为证据：接口矩阵、跨端链路、UI 走查、复现线上问题时。
- 不适用：纯逻辑改动 → 用 `kaifa-verify-change` 的 jest/vitest。

## Procedure

### 1. 什么是真源

`.e2e-run/` 是**一次性脚本 + 产物的工作目录**（整目录在 `.gitignore` 中，不提交）。已有 80+ 脚本可抄近路：

| 用途 | 现成脚本 |
|---|---|
| 拉起后端（detached，AUTO_MIGRATE=false） | `ensure-be.js`（日志 `backend-srv.log` / `backend-srv.err.log`） |
| 生成 user/user2/admin 令牌 | `tokens3.js` → `.e2e-run/tokens.json` |
| 拉起两个前端 + Playwright/Edge 截图 | `ui-driver.js`（`ui-l1.js`、`l2-admin.js`、`l2-user.js` 等同套路） |
| 接口矩阵 / 渠道 / 通话 | `v2-api-matrix.log`、`probe-channel.js`、`two-party-call.js`、`turn-relay-probe.js` |
| 资金 / 卡密 | `concurrency-probe.js`、`redeemtest.js`、`l2-card.js` |
| 数据清理 | `cleanup*.js`、`clean-cards2.js`、`residue-clean.js`、`final-clean.js` |

### 2. 端口与依赖

- 后端 `http://127.0.0.1:3000`，健康检查 `GET /api/health`；用户端 `5174`；管理端 `5175`。
- 浏览器：`playwright-core` 装在 `.e2e-run/node_modules`（`cd .e2e-run; npm i`），用本机 Edge：`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`。
- 后端依赖：`require(backend/node_modules/dotenv).config({ path: backend/.env })`，配置文件全部从 `backend/` 复用，不要另造一套配置。
- 环境（PI-Desktop 本机实测）：`node v24.21.0` / `npm 11.19.0` 可用；**`docker` / `git` 不在 PATH**；shell 是 Windows PowerShell（串联用 `;`，杀进程用 `Stop-Process -Id <pid> -Force` 或 `taskkill /PID <pid> /F`）。

### 3. 标准动作

1. 起服务：先探 `/api/health`；不通就跑 `cd .e2e-run; node ensure-be.js`，最多等 ~30s。
2. 取令牌：`cd .e2e-run; node tokens3.js`。注意它会直连数据库，**admin 登录失败时会 UPDATE 重置 admin 密码**——这是写操作，只能对本地/测试库用。
3. 写探针：新脚本叫 `<主题>-probe.js` 或 `<主题>-verify.js`，用 `fetch` + `AbortSignal.timeout(...)`，把结果写到 `<主题>-report.json`（字段至少包含 `{ ok, cases: [{ name, status, code, message, detail }] }`）。
4. 记录结论：报告里写清"通过/失败/未验证"三类，未验证项要写原因（缺密钥、缺外网、缺人工操作）。
5. 清理：`taskkill`/`process.kill` 掉自己拉起的 pid（参考 `pids.json` 约定），删掉本次造的数据，删掉含真实令牌的 `tokens*.json`。

### 4. 探针脚本骨架（PowerShell + Node 混合时最容易踩的两点）

- 探针脚本用 Node 写、由 `node xxx-probe.js` 启动；**不要在 PowerShell 里手拼 JSON**，中文与引号会被转义搞坏。
- 后端需要放宽限流时用 `RATE_LIMIT_DISABLED=true` 启动（H-8 起本地不再自动豁免）；`tests/e2e/*` 三脚本同样有此前置。

### 5. 安全红线

- 不要把 `.env` 内容、JWT、管理员密码明文写进报告、日志或最终回答；报告里只记 `status/code/message`。
- 探针默认只读；任何写库/写文件的步骤要在报告里单独标出并说明影响范围。
- 不要对生产地址（Sealos 域名）跑写操作探针。

## Verification

- 报告 JSON 存在且字段完整（`ok` + `cases[]`），每例有 `status/code/message`。
- 断言过的链路有接口级证据，不只截图。
- 本次拉起的进程已终止、造的数据已清理、含令牌的 `tokens*.json` 已删除。

## Pitfalls

- `fetch` 没有超时 → 探针挂死；统一用 `AbortSignal.timeout`。
- 后端没起就断言失败 → 先区分"服务未启动"和"接口不对"；健康检查失败就别继续跑用例。
- 只跑 UI 截图不跑接口断言 → 结论无法复核；截图只是证据之一。
- 忘了 `cd .e2e-run` 就 `node ensure-be.js` → 找不到模块；该目录有自己的 `node_modules`。
- 数据没清干净 → 后续用例被脏数据干扰（先跑 `cleanup*.js`）。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：联调探针员。仓库 C:\Users\admin\Desktop\kaifa，工作目录 .e2e-run\（有独立 node_modules，含 playwright-core）。
环境：Windows PowerShell（用 ; 不用 &&）；node/npm 可用；docker/git 不可用；杀进程用 taskkill /PID <pid> /F。
任务：① cd .e2e-run; node ensure-be.js 起后端（先探 http://127.0.0.1:3000/api/health）；
② node tokens3.js 取令牌（⚠️ 会 UPDATE 重置 admin 密码，仅限本地库）；③ 写 <主题>-probe.js 跑断言，
   每个 fetch 必须带 AbortSignal.timeout；④ 产出 <主题>-report.json（{ok, cases:[{name,status,code,message,detail}]}）；
⑤ 结束前杀掉自己拉起的进程、清理造的数据、删除含令牌的 tokens*.json。
硬约束：报告与回答里禁止出现 .env 内容、JWT 明文、管理员密码；写库步骤必须在报告里单独标注；
不得对生产域名跑写操作。
报告：起服务结果 → 每个用例 name/status/code/message → 通过/失败/未验证三类结论（未验证写原因）→ 清理结果。
```
