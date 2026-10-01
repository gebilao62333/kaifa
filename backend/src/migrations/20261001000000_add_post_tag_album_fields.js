const sequelize = require('../config/mysql');
const { QueryTypes } = require('sequelize');

/**
 * 批次3 结构变更（幂等）：
 *  1. xn_post 增加 repost_id（转发帖指向原帖）
 *  2. xn_virtual_user_tag 增加 category / is_default（标签分类与默认标签）
 *  3. xn_virtual_user_tag_relation 增加 is_primary（主要标签）
 *  4. 新增 xn_album_like（相册点赞去重）
 */

const POST_TABLE = 'xn_post';
const TAG_TABLE = 'xn_virtual_user_tag';
const TAG_REL_TABLE = 'xn_virtual_user_tag_relation';

const POST_COLUMNS = [
  { name: 'repost_id', def: "INT NOT NULL DEFAULT 0 COMMENT '转发的原帖ID，0=原创'" }
];

const TAG_COLUMNS = [
  { name: 'category', def: "VARCHAR(32) NULL COMMENT '标签分类 personality/expertise/style/scenario'" },
  { name: 'is_default', def: "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认标签：0-否，1-是'" }
];

const TAG_REL_COLUMNS = [
  { name: 'is_primary', def: "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否主要标签：0-否，1-是'" }
];

const getExistingColumns = async (table) => {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS col FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] }
  );
  return new Set(rows.map((r) => r.col));
};

const addMissingColumns = async (table, columns) => {
  const existing = await getExistingColumns(table);
  const missing = columns.filter((c) => !existing.has(c.name));
  if (missing.length === 0) {
    console.log(`${table} 相关字段已存在，无需变更`);
    return;
  }
  const clauses = missing.map((c) => `ADD COLUMN ${c.name} ${c.def}`).join(', ');
  await sequelize.query(`ALTER TABLE ${table} ${clauses}`);
  console.log(`已为 ${table} 新增字段：${missing.map((c) => c.name).join(', ')}`);
};

const dropExistingColumns = async (table, columns) => {
  const existing = await getExistingColumns(table);
  const present = columns.filter((c) => existing.has(c.name));
  if (present.length === 0) {
    console.log(`${table} 相关字段不存在，无需回滚`);
    return;
  }
  const clauses = present.map((c) => `DROP COLUMN ${c.name}`).join(', ');
  await sequelize.query(`ALTER TABLE ${table} ${clauses}`);
  console.log(`已删除 ${table} 字段：${present.map((c) => c.name).join(', ')}`);
};

const up = async () => {
  console.log('开始执行迁移：批次3 结构变更（转发帖/标签分类/相册点赞）');
  await addMissingColumns(POST_TABLE, POST_COLUMNS);
  await addMissingColumns(TAG_TABLE, TAG_COLUMNS);
  await addMissingColumns(TAG_REL_TABLE, TAG_REL_COLUMNS);

  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS \`xn_album_like\` (
      \`id\` BIGINT NOT NULL AUTO_INCREMENT,
      \`photo_id\` BIGINT NOT NULL COMMENT '照片ID',
      \`user_id\` BIGINT NOT NULL COMMENT '点赞用户ID',
      \`create_time\` INT(10) DEFAULT 0 COMMENT '点赞时间',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`idx_photo_user\` (\`photo_id\`, \`user_id\`),
      KEY \`idx_user_id\` (\`user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册点赞表'`
  );
  console.log('xn_album_like 表已就绪');
};

const down = async () => {
  console.log('开始回滚迁移：批次3 结构变更');
  await sequelize.query('DROP TABLE IF EXISTS `xn_album_like`');
  await dropExistingColumns(TAG_REL_TABLE, TAG_REL_COLUMNS);
  await dropExistingColumns(TAG_TABLE, TAG_COLUMNS);
  await dropExistingColumns(POST_TABLE, POST_COLUMNS);
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
