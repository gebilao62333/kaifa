-- 管理员系统数据库初始化SQL
-- 请根据实际情况调整表前缀

-- 创建管理员角色表
CREATE TABLE IF NOT EXISTS `xn_admin_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(60) NOT NULL COMMENT '角色名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
  `permissions` TEXT DEFAULT NULL COMMENT '权限列表(JSON格式)',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态：0禁用 1正常',
  `is_super` TINYINT(1) DEFAULT 0 COMMENT '是否超级管理员：0否 1是',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `create_time` INT DEFAULT 0 COMMENT '创建时间',
  `create_admin_id` BIGINT DEFAULT NULL COMMENT '创建者ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色表';

-- 创建管理员表
CREATE TABLE IF NOT EXISTS `xn_admin` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` VARCHAR(60) NOT NULL COMMENT '管理员用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `phone` VARCHAR(16) DEFAULT NULL COMMENT '手机号',
  `role_id` BIGINT DEFAULT 0 COMMENT '角色ID',
  `permissions` TEXT DEFAULT NULL COMMENT '权限列表(JSON格式)',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态：0禁用 1正常',
  `last_login_time` INT DEFAULT 0 COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(15) DEFAULT NULL COMMENT '最后登录IP',
  `create_time` INT DEFAULT 0 COMMENT '创建时间',
  `create_admin_id` BIGINT DEFAULT NULL COMMENT '创建者ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';
