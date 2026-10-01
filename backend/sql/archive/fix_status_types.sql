-- 转换状态值并修改列类型
UPDATE `eudazi`.`xn_game_order` SET `status` = '0' WHERE `status` = 'pending' OR `status` NOT IN ('0','1','2','3','4');
ALTER TABLE `eudazi`.`xn_game_order` MODIFY COLUMN `status` TINYINT(1) DEFAULT 0 COMMENT '0待接单 1已接单 2进行中 3已完成 4已取消';

UPDATE `eudazi`.`xn_withdraw` SET `type` = '1' WHERE `type` IS NULL OR `type` = '';
ALTER TABLE `eudazi`.`xn_withdraw` MODIFY COLUMN `type` TINYINT(1) DEFAULT 1 COMMENT '提现方式 1微信 2支付宝 3银行卡';

SELECT 'Status types fixed successfully' AS message;
