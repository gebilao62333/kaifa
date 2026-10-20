---
name: kaifa-deploy-check
description: "kaifa 发布与部署自检：弱密钥闸门、docker compose、nginx 安全头、健康检查、Sealos 核对与回滚关注点。"
whenToUse: "准备 docker build/up、更新线上容器、按 Sealos 清单发布前后；或健康检查失败需要定位时。"
tags: ["自习"]
---

# kaifa 部署自检

工作区根：`C:\Users\admin\Desktop\kaifa`。

## When to Use

- 构建镜像、`docker compose up`、更新线上容器之前/之后。
- 按 `Sealos部署核对清单.md` 发布；线上 `/api/health` 失败需要定位。

## 环境口径（PI-Desktop 本机实测）

- ⚠️ 本机 **`docker` 不在 PATH**（`git` 亦不可用）：编排与镜像相关命令只能**静态校验**，实际执行交用户。
- 可用：`node v24.21.0` / `npm 11.19.0` → 前端构建、一致性测试、`deploy-selfcheck.js` 可本地跑。
- shell 是 Windows PowerShell：串联用 `;`；中文文件读用 `-Encoding UTF8`。

## Procedure

### 1. 拓扑（先对齐事实）

`docker-compose.yml` = nginx + backend + mysql + mongo + redis（另有 certbot / coturn 可选 profile）；nginx 挂载 `app/dist/build/h5`（2026-10-21 旧站 frontend/ 删除后改挂）、`admin-frontend/dist`、`backend/public/uploads`，反代到 backend。

- compose 从**根目录 `.env`** 取值，`MYSQL_PASSWORD`、`MONGO_ROOT_PASSWORD` 用 `${VAR:?}` 强制要求——缺了直接拒绝启动，这是设计而非 bug。
- `backend` 用 `env_file: .env`（根）注入，另有 `NODE_ENV=production`、`LOG_TO_CONSOLE=true`、`LOGS_PATH=/var/log/eudazi`。
- `TRUST_PROXY` 默认 `loopback,172.16.0.0/12`（nginx 与 backend 是两容器）。**永远不要填 `true`/`*`/`all`**：配置解析层会拒绝启动；即使绕过，`req.ip` 会恒为代理地址，全站限流共用一个桶。

### 2. 发布前（本机/构建机）

1. 前端产物必须先构建：`cd app; npx --yes pnpm@10.15.0 build:h5`（产物 `app/dist/build/h5`）、`cd admin-frontend; npm run build`。compose 是只读挂载产物目录，nginx 不会帮你构建，挂到空目录就是白屏。
2. `docker compose config` 校验 env 插值与语法（不改任何东西）——本机无 docker 时，改为逐项核对 `docker-compose*.yml` 的 `${VAR:?}` 键是否都在 `.env` 里存在。
3. `docker compose build backend`（`Dockerfile`；本地开发用 `Dockerfile.dev` / `docker-compose.dev.yml`）。
4. 备份：`cd backend; npm run backup`（`scripts/backup.js`）。迁移只有 `up`、没有回滚脚本，备份是唯一退路。
5. 一致性测试：`cd backend; npx jest tests/unit/consistency/nginx-security-headers.test.js tests/unit/consistency/docker-images.test.js`。

### 3. 发布后（服务器/容器内）

```powershell
docker compose up -d
docker compose ps
docker compose logs -f backend          # 需 LOG_TO_CONSOLE=true
curl.exe -s -o NUL -w "%{http_code}`n" http://127.0.0.1:3000/api/health
cd backend; node scripts/deploy-selfcheck.js --base http://127.0.0.1:3000 --admin-pass '<管理员密码>'
```

`deploy-selfcheck.js` 覆盖：环境变量完整性 → 弱密钥 → MySQL/Redis/Mongo 连通与结构 → 存储可用性 → HTTP 健康检查 →（可选）管理员登录；**只读、不打印密钥明文、有 FAIL 则退出码 1**。

### 4. 启动闸门（会直接拒绝启动）

`backend/src/utils/startupConfigGuard.js`：弱密钥/占位值（`changeme`、`admin-secret-token-change-in-production` 一类）触发拒绝；`NON_WAIVABLE_CHECKS` 不可通过 waivers 豁免。启动失败先看这行，而不是先怀疑数据库。

- `ALLOW_INSECURE_CONFIG` 语义已从「一键跳过全部 8 道生产校验」改为**按项豁免**：`true/1/yes/y/on/all/*` 不再豁免任何项；只能显式写 `ALLOW_INSECURE_CONFIG=DB_PASSWORD`（逗号分隔可多项）。
- `CORS_ORIGIN` / `USE_MOCK_DB` / `RATE_LIMIT_DISABLED` **无豁免途径**，配错即拒绝启动。

### 5. 文档与清单

- `Sealos部署核对清单.md`：上线逐项核对。
- `backend/部署文档.md`、`backend/.env.production.example`、`.env.production.example`：变量真源。
- `人工与外部依赖验证清单.md`：需要真机/外网（短信、微信支付、TURN、COS）的部分，本地无法自动验证的写这里。

## Verification

```powershell
cd backend; npx jest tests/unit/consistency
cd backend; npx jest tests/unit/config/trustProxy.test.js tests/unit/config/envHygiene.test.js tests/unit/utils/startupConfigGuard.test.js
cd app; npx --yes pnpm@10.15.0 build:h5
cd admin-frontend; npm run build
```

- 证据 = 命令 + 退出码；无 docker 时明确写「编排未执行（本机无 docker），已做静态核对」。

## Pitfalls

- 只 `up -d` 没重新 build → 跑的还是旧镜像。
- 改了 `nginx/conf.d/*.conf` 忘了 `docker compose restart nginx`，或忘了同步 security-headers 一致性测试。
- 用 `localhost` 当 `TRUST_PROXY` 值、或直接写 `true` → 启动即失败。
- 在容器里跑 `npm run migrate` 前没备份；迁移不幂等的地方重复执行会报 Duplicate column。
- 忘了先构建 `dist/` 就发布 → nginx 挂空目录 → 白屏。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：部署自检员（只读+校验，不改配置）。仓库 C:\Users\admin\Desktop\kaifa。
环境：Windows PowerShell；node/npm 可用；docker 与 git 不可用 → 编排命令只能静态核对，写清「未执行」。
任务：① 核对 docker-compose*.yml 里所有 ${VAR:?} 键在 .env/.env.example 中的存在性（不回显值）；
② 检查 TRUST_PROXY / ALLOW_INSECURE_CONFIG / CORS_ORIGIN / USE_MOCK_DB / RATE_LIMIT_DISABLED 的当前写法是否合规；
③ 跑 cd backend; npx jest tests/unit/consistency；④ 跑两个前端 npm run build。
硬约束：禁止打印任何密钥/口令明文；不修改文件；不确定的项标注「未验证 + 原因」。
报告：每项 → 结论（通过/失败/未验证）→ 证据（命令、退出码、file:line）。
```
