const express = require('express');

const safeRequire = (path, name) => {
  try {
    const route = require(path);
    if (route && typeof route === 'function' || (route && route.stack)) {
      return route;
    }
    console.log(`⚠️  ${name} 路由格式不兼容，跳过`);
    return null;
  } catch (e) {
    console.log(`⚠️  加载 ${name} 路由失败:`, e.message);
    return null;
  }
};

const setupRoutes = (app) => {
  console.log('🔗 开始加载路由...');

  const basicRouter = express.Router();

  basicRouter.get('/health', (req, res) => {
    res.json({
      code: 200,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: Date.now()
      }
    });
  });

  app.use('/api', basicRouter);

  const routesToLoad = [
    { path: './user', name: '用户', prefix: '/api/user' },
    { path: './chat', name: '聊天', prefix: '/api/chat' },
    { path: './gift', name: '礼物', prefix: '/api/gift' },
    { path: './pay', name: '支付', prefix: '/api/pay' },
    { path: './games', name: '游戏', prefix: '/api/games' },
    { path: './circle', name: '圈子', prefix: '/api/circle' },
    { path: './reserve', name: '预约', prefix: '/api/reserve' },
    { path: './demand', name: '需求', prefix: '/api/demand' },
    { path: './admin', name: '管理员', prefix: '/api/admin' },
    { path: './adminManage', name: '管理员管理', prefix: '/api/admin-manage' },
    { path: './banner', name: 'Banner', prefix: '/api/banner' },
    
    { path: './trtc', name: '音视频', prefix: '/api/trtc' },
    { path: './report', name: '举报', prefix: '/api/report' },
    { path: './upload', name: '上传', prefix: '/api/upload' },
    { path: './region', name: '行政区划', prefix: '/api/region' },
    { path: './virtualUser', name: '虚拟用户', prefix: '/api/virtual-user' },
    { path: './tag', name: '标签管理', prefix: '/api/tag' },
    { path: './vip', name: 'VIP会员', prefix: '/api/vip' },
    { path: './album', name: '相册', prefix: '/api/album' },
    { path: './project', name: '项目管理', prefix: '/api/project' },
    { path: './health', name: '健康检查', prefix: '/api' },
    { path: './share', name: '分享', prefix: '/api/share' },
  ];

  let loadedCount = 0;

  for (const routeInfo of routesToLoad) {
    const route = safeRequire(routeInfo.path, routeInfo.name);
    if (route) {
      app.use(routeInfo.prefix, route);
      loadedCount++;
      console.log(`✅ ${routeInfo.name}路由已加载`);
    }
  }

  console.log(`✅ 路由加载完成！共加载 ${loadedCount} 个路由模块`);
};

module.exports = setupRoutes;