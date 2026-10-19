const express = require('express');
const router = express.Router();
const vipController = require('../controllers/vip');
const { authMiddleware, validate, LIMITS } = require('../middlewares');

// 审计 M-6：VIP 下单统一校验 packageId。
// 不校验 payType：脚本会传字符串 "alipay"，controller 内部 parseInt 兜底。
const vipOrderSchema = {
  required: ['packageId'],
  fields: {
    packageId: { type: 'integer', min: 1, max: LIMITS.ID_MAX }
  }
};

router.get('/packages', vipController.getVipPackages);
router.get('/info', authMiddleware, vipController.getUserVipInfo);
router.post('/order', authMiddleware, validate(vipOrderSchema), vipController.createVipOrder);
router.post('/order/complete', authMiddleware, vipController.completeVipOrder);
router.get('/order/status', authMiddleware, vipController.getVipOrderStatus);
router.get('/orders', authMiddleware, vipController.getUserVipOrders);

module.exports = router;