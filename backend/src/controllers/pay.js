const { payService, wechatPayService } = require('../services');
// 只借用错误码常量：入账逻辑仍通过上面聚合入口调用，便于单测替换 service，
// 而 controller 分流 HTTP 状态时需要一份不会变的契约（code），而不是靠比对中文文案。
const { PAY_ERRORS } = require('../services/payService');
const response = require('../utils/response');
const logger = require('../utils/logger');

// 审计 H-2：支付业务错误按 payService 挂上的 code 分流状态码。
// 没有 code 的异常（数据库故障等意外错误）保持 500，不能伪装成 4xx 业务拒绝，
// 否则监控告警和对账排查都会被误导。
const payErrorResponse = (res, error) => {
  const message = String((error && error.message) || '支付处理失败');
  switch (error && error.code) {
    case PAY_ERRORS.NOT_FOUND:
      return response.notFound(res, message);
    case PAY_ERRORS.FORBIDDEN:
    case PAY_ERRORS.UNVERIFIED:
      return response.forbidden(res, message);
    case PAY_ERRORS.AMOUNT_MISMATCH:
      return response.unprocessableEntity(res, message);
    case PAY_ERRORS.SETTLED:
      // 重复回执：钱已由先到的那笔事务入账一次，对调用方是幂等成功
      return response.success(res, { duplicated: true }, '订单已入账');
    default:
      return response.error(res, message);
  }
};

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

// 微信支付异步通知是「未鉴权的公网入口」（只有 XML 里的 MD5 签名做身份），所以入口本身也要设防：
//   1) 请求体上限 64KB —— 原实现把 chunk 无上限拼进字符串，任何人 POST 大 body 就能拖垮进程；
//   2) 'end' 回调里的异常必须自己兜住 —— 原实现把 await 放在异步回调里，外层 try/catch 抓不到，
//      一旦服务层抛错就既不回包也不记录，微信只会不停重发；
//   3) return_msg 会被拼进 XML，先截断并拆掉 ']]>'，避免回显内容提前结束 CDATA 段。
const WX_NOTIFY_MAX_BYTES = 64 * 1024;

const notifyText = (msg) => String(msg || 'FAIL').slice(0, 80).replace(/\]\]>/g, '] ]>');

const sendNotifyFail = (res, message) => {
  res.set('Content-Type', 'text/xml');
  res.send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${notifyText(message)}]]></return_msg></xml>`);
};

const wxNotify = async (req, res) => {
  let xmlData = '';
  let overflow = false;

  req.on('data', (chunk) => {
    if (overflow) return;
    xmlData += chunk;
    if (Buffer.byteLength(xmlData, 'utf8') > WX_NOTIFY_MAX_BYTES) {
      overflow = true;
      logger.error('[pay] wx-notify 请求体超过 64KB 上限，已拒绝');
      sendNotifyFail(res, '请求体过大');
      if (typeof req.destroy === 'function') req.destroy();
    }
  });

  req.on('end', async () => {
    if (overflow) return;
    try {
      if (!xmlData.trim()) {
        return sendNotifyFail(res, '空回调内容');
      }

      const result = await wechatPayService.handleNotify(xmlData);

      if (result && result.success) {
        res.set('Content-Type', 'text/xml');
        res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
      } else {
        sendNotifyFail(res, (result && result.message) || 'FAIL');
      }
    } catch (error) {
      logger.error('微信支付回调处理异常:', error);
      sendNotifyFail(res, 'ERROR');
    }
  });
};

// 审计 H-2：这两个接口按订单号直接操作支付平台的单，原先只校验登录、不校验订单归属——
// 任何登录用户都能用他人订单号反查支付状态，甚至关掉别人正在支付的单。先过归属再调平台接口。
const queryWxOrder = async (req, res) => {
  try {
    const { orderNo } = req.query;

    if (!orderNo) {
      return response.badRequest(res, '订单号不能为空');
    }

    if (!wechatPayService.isConfigured()) { return response.serviceUnavailable(res, '微信支付未配置'); }

    try {
      await payService.requireOwnedOrder(req.userId, orderNo);
    } catch (ownershipError) {
      return payErrorResponse(res, ownershipError);
    }

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

    try {
      await payService.requireOwnedOrder(req.userId, orderNo);
    } catch (ownershipError) {
      return payErrorResponse(res, ownershipError);
    }

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
//   1) 路由已加 authMiddleware，服务层再校验订单归属（只有下单人本人能触发这单入账）；
//   2) 已配置微信支付参数 → 调 orderquery 反查，trade_state=SUCCESS 且返回的单号与请求一致才认可，
//      反查拿到的实付分值一并交给服务层与订单应付值比对；
//   3) 未配置或反查失败 → 拒绝（403），不再静默入账；
//   4) 仅本地联调可显式设置 ALLOW_UNVERIFIED_PAY_CALLBACK=true 放行（非 production），会打印告警，
//      且不带 paidCents（无平台金额可比），入账仍只按我们订单里记的金币数。
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

    let verification;
    if (allowUnverified) {
      logger.warn('[pay] ⚠️ ALLOW_UNVERIFIED_PAY_CALLBACK=true —— 接受未经校验的支付回执（仅非生产环境生效）！');
      verification = { verified: true, source: 'local-unverified' };
    } else {
      if (process.env.ALLOW_UNVERIFIED_PAY_CALLBACK === 'true') {
        logger.error('[pay] 生产环境检测到 ALLOW_UNVERIFIED_PAY_CALLBACK=true，已强制忽略该开关');
      }

      let reason = '未配置微信支付参数';
      let queried = null;

      if (wechatPayService.isConfigured()) {
        try {
          queried = await wechatPayService.queryOrder(payNo);
          if (!queried) {
            reason = '订单查询无结果';
          } else if (queried.orderNo && queried.orderNo !== payNo) {
            // 反查回来的单号与请求不一致：响应被串错或有人在中间做手脚，一律不认
            reason = `反查返回的订单号与请求不一致：${queried.orderNo}`;
            queried = null;
          } else if (queried.status !== 1) {
            reason = queried.tradeState || '订单未支付成功';
            queried = null;
          }
        } catch (queryError) {
          reason = queryError.message;
          logger.error('[pay] 支付回执反查失败:', queryError.message);
          queried = null;
        }
      }

      if (!queried) {
        logger.warn(`[pay] 拒绝未通过校验的支付回执 payNo=${payNo} reason=${reason}`);
        return response.forbidden(res, '支付结果未经服务端校验，拒绝入账');
      }

      verification = {
        verified: true,
        source: 'wechat-query',
        paidCents: queried.paidCents,
        // 平台流水号仅作日志线索：xn_order_chong 无 pay_no 列可落库（见文档遗留项）
        transactionId: queried.transactionId || transactionId
      };
    }

    try {
      const result = await payService.wxPayCallback(req.userId, payNo, verification);
      return response.success(res, result, '支付成功');
    } catch (settleError) {
      logger.error('微信支付回调入账失败:', settleError);
      return payErrorResponse(res, settleError);
    }
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
    
    // 审计 H-2：带 user_id 查，避免用他人订单号探测支付状态
    const result = await payService.getOrderStatus(req.userId, orderNo);
    response.success(res, result);
  } catch (error) {
    logger.error('查询订单状态错误:', error);
    if (error && error.code === PAY_ERRORS.NOT_FOUND) { return response.notFound(res, error.message); }
    response.error(res, error.message);
  }
};

const validateCard = async (req, res) => {
  try {
    const { cardCode, cardPwd } = req.body;

    if (!cardCode) {
      return response.badRequest(res, '密卡不能为空');
    }

    const result = await payService.validateCard(cardCode, cardPwd);
    response.success(res, result);
  } catch (error) {
    logger.error('验证密卡错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const useCard = async (req, res) => {
  try {
    const { cardCode, cardPwd } = req.body;

    if (!cardCode) {
      return response.badRequest(res, '密卡不能为空');
    }

    const result = await payService.useCard(req.userId, cardCode, cardPwd);
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