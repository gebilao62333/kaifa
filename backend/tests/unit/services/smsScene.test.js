// C-1/H-1 修复的行为锁：验证码必须按场景隔离、一次性、且有失败次数上限。
jest.mock('../../../src/config/redis', () => {
  const store = new Map();
  const now = () => Math.floor(Date.now() / 1000);
  const alive = (key) => {
    const item = store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= now()) {
      store.delete(key);
      return null;
    }
    return item.value;
  };
  global.__fakeRedisStore = store;
  return {
    getRedisClient: () => ({
      get: async (key) => alive(key),
      setEx: async (key, ttl, value) => {
        store.set(key, { value, expiresAt: now() + Number(ttl) });
        return 'OK';
      },
      del: async (...keys) => keys.filter((k) => store.delete(k)).length,
      incr: async (key) => {
        const next = Number(alive(key) || 0) + 1;
        store.set(key, { value: String(next), expiresAt: store.get(key) ? store.get(key).expiresAt : null });
        return next;
      },
      expire: async (key, ttl) => {
        if (store.has(key)) store.get(key).expiresAt = now() + Number(ttl);
        return 1;
      }
    })
  };
});

jest.mock('../../../src/config', () => ({
  nodeEnv: 'test',
  sms: { appId: '', secretId: '', secretKey: '', sign: 'test', templateId: '', notifyTemplateId: '', returnCodeInDev: true }
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const smsService = require('../../../src/services/smsService');

const store = () => global.__fakeRedisStore;

describe('smsService 验证码场景隔离与失败上限', () => {
  beforeEach(() => store().clear());

  it('拒绝未知场景的发送', async () => {
    await expect(smsService.sendSMS('13800000000', 'admin')).rejects.toThrow('不支持的短信场景');
  });

  it('非生产环境把验证码回传给调用方，且按场景写入独立 key', async () => {
    const login = await smsService.sendSMS('13800000000', 'login');
    expect(login.code).toMatch(/^\d{6}$/);
    expect(store().has('sms:code:login:13800000000')).toBe(true);

    store().clear();
    const reset = await smsService.sendSMS('13800000000', 'reset');
    expect(store().has('sms:code:reset:13800000000')).toBe(true);
    expect(store().has('sms:code:login:13800000000')).toBe(false);
    expect(reset.code).toMatch(/^\d{6}$/);
  });

  it('登录码不能用于重置密码（跨场景复用被阻断）', async () => {
    const { code } = await smsService.sendSMS('13800000000', 'login');
    await expect(smsService.verifyCode('13800000000', code, 'reset')).rejects.toThrow('验证码已过期');
  });

  it('同一场景下校验成功后验证码立即失效（一次性）', async () => {
    const { code } = await smsService.sendSMS('13800000000', 'login');
    await expect(smsService.verifyCode('13800000000', code, 'login')).resolves.toBe(true);
    await expect(smsService.verifyCode('13800000000', code, 'login')).rejects.toThrow('验证码已过期');
  });

  it('连续错误达到上限后验证码作废，正确码也不再放行', async () => {
    const { code } = await smsService.sendSMS('13800000000', 'login');

    for (let i = 0; i < 4; i++) {
      await expect(smsService.verifyCode('13800000000', '000000', 'login')).rejects.toThrow(/^验证码错误$/);
    }
    await expect(smsService.verifyCode('13800000000', '000000', 'login')).rejects.toThrow(/错误次数过多/);

    expect(store().has('sms:code:login:13800000000')).toBe(false);
    await expect(smsService.verifyCode('13800000000', code, 'login')).rejects.toThrow('验证码已过期');
  });

  it('空验证码直接拒绝', async () => {
    await smsService.sendSMS('13800000000', 'login');
    await expect(smsService.verifyCode('13800000000', '', 'login')).rejects.toThrow('验证码不能为空');
  });

  it('发送冷却也按场景计数', async () => {
    await smsService.sendSMS('13800000000', 'login');
    await expect(smsService.sendSMS('13800000000', 'login')).rejects.toThrow('发送过于频繁');
    await expect(smsService.sendSMS('13800000000', 'register')).resolves.toMatchObject({ success: true });
  });
});
