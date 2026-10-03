const { EventEmitter } = require('events');
const payController = require('../../../src/controllers/pay');

jest.mock('../../../src/services', () => ({
  payService: {
    getPackages: jest.fn(),
    createOrder: jest.fn(),
    wxPayCallback: jest.fn(),
    getOrderStatus: jest.fn(),
    validateCard: jest.fn(),
    useCard: jest.fn(),
    getWalletBalance: jest.fn(),
    rechargeWallet: jest.fn(),
    getPaymentHistory: jest.fn(),
    redeemCardByKey: jest.fn()
  },
  wechatPayService: {
    isConfigured: jest.fn(() => true),
    createUnifiedOrder: jest.fn(),
    getJsApiSign: jest.fn(),
    handleNotify: jest.fn(),
    queryOrder: jest.fn(),
    closeOrder: jest.fn()
  }
}));

jest.mock('../../../src/models', () => ({
  OrderChong: { findAndCountAll: jest.fn() },
  User: {}
}));

const { payService, wechatPayService } = require('../../../src/services');
const { OrderChong } = require('../../../src/models');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};
const flush = () => new Promise(resolve => setImmediate(resolve));

describe('Controller - Pay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getPackages returns packages and maps error', async () => {
    payService.getPackages.mockResolvedValue([{ id: 1 }]);
    const ok = mockRes();
    await payController.getPackages(mockReq(), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    payService.getPackages.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await payController.getPackages(mockReq(), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('createOrder rejects missing packageId, succeeds, maps error', async () => {
    const bad = mockRes();
    await payController.createOrder(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.createOrder.mockResolvedValue({ orderNo: 'O1' });
    const ok = mockRes();
    await payController.createOrder(mockReq({ body: { packageId: '2' } }), ok);
    expect(payService.createOrder).toHaveBeenCalledWith(100001, 2, 1);
    expect(ok.status).toHaveBeenCalledWith(200);

    payService.createOrder.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await payController.createOrder(mockReq({ body: { packageId: 2, payType: 2 } }), err);
    expect(payService.createOrder).toHaveBeenCalledWith(100001, 2, 2);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('createWxOrder rejects missing packageId and succeeds', async () => {
    const bad = mockRes();
    await payController.createWxOrder(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    wechatPayService.createUnifiedOrder.mockResolvedValue({ prepayId: 'p', orderId: 1, orderNo: 'O1', amount: 100 });
    wechatPayService.getJsApiSign.mockReturnValue({ paySign: 's' });
    const ok = mockRes();
    await payController.createWxOrder(mockReq({ body: { packageId: '3' } }), ok);
    expect(wechatPayService.createUnifiedOrder).toHaveBeenCalledWith(100001, 3);
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('createWxOrder maps error to 422', async () => {
    wechatPayService.createUnifiedOrder.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await payController.createWxOrder(mockReq({ body: { packageId: 3 } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('wxNotify responds SUCCESS on successful notify', async () => {
    wechatPayService.handleNotify.mockResolvedValue({ success: true });
    const req = new EventEmitter();
    const res = mockRes();

    await payController.wxNotify(req, res);
    req.emit('data', '<xml>ok</xml>');
    req.emit('end');
    await flush();
    await flush();

    expect(wechatPayService.handleNotify).toHaveBeenCalledWith('<xml>ok</xml>');
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('SUCCESS'));
  });

  it('wxNotify responds FAIL on failed notify', async () => {
    wechatPayService.handleNotify.mockResolvedValue({ success: false });
    const req = new EventEmitter();
    const res = mockRes();

    await payController.wxNotify(req, res);
    req.emit('data', '<xml>bad</xml>');
    req.emit('end');
    await flush();
    await flush();

    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('FAIL'));
  });

  it('queryWxOrder validates and succeeds', async () => {
    const bad = mockRes();
    await payController.queryWxOrder(mockReq({ query: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    wechatPayService.queryOrder.mockResolvedValue({ status: 1 });
    const ok = mockRes();
    await payController.queryWxOrder(mockReq({ query: { orderNo: 'O1' } }), ok);
    expect(wechatPayService.queryOrder).toHaveBeenCalledWith('O1');
    expect(ok.status).toHaveBeenCalledWith(200);

    // 回归：未配置微信支付应返回 503，而不是 500
    wechatPayService.isConfigured.mockReturnValueOnce(false);
    const notCfg = mockRes();
    await payController.queryWxOrder(mockReq({ query: { orderNo: 'O1' } }), notCfg);
    expect(notCfg.status).toHaveBeenCalledWith(503);
  });

  it('closeWxOrder validates and succeeds', async () => {
    const bad = mockRes();
    await payController.closeWxOrder(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    wechatPayService.closeOrder.mockResolvedValue(true);
    const ok = mockRes();
    await payController.closeWxOrder(mockReq({ body: { orderNo: 'O1' } }), ok);
    expect(wechatPayService.closeOrder).toHaveBeenCalledWith('O1');
    expect(ok.status).toHaveBeenCalledWith(200);

    wechatPayService.isConfigured.mockReturnValueOnce(false);
    const notCfg = mockRes();
    await payController.closeWxOrder(mockReq({ body: { orderNo: 'O1' } }), notCfg);
    expect(notCfg.status).toHaveBeenCalledWith(503);
  });

  it('wxCallback 缺少订单号返回 400', async () => {
    const bad = mockRes();
    await payController.wxCallback(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);
  });

  it('wxCallback 默认拒绝未经服务端校验的支付回执（403）', async () => {
    delete process.env.ALLOW_UNVERIFIED_PAY_CALLBACK;
    const res = mockRes();
    await payController.wxCallback(mockReq({ body: { payNo: 'O1', transactionId: 't' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(payService.wxPayCallback).not.toHaveBeenCalled();
  });

  it('wxCallback 仅在显式开启本地联调开关时放行', async () => {
    process.env.ALLOW_UNVERIFIED_PAY_CALLBACK = 'true';
    try {
      payService.wxPayCallback.mockResolvedValue(true);
      const ok = mockRes();
      await payController.wxCallback(mockReq({ body: { payNo: 'O1', transactionId: 't' } }), ok);
      expect(payService.wxPayCallback).toHaveBeenCalledWith('O1', 't');
      expect(ok.status).toHaveBeenCalledWith(200);
    } finally {
      delete process.env.ALLOW_UNVERIFIED_PAY_CALLBACK;
    }
  });

  it('getOrderStatus validates and succeeds', async () => {
    const bad = mockRes();
    await payController.getOrderStatus(mockReq({ query: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.getOrderStatus.mockResolvedValue({ status: 1 });
    const ok = mockRes();
    await payController.getOrderStatus(mockReq({ query: { orderNo: 'O1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('validateCard validates and succeeds', async () => {
    const bad = mockRes();
    await payController.validateCard(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.validateCard.mockResolvedValue({ valid: true });
    const ok = mockRes();
    await payController.validateCard(mockReq({ body: { cardCode: 'C1' } }), ok);
    expect(payService.validateCard).toHaveBeenCalledWith('C1');
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('useCard validates and succeeds', async () => {
    const bad = mockRes();
    await payController.useCard(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.useCard.mockResolvedValue({ money: 100 });
    const ok = mockRes();
    await payController.useCard(mockReq({ body: { cardCode: 'C1' } }), ok);
    expect(payService.useCard).toHaveBeenCalledWith(100001, 'C1');
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('redeemCardByKey validates key format', async () => {
    const notString = mockRes();
    await payController.redeemCardByKey(mockReq({ body: { key: 123 } }), notString);
    expect(notString.status).toHaveBeenCalledWith(400);

    const wrongLen = mockRes();
    await payController.redeemCardByKey(mockReq({ body: { key: 'abc' } }), wrongLen);
    expect(wrongLen.status).toHaveBeenCalledWith(400);
  });

  it('redeemCardByKey strips separators and succeeds', async () => {
    payService.redeemCardByKey.mockResolvedValue({ money: 50 });
    const ok = mockRes();
    await payController.redeemCardByKey(mockReq({ body: { key: '12345-67890 12345-67890 12345' } }), ok);
    expect(payService.redeemCardByKey).toHaveBeenCalledWith(100001, '1234567890123456789012345');
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('redeemCardByKey maps error to 422', async () => {
    payService.redeemCardByKey.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await payController.redeemCardByKey(mockReq({ body: { key: '1234567890123456789012345' } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('getRechargeRecords maps rows and pagination', async () => {
    OrderChong.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{
        id: 1, order_no: 'O1', user_id: 2, user: { username: 'u' }, amount: '10.5',
        pay_type: 1, status: 1, create_time: 1700000000
      }]
    });
    const res = mockRes();
    await payController.getRechargeRecords(mockReq({ query: { page: '1', pageSize: '20', userId: '2', status: '1' } }), res);

    expect(OrderChong.findAndCountAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.list[0].username).toBe('u');
    expect(data.list[0].amount).toBe(10.5);
    expect(data.pagination.totalPages).toBe(1);
  });

  it('getRechargeRecords returns 500 on error', async () => {
    OrderChong.findAndCountAll.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await payController.getRechargeRecords(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getWalletBalance returns balance and maps error', async () => {
    payService.getWalletBalance.mockResolvedValue({ money: 1 });
    const ok = mockRes();
    await payController.getWalletBalance(mockReq(), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    payService.getWalletBalance.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await payController.getWalletBalance(mockReq(), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('rechargeWallet validates amount', async () => {
    const bad = mockRes();
    await payController.rechargeWallet(mockReq({ body: { amount: 0 } }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);
  });

  it('rechargeWallet succeeds with defaults and maps error', async () => {
    payService.rechargeWallet.mockResolvedValue({ money: 10 });
    const ok = mockRes();
    await payController.rechargeWallet(mockReq({ body: { amount: '10' } }), ok);
    expect(payService.rechargeWallet).toHaveBeenCalledWith(100001, 10, 'admin');
    expect(ok.status).toHaveBeenCalledWith(200);

    payService.rechargeWallet.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await payController.rechargeWallet(mockReq({ body: { amount: 10, source: 'wx' } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('getPaymentHistory uses pagination', async () => {
    payService.getPaymentHistory.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await payController.getPaymentHistory(mockReq({ query: { page: '2', pageSize: '5' } }), res);
    expect(payService.getPaymentHistory).toHaveBeenCalledWith(100001, 2, 5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getPaymentHistory maps error to 500', async () => {
    payService.getPaymentHistory.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await payController.getPaymentHistory(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('createPayment validates and succeeds', async () => {
    const bad = mockRes();
    await payController.createPayment(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.createOrder.mockResolvedValue({ orderNo: 'O1' });
    const ok = mockRes();
    await payController.createPayment(mockReq({ body: { packageId: '2' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
  });

});
