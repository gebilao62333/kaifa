const { Sequelize } = require('sequelize');
const config = require('./index');

let sequelize;

const retryConnection = async (fn, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`数据库连接失败 (${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw new Error('数据库连接重试次数已用完');
};

if (config.useMockDb) {
  console.log('📦 使用 Mock 数据库模式');
  sequelize = {
    authenticate: async () => {
      console.log('✅ Mock 数据库认证成功');
      return Promise.resolve();
    },
    sync: async () => {
      console.log('✅ Mock 数据库同步成功');
      return Promise.resolve();
    },
    define: () => ({ sync: async () => {} })
  };
} else {
  sequelize = new Sequelize(
    config.db.mysql.name,
    config.db.mysql.user,
    config.db.mysql.password,
    {
      host: config.db.mysql.host,
      port: config.db.mysql.port,
      dialect: 'mysql',
      charset: config.db.mysql.charset,
      logging: config.nodeEnv === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : false,
      pool: {
        ...config.db.mysql.pool,
        validateConnection: (conn) => {
          return conn.state === 'authenticated';
        }
      },
      define: {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      },
      retry: {
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/
        ],
        max: 5
      },
      queryTimeout: 30000,
      benchmark: config.nodeEnv === 'development'
    }
  );

  sequelize.authenticateWithRetry = async () => {
    return retryConnection(() => sequelize.authenticate());
  };
}

module.exports = sequelize;
