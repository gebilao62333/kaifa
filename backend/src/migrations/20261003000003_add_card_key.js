/**
 * 为 xn_card 补 25 位充值密钥字段 card_key
 * 背景：卡密充值（前端 /card-recharge 输入 25 位密钥）调用 POST /api/pay/redeem-key，
 *      服务层按 card_key 查询，但该列从未落库 —— 接口实测报
 *      "Unknown column 'xn_card.card_key' in 'where clause'"，功能完全不可用。
 * 幂等：列/索引已存在则跳过。
 */
// 单独执行时无人预先加载 .env，必须先加载再 require mysql 配置，否则会连到 127.0.0.1:3306
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');

const TABLE = 'xn_card';

const getColumns = async () => {
  const [rows] = await sequelize.query(
    "SELECT COLUMN_NAME AS col FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    { replacements: [TABLE] }
  );
  return new Set(rows.map((r) => r.col));
};

const getIndexes = async () => {
  const [rows] = await sequelize.query(
    "SELECT DISTINCT INDEX_NAME AS idx FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    { replacements: [TABLE] }
  );
  return new Set(rows.map((r) => r.idx));
};

const up = async () => {
  console.log('开始执行迁移：为 ' + TABLE + ' 补充 25 位充值密钥字段');
  const cols = await getColumns();
  if (!cols.has('card_key')) {
    await sequelize.query("ALTER TABLE " + TABLE + " ADD COLUMN card_key VARCHAR(25) DEFAULT NULL COMMENT '25位充值密钥'");
    console.log('已新增字段 card_key');
  } else {
    console.log('字段 card_key 已存在，跳过');
  }
  const idx = await getIndexes();
  if (!idx.has('uk_card_key')) {
    await sequelize.query('ALTER TABLE ' + TABLE + ' ADD UNIQUE KEY uk_card_key (card_key)');
    console.log('已新增唯一索引 uk_card_key');
  } else {
    console.log('索引 uk_card_key 已存在，跳过');
  }
};

const down = async () => {
  const idx = await getIndexes();
  if (idx.has('uk_card_key')) await sequelize.query('ALTER TABLE ' + TABLE + ' DROP INDEX uk_card_key');
  const cols = await getColumns();
  if (cols.has('card_key')) await sequelize.query('ALTER TABLE ' + TABLE + ' DROP COLUMN card_key');
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
