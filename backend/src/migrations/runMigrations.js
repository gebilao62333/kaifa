/**
 * 数据库迁移执行器
 * - 被 require 时仅导出 runMigrations() 函数，不会退出进程（供 server.js 启动时调用）
 * - 以主模块方式运行（node runMigrations.js）时才执行并退出，便于 CI / 手动迁移
 *
 * 所有迁移均幂等：重复执行安全（字段存在则跳过、数据转换仅针对 NULL/空值）。
 */
// 本文件既被 server.js require（此时 dotenv 已加载），也支持 npm run migrate 手动单独执行。
// 单独执行时无人预先加载 .env，必须在此显式加载，否则会回落到默认的 127.0.0.1:3306。
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const runMigrations = async () => {
  console.log('========== 开始执行数据库迁移 ==========');

  const { up: currencyUp, convertData } = require('./20240101000000_add_currency_column');
  const { up: virtualUserUp } = require('./20260824000000_add_virtual_user_online_columns');
  const { up: postTagAlbumUp } = require('./20261001000000_add_post_tag_album_fields');
  const { up: interactionFixUp } = require('./20261001000001_add_interaction_fix_columns');
  const { up: dropLegacyTablesUp } = require('./20261001000002_drop_legacy_tables');
  const { up: redPacketUniqueUp } = require('./20261003000001_add_red_packet_log_unique');
  const { up: cardKeyUp } = require('./20261003000003_add_card_key');

  console.log('\n1. 添加货币单位字段...');
  await currencyUp();

  console.log('\n2. 转换历史数据...');
  await convertData();

  console.log('\n3. 补充虚拟人随机在线调度字段...');
  await virtualUserUp();

  console.log('\n4. 补充转发帖/标签分类/相册点赞字段...');
  await postTagAlbumUp();

  console.log('\n5. 补充交互修复字段（预约/陪玩师资料/实名/申诉/访问与偏好表）...');
  await interactionFixUp();

  console.log('\n6. 删除历史遗留无用表（xn_income_record / xn_expense_record / xn_album）...');
  await dropLegacyTablesUp();

  console.log('\n7. 补红包领取唯一约束（防并发重复领取）...');
  await redPacketUniqueUp();

  console.log('\n8. 补密卡 25 位充值密钥字段（xn_card.card_key）...');
  await cardKeyUp();

  console.log('\n========== 数据库迁移完成 ==========');
};

module.exports = { runMigrations };

// 仅当作为独立脚本运行时才自动执行并决定退出码
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n========== 数据库迁移失败 ==========');
      console.error(error);
      process.exit(1);
    });
}
