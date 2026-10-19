---
name: kaifa-verify-change
description: "kaifa 改动验收：按改动面选最小充分验证集（backend jest、两个前端 vitest、eslint、vite build）并给出可复核证据。"
whenToUse: "刚改完 backend/、frontend/、admin-frontend/ 的代码；需要跑测试、构建、自查；需要在给结论前提供已执行的证据。"
tags: ["自习"]
---

# kaifa 改动验收

工作区根：`C:\Users\admin\Desktop\kaifa`。

## When to Use

- 任何代码改动之后、给出「完成」结论之前。
- 用户要求回归、提测、验收，或质疑某项改动是否真的生效时。

## 原则

先按改动面选最小充分集合，全绿再谈完成。**没有实际执行过的测试，不得写成「已验证」。**

## Procedure

### 1. 环境口径（PI-Desktop 本机实测）

- 宿主 shell 是 **Windows PowerShell**（本机 `Bash` 工具即 PowerShell）：串联用 `;`，不要用 `&&`。
- `node v24.21.0` / `npm 11.19.0` **可用**，`docker` / `git` **不可用**（不在 PATH）。
- 仓库文档里大量「本机无 node/npm，未执行测试」的记载**已过期**：本次会话起测试必须真跑。
- 中文文件读取用 `Get-Content -Encoding UTF8`（默认 ANSI 乱码）。

### 2. 选择验证集

| 改动面 | 必跑 |
|---|---|
| `backend/src/**` | `npx jest <对应 tests 路径>`，再全量 `npm test` |
| `backend/src/migrations/**` | 上述 + `npm run migrate` 连跑两次（验幂等），先 `npm run backup` |
| `frontend/src/**` | `npx vitest run tests/<对应>`，再 `npm run test:unit` |
| `frontend/src/views/**`、路由/懒加载 | 上面 + `npm run build`（动态 import 写错只在构建期暴露） |
| `admin-frontend/src/**` | `npx vitest run` + `npm run build` |
| 返回结构/错误文案 | `backend/tests/unit/consistency/*`（error-response-hygiene、docker-images、nginx-security-headers） |
| `nginx/**`、`Dockerfile*`、`docker-compose*.yml` | `backend/tests/unit/consistency/nginx-security-headers.test.js`、`docker-images.test.js` |
| `package.json` / 依赖升级 | 对应包测试；锁文件不要手改 |
| 鉴权/回包/上传/加密 | 见 `kaifa-security-invariants` 的不变量复核命令 |

### 3. 逐条执行

```powershell
cd backend; npx jest tests/unit/controllers/vip.test.js
cd backend; npm test
cd backend; npm test -- --coverage         # 闸门：branches 60 / functions 70 / lines 75 / statements 75
cd backend; npm run lint
cd frontend; npx vitest run tests/views/level-acceleration.test.js
cd frontend; npm run test:unit; npm run build
cd admin-frontend; npx vitest run; npm run build
cd admin-frontend; npm run lint            # 借 ../frontend/node_modules/eslint，必须在 admin-frontend 执行
```

需要真实服务而非单测时（HTTP 探针、UI 截图、双端联调）→ 用 `kaifa-e2e-probe`。

### 4. 证据要求

- 记录命令、退出码、关键输出尾部；失败贴首个失败断言的原文，不要转述成结论。
- 覆盖率只在被闸门拦住或任务明确要求时收集；`coverage/`、`dist/`、`.e2e-run/` 都是忽略产物，不要提交。
- 只截取与结论相关的日志行（`backend/logs/*.log`、`.e2e-run/*.log` 可能很大）。

## Verification（本技能自身的完成判据）

- 每条执行的命令都有退出码；失败项有原文。
- 结论里区分「已执行通过 / 已执行失败 / 未执行（原因）」三类，不混写。

## Pitfalls

- 时间/资源不够就跳过全量 → 至少把改动面的定向用例与一次 build 跑掉，并如实标注未跑项。
- 宿主 shell 自身不可用（PowerShell 以异常退出码、无任何输出失败）**不是被测代码的问题**：一次即可判定，不要反复重试；改为用 `kaifa-e2e-probe` 里的 Node 脚本让宿主自行拉起进程，或明确把命令与预期交给用户执行。
- Windows 上被强杀的命令会以退出码 1 结算且没有信号标记：先判断是不是中断，再当作失败。
- `bg`/`watch` 模式（`npm test -- --watch`）会挂住会话：一律用一次性运行形式（`npx jest` / `vitest run`）。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：测试执行员（只跑不改）。仓库 C:\Users\admin\Desktop\kaifa。
环境：Windows PowerShell（用 ; 不用 &&），node v24 与 npm 11 可用，docker/git 不可用。
任务：按改动面 <backend/src/x | frontend/src/x | admin-frontend/src/x> 跑最小充分集：
  cd backend; npx jest <对应用例>  → cd backend; npm test
  cd frontend; npx vitest run <对应用例> → npm run test:unit → npm run build
  cd admin-frontend; npx vitest run → npm run build
硬约束：只报告退出码与关键输出尾部；失败贴首个失败断言原文，禁止转述成「可能是…」；不要修改任何文件；
不要跑 watch 模式；未跑到的项必须显式列出原因。
报告格式：每条命令 → 退出码 → 结果(通过/失败) → 失败原文（如有）。
```
