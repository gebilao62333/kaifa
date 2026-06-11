const { payService, wechatPayService, alipayService } = require('../services');
const logger = require('../utils/logger');
const response = require('../utils/response');

const getPackages = async (req, res) => {
  try {
    const result = await payService.getPackages();
    response.success(res, result);
  } catch (error) {
    logger.error('获取充值套餐错误:', error);
    response.error(res, '操作失败');
  }
};

const createOrder = async (req, res) => {
  try {
    const { packageId, payType = 1 } = req.body;
    
    if (!packageId) {
      return response.badRequest(res, '套餐ID不能为空');
    }
    
    const result = await payService.createOrder(
      req.userId,
      parseInt(packageId),
      parseInt(payType)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('创建订单错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const createWxOrder = async (req, res) => {
  try {
    const { packageId } = req.body;
    
    if (!packageId) {
      return response.badRequest(res, '套餐ID不能为空');
    }
    
    const order = await wechatPayService.createUnifiedOrder(req.userId, parseInt(packageId));
    const jsApiParams = wechatPayService.getJsApiSign(order.prepayId);
    
    response.success(res, {
      orderId: order.orderId,
      orderNo: order.orderNo,
      amount: order.amount,
      jsApiParams
    });
  } catch (error) {
    logger.error('创建微信支付订单错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const wxNotify = async (req, res) => {
  try {
    let xmlData = '';
    req.on('data', (chunk) => {
      xmlData += chunk;
    });
    
    req.on('end', async () => {
      const result = await wechatPayService.handleNotify(xmlData);
      
      if (result.success) {
        res.set('Content-Type', 'text/xml');
        res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
      } else {
        res.set('Content-Type', 'text/xml');
        res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[FAIL]]></return_msg></xml>');
      }
    });
  } catch (error) {
    logger.error('微信支付回调错误:', error);
    res.set('Content-Type', 'text/xml');
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[ERROR]]></return_msg></xml>');
  }
};

const queryWxOrder = async (req, res) => {
  try {
    const { orderNo } = req.query;
    
    if (!orderNo) {
      return response.badRequest(res, '订单号不能为空');
    }
    
    const result = await wechatPayService.queryOrder(orderNo);
    response.success(res, result);
  } catch (error) {
    logger.error('查询微信订单错误:', error);
    response.error(res, '操作失败');
  }
};

const closeWxOrder = async (req, res) => {
  try {
    const { orderNo } = req.body;
    
    if (!orderNo) {
      return response.badRequest(res, '订单号不能为空');
    }
    
    const result = await wechatPayService.closeOrder(orderNo);
    response.success(res, result);
  } catch (error) {
    logger.error('关闭微信订单错误:', error);
    response.error(res, '操作失败');
  }
};

const wxCallback = async (req, res) => {
  try {
    const { payNo, transactionId, sign, timestamp } = req.body;
    
    if (!payNo) {
      return response.badRequest(res, '订单号不能为空');
    }

    // 基本防伪造：验证必要字段存在
    if (!transactionId) {
      return response.badRequest(res, '交易流水号不能为空');
    }

    // 时间戳验证（5分钟内的请求才有效）
    if (timestamp) {
      const now = Date.now();
      const reqTime = parseInt(timestamp);
      if (Math.abs(now - reqTime) > 5 * 60 * 1000) {
        logger.warn('wxCallback: 请求时间戳过期', { payNo, timestamp });
        return response.badRequest(res, '请求已过期');
      }
    }
    
    await payService.wxPayCallback(payNo, transactionId);
    response.success(res, {}, '支付成功');
  } catch (error) {
    logger.error('微信支付回调错误:', error);
    response.error(res, '操作失败');
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const { orderNo } = req.query;
    
    if (!orderNo) {
      return response.badRequest(res, '订单号不能为空');
    }
    
    const result = await payService.getOrderStatus(orderNo);
    response.success(res, result);
  } catch (error) {
    logger.error('查询订单状态错误:', error);
    response.error(res, '操作失败');
  }
};

const validateCard = async (req, res) => {
  try {
    const cardCode = req.body.cardCode || req.body.cardNo || req.body.card_code;
    const cardPwd = req.body.cardPwd || req.body.card_pwd || '';

    if (!cardCode) {
      return response.badRequest(res, '密卡不能为空');
    }

    const result = await payService.validateCard(cardCode, cardPwd);
    response.success(res, result);
  } catch (error) {
    logger.error('验证密卡错误:', error.message);
    response.unprocessableEntity(res, error.message || '密卡验证失败');
  }
};

const useCard = async (req, res) => {
  try {
    const cardCode = req.body.cardCode || req.body.cardNo || req.body.card_code;
    const cardPwd = req.body.cardPwd || req.body.card_pwd || '';
    
    if (!cardCode) {
      return response.badRequest(res, '密卡不能为空');
    }
    
    const result = await payService.useCard(req.userId, cardCode, cardPwd);
    response.success(res, result, '充值成功');
  } catch (error) {
    logger.error('使用密卡错误:', error.message);
    response.unprocessableEntity(res, error.message || '密卡使用失败');
  }
};

const getRechargeRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId } = req.query;
    const result = await payService.getRechargeRecords(
      userId ? parseInt(userId) : null,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取充值记录错误:', error.message);
    response.error(res, '操作失败');
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const result = await payService.getWalletBalance(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取钱包余额错误:', error);
    response.error(res, '操作失败');
  }
};

const rechargeWallet = async (req, res) => {
  try {
    const { amount, source = 'admin' } = req.body;
    
    if (!amount || amount <= 0) {
      return response.badRequest(res, '充值金额必须大于0');
    }
    
    const result = await payService.rechargeWallet(
      req.userId,
      parseFloat(amount),
      source
    );
    response.success(res, result, '充值成功');
  } catch (error) {
    logger.error('充值错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await payService.getPaymentHistory(
      req.userId,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取支付记录错误:', error);
    response.error(res, '操作失败');
  }
};

const createPayment = async (req, res) => {
  try {
    const { packageId, payType = 1 } = req.body;
    
    if (!packageId) {
      return response.badRequest(res, '套餐ID不能为空');
    }
    
    const result = await payService.createOrder(
      req.userId,
      parseInt(packageId),
      parseInt(payType)
    );
    
    response.success(res, result, '支付订单创建成功');
  } catch (error) {
    logger.error('创建支付订单错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const handlePaymentNotify = async (req, res) => {
  try {
    const { orderNo, transactionId, status } = req.body;
    
    if (!orderNo || !transactionId) {
      return response.badRequest(res, '缺少必要参数');
    }
    
    if (status === 'success') {
      await payService.wxPayCallback(orderNo, transactionId);
      response.success(res, {}, '支付成功');
    } else {
      response.badRequest(res, '支付失败');
    }
  } catch (error) {
    logger.error('支付回调处理错误:', error);
    response.error(res, '操作失败');
  }
};

// ========== 支付宝支付 ==========

const createAlipayOrder = async (req, res) => {
  try {
    const { amount, subject, body, tradeType = 'APP' } = req.body;
    if (!amount || amount <= 0) return response.badRequest(res, '金额必须大于0');

    const result = await alipayService.createOrder(
      req.userId,
      parseFloat(amount),
      subject,
      body,
      { tradeType }
    );
    response.success(res, result, '支付宝订单创建成功');
  } catch (error) {
    logger.error('创建支付宝订单错误:', error.message);
    response.error(res, error.message || '创建支付宝订单失败');
  }
};

const alipayNotify = async (req, res) => {
  try {
    const notifyData = req.body;
    const result = alipayService.handleNotify(notifyData);

    if (result.success) {
      logger.info('支付宝支付回调成功:', result.outTradeNo);
      res.send('success');
    } else {
      logger.error('支付宝支付回调验签失败:', result.message);
      res.send('fail');
    }
  } catch (error) {
    logger.error('支付宝支付回调处理错误:', error.message);
    res.send('fail');
  }
};

const queryAlipayOrder = async (req, res) => {
  try {
    const { outTradeNo } = req.query;
    if (!outTradeNo) return response.badRequest(res, '订单号不能为空');

    const result = await alipayService.queryOrder(outTradeNo);
    response.success(res, result);
  } catch (error) {
    logger.error('查询支付宝订单错误:', error.message);
    response.error(res, error.message || '查询失败');
  }
};

const closeAlipayOrder = async (req, res) => {
  try {
    const { outTradeNo } = req.body;
    if (!outTradeNo) return response.badRequest(res, '订单号不能为空');

    const result = await alipayService.closeOrder(outTradeNo);
    response.success(res, result, '订单已关闭');
  } catch (error) {
    logger.error('关闭支付宝订单错误:', error.message);
    response.error(res, error.message || '关闭失败');
  }
};

// ========== 导出 ==========

module.exports = {
  getPackages,
  createOrder,
  // 微信支付
  createWxOrder,
  wxNotify,
  queryWxOrder,
  closeWxOrder,
  wxCallback,
  // 支付宝支付
  createAlipayOrder,
  alipayNotify,
  queryAlipayOrder,
  closeAlipayOrder,
  // 订单/密卡
  getOrderStatus,
  validateCard,
  useCard,
  getRechargeRecords,
  // 钱包
  getWalletBalance,
  rechargeWallet,
  getPaymentHistory,
  createPayment,
  handlePaymentNotify
};