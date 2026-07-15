-- ============================================
-- 多客陪玩 - 数据库结构修复脚本
-- 生成时间: 2026-07-15
-- 说明: 基于 Model 文件与 init_schema.sql 对比生成的差异修复脚本
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. xn_user 表 - 添加 user_id 字段
-- ============================================================================
ALTER TABLE `xn_user` ADD COLUMN `user_id` VARCHAR(50) DEFAULT '' COMMENT '用户唯一标识' AFTER `id`;
CREATE INDEX `idx_user_id` ON `xn_user` (`user_id`);

-- ============================================================================
-- 2. xn_virtual_user 表 - 完全重构（字段差异过大）
-- Model 使用 tableName: 'virtual_user' (无 xn_ 前缀)，需重建表
-- ============================================================================
DROP TABLE IF EXISTS `xn_virtual_user`;

CREATE TABLE IF NOT EXISTS `virtual_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60) NOT NULL,
  `nickname` VARCHAR(50) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(30) DEFAULT 'default' COMMENT '角色设定：default/companion/guide/assistant',
  `personality` TEXT DEFAULT NULL COMMENT '性格描述',
  `dialogueStyle` VARCHAR(50) DEFAULT 'friendly' COMMENT '对话风格：friendly/professional/humorous/cute',
  `description` TEXT DEFAULT NULL COMMENT '角色描述',
  `modelConfig` TEXT DEFAULT NULL COMMENT '大模型配置（JSON格式）',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `isOnline` TINYINT(1) DEFAULT 1 COMMENT '在线状态：0-离线，1-在线',
  `contextExpireTime` INT(10) DEFAULT 3600 COMMENT '上下文过期时间（秒）',
  `maxContextLength` INT DEFAULT 50 COMMENT '最大上下文消息数',
  `permissions` TEXT DEFAULT '[]' COMMENT '权限列表（JSON格式）',
  `createTime` INT(10) DEFAULT 0,
  `updateTime` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  KEY `idx_status` (`status`),
  KEY `idx_isOnline` (`isOnline`),
  KEY `idx_createTime` (`createTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟用户表';

-- ============================================================================
-- 3. virtual_user_tag 表 - 完全重构（字段差异极大）
-- Model 使用 tableName: 'virtual_user_tag' (无 xn_ 前缀)
-- ============================================================================
DROP TABLE IF EXISTS `xn_virtual_user_tag`;

CREATE TABLE IF NOT EXISTS `virtual_user_tag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(30) NOT NULL COMMENT '标签代码',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '标签描述',
  `category` VARCHAR(30) DEFAULT NULL COMMENT '标签分类：personality/skill/style',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '标签图标',
  `color` VARCHAR(20) DEFAULT NULL COMMENT '标签颜色',
  `personality` TEXT DEFAULT NULL COMMENT '性格特征（JSON格式）',
  `expertise` TEXT DEFAULT NULL COMMENT '专业领域（JSON格式数组）',
  `communicationStyle` VARCHAR(50) DEFAULT NULL COMMENT '沟通风格：friendly/professional/humorous/cute/formal',
  `knowledgeScope` TEXT DEFAULT NULL COMMENT '知识范围（JSON格式数组）',
  `responseStrategy` TEXT DEFAULT NULL COMMENT '响应策略配置（JSON格式）',
  `promptTemplate` TEXT DEFAULT NULL COMMENT '系统提示词模板',
  `temperature` DECIMAL(3,2) DEFAULT 0.70 COMMENT '默认温度参数',
  `maxTokens` INT DEFAULT 1024 COMMENT '默认最大token数',
  `priority` INT DEFAULT 0 COMMENT '优先级（用于推荐排序）',
  `isDefault` TINYINT(1) DEFAULT 0 COMMENT '是否为默认标签',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `usageCount` INT DEFAULT 0 COMMENT '使用次数',
  `createTime` INT(10) DEFAULT 0,
  `updateTime` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  UNIQUE KEY `idx_code` (`code`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_isDefault` (`isDefault`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟用户标签表';

-- ============================================================================
-- 4. virtual_user_tag_relation 表 - 完全重构
-- Model 使用 tableName: 'virtual_user_tag_relation' (无 xn_ 前缀)
-- ============================================================================
DROP TABLE IF EXISTS `xn_virtual_user_tag_relation`;

CREATE TABLE IF NOT EXISTS `virtual_user_tag_relation` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `virtualUserId` BIGINT NOT NULL COMMENT '虚拟用户ID',
  `tagId` BIGINT NOT NULL COMMENT '标签ID',
  `isPrimary` TINYINT(1) DEFAULT 0 COMMENT '是否为主要标签',
  `customConfig` TEXT DEFAULT NULL COMMENT '自定义配置（JSON格式，可覆盖标签默认配置）',
  `createTime` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_virtual_tag_unique` (`virtualUserId`, `tagId`),
  KEY `idx_virtualUserId` (`virtualUserId`),
  KEY `idx_tagId` (`tagId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟用户标签关联表';

-- ============================================================================
-- 5. virtual_chat_history 表 - 完全重构
-- Model 使用 tableName: 'virtual_chat_history' (无 xn_ 前缀)
-- ============================================================================
DROP TABLE IF EXISTS `xn_virtual_chat_history`;

CREATE TABLE IF NOT EXISTS `virtual_chat_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `virtualUserId` BIGINT NOT NULL COMMENT '虚拟用户ID',
  `userId` BIGINT NOT NULL COMMENT '真实用户ID',
  `message` TEXT NOT NULL COMMENT '消息内容',
  `role` VARCHAR(20) NOT NULL COMMENT '角色：user/assistant/system',
  `contextId` VARCHAR(64) NOT NULL COMMENT '上下文会话ID',
  `createTime` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_virtualUserId` (`virtualUserId`),
  KEY `idx_userId` (`userId`),
  KEY `idx_contextId` (`contextId`),
  KEY `idx_createTime` (`createTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟聊天历史表';

-- ============================================================================
-- 6. xn_chat_room 表 - 添加缺失字段 + 重构
-- ============================================================================
-- 原表字段与新 Model 差异巨大，需要重建
DROP TABLE IF EXISTS `xn_chat_room`;

CREATE TABLE IF NOT EXISTS `xn_chat_room` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(128) NOT NULL,
  `title_sub` VARCHAR(255) DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `image_bg` VARCHAR(255) DEFAULT NULL,
  `manage_id` INTEGER NOT NULL,
  `type` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `open` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_manage_id` (`manage_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天室表';

-- ============================================================================
-- 7. xn_recharge_package 表 - 完全重构
-- 字段完全不同，需要重建
-- ============================================================================
DROP TABLE IF EXISTS `xn_recharge_package`;

CREATE TABLE IF NOT EXISTS `xn_recharge_package` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) NOT NULL,
  `money` DECIMAL(10,2) NOT NULL,
  `coin` INTEGER NOT NULL,
  `coin_zeng` INTEGER DEFAULT 0,
  `is_zeng` TINYINT(1) DEFAULT 0,
  `sort` INTEGER DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值套餐表';

-- ============================================================================
-- 8. xn_game 表 - 添加缺失字段
-- ============================================================================
ALTER TABLE `xn_game` ADD COLUMN `image` VARCHAR(255) DEFAULT NULL AFTER `icon`;
ALTER TABLE `xn_game` ADD COLUMN `image_bg` VARCHAR(255) DEFAULT NULL AFTER `image`;

-- ============================================================================
-- 9. xn_vip_order 表 - 添加缺失字段
-- ============================================================================
ALTER TABLE `xn_vip_order` ADD COLUMN `price` DECIMAL(10,2) NOT NULL AFTER `package_id`;
ALTER TABLE `xn_vip_order` ADD COLUMN `duration` INTEGER NOT NULL AFTER `price`;
ALTER TABLE `xn_vip_order` ADD COLUMN `level` INTEGER DEFAULT 1 AFTER `duration`;
ALTER TABLE `xn_vip_order` ADD COLUMN `pay_type` TINYINT(1) DEFAULT 1 AFTER `level`;
ALTER TABLE `xn_vip_order` ADD COLUMN `pay_no` VARCHAR(64) DEFAULT NULL AFTER `pay_time`;
-- 修改 order_no 长度从 50 到 32
-- 注意：如果数据已存在且长度超过32会报错，建议先检查

-- ============================================================================
-- 10. xn_gift_log 表 - 完全重构
-- 字段名和结构完全不同
-- ============================================================================
DROP TABLE IF EXISTS `xn_gift_log`;

CREATE TABLE IF NOT EXISTS `xn_gift_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `user_nickname` VARCHAR(50) DEFAULT NULL,
  `user_avatar` VARCHAR(255) DEFAULT NULL,
  `song_user_id` INTEGER NOT NULL,
  `song_user_nickname` VARCHAR(50) DEFAULT NULL,
  `song_user_avatar` VARCHAR(255) DEFAULT NULL,
  `gift_id` INTEGER NOT NULL,
  `gift_name` VARCHAR(50) NOT NULL,
  `gift_image` VARCHAR(255) DEFAULT NULL,
  `gift_num` INTEGER DEFAULT 1,
  `totalmoney` DECIMAL(10,2) NOT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_song_user_id` (`song_user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物记录表';

-- ============================================================================
-- 11. xn_gift_bag 表 - 完全重构
-- 从"礼物包"变为"用户礼物背包"
-- ============================================================================
DROP TABLE IF EXISTS `xn_gift_bag`;

CREATE TABLE IF NOT EXISTS `xn_gift_bag` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `gift_id` INTEGER NOT NULL,
  `gift_name` VARCHAR(50) NOT NULL,
  `gift_image` VARCHAR(255) NOT NULL,
  `num` INTEGER DEFAULT 1,
  `type` TINYINT(1) DEFAULT 0,
  `is_use` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_gift_id` (`gift_id`),
  KEY `idx_is_use` (`is_use`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户礼物背包表';

-- ============================================================================
-- 12. xn_red_packet 表 - 完全重构
-- 字段名和结构完全不同
-- ============================================================================
DROP TABLE IF EXISTS `xn_red_packet`;

CREATE TABLE IF NOT EXISTS `xn_red_packet` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `packet_no` VARCHAR(64) NOT NULL,
  `sender_id` INTEGER NOT NULL,
  `sender_nickname` VARCHAR(50) DEFAULT NULL,
  `type` TINYINT(1) DEFAULT 0,
  `total_num` INTEGER DEFAULT 1,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `remain_num` INTEGER DEFAULT 1,
  `remain_amount` DECIMAL(10,2) NOT NULL,
  `expire_time` INT(10) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_packet_no` (`packet_no`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_expire_status` (`expire_time`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包表';

-- ============================================================================
-- 13. xn_red_packet_log 表 - 添加缺失字段
-- ============================================================================
ALTER TABLE `xn_red_packet_log` ADD COLUMN `user_nickname` VARCHAR(50) DEFAULT NULL AFTER `user_id`;

-- ============================================================================
-- 14. xn_report 表 - 完全重构
-- 字段名和结构完全不同
-- ============================================================================
DROP TABLE IF EXISTS `xn_report`;

CREATE TABLE IF NOT EXISTS `xn_report` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `target_user_id` INTEGER NOT NULL,
  `target_type` TINYINT(1) NOT NULL,
  `target_id` INTEGER NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `images` VARCHAR(1000) DEFAULT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `handle_result` VARCHAR(255) DEFAULT NULL,
  `handle_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_status_time` (`status`, `create_time`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表';

-- ============================================================================
-- 15. xn_reserve 表 - 完全重构
-- 字段差异较大
-- ============================================================================
DROP TABLE IF EXISTS `xn_reserve`;

CREATE TABLE IF NOT EXISTS `xn_reserve` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `target_user_id` INTEGER NOT NULL,
  `game_id` INTEGER NOT NULL,
  `reserve_date` DATE NOT NULL,
  `reserve_time` TIME NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`, `status`),
  KEY `idx_target_date` (`target_user_id`, `reserve_date`),
  KEY `idx_date` (`reserve_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';

-- ============================================================================
-- 16. xn_reserve_slot 表 - 完全重构
-- 字段差异较大
-- ============================================================================
DROP TABLE IF EXISTS `xn_reserve_slot`;

CREATE TABLE IF NOT EXISTS `xn_reserve_slot` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `game_id` INTEGER NOT NULL,
  `reserve_date` DATE NOT NULL,
  `reserve_time` TIME NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_datetime` (`user_id`, `reserve_date`, `reserve_time`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_date` (`reserve_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约时段表';

-- ============================================================================
-- 17. xn_demand 表 - 完全重构
-- 字段差异很大
-- ============================================================================
DROP TABLE IF EXISTS `xn_demand`;

CREATE TABLE IF NOT EXISTS `xn_demand` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '发布用户ID',
  `service_type` VARCHAR(20) NOT NULL COMMENT '服务类型 online/offline',
  `game_id` INTEGER NOT NULL COMMENT '游戏ID',
  `game_name` VARCHAR(50) NOT NULL COMMENT '游戏名称',
  `date` DATE NOT NULL COMMENT '预约日期',
  `start_time` TIME NOT NULL COMMENT '开始时间',
  `end_time` TIME NOT NULL COMMENT '结束时间',
  `duration` INTEGER DEFAULT 0 COMMENT '服务时长(小时)',
  `budget` DECIMAL(10,2) DEFAULT 0 COMMENT '预算金额（金币）',
  `remark` VARCHAR(200) DEFAULT NULL COMMENT '备注说明',
  `offline_location` VARCHAR(100) DEFAULT NULL COMMENT '线下地点',
  `gender` VARCHAR(10) DEFAULT NULL COMMENT '陪玩师性别偏好',
  `age_start` INTEGER DEFAULT NULL COMMENT '年龄下限',
  `age_end` INTEGER DEFAULT NULL COMMENT '年龄上限',
  `tags` TEXT DEFAULT NULL COMMENT '标签JSON数组',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态 active/matched/completed/cancelled',
  `create_time` INT(10) DEFAULT 0 COMMENT '创建时间',
  `update_time` INT(10) DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_game_id` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求表';

-- ============================================================================
-- 18. xn_call_record 表 - 添加缺失字段
-- ============================================================================
ALTER TABLE `xn_call_record` ADD COLUMN `call_no` VARCHAR(50) NOT NULL FIRST;
ALTER TABLE `xn_call_record` MODIFY COLUMN `call_no` VARCHAR(50) NOT NULL;
ALTER TABLE `xn_call_record` ADD COLUMN `call_type` TINYINT(1) NOT NULL AFTER `callee_id`;
ALTER TABLE `xn_call_record` ADD COLUMN `trtc_room_id` INTEGER NOT NULL AFTER `call_type`;
ALTER TABLE `xn_call_record` ADD COLUMN `connect_time` INT(10) DEFAULT 0 AFTER `status`;
ALTER TABLE `xn_call_record` ADD COLUMN `end_reason` VARCHAR(100) DEFAULT NULL AFTER `duration`;
ALTER TABLE `xn_call_record` ADD COLUMN `is_companion_call` TINYINT(1) DEFAULT 0 AFTER `end_reason`;
ALTER TABLE `xn_call_record` ADD COLUMN `order_id` BIGINT DEFAULT 0 AFTER `is_companion_call`;
-- 删除原 type 列（已被 call_type 替代）
-- ALTER TABLE `xn_call_record` DROP COLUMN `type`;
-- 删除原 start_time 列（已被 connect_time 替代）
-- ALTER TABLE `xn_call_record` DROP COLUMN `start_time`;
-- 删除原 room_id 列（已被 trtc_room_id 替代）
-- ALTER TABLE `xn_call_record` DROP COLUMN `room_id`;
-- 添加索引
CREATE UNIQUE INDEX `idx_call_no` ON `xn_call_record` (`call_no`);
CREATE INDEX `idx_caller_time` ON `xn_call_record` (`caller_id`, `create_time`);
CREATE INDEX `idx_callee_time` ON `xn_call_record` (`callee_id`, `create_time`);
CREATE INDEX `idx_status_time` ON `xn_call_record` (`status`, `create_time`);
CREATE INDEX `idx_order_id` ON `xn_call_record` (`order_id`);
CREATE INDEX `idx_trtc_room_id` ON `xn_call_record` (`trtc_room_id`);

-- ============================================================================
-- 19. xn_call_billing 表 - 完全重构
-- 字段差异较大
-- ============================================================================
DROP TABLE IF EXISTS `xn_call_billing`;

CREATE TABLE IF NOT EXISTS `xn_call_billing` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `call_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `companion_id` INTEGER NOT NULL,
  `duration` INTEGER NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `settle_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_call_id` (`call_id`),
  KEY `idx_user_time` (`user_id`, `create_time`),
  KEY `idx_companion_id` (`companion_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话计费表';

-- ============================================================================
-- 20. xn_chat_log 表 - 添加缺失字段
-- ============================================================================
ALTER TABLE `xn_chat_log` ADD COLUMN `fromname` VARCHAR(50) DEFAULT NULL AFTER `fromid`;
ALTER TABLE `xn_chat_log` ADD COLUMN `toname` VARCHAR(50) DEFAULT NULL AFTER `toid`;
ALTER TABLE `xn_chat_log` ADD COLUMN `revoke_time` INT(10) DEFAULT 0 AFTER `is_revoked`;
-- 添加索引
CREATE INDEX `idx_toid_read` ON `xn_chat_log` (`toid`, `isread`);
CREATE INDEX `idx_revoke_time` ON `xn_chat_log` (`is_revoked`, `revoke_time`);

-- ============================================================================
-- 21. xn_banner 表 - 添加缺失字段
-- ============================================================================
ALTER TABLE `xn_banner` ADD COLUMN `link` VARCHAR(255) DEFAULT NULL AFTER `image`;
ALTER TABLE `xn_banner` ADD COLUMN `type` TINYINT(1) DEFAULT 0 AFTER `link`;
ALTER TABLE `xn_banner` ADD COLUMN `sort` INTEGER DEFAULT 0 AFTER `type`;
-- 修改 title 长度从 255 到 50
-- ALTER TABLE `xn_banner` MODIFY COLUMN `title` VARCHAR(50);
-- 修改 link_url 为 link
-- ALTER TABLE `xn_banner` CHANGE COLUMN `link_url` `link` VARCHAR(255);
-- 修改 sort_order 为 sort
-- ALTER TABLE `xn_banner` CHANGE COLUMN `sort_order` `sort` INTEGER;
-- 修改 image 的 allowNull: false（原来可为空）
-- ALTER TABLE `xn_banner` MODIFY COLUMN `image` VARCHAR(255) NOT NULL;
-- 删除 update_time 列（Model 中没有）
-- ALTER TABLE `xn_banner` DROP COLUMN `update_time`;
-- 添加索引
CREATE INDEX `idx_type` ON `xn_banner` (`type`);

-- ============================================================================
-- 22. xn_card 表 - 添加缺失字段
-- ============================================================================
ALTER TABLE `xn_card` ADD COLUMN `coin_amount` INTEGER NOT NULL AFTER `face_value`;
ALTER TABLE `xn_card` ADD COLUMN `expire_time` INT(10) DEFAULT 0 AFTER `use_time`;
-- 修改 card_password 为 card_pwd
-- ALTER TABLE `xn_card` CHANGE COLUMN `card_password` `card_pwd` VARCHAR(50);
-- 修改 type 的默认值
-- ALTER TABLE `xn_card` MODIFY COLUMN `type` TINYINT(1) NOT NULL;
-- 修改 value 为 face_value
-- ALTER TABLE `xn_card` CHANGE COLUMN `value` `face_value` DECIMAL(10,2);

-- ============================================================================
-- 23. xn_withdraw 表 - 完全重构
-- 字段差异非常大
-- ============================================================================
DROP TABLE IF EXISTS `xn_withdraw`;

CREATE TABLE IF NOT EXISTS `xn_withdraw` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `money` DECIMAL(10,2) NOT NULL,
  `pay_money` DECIMAL(10,2) NOT NULL,
  `shouxufei` DECIMAL(10,2) DEFAULT 0,
  `type` TINYINT(1) DEFAULT 1,
  `bank` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(50) DEFAULT NULL,
  `mobile` VARCHAR(16) DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `is_check` TINYINT(1) DEFAULT 0,
  `state` VARCHAR(20) DEFAULT NULL,
  `wx_ti_id` VARCHAR(50) DEFAULT NULL,
  `lailu` VARCHAR(20) DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_check` (`is_check`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现表';

-- ============================================================================
-- 24. xn_album_photo 表 - 完全重构
-- 字段差异较大
-- ============================================================================
DROP TABLE IF EXISTS `xn_album_photo`;

CREATE TABLE IF NOT EXISTS `xn_album_photo` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '图片描述',
  `privacy` VARCHAR(20) DEFAULT 'public' COMMENT '可见性 public/private/password/paid',
  `password` VARCHAR(50) DEFAULT NULL COMMENT '访问密码',
  `price` DECIMAL(10,2) DEFAULT 0 COMMENT '解锁价格（金币）',
  `likes` INTEGER DEFAULT 0 COMMENT '点赞数',
  `create_time` INT(10) DEFAULT 0 COMMENT '创建时间',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态 0-禁用 1-正常',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册照片表';

-- ============================================================================
-- 25. xn_companion_profile 表 - 完全重构
-- 字段差异较大
-- ============================================================================
DROP TABLE IF EXISTS `xn_companion_profile`;

CREATE TABLE IF NOT EXISTS `xn_companion_profile` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `game_id` INTEGER DEFAULT 0,
  `price` DECIMAL(10,2) DEFAULT 0,
  `tags` VARCHAR(255) DEFAULT NULL,
  `voice_intro` VARCHAR(255) DEFAULT NULL,
  `voice_time` INTEGER DEFAULT 0,
  `order_num` INTEGER DEFAULT 0,
  `income_total` DECIMAL(12,2) DEFAULT 0,
  `pingjia_num` INTEGER DEFAULT 0,
  `star` DECIMAL(3,2) DEFAULT 5.00,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_game_status` (`game_id`, `status`),
  KEY `idx_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪玩师资料表';

-- ============================================================================
-- 26. xn_game_order 表 - 完全重构
-- 字段差异非常大
-- ============================================================================
DROP TABLE IF EXISTS `xn_game_order`;

CREATE TABLE IF NOT EXISTS `xn_game_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL,
  `user_id` INTEGER NOT NULL,
  `target_user_id` INTEGER NOT NULL,
  `game_id` INTEGER NOT NULL,
  `game_name` VARCHAR(50) DEFAULT NULL,
  `type` TINYINT(1) DEFAULT 0,
  `price` DECIMAL(10,2) NOT NULL,
  `num` INTEGER DEFAULT 1,
  `total_price` DECIMAL(10,2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `status_zong` TINYINT(1) DEFAULT 0,
  `user_time` INT(10) DEFAULT 0,
  `add_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `pingjia_status` TINYINT(1) DEFAULT 0,
  `pingjia_time` INT(10) DEFAULT 0,
  `games_server_id` INTEGER DEFAULT 0,
  `games_server_name` VARCHAR(50) DEFAULT NULL,
  `game_role_id` VARCHAR(50) DEFAULT NULL,
  `game_role_name` VARCHAR(50) DEFAULT NULL,
  `voice_url` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target_status` (`target_user_id`, `status`),
  KEY `idx_status_time` (`status`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏订单表';

-- ============================================================================
-- 27. xn_post_comment 表 - 修改字段名
-- ============================================================================
-- reply_to -> reply_id
ALTER TABLE `xn_post_comment` ADD COLUMN `reply_id` INTEGER DEFAULT 0 AFTER `content`;
ALTER TABLE `xn_post_comment` ADD COLUMN `reply_user_id` INTEGER DEFAULT 0 AFTER `reply_id`;
-- 删除原 reply_to 列
-- ALTER TABLE `xn_post_comment` DROP COLUMN `reply_to`;
-- 添加索引
CREATE INDEX `idx_reply_id` ON `xn_post_comment` (`reply_id`);

-- ============================================================================
-- 28. xn_post_unlock 表 - 修改字段
-- ============================================================================
ALTER TABLE `xn_post_unlock` ADD COLUMN `unlock_type` TINYINT(1) NOT NULL AFTER `user_id`;
ALTER TABLE `xn_post_unlock` ADD COLUMN `amount` INTEGER DEFAULT 0 AFTER `unlock_type`;
-- 修改 price 类型从 DECIMAL(10,2) 到 INTEGER
-- ALTER TABLE `xn_post_unlock` MODIFY COLUMN `price` INTEGER DEFAULT 0;

-- ============================================================================
-- 29. xn_user_follow 表 - 修改字段名
-- ============================================================================
-- follower_id -> user_id
-- following_id -> target_user_id
ALTER TABLE `xn_user_follow` ADD COLUMN `user_id_temp` INTEGER NOT NULL AFTER `id`;
ALTER TABLE `xn_user_follow` ADD COLUMN `target_user_id` INTEGER NOT NULL AFTER `user_id_temp`;
-- 数据迁移
UPDATE `xn_user_follow` SET `user_id_temp` = `follower_id`, `target_user_id` = `following_id`;
-- 删除旧列
-- ALTER TABLE `xn_user_follow` DROP COLUMN `follower_id`;
-- ALTER TABLE `xn_user_follow` DROP COLUMN `following_id`;
-- ALTER TABLE `xn_user_follow` CHANGE COLUMN `user_id_temp` `user_id` INTEGER NOT NULL;
-- 更新唯一索引
-- ALTER TABLE `xn_user_follow` DROP INDEX `idx_follower_following`;
-- CREATE UNIQUE INDEX `idx_user_target` ON `xn_user_follow` (`user_id`, `target_user_id`);
-- 添加索引
CREATE INDEX `idx_target_user_id` ON `xn_user_follow` (`target_user_id`);

-- ============================================================================
-- 30. xn_order_chong 表 - 完全重构
-- 字段差异较大
-- ============================================================================
DROP TABLE IF EXISTS `xn_order_chong`;

CREATE TABLE IF NOT EXISTS `xn_order_chong` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `order_no` VARCHAR(64) NOT NULL,
  `pay_no` VARCHAR(64) DEFAULT NULL,
  `money` DECIMAL(10,2) NOT NULL,
  `money_zeng` DECIMAL(10,2) DEFAULT 0,
  `pay_type` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `pay_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_pay_no` (`pay_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值订单表';

-- ============================================================================
-- 31. xn_post 表 - 修改字段类型
-- ============================================================================
-- images 从 TEXT 改为 VARCHAR(1000)
-- ALTER TABLE `xn_post` MODIFY COLUMN `images` VARCHAR(1000);
-- videos 从 TEXT 改为 VARCHAR(500)
-- ALTER TABLE `xn_post` MODIFY COLUMN `videos` VARCHAR(500);
-- private_price 从 DECIMAL(10,2) 改为 INTEGER
-- ALTER TABLE `xn_post` MODIFY COLUMN `private_price` INTEGER DEFAULT 0;
-- private_password 从 VARCHAR(50) 改为 VARCHAR(32)
-- ALTER TABLE `xn_post` MODIFY COLUMN `private_password` VARCHAR(32);
-- 删除 update_time 列（Model 中没有）
-- ALTER TABLE `xn_post` DROP COLUMN `update_time`;
-- 添加复合索引
CREATE INDEX `idx_tag_time` ON `xn_post` (`tag_id`, `create_time`);
CREATE INDEX `idx_post_status` ON `xn_post` (`status`);

-- ============================================================================
-- 32. 删除相册表（Model 中不存在）
-- ============================================================================
DROP TABLE IF EXISTS `xn_album`;

-- ============================================================================
-- 数据初始化（可选）
-- ============================================================================

-- 插入虚拟用户标签示例数据
INSERT IGNORE INTO `virtual_user_tag` (`name`, `code`, `category`, `status`, `createTime`) VALUES
('温柔', 'gentle', 'personality', 1, UNIX_TIMESTAMP()),
('活泼', 'lively', 'personality', 1, UNIX_TIMESTAMP()),
('幽默', 'humorous', 'personality', 1, UNIX_TIMESTAMP()),
('专业', 'professional', 'skill', 1, UNIX_TIMESTAMP()),
('游戏高手', 'gamer', 'skill', 1, UNIX_TIMESTAMP());

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 执行说明：
-- 1. 请在执行前备份数据库
-- 2. 被标记为注释的 ALTER/DROP 语句需要根据实际情况手动确认后取消注释执行
-- 3. 对于有数据的重要表，建议先在测试环境验证
-- 4. 本脚本包含 26 个表的修复操作
-- ============================================
