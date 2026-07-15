-- 演示数据（匹配模型新结构）
SET NAMES utf8mb4;

-- 用户
INSERT INTO `xn_user` (`id`, `username`, `nickname`, `avatar`, `mobile`, `password`, `money`, `lv`, `vip`, `vip_lv`, `sex`, `city`, `status`, `fans_num`, `create_time`, `dec`) VALUES
(1, 'user001', '游戏达人小王', 'https://picsum.photos/100/100?random=1', '13800138001', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 5000.00, 5, 1, 2, 1, '北京', 0, 120, UNIX_TIMESTAMP(), '喜欢玩各种游戏'),
(2, 'user002', '甜心小柔', 'https://picsum.photos/100/100?random=2', '13800138002', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 1200.00, 3, 0, 0, 0, '上海', 0, 35, UNIX_TIMESTAMP(), '温柔陪玩'),
(3, 'user003', '电竞老张', 'https://picsum.photos/100/100?random=3', '13800138003', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 800.00, 6, 1, 3, 1, '广州', 0, 200, UNIX_TIMESTAMP(), '上分神器'),
(4, 'user004', '萌妹阿狸', 'https://picsum.photos/100/100?random=4', '13800138004', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 3000.00, 4, 0, 0, 0, '深圳', 0, 88, UNIX_TIMESTAMP(), '声控福利'),
(5, 'user005', '王者教练', 'https://picsum.photos/100/100?random=5', '13800138005', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 1500.00, 7, 1, 1, 1, '杭州', 0, 156, UNIX_TIMESTAMP(), '专注王者荣耀'),
(6, 'user006', '吃鸡女王', 'https://picsum.photos/100/100?random=6', '13800138006', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 900.00, 5, 0, 0, 0, '成都', 0, 64, UNIX_TIMESTAMP(), '绝地求生带飞'),
(7, 'user007', '原神向导', 'https://picsum.photos/100/100?random=7', '13800138007', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 2200.00, 4, 1, 2, 1, '武汉', 0, 99, UNIX_TIMESTAMP(), '原神全图鉴'),
(8, 'user008', '全能陪玩', 'https://picsum.photos/100/100?random=8', '13800138008', '$2a$10$AOCGkiLbZHHGe88qD2kpTeaFXVAQrsU/GE5dN5olUkpaNPdEXng1G', 600.00, 3, 0, 0, 1, '西安', 0, 42, UNIX_TIMESTAMP(), '样样都行');

-- 游戏
INSERT INTO `xn_game` (`id`, `name`, `image`, `image_bg`, `status`, `sort`, `create_time`) VALUES
(1, '王者荣耀', 'https://picsum.photos/200/200?random=11', 'https://picsum.photos/600/300?random=11', 1, 1, UNIX_TIMESTAMP()),
(2, '和平精英', 'https://picsum.photos/200/200?random=12', 'https://picsum.photos/600/300?random=12', 1, 2, UNIX_TIMESTAMP()),
(3, '英雄联盟', 'https://picsum.photos/200/200?random=13', 'https://picsum.photos/600/300?random=13', 1, 3, UNIX_TIMESTAMP()),
(4, '原神', 'https://picsum.photos/200/200?random=14', 'https://picsum.photos/600/300?random=14', 1, 4, UNIX_TIMESTAMP()),
(5, '绝地求生', 'https://picsum.photos/200/200?random=15', 'https://picsum.photos/600/300?random=15', 1, 5, UNIX_TIMESTAMP()),
(6, '永劫无间', 'https://picsum.photos/200/200?random=16', 'https://picsum.photos/600/300?random=16', 1, 6, UNIX_TIMESTAMP());

-- 陪玩师资料（status=2 表示通过审核，会在前端展示）
INSERT INTO `xn_companion_profile` (`user_id`, `game_id`, `price`, `tags`, `voice_intro`, `voice_time`, `order_num`, `income_total`, `pingjia_num`, `star`, `status`, `create_time`, `update_time`) VALUES
(1, 1, 30.00, '上分,辅助,幽默', 'https://example.com/voice/1.mp3', 12, 128, 3840.00, 120, 4.9, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 1, 25.00, '甜美,声控,聊天', 'https://example.com/voice/2.mp3', 8, 86, 2150.00, 80, 4.8, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, 3, 40.00, '代练,上分,专业', NULL, 0, 210, 8400.00, 200, 5.0, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, 2, 28.00, '萌妹,娱乐,带飞', 'https://example.com/voice/4.mp3', 15, 64, 1792.00, 60, 4.7, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, 1, 50.00, '教练,教学,排位', 'https://example.com/voice/5.mp3', 20, 156, 7800.00, 150, 4.9, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(6, 5, 35.00, '吃鸡,刚枪,带飞', NULL, 0, 92, 3220.00, 90, 4.8, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(7, 4, 32.00, '攻略,探索,陪玩', 'https://example.com/voice/7.mp3', 10, 73, 2336.00, 70, 4.9, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(8, 6, 26.00, '全能,娱乐,上分', 'https://example.com/voice/8.mp3', 9, 51, 1326.00, 50, 4.6, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- Banner
INSERT INTO `xn_banner` (`title`, `image`, `link`, `type`, `sort`, `status`, `create_time`) VALUES
('暑期陪玩狂欢', 'https://picsum.photos/600/300?random=21', '/games', 1, 1, 1, UNIX_TIMESTAMP()),
('新人首单立减', 'https://picsum.photos/600/300?random=22', '/recharge', 1, 2, 1, UNIX_TIMESTAMP()),
('VIP 特权上线', 'https://picsum.photos/600/300?random=23', '/vip', 1, 3, 1, UNIX_TIMESTAMP());

-- 礼物
INSERT INTO `xn_gift` (`title`, `image`, `svga`, `money`, `type`, `is_vip`, `tian`, `status`, `sort`) VALUES
('玫瑰', 'https://picsum.photos/100/100?random=31', '', 10.00, 0, 0, 0, 1, 1),
('跑车', 'https://picsum.photos/100/100?random=32', '', 500.00, 0, 0, 0, 1, 2),
('火箭', 'https://picsum.photos/100/100?random=33', '', 1000.00, 0, 1, 0, 1, 3),
('钻戒', 'https://picsum.photos/100/100?random=34', '', 999.00, 0, 1, 0, 1, 4),
('爱心', 'https://picsum.photos/100/100?random=35', '', 1.00, 0, 0, 0, 1, 5),
('皇冠', 'https://picsum.photos/100/100?random=36', '', 666.00, 0, 1, 0, 1, 6);

-- VIP 套餐
INSERT INTO `xn_vip_package` (`name`, `price`, `original_price`, `duration`, `level`, `hot`, `sort`, `status`, `create_time`) VALUES
('VIP月卡', 30.00, 45.00, 30, 1, 1, 1, 1, UNIX_TIMESTAMP()),
('VIP季卡', 80.00, 120.00, 90, 2, 0, 2, 1, UNIX_TIMESTAMP()),
('VIP年卡', 288.00, 400.00, 365, 3, 1, 3, 1, UNIX_TIMESTAMP());

-- 充值套餐
INSERT INTO `xn_recharge_package` (`title`, `money`, `coin`, `coin_zeng`, `is_zeng`, `sort`, `status`, `create_time`) VALUES
('6元礼包', 6.00, 60, 0, 0, 1, 1, UNIX_TIMESTAMP()),
('30元礼包', 30.00, 300, 30, 1, 2, 1, UNIX_TIMESTAMP()),
('98元礼包', 98.00, 980, 120, 1, 3, 1, UNIX_TIMESTAMP()),
('328元礼包', 328.00, 3280, 500, 1, 4, 1, UNIX_TIMESTAMP());
