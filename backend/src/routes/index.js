const express = require('express');
const logger = require('../utils/logger');

const safeRequire = (path, name) => {
  try {
    const route = require(path);
    if (route && (typeof route === 'function' && (route.stack || route.use))) {
      return route;
    }
    logger.warn(`⚠️  ${name} 路由格式不兼容，跳过（路径: ${path}）`);
    return null;
  } catch (e) {
    logger.error(`⚠️  加载 ${name} 路由失败（路径: ${path}）:`, e.message);
    return null;
  }
};

const setupRoutes = (app) => {
  logger.info('🔗 开始加载路由...');

  // 健康检查已在 server.js 中注册（/api/health），此处不再重复

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
    { path: './splash', name: '开屏弹窗', prefix: '/api/splash' },
    { path: './config', name: '配置', prefix: '/api/config' },
    { path: './download', name: '下载', prefix: '/api/download' },
    { path: './search', name: '搜索', prefix: '/api/search' },
    { path: './notice', name: '公告', prefix: '/api/notice' },
    { path: './feedback', name: '意见反馈', prefix: '/api/feedback' },
    
    { path: './trtc', name: '音视频', prefix: '/api/trtc' },
    { path: './report', name: '举报', prefix: '/api/report' },
    { path: './upload', name: '上传', prefix: '/api/upload' },
    { path: './region', name: '行政区划', prefix: '/api/region' },
    { path: './virtualUser', name: '虚拟用户', prefix: '/api/virtual-user' },
    { path: './tag', name: '标签管理', prefix: '/api/tag' },
    { path: './vip', name: 'VIP会员', prefix: '/api/vip' },
    { path: './album', name: '相册', prefix: '/api/album' },
    { path: './p2p', name: 'P2P', prefix: '/api/p2p' },
    { path: './wallet', name: '钱包', prefix: '/api/wallet' },
  ];

  let loadedCount = 0;
  const failedRoutes = [];

  for (const routeInfo of routesToLoad) {
    const route = safeRequire(routeInfo.path, routeInfo.name);
    if (route) {
      app.use(routeInfo.prefix, route);
      loadedCount++;
      logger.info(`✅ ${routeInfo.name}路由已加载`);
    } else {
      failedRoutes.push(`${routeInfo.name}(${routeInfo.prefix})`);
    }
  }

  logger.info(`✅ 路由加载完成！共加载 ${loadedCount} 个路由模块`);
  if (failedRoutes.length > 0) {
    // 有路由未加载成功时显式告警，避免部署期故障被静默掩盖
    logger.warn(`🚨 警告：${failedRoutes.length} 个路由模块未加载成功：${failedRoutes.join('、')}，对应接口将返回 404`);
    if (process.env.STRICT_ROUTES === 'true') {
      throw new Error(`STRICT_ROUTES=true：路由加载不完整，终止启动。未加载：${failedRoutes.join('、')}`);
    }
  }
};

module.exports = setupRoutes;