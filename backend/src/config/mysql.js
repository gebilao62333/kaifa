const { Sequelize } = require('sequelize');
const config = require('./index');

let sequelize;

if (config.useMockDb) {
  // Mock 模式：使用内存数据存储
  console.log('📦 使用 Mock 数据库模式');
  sequelize = {
    authenticate: async () => {
      console.log('✅ Mock 数据库认证成功');
      return Promise.resolve();
    },
    sync: async () => {
      console.log('✅ Mock 数据库同步成功');
      return Promise.resolve();
    }
  };
} else {
  // 真实数据库模式
  sequelize = new Sequelize(
    config.db.mysql.name,
    config.db.mysql.user,
    config.db.mysql.password,
    {
      host: config.db.mysql.host,
      port: config.db.mysql.port,
      dialect: 'mysql',
      charset: config.db.mysql.charset,
      logging: config.nodeEnv === 'development' ? console.log : false,
      pool: config.db.mysql.pool,
      define: {
        timestamps: false,
        underscored: true,
        freezeTableName: true
      }
    }
  );
}

module.exports = sequelize;
