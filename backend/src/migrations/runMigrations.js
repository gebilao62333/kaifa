/**
 * 数据库迁移执行器
 * - 被 require 时仅导出 runMigrations() 函数，不会退出进程（供 server.js 启动时调用）
 * - 以主模块方式运行（node runMigrations.js）时才执行并退出，便于 CI / 手动迁移
 *
 * 所有迁移均幂等：重复执行安全（字段存在则跳过、数据转换仅针对 NULL/空值）。
 *
 * 接线范围（2026-10-21）：全部迁移均已接线，其中 2 个「宽列迁移」会触发表重建，
 * 用 AUTO_MIGRATE_WIDEN_COLUMNS 单独控制：
 *   - 未设置：非生产（development/test/staging）执行、production 跳过；
 *   - true/1/yes/on：任何环境都执行；
 *   - false/0/no/off：任何环境都跳过。
 * 生产跳过时必须在上线窗口手工执行这两个迁移（部署文档有命令），否则 PII 密文会写进旧列宽。
 */
// 本文件既被 server.js require（此时 dotenv 已加载），也支持 npm run migrate 手动单独执行。
// 单独执行时无人预先加载 .env，必须在此显式加载，否则会回落到默认的 127.0.0.1:3306。
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const WIDEN_FLAG = 'AUTO_MIGRATE_WIDEN_COLUMNS';

// 宽列迁移开关：显式值优先；未设置时按环境取默认（生产默认跳过，避免启动时重建大表）
const shouldRunWidenColumns = () => {
  const raw = String(process.env[WIDEN_FLAG] === undefined || process.env[WIDEN_FLAG] === null ? '' : process.env[WIDEN_FLAG]).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(raw)) return true;
  if (['false', '0', 'no', 'off'].includes(raw)) return false;
  return process.env.NODE_ENV !== 'production';
};

const runMigrations = async () => {
  console.log('========== 开始执行数据库迁移 ==========');

  const { up: currencyUp, convertData } = require('./20240101000000_add_currency_column');
  const { up: virtualUserUp } = require('./20260824000000_add_virtual_user_online_columns');
  const { up: postTagAlbumUp } = require('./20261001000000_add_post_tag_album_fields');
  const { up: interactionFixUp } = require('./20261001000001_add_interaction_fix_columns');
  const { up: dropLegacyTablesUp } = require('./20261001000002_drop_legacy_tables');
  const { up: redPacketUniqueUp } = require('./20261003000001_add_red_packet_log_unique');
  const { up: widenUserIdIpUp } = require('./20261003000002_widen_user_id_and_ip');
  const { up: cardKeyUp } = require('./20261003000003_add_card_key');
  const { up: userExpUp } = require('./20261004000001_add_user_exp_and_backfill');
  const { up: widenPiiColumnsUp } = require('./20261004000002_widen_pii_columns');
  const { up: chatExpireUp } = require('./20261017000000_add_chat_log_expire_at');
  const { up: chatDestroyUp } = require('./20261017000001_add_chat_log_read_destroy');
  const { up: noticeUp } = require('./20261020000000_add_notice');
  const { up: encryptCardPwdUp } = require('./20261020000001_encrypt_card_password');
  const { up: backfillRealNameUp } = require('./20261020000002_backfill_real_name_encryption');
  const { up: encryptMobileUp } = require('./20261020000003_encrypt_mobile');
  const { up: companionApplyFieldsUp } = require('./20261021120000_add_companion_apply_fields');

  let step = 0;
  const runStep = async (label, fn) => {
    step += 1;
    console.log('\n' + step + '. ' + label + '...');
    await fn();
  };

  const widenEnabled = shouldRunWidenColumns();
  const skipWiden = (label) => {
    console.log('\n[跳过] ' + label + '：当前环境未开启 ' + WIDEN_FLAG + '（生产默认跳过，需维护窗口手工执行）');
  };

  await runStep('添加货币单位字段', currencyUp);
  await runStep('转换历史数据', convertData);
  await runStep('补充虚拟人随机在线调度字段', virtualUserUp);
  await runStep('补充转发帖/标签分类/相册点赞字段', postTagAlbumUp);
  await runStep('补充交互修复字段（预约/陪玩师资料/实名/申诉/访问与偏好表）', interactionFixUp);
  await runStep('删除历史遗留无用表（xn_income_record / xn_expense_record / xn_album）', dropLegacyTablesUp);
  await runStep('补红包领取唯一约束（防并发重复领取）', redPacketUniqueUp);

  // 宽列迁移 1/2：user_id/target_user_id INT → BIGINT、ip VARCHAR(15) → VARCHAR(45)
  if (widenEnabled) {
    await runStep('放宽 user_id/ip 列类型（结构漂移修正）', widenUserIdIpUp);
  } else {
    skipWiden('放宽 user_id/ip 列类型（结构漂移修正）');
  }

  await runStep('补密卡 25 位充值密钥字段（xn_card.card_key）', cardKeyUp);
  await runStep('补用户经验/签到字段并按历史行为回填等级', userExpUp);

  // 宽列迁移 2/2：实名字段列宽（必须在 PII 加密回填/手机号加密之前完成）
  if (widenEnabled) {
    await runStep('放宽实名字段列宽（PII 加密前置条件）', widenPiiColumnsUp);
  } else {
    skipWiden('放宽实名字段列宽（PII 加密前置条件）');
  }

  await runStep('补聊天时间自动撤回到期字段（xn_chat_log.expire_at）', chatExpireUp);
  await runStep('补聊天已读自动销毁字段（xn_chat_log.read_at/destroy_at/destroyed_at）', chatDestroyUp);
  await runStep('新增平台公告表（xn_notice，B-3）', noticeUp);
  await runStep('卡密密码宽列并加密存量（xn_card.card_password，B-10）', encryptCardPwdUp);
  await runStep('存量实名信息加密回填（xn_user.real_name/id_card/正反面照，B-8）', backfillRealNameUp);
  await runStep('手机号加密 + 盲索引（xn_user.mobile/mobile_hash，B-7）', encryptMobileUp);
  await runStep('补充陪玩师入驻资料字段（xn_companion_profile.city/skill_level/zone/position/play_type，P1-9）', companionApplyFieldsUp);

  console.log('\n========== 数据库迁移完成 ==========');
};

module.exports = { runMigrations, shouldRunWidenColumns };

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
