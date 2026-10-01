// 路由挂载中心：统一注册所有路由模块，新增模块只需在此追加一行。
const express = require('express');

const registerRoutes = (app) => {
  // 健康检查（无需鉴权）
  app.get('/api/health', (req, res) =>
    res.json({ code: 200, message: 'OK', data: { status: 'healthy', timestamp: Date.now() } }),
  );

  const routes = [
    { prefix: '/api/download', router: require('./download') },
    { prefix: '/api/admin', router: require('./admin') },
  ];

  routes.forEach(({ prefix, router }) => app.use(prefix, router));
};

module.exports = registerRoutes;
