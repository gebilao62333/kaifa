// 临时验证：未解锁用户查看帖子5的 locked 状态 + 实际解锁
const circleService = require('./src/services/circleService');

(async () => {
  try {
    // 用户4（800金币）未解锁帖子5
    const detail = await circleService.getPostDetail(4, 5);
    console.log('=== 用户4查看帖子5（未解锁） ===');
    console.log(JSON.stringify(detail, null, 2));

    // 用户4 付费解锁
    const ok = await circleService.unlockPost(4, 5, 2, '');
    console.log('=== 用户4解锁结果 ===', ok);

    // 解锁后再次查看
    const after = await circleService.getPostDetail(4, 5);
    console.log('=== 用户4解锁后查看帖子5 ===');
    console.log(JSON.stringify({ locked: after.locked, content: after.content }, null, 2));

    // 用户1收入再次确认
    const walletService = require('./src/services/walletService');
    const breakdown = await walletService.getIncomeBreakdown(1);
    console.log('=== 用户1收入来源构成（最终） ===');
    console.log(JSON.stringify(breakdown, null, 2));
  } catch (err) {
    console.error('调用失败:', err.message);
    if (err.stack) console.error(err.stack.split('\n').slice(0, 4).join('\n'));
  } finally {
    process.exit(0);
  }
})();
