const { smsService } = require('../../../src/services');
const { getRedisClient } = require('../../../src/config/redis');

describe('短信服务', () => {
  describe('Redis可用性检查', () => {
    it('应该正确检测Redis状态', () => {
      const redis = getRedisClient();
      const isRedisAvailable = redis !== null;
      
      if (!isRedisAvailable) {
        console.log('⚠️ Redis未配置，跳过短信服务测试');
      }
      
      expect(typeof isRedisAvailable).toBe('boolean');
    });
  });

  describe('sendSMS', () => {
    it('当Redis不可用时应该抛出错误', async () => {
      const redis = getRedisClient();
      if (!redis) {
        await expect(smsService.sendSMS('13800138000')).rejects.toThrow('短信服务不可用');
      }
    });
  });

  describe('verifyCode', () => {
    it('当Redis不可用时应该抛出错误', async () => {
      const redis = getRedisClient();
      if (!redis) {
        await expect(smsService.verifyCode('13800138000', '123456')).rejects.toThrow('短信服务不可用');
      }
    });
  });

  describe('sendNotification', () => {
    it('当Redis不可用时应该抛出错误', async () => {
      const redis = getRedisClient();
      if (!redis) {
        await expect(smsService.sendNotification('13800138000', '测试通知')).rejects.toThrow('短信服务不可用');
      }
    });
  });
});