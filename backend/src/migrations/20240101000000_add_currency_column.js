const { sequelize } = require('../config/mysql');
const { QueryTypes } = require('sequelize');

const CURRENCY_UNIT = '金币';
const EXCHANGE_RATE = 10;

const up = async () => {
  console.log('开始执行数据库迁移：添加货币单位字段');
  
  try {
    await sequelize.query(`
      ALTER TABLE OrderChong 
      ADD COLUMN IF NOT EXISTS gold_coins DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS currency VARCHAR(20) DEFAULT '${CURRENCY_UNIT}'
    `);
    
    await sequelize.query(`
      ALTER TABLE GiftLog 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(20) DEFAULT '${CURRENCY_UNIT}'
    `);
    
    await sequelize.query(`
      ALTER TABLE Withdraw 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(20) DEFAULT '${CURRENCY_UNIT}'
    `);
    
    await sequelize.query(`
      ALTER TABLE RedPacket 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(20) DEFAULT '${CURRENCY_UNIT}'
    `);
    
    await sequelize.query(`
      ALTER TABLE RedPacketLog 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(20) DEFAULT '${CURRENCY_UNIT}'
    `);
    
    console.log('添加货币单位字段完成');
  } catch (error) {
    console.error('添加货币单位字段失败:', error);
    throw error;
  }
};

const down = async () => {
  console.log('开始回滚迁移：删除货币单位字段');
  
  try {
    await sequelize.query(`
      ALTER TABLE OrderChong 
      DROP COLUMN IF EXISTS gold_coins,
      DROP COLUMN IF EXISTS currency
    `);
    
    await sequelize.query(`
      ALTER TABLE GiftLog 
      DROP COLUMN IF EXISTS currency
    `);
    
    await sequelize.query(`
      ALTER TABLE Withdraw 
      DROP COLUMN IF EXISTS currency
    `);
    
    await sequelize.query(`
      ALTER TABLE RedPacket 
      DROP COLUMN IF EXISTS currency
    `);
    
    await sequelize.query(`
      ALTER TABLE RedPacketLog 
      DROP COLUMN IF EXISTS currency
    `);
    
    console.log('回滚迁移完成');
  } catch (error) {
    console.error('回滚迁移失败:', error);
    throw error;
  }
};

const convertData = async () => {
  console.log('开始转换历史数据货币单位');
  
  try {
    const orders = await sequelize.query(`
      SELECT id, money, cid FROM OrderChong WHERE currency IS NULL OR currency = ''
    `, { type: QueryTypes.SELECT });
    
    for (const order of orders) {
      const pkg = await sequelize.query(`
        SELECT coin, coin_zeng FROM RechargePackage WHERE id = ?
      `, { replacements: [order.cid], type: QueryTypes.SELECT });
      
      if (pkg.length > 0) {
        const totalCoins = pkg[0].coin + (pkg[0].coin_zeng || 0);
        await sequelize.query(`
          UPDATE OrderChong 
          SET gold_coins = ?, currency = ? 
          WHERE id = ?
        `, { replacements: [totalCoins, CURRENCY_UNIT, order.id] });
      }
    }
    
    await sequelize.query(`
      UPDATE GiftLog SET currency = ? WHERE currency IS NULL OR currency = ''
    `, { replacements: [CURRENCY_UNIT] });
    
    await sequelize.query(`
      UPDATE Withdraw SET currency = ? WHERE currency IS NULL OR currency = ''
    `, { replacements: [CURRENCY_UNIT] });
    
    await sequelize.query(`
      UPDATE RedPacket SET currency = ? WHERE currency IS NULL OR currency = ''
    `, { replacements: [CURRENCY_UNIT] });
    
    await sequelize.query(`
      UPDATE RedPacketLog SET currency = ? WHERE currency IS NULL OR currency = ''
    `, { replacements: [CURRENCY_UNIT] });
    
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