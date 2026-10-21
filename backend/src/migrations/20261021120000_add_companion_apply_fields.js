require('dotenv').config();
const sequelize = require('../config/mysql');

const TABLE = 'xn_companion_profile';

// P1-9：入驻（申请服务）表单已收集城市/技能等级/接单大区/擅长位置/陪玩类型，
// 但历史表没有对应列，提交后直接丢失。此处按幂等范式补列（缺列才 ALTER）。
// 同时补管理端审核写入口径依赖的 approve_time/reject_reason（模型此前无列，写入被丢弃）。
const COLUMNS = [
  { name: 'city',        def: "VARCHAR(50) NULL COMMENT '入驻填写的所在城市'" },
  { name: 'skill_level', def: "VARCHAR(20) NULL COMMENT '技能等级（beginner/amateur/semi-pro/professional/master/god）'" },
  { name: 'zone',        def: "VARCHAR(50) NULL COMMENT '接单大区（china-east 等）'" },
  { name: 'position',    def: "VARCHAR(50) NULL COMMENT '擅长位置（top/jungle/mid/adc/support/all）'" },
  { name: 'play_type',   def: "VARCHAR(20) NULL COMMENT '陪玩类型（entertainment/carry/teaching/rank/chat）'" },
  // 管理端审核结果此前写入不存在的列被静默丢弃（approve_time/reject_reason）
  { name: 'approve_time', def: "INT(10) NOT NULL DEFAULT 0 COMMENT '审核时间（秒级）'" },
  { name: 'reject_reason', def: "VARCHAR(255) NULL COMMENT '审核拒绝原因'" }
];

const getExistingColumns = async () => {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS col FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [TABLE] }
  );
  return new Set(rows.map((r) => r.col));
};

const up = async () => {
  console.log(`开始执行迁移：为 ${TABLE} 补充入驻资料字段`);
  const existing = await getExistingColumns();
  const missing = COLUMNS.filter((c) => !existing.has(c.name));

  if (missing.length === 0) {
    console.log(`${TABLE} 入驻资料字段已存在，无需变更`);
    return;
  }

  const clauses = missing.map((c) => `ADD COLUMN ${c.name} ${c.def}`).join(', ');
  await sequelize.query(`ALTER TABLE ${TABLE} ${clauses}`);
  console.log(`已为 ${TABLE} 新增字段：${missing.map((c) => c.name).join(', ')}`);
};

const down = async () => {
  console.log(`开始回滚迁移：删除 ${TABLE} 入驻资料字段`);
  const existing = await getExistingColumns();
  const present = COLUMNS.filter((c) => existing.has(c.name));

  if (present.length === 0) {
    console.log(`${TABLE} 入驻资料字段不存在，无需回滚`);
    return;
  }

  const clauses = present.map((c) => `DROP COLUMN ${c.name}`).join(', ');
  await sequelize.query(`ALTER TABLE ${TABLE} ${clauses}`);
  console.log(`已删除 ${TABLE} 字段：${present.map((c) => c.name).join(', ')}`);
};

module.exports = { up, down };

if (require.main === module) {
  const run = async () => {
    try {
      await up();
      console.log('陪玩师入驻资料字段迁移完成');
      process.exit(0);
    } catch (error) {
      console.error('迁移失败:', error);
      process.exit(1);
    }
  };
  run();
}
