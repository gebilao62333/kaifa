// 审计 H-9：.env 卫生回归测试。
// 背景：MySQL 口令曾兜底 '123456'、Redis 备份脚本曾兜底 'redis123'，未配置环境变量时会
// 「静默使用已知弱口令」而不是暴露配置缺失；本文件锁定配置层不再包含任何口令兜底。
// （backup.js 的 docker 分支因 require 即执行 main()，无法在单测中加载，见文件内注释。）
describe('Config - env hygiene (H-9)', () => {
  const KEYS = ['DB_PASSWORD', 'REDIS_PASSWORD', 'JWT_SECRET', 'NODE_ENV', 'TRUST_PROXY'];
  let saved;

  beforeEach(() => {
    saved = {};
    KEYS.forEach((k) => {
      saved[k] = process.env[k];
      delete process.env[k];
    });
  });

  afterEach(() => {
    KEYS.forEach((k) => {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });

  const loadConfig = () => {
    let cfg;
    jest.isolateModules(() => {
      cfg = require('../../../src/config');
    });
    return cfg;
  };

  it('未设置 DB_PASSWORD 时不再回落到弱口令 123456', () => {
    const config = loadConfig();
    expect(config.db.mysql.password).toBeUndefined();
  });

  it('设置 DB_PASSWORD 时原样透传', () => {
    process.env.DB_PASSWORD = 'A1b2C3d4E5f6G7h8I9j0K1l2';
    const config = loadConfig();
    expect(config.db.mysql.password).toBe('A1b2C3d4E5f6G7h8I9j0K1l2');
  });

  it('未设置 REDIS_PASSWORD 时为 undefined（不回落字符串）', () => {
    const config = loadConfig();
    expect(config.db.redis.password).toBeUndefined();
  });

  it('JWT_SECRET 的兜底哨兵仅用于触发启动自检告警', () => {
    // server.js warnWeakSecrets 的 COMMON_WEAK 依赖该哨兵值；它不是可用的真实密钥，
    // 生产环境在配置层（JWT_SECRET 必填且 ≥32 字符）即被拦下。
    const config = loadConfig();
    expect(config.jwt.secret).toBe('default-secret-key');
  });
});
