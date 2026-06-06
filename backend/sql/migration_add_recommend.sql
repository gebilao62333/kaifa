-- 推荐管理表
CREATE TABLE IF NOT EXISTS `xn_recommend` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `nickname` VARCHAR(50),
  `avatar` VARCHAR(255),
  `recommend_type` VARCHAR(20) NOT NULL DEFAULT 'home' COMMENT 'home=首页推荐, square=广场推荐',
  `start_time` INT(10) DEFAULT 0 COMMENT '推荐开始时间（Unix秒）',
  `end_time` INT(10) DEFAULT 0 COMMENT '推荐结束时间（Unix秒）',
  `is_top` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1 COMMENT '1=进行中, 0=已过期',
  `create_time` INT(10) DEFAULT 0,
  `update_time` INT(10) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_recommend_type` (`recommend_type`),
  KEY `idx_status` (`status`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐管理表';
