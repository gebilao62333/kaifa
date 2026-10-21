# Sealos 部署核对清单

> **本清单是本仓库唯一的上线核对表**：前置检查 → 迁移 → 迁移后核对 SQL → 功能冒烟 → 存量对账 → 回滚。
> 从零搭建步骤见 `deploy/sealos/README.md`；部署事实与版本演进见 `deploy/sealos/DEPLOYED-2026-10-20.md`。
> 原《上线迁移与核对清单-2026-10-20》的迁移后核对 SQL、存量对账结果、回滚关注点与执行记录已并入本清单与 DEPLOYED，**该文件归档留痕**。

> **2026-10-20 更新**：Sealos 公有云推荐走「应用管理 + 托管数据库」方式，仓库已提供完整产物与步骤：
> - 指南：`deploy/sealos/README.md`
> - Web 镜像：`Dockerfile.web`（H5 + 管理后台 + Nginx）
> - 后端镜像：`Dockerfile`（已内置 mysql 客户端 / 迁移脚本 / 初始化 SQL）
> - 环境变量模板：`deploy/sealos/backend.env.example`
> - 构建推送：`deploy/sealos/build-push.ps1`
>
> 下文是基于 docker-compose 的旧核对口径，仍适用于「整机/Docker Compose」部署；Sealos 公有云请以新指南为准。
>
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
| `NODE_ENV` | **生产必须 `production`**：非 production 时换号/登录等接口会在测试模式下回传验证码，存在账号接管风险 |
| `SMS_TEST_MODE` / `SMS_TEST_PHONES` | 上线必须关闭（或只保留内测白名单并确保不会长期开放）；开启时验证码会回传前端 |

> **v1.0.12 发版新增迁移**：`20261021120000_add_companion_apply_fields.js`（xn_companion_profile 5 列）。上线前先 `node scripts/backup.js --mode=local --target=mysql` 备份，再执行 `npm run migrate` 并连跑两次验幂等；迁移失败只告警不阻断启动，必须回库确认列已存在。

### 2. 存储（多家组合，逗号分隔按优先级）

```bash
STORAGE_PROVIDER=auto             # 默认：配了 COS/七牛/OSS 就优先远端（cos→qiniu→oss），未配置/失败回落本地
# STORAGE_PROVIDER=local           # 强制只用本地（当前线上未接远端时用这个）
# STORAGE_PROVIDER=cos,qiniu,oss,local   # 显式指定优先级链
# 远端 SDK 已内置（cos-nodejs-sdk-v5 / ali-oss / qiniu），配齐任一家即可；
# 七牛必须配 QINIU_DOMAIN、OSS 必须配 OSS_ENDPOINT 或 OSS_DOMAIN，否则返回的是相对 key、图片打不开
# COS 桶按常规：权限「公有读私有写」+ CORS 放行站点域名（直传用）

STORAGE_FALLBACK=true             # false = 链首失败直接报错，不降级
# COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION
# QINIU_ACCESS_KEY / QINIU_SECRET_KEY / QINIU_BUCKET / QINIU_DOMAIN
# OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET / OSS_REGION / OSS_ENDPOINT / OSS_DOMAIN
```
> 用本地存储时，**必须给 `backend/public/uploads` 挂持久化存储（PV）**（compose 已挂 `./backend/public/uploads:/app/public/uploads`），否则重新部署会丢文件。

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
   其中已包含 18 步（新增 `20261021120000_add_companion_apply_fields.js`：xn_companion_profile 的 5 个入驻字段 + approve_time/reject_reason）：货币单位、虚拟人在线调度、帖子标签相册、交互修复字段、删遗留表、红包唯一约束、**宽列修正（第 8/11 步，受 `AUTO_MIGRATE_WIDEN_COLUMNS` 控制、生产默认跳过）**、**密卡 card_key**、**聊天到期撤回 `xn_chat_log.expire_at`**（第 12 步）、**已读自动销毁**（第 13 步）、**公告/卡密密文/实名回填/手机号加密**（第 14~17 步）。
3. 若指向**全新空库**，先导入 `backend/sql/01_init_schema.sql`（已含 `xn_card.card_key` 与唯一索引）。
4. 宽列迁移（已接线，但 production 默认跳过）：新库初始化时用 `AUTO_MIGRATE_WIDEN_COLUMNS=true node src/migrations/runMigrations.js`，或维护窗口单独执行：
   ```bash
   node src/migrations/20261003000002_widen_user_id_and_ip.js
   node src/migrations/20261004000002_widen_pii_columns.js
   ```
5. **核对点**（可直接执行的 SQL 见下方「二之二」）：
   - **线上表数量 44**：`backend/sql/01_init_schema.sql` 建 **43 张**（不含 `xn_notice`），`xn_notice` 由迁移 `20261020000000` 新建后为 **44**；`xn_card.card_key` 存在且有唯一索引
   - 关键列类型：`xn_post.user_id` 等 12 列为 BIGINT；`xn_user.ip`/`xn_admin.last_login_ip` 为 VARCHAR(45)
   - 聊天自动撤回：`xn_chat_log.expire_at` 存在（INT，默认 0）且索引 `idx_chat_log_expire` 存在 —— **这一列缺失会导致聊天接口 500，必须核对**
   - 聊天已读销毁：`xn_chat_log.read_at` / `destroy_at` / `destroyed_at` 存在（INT，默认 0）且索引 `idx_chat_log_destroy` 存在 —— **缺列同样导致聊天接口 500**

---

## 二之二、迁移后核对 SQL（只读；2026-10-20 自《上线迁移与核对清单》并入）

```sql
-- 1) 公告表
SHOW TABLES LIKE 'xn_notice';
SELECT COUNT(*) AS notice_count FROM xn_notice;

-- 2) 卡密密码：列宽与密文比例（应无 CHAR_LENGTH<=50 的“疑似明文”）
SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='xn_card' AND COLUMN_NAME='card_password';
SELECT SUM(CHAR_LENGTH(card_password) > 50) AS encrypted, SUM(CHAR_LENGTH(card_password) <= 50) AS plain_like
  FROM xn_card WHERE card_password IS NOT NULL AND card_password <> '';

-- 3) 实名回填：仍“短于密文形态”的行数（应逐项为 0 或有明确告警）
SELECT SUM(CHAR_LENGTH(real_name) BETWEEN 1 AND 191) AS short_real_name,
       SUM(CHAR_LENGTH(id_card) BETWEEN 1 AND 191) AS short_id_card
  FROM xn_user WHERE COALESCE(real_name,'') <> '' OR COALESCE(id_card,'') <> '';

-- 4) 手机号：列宽/索引/hash 覆盖
SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='xn_user' AND COLUMN_NAME='mobile';
SHOW INDEX FROM xn_user WHERE Key_name IN ('uk_user_mobile_hash','idx_user_mobile_hash');
SELECT SUM(COALESCE(mobile,'') <> '') AS with_mobile,
       SUM(COALESCE(mobile_hash,'') <> '') AS with_hash,
       SUM(COALESCE(mobile,'') <> '' AND COALESCE(mobile_hash,'') = '') AS missing_hash
  FROM xn_user;
```

期望：`missing_hash = 0`；若有残留（例如历史重复号跳过），按日志修复后重跑迁移（幂等）。

---

## 三、构建前端（VITE_* 是构建期注入，改 .env 必须重新构建）

```bash
# 用户端 H5（uni-app，线上在用）：产物 app/dist/build/h5
cd app && npx --yes pnpm@10.15.0 install && npx --yes pnpm@10.15.0 build:h5
# 管理后台：产物 admin-frontend/dist
cd ../admin-frontend && npm ci && npm run build
```
> 产物体积参考：管理端主包 ~100KB；用户端 H5 产物整体约 4MB（含按需 chunk）。
> **2026-10-20 起线上 H5 = `app/dist/build/h5`（uni-app 产物）**，由 DevBox 发版打进 `kaifa-app` 镜像。
> **2026-10-21 旧站 `frontend/` 已删除**：`docker-compose.yml` 的 nginx 站点根已改挂 `./app/dist/build/h5`；旧站回滚依赖备份 `.e2e-run/legacy-frontend-backup-2026-10-21/dist`（不入库，需另存）。
> **2026-10-21 已发版到 `kaifa-app:v1.0.11`**：v1.0.8 重建本批 H5/管理端 → v1.0.9 修复 services 桶导出导致的 `/api/user/pref`、`/api/user/skins` 500 → v1.0.11 加入存储 `auto`（COS/七牛/OSS 优先、未配置回落本地）与三家 SDK。**发版前务必先瘦身 DevBox（删 `app/node_modules`、`admin-frontend/node_modules`、旧站与缓存，只留前端 dist + `backend/node_modules`）**——v1.0.10 因项目 733M 导致发布失败、镜像未产出、线上 503，瘦身到 256M 后 v1.0.11 发布成功。后续发版仍按 `cd app && npx --yes pnpm@10.15.0 build:h5` + 管理端 `npm ci && npm run build`，再按 `deploy/sealos/README.md` 打 tag；构建期风险清单与改动范围见《前端功能差异清单》§11.8。

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

> **管理员密码**：以部署时实际设置并另行保存的密码为准（部署记录不写明文）；**不要把本机测试口令写回文档或线上**。本次上线后已关闭应急登录（`ADMIN_EMERGENCY_LOGIN=false`）、管理员改用数据库强密码，部署完成后应立即用管理后台「修改密码」再轮换一次。

---

## 五之二、存量对账（T-3/T-4/T-5，只读 SQL + 2026-10-20 实测结果）

```sql
-- T-3 提现存量：上线前 is_check=0 的 wallet 单在新逻辑下驳回会多退一笔，需核对
SELECT COUNT(*) AS pending_wallet, SUM(money) AS pending_money
  FROM xn_withdraw WHERE is_check = 0 AND channel = 'wallet';

-- T-4 红包历史：是否存在“累计领取额 > 红包总额”的异常包
SELECT p.packet_no, p.total_amount,
       COALESCE(SUM(l.amount),0) AS received_total
  FROM xn_red_packet p LEFT JOIN xn_red_packet_log l ON l.packet_id = p.id
 GROUP BY p.id HAVING received_total > p.total_amount + 0.001;

-- T-5 装扮越权数据：xn_user_pref.data.skinShop 中可能含改造前客户端伪造的 owned（只读清点）
SELECT COUNT(*) AS users_with_skin_state
  FROM xn_user_pref WHERE data LIKE '%"skinShop"%';
```

> 以上三项**只读**；需要改数据时另开维护窗口，逐条按《部署文档》口径处理，不在发布脚本里自动执行。

**2026-10-20 实测结果**（Sealos 控制台 → test-db1 → 数据管理 SQL 控制台，只读执行；按要求未做备份）：

| 项 | SQL 结果 | 结论 |
|---|---|---|
| **T-3 提现存量** | `is_check=0 AND channel='wallet'` 共 **34 笔，合计 ¥3383.00**；JOIN `xn_user` 后 34 笔**全部属于 `seed_user_001`~`seed_user_100`（测试用户）** | **无真实资金风险**。是 2026-10-19 种子脚本生成的测试提现单；清理种子数据时一并删除即可（`seed-test-data.js` 按 `seed_user_%` 清理） |
| **T-4 红包超发** | 聚合 `SUM(log.amount) > total_amount + 0.001` 查询 **0 行** | **无历史超发**，T-4 关闭 |
| **T-5 装扮越权** | `xn_user_pref.data LIKE '%"skinShop"%'` 计数 = **0** | **无伪造/越权装扮数据**，T-5 关闭 |

> 注：T-3 的 34 笔测试单仍会出现在管理端「提现审核」列表；运营若误点「驳回」，新逻辑会退款给这些测试账号（测试环境无实际资金影响）。要清空可执行种子数据清理脚本，或手工标记为已处理。

---

## 六、回滚

### 6.1 镜像/结构类回滚（compose 口径）

1. 保留上一个前端 `dist` 与后端镜像 tag
2. 数据库改结构前先 `mysqldump`
3. `xn_card.card_key` 为新增列，回滚只需 `ALTER TABLE xn_card DROP INDEX uk_card_key, DROP COLUMN card_key`

### 6.2 加密迁移后的回滚硬约束（2026-10-20 补；覆盖"只增列/风险低"的旧口径）

> 第 14~17 步（公告 / 卡密密码 / 实名回填 / 手机号加密）上线后，**"只增列、放宽类型、回滚风险低"的旧结论不再成立**：
>
> 1. 迁移**不做自动回滚**（公告 / 加密迁移均无 `down` 自动接线）
> 2. `xn_user.mobile`、`xn_card.card_password`、`xn_user` 实名四列已是密文：**旧版本后端读不了** → 手机号登录失败、卡密视图/充值把密文当明文
> 3. 「按手机号精确搜索」依赖 `mobile_hash` 盲索引，旧代码没有该逻辑
> 4. 因此回滚 = 回滚镜像 **+ 恢复数据库快照**，缺一不可
> 5. 本次 v1.0.6 迁移**未做 SQL 全量备份**（Pod 无 mysqldump、当时未建备份中心快照）→ **先补开并验证自动备份，再谈回滚**（事实见 `deploy/sealos/DEPLOYED-2026-10-20.md`「版本演进与执行记录」）

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
