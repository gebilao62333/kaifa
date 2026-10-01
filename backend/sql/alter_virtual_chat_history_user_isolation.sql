-- 虚拟人聊天记录：用户隔离 + type 语义修复
-- 1) 新增 user_id 列：区分聊天记录归属的真实用户，避免跨用户隐私泄漏
-- 2) 新增 sender 列：专门承载"发送方"语义（0-用户，1-虚拟人）
-- 3) type 恢复为纯"消息类型"语义：0-文本，1-图片，2-语音
-- 历史数据迁移：旧记录 type=0 为用户消息、type=1 为虚拟人回复，均为文本
-- 在目标数据库执行一次即可，请勿重复执行（ADD COLUMN 无 IF NOT EXISTS 保护，重复执行会报错）

ALTER TABLE `xn_virtual_chat_history`
  ADD COLUMN `user_id` BIGINT NOT NULL DEFAULT 0 COMMENT '真实用户ID，0-未知/历史数据' AFTER `virtual_user_id`,
  ADD COLUMN `sender` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '发送方：0-用户，1-虚拟人' AFTER `type`,
  ADD INDEX `idx_user_id` (`user_id`),
  ADD INDEX `idx_virtual_user_user` (`virtual_user_id`, `user_id`);

-- 历史数据迁移：旧 type=1（虚拟人回复）-> sender=1, type=0（文本）
UPDATE `xn_virtual_chat_history` SET `sender` = 1, `type` = 0 WHERE `type` = 1;
-- 旧 type=0（用户消息）-> sender=0, type=0（文本）
UPDATE `xn_virtual_chat_history` SET `sender` = 0, `type` = 0 WHERE `type` = 0;
