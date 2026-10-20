const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/games');
const { authMiddleware, optionalAuth, validate, LIMITS } = require('../middlewares');

// 《未完成事项清单》B-13：陪玩订单/服务写接口统一入参校验
const orderIdSchema = {
  required: ['orderId'],
  fields: { orderId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};
const pushOrderSchema = {
  required: ['gameId'],
  fields: {
    gameId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    targetUserId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    num: { type: 'integer', min: 1, max: 100 },
    price: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX }
  }
};
const cancelOrderSchema = {
  required: ['orderId'],
  fields: {
    orderId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    role: { type: 'string', enum: ['user', 'companion'], maxLength: 16 },
    reason: { type: 'string', maxLength: 200 }
  }
};
const applyCompanionSchema = {
  required: ['gameId', 'price'],
  fields: {
    gameId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    price: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX },
    tags: { type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    icon: { type: 'string', maxLength: 512 },
    voiceIntro: { type: 'string', maxLength: 512 },
    voiceTime: { type: 'integer', min: 0, max: 600 },
    serviceType: { type: 'string', maxLength: 32 }
  }
};
const evaluateOrderSchema = {
  required: ['orderId', 'rating'],
  fields: {
    orderId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    rating: { type: 'integer', min: 1, max: 5 },
    comment: { type: 'string', maxLength: 500 }
  }
};
const appealOrderSchema = {
  required: ['orderId'],
  fields: {
    orderId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    reason: { type: 'string', maxLength: 500 }
  }
};
const serviceIdSchema = {
  required: ['serviceId'],
  fields: { serviceId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};

router.get('/categories', gamesController.getCategories);
// U-18：线下服务目录（真实 gameId）
router.get('/offline-services', gamesController.getOfflineServices);
// 首页公开陪玩师列表（不依赖登录态，供未登录用户浏览）
router.get('/companions', gamesController.getCompanions);
// 公开搜索：未登录可搜陪玩师，服务层仍按隐私开关过滤
router.get('/search', optionalAuth, gamesController.searchCompanions);
router.post('/push', authMiddleware, validate(pushOrderSchema), gamesController.createOrder);
// 派单大厅：待抢悬赏单
router.get('/pool', authMiddleware, gamesController.getPool);
router.post('/grab', authMiddleware, validate(orderIdSchema), gamesController.grabOrder);
// 陪玩师端「我的服务」
router.get('/my-services', authMiddleware, gamesController.getMyServices);
router.post('/toggle-service', authMiddleware, validate(serviceIdSchema), gamesController.toggleServiceStatus);
router.post('/start', authMiddleware, validate(orderIdSchema), gamesController.startOrder);
router.post('/complete', authMiddleware, validate(orderIdSchema), gamesController.completeOrder);
router.post('/cancel', authMiddleware, validate(cancelOrderSchema), gamesController.cancelOrder);
router.get('/orders', authMiddleware, gamesController.getOrders);
router.post('/apply', authMiddleware, validate(applyCompanionSchema), gamesController.applyAsCompanion);
router.get('/apply/status', authMiddleware, gamesController.getApplyStatus);
router.get('/companions/:companionId', authMiddleware, gamesController.getCompanionDetail);
router.post('/evaluate', authMiddleware, validate(evaluateOrderSchema), gamesController.evaluateOrder);
router.post('/appeal', authMiddleware, validate(appealOrderSchema), gamesController.appealOrder);
router.get('/order-detail', authMiddleware, gamesController.getOrderDetail);
router.get('/statistics', authMiddleware, gamesController.getStatistics);

module.exports = router;
