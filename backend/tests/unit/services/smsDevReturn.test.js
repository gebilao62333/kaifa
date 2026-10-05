// 审计 M-5 的行为锁：验证码只回传给「显式声明的非生产环境」。
// 历史实现按 nodeEnv !== 'production' 回传，而 NODE_ENV 未设置时 nodeEnv 静默回落
// 'development'——生产机器漏配 NODE_ENV 就把验证码写进响应体（等同一人可接管任意账号）。
// 现由 config.sms.returnCodeInDev（= !isProd && NODE_ENV 显式声明）决定是否回传。

const makeRedisMock = (store) => ({
  get: async (key) => (store.has(key) ? store.get(key) : null),
  setEx: async (key, ttl, value) => {
    store.set(key, value);
    return 'OK';
  },
  del: async (...keys) => keys.filter((k) => store.delete(k)).length,
  incr: async (key) => {
    const next = Number(store.get(key) || 0) + 1;
    store.set(key, String(next));
    return next;
  },
  expire: async () => 1
});

const loadServiceWith = (configMock) => {
  let service;
  jest.isolateModules(() => {
    const store = new Map();
    jest.doMock('../../../src/config/redis', () => ({ getRedisClient: () => makeRedisMock(store) }));
    jest.doMock('../../../src/config', () => configMock);
    jest.doMock('../../../src/utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
    service = require('../../../src/services/smsService');
  });
  return service;
};

describe('smsService 验证码回传门槛（审计 M-5）', () => {
  afterEach(() => jest.resetModules());

  it('显式非生产且 returnCodeInDev=true：回传 6 位验证码供联调自动回填', async () => {
    const service = loadServiceWith({
      nodeEnv: 'development',
      sms: { appId: '', returnCodeInDev: true }
    });
    const result = await service.sendSMS('13800000000', 'login');
    expect(result).toMatchObject({ success: true });
    expect(result.code).toMatch(/^\d{6}$/);
  });

  it('NODE_ENV 未显式声明（returnCodeInDev=false）：不回传验证码，且显式失败而非静默成功', async () => {
    const service = loadServiceWith({
      nodeEnv: 'development',
      sms: { appId: '', returnCodeInDev: false }
    });
    await expect(service.sendSMS('13800000000', 'login')).rejects.toThrow('短信服务未配置，请联系管理员');
  });

  it('生产环境未配置短信通道：拒绝且绝不回传验证码', async () => {
    const service = loadServiceWith({
      nodeEnv: 'production',
      sms: { appId: '', returnCodeInDev: false }
    });
    await expect(service.sendSMS('13800000000', 'login')).rejects.toThrow('短信服务未配置，请联系管理员');
  });
});
