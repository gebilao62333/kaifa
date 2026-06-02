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
  console.log('🧪 测试圈子 API 接口\n');
  
  try {
    // 测试标签
    console.log('1. 测试 /api/circle/tags');
    const tags = await testApi('/api/circle/tags');
    console.log(`   状态: ${tags.status}`);
    console.log(`   响应: ${JSON.stringify(tags.data).substring(0, 150)}...\n`);
    
    // 测试帖子列表
    console.log('2. 测试 /api/circle/posts');
    const posts = await testApi('/api/circle/posts?page=1&pageSize=10');
    console.log(`   状态: ${posts.status}`);
    if (posts.data && posts.data.code === 200) {
      const list = posts.data.data.list || [];
      console.log(`   成功! 返回 ${list.length} 条帖子数据`);
    } else {
      console.log(`   响应: ${JSON.stringify(posts.data).substring(0, 200)}`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
})();
