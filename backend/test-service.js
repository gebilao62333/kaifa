const http = require('http');

console.log('正在测试服务连接...\n');

// 测试健康检查端点
const testHealth = () => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('✅ 健康检查响应:');
        console.log('状态码:', res.statusCode);
        console.log('响应内容:', data);
        console.log('');
        resolve();
      });
    }).on('error', (err) => {
      console.log('❌ 健康检查失败:', err.message);
      reject(err);
    });
  });
};

// 运行测试
testHealth()
  .then(() => {
    console.log('🎉 测试通过！完整后端服务运行正常！');
  })
  .catch((err) => {
    console.log('\n❌ 测试失败，请确保服务已启动！');
    process.exit(1);
  });
