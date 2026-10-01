// 临时演示数据：用户1发布付费私密帖，用户2付费解锁 → 用户1获得"私密帖解锁"收入
const sequelize = require('./src/config/mysql');
const crypto = require('crypto');

const getTimestamp = () => Math.floor(Date.now() / 1000);

(async () => {
  try {
    // 1) 检查是否已有该演示帖（幂等）
    const [exists] = await sequelize.query(
      "SELECT id FROM xn_post WHERE user_id = 1 AND is_private = 2 AND content LIKE '%我的独家技巧%' LIMIT 1"
    );
    let postId;
    if (exists.length > 0) {
      postId = exists[0].id;
      console.log('演示帖已存在，id =', postId);
    } else {
      await sequelize.query(
        `INSERT INTO xn_post (user_id, content, images, videos, tag_id, type, status, is_private, private_password, private_price, thumb_num, comment_num, share_num, create_time)
         VALUES (1, '【私密】我的独家技巧：王者荣耀上分秘籍（仅限付费粉丝可见）', '', '', 0, 0, 1, 2, NULL, 50, 0, 0, 0, ${getTimestamp()})`
      );
      const [newPosts] = await sequelize.query(
        "SELECT id FROM xn_post WHERE user_id = 1 AND is_private = 2 AND content LIKE '%我的独家技巧%' ORDER BY id DESC LIMIT 1"
      );
      postId = newPosts[0].id;
      console.log('已创建演示私密帖，id =', postId);
    }

    // 2) 检查是否已解锁（幂等）
    const [unlocks] = await sequelize.query(
      'SELECT id FROM xn_post_unlock WHERE post_id = ? AND user_id = 2 LIMIT 1',
      { replacements: [postId] }
    );
    if (unlocks.length > 0) {
      console.log('用户2已解锁该帖');
    } else {
      // 用户2余额 1200 > 50，扣除；作者用户1增加 50
      await sequelize.query('UPDATE xn_user SET money = money - 50 WHERE id = 2');
      await sequelize.query('UPDATE xn_user SET money = money + 50 WHERE id = 1');
      await sequelize.query(
        `INSERT INTO xn_post_unlock (post_id, user_id, price, create_time) VALUES (?, 2, 50, ${getTimestamp()})`,
        { replacements: [postId] }
      );
      console.log('用户2已付费解锁，作者用户1 +50 金币');
    }

    // 3) 汇总确认
    const [posts] = await sequelize.query(
      "SELECT id, user_id, is_private, private_price, content FROM xn_post WHERE user_id = 1 ORDER BY id DESC LIMIT 3"
    );
    console.log('=== 用户1的私密帖 ===');
    console.log(JSON.stringify(posts, null, 2));

    const [inc] = await sequelize.query(
      `SELECT pu.id, pu.price, pu.create_time, p.user_id AS author
       FROM xn_post_unlock pu JOIN xn_post p ON pu.post_id = p.id
       WHERE p.user_id = 1 ORDER BY pu.id DESC LIMIT 5`
    );
    console.log('=== 解锁用户1帖子的记录（作者收入） ===');
    console.log(JSON.stringify(inc, null, 2));

    const [u] = await sequelize.query('SELECT id, nickname, money FROM xn_user WHERE id IN (1,2) ORDER BY id');
    console.log('=== 用户余额 ===');
    console.log(JSON.stringify(u, null, 2));
  } catch (err) {
    console.error('失败:', err.message);
  } finally {
    process.exit(0);
  }
})();
