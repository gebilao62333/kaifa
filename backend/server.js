require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 50;

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./src/config');
const { xssProtection, csrfProtection } = require('./src/middlewares');
const { versionMiddleware } = require('./src/middlewares/version');

console.log('🚀 正在启动多客陪玩后端服务...\n');

let sequelize, connectMongo, connectRedis, setupRoutes, initializeSocket;
let logger;

try {
  sequelize = require('./src/config/mysql');
  connectMongo = require('./src/config/mongo');
  const redisConfig = require('./src/config/redis');
  connectRedis = redisConfig.connectRedis;
  setupRoutes = require('./src/routes');
  initializeSocket = require('./src/socket').initializeSocket;
  logger = require('./src/utils/logger');
  console.log('✅ 核心模块加载成功');
} catch (e) {
  console.log('⚠️  部分模块加载失败，但服务将继续运行:', e.message);
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'sameorigin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true
}));
app.use(cookieParser());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(xssProtection);

// CSRF 防护 — 排除不需要认证的公开接口（登录/初始化/刷新令牌）
const CSRF_WHITELIST = [
  '/api/admin-manage/login',
  '/api/admin-manage/init',
  '/api/admin-manage/refresh-token',
  '/api/admin/login'
];

app.use((req, res, next) => {
  // 仅在 development + mock 模式下跳过 CSRF，生产环境或使用真实数据库时强制启用
  const isDevMockMode = config.nodeEnv === 'development' && config.useMockDb === true;
  if (isDevMockMode) return next();
  // 白名单内的公开接口不需要 CSRF token
  if (CSRF_WHITELIST.some(p => req.path === p || req.path.startsWith(p + '?'))) return next();
  return csrfProtection(req, res, next);
});

// API 版本控制 — 全局启用
app.use('/api', versionMiddleware);

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  const logMsg = `${req.method} ${req.url} - ${req.ip}`;
  if (logger && logger.info) {
    logger.info(logMsg);
  } else {
    console.log(`📥 ${logMsg}`);
  }
  next();
});

// 健康检查
app.get('/api/health', (req, res) => {
  const response = require('./src/utils/response');
  response.success(res, {
    status: 'healthy',
    timestamp: Date.now(),
    service: 'duoke-peer-backend',
    version: '3.0.0',
    mode: 'local'
  }, 'OK');
});

// 数据库健康检查
app.get('/api/health/db', async (req, res) => {
  const response = require('./src/utils/response');
  try {
    const dbHealthChecker = require('./src/utils/dbHealthChecker');
    const health = await dbHealthChecker.checkAllHealth();
    response.success(res, health, health.overall === 'healthy' ? '所有数据库连接正常' : '部分数据库连接异常');
  } catch (error) {
    response.error(res, '健康检查失败');
  }
});

// 简单的测试路由
app.get('/api/test', (req, res) => {
  const response = require('./src/utils/response');
  response.success(res, {
    service: '多客陪玩',
    features: ['聊天', '礼物', '游戏陪玩', '派对', '社交圈子'],
    mode: 'local'
  }, 'API测试成功');
});

// Swagger API文档
try {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./src/config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('✅ Swagger API文档加载成功');
} catch (e) {
  console.log('⚠️  Swagger模块加载失败:', e.message);
}

// 设置路由（如果可用）
try {
  if (setupRoutes) {
    setupRoutes(app);
    console.log('✅ 路由模块加载成功');
  }
} catch (e) {
  console.log('⚠️  路由模块加载失败:', e.message);
}

// 404 处理
app.use((req, res) => {
  const response = require('./src/utils/response');
  response.notFound(res, '接口不存在');
});

// 错误处理
app.use((err, req, res, next) => {
  const errMessage = err.message || '服务器内部错误';
  if (logger && logger.error) {
    logger.error('服务器错误:', err);
  } else {
    console.error('❌ 服务器错误:', err);
  }
  const response = require('./src/utils/response');
  response.error(res, process.env.NODE_ENV === 'production' ? '服务器内部错误' : errMessage);
});

// Socket.IO 处理
try {
  if (initializeSocket) {
    initializeSocket(io);
    console.log('✅ Socket.IO 初始化成功');
  } else {
    // 简单的 Socket 备用实现
    io.on('connection', (socket) => {
      console.log('👤 用户连接:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('👤 用户断开连接:', socket.id);
      });
    });
  }
} catch (e) {
  console.log('⚠️  Socket.IO 初始化失败:', e.message);
  // 简单的备用 Socket
  io.on('connection', (socket) => {
    console.log('👤 用户连接:', socket.id);
    socket.on('disconnect', () => {
      console.log('👤 用户断开连接:', socket.id);
    });
  });
}

const startServer = async () => {
  try {
    // 生产环境安全检查：JWT Secret 必须显式配置
    if (config.nodeEnv === 'production') {
      if (!process.env.JWT_SECRET) {
        console.error('❌ 生产环境必须设置 JWT_SECRET 环境变量！');
        process.exit(1);
      }
      if (!process.env.ADMIN_TOKEN) {
        console.warn('⚠️  生产环境建议设置 ADMIN_TOKEN 环境变量');
      }
    }

    console.log('\n🔄 正在初始化数据库连接...');
    
    // 初始化数据库连接（带容错处理）
    let allConnected = false;
    try {
      const dbHealthChecker = require('./src/utils/dbHealthChecker');
      const connectionResults = await dbHealthChecker.initializeDatabases();
      allConnected = connectionResults.every(r => r.status === 'fulfilled' && r.value.status === 'healthy');
    } catch (dbError) {
      console.warn('⚠️ 数据库连接初始化失败:', dbError.message);
      console.log('💡 服务器将继续运行，部分功能可能受限');
      allConnected = false;
    }
    
    // 初始化数据（本地数据源模式）
    try {
      const { initializeDatabase } = require('./src/utils/dbInitializer');
      await initializeDatabase();
    } catch (dataInitError) {
      console.warn('⚠️ 数据初始化失败:', dataInitError.message);
      console.log('💡 服务将继续运行，默认数据可能缺失');
    }
    
    const net = require('net');
    
    // 检查端口是否被占用
    const checkPort = (port) => {
      return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            resolve(false);
          } else {
            reject(err);
          }
        });
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        server.listen(port);
      });
    };
    
    // 寻找可用端口
    let finalPort = config.port;
    const isPortAvailable = await checkPort(finalPort);
    
    if (!isPortAvailable) {
      console.warn(`⚠️ 端口 ${finalPort} 被占用，正在寻找可用端口...`);
      for (let p = finalPort + 1; p <= finalPort + 100; p++) {
        const available = await checkPort(p);
        if (available) {
          finalPort = p;
          console.log(`✅ 找到可用端口: ${finalPort}`);
          break;
        }
      }
    }
    
    server.listen(finalPort, () => {
      console.log('\n========================================');
      console.log('🎉 多客陪玩后端服务已成功启动！');
      console.log(`📍 服务地址: http://localhost:${finalPort}`);
      console.log(`🔍 健康检查: http://localhost:${finalPort}/api/health`);
      console.log(`🔍 数据库状态: http://localhost:${finalPort}/api/health/db`);
      console.log(`🧪 API测试: http://localhost:${finalPort}/api/test`);
      console.log(`📖 环境: ${config.nodeEnv}`);
      console.log(`⚡ 模式: Local (本地数据源)`);
      console.log(`⚡ Socket.IO 已启用`);
      console.log(`📊 数据库连接: ${allConnected ? '全部正常' : '部分异常'}`);
      if (config.nodeEnv === 'development') {
        console.log(`🔑 默认管理员账号已就绪（开发环境）`);
      }
      console.log('========================================\n');
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  const msg = `收到${signal}信号，正在优雅关闭服务...`;
  if (logger && logger.info) {
    logger.info(msg);
  } else {
    console.log(`📤 ${msg}`);
  }
  try {
    await server.close();
    const closeMsg = 'HTTP 服务器已关闭';
    if (logger && logger.info) {
      logger.info(closeMsg);
    } else {
      console.log(`✅ ${closeMsg}`);
    }
    process.exit(0);
  } catch (error) {
    const errMsg = '关闭服务器时出错';
    if (logger && logger.error) {
      logger.error(errMsg, error);
    } else {
      console.error(`❌ ${errMsg}:`, error);
    }
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  const msg = '未处理的Promise拒绝';
  if (logger && logger.error) {
    logger.error(msg, reason);
  } else {
    console.error(`❌ ${msg}:`, reason);
  }
  // 记录详细错误堆栈
  if (reason && reason.stack) {
    console.error(reason.stack);
  }
});

process.on('uncaughtException', async (error) => {
  const msg = '未捕获的异常';
  if (logger && logger.error) {
    logger.error(msg, error);
  } else {
    console.error(`❌ ${msg}:`, error);
  }
  try {
    await server.close();
  } catch {}
  process.exit(1);
});

startServer();

module.exports = { app, server, io };
