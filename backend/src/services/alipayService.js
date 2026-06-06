const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const config = require('../config');
const logger = require('../utils/logger');
const { getTimestamp, generateOrderNo } = require('../utils/helper');

const ALIPAY_GATEWAY = config.alipay.gateway || 'https://openapi.alipay.com/gateway.do';

/**
 * 支付宝支付服务
 * 支持：APP支付、H5支付、PC支付、查询、关闭、回调验证
 */

const signParams = (params, privateKey) => {
  const sign = crypto.createSign('RSA-SHA256');
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  sign.update(signStr, 'utf8');
  return sign.sign(privateKey, 'base64');
};

const verifySign = (params, publicKey, sign) => {
  const verify = crypto.createVerify('RSA-SHA256');
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  verify.update(signStr, 'utf8');
  return verify.verify(publicKey, sign, 'base64');
};

const requestAlipay = (bizContent, method, notifyUrl) => {
  return new Promise((resolve, reject) => {
    const bizStr = JSON.stringify(bizContent);
    const params = {
      app_id: config.alipay.appId,
      method,
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
      version: '1.0',
      biz_content: bizStr
    };

    if (notifyUrl) params.notify_url = notifyUrl;

    params.sign = signParams(params, config.alipay.privateKey);

    const postData = querystring.stringify(params);
    const url = new URL(ALIPAY_GATEWAY);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const responseKey = method.replace(/\./g, '_') + '_response';
          const responseData = result[responseKey];
          if (responseData && responseData.code === '10000') {
            resolve(responseData);
          } else {
            reject(new Error(responseData?.sub_msg || responseData?.msg || '支付宝请求失败'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', e => reject(e));
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('支付宝API请求超时')); });
    req.write(postData);
    req.end();
  });
};

/**
 * 创建预付订单
 */
const createOrder = async (userId, amount, subject, body, options = {}) => {
  const { productCode = 'QUICK_MSECURITY_PAY', tradeType = 'APP' } = options;
  const outTradeNo = generateOrderNo();
  const totalAmount = (parseFloat(amount) / 100).toFixed(2);

  const bizContent = {
    out_trade_no: outTradeNo,
    product_code: productCode,
    total_amount: totalAmount,
    subject: subject || '多客陪玩充值',
    body: body || `充值${totalAmount}元`
  };

  if (tradeType === 'APP') {
    bizContent.timeout_express = '30m';
  }

  const methodMap = {
    APP: 'alipay.trade.app.pay',
    H5: 'alipay.trade.wap.pay',
    PC: 'alipay.trade.page.pay'
  };

  const method = methodMap[tradeType] || methodMap.APP;

  const result = await requestAlipay(bizContent, method, config.alipay.notifyUrl);

  return {
    outTradeNo,
    totalAmount,
    tradeNo: result.trade_no || '',
    qrCode: result.qr_code || '',
    payUrl: result.pay_url || '',
    response: result
  };
};

/**
 * 查询订单
 */
const queryOrder = async (outTradeNo) => {
  const bizContent = { out_trade_no: outTradeNo };
  const result = await requestAlipay(bizContent, 'alipay.trade.query');

  return {
    outTradeNo: result.out_trade_no,
    tradeNo: result.trade_no,
    totalAmount: result.total_amount,
    tradeStatus: result.trade_status,
    buyerLogonId: result.buyer_logon_id || '',
    buyerUserId: result.buyer_user_id || '',
    gmtPayment: result.gmt_payment || ''
  };
};

/**
 * 关闭订单
 */
const closeOrder = async (outTradeNo) => {
  const bizContent = { out_trade_no: outTradeNo };
  const result = await requestAlipay(bizContent, 'alipay.trade.close');
  return { success: true, outTradeNo };
};

/**
 * 处理异步通知
 */
const handleNotify = (notifyParams) => {
  const sign = notifyParams.sign;
  const signType = notifyParams.sign_type;

  // 移除sign和sign_type用于验签
  const verifyParams = { ...notifyParams };
  delete verifyParams.sign;
  delete verifyParams.sign_type;

  const isValid = verifySign(verifyParams, config.alipay.publicKey, sign);

  if (!isValid) {
    return { success: false, message: '签名验证失败' };
  }

  return {
    success: true,
    notifyId: notifyParams.notify_id,
    notifyTime: notifyParams.notify_time,
    tradeNo: notifyParams.trade_no,
    outTradeNo: notifyParams.out_trade_no,
    totalAmount: notifyParams.total_amount,
    tradeStatus: notifyParams.trade_status,
    buyerId: notifyParams.buyer_id || '',
    gmtPayment: notifyParams.gmt_payment || ''
  };
};

module.exports = {
  createOrder,
  queryOrder,
  closeOrder,
  handleNotify
};
