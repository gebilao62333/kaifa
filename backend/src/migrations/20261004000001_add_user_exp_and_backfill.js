const sequelize = require('../config/mysql');

/**
 * 等级经验链路（对应《前端功能差异清单》§11.5 #8）
 *
 *  1. xn_user 补 exp / last_check_in_time / level_backfill_time 三列
 *  2. 按历史行为折算一次基线经验（完成订单 +50、发布动态 +20、已实名 +100，不乘 VIP 倍率）
 *
 * 为什么必须回填：`xn_user.lv` 自上线来只读不写，全部账号都是 Lv.1，
 * 权益门槛（Lv.5~Lv.45）一旦生效会把存量用户全部锁在外面。
 * 回填幂等：仅处理 level_backfill_time=0 且 exp=0 的账号，处理后写入时间戳，重复启动安全。
 */

const TABLE = 'xn_user';
const COLUMNS = [
  { name: 'exp', def: "INT DEFAULT 0 COMMENT '当前等级内已积累的经验值'" },
  { name: 'last_check_in_time', def: "INT(10) DEFAULT 0 COMMENT '最近签到时间戳'" },
  { name: 'level_backfill_time', def: "INT(10) DEFAULT 0 COMMENT '历史经验回填完成时间戳，0=未回填'" }
];

const getExistingColumns = async (table) => {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS col FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] }
  );
  return new Set(rows.map((r) => r.col));
};

const up = async () => {
  const existing = await getExistingColumns(TABLE);
  const missing = COLUMNS.filter((c) => !existing.has(c.name));
  if (missing.length) {
    const clauses = missing.map((c) => `ADD COLUMN ${c.name} ${c.def}`).join(', ');
    await sequelize.query(`ALTER TABLE \`${TABLE}\` ${clauses}`);
    console.log(`已为 ${TABLE} 新增字段：${missing.map((c) => c.name).join(', ')}`);
  } else {
    console.log(`${TABLE} 经验相关字段已存在，无需变更`);
  }

  // 回填依赖这三列，必须在 DDL 之后再跑
  const levelService = require('../services/levelService');
  let total = 0;
  let changed = 0;
  let rounds = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await levelService.backfillExperience({ batchSize: 200 });
    total += result.processed;
    changed += result.changed;
    rounds += 1;
    if (!result.remaining || rounds > 500) break;
  }
  console.log(`历史经验回填完成：处理 ${total} 个账号，其中 ${changed} 个获得基线等级`);

  return { processed: total, changed };
};

const down = async () => {
  console.log('回滚等级经验链路仅清除回填标记，列保留（避免丢经验数据）');
  await sequelize.query(`UPDATE \`${TABLE}\` SET level_backfill_time = 0`);
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
