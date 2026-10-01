-- 虚拟人随机在线功能：新增配置字段（在线时段 + 随机在线时长）
-- 在目标数据库执行一次即可，可重复执行（IF NOT EXISTS 保护）

ALTER TABLE `xn_virtual_user`
  ADD COLUMN `random_online` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '随机在线开关：0-关闭（手动管理在线状态），1-开启（按在线时段与时长随机上下线）' AFTER `online_status`,
  ADD COLUMN `online_time_start` VARCHAR(5) NOT NULL DEFAULT '09:00' COMMENT '允许在线时段开始（HH:mm）' AFTER `random_online`,
  ADD COLUMN `online_time_end` VARCHAR(5) NOT NULL DEFAULT '23:00' COMMENT '允许在线时段结束（HH:mm），可跨天如 22:00-02:00' AFTER `online_time_start`,
  ADD COLUMN `online_duration_min` INT NOT NULL DEFAULT 30 COMMENT '每次随机在线最短时长（分钟）' AFTER `online_time_end`,
  ADD COLUMN `online_duration_max` INT NOT NULL DEFAULT 90 COMMENT '每次随机在线最长时长（分钟）' AFTER `online_duration_min`,
  ADD COLUMN `online_until` INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '本次在线到期时间戳，0-未设置' AFTER `online_duration_max`;
