const express = require('express');
const router = express.Router();
const payController = require('../controllers/pay');
const { authMiddleware, adminAuth, requirePermission, cardLimiter } = require('../middlewares');

router.get('/packages', payController.getPackages);
router.post('/create-order', authMiddleware, payController.createOrder);
router.post('/wx-order', authMiddleware, payController.createWxOrder);
router.post('/wx-notify', payController.wxNotify);
router.get('/wx-query', authMiddleware, payController.queryWxOrder);
router.post('/wx-close', authMiddleware, payController.closeWxOrder);
router.post('/wx-callback', payController.wxCallback);
router.get('/order-status', authMiddleware, payController.getOrderStatus);
// 卡密校验无需登录（充值页可用），但必须限流防暴力猜卡
router.post('/validate-card', cardLimiter, payController.validateCard);
router.post('/use-card', authMiddleware, payController.useCard);
router.post('/redeem-key', authMiddleware, payController.redeemCardByKey);
router.get('/recharge/list', adminAuth, payController.getRechargeRecords);

router.get('/wallet/balance', authMiddleware, payController.getWalletBalance);
// 审计 M14 / 越权充值：该接口会直接给用户加余额，原先只校验普通用户 JWT，
// 等于"任何登录用户 POST 一次即可无限给自己充值"。改为管理端接口 + 权限校验。
router.post('/wallet/recharge', adminAuth, requirePermission('recharge:write'), payController.rechargeWallet);
router.get('/payment/history', authMiddleware, payController.getPaymentHistory);
router.post('/pay/create', authMiddleware, payController.createPayment);

// 2026-10-03 已删除 POST /api/pay/pay/notify —— 无签名校验，任何人都能伪造支付成功给自己充值。
// 支付结果只能来自微信服务端回调 /api/pay/wx-notify（校验 MD5 签名），
// 或经 /api/pay/wx-callback 反查订单确认后入账。

module.exports = router;