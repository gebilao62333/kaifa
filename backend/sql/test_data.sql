-- ============================================
-- 多客陪玩 - 测试数据导入脚本
-- 生成时间: 2026-07-15
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 游戏分类数据 (10个热门游戏)
-- ============================================
INSERT INTO xn_game (id, name, icon, description, image, image_bg, status, sort, create_time, update_time) VALUES
(1, '王者荣耀', '/uploads/games/wangzhe.png', '5V5公平竞技MOBA手游', '/uploads/games/wangzhe.jpg', '/uploads/games/wangzhe_bg.jpg', 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, '和平精英', '/uploads/games/heping.png', '战术竞技射击手游', '/uploads/games/heping.jpg', '/uploads/games/heping_bg.jpg', 1, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, '英雄联盟', '/uploads/games/lol.png', '经典MOBA端游/手游', '/uploads/games/lol.jpg', '/uploads/games/lol_bg.jpg', 1, 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, '原神', '/uploads/games/yuanshen.png', '开放世界冒险RPG', '/uploads/games/yuan shen.jpg', '/uploads/games/yuanshen_bg.jpg', 1, 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '永劫无间', '/uploads/games/yongwu.png', '武侠动作竞技游戏', '/uploads/games/yongwu.jpg', '/uploads/games/yongwu_bg.jpg', 1, 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(6, '绝地求生', '/uploads/games/juedi.png', '大逃杀类型生存游戏', '/uploads/games/juedi.jpg', '/uploads/games/juedi_bg.jpg', 1, 6, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(7, '金铲铲之战', '/uploads/games/jinchan.png', '自走棋策略对战', '/uploads/games/jinchan.jpg', '/uploads/games/jinchan_bg.jpg', 1, 7, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(8, '蛋仔派对', '/uploads/games/danzai.png', '休闲竞技派对游戏', '/uploads/games/danzai.jpg', '/uploads/games/danzai_bg.jpg', 1, 8, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(9, '第五人格', '/uploads/games/diwu.png', '非对称对抗竞技手游', '/uploads/games/diwu.jpg', '/uploads/games/diwu_bg.jpg', 1, 9, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(10, '穿越火线', '/uploads/games/cf.png', '经典FPS射击游戏', '/uploads/games/cf.jpg', '/uploads/games/cf_bg.jpg', 1, 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ============================================
-- 2. 充值套餐数据 (8个档位)
-- ============================================
INSERT INTO xn_recharge_package (id, name, title, price, coins, bonus_coins, money, coin, coin_zeng, is_zeng, hot, status, sort, create_time, update_time) VALUES
(1, '新手礼包', '新手特惠包', 6.00, 60, 0, 6.00, 60, 0, 0, 0, 1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, '超值首选', '30元300金币', 30.00, 300, 30, 30.00, 300, 30, 1, 1, 1, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, '热门推荐', '98元1000金币', 98.00, 1000, 200, 98.00, 1000, 200, 1, 1, 1, 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, '超值优惠', '198元2200金币', 198.00, 2200, 500, 198.00, 2200, 500, 1, 1, 1, 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '豪华套餐', '328元3800金币', 328.00, 3800, 1000, 328.00, 3800, 1000, 1, 0, 1, 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(6, '至尊专享', '648元8000金币', 648.00, 8000, 2500, 648.00, 8000, 2500, 1, 0, 1, 6, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(7, '平民首选', '18元180金币', 18.00, 180, 0, 18.00, 180, 0, 0, 0, 1, 7, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(8, '小试牛刀', '68元680金币+赠送', 68.00, 680, 100, 68.00, 680, 100, 1, 0, 1, 8, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ============================================
-- 3. 礼物数据 (20个礼物)
-- ============================================
INSERT INTO xn_gift (id, title, image, svga, money, type, is_vip, tian, status, sort, create_time) VALUES
(1, '玫瑰', '/uploads/gifts/rose.png', NULL, 1.00, 1, 0, 0, 1, 1, UNIX_TIMESTAMP()),
(2, '爱心', '/uploads/gifts/heart.png', NULL, 2.00, 1, 0, 0, 1, 2, UNIX_TIMESTAMP()),
(3, '棒棒糖', '/uploads/gifts/lollipop.png', NULL, 5.00, 1, 0, 0, 1, 3, UNIX_TIMESTAMP()),
(4, '蛋糕', '/uploads/gifts/cake.png', NULL, 10.00, 1, 0, 0, 1, 4, UNIX_TIMESTAMP()),
(5, '皇冠', '/uploads/gifts/crown.png', NULL, 20.00, 2, 0, 0, 1, 5, UNIX_TIMESTAMP()),
(6, '钻石', '/uploads/gifts/diamond.png', '/uploads/gifts/diamond.svga', 30.00, 2, 0, 0, 1, 6, UNIX_TIMESTAMP()),
(7, '跑车', '/uploads/gifts/car.png', '/uploads/gifts/car.svga', 50.00, 2, 0, 0, 1, 7, UNIX_TIMESTAMP()),
(8, '城堡', '/uploads/gifts/castle.png', '/uploads/gifts/castle.svga', 100.00, 3, 0, 0, 1, 8, UNIX_TIMESTAMP()),
(9, '火箭', '/uploads/gifts/rocket.png', '/uploads/gifts/rocket.svga', 200.00, 3, 0, 0, 1, 9, UNIX_TIMESTAMP()),
(10, '豪华游艇', '/uploads/gifts/yacht.png', '/uploads/gifts/yacht.svga', 520.00, 3, 0, 0, 1, 10, UNIX_TIMESTAMP()),
(11, '私人飞机', '/uploads/gifts/plane.png', '/uploads/gifts/plane.svga', 1314.00, 3, 1, 0, 1, 11, UNIX_TIMESTAMP()),
(12, '爱心气球', '/uploads/gifts/balloon.png', NULL, 3.00, 1, 0, 0, 1, 12, UNIX_TIMESTAMP()),
(13, '星星', '/uploads/gifts/star.png', NULL, 8.00, 1, 0, 0, 1, 13, UNIX_TIMESTAMP()),
(14, '月亮', '/uploads/gifts/moon.png', NULL, 15.00, 2, 0, 0, 1, 14, UNIX_TIMESTAMP()),
(15, '太阳', '/uploads/gifts/sun.png', NULL, 28.00, 2, 0, 0, 1, 15, UNIX_TIMESTAMP()),
(16, '烟花', '/uploads/gifts/firework.png', '/uploads/gifts/firework.svga', 66.00, 2, 0, 0, 1, 16, UNIX_TIMESTAMP()),
(17, '圣诞树', '/uploads/gifts/tree.png', '/uploads/gifts/tree.svga', 88.00, 3, 0, 0, 1, 17, UNIX_TIMESTAMP()),
(18, '爱情海', '/uploads/gifts/sea.png', '/uploads/gifts/sea.svga', 188.00, 3, 0, 0, 1, 18, UNIX_TIMESTAMP()),
(19, '真爱戒指', '/uploads/gifts/ring.png', '/uploads/gifts/ring.svga', 520.00, 3, 1, 0, 1, 19, UNIX_TIMESTAMP()),
(20, '爱的城堡', '/uploads/gifts/love_castle.png', '/uploads/gifts/love_castle.svga', 999.00, 3, 1, 0, 1, 20, UNIX_TIMESTAMP());

-- ============================================
-- 4. VIP 套餐数据 (4个等级)
-- ============================================
INSERT INTO xn_vip_package (id, name, title, duration_days, price, original_price, level, benefits, icon, sort, status, create_time) VALUES
(1, '月度VIP', '月度会员VIP', 30, 30.00, 50.00, 1, '{"daily_coin":50,"exclusive_gift":true,"special_badge":true}', '/uploads/vip/monthly.png', 1, 1, UNIX_TIMESTAMP()),
(2, '季度VIP', '季度会员VIP', 90, 78.00, 150.00, 2, '{"daily_coin":100,"exclusive_gift":true,"special_badge":true,"priority_match":true}', '/uploads/vip/quarterly.png', 2, 1, UNIX_TIMESTAMP()),
(3, '年度VIP', '年度会员VIP', 365, 268.00, 600.00, 3, '{"daily_coin":200,"exclusive_gift":true,"special_badge":true,"priority_match":true,"custom_title":true}', '/uploads/vip/yearly.png', 3, 1, UNIX_TIMESTAMP()),
(4, '永久VIP', '永久至尊VIP', 99999, 998.00, 1998.00, 4, '{"daily_coin":500,"exclusive_gift":true,"special_badge":true,"priority_match":true,"custom_title":true,"vip_service":true}', '/uploads/vip/permanent.png', 4, 1, UNIX_TIMESTAMP());

-- ============================================
-- 5. 标签数据 (陪玩师标签)
-- ============================================
INSERT INTO xn_tag (id, name, code, icon, type, sort, status, create_time) VALUES
(1, '技术流', 'skill_tech', '/uploads/tags/tech.png', 2, 1, 1, UNIX_TIMESTAMP()),
(2, '声音好听', 'voice_sweet', '/uploads/tags/voice.png', 2, 2, 1, UNIX_TIMESTAMP()),
(3, '幽默风趣', 'personality_funny', '/uploads/tags/funny.png', 3, 3, 1, UNIX_TIMESTAMP()),
(4, '温柔体贴', 'personality_gentle', '/uploads/tags/gentle.png', 3, 4, 1, UNIX_TIMESTAMP()),
(5, '可语音', 'service_voice', '/uploads/tags/voice_service.png', 1, 5, 1, UNIX_TIMESTAMP()),
(6, '可视频', 'service_video', '/uploads/tags/video_service.png', 1, 6, 1, UNIX_TIMESTAMP()),
(7, '包段服务', 'service_package', '/uploads/tags/package.png', 1, 7, 1, UNIX_TIMESTAMP()),
(8, '大神带飞', 'skill_pro', '/uploads/tags/pro.png', 2, 8, 1, UNIX_TIMESTAMP()),
(9, '耐心教学', 'teaching_patient', '/uploads/tags/teaching.png', 2, 9, 1, UNIX_TIMESTAMP()),
(10, '活跃在线', 'status_active', '/uploads/tags/active.png', 3, 10, 1, UNIX_TIMESTAMP());

-- ============================================
-- 6. 测试用虚拟用户 (5个陪玩师)
-- ============================================
INSERT INTO xn_virtual_user (id, name, avatar, gender, age, region, tags, intro, price_per_hour, online_status, is_recommend, status, create_time) VALUES
(1, '甜心宝贝', '/uploads/avatar/girl1.png', 2, 22, '北京', '[2,3,4]', '声音甜美，陪你度过愉快时光～', 38.00, 1, 1, 1, UNIX_TIMESTAMP()),
(2, '电竞女神', '/uploads/avatar/girl2.png', 2, 24, '上海', '[1,5,8]', '王者荣耀国服选手，带你上分不是梦！', 58.00, 1, 1, 1, UNIX_TIMESTAMP()),
(3, '温柔学长', '/uploads/avatar/boy1.png', 1, 25, '广州', '[3,4,9]', '温暖治愈系，倾听你的每一个故事', 35.00, 1, 1, 1, UNIX_TIMESTAMP()),
(4, '游戏大神', '/uploads/avatar/boy2.png', 1, 26, '深圳', '[1,6,8]', '多赛季王者，专业代练陪玩', 88.00, 1, 1, 1, UNIX_TIMESTAMP()),
(5, '元气少女', '/uploads/avatar/girl3.png', 2, 21, '成都', '[2,3,5,7]', '活泼开朗，各种游戏都能陪你玩哦', 42.00, 1, 0, 1, UNIX_TIMESTAMP());

-- ============================================
-- 7. Banner 轮播图数据 (5条)
-- ============================================
INSERT INTO xn_banner (id, title, image, link, position, sort, status, start_time, end_time, create_time) VALUES
(1, '新人注册送好礼', '/uploads/banners/newbie_gift.jpg', '/promotion/newuser', 'home', 1, 1, UNIX_TIMESTAMP(), 1893456000, UNIX_TIMESTAMP()),
(2, '王者荣耀专区', '/uploads/banners/wangzhe_zone.jpg', '/games/wangzherongyao', 'home', 2, 1, UNIX_TIMESTAMP(), 1893456000, UNIX_TIMESTAMP()),
(3, 'VIP限时折扣', '/uploads/banners/vip_discount.jpg', '/vip/promotion', 'home', 3, 1, UNIX_TIMESTAMP(), 1893456000, UNIX_TIMESTAMP()),
(4, '邀请好友得奖励', '/uploads/banners/invite_reward.jpg', '/activity/invite', 'discover', 1, 1, UNIX_TIMESTAMP(), 1893456000, UNIX_TIMESTAMP()),
(5, '周末双倍积分', '/uploads/banners/weekend_double.jpg', '/activity/weekend', 'home', 4, 1, UNIX_TIMESTAMP(), 1893456000, UNIX_TIMESTAMP());

-- ============================================
-- 8. 测试聊天房间 (3个房间)
-- ============================================
INSERT INTO xn_chat_room (id, title, title_sub, image, image_bg, manage_id, type, status, open, create_time) VALUES
(1, '闲聊灌水区', '轻松聊天交朋友', '/uploads/rooms/chat1.jpg', '/uploads/rooms/chat1_bg.jpg', 11000, 0, 1, 1, UNIX_TIMESTAMP()),
(2, '王者荣耀开黑', '找队友一起上分', '/uploads/rooms/game1.jpg', '/uploads/rooms/game1_bg.jpg', 11001, 1, 1, 1, UNIX_TIMESTAMP()),
(3, '音乐之声', '分享音乐放松心情', '/uploads/rooms/music1.jpg', '/uploads/rooms/music1_bg.jpg', 11002, 0, 1, 1, UNIX_TIMESTAMP());

-- ============================================
-- 9. 需求发布示例 (3条)
-- ============================================
INSERT INTO xn_demand (id, user_id, title, content, game_id, budget_min, budget_max, status, view_count, apply_count, create_time, update_time) VALUES
(1, 11000, '求带飞上王者', '本人星耀段位，想找个大神带我上王者，价格好商量', 1, 50.00, 100.00, 0, 128, 15, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 11002, '和平精英四排缺一', '我们三个朋友想找个会玩的队友，最好能语音', 2, 30.00, 60.00, 0, 86, 8, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, 11003, '原神联机探索深渊', '打不过深渊12层，求大佬帮忙，可以付费或请吃饭', 4, 80.00, 150.00, 1, 256, 32, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ============================================
-- 10. 动态示例数据 (5条)
-- ============================================
INSERT INTO xn_post (id, user_id, content, images, thumb_num, comment_num, share_num, type, status, is_private, create_time, update_time) VALUES
(1, 11000, '今天上了王者，开心！感谢陪玩小姐姐的带飞~', '["/uploads/posts/img1.jpg","/uploads/posts/img2.jpg"]', 256, 45, 12, 0, 1, 0, UNIX_TIMESTAMP()-3600, UNIX_TIMESTAMP()),
(2, 11001, '有没有人一起玩永劫无间？刚入坑求组队', NULL, 89, 23, 5, 0, 1, 0, UNIX_TIMESTAMP()-7200, UNIX_TIMESTAMP()),
(3, 11002, '分享一个上分技巧...', '["/uploads/posts/tips1.jpg"]', 512, 67, 34, 1, 1, 0, UNIX_TIMESTAMP()-10800, UNIX_TIMESTAMP()),
(4, 11003, '周末有人想一起开黑吗？', NULL, 34, 8, 2, 0, 1, 0, UNIX_TIMESTAMP()-14400, UNIX_TIMESTAMP()),
(5, 11004, '今天遇到一个特别好的陪玩，推荐给大家！她的ID是xxx', '["/uploads/posts/recommend.jpg"]', 1023, 156, 78, 0, 1, 0, UNIX_TIMESTAMP()-18000, UNIX_TIMESTAMP());

SET FOREIGN_KEY_CHECKS = 1;

SELECT CONCAT('✓ 成功导入 ', COUNT(*), ' 条测试数据') AS message FROM (
  SELECT COUNT(*) AS cnt FROM xn_game
  UNION ALL
  SELECT COUNT(*) FROM xn_recharge_package
  UNION ALL
  SELECT COUNT(*) FROM xn_gift
) t;
