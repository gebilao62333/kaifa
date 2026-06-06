const express = require('express');
const router = express.Router();
const payController = require('../controllers/pay');
const { authMiddleware } = require('../middlewares');

// 套餐列表
router.get('/packages', payController.getPackages);
router.post('/create-order', authMiddleware, payController.createOrder);

// 微信支付
router.post('/wx-order', authMiddleware, payController.createWxOrder);
router.post('/wx-notify', payController.wxNotify);
router.get('/wx-query', authMiddleware, payController.queryWxOrder);
router.post('/wx-close', authMiddleware, payController.closeWxOrder);
router.post('/wx-callback', payController.wxCallback);

// 支付宝支付
router.post('/alipay-order', authMiddleware, payController.createAlipayOrder);
router.post('/alipay-notify', payController.alipayNotify);
router.get('/alipay-query', authMiddleware, payController.queryAlipayOrder);
router.post('/alipay-close', authMiddleware, payController.closeAlipayOrder);

// 订单
router.get('/order-status', authMiddleware, payController.getOrderStatus);

// 密卡充值
router.post('/validate-card', payController.validateCard);
router.post('/use-card', authMiddleware, payController.useCard);
router.get('/recharge/list', payController.getRechargeRecords);

// 钱包
router.get('/wallet/balance', authMiddleware, payController.getWalletBalance);
router.post('/wallet/recharge', authMiddleware, payController.rechargeWallet);
router.get('/payment/history', authMiddleware, payController.getPaymentHistory);

// 通用支付
router.post('/pay/create', authMiddleware, payController.createPayment);
router.post('/pay/notify', payController.handlePaymentNotify);

module.exports = router;