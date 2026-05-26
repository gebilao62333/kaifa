require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./src/config');
const { xssProtection } = require('./src/middlewares');

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
  res.json({
    code: 200,
    message: 'OK',
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      service: 'duoke-peer-backend',
      version: '3.0.0',
      mode: config.useMockDb ? 'mock' : 'production'
    }
  });
});

// 数据库健康检查
app.get('/api/health/db', async (req, res) => {
  try {
    const dbHealthChecker = require('./src/utils/dbHealthChecker');
    const health = await dbHealthChecker.checkAllHealth();
    res.json({
      code: 200,
      message: health.overall === 'healthy' ? '所有数据库连接正常' : '部分数据库连接异常',
      data: health
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '健康检查失败',
      data: { error: error.message }
    });
  }
});

// 简单的测试路由
app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    message: 'API测试成功',
    data: {
      service: '多客陪玩',
      features: ['聊天', '礼物', '游戏陪玩', '派对', '社交圈子'],
      mode: config.useMockDb ? 'mock' : 'production'
    }
  });
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
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  const errorMsg = '服务器错误';
  if (logger && logger.error) {
    logger.error(errorMsg, err);
  } else {
    console.error(`❌ ${errorMsg}:`, err);
  }
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
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
    console.log('\n🔄 正在初始化数据库连接...');
    
    const dbHealthChecker = require('./src/utils/dbHealthChecker');
    const connectionResults = await dbHealthChecker.initializeDatabases();
    
    const allConnected = connectionResults.every(r => r.status === 'fulfilled' && r.value.status === 'healthy');
    
    server.listen(config.port, () => {
      console.log('\n========================================');
      console.log('🎉 多客陪玩后端服务已成功启动！');
      console.log(`📍 服务地址: http://localhost:${config.port}`);
      console.log(`🔍 健康检查: http://localhost:${config.port}/api/health`);
      console.log(`🔍 数据库状态: http://localhost:${config.port}/api/health/db`);
      console.log(`🧪 API测试: http://localhost:${config.port}/api/test`);
      console.log(`📖 环境: ${config.nodeEnv}`);
      console.log(`⚡ 模式: ${config.useMockDb ? 'Mock (开发)' : 'Production (生产)'}`);
      console.log(`⚡ Socket.IO 已启用`);
      console.log(`📊 数据库连接: ${allConnected ? '全部正常' : '部分异常'}`);
      console.log('========================================\n');
    });

    process.on('SIGINT', async () => {
      console.log('\n👋 正在优雅关闭服务...');
      try {
        await server.close();
        console.log('✅ HTTP 服务器已关闭');
      } catch (error) {
        console.error('❌ 关闭服务器时出错:', error);
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  const msg = '未处理的Promise拒绝';
  if (logger && logger.error) {
    logger.error(msg, reason);
  } else {
    console.error(`❌ ${msg}:`, reason);
  }
});

process.on('uncaughtException', (error) => {
  const msg = '未捕获的异常';
  if (logger && logger.error) {
    logger.error(msg, error);
  } else {
    console.error(`❌ ${msg}:`, error);
  }
  process.exit(1);
});

process.on('SIGTERM', async () => {
  const msg = '收到SIGTERM信号，正在关闭服务器...';
  if (logger && logger.info) {
    logger.info(msg);
  } else {
    console.log('📤', msg);
  }
  server.close(() => {
    const closeMsg = '服务器已关闭';
    if (logger && logger.info) {
      logger.info(closeMsg);
    } else {
      console.log('👋', closeMsg);
    }
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  const msg = '收到SIGINT信号，正在关闭服务器...';
  if (logger && logger.info) {
    logger.info(msg);
  } else {
    console.log('📤', msg);
  }
  server.close(() => {
    const closeMsg = '服务器已关闭';
    if (logger && logger.info) {
      logger.info(closeMsg);
    } else {
      console.log('👋', closeMsg);
    }
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, io };
