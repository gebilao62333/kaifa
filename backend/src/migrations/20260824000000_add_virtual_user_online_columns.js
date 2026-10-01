const sequelize = require('../config/mysql');

const TABLE = 'xn_virtual_user';

// 模型已定义但历史库缺列的随机在线调度字段（缺失会导致虚拟人随机调度器每 30 秒报错）
const COLUMNS = [
  { name: 'random_online',       def: "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '随机在线开关：0-关闭（手动管理），1-开启（按在线时段与时长随机上下线）'" },
  { name: 'online_time_start',   def: "VARCHAR(5) NOT NULL DEFAULT '09:00' COMMENT '允许在线时段开始（HH:mm）'" },
  { name: 'online_time_end',     def: "VARCHAR(5) NOT NULL DEFAULT '23:00' COMMENT '允许在线时段结束（HH:mm），可跨天如 22:00-02:00'" },
  { name: 'online_duration_min', def: "INT NOT NULL DEFAULT 30 COMMENT '每次随机在线最短时长（分钟）'" },
  { name: 'online_duration_max', def: "INT NOT NULL DEFAULT 90 COMMENT '每次随机在线最长时长（分钟）'" },
  { name: 'online_until',        def: "INT(10) NOT NULL DEFAULT 0 COMMENT '本次在线到期时间戳，0-未设置'" }
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
  console.log(`开始执行迁移：为 ${TABLE} 补充随机在线调度字段`);
  const existing = await getExistingColumns();
  const missing = COLUMNS.filter((c) => !existing.has(c.name));

  if (missing.length === 0) {
    console.log(`${TABLE} 相关字段已存在，无需变更`);
    return;
  }

  const clauses = missing.map((c) => `ADD COLUMN ${c.name} ${c.def}`).join(', ');
  await sequelize.query(`ALTER TABLE ${TABLE} ${clauses}`);
  console.log(`已为 ${TABLE} 新增字段：${missing.map((c) => c.name).join(', ')}`);
};

const down = async () => {
  console.log(`开始回滚迁移：删除 ${TABLE} 随机在线调度字段`);
  const existing = await getExistingColumns();
  const present = COLUMNS.filter((c) => existing.has(c.name));

  if (present.length === 0) {
    console.log(`${TABLE} 相关字段不存在，无需回滚`);
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
      console.log('虚拟人随机在线字段迁移完成');
      process.exit(0);
    } catch (error) {
      console.error('迁移失败:', error);
      process.exit(1);
    }
  };
  run();
}
