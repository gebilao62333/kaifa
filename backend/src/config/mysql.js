/**
 * 数据库配置 - 支持真实 MySQL / 本地数据源模式
 *
 * - USE_MOCK_DB=false → 连接真实 MySQL 数据库
 * - USE_MOCK_DB=true / 未设置 → 使用 LocalSequelize（内存+JSON 持久化）
 */

const config = require('./index');

let sequelize;

if (config.useMockDb) {
  // === 本地数据源模式 ===
  const { LocalSequelize } = require('./localDb');
  console.log('📦 使用本地数据源模式（数据持久化到 JSON 文件）');

  sequelize = new LocalSequelize();
} else {
  // === 真实 MySQL 模式 ===
  const { Sequelize } = require('sequelize');
  const dbConfig = config.db.mysql;

  console.log(`🗄️ 连接 MySQL: ${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`);

  sequelize = new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    charset: dbConfig.charset,
    pool: dbConfig.pool,
    retry: dbConfig.retry,
    logging: config.nodeEnv === 'development' ? (msg) => console.log('  SQL:', msg) : false,
    timezone: '+08:00',
    define: {
      charset: dbConfig.charset,
      collate: dbConfig.charset + '_unicode_ci',
      timestamps: true,
      underscored: false
    }
  });
}

// 添加 authenticateWithRetry 兼容方法
sequelize.authenticateWithRetry = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      const mode = config.useMockDb ? '本地数据源' : 'MySQL';
      console.log(`✅ ${mode} 连接成功`);
      return Promise.resolve();
    } catch (e) {
      if (i < retries - 1) {
        console.warn(`⚠️ 数据库连接失败 (${i + 1}/${retries})，${delay / 1000}s 后重试:`, e.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ 数据库连接失败（已耗尽重试次数）:', e.message);
        throw e;
      }
    }
  }
};

module.exports = sequelize;
