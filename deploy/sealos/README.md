# Sealos 部署指南（后端 + H5 + 管理后台）

> **2026-10-20 已按本文完成一次真实部署**（DevBox 发版 + App Launchpad + 托管数据库）：
> - 线上地址：`https://fazwhznenrqo.sealoshzh.site`
> - 部署记录 / 账号 / 已知限制 / 版本演进：`deploy/sealos/DEPLOYED-2026-10-20.md`（当前线上 `kaifa-app:v1.0.9`，2026-10-21）
> - 上线逐项核对（**唯一核对表**）：根目录 `Sealos部署核对清单.md`
> - 实测路径：DevBox（Node 18）→ 发版构建私有镜像 `hub.hzh.sealos.run/ns-5ios4t6b/kaifa-app` → 应用上线
> - 本文下面的 `Dockerfile.web` + 自建镜像仓库方案作为「不用 DevBox」的备选路径。

目标拓扑（全部在 Sealos 同一工作空间）：

```text
浏览器 / App
    │ HTTPS（Sealos 自动证书）
    ▼
eudazi-web（nginx 容器：H5 + /admin + 反代）
    │ 内网 http://<backend内网地址>:3000
    ▼
eudazi-backend（Node.js API，不暴露公网）
    ├── Sealos MySQL 8.0（eudazi 库）
    ├── Sealos MongoDB 6.0
    └── Sealos Redis 7
```

- 一个公网域名同时服务 H5、管理后台和 API：`https://你的域名`、`/admin`、`/api`、`/socket.io`、`/uploads`
- 后端只开内网，避免多一次公网暴露和 CORS
- App 打包时 `VITE_API_ORIGIN` 填同一个域名即可

---

## 0. 前置条件

- 能运行 Docker 的构建机（本机 Windows 需安装 Docker Desktop；也可以用云服务器/CI）
- Sealos 账号，进入目标「工作空间」
- 一个镜像仓库（任选）：
  - 阿里云 ACR：`registry.cn-hangzhou.aliyuncs.com/<命名空间>`
  - Docker Hub：`docker.io/<用户名>`（Sealos 支持代理拉取）
  - 其它支持 `docker login` 的仓库
- 可选：你自己的域名（不填就用 Sealos 分配的访问域名）

---

## 1. 构建并推送两个镜像

在仓库根目录执行（Windows）：

```powershell
docker login <你的仓库地址>

# 用脚本（推荐）
.\deploy\sealos\build-push.ps1 -Registry <仓库前缀> -Tag v1

# 或者手动
docker build -f Dockerfile     -t <仓库前缀>/eudazi-backend:v1 .
docker build -f Dockerfile.web -t <仓库前缀>/eudazi-web:v1 .
docker push <仓库前缀>/eudazi-backend:v1
docker push <仓库前缀>/eudazi-web:v1
```

产物说明：
- `eudazi-backend`：Node API + 迁移脚本 + `sql/` 初始化脚本 + `mysql` 客户端（方便在 Sealos 容器终端里初始化库）
- `eudazi-web`：新版 H5（app/）+ 管理后台（admin-frontend/）+ Nginx 反代

> 本机没有 Docker 时，把仓库打包到有 Docker 的机器上执行同样命令；不要在 Sealos 里手工拼前端静态文件。

---

## 2. 创建数据库（Sealos「数据库」）

同一工作空间创建 3 个实例，版本尽量与仓库验证版本一致：

| 类型 | 建议版本 | 说明 |
|---|---|---|
| MySQL | 8.0.x | 创建库名 `eudazi`；记录 host/port/user/password |
| MongoDB | 6.0.x | 记录完整连接串；库名 `eudazi` |
| Redis | 7.x | 记录 host/port/password |

创建后：
1. 在详情页复制「**内部连接地址**」（后端与数据库在同一平台，优先走内网）。
2. **不要开启公网访问**（除非你要在本地导入 SQL；导入完立刻关闭）。
3. 开启自动备份。

---

## 3. 部署后端（应用管理 → 创建应用）

| 配置项 | 填写 |
|---|---|
| 应用名称 | `eudazi-backend` |
| 镜像 | `<仓库前缀>/eudazi-backend:v1` |
| 部署模式/实例数 | 固定实例，1 个 |
| 资源 | 建议 1 vCPU / 1–2 GB（先小后调） |
| 端口 | 容器端口 `3000`；**不要开公网访问**（仅内网） |
| 存储卷 1 | 挂载路径 `/app/public/uploads`，容量 5–10 GB（本地存储上传文件） |
| 存储卷 2（可选） | `/var/log/eudazi`，1 GB |

### 环境变量

用 [backend.env.example](backend.env.example) 逐项粘贴，至少确认：

- `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME`：Sealos MySQL 内部地址（当前 `test-db1-mysql.ns-5ios4t6b.svc:3306`，db `eudazi`；应用账号见 `backend/.env`，不要用 root）
- `MONGO_URI`：Sealos Mongo 连接串（当前 host `test-db-mongodb.ns-5ios4t6b.svc:27017`，末尾确保是 `/eudazi?authSource=admin&directConnection=true`，密码含特殊字符要 URL 编码）
- `REDIS_HOST / REDIS_PORT / REDIS_PASSWORD`：当前 `test-db2-redis-redis.ns-5ios4t6b.svc:6379`（默认用户 `default`）
- `JWT_SECRET / ADMIN_JWT_SECRET / ADMIN_TOKEN / PII_ENCRYPTION_KEY`：每个都用下面命令生成 32 字节随机值
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `CORS_ORIGIN=https://<你的Web域名>`
- `TRUST_PROXY=loopback,10.0.0.0/8,172.16.0.0/12`（不要填 `true/*`）
- `STORAGE_PROVIDER=auto`（默认：配了 COS/七牛/OSS 就优先远端，未配置/失败回落本地；只想本地就写 `local`）
- `AUTO_MIGRATE=true`（迁移幂等；若需控制初始化窗口，可先 false，第 5 步再手工跑）
- `ADMIN_EMERGENCY_LOGIN=true` + `ADMIN_USERNAME/ADMIN_PASSWORD`（先用于创建正式管理员，完成后必须关掉）

> 说明：后端连不上库时进程仍可能起来，但 `/api/health` 会失败；先按日志确认数据库连接。

### 记录后端内网地址

后端创建成功后，在应用详情页复制「内部访问地址」（形如 `eudazi-backend.ns-xxxx:3000` 或 IP:3000），第 4 步要用。

---

## 4. 部署 Web（应用管理 → 创建应用）

| 配置项 | 填写 |
|---|---|
| 应用名称 | `eudazi-web` |
| 镜像 | `<仓库前缀>/eudazi-web:v1` |
| 实例数/资源 | 1 个，0.5 vCPU / 512 MB 起 |
| 端口 | 容器端口 `80` |
| 访问方式 | **https**（Web 页面 + API + WebSocket）；有自定义域名就填域名，没有用 Sealos 分配域名 |
| 环境变量 | `BACKEND_HOST`、`BACKEND_PORT`（第 3 步的内网地址拆开填） |

部署成功后打开 `https://<域名>/` 应看到 H5；`https://<域名>/admin` 是管理后台；`https://<域名>/api/health` 应返回 JSON。

> WebSocket：如果 H5 聊天连接不上，确认 Sealos 入口支持 `/socket.io/` 的 Upgrade（通常 https 入口支持；若控制台有 wss 选项，给它加一个 wss 端口映射再测）。

---

## 5. 初始化数据库（后端容器终端）

进入 `eudazi-backend` 应用 → 终端，执行（环境变量已在容器里）：

```bash
# 1) 基础表结构（空库执行一次；脚本是 CREATE TABLE IF NOT EXISTS）
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /app/sql/01_init_schema.sql

# 2) 初始数据（虚拟用户/标签/角色等；只能执行一次，别重复跑）
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /app/sql/02_init_data.sql

# 3) 迁移（幂等；16 个迁移文件全部接线（17 步））
# 宽列迁移（user_id/ip、实名字段）受 AUTO_MIGRATE_WIDEN_COLUMNS 控制：production 默认跳过；
# 新库初始化需要加宽时显式开启（会重建相关表，生产大表请放到维护窗口）：
AUTO_MIGRATE_WIDEN_COLUMNS=true node src/migrations/runMigrations.js
# 若不想在启动/初始化时重建大表，也可先跑常规迁移，维护窗口再单独执行：
# node src/migrations/20261003000002_widen_user_id_and_ip.js
# node src/migrations/20261004000002_widen_pii_columns.js

# 4) 自检（只读，不打印密钥）
node scripts/deploy-selfcheck.js --base http://127.0.0.1:3000
```

如果提示 `mysql: not found`，用 `mariadb` 命令替代（同一客户端）。

> 迁移后逐项核对 SQL（公告表 / 卡密列宽与密文比例 / 实名短列 / 手机号 hash 覆盖）与存量对账（T-3/T-4/T-5）已统一收在根目录 `Sealos部署核对清单.md` 的「二之二」「五之二」两节，这里不再重复。

### 创建正式管理员

1. 用 `ADMIN_EMERGENCY_LOGIN=true` 配置的账号登录 `https://<域名>/admin`
2. 在「管理员管理」创建正式管理员（超管角色）
3. 把后端环境变量 `ADMIN_EMERGENCY_LOGIN` 改成 `false`，重启后端
4. 用正式管理员登录，修改密码

> 种子 SQL 里的 `admin` 密码是占位哈希，无法直接登录，这是设计如此。

---

## 6. 上线核对

> **唯一上线核对表是根目录 `Sealos部署核对清单.md`**（含迁移后核对 SQL、存量对账、回滚关注点）；本节只保留部署当场的最小检查，扩展项以核对表为准。

```bash
# 健康检查
curl -s https://<域名>/api/health

# 管理端匿名访问必须 403
curl -s -o /dev/null -w '%{http_code}\n' https://<域名>/api/admin/users
```

- [ ] H5 首页/登录/广场/聊天/钱包/卡密/提现
- [ ] 旧链接 `/post-detail/1` 能跳到新页面
- [ ] `/admin` 登录、用户/订单/提现审核
- [ ] 上传一张图片，返回 URL 可直接访问（`/uploads/...`）
- [ ] 两个浏览器/两端 socket 实时消息、来电事件
- [ ] 后端日志无数据库连接错误、限流正常
- [ ] 数据库自动备份已开启

---

## 7. HBuilderX 自定义基座 / App

后端域名可用后再打基座：

1. 在仓库根目录执行脚本（它写入 `app/.env.production.local`，Vite 加载优先级高于 `.env.production`；打完基座用 `-Restore` 删除，避免影响 H5 构建与冒烟）：
   ```powershell
   .\deploy\sealos\prepare-app-build.ps1            # 默认写入线上域名 + VITE_USE_NATIVE_CALL=1
   # .\deploy\sealos\prepare-app-build.ps1 -ApiOrigin https://<你的域名>
   .\deploy\sealos\prepare-app-build.ps1 -Restore    # 基座打完执行，删除 .env.production.local
   ```
   脚本写入内容等价于：
   ```ini
   VITE_API_ORIGIN=https://<你的域名>
   VITE_SOCKET_URL=
   VITE_USE_NATIVE_CALL=1
   ```
2. HBuilderX 打开 `app/`，发行 → 原生App → 制作自定义调试基座
3. 编译报错先看 Kotlin/UTS（把日志发我）
4. 基座装到两台安卓机，先测登录/上传/通话/socket

> App 端 `uni.request` 用 `VITE_API_ORIGIN` 绝对地址；H5 同源部署时该值为空，不要混用同一次构建。

---

## 8. 回滚与备份

- 镜像用明确 tag（`v1.0.x`），回滚时在 Sealos 变更镜像 tag 即可
- 数据库先备份再迁移；本仓库迁移只有 `up`，没有自动回滚
- **上传目录在本仓库默认容器方案里没有挂持久化存储**：本次真实部署为规避卷 root 权限（EACCES）未挂本地存储卷，上传写容器 `/tmp`，**Pod 重建会丢文件**。要持久化：按第 3 步挂 `/app/public/uploads` PV（带 fsGroup），或改用 COS/OSS（`STORAGE_PROVIDER=cos`）。详见 `DEPLOYED-2026-10-20.md`「已知限制」
- **加密迁移后不能只回滚镜像**：`xn_user.mobile` 与 `xn_card.card_password` 已存密文，旧代码读不了会导致手机号登录/卡密异常，必须同时恢复数据库快照（见 `Sealos部署核对清单.md`「六、回滚」6.2）
- 旧 H5（`frontend/`）已于 2026-10-21 删除，仓库内不再有旧站产物；回滚改为回滚镜像 tag + 数据库快照，或临时从备份 `.e2e-run/legacy-frontend-backup-2026-10-21/dist` 部署（备份不入库，需另存）

---

## 9. 已知限制 / 注意

- `STORAGE_PROVIDER` 最终落到 `local` 时只能单实例；多实例要切 COS/OSS/七牛或共享存储
- Sealos 上**不建议自建 coturn**（需要固定公网 IP + UDP 端口段 + host 网络）；先用 STUN 验证，跨网通话再单独找台 VPS 跑 coturn，把 `TURN_URL/TURN_SECRET` 填到后端
- 短信/微信/支付宝/TRTC 密钥按需在后端环境变量补；未配置时相关功能不可用
- 管理员后台 CSP 是 `script-src 'self'`，前端不要新增内联脚本（H5 已把早期错误守卫拆成 `static/early-error-guard.js`）
- 生产不要用 `ALLOW_INSECURE_CONFIG=true`、`RATE_LIMIT_DISABLED=true`、`USE_MOCK_DB=true`

---

## 10. 需要你提供给我做验收的信息

- Web 域名（或 Sealos 分配域名）
- `/api/health` 返回内容
- 后端启动日志前 50 行（去掉密钥）
- 数据库初始化/迁移输出
- `node scripts/deploy-selfcheck.js` 输出
- HBuilderX 自定义基座编译报错（如有）

我拿到这些后可以继续帮你核对接口、修编译错误、跑真机联调清单。
