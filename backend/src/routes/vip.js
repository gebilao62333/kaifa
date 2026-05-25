const express = require('express');
const router = express.Router();
const vipController = require('../controllers/vip');
const { authMiddleware } = require('../middlewares');

router.get('/packages', vipController.getVipPackages);
router.get('/info', authMiddleware, vipController.getUserVipInfo);
router.post('/order', authMiddleware, vipController.createVipOrder);
router.post('/order/complete', authMiddleware, vipController.completeVipOrder);
router.get('/order/status', authMiddleware, vipController.getVipOrderStatus);
router.get('/orders', authMiddleware, vipController.getUserVipOrders);

module.exports = router;