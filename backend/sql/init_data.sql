-- ============================================
-- 多客陪玩 - 虚拟数据初始化脚本
-- ============================================

-- 管理员角色
INSERT INTO `xn_admin_role` (`id`, `name`, `description`, `permissions`, `status`, `is_super`, `sort`, `create_time`) VALUES
(1, '超级管理员', '拥有所有权限', '["all"]', 1, 1, 1, UNIX_TIMESTAMP());

-- 管理员 (密码: admin123)
INSERT INTO `xn_admin` (`id`, `username`, `password`, `nickname`, `role_id`, `status`, `create_time`) VALUES
(1, 'admin', '$2a$10$YourPasswordHash', '系统管理员', 1, 1, UNIX_TIMESTAMP());

-- 用户数据
INSERT INTO `xn_user` (`id`, `username`, `nickname`, `avatar`, `mobile`, `email`, `money`, `gift_money`, `score`, `lv`, `vip`, `vip_lv`, `vip_expire_time`, `sex`, `city`, `status`, `fans_num`, `create_time`, `last_login_time`, `dec`) VALUES
(1, 'user001', '游戏达人小王', 'https://picsum.photos/100/100?random=1', '13800138001', 'user1@example.com', 5000.00, 200.00, 1500, 5, 1, 2, UNIX_TIMESTAMP() + 86400*30, 1, '北京', 0, 120, UNIX_TIMESTAMP() - 86400*30, UNIX_TIMESTAMP() - 3600, '喜欢玩各种游戏'),
(2, 'user002', '玩家小美', 'https://picsum.photos/100/100?random=2', '13800138002', 'user2@example.com', 1200.00, 50.00, 300, 3, 0, 0, 0, 0, '上海', 0, 35, UNIX_TIMESTAMP() - 86400*20, UNIX_TIMESTAMP() - 7200, ''),
(3, 'user003', '新手玩家', 'https://picsum.photos/100/100?random=3', '13800138003', 'user3@example.com', 0.00, 0.00, 0, 1, 0, 0, 0, 1, '广州', 1, 0, UNIX_TIMESTAMP() - 86400*10, UNIX_TIMESTAMP() - 86400, '刚注册的用户'),
(4, 'user004', '游戏爱好者', 'https://picsum.photos/100/100?random=4', '13800138004', 'user4@example.com', 800.00, 100.00, 200, 2, 0, 0, 0, 0, '深圳', 0, 15, UNIX_TIMESTAMP() - 86400*5, UNIX_TIMESTAMP() - 18000, '新人报道'),
(5, 'user005', '资深玩家', 'https://picsum.photos/100/100?random=5', '13800138005', 'user5@example.com', 15000.00, 500.00, 5000, 10, 1, 3, UNIX_TIMESTAMP() + 86400*90, 1, '杭州', 0, 500, UNIX_TIMESTAMP() - 86400*60, UNIX_TIMESTAMP() - 3600, '资深游戏玩家');

-- 虚拟用户
INSERT INTO `xn_virtual_user` (`id`, `name`, `avatar`, `gender`, `age`, `region`, `tags`, `intro`, `price_per_hour`, `online_status`, `is_recommend`, `status`, `create_time`, `update_time`) VALUES
(1, '萌妹子', 'https://picsum.photos/200/200?random=101', 0, 22, '北京', '[1,2,3]', '性格开朗，王者荣耀段位王者，声音甜美，带你上分带你飞', 50.00, 1, 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, '电竞小王子', 'https://picsum.photos/200/200?random=102', 1, 20, '上海', '[2,4,5]', 'LOL钻石段位，擅长打野位，可盐可甜，一起开黑吧', 45.00, 1, 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, '甜甜圈', 'https://picsum.photos/200/200?random=103', 0, 21, '广州', '[1,3]', '和平精英王牌，带你吃鸡，各种战术配合', 40.00, 0, 0, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, '游戏解说阿杰', 'https://picsum.photos/200/200?random=104', 1, 25, '深圳', '[4,5]', '游戏主播，技术一流，原神/永劫无间都很厉害', 60.00, 1, 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '小仙女', 'https://picsum.photos/200/200?random=105', 0, 23, '成都', '[1,2]', '王者荣耀全能，可奶可输出，聊天氛围轻松愉快', 55.00, 1, 0, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 虚拟用户标签
INSERT INTO `xn_virtual_user_tag` (`id`, `name`, `icon`, `sort_order`, `status`, `create_time`, `update_time`) VALUES
(1, '王者荣耀', 'icon1', 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, '英雄联盟', 'icon2', 2, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, '和平精英', 'icon3', 3, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, '原神', 'icon4', 4, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '永劫无间', 'icon5', 5, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 标签关联
INSERT INTO `xn_virtual_user_tag_relation` (`id`, `virtual_user_id`, `tag_id`, `create_time`) VALUES
(1, 1, 1, UNIX_TIMESTAMP()),
(2, 1, 2, UNIX_TIMESTAMP()),
(3, 1, 3, UNIX_TIMESTAMP()),
(4, 2, 2, UNIX_TIMESTAMP()),
(5, 2, 4, UNIX_TIMESTAMP()),
(6, 2, 5, UNIX_TIMESTAMP()),
(7, 3, 1, UNIX_TIMESTAMP()),
(8, 3, 3, UNIX_TIMESTAMP()),
(9, 4, 4, UNIX_TIMESTAMP()),
(10, 4, 5, UNIX_TIMESTAMP()),
(11, 5, 1, UNIX_TIMESTAMP()),
(12, 5, 2, UNIX_TIMESTAMP());

-- VIP套餐
INSERT INTO `xn_vip_package` (`id`, `name`, `price`, `original_price`, `duration`, `level`, `hot`, `sort`, `status`, `create_time`, `update_time`) VALUES
(1, 'VIP月卡', 18.00, 30.00, 30, 1, 1, 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 'VIP季卡', 48.00, 90.00, 90, 1, 0, 2, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, 'VIP年卡', 128.00, 360.00, 365, 2, 1, 3, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, 'VIP永久', 298.00, NULL, 3650, 3, 0, 4, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 游戏
INSERT INTO `xn_game` (`id`, `name`, `icon`, `description`, `status`, `sort`, `create_time`, `update_time`) VALUES
(1, '王者荣耀', 'game1.jpg', '5V5公平竞技手游，国民手游', 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, '英雄联盟', 'game2.jpg', 'MOBA竞技网游，全球最火', 1, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, '和平精英', 'game3.jpg', '战术竞技手游，百人同场', 1, 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, '原神', 'game4.jpg', '开放世界冒险游戏', 1, 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '永劫无间', 'game5.jpg', '动作竞技游戏', 1, 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 礼物
INSERT INTO `xn_gift` (`id`, `title`, `image`, `money`, `type`, `is_vip`, `tian`, `status`, `sort`, `create_time`) VALUES
(1, '爱心', 'gift1.png', 1.00, 0, 0, 0, 1, 1, UNIX_TIMESTAMP()),
(2, '玫瑰花', 'gift2.png', 10.00, 0, 0, 0, 1, 2, UNIX_TIMESTAMP()),
(3, '蛋糕', 'gift3.png', 50.00, 0, 0, 0, 1, 3, UNIX_TIMESTAMP()),
(4, '钻戒', 'gift4.png', 999.00, 0, 1, 0, 1, 4, UNIX_TIMESTAMP()),
(5, '跑车', 'gift5.png', 1500.00, 0, 1, 0, 1, 5, UNIX_TIMESTAMP()),
(6, '火箭', 'gift6.png', 500.00, 0, 0, 0, 1, 6, UNIX_TIMESTAMP());

-- 充值套餐
INSERT INTO `xn_recharge_package` (`id`, `name`, `price`, `coins`, `bonus_coins`, `hot`, `status`, `sort`, `create_time`, `update_time`) VALUES
(1, '6元套餐', 6.00, 60, 0, 0, 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, '30元套餐', 30.00, 300, 30, 0, 1, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, '68元套餐', 68.00, 680, 100, 1, 1, 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, '128元套餐', 128.00, 1280, 250, 0, 1, 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '328元套餐', 328.00, 3280, 800, 1, 1, 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 动态
INSERT INTO `xn_post` (`id`, `user_id`, `content`, `images`, `thumb_num`, `comment_num`, `share_num`, `tag_id`, `type`, `status`, `is_private`, `create_time`, `update_time`) VALUES
(1, 1, '今天和陪玩师一起打王者荣耀，太开心了！配合默契，连赢五把，强烈推荐！', '["https://picsum.photos/400/300?random=201"]', 42, 8, 3, 1, 0, 1, 0, UNIX_TIMESTAMP() - 3600, UNIX_TIMESTAMP()),
(2, 2, '晒一下今天的游戏成果，吃鸡三连！', '["https://picsum.photos/400/300?random=202"]', 28, 5, 1, 3, 0, 1, 0, UNIX_TIMESTAMP() - 7200, UNIX_TIMESTAMP()),
(3, 3, '有没有一起玩原神的小伙伴？周末可以组队！', NULL, 15, 12, 0, 4, 0, 1, 0, UNIX_TIMESTAMP() - 10800, UNIX_TIMESTAMP()),
(4, 5, '这个陪玩师技术太好了，带飞全场，必须五星好评！', '["https://picsum.photos/400/300?random=204"]', 56, 15, 5, 1, 0, 1, 0, UNIX_TIMESTAMP() - 14400, UNIX_TIMESTAMP());

-- 动态点赞
INSERT INTO `xn_post_like` (`id`, `post_id`, `user_id`, `create_time`) VALUES
(1, 1, 2, UNIX_TIMESTAMP() - 3000),
(2, 1, 3, UNIX_TIMESTAMP() - 2900),
(3, 1, 4, UNIX_TIMESTAMP() - 2800),
(4, 1, 5, UNIX_TIMESTAMP() - 2700),
(5, 2, 1, UNIX_TIMESTAMP() - 6600),
(6, 2, 3, UNIX_TIMESTAMP() - 6500),
(7, 2, 5, UNIX_TIMESTAMP() - 6400),
(8, 3, 1, UNIX_TIMESTAMP() - 10200),
(9, 3, 2, UNIX_TIMESTAMP() - 10100);

-- 动态评论
INSERT INTO `xn_post_comment` (`id`, `post_id`, `user_id`, `content`, `create_time`) VALUES
(1, 1, 3, '厉害厉害！带我一起吧', UNIX_TIMESTAMP() - 3200),
(2, 1, 5, '恭喜上星耀！', UNIX_TIMESTAMP() - 3100),
(3, 2, 1, '加油！一起冲！', UNIX_TIMESTAMP() - 6800),
(4, 2, 4, '新赛季一起玩啊', UNIX_TIMESTAMP() - 6700),
(5, 3, 2, '666', UNIX_TIMESTAMP() - 10400),
(6, 4, 3, '新版本肝起来！', UNIX_TIMESTAMP() - 14000);

-- 用户关注
INSERT INTO `xn_user_follow` (`id`, `follower_id`, `following_id`, `create_time`) VALUES
(1, 1, 3, UNIX_TIMESTAMP() - 86400*5),
(2, 1, 5, UNIX_TIMESTAMP() - 86400*4),
(3, 2, 3, UNIX_TIMESTAMP() - 86400*3),
(4, 2, 4, UNIX_TIMESTAMP() - 86400*2),
(5, 3, 1, UNIX_TIMESTAMP() - 86400*1),
(6, 4, 2, UNIX_TIMESTAMP() - 86400*6),
(7, 4, 5, UNIX_TIMESTAMP() - 86400*7),
(8, 5, 1, UNIX_TIMESTAMP() - 86400*8),
(9, 5, 2, UNIX_TIMESTAMP() - 86400*9);

-- Banner
INSERT INTO `xn_banner` (`id`, `title`, `image`, `link_url`, `sort_order`, `status`, `create_time`, `update_time`) VALUES
(1, '新用户注册送好礼', 'banner1.png', '/promo/new-user', 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 'VIP会员限时特惠', 'banner2.png', '/vip', 2, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, '热门游戏推荐', 'banner3.png', '/games', 3, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 相册
INSERT INTO `xn_album` (`id`, `user_id`, `title`, `cover`, `photos_count`, `status`, `create_time`, `update_time`) VALUES
(1, 1, '我的游戏日常', 'https://picsum.photos/400/300?random=301', 5, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 2, '精彩瞬间', 'https://picsum.photos/400/300?random=302', 8, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, 3, '生活随拍', 'https://picsum.photos/400/300?random=303', 3, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 相册照片
INSERT INTO `xn_album_photo` (`id`, `album_id`, `photo_url`, `sort_order`, `create_time`) VALUES
(1, 1, 'https://picsum.photos/400/300?random=311', 1, UNIX_TIMESTAMP()),
(2, 1, 'https://picsum.photos/400/300?random=312', 2, UNIX_TIMESTAMP()),
(3, 1, 'https://picsum.photos/400/300?random=313', 3, UNIX_TIMESTAMP()),
(4, 2, 'https://picsum.photos/400/300?random=321', 1, UNIX_TIMESTAMP()),
(5, 2, 'https://picsum.photos/400/300?random=322', 2, UNIX_TIMESTAMP()),
(6, 3, 'https://picsum.photos/400/300?random=331', 1, UNIX_TIMESTAMP());

-- 预约
INSERT INTO `xn_reserve` (`id`, `user_id`, `virtual_user_id`, `game_id`, `reserve_time`, `duration_hours`, `status`, `remark`, `create_time`, `update_time`) VALUES
(1, 1, 1, 1, UNIX_TIMESTAMP() + 86400, 2, 0, '希望能一起上分', UNIX_TIMESTAMP() - 3600, UNIX_TIMESTAMP()),
(2, 2, 2, 2, UNIX_TIMESTAMP() + 86400*2, 1, 1, '', UNIX_TIMESTAMP() - 7200, UNIX_TIMESTAMP());

-- 需求
INSERT INTO `xn_demand` (`id`, `user_id`, `game_id`, `title`, `description`, `budget`, `status`, `create_time`, `update_time`) VALUES
(1, 1, 1, '找王者荣耀队友', '找个技术好的一起上分，预算50/小时', 50.00, 0, UNIX_TIMESTAMP() - 3600, UNIX_TIMESTAMP()),
(2, 4, 3, '和平精英陪玩', '找个能带我吃鸡的', 40.00, 0, UNIX_TIMESTAMP() - 7200, UNIX_TIMESTAMP());

-- 聊天室
INSERT INTO `xn_chat_room` (`id`, `user_id`, `virtual_user_id`, `last_message`, `last_message_time`, `unread_count`, `create_time`, `update_time`) VALUES
(1, 1, 1, '好的，明天见！', UNIX_TIMESTAMP() - 3600, 1, UNIX_TIMESTAMP() - 86400, UNIX_TIMESTAMP()),
(2, 2, 2, '没问题，一起加油', UNIX_TIMESTAMP() - 7200, 0, UNIX_TIMESTAMP() - 86400*2, UNIX_TIMESTAMP()),
(3, 3, 5, '期待一起玩游戏', UNIX_TIMESTAMP() - 10800, 2, UNIX_TIMESTAMP() - 86400*3, UNIX_TIMESTAMP());

-- 聊天记录
INSERT INTO `xn_chat_log` (`id`, `fromid`, `toid`, `content`, `type`, `time`, `isread`, `is_del`, `is_revoked`) VALUES
(1, 1, 1001, '你好，在吗？', 0, UNIX_TIMESTAMP() - 86400*2, 1, 0, 0),
(2, 1001, 1, '在的呢，有什么可以帮到您？', 0, UNIX_TIMESTAMP() - 86400*2 + 60, 1, 0, 0),
(3, 1, 1001, '想找你一起玩王者荣耀', 0, UNIX_TIMESTAMP() - 86400*2 + 120, 1, 0, 0),
(4, 1001, 1, '好的呀，什么时候开始呢？', 0, UNIX_TIMESTAMP() - 86400*2 + 180, 1, 0, 0),
(5, 2, 1002, '英雄联盟能带我上分吗？', 0, UNIX_TIMESTAMP() - 86400, 1, 0, 0),
(6, 1002, 2, '没问题，我打野很稳的', 0, UNIX_TIMESTAMP() - 86400 + 60, 1, 0, 0);

-- 游戏订单
INSERT INTO `xn_game_order` (`id`, `order_no`, `user_id`, `game_id`, `game_name`, `companion_id`, `companion_name`, `duration`, `price`, `amount`, `status`, `remark`, `create_time`, `start_time`, `end_time`, `cancel_time`) VALUES
(1, 'ORD20250525001', 1, 1, '王者荣耀', 1, '萌妹子', 60, 50.00, 50.00, 'pending', '希望能赢', UNIX_TIMESTAMP() - 3600, NULL, NULL, NULL),
(2, 'ORD20250525002', 2, 2, '英雄联盟', 2, '电竞小王子', 90, 45.00, 67.50, 'ongoing', '', UNIX_TIMESTAMP() - 7200, UNIX_TIMESTAMP() - 3600, NULL, NULL),
(3, 'ORD20250525003', 5, 1, '王者荣耀', 1, '萌妹子', 120, 50.00, 100.00, 'completed', '玩得很开心', UNIX_TIMESTAMP() - 10800, UNIX_TIMESTAMP() - 10700, UNIX_TIMESTAMP() - 9500, NULL);
