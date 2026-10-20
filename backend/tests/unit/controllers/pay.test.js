const { EventEmitter } = require('events');
const payController = require('../../../src/controllers/pay');

jest.mock('../../../src/services', () => ({
  payService: {
    getPackages: jest.fn(),
    createOrder: jest.fn(),
    wxPayCallback: jest.fn(),
    requireOwnedOrder: jest.fn(),
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
// 错误码取自真实常量模块（controller 同样从这里取），避免测试里写死字符串与实现分叉
const { PAY_ERRORS } = require('../../../src/services/payService');

const payBizError = (code, message) => Object.assign(new Error(message), { code });

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

    wechatPayService.createUnifiedOrder.mockResolvedValue({
      prepayId: 'p', orderId: 1, orderNo: 'O1', amount: 100, tradeType: 'JSAPI'
    });
    wechatPayService.getJsApiSign.mockReturnValue({ paySign: 's' });
    const ok = mockRes();
    await payController.createWxOrder(mockReq({ body: { packageId: '3' } }), ok);
    expect(wechatPayService.createUnifiedOrder).toHaveBeenCalledWith(100001, 3, {
      tradeType: undefined,
      openid: undefined
    });
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('createWxOrder returns NATIVE codeUrl for scan pay', async () => {
    wechatPayService.createUnifiedOrder.mockResolvedValue({
      orderId: 2, orderNo: 'O2', amount: 100, tradeType: 'NATIVE', codeUrl: 'weixin://wxpay/bizpayurl?pr=abc'
    });
    const res = mockRes();
    await payController.createWxOrder(mockReq({ body: { packageId: 4, tradeType: 'NATIVE' } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.codeUrl).toBe('weixin://wxpay/bizpayurl?pr=abc');
    expect(payload.data.jsApiParams).toBe(null);
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

    payService.requireOwnedOrder.mockResolvedValue({ id: 1, order_no: 'O1', user_id: 100001 });
    wechatPayService.queryOrder.mockResolvedValue({ status: 1 });
    const ok = mockRes();
    await payController.queryWxOrder(mockReq({ query: { orderNo: 'O1' } }), ok);
    // 审计 H-2：先校验订单归属，再向平台反查
    expect(payService.requireOwnedOrder).toHaveBeenCalledWith(100001, 'O1');
    expect(wechatPayService.queryOrder).toHaveBeenCalledWith('O1');
    expect(ok.status).toHaveBeenCalledWith(200);

    // 回归：未配置微信支付应返回 503，而不是 500
    wechatPayService.isConfigured.mockReturnValueOnce(false);
    const notCfg = mockRes();
    await payController.queryWxOrder(mockReq({ query: { orderNo: 'O1' } }), notCfg);
    expect(notCfg.status).toHaveBeenCalledWith(503);
    expect(payService.requireOwnedOrder).not.toHaveBeenCalled();
  });

  it('closeWxOrder validates and succeeds', async () => {
    const bad = mockRes();
    await payController.closeWxOrder(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.requireOwnedOrder.mockResolvedValue({ id: 1, order_no: 'O1', user_id: 100001 });
    wechatPayService.closeOrder.mockResolvedValue(true);
    const ok = mockRes();
    await payController.closeWxOrder(mockReq({ body: { orderNo: 'O1' } }), ok);
    expect(payService.requireOwnedOrder).toHaveBeenCalledWith(100001, 'O1');
    expect(wechatPayService.closeOrder).toHaveBeenCalledWith('O1');
    expect(ok.status).toHaveBeenCalledWith(200);

    wechatPayService.isConfigured.mockReturnValueOnce(false);
    const notCfg = mockRes();
    await payController.closeWxOrder(mockReq({ body: { orderNo: 'O1' } }), notCfg);
    expect(notCfg.status).toHaveBeenCalledWith(503);
    expect(payService.requireOwnedOrder).not.toHaveBeenCalled();
  });

  // 审计 H-2：/wx-query、/wx-close 按订单号操作支付平台的单，必须挡住他人订单号
  it('queryWxOrder/closeWxOrder 对非本人订单直接拒绝，且不触碰支付平台', async () => {
    payService.requireOwnedOrder.mockRejectedValue(payBizError(PAY_ERRORS.FORBIDDEN, '无权操作该订单'));

    const q = mockRes();
    await payController.queryWxOrder(mockReq({ query: { orderNo: 'OTHER' } }), q);
    expect(q.status).toHaveBeenCalledWith(403);
    expect(wechatPayService.queryOrder).not.toHaveBeenCalled();

    const c = mockRes();
    await payController.closeWxOrder(mockReq({ body: { orderNo: 'OTHER' } }), c);
    expect(c.status).toHaveBeenCalledWith(403);
    expect(wechatPayService.closeOrder).not.toHaveBeenCalled();

    payService.requireOwnedOrder.mockRejectedValue(payBizError(PAY_ERRORS.NOT_FOUND, '订单不存在'));
    const nf = mockRes();
    await payController.queryWxOrder(mockReq({ query: { orderNo: 'NOPE' } }), nf);
    expect(nf.status).toHaveBeenCalledWith(404);
  });

  // 审计 H-2：通知是未鉴权公网入口，超大请求体必须先拒绝，不能拼进内存再交给服务层
  it('wxNotify 请求体超过 64KB 直接回 FAIL 且不调用服务层', async () => {
    const req = new EventEmitter();
    const res = mockRes();

    await payController.wxNotify(req, res);
    req.emit('data', 'x'.repeat(64 * 1024 + 16));
    req.emit('end');
    await flush();

    expect(wechatPayService.handleNotify).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('FAIL'));
  });

  // 原实现把 await 放在 'end' 的异步回调里，外层 try/catch 抓不到服务层异常：
  // 既不回包也不记录，微信只会按退避策略无限重发。
  it('wxNotify 服务层抛错时仍回 FAIL（不再悬挂响应）', async () => {
    wechatPayService.handleNotify.mockRejectedValue(new Error('boom'));
    const req = new EventEmitter();
    const res = mockRes();

    await payController.wxNotify(req, res);
    req.emit('data', '<xml>ok</xml>');
    req.emit('end');
    await flush();
    await flush();

    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('FAIL'));
  });

  it('wxNotify 空请求体直接回 FAIL', async () => {
    const req = new EventEmitter();
    const res = mockRes();

    await payController.wxNotify(req, res);
    req.emit('data', '   ');
    req.emit('end');
    await flush();

    expect(wechatPayService.handleNotify).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('FAIL'));
  });

  // FAIL 包里的 return_msg 会被拼进 XML：把 ']]>' 拆掉，防止回显内容提前结束 CDATA 段
  it('wxNotify 的 return_msg 会拆掉 ]]> 防止提前闭合 CDATA', async () => {
    wechatPayService.handleNotify.mockResolvedValue({ success: false, message: 'a]]>b' });
    const req = new EventEmitter();
    const res = mockRes();

    await payController.wxNotify(req, res);
    req.emit('data', '<xml>x</xml>');
    req.emit('end');
    await flush();
    await flush();

    const body = res.send.mock.calls[0][0];
    expect(body).not.toContain('a]]>b');
    expect(body).toContain('] ]>');
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
      payService.wxPayCallback.mockResolvedValue({ orderNo: 'O1', coins: 100, duplicated: false });
      const ok = mockRes();
      await payController.wxCallback(mockReq({ body: { payNo: 'O1', transactionId: 't' } }), ok);
      // 审计 H-2：本地联调路径不带平台金额（无 paidCents），但必须带上当前登录用户做归属校验
      expect(payService.wxPayCallback).toHaveBeenCalledWith(100001, 'O1', {
        verified: true,
        source: 'local-unverified'
      });
      expect(ok.status).toHaveBeenCalledWith(200);
    } finally {
      delete process.env.ALLOW_UNVERIFIED_PAY_CALLBACK;
    }
  });

  it('wxCallback 反查通过后透传实付金额与订单归属人入账', async () => {
    delete process.env.ALLOW_UNVERIFIED_PAY_CALLBACK;
    wechatPayService.queryOrder.mockResolvedValue({
      orderNo: 'O1',
      status: 1,
      tradeState: 'SUCCESS',
      paidCents: 1050,
      transactionId: 'WX1'
    });
    payService.wxPayCallback.mockResolvedValue({ orderNo: 'O1', coins: 100, duplicated: false });

    const ok = mockRes();
    await payController.wxCallback(mockReq({ body: { payNo: 'O1', transactionId: 'client-tx' } }), ok);

    expect(payService.wxPayCallback).toHaveBeenCalledWith(100001, 'O1', {
      verified: true,
      source: 'wechat-query',
      paidCents: 1050,
      transactionId: 'WX1'
    });
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('wxCallback 反查未成功 / 返回单号不一致都拒绝，绝不入账', async () => {
    delete process.env.ALLOW_UNVERIFIED_PAY_CALLBACK;

    wechatPayService.queryOrder.mockResolvedValue({ orderNo: 'O1', status: 0, tradeState: 'NOTPAY' });
    const notPaid = mockRes();
    await payController.wxCallback(mockReq({ body: { payNo: 'O1' } }), notPaid);
    expect(notPaid.status).toHaveBeenCalledWith(403);

    // 平台回包里换了单号：说明响应被串错或被中间篡改，一律不认
    wechatPayService.queryOrder.mockResolvedValue({ orderNo: 'OTHER', status: 1, paidCents: 1 });
    const wrongNo = mockRes();
    await payController.wxCallback(mockReq({ body: { payNo: 'O1' } }), wrongNo);
    expect(wrongNo.status).toHaveBeenCalledWith(403);

    wechatPayService.queryOrder.mockRejectedValue(new Error('ORDERNOTEXIST'));
    const queryFail = mockRes();
    await payController.wxCallback(mockReq({ body: { payNo: 'O1' } }), queryFail);
    expect(queryFail.status).toHaveBeenCalledWith(403);

    expect(payService.wxPayCallback).not.toHaveBeenCalled();
  });

  // 审计 H-2：入账阶段业务错误按 code 分流，意外故障必须保持 500
  it('wxCallback 按业务错误码分流 403/404/422，重复回执按幂等成功返回', async () => {
    delete process.env.ALLOW_UNVERIFIED_PAY_CALLBACK;
    wechatPayService.queryOrder.mockResolvedValue({ orderNo: 'O1', status: 1, paidCents: 100 });

    const cases = [
      [PAY_ERRORS.FORBIDDEN, 403],
      [PAY_ERRORS.UNVERIFIED, 403],
      [PAY_ERRORS.NOT_FOUND, 404],
      [PAY_ERRORS.AMOUNT_MISMATCH, 422],
      [PAY_ERRORS.SETTLED, 200]
    ];

    for (const [code, status] of cases) {
      payService.wxPayCallback.mockRejectedValue(payBizError(code, `E_${code}`));
      const res = mockRes();
      await payController.wxCallback(mockReq({ body: { payNo: 'O1' } }), res);
      expect([code, res.status.mock.calls[0][0]]).toEqual([code, status]);
    }

    // 重复回执：data 带 duplicated 标记，供前端区分「本次没再加钱」
    payService.wxPayCallback.mockRejectedValue(payBizError(PAY_ERRORS.SETTLED, '订单已入账'));
    const dup = mockRes();
    await payController.wxCallback(mockReq({ body: { payNo: 'O1' } }), dup);
    expect(dup.json.mock.calls[0][0].data).toEqual({ duplicated: true });

    // 没有 code 的意外故障（数据库异常等）保持 500，不伪装成业务拒绝
    payService.wxPayCallback.mockRejectedValue(new Error('ECONNREFUSED'));
    const boom = mockRes();
    await payController.wxCallback(mockReq({ body: { payNo: 'O1' } }), boom);
    expect(boom.status).toHaveBeenCalledWith(500);
  });

  it('getOrderStatus validates and succeeds', async () => {
    const bad = mockRes();
    await payController.getOrderStatus(mockReq({ query: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.getOrderStatus.mockResolvedValue({ status: 1 });
    const ok = mockRes();
    await payController.getOrderStatus(mockReq({ query: { orderNo: 'O1' } }), ok);
    // 审计 H-2：带当前登录用户查，避免用他人订单号探测支付状态
    expect(payService.getOrderStatus).toHaveBeenCalledWith(100001, 'O1');
    expect(ok.status).toHaveBeenCalledWith(200);

    payService.getOrderStatus.mockRejectedValue(payBizError(PAY_ERRORS.NOT_FOUND, '订单不存在'));
    const nf = mockRes();
    await payController.getOrderStatus(mockReq({ query: { orderNo: 'OTHER' } }), nf);
    expect(nf.status).toHaveBeenCalledWith(404);

    payService.getOrderStatus.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await payController.getOrderStatus(mockReq({ query: { orderNo: 'O1' } }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('validateCard validates and succeeds', async () => {
    const bad = mockRes();
    await payController.validateCard(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.validateCard.mockResolvedValue({ valid: true });
    const ok = mockRes();
    // 审计 C-3：cardPwd 必须透传到服务层，服务端只认「卡号 + 密码」
    await payController.validateCard(mockReq({ body: { cardCode: 'C1', cardPwd: 'P1' } }), ok);
    expect(payService.validateCard).toHaveBeenCalledWith('C1', 'P1');
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('useCard validates and succeeds', async () => {
    const bad = mockRes();
    await payController.useCard(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    payService.useCard.mockResolvedValue({ money: 100 });
    const ok = mockRes();
    await payController.useCard(mockReq({ body: { cardCode: 'C1', cardPwd: 'P1' } }), ok);
    expect(payService.useCard).toHaveBeenCalledWith(100001, 'C1', 'P1');
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
