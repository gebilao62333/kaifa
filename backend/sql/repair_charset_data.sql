-- ============================================
-- eu搭子 - 数据库字符集修复脚本
-- 用于修复因 MySQL 连接字符集不匹配导致的中文乱码
-- 
-- 使用方式：
--   mysql -u root -p --default-character-set=utf8mb4 eudazi < repair_charset_data.sql
-- 
-- 或在 MySQL 客户端中：
--   SET NAMES utf8mb4;
--   source repair_charset_data.sql;
-- ============================================

SET NAMES utf8mb4;

-- 1. 修复用户表中文字段（昵称、城市、简介）
UPDATE xn_user 
SET 
  nickname = CONVERT(BINARY CONVERT(nickname USING latin1) USING utf8mb4),
  city = CONVERT(BINARY CONVERT(city USING latin1) USING utf8mb4),
  `dec` = CONVERT(BINARY CONVERT(`dec` USING latin1) USING utf8mb4)
WHERE id IN (1,2,3,4,5);

-- 2. 修复帖子内容
UPDATE xn_post 
SET content = CONVERT(BINARY CONVERT(content USING latin1) USING utf8mb4)
WHERE content IS NOT NULL AND content != '';

-- 3. 修复帖子评论
UPDATE xn_post_comment 
SET content = CONVERT(BINARY CONVERT(content USING latin1) USING utf8mb4)
WHERE content IS NOT NULL AND content != '';

-- 4. 修复聊天记录
UPDATE xn_chat_log 
SET content = CONVERT(BINARY CONVERT(content USING latin1) USING utf8mb4)
WHERE content IS NOT NULL AND content != '';

-- 5. 修复 Banner 标题
UPDATE xn_banner 
SET title = CONVERT(BINARY CONVERT(title USING latin1) USING utf8mb4)
WHERE title IS NOT NULL AND title != '';

-- 6. 修复陪玩师标签
UPDATE xn_companion_profile 
SET tags = CONVERT(BINARY CONVERT(tags USING latin1) USING utf8mb4)
WHERE tags IS NOT NULL AND tags != '';

-- 7. 修复管理员昵称
UPDATE xn_admin 
SET nickname = CONVERT(BINARY CONVERT(nickname USING latin1) USING utf8mb4)
WHERE nickname IS NOT NULL AND nickname != '';

-- ============================================
-- 修复完成，请验证数据是否正确
-- SELECT id, nickname, city FROM xn_user;
-- ============================================
