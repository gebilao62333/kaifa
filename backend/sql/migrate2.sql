SET SESSION sql_mode = '';

DROP TABLE IF EXISTS xn_system_settings;
CREATE TABLE xn_system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(64) NOT NULL,
  value TEXT,
  `group` VARCHAR(32) DEFAULT 'general',
  remark VARCHAR(255),
  UNIQUE KEY uk_key (`key`),
  INDEX idx_group (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS virtual_user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  avatar VARCHAR(255),
  `role` VARCHAR(30) DEFAULT 'default',
  personality TEXT,
  dialogue_style VARCHAR(50) DEFAULT 'friendly',
  description TEXT,
  model_config TEXT,
  status TINYINT(1) DEFAULT 1,
  is_online TINYINT(1) DEFAULT 1,
  context_expire_time INT DEFAULT 3600,
  max_context_length INT DEFAULT 50,
  permissions TEXT,
  create_time INT DEFAULT 0,
  update_time INT DEFAULT 0,
  UNIQUE KEY uk_username (username),
  INDEX idx_status (status),
  INDEX idx_is_online (is_online),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
