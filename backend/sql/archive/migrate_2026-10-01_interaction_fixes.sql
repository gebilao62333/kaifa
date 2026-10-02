-- 交互功能修复相关表结构变更（2026-10-01）
-- 说明：init_schema.sql 已同步这些列（新库直接建表即包含）；
--       本文件用于对【已存在】的库做增量升级。
-- 注意：MySQL 不支持 `ADD COLUMN IF NOT EXISTS`，请确认列尚不存在后再执行（每句只需执行一次）。

-- 预约表：补充服务时长/金额/备注/服务类型
ALTER TABLE `xn_reserve`
  ADD COLUMN `duration` INT DEFAULT 0,
  ADD COLUMN `price` DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN `remark` VARCHAR(255),
  ADD COLUMN `service_type` VARCHAR(16);

-- 陪玩师资料表：补充服务展示图与技能介绍
ALTER TABLE `xn_companion_profile`
  ADD COLUMN `icon` VARCHAR(255),
  ADD COLUMN `description` VARCHAR(500);

-- 用户表：补充实名认证字段
ALTER TABLE `xn_user`
  ADD COLUMN `real_name` VARCHAR(50),
  ADD COLUMN `id_card` VARCHAR(18),
  ADD COLUMN `real_name_front` VARCHAR(255),
  ADD COLUMN `real_name_back` VARCHAR(255),
  ADD COLUMN `real_name_status` TINYINT(1) DEFAULT 0,
  ADD COLUMN `real_name_time` INT(10) DEFAULT 0;

-- 游戏订单表：补充申诉字段
ALTER TABLE `xn_game_order`
  ADD COLUMN `appeal_reason` VARCHAR(255),
  ADD COLUMN `appeal_time` INT(10) DEFAULT 0;

-- 用户主页访问记录表（点赞/访客记录功能）
CREATE TABLE IF NOT EXISTS `xn_user_visit` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '被访问者ID',
  `visitor_id` BIGINT NOT NULL COMMENT '访问者ID',
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_visitor` (`user_id`, `visitor_id`),
  KEY `idx_user_time` (`user_id`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户主页访问记录表';

-- 用户偏好/装扮数据表（JSON）
CREATE TABLE IF NOT EXISTS `xn_user_pref` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `data` TEXT,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户偏好/装扮数据表';
