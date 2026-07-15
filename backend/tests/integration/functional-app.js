/**
 * 真实路由功能测试应用
 *
 * 该模块加载真实的 src/routes（用户、礼物、游戏、圈子、聊天、VIP 等），
 * 仅 mock 掉底层数据库模型与外部依赖（Redis 返回 null），
 * 由服务层的 mock 回退逻辑提供内存数据，从而在不依赖真实 MySQL/Mongo/Redis
 * 的情况下对业务接口进行端到端功能测试。
 */
const express = require('express');
const setupRoutes = require('../../src/routes');

// 强制 development 模式，使 authMiddleware 支持 mock-token、rateLimit 自动跳过
process.env.NODE_ENV = 'development';

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
