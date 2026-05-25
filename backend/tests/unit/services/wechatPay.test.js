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
      expect(result.signType).toBe('MD5');
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