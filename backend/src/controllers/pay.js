const { payService, wechatPayService } = require('../services');
const response = require('../utils/response');

const getPackages = async (req, res) => {
  try {
    const result = await payService.getPackages();
    response.success(res, result);
  } catch (error) {
    console.error('获取充值套餐错误:', error);
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
    console.error('创建订单错误:', error);
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
    console.error('创建微信支付订单错误:', error);
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
    console.error('微信支付回调错误:', error);
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
    console.error('查询微信订单错误:', error);
    response.error(res, error.message);
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
    console.error('关闭微信订单错误:', error);
    response.error(res, error.message);
  }
};

const wxCallback = async (req, res) => {
  try {
    const { payNo, transactionId } = req.body;
    
    if (!payNo) {
      return response.badRequest(res, '订单号不能为空');
    }
    
    await payService.wxPayCallback(payNo, transactionId);
    response.success(res, {}, '支付成功');
  } catch (error) {
    console.error('微信支付回调错误:', error);
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
    console.error('查询订单状态错误:', error);
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
    console.error('验证密卡错误:', error);
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
    console.error('使用密卡错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getRechargeRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, status } = req.query;
    
    const mockRecords = [
      {
        id: 1,
        order_no: 'R20240101100001',
        user_id: 1001,
        username: '张三',
        amount: 100,
        pay_type: 1,
        status: 'completed',
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        order_no: 'R20240101100002',
        user_id: 1002,
        username: '李四',
        amount: 50,
        pay_type: 2,
        status: 'completed',
        create_time: '2024-01-01 11:00:00'
      },
      {
        id: 3,
        order_no: 'R20240101100003',
        user_id: 1003,
        username: '王五',
        amount: 200,
        pay_type: 1,
        status: 'pending',
        create_time: '2024-01-01 12:00:00'
      },
      {
        id: 4,
        order_no: 'R20240101100004',
        user_id: 1004,
        username: '赵六',
        amount: 150,
        pay_type: 3,
        status: 'failed',
        create_time: '2024-01-01 13:00:00'
      },
      {
        id: 5,
        order_no: 'R20240101100005',
        user_id: 1005,
        username: '孙七',
        amount: 300,
        pay_type: 1,
        status: 'completed',
        create_time: '2024-01-01 14:00:00'
      }
    ];
    
    let filtered = [...mockRecords];
    
    if (userId) {
      filtered = filtered.filter(r => r.user_id === parseInt(userId));
    }
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    const total = filtered.length;
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const end = start + parseInt(pageSize);
    const list = filtered.slice(start, end);
    
    response.success(res, {
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });
  } catch (error) {
    console.error('获取充值记录错误:', error);
    response.error(res, error.message);
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const result = await payService.getWalletBalance(req.userId);
    response.success(res, result);
  } catch (error) {
    console.error('获取钱包余额错误:', error);
    response.error(res, error.message);
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
    console.error('充值错误:', error);
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
    console.error('获取支付记录错误:', error);
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
    console.error('创建支付订单错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('支付回调处理错误:', error);
    response.error(res, error.message);
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
  getRechargeRecords,
  getWalletBalance,
  rechargeWallet,
  getPaymentHistory,
  createPayment,
  handlePaymentNotify
};