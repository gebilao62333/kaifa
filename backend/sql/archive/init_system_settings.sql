-- 系统设置表
CREATE TABLE IF NOT EXISTS `xn_system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(64) NOT NULL COMMENT '设置键名',
  `value` text COMMENT '设置值',
  `group` varchar(32) DEFAULT 'general' COMMENT '分组',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`),
  KEY `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

-- 插入默认设置
INSERT IGNORE INTO `xn_system_settings` (`key`, `value`, `group`, `remark`) VALUES
('siteName', 'eu搭子', 'system', '站点名称'),
('siteDescription', 'eu搭子 - 专业游戏陪玩平台', 'system', '站点描述'),
('siteKeywords', '陪玩,游戏陪玩,陪玩平台', 'system', 'SEO关键词'),
('contactEmail', 'admin@eudazi.com', 'system', '联系邮箱'),
('contactPhone', '400-888-8888', 'system', '联系电话'),
('userInitBalance', '0', 'recharge', '新用户初始余额'),
('withdrawMinAmount', '50', 'recharge', '最低提现金额'),
('withdrawFeeRate', '0.02', 'recharge', '提现手续费率'),
('registerEnabled', 'true', 'system', '注册功能开关'),
('registerNeedPhone', 'true', 'system', '注册需手机号'),
('registerNeedRealName', 'false', 'system', '注册需实名'),
('reviewContentEnabled', 'true', 'system', '内容审核开关'),
('giftEnabled', 'true', 'system', '礼物功能开关'),
('voiceChatEnabled', 'false', 'system', '语音通话开关'),
('videoChatEnabled', 'false', 'system', '视频通话开关'),
('shareEnabled', 'true', 'system', '分享功能开关'),
('shareRewardEnabled', 'false', 'share', '分享奖励开关'),
('shareRewardAmount', '0', 'share', '每次分享奖励金额');
