CREATE TABLE IF NOT EXISTS xn_system_settings (
  id INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(64) NOT NULL,
  `value` TEXT,
  `group` VARCHAR(32) DEFAULT 'general',
  remark VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_key (`key`),
  KEY idx_group (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO xn_system_settings (`key`, `value`, `group`, remark) VALUES
('shareEnabled', 'true', 'system', '分享功能开关'),
('shareRewardEnabled', 'false', 'share', '分享奖励开关'),
('shareRewardAmount', '0', 'share', '每次分享奖励金额'),
('siteName', 'eu搭子', 'system', '站点名称'),
('giftEnabled', 'true', 'system', '礼物功能开关'),
('voiceChatEnabled', 'false', 'system', '语音通话开关'),
('videoChatEnabled', 'false', 'system', '视频通话开关'),
('registerEnabled', 'true', 'system', '注册功能开关'),
('userInitBalance', '0', 'recharge', '新用户初始余额'),
('withdrawMinAmount', '50', 'recharge', '最低提现金额'),
('withdrawFeeRate', '0.02', 'recharge', '提现手续费率');
