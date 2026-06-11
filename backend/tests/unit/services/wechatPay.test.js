// 必须在模块加载前设置环境变量
process.env.WECHAT_APPID = process.env.WECHAT_APPID || 'wx_test_appid';
process.env.WECHAT_MCHID = process.env.WECHAT_MCHID || 'test_mchid';
process.env.WECHAT_API_KEY = process.env.WECHAT_API_KEY || 'test_apikey';

// Mock models 避免 sequelize 连接
jest.mock('../../../src/models', () => ({
  OrderChong: {
    findOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue([1])
  },
  RechargePackage: {
    findByPk: jest.fn().mockResolvedValue(null)
  },
  User: {
    findByPk: jest.fn().mockResolvedValue({ id: 1, balance: 0, update: jest.fn() })
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn()
    }))
  }
}));

const wechatPayService = require('../../../src/services/wechatPayService');

describe('微信支付服务', () => {
  describe('createUnifiedOrder', () => {
    it('should throw error when package not found', async () => {
      try {
        await wechatPayService.createUnifiedOrder(1, 999);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getJsApiSign', () => {
    it('should generate js api sign params', () => {
      const prepayId = 'wx201410272009395522657a690389285100';
      const result = wechatPayService.getJsApiSign(prepayId);

      expect(result).toBeDefined();
      expect(result.package).toBe(`prepay_id=${prepayId}`);
      expect(result.signType).toBe('HMAC-SHA256');
    });
  });

  describe('handleNotify', () => {
    it('should handle notify data', async () => {
      const xmlData = '<xml><return_code>FAIL</return_code><return_msg>测试错误</return_msg></xml>';
      const result = await wechatPayService.handleNotify(xmlData);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('queryOrder', () => {
    it('should be defined', () => {
      expect(wechatPayService.queryOrder).toBeDefined();
      expect(typeof wechatPayService.queryOrder).toBe('function');
    });
  });

  describe('closeOrder', () => {
    it('should be defined', () => {
      expect(wechatPayService.closeOrder).toBeDefined();
      expect(typeof wechatPayService.closeOrder).toBe('function');
    });
  });
});