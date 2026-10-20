const https = require('https');
const crypto = require('crypto');
const { OrderChong, RechargePackage } = require('../models');
const { getTimestamp, generateOrderNo } = require('../utils/helper');
const logger = require('../utils/logger');
// 入账统一收口到 payService.settleRechargeOrder（原子占用订单 + 金额核对 + 加币同一事务）。
// 这里只负责「与微信对话 + 验签」，不自己写一遍入账逻辑，避免两条回调路径的校验强度再次分叉。
const payService = require('./payService');

const { PAY_ERRORS, settleRechargeOrder } = payService;

const config = {
  appid: process.env.WECHAT_APPID,
  mchid: process.env.WECHAT_MCHID,
  apiKey: process.env.WECHAT_API_KEY,
  certPath: process.env.WECHAT_CERT_PATH,
  notifyUrl: process.env.WECHAT_NOTIFY_URL || `${process.env.SERVER_URL || 'http://localhost:3000'}/api/pay/wx-notify`
};

const buildSign = (params) => {
  const sortedParams = Object.keys(params).sort().filter(k => params[k] && k !== 'sign');
  const signStr = sortedParams.map(k => `${k}=${params[k]}`).join('&');
  const finalStr = signStr + `&key=${config.apiKey}`;
  return crypto.createHash('md5').update(finalStr, 'utf8').digest('hex').toUpperCase();
};

const buildXml = (params) => {
  let xml = '<xml>';
  Object.keys(params).forEach(key => {
    xml += `<${key}>${params[key]}</${key}>`;
  });
  xml += '</xml>';
  return xml;
};

// 审计 H-2 附带修正：微信真实通知一律是 <tag><![CDATA[值]]></tag>，
// 而原正则只匹配 <tag>非尖括号值</tag>，CDATA 里的 '<' 让它一条都匹配不上——
// 于是 return_code 解析成 undefined，所有真实回调都在第一步被判失败。
// 这里先把 CDATA 包裹剥掉，纯文本与 CDATA 两种写法都能解析。
const stripCdata = (value) => String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

const parseXml = (xmlStr) => {
  const result = {};
  const matches = stripCdata(xmlStr).match(/<(\w+)>([^<]+)<\/\1>/g) || [];
  matches.forEach(match => {
    const key = match.match(/<(\w+)>/)[1];
    const value = match.match(/>([^<]+)</)[1];
    result[key] = value;
  });
  return result;
};

const request = (url, data, isPost = true) => {
  return new Promise((resolve, reject) => {
    const xmlData = buildXml(data);
    const options = {
      hostname: url.replace('https://', '').replace('/pay/unifiedorder', '').split('/')[0],
      port: 443,
      path: url.replace('https://api.mch.weixin.qq.com', ''),
      method: isPost ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(xmlData)
      }
    };

    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', (chunk) => {
        response += chunk;
      });
      res.on('end', () => {
        try {
          const result = parseXml(response);
          if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
            resolve(result);
          } else {
            reject(new Error(result.err_code_des || result.return_msg || '支付请求失败'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(xmlData);
    req.end();
  });
};

// tradeType:
//   - NATIVE（默认）：PC/H5 扫码支付，统一下单返回 code_url，前端渲染二维码；
//   - JSAPI：微信内浏览器支付，必须由调用方提供 openid（需公众号网页授权，当前链路未接入）。
const createUnifiedOrder = async (userId, packageId, options = {}) => {
  const pkg = await RechargePackage.findByPk(packageId);
  
  if (!pkg || pkg.status !== 1) {
    throw new Error('充值套餐不存在');
  }

  const tradeType = options.tradeType === 'JSAPI' ? 'JSAPI' : 'NATIVE';
  const openid = String(options.openid || '');
  if (tradeType === 'JSAPI' && !openid) {
    throw new Error('微信内支付需要 openid，请改用扫码支付');
  }

  const orderNo = generateOrderNo();
  const totalFee = Math.round(Number(pkg.price) * 100);

  const params = {
    appid: config.appid,
    mch_id: config.mchid,
    nonce_str: crypto.randomBytes(16).toString('hex').toUpperCase(),
    body: `eu搭子充值-${pkg.name}`,
    out_trade_no: orderNo,
    total_fee: totalFee,
    spbill_create_ip: '127.0.0.1',
    notify_url: config.notifyUrl,
    trade_type: tradeType
  };
  if (tradeType === 'JSAPI') params.openid = openid;

  params.sign = buildSign(params);

  try {
    const result = await request('https://api.mch.weixin.qq.com/pay/unifiedorder', params);
    
    // xn_order_chong 真实列为 amount/coins，无 cid/money
    const order = await OrderChong.create({
      user_id: userId,
      order_no: orderNo,
      amount: Number(pkg.price),
      coins: Number(pkg.coins) + Number(pkg.bonus_coins || 0),
      pay_type: 1,
      status: 0,
      create_time: getTimestamp()
    });

    return {
      orderId: order.id,
      orderNo: orderNo,
      prepayId: result.prepay_id,
      codeUrl: tradeType === 'NATIVE' ? (result.code_url || '') : '',
      tradeType,
      amount: Number(pkg.price)
    };
  } catch (error) {
    throw error;
  }
};

const getJsApiSign = (prepayId) => {
  const params = {
    appId: config.appid,
    timeStamp: getTimestamp().toString(),
    nonceStr: crypto.randomBytes(16).toString('hex').toUpperCase(),
    package: `prepay_id=${prepayId}`,
    signType: 'MD5'
  };

  params.paySign = buildSign(params);
  return params;
};

// 微信支付服务端异步通知（POST /api/pay/wx-notify）。
//
// 审计 H-2 校验收口（V2 MD5 通知，逐层判失败并回 FAIL）：
//   1) return_code —— 只代表「请求」成功，不是付款结果；
//   2) sign —— 用我们的 api key 重算，证明来源；不匹配直接拒；
//   3) result_code —— 真正的业务结果。原实现完全不看它，未付款/退款类通知也会走到入账分支；
//   4) appid / mch_id —— 签约主体必须与本机配置一致，防止同 key 下其它商户号或测试环境的单子串进来；
//   5) fee_type + total_fee —— 只有 CNY 的分值才能与下单应付金额直接比对；
//      实付分值与订单应付分值不一致一律拒绝（宁可留人工核对，也不能按被改小的金额发币）；
//   6) 入账走 payService.settleRechargeOrder：带 status=0 条件的原子 UPDATE 抢单，
//      微信并发重发通知时只有一笔能加币，抢输的一方按「幂等成功」回 SUCCESS 让微信停止重试。
const handleNotify = async (xmlData) => {
  const params = parseXml(xmlData);

  if (params.return_code !== 'SUCCESS') {
    return { success: false, message: params.return_msg };
  }

  const sign = params.sign;
  delete params.sign;

  const verifySign = buildSign(params);

  if (!sign || sign !== verifySign) {
    return { success: false, message: '签名验证失败' };
  }

  if (params.result_code !== 'SUCCESS') {
    return {
      success: false,
      message: `支付未成功：${params.err_code_des || params.err_code || params.result_code || 'FAIL'}`
    };
  }

  if ((params.appid && params.appid !== config.appid) || (params.mch_id && params.mch_id !== config.mchid)) {
    logger.error(`[pay] 回调签约主体与配置不一致 appid=${params.appid || ''} mch_id=${params.mch_id || ''}`);
    return { success: false, message: '回调商户与本机配置不一致' };
  }

  if (params.fee_type && params.fee_type !== 'CNY') {
    return { success: false, message: `不支持的结算币种 ${params.fee_type}，已拒绝自动入账` };
  }

  const orderNo = params.out_trade_no;
  if (!orderNo) {
    return { success: false, message: '回调缺少 out_trade_no' };
  }

  const paidCents = Number(params.total_fee);
  if (!Number.isFinite(paidCents)) {
    return { success: false, message: '回调缺少 total_fee，无法核对支付金额' };
  }

  const order = await OrderChong.findOne({ where: { order_no: orderNo } });

  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  // 已入账的订单必须回 SUCCESS：微信收不到成功响应会按退避策略持续重发同一通知
  if (Number(order.status) === 1) {
    return { success: true, message: '订单已入账（幂等）' };
  }

  try {
    const result = await settleRechargeOrder(order, {
      verified: true,
      source: 'wechat-notify',
      paidCents,
      transactionId: params.transaction_id
    });
    return { success: true, message: '支付成功', data: result };
  } catch (error) {
    if (error.code === PAY_ERRORS.SETTLED) {
      return { success: true, message: '订单已入账（幂等）' };
    }
    logger.error('[pay] 微信回调入账失败:', error);
    return { success: false, message: error.message };
  }
};

const queryOrder = async (orderNo) => {
  const params = {
    appid: config.appid,
    mch_id: config.mchid,
    nonce_str: crypto.randomBytes(16).toString('hex').toUpperCase(),
    out_trade_no: orderNo
  };

  params.sign = buildSign(params);

  try {
    const result = await request('https://api.mch.weixin.qq.com/pay/orderquery', params);
    return {
      orderNo: result.out_trade_no,
      status: result.trade_state === 'SUCCESS' ? 1 : 0,
      tradeState: result.trade_state,
      tradeStateDesc: result.trade_state_desc,
      // 审计 H-2：反查回来的实付分值与平台流水号要交给上层做金额核对/留档，
      // 此前只回了个布尔式 status，客户端回执那条路无从校验「付了多少」
      paidCents: Number(result.total_fee),
      transactionId: result.transaction_id
    };
  } catch (error) {
    throw error;
  }
};

const closeOrder = async (orderNo) => {
  const params = {
    appid: config.appid,
    mch_id: config.mchid,
    nonce_str: crypto.randomBytes(16).toString('hex').toUpperCase(),
    out_trade_no: orderNo
  };

  params.sign = buildSign(params);

  try {
    const result = await request('https://api.mch.weixin.qq.com/pay/closeorder', params);
    return { success: true, message: result.return_msg };
  } catch (error) {
    throw error;
  }
};

// 三项必备参数齐全才算「已配置」
const isConfigured = () => !!(config.appid && config.mchid && config.apiKey);

module.exports = {
  isConfigured,
  createUnifiedOrder,
  getJsApiSign,
  handleNotify,
  queryOrder,
  closeOrder
};