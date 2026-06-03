require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const dbHealthChecker = require('./src/utils/dbHealthChecker');

console.log('🔍 开始检测数据库连接...\n');

const testConnections = async () => {
  try {
    const results = await dbHealthChecker.initializeDatabases();
    console.log('\n' + '='.repeat(50));
    console.log('📊 数据库连接检测结果：');
    console.log('='.repeat(50));
    
    const dbNames = ['MySQL', 'Redis', 'MongoDB'];
    let allSuccess = true;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const status = result.value.status === 'healthy' ? '✅' : '❌';
        console.log(`${status} ${dbNames[index]}: ${result.value.message}`);
        if (result.value.status !== 'healthy') allSuccess = false;
      } else {
        console.log(`❌ ${dbNames[index]}: ${result.reason.message}`);
        allSuccess = false;
      }
    });
    
    console.log('\n' + '='.repeat(50));
    if (allSuccess) {
      console.log('🎉 所有数据库连接成功！');
    } else {
      console.log('⚠️  部分数据库连接失败，请检查配置');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 检测过程出错:', error);
  }
};

testConnections();
