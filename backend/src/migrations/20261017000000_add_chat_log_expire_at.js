/**
 * 为 xn_chat_log 补时间自动撤回到期字段 expire_at
 *
 * 背景：设置页「时间自动撤回」此前只写 localStorage，到点仅在本机内存把消息标成已撤回，
 *      不落库、不通知对端，刷新即恢复。改为服务端事实：发送消息时按用户偏好写入
 *      expire_at（绝对时间戳，秒；0=不自动撤回），读接口按它兜底，清理器把到期消息落库。
 *
 * 幂等：列/索引已存在则跳过（原生 INFORMATION_SCHEMA 判存在，与仓库既有迁移一致）。
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');

const TABLE = 'xn_chat_log';

const getColumns = async () => {
  const [rows] = await sequelize.query(
    'SELECT COLUMN_NAME AS col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    { replacements: [TABLE] }
  );
  return new Set(rows.map((r) => r.col));
};

const getIndexes = async () => {
  const [rows] = await sequelize.query(
    'SELECT DISTINCT INDEX_NAME AS idx FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    { replacements: [TABLE] }
  );
  return new Set(rows.map((r) => r.idx));
};

const up = async () => {
  console.log('开始执行迁移：为 ' + TABLE + ' 补充时间自动撤回到期字段');
  const cols = await getColumns();
  if (!cols.has('expire_at')) {
    await sequelize.query(
      'ALTER TABLE ' + TABLE + " ADD COLUMN expire_at INT(10) NOT NULL DEFAULT 0 COMMENT '自动撤回到期时间戳（秒），0=不自动撤回'"
    );
    console.log('已新增字段 expire_at');
  } else {
    console.log('字段 expire_at 已存在，跳过');
  }
  const idx = await getIndexes();
  if (!idx.has('idx_chat_log_expire')) {
    await sequelize.query('ALTER TABLE ' + TABLE + ' ADD INDEX idx_chat_log_expire (is_revoked, expire_at)');
    console.log('已新增索引 idx_chat_log_expire');
  } else {
    console.log('索引 idx_chat_log_expire 已存在，跳过');
  }
};

const down = async () => {
  const idx = await getIndexes();
  if (idx.has('idx_chat_log_expire')) await sequelize.query('ALTER TABLE ' + TABLE + ' DROP INDEX idx_chat_log_expire');
  const cols = await getColumns();
  if (cols.has('expire_at')) await sequelize.query('ALTER TABLE ' + TABLE + ' DROP COLUMN expire_at');
};

module.exports = { up, down };

if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}
