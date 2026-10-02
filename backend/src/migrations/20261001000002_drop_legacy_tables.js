const sequelize = require('../config/mysql');

/**
 * 清理历史遗留的无用表（幂等 DDL，仅在表存在时删除）
 *
 *  - xn_income_record / xn_expense_record：曾为钱包「收支流水表」，但收支实际由
 *    walletService 从各业务表（礼物/充值/提现/预约/订单等）实时聚合，这两张表及其
 *    Sequelize 模型（IncomeRecord.js / ExpenseRecord.js）长期未被任何代码引用。
 *  - xn_album：只有建表语句与演示种子，无对应 Sequelize 模型，也无任何路由/服务/
 *    前端/文档引用（真正的相册数据存于 xn_album_photo / xn_album_like）。
 *
 * 以上三张表已于 2026-10-01 从 01_init_schema.sql / 02_init_data.sql 移除，
 * 旧库由本迁移在启动时删除。新库不再创建这些表。
 */

const LEGACY_TABLES = ['xn_income_record', 'xn_expense_record', 'xn_album'];

const tableExists = async (table) => {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] }
  );
  return rows[0].c > 0;
};

const up = async () => {
  console.log('开始执行迁移：删除历史遗留的无用表（xn_income_record / xn_expense_record / xn_album）');
  for (const table of LEGACY_TABLES) {
    if (!(await tableExists(table))) {
      console.log(`${table} 不存在，跳过`);
      continue;
    }
    await sequelize.query(`DROP TABLE \`${table}\``);
    console.log(`${table} 已删除`);
  }
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
