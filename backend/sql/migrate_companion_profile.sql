-- ============================================================================
-- 陪玩师资料表 Schema 迁移
-- 问题: init_schema.sql 使用了旧字段名 (game_ids, skill_level, price_per_hour)
--       但 Sequelize 模型使用新字段名 (game_id, price, tags, voice_intro 等)
-- 此脚本将旧表结构迁移为新结构，保留现有数据
-- ============================================================================

USE eudazi_peer;

-- 1. 检查旧字段是否存在，若存在则迁移
SET @col_game_ids = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'game_ids');
SET @col_skill_level = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'skill_level');
SET @col_price_per_hour = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'price_per_hour');
SET @col_intro = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'intro');
SET @col_online_status = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'online_status');

-- 2. 检查新字段是否已存在
SET @col_game_id = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'game_id');
SET @col_price = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'price');
SET @col_tags = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'tags');
SET @col_voice_intro = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'voice_intro');

-- 3. 仅当旧字段存在且新字段不存在时才执行迁移
SELECT '检查表结构...' AS status;
SELECT @col_game_ids AS old_game_ids, @col_game_id AS new_game_id, 
       @col_price_per_hour AS old_price, @col_price AS new_price;

-- 4. 添加缺失的新字段
-- game_id: 从 game_ids TEXT 转为 game_id INTEGER，取第一个数字
SELECT IF(@col_game_id = 0, '需要添加 game_id', 'game_id 已存在') AS action;
SET @sql_add_game_id = IF(@col_game_id = 0, 
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `game_id` INTEGER DEFAULT 0 AFTER `user_id`', 
  'SELECT "game_id 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_game_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- price: 从 price_per_hour 迁移
SELECT IF(@col_price = 0, '需要添加 price', 'price 已存在') AS action;
SET @sql_add_price = IF(@col_price = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `price` DECIMAL(10,2) DEFAULT 0 AFTER `game_id`',
  'SELECT "price 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_price; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tags
SELECT IF(@col_tags = 0, '需要添加 tags', 'tags 已存在') AS action;
SET @sql_add_tags = IF(@col_tags = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `tags` VARCHAR(255) DEFAULT NULL AFTER `price`',
  'SELECT "tags 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_tags; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- voice_intro
SELECT IF(@col_voice_intro = 0, '需要添加 voice_intro', 'voice_intro 已存在') AS action;
SET @sql_add_voice = IF(@col_voice_intro = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `voice_intro` VARCHAR(255) DEFAULT NULL AFTER `tags`',
  'SELECT "voice_intro 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_voice; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- voice_time
SET @col_voice_time = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'voice_time');
SET @sql_add_voice_time = IF(@col_voice_time = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `voice_time` INTEGER DEFAULT 0 AFTER `voice_intro`',
  'SELECT "voice_time 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_voice_time; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_num
SET @col_order_num = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'order_num');
SET @sql_add_order_num = IF(@col_order_num = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `order_num` INTEGER DEFAULT 0 AFTER `voice_time`',
  'SELECT "order_num 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_order_num; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- income_total
SET @col_income_total = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'income_total');
SET @sql_add_income = IF(@col_income_total = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `income_total` DECIMAL(12,2) DEFAULT 0 AFTER `order_num`',
  'SELECT "income_total 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_income; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pingjia_num
SET @col_pingjia_num = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'pingjia_num');
SET @sql_add_pingjia = IF(@col_pingjia_num = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `pingjia_num` INTEGER DEFAULT 0 AFTER `income_total`',
  'SELECT "pingjia_num 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_pingjia; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- star
SET @col_star = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND COLUMN_NAME = 'star');
SET @sql_add_star = IF(@col_star = 0,
  'ALTER TABLE `xn_companion_profile` ADD COLUMN `star` DECIMAL(3,2) DEFAULT 5.00 AFTER `pingjia_num`',
  'SELECT "star 已存在，跳过" AS info');
PREPARE stmt FROM @sql_add_star; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. 从旧字段迁移数据到新字段 (仅当旧字段存在时)
-- game_id: 从 game_ids TEXT 尝试提取第一个数字
SELECT IF(@col_game_ids > 0 AND @col_game_id = 0, '迁移 game_ids -> game_id', '跳过 game_id 数据迁移') AS migration;
SET @sql_migrate_game = IF(@col_game_ids > 0,
  'UPDATE `xn_companion_profile` SET `game_id` = CAST(SUBSTRING_INDEX(`game_ids`, '','', 1) AS UNSIGNED) WHERE `game_ids` IS NOT NULL AND `game_ids` != ''''',
  'SELECT "无需迁移 game_id" AS info');
PREPARE stmt FROM @sql_migrate_game; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- price: 从 price_per_hour 迁移
SELECT IF(@col_price_per_hour > 0 AND @col_price = 0, '迁移 price_per_hour -> price', '跳过 price 数据迁移') AS migration;
SET @sql_migrate_price = IF(@col_price_per_hour > 0,
  'UPDATE `xn_companion_profile` SET `price` = `price_per_hour` WHERE `price_per_hour` IS NOT NULL',
  'SELECT "无需迁移 price" AS info');
PREPARE stmt FROM @sql_migrate_price; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tags: 从 intro 迁移 (intro 作为标签使用)
SELECT IF(@col_intro > 0 AND @col_tags = 0, '迁移 intro -> tags', '跳过 tags 数据迁移') AS migration;
SET @sql_migrate_tags = IF(@col_intro > 0,
  'UPDATE `xn_companion_profile` SET `tags` = `intro` WHERE `intro` IS NOT NULL AND `intro` != ''''',
  'SELECT "无需迁移 tags" AS info');
PREPARE stmt FROM @sql_migrate_tags; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. 添加缺失的索引
SET @idx_game_status = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND INDEX_NAME = 'idx_game_status');
SET @sql_add_idx1 = IF(@idx_game_status = 0 AND @col_game_id > 0,
  'ALTER TABLE `xn_companion_profile` ADD INDEX `idx_game_status` (`game_id`, `status`)',
  'SELECT "索引 idx_game_status 已存在或 game_id 不存在" AS info');
PREPARE stmt FROM @sql_add_idx1; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_price = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'eudazi_peer' AND TABLE_NAME = 'xn_companion_profile' AND INDEX_NAME = 'idx_price');
SET @sql_add_idx2 = IF(@idx_price = 0 AND @col_price > 0,
  'ALTER TABLE `xn_companion_profile` ADD INDEX `idx_price` (`price`)',
  'SELECT "索引 idx_price 已存在或 price 不存在" AS info');
PREPARE stmt FROM @sql_add_idx2; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. 修改 user_id 唯一索引 (如果存在但没有唯一约束)
-- init_schema.sql 有 UNIQUE KEY idx_user_id，无需修改

-- 8. 验证最终结构
SELECT '迁移完成，当前表结构:' AS status;
SHOW COLUMNS FROM `xn_companion_profile`;
