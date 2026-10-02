const { Sequelize } = require('sequelize');
const config = require('./index');

let sequelize;

if (config.useMockDb) {
  // Mock 模式：使用内存数据存储
  console.log('📦 使用 Mock 数据库模式');
  const mockModel = {
    findAll: async () => [],
    findOne: async () => null,
    findByPk: async () => null,
    findOrCreate: async () => [{}, false],
    findAndCountAll: async () => ({ rows: [], count: 0 }),
    create: async (data) => ({ id: 0, ...data }),
    update: async () => [0],
    destroy: async () => 0,
    count: async () => 0,
    sum: async () => 0,
    max: async () => null,
    min: async () => null,
    increment: async () => [{}],
    decrement: async () => [{}],
    bulkCreate: async (records) => records,
    upsert: async () => [{}],
    associate: () => {},
    hasMany: () => {},
    belongsTo: () => {},
    hasOne: () => {},
    belongsToMany: () => {}
  };
  sequelize = {
    authenticate: async () => {
      console.log('✅ Mock 数据库认证成功');
      return Promise.resolve();
    },
    sync: async () => {
      console.log('✅ Mock 数据库同步成功');
      return Promise.resolve();
    },
    define: () => ({ ...mockModel }),
    query: async () => [[], {}],
    transaction: async (fn) => fn ? fn({ commit: async () => {}, rollback: async () => {} }) : {}
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
      dialectOptions: {
        charset: config.db.mysql.charset || 'utf8mb4',
        // mysql2 不识别 collate，传了只会告警；建表排序规则由下方 define 控制
        connectTimeout: 10000
      },
      logging: config.nodeEnv === 'development' ? console.log : false,
      pool: config.db.mysql.pool,
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: false,
        underscored: true,
        freezeTableName: true
      }
    }
  );
}

module.exports = sequelize;
