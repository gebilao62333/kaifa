-- ============================================
-- 补充缺失列：使 DB 表结构与代码模型匹配
-- 执行时间: 2026-08-05
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- xn_game_order 补充列
-- ============================================

-- target_user_id
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='target_user_id') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `target_user_id` BIGINT COMMENT "陪玩师ID" AFTER `user_id`',
    'SELECT "SKIP: target_user_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- num
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='num') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `num` INT DEFAULT 1 COMMENT "数量/小时数" AFTER `price`',
    'SELECT "SKIP: num already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- total_price
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='total_price') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `total_price` DECIMAL(10, 2) DEFAULT 0 COMMENT "总价" AFTER `num`',
    'SELECT "SKIP: total_price already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- add_time
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='add_time') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `add_time` INT(10) DEFAULT 0 COMMENT "接单时间" AFTER `create_time`',
    'SELECT "SKIP: add_time already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user_time
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='user_time') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `user_time` INT(10) DEFAULT 0 COMMENT "用户确认完成时间" AFTER `end_time`',
    'SELECT "SKIP: user_time already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- star
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='star') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `star` DECIMAL(2, 1) DEFAULT NULL COMMENT "评分" AFTER `user_time`',
    'SELECT "SKIP: star already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- content
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='content') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `content` TEXT DEFAULT NULL COMMENT "评价内容" AFTER `star`',
    'SELECT "SKIP: content already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- status_zong
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='status_zong') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `status_zong` TINYINT(1) DEFAULT 0 COMMENT "总状态" AFTER `content`',
    'SELECT "SKIP: status_zong already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pingjia_status
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='pingjia_status') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `pingjia_status` TINYINT(1) DEFAULT 0 COMMENT "评价状态" AFTER `status_zong`',
    'SELECT "SKIP: pingjia_status already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pingjia_time
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='pingjia_time') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `pingjia_time` INT(10) DEFAULT 0 COMMENT "评价时间" AFTER `pingjia_status`',
    'SELECT "SKIP: pingjia_time already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- games_server_id
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='games_server_id') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `games_server_id` INT DEFAULT 0 COMMENT "游戏服务器ID" AFTER `pingjia_time`',
    'SELECT "SKIP: games_server_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- games_server_name
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='games_server_name') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `games_server_name` VARCHAR(50) DEFAULT NULL COMMENT "游戏服务器名" AFTER `games_server_id`',
    'SELECT "SKIP: games_server_name already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- game_role_id
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='game_role_id') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `game_role_id` VARCHAR(50) DEFAULT NULL COMMENT "游戏角色ID" AFTER `games_server_name`',
    'SELECT "SKIP: game_role_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- game_role_name
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='game_role_name') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `game_role_name` VARCHAR(50) DEFAULT NULL COMMENT "游戏角色名" AFTER `game_role_id`',
    'SELECT "SKIP: game_role_name already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- voice_url
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND COLUMN_NAME='voice_url') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD COLUMN `voice_url` VARCHAR(255) DEFAULT NULL COMMENT "语音URL" AFTER `game_role_name`',
    'SELECT "SKIP: voice_url already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- status 列类型修复已移至 fix_status_types.sql

-- 重建索引
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_game_order' AND INDEX_NAME='idx_target_user_id') = 0,
    'ALTER TABLE `eudazi`.`xn_game_order` ADD INDEX `idx_target_user_id` (`target_user_id`)',
    'SELECT "SKIP: idx_target_user_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- xn_gift_log 补充列
-- ============================================

-- user_id
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='user_id') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `user_id` BIGINT COMMENT "收礼者ID" AFTER `id`',
    'SELECT "SKIP: user_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user_nickname
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='user_nickname') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `user_nickname` VARCHAR(50) DEFAULT NULL COMMENT "收礼者昵称" AFTER `user_id`',
    'SELECT "SKIP: user_nickname already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user_avatar
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='user_avatar') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `user_avatar` VARCHAR(255) DEFAULT NULL COMMENT "收礼者头像" AFTER `user_nickname`',
    'SELECT "SKIP: user_avatar already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- song_user_id
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='song_user_id') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `song_user_id` BIGINT COMMENT "送礼者ID" AFTER `user_avatar`',
    'SELECT "SKIP: song_user_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- song_user_nickname
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='song_user_nickname') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `song_user_nickname` VARCHAR(50) DEFAULT NULL COMMENT "送礼者昵称" AFTER `song_user_id`',
    'SELECT "SKIP: song_user_nickname already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- song_user_avatar
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='song_user_avatar') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `song_user_avatar` VARCHAR(255) DEFAULT NULL COMMENT "送礼者头像" AFTER `song_user_nickname`',
    'SELECT "SKIP: song_user_avatar already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- gift_name
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='gift_name') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `gift_name` VARCHAR(50) DEFAULT NULL COMMENT "礼物名称" AFTER `gift_id`',
    'SELECT "SKIP: gift_name already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- gift_image
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='gift_image') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `gift_image` VARCHAR(255) DEFAULT NULL COMMENT "礼物图片" AFTER `gift_name`',
    'SELECT "SKIP: gift_image already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- totalmoney
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='totalmoney') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `totalmoney` DECIMAL(10, 2) DEFAULT 0 COMMENT "花费金额" AFTER `gift_image`',
    'SELECT "SKIP: totalmoney already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- currency
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND COLUMN_NAME='currency') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD COLUMN `currency` VARCHAR(10) DEFAULT "CNY" COMMENT "货币单位" AFTER `totalmoney`',
    'SELECT "SKIP: currency already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 重建索引
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND INDEX_NAME='idx_user_id') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD INDEX `idx_user_id` (`user_id`)',
    'SELECT "SKIP: idx_user_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_gift_log' AND INDEX_NAME='idx_song_user_id') = 0,
    'ALTER TABLE `eudazi`.`xn_gift_log` ADD INDEX `idx_song_user_id` (`song_user_id`)',
    'SELECT "SKIP: idx_song_user_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- xn_withdraw 补充列 & 类型修正
-- ============================================

-- money
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='money') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `money` DECIMAL(10, 2) DEFAULT 0 COMMENT "提现金额(兼容)" AFTER `amount`',
    'SELECT "SKIP: money already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pay_money
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='pay_money') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `pay_money` DECIMAL(10, 2) DEFAULT 0 COMMENT "实际到账金额" AFTER `money`',
    'SELECT "SKIP: pay_money already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- shouxufei
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='shouxufei') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `shouxufei` DECIMAL(10, 2) DEFAULT 0 COMMENT "手续费" AFTER `pay_money`',
    'SELECT "SKIP: shouxufei already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- bank
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='bank') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `bank` VARCHAR(255) DEFAULT NULL COMMENT "银行/收款账号" AFTER `type`',
    'SELECT "SKIP: bank already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- name
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='name') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `name` VARCHAR(50) DEFAULT NULL COMMENT "收款人姓名" AFTER `bank`',
    'SELECT "SKIP: name already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- mobile
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='mobile') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `mobile` VARCHAR(16) DEFAULT NULL COMMENT "手机号" AFTER `name`',
    'SELECT "SKIP: mobile already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- image
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='image') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `image` VARCHAR(255) DEFAULT NULL COMMENT "收款码图片" AFTER `mobile`',
    'SELECT "SKIP: image already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- is_check
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='is_check') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `is_check` TINYINT(1) DEFAULT 0 COMMENT "审核状态 0待审核 1通过 2拒绝" AFTER `status`',
    'SELECT "SKIP: is_check already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- state
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='state') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `state` VARCHAR(20) DEFAULT "pending" COMMENT "审批状态字串" AFTER `is_check`',
    'SELECT "SKIP: state already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- wx_ti_id
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='wx_ti_id') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `wx_ti_id` VARCHAR(50) DEFAULT NULL COMMENT "微信转账单号" AFTER `state`',
    'SELECT "SKIP: wx_ti_id already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- lailu
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='lailu') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `lailu` VARCHAR(20) DEFAULT "app" COMMENT "来源" AFTER `wx_ti_id`',
    'SELECT "SKIP: lailu already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- channel
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='channel') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `channel` VARCHAR(20) DEFAULT "gift" COMMENT "提现渠道 gift/wallet" AFTER `lailu`',
    'SELECT "SKIP: channel already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- currency
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND COLUMN_NAME='currency') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD COLUMN `currency` VARCHAR(10) DEFAULT "CNY" COMMENT "货币单位" AFTER `channel`',
    'SELECT "SKIP: currency already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- type 列类型修复已移至 fix_status_types.sql

-- 重建索引
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='eudazi' AND TABLE_NAME='xn_withdraw' AND INDEX_NAME='idx_is_check') = 0,
    'ALTER TABLE `eudazi`.`xn_withdraw` ADD INDEX `idx_is_check` (`is_check`)',
    'SELECT "SKIP: idx_is_check already exists" AS msg'
); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration completed successfully!' AS message;
