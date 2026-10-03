// 本迁移按设计不接入启动自动迁移，需手动单独执行；
// 单独执行时无人预先加载 .env，必须在此显式加载，否则会回落到默认的 127.0.0.1:3306。
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');

/**
 * 审计 I-11 / I-13：历史结构漂移修正
 *  - 17 张业务表的 user_id / target_user_id 是 INT，而 xn_user.id 是 BIGINT（类型不一致，存在溢出与隐式转换风险）；
 *  - ip / last_login_ip 是 VARCHAR(15)，只能存 IPv4，IPv6 会被截断。
 *  （2026-10-03 补漏：原名单遗漏 xn_call_billing / xn_gift_bag / xn_reserve_slot 的 user_id，
 *    以及 xn_admin.last_login_ip，本次一并纳入。）
 * 本脚本把上述列统一放宽为 BIGINT / VARCHAR(45)。
 *
 * ⚠️ 未接入启动自动迁移（ALTER 会触发表重建，生产大表需自行选择维护窗口），
 *    需要时手动执行：node src/migrations/20261003000002_widen_user_id_and_ip.js
 */

const USER_ID_TABLES = [
  'xn_chat_log', 'xn_gift_log', 'xn_order_chong', 'xn_post', 'xn_post_comment', 'xn_post_like',
  'xn_report', 'xn_reserve', 'xn_demand', 'xn_user_visit', 'xn_user_pref', 'xn_post_unlock',
  'xn_user_follow', 'xn_red_packet_log',
  // 2026-10-03 补漏：这三张表的 user_id 同样是 INT，原先未纳入
  'xn_call_billing', 'xn_gift_bag', 'xn_reserve_slot'
];

const columnType = async (table, column) => {
  const [rows] = await sequelize.query(
    'SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH AS len FROM INFORMATION_SCHEMA.COLUMNS ' +
    'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    { replacements: [table, column] }
  );
  return rows[0] || null;
};

const tableExists = async (table) => {
  const [rows] = await sequelize.query(
    'SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    { replacements: [table] }
  );
  return rows[0].c > 0;
};

const up = async () => {
  for (const table of USER_ID_TABLES) {
    if (!(await tableExists(table))) continue;

    for (const column of ['user_id', 'target_user_id']) {
      const info = await columnType(table, column);
      if (!info) continue;
      if (String(info.DATA_TYPE).toLowerCase() === 'bigint') continue;
      await sequelize.query('ALTER TABLE `' + table + '` MODIFY `' + column + '` BIGINT NOT NULL');
      console.log(table + '.' + column + ' → BIGINT');
    }
  }

  // 2026-10-03 补漏：xn_admin.last_login_ip 同样是 VARCHAR(15)（表小，重建成本可忽略）
  for (const [table, column] of [['xn_user', 'ip'], ['xn_user', 'last_login_ip'], ['xn_admin', 'last_login_ip']]) {
    if (!(await tableExists(table))) continue;
    const info = await columnType(table, column);
    if (!info) continue;
    if (Number(info.len) >= 45) continue;
    await sequelize.query('ALTER TABLE `' + table + '` MODIFY `' + column + '` VARCHAR(45)');
    console.log(table + '.' + column + ' → VARCHAR(45)');
  }

  console.log('结构漂移修正完成');
};

module.exports = { up };

if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}
