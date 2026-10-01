-- ============================================
-- eu搭子 - 数据库初始化脚本（唯一权威结构定义）
-- ============================================
-- 说明：
--   1. 本文件是与 Sequelize 模型（src/models/mysql/*.js）**逐字段对齐**的规范建表脚本。
--      应用的数据库结构只以本文件为准（项目内未调用 sequelize.sync()）。
--   2. 原 fix_schema.sql / fix_missing_tables.sql 的差异内容已合并进本文件，两个旧脚本已删除。
--   3. 统一约定：MySQL、ENGINE=InnoDB、DEFAULT CHARSET=utf8mb4、反引号标识符、
--      unix 时间戳使用 INT(10) 且 DEFAULT 0、每张表带中文 COMMENT。

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户表
CREATE TABLE IF NOT EXISTS `xn_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60),
  `nickname` VARCHAR(50) NOT NULL,
  `avatar` VARCHAR(255),
  `mobile` VARCHAR(16),
  `password` VARCHAR(255),
  `email` VARCHAR(100),
  `open_id` VARCHAR(50),
  `unionid` VARCHAR(50),
  `money` DECIMAL(10, 2) DEFAULT 0,
  `gift_money` DECIMAL(10, 2) DEFAULT 0,
  `gift_money_zong` DECIMAL(10, 2) DEFAULT 0,
  `score` INT DEFAULT 0,
  `lv` INT DEFAULT 1,
  `vip` TINYINT(1) DEFAULT 0,
  `vip_lv` INT DEFAULT 0,
  `vip_expire_time` INT(10) DEFAULT 0,
  `sex` TINYINT(1) DEFAULT 0,
  `city` VARCHAR(50),
  `status` TINYINT(1) DEFAULT 1,
  `jinyan_time` INT(10) DEFAULT 0,
  `is_dav` TINYINT(1) DEFAULT 0,
  `is_manage_normal` TINYINT(1) DEFAULT 0,
  `fans_num` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `last_login_time` INT(10) DEFAULT 0,
  `ip` VARCHAR(15),
  `platform` VARCHAR(20),
  `dec` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_mobile` (`mobile`),
  KEY `idx_open_id` (`open_id`),
  KEY `idx_lv` (`lv`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=11000 DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 管理员角色表
CREATE TABLE IF NOT EXISTS `xn_admin_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  `username` VARCHAR(60),
  `password` VARCHAR(255),
  `description` VARCHAR(255),
  `permissions` TEXT,
  `status` TINYINT(1) DEFAULT 1,
  `is_super` TINYINT(1) DEFAULT 0,
  `sort` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `create_admin_id` BIGINT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  UNIQUE KEY `idx_username` (`username`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色表';

-- 管理员表
CREATE TABLE IF NOT EXISTS `xn_admin` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(50),
  `avatar` VARCHAR(255),
  `email` VARCHAR(100),
  `phone` VARCHAR(16),
  `role_id` BIGINT NOT NULL DEFAULT 0,
  `permissions` TEXT,
  `status` TINYINT(1) DEFAULT 1,
  `last_login_time` INT(10) DEFAULT 0,
  `last_login_ip` VARCHAR(15),
  `create_time` INT(10) DEFAULT 0,
  `create_admin_id` BIGINT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 虚拟用户表
CREATE TABLE IF NOT EXISTS `xn_virtual_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `avatar` VARCHAR(255) NOT NULL,
  `gender` TINYINT(1) DEFAULT 0,
  `age` INT DEFAULT 0,
  `region` VARCHAR(50),
  `tags` TEXT,
  `intro` TEXT,
  `price_per_hour` DECIMAL(10, 2) DEFAULT 0,
  `online_status` TINYINT(1) DEFAULT 0,
  `random_online` TINYINT(1) DEFAULT 0,
  `online_time_start` VARCHAR(5) DEFAULT '09:00',
  `online_time_end` VARCHAR(5) DEFAULT '23:00',
  `online_duration_min` INT DEFAULT 30,
  `online_duration_max` INT DEFAULT 90,
  `online_until` INT(10) DEFAULT 0,
  `is_recommend` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_online_status` (`online_status`),
  KEY `idx_is_recommend` (`is_recommend`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟用户表';

-- 虚拟用户标签表
CREATE TABLE IF NOT EXISTS `xn_virtual_user_tag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `icon` VARCHAR(255),
  `sort_order` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟用户标签表';

-- 虚拟用户标签关联表
CREATE TABLE IF NOT EXISTS `xn_virtual_user_tag_relation` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `virtual_user_id` BIGINT NOT NULL,
  `tag_id` BIGINT NOT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_virtual_user_id` (`virtual_user_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟用户标签关联表';

-- 虚拟聊天历史表
CREATE TABLE IF NOT EXISTS `xn_virtual_chat_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `virtual_user_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL DEFAULT 0,
  `content` TEXT NOT NULL,
  `type` TINYINT(1) DEFAULT 0,
  `sender` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_virtual_user_id` (`virtual_user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_virtual_user` (`virtual_user_id`, `user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟聊天历史表';

-- VIP套餐表
CREATE TABLE IF NOT EXISTS `xn_vip_package` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `original_price` DECIMAL(10, 2),
  `duration` INT NOT NULL,
  `level` INT DEFAULT 1,
  `hot` TINYINT(1) DEFAULT 0,
  `sort` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP套餐表';

-- VIP订单表
CREATE TABLE IF NOT EXISTS `xn_vip_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `order_no` VARCHAR(32) NOT NULL,
  `package_id` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `duration` INT NOT NULL,
  `level` INT DEFAULT 1,
  `pay_type` TINYINT(1) DEFAULT 1,
  `status` TINYINT(1) DEFAULT 0,
  `pay_no` VARCHAR(64),
  `create_time` INT(10) DEFAULT 0,
  `pay_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP订单表';

-- 游戏表
CREATE TABLE IF NOT EXISTS `xn_game` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `image` VARCHAR(255),
  `image_bg` VARCHAR(255),
  `status` TINYINT(1) DEFAULT 1,
  `sort` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏表';

-- 游戏订单表
CREATE TABLE IF NOT EXISTS `xn_game_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `target_user_id` BIGINT NOT NULL,
  `companion_id` BIGINT DEFAULT 0,
  `companion_name` VARCHAR(50),
  `duration` INT DEFAULT 1,
  `amount` DECIMAL(10, 2) DEFAULT 0,
  `game_id` BIGINT NOT NULL,
  `game_name` VARCHAR(50),
  `price` DECIMAL(10, 2) NOT NULL,
  `num` INT DEFAULT 1,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `remark` TEXT,
  `create_time` INT(10) DEFAULT 0,
  `add_time` INT(10) DEFAULT 0,
  `start_time` INT(10),
  `end_time` INT(10) DEFAULT 0,
  `user_time` INT(10) DEFAULT 0,
  `star` DECIMAL(2, 1),
  `content` TEXT,
  `status_zong` TINYINT(1) DEFAULT 0,
  `pingjia_status` TINYINT(1) DEFAULT 0,
  `pingjia_time` INT(10) DEFAULT 0,
  `games_server_id` INT DEFAULT 0,
  `games_server_name` VARCHAR(50),
  `game_role_id` VARCHAR(50),
  `game_role_name` VARCHAR(50),
  `voice_url` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target_status` (`target_user_id`, `status`),
  KEY `idx_status_create_time` (`status`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏订单表';

-- 礼物表
CREATE TABLE IF NOT EXISTS `xn_gift` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `svga` VARCHAR(255),
  `money` DECIMAL(10, 2) NOT NULL,
  `type` TINYINT(1) DEFAULT 0,
  `is_vip` TINYINT(1) DEFAULT 0,
  `tian` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `sort` INT DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物表';

-- 用户礼物背包表
CREATE TABLE IF NOT EXISTS `xn_gift_bag` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `gift_id` INT NOT NULL,
  `gift_name` VARCHAR(50) NOT NULL,
  `gift_image` VARCHAR(255) NOT NULL,
  `num` INT DEFAULT 1,
  `type` TINYINT(1) DEFAULT 0,
  `is_use` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_gift_id` (`gift_id`),
  KEY `idx_is_use` (`is_use`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户礼物背包表';

-- 礼物记录表
CREATE TABLE IF NOT EXISTS `xn_gift_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `user_nickname` VARCHAR(50),
  `user_avatar` VARCHAR(255),
  `song_user_id` BIGINT NOT NULL,
  `song_user_nickname` VARCHAR(50),
  `song_user_avatar` VARCHAR(255),
  `gift_id` BIGINT NOT NULL,
  `gift_name` VARCHAR(50) NOT NULL,
  `gift_image` VARCHAR(255),
  `gift_num` INT DEFAULT 1,
  `totalmoney` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10),
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_song_user_id` (`song_user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物记录表';

-- 充值订单表
CREATE TABLE IF NOT EXISTS `xn_order_chong` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(50) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `coins` INT NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `pay_type` VARCHAR(20),
  `pay_time` INT(10),
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值订单表';

-- 充值套餐表
CREATE TABLE IF NOT EXISTS `xn_recharge_package` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `coins` INT NOT NULL,
  `bonus_coins` INT DEFAULT 0,
  `hot` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `sort` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值套餐表';

-- 动态表
CREATE TABLE IF NOT EXISTS `xn_post` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `content` TEXT,
  `images` VARCHAR(1000),
  `videos` VARCHAR(500),
  `thumb_num` INT DEFAULT 0,
  `comment_num` INT DEFAULT 0,
  `share_num` INT DEFAULT 0,
  `tag_id` INT DEFAULT 0,
  `type` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `is_private` TINYINT(1) DEFAULT 0,
  `private_password` VARCHAR(32),
  `private_price` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tag_time` (`tag_id`, `create_time`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表';

-- 动态点赞表
CREATE TABLE IF NOT EXISTS `xn_post_like` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_post_user` (`post_id`, `user_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态点赞表';

-- 动态评论表
CREATE TABLE IF NOT EXISTS `xn_post_comment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT,
  `reply_id` INT DEFAULT 0,
  `reply_user_id` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_reply_id` (`reply_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态评论表';

-- 动态解锁表
CREATE TABLE IF NOT EXISTS `xn_post_unlock` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `price` DECIMAL(10, 2) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_post_user` (`post_id`, `user_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态解锁表';

-- 用户关注表
CREATE TABLE IF NOT EXISTS `xn_user_follow` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `follower_id` BIGINT NOT NULL,
  `following_id` BIGINT NOT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_follower_following` (`follower_id`, `following_id`),
  KEY `idx_following_id` (`following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注表';

-- 相册照片表
CREATE TABLE IF NOT EXISTS `xn_album_photo` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255),
  `privacy` VARCHAR(20) DEFAULT 'public',
  `password` VARCHAR(50),
  `price` DECIMAL(10, 2) DEFAULT 0,
  `likes` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册照片表';

-- 红包表
CREATE TABLE IF NOT EXISTS `xn_red_packet` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `packet_no` VARCHAR(64) NOT NULL,
  `sender_id` INT NOT NULL,
  `sender_nickname` VARCHAR(50),
  `type` TINYINT(1) DEFAULT 0,
  `total_num` INT DEFAULT 1,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `remain_num` INT DEFAULT 1,
  `remain_amount` DECIMAL(10, 2) NOT NULL,
  `expire_time` INT(10) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_packet_no` (`packet_no`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_expire_status` (`expire_time`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包表';

-- 红包记录表
CREATE TABLE IF NOT EXISTS `xn_red_packet_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `packet_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `user_nickname` VARCHAR(50),
  `amount` DECIMAL(10, 2) NOT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_packet_id` (`packet_id`),
  KEY `idx_packet_user` (`packet_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包记录表';

-- 举报表
CREATE TABLE IF NOT EXISTS `xn_report` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `target_user_id` INT NOT NULL,
  `target_type` TINYINT(1) NOT NULL,
  `target_id` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `images` VARCHAR(1000),
  `status` TINYINT(1) DEFAULT 0,
  `handle_result` VARCHAR(255),
  `handle_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_status_create_time` (`status`, `create_time`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表';

-- 预约表
CREATE TABLE IF NOT EXISTS `xn_reserve` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `target_user_id` INT NOT NULL,
  `game_id` INT NOT NULL,
  `reserve_date` DATE NOT NULL,
  `reserve_time` TIME NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`, `status`),
  KEY `idx_target_date` (`target_user_id`, `reserve_date`),
  KEY `idx_reserve_date` (`reserve_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';

-- 预约时段表
CREATE TABLE IF NOT EXISTS `xn_reserve_slot` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `game_id` INT NOT NULL,
  `reserve_date` DATE NOT NULL,
  `reserve_time` TIME NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_datetime` (`user_id`, `reserve_date`, `reserve_time`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_reserve_date` (`reserve_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约时段表';

-- 需求表
CREATE TABLE IF NOT EXISTS `xn_demand` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `service_type` VARCHAR(20) NOT NULL,
  `game_id` INT DEFAULT 0,
  `game_name` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `duration` INT DEFAULT 0,
  `budget` DECIMAL(10, 2) DEFAULT 0,
  `remark` VARCHAR(200),
  `offline_location` VARCHAR(100),
  `gender` VARCHAR(10),
  `age_start` INT,
  `age_end` INT,
  `tags` TEXT,
  `status` VARCHAR(20) DEFAULT 'active',
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_game_id` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求表';

-- 通话记录表
CREATE TABLE IF NOT EXISTS `xn_call_record` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `call_no` VARCHAR(50) NOT NULL,
  `caller_id` INT NOT NULL,
  `callee_id` INT NOT NULL,
  `call_type` TINYINT(1) NOT NULL,
  `trtc_room_id` INT NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `connect_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  `duration` INT DEFAULT 0,
  `end_reason` VARCHAR(100),
  `is_companion_call` TINYINT(1) DEFAULT 0,
  `order_id` BIGINT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_call_no` (`call_no`),
  KEY `idx_caller_time` (`caller_id`, `create_time`),
  KEY `idx_callee_time` (`callee_id`, `create_time`),
  KEY `idx_status_time` (`status`, `create_time`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_trtc_room_id` (`trtc_room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话记录表';

-- 通话计费表
CREATE TABLE IF NOT EXISTS `xn_call_billing` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `call_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `companion_id` INT NOT NULL,
  `duration` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `settle_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_call_id` (`call_id`),
  KEY `idx_user_time` (`user_id`, `create_time`),
  KEY `idx_companion_id` (`companion_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话计费表';

-- 聊天会话表（承载会话列表与未读数，由 ChatSession 模型使用）
CREATE TABLE IF NOT EXISTS `xn_chat_room` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `virtual_user_id` BIGINT NOT NULL,
  `last_message` TEXT,
  `last_message_time` INT(10),
  `unread_count` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_virtual` (`user_id`, `virtual_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天会话表';

-- 聊天记录表
CREATE TABLE IF NOT EXISTS `xn_chat_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `fromid` INT NOT NULL,
  `toid` INT NOT NULL,
  `content` TEXT,
  `type` TINYINT(1) DEFAULT 0,
  `vod_url` VARCHAR(255),
  `sec` INT DEFAULT 0,
  `time` INT(10) DEFAULT 0,
  `isread` TINYINT(1) DEFAULT 0,
  `is_del` INT DEFAULT 0,
  `is_revoked` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_from_to` (`fromid`, `toid`),
  KEY `idx_time` (`time`),
  KEY `idx_to_read` (`toid`, `isread`),
  KEY `idx_is_revoked` (`is_revoked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天记录表';

-- Banner表
CREATE TABLE IF NOT EXISTS `xn_banner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255),
  `image` VARCHAR(255) NOT NULL,
  `link_url` VARCHAR(255),
  `sort_order` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Banner表';

-- 开屏弹窗表
CREATE TABLE IF NOT EXISTS `xn_splash_screen` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100),
  `image` VARCHAR(500) NOT NULL,
  `link` VARCHAR(500),
  `frequency` TINYINT(1) DEFAULT 1,
  `start_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  `sort` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`),
  KEY `idx_frequency` (`frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='开屏弹窗表';

-- 卡密表
CREATE TABLE IF NOT EXISTS `xn_card` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `card_no` VARCHAR(50) NOT NULL,
  `card_password` VARCHAR(50) NOT NULL,
  `type` TINYINT(1) NOT NULL,
  `value` DECIMAL(10, 2) NOT NULL,
  `coin_amount` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `use_user_id` BIGINT,
  `use_time` INT,
  `admin_id` BIGINT,
  `admin_name` VARCHAR(60),
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_card_no` (`card_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡密表';

-- 提现表
CREATE TABLE IF NOT EXISTS `xn_withdraw` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `money` DECIMAL(10, 2) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `pay_money` DECIMAL(10, 2) NOT NULL,
  `shouxufei` DECIMAL(10, 2) DEFAULT 0,
  `type` TINYINT(1) DEFAULT 1,
  `account` VARCHAR(255),
  `bank` VARCHAR(255),
  `name` VARCHAR(50),
  `mobile` VARCHAR(16),
  `image` VARCHAR(255),
  `is_check` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `state` VARCHAR(20),
  `wx_ti_id` VARCHAR(50),
  `lailu` VARCHAR(20),
  `channel` VARCHAR(20) DEFAULT 'gift',
  `currency` VARCHAR(10),
  `remark` TEXT,
  `handle_admin_id` BIGINT,
  `handle_time` INT(10),
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_check` (`is_check`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现表';

-- 支出流水表
CREATE TABLE IF NOT EXISTS `xn_expense_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `source_type` VARCHAR(20) NOT NULL,
  `source_name` VARCHAR(50) NOT NULL,
  `icon` VARCHAR(20),
  `bg_color` VARCHAR(64),
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `rel_id` BIGINT DEFAULT 0,
  `remark` VARCHAR(255),
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_source_type` (`source_type`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支出流水表';

-- 收入流水表
CREATE TABLE IF NOT EXISTS `xn_income_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `source_type` VARCHAR(20) NOT NULL,
  `source_name` VARCHAR(50) NOT NULL,
  `icon` VARCHAR(20),
  `bg_color` VARCHAR(64),
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `rel_id` BIGINT DEFAULT 0,
  `remark` VARCHAR(255),
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_source_type` (`source_type`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收入流水表';

-- 媒资登记表
CREATE TABLE IF NOT EXISTS `xn_media_asset` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `biz_type` VARCHAR(32) NOT NULL DEFAULT 'misc',
  `biz_id` BIGINT,
  `url` TEXT NOT NULL,
  `storage` VARCHAR(16) NOT NULL DEFAULT 'cos',
  `file_type` VARCHAR(16) NOT NULL DEFAULT 'file',
  `create_time` INT(10) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_biz` (`biz_type`, `biz_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='媒资登记表';

-- 系统设置表
CREATE TABLE IF NOT EXISTS `xn_system_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(64) NOT NULL,
  `value` TEXT,
  `group` VARCHAR(32) DEFAULT 'general',
  `remark` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`),
  KEY `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

-- 陪玩师资料表
CREATE TABLE IF NOT EXISTS `xn_companion_profile` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `game_id` INT DEFAULT 0,
  `price` DECIMAL(10, 2) DEFAULT 0,
  `tags` VARCHAR(255),
  `voice_intro` VARCHAR(255),
  `voice_time` INT DEFAULT 0,
  `order_num` INT DEFAULT 0,
  `income_total` DECIMAL(12, 2) DEFAULT 0,
  `pingjia_num` INT DEFAULT 0,
  `star` DECIMAL(3, 2) DEFAULT 5.00,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_game_status` (`game_id`, `status`),
  KEY `idx_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪玩师资料表';

-- 用户意见反馈表
CREATE TABLE IF NOT EXISTS `xn_feedback` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '提交用户ID',
  `type` VARCHAR(32) NOT NULL DEFAULT 'other' COMMENT '反馈类型 bug/suggestion/complaint/other',
  `content` TEXT NOT NULL COMMENT '反馈内容',
  `images` TEXT COMMENT '截图URL，逗号分隔',
  `contact` VARCHAR(64) COMMENT '联系方式',
  `status` TINYINT(1) DEFAULT 0 COMMENT '状态 0-处理中 1-已处理 2-已关闭',
  `reply` TEXT COMMENT '管理员回复',
  `create_time` INT(10) DEFAULT 0 COMMENT '创建时间',
  `update_time` INT(10) DEFAULT 0 COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户意见反馈表';

-- 相册表（历史遗留表，无对应 Sequelize 模型；保留以兼容既有数据）
CREATE TABLE IF NOT EXISTS `xn_album` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(255),
  `cover` VARCHAR(255),
  `photos_count` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册表';

SET FOREIGN_KEY_CHECKS = 1;
