const { up, convertData } = require('./20240101000000_add_currency_column');

const runMigrations = async () => {
  console.log('========== 开始执行数据库迁移 ==========');
  
  try {
    console.log('\n1. 添加货币单位字段...');
    await up();
    
    console.log('\n2. 转换历史数据...');
    await convertData();
    
    console.log('\n========== 数据库迁移完成 ==========');
    process.exit(0);
  } catch (error) {
    console.error('\n========== 数据库迁移失败 ==========');
    console.error(error);
    process.exit(1);
  }
};

runMigrations();