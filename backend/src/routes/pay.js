const express = require('express');
const router = express.Router();
const payController = require('../controllers/pay');
const { authMiddleware } = require('../middlewares');

router.get('/packages', payController.getPackages);
router.post('/create-order', authMiddleware, payController.createOrder);
router.post('/wx-order', authMiddleware, payController.createWxOrder);
router.post('/wx-notify', payController.wxNotify);
router.get('/wx-query', authMiddleware, payController.queryWxOrder);
router.post('/wx-close', authMiddleware, payController.closeWxOrder);
router.post('/wx-callback', payController.wxCallback);
router.get('/order-status', authMiddleware, payController.getOrderStatus);
router.post('/validate-card', payController.validateCard);
router.post('/use-card', authMiddleware, payController.useCard);
router.get('/recharge/list', payController.getRechargeRecords);

router.get('/wallet/balance', authMiddleware, payController.getWalletBalance);
router.post('/wallet/recharge', authMiddleware, payController.rechargeWallet);
router.get('/payment/history', authMiddleware, payController.getPaymentHistory);
router.post('/pay/create', authMiddleware, payController.createPayment);
router.post('/pay/notify', payController.handlePaymentNotify);

module.exports = router;