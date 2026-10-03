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
const { xssProtection, apiLimiter } = require('./src/middlewares');

console.log('🚀 正在启动eu搭子后端服务...\n');

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
  console.error('❌ 核心模块加载失败:', e.message);
  // 生产环境下核心模块加载失败属于致命错误，直接退出
  if (config.nodeEnv === 'production') {
    console.error('❌ 生产环境核心模块缺失，服务无法启动');
    process.exit(1);
  }
  console.log('⚠️  非生产环境，服务将继续运行（部分功能可能不可用）');
}

// ==================== 启动配置安全检查 ====================
const COMMON_WEAK = ['123456', 'changeme', 'root123456', 'redis123', 'admin123',
  'eudazi123', 'default-secret-key', 'password', 'test'];
// 占位/示例字符串特征：命中即视为弱值（如 admin-secret-token-change-in-production）
const WEAK_PATTERN = /(changeme|change-me|change-in-production|admin-secret|default-secret|dev-secret|123456|admin123|your-)/i;

const isWeakSecret = (val, minLen) => {
  const s = String(val ?? '');
  return !s || s.length < minLen || COMMON_WEAK.includes(s) || WEAK_PATTERN.test(s);
};

// 收集弱密钥与危险配置
function collectConfigRisks() {
  const checks = [
    ['JWT_SECRET', config.jwt.secret, 16],
    ['ADMIN_TOKEN', config.admin.token, 16],
    ['DB_PASSWORD', config.db.mysql.password, 12],
    ['REDIS_PASSWORD', config.db.redis.password, 12]
  ];
  const weak = [];
  for (const [name, val, minLen] of checks) {
    if (isWeakSecret(val, minLen)) weak.push(name);
  }

  // MongoDB 连接串里内嵌的口令也检查一遍（docker-compose 的默认兜底值是 admin123）
  const mongoUri = String(config.db.mongo.uri || '');
  if (/(:admin123@|:changeme@|:password@|:123456@)/i.test(mongoUri)) {
    weak.push('MONGO_URI(内嵌口令)');
  }

  const warnings = [];
  if (config.admin && config.admin.emergencyLogin) {
    warnings.push('ADMIN_EMERGENCY_LOGIN=true：环境变量应急管理员登录已开启，创建正式管理员后请立即改为 false');
  }
  if ((config.cors.origin || []).includes('*')) {
    warnings.push('CORS_ORIGIN=*：生产环境必须改为具体前端域名（逗号分隔）');
  }
  if (config.useMockDb && config.nodeEnv === 'production') {
    warnings.push('USE_MOCK_DB=true 且 NODE_ENV=production：生产环境不应运行在 Mock 数据库模式');
  }
  return { weak, warnings };
}

// 告警：任何环境都打印，不阻断
function warnWeakSecrets(weak, warnings) {
  if (weak.length) {
    console.log('\n⚠️  ⚠️  ⚠️  安全警告：以下密钥仍为弱值/默认值，生产部署前务必更换：');
    weak.forEach((w) => console.log('   - ' + w));
    console.log('   参考 .env.example 生成强随机值（如 openssl rand -hex 24）。');
  }
  if (warnings.length) {
    console.log('\n⚠️  配置告警：');
    warnings.forEach((w) => console.log('   - ' + w));
  }
  if (weak.length || warnings.length) console.log('');
}

// 生产环境强制校验：关键密钥缺失/弱值直接拒绝启动
// 可设置 ALLOW_INSECURE_CONFIG=true 显式降级为告警（仅限受控排障，不推荐）。
function enforceProductionConfig() {
  if (config.nodeEnv !== 'production') return;

  if (String(process.env.ALLOW_INSECURE_CONFIG).toLowerCase() === 'true') {
    console.log('\n⚠️  ALLOW_INSECURE_CONFIG=true：已跳过生产环境密钥强制校验（不推荐）\n');
    return;
  }

  const fatal = [];
  if (isWeakSecret(config.jwt.secret, 16)) {
    fatal.push('JWT_SECRET 未设置或为弱值（可被用于伪造任意用户 JWT）');
  }
  if (isWeakSecret(config.db.mysql.password, 12)) {
    fatal.push('DB_PASSWORD 未设置或为弱值');
  }
  // ADMIN_TOKEN 为空表示应急令牌通道关闭（安全）；非空但弱值才是问题
  if (config.admin.token && isWeakSecret(config.admin.token, 16)) {
    fatal.push('ADMIN_TOKEN 为弱值（x-admin-token 等同于超级管理员身份）');
  }
  if ((config.cors.origin || []).includes('*')) {
    fatal.push('CORS_ORIGIN=*：允许任意站点跨域调用接口');
  }
  if (config.useMockDb) {
    fatal.push('USE_MOCK_DB=true：生产环境禁止使用 Mock 数据库');
  }

  if (fatal.length) {
    console.error('\n❌ 生产环境配置校验失败，拒绝启动：');
    fatal.forEach((f) => console.error('   - ' + f));
    console.error('   请修正 .env 后重启；确需临时跳过请设置 ALLOW_INSECURE_CONFIG=true。\n');
    process.exit(1);
  }
}

const __configRisks = collectConfigRisks();
warnWeakSecrets(__configRisks.weak, __configRisks.warnings);
enforceProductionConfig();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.cors ? config.cors.origin : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
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

// 强制所有 JSON 响应使用 UTF-8 编码，防止中文乱码
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

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

// 健康检查：真实探测依赖连通性（供 Docker HEALTHCHECK 与外部探针轮询）
// - 核心依赖 MySQL 不可达 → 503 unhealthy（触发监控告警/重启策略）
// - 可选依赖 Mongo/Redis 不可达 → 200 degraded（服务可降级运行）
// - 全部正常 → 200 healthy
app.get('/api/health', async (req, res) => {
  try {
    const { probeHealth } = require('./src/healthcheck');
    const deps = await probeHealth();
    const coreUp = deps.mysql === 'up' || deps.mysql === 'mock';
    const optionalDown = deps.mongo === 'down' || deps.redis === 'down';

    let status, httpCode;
    if (!coreUp) {
      status = 'unhealthy';
      httpCode = 503;
    } else if (optionalDown) {
      status = 'degraded';
      httpCode = 200;
    } else {
      status = 'healthy';
      httpCode = 200;
    }

    res.status(httpCode).json({
      code: httpCode,
      message: status,
      data: {
        status,
        timestamp: deps.timestamp,
        service: 'eudazi-peer-backend',
        version: '3.0.0',
        mode: config.useMockDb ? 'mock' : 'production',
        dependencies: deps
      }
    });
  } catch (e) {
    res.status(503).json({
      code: 503,
      message: 'unhealthy',
      data: { status: 'unhealthy', error: e.message }
    });
  }
});

// 简单的测试路由
app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    message: 'API测试成功',
    data: {
      service: 'eu搭子',
      features: ['聊天', '礼物', '游戏陪玩', '派对', '社交圈子'],
      mode: config.useMockDb ? 'mock' : 'production'
    }
  });
});

// Swagger API文档：生产环境默认关闭，避免暴露完整 API 面；
// 本地开发（NODE_ENV 非 production）或显式 ENABLE_SWAGGER=true 时开启
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  try {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./src/config/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('✅ Swagger API文档加载成功');
  } catch (e) {
    console.log('⚠️  Swagger模块加载失败:', e.message);
  }
}

// 全局限流：覆盖 /api 下所有业务路由（健康检查/API测试已在此之前注册，不受限流影响）
// 开发环境自动跳过；阈值由 RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX_REQUESTS 控制
app.use('/api', apiLimiter);

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

// 超时保护：确保任何外部依赖（DB/Redis）连接挂起都不会阻塞 HTTP 服务启动
const withTimeout = (promise, ms, label) => {
  let timer;
  return Promise.race([
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); return v; },
      (e) => { clearTimeout(timer); console.log(`⚠️  ${label} 连接失败:`, e && e.message) }
    ),
    new Promise((resolve) => {
      timer = setTimeout(() => {
        console.log(`⚠️  ${label} 连接超时（${ms}ms），跳过并继续启动`)
        resolve()
      }, ms)
    })
  ])
}

const startServer = async () => {
  try {
    if (sequelize && sequelize.authenticate) {
      await withTimeout(sequelize.authenticate(), 5000, 'MySQL 数据库')
      console.log('✅ MySQL 数据库检查完成（失败时自动降级 Mock）')
    }

    if (connectMongo) {
      await withTimeout(connectMongo(), 6000, 'MongoDB')
      console.log('✅ MongoDB 检查完成')
    }

    if (connectRedis) {
      await withTimeout(connectRedis(), 6000, 'Redis')
      console.log('✅ Redis 检查完成')
    }

    // 自动执行数据库迁移（防 schema 漂移）
    // - Mock 模式自动跳过；设置 AUTO_MIGRATE=false 可关闭
    // - 迁移均幂等，重复执行安全；失败时仅告警、不阻断服务启动
    if (!config.useMockDb && process.env.AUTO_MIGRATE !== 'false' && sequelize && sequelize.authenticate) {
      try {
        const { runMigrations } = require('./src/migrations/runMigrations');
        await Promise.race([
          runMigrations(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('迁移执行超时(30s)')), 30000))
        ]);
        console.log('✅ 数据库自动迁移完成（schema 已同步）');
      } catch (e) {
        console.error('❌ 数据库自动迁移失败（服务仍继续启动，请尽快检查数据库 schema）:', e && e.message);
      }
    }

    server.listen(config.port, () => {
      console.log('\n========================================');
      console.log('🎉 eu搭子后端服务已成功启动！');
      console.log(`📍 服务地址: http://localhost:${config.port}`);
      console.log(`🔍 健康检查: http://localhost:${config.port}/api/health`);
      console.log(`🧪 API测试: http://localhost:${config.port}/api/test`);
      console.log(`📖 环境: ${config.nodeEnv}`);
      console.log(`⚡ 模式: ${config.useMockDb ? 'Mock (开发)' : 'Production (生产)'}`);
      console.log(`⚡ Socket.IO 已启用`);
      console.log('========================================\n');

      // 虚拟人随机在线调度器（数据库可用时启动，失败不影响主服务）
      try {
        const scheduler = require('./src/services/virtualUserOnlineScheduler');
        scheduler.startVirtualUserOnlineScheduler();
      } catch (e) {
        console.log('⚠️  虚拟人随机在线调度器启动失败:', e.message);
      }

      // 未接通通话单清理器（把超时未接的电话标记为「无应答」，避免残留「呼叫中」）
      try {
        const callCleanup = require('./src/services/callRecordCleanup');
        callCleanup.startCallRecordCleanup();
      } catch (e) {
        console.log('⚠️  通话单清理器启动失败:', e.message);
      }
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
  try {
    const scheduler = require('./src/services/virtualUserOnlineScheduler');
    scheduler.stopVirtualUserOnlineScheduler();
    const callCleanup = require('./src/services/callRecordCleanup');
    callCleanup.stopCallRecordCleanup();
  } catch (e) { /* ignore */ }
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
