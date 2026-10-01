// 进程入口：启动 HTTP 服务并监听配置端口。
const config = require('./src/config');
const createApp = require('./src/app');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`✅ 多可启动项目已运行: http://localhost:${config.port}`);
  console.log(`   - 落地页:      http://localhost:${config.port}/`);
  console.log(`   - 后台管理:    http://localhost:${config.port}/admin.html`);
  console.log(`   - 健康检查:    http://localhost:${config.port}/api/health`);
  console.log(`   - 公开下载API: http://localhost:${config.port}/api/download/platforms`);
});

// 优雅关闭
const shutdown = (signal) => {
  console.log(`\n收到 ${signal}，正在关闭...`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
