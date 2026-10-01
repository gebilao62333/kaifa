const sequelize = require('../config/mysql');

/**
 * 交互功能修复相关表结构变更（幂等，仅 DDL，不改既有数据）
 * 对应此前的手跑脚本 sql/migrate_2026-10-01_interaction_fixes.sql，
 * 现固化为 JS 迁移并接入 runMigrations，使服务重启即可自愈（原先该脚本不被自动执行，导致真实库漂移）。
 *
 *  1. xn_reserve          补充服务时长/金额/备注/服务类型
 *  2. xn_companion_profile 补充服务展示图与技能介绍
 *  3. xn_user             补充实名认证字段
 *  4. xn_game_order       补充申诉字段
 *  5. 新增 xn_user_visit / xn_user_pref 表
 */

const TABLE_COLUMNS = {
  xn_reserve: [
    { name: 'duration', def: 'INT DEFAULT 0 COMMENT \'服务时长（小时）\'' },
    { name: 'price', def: 'DECIMAL(10,2) DEFAULT 0 COMMENT \'预约金额\'' },
    { name: 'remark', def: 'VARCHAR(255) NULL COMMENT \'备注\'' },
    { name: 'service_type', def: "VARCHAR(16) NULL COMMENT '服务类型 online/offline'" }
  ],
  xn_companion_profile: [
    { name: 'icon', def: 'VARCHAR(255) NULL COMMENT \'服务展示图\'' },
    { name: 'description', def: 'VARCHAR(500) NULL COMMENT \'技能介绍\'' }
  ],
  xn_user: [
    { name: 'real_name', def: 'VARCHAR(50) NULL COMMENT \'真实姓名\'' },
    { name: 'id_card', def: 'VARCHAR(18) NULL COMMENT \'身份证号\'' },
    { name: 'real_name_front', def: 'VARCHAR(255) NULL COMMENT \'身份证正面\'' },
    { name: 'real_name_back', def: 'VARCHAR(255) NULL COMMENT \'身份证反面\'' },
    { name: 'real_name_status', def: 'TINYINT(1) DEFAULT 0 COMMENT \'实名状态：0-未认证，1-待审，2-已认证，3-驳回\'' },
    { name: 'real_name_time', def: 'INT(10) DEFAULT 0 COMMENT \'实名提交时间\'' }
  ],
  xn_game_order: [
    { name: 'appeal_reason', def: 'VARCHAR(255) NULL COMMENT \'申诉原因\'' },
    { name: 'appeal_time', def: 'INT(10) DEFAULT 0 COMMENT \'申诉时间\'' }
  ]
};

const CREATE_TABLES = {
  xn_user_visit: `CREATE TABLE IF NOT EXISTS \`xn_user_visit\` (
    \`id\` BIGINT NOT NULL AUTO_INCREMENT,
    \`user_id\` BIGINT NOT NULL COMMENT '被访问者ID',
    \`visitor_id\` BIGINT NOT NULL COMMENT '访问者ID',
    \`create_time\` INT(10) DEFAULT 0,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`idx_user_visitor\` (\`user_id\`, \`visitor_id\`),
    KEY \`idx_user_time\` (\`user_id\`, \`create_time\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户主页访问记录表'`,
  xn_user_pref: `CREATE TABLE IF NOT EXISTS \`xn_user_pref\` (
    \`id\` BIGINT NOT NULL AUTO_INCREMENT,
    \`user_id\` BIGINT NOT NULL,
    \`data\` TEXT,
    \`update_time\` INT(10) DEFAULT 0,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`idx_user_id\` (\`user_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户偏好/装扮数据表'`
};

const getExistingColumns = async (table) => {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS col FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] }
  );
  return new Set(rows.map((r) => r.col));
};

const up = async () => {
  console.log('开始执行迁移：交互功能修复字段（预约/陪玩师资料/实名/申诉/访问与偏好表）');

  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    const existing = await getExistingColumns(table);
    const missing = columns.filter((c) => !existing.has(c.name));
    if (missing.length === 0) {
      console.log(`${table} 相关字段已存在，无需变更`);
      continue;
    }
    const clauses = missing.map((c) => `ADD COLUMN ${c.name} ${c.def}`).join(', ');
    await sequelize.query(`ALTER TABLE \`${table}\` ${clauses}`);
    console.log(`已为 ${table} 新增字段：${missing.map((c) => c.name).join(', ')}`);
  }

  for (const [table, ddl] of Object.entries(CREATE_TABLES)) {
    await sequelize.query(ddl);
    console.log(`${table} 表已就绪`);
  }
};

const down = async () => {
  console.log('开始回滚迁移：交互功能修复字段');
  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    const existing = await getExistingColumns(table);
    const present = columns.filter((c) => existing.has(c.name));
    if (present.length === 0) continue;
    const clauses = present.map((c) => `DROP COLUMN ${c.name}`).join(', ');
    await sequelize.query(`ALTER TABLE \`${table}\` ${clauses}`);
    console.log(`已删除 ${table} 字段：${present.map((c) => c.name).join(', ')}`);
  }
  for (const table of Object.keys(CREATE_TABLES)) {
    await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
    console.log(`${table} 表已删除`);
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
