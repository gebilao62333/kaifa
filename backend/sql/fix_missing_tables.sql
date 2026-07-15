-- ============================================
-- 批量创建缺失的业务表
-- 生成时间: 2026-07-15
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 虚拟用户表
CREATE TABLE IF NOT EXISTS `xn_virtual_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `avatar` VARCHAR(255) NOT NULL,
  `gender` TINYINT(1) DEFAULT 0 COMMENT '性别：0未知 1男 2女',
  `age` INT DEFAULT 0,
  `region` VARCHAR(50),
  `tags` TEXT COMMENT '标签JSON',
  `intro` TEXT,
  `price_per_hour` DECIMAL(10, 2) DEFAULT 0,
  `online_status` TINYINT(1) DEFAULT 0 COMMENT '在线状态',
  `is_recommend` TINYINT(1) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_online_status` (`online_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟用户表';

-- 陪玩师资料表
CREATE TABLE IF NOT EXISTS `xn_companion_profile` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `game_id` BIGINT NOT NULL COMMENT '游戏ID',
  `price` DECIMAL(10, 2) DEFAULT 0 COMMENT '服务价格/小时',
  `tags` VARCHAR(255) DEFAULT NULL COMMENT '标签逗号分隔',
  `voice_intro` VARCHAR(500) DEFAULT NULL COMMENT '语音介绍URL',
  `voice_time` INT DEFAULT 0 COMMENT '语音时长秒',
  `star` DECIMAL(2, 1) DEFAULT 5.0 COMMENT '评分',
  `order_num` INT DEFAULT 0 COMMENT '接单数',
  `pingjia_num` INT DEFAULT 0 COMMENT '评价数',
  `status` TINYINT DEFAULT 0 COMMENT '0未申请 1审核中 2通过 3拒绝',
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_game_id` (`game_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪玩师资料表';

-- 游戏订单表
CREATE TABLE IF NOT EXISTS `xn_game_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `user_id` BIGINT NOT NULL COMMENT '下单用户ID',
  `target_user_id` BIGINT NOT NULL COMMENT '陪玩师ID',
  `game_id` BIGINT NOT NULL COMMENT '游戏ID',
  `game_name` VARCHAR(50) DEFAULT '' COMMENT '游戏名称',
  `price` DECIMAL(10, 2) DEFAULT 0 COMMENT '单价',
  `num` INT DEFAULT 1 COMMENT '数量/小时数',
  `total_price` DECIMAL(10, 2) DEFAULT 0 COMMENT '总价',
  `status` TINYINT DEFAULT 0 COMMENT '0待接单 1已接单 2进行中 3已完成 4已取消',
  `remark` VARCHAR(255) DEFAULT NULL,
  `create_time` INT(10) DEFAULT 0,
  `add_time` INT(10) DEFAULT 0,
  `start_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  `user_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target_user_id` (`target_user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏订单表';

-- 充值订单表
CREATE TABLE IF NOT EXISTS `xn_order_chong` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `cid` BIGINT NOT NULL COMMENT '套餐ID',
  `money` DECIMAL(10, 2) DEFAULT 0 COMMENT '金额',
  `gold_coins` INT DEFAULT 0 COMMENT '金币数',
  `money_zeng` DECIMAL(10, 2) DEFAULT 0 COMMENT '赠送金额',
  `pay_type` TINYINT DEFAULT 1 COMMENT '支付方式',
  `pay_no` VARCHAR(64) DEFAULT NULL COMMENT '第三方支付号',
  `status` TINYINT DEFAULT 0 COMMENT '0待支付 1已完成 2已取消',
  `currency` VARCHAR(10) DEFAULT 'CNY',
  `create_time` INT(10) DEFAULT 0,
  `pay_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值订单表';

-- VIP订单表
CREATE TABLE IF NOT EXISTS `xn_vip_order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `user_id` BIGINT NOT NULL,
  `package_id` BIGINT NOT NULL,
  `money` DECIMAL(10, 2) DEFAULT 0,
  `pay_type` TINYINT DEFAULT 1,
  `status` TINYINT DEFAULT 0,
  `expire_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `pay_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP订单表';

-- VIP套餐表
CREATE TABLE IF NOT EXISTS `xn_vip_package` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `title` VARCHAR(50) NOT NULL,
  `duration_days` INT NOT NULL COMMENT '有效天数',
  `price` DECIMAL(10, 2) NOT NULL,
  `original_price` DECIMAL(10, 2) DEFAULT NULL,
  `level` INT DEFAULT 1 COMMENT 'VIP等级',
  `benefits` TEXT COMMENT '权益描述JSON',
  `icon` VARCHAR(255) DEFAULT NULL,
  `sort` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP套餐表';

-- 充值卡表
CREATE TABLE IF NOT EXISTS `xn_card` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `card_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '卡密',
  `face_value` DECIMAL(10, 2) DEFAULT 0 COMMENT '面值',
  `coin_amount` INT DEFAULT 0 COMMENT '金币数量',
  `status` TINYINT DEFAULT 0 COMMENT '0未使用 1已使用 2已禁用',
  `use_user_id` BIGINT DEFAULT NULL,
  `use_time` INT(10) DEFAULT 0,
  `expire_time` INT(10) DEFAULT 0,
  `batch_id` VARCHAR(32) DEFAULT NULL COMMENT '批次号',
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_card_no` (`card_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值卡表';

-- 提现记录表
CREATE TABLE IF NOT EXISTS `xn_withdraw` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `type` TINYINT DEFAULT 1 COMMENT '提现方式 1微信 2支付宝 3银行卡',
  `account` VARCHAR(100) DEFAULT NULL COMMENT '账号',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `status` TINYINT DEFAULT 0 COMMENT '0待审核 1通过 2拒绝',
  `admin_id` BIGINT DEFAULT NULL,
  `remark` VARCHAR(255) DEFAULT NULL,
  `audit_time` INT(10) DEFAULT 0,
  `complete_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

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
  `tag_id` BIGINT DEFAULT NULL,
  `type` TINYINT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `is_private` TINYINT DEFAULT 0,
  `private_password` VARCHAR(50) DEFAULT NULL,
  `private_price` DECIMAL(10, 2) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表';

-- 动态评论表
CREATE TABLE IF NOT EXISTS `xn_post_comment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `parent_id` BIGINT DEFAULT 0 COMMENT '父评论ID',
  `to_user_id` BIGINT DEFAULT NULL COMMENT '回复对象',
  `content` TEXT NOT NULL,
  `status` TINYINT DEFAULT 1,
  `like_num` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态评论表';

-- 动态点赞表
CREATE TABLE IF NOT EXISTS `xn_post_like` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_post_user` (`post_id`, `user_id`),
  KEY `idx_post_id` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态点赞表';

-- 动态解锁表
CREATE TABLE IF NOT EXISTS `xn_post_unlock` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `amount` DECIMAL(10, 2) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_post_user` (`post_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态解锁表';

-- 礼物包表
CREATE TABLE IF NOT EXISTS `xn_gift_bag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) NOT NULL,
  `image` VARCHAR(255),
  `price` DECIMAL(10, 2) DEFAULT 0,
  `gifts` TEXT COMMENT '包含礼物JSON',
  `status` TINYINT DEFAULT 1,
  `sort` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物包表';

-- 礼物记录表
CREATE TABLE IF NOT EXISTS `xn_gift_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `from_user_id` BIGINT NOT NULL COMMENT '送礼者',
  `to_user_id` BIGINT NOT NULL COMMENT '收礼者',
  `gift_id` BIGINT NOT NULL COMMENT '礼物ID',
  `gift_name` VARCHAR(50) DEFAULT NULL,
  `gift_image` VARCHAR(255) DEFAULT NULL,
  `num` INT DEFAULT 1 COMMENT '数量',
  `money` DECIMAL(10, 2) DEFAULT 0 COMMENT '花费金额',
  `room_id` INT DEFAULT NULL COMMENT '房间ID（房间内送礼）',
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_from_user` (`from_user_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物记录表';

-- 红包表
CREATE TABLE IF NOT EXISTS `xn_red_packet` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `room_id` INT NOT NULL COMMENT '房间ID',
  `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
  `total_money` DECIMAL(10, 2) NOT NULL COMMENT '总金额',
  `total_count` INT NOT NULL COMMENT '总个数',
  `remain_count` INT NOT NULL COMMENT '剩余个数',
  `remain_money` DECIMAL(10, 2) NOT NULL COMMENT '剩余金额',
  `greeting` VARCHAR(100) DEFAULT NULL COMMENT '祝福语',
  `type` TINYINT DEFAULT 1 COMMENT '1普通红包 2拼手气红包',
  `status` TINYINT DEFAULT 0 COMMENT '0进行中 1已抢完 2已退回',
  `create_time` INT(10) DEFAULT 0,
  `finish_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_room_id` (`room_id`),
  KEY `idx_sender_id` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包表';

-- 红包领取记录表
CREATE TABLE IF NOT EXISTS `xn_red_packet_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `packet_id` BIGINT NOT NULL COMMENT '红包ID',
  `user_id` BIGINT NOT NULL COMMENT '领用者',
  `money` DECIMAL(10, 2) NOT NULL COMMENT '领取金额',
  `is_best` TINYINT DEFAULT 0 COMMENT '是否运气王',
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_packet_id` (`packet_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包领取记录表';

-- 相册照片表
CREATE TABLE IF NOT EXISTS `xn_album_photo` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `url` VARCHAR(500) NOT NULL COMMENT '图片URL',
  `thumb_url` VARCHAR(500) DEFAULT NULL COMMENT '缩略图',
  `sort` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册照片表';

-- 音视频通话记录表
CREATE TABLE IF NOT EXISTS `xn_call_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `caller_id` BIGINT NOT NULL COMMENT '发起者ID',
  `callee_id` BIGINT NOT NULL COMMENT '接收者ID',
  `call_type` TINYINT DEFAULT 1 COMMENT '1语音 2视频',
  `duration` INT DEFAULT 0 COMMENT '通话时长秒',
  `status` TINYINT DEFAULT 0 COMMENT '0进行中 1已完成 2未接听 3已取消',
  `room_id` VARCHAR(64) DEFAULT NULL COMMENT 'TRTC房间号',
  `fee` DECIMAL(10, 2) DEFAULT 0 COMMENT '费用',
  `create_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_callee_id` (`callee_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话记录表';

-- 通话计费表
CREATE TABLE IF NOT EXISTS `xn_call_billing` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `call_id` BIGINT NOT NULL COMMENT '通话记录ID',
  `caller_id` BIGINT NOT NULL,
  `callee_id` BIGINT NOT NULL,
  `duration` INT DEFAULT 0 COMMENT '计费时长秒`,
  `rate` DECIMAL(10, 2) DEFAULT 0 COMMENT '费率',
  `amount` DECIMAL(10, 2) DEFAULT 0 COMMENT '费用',
  `billing_type` TINYINT DEFAULT 1 COMMENT '1计时 2计次',
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_call_id` (`call_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话计费表';

-- 聊天日志表
CREATE TABLE IF NOT EXISTS `xn_chat_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `from_user_id` BIGINT NOT NULL,
  `to_user_id` BIGINT NOT NULL,
  `content` TEXT,
  `msg_type` TINYINT DEFAULT 1 COMMENT '1文本 2图片 3语音 4视频',
  `is_read` TINYINT DEFAULT 0,
  `revoke_time` INT(10) DEFAULT NULL COMMENT '撤回时间戳',
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_from_to` (`from_user_id`, `to_user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天日志表';

-- 需求表
CREATE TABLE IF NOT EXISTS `xn_demand` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `content` TEXT,
  `game_id` BIGINT DEFAULT NULL,
  `budget_min` DECIMAL(10, 2) DEFAULT 0,
  `budget_max` DECIMAL(10, 2) DEFAULT 0,
  `status` TINYINT DEFAULT 0 COMMENT '0进行中 1已完成 2已关闭',
  `view_count` INT DEFAULT 0,
  `apply_count` INT DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求表';

-- 举报表
CREATE TABLE IF NOT EXISTS `xn_report` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `reporter_id` BIGINT NOT NULL COMMENT '举报人',
  `target_type` VARCHAR(20) NOT NULL COMMENT '举报类型 user/post/comment等',
  `target_id` BIGINT NOT NULL COMMENT '被举报对象ID',
  `reason` VARCHAR(200) NOT NULL COMMENT '举报原因',
  `detail` TEXT DEFAULT NULL COMMENT '详细说明',
  `evidence_images` TEXT DEFAULT NULL COMMENT '证据图片',
  `status` TINYINT DEFAULT 0 COMMENT '0待处理 1处理中 2已完成',
  `handler_id` BIGINT DEFAULT NULL,
  `handle_result` VARCHAR(255) DEFAULT NULL,
  `handle_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表';

-- 预约表
CREATE TABLE IF NOT EXISTS `xn_reserve` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '预约用户',
  `companion_id` BIGINT NOT NULL COMMENT '陪玩师',
  `game_id` BIGINT NOT NULL,
  `reserve_date` DATE NOT NULL COMMENT '预约日期',
  `time_slot_id` BIGINT NOT NULL COMMENT '时段ID',
  `duration_hours` INT DEFAULT 1 COMMENT '预约小时数',
  `total_price` DECIMAL(10, 2) DEFAULT 0,
  `remark` VARCHAR(255) DEFAULT NULL,
  `status` TINYINT DEFAULT 0 COMMENT '0待确认 1已确认 2进行中 3已完成 4已取消',
  `confirm_time` INT(10) DEFAULT 0,
  `cancel_reason` VARCHAR(255) DEFAULT NULL,
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_companion_id` (`companion_id`),
  KEY `idx_reserve_date` (`reserve_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';

-- 预约时段表
CREATE TABLE IF NOT EXISTS `xn_reserve_slot` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `companion_id` BIGINT NOT NULL COMMENT '陪玩师ID',
  `date` DATE NOT NULL COMMENT '日期',
  `start_time` TIME NOT NULL COMMENT '开始时间',
  `end_time` TIME NOT NULL COMMENT '结束时间',
  `max_count` INT DEFAULT 1 COMMENT '最大可预约人数',
  `booked_count` INT DEFAULT 0 COMMENT '已预约数',
  `status` TINYINT DEFAULT 1 COMMENT '0不可预约 1可预约',
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_companion_date` (`companion_id`, `date`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约时段表';

-- 标签表
CREATE TABLE IF NOT EXISTS `xn_tag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(30) DEFAULT NULL,
  `icon` VARCHAR(255) DEFAULT NULL,
  `type` TINYINT DEFAULT 1 COMMENT '1游戏标签 2技能标签 3性格标签',
  `sort` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';

-- 虚拟聊天历史表
CREATE TABLE IF NOT EXISTS `xn_virtual_chat_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `virtual_user_id` BIGINT NOT NULL COMMENT '虚拟用户ID',
  `real_user_id` BIGINT NOT NULL COMMENT '真实用户ID',
  `role` TINYINT DEFAULT 1 COMMENT '1虚拟用户 2真实用户',
  `content` TEXT NOT NULL,
  `msg_type` TINYINT DEFAULT 1 COMMENT '1文本 2图片 3语音',
  `session_id` VARCHAR(64) DEFAULT NULL,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_virtual_real` (`virtual_user_id`, `real_user_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟聊天历史表';

-- Banner轮播表
CREATE TABLE IF NOT EXISTS `xn_banner` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `link` VARCHAR(500) DEFAULT NULL,
  `position` VARCHAR(20) DEFAULT 'home' COMMENT '位置 home/discover/profile',
  `sort` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `start_time` INT(10) DEFAULT 0,
  `end_time` INT(10) DEFAULT 0,
  `create_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_position` (`position`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Banner轮播表';

SET FOREIGN_KEY_CHECKS = 1;

-- 完成提示
SELECT 'All missing tables created successfully!' AS message;
