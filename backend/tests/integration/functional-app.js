/**
 * 真实路由功能测试应用
 *
 * 该模块加载真实的 src/routes（用户、礼物、游戏、圈子、聊天、VIP 等），
 * 仅 mock 掉底层数据库模型与外部依赖（Redis 返回 null），
 * 由服务层的 mock 回退逻辑提供内存数据，从而在不依赖真实 MySQL/Mongo/Redis
 * 的情况下对业务接口进行端到端功能测试。
 */
const express = require('express');

// 必须在加载 src/routes 之前设置：src/config 在 require 时就读取环境变量。
// NODE_ENV=development → authMiddleware 支持 mock-token；
// 限流豁免不再看环境（审计 H-8），改由 RATE_LIMIT_DISABLED 显式关闭，
// 否则本套集成测试会因全局 100 次/分钟、验证码 1 次/分钟的窗口出现偶发 429。
process.env.NODE_ENV = 'development';
process.env.RATE_LIMIT_DISABLED = 'true';

const setupRoutes = require('../../src/routes');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查（与 server.js 保持一致）
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'OK', data: { status: 'healthy', timestamp: Date.now() } });
});

setupRoutes(app);

// 404 / 错误处理（与 server.js 保持一致）
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

module.exports = app;
