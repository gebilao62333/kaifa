/**
 * 为 xn_chat_log 补已读自动销毁相关字段
 *
 * 背景：设置页「已读自动销毁」此前只写 localStorage，到点仅在本机内存删除气泡，
 * 不落库、不通知对端、刷新即恢复。改为服务端事实：
 *   读取方 markAsRead 时写入 read_at，并按「发送方」的期限算出 destroy_at；
 *   读接口按 destroy_at 过滤，清理器把到期消息落库为已销毁（is_del=1）并清内容/回收媒体。
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

const COLUMNS = [
  ['read_at', "INT(10) NOT NULL DEFAULT 0 COMMENT '首次被读时间戳（秒），0=未读'"],
  ['destroy_at', "INT(10) NOT NULL DEFAULT 0 COMMENT '已读销毁时间戳（秒），0=不销毁'"],
  ['destroyed_at', "INT(10) NOT NULL DEFAULT 0 COMMENT '实际销毁落库时间戳（秒），0=未销毁'"]
];

const up = async () => {
  console.log('开始执行迁移：为 ' + TABLE + ' 补充已读自动销毁字段');
  const cols = await getColumns();
  for (const [name, def] of COLUMNS) {
    if (!cols.has(name)) {
      await sequelize.query('ALTER TABLE ' + TABLE + ' ADD COLUMN ' + name + ' ' + def);
      console.log('已新增字段 ' + name);
    } else {
      console.log('字段 ' + name + ' 已存在，跳过');
    }
  }
  const idx = await getIndexes();
  if (!idx.has('idx_chat_log_destroy')) {
    await sequelize.query('ALTER TABLE ' + TABLE + ' ADD INDEX idx_chat_log_destroy (is_del, destroy_at)');
    console.log('已新增索引 idx_chat_log_destroy');
  } else {
    console.log('索引 idx_chat_log_destroy 已存在，跳过');
  }
};

const down = async () => {
  const idx = await getIndexes();
  if (idx.has('idx_chat_log_destroy')) await sequelize.query('ALTER TABLE ' + TABLE + ' DROP INDEX idx_chat_log_destroy');
  const cols = await getColumns();
  for (const [name] of COLUMNS) {
    if (cols.has(name)) await sequelize.query('ALTER TABLE ' + TABLE + ' DROP COLUMN ' + name);
  }
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
