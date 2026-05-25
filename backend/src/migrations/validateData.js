const { sequelize } = require('../config/mysql');
const { QueryTypes } = require('sequelize');

const CURRENCY_UNIT = '金币';

const validateCurrencyData = async () => {
  console.log('========== 开始验证货币单位数据 ==========');
  
  const errors = [];
  
  try {
    const orderChongResult = await sequelize.query(`
      SELECT COUNT(*) as count FROM OrderChong WHERE currency != ? OR currency IS NULL
    `, { replacements: [CURRENCY_UNIT], type: QueryTypes.SELECT });
    
    if (orderChongResult[0].count > 0) {
      errors.push(`OrderChong表中有 ${orderChongResult[0].count} 条记录货币单位不正确`);
    }
    
    const giftLogResult = await sequelize.query(`
      SELECT COUNT(*) as count FROM GiftLog WHERE currency != ? OR currency IS NULL
    `, { replacements: [CURRENCY_UNIT], type: QueryTypes.SELECT });
    
    if (giftLogResult[0].count > 0) {
      errors.push(`GiftLog表中有 ${giftLogResult[0].count} 条记录货币单位不正确`);
    }
    
    const withdrawResult = await sequelize.query(`
      SELECT COUNT(*) as count FROM Withdraw WHERE currency != ? OR currency IS NULL
    `, { replacements: [CURRENCY_UNIT], type: QueryTypes.SELECT });
    
    if (withdrawResult[0].count > 0) {
      errors.push(`Withdraw表中有 ${withdrawResult[0].count} 条记录货币单位不正确`);
    }
    
    const redPacketResult = await sequelize.query(`
      SELECT COUNT(*) as count FROM RedPacket WHERE currency != ? OR currency IS NULL
    `, { replacements: [CURRENCY_UNIT], type: QueryTypes.SELECT });
    
    if (redPacketResult[0].count > 0) {
      errors.push(`RedPacket表中有 ${redPacketResult[0].count} 条记录货币单位不正确`);
    }
    
    const redPacketLogResult = await sequelize.query(`
      SELECT COUNT(*) as count FROM RedPacketLog WHERE currency != ? OR currency IS NULL
    `, { replacements: [CURRENCY_UNIT], type: QueryTypes.SELECT });
    
    if (redPacketLogResult[0].count > 0) {
      errors.push(`RedPacketLog表中有 ${redPacketLogResult[0].count} 条记录货币单位不正确`);
    }
    
    console.log('\n验证结果：');
    if (errors.length === 0) {
      console.log('✅ 所有表的货币单位数据验证通过');
    } else {
      console.log('❌ 发现以下问题：');
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('========== 货币单位数据验证完成 ==========');
    
    return {
      success: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('验证过程出错:', error);
    throw error;
  }
};

module.exports = { validateCurrencyData };

if (require.main === module) {
  validateCurrencyData();
}