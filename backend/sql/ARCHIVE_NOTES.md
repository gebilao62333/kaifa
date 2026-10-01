# SQL 脚本归档说明（2026-08-24 从项目根目录迁入）

> **✅ 2026-10-01 结构统一**：`init_schema.sql` 已重写为**唯一权威**的建表脚本，逐字段对齐 `src/models/mysql/*.js` 的
> Sequelize 模型（项目未调用 `sequelize.sync()`，DB 结构只以本文件为准）。同时**删除**了两个互相矛盾的历史脚本：
> - `fix_schema.sql`：内容陈旧且与现有模型冲突（如把 `xn_virtual_user` 重构成 `virtual_user`、用 camelCase 字段），会破坏数据；
> - `fix_missing_tables.sql`：与 `init_schema.sql` 重复定义多张表且字段不一致。
>
> 两者中仍然有效的差异（如 `xn_game.image/image_bg`、`xn_reserve`/`xn_reserve_slot`/`xn_game_order` 的正确结构、
> 以及 5 张缺失表 `xn_expense_record`/`xn_income_record`/`xn_media_asset`/`xn_splash_screen`/`xn_system_settings`）
> 已全部并入 `init_schema.sql`，不再需要单独执行。

> ⚠️ 以下脚本原本散落在项目根目录，执行状态**未确认**。重复执行部分脚本会覆盖数据（如 fix_passwords.sql 会把 id≤5 的用户密码重置为同一哈希）。请对照下方清单逐一确认后再决定是否在生产库执行。
>
> **✅ 2026-08-24 本地 Docker 环境抽查结果**：xn_user 表中用户 2-4 的昵称（玩家小美/新手玩家/游戏爱好者）与 fix_charset.sql 内容一致，说明该脚本**已执行过**，无需重复执行；用户 1 昵称为 "Upd"（与脚本预期"游戏达人小王"不符，可能被后续操作修改过）。其余脚本仍需在目标环境逐个确认。

## 根目录迁入的脚本（9 个）

| 脚本 | 用途 | 风险 / 执行建议 |
|---|---|---|
| check-tables.sql | 检查表结构（SHOW TABLES / DESCRIBE） | 只读，可安全重复执行 |
| fix_charset.sql | 修复用户 1-5 的中文乱码（昵称/城市/签名） | 覆盖式更新，确认线上昵称无变化后无需再执行 |
| fix_users_6_13.sql | 批量修改用户 6-13 的昵称和城市 | 覆盖式更新，同上 |
| fix_avatar.sql | 重置用户 1 的头像为占位图 | 低风险 |
| fix_all_charset.sql | 全量重写 xn_post / 评论 / 聊天记录等演示数据内容 | ⚠️ 高风险：会覆盖全部帖子/评论内容，生产库严禁重复执行 |
| repair_charset_data.sql | 字符集修复总脚本（含使用方式说明，见文件头注释） | 执行前先看文件头说明 |
| fix_passwords.sql | 将 id≤5 用户密码重置为同一 bcrypt 哈希 | ⚠️ 高风险：重复执行会重置管理员密码 |
| migrate-admin.sql | 管理后台表结构迁移（补齐 Sequelize 模型与 DB 的差异字段） | 幂等性未确认，执行前先备份 |
| migrate2.sql | 重建 xn_system_settings 表（DROP + CREATE） | ⚠️ 高风险：DROP TABLE，会丢失现有配置数据 |

## 原有脚本（12 个，未变动）

fix_columns.sql、fix_companion_profile.sql、fix_status_types.sql、init_data.sql、init_schema.sql、init_settings.sql、init_system_settings.sql、migrate_companion_profile.sql、test_data.sql、alter_virtual_chat_history_user_isolation.sql、alter_virtual_user_random_online.sql、init_admin_system.sql。

> 已删除：seed_demo.sql（早期）、fix_missing_tables.sql、fix_schema.sql（2026-10-01，内容已并入 init_schema.sql）。
>
> 仍可能与 `init_schema.sql` 存在重叠、需单独决策的脚本（本次未改动）：
> fix_columns.sql、migrate-admin.sql、migrate2.sql、migrate_companion_profile.sql、init_settings.sql、
> init_system_settings.sql、init_admin_system.sql、fix_companion_profile.sql、fix_status_types.sql、test_data.sql、
> alter_virtual_chat_history_user_isolation.sql、alter_virtual_user_random_online.sql、以及各字符集修复脚本。

## ✅ 2026-10-01 归档处理

上表中"需单独决策"的脚本已**全部移入 `archive/` 子目录**，`sql/` 根目录现在只保留：

- `init_schema.sql` —— 唯一权威建表脚本（43 张表，与 Sequelize 模型逐列对齐）
- `init_data.sql` —— 初始化数据（字段与 init_schema 一致）
- `check-tables.sql` —— 只读表结构检查
- `fix_passwords.sql` —— 未纳入版本库（高风险，需人工确认）

`archive/` 内脚本（17 个）：`migrate2.sql`、`migrate-admin.sql`、`fix_columns.sql`、`fix_companion_profile.sql`、`migrate_companion_profile.sql`、`fix_status_types.sql`、`fix_charset.sql`、`fix_all_charset.sql`、`repair_charset_data.sql`、`fix_users_6_13.sql`、`fix_avatar.sql`、`init_settings.sql`、`init_system_settings.sql`、`init_admin_system.sql`、`test_data.sql`、`alter_virtual_chat_history_user_isolation.sql`、`alter_virtual_user_random_online.sql`

> **⚠️ 请勿直接在生产库执行 `archive/` 中的脚本**：其中 `migrate2.sql` 会 `DROP TABLE xn_system_settings`，字符集类脚本为覆盖式 UPDATE，`fix_columns.sql` 与模型可能存在二次漂移。若某环境历史库结构落后，请先用 `check-tables.sql` 比对实际结构，再手工 ALTER。

## 首次部署

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS eudazi_peer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p --default-character-set=utf8mb4 eudazi_peer < init_schema.sql
mysql -u root -p --default-character-set=utf8mb4 eudazi_peer < init_data.sql
```

> 注意：后端**不调用 `sequelize.sync()`**，修改模型后必须同步更新 `init_schema.sql`。

## 确认现有库执行状态的方法

在数据库可连接的环境（Sealos 云端容器）执行：

```bash
# 只读检查，确认数据当前状态
mysql -u root -p --default-character-set=utf8mb4 eudazi < check-tables.sql
```

或对照关键数据判断：若用户 1-5 的昵称已是"游戏达人小王/玩家小美/…"且中文无乱码，说明 fix_charset.sql 已生效，无需重复执行。
