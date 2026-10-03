const { payService, wechatPayService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

const getPackages = async (req, res) => {
  try {
    const result = await payService.getPackages();
    response.success(res, result);
  } catch (error) {
    logger.error('获取充值套餐错误:', error);
    response.error(res, error.message);
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
    response.unprocessableEntity(res, error.message);
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
    response.unprocessableEntity(res, error.message);
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
    
    if (!wechatPayService.isConfigured()) { return response.serviceUnavailable(res, '微信支付未配置'); }
    const result = await wechatPayService.queryOrder(orderNo);
    response.success(res, result);
  } catch (error) {
    logger.error('查询微信订单错误:', error);
    response.error(res, error.message);
  }
};

const closeWxOrder = async (req, res) => {
  try {
    const { orderNo } = req.body;
    
    if (!orderNo) {
      return response.badRequest(res, '订单号不能为空');
    }
    
    if (!wechatPayService.isConfigured()) { return response.serviceUnavailable(res, '微信支付未配置'); }
    const result = await wechatPayService.closeOrder(orderNo);
    response.success(res, result);
  } catch (error) {
    logger.error('关闭微信订单错误:', error);
    response.error(res, error.message);
  }
};

// 客户端支付回执：**必须先经服务端向支付平台反查确认，才能入账**。
// 历史实现直接信任请求体里的 payNo/transactionId，任何人 POST 一次即可给自己充值。
// 规则：
//   1) 已配置微信支付参数 → 调 orderquery 反查，trade_state=SUCCESS 才入账；
//   2) 未配置或反查失败 → 拒绝（403），不再静默入账；
//   3) 仅本地联调可显式设置 ALLOW_UNVERIFIED_PAY_CALLBACK=true 放行，并会打印告警。
const wxCallback = async (req, res) => {
  try {
    const { payNo, transactionId } = req.body;
    
    if (!payNo) {
      return response.badRequest(res, '订单号不能为空');
    }

    const config = require('../config');
    // 审计 B-07：该开关此前在生产环境也生效，等于留了一条"关掉支付校验"的后门。
    // 现在只允许在非 production 环境使用。
    const allowUnverified = process.env.ALLOW_UNVERIFIED_PAY_CALLBACK === 'true'
      && config.nodeEnv !== 'production';

    if (allowUnverified) {
      logger.warn('[pay] ⚠️ ALLOW_UNVERIFIED_PAY_CALLBACK=true —— 接受未经校验的支付回执（仅非生产环境生效）！');
    } else {
      if (process.env.ALLOW_UNVERIFIED_PAY_CALLBACK === 'true') {
        logger.error('[pay] 生产环境检测到 ALLOW_UNVERIFIED_PAY_CALLBACK=true，已强制忽略该开关');
      }
      let verified = false;
      let reason = '未配置微信支付参数';

      if (config.wechat && config.wechat.appid) {
        try {
          const queried = await wechatPayService.queryOrder(payNo);
          verified = !!queried && queried.status === 1;
          reason = queried ? queried.tradeState : '订单查询无结果';
        } catch (queryError) {
          reason = queryError.message;
          logger.error('[pay] 支付回执反查失败:', queryError.message);
        }
      }

      if (!verified) {
        logger.warn(`[pay] 拒绝未通过校验的支付回执 payNo=${payNo} reason=${reason}`);
        return response.forbidden(res, '支付结果未经服务端校验，拒绝入账');
      }
    }
    
    await payService.wxPayCallback(payNo, transactionId);
    response.success(res, {}, '支付成功');
  } catch (error) {
    logger.error('微信支付回调错误:', error);
    response.error(res, error.message);
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
    if (String(error.message) === '订单不存在') { return response.notFound(res, error.message); }
    response.error(res, error.message);
  }
};

const validateCard = async (req, res) => {
  try {
    const { cardCode } = req.body;

    if (!cardCode) {
      return response.badRequest(res, '密卡不能为空');
    }

    const result = await payService.validateCard(cardCode);
    response.success(res, result);
  } catch (error) {
    logger.error('验证密卡错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const useCard = async (req, res) => {
  try {
    const { cardCode } = req.body;
    
    if (!cardCode) {
      return response.badRequest(res, '密卡不能为空');
    }
    
    const result = await payService.useCard(req.userId, cardCode);
    response.success(res, result, '充值成功');
  } catch (error) {
    logger.error('使用密卡错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getRechargeRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, status } = req.query;
    const { OrderChong, User } = require('../models');

    const where = {};
    if (userId) where.user_id = parseInt(userId);
    if (status) where.status = status;

    const { count, rows } = await OrderChong.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname']
      }]
    });

    const list = rows.map(r => ({
      id: r.id,
      order_no: r.order_no,
      user_id: r.user_id,
      username: r.user?.username || '',
      amount: parseFloat(r.amount) || 0,
      pay_type: r.pay_type,
      status: r.status,
      create_time: r.create_time
    }));

    response.success(res, {
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages: Math.ceil(count / parseInt(pageSize))
      }
    });
  } catch (error) {
    logger.error('获取充值记录错误:', error);
    response.error(res, error.message);
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const result = await payService.getWalletBalance(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取钱包余额错误:', error);
    response.error(res, error.message);
  }
};

const rechargeWallet = async (req, res) => {
  try {
    const { amount, userId } = req.body;
    
    if (!amount || amount <= 0) {
      return response.badRequest(res, '充值金额必须大于0');
    }

    // 管理端接口：目标用户由管理员指定，source 固定为 admin（不接受客户端传入，避免伪造来源）
    const targetUserId = userId ? parseInt(userId, 10) : req.userId;
    if (!targetUserId) {
      return response.badRequest(res, '目标用户不能为空');
    }
    
    const result = await payService.rechargeWallet(
      targetUserId,
      parseFloat(amount),
      'admin'
    );
    response.success(res, result, '充值成功');
  } catch (error) {
    logger.error('充值错误:', error);
    response.unprocessableEntity(res, error.message);
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
    response.error(res, error.message);
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
    response.unprocessableEntity(res, error.message);
  }
};


const redeemCardByKey = async (req, res) => {
  try {
    const { key } = req.body;

    if (!key || typeof key !== 'string') {
      return response.badRequest(res, '请输入充值密钥');
    }

    const cleanKey = key.replace(/[\s-]/g, '');
    if (cleanKey.length !== 25) {
      return response.badRequest(res, '密钥格式不正确，应为25位字符');
    }

    const result = await payService.redeemCardByKey(req.userId, cleanKey);
    response.success(res, result, '充值成功');
  } catch (error) {
    logger.error('密钥充值错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

module.exports = {
  getPackages,
  createOrder,
  createWxOrder,
  wxNotify,
  queryWxOrder,
  closeWxOrder,
  wxCallback,
  getOrderStatus,
  validateCard,
  useCard,
  redeemCardByKey,
  getRechargeRecords,
  getWalletBalance,
  rechargeWallet,
  getPaymentHistory,
  createPayment
};