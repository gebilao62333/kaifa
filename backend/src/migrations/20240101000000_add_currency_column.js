const sequelize = require('../config/mysql');
const { QueryTypes } = require('sequelize');

const CURRENCY_UNIT = '金币';

// 各表需要补充的字段定义（MySQL 不支持 ADD COLUMN IF NOT EXISTS，故改为先查 INFORMATION_SCHEMA 再按需加列）
// 注意：实际表名带 xn_ 前缀，与模型 freezeTableName 一致
const TABLE_COLUMNS = {
  xn_order_chong: [
    { name: 'gold_coins', def: "DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '充值对应金币数'" },
    { name: 'currency', def: "VARCHAR(20) NOT NULL DEFAULT '金币' COMMENT '货币单位'" }
  ],
  xn_gift_log: [
    { name: 'currency', def: "VARCHAR(20) NOT NULL DEFAULT '金币' COMMENT '货币单位'" }
  ],
  xn_withdraw: [
    { name: 'currency', def: "VARCHAR(20) NOT NULL DEFAULT '金币' COMMENT '货币单位'" }
  ],
  xn_red_packet: [
    { name: 'currency', def: "VARCHAR(20) NOT NULL DEFAULT '金币' COMMENT '货币单位'" }
  ],
  xn_red_packet_log: [
    { name: 'currency', def: "VARCHAR(20) NOT NULL DEFAULT '金币' COMMENT '货币单位'" }
  ]
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
  console.log('开始执行数据库迁移：添加货币单位字段');
  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    const existing = await getExistingColumns(table);
    const missing = columns.filter((c) => !existing.has(c.name));
    if (missing.length === 0) {
      console.log(`${table} 货币单位字段已存在，跳过`);
      continue;
    }
    const clauses = missing.map((c) => `ADD COLUMN ${c.name} ${c.def}`).join(', ');
    await sequelize.query(`ALTER TABLE ${table} ${clauses}`);
    console.log(`已为 ${table} 新增字段：${missing.map((c) => c.name).join(', ')}`);
  }
  console.log('添加货币单位字段完成');
};

const down = async () => {
  console.log('开始回滚迁移：删除货币单位字段');
  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    const existing = await getExistingColumns(table);
    const present = columns.filter((c) => existing.has(c.name));
    if (present.length === 0) {
      console.log(`${table} 货币单位字段不存在，跳过`);
      continue;
    }
    const clauses = present.map((c) => `DROP COLUMN ${c.name}`).join(', ');
    await sequelize.query(`ALTER TABLE ${table} ${clauses}`);
    console.log(`已删除 ${table} 字段：${present.map((c) => c.name).join(', ')}`);
  }
  console.log('回滚迁移完成');
};

const convertData = async () => {
  console.log('开始转换历史数据货币单位');
  try {
    // 说明：currency 列已通过 ALTER ... DEFAULT 自动填充到既有行；
    // gold_coins 的回填依赖 xn_order_chong 的 money/cid 列，若实际表结构无这些列则跳过（保留默认值 0）。
    const orderCols = await getExistingColumns('xn_order_chong');
    if (orderCols.has('money') && orderCols.has('cid')) {
      const orders = await sequelize.query(
        `SELECT id, money, cid FROM xn_order_chong WHERE currency IS NULL OR currency = ''`,
        { type: QueryTypes.SELECT }
      );

      for (const order of orders) {
        const pkg = await sequelize.query(
          `SELECT coin, coin_zeng FROM xn_recharge_package WHERE id = ?`,
          { replacements: [order.cid], type: QueryTypes.SELECT }
        );

        if (pkg.length > 0) {
          const totalCoins = pkg[0].coin + (pkg[0].coin_zeng || 0);
          await sequelize.query(
            `UPDATE xn_order_chong SET gold_coins = ?, currency = ? WHERE id = ?`,
            { replacements: [totalCoins, CURRENCY_UNIT, order.id] }
          );
        }
      }
    } else {
      console.log('xn_order_chong 缺少 money/cid 列，跳过 gold_coins 回填（保留默认值 0）');
    }

    await sequelize.query(
      `UPDATE xn_gift_log SET currency = ? WHERE currency IS NULL OR currency = ''`,
      { replacements: [CURRENCY_UNIT] }
    );
    await sequelize.query(
      `UPDATE xn_withdraw SET currency = ? WHERE currency IS NULL OR currency = ''`,
      { replacements: [CURRENCY_UNIT] }
    );
    await sequelize.query(
      `UPDATE xn_red_packet SET currency = ? WHERE currency IS NULL OR currency = ''`,
      { replacements: [CURRENCY_UNIT] }
    );
    await sequelize.query(
      `UPDATE xn_red_packet_log SET currency = ? WHERE currency IS NULL OR currency = ''`,
      { replacements: [CURRENCY_UNIT] }
    );

    console.log('历史数据转换完成');
  } catch (error) {
    console.error('历史数据转换失败:', error);
    throw error;
  }
};

module.exports = { up, down, convertData };

if (require.main === module) {
  const run = async () => {
    try {
      await up();
      await convertData();
      console.log('数据库迁移和数据转换完成');
      process.exit(0);
    } catch (error) {
      console.error('迁移失败:', error);
      process.exit(1);
    }
  };
  run();
}
