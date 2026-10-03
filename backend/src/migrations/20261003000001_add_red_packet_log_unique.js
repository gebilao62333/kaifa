const sequelize = require('../config/mysql');

/**
 * 审计 B-01：xn_red_packet_log 缺少 (packet_id, user_id) 唯一约束，
 * 并发领红包时事务外的重复检查会被同时通过。这里补上唯一索引作为数据库层兜底。
 *
 * 幂等：先删除同名索引（若存在），再按需创建；存在重复数据时先清理重复行（保留最早一条）。
 */
const up = async () => {
  const table = 'xn_red_packet_log';

  const [tables] = await sequelize.query(
    "SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    { replacements: [table] }
  );
  if (!tables[0].c) {
    console.log(table + ' 不存在，跳过');
    return;
  }

  // 清理历史重复数据（保留 id 最小的一条）
  await sequelize.query(
    'DELETE t1 FROM ' + table + ' t1 INNER JOIN ' + table + ' t2 ' +
    'ON t1.packet_id = t2.packet_id AND t1.user_id = t2.user_id AND t1.id > t2.id'
  );

  const [indexes] = await sequelize.query(
    'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
    { replacements: [table, 'uk_packet_user'] }
  );
  if (indexes.length) {
    console.log('uk_packet_user 已存在，跳过');
    return;
  }

  await sequelize.query('ALTER TABLE ' + table + ' ADD UNIQUE KEY uk_packet_user (packet_id, user_id)');
  console.log('已为 ' + table + ' 添加唯一索引 uk_packet_user');
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
