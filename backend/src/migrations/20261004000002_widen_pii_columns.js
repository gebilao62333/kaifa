// 本迁移按设计不接入启动自动迁移，需手动单独执行；
// 单独执行时无人预先加载 .env，必须在此显式加载，否则会回落到默认的 127.0.0.1:3306。
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = require('../config/mysql');

/**
 * 审计 M-8：实名信息静态加密（utils/pii.js，AES-256-GCM）后，密文为
 * salt(64)+iv(16)+tag(16)+密文 的十六进制拼接，长度远大于原明文列宽，需先放宽列宽再启用密钥。
 *
 *  - xn_user.real_name      VARCHAR(50)  → VARCHAR(255)
 *  - xn_user.id_card        VARCHAR(18)  → VARCHAR(255)
 *  - xn_user.real_name_front VARCHAR(255) → VARCHAR(512)
 *  - xn_user.real_name_back  VARCHAR(255) → VARCHAR(512)
 *
 * ⚠️ 未接入启动自动迁移（ALTER 会触发表重建，生产大表需自行选择维护窗口）。
 *    ⚠️ 务必在配置 PII_ENCRYPTION_KEY 之前执行本迁移，否则加密写入会因「数据过长」失败。
 *    需要时手动执行：node src/migrations/20261004000002_widen_pii_columns.js
 */

const TARGETS = [
  { column: 'real_name', minLength: 255 },
  { column: 'id_card', minLength: 255 },
  { column: 'real_name_front', minLength: 512 },
  { column: 'real_name_back', minLength: 512 }
];

const columnInfo = async (table, column) => {
  const [rows] = await sequelize.query(
    'SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH AS len FROM INFORMATION_SCHEMA.COLUMNS ' +
    'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    { replacements: [table, column] }
  );
  return rows[0] || null;
};

const up = async () => {
  const table = 'xn_user';
  for (const { column, minLength } of TARGETS) {
    const info = await columnInfo(table, column);
    if (!info) {
      console.log(`${table}.${column} 不存在，跳过`);
      continue;
    }
    if (Number(info.len) >= minLength) {
      console.log(`${table}.${column} 已是 VARCHAR(${info.len})，跳过`);
      continue;
    }
    await sequelize.query(
      'ALTER TABLE `' + table + '` MODIFY `' + column + '` VARCHAR(' + minLength + ') NULL'
    );
    console.log(`${table}.${column} → VARCHAR(${minLength})`);
  }
  console.log('实名字段列宽修正完成');
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
