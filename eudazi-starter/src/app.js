// 应用入口组装：中间件 + 路由 + 静态资源 + 统一错误处理。
const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { xssProtection } = require('./middlewares');
const registerRoutes = require('./routes');

const createApp = () => {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // 全局输入安全转义（会影响下载链接，Service 层已做解码还原）
  app.use(xssProtection);

  // 静态资源：落地页与后台 UI（同源部署，无需跨域）
  app.use(express.static(path.join(__dirname, '..', 'public')));

  registerRoutes(app);

  // 404
  app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在' }));

  // 统一错误兜底
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('未捕获错误:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  });

  return app;
};

module.exports = createApp;
