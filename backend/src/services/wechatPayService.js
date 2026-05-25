const https = require('https');
const crypto = require('crypto');
const { OrderChong, RechargePackage, User } = require('../models');
const { getTimestamp, generateOrderNo } = require('../utils/helper');

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

const parseXml = (xmlStr) => {
  const result = {};
  const matches = xmlStr.match(/<(\w+)>([^<]+)<\/\1>/g) || [];
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

const createUnifiedOrder = async (userId, packageId) => {
  const pkg = await RechargePackage.findByPk(packageId);
  
  if (!pkg || pkg.status !== 1) {
    throw new Error('充值套餐不存在');
  }

  const orderNo = generateOrderNo();
  const totalFee = Math.round(Number(pkg.money) * 100);

  const params = {
    appid: config.appid,
    mch_id: config.mchid,
    nonce_str: crypto.randomBytes(16).toString('hex').toUpperCase(),
    body: `多客陪玩充值-${pkg.title}`,
    out_trade_no: orderNo,
    total_fee: totalFee,
    spbill_create_ip: '127.0.0.1',
    notify_url: config.notifyUrl,
    trade_type: 'JSAPI',
    openid: ''
  };

  params.sign = buildSign(params);

  try {
    const result = await request('https://api.mch.weixin.qq.com/pay/unifiedorder', params);
    
    const order = await OrderChong.create({
      user_id: userId,
      order_no: orderNo,
      cid: packageId,
      money: pkg.money,
      pay_type: 1,
      status: 0,
      create_time: getTimestamp()
    });

    return {
      orderId: order.id,
      orderNo: orderNo,
      prepayId: result.prepay_id,
      amount: Number(pkg.money)
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

const handleNotify = async (xmlData) => {
  const params = parseXml(xmlData);
  
  if (params.return_code !== 'SUCCESS') {
    return { success: false, message: params.return_msg };
  }

  const sign = params.sign;
  delete params.sign;
  
  const verifySign = buildSign(params);
  
  if (sign !== verifySign) {
    return { success: false, message: '签名验证失败' };
  }

  const orderNo = params.out_trade_no;
  const transactionId = params.transaction_id;

  const order = await OrderChong.findOne({
    where: { order_no: orderNo, status: 0 }
  });

  if (!order) {
    return { success: false, message: '订单不存在或已处理' };
  }

  const pkg = await RechargePackage.findByPk(order.cid);

  const transaction = await User.sequelize.transaction();

  try {
    await order.update({
      status: 1,
      pay_no: transactionId,
      pay_time: getTimestamp()
    }, { transaction });

    const totalCoins = pkg.coin + (pkg.coin_zeng || 0);

    await User.increment('money', {
      by: totalCoins,
      where: { id: order.user_id },
      transaction
    });

    await transaction.commit();

    return { success: true, message: '支付成功' };
  } catch (error) {
    await transaction.rollback();
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
      tradeStateDesc: result.trade_state_desc
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

module.exports = {
  createUnifiedOrder,
  getJsApiSign,
  handleNotify,
  queryOrder,
  closeOrder
};