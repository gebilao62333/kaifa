# Sealos 部署核对清单

> 本机无 Docker，编排仅做静态校验；以下为**你在 Sealos 上执行、我逐项核对**的清单。
> 生成时间：2026-10-03

---

## 一、准备环境变量（以 `.env.production.example` 为模板）

### 1. 必改（弱密钥）

| 变量 | 说明 |
|---|---|
| `JWT_SECRET` / `ADMIN_TOKEN` | 换强随机（`openssl rand -hex 24`）；轮换后已发令牌全部失效 |
| `DB_PASSWORD` / `REDIS_PASSWORD` / `MYSQL_ROOT_PASSWORD` / `MONGO_*` | 同样换强随机 |
| `CORS_ORIGIN` | 填真实域名（逗号分隔），**不要用 `*`** |
| `SERVER_URL` | 公网地址；不填微信支付回调会落到 `localhost`（当前不接微信支付，可暂不填） |

### 2. 存储（多家组合，逗号分隔按优先级）

```bash
STORAGE_PROVIDER=local            # 只用本地（当前默认，已实测可用）
# STORAGE_PROVIDER=cos,qiniu,oss,local   # 多家组合，未配置/失败自动降级
STORAGE_FALLBACK=true             # false = 链首失败直接报错，不降级
# COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION
# QINIU_ACCESS_KEY / QINIU_SECRET_KEY / QINIU_BUCKET / QINIU_DOMAIN
# OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET / OSS_REGION / OSS_ENDPOINT / OSS_DOMAIN
```
> 用本地存储时，**必须给 `backend/public/uploads` 挂持久卷**（compose 已挂 `./backend/public/uploads:/app/public/uploads`），否则重新部署会丢文件。

### 3. 音视频

```bash
# 方案一（推荐先做）：自建 TURN，随 compose 启动
TURN_REALM=eudazi
TURN_USERNAME=eudazi
TURN_PASSWORD=<强随机>
TURN_EXTERNAL_IP=<服务器公网IP>
# 前端构建期需要（三项齐全才会追加 TURN）
VITE_TURN_URL=turn:<公网IP>:3478
VITE_TURN_USERNAME=eudazi
VITE_TURN_CREDENTIAL=<同上>

# 方案二：腾讯 TRTC（配了就用 TRTC，否则自动走 WebRTC）
TRTC_APP_ID=
TRTC_SECRET_KEY=
VITE_SDK_APP_ID=
```

### 4. 其它

```bash
LLM_ENABLED=true
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
LLM_API_KEY=<你的 DeepSeek Key>
LOGS_PATH=/var/log/eudazi        # 与 compose 的 eudazi_logs 卷一致
```

---

## 二、数据库

1. **先备份**（Sealos 控制台或 `mysqldump`）。
2. 执行迁移（幂等，可重复跑）：
   ```bash
   cd backend && node src/migrations/runMigrations.js
   ```
   其中已包含：货币单位、虚拟人在线调度、帖子标签相册、交互修复字段、删遗留表、红包唯一约束、**密卡 card_key**。
3. 若指向**全新空库**，先导入 `backend/sql/01_init_schema.sql`（已含 `xn_card.card_key` 与唯一索引）。
4. 手动迁移（历史上仅对当前云库执行过，新库需跑）：
   ```bash
   node src/migrations/20261003000002_widen_user_id_and_ip.js
   ```
5. **核对点**（我可以给你 SQL 一键核对）：
   - 表数量 43、`xn_card.card_key` 存在且有唯一索引
   - 关键列类型：`xn_post.user_id` 等 12 列为 BIGINT；`xn_user.ip`/`xn_admin.last_login_ip` 为 VARCHAR(45)

---

## 三、构建前端（VITE_* 是构建期注入，改 .env 必须重新构建）

```bash
cd frontend && npm ci && npm run build
cd ../admin-frontend && npm ci && npm run build
```
> 产物体积参考：前端主包 ~146KB（gzip ~47KB）+ china-streets 308KB（按需）；管理端主包 ~100KB。

---

## 四、启动编排

```bash
docker compose up -d                 # 基础 6 服务：nginx/backend/mysql/mongo/redis/certbot
docker compose --profile turn up -d  # 需要 TURN 时追加 coturn
```
- `coturn` 使用 `network_mode: host`，需放行 **3478/udp+tcp** 与 **49160-49200/udp**
- TLS 证书：`nginx/ssl/fullchain.pem` 当前是自签（CN=localhost），生产需替换为正式证书

---

## 五、启动后核对（我按此逐项验收）

| # | 检查项 | 期望 |
|---|---|---|
| 1 | `GET /api/health` | 200，`mysql/mongo/redis` 均 `up` |
| 2 | 启动日志 | 27 个路由模块全加载；「通话单清理器已启动」 |
| 3 | 前端首页 | 200，静态资源可加载 |
| 4 | 管理后台登录 | `admin` / 见下方密码说明 |
| 5 | 权限边界 | 受限角色访问越权接口返回 403 |
| 6 | 上传 | 传一张图 → 返回 URL → 该 URL 可访问 |
| 7 | 通话 | 双端 WebRTC 接通（对称 NAT 场景需 TURN 生效） |
| 8 | 日志 | `docker compose logs` 有输出；`/var/log/eudazi` 有 combined.log |

> **管理员密码**：本机已重置为 `Admin@Test2026`（用于权限验证）。**上线前请立即用管理后台「修改密码」改掉**，或直接用 `ADMIN_TOKEN` 登录。

---

## 六、回滚

1. 保留上一个前端 `dist` 与后端镜像 tag
2. 数据库改结构前先 `mysqldump`；本次迁移全部**只增列/放宽类型**，无删列，回滚风险低
3. `xn_card.card_key` 为新增列，回滚只需 `ALTER TABLE xn_card DROP INDEX uk_card_key, DROP COLUMN card_key`
---

## 七、随包提供的验证工具（部署后直接跑）

### 1. 部署自检（容器/宿主机内）
```bash
cd backend
node scripts/deploy-selfcheck.js                       # 只做只读检查
node scripts/deploy-selfcheck.js --admin-pass 'xxx'    # 附带管理员登录校验
```
覆盖：必需环境变量 → 弱密钥 → MySQL 连接/表数量/`xn_card.card_key`/`xn_user.ip` 类型 → Redis/Mongo → 存储 provider 链与上传目录可写 → `/api/health` 依赖 → 管理接口匿名必须 403 → 管理员登录。
**退出码非 0 表示有 FAIL**，可挂进 CI/启动探针。不会打印任何密钥明文。

### 2. TURN / STUN 连通性
```bash
# 纯 Node：确认 STUN 可达并看清自己的公网出口（判断是否在 NAT 后）
cd backend && node scripts/check-turn.js
# 指定服务器
node scripts/check-turn.js --stun stun.l.google.com:19302
```
```bash
# 真实浏览器：权威判定 TURN 是否真的能分配中继候选（出现 typ relay 即可用）
node .e2e-run/check-turn.js --url turn:<公网IP>:3478 --user eudazi --pass '<密码>'
```
> 已验证：本机在 NAT 后（出口 IP ≠ 192.168.8.8），纯 STUN 只能拿到 `srflx` 候选；加公共 TURN 测试服仍无 `relay`（该公共服务凭据已失效）。换成你自己的 coturn 后，这条命令应输出 `relay` 并退出码 0。
