// 审计 H-2：微信支付异步通知（/api/pay/wx-notify）的校验链回归
//
// 原实现只看了 return_code 与 MD5 签名，随后就 findOne(status=0) → update → 加币：
//   - 不看 result_code（真正的业务结果）、不看 appid/mch_id（签约主体）、不看 total_fee（实付金额）；
//   - parseXml 的正则匹配不了微信真实报文里的 <![CDATA[...]]> 包裹，真实回调一律解析成空对象；
//   - 已入账订单收到重复通知会回 FAIL，微信按退避策略无限重发。
// 这里把每一条都固化成用例。签名算法与实现一致（MD5，字典序拼接 + &key=）。
jest.mock('../../../src/models', () => ({
  OrderChong: { findOne: jest.fn(), update: jest.fn(), create: jest.fn() },
  RechargePackage: { findAll: jest.fn(), findByPk: jest.fn() }
}));

jest.mock('../../../src/services/payService', () => ({
  PAY_ERRORS: {
    NOT_FOUND: 'PAY_ORDER_NOT_FOUND',
    FORBIDDEN: 'PAY_ORDER_FORBIDDEN',
    UNVERIFIED: 'PAY_ORDER_UNVERIFIED',
    AMOUNT_MISMATCH: 'PAY_ORDER_AMOUNT_MISMATCH',
    SETTLED: 'PAY_ORDER_ALREADY_SETTLED'
  },
  settleRechargeOrder: jest.fn(),
  requireOwnedOrder: jest.fn()
}));

// 服务在加载时快照 WECHAT_* 环境变量，因此必须在 require 之前写好
process.env.WECHAT_APPID = 'wxTESTAPPID';
process.env.WECHAT_MCHID = '1900000100';
process.env.WECHAT_API_KEY = 'TEST_API_KEY_FOR_UNIT_TESTS_0000000000';

const crypto = require('crypto');
const { OrderChong } = require('../../../src/models');
const payService = require('../../../src/services/payService');
const wechatPayService = require('../../../src/services/wechatPayService');

const API_KEY = process.env.WECHAT_API_KEY;

const signOf = (params) => {
  const base = Object.keys(params)
    .sort()
    .filter((k) => params[k] && k !== 'sign')
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('md5').update(`${base}&key=${API_KEY}`, 'utf8').digest('hex').toUpperCase();
};

// cdata=true 模拟微信真实报文（全部字段用 CDATA 包裹）
const buildNotifyXml = (fields, { cdata = true, sign = true } = {}) => {
  const params = Object.assign({
    return_code: 'SUCCESS',
    result_code: 'SUCCESS',
    appid: process.env.WECHAT_APPID,
    mch_id: process.env.WECHAT_MCHID,
    nonce_str: 'NONCE1',
    out_trade_no: 'DKTEST0001',
    transaction_id: 'WX4200001',
    total_fee: '1050',
    fee_type: 'CNY',
    bank_type: 'OTHERS',
    time_end: '20261005120000'
  }, fields);

  if (sign) params.sign = signOf(params);

  const wrap = (v) => (cdata ? `<![CDATA[${v}]]>` : String(v));
  return `<xml>${Object.keys(params).map((k) => `<${k}>${wrap(params[k])}</${k}>`).join('')}</xml>`;
};

const makeOrder = (over = {}) => Object.assign({
  id: 9,
  order_no: 'DKTEST0001',
  user_id: 1001,
  amount: '10.50',
  coins: 1050,
  status: 0
}, over);

describe('Service - wechatPayService.handleNotify 回调校验链（H-2）', () => {
  beforeEach(() => {
    OrderChong.findOne.mockReset();
    OrderChong.findOne.mockResolvedValue(makeOrder());
    payService.settleRechargeOrder.mockReset();
    payService.settleRechargeOrder.mockResolvedValue({ orderNo: 'DKTEST0001', coins: 1050, duplicated: false });
  });

  it('CDATA 报文（微信真实格式）能解析并成功入账', async () => {
    const result = await wechatPayService.handleNotify(buildNotifyXml({}));

    expect(result.success).toBe(true);
    expect(OrderChong.findOne).toHaveBeenCalledWith({ where: { order_no: 'DKTEST0001' } });
    expect(payService.settleRechargeOrder).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9 }),
      { verified: true, source: 'wechat-notify', paidCents: 1050, transactionId: 'WX4200001' }
    );
  });

  // 审计 H-2 主回归：通知入账失败必须回 FAIL，让微信继续重发，
  // 绝不能像原实现那样先把订单改成 status=1 再回 FAIL（重试时 findOne(status:0) 查不到 → 永久丢单）
  it('通知入账失败（抢单/金额不符/数据库异常）一律回 FAIL 且不改订单状态', async () => {
    const failures = [
      ['ECONNREFUSED', Object.assign(new Error('ECONNREFUSED'), {})],
      ['金额不一致', Object.assign(new Error('支付金额与订单不一致，已拒绝入账'), {
        code: payService.PAY_ERRORS.AMOUNT_MISMATCH
      })]
    ];

    for (const [label, err] of failures) {
      payService.settleRechargeOrder.mockRejectedValueOnce(err);
      const result = await wechatPayService.handleNotify(buildNotifyXml({}));
      expect([label, result.success]).toEqual([label, false]);
    }

    // 只读订单，不改状态：状态变更全部发生在 settleRechargeOrder 内部的原子 UPDATE 里
    expect(OrderChong.update).not.toHaveBeenCalled();
  });

  it('非 SUCCESS 报文（return_code / result_code / 签名 / 商户 / 币种）都不查订单', async () => {
    const cases = [
      '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统繁忙]]></return_msg></xml>',
      buildNotifyXml({ result_code: 'FAIL' }),
      buildNotifyXml({}, { sign: false })
    ];

    for (const xml of cases) {
      const r = await wechatPayService.handleNotify(xml);
      expect(r.success).toBe(false);
    }
    expect(OrderChong.findOne).not.toHaveBeenCalled();
  });

  it('纯文本报文同样能解析（兼容两种写法）', async () => {
    const result = await wechatPayService.handleNotify(buildNotifyXml({}, { cdata: false }));
    expect(result.success).toBe(true);
  });

  it('签名不匹配或缺失都直接拒绝，且不查库', async () => {
    // 缺失 sign
    const noSign = await wechatPayService.handleNotify(buildNotifyXml({}, { sign: false }));
    expect(noSign.success).toBe(false);
    expect(noSign.message).toBe('签名验证失败');

    // 带 sign 但内容被改过（重算签名时用的是原字段值，这里替换 out_trade_no 后即失配）
    const tampered = buildNotifyXml({}).replace(
      /<out_trade_no><!\[CDATA\[[^\]]*\]\]><\/out_trade_no>/,
      '<out_trade_no><![CDATA[DKOTHER9]]></out_trade_no>'
    );
    const badSign = await wechatPayService.handleNotify(tampered);
    expect(badSign.success).toBe(false);
    expect(badSign.message).toBe('签名验证失败');

    expect(OrderChong.findOne).not.toHaveBeenCalled();
  });

  it('return_code=FAIL 时原样回传错误信息', async () => {
    const xml = '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统繁忙]]></return_msg></xml>';
    const result = await wechatPayService.handleNotify(xml);
    expect(result).toEqual({ success: false, message: '系统繁忙' });
  });

  // 回归：原实现完全不看 result_code —— 业务失败的通知也会走到入账分支
  it('result_code=FAIL（请求成功但未付款）拒绝入账', async () => {
    const result = await wechatPayService.handleNotify(
      buildNotifyXml({ result_code: 'FAIL', err_code: 'NOTENOUGH', err_code_des: '余额不足' })
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('余额不足');
    expect(OrderChong.findOne).not.toHaveBeenCalled();
    expect(payService.settleRechargeOrder).not.toHaveBeenCalled();
  });

  it('appid / mch_id 与本机配置不一致时拒绝（防串单）', async () => {
    const badApp = await wechatPayService.handleNotify(buildNotifyXml({ appid: 'wxOTHERAPPID' }));
    expect(badApp.success).toBe(false);
    expect(badApp.message).toContain('商户');

    const badMch = await wechatPayService.handleNotify(buildNotifyXml({ mch_id: '1900000999' }));
    expect(badMch.success).toBe(false);

    expect(payService.settleRechargeOrder).not.toHaveBeenCalled();
  });

  it('非 CNY 结算币种或缺少 total_fee 时拒绝（无法核对金额就不入账）', async () => {
    const usd = await wechatPayService.handleNotify(buildNotifyXml({ fee_type: 'USD' }));
    expect(usd.success).toBe(false);
    expect(usd.message).toContain('币种');

    const noFee = await wechatPayService.handleNotify(buildNotifyXml({ total_fee: '' }));
    expect(noFee.success).toBe(false);
    expect(noFee.message).toContain('total_fee');

    expect(payService.settleRechargeOrder).not.toHaveBeenCalled();
  });

  it('订单不存在 → 回 FAIL；金额不一致等入账错误也回 FAIL 交人工核对', async () => {
    OrderChong.findOne.mockResolvedValue(null);
    const missing = await wechatPayService.handleNotify(buildNotifyXml({ out_trade_no: 'DKNOPE' }));
    expect(missing).toEqual({ success: false, message: '订单不存在' });

    OrderChong.findOne.mockResolvedValue(makeOrder());
    const mismatch = Object.assign(new Error('支付金额与订单不一致，已拒绝入账'), {
      code: payService.PAY_ERRORS.AMOUNT_MISMATCH
    });
    payService.settleRechargeOrder.mockRejectedValue(mismatch);
    const failed = await wechatPayService.handleNotify(buildNotifyXml({}));
    expect(failed.success).toBe(false);
    expect(failed.message).toContain('金额');
  });

  // 关键可用性回归：已入账订单必须回 SUCCESS，否则微信会无限重发同一通知
  it('重复通知：status=1 直接回成功且不再入账；并发抢输（SETTLED）同样回成功', async () => {
    OrderChong.findOne.mockResolvedValue(makeOrder({ status: 1, pay_time: 1700000000 }));
    const dup = await wechatPayService.handleNotify(buildNotifyXml({}));
    expect(dup.success).toBe(true);
    expect(payService.settleRechargeOrder).not.toHaveBeenCalled();

    OrderChong.findOne.mockResolvedValue(makeOrder());
    payService.settleRechargeOrder.mockRejectedValue(
      Object.assign(new Error('订单已入账'), { code: payService.PAY_ERRORS.SETTLED })
    );
    const raced = await wechatPayService.handleNotify(buildNotifyXml({}));
    expect(raced.success).toBe(true);
    expect(raced.message).toContain('幂等');
  });
});
