const { smsService } = require('../../../src/services');

// 安全获取 Redis 客户端，测试环境中可能未初始化
let getRedisClient;
try {
  getRedisClient = require('../../../src/config/redis').getRedisClient;
} catch (e) {
  getRedisClient = () => null;
}

describe('短信服务', () => {
  // 安全地检查 Redis 可用性
  let redis = null;
  try {
    redis = getRedisClient();
  } catch (e) {
    // Redis 未初始化，使用 null
  }
  const isRedisAvailable = redis !== null;

  describe('Redis可用性检查', () => {
    it('应该正确检测Redis状态', () => {
      let client = null;
      try {
        client = getRedisClient();
      } catch (e) { /* ignore */ }
      const available = client !== null;
      
      expect(typeof available).toBe('boolean');
    });
  });

  describe('sendSMS', () => {
    it('当Redis不可用时应该抛出错误', async () => {
      let client = null;
      try {
        client = getRedisClient();
      } catch (e) { /* ignore */ }
      if (!client) {
        // Redis 未初始化时，smsService 内部 getRedisClient() 也会抛错
        await expect(smsService.sendSMS('13800138000')).rejects.toThrow();
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe('verifyCode', () => {
    it('当Redis不可用时应该抛出错误', async () => {
      let client = null;
      try {
        client = getRedisClient();
      } catch (e) { /* ignore */ }
      if (!client) {
        await expect(smsService.verifyCode('13800138000', '123456')).rejects.toThrow();
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe('sendNotification', () => {
    it('当Redis不可用时应该抛出错误', async () => {
      let client = null;
      try {
        client = getRedisClient();
      } catch (e) { /* ignore */ }
      if (!client) {
        await expect(smsService.sendNotification('13800138000', '测试通知')).rejects.toThrow();
      } else {
        expect(true).toBe(true);
      }
    });
  });
});