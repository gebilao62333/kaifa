---
name: kaifa-db-migration
description: "kaifa 迁移与 PII 安全：幂等写法、runMigrations 接线（16/16 文件、17 步；宽列迁移受 AUTO_MIGRATE_WIDEN_COLUMNS 控制）、备份先行、列加宽先于密钥、存量对账。"
whenToUse: "新增/修改表、字段、索引或枚举；执行迁移；动 PII_ENCRYPTION_KEY 与实名加密顺序时。"
tags: ["自习"]
---

# kaifa 数据库迁移安全

工作区根：`C:\Users\admin\Desktop\kaifa`（Sequelize + MySQL 8）。技术栈：`backend/src/migrations/` + `runMigrations.js`。

## When to Use

- 新增/修改表、字段、索引、列宽、枚举值。
- 要执行迁移、或排查「迁移没生效」。
- 涉及 `PII_ENCRYPTION_KEY`、`utils/pii.js`、实名数据加密。

## Procedure

### 1. 事实基线（先对齐，别凭记忆）

迁移文件共 **16 个**（时间戳命名，`runMigrations` 共 17 步——货币迁移含 `up`+`convertData` 两步），**全部幂等**，统一用原生 `sequelize.query` 查 `INFORMATION_SCHEMA`（**不是 Sequelize 的 `describeTable`**）：

| 类型 | 范式 | 代表 |
|---|---|---|
| 加列 | 查 `COLUMNS` → 过滤出 missing → 拼 `ALTER TABLE ... ADD COLUMN` | `20260824000000_add_virtual_user_online_columns.js:26-36` |
| 建表 | `CREATE TABLE IF NOT EXISTS` | `20261001000000_add_post_tag_album_fields.js:69` |
| 删表 | 查 `TABLES` 计数，不存在即 `continue` | `20261001000002_drop_legacy_tables.js:18-36` |
| 改类型/加宽 | 读 `DATA_TYPE`/`CHARACTER_MAXIMUM_LENGTH`，已达标即跳过 | `20261004000002_widen_pii_columns.js:40-52` |
| 索引 | 查 `STATISTICS` 按索引名判存在 | `20261003000001_add_red_packet_log_unique.js:27-37` |
| 数据转换/回填 | **只处理 NULL/空值/未回填行** | `20240101000000_add_currency_column.js:76`、`20261004000001_add_user_exp_and_backfill.js:11` |

⚠️ **两个关键机制（最容易被误判）**：

1. **`runMigrations.js` 已接线全部 16 个迁移文件（17 步）**，按时间戳顺序执行。其中两个宽列迁移——`20261003000002_widen_user_id_and_ip.js`、`20261004000002_widen_pii_columns.js`（PII 列加宽）——会触发表重建，受 **`AUTO_MIGRATE_WIDEN_COLUMNS`** 控制：未设置时非生产执行、**production 默认跳过**（需维护窗口显式 `true` 或手工 `node src/migrations/<file>.js`）。新增迁移必须同步接线。
2. `server.js:451-465` 自动迁移条件：`USE_MOCK_DB` 为真 → 跳过；`AUTO_MIGRATE` 缺省执行、`'false'` 关闭；**失败只 `console.error` 告警、不阻断启动**（30s 超时）。所以「服务起来了」≠「迁移跑过了」。

`runMigrations.js:56-64`：仅 `require.main === module`（直接 node 执行）时自动跑并 `process.exit`；被 `server.js` require 时只导出函数。

### 2. 备份先行（迁移基本没有回滚）

`backend/scripts/backup.js`：把 MySQL/Mongo/Redis dump 到 `BACKUP_DIR`（默认 `backend/backups/<YYYY-MM-DD_HH-mm-ss>/`，含 `mysql.sql` / `mongo.archive` / `redis.rdb` / `MANIFEST.txt`），默认保留 7 天；`--mode=docker|local`、`--target=mysql|mongo|redis|all`。

本机（**无 docker，必须 local**）：

```powershell
cd C:\Users\admin\Desktop\kaifa\backend
node scripts\backup.js --mode=local --target=mysql
```

### 3. PII 加密与执行顺序（本项目最贵的一次踩坑）

- 迁移 `20261004000002_widen_pii_columns.js` 只加宽 **`xn_user`** 的 4 列：`real_name` 50→**255**、`id_card` 18→**255**、`real_name_front` 255→**512**、`real_name_back` 255→**512**（`:21-26` 目标表，`:45` 已达标跳过，`:49-51` `MODIFY ... VARCHAR(N) NULL`）。
- ⚠️ **顺序硬约束：先跑该迁移，再配 `PII_ENCRYPTION_KEY`**——`backend/.env.example:43-48`、`backend/.env.production.example:41-46` 明确警告「顺序反了会把密文写进宽度不足的列而被截断」（不可逆）。
- `backend/src/utils/pii.js`：`isConfigured()`(:16)、`looksEncrypted(v)`(:23)、`encryptField(v)`(:28)、`decryptField(v)`(:45)。无密钥行为：**生产** `encryptField` 直接**抛错**拒绝明文存储；非生产返回明文 + 一次 `logger.warn`。`decryptField` 对非密文**原样返回**（兼容存量明文），是密文但无密钥 → warn + `''`。密文判据 `CIPHER_PATTERN=/^[0-9a-f]+$/` 且长度 ≥ `MIN_CIPHER_LENGTH=192`。
- `startupConfigGuard.js`：`PII_ENCRYPTION_KEY` 是**可豁免项**（`WAIVABLE_CHECKS:11`），必须在 `ALLOW_INSECURE_CONFIG` 里**逐项点名**才豁免（`true/all/*` 不豁免任何项）；`server.js:174` 把「未设置或弱值（`isWeakSecret(...,32)`）」列为**生产致命项**，非生产只告警。
- 本键**无轮换机制**：换键后历史密文不可解（遗留 B-9）。

### 4. 存量对账（只能人工 SQL，禁止擅自改写历史数据）

| 编号 | 表 | 对账口径 |
|---|---|---|
| T-3 | `xn_withdraw` | `is_check`(0 待审/1 通过/2 拒绝) 与 `status`、`channel`：旧口径「申请不扣款」的存量单在新逻辑驳回时会多退一笔 `money`（见 `kaifa-money-path`） |
| T-4 | `xn_red_packet_log` vs `xn_red_packet` | 按 `packet_id` 聚合 `SUM(amount)` 与 `total_amount` 比对，`>` 即历史超发 |
| T-5 | `xn_user_pref.data`（JSON `skinShop.owned`） | 核查改造前伪造进服务端的目录内所有权（装扮目录在代码 `utils/skinCatalog.js`，无表可 JOIN） |

### 5. 新增迁移步骤

1. 备份（§2）。
2. 写 `src/migrations/<YYYYMMDDHHmmss>_<snake>.js`，导出幂等 `up()`（照 §1 范式），必要时再导出 `down()` / `convertData()`。
3. **挂进 `src/migrations/runMigrations.js`**（`require` + 按序 `await`）——不接线就永远不执行。
4. 连跑两次验幂等。
5. 文档：`backend/数据库设计文档.md`（表/字段/索引/枚举）+ `backend/后端开发文档.md`（流程）+ `backend/部署文档.md`（若涉及上线顺序）→ 用 `kaifa-doc-sync`。

## Verification

```powershell
cd backend
node scripts\backup.js --mode=local --target=mysql
npm run migrate ; npm run migrate                     # 两次都必须成功
node src\migrations\20261004000002_widen_pii_columns.js ; node src\migrations\20261004000002_widen_pii_columns.js   # 未接线迁移单独跑两次
npx jest tests/unit/utils/startupConfigGuard.test.js tests/unit/config/envHygiene.test.js
```

幂等判据：第二次执行时所有 ALTER/CREATE 都被跳过、无 `error`。**「服务启动成功」不能作为迁移已执行的证据**，要回库查列。

## Pitfalls

- 迁移不幂等 → `Duplicate column` / `Duplicate key name`。
- 只写迁移文件不接线 → 自动迁移永不执行；而迁移失败**只告警**，极易误判成「已迁移」。
- 先配 `PII_ENCRYPTION_KEY` 再跑加宽迁移 → 密文截断，不可逆。
- 以为 `USE_MOCK_DB=true` 也会跑迁移（不会）。
- 用 `describeTable` 写新迁移：本仓范式是原生 `INFORMATION_SCHEMA` 查询，保持一致。
- 迁移里做全表数据改写（而非只处理 NULL/空值）→ 重复执行会污染数据。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：迁移安全审查员 / 迁移执行员。仓库 C:\Users\admin\Desktop\kaifa。
环境：Windows PowerShell（用 ; 不用 &&）；node/npm 可用；docker 不可用（backup 必须 --mode=local）。
任务：<新增/核对> 迁移 <文件名>。
硬约束：① up() 必须幂等——用原生 sequelize.query 查 INFORMATION_SCHEMA 判存在后跳过（加列查 COLUMNS、
建表 CREATE TABLE IF NOT EXISTS、索引查 STATISTICS、改列宽比 CHARACTER_MAXIMUM_LENGTH），数据转换只处理 NULL/空值；
② 必须把 require + await 追加进 src/migrations/runMigrations.js（16 个文件已全接线；宽列迁移走 AUTO_MIGRATE_WIDEN_COLUMNS 开关）；③ 执行前先 node scripts\backup.js --mode=local --target=mysql；
④ 涉及 xn_user 实名列加宽时，必须先跑迁移再配 PII_ENCRYPTION_KEY。
验证：npm run migrate 连跑两次（都成功）+ 回库确认列已存在（不能只看服务启动成功）。
报告：迁移文件与接线行号、两次执行输出摘要、库侧核对结果、未验证项及原因。
```
