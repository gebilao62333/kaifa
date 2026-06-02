const http = require('http');

const testApi = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

(async () => {
  console.log('🧪 测试 API 接口\n');
  
  try {
    // 测试健康检查
    console.log('1. 测试 /api/health');
    const health = await testApi('/api/health');
    console.log(`   状态: ${health.status}`);
    console.log(`   响应: ${JSON.stringify(health.data).substring(0, 100)}...\n`);
    
    // 测试游戏分类
    console.log('2. 测试 /api/games/categories');
    const categories = await testApi('/api/games/categories');
    console.log(`   状态: ${categories.status}`);
    console.log(`   响应: ${JSON.stringify(categories.data).substring(0, 100)}...\n`);
    
    // 测试陪玩师列表
    console.log('3. 测试 /api/games/companions');
    const companions = await testApi('/api/games/companions?page=1&pageSize=10');
    console.log(`   状态: ${companions.status}`);
    if (companions.data && companions.data.code === 200) {
      const list = companions.data.data.list || [];
      console.log(`   成功! 返回 ${list.length} 条陪玩师数据`);
      if (list.length > 0) {
        console.log(`   示例: ${list[0].nickName} - ${list[0].price}元/小时`);
      }
    } else {
      console.log(`   响应: ${JSON.stringify(companions.data).substring(0, 200)}`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
})();
