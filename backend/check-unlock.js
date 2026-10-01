// 临时排查：确认用户2余额、用户1当前余额
const sequelize = require('./src/config/mysql');

(async () => {
  try {
    const [users] = await sequelize.query('SELECT id, username, nickname, money FROM xn_user ORDER BY id LIMIT 8');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    process.exit(0);
  }
})();
