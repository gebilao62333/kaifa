-- ============================================
-- Admin Backend Schema Migration
-- Fix mismatches between Sequelize models and DB
-- ============================================

USE eudazi;

-- 1. xn_game_order: Add missing columns
ALTER TABLE xn_game_order 
  ADD COLUMN target_user_id BIGINT DEFAULT NULL AFTER companion_id,
  ADD COLUMN num INT DEFAULT 1 AFTER price,
  ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0.00 AFTER num,
  ADD COLUMN add_time INT DEFAULT 0 AFTER create_time,
  ADD COLUMN user_time INT DEFAULT 0 AFTER add_time,
  ADD COLUMN star DECIMAL(2,1) DEFAULT 5.0 AFTER user_time,
  ADD COLUMN content TEXT AFTER star,
  ADD COLUMN status_zong TINYINT(1) DEFAULT 0 AFTER content,
  ADD COLUMN pingjia_status TINYINT(1) DEFAULT 0 AFTER status_zong,
  ADD COLUMN pingjia_time INT DEFAULT 0 AFTER pingjia_status,
  ADD COLUMN games_server_id INT DEFAULT 0 AFTER pingjia_time,
  ADD COLUMN games_server_name VARCHAR(50) AFTER games_server_id,
  ADD COLUMN game_role_id VARCHAR(50) AFTER games_server_name,
  ADD COLUMN game_role_name VARCHAR(50) AFTER game_role_id,
  ADD COLUMN voice_url VARCHAR(255) AFTER game_role_name;

-- 2. xn_withdraw: Add missing columns
ALTER TABLE xn_withdraw
  ADD COLUMN money DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER amount,
  ADD COLUMN pay_money DECIMAL(10,2) DEFAULT 0.00 AFTER money,
  ADD COLUMN shouxufei DECIMAL(10,2) DEFAULT 0.00 AFTER pay_money,
  ADD COLUMN bank VARCHAR(255) AFTER account,
  ADD COLUMN name VARCHAR(50) AFTER bank,
  ADD COLUMN mobile VARCHAR(16) AFTER name,
  ADD COLUMN image VARCHAR(255) AFTER mobile,
  ADD COLUMN is_check TINYINT(1) DEFAULT 0 AFTER status,
  ADD COLUMN state VARCHAR(20) AFTER is_check,
  ADD COLUMN wx_ti_id VARCHAR(50) AFTER state,
  ADD COLUMN lailu VARCHAR(20) AFTER wx_ti_id,
  ADD COLUMN channel VARCHAR(20) DEFAULT 'gift' AFTER lailu,
  ADD COLUMN currency VARCHAR(10) AFTER channel;

-- 3. Create xn_system_settings table
CREATE TABLE IF NOT EXISTS xn_system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_name VARCHAR(100) DEFAULT '',
  site_logo VARCHAR(255) DEFAULT '',
  site_description TEXT,
  site_keywords VARCHAR(255) DEFAULT '',
  contact_email VARCHAR(100) DEFAULT '',
  customer_service_url VARCHAR(255) DEFAULT '',
  min_withdraw_amount DECIMAL(10,2) DEFAULT 10.00,
  max_withdraw_amount DECIMAL(10,2) DEFAULT 50000.00,
  min_recharge_amount DECIMAL(10,2) DEFAULT 10.00,
  share_title VARCHAR(100) DEFAULT '',
  share_desc VARCHAR(255) DEFAULT '',
  share_image VARCHAR(255) DEFAULT '',
  android_version VARCHAR(20) DEFAULT '',
  android_download_url VARCHAR(255) DEFAULT '',
  ios_version VARCHAR(20) DEFAULT '',
  ios_download_url VARCHAR(255) DEFAULT '',
  maintenance_mode TINYINT(1) DEFAULT 0,
  maintenance_msg TEXT,
  update_time INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO xn_system_settings (id) VALUES (1);
