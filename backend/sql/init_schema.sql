-- ============================================
-- 多客陪玩 - 数据库初始化脚本
-- ============================================

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
  `status` TINYINT(1) DEFAULT 0,
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
  `description` VARCHAR(255),
  `permissions` TEXT,
  `status` TINYINT(1) DEFAULT 1,
  `is_super` TINYINT(1) DEFAULT 0,
  `sort` INT DEFAULT 0,
  `create_time` INT DEFAULT 0,
  `create_admin_id` BIGINT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
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
  `role_id` BIGINT DEFAULT 0,
  `permissions` TEXT,
  `status` TINYINT(1) DEFAULT 1,
  `last_login_time` INT DEFAULT 0,
  `last_login_ip` VARCHAR(15),
  `create_time` INT DEFAULT 0,
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
  `is_recommend` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_online_status` (`online_status`),
  KEY `idx_is_recommend` (`is_recommend`)
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
  PRIMARY KEY (`id`)
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

-- VIP套餐表
CREATE TABLE IF NOT EXISTS `xn_vip_package` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `original_price` DECIMAL(10, 2),
  `duration` INT NOT NULL,
  `level` INT DEFAULT 1,
  `hot` TINYINT(1) DEFAULT 0,
  `sort` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP套餐表';

-- VIP订单表
CREATE TABLE IF NOT EXISTS `xn_vip_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(50) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `package_id` BIGINT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `pay_time` INT(10),
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP订单表';

-- 游戏表
CREATE TABLE IF NOT EXISTS `xn_game` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `icon` VARCHAR(255),
  `description` TEXT,
  `status` TINYINT(1) DEFAULT 1,
  `sort` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏表';

-- 礼物表
CREATE TABLE IF NOT EXISTS `xn_gift` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) NOT NULL,
  `image` VARCHAR(255),
  `svga` VARCHAR(255),
  `money` DECIMAL(10, 2) DEFAULT 0,
  `type` TINYINT(1) DEFAULT 0,
  `is_vip` TINYINT(1) DEFAULT 0,
  `tian` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `sort` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物表';

-- 礼物包表
CREATE TABLE IF NOT EXISTS `xn_gift_bag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) NOT NULL,
  `image` VARCHAR(255),
  `price` DECIMAL(10, 2) DEFAULT 0,
  `gifts` TEXT,
  `status` TINYINT(1) DEFAULT 1,
  `sort` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物包表';

-- 礼物记录表
CREATE TABLE IF NOT EXISTS `xn_gift_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `from_user_id` BIGINT NOT NULL,
  `to_user_id` BIGINT NOT NULL,
  `gift_id` BIGINT NOT NULL,
  `gift_num` INT DEFAULT 1,
  `total_money` DECIMAL(10, 2) DEFAULT 0,
  `room_id` VARCHAR(50),
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_to_user_id` (`to_user_id`)
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
  KEY `idx_user_id` (`user_id`)
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值套餐表';

-- 动态表
CREATE TABLE IF NOT EXISTS `xn_post` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `content` TEXT,
  `images` TEXT,
  `videos` TEXT,
  `thumb_num` INT DEFAULT 0,
  `comment_num` INT DEFAULT 0,
  `share_num` INT DEFAULT 0,
  `tag_id` BIGINT,
  `type` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `is_private` TINYINT(1) DEFAULT 0,
  `private_password` VARCHAR(50),
  `private_price` DECIMAL(10, 2) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表';

-- 动态点赞表
CREATE TABLE IF NOT EXISTS `xn_post_like` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_post_user` (`post_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态点赞表';

-- 动态评论表
CREATE TABLE IF NOT EXISTS `xn_post_comment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `content` TEXT NOT NULL,
  `reply_to` BIGINT,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态评论表';

-- 动态解锁表
CREATE TABLE IF NOT EXISTS `xn_post_unlock` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `price` DECIMAL(10, 2) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
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

-- 红包表
CREATE TABLE IF NOT EXISTS `xn_red_packet` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `room_id` VARCHAR(50),
  `total_money` DECIMAL(10, 2) NOT NULL,
  `total_count` INT NOT NULL,
  `remain_count` INT NOT NULL,
  `type` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `expire_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包表';

-- 红包记录表
CREATE TABLE IF NOT EXISTS `xn_red_packet_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `red_packet_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `money` DECIMAL(10, 2) NOT NULL,
  `is_lucky` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_red_packet_id` (`red_packet_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包记录表';

-- 举报表
CREATE TABLE IF NOT EXISTS `xn_report` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `reporter_id` BIGINT NOT NULL,
  `reported_id` BIGINT NOT NULL,
  `type` TINYINT(1) NOT NULL,
  `reason` TEXT,
  `images` TEXT,
  `status` TINYINT(1) DEFAULT 0,
  `handle_admin_id` BIGINT,
  `handle_result` TEXT,
  `handle_time` INT(10),
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_reported_id` (`reported_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表';

-- 预约表
CREATE TABLE IF NOT EXISTS `xn_reserve` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `virtual_user_id` BIGINT NOT NULL,
  `game_id` BIGINT NOT NULL,
  `reserve_time` INT(10) NOT NULL,
  `duration_hours` INT NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `remark` TEXT,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_virtual_user_id` (`virtual_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';

-- 预约时段表
CREATE TABLE IF NOT EXISTS `xn_reserve_slot` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `virtual_user_id` BIGINT NOT NULL,
  `date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_virtual_user_id` (`virtual_user_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约时段表';

-- 需求表
CREATE TABLE IF NOT EXISTS `xn_demand` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `game_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `budget` DECIMAL(10, 2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求表';

-- 通话记录表
CREATE TABLE IF NOT EXISTS `xn_call_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `caller_id` BIGINT NOT NULL,
  `callee_id` BIGINT NOT NULL,
  `type` TINYINT(1) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `start_time` INT(10),
  `end_time` INT(10),
  `duration` INT DEFAULT 0,
  `room_id` VARCHAR(50),
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_callee_id` (`callee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话记录表';

-- 通话计费表
CREATE TABLE IF NOT EXISTS `xn_call_billing` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `call_record_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `duration` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_call_record_id` (`call_record_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话计费表';

-- 聊天室表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天室表';

-- 聊天记录表
CREATE TABLE IF NOT EXISTS `xn_chat_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `fromid` BIGINT NOT NULL,
  `toid` BIGINT NOT NULL,
  `content` TEXT,
  `type` TINYINT(1) DEFAULT 0,
  `vod_url` VARCHAR(255),
  `sec` INT DEFAULT 0,
  `time` INT(10) DEFAULT 0,
  `isread` TINYINT(1) DEFAULT 0,
  `is_del` TINYINT(1) DEFAULT 0,
  `is_revoked` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_from_to` (`fromid`, `toid`),
  KEY `idx_to_from` (`toid`, `fromid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天记录表';

-- 虚拟聊天历史表
CREATE TABLE IF NOT EXISTS `xn_virtual_chat_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `virtual_user_id` BIGINT NOT NULL,
  `content` TEXT NOT NULL,
  `type` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_virtual_user_id` (`virtual_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟聊天历史表';

-- Banner表
CREATE TABLE IF NOT EXISTS `xn_banner` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255),
  `image` VARCHAR(255) NOT NULL,
  `link_url` VARCHAR(255),
  `sort_order` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Banner表';

-- 卡密表
CREATE TABLE IF NOT EXISTS `xn_card` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `card_no` VARCHAR(50) NOT NULL,
  `card_password` VARCHAR(50) NOT NULL,
  `type` TINYINT(1) NOT NULL,
  `value` DECIMAL(10, 2) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `use_user_id` BIGINT,
  `use_time` INT(10),
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_card_no` (`card_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡密表';

-- 提现表
CREATE TABLE IF NOT EXISTS `xn_withdraw` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `account` VARCHAR(255) NOT NULL,
  `status` TINYINT(1) DEFAULT 0,
  `remark` TEXT,
  `handle_admin_id` BIGINT,
  `handle_time` INT(10),
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现表';

-- 相册表
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

-- 相册照片表
CREATE TABLE IF NOT EXISTS `xn_album_photo` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `album_id` BIGINT NOT NULL,
  `photo_url` VARCHAR(255) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_album_id` (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册照片表';

-- 陪玩师资料表
CREATE TABLE IF NOT EXISTS `xn_companion_profile` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `game_ids` TEXT,
  `skill_level` VARCHAR(50),
  `price_per_hour` DECIMAL(10, 2) DEFAULT 0,
  `intro` TEXT,
  `online_status` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪玩师资料表';

-- 游戏订单表
CREATE TABLE IF NOT EXISTS `xn_game_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(50) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `game_id` BIGINT NOT NULL,
  `game_name` VARCHAR(50),
  `companion_id` BIGINT NOT NULL,
  `companion_name` VARCHAR(50),
  `duration` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `remark` TEXT,
  `create_time` INT(10) DEFAULT 0,
  `start_time` INT(10),
  `end_time` INT(10),
  `cancel_time` INT(10),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏订单表';

SET FOREIGN_KEY_CHECKS = 1;
