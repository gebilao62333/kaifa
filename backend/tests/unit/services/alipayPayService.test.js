const alipayPayService = require('../../../src/services/alipayPayService');

describe('alipayPayService（SDK 预留）', () => {
  it('未配置商户参数时 isConfigured=false 且下单返回 ALIPAY_NOT_CONFIGURED', async () => {
    delete process.env.ALIPAY_APP_ID;
    delete process.env.ALIPAY_PRIVATE_KEY;
    delete process.env.ALIPAY_PUBLIC_KEY;
    expect(alipayPayService.isConfigured()).toBe(false);
    await expect(alipayPayService.createOrder(1, 1)).rejects.toMatchObject({ code: 'ALIPAY_NOT_CONFIGURED' });
  });

  it('配置后仍为预留实现（ALIPAY_NOT_IMPLEMENTED）', async () => {
    process.env.ALIPAY_APP_ID = 'app';
    process.env.ALIPAY_PRIVATE_KEY = 'key';
    process.env.ALIPAY_PUBLIC_KEY = 'pub';
    try {
      expect(alipayPayService.isConfigured()).toBe(true);
      await expect(alipayPayService.createOrder(1, 1)).rejects.toMatchObject({ code: 'ALIPAY_NOT_IMPLEMENTED' });
    } finally {
      delete process.env.ALIPAY_APP_ID;
      delete process.env.ALIPAY_PRIVATE_KEY;
      delete process.env.ALIPAY_PUBLIC_KEY;
    }
  });
});
