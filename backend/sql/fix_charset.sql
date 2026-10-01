-- 修复用户 1-5 的中文乱码数据
UPDATE xn_user SET nickname='游戏达人小王', city='北京', `dec`='喜欢玩各种游戏' WHERE id=1;
UPDATE xn_user SET nickname='玩家小美', city='上海', `dec`='' WHERE id=2;
UPDATE xn_user SET nickname='新手玩家', city='广州', `dec`='刚注册的用户' WHERE id=3;
UPDATE xn_user SET nickname='游戏爱好者', city='深圳', `dec`='新人报道' WHERE id=4;
UPDATE xn_user SET nickname='资深玩家', city='杭州', `dec`='资深游戏玩家' WHERE id=5;
